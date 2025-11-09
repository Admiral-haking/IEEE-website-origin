import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/auth/guard';
import { listUsers, createUser } from '@/server/users/service';
import { AppError, UnauthorizedError } from '@/server/errors';
import { CreateUserSchema } from '@/server/users/validators';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || undefined;
    const page = Number(searchParams.get('page') || '1');
    const pageSize = Number(searchParams.get('pageSize') || searchParams.get('limit') || '10');
    const role = searchParams.get('role') || undefined;
    const status = searchParams.get('status') || undefined;
    const data = await listUsers({ q, page, pageSize, role, status });
    return NextResponse.json(data);
  } catch (err: any) {
    if (err?.issues) {
      return NextResponse.json({ errors: err.issues }, { status: 422 });
    }
    const status = err instanceof UnauthorizedError ? 401 : err instanceof AppError ? err.status : 400;
    return NextResponse.json({ error: err.message || 'Bad Request' }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const json = await req.json();
    const input = CreateUserSchema.parse(json);
    const created = await createUser(input);
    return NextResponse.json({ user: created }, { status: 201 });
  } catch (err: any) {
    if (err?.issues) {
      return NextResponse.json({ errors: err.issues }, { status: 422 });
    }
    const status = err instanceof UnauthorizedError ? 401 : err instanceof AppError ? err.status : 400;
    return NextResponse.json({ error: err.message || 'Bad Request' }, { status });
  }
}
