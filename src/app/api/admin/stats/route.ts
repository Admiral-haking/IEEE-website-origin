import '@/lib/mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { requireRoleOrPermission } from '@/server/auth/guard';
import User from '@/models/User';
import ChatMessage from '@/models/ChatMessage';
import LoginEvent from '@/models/LoginEvent';

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

export async function GET(req: NextRequest) {
  try {
    await requireRoleOrPermission({ minRole: 'executive', permission: 'admin.stats' });
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role') || undefined;
    const status = searchParams.get('status') || undefined;
    const days = Math.min(60, Math.max(7, Number(searchParams.get('days') || '14')));

    const userQuery: any = {};
    if (role) userQuery.role = role;
    if (status) userQuery.membership_status = status;

    const [totalUsers, activeUsers, inactiveUsers, membersActive, membersPending, byRole] = await Promise.all([
      User.countDocuments(userQuery),
      User.countDocuments({ ...userQuery, is_active: true }),
      User.countDocuments({ ...userQuery, is_active: false }),
      User.countDocuments({ ...userQuery, membership_status: 'active' }),
      User.countDocuments({ ...userQuery, membership_status: 'pending' }),
      User.aggregate([
        { $match: userQuery },
        { $group: { _id: '$role', c: { $sum: 1 } } },
      ]).then((rows) => Object.fromEntries(rows.map((r: any) => [r._id, r.c])))
    ]);

    // Daily chat counts
    const since = startOfDay(addDays(new Date(), -days + 1));
    const chatDailyRows = await ChatMessage.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { date: '$createdAt', format: '%Y-%m-%d' } }, c: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    const chatMap = new Map<string, number>(chatDailyRows.map((r: any) => [r._id as string, r.c as number]));

    // Daily login counts — approximate using last_login bucket
    let loginRows = await LoginEvent.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { date: '$createdAt', format: '%Y-%m-%d' } }, c: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]).catch(() => [] as any[]);
    if (!loginRows || loginRows.length === 0) {
      loginRows = await User.aggregate([
        { $match: { last_login: { $gte: since }, ...(role ? { role } : {}), ...(status ? { membership_status: status } : {}) } },
        { $group: { _id: { $dateToString: { date: '$last_login', format: '%Y-%m-%d' } }, c: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]);
    }
    const loginMap = new Map<string, number>(loginRows.map((r: any) => [r._id as string, r.c as number]));

    const outDaily: Array<{ d: string; login: number; chat: number }> = [];
    for (let i = days - 1; i >= 0; i--) {
      const day = startOfDay(addDays(new Date(), -i));
      const key = day.toISOString().slice(0, 10);
      outDaily.push({ d: key, login: loginMap.get(key) || 0, chat: chatMap.get(key) || 0 });
    }

    return NextResponse.json({
      summary: {
        users: { total: totalUsers, active: activeUsers, inactive: inactiveUsers },
        membership: { active: membersActive, pending: membersPending },
        byRole,
      },
      daily: outDaily,
      filters: { role: role || null, status: status || null, days },
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err: any) {
    const status = err?.status || 400;
    return NextResponse.json({ error: err?.message || 'Bad Request' }, { status });
  }
}
