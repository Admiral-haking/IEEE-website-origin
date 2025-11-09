import '@/lib/mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromCookies } from '@/server/auth/jwt';
import { listNotifications } from '@/server/notifications/service';

export async function GET(req: NextRequest) {
  try {
    const token = await getTokenFromCookies();
    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const limit = Number(searchParams.get('limit') || '20');
    const cursor = searchParams.get('cursor') || undefined;
    const data = await listNotifications({ userId: token.sub, unreadOnly, limit, cursor });
    // Avoid no-store so BFCache isn’t disabled by subrequests.
    return NextResponse.json(data, { headers: { 'Cache-Control': 'private, max-age=0, must-revalidate' } });
  } catch (_err: any) {
    // If unauthenticated, return an empty list with 200 to avoid noisy client errors
    return NextResponse.json({ items: [], nextCursor: null }, { headers: { 'Cache-Control': 'private, max-age=0, must-revalidate' } });
  }
}
