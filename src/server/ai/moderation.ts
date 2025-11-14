export type ModerationResult = { allowed: boolean; reason?: string };

const blacklist = [
  'viagra','casino','loan','xxx','porn','hate','terror','kill','fraud','scam'
];

export async function moderateText(text: string, locale: 'en'|'fa' = 'en'): Promise<ModerationResult> {
  try {
    // Basic heuristic fallback
    const lower = text.toLowerCase();
    if (blacklist.some(w => lower.includes(w))) return { allowed: false, reason: 'Contains prohibited content' };

    // Optional provider via environment
    const url = process.env.AI_MODERATION_URL;
    const key = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
    if (!url && !key) return { allowed: true };

    if (url) {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(key ? { Authorization: `Bearer ${key}` } : {}) }, body: JSON.stringify({ text, locale }) });
      const data = await res.json().catch(() => ({}));
      if (res.ok) return data as ModerationResult;
      return { allowed: true };
    }

    // Example OpenAI moderation v1 if OPENAI_API_KEY provided
    const res = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: 'omni-moderation-latest', input: text })
    });
    const data = await res.json();
    const flagged = Boolean(data?.results?.[0]?.flagged);
    return flagged ? { allowed: false, reason: 'Flagged by moderation' } : { allowed: true };
  } catch {
    return { allowed: true };
  }
}

