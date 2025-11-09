import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { verifyEmailToken } from '@/server/auth/service';
import { AuthCookie } from '@/server/auth/jwt';
import { AppError } from '@/server/errors';

export default async function VerifyEmailPage({ params, searchParams }: { params: Promise<{ locale: 'en'|'fa' }>; searchParams: Promise<{ token?: string }> }) {
  const { locale } = await params;
  const sp = await searchParams;
  const token = sp?.token;
  if (!token) {
    redirect(`/${locale}/signin?verify_error=missing`);
  }
  try {
    const result = await verifyEmailToken(token);
    const cookieStore = cookies();
    cookieStore.set(AuthCookie.name, result.token, AuthCookie.options);
    const status = result.alreadyVerified ? 'already' : 'success';
    const destination = `/${locale}/profile?verify=${status}`;
    redirect(destination);
  } catch (err: any) {
    const reason = err instanceof AppError ? (err.message || 'invalid') : 'invalid';
    const code = /expire/i.test(reason) ? 'expired' : /missing/i.test(reason) ? 'missing' : 'invalid';
    redirect(`/${locale}/signin?verify_error=${encodeURIComponent(code)}`);
  }
}

async function getDict(locale: 'en'|'fa') {
  return locale === 'fa' ? (await import('@/locales/fa/common.json')).default : (await import('@/locales/en/common.json')).default;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: 'en'|'fa' }> }): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDict(locale);
  return {
    title: dict.email_verify_meta_title || 'Verify email',
    description: dict.email_verify_meta_description || 'Confirm your email address to activate your account.'
  };
}
