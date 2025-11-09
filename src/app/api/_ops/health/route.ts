import mongooseConn from '@/lib/mongoose';
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getRedis } from '@/lib/redis';
import { getTransporter } from '@/server/mail/mailer';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  // Ensure mongoose connection attempt has been made
  try { await mongooseConn; } catch {}
  // DB state
  const dbState = (() => {
    const state = mongoose.connection.readyState;
    const map: Record<number, string> = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
    return { connected: state === 1, state: map[state] || String(state) };
  })();

  // Redis check (best effort)
  let redisOk = false;
  try {
    const redis = getRedis();
    if (redis) {
      const res = await redis.ping();
      redisOk = res?.toString?.().toUpperCase?.() === 'PONG' || !!res;
    }
  } catch {
    redisOk = false;
  }

  // SMTP availability (configuration-based)
  let smtpOk = false;
  try {
    const tx = await getTransporter();
    smtpOk = !!tx;
  } catch {
    smtpOk = false;
  }

  return NextResponse.json({
    services: {
      db: dbState,
      redis: { ok: redisOk },
      smtp: { ok: smtpOk },
    },
    meta: {
      time: new Date().toISOString(),
    }
  }, { headers: { 'Cache-Control': 'no-store' } });
}
