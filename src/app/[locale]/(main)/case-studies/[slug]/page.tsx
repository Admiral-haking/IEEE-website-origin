import React from 'react';
import '@/lib/mongoose';
import CaseStudy from '@/models/CaseStudy';
import { Container, Typography, Box } from '@mui/material';
import Image from 'next/image';
import type { Metadata } from 'next';
import { buildDocMetadata, getBaseUrl } from '@/lib/metadata';
import mongooseConn from '@/lib/mongoose';
export const revalidate = 300;

export default async function CaseStudyPage({ params }: { params: Promise<{ locale: 'en'|'fa'; slug: string }> }) {
  const { locale, slug } = await params;
  const doc = await CaseStudy.findOne({ locale, slug, published: true }).lean();
  if (!doc) return <Container sx={{ py: 6 }}><Typography>Not found</Typography></Container>;
  return (
    <Container sx={{ py: 6 }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'CreativeWork',
          headline: doc.title,
          description: doc.summary || '',
          image: doc.coverFileId ? [`${getBaseUrl()}/api/media/${doc.coverFileId}`] : undefined,
          inLanguage: (doc as any).locale || undefined,
          url: `${getBaseUrl()}/${(doc as any).locale}/case-studies/${(doc as any).slug}`
        }) }}
      />
      {doc.coverFileId && (
        <Box sx={{ position: 'relative', width: '100%', height: { xs: 220, md: 420 }, borderRadius: 2, overflow: 'hidden', mb: 2 }}>
          <Image src={`/api/media/${doc.coverFileId}`} alt={doc.title} fill sizes="100vw" style={{ objectFit: 'cover' }} />
        </Box>
      )}
      <Typography component="h1" variant="h3" fontWeight={800} gutterBottom>{doc.title}</Typography>
      {doc.summary && <Typography color="text.secondary" gutterBottom>{doc.summary}</Typography>}
      <Box mt={3} sx={{ '& img': { maxWidth: '100%', height: 'auto' } }} dangerouslySetInnerHTML={{ __html: doc.contentHtml || '' }} />
    </Container>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: 'en'|'fa'; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  await mongooseConn;
  const doc = await CaseStudy.findOne({ locale, slug, published: true }).select('title summary coverFileId').lean();
  const title = doc?.title || 'Case study';
  const description = doc?.summary || '';
  const image = doc?.coverFileId ? `${getBaseUrl()}/api/media/${doc.coverFileId}` : undefined;
  return buildDocMetadata({ locale, path: `/case-studies/${slug}`, title, description, image });
}
