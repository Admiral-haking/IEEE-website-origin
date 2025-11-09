import React from 'react';
import '@/lib/mongoose';
import Event from '@/models/Event';
import { Container, Grid, Card, CardContent, Typography, Stack, Chip, CardActionArea } from '@mui/material';
import NextLink from 'next/link';
import type { Metadata } from 'next';
import { buildListMetadata } from '@/lib/metadata';
export const revalidate = 60;

async function getDict(locale: 'en' | 'fa') {
  return locale === 'fa' ? (await import('@/locales/fa/common.json')).default : (await import('@/locales/en/common.json')).default;
}

export default async function EventsPage({ params }: { params: Promise<{ locale: 'en' | 'fa' }> }) {
  const { locale } = await params;
  const dict = await getDict(locale);
  const items = await Event.find({ locale, published: true }).sort({ startAt: -1 }).select('title slug startAt location').lean();
  return (
    <Container sx={{ py: 6 }}>
      <Stack gap={1} sx={{ mb: 3 }}>
        <Typography component="h1" variant="h4" fontWeight={800} suppressHydrationWarning>{dict.events}</Typography>
        <Typography color="text.secondary">{dict.nav_events_sub}</Typography>
      </Stack>
      <Grid container spacing={3}>
        {items.map((e: any) => (
          <Grid key={`${e.title}-${e._id}`} size={{ xs: 12, md: 6 }}>
            <Card variant="outlined" sx={{ height: '100%', borderRadius: 3 }}>
              <CardActionArea component={NextLink as any} href={`/${locale}/events/${e.slug || e._id}`}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                    <Typography variant="h6" fontWeight={700}>{e.title}</Typography>
                    <Chip size="small" label={new Date(e.startAt).toLocaleDateString()} />
                  </Stack>
                  {e.location && <Typography variant="body2" color="text.secondary">{e.location}</Typography>}
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: 'en'|'fa' }> }): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDict(locale);
  return buildListMetadata({ locale, path: '/events', title: dict.events, description: dict.nav_events_sub });
}
