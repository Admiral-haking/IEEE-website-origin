import React from 'react';
import VolunteerLayout from '@/layouts/VolunteerLayout';
import { requireRoleAtLeast } from '@/server/auth/guard';
import { getTokenFromCookies } from '@/server/auth/jwt';
import { redirect } from 'next/navigation';

export default async function VolunteerGroupLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: 'en'|'fa' }> }) {
  const { locale } = await params;
  try {
    await requireRoleAtLeast('volunteer');
  } catch {
    try { await getTokenFromCookies(); redirect(`/${locale}/profile`); } catch { redirect(`/${locale}/signin`); }
  }
  return <VolunteerLayout>{children}</VolunteerLayout>;
}

