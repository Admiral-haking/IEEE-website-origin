import { NextRequest, NextResponse } from 'next/server';
import { ResetPasswordSchema } from '@/server/auth/validators';
import { resetPassword } from '@/server/auth/service';
import { AppError } from '@/server/errors';
import { incrWithTtl } from '@/lib/redis';
import { getFeatures } from '@/server/settings/service';
import { getClientIp, isForeignIp, checkStrictForeignRate } from '@/server/security/ip';

const RATE_WINDOW_SEC = Number(process.env.PASSWORD_RESET_WINDOW_SEC || 5 * 60);
const RATE_LIMIT = Number(process.env.PASSWORD_RESET_LIMIT || 10);
const memIp = new Map<string, { c: number; r: number }>();

async function checkRate(ip: string) {
  try {
    const keyIp = `rl:reset:ip:${ip}`;
    const out = await incrWithTtl(keyIp, RATE_WINDOW_SEC);
    if (out && out.count > RATE_LIMIT) return { ok: false, retryAfter: out.ttl };
    if (out) return { ok: true };
  } catch {}
  const now = Date.now();
  const end = now + RATE_WINDOW_SEC * 1000;
  const node = memIp.get(ip);
  if (!node || node.r < now) memIp.set(ip, { c: 1, r: end }); else { node.c += 1; if (node.c > RATE_LIMIT) return { ok: false, retryAfter: Math.ceil((node.r - now) / 1000) }; }
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
    const input = ResetPasswordSchema.parse(json);
    if (features.security?.strictForeignIp && isForeignIp(req)) {
      const ticket = await checkStrictForeignRate(ip, 'reset');
      if (!ticket.ok) {
        return NextResponse.json(
          { error: 'Too Many Requests' },
          { status: 429, headers: { 'Retry-After': String(ticket.retryAfter || 60) } }
        );
      }
    }
    const rate = await checkRate(ip);
    if (!rate.ok) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfter || 60) } });
    }
    await resetPassword(input.token, input.password);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err?.issues) return NextResponse.json({ errors: err.issues }, { status: 422 });
    const status = err instanceof AppError ? err.status : 400;
    return NextResponse.json({ error: err.message || 'Bad Request' }, { status });
  }
}
