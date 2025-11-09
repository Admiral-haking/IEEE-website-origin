import React from 'react';
import BlogAdminView from '@/views/admin/blog';
import { requireRoleOrPermission } from '@/server/auth/guard';
import { redirect } from 'next/navigation';

export default async function BlogAdminPage({ params }: { params: Promise<{ locale: 'en'|'fa' }> }) {
  const { locale } = await params;
  try {
    await requireRoleOrPermission({ minRole: 'executive', permission: 'content.blog' });
  } catch {
    redirect(`/${locale}/signin`);
  }
  return <BlogAdminView />;
}
