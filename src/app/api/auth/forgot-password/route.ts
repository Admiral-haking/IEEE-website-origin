import { NextRequest, NextResponse } from 'next/server';
import { ForgotPasswordSchema } from '@/server/auth/validators';
import { requestPasswordReset } from '@/server/auth/service';
import { AppError } from '@/server/errors';
import { incrWithTtl } from '@/lib/redis';
import { getFeatures } from '@/server/settings/service';
import { getClientIp, isForeignIp, checkStrictForeignRate } from '@/server/security/ip';

const RATE_WINDOW_SEC = Number(process.env.PASSWORD_RESET_REQUEST_WINDOW_SEC || 10 * 60);
const RATE_LIMIT = Number(process.env.PASSWORD_RESET_REQUEST_LIMIT || 5);

const memIp = new Map<string, { c: number; r: number }>();
const memEmail = new Map<string, { c: number; r: number }>();

async function checkRate(ip: string, email: string) {
  try {
    const keyIp = `rl:forgot:ip:${ip}`;
    const outIp = await incrWithTtl(keyIp, RATE_WINDOW_SEC);
    if (outIp && outIp.count > RATE_LIMIT) return { ok: false, retryAfter: outIp.ttl };
    const keyEmail = `rl:forgot:email:${email}`;
    const outEmail = await incrWithTtl(keyEmail, RATE_WINDOW_SEC);
    if (outEmail && outEmail.count > RATE_LIMIT) return { ok: false, retryAfter: outEmail.ttl };
    if (outIp || outEmail) return { ok: true };
  } catch {}
  const now = Date.now();
  const end = now + RATE_WINDOW_SEC * 1000;
  const nodeIp = memIp.get(ip);
  if (!nodeIp || nodeIp.r < now) memIp.set(ip, { c: 1, r: end }); else { nodeIp.c += 1; if (nodeIp.c > RATE_LIMIT) return { ok: false, retryAfter: Math.ceil((nodeIp.r - now) / 1000) }; }
  const nodeEmail = memEmail.get(email);
  if (!nodeEmail || nodeEmail.r < now) memEmail.set(email, { c: 1, r: end }); else { nodeEmail.c += 1; if (nodeEmail.c > RATE_LIMIT) return { ok: false, retryAfter: Math.ceil((nodeEmail.r - now) / 1000) }; }
  return { ok: true };
}

export async function POST(req: NextRequest) {
  try {
    const features = await getFeatures();
    if (!features.auth.passwordResetEnabled) {
      return NextResponse.json({ error: 'Password reset disabled' }, { status: 503 });
    }
    const ip = getClientIp(req);
    const json = await req.json();
    const input = ForgotPasswordSchema.parse(json);
    if (features.security?.strictForeignIp && isForeignIp(req)) {
      const ticket = await checkStrictForeignRate(ip, 'forgot');
      if (!ticket.ok) {
        return NextResponse.json(
          { error: 'Too Many Requests' },
          { status: 429, headers: { 'Retry-After': String(ticket.retryAfter || 60) } }
        );
      }
    }
    const rate = await checkRate(ip, input.email);
    if (!rate.ok) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfter || 60) } });
    }
    await requestPasswordReset(input.email, input.locale);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err?.issues) return NextResponse.json({ errors: err.issues }, { status: 422 });
    const status = err instanceof AppError ? err.status : 400;
    // For security, don't leak whether the account exists; still return ok
    if (status === 404) return NextResponse.json({ ok: true });
    return NextResponse.json({ error: err.message || 'Bad Request' }, { status });
  }
}
