import React from 'react';
import '@/lib/mongoose';
import CaseStudy from '@/models/CaseStudy';
import { Container, Grid, Card, CardActionArea, CardContent, Typography, Stack, Box } from '@mui/material';
import Image from 'next/image';
import type { Metadata } from 'next';
import { buildListMetadata } from '@/lib/metadata';
export const revalidate = 60;
import NextLink from 'next/link';

async function getDict(locale: 'en' | 'fa') {
  return locale === 'fa' ? (await import('@/locales/fa/common.json')).default : (await import('@/locales/en/common.json')).default;
}

export default async function CaseStudiesPage({ params }: { params: Promise<{ locale: 'en' | 'fa' }> }) {
  const { locale } = await params;
  const dict = await getDict(locale);
  const items = await CaseStudy.find({ locale, published: true })
    .sort({ createdAt: -1 })
    .select('title slug summary coverFileId createdAt')
    .lean();
  return (
    <Container sx={{ py: 6 }}>
      <Stack gap={1} sx={{ mb: 3 }}>
        <Typography component="h1" variant="h4" fontWeight={800} suppressHydrationWarning>{dict.case_studies}</Typography>
        <Typography color="text.secondary">{dict.nav_case_studies_sub}</Typography>
      </Stack>
      <Grid container spacing={3}>
        {items.map((c: any) => (
          <Grid key={c.slug} size={{ xs: 12, md: 4 }}>
            <Card variant="outlined" sx={{ height: '100%', borderRadius: 3 }}>
              <CardActionArea component={NextLink} href={`/${locale}/case-studies/${c.slug}`} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                {c.coverFileId && (
                  <Box sx={{ position: 'relative', height: 160, width: '100%' }}>
                    <Image src={`/api/media/${c.coverFileId}`} alt={c.title} fill sizes="(max-width: 900px) 100vw, 33vw" style={{ objectFit: 'cover' }} />
                  </Box>
                )}
                <CardContent sx={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight={700}>{c.title}</Typography>
                  {c.summary && (<Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.summary}</Typography>)}
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
  return buildListMetadata({ locale, path: '/case-studies', title: dict.case_studies, description: dict.nav_case_studies_sub });
}
