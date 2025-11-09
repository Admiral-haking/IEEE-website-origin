import Redis from 'ioredis';

// Keep a single client instance or an explicit null when not configured
let client: Redis | null | undefined;
let clientErrorLogged = false;

// Extremely small in-memory fallback so features work without Redis in dev
const memKV = new Map<string, { value: string; expiresAt: number }>();
const memCounters = new Map<string, { count: number; expiresAt: number }>();

function cleanupMemory() {
  const now = Date.now();
  for (const [k, v] of memKV) if (v.expiresAt && v.expiresAt < now) memKV.delete(k);
  for (const [k, v] of memCounters) if (v.expiresAt && v.expiresAt < now) memCounters.delete(k);
}

export function getRedis(): Redis | null {
  if (client !== undefined) return client as any;
  const url = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL; // optional environments
  if (!url) { client = null; return client; }
  client = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 2 });
  // Avoid noisy "Unhandled error event" logs by handling client errors
  client.on('error', (err) => {
    if (!clientErrorLogged) {
      clientErrorLogged = true;
      console.warn(`[redis] connection issue: ${err?.message || err}`);
    }
  });
  return client;
}

export async function incrWithTtl(key: string, ttlSeconds: number) {
  cleanupMemory();
  const redis = getRedis();
  if (redis) {
    try {
      const count = await redis.incr(key);
      if (count === 1) await redis.expire(key, ttlSeconds);
      const ttl = await redis.ttl(key);
      return { count, ttl };
    } catch (e) {
      // fall through to memory fallback
    }
  }
  const now = Date.now();
  const expiresAt = now + ttlSeconds * 1000;
  const cur = memCounters.get(key);
  if (!cur || cur.expiresAt < now) {
    memCounters.set(key, { count: 1, expiresAt });
    return { count: 1, ttl: ttlSeconds } as any;
  }
  cur.count += 1;
  return { count: cur.count, ttl: Math.max(0, Math.ceil((cur.expiresAt - now) / 1000)) } as any;
}

export async function setEx(key: string, value: string, ttlSeconds: number) {
  cleanupMemory();
  const redis = getRedis();
  if (redis) {
    try {
      await redis.set(key, value, 'EX', ttlSeconds);
      return true;
    } catch (e) {
      // fall through to memory fallback
    }
  }
  memKV.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  return true;
}

export async function getKey(key: string) {
  cleanupMemory();
  const redis = getRedis();
  if (redis) {
    try {
      return await redis.get(key);
    } catch (e) {
      // fall through to memory fallback
    }
  }
  const item = memKV.get(key);
  if (!item) return null as any;
  if (item.expiresAt < Date.now()) { memKV.delete(key); return null as any; }
  return item.value as any;
}

export async function delKey(key: string) {
  cleanupMemory();
  const redis = getRedis();
  if (redis) {
    try {
      await redis.del(key);
      return true;
    } catch (e) {
      // fall through to memory fallback
    }
  }
  memKV.delete(key);
  memCounters.delete(key);
  return true;
}
