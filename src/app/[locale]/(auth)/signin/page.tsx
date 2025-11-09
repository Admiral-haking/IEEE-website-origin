import React from 'react';
import SigninView from '@/views/auth/signin';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTokenFromCookies } from '@/server/auth/jwt';

type PageProps = {
  params: Promise<{ locale: 'en'|'fa' }>;
  searchParams: Promise<{ verify?: string; verify_error?: string; redirect?: string; next?: string }>;
};

export default async function SigninPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  // If already authenticated, bounce to role router immediately
  try { await getTokenFromCookies(); redirect(`/${locale}/panel`); } catch {}
  const sp = await searchParams;
  const statusParam = sp?.verify;
  const status = statusParam === 'success' || statusParam === 'already' ? statusParam : undefined;
  const errorParam = sp?.verify_error;
  const error = errorParam === 'invalid' || errorParam === 'expired' || errorParam === 'missing' ? errorParam : undefined;
  const redirectCandidate = typeof sp?.redirect === 'string' && sp.redirect ? sp.redirect : (typeof sp?.next === 'string' && sp.next ? sp.next : undefined);
  const redirectTo = redirectCandidate && redirectCandidate.startsWith('/') ? redirectCandidate : `/${locale}`;
  return <SigninView verificationStatus={status} verificationError={error} redirectTo={redirectTo} />;
}

async function getDict(locale: 'en'|'fa') {
  return locale === 'fa' ? (await import('@/locales/fa/common.json')).default : (await import('@/locales/en/common.json')).default;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: 'en'|'fa' }> }): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDict(locale);
  return {
    title: dict.sign_in || 'Sign in',
    description: dict.auth_welcome_subtitle || 'Sign in to continue'
  };
}
