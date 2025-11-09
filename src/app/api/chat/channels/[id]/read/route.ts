import '@/lib/mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromCookies } from '@/server/auth/jwt';
import ChannelRead from '@/models/ChannelRead';

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getTokenFromCookies();
    const { id: channelId } = await params;
    await ChannelRead.updateOne(
      { channelId, userId: token.sub },
      { $set: { lastReadAt: new Date() } },
      { upsert: true }
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
