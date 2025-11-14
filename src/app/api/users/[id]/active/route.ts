import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/auth/guard';
import { AppError } from '@/server/errors';
import { updateUser } from '@/server/users/service';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const json = await req.json();
    if (typeof json?.is_active !== 'boolean') {
      throw new AppError('Invalid payload', 400);
    }
    const updated = await updateUser(id, { is_active: json.is_active } as any);
    return NextResponse.json({ user: updated });
  } catch (err: any) {
    if (err?.issues) {
      return NextResponse.json({ errors: err.issues }, { status: 422 });
    }
    const status = err instanceof AppError ? err.status : 400;
    return NextResponse.json({ error: err.message || 'Bad Request' }, { status });
  }
}

