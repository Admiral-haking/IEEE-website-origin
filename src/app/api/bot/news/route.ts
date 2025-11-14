import '@/lib/mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { generateNewsFromText } from '@/server/news/telegram';
import { getBaseUrl } from '@/lib/metadata';
import { saveBase64File } from '@/server/media/gridfs';

async function saveTelegramPhoto(body: any): Promise<string | null> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;

  const photoObj =
    body?.photo ||
    (Array.isArray(body?.photos) && body.photos.length > 0 ? body.photos[body.photos.length - 1] : null);

  const fileId: string | undefined = photoObj?.file_id || photoObj?.fileId;
  if (!fileId) return null;

  try {
    // eslint-disable-next-line no-console
    console.log('[bot-news] saveTelegramPhoto fileId', fileId);
    const apiBase = process.env.TELEGRAM_API_BASE || 'https://api.telegram.org';
    const fileRes = await fetch(
      `${apiBase}/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`,
      { cache: 'no-store' },
    );
    if (!fileRes.ok) {
      await fileRes.text().catch(() => {});
      return null;
    }
    const fileJson: any = await fileRes.json();
    const filePath: string | undefined = fileJson?.result?.file_path;
    if (!filePath) return null;

    const fileUrl = `${apiBase}/file/bot${token}/${filePath}`;
    const imgRes = await fetch(fileUrl, { cache: 'no-store' });
    if (!imgRes.ok) {
      await imgRes.arrayBuffer().catch(() => {});
      return null;
    }
    const buf = Buffer.from(await imgRes.arrayBuffer());
    const base64 = buf.toString('base64');

    const lower = filePath.toLowerCase();
    const ext = lower.split('.').pop() || 'jpg';
    const contentType =
      ext === 'png'
        ? 'image/png'
        : ext === 'webp'
          ? 'image/webp'
          : ext === 'gif'
            ? 'image/gif'
            : 'image/jpeg';

    const saved = await saveBase64File(
      `telegram-original.${ext}`,
      contentType,
      base64,
      { kind: 'blog-cover-original', source: 'telegram-bot', filePath },
    );
    const id = String((saved as any)?._id || (saved as any)?.id || '');
    // eslint-disable-next-line no-console
    console.log('[bot-news] saveTelegramPhoto stored', id, filePath);
    return id;
  } catch (err) {
    console.error('[bot-news] saveTelegramPhoto error', (err as any)?.message || err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  const secretFromHeader = req.headers.get('x-telegram-bot-api-secret-token');

  if (!expected || secretFromHeader !== expected) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  let text = (body?.text ?? '').trim();
  if (!text || typeof text !== 'string' || text.startsWith('/')) {
    return NextResponse.json({ ok: false, skipped: true }, { status: 200 });
  }

  const from = body?.from ?? {};
  const chat = body?.chat ?? {};

  const authorLabel = from?.username
    ? `telegram:@${from.username}`
    : from?.first_name
      ? `telegram:${from.first_name} ${from.last_name || ''}`.trim()
      : 'telegram-bot';

  try {
    const originalCoverFileId = await saveTelegramPhoto(body);
    const result = await generateNewsFromText(text, authorLabel, originalCoverFileId || undefined);
    const base = getBaseUrl();
    const enUrl = `${base}/en/blog/${result.slugEn}`;
    const faUrl = `${base}/fa/blog/${result.slugFa}`;

    return NextResponse.json({
      ok: true,
      result,
      coverFileId: originalCoverFileId || null,
      enUrl,
      faUrl,
      chatId: chat?.id ?? null,
    });
  } catch (err: any) {
    console.error('[bot-news] error', err?.message || err);
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 });
  }
}
