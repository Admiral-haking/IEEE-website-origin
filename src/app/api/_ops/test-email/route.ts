import { NextRequest, NextResponse } from 'next/server';
import { requireRoleAtLeast } from '@/server/auth/guard';
import { sendContactEmail } from '@/server/mail/mailer';
import { takeRate } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  await requireRoleAtLeast('admin');
  const rate = await takeRate(req, 'ops:test-email', 3, 600);
  if (!rate.ok) return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfter || 60) } });
  const body = await req.json().catch(() => ({}));
  const to = (body?.to as string) || process.env.MAIL_TO || process.env.CONTACT_TO;
  const locale = (body?.locale as 'en'|'fa') || 'en';
  const subject = (body?.subject as string) || 'Test email';
  const message = (body?.message as string) || 'This is a test email from the IEEE website.';
  const phone = (body?.phone as string) || '+1 555 000 0000';
  const ok = await sendContactEmail({ name: 'Test', email: to || 'noreply@example.com', phone, subject, message, locale });
  return NextResponse.json({ ok, to, locale });
}
