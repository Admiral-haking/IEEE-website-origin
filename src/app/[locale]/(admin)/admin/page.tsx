import React from 'react';
import AdminDashboardView from '@/views/admin/dashboard';
import type { Metadata } from 'next';
import { requireAdmin } from '@/server/auth/guard';
import { redirect } from 'next/navigation';

export default async function AdminRootPage({ params }: { params: Promise<{ locale: 'en'|'fa' }> }) {
  const { locale } = await params;
  try {
    await requireAdmin();
  } catch {
    // User is authenticated but not admin; send them to their profile/home
    redirect(`/${locale}/profile`);
  }
  return <AdminDashboardView />;
}

async function getDict(locale: 'en'|'fa') {
  return locale === 'fa' ? (await import('@/locales/fa/common.json')).default : (await import('@/locales/en/common.json')).default;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: 'en'|'fa' }> }): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDict(locale);
  return {
    title: `${dict.admin} — ${dict.dashboard}`,
    description: dict.nav_dashboard_sub || 'Overview & KPIs',
  };
}
