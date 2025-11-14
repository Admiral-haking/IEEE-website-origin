import '@/lib/mongoose';
import BlogPost from '@/models/BlogPost';
import { sanitizeRichText } from '@/server/html/sanitize';
import { callAI, type ProviderName } from '@/server/ai/providers';
import { getFeatures } from '@/server/settings/service';
import { saveBase64File } from '@/server/media/gridfs';
import { getBaseUrl } from '@/lib/metadata';

type TelegramMessage = {
  message_id: number;
  text?: string;
  caption?: string;
  photo?: Array<{ file_id: string; width?: number; height?: number }>;
  from?: { id: number; username?: string; first_name?: string; last_name?: string };
  chat?: { id: number; type: string; title?: string; username?: string };
  forward_from_chat?: { id: number; title?: string; username?: string };
  forward_from?: { id: number; username?: string; first_name?: string; last_name?: string };
};

type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
};

type AiNewsPayload = {
  title_en: string;
  excerpt_en?: string;
  content_en: string;
  title_fa: string;
  excerpt_fa?: string;
  content_fa: string;
  slug_en?: string;
  slug_fa?: string;
  tags?: string[];
};

function parseJsonBlock(text: string): any | null {
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return JSON.parse(text);
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

function toSlugBase(input: string): string {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  if (!base) return 'news';
  const parts = base.split('-').filter(Boolean);
  const trimmed = parts.slice(0, 5).join('-');
  return trimmed || 'news';
}

async function ensureUniqueSlug(base: string): Promise<string> {
  let candidate = base;
  let i = 1;
  // BlogPost enforces slug uniqueness globally
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await BlogPost.findOne({ slug: candidate }).select('_id').lean();
    if (!exists) return candidate;
    candidate = `${base}-${++i}`;
  }
}

async function generateNewsImage(prompt: string | undefined | null): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !prompt) return null;
  try {
    const base = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    const model = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';
    const res = await fetch(`${base}/images/generations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt,
        size: '1024x1024',
        n: 1,
        response_format: 'b64_json',
      }),
    });
    if (!res.ok) {
      try {
        const text = await res.text();
        // eslint-disable-next-line no-console
        console.error('[telegram-news] image generation failed', res.status, text);
      } catch {
        // ignore
      }
      return null;
    }
    const json: any = await res.json();
    const b64: string | undefined = json?.data?.[0]?.b64_json;
    if (!b64) return null;
    const saved = await saveBase64File(
      'telegram-news.png',
      'image/png',
      b64,
      { kind: 'blog-cover', source: 'telegram-bot' },
    );
    return String((saved as any)?._id || (saved as any)?.id || '');
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('[telegram-news] image generation error', err?.message || err);
    return null;
  }
}

export type NewsResult = { enId: string; faId: string; slugEn: string; slugFa: string };

export async function generateNewsFromText(
  text: string,
  authorLabel: string,
  coverFileIdOverride?: string | null,
): Promise<NewsResult> {
  const features = await getFeatures();
  if (!features.ai || !(features.ai as any).enabled) {
    throw new Error('AI features disabled');
  }
  const ai = features.ai as any;
  const provider: ProviderName = ai?.provider === 'deepseek' ? 'deepseek' : 'openai';
  const defaults = (ai?.defaultModels || { openai: 'gpt-4o-mini', deepseek: 'deepseek-chat' }) as {
    openai?: string;
    deepseek?: string;
  };
  const model =
    provider === 'deepseek'
      ? (defaults.deepseek || 'deepseek-chat')
      : (defaults.openai || 'gpt-4o-mini');
  const system = `
You are a senior editorial assistant for a bilingual (English/Persian) university technology news website.

Input:
- Raw message from Telegram (can be short, informal, or a forwarded post with captions).

Task:
Produce a structured JSON object with fields:
- title_en: concise, engaging English headline (news style)
- excerpt_en: short English summary (1–3 sentences)
- content_en: well-structured HTML body in English (multiple paragraphs, lists where helpful; use <p>, <ul>, <ol>, <strong>, <em> only)
- title_fa: concise, engaging Persian headline (formal news style)
- excerpt_fa: short Persian summary (1–3 sentences)
- content_fa: well-structured HTML body in Persian, suitable for a university news website
- slug_en: short, URL-safe English slug for the English article (3–5 words, lowercase, hyphen-separated, no locale suffix)
- slug_fa: short, URL-safe English slug describing the Persian article (3–5 words, lowercase, hyphen-separated, related to the Persian content, no locale suffix)
- tags: array of 3–8 English keywords (lowercase) related to topic

Rules:
- Do NOT invent fake facts; infer only what is reasonably implied.
- Headlines must be short and focused:
  - title_en: maximum 8–10 words.
  - title_fa: کوتاه و حداکثر ۱۰ واژه، بدون عبارت‌های طولانی و تکراری.
- Do NOT include prefixes like "news about", "اخبار", "گزارش" یا نام سایت/انجمن در عنوان.
- Expand and polish the text so it reads like a complete news article, not a raw message.
- Keep HTML simple (no scripts, no inline styles, no external resources).
- Do NOT mention or imply that the text was generated or edited by AI.
- Do NOT wrap the JSON in Markdown; return ONLY pure JSON text.
`.trim();

  const raw = await callAI({
    provider,
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: text },
    ],
  });
  const parsed = parseJsonBlock(raw) as AiNewsPayload | null;
  if (!parsed || !parsed.title_en || !parsed.title_fa || !parsed.content_en || !parsed.content_fa) {
    throw new Error('AI returned invalid payload');
  }

  const tags = Array.isArray(parsed.tags)
    ? parsed.tags.map((t) => String(t)).slice(0, 8)
    : [];

  const coverPrompt = `High-quality illustrative image for a technology / university news article titled "${parsed.title_en}". No text in the image.`;
  const autoCoverFileId = await generateNewsImage(coverPrompt);
  // Prefer AI-generated image; fall back to original Telegram photo if AI fails.
  const coverFileId = (autoCoverFileId || coverFileIdOverride) || undefined;

  const slugBaseEn = toSlugBase(parsed.slug_en || parsed.title_en);
  const slugBaseFa = toSlugBase(parsed.slug_fa || parsed.title_fa);
  const slugEn = await ensureUniqueSlug(`${slugBaseEn}-en`);
  const slugFa = await ensureUniqueSlug(`${slugBaseFa}-fa`);

  const now = new Date();

  const en = await BlogPost.create({
    title: parsed.title_en,
    slug: slugEn,
    excerpt: parsed.excerpt_en || '',
    contentHtml: sanitizeRichText(parsed.content_en),
    coverFileId,
    tags,
    published: true,
    author: authorLabel,
    locale: 'en',
    createdAt: now,
    updatedAt: now,
  });

  const fa = await BlogPost.create({
    title: parsed.title_fa,
    slug: slugFa,
    excerpt: parsed.excerpt_fa || '',
    contentHtml: sanitizeRichText(parsed.content_fa),
    coverFileId,
    tags,
    published: true,
    author: authorLabel,
    locale: 'fa',
    createdAt: now,
    updatedAt: now,
  });

  return {
    enId: String((en as any)._id),
    faId: String((fa as any)._id),
    slugEn,
    slugFa,
  };
}

async function sendTelegramMessage(chatId: number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  try {
    const api = process.env.TELEGRAM_API_BASE || 'https://api.telegram.org';
    const res = await fetch(`${api}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    if (!res.ok) {
      // Swallow error to avoid webhook failures
      await res.text().catch(() => {});
    }
  } catch {
    // ignore network errors
  }
}

