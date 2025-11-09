import { NextResponse } from 'next/server';
import { getTokenFromCookies } from '@/server/auth/jwt';
import { AppError, UnauthorizedError } from '@/server/errors';
import '@/lib/mongoose';
import ChatMessage from '@/models/ChatMessage';

export async function GET() {
  try {
    const token = await getTokenFromCookies();
    const role = token.role;
    const limitMap: Record<string, number> = {
      volunteer: Number(process.env.CHAT_LIMIT_MEMBER || 100),
      member: Number(process.env.CHAT_LIMIT_MEMBER || 100),
      executive: Number(process.env.CHAT_LIMIT_PROFESSOR || 300),
      admin: Number(process.env.CHAT_LIMIT_ADMIN || 1000),
    };
    const limit = limitMap[role] ?? Number(process.env.CHAT_LIMIT_USER || 20);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const used = await ChatMessage.countDocuments({ userId: token.sub, role: 'user', createdAt: { $gte: start, $lte: end } });
    const remaining = Math.max(0, limit - used);
    const resetInSeconds = Math.max(0, Math.ceil((end.getTime() - Date.now()) / 1000));
    return NextResponse.json({ limit, used, remaining, resetInSeconds, resetAt: end.toISOString() });
  } catch (err: any) {
    const status = err instanceof AppError ? err.status : err instanceof UnauthorizedError ? 401 : 400;
    return NextResponse.json({ error: err.message || 'Bad Request' }, { status });
  }
}
