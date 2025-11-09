import { NextRequest, NextResponse } from 'next/server';
import { requireRoleOrPermission } from '@/server/auth/guard';
import { AppError } from '@/server/errors';
import { reviewApplication } from '@/server/membership/service';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRoleOrPermission({ minRole: 'executive', permission: 'operations.membership' });
  const { id } = await params;
    const body = await req.json();
    const status = String(body?.status || '');
    if (!['reviewed','approved','rejected'].includes(status)) throw new AppError('Invalid status', 422);
    const notes = body?.notes ? String(body.notes) : undefined;
    const res = await reviewApplication(id, status as any, notes);
    return NextResponse.json(res);
  } catch (err: any) {
    const status = err instanceof AppError ? err.status : 400;
    return NextResponse.json({ error: err.message || 'Bad Request' }, { status });
  }
}
