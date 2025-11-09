import { NextRequest, NextResponse } from 'next/server';
import { AuthCookie } from '@/server/auth/jwt';

function makeLogoutResponse(req: NextRequest, destination: string) {
  const url = new URL(destination, req.url);
  const res = NextResponse.redirect(url, { status: 303 });
  try {
    res.cookies.set(AuthCookie.name, '', { ...AuthCookie.options, maxAge: 0, expires: new Date(0) });
  } catch {
    // best-effort delete
    res.cookies.set(AuthCookie.name, '', { path: '/', maxAge: 0, expires: new Date(0) });
  }
  return res;
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get('content-type') || '';
  let redirectTo = '/';
  try {
    if (contentType.includes('application/json')) {
      const json = await req.json().catch(() => ({}));
      if (json && typeof json.redirect === 'string') redirectTo = json.redirect;
    } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const form = await req.formData();
      const v = form.get('redirect');
      if (typeof v === 'string') redirectTo = v;
    }
  } catch {}
  return makeLogoutResponse(req, redirectTo);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const redirectTo = searchParams.get('redirect') || '/';
  return makeLogoutResponse(req, redirectTo);
}

