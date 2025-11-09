import React from 'react';
import UsersView from '@/views/admin/users';
import type { Metadata } from 'next';
import { requireAdmin } from '@/server/auth/guard';
import { redirect } from 'next/navigation';

export default async function UsersPage({ params }: { params: Promise<{ locale: 'en'|'fa' }> }) {
  const { locale } = await params;
  try {
    await requireAdmin();
  } catch {
    redirect(`/${locale}/signin`);
  }
  return <UsersView />;
}

async function getDict(locale: 'en'|'fa') {
  return locale === 'fa' ? (await import('@/locales/fa/common.json')).default : (await import('@/locales/en/common.json')).default;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: 'en'|'fa' }> }): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDict(locale);
  return {
    title: `${dict.admin} — ${dict.users}`,
    description: dict.manage_users_subtitle || 'Manage members & roles',
  };
}
