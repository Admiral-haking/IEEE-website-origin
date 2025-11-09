import { NextRequest, NextResponse } from 'next/server';
import { requireRoleOrPermission } from '@/server/auth/guard';
import { AppError } from '@/server/errors';
import { updateSolution, deleteSolution } from '@/server/solutions/service';
import { UpdateSolutionSchema } from '@/server/solutions/validators';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try { await requireRoleOrPermission({ minRole: 'executive', permission: 'content.solutions' }); } catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }); }
  try {
    const { id } = params;
    const json = await req.json();
    const input = UpdateSolutionSchema.parse(json);
    const updated = await updateSolution(id, input);
    return NextResponse.json(updated);
  } catch (err: any) {
    if (err?.issues) return NextResponse.json({ errors: err.issues }, { status: 422 });
    const status = err instanceof AppError ? err.status : 400;
    return NextResponse.json({ error: err.message || 'Bad Request' }, { status });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try { await requireRoleOrPermission({ minRole: 'executive', permission: 'content.solutions' }); } catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }); }
  try {
    const { id } = params;
    const res = await deleteSolution(id);
    return NextResponse.json(res);
  } catch (err: any) {
    const status = err instanceof AppError ? err.status : 400;
    return NextResponse.json({ error: err.message || 'Bad Request' }, { status });
  }
}
