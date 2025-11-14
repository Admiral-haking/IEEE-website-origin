import { NextRequest, NextResponse } from 'next/server';
import { AppError } from '@/server/errors';
import { getKey, delKey } from '@/lib/redis';
import User from '@/models/User';
import { AuthCookie, signToken } from '@/server/auth/jwt';
import '@/lib/mongoose';
import { normalizeIrPhone } from '@/server/sms/service';
import { getFeatures } from '@/server/settings/service';

export async function POST(req: NextRequest) {
  try {
    const features = await getFeatures();
    if (!features.auth.phoneOtpEnabled) {
      return NextResponse.json({ error: 'OTP login disabled' }, { status: 503 });
    }
    const { phone, code } = await req.json();
    const p = normalizeIrPhone(String(phone || ''));
    const c = String(code || '').trim();
    if (!p || c.length < 4) throw new AppError('Invalid payload', 400);
    const stored = await getKey(`otp:code:${p}`);
    if (!stored || stored !== c) throw new AppError('Invalid code', 400);
    await delKey(`otp:code:${p}`);

    let user = await User.findOne({ phone: p }).lean();
    if (!user) {
      const count = await User.countDocuments();
      const role: 'admin'|'volunteer' = count === 0 ? 'admin' : 'volunteer';
      const created = await User.create({ email: `${p}@users.local`, name: '', passwordHash: '', role, phone: p, phoneVerified: true, membership_status: 'pending' });
      user = { _id: created._id, email: created.email, name: created.name, role: created.role, phone: created.phone, phoneVerified: true } as any;
    } else if (!user.phoneVerified) {
      await User.updateOne({ _id: user._id }, { $set: { phoneVerified: true } });
    }
    const u: any = user as any;
    const token = signToken({ sub: String(u._id), role: u.role as any, email: u.email });
    const res = NextResponse.json({ user: { id: String(u._id), email: u.email, name: u.name, role: u.role, phone: u.phone, phoneVerified: true } });
    res.cookies.set(AuthCookie.name, token, AuthCookie.options);
    return res;
  } catch (err: any) {
    const status = err instanceof AppError ? err.status : 400;
    return NextResponse.json({ error: err.message || 'Bad Request' }, { status });
  }
}
