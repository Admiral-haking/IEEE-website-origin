import React from 'react';
import '@/lib/mongoose';
import Capability from '@/models/Capability';
import { Container, Grid, Card, CardContent, Typography, Stack, Chip, CardActionArea, TextField, Box, Button } from '@mui/material';
import Image from 'next/image';
import NextLink from 'next/link';
import type { Metadata } from 'next';
import { buildListMetadata } from '@/lib/metadata';
export const revalidate = 60;

async function getDict(locale: 'en' | 'fa') {
  return locale === 'fa' ? (await import('@/locales/fa/common.json')).default : (await import('@/locales/en/common.json')).default;
}

export default async function CapabilitiesPage({ params, searchParams }: { params: Promise<{ locale: 'en' | 'fa' }>, searchParams: Promise<{ q?: string; area?: string }> }) {
  const { locale } = await params;
  const sp = await searchParams;
  const q = (sp.q || '').toString();
  const area = (sp.area || '').toString();
  const dict = await getDict(locale);
  const query: any = { locale };
  if (area) query.area = area;
  if (q) query.$or = [{ title: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }, { description: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }];
  const items = await Capability.find(query).sort({ title: 1 }).select('title slug area description imageFileId').lean();
  return (
    <Container sx={{ py: 6 }}>
      <Stack gap={1} sx={{ mb: 3 }}>
        <Typography component="h1" variant="h4" fontWeight={800} suppressHydrationWarning>{dict.capabilities}</Typography>
        <Typography color="text.secondary">{dict.nav_capabilities_sub}</Typography>
      </Stack>
      <Box component="form" action={`/${locale}/capabilities`} method="get" sx={{ mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
          <TextField name="q" defaultValue={q} placeholder={dict.search || 'Search'} size="small" />
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {[ 'software','hardware','networking','devops' ].map((key) => {
              const active = area === key;
              const href = `/${locale}/capabilities?` + new URLSearchParams({ q, area: key }).toString();
              return <Chip key={key} label={(dict as any)[key] || key} component={NextLink as any} href={href} clickable color={active ? 'secondary' : 'default'} />;
            })}
            {area && (
              <Button component={NextLink as any} href={`/${locale}/capabilities?` + new URLSearchParams({ q }).toString()} size="small">{dict.view_all || 'View all'}</Button>
            )}
          </Stack>
          <Button type="submit" variant="contained" size="small">{dict.search || 'Search'}</Button>
        </Stack>
      </Box>
      <Grid container spacing={3}>
        {items.map((c: any) => (
          <Grid key={`${c.title}-${c._id}`} size={{ xs: 12, md: 6 }}>
            <Card variant="outlined" sx={{ height: '100%', borderRadius: 3 }}>
              <CardActionArea component={NextLink as any} href={`/${locale}/capabilities/${c.slug || c._id}`} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                {c.imageFileId && (
                  <Box sx={{ position: 'relative', height: 140, width: '100%' }}>
                    <Image
                      src={`/api/media/${c.imageFileId}`}
                      alt={c.title}
                      fill
                      sizes="(max-width: 900px) 100vw, 50vw"
                      style={{ objectFit: 'cover' }}
                    />
                  </Box>
                )}
                <CardContent sx={{ flex: 1 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                    <Typography variant="h6" fontWeight={700}>{c.title}</Typography>
                    <Chip size="small" label={(dict as any)[c.area] || c.area} />
                  </Stack>
                  {c.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {c.description}
                    </Typography>
                  )}
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
  return buildListMetadata({ locale, path: '/capabilities', title: dict.capabilities, description: dict.nav_capabilities_sub });
}
