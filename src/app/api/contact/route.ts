import '@/lib/mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import ContactMessage from '@/models/ContactMessage';
import { sendContactEmail } from '@/server/mail/mailer';
import { AppError } from '@/server/errors';
import { incrWithTtl } from '@/lib/redis';
import { moderateText } from '@/server/ai/moderation';
import { getFeatures } from '@/server/settings/service';

const Schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(160),
  phone: z
    .string()
    .min(8)
    .max(32)
    .regex(/^\+?[0-9()\-\s]+$/, 'Invalid phone number'),
  subject: z.string().max(200).optional().default(''),
  message: z.string().min(10).max(5000),
  locale: z.enum(['en','fa']).optional().default('en'),
  turnstileToken: z.string().optional(),
  hcaptchaToken: z.string().optional()
});

// Rate limiting (Redis if available; otherwise process memory fallback)
const rateMap = new Map<string, { count: number; reset: number }>();
const RATE_WINDOW_SEC = 10 * 60; // 10 minutes
const RATE_LIMIT = 3;

async function take(ip: string) {
  // Try Redis first
  try {
    const key = `rl:contact:${ip}`;
    const out = await incrWithTtl(key, RATE_WINDOW_SEC);
    if (out) {
      const { count, ttl } = out as { count: number; ttl: number };
      if (count > RATE_LIMIT) return { ok: false, retryAfter: ttl > 0 ? ttl : 60 };
      return { ok: true };
    }
  } catch {}
  // Fallback in-memory
  const now = Date.now();
  const node = rateMap.get(ip);
  if (!node || node.reset < now) {
    rateMap.set(ip, { count: 1, reset: now + RATE_WINDOW_SEC * 1000 });
    return { ok: true };
  }
  if (node.count >= RATE_LIMIT) return { ok: false, retryAfter: Math.ceil((node.reset - now) / 1000) };
  node.count += 1; return { ok: true };
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const ticket = await take(clientIp);
    if (!ticket.ok) return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: { 'Retry-After': String(ticket.retryAfter || 60) } });
    const json = await req.json();
    const input = Schema.parse(json);
    // Optional captcha verification (admin-controlled)
    try {
      const f = await getFeatures();
      if (f.contact.captchaProvider === 'turnstile' && process.env.TURNSTILE_SECRET_KEY) {
        const ok = await verifyTurnstile(input.turnstileToken || '', clientIp);
        if (!ok) return NextResponse.json({ error: 'Captcha verification failed' }, { status: 400 });
      } else if (f.contact.captchaProvider === 'hcaptcha' && process.env.HCAPTCHA_SECRET) {
        const ok = await verifyHcaptcha(input.hcaptchaToken || '', clientIp);
        if (!ok) return NextResponse.json({ error: 'Captcha verification failed' }, { status: 400 });
      }
    } catch {}
    // AI moderation (optional)
    try {
      const mod = await moderateText(`${input.subject}\n${input.message}`, input.locale);
      if (!mod.allowed) return NextResponse.json({ error: 'Content not allowed' }, { status: 400 });
    } catch {}

    const ip = clientIp;
    const ua = req.headers.get('user-agent') || '';
    const created = await ContactMessage.create({ ...input, metadata: { ip, ua } });
    let emailSent = false;
    try { emailSent = await sendContactEmail(input as any); } catch {}
    return NextResponse.json({ ok: true, id: String(created._id), emailSent }, { status: 201 });
  } catch (err: any) {
    const status = err instanceof AppError ? err.status : 400;
    return NextResponse.json({ error: err.message || 'Bad Request' }, { status });
  }
}

async function verifyTurnstile(token: string, ip: string) {
  try {
    if (!token) return false;
    const form = new URLSearchParams();
    form.append('secret', process.env.TURNSTILE_SECRET_KEY as string);
    form.append('response', token);
    if (ip && ip !== 'unknown') form.append('remoteip', ip);
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
    const data = await res.json();
    return !!data?.success;
  } catch {
    return false;
  }
}

async function verifyHcaptcha(token: string, ip: string) {
  try {
    if (!token) return false;
    const form = new URLSearchParams();
    form.append('secret', process.env.HCAPTCHA_SECRET as string);
    form.append('response', token);
    if (ip && ip !== 'unknown') form.append('remoteip', ip);
    const res = await fetch('https://hcaptcha.com/siteverify', { method: 'POST', body: form });
    const data = await res.json();
    return !!data?.success;
  } catch {
    return false;
  }
}
