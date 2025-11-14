import { NextRequest, NextResponse } from 'next/server';
import { getFeatures } from '@/server/settings/service';
import { callAI } from '@/server/ai/providers';

export async function POST(req: NextRequest) {
  try {
    const { message, locale } = await req.json();
    const f = await getFeatures();
    if (!(f.ai && (f.ai as any).enabled)) {
      const hint = (locale || '').startsWith('fa')
        ? 'دستیار هوشمند غیر فعال است. لطفا از صفحه سوالات متداول و فرم تماس استفاده کنید.'
        : 'AI assistant is disabled. Please use FAQ and Contact form.';
      return NextResponse.json({ reply: hint });
    }
    const sys = (locale || '').startsWith('fa')
      ? 'شما یک دستیار پشتیبانی هستید. کوتاه، مودب، و مشخص پاسخ بدهید. اگر اطلاعات کافی نیست، درخواست جزئیات بیشتر کنید.'
      : 'You are a helpful support assistant. Respond briefly and clearly. Ask for details if information is insufficient.';
    const provider = ((f.ai as any)?.provider === 'deepseek' ? 'deepseek' : 'openai') as 'openai'|'deepseek';
    const defaults = ((f.ai as any)?.defaultModels || { openai: 'gpt-4o-mini', deepseek: 'deepseek-chat' }) as { openai?: string; deepseek?: string };
    const model = provider === 'openai' ? (defaults.openai || 'gpt-4o-mini') : (defaults.deepseek || 'deepseek-chat');
    const reply = await callAI({ provider, model, messages: [ { role: 'system', content: sys }, { role: 'user', content: String(message || '') } ] as any });
    return NextResponse.json({ reply });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Bad Request' }, { status: 400 });
  }
}
