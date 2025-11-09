import { NextRequest } from 'next/server';
import { incrWithTtl } from '@/lib/redis';

const memory = new Map<string, { count: number; reset: number }>();

export async function takeRate(req: NextRequest, bucket: string, limit: number, windowSec: number) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const key = `rl:${bucket}:${ip}`;
  try {
    const out = await incrWithTtl(key, windowSec);
    if (out) {
      const { count, ttl } = out as { count: number; ttl: number };
      return { ok: count <= limit, retryAfter: count > limit ? (ttl > 0 ? ttl : 60) : undefined };
    }
  } catch {}
  const now = Date.now();
  const slot = memory.get(key);
  if (!slot || slot.reset < now) { memory.set(key, { count: 1, reset: now + windowSec * 1000 }); return { ok: true }; }
  if (slot.count >= limit) return { ok: false, retryAfter: Math.ceil((slot.reset - now) / 1000) };
  slot.count += 1; return { ok: true };
}

