import React from 'react';
import type { Metadata } from 'next';
import ForgotPasswordForm from '@/views/auth/password/ForgotPasswordForm';

export default async function ForgotPasswordPage({ params }: { params: Promise<{ locale: 'en'|'fa' }> }) {
  const { locale } = await params;
  return (
    <div style={{ padding: '24px 16px' }}>
      <ForgotPasswordForm locale={locale} />
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
    title: dict.forgot_password || 'Forgot password',
    description: dict.password_reset_hint || 'Reset your password via email.',
  };
}
