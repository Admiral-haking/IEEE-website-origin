import React from 'react';
import type { Metadata } from 'next';
import { requireRoleOrPermission } from '@/server/auth/guard';
import SettingsClient from './SettingsClient';

export default async function AdminSettingsPage() {
  await requireRoleOrPermission({ minRole: 'admin', permission: 'admin.permissions' });
  return <SettingsClient />;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Site settings' };
}

