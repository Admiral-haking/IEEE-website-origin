import React from 'react';
import { redirect } from 'next/navigation';
import { getTokenFromCookies } from '@/server/auth/jwt';

export default async function PanelRouter({ params }: { params: Promise<{ locale: 'en'|'fa' }> }) {
  const { locale } = await params;
  try {
    const token = await getTokenFromCookies();
    const raw = (token as any)?.role as string | undefined;
    const role = raw === 'professor' ? 'executive' : raw === 'user' ? 'member' : raw;
    if (role === 'admin') redirect(`/${locale}/admin`);
    if (role === 'executive') redirect(`/${locale}/executive`);
    if (role === 'volunteer') redirect(`/${locale}/volunteer`);
    redirect(`/${locale}/member`);
  } catch {
    redirect(`/${locale}/signin`);
  }
}

