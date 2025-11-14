import '@/lib/mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromCookies } from '@/server/auth/jwt';
import ChatSession from '@/models/ChatSession';
import { AppError } from '@/server/errors';
import { getFeatures } from '@/server/settings/service';
import type { ProviderName } from '@/server/ai/providers';

export async function GET() {
  const f = await getFeatures();
  if (!f.chatEnabled) return NextResponse.json({ error: 'Chat temporarily disabled' }, { status: 503 });
  if (!(f.ai && (f.ai as any).enabled)) return NextResponse.json({ error: 'AI responses disabled' }, { status: 503 });
  try {
    const token = await getTokenFromCookies();
    const items = await ChatSession.find({ userId: token.sub }).sort({ updatedAt: -1 }).lean();
    return NextResponse.json({ items: items.map((s: any) => ({ id: String(s._id), provider: s.provider, model: s.model, title: s.title, createdAt: s.createdAt, updatedAt: s.updatedAt })) });
  } catch (err: any) {
    const status = err instanceof AppError ? err.status : 401;
    return NextResponse.json({ error: err.message || 'Unauthorized' }, { status });
  }
}

export async function POST(req: NextRequest) {
  const f = await getFeatures();
  if (!f.chatEnabled) return NextResponse.json({ error: 'Chat temporarily disabled' }, { status: 503 });
  if (!(f.ai && (f.ai as any).enabled)) return NextResponse.json({ error: 'AI responses disabled' }, { status: 503 });
  try {
    const token = await getTokenFromCookies();
    const { provider, model, title } = await req.json();
    if (!provider || !['openai','deepseek'].includes(provider)) throw new AppError('Invalid provider', 400);
    const allowed = (f.ai as any)?.provider === 'openai' || (f.ai as any)?.provider === 'deepseek' ? [(f.ai as any).provider] : ['openai','deepseek'];
    if (!allowed.includes(provider)) throw new AppError('Provider not allowed', 400);

    // Ensure model is compatible with provider and set defaults
    const p = provider as ProviderName;
    let chosen = String(model || '').trim();
    const defaults = ((f.ai as any)?.defaultModels || { openai: 'gpt-4o-mini', deepseek: 'deepseek-chat' }) as { openai?: string; deepseek?: string };
    if (p === 'openai') {
      const def = defaults.openai || 'gpt-4o-mini';
      if (!chosen || chosen.toLowerCase().startsWith('deepseek')) chosen = def;
    } else if (p === 'deepseek') {
      const validDeepSeek = new Set(['deepseek-chat', 'deepseek-reasoner']);
      const def = defaults.deepseek || 'deepseek-chat';
      if (!chosen || chosen.toLowerCase().startsWith('gpt') || !validDeepSeek.has(chosen)) chosen = def;
    }

    const created = await ChatSession.create({ userId: token.sub, provider: p, model: chosen, title: title || '' });
    return NextResponse.json({ session: { id: String(created._id), provider: p, model: created.model, title: created.title } }, { status: 201 });
  } catch (err: any) {
    const status = err instanceof AppError ? err.status : 400;
    return NextResponse.json({ error: err.message || 'Bad Request' }, { status });
  }
}
