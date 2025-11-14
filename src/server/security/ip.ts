import type { NextRequest } from 'next/server';
import { incrWithTtl } from '@/lib/redis';

const FOREIGN_WINDOW_SEC = Number(process.env.SEC_FOREIGN_WINDOW_SEC || 10 * 60);
const FOREIGN_LIMIT = Number(process.env.SEC_FOREIGN_LIMIT || 20);

type Bucket = { c: number; r: number };
const memForeign = new Map<string, Bucket>();

export function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  const xr = req.headers.get('x-real-ip');
  if (xr) return xr.trim();
  return 'unknown';
}

export function isForeignIp(req: NextRequest): boolean {
  const localCode = (process.env.LOCAL_COUNTRY_CODE || 'IR').toUpperCase();
  const raw =
    req.headers.get('cf-ipcountry') ||
    req.headers.get('x-vercel-ip-country') ||
    '';
  const code = raw.toUpperCase();
  if (!code || code === 'XX' || code === 'T1') return false;
  return code !== localCode;
}

export async function checkStrictForeignRate(ip: string, kind: string) {
  if (!ip || ip === 'unknown') return { ok: true as const };
  const suffix = `${kind}:${ip}`;
  try {
    const key = `rl:foreign:${suffix}`;
    const out = await incrWithTtl(key, FOREIGN_WINDOW_SEC);
    if (out && out.count > FOREIGN_LIMIT) {
      return { ok: false as const, retryAfter: out.ttl ?? FOREIGN_WINDOW_SEC };
    }
    if (out) return { ok: true as const };
  } catch {}
  const now = Date.now();
  const end = now + FOREIGN_WINDOW_SEC * 1000;
  const node = memForeign.get(suffix);
  if (!node || node.r < now) {
    memForeign.set(suffix, { c: 1, r: end });
    return { ok: true as const };
  }
  if (node.c >= FOREIGN_LIMIT) {
    return {
      ok: false as const,
      retryAfter: Math.ceil((node.r - now) / 1000),
    };
  }
  node.c += 1;
  return { ok: true as const };
}

