"use client";
import React from 'react';
import useAxios from 'axios-hooks';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import AdminAccessAlert from '@/components/AdminAccessAlert';

const allowAll = () => true;

export default function MainLayoutClient() {
  const pathname = usePathname();
  const { t } = useTranslation();
  // Only show access banner on restricted main routes
  const parts = (pathname || '/').split('/').filter(Boolean);
  const segs = parts.slice(1); // remove locale segment
  const first = segs[0] || '';
  const isRestricted = first === 'profile' || first === 'chat';
  const [{ error }] = useAxios({ url: '/api/auth/me', validateStatus: allowAll });
  if (!isRestricted) return null;
  return <AdminAccessAlert error={error} t={t as any} sx={{ mb: 2 }} />;
}

