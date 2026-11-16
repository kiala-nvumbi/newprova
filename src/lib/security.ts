import crypto from 'node:crypto';
import os from 'node:os';
import type { Request, Response, NextFunction } from 'express';

export interface SessionUser {
  studentId: string;
  nome: string;
  login: string;
  role: 'aluno' | 'docente';
  turma?: string;
  provincia?: string;
  email?: string;
}

export interface SessionRequest extends Request {
  sessionUser?: SessionUser | null;
}

const SESSION_COOKIE_NAME = 'spe_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

// Precomputed scrypt hash for initial ADM bootstrap when ADMIN_PASSWORD env var is not provided
const DEFAULT_ADMIN_SCRYPT_HASH =
  'scrypt$4c04b4ae4f6e5a1b7e4e0d4ac3cd5dde$462f6f2a190607d2402a15821b9a51b9c8b60d73dec1053726568a3fa0214ad82912fa67075dfbe8e550176dd05fec8f2366aebfd671133b26ecfc5c4a2734a2';

let cachedSessionSecret: string | null = null;

function getSessionSecret(): string {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16) {
    return process.env.SESSION_SECRET;
  }
  if (!cachedSessionSecret) {
    // Derive a stable process/host-scoped secret when SESSION_SECRET env var is not configured
    const entropy = `${process.env.SQL_PASSWORD || ''}:${os.hostname()}:${process.cwd()}:spe-session-key`;
    cachedSessionSecret = crypto.createHash('sha256').update(entropy).digest('hex');
  }
  return cachedSessionSecret;
}

// --- Password Hashing (scrypt + timingSafeEqual) ---

export function hashPassword(plainPassword: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(plainPassword, salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

export function isHashedPassword(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.startsWith('scrypt$');
}

export function verifyPassword(plainPassword: string, storedValue: string): boolean {
  if (!plainPassword || !storedValue) return false;

  if (storedValue.startsWith('scrypt$')) {
    const parts = storedValue.split('$');
    if (parts.length !== 3) return false;
    const [, salt, originalHex] = parts;
    try {
      const derivedBuf = crypto.scryptSync(plainPassword, salt, 64);
      const originalBuf = Buffer.from(originalHex, 'hex');
      if (derivedBuf.length !== originalBuf.length) return false;
      return crypto.timingSafeEqual(derivedBuf, originalBuf);
    } catch {
      return false;
    }
  }

  // Legacy plaintext compatibility with constant-time comparison
  const a = Buffer.from(plainPassword, 'utf8');
  const b = Buffer.from(storedValue, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function verifyAdminPassword(plainPassword: string): boolean {
  const envAdminPass = process.env.ADMIN_PASSWORD;
  if (envAdminPass && envAdminPass.trim().length > 0) {
    return verifyPassword(plainPassword, envAdminPass.trim());
  }
  return verifyPassword(plainPassword, DEFAULT_ADMIN_SCRYPT_HASH);
}

// --- Signed Session Tokens (HMAC-SHA256) ---

export function createSessionToken(user: SessionUser): string {
  const payload = {
    studentId: user.studentId,
    nome: user.nome,
    login: user.login,
    role: user.role,
    turma: user.turma,
    provincia: user.provincia,
    email: user.email,
    exp: Date.now() + SESSION_TTL_MS,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', getSessionSecret())
    .update(payloadB64)
    .digest('base64url');
  return `${payloadB64}.${signature}`;
}

export function verifySessionToken(token: string | undefined | null): SessionUser | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, sig] = parts;
  if (!payloadB64 || !sig) return null;

  try {
    const expectedSig = crypto
      .createHmac('sha256', getSessionSecret())
      .update(payloadB64)
      .digest('base64url');

    const sigBuf = Buffer.from(sig, 'utf8');
    const expBuf = Buffer.from(expectedSig, 'utf8');
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const decoded = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (!decoded || typeof decoded.exp !== 'number' || decoded.exp < Date.now()) {
      return null;
    }
    if (!decoded.studentId || !decoded.role) return null;

    return {
      studentId: String(decoded.studentId),
      nome: String(decoded.nome || decoded.studentId),
      login: String(decoded.login || decoded.studentId),
      role: decoded.role === 'docente' ? 'docente' : 'aluno',
      turma: decoded.turma ? String(decoded.turma) : undefined,
      provincia: decoded.provincia ? String(decoded.provincia) : undefined,
      email: decoded.email ? String(decoded.email) : undefined,
    };
  } catch {
    return null;
  }
}

// --- Cookie Helpers ---

export function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx > 0) {
      const key = pair.slice(0, idx).trim();
      const val = pair.slice(idx + 1).trim();
      try {
        cookies[key] = decodeURIComponent(val);
      } catch {
        cookies[key] = val;
      }
    }
  });
  return cookies;
}

