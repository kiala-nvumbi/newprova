import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './src/db/index.ts';
import { examSettings, studentAttempts, studentPermissions } from './src/db/schema.ts';
import { eq } from 'drizzle-orm';
import { createServer as createViteServer } from 'vite';
import {
  attachSession,
  clearSessionCookie,
  createRateLimiter,
  createSessionToken,
  hashPassword,
  isHashedPassword,
  requireAdmin,
  requireAuth,
  sanitizeString,
  sanitizeStudentId,
  securityHeadersMiddleware,
  setSessionCookie,
  verifyAdminPassword,
  verifyPassword,
  type SessionRequest,
  type SessionUser,
} from './src/lib/security.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Seed default sample students into DB if none exist yet (never includes ADM plaintext password)
const DEFAULT_STUDENT_SEEDS = [
  {
    studentId: 'A001',
    nome: 'Manuel Domingos Antunes',
    login: 'aluno1',
    initialPass: '123',
    turma: 'GE-2026-M1',
    provincia: 'Luanda',
    email: 'm.antunes@isp.ao',
  },
  {
    studentId: 'A002',
    nome: 'Beatriz Teresa Kiala',
    login: 'aluno2',
    initialPass: '123',
    turma: 'GE-2026-M1',
    provincia: 'Cabinda',
    email: 'b.kiala@isp.ao',
  },
  {
    studentId: 'A003',
    nome: 'João Pedro Sebastião',
    login: 'aluno3',
    initialPass: '123',
    turma: 'GE-2026-M2',
    provincia: 'Benguela',
    email: 'j.sebastiao@isp.ao',
  },
  {
    studentId: 'A004',
    nome: 'Helena Maria de Carvalho',
    login: 'aluno4',
    initialPass: '123',
    turma: 'GE-2026-M2',
    provincia: 'Huíla',
    email: 'h.carvalho@isp.ao',
  },
];

async function ensureDefaultStudentsSeeded(): Promise<void> {
  try {
    const existing = await db.select({ studentId: studentPermissions.studentId }).from(studentPermissions);
    const existingIds = new Set(existing.map((r) => r.studentId));
    for (const st of DEFAULT_STUDENT_SEEDS) {
      if (!existingIds.has(st.studentId)) {
        await db.insert(studentPermissions).values({
          studentId: st.studentId,
          nome: st.nome,
          turma: st.turma,
          provincia: st.provincia,
          email: st.email,
          login: st.login,
          senha: hashPassword(st.initialPass),
          acessoPermitido: true,
          tempoExtraMin: 0,
          updatedAt: new Date(),
        });
      }
    }
  } catch {
    // Database might not be reachable in offline test environments
  }
}

