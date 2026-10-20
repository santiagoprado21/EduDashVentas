import {
  AuthConfigError,
  SESSION_COOKIE,
  checkPassword,
  clearedSessionCookie,
  createSessionToken,
  isValidSession,
  readCookie,
  sessionCookie,
} from './auth.js';
import { fetchSheet, type SheetData } from './sheets.js';

/** Subconjunto común entre Express y las funciones de Vercel. */
export interface Req {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  query: Record<string, unknown>;
  body?: unknown;
}

export interface Res {
  status(code: number): Res;
  json(body: unknown): unknown;
  setHeader(name: string, value: string): unknown;
}

const FAILED_LOGIN_DELAY_MS = 800;
const TTL_MS = Number(process.env.CACHE_TTL_SECONDS ?? 60) * 1000;
let cache: { data: SheetData; expires: number } | null = null;

const cookieHeader = (req: Req) => {
  const c = req.headers.cookie;
  return Array.isArray(c) ? c.join('; ') : c;
};

function authorized(req: Req): boolean {
  return isValidSession(readCookie(cookieHeader(req), SESSION_COOKIE));
}

function handleError(res: Res, err: unknown, tag: string) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[${tag}]`, message);
  res.status(err instanceof AuthConfigError ? 500 : 502).json({ error: message });
}

export async function salesHandler(req: Req, res: Res) {
  try {
    if (!authorized(req)) {
      res.status(401).json({ error: 'No autorizado' });
      return;
    }

    const sheetId = process.env.SHEET_ID;
    const range = process.env.SHEET_RANGE ?? 'Hoja 1';
    if (!sheetId) {
      res.status(500).json({ error: 'Falta SHEET_ID en las variables de entorno' });
      return;
    }

    res.setHeader('Cache-Control', 'private, no-store');
    const force = req.query.refresh === '1';
    if (!force && cache && cache.expires > Date.now()) {
      res.json(cache.data);
      return;
    }

    const data = await fetchSheet(sheetId, range);
    cache = { data, expires: Date.now() + TTL_MS };
    res.json(data);
  } catch (err) {
    handleError(res, err, 'sales');
  }
}

export async function loginHandler(req: Req, res: Res) {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Método no permitido' });
      return;
    }
    const password = (req.body as { password?: unknown } | undefined)?.password;
    if (!checkPassword(password)) {
      await new Promise((r) => setTimeout(r, FAILED_LOGIN_DELAY_MS));
      res.status(401).json({ error: 'Contraseña incorrecta' });
      return;
    }
    res.setHeader('Set-Cookie', sessionCookie(createSessionToken()));
    res.json({ ok: true });
  } catch (err) {
    handleError(res, err, 'login');
  }
}

export function logoutHandler(_req: Req, res: Res) {
  res.setHeader('Set-Cookie', clearedSessionCookie());
  res.json({ ok: true });
}
