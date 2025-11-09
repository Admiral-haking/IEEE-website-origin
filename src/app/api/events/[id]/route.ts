import { NextRequest, NextResponse } from 'next/server';
import { requireRoleAtLeast } from '@/server/auth/guard';
import { AppError } from '@/server/errors';
import { UpdateEventSchema } from '@/server/events/validators';
import { deleteEvent, updateEvent } from '@/server/events/service';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRoleAtLeast('professor');
    const { id } = await params;
    const json = await req.json();
    const input = UpdateEventSchema.parse(json);
    const updated = await updateEvent(id, input as any);
    return NextResponse.json({ event: updated });
  } catch (err: any) {
    const status = err instanceof AppError ? err.status : 400;
    return NextResponse.json({ error: err.message || 'Bad Request' }, { status });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRoleAtLeast('professor');
    const { id } = await params;
    const res = await deleteEvent(id);
    return NextResponse.json(res);
  } catch (err: any) {
    const status = err instanceof AppError ? err.status : 400;
    return NextResponse.json({ error: err.message || 'Bad Request' }, { status });
  }
}

