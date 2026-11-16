/**
 * Local storage persistence and authenticated API synchronization layer
 */

import { Attempt, ExamDefinition, ExamResult, Student, StudentAccess } from '../types/exam';
import { DEFINICAO_PROVAS, ESTUDANTES_PADRAO } from '../data/examData';

const KEY_STUDENTS = 'spe_students_v1';
const KEY_ATTEMPTS = 'spe_attempts_v1';
const KEY_RESULTS = 'spe_results_v1';
const KEY_ACCESS = 'spe_access_v1';
const KEY_CURRENT_USER = 'spe_current_user_v1';
const KEY_EXAMS = 'spe_exams_config_v1';
const KEY_AUTH_TOKEN = 'spe_auth_token_v1';

// --- Authenticated Session Helpers ---

export function getAuthToken(): string | null {
  try {
    return sessionStorage.getItem(KEY_AUTH_TOKEN);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null): void {
  try {
    if (token) {
      sessionStorage.setItem(KEY_AUTH_TOKEN, token);
    } else {
      sessionStorage.removeItem(KEY_AUTH_TOKEN);
    }
  } catch {}
}

export function authFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const token = getAuthToken();
  const headers = new Headers(init.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(input, {
    ...init,
    headers,
    credentials: 'include',
  });
}

export function clearSensitiveLocalSession(): void {
  try {
    setAuthToken(null);
    localStorage.removeItem(KEY_CURRENT_USER);
    localStorage.removeItem(KEY_STUDENTS);
  } catch {}
}

export function sanitizeUserForStorage(user: Student): Student {
  const { senha: _omitted, ...safe } = user;
  return {
    ...safe,
    senha: '',
  };
}

// --- Exams ---

export function getStoredExams(): ExamDefinition[] {
  try {
    const raw = localStorage.getItem(KEY_EXAMS);
    if (!raw) {
      localStorage.setItem(KEY_EXAMS, JSON.stringify(DEFINICAO_PROVAS));
      return DEFINICAO_PROVAS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFINICAO_PROVAS;
  }
}

export function saveStoredExams(exams: ExamDefinition[]): void {
  localStorage.setItem(KEY_EXAMS, JSON.stringify(exams));
}

export function updateExamSchedule(
  examId: string,
  updates: {
    disponivelEm?: string;
    horaInicio?: string;
    horaFim?: string;
    aberturaImediata?: boolean;
    tempoLimiteMin?: number;
  }
): ExamDefinition[] {
  const current = getStoredExams();
  const updated = current.map((ex) => {
    if (ex.examId === examId) {
      return {
        ...ex,
        ...updates,
      };
    }
    return ex;
  });
  saveStoredExams(updated);
  try {
    authFetch('/api/exam-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scheduledOpenAt: updates.disponivelEm
          ? `${updates.disponivelEm}T${updates.horaInicio || '00:00'}:00`
          : null,
        durationMinutes: updates.tempoLimiteMin || 120,
        isActive: true,
      }),
    }).catch(() => {});
  } catch {}
  return updated;
}

