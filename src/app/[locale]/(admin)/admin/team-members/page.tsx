import React from 'react';
import TeamMembersAdminView from '@/views/admin/team-members';
import { requireRoleOrPermission } from '@/server/auth/guard';
import { redirect } from 'next/navigation';

export default async function TeamMembersAdminPage({ params }: { params: Promise<{ locale: 'en'|'fa' }> }) {
  const { locale } = await params;
  try {
    await requireRoleOrPermission({ minRole: 'executive', permission: 'content.team' });
  } catch {
    redirect(`/${locale}/signin`);
  }
  return <TeamMembersAdminView />;
}
