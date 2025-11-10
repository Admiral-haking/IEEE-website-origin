import '@/lib/mongoose';
import User from '@/models/User';
import mongoose from 'mongoose';
import { AppError } from '@/server/errors';
import { CreateUserInput, UpdateUserInput } from './validators';
import { hashPassword } from '@/server/auth/hash';
import { generateEmailVerificationArtifacts, normalizeLocale } from '@/server/auth/service';
import { sendEmailVerificationEmail } from '@/server/mail/mailer';
import { createNotification } from '@/server/notifications/service';

export async function listUsers(opts: { q?: string; page?: number; pageSize?: number; role?: string; status?: string; limit?: number }) {
  const page = Math.max(1, opts.page || 1);
  const pageSize = Math.min(100, Math.max(1, opts.limit || opts.pageSize || 10));
  const query: any = {};
  if (opts.q) {
    const { escapeRegex } = await import('@/lib/regex');
    const safe = escapeRegex(opts.q);
    const rx = new RegExp(safe, 'i');
    const looksEmail = /@/.test(opts.q);
    const ors: any[] = [
      { name: rx },
      { full_name: rx },
      { email: rx },
    ];
    if (!looksEmail) ors.push({ username: rx });
    query.$or = ors;
  }
  if (opts.role) query.role = opts.role;
  if (opts.status) query.membership_status = opts.status;

  const [items, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
    User.countDocuments(query)
  ]);
  const safe = items.map((u: any) => ({
    id: String(u._id),
    email: u.email,
    name: u.name,
    full_name: u.full_name,
    username: u.username,
    role: u.role,
    phone: u.phone,
    university: u.university,
    
    major: u.major,
    degree: u.degree,
    sub_disciplines: u.sub_disciplines,
    membership_status: u.membership_status,
    createdAt: u.createdAt,
  }));
  return { items: safe, total, page, pageSize };
}

export async function createUser(input: CreateUserInput) {
  const email = input.email.toLowerCase();
  const username = input.username?.toLowerCase();
  const phone = (input as any).phone ? String((input as any).phone) : undefined;
  const dup = await User.findOne({ $or: [ { email }, ...(username ? [{ username }] : []), ...(phone ? [{ phone }] : []) ] }).lean();
  if (dup) throw new AppError('Email, username or phone already exists', 409);
  const passwordHash = await hashPassword(input.password);
  const created = await User.create({
    email,
    name: input.name || input.full_name,
    full_name: input.full_name || input.name,
    username,
    phone,
    passwordHash,
    role: input.role,
    membership_status: input.membership_status,
    emailVerified: true,
    emailVerifiedAt: new Date(),
  });
  return { id: String(created._id), email: created.email, name: created.name, role: created.role, createdAt: created.createdAt };
}

