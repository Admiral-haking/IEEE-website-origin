import '@/lib/mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromCookies } from '@/server/auth/jwt';
import { AppError } from '@/server/errors';
import Project from '@/models/Project';
import { addPoints } from '@/server/reputation/service';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('q') || '';
    const locale = (url.searchParams.get('locale') === 'fa' ? 'fa' : 'en') as 'en'|'fa';
    const page = Math.max(1, Number(url.searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize') || '20')));
    const mine = url.searchParams.get('mine') === 'true';
    let createdBy: string | null = null;
    if (mine) {
      try { const token = await getTokenFromCookies(); createdBy = token.sub; } catch { createdBy = null; }
      if (!createdBy) return NextResponse.json({ items: [], total: 0, page, pageSize });
    }
    const query: any = mine ? { createdBy } : { locale, published: true };
    if (q) {
      const { escapeRegex } = await import('@/lib/regex');
      const rx = new RegExp(escapeRegex(q), 'i');
      query.$or = [{ title: rx }, { description: rx }, { tags: rx }];
    }
    const sortParam = url.searchParams.get('sort') || '';
    let sort: any = { createdAt: -1 };
    if (sortParam) {
      const [f, d] = sortParam.split(':');
      if (f) sort = { [f]: (String(d).toLowerCase() === 'asc' ? 1 : -1) };
    }
    const [items, total] = await Promise.all([
      Project.find(query).sort(sort).skip((page - 1) * pageSize).limit(pageSize).lean(),
      Project.countDocuments(query)
    ]);
    const safe = items.map((p: any) => ({ id: String(p._id), title: p.title, description: p.description, tags: p.tags || [], status: p.status, team_members: (p.team_members || []).map((id: any) => String(id)), createdBy: String(p.createdBy), locale: p.locale, published: !!p.published, createdAt: p.createdAt }));
    return NextResponse.json({ items: safe, total, page, pageSize });
  } catch (err: any) {
    const status = err instanceof AppError ? err.status : 400;
    return NextResponse.json({ error: err.message || 'Bad Request' }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getTokenFromCookies();
    const json = await req.json();
    const title = String(json?.title || '').trim();
    const description = String(json?.description || '').trim();
    const tags = Array.isArray(json?.tags) ? (json.tags as any[]).map(String).filter(Boolean) : [];
    const status = (json?.status as string) || 'open';
    const team = Array.isArray(json?.team_members) ? (json.team_members as any[]).map(String).filter(Boolean) : [];
    const locale = (json?.locale === 'fa' ? 'fa' : 'en') as 'en'|'fa';
    if (!title) throw new AppError('Title is required', 422);
    const created = await Project.create({ title, description, tags, status, team_members: team, createdBy: token.sub, locale, published: true });
    try { await addPoints(token.sub, 20, 'Created a project'); } catch {}
    return NextResponse.json({ id: String(created._id) }, { status: 201 });
  } catch (err: any) {
    const status = err instanceof AppError ? err.status : 400;
    return NextResponse.json({ error: err.message || 'Bad Request' }, { status });
  }
}
