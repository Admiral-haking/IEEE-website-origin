import '@/lib/mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromCookies } from '@/server/auth/jwt';
import { AppError } from '@/server/errors';
import Channel from '@/models/Channel';
import ChannelMessage from '@/models/ChannelMessage';
import { incrWithTtl } from '@/lib/redis';

const banned = (process.env.CHAT_BANNED_WORDS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
const ROLE_LIMITS: Record<string, number> = {
  user: Number(process.env.CHAT_LIMIT_USER || 20),
  member: Number(process.env.CHAT_LIMIT_MEMBER || 100),
  volunteer: Number(process.env.CHAT_LIMIT_MEMBER || 100),
  executive: Number(process.env.CHAT_LIMIT_PROFESSOR || 300),
  professor: Number(process.env.CHAT_LIMIT_PROFESSOR || 300),
  admin: Number(process.env.CHAT_LIMIT_ADMIN || 1000)
};

function isInappropriate(text: string) { if (!banned.length) return false; const lower = text.toLowerCase(); return banned.some((w) => w && lower.includes(w)); }
async function takeDaily(userId: string, role: string) {
  const limit = ROLE_LIMITS[role] || 20;
  const key = `rl:chat:${userId}:${new Date().toISOString().slice(0,10)}`;
  try { const out = await incrWithTtl(key, 24 * 60 * 60); if (out) return { ok: out.count <= limit, remaining: Math.max(0, limit - out.count) }; } catch {}
  return { ok: true, remaining: limit };
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const c = await Channel.findById(id).lean();
  if (!c) return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  const items = await ChannelMessage.find({ channelId: id }).sort({ createdAt: 1 }).limit(200).lean();
  return NextResponse.json({ items: items.map((m: any) => ({ id: String(m._id), userId: String(m.userId), content: m.content, createdAt: m.createdAt })) });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = await getTokenFromCookies();
    const { id } = params;
    const c = await Channel.findById(id).lean();
    if (!c) throw new AppError('Not Found', 404);
    const { content } = await req.json();
    const text = String(content || '').trim();
    if (!text) throw new AppError('Empty message', 400);
    if (text.length > 4000) throw new AppError('Message too long', 413);
    if (isInappropriate(text)) throw new AppError('Inappropriate content', 422);
    const ok = await takeDaily(token.sub, token.role);
    if (!ok.ok) return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: { 'Retry-After': '60' } });
    const msg = await ChannelMessage.create({ channelId: id, userId: token.sub, content: text });
    return NextResponse.json({ message: { id: String(msg._id), userId: token.sub, content: text } }, { status: 201 });
  } catch (err: any) {
    const status = err instanceof AppError ? err.status : 400;
    return NextResponse.json({ error: err.message || 'Bad Request' }, { status });
  }
}
