import React from 'react';
import CapabilitiesAdminView from '@/views/admin/capabilities';
import { requireRoleOrPermission } from '@/server/auth/guard';
import { redirect } from 'next/navigation';

export default async function CapabilitiesAdminPage({ params }: { params: Promise<{ locale: 'en'|'fa' }> }) {
  const { locale } = await params;
  try {
    await requireRoleOrPermission({ minRole: 'executive', permission: 'content.capabilities' });
  } catch {
    redirect(`/${locale}/signin`);
  }
  return <CapabilitiesAdminView />;
}