export async function updateUser(id: string, input: UpdateUserInput) {
  try {
    const oid = (() => { try { return new mongoose.Types.ObjectId(id); } catch { return null as any; } })();
    if (!oid) throw new AppError('User not found', 404);
    const current = await User.findById(oid).select('+emailVerificationTokenHash +emailVerificationTokenExpires').lean();
    if (!current) throw new AppError('User not found', 404);

    const doc: any = {};
    const locale = normalizeLocale((input as any).locale);
    if ((input as any).locale !== undefined) delete (input as any).locale;

    if (input.name !== undefined) doc.name = input.name;
    if (input.full_name !== undefined) doc.full_name = input.full_name;
    if (input.username !== undefined) {
      const nextUsername = input.username.toLowerCase();
      if (nextUsername !== (current.username || '')) doc.username = nextUsername;
    }
    if (input.role !== undefined) doc.role = input.role;
    if ((input as any).phone !== undefined) doc.phone = (input as any).phone;
    if ((input as any).student_id !== undefined) doc.student_id = (input as any).student_id;

    if (input.membership_status !== undefined) doc.membership_status = input.membership_status;
    if ((input as any).major !== undefined) doc.major = (input as any).major;
    if ((input as any).degree !== undefined) doc.degree = (input as any).degree;
    if ((input as any).sub_disciplines !== undefined) doc.sub_disciplines = (input as any).sub_disciplines;
    if ((input as any).social_links !== undefined) doc.social_links = (input as any).social_links;
    if ((input as any).projects !== undefined) doc.projects = (input as any).projects;
    if ((input as any).certificates !== undefined) doc.certificates = (input as any).certificates;
    if ((input as any).bio !== undefined) doc.bio = (input as any).bio;
    if ((input as any).profile_picture !== undefined) doc.profile_picture = (input as any).profile_picture;
    if ((input as any).permissions !== undefined) doc.permissions = (input as any).permissions;

    let verificationToken: string | null = null;
    if (input.email !== undefined) {
      const nextEmail = input.email.toLowerCase();
      if (nextEmail !== current.email) {
        const artifacts = generateEmailVerificationArtifacts();
        doc.email = nextEmail;
        doc.emailVerified = false;
        doc.emailVerifiedAt = undefined;
        doc.emailVerificationTokenHash = artifacts.hash;
        doc.emailVerificationTokenExpires = artifacts.expires;
        verificationToken = artifacts.token;
      }
    }

    // enforce fixed university and derive entry_year from student_id
    doc.university = 'Quchan University of Technology';
    if ((input as any).student_id) {
      const sid = String((input as any).student_id);
      let year: number | undefined;
      const three = parseInt(sid.slice(0, 3), 10);
      if (!Number.isNaN(three) && three >= 400 && three <= 499) {
        year = 1000 + three; // 402 => 1402
      } else {
        const two = parseInt(sid.slice(0, 2), 10);
        if (!Number.isNaN(two)) year = 1300 + two; // 99 => 1399
      }
      if (year) doc.entry_year = year;
    }
    if (input.password) doc.passwordHash = await hashPassword(input.password);

    if (doc.email) {
      const dup = await User.findOne({ email: doc.email }).select('_id').lean();
      if (dup && String((dup as any)._id) !== String(oid)) throw new AppError('Email already exists', 409);
    }
    if (doc.username) {
      const dupU = await User.findOne({ username: doc.username }).select('_id').lean();
      if (dupU && String((dupU as any)._id) !== String(oid)) throw new AppError('Username already exists', 409);
    }
    if (doc.student_id) {
      const dupS = await User.findOne({ student_id: doc.student_id }).select('_id').lean();
      if (dupS && String((dupS as any)._id) !== String(oid)) throw new AppError('Student ID already exists', 409);
    }
    if (doc.phone) {
      const dupP = await User.findOne({ phone: doc.phone }).select('_id').lean();
      if (dupP && String((dupP as any)._id) !== String(oid)) throw new AppError('Phone already exists', 409);
    }

    const updated = await User.findByIdAndUpdate(oid, { $set: doc }, { new: true }).lean();
    if (!updated) throw new AppError('User not found', 404);

    if (verificationToken) {
      let sent = false;
      try {
        sent = await sendEmailVerificationEmail({
          email: String(updated.email),
          name: (updated as any).name ? String((updated as any).name) : undefined,
          token: verificationToken,
          locale,
        });
      } catch {
        sent = false;
      }
      if (!sent) {
        await User.findByIdAndUpdate(oid, {
          $set: {
            email: current.email,
            emailVerified: current.emailVerified ?? false,
            emailVerifiedAt: current.emailVerifiedAt,
            emailVerificationTokenHash: current.emailVerificationTokenHash,
            emailVerificationTokenExpires: current.emailVerificationTokenExpires,
          },
        }).catch(() => {});
        throw new AppError('Failed to send verification email', 500);
      }
    }

    const notificationTasks: Array<Promise<any>> = [];
    const emailEnabled = process.env.NOTIFICATIONS_EMAIL_ENABLED !== '0' && process.env.NOTIFICATIONS_EMAIL_ENABLED !== 'false';
    const channels = emailEnabled ? ['app', 'email'] as const : ['app'] as const;

    if (input.membership_status !== undefined && input.membership_status !== current.membership_status) {
      const title = input.membership_status === 'active' ? 'Membership approved' : 'Membership status updated';
      const body =
        input.membership_status === 'active'
          ? 'Congratulations! Your membership has been approved.'
          : `Your membership status is now "${input.membership_status}".`;
      notificationTasks.push(
        createNotification({
          userId: id,
          type: 'membership:update',
          title,
          body,
          channels: [...channels],
          metadata: { previous: current.membership_status, next: input.membership_status },
        })
      );
    }

    if (input.role !== undefined && input.role !== current.role) {
      notificationTasks.push(
        createNotification({
          userId: id,
          type: 'role:update',
          title: 'Role updated',
          body: `Your role has been changed to ${input.role}.`,
          channels: [...channels],
          metadata: { previous: current.role, next: input.role },
        })
      );
    }

    if (notificationTasks.length) {
      Promise.allSettled(notificationTasks).catch((err) => {
        console.error('[notifications] Failed to create update notifications', err);
      });
    }

    return { id: String(updated._id), email: updated.email, name: updated.name, role: updated.role, username: updated.username, emailVerified: updated.emailVerified };
  } catch (e: any) {
    // Surface mongoose cast/validation errors clearly
    throw new AppError(e?.message || 'Bad Request', 400);
  }
}

export async function deleteUser(id: string) {
  const res = await User.findByIdAndDelete(id).lean();
  if (!res) throw new AppError('User not found', 404);
  return { ok: true };
}