export function verificarDisponibilidadeExame(exam: ExamDefinition): {
  estado: 'disponivel' | 'agendada' | 'encerrada';
  data?: string;
  hora?: string;
  mensagem: string;
} {
  if (exam.tipo === 'ensaio' || exam.aberturaImediata) {
    return {
      estado: 'disponivel',
      mensagem:
        exam.tipo === 'ensaio'
          ? 'Treino livre (sempre aberto).'
          : 'Prova aberta pelo docente para realização imediata.',
    };
  }
  if (!exam.disponivelEm) {
    return { estado: 'disponivel', mensagem: 'Prova aberta e disponível.' };
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hoje = `${year}-${month}-${day}`;
  const horaAtual = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const horaInicio = exam.horaInicio || '00:00';
  const horaFim = exam.horaFim || '23:59';

  if (hoje < exam.disponivelEm || (hoje === exam.disponivelEm && horaAtual < horaInicio)) {
    const dataPT = exam.disponivelEm.split('-').reverse().join('/');
    return {
      estado: 'agendada',
      data: exam.disponivelEm,
      hora: horaInicio,
      mensagem: `Abre a ${dataPT}${horaInicio !== '00:00' ? ` às ${horaInicio}` : ''}.`,
    };
  }

  if (hoje > exam.disponivelEm || (hoje === exam.disponivelEm && horaAtual > horaFim)) {
    const dataPT = exam.disponivelEm.split('-').reverse().join('/');
    return {
      estado: 'encerrada',
      data: exam.disponivelEm,
      mensagem: `Período de realização encerrado (${dataPT}).`,
    };
  }

  return { estado: 'disponivel', mensagem: 'Prova aberta e disponível agora.' };
}

// --- Students (Admin cache only; passwords are never stored in browser storage) ---

export function getStudents(): Student[] {
  try {
    const raw = localStorage.getItem(KEY_STUDENTS);
    const list: Student[] = raw ? JSON.parse(raw) : ESTUDANTES_PADRAO;
    return list
      .filter((st) => st.role !== 'docente' && st.studentId !== 'ADM01')
      .map((st) => ({
        ...st,
        provincia: st.provincia || 'Luanda',
        senha: '',
        acessoPermitido: st.acessoPermitido !== undefined ? st.acessoPermitido : true,
        tempoExtraMin: st.tempoExtraMin || 0,
      }));
  } catch {
    return ESTUDANTES_PADRAO.map((st) => ({
      ...st,
      provincia: st.provincia || 'Luanda',
      senha: '',
      acessoPermitido: true,
      tempoExtraMin: 0,
    }));
  }
}

export function saveStudents(students: Student[]): void {
  const safeList = students
    .filter((st) => st.role !== 'docente' && st.studentId !== 'ADM01')
    .map(sanitizeUserForStorage);
  localStorage.setItem(KEY_STUDENTS, JSON.stringify(safeList));
}

export function getCurrentUser(): Student | null {
  try {
    const raw = localStorage.getItem(KEY_CURRENT_USER);
    if (!raw) return null;
    const user: Student = JSON.parse(raw);
    return sanitizeUserForStorage(user);
  } catch {
    return null;
  }
}

export function setCurrentUser(user: Student | null): void {
  if (user) {
    localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(sanitizeUserForStorage(user)));
  } else {
    localStorage.removeItem(KEY_CURRENT_USER);
  }
}

export async function updateMyPassword(
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await authFetch('/api/students/me/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Erro ao actualizar senha.' };
    }
    return { success: true };
  } catch {
    return { success: false, error: 'Erro de ligação ao servidor.' };
  }
}

// --- Attempts & Results ---

