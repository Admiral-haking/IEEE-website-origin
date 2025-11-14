import { NextRequest, NextResponse } from 'next/server';
import '@/lib/mongoose';
import TeamMember from '@/models/TeamMember';
import { escapeRegex } from '@/lib/regex';

// Public team listing (no auth). Mirrors /api/team GET but without guard.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || undefined;
    const locale = searchParams.get('locale') || undefined;
    const page = Number(searchParams.get('page') || '1');
    const pageSize = Number(searchParams.get('pageSize') || '20');
    const query: any = {};
    if (locale) query.locale = locale;
    if (q) {
      const safe = escapeRegex(q);
      query.$or = [
        { name: { $regex: safe, $options: 'i' } },
        { email: { $regex: safe, $options: 'i' } },
        { role: { $regex: safe, $options: 'i' } }
      ];
    }
    const [members, total] = await Promise.all([
      TeamMember.find(query).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
      TeamMember.countDocuments(query)
    ]);
    return NextResponse.json({ items: members.map((m) => ({ ...m, id: String(m._id) })), total, page, pageSize });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 });
  }
}

