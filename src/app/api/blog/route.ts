import { NextRequest, NextResponse } from 'next/server';
import { requireRoleOrPermission } from '@/server/auth/guard';
import { listPosts, createPost } from '@/server/blog/service';
import { AppError } from '@/server/errors';
import { CreatePostSchema } from '@/server/blog/validators';

export async function GET(req: NextRequest) {
  try {
    await requireRoleOrPermission({ minRole: 'executive', permission: 'content.blog' });
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || undefined;
    const page = Number(searchParams.get('page') || '1');
    const pageSize = Number(searchParams.get('pageSize') || '10');
    const locale = (searchParams.get('locale') as 'en'|'fa') || undefined;
    const data = await listPosts({ q, page, pageSize, locale });
    return NextResponse.json(data);
  } catch (err: any) {
    const status = err instanceof AppError ? err.status : 400;
    return NextResponse.json({ error: err.message || 'Bad Request' }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRoleOrPermission({ minRole: 'executive', permission: 'content.blog' });
    const json = await req.json();
    const input = CreatePostSchema.parse(json);
    const created = await createPost(input);
    return NextResponse.json({ post: created }, { status: 201 });
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('[api/blog POST] error', err);
    const status = err instanceof AppError ? err.status : 400;
    return NextResponse.json({ error: err.message || 'Bad Request' }, { status });
  }
}
