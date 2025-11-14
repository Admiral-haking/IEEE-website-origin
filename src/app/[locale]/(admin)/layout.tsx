import React from 'react';
import AdminLayout from '@/layouts/AdminLayout';
import { requireAdminAreaAccess } from '@/server/auth/guard';
import { getTokenFromCookies } from '@/server/auth/jwt';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminGroupLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  try {
    await requireAdminAreaAccess();
  } catch {
    // If not authenticated, go to signin; otherwise fallback to profile
    try { await getTokenFromCookies(); redirect(`/${locale}/profile`); } catch { redirect(`/${locale}/signin`); }
  }
  return <AdminLayout>{children}</AdminLayout>;
}
