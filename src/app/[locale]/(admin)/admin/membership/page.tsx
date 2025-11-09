import React from 'react';
import type { Metadata } from 'next';
import MembershipAdminView from '@/views/admin/membership';
import { requireRoleOrPermission } from '@/server/auth/guard';
import { redirect } from 'next/navigation';

export default async function MembershipAdminPage({ params }: { params: Promise<{ locale: 'en'|'fa' }> }) {
  const { locale } = await params;
  try {
    await requireRoleOrPermission({ minRole: 'executive', permission: 'operations.membership' });
  } catch {
    redirect(`/${locale}/signin`);
  }
  return <MembershipAdminView />;
}

async function getDict(locale: 'en'|'fa') {
  return locale === 'fa' ? (await import('@/locales/fa/common.json')).default : (await import('@/locales/en/common.json')).default;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: 'en'|'fa' }> }): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDict(locale);
  return {
    title: `${dict.membership || 'Membership'} — Admin`,
    description: dict.membership_review_desc || 'Review membership applications',
  };
}
