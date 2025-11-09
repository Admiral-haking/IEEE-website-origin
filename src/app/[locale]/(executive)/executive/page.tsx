import React from 'react';
import { redirect } from 'next/navigation';
import { requireExecutiveAreaAccess } from '@/server/auth/guard';
import ExecutiveDashboardView from '@/views/executive/dashboard';

export default async function ExecutivePage({ params }: { params: Promise<{ locale: 'en'|'fa' }> }) {
  const { locale } = await params;
  try {
    await requireExecutiveAreaAccess();
  } catch {
    redirect(`/${locale}/signin`);
  }
  return <ExecutiveDashboardView />;
}
