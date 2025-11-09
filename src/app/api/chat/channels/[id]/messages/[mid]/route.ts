import '@/lib/mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { requireRoleOrPermission } from '@/server/auth/guard';
import { AppError } from '@/server/errors';
import ChannelMessage from '@/models/ChannelMessage';

export async function DELETE(_: NextRequest, { params }: { params: { id: string; mid: string } }) {
  try { await requireRoleOrPermission({ minRole: 'executive', permission: 'operations.chatModeration' }); } catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }); }
  try {
    const { id, mid } = params;
    const res = await ChannelMessage.deleteOne({ _id: mid, channelId: id });
    if (!res || res.deletedCount === 0) throw new AppError('Not Found', 404);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const status = err instanceof AppError ? err.status : 400;
    return NextResponse.json({ error: err.message || 'Bad Request' }, { status });
  }
}
