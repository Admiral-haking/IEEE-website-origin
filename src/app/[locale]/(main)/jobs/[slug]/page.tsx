import React from 'react';
import '@/lib/mongoose';
import Job from '@/models/Job';
import { Container, Typography, Box, Chip } from '@mui/material';
import Image from 'next/image';
import type { Metadata } from 'next';
import { buildDocMetadata, getBaseUrl } from '@/lib/metadata';
import mongooseConn from '@/lib/mongoose';
export const revalidate = 300;

export default async function JobPage({ params }: { params: Promise<{ locale: 'en'|'fa'; slug: string }> }) {
  const { locale, slug } = await params;
  const job = await Job.findOne({ locale, slug, published: true }).lean();
  if (!job) return <Container sx={{ py: 6 }}><Typography>Not found</Typography></Container>;
  return (
    <Container sx={{ py: 6 }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'JobPosting',
          title: job.title,
          employmentType: job.type,
          jobLocation: job.location ? { '@type': 'Place', address: job.location } : undefined,
          description: job.descriptionHtml || '',
          hiringOrganization: { '@type': 'Organization', name: 'IEEE Student Branch — Quchan University of Technology' },
          url: `${getBaseUrl()}/${(job as any).locale}/jobs/${(job as any).slug}`
        }) }}
      />
      {job.imageFileId && (
        <Box sx={{ position: 'relative', width: '100%', height: { xs: 220, sm: 320, md: 420 }, borderRadius: 2, overflow: 'hidden', mb: 2 }}>
          <Image
            src={`/api/media/${job.imageFileId}`}
            alt={job.title}
            fill
            sizes="100vw"
            style={{ objectFit: 'cover' }}
            priority
          />
        </Box>
      )}
      <Typography component="h1" variant="h3" fontWeight={800} gutterBottom>{job.title}</Typography>
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Chip label={job.type} size="small" />
        {job.location && <Chip label={job.location} size="small" />}
      </Box>
      <Box mt={3} sx={{ '& img': { maxWidth: '100%', height: 'auto' } }} dangerouslySetInnerHTML={{ __html: job.descriptionHtml || '' }} />
    </Container>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: 'en'|'fa'; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  await mongooseConn;
  const job = await Job.findOne({ locale, slug, published: true }).select('title type location imageFileId').lean();
  const title = job?.title || 'Job';
  const description = job ? `${job.type}${job.location ? ' • ' + job.location : ''}` : '';
  const image = job?.imageFileId ? `${getBaseUrl()}/api/media/${job.imageFileId}` : undefined;
  return buildDocMetadata({ locale, path: `/jobs/${slug}`, title, description, image });
}
