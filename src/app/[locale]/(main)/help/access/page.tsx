import React from 'react';
import type { Metadata } from 'next';
import { Container } from '@mui/material';
import AccessDocClient from './AccessDocClient';

async function getDict(locale: 'en'|'fa') {
  return locale === 'fa' ? (await import('@/locales/fa/common.json')).default : (await import('@/locales/en/common.json')).default;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: 'en'|'fa' }> }): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDict(locale);
  return { title: (dict.access || 'Access'), description: (dict.access_doc || 'Roles and permissions') };
}

export default async function AccessHelpPage() {
  return (
    <Container sx={{ py: 3 }}>
      <AccessDocClient />
    </Container>
  );
}

