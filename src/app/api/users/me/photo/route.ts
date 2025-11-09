import '@/lib/mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromCookies } from '@/server/auth/jwt';
import { AppError } from '@/server/errors';
import { saveBase64File, deleteFile } from '@/server/media/gridfs';
import User from '@/models/User';

const MAX_PROFILE_SIZE_BYTES = Number(process.env.PROFILE_PHOTO_MAX_BYTES || 10 * 1024 * 1024); // 10MB default
const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png'];

export async function POST(req: NextRequest) {
  try {
    const token = await getTokenFromCookies();
    if (!token?.sub) throw new AppError('Unauthorized', 401);

    const formData = await req.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) throw new AppError('No file uploaded', 400);

    const size = file.size;
    if (size <= 0) throw new AppError('Empty file', 400);
    if (size > MAX_PROFILE_SIZE_BYTES) throw new AppError('File too large', 413);

    const contentType = file.type || 'application/octet-stream';
    if (!ALLOWED_CONTENT_TYPES.includes(contentType)) throw new AppError('Unsupported content type', 415);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const fileName = file.name || 'profile.jpg';

    console.info('[upload] profile photo request', { userId: token.sub, size, contentType });

    // Read previous file id (if any) to clean up after successful upload
    const prev = await User.findById(token.sub).select('profile_picture').lean();
    const prevUrl: string = (prev as any)?.profile_picture || '';
    const prevMatch = prevUrl.match(/\/api\/media\/(.+)$/);

    const saved = await saveBase64File(fileName, contentType, base64, { kind: 'profile', userId: token.sub });
    const fileId = String(saved?._id || saved?.id);
    const url = `/api/media/${fileId}`;
    await User.findByIdAndUpdate(token.sub, { $set: { profile_picture: url } }).lean();

    if (prevMatch && prevMatch[1]) {
      try {
        await deleteFile(prevMatch[1]);
        console.info('[upload] removed previous profile photo', { userId: token.sub, fileId: prevMatch[1] });
      } catch (err) {
        console.warn('[upload] failed to delete previous profile photo', { error: err instanceof Error ? err.message : err });
      }
    }

    const res = NextResponse.json({ url, fileId }, { status: 201 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (err: any) {
    console.error('[upload] profile photo failed', { error: err instanceof Error ? err.message : err });
    const status = err?.status || 400;
    return NextResponse.json({ error: err?.message || 'Bad Request' }, { status });
  }
}

export async function DELETE() {
  try {
    const token = await getTokenFromCookies();
    if (!token?.sub) throw new AppError('Unauthorized', 401);
    // Try to delete previously uploaded GridFS file if the URL points to our media endpoint
    const u = await User.findById(token.sub).select('profile_picture').lean();
    const url: string = (u as any)?.profile_picture || '';
    const m = url.match(/\/api\/media\/(.+)$/);
    if (m && m[1]) {
      try { await deleteFile(m[1]); } catch {}
    }
    await User.findByIdAndUpdate(token.sub, { $set: { profile_picture: '' } }).lean();
    const res = NextResponse.json({ ok: true });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (err: any) {
    const status = err?.status || 400;
    return NextResponse.json({ error: err?.message || 'Bad Request' }, { status });
  }
}
