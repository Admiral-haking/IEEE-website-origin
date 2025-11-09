import '@/lib/mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromCookies } from '@/server/auth/jwt';
import { requireRoleOrPermission } from '@/server/auth/guard';
import Channel from '@/models/Channel';
import { AppError } from '@/server/errors';
import ChannelRead from '@/models/ChannelRead';
import ChannelMessage from '@/models/ChannelMessage';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = url.searchParams.get('q') || '';
  const withCounts = url.searchParams.get('counts') === 'true';
  const query: any = {};
  if (q) {
    const { escapeRegex } = await import('@/lib/regex');
    const rx = new RegExp(escapeRegex(q), 'i');
    query.$or = [{ name: rx }, { tags: rx }];
  }
  const items = await Channel.find(query).sort({ createdAt: -1 }).limit(100).lean();
  let userId: string | null = null;
  if (withCounts) {
    try { const token = await getTokenFromCookies(); userId = token.sub; } catch { userId = null; }
  }
  if (!withCounts || !userId) {
    return NextResponse.json(
      { items: items.map((c: any) => ({ id: String(c._id), name: c.name, slug: c.slug, tags: c.tags || [] })) },
      { headers: { 'Cache-Control': 'private, max-age=0, must-revalidate' } }
    );
  }
  // compute per-channel unread counts (avoid $in casting edge cases)
  const reads = await ChannelRead.find({ userId })
    .select('channelId lastReadAt')
    .lean();
  const lastReadMap = new Map<string, Date>();
  reads.forEach((r: any) => lastReadMap.set(String(r.channelId), r.lastReadAt || new Date(0)));
  const out = await Promise.all(items.map(async (c: any) => {
    const last = lastReadMap.get(String(c._id)) || new Date(0);
    const unread = await ChannelMessage.countDocuments({ channelId: c._id, createdAt: { $gt: last } });
    return { id: String(c._id), name: c.name, slug: c.slug, tags: c.tags || [], unread };
  }));
  return NextResponse.json({ items: out }, { headers: { 'Cache-Control': 'private, max-age=0, must-revalidate' } });
}

export async function POST(req: NextRequest) {
  try { await requireRoleOrPermission({ minRole: 'executive', permission: 'operations.chatModeration' }); } catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }); }
  const token = await getTokenFromCookies();
  const json = await req.json();
  const name = String(json?.name || '').trim();
  const slug = String(json?.slug || '').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-');
  const tags = Array.isArray(json?.tags) ? (json.tags as any[]).map(String) : [];
  if (!name || !slug) throw new AppError('Name and slug required', 422);
  const created = await Channel.create({ name, slug, tags, createdBy: token.sub });
  return NextResponse.json({ id: String(created._id) }, { status: 201 });
}
