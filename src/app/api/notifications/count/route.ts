import '@/lib/mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromCookies } from '@/server/auth/jwt';
import { countUnread } from '@/server/notifications/service';

export async function GET(_req: NextRequest) {
  try {
    const token = await getTokenFromCookies();
    const unread = await countUnread(token.sub);
    // Avoid no-store on subrequests to preserve BFCache eligibility
    return NextResponse.json({ unread }, { headers: { 'Cache-Control': 'private, max-age=0, must-revalidate' } });
  } catch {
    // Unauthenticated: return zero to avoid client noise
    return NextResponse.json({ unread: 0 }, { headers: { 'Cache-Control': 'private, max-age=0, must-revalidate' } });
  }
}