function sanitizeStudentRecordForAdmin(record: typeof studentPermissions.$inferSelect) {
  const { senha: _omitted, ...safe } = record;
  return {
    ...safe,
    hasPassword: Boolean(_omitted),
  };
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(securityHeadersMiddleware);
  app.use(express.json({ limit: '10mb' }));
  app.use(attachSession);

  const apiLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 200,
    message: 'Demasiados pedidos. Aguarde um momento antes de tentar novamente.',
  });

  const loginLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: 'Demasiadas tentativas de início de sessão. Aguarde 15 minutos e tente novamente.',
  });

  app.use('/api', apiLimiter);

  // Seed default demo students asynchronously
  ensureDefaultStudentsSeeded().catch(() => {});

  // Health check (public)
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Current authenticated session check
  app.get('/api/auth/me', async (req: SessionRequest, res: Response) => {
    if (!req.sessionUser) {
      res.json({ user: null });
      return;
    }

    if (req.sessionUser.role === 'docente') {
      res.json({
        user: {
          studentId: 'ADM01',
          nome: 'KIALA NVUMBI',
          login: 'kiala.nvumbi',
          turma: 'Coordenação e Administração',
          provincia: 'Luanda',
          email: 'kialanvumbi@gmail.com',
          role: 'docente',
          acessoPermitido: true,
        },
      });
      return;
    }

    try {
      const records = await db
        .select()
        .from(studentPermissions)
        .where(eq(studentPermissions.studentId, req.sessionUser.studentId));
      if (records.length > 0) {
        const st = records[0];
        res.json({
          user: {
            studentId: st.studentId,
            nome: st.nome,
            login: st.login || st.studentId.toLowerCase(),
            turma: st.turma || 'GE-2026',
            provincia: st.provincia || 'Luanda',
            email: st.email || '',
            role: 'aluno',
            acessoPermitido: st.acessoPermitido,
            provasPermitidas: st.provasPermitidas,
            tempoExtraMin: st.tempoExtraMin || 0,
            observacao: st.observacao,
          },
        });
        return;
      }
    } catch {
      // Fallback to token payload
    }

    res.json({
      user: {
        ...req.sessionUser,
        acessoPermitido: true,
      },
    });
  });

  // POST secure logout
  app.post('/api/logout', (req: Request, res: Response) => {
    clearSessionCookie(req, res);
    res.json({ success: true });
  });

  // POST secure login authentication (rate limited, scrypt verified, HttpOnly cookie + signed token)
  app.post('/api/login', loginLimiter, async (req: Request, res: Response) => {
    try {
      const username = sanitizeString(req.body?.username, 120);
      const password = typeof req.body?.password === 'string' ? req.body.password.trim() : '';

      if (!username || !password) {
        res.status(400).json({ error: 'Utilizador e senha são obrigatórios.' });
        return;
      }

      const userClean = username.toLowerCase();

      // 1. Check Administrator KIALA NVUMBI via scrypt/timingSafeEqual
      if (
        (userClean === 'kiala.nvumbi' ||
          userClean === 'adm01' ||
          userClean === 'kialanvumbi@gmail.com' ||
          userClean === 'docente') &&
        verifyAdminPassword(password)
      ) {
        const adminSession: SessionUser = {
          studentId: 'ADM01',
          nome: 'KIALA NVUMBI',
          login: 'kiala.nvumbi',
          role: 'docente',
          turma: 'Coordenação e Administração',
          provincia: 'Luanda',
          email: 'kialanvumbi@gmail.com',
        };
        const token = createSessionToken(adminSession);
        setSessionCookie(req, res, token);
        res.json({
          success: true,
          token,
          user: {
            ...adminSession,
            acessoPermitido: true,
          },
        });
        return;
      }

      // 2. Check student in PostgreSQL
      let studentRecord: (typeof studentPermissions.$inferSelect) | undefined;
      try {
        const allPerms = await db.select().from(studentPermissions);
        studentRecord = allPerms.find((s) => {
          if (s.studentId === 'ADM01') return false;
          const matchUser =
            (s.login && s.login.trim().toLowerCase() === userClean) ||
            s.studentId.trim().toLowerCase() === userClean ||
            (s.email && s.email.trim().toLowerCase() === userClean);
          if (!matchUser) return false;
          const storedPass = s.senha || '123456';
          return verifyPassword(password, storedPass);
        });

        // Upgrade legacy plaintext password to scrypt hash transparently on successful login
        if (studentRecord && !isHashedPassword(studentRecord.senha)) {
          await db
            .update(studentPermissions)
            .set({ senha: hashPassword(password), updatedAt: new Date() })
            .where(eq(studentPermissions.studentId, studentRecord.studentId));
        }
      } catch (dbErr) {
        console.error('Database login lookup failed, checking seed fallback:', dbErr);
        const seedMatch = DEFAULT_STUDENT_SEEDS.find(
          (s) =>
            (s.login.toLowerCase() === userClean ||
              s.studentId.toLowerCase() === userClean ||
              s.email.toLowerCase() === userClean) &&
            verifyPassword(password, s.initialPass)
        );
        if (seedMatch) {
          const sessionUser: SessionUser = {
            studentId: seedMatch.studentId,
            nome: seedMatch.nome,
            login: seedMatch.login,
            role: 'aluno',
            turma: seedMatch.turma,
            provincia: seedMatch.provincia,
            email: seedMatch.email,
          };
          const token = createSessionToken(sessionUser);
          setSessionCookie(req, res, token);
          res.json({
            success: true,
            token,
            user: {
              ...sessionUser,
              acessoPermitido: true,
              tempoExtraMin: 0,
            },
          });
          return;
        }
      }

      if (studentRecord) {
        const sessionUser: SessionUser = {
          studentId: studentRecord.studentId,
          nome: studentRecord.nome,
          login: studentRecord.login || studentRecord.studentId.toLowerCase(),
          role: 'aluno',
          turma: studentRecord.turma || 'GE-2026',
          provincia: studentRecord.provincia || 'Luanda',
          email: studentRecord.email || '',
        };
        const token = createSessionToken(sessionUser);
        setSessionCookie(req, res, token);
        res.json({
          success: true,
          token,
          user: {
            ...sessionUser,
            acessoPermitido: studentRecord.acessoPermitido,
            provasPermitidas: studentRecord.provasPermitidas,
            tempoExtraMin: studentRecord.tempoExtraMin || 0,
            observacao: studentRecord.observacao,
          },
        });
        return;
      }

      res.status(401).json({ error: 'Credenciais incorrectas.' });
    } catch (err) {
      console.error('Error during login:', err);
      res.status(500).json({ error: 'Erro no servidor durante a autenticação.' });
    }
  });

  // POST authenticated user updates their OWN password
  app.post('/api/students/me/password', requireAuth, async (req: SessionRequest, res: Response) => {
    try {
      const user = req.sessionUser!;
      if (user.role === 'docente') {
        res.status(400).json({
          error: 'A senha do Administrador é gerida por variáveis de ambiente do servidor (ADMIN_PASSWORD).',
        });
        return;
      }

      const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword.trim() : '';
      if (newPassword.length < 3 || newPassword.length > 100) {
        res.status(400).json({ error: 'A nova senha deve ter entre 3 e 100 caracteres.' });
        return;
      }

      await db
        .update(studentPermissions)
        .set({
          senha: hashPassword(newPassword),
          updatedAt: new Date(),
        })
        .where(eq(studentPermissions.studentId, user.studentId));

      res.json({ success: true, message: 'Senha actualizada com sucesso.' });
    } catch (err) {
      console.error('Error updating own password:', err);
      res.status(500).json({ error: 'Não foi possível actualizar a senha.' });
    }
  });

  // GET exam settings (public non-sensitive schedule)
  app.get('/api/exam-settings', async (_req: Request, res: Response) => {
    try {
      const records = await db.select().from(examSettings).where(eq(examSettings.id, 'default'));
      if (records.length > 0) {
        res.json(records[0]);
      } else {
        res.json(null);
      }
    } catch (err) {
      console.error('Error fetching exam settings:', err);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  // POST update exam schedule (ADM ONLY)
  app.post('/api/exam-settings', requireAdmin, async (req: SessionRequest, res: Response) => {
    try {
      const { scheduledOpenAt, isActive, durationMinutes, title } = req.body;
      const existing = await db.select().from(examSettings).where(eq(examSettings.id, 'default'));

      const parsedDuration = Math.min(Math.max(Number(durationMinutes) || 120, 10), 600);
      const cleanTitle = sanitizeString(title, 200);

      if (existing.length > 0) {
        await db
          .update(examSettings)
          .set({
            scheduledOpenAt: scheduledOpenAt ? new Date(scheduledOpenAt) : null,
            isActive: isActive !== undefined ? Boolean(isActive) : true,
            durationMinutes: parsedDuration,
            title: cleanTitle || existing[0].title,
            updatedAt: new Date(),
          })
          .where(eq(examSettings.id, 'default'));
      } else {
        await db.insert(examSettings).values({
          id: 'default',
          scheduledOpenAt: scheduledOpenAt ? new Date(scheduledOpenAt) : null,
          isActive: isActive !== undefined ? Boolean(isActive) : true,
          durationMinutes: parsedDuration,
          title: cleanTitle || 'Avaliação Prática de Administração e Gestão de TI',
          updatedAt: new Date(),
        });
      }

      const updated = await db.select().from(examSettings).where(eq(examSettings.id, 'default'));
      res.json(updated[0]);
    } catch (err) {
      console.error('Error saving exam settings:', err);
      res.status(500).json({ error: 'Failed to save settings' });
    }
  });

  // GET student attempts (Authenticated: ADM gets all, Student gets ONLY their own)
  app.get('/api/attempts', requireAuth, async (req: SessionRequest, res: Response) => {
    try {
      const user = req.sessionUser!;
      if (user.role === 'docente') {
        const attempts = await db.select().from(studentAttempts);
        res.json(attempts);
      } else {
        const ownAttempts = await db
          .select()
          .from(studentAttempts)
          .where(eq(studentAttempts.matricula, user.studentId));
        res.json(ownAttempts);
      }
    } catch (err) {
      console.error('Error fetching attempts:', err);
      res.status(500).json({ error: 'Failed to fetch attempts' });
    }
  });

  // POST save / update student attempt (Authenticated: student can only save own attempt)
  app.post('/api/attempts', requireAuth, async (req: SessionRequest, res: Response) => {
    try {
      const user = req.sessionUser!;
      const id = sanitizeStudentId(req.body?.id);
      const studentName =
        user.role === 'docente' ? sanitizeString(req.body?.studentName, 160) : user.nome;
      const matricula =
        user.role === 'docente' ? sanitizeStudentId(req.body?.matricula) : user.studentId;
      const turma = sanitizeString(req.body?.turma, 80) || user.turma || null;
      const status = sanitizeString(req.body?.status, 40) || 'submitted';
      const score = Number(req.body?.score) || 0;
      const maxScore = Number(req.body?.maxScore) || 100;
      const answers = req.body?.answers || null;
      const feedback = sanitizeString(req.body?.feedback, 1000) || null;
      const gradingDetails = req.body?.gradingDetails || null;

      if (!id || !studentName || !matricula) {
        res.status(400).json({ error: 'Missing required attempt fields' });
        return;
      }

      const existing = await db.select().from(studentAttempts).where(eq(studentAttempts.id, id));

      if (existing.length > 0) {
        if (user.role !== 'docente' && existing[0].matricula !== user.studentId) {
          res.status(403).json({ error: 'Não autorizado a alterar tentativas de outro aluno.' });
          return;
        }
        await db
          .update(studentAttempts)
          .set({
            studentName,
            matricula,
            turma,
            status,
            score,
            maxScore,
            answers,
            feedback,
            gradingDetails,
            submittedAt: status === 'submitted' ? new Date() : existing[0].submittedAt,
            updatedAt: new Date(),
          })
          .where(eq(studentAttempts.id, id));
      } else {
        await db.insert(studentAttempts).values({
          id,
          studentName,
          matricula,
          turma,
          status: status || 'in_progress',
          score,
          maxScore,
          answers,
          feedback,
          gradingDetails,
          submittedAt: status === 'submitted' ? new Date() : null,
          startedAt: new Date(),
          updatedAt: new Date(),
        });
      }

      const updated = await db.select().from(studentAttempts).where(eq(studentAttempts.id, id));
      res.json(updated[0]);
    } catch (err) {
      console.error('Error saving attempt:', err);
      res.status(500).json({ error: 'Failed to save attempt' });
    }
  });

  // POST reset student exam (ADM ONLY)
  app.post('/api/attempts/reset', requireAdmin, async (req: SessionRequest, res: Response) => {
    try {
      const matricula = sanitizeStudentId(req.body?.matricula);
      if (!matricula) {
        res.status(400).json({ error: 'Missing matricula' });
        return;
      }

      const existing = await db
        .select()
        .from(studentAttempts)
        .where(eq(studentAttempts.matricula, matricula));

      if (existing.length > 0) {
        for (const item of existing) {
          await db
            .update(studentAttempts)
            .set({
              status: 'reset',
              score: 0,
              answers: null,
              submittedAt: null,
              resetCount: (item.resetCount || 0) + 1,
              lastResetAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(studentAttempts.id, item.id));
        }
      }

      res.json({ success: true, message: `Tentativas reiniciadas para a matrícula ${matricula}` });
    } catch (err) {
      console.error('Error resetting attempt:', err);
      res.status(500).json({ error: 'Failed to reset attempt' });
    }
  });

  // POST clear data / reset session (ADM ONLY)
  app.post('/api/data/clear', requireAdmin, async (_req: SessionRequest, res: Response) => {
    try {
      await db.delete(studentAttempts);
      res.json({ success: true, message: 'Todos os registos e submissões foram limpos com sucesso.' });
    } catch (err) {
      console.error('Error clearing data:', err);
      res.status(500).json({ error: 'Failed to clear data' });
    }
  });

  // GET all student permissions/profiles (ADM ONLY - never exposes password hashes or ADM account)
  app.get('/api/students/access', requireAdmin, async (_req: SessionRequest, res: Response) => {
    try {
      const records = await db.select().from(studentPermissions);
      const safeRecords = records
        .filter((r) => r.studentId !== 'ADM01')
        .map(sanitizeStudentRecordForAdmin);
      res.json(safeRecords);
    } catch (err) {
      console.error('Error fetching student permissions:', err);
      res.status(500).json({ error: 'Failed to fetch student permissions' });
    }
  });

  // POST update or create student profile (ADM ONLY)
  app.post('/api/students/access', requireAdmin, async (req: SessionRequest, res: Response) => {
    try {
      const studentId = sanitizeStudentId(req.body?.studentId);
      if (!studentId || studentId === 'ADM01') {
        res.status(400).json({ error: 'studentId inválido ou reservado.' });
        return;
      }

      const nome = sanitizeString(req.body?.nome, 160);
      const turma = req.body?.turma !== undefined ? sanitizeString(req.body.turma, 80) : undefined;
      const provincia =
        req.body?.provincia !== undefined ? sanitizeString(req.body.provincia, 80) : undefined;
      const email = req.body?.email !== undefined ? sanitizeString(req.body.email, 160) : undefined;
      const login = req.body?.login !== undefined ? sanitizeString(req.body.login, 100) : undefined;
      const rawSenha =
        typeof req.body?.senha === 'string' && req.body.senha.trim() !== '' && !req.body.senha.includes('••••')
          ? req.body.senha.trim()
          : undefined;
      const acessoPermitido =
        req.body?.acessoPermitido !== undefined ? Boolean(req.body.acessoPermitido) : undefined;
      const provasPermitidas = req.body?.provasPermitidas;
      const tempoExtraMin =
        req.body?.tempoExtraMin !== undefined ? Math.max(0, Math.min(Number(req.body.tempoExtraMin) || 0, 240)) : undefined;
      const observacao =
        req.body?.observacao !== undefined ? sanitizeString(req.body.observacao, 500) : undefined;

      const existing = await db
        .select()
        .from(studentPermissions)
        .where(eq(studentPermissions.studentId, studentId));

      if (existing.length > 0) {
        await db
          .update(studentPermissions)
          .set({
            nome: nome || existing[0].nome,
            turma: turma !== undefined ? turma : existing[0].turma,
            provincia: provincia !== undefined ? provincia : existing[0].provincia,
            email: email !== undefined ? email : existing[0].email,
            login: login !== undefined ? login : existing[0].login,
            senha: rawSenha ? hashPassword(rawSenha) : existing[0].senha,
            acessoPermitido:
              acessoPermitido !== undefined ? acessoPermitido : existing[0].acessoPermitido,
            provasPermitidas:
              provasPermitidas !== undefined ? provasPermitidas : existing[0].provasPermitidas,
            tempoExtraMin: tempoExtraMin !== undefined ? tempoExtraMin : existing[0].tempoExtraMin,
            observacao: observacao !== undefined ? observacao : existing[0].observacao,
            updatedAt: new Date(),
          })
          .where(eq(studentPermissions.studentId, studentId));
      } else {
        await db.insert(studentPermissions).values({
          studentId,
          nome: nome || studentId,
          turma: turma || null,
          provincia: provincia || null,
          email: email || null,
          login: login || studentId.toLowerCase(),
          senha: hashPassword(rawSenha || '123456'),
          acessoPermitido: acessoPermitido !== undefined ? acessoPermitido : true,
          provasPermitidas: provasPermitidas || null,
          tempoExtraMin: tempoExtraMin || 0,
          observacao: observacao || null,
          updatedAt: new Date(),
        });
      }

      const updated = await db
        .select()
        .from(studentPermissions)
        .where(eq(studentPermissions.studentId, studentId));
      res.json(sanitizeStudentRecordForAdmin(updated[0]));
    } catch (err) {
      console.error('Error updating student access:', err);
      res.status(500).json({ error: 'Failed to update student access' });
    }
  });

  // POST bulk import students from Excel / CSV (ADM ONLY)
  app.post('/api/students/bulk', requireAdmin, async (req: SessionRequest, res: Response) => {
    try {
      const { students: studentList } = req.body;
      if (!Array.isArray(studentList) || studentList.length === 0) {
        res.status(400).json({ error: 'No students provided' });
        return;
      }

      if (studentList.length > 1000) {
        res.status(400).json({ error: 'Limite máximo de 1000 alunos por importação.' });
        return;
      }

      for (const st of studentList) {
        const sid =
          sanitizeStudentId(st?.studentId) || `A${Math.floor(1000 + Math.random() * 9000)}`;
        if (sid === 'ADM01') continue;

        const cleanNome = sanitizeString(st?.nome, 160) || sid;
        const cleanTurma = sanitizeString(st?.turma, 80) || 'GE-2026';
        const cleanProvincia = sanitizeString(st?.provincia, 80) || 'Luanda';
        const cleanLogin = sanitizeString(st?.login, 100) || sid.toLowerCase();
        const cleanEmail = sanitizeString(st?.email, 160) || `${cleanLogin}@isp.ao`;
        const rawSenha =
          typeof st?.senha === 'string' && st.senha.trim() !== '' && !st.senha.includes('••••')
            ? st.senha.trim()
            : undefined;

        const existing = await db
          .select()
          .from(studentPermissions)
          .where(eq(studentPermissions.studentId, sid));

        if (existing.length > 0) {
          await db
            .update(studentPermissions)
            .set({
              nome: cleanNome || existing[0].nome,
              turma: st?.turma !== undefined ? cleanTurma : existing[0].turma,
              provincia: st?.provincia !== undefined ? cleanProvincia : existing[0].provincia,
              email: st?.email !== undefined ? cleanEmail : existing[0].email,
              login: st?.login !== undefined ? cleanLogin : existing[0].login,
              senha: rawSenha ? hashPassword(rawSenha) : existing[0].senha,
              acessoPermitido:
                st?.acessoPermitido !== undefined
                  ? Boolean(st.acessoPermitido)
                  : existing[0].acessoPermitido,
              updatedAt: new Date(),
            })
            .where(eq(studentPermissions.studentId, sid));
        } else {
          await db.insert(studentPermissions).values({
            studentId: sid,
            nome: cleanNome,
            turma: cleanTurma,
            provincia: cleanProvincia,
            email: cleanEmail,
            login: cleanLogin,
            senha: hashPassword(rawSenha || '123456'),
            acessoPermitido: st?.acessoPermitido !== false,
            tempoExtraMin: 0,
            updatedAt: new Date(),
          });
        }
      }

      const allRecords = await db.select().from(studentPermissions);
      res.json({
        success: true,
        count: studentList.length,
        students: allRecords.filter((r) => r.studentId !== 'ADM01').map(sanitizeStudentRecordForAdmin),
      });
    } catch (err) {
      console.error('Error bulk importing students:', err);
      res.status(500).json({ error: 'Failed to bulk import students' });
    }
  });

  // DELETE student profile (ADM ONLY)
  app.delete('/api/students/:id', requireAdmin, async (req: SessionRequest, res: Response) => {
    try {
      const id = sanitizeStudentId(req.params.id);
      if (!id || id === 'ADM01') {
        res.status(400).json({ error: 'Não é possível remover este perfil.' });
        return;
      }
      await db.delete(studentPermissions).where(eq(studentPermissions.studentId, id));
      res.json({ success: true, message: `Aluno ${id} removido com sucesso.` });
    } catch (err) {
      console.error('Error deleting student:', err);
      res.status(500).json({ error: 'Failed to delete student' });
    }
  });

  // POST batch student access (ADM ONLY)
  app.post('/api/students/access-batch', requireAdmin, async (req: SessionRequest, res: Response) => {
    try {
      const { allowAll, students: studentList } = req.body;
      const allowedBool = Boolean(allowAll);
      if (Array.isArray(studentList)) {
        for (const st of studentList) {
          const sid = sanitizeStudentId(st?.studentId);
          if (!sid || sid === 'ADM01') continue;
          const existing = await db
            .select()
            .from(studentPermissions)
            .where(eq(studentPermissions.studentId, sid));
          if (existing.length > 0) {
            await db
              .update(studentPermissions)
              .set({
                acessoPermitido: allowedBool,
                updatedAt: new Date(),
              })
              .where(eq(studentPermissions.studentId, sid));
          } else {
            await db.insert(studentPermissions).values({
              studentId: sid,
              nome: sanitizeString(st?.nome, 160) || sid,
              turma: sanitizeString(st?.turma, 80) || null,
              provincia: sanitizeString(st?.provincia, 80) || null,
              email: sanitizeString(st?.email, 160) || null,
              login: sanitizeString(st?.login, 100) || null,
              senha: hashPassword('123456'),
              acessoPermitido: allowedBool,
              tempoExtraMin: 0,
              updatedAt: new Date(),
            });
          }
        }
      }
      res.json({
        success: true,
        message: `Acesso em lote actualizado para ${allowedBool ? 'Permitido' : 'Bloqueado'}`,
      });
    } catch (err) {
      console.error('Error batch updating access:', err);
      res.status(500).json({ error: 'Failed to batch update student access' });
    }
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