export function getAttempts(): Attempt[] {
  try {
    const raw = localStorage.getItem(KEY_ATTEMPTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveAttempts(attempts: Attempt[]): void {
  localStorage.setItem(KEY_ATTEMPTS, JSON.stringify(attempts));
}

export function getResults(): ExamResult[] {
  try {
    const raw = localStorage.getItem(KEY_RESULTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveResults(results: ExamResult[]): void {
  localStorage.setItem(KEY_RESULTS, JSON.stringify(results));
  try {
    results.forEach((res) => {
      authFetch('/api/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: res.attemptId,
          studentName: res.nome,
          matricula: res.studentId,
          turma: res.turma || 'TURMA-A',
          status: 'submitted',
          score: Math.round(res.nota20 || 0),
          maxScore: 20,
          answers: null,
          feedback: `Nota Total: ${res.notaTotal}/${res.notaMax} (${res.nota20}/20)`,
          gradingDetails: res.detalhe,
        }),
      }).catch(() => {});
    });
  } catch {}
}

export function getAccessRecords(): Record<string, StudentAccess> {
  try {
    const raw = localStorage.getItem(KEY_ACCESS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveAccessRecords(records: Record<string, StudentAccess>): void {
  localStorage.setItem(KEY_ACCESS, JSON.stringify(records));
}

export function getStudentAccess(studentId: string): StudentAccess | null {
  const records = getAccessRecords();
  return records[studentId] || null;
}

export function registerOrUpdateAccess(student: Student, durationMinutes = 180): StudentAccess {
  const records = getAccessRecords();
  const now = new Date();
  if (records[student.studentId]) {
    records[student.studentId].ultimoLoginEm = now.toISOString();
    saveAccessRecords(records);
    return records[student.studentId];
  }
  const expira = new Date(now.getTime() + durationMinutes * 60 * 1000);
  const novo: StudentAccess = {
    studentId: student.studentId,
    nome: student.nome,
    primeiroLoginEm: now.toISOString(),
    expiraEm: expira.toISOString(),
    ultimoLoginEm: now.toISOString(),
  };
  records[student.studentId] = novo;
  saveAccessRecords(records);
  return novo;
}

export function getDraft(examId: string, studentId: string): Record<string, any> | null {
  try {
    const raw = localStorage.getItem(`draft:${examId}:${studentId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveDraft(examId: string, studentId: string, data: Record<string, any>): void {
  try {
    localStorage.setItem(`draft:${examId}:${studentId}`, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save draft:', err);
  }
}

export function clearDraft(examId: string, studentId: string): void {
  try {
    localStorage.removeItem(`draft:${examId}:${studentId}`);
  } catch {}
}

export function resetStudentExam(
  studentId: string,
  examId: string
): { success: boolean; message: string } {
  const attempts = getAttempts().filter(
    (a) => !(a.studentId === studentId && a.examId === examId)
  );
  saveAttempts(attempts);

  const results = getResults().filter((r) => !(r.studentId === studentId && r.examId === examId));
  saveResults(results);

  clearDraft(examId, studentId);

  const accessRecords = getAccessRecords();
  if (accessRecords[studentId]) {
    delete accessRecords[studentId];
    saveAccessRecords(accessRecords);
  }

  try {
    authFetch('/api/attempts/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matricula: studentId }),
    }).catch(() => {});
  } catch {}

  return {
    success: true,
    message: `Prova reaberta com sucesso para o aluno ${studentId}. O cronómetro e o rascunho foram reiniciados.`,
  };
}

export function clearAllExamData(
  scope: 'attempts' | 'all' = 'attempts'
): { success: boolean; message: string } {
  localStorage.removeItem(KEY_RESULTS);
  localStorage.removeItem(KEY_ATTEMPTS);
  localStorage.removeItem(KEY_ACCESS);

  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('draft:') || (scope === 'all' && k.startsWith('spe_access')))) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {}

  try {
    authFetch('/api/data/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scope }),
    }).catch(() => {});
  } catch {}

  return {
    success: true,
    message:
      scope === 'all'
        ? 'Todos os registos de submissões, cronómetros e rascunhos foram limpos com sucesso.'
        : 'Todas as submissões e notas foram limpas com sucesso. A plataforma está pronta para a prova oficial.',
  };
}

export function updateStudentAccess(
  studentId: string,
  updates: Partial<Student>
): Student[] {
  const students = getStudents();
  const exists = students.some((s) => s.studentId === studentId);
  const updated = exists
    ? students.map((s) => (s.studentId === studentId ? { ...s, ...updates } : s))
    : [...students, updates as Student];
  saveStudents(updated);

  try {
    const student = updated.find((s) => s.studentId === studentId);
    if (student && student.studentId !== 'ADM01') {
      const passwordToSend =
        updates.senha && updates.senha.trim() !== '' ? updates.senha.trim() : undefined;

      authFetch('/api/students/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.studentId,
          nome: student.nome,
          turma: student.turma,
          provincia: student.provincia || 'Luanda',
          email: student.email,
          login: student.login,
          ...(passwordToSend ? { senha: passwordToSend } : {}),
          acessoPermitido: student.acessoPermitido !== false,
          provasPermitidas: student.provasPermitidas || null,
          tempoExtraMin: student.tempoExtraMin || 0,
          observacao: student.observacao || null,
        }),
      }).catch(() => {});
    }
  } catch {}

  return updated.map(sanitizeUserForStorage);
}

export function bulkImportStudents(newStudents: Student[]): Student[] {
  const current = getStudents();
  const studentMap = new Map<string, Student>();
  current.forEach((s) => studentMap.set(s.studentId, s));

  newStudents.forEach((ns) => {
    if (ns.studentId === 'ADM01') return;
    const existing = studentMap.get(ns.studentId);
    if (existing) {
      studentMap.set(ns.studentId, {
        ...existing,
        ...ns,
        provincia: ns.provincia || existing.provincia || 'Luanda',
        senha: '',
      });
    } else {
      studentMap.set(ns.studentId, {
        ...ns,
        role: 'aluno',
        provincia: ns.provincia || 'Luanda',
        senha: '',
        acessoPermitido: ns.acessoPermitido !== false,
        tempoExtraMin: ns.tempoExtraMin || 0,
      });
    }
  });

  const updatedList = Array.from(studentMap.values());
  saveStudents(updatedList);

  try {
    authFetch('/api/students/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ students: newStudents }),
    }).catch(() => {});
  } catch {}

  return updatedList;
}

export function deleteStudentProfile(studentId: string): Student[] {
  const current = getStudents();
  const updated = current.filter((s) => s.studentId !== studentId);
  saveStudents(updated);

  try {
    authFetch(`/api/students/${encodeURIComponent(studentId)}`, {
      method: 'DELETE',
    }).catch(() => {});
  } catch {}

  return updated;
}

export function batchSetStudentsAccess(allowAll: boolean): Student[] {
  const students = getStudents();
  const updated = students.map((s) => {
    if (s.role === 'docente') return s;
    return { ...s, acessoPermitido: allowAll };
  });
  saveStudents(updated);

  try {
    authFetch('/api/students/access-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        allowAll,
        students: updated.filter((s) => s.role !== 'docente'),
      }),
    }).catch(() => {});
  } catch {}

  return updated;
}

export async function syncWithCloudSql(userRole?: 'aluno' | 'docente'): Promise<Student[] | null> {
  try {
    // 1. Sync public exam schedule and duration
    const resSettings = await fetch('/api/exam-settings');
    if (resSettings.ok) {
      const dbSettings = await resSettings.json();
      if (dbSettings && dbSettings.scheduledOpenAt) {
        const d = new Date(dbSettings.scheduledOpenAt);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        const dataStr = `${yyyy}-${mm}-${dd}`;
        const horaStr = `${hh}:${min}`;
        updateExamScheduleLocalOnly('cabinda2027', {
          disponivelEm: dataStr,
          horaInicio: horaStr,
          tempoLimiteMin: dbSettings.durationMinutes || 120,
        });
      }
    }

    // 2. Sync student permissions ONLY when authenticated as ADM
    if (userRole === 'docente') {
      const resAccess = await authFetch('/api/students/access');
      if (resAccess.ok) {
        const permList = await resAccess.json();
        if (Array.isArray(permList) && permList.length > 0) {
          const merged: Student[] = permList.map((remote: any) => ({
            studentId: remote.studentId,
            nome: remote.nome || remote.studentId,
            turma: remote.turma || 'GE-2026',
            provincia: remote.provincia || 'Luanda',
            email: remote.email || '',
            login: remote.login || remote.studentId.toLowerCase(),
            senha: '',
            role: 'aluno',
            acessoPermitido: remote.acessoPermitido !== false,
            provasPermitidas: remote.provasPermitidas || undefined,
            tempoExtraMin: remote.tempoExtraMin ?? 0,
            observacao: remote.observacao || '',
          }));
          saveStudents(merged);
          return merged;
        }
      }
    }
  } catch {
    // Offline fallback
  }
  return null;
}

function updateExamScheduleLocalOnly(
  examId: string,
  updates: {
    disponivelEm?: string;
    horaInicio?: string;
    horaFim?: string;
    aberturaImediata?: boolean;
    tempoLimiteMin?: number;
  }
): void {
  const current = getStoredExams();
  const updated = current.map((ex) => (ex.examId === examId ? { ...ex, ...updates } : ex));
  saveStoredExams(updated);
}

export function seedInitialDataIfEmpty(): void {
  const existingResults = getResults();
  if (existingResults.length > 0) return;

  const sampleResults: ExamResult[] = [
    {
      attemptId: 'att-seed-1',
      studentId: 'A002',
      nome: 'Beatriz Teresa Kiala',
      examId: 'cabinda2027',
      tituloExame: 'Prova de Avaliação — Planeamento Estratégico em Gestão',
      notaTotal: 43.5,
      notaMax: 50,
      nota20: 17.4,
      inicioEm: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      fimEm: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      estado: 'Concluído',
      detalhe: [
        { parte: 'I', questao: 'Questão 1', alinea: 'a)', enunciado: 'Limitações da missão/visão/valores', pontos: 3, max: 3 },
        { parte: 'I', questao: 'Questão 1', alinea: 'b)', enunciado: 'Reformulação da Missão', pontos: 3.5, max: 4 },
        { parte: 'I', questao: 'Questão 1', alinea: 'c)', enunciado: 'Reformulação da Visão', pontos: 3, max: 3 },
        { parte: 'I', questao: 'Questão 1', alinea: 'd)', enunciado: '5 valores institucionais', pontos: 5, max: 5 },
        { parte: 'II', questao: 'Questão 2', alinea: 'a)', enunciado: 'Matriz SWOT', pontos: 8, max: 8 },
        { parte: 'II', questao: 'Questão 2', alinea: 'b)', enunciado: 'Estratégias FO, FA, DO, DA', pontos: 7, max: 8 },
        { parte: 'II', questao: 'Questão 2', alinea: 'c)', enunciado: 'Priorização e Justificação', pontos: 2, max: 2 },
        { parte: 'IV', questao: 'Questão 4', alinea: 'b)', enunciado: 'Previsão 2027 (345 mil consultas)', pontos: 3, max: 3 },
        { parte: 'IX', questao: 'Questão 9', alinea: 'b)', enunciado: 'Caminho Crítico (A-B-D-F-G-H)', pontos: 2, max: 2 },
        { parte: 'IX', questao: 'Questão 9', alinea: 'c)', enunciado: 'Duração total (28 dias)', pontos: 2, max: 2 }
      ]
    },
    {
      attemptId: 'att-seed-2',
      studentId: 'A001',
      nome: 'Manuel Domingos Antunes',
      examId: 'ensaio2027',
      tituloExame: 'ENSAIO — Planeamento Estratégico em Gestão',
      notaTotal: 41,
      notaMax: 50,
      nota20: 16.4,
      inicioEm: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
      fimEm: new Date(Date.now() - 6.5 * 3600 * 1000).toISOString(),
      estado: 'Ensaio',
      ensaio: true,
      detalhe: [
        { parte: 'I', questao: 'Questão 1', alinea: 'a)', enunciado: 'Limitações da missão/visão/valores', pontos: 2.5, max: 3 },
        { parte: 'I', questao: 'Questão 1', alinea: 'b)', enunciado: 'Reformulação da Missão', pontos: 3.5, max: 4 },
        { parte: 'II', questao: 'Questão 2', alinea: 'a)', enunciado: 'Matriz SWOT', pontos: 7.5, max: 8 },
        { parte: 'IX', questao: 'Questão 9', alinea: 'b)', enunciado: 'Caminho Crítico', pontos: 2, max: 2 }
      ]
    }
  ];

  localStorage.setItem(KEY_RESULTS, JSON.stringify(sampleResults));
}
