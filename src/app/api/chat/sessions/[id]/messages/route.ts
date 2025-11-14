import '@/lib/mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromCookies } from '@/server/auth/jwt';
import ChatSession from '@/models/ChatSession';
import ChatMessage from '@/models/ChatMessage';
import { AppError } from '@/server/errors';
import { callAI } from '@/server/ai/providers';
import { incrWithTtl } from '@/lib/redis';
import { getFeatures } from '@/server/settings/service';

type LimitRole = 'user'|'member'|'professor'|'admin'|'volunteer'|'executive';
const ROLE_LIMITS: Record<LimitRole, number> = {
  user: Number(process.env.CHAT_LIMIT_USER || 20),
  member: Number(process.env.CHAT_LIMIT_MEMBER || 100),
  volunteer: Number(process.env.CHAT_LIMIT_MEMBER || 100),
  executive: Number(process.env.CHAT_LIMIT_PROFESSOR || 300),
  professor: Number(process.env.CHAT_LIMIT_PROFESSOR || 300),
  admin: Number(process.env.CHAT_LIMIT_ADMIN || 1000)
};

const memDaily = new Map<string, { count: number; reset: number }>();

async function takeDaily(userId: string, role: keyof typeof ROLE_LIMITS) {
  const limit = ROLE_LIMITS[role] || 20;
  const key = `rl:chat:${userId}:${new Date().toISOString().slice(0,10)}`;
  try {
    const out = await incrWithTtl(key, 24 * 60 * 60);
    if (out) return { ok: out.count <= limit, remaining: Math.max(0, limit - out.count) };
  } catch {}
  const now = Date.now();
  const ttlMs = 24 * 60 * 60 * 1000;
  const node = memDaily.get(key);
  if (!node || node.reset < now) { memDaily.set(key, { count: 1, reset: now + ttlMs }); return { ok: 1 <= limit, remaining: limit - 1 }; }
  node.count += 1;
  return { ok: node.count <= limit, remaining: Math.max(0, limit - node.count) };
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const f = await getFeatures();
  if (!f.chatEnabled) return NextResponse.json({ error: 'Chat temporarily disabled' }, { status: 503 });
  if (!(f.ai && (f.ai as any).enabled)) return NextResponse.json({ error: 'AI responses disabled' }, { status: 503 });
  try {
    const token = await getTokenFromCookies();
    const { id } = await params;
    const s = await ChatSession.findById(id).lean();
    if (!s || s.userId !== token.sub) throw new AppError('Not Found', 404);
    const items = await ChatMessage.find({ sessionId: id }).sort({ createdAt: 1 }).lean();
    return NextResponse.json({ items: items.map((m: any) => ({ id: String(m._id), role: m.role, content: m.content, createdAt: m.createdAt })) });
  } catch (err: any) {
    const status = err instanceof AppError ? err.status : 401;
    return NextResponse.json({ error: err.message || 'Unauthorized' }, { status });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const f = await getFeatures();
  if (!f.chatEnabled) return NextResponse.json({ error: 'Chat temporarily disabled' }, { status: 503 });
  if (!(f.ai && (f.ai as any).enabled)) return NextResponse.json({ error: 'AI responses disabled' }, { status: 503 });
  try {
    const token = await getTokenFromCookies();
    const { id } = await params;
    const s = await ChatSession.findById(id).lean();
    if (!s || s.userId !== token.sub) throw new AppError('Not Found', 404);
    const { content } = await req.json();
    const text = String(content || '').trim();
    if (isInappropriate(text)) throw new AppError('Inappropriate content', 422);
    if (!text) throw new AppError('Empty message', 400);
    if (text.length > 8000) throw new AppError('Message too long', 413);
    const daily = await takeDaily(token.sub, token.role);
    if (!daily.ok) return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: { 'Retry-After': '60' } });
    const userMsg = await ChatMessage.create({ sessionId: id, userId: token.sub, role: 'user', content: text });
    const history = await ChatMessage.find({ sessionId: id }).sort({ createdAt: 1 }).lean();
    // history already includes the just-created user message; no need to append it again
    const messages = history.map((m: any) => ({ role: m.role, content: m.content }));
    const reply = await callAI({ provider: s.provider as any, model: s.model, messages });
    const assistant = await ChatMessage.create({ sessionId: id, userId: token.sub, role: 'assistant', content: reply });
    await ChatSession.findByIdAndUpdate(id, { $set: { updatedAt: new Date() } }).lean();
    return NextResponse.json({ message: { id: String(assistant._id), role: 'assistant', content: reply } }, { status: 201 });
  } catch (err: any) {
    const status = err instanceof AppError ? err.status : 400;
    return NextResponse.json({ error: err.message || 'Bad Request' }, { status });
  }
}

// Very simple moderation (banned words); can be extended/replaced
const banned = (process.env.CHAT_BANNED_WORDS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
function isInappropriate(text: string) {
  if (!banned.length) return false;
  const lower = text.toLowerCase();
  return banned.some((w) => w && lower.includes(w));
}
