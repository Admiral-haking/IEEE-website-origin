import React from 'react';
import PagesAdminView from '@/views/admin/pages';
import type { Metadata } from 'next';
import { requireRoleOrPermission } from '@/server/auth/guard';
import { redirect } from 'next/navigation';

export default async function AdminPagesPage({ params }: { params: Promise<{ locale: 'en'|'fa' }> }) {
  const { locale } = await params;
  try {
    await requireRoleOrPermission({ minRole: 'executive', permission: 'content.pages' });
  } catch {
    redirect(`/${locale}/profile`);
  }
  return <PagesAdminView />;
}

async function getDict(locale: 'en'|'fa') {
  return locale === 'fa' ? (await import('@/locales/fa/common.json')).default : (await import('@/locales/en/common.json')).default;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: 'en'|'fa' }> }): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDict(locale);
  return {
    title: `${dict.admin} — ${dict.pages}`,
    description: (dict.nav_pages_sub as any) || 'Legal & contact pages',
  };
}
