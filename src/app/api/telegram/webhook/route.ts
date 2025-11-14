import '@/lib/mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { handleTelegramUpdate } from '@/server/news/telegram';

export async function POST(req: NextRequest) {
  const url = req.nextUrl;
  const secretFromQuery = url.searchParams.get('secret');
  const secretFromHeader = req.headers.get('x-telegram-bot-api-secret-token');
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!expected || (secretFromQuery !== expected && secretFromHeader !== expected)) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    const update = await req.json();
    const result = await handleTelegramUpdate(update);
    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    console.error('[telegram] webhook error', err?.message || err);
    // Always return 200 so Telegram does not retry aggressively
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

