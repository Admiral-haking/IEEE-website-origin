import '@/lib/mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromCookies } from '@/server/auth/jwt';
import { markNotificationRead, deleteNotification } from '@/server/notifications/service';

export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = await getTokenFromCookies();
    await markNotificationRead(token.sub, params.id);
    return NextResponse.json({ ok: true });
  } catch {
    // no-op for unauthenticated to avoid client noise
    return NextResponse.json({ ok: true });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = await getTokenFromCookies();
    await deleteNotification(token.sub, params.id);
    return NextResponse.json({ ok: true });
  } catch {
    // no-op for unauthenticated to avoid client noise
    return NextResponse.json({ ok: true });
  }
}

