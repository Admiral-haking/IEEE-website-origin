import { NextRequest, NextResponse } from 'next/server';
import { RegisterSchema } from '@/server/auth/validators';
import { registerUser } from '@/server/auth/service';
import { AppError } from '@/server/errors';
import { AuthCookie } from '@/server/auth/jwt';
import { incrWithTtl } from '@/lib/redis';
import { getFeatures } from '@/server/settings/service';
import { getClientIp, isForeignIp, checkStrictForeignRate } from '@/server/security/ip';

const RATE_REG_WINDOW_SEC = Number(process.env.AUTH_REGISTER_WINDOW_SEC || (process.env.NODE_ENV === 'production' ? 60 * 60 : 5 * 60));
const RATE_REG_LIMIT_IP = Number(process.env.AUTH_REGISTER_LIMIT_IP || (process.env.NODE_ENV === 'production' ? 3 : 20));

const mem = new Map<string, { c: number; r: number }>();

async function checkRate(ip: string) {
  try {
    const key = `rl:register:ip:${ip}`;
    const out = await incrWithTtl(key, RATE_REG_WINDOW_SEC);
    if (out && out.count > RATE_REG_LIMIT_IP) return { ok: false, retryAfter: out.ttl };
    if (out) return { ok: true };
  } catch {}
  const now = Date.now();
  const end = now + RATE_REG_WINDOW_SEC * 1000;
  const a = mem.get(ip);
  if (!a || a.r < now) mem.set(ip, { c: 1, r: end }); else { a.c += 1; if (a.c > RATE_REG_LIMIT_IP) return { ok: false, retryAfter: Math.ceil((a.r - now) / 1000) }; }
  return { ok: true };
}

export async function POST(req: NextRequest) {
  try {
    const features = await getFeatures();
    if (!features.auth.signupEnabled) {
      return NextResponse.json({ error: 'Sign up disabled' }, { status: 503 });
    }
    const ip = getClientIp(req);
    const json = await req.json();
    const input = RegisterSchema.parse(json);
    if (features.security?.strictForeignIp && isForeignIp(req)) {
      const ticket = await checkStrictForeignRate(ip, 'register');
      if (!ticket.ok) {
        return NextResponse.json(
          { error: 'Too Many Requests' },
          { status: 429, headers: { 'Retry-After': String(ticket.retryAfter || 60) } }
        );
      }
    }
    const rate = await checkRate(ip);
    if (!rate.ok) return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfter || 60) } });
    const result = await registerUser(input);
    const body: any = { user: result.user, needsVerification: result.needsVerification };
    const res = NextResponse.json(body, { status: 201 });
    if (!result.needsVerification && result.token) {
      res.cookies.set(AuthCookie.name, result.token, AuthCookie.options);
    }
    return res;
  } catch (err: any) {
    if (err?.issues) {
      return NextResponse.json({ errors: err.issues }, { status: 422 });
    }
    const status = err instanceof AppError ? err.status : 400;
    return NextResponse.json({ error: err.message || 'Bad Request' }, { status });
  }
}