export function isSecureRequest(req: Request): boolean {
  return (
    req.secure ||
    req.headers['x-forwarded-proto'] === 'https' ||
    process.env.NODE_ENV === 'production'
  );
}

export function setSessionCookie(req: Request, res: Response, token: string): void {
  const isHttps = isSecureRequest(req);
  const maxAgeSec = Math.floor(SESSION_TTL_MS / 1000);
  // Use SameSite=None; Secure on HTTPS so cross-origin preview iframes work safely,
  // and SameSite=Lax on local HTTP development.
  const sameSite = isHttps ? 'SameSite=None; Secure' : 'SameSite=Lax';
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=${maxAgeSec}; ${sameSite}`
  );
}

export function clearSessionCookie(req: Request, res: Response): void {
  const isHttps = isSecureRequest(req);
  const sameSite = isHttps ? 'SameSite=None; Secure' : 'SameSite=Lax';
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; ${sameSite}`
  );
}

// --- Middleware: Session Extraction & RBAC ---

export function extractSessionToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  const cookies = parseCookies(req.headers.cookie);
  return cookies[SESSION_COOKIE_NAME] || null;
}

export function attachSession(req: SessionRequest, _res: Response, next: NextFunction): void {
  const token = extractSessionToken(req);
  req.sessionUser = verifySessionToken(token);
  next();
}

export function requireAuth(req: SessionRequest, res: Response, next: NextFunction): void {
  if (!req.sessionUser) {
    res.status(401).json({ error: 'Sessão inválida ou expirada. Inicie sessão novamente.' });
    return;
  }
  next();
}

export function requireAdmin(req: SessionRequest, res: Response, next: NextFunction): void {
  if (!req.sessionUser) {
    res.status(401).json({ error: 'Autenticação necessária.' });
    return;
  }
  if (req.sessionUser.role !== 'docente') {
    res.status(403).json({ error: 'Acesso negado. Apenas o Administrador/Docente tem permissão.' });
    return;
  }
  next();
}

// --- Security Headers Middleware ---

export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  if (isSecureRequest(req)) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
}

// --- Rate Limiter (Sliding Window In-Memory) ---

interface RateEntry {
  count: number;
  resetAt: number;
}

export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message: string;
}) {
  const hits = new Map<string, RateEntry>();

  // Periodic cleanup to avoid unbounded memory growth
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits.entries()) {
      if (entry.resetAt <= now) {
        hits.delete(key);
      }
    }
  }, Math.min(options.windowMs, 60_000)).unref();

  return (req: Request, res: Response, next: NextFunction): void => {
    const forwarded = req.headers['x-forwarded-for'];
    const ip =
      (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.ip) || 'unknown';
    const now = Date.now();
    const existing = hits.get(ip);

    if (!existing || existing.resetAt <= now) {
      hits.set(ip, { count: 1, resetAt: now + options.windowMs });
      next();
      return;
    }

    if (existing.count >= options.max) {
      const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSec));
      res.status(429).json({ error: options.message });
      return;
    }

    existing.count += 1;
    next();
  };
}

// --- Input Sanitization ---

export function sanitizeString(val: unknown, maxLen = 250): string {
  if (typeof val !== 'string') return '';
  return val.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, maxLen);
}

export function sanitizeStudentId(val: unknown): string {
  return sanitizeString(val, 40).replace(/[^a-zA-Z0-9_-]/g, '');
}
