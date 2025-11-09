import React from 'react';
import type { Metadata } from 'next';
import PermissionsAdminView from '@/views/admin/permissions';
import { requireRoleOrPermission } from '@/server/auth/guard';
import { redirect } from 'next/navigation';

export default async function PermissionsAdminPage({ params }: { params: Promise<{ locale: 'en'|'fa' }> }) {
  const { locale } = await params;
  try {
    await requireRoleOrPermission({ minRole: 'executive', permission: 'admin.permissions' });
  } catch {
    redirect(`/${locale}/signin`);
  }
  return <PermissionsAdminView />;
}

async function getDict(locale: 'en'|'fa') {
  return locale === 'fa' ? (await import('@/locales/fa/common.json')).default : (await import('@/locales/en/common.json')).default;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: 'en'|'fa' }> }): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDict(locale);
  return {
    title: `${dict.permissions || 'Permissions'} — Admin`,
    description: 'Manage fine-grained permissions',
  };
}
