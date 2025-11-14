import React from 'react';
import '@/lib/mongoose';
import Capability from '@/models/Capability';
import { Container, Typography, Box, Chip, Stack } from '@mui/material';
import Image from 'next/image';
import type { Metadata } from 'next';
import { buildDocMetadata, getBaseUrl } from '@/lib/metadata';
import mongooseConn from '@/lib/mongoose';

export default async function CapabilityPage({ params }: { params: Promise<{ locale: 'en'|'fa'; slug: string }> }) {
  const { locale, slug } = await params;
  let doc = await Capability.findOne({ locale, slug }).lean();
  if (!doc) {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(slug);
    if (isObjectId) doc = await Capability.findOne({ _id: slug, locale }).lean();
  }
  if (!doc) return <Container sx={{ py: 6 }}><Typography>Not found</Typography></Container>;
  return (
    <Container sx={{ py: 6 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: doc.title,
        description: doc.description || '',
        category: doc.area,
        areaServed: (doc as any).locale,
        image: doc.imageFileId ? [`${getBaseUrl()}/api/media/${doc.imageFileId}`] : undefined,
        url: `${getBaseUrl()}/${(doc as any).locale}/capabilities/${(doc as any).slug || (doc as any)._id}`
      }) }} />
      {doc.imageFileId && (
        <Box sx={{ position: 'relative', width: '100%', height: { xs: 220, sm: 320, md: 420 }, borderRadius: 2, overflow: 'hidden', mb: 2 }}>
          <Image
            src={`/api/media/${doc.imageFileId}`}
            alt={doc.title}
            fill
            sizes="100vw"
            style={{ objectFit: 'cover' }}
            priority
          />
        </Box>
      )}
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <Typography component="h1" variant="h3" fontWeight={800}>{doc.title}</Typography>
        <Chip size="small" label={doc.area} />
      </Stack>
      {doc.description && <Typography color="text.secondary" gutterBottom>{doc.description}</Typography>}
      <Box mt={3} sx={{ '& img': { maxWidth: '100%', height: 'auto' } }} dangerouslySetInnerHTML={{ __html: (doc as any).contentHtml || '' }} />
    </Container>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: 'en'|'fa'; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  await mongooseConn;
  let doc = await Capability.findOne({ locale, slug }).select('title description imageFileId').lean();
  if (!doc && /^[0-9a-fA-F]{24}$/.test(slug)) {
    doc = await Capability.findOne({ _id: slug, locale }).select('title description imageFileId').lean();
  }
  const title = doc?.title || 'Capability';
  const description = doc?.description || '';
  const image = doc?.imageFileId ? `${getBaseUrl()}/api/media/${doc.imageFileId}` : undefined;
  return buildDocMetadata({ locale, path: `/capabilities/${slug}`, title, description, image });
}
