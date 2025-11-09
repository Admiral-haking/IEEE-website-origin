import React from 'react';
import '@/lib/mongoose';
import Event from '@/models/Event';
import { Container, Typography, Stack } from '@mui/material';
import type { Metadata } from 'next';
import { buildDocMetadata, getBaseUrl } from '@/lib/metadata';

function isObjectId(str: string) { return /^[a-fA-F0-9]{24}$/.test(str); }

export default async function EventPage({ params }: { params: Promise<{ locale: 'en'|'fa'; slug: string }> }) {
  const { locale, slug } = await params;
  const q: any = { locale };
  if (isObjectId(slug)) q._id = slug; else q.slug = slug;
  const e = await Event.findOne(q).lean();
  if (!e) return <Container sx={{ py: 6 }}><Typography>Not found</Typography></Container>;
  return (
    <Container sx={{ py: 6 }}>
      <Stack gap={1} sx={{ mb: 2 }}>
        <Typography component="h1" variant="h4" fontWeight={800}>{(e as any).title}</Typography>
        {(e as any).location && <Typography color="text.secondary">{(e as any).location}</Typography>}
        {(e as any).startAt && <Typography color="text.secondary">{new Date((e as any).startAt).toLocaleString()}</Typography>}
      </Stack>
      {(e as any).descriptionHtml && <div dangerouslySetInnerHTML={{ __html: (e as any).descriptionHtml }} />}
    </Container>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: 'en'|'fa'; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const q: any = { locale };
  if (/^[a-fA-F0-9]{24}$/.test(slug)) q._id = slug; else q.slug = slug;
  const e = await Event.findOne(q).select('title slug descriptionHtml _id').lean();
  const title = e ? (e as any).title : 'Event';
  const description = e ? ((e as any).descriptionHtml || '').replace(/<[^>]+>/g, '').slice(0, 200) : '';
  return buildDocMetadata({ locale, path: `/events/${slug}`, title, description, image: `${getBaseUrl()}/og.png` });
}
