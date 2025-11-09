import React from 'react';
import SignupView from '@/views/auth/signup';
import type { Metadata } from 'next';

export default function SignupPage() {
  return <SignupView />;
}

async function getDict(locale: 'en'|'fa') {
  return locale === 'fa' ? (await import('@/locales/fa/common.json')).default : (await import('@/locales/en/common.json')).default;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: 'en'|'fa' }> }): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDict(locale);
  return {
    title: dict.signup_title || dict.sign_up || 'Sign up',
    description: dict.signup_subtitle || ''
  };
}
