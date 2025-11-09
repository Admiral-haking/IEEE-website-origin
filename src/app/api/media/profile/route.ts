import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromCookies } from '@/server/auth/jwt';
import { saveBase64File } from '@/server/media/gridfs';
import { AppError } from '@/server/errors';

export async function POST(req: NextRequest) {
  try {
    const token = await getTokenFromCookies();
    if (!token?.sub) throw new AppError('Unauthorized', 401);
    const { name, contentType, data } = await req.json();
    if (typeof data !== 'string') throw new AppError('Invalid payload', 400);
    const maxBytes = 10 * 1024 * 1024; // 10 MB for profile per requirement
    const size = Buffer.byteLength(data, 'base64');
    if (size > maxBytes) throw new AppError('File too large', 413);
    const allowed = ['image/'];
    if (!allowed.some((p) => String(contentType || '').startsWith(p))) throw new AppError('Unsupported content type', 415);
    const file = await saveBase64File(name || 'profile.jpg', contentType || 'image/*', data, { kind: 'profile', userId: token.sub });
    return NextResponse.json({ file }, { status: 201 });
  } catch (err: any) {
    const status = err?.status || 400;
    return NextResponse.json({ error: err?.message || 'Bad Request' }, { status });
  }
}
