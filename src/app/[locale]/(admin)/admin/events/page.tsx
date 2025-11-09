import React from 'react';
import type { Metadata } from 'next';
import EventsAdminView from '@/views/admin/events';
import { requireRoleOrPermission } from '@/server/auth/guard';
import { redirect } from 'next/navigation';

export default async function EventsAdminPage({ params }: { params: Promise<{ locale: 'en'|'fa' }> }) {
  const { locale } = await params;
  try {
    await requireRoleOrPermission({ minRole: 'executive', permission: 'content.events' });
  } catch {
    redirect(`/${locale}/signin`);
  }
  return <EventsAdminView />;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Events — Admin' };
}
