import React from 'react';
import MemberLayout from '@/layouts/MemberLayout';
import { requireAuth } from '@/server/auth/guard';
import { getTokenFromCookies } from '@/server/auth/jwt';
import { redirect } from 'next/navigation';

export default async function MemberGroupLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: 'en'|'fa' }> }) {
  const { locale } = await params;
  try {
    await requireAuth();
  } catch {
    try { await getTokenFromCookies(); redirect(`/${locale}/profile`); } catch { redirect(`/${locale}/signin`); }
  }
  return <MemberLayout>{children}</MemberLayout>;
}

