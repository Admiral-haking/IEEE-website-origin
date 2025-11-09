import React from 'react';
import ExecutiveLayout from '@/layouts/ExecutiveLayout';
import { requireExecutiveAreaAccess } from '@/server/auth/guard';
import { redirect } from 'next/navigation';
import { getTokenFromCookies } from '@/server/auth/jwt';

export default async function ExecutiveGroupLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: 'en'|'fa' }> }) {
  const { locale } = await params;
  try {
    await requireExecutiveAreaAccess();
  } catch {
    try { await getTokenFromCookies(); redirect(`/${locale}/profile`); } catch { redirect(`/${locale}/signin`); }
  }
  return <ExecutiveLayout>{children}</ExecutiveLayout>;
}
