import React from 'react';
import type { Metadata } from 'next';
import ResetPasswordForm from '@/views/auth/password/ResetPasswordForm';

export default async function ResetPasswordPage({ params, searchParams }: { params: Promise<{ locale: 'en'|'fa' }>; searchParams?: { token?: string } }) {
  const { locale } = await params;
  const dict = await getDict(locale);
  const token = searchParams?.token;
  return (
    <div style={{ padding: '24px 16px' }}>
      {token ? (
        <ResetPasswordForm token={token} locale={locale} />
      ) : (
        <p style={{ textAlign: 'center' }}>{dict.password_reset_invalid || 'Token required.'}</p>
      )}
    </div>
  );
}

async function getDict(locale: 'en'|'fa') {
  return locale === 'fa' ? (await import('@/locales/fa/common.json')).default : (await import('@/locales/en/common.json')).default;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: 'en'|'fa' }> }): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDict(locale);
  return {
    title: dict.password_reset_title || 'Reset password',
    description: dict.password_reset_hint || 'Reset your password using the secure link.',
  };
}
