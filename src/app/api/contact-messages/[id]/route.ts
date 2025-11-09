import '@/lib/mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { requireRoleOrPermission } from '@/server/auth/guard';
import ContactMessage from '@/models/ContactMessage';
import { AppError } from '@/server/errors';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await requireRoleOrPermission({ minRole: 'executive', permission: 'operations.contact' }); } catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }); }
  try {
    const { id } = await params;
    const json = await req.json();
    const resolved = Boolean(json?.resolved);
    const doc = await ContactMessage.findByIdAndUpdate(id, { $set: { resolved } }, { new: true }).lean();
    if (!doc) throw new AppError('Not Found', 404);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const status = err instanceof AppError ? err.status : 400;
    return NextResponse.json({ error: err.message || 'Bad Request' }, { status });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await requireRoleOrPermission({ minRole: 'executive', permission: 'operations.contact' }); } catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }); }
  try {
    const { id } = await params;
    const res = await ContactMessage.findByIdAndDelete(id).lean();
    if (!res) throw new AppError('Not Found', 404);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const status = err instanceof AppError ? err.status : 400;
    return NextResponse.json({ error: err.message || 'Bad Request' }, { status });
  }
}
