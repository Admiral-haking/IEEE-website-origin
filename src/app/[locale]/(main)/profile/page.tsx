import React from 'react';
import type { Metadata } from 'next';
import ProfileClient from './ProfileClient';
import { requireAuth } from '@/server/auth/guard';
import { redirect } from 'next/navigation';

export default async function ProfilePage({ params }: { params: Promise<{ locale: 'en'|'fa' }> }) {
  const { locale } = await params;
  try {
    await requireAuth();
  } catch {
    redirect(`/${locale}/signin`);
  }
  return <ProfileClient />;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: 'en'|'fa' }> }): Promise<Metadata> {
  const { locale } = await params;
  const dict = locale === 'fa' ? (await import('@/locales/fa/common.json')).default : (await import('@/locales/en/common.json')).default;
  return {
    title: (dict as any).profile || 'Profile',
    description: (dict as any).profile_sub || 'Your account profile',
  } as any;
}