export async function handleTelegramUpdate(update: TelegramUpdate) {
  const msg = update.message;
  if (!msg) return { skipped: true };

  const baseText = (msg.text && msg.text.trim())
    || (msg.caption && msg.caption.trim())
    || '';
  if (!baseText) return { skipped: true };

  const meta: string[] = [];
  const fwdChat = msg.forward_from_chat;
  const fwdUser = msg.forward_from;
  if (fwdChat) {
    const title = fwdChat.title || fwdChat.username || '';
    if (title) meta.push(`Forwarded from channel: ${title}`);
  } else if (fwdUser) {
    const uname = fwdUser.username || '';
    if (uname) meta.push(`Forwarded from user: @${uname}`);
  }

  const text = meta.length > 0 ? `${meta.join('\n\n')}\n\n${baseText}` : baseText;
  // Ignore commands like /start
  if (!text || text.startsWith('/')) return { skipped: true };

  const allowedChat = process.env.TELEGRAM_ALLOWED_CHAT_ID || process.env.ALLOWED_CHAT_ID;
  if (allowedChat && msg.chat && String(msg.chat.id) !== String(allowedChat)) {
    return { skipped: true };
  }

  const authorLabel = msg.from?.username
    ? `telegram:@${msg.from.username}`
    : msg.from?.first_name
      ? `telegram:${msg.from.first_name} ${msg.from.last_name || ''}`.trim()
      : 'telegram-bot';

  const result = await generateNewsFromText(text, authorLabel);

  try {
    if (msg.chat?.id != null) {
      const base = getBaseUrl();
      const enUrl = `${base}/en/blog/${result.slugEn}`;
      const faUrl = `${base}/fa/blog/${result.slugFa}`;
      const confirmText =
        `خبر شما در سایت منتشر شد:\n` +
        `EN: ${enUrl}\n` +
        `FA: ${faUrl}`;
      await sendTelegramMessage(msg.chat.id, confirmText);
    }
  } catch {
    // ignore notification failures
  }

  return { skipped: false, result };
}
