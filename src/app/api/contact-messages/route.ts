import '@/lib/mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { requireRoleOrPermission } from '@/server/auth/guard';
import ContactMessage from '@/models/ContactMessage';

export async function GET(req: NextRequest) {
  try { await requireRoleOrPermission({ minRole: 'executive', permission: 'operations.contact' }); } catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }); }
  const url = new URL(req.url);
  const q = url.searchParams.get('q') || '';
  const resolvedParam = url.searchParams.get('resolved');
  const page = Math.max(1, Number(url.searchParams.get('page') || '1'));
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize') || '20')));
  const query: any = {};
  if (resolvedParam === 'true') query.resolved = true;
  else if (resolvedParam === 'false') query.resolved = false;
  if (q) {
    const { escapeRegex } = await import('@/lib/regex');
    const rx = new RegExp(escapeRegex(q), 'i');
    query.$or = [ { name: rx }, { email: rx }, { subject: rx }, { message: rx } ];
  }
  const [items, total] = await Promise.all([
    ContactMessage.find(query).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
    ContactMessage.countDocuments(query)
  ]);
  const safe = items.map((m: any) => ({ id: String(m._id), name: m.name, email: m.email, phone: m.phone, subject: m.subject, message: m.message, locale: m.locale, resolved: !!m.resolved, createdAt: m.createdAt }));
  return NextResponse.json({ items: safe, total, page, pageSize }, { headers: { 'Cache-Control': 'private, max-age=0, must-revalidate' } });
}
