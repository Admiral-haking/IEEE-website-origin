import '@/lib/mongoose';
import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { requireRoleAtLeast } from '@/server/auth/guard';

const stateNames: Record<number, string> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
  99: 'uninitialized'
};

export async function GET() {
  // Prevent exposing DB internals publicly
  try {
    await requireRoleAtLeast('admin');
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const readyState = mongoose.connection.readyState;
  const state = stateNames[readyState] || 'unknown';
  let pingMs: number | null = null;
  let pingError: string | null = null;
  const hasUri = Boolean(process.env.MONGODB_URI);
  if (readyState === 1 && mongoose.connection.db) {
    const start = Date.now();
    try {
      await mongoose.connection.db.command({ ping: 1 });
      pingMs = Date.now() - start;
    } catch (err: any) {
      pingError = err?.message || String(err);
    }
  }
  return NextResponse.json({
    readyState,
    state,
    hasUri,
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || null,
    pingMs,
    pingError,
    timestamp: new Date().toISOString()
  });
}
