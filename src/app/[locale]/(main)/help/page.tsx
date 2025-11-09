import React from 'react';
import type { Metadata } from 'next';
import { Container } from '@mui/material';
import HelpClient from './HelpClient';

async function getDict(locale: 'en'|'fa') {
  return locale === 'fa' ? (await import('@/locales/fa/common.json')).default : (await import('@/locales/en/common.json')).default;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: 'en'|'fa' }> }): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDict(locale);
  return { title: dict.help || 'Help', description: dict.access_doc || 'Docs and access' };
}

export default function HelpPage() {
  return (
    <Container sx={{ py: 4 }}>
      <HelpClient />
    </Container>
  );
}
