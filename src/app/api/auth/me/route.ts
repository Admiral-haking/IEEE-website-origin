import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromCookies } from '@/server/auth/jwt';
import { AppError, UnauthorizedError } from '@/server/errors';
import User from '@/models/User';
import { updateUser } from '@/server/users/service';
import { ProfileRequiredSchema } from '@/server/users/validators';

export async function GET() {
  try {
    const token = await getTokenFromCookies();
    const user = await User.findById(token.sub).lean();
    if (!user) throw new UnauthorizedError();
    const safe: any = { ...user };
    delete safe.passwordHash;
    safe.id = String(user._id);
    delete safe._id;
    return NextResponse.json({ user: safe }, { headers: { 'Cache-Control': 'private, max-age=0, must-revalidate' } });
  } catch (err: any) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const message = err?.message || 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500, headers: { 'Cache-Control': 'private, max-age=0, must-revalidate' } });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const token = await getTokenFromCookies();
    const json = await req.json();
    const input = ProfileRequiredSchema.parse(json);
    // prevent self from editing IEEE ID or membership status
    if (typeof (input as any).ieee_membership_id !== 'undefined') delete (input as any).ieee_membership_id;
    if (typeof (json as any).membership_status !== 'undefined') delete (input as any).membership_status;
    const updated = await updateUser(String(token.sub), input as any);
    return NextResponse.json({ user: updated }, { headers: { 'Cache-Control': 'private, max-age=0, must-revalidate' } });
  } catch (err: any) {
    if (err?.issues) return NextResponse.json({ errors: err.issues }, { status: 422 });
    const status = err instanceof AppError ? err.status : err instanceof UnauthorizedError ? 401 : 400;
    return NextResponse.json({ error: err.message || 'Bad Request' }, { status, headers: { 'Cache-Control': 'private, max-age=0, must-revalidate' } });
  }
}
