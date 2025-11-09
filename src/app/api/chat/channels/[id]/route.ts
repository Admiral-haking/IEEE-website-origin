import '@/lib/mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { requireRoleOrPermission } from '@/server/auth/guard';
import { AppError } from '@/server/errors';
import Channel from '@/models/Channel';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await requireRoleOrPermission({ minRole: 'executive', permission: 'operations.chatModeration' }); } catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }); }
  try {
    const { id } = await params;
    const json = await req.json();
    const patch: any = {};
    if (json.name !== undefined) patch.name = String(json.name);
    if (json.slug !== undefined) patch.slug = String(json.slug).toLowerCase().replace(/[^a-z0-9-]+/g, '-');
    if (json.tags !== undefined) patch.tags = Array.isArray(json.tags) ? json.tags.map(String) : [];
    if (json.visibleTo !== undefined) {
      const roles: string[] = Array.isArray(json.visibleTo) ? json.visibleTo.map(String) : [];
      const allowed = ['member','volunteer','executive','admin'];
      patch.visibleTo = roles.filter((r: string) => allowed.includes(r));
    }
    let updated;
    try {
      updated = await Channel.findByIdAndUpdate(id, { $set: patch }, { new: true }).lean();
    } catch (e: any) {
      if (e?.code === 11000) return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
      throw e;
    }
    if (!updated) throw new AppError('Not Found', 404);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const status = err instanceof AppError ? err.status : 400;
    return NextResponse.json({ error: err.message || 'Bad Request' }, { status });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await requireRoleOrPermission({ minRole: 'executive', permission: 'operations.chatModeration' }); } catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }); }
  try {
    const { id } = await params;
    const res = await Channel.findByIdAndDelete(id).lean();
    if (!res) throw new AppError('Not Found', 404);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const status = err instanceof AppError ? err.status : 400;
    return NextResponse.json({ error: err.message || 'Bad Request' }, { status });
  }
}
