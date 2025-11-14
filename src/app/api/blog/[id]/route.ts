import { NextRequest, NextResponse } from 'next/server';
import { requireRoleOrPermission } from '@/server/auth/guard';
import { updatePost, deletePost } from '@/server/blog/service';
import { AppError } from '@/server/errors';
import { UpdatePostSchema } from '@/server/blog/validators';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRoleOrPermission({ minRole: 'executive', permission: 'content.blog' });
    const json = await req.json();
    const input = UpdatePostSchema.parse(json);
    const { id } = await params;
    const updated = await updatePost(id, input);
    return NextResponse.json({ post: updated });
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('[api/blog/:id PATCH] error', err);
    const status = err instanceof AppError ? err.status : 400;
    return NextResponse.json({ error: err.message || 'Bad Request' }, { status });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRoleOrPermission({ minRole: 'executive', permission: 'content.blog' });
    const { id } = await params;
    await deletePost(id);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('[api/blog/:id DELETE] error', err);
    const status = err instanceof AppError ? err.status : 400;
    return NextResponse.json({ error: err.message || 'Bad Request' }, { status });
  }
}
