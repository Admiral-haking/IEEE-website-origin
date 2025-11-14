import '@/lib/mongoose';
import User from '@/models/User';
import { AppError, ForbiddenError, UnauthorizedError } from '@/server/errors';
import { LoginInput, RegisterInput } from './validators';
import { comparePassword, hashPassword } from './hash';
import mongoose from 'mongoose';
import { signToken, TokenPayload } from './jwt';
import { escapeRegex } from '@/lib/regex';
import crypto from 'crypto';
import { sendEmailVerificationEmail, sendPasswordResetEmail } from '@/server/mail/mailer';
import LoginEvent from '@/models/LoginEvent';

export const EMAIL_VERIFICATION_TTL_MS = Number(process.env.EMAIL_VERIFICATION_TTL_MS || 1000 * 60 * 60 * 24);
export const PASSWORD_RESET_TTL_MS = Number(process.env.PASSWORD_RESET_TTL_MS || 1000 * 60 * 60); // 1 hour

export function normalizeLocale(locale?: string | null): 'en' | 'fa' {
  return locale && locale.toLowerCase().startsWith('fa') ? 'fa' : 'en';
}

export function generateEmailVerificationArtifacts() {
  const token = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const expires = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS);
  return { token, hash, expires };
}

export function generatePasswordResetArtifacts() {
  const token = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const expires = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
  return { token, hash, expires };
}

export async function registerUser(input: RegisterInput) {
  const email = input.email.toLowerCase().trim();
  const name = input.name?.trim();
  const full_name = (input as any).full_name?.trim();
  const phone = (input as any).phone?.trim();
  const username = input.username?.toLowerCase().trim();
  const student_id: string | undefined = (input as any).student_id ? String((input as any).student_id).trim() : undefined;
  const locale = normalizeLocale(input.locale);
  // Unique checks for email/username
  const exists = await User.findOne({ $or: [ { email }, ...(username ? [{ username }] : []), ...(phone ? [{ phone }] : []), ...(student_id ? [{ student_id }] : []) ] }).lean();
  if (exists) throw new AppError('Email, username, phone or student id already registered', 409);
  const passwordHash = await hashPassword(input.password);
  // If explicitly allowed via env, first user can be admin; otherwise everyone signs up as volunteer.
  const allowFirstAdmin = (process.env.ALLOW_FIRST_ADMIN_SIGNUP || '').toLowerCase() === 'true';
  let role: 'admin' | 'volunteer' = 'volunteer';
  if (allowFirstAdmin) {
    const count = await User.countDocuments();
    role = count === 0 ? 'admin' : 'volunteer';
  }
  const needsVerification = role !== 'admin';
  let verificationToken: string | null = null;
  let verificationHash: string | undefined;
  let verificationExpires: Date | undefined;
  if (needsVerification) {
    const artifacts = generateEmailVerificationArtifacts();
    verificationToken = artifacts.token;
    verificationHash = artifacts.hash;
    verificationExpires = artifacts.expires;
  }
  const created = await User.create({
    email,
    name,
    full_name,
    phone,
    student_id,
    username,
    passwordHash,
    role,
    membership_status: 'pending',
    emailVerified: !needsVerification,
    emailVerifiedAt: needsVerification ? undefined : new Date(),
    emailVerificationTokenHash: verificationHash,
    emailVerificationTokenExpires: verificationExpires,
  });
  if (needsVerification && verificationToken) {
    let sent = false;
    try {
      sent = await sendEmailVerificationEmail({
        email,
        name: name || undefined,
        token: verificationToken,
        locale,
      });
    } catch {
      sent = false;
    }
    if (!sent) {
      await User.findByIdAndDelete((created as any)._id).catch(() => {});
      throw new AppError('Failed to send verification email', 500);
    }
  }
  const safeUser = { id: String((created as any)._id), email: (created as any).email, name: (created as any).name, role: (created as any).role, username: (created as any).username, emailVerified: (created as any).emailVerified };
  if (needsVerification) {
    return { user: safeUser, needsVerification: true as const };
  }
  const payload: TokenPayload = { sub: String((created as any)._id), role: (created as any).role as any, email: (created as any).email as string };
  const token = signToken(payload);
  return { user: safeUser, token, needsVerification: false as const };
}

