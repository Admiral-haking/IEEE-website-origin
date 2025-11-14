export type ProviderName = 'openai'|'deepseek';

let aiEnvLoaded = false;

function ensureAIEnvLoaded() {
  if (aiEnvLoaded) return;
  aiEnvLoaded = true;
  try {
    // Lazy-load .env.local at runtime (useful in pm2/prod where env vars are not injected)
    // eslint-disable-next-line global-require
    const fs = require('fs') as typeof import('fs');
    // eslint-disable-next-line global-require
    const path = require('path') as typeof import('path');
    const p = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(p)) {
      const text = fs.readFileSync(p, 'utf8');
      for (const line of text.split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
        if (!m) continue;
        const key = m[1];
        let val = m[2];
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!(key in process.env)) {
          process.env[key] = val;
        }
      }
    }
  } catch {
    // ignore; we fall back to process.env as-is
  }
}

export async function callAI(opts: { provider: ProviderName; model: string; messages: Array<{ role: 'user'|'assistant'|'system'; content: string }> }) {
  ensureAIEnvLoaded();
  if (opts.provider === 'openai') return callOpenAI(opts.model, opts.messages);
  if (opts.provider === 'deepseek') return callDeepSeek(opts.model, opts.messages);
  throw new Error('Unsupported provider');
}

async function callOpenAI(model: string, messages: Array<{ role: string; content: string }>) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');
  const base = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  };
  // Support new project-scoped keys
  if (process.env.OPENAI_PROJECT) headers['OpenAI-Project'] = process.env.OPENAI_PROJECT;
  if (process.env.OPENAI_ORGANIZATION) headers['OpenAI-Organization'] = process.env.OPENAI_ORGANIZATION;
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ model, messages, temperature: 0.7, stream: false })
  });
  if (!res.ok) {
    let detail = '';
    try {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        const j: any = await res.json();
        detail = j?.error?.message || j?.message || JSON.stringify(j);
      } else {
        detail = await res.text();
      }
    } catch {}
    const statusText = (res as any).statusText || '';
    throw new Error(`OpenAI error: ${res.status}${statusText ? ' ' + statusText : ''}${detail ? ' - ' + detail : ''}`);
  }
  const json: any = await res.json();
  const content: string = json?.choices?.[0]?.message?.content || '';
  return content;
}

async function callDeepSeek(model: string, messages: Array<{ role: string; content: string }>) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY not set');
  const base = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, temperature: 0.7, stream: false })
  });
  if (!res.ok) {
    let detail = '';
    try {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        const j: any = await res.json();
        detail = j?.error?.message || j?.message || JSON.stringify(j);
      } else {
        detail = await res.text();
      }
    } catch {}
    const statusText = (res as any).statusText || '';
    throw new Error(`DeepSeek error: ${res.status}${statusText ? ' ' + statusText : ''}${detail ? ' - ' + detail : ''}`);
  }
  const json: any = await res.json();
  const content: string = json?.choices?.[0]?.message?.content || '';
  return content;
}
