import React from 'react';
import MediaAdminView from '@/views/admin/media';
import { requireRoleOrPermission } from '@/server/auth/guard';
import { redirect } from 'next/navigation';

export default async function MediaAdminPage({ params }: { params: Promise<{ locale: 'en'|'fa' }> }) {
  const { locale } = await params;
  try {
    await requireRoleOrPermission({ minRole: 'executive', permission: 'content.media' });
  } catch {
    redirect(`/${locale}/signin`);
  }
  return <MediaAdminView />;
}
