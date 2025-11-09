import { NextRequest, NextResponse } from 'next/server';
import { requireRoleAtLeast } from '@/server/auth/guard';
import { incrWithTtl } from '@/lib/redis';
import { takeRate } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  try {
    await requireRoleAtLeast('admin');
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const rate = await takeRate(req, 'ops:test-redis', 5, 60);
  if (!rate.ok) return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfter || 60) } });
  const out = await incrWithTtl('rl:test', 30);
  if (out) return NextResponse.json({ redis: true, count: out.count, ttl: out.ttl });
  return NextResponse.json({ redis: false, note: 'No REDIS_URL set; using process memory not supported in this endpoint.' });
}
