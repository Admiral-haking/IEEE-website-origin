import React from 'react';
import type { Metadata } from 'next';
import ChannelsAdminView from '@/views/admin/chat/ChannelsAdminView';
import { requireRoleOrPermission } from '@/server/auth/guard';
import { redirect } from 'next/navigation';

export default async function ChannelsAdminPage({ params }: { params: Promise<{ locale: 'en'|'fa' }> }) {
  const { locale } = await params;
  try {
    await requireRoleOrPermission({ minRole: 'executive', permission: 'operations.chatModeration' });
  } catch {
    redirect(`/${locale}/signin`);
  }
  return <ChannelsAdminView />;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Channels — Admin' };
}
