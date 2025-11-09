import '@/lib/mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromCookies } from '@/server/auth/jwt';
import { markNotificationsRead, markAllNotificationsRead } from '@/server/notifications/service';

export async function PATCH(req: NextRequest) {
  try {
    const token = await getTokenFromCookies();
    const body = await req.json().catch(() => ({}));
    const ids = Array.isArray(body?.ids) ? body.ids.map(String).filter(Boolean) : [];
    if (!ids.length) {
      await markAllNotificationsRead(token.sub);
      return NextResponse.json({ ok: true });
    }
    await markNotificationsRead({ userId: token.sub, ids });
    return NextResponse.json({ ok: true });
  } catch (_err: any) {
    // If unauthenticated or bad request, respond ok to avoid UI noise; no-op
    return NextResponse.json({ ok: true });
  }
}
