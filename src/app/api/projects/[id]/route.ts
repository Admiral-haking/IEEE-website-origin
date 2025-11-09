import '@/lib/mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromCookies } from '@/server/auth/jwt';
import { requireRoleOrPermission } from '@/server/auth/guard';
import { AppError } from '@/server/errors';
import Project from '@/models/Project';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const p = await Project.findById(id).lean();
  if (!p || !p.published) return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  return NextResponse.json({ project: { id: String(p._id), title: p.title, description: p.description, tags: p.tags || [], status: p.status, team_members: (p.team_members || []).map((id: any) => String(id)), createdBy: String(p.createdBy), locale: p.locale, published: !!p.published, createdAt: p.createdAt } });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = await getTokenFromCookies();
    const { id } = params;
    const p = await Project.findById(id).lean();
    if (!p) throw new AppError('Not Found', 404);
    const isOwner = String(p.createdBy) === token.sub;
    try { await requireRoleOrPermission({ minRole: 'executive', permission: 'content.projects' }); } catch { if (!isOwner) throw new AppError('Forbidden', 403); }
    const json = await req.json();
    const patch: any = {};
    if (json.title !== undefined) patch.title = String(json.title);
    if (json.description !== undefined) patch.description = String(json.description);
    if (json.tags !== undefined) patch.tags = Array.isArray(json.tags) ? json.tags.map(String) : [];
    if (json.status !== undefined) patch.status = String(json.status);
    if (json.team_members !== undefined) patch.team_members = Array.isArray(json.team_members) ? json.team_members.map(String) : [];
    if (json.published !== undefined) patch.published = !!json.published;
    await Project.findByIdAndUpdate(id, { $set: patch }, { new: true }).lean();
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const status = err instanceof AppError ? err.status : 400;
    return NextResponse.json({ error: err.message || 'Bad Request' }, { status });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = await getTokenFromCookies();
  const { id } = params;
    const p = await Project.findById(id).lean();
    if (!p) throw new AppError('Not Found', 404);
    const isOwner = String(p.createdBy) === token.sub;
    try { await requireRoleOrPermission({ minRole: 'executive', permission: 'content.projects' }); } catch { if (!isOwner) throw new AppError('Forbidden', 403); }
    await Project.findByIdAndDelete(id).lean();
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const status = err instanceof AppError ? err.status : 400;
    return NextResponse.json({ error: err.message || 'Bad Request' }, { status });
  }
}
