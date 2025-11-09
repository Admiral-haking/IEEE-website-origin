import React from 'react';
import SolutionsAdminView from '@/views/admin/solutions';
import { requireRoleOrPermission } from '@/server/auth/guard';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SolutionsAdminPage({ params }: { params: Promise<{ locale: 'en'|'fa' }> }) {
  const { locale } = await params;
  try {
    await requireRoleOrPermission({ minRole: 'executive', permission: 'content.solutions' });
  } catch {
    redirect(`/${locale}/signin`);
  }
  return <SolutionsAdminView />;
}
