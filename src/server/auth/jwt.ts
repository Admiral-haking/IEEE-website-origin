import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '@/server/errors';

const JWT_SECRET = (() => {
  const val = process.env.JWT_SECRET;
  if (val && val.length >= 24) return val;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set to a strong value in production');
  }
  return 'dev-secret-change-me';
})();
const COOKIE_NAME = 'hippo_token';

export type TokenPayload = { sub: string; role: 'member' | 'volunteer' | 'executive' | 'admin'; email: string };

export function signToken(payload: TokenPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

export async function getTokenFromCookies() {
  const { cookies } = await import('next/headers');
  const c = await cookies();
  const token = c.get(COOKIE_NAME)?.value;
  if (!token) throw new UnauthorizedError();
  try {
    return verifyToken(token);
  } catch (e) {
    // Normalize JWT verification errors to 401
    throw new UnauthorizedError();
  }
}

export const AuthCookie = {
  name: COOKIE_NAME,
  options: {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  }
};
