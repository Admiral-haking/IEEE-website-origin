import { NextRequest, NextResponse } from 'next/server';
import { requireRoleOrPermission, requireAuth } from '@/server/auth/guard';
import { AppError } from '@/server/errors';
import { listApplications, applyForMembership } from '@/server/membership/service';
import { getTokenFromCookies } from '@/server/auth/jwt';

export async function GET(req: NextRequest) {
  try { await requireRoleOrPermission({ minRole: 'executive', permission: 'operations.membership' }); } catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }); }
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('q') || undefined;
    const status = url.searchParams.get('status') || undefined;
    const page = Number(url.searchParams.get('page') || '1');
    const pageSize = Number(url.searchParams.get('pageSize') || '10');
    const data = await listApplications({ q: q || undefined, status: status || undefined, page, pageSize });
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err: any) {
    const status = err instanceof AppError ? err.status : 400;
    return NextResponse.json({ error: err.message || 'Bad Request' }, { status });
  }
}

export async function POST(req: NextRequest) {
  try { await requireAuth(); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  try {
    const token = await getTokenFromCookies();
    const json = await req.json();
    const form = (json?.form || {}) as Record<string, any>;
    const created = await applyForMembership(token.sub, form);
    return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
  } catch (err: any) {
    const status = err instanceof AppError ? err.status : 400;
    return NextResponse.json({ error: err.message || 'Bad Request' }, { status });
  }
}
