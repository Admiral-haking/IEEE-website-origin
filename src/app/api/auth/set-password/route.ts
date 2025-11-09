import { NextRequest, NextResponse } from 'next/server';
import { AppError } from '@/server/errors';
import { getTokenFromCookies } from '@/server/auth/jwt';
import '@/lib/mongoose';
import User from '@/models/User';
import { hashPassword } from '@/server/auth/hash';

export async function POST(req: NextRequest) {
  try {
    const token = await getTokenFromCookies();
    const { password } = await req.json();
    const pwd = String(password || '').trim();
    if (pwd.length < 8) throw new AppError('Password too short', 400);
    const passwordHash = await hashPassword(pwd);
    const updated = await User.findByIdAndUpdate(token.sub, { $set: { passwordHash } }, { new: true }).lean();
    if (!updated) throw new AppError('User not found', 404);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const status = err instanceof AppError ? err.status : 400;
    return NextResponse.json({ error: err.message || 'Bad Request' }, { status });
  }
}

