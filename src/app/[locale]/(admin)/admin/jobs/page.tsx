import React from 'react';
import JobsAdminView from '@/views/admin/jobs';
import { requireRoleOrPermission } from '@/server/auth/guard';
import { redirect } from 'next/navigation';

export default async function JobsAdminPage({ params }: { params: Promise<{ locale: 'en'|'fa' }> }) {
  const { locale } = await params;
  try {
    await requireRoleOrPermission({ minRole: 'executive', permission: 'content.jobs' });
  } catch {
    redirect(`/${locale}/signin`);
  }
  return <JobsAdminView />;
}
