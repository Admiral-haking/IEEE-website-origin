import { NextRequest, NextResponse } from 'next/server';
import { requireRoleOrPermission } from '@/server/auth/guard';
import { AppError } from '@/server/errors';
import { listSolutions, createSolution } from '@/server/solutions/service';
import { CreateSolutionSchema } from '@/server/solutions/validators';

export async function GET(req: NextRequest) {
  try {
    await requireRoleOrPermission({ minRole: 'executive', permission: 'content.solutions' });
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('q') || undefined;
    const page = Number(url.searchParams.get('page') || '1');
    const pageSize = Number(url.searchParams.get('pageSize') || '10');
    const localeParam = url.searchParams.get('locale');
    const locale = (localeParam === 'fa' ? 'fa' : localeParam === 'en' ? 'en' : undefined) as 'en'|'fa'|undefined;
    const publishedParam = url.searchParams.get('published');
    const published = publishedParam === 'true' ? true : (publishedParam === 'false' ? false : undefined);
    const data = await listSolutions({ q, page, pageSize, locale, published });
    return NextResponse.json(data);
  } catch (err: any) {
    const status = err instanceof AppError ? err.status : 400;
    return NextResponse.json({ error: err.message || 'Bad Request' }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRoleOrPermission({ minRole: 'executive', permission: 'content.solutions' });
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const json = await req.json();
    const input = CreateSolutionSchema.parse(json);
    const created = await createSolution(input);
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    if (err?.issues) return NextResponse.json({ errors: err.issues }, { status: 422 });
    const status = err instanceof AppError ? err.status : 400;
    return NextResponse.json({ error: err.message || 'Bad Request' }, { status });
  }
}
