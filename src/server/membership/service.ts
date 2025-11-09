import '@/lib/mongoose';
import MembershipApplication from '@/models/MembershipApplication';
import User from '@/models/User';
import { AppError } from '@/server/errors';
import { createNotification } from '@/server/notifications/service';
import { addPoints, awardBadge } from '@/server/reputation/service';

export async function applyForMembership(userId: string, form: Record<string, any>) {
  // Use $or instead of $in to avoid CastError edge-cases on some Mongoose versions
  const existing = await MembershipApplication.findOne({
    userId,
    $or: [ { status: 'pending' }, { status: 'reviewed' } ]
  }).sort({ createdAt: -1 }).lean();
  // Return a stable error code string so clients can localize
  if (existing) throw new AppError('membership_already_in_review', 409);
  const created = await MembershipApplication.create({ userId, form, status: 'pending' });
  await User.findByIdAndUpdate(userId, { $set: { membership_status: 'pending' } }).lean();
  return { id: String(created._id) };
}

export async function listApplications(opts: { q?: string; status?: string; page?: number; pageSize?: number }) {
  const page = Math.max(1, opts.page || 1);
  const pageSize = Math.min(100, Math.max(1, opts.pageSize || 10));
  const query: any = {};
  if (opts.status) {
    const raw = String(opts.status);
    if (raw === 'open') {
      query.$or = [{ status: 'pending' }, { status: 'reviewed' }];
    } else if (raw.includes(',')) {
      const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
      if (parts.length > 1) query.$or = parts.map((s) => ({ status: s }));
      else if (parts.length === 1) query.status = parts[0];
    } else {
      query.status = raw;
    }
  }
  const [items, total] = await Promise.all([
    MembershipApplication.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      // include full_name so FA locale can render Persian full name
      .populate('userId', 'email name full_name username')
      .lean(),
    MembershipApplication.countDocuments(query)
  ]);
  const safeItems = items.map((a: any) => {
    const u = a.userId && typeof a.userId === 'object' ? a.userId : null;
    const user = u ? { id: String(u._id), email: u.email, name: u.name, full_name: (u as any).full_name, username: u.username } : undefined;
    return {
      id: String(a._id),
      userId: String(u?._id || a.userId),
      user,
      status: a.status,
      form: a.form,
      notes: a.notes,
      createdAt: a.createdAt,
    };
  });
  return { items: safeItems, total, page, pageSize };
}

export async function reviewApplication(id: string, status: 'reviewed'|'approved'|'rejected', notes?: string) {
  const app = await MembershipApplication.findById(id).lean();
  if (!app) throw new AppError('Application not found', 404);
  await MembershipApplication.findByIdAndUpdate(id, { $set: { status, notes } }).lean();
  if (status === 'approved') {
    await User.findByIdAndUpdate(app.userId, { $set: { membership_status: 'active' } }).lean();
    await createNotification({ userId: String(app.userId), type: 'membership:approved', title: 'Membership approved', body: 'Your membership application has been approved.', channels: ['app','email'] });
    try { await addPoints(String(app.userId), 50, 'Membership approved'); await awardBadge(String(app.userId), 'Certified Member'); } catch {}
  } else if (status === 'rejected') {
    await User.findByIdAndUpdate(app.userId, { $set: { membership_status: 'rejected' } }).lean();
    await createNotification({ userId: String(app.userId), type: 'membership:rejected', title: 'Membership rejected', body: 'Your membership application was rejected.', channels: ['app','email'] });
  } else {
    await User.findByIdAndUpdate(app.userId, { $set: { membership_status: 'reviewed' } }).lean();
  }
  return { ok: true };
}
