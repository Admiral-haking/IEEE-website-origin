import { NextRequest, NextResponse } from 'next/server';
import { AppError } from '@/server/errors';
import { incrWithTtl, setEx } from '@/lib/redis';
import { sendSms, normalizeIrPhone } from '@/server/sms/service';
import { getFeatures } from '@/server/settings/service';
import { getClientIp, isForeignIp, checkStrictForeignRate } from '@/server/security/ip';

const WINDOW_SEC = Number(process.env.OTP_WINDOW_SEC || 10 * 60);
const LIMIT_PER_PHONE = Number(process.env.OTP_LIMIT_PER_PHONE || 5);
const LIMIT_PER_IP = Number(process.env.OTP_LIMIT_PER_IP || 10);

function genCode() { return String(Math.floor(100000 + Math.random() * 900000)); }

export async function POST(req: NextRequest) {
  try {
    const features = await getFeatures();
    if (!features.auth.phoneOtpEnabled) {
      return NextResponse.json({ error: 'OTP login disabled' }, { status: 503 });
    }
    const { phone } = await req.json();
    if (!phone || String(phone).length < 6) throw new AppError('Invalid phone', 400);
    const ip = getClientIp(req);
    if (features.security?.strictForeignIp && isForeignIp(req)) {
      const ticket = await checkStrictForeignRate(ip, 'otp-request');
      if (!ticket.ok) {
        return NextResponse.json(
          { error: 'Too Many Requests' },
          { status: 429, headers: { 'Retry-After': String(ticket.retryAfter || 60) } }
        );
      }
    }
    const p = normalizeIrPhone(String(phone));
    const keyPhone = `otp:req:phone:${p}`;
    const keyIp = `otp:req:ip:${ip}`;
    const a = await incrWithTtl(keyPhone, WINDOW_SEC);
    if (a && a.count > LIMIT_PER_PHONE) return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: { 'Retry-After': String(a.ttl || WINDOW_SEC) } });
    const b = await incrWithTtl(keyIp, WINDOW_SEC);
    if (b && b.count > LIMIT_PER_IP) return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: { 'Retry-After': String(b.ttl || WINDOW_SEC) } });
    const code = genCode();
    await setEx(`otp:code:${p}`, code, Number(process.env.OTP_CODE_TTL || 5 * 60));
    const msgFa = `کد ورود شما: ${code}`;
    const sent = await sendSms(p, msgFa);
    const devPayload = process.env.NODE_ENV === 'production' ? {} : { code };
    return NextResponse.json({ ok: true, sent, phone: p, ...devPayload }, { status: 201 });
  } catch (err: any) {
    const status = err instanceof AppError ? err.status : 400;
    return NextResponse.json({ error: err.message || 'Bad Request' }, { status });
  }
}
