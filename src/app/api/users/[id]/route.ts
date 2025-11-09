import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requireAuth } from '@/server/auth/guard';
import { updateUser, deleteUser } from '@/server/users/service';
import { AppError, UnauthorizedError } from '@/server/errors';
import { UpdateUserSchema, ProfileRequiredSchema } from '@/server/users/validators';
import User from '@/models/User';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = await requireAuth();
    const jsonRaw = await req.json();
    // prune empty strings to avoid failing optional validators / casts
    const json: any = { ...jsonRaw };
    Object.keys(json).forEach((k) => { if (json[k] === '' || json[k] === null) delete json[k]; });
    if (typeof json.username === 'string' && json.username.trim() === '') delete json.username;
    if (typeof json.email === 'string' && json.email.trim() === '') delete json.email;
    const { id } = params;
    const isSelf = String(token.sub) === id;
    const input: any = isSelf && token.role !== 'admin' ? ProfileRequiredSchema.parse(json) : UpdateUserSchema.parse(json);
    if (String(token.sub) !== id) {
      // Only admin can update others
      await requireAdmin();
    } else {
      // prevent self from editing IEEE ID
      if (typeof input.ieee_membership_id !== 'undefined') delete input.ieee_membership_id;
    }
    const updated = await updateUser(id, input);
    return NextResponse.json({ user: updated });
  } catch (err: any) {
    if (err?.issues) {
      return NextResponse.json({ errors: err.issues }, { status: 422 });
    }
    const status = err instanceof UnauthorizedError ? 401 : err instanceof AppError ? err.status : 400;
    return NextResponse.json({ error: err.message || 'Bad Request' }, { status });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const { id } = params;
    await deleteUser(id);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err?.issues) {
      return NextResponse.json({ errors: err.issues }, { status: 422 });
    }
    const status = err instanceof AppError ? err.status : 400;
    return NextResponse.json({ error: err.message || 'Bad Request' }, { status });
  }
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = await requireAuth();
    const { id } = params;
    if (String(token.sub) !== id) {
      await requireAdmin();
    }
    const user = await User.findById(id).lean();
    if (!user) throw new AppError('User not found', 404);
    return NextResponse.json({ user: { ...user, id: String(user._id) } });
  } catch (err: any) {
    const status = err instanceof AppError ? err.status : err instanceof UnauthorizedError ? 401 : 400;
    return NextResponse.json({ error: err.message || 'Bad Request' }, { status });
  }
}