export async function loginUser(input: LoginInput) {
  const identifier = input.identifier.trim();
  const normalized = identifier.toLowerCase();
  let user;
  if (normalized.includes('@')) {
    user = await User.findOne({ email: normalized }).select('+passwordHash');
  } else {
    // Try username first, then name
    const safe = escapeRegex(normalized);
    user = await User.findOne({ username: new RegExp(`^${safe}$`, 'i') }).select('+passwordHash');
    if (!user) {
      const safeName = escapeRegex(identifier);
      user = await User.findOne({ name: new RegExp(`^${safeName}$`, 'i') }).select('+passwordHash');
      if (!user) {
        const safeLocal = escapeRegex(normalized);
        user = await User.findOne({ email: new RegExp(`^${safeLocal}@`, 'i') }).select('+passwordHash');
      }
    }
  }

  if (!user) throw new UnauthorizedError('Invalid credentials');
  const ok = await comparePassword(input.password, (user as any).passwordHash as string);
  if (!ok) throw new UnauthorizedError('Invalid credentials');
  if ((user as any).emailVerified === false) throw new ForbiddenError('Email not verified');
  const payload: TokenPayload = { sub: String((user as any)._id), role: (user as any).role as any, email: (user as any).email as string };
  const token = signToken(payload);
  // update last_login
  const updates: any = { last_login: new Date() };
  if (!(user as any).ieee_membership_id) {
    updates.ieee_membership_id = `IEEE-${new mongoose.Types.ObjectId().toString()}`;
  }
  await User.updateOne({ _id: (user as any)._id }, { $set: updates }).lean();
  try { await LoginEvent.create({ userId: (user as any)._id }); } catch {}
  return { user: { id: String((user as any)._id), email: (user as any).email, name: (user as any).name, role: (user as any).role, username: (user as any).username }, token };
}

export async function verifyEmailToken(token: string) {
  if (!token) throw new AppError('Invalid token', 400);
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const now = new Date();
  const user = await User.findOne({
    emailVerificationTokenHash: hash,
    emailVerificationTokenExpires: { $gt: now },
  }).select('+emailVerificationTokenHash +emailVerificationTokenExpires');
  if (!user) throw new AppError('Invalid or expired token', 400);
  if (user.emailVerified) {
    user.emailVerificationTokenHash = undefined;
    user.emailVerificationTokenExpires = undefined;
    await user.save({ validateBeforeSave: false });
    const payload: TokenPayload = { sub: String(user._id), role: user.role as any, email: String(user.email) };
    return {
      user: { id: String(user._id), email: user.email, name: user.name, role: user.role, username: user.username },
      token: signToken(payload),
      alreadyVerified: true as const,
    };
  }
  user.emailVerified = true;
  user.emailVerifiedAt = new Date();
  user.emailVerificationTokenHash = undefined;
  user.emailVerificationTokenExpires = undefined;
  await user.save({ validateBeforeSave: false });
  const payload: TokenPayload = { sub: String(user._id), role: user.role as any, email: String(user.email) };
  return {
    user: { id: String(user._id), email: user.email, name: user.name, role: user.role, username: user.username },
    token: signToken(payload),
    alreadyVerified: false as const,
  };
}

export async function resendEmailVerification(email: string, locale?: 'en'|'fa') {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select('+emailVerificationTokenHash +emailVerificationTokenExpires');
  if (!user) throw new AppError('Account not found', 404);
  if (user.emailVerified) throw new AppError('Email already verified', 400);
  const { token, hash, expires } = generateEmailVerificationArtifacts();
  user.emailVerificationTokenHash = hash;
  user.emailVerificationTokenExpires = expires;
  await user.save({ validateBeforeSave: false });
  const sent = await sendEmailVerificationEmail({
    email: String(user.email),
    name: user.name ? String(user.name) : undefined,
    token,
    locale: normalizeLocale(locale),
  });
  if (!sent) throw new AppError('Failed to send verification email', 500);
  return { ok: true };
}

export async function requestPasswordReset(email: string, locale?: 'en'|'fa') {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select('+passwordResetTokenHash +passwordResetTokenExpires');
  if (!user) return { ok: true };
  const { token, hash, expires } = generatePasswordResetArtifacts();
  user.passwordResetTokenHash = hash;
  user.passwordResetTokenExpires = expires;
  await user.save({ validateBeforeSave: false });
  const sent = await sendPasswordResetEmail({
    email: String(user.email),
    name: user.name ? String(user.name) : undefined,
    token,
    locale: normalizeLocale(locale),
  });
  if (!sent) throw new AppError('Failed to send password reset email', 500);
  return { ok: true };
}

export async function resetPassword(token: string, password: string) {
  if (!token) throw new AppError('Invalid token', 400);
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const now = new Date();
  const user = await User.findOne({
    passwordResetTokenHash: hash,
    passwordResetTokenExpires: { $gt: now },
  }).select('+passwordResetTokenHash +passwordResetTokenExpires +passwordHash');
  if (!user) throw new AppError('Invalid or expired token', 400);
  user.passwordHash = await hashPassword(password);
  user.passwordResetTokenHash = undefined;
  user.passwordResetTokenExpires = undefined;
  await user.save({ validateBeforeSave: false });
  return { ok: true };
}
