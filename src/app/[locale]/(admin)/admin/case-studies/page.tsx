import React from 'react';
import CaseStudiesAdminView from '@/views/admin/case-studies';
import { requireRoleOrPermission } from '@/server/auth/guard';
import { redirect } from 'next/navigation';

export default async function CaseStudiesAdminPage({ params }: { params: Promise<{ locale: 'en'|'fa' }> }) {
  const { locale } = await params;
  try {
    await requireRoleOrPermission({ minRole: 'executive', permission: 'content.caseStudies' });
  } catch {
    redirect(`/${locale}/signin`);
  }
  return <CaseStudiesAdminView />;
}
