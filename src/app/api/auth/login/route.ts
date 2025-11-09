import { NextRequest, NextResponse } from 'next/server';
import { LoginSchema } from '@/server/auth/validators';
import { loginUser } from '@/server/auth/service';
import { AppError } from '@/server/errors';
import { AuthCookie } from '@/server/auth/jwt';
import { incrWithTtl } from '@/lib/redis';

const RATE_LOGIN_WINDOW_SEC = Number(process.env.AUTH_LOGIN_WINDOW_SEC || (process.env.NODE_ENV === 'production' ? 10 * 60 : 60));
const RATE_LOGIN_LIMIT_IP = Number(process.env.AUTH_LOGIN_LIMIT_IP || (process.env.NODE_ENV === 'production' ? 3 : 20));
const RATE_LOGIN_LIMIT_IDENTIFIER = Number(process.env.AUTH_LOGIN_LIMIT_IDENTIFIER || (process.env.NODE_ENV === 'production' ? 3 : 20));

const memIp = new Map<string, { c: number; r: number }>();
const memIdentifier = new Map<string, { c: number; r: number }>();

async function checkRate(ip: string, identifier: string) {
  const subject = identifier.toLowerCase().trim();
  try {
    const keyIp = `rl:login:ip:${ip}`;
    const outIp = await incrWithTtl(keyIp, RATE_LOGIN_WINDOW_SEC);
    if (outIp && outIp.count > RATE_LOGIN_LIMIT_IP) return { ok: false, retryAfter: outIp.ttl };
    const keyIdentifier = `rl:login:id:${subject}`;
    const outIdentifier = await incrWithTtl(keyIdentifier, RATE_LOGIN_WINDOW_SEC);
    if (outIdentifier && outIdentifier.count > RATE_LOGIN_LIMIT_IDENTIFIER) return { ok: false, retryAfter: outIdentifier.ttl };
    if (outIp || outIdentifier) return { ok: true };
  } catch {}
  const now = Date.now();
  const end = now + RATE_LOGIN_WINDOW_SEC * 1000;
  const a = memIp.get(ip);
  if (!a || a.r < now) memIp.set(ip, { c: 1, r: end }); else { a.c += 1; if (a.c > RATE_LOGIN_LIMIT_IP) return { ok: false, retryAfter: Math.ceil((a.r - now) / 1000) }; }
  const b = memIdentifier.get(subject);
  if (!b || b.r < now) memIdentifier.set(subject, { c: 1, r: end }); else { b.c += 1; if (b.c > RATE_LOGIN_LIMIT_IDENTIFIER) return { ok: false, retryAfter: Math.ceil((b.r - now) / 1000) }; }
  return { ok: true };
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const json = await req.json();
    const input = LoginSchema.parse(json);
    const rate = await checkRate(ip, input.identifier);
    if (!rate.ok) return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfter || 60) } });
    const { user, token } = await loginUser(input);
    const res = NextResponse.json({ user });
    res.cookies.set(AuthCookie.name, token, AuthCookie.options);
    return res;
  } catch (err: any) {
    if (err?.issues) {
      return NextResponse.json({ errors: err.issues }, { status: 422 });
    }
    const status = err instanceof AppError ? err.status : 400;
    return NextResponse.json({ error: err.message || 'Bad Request' }, { status });
  }
}
