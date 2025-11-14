import React from 'react';
import { Avatar, Card, CardActionArea, Chip, Container, Grid, Stack, Typography } from '@mui/material';
import NextLink from 'next/link';
import type { Metadata } from 'next';
import { buildListMetadata, getBaseUrl } from '@/lib/metadata';
export const revalidate = 60;

async function getDict(locale: 'en' | 'fa') {
  return locale === 'fa' ? (await import('@/locales/fa/common.json')).default : (await import('@/locales/en/common.json')).default;
}

export default async function TeamPage({ params }: { params: Promise<{ locale: 'en' | 'fa' }> }) {
  const { locale } = await params;
  const dict = await getDict(locale);
  let members: any[] = [];
  try {
    const res = await fetch(`${getBaseUrl()}/api/public/team?locale=${locale}`, { next: { revalidate: 60 } });
    if (res.ok) {
      const data: any = await res.json();
      members = (data.items || data.members || []).map((m: any) => ({ ...m }));
    }
  } catch {}
  const base = getBaseUrl();
  const listLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: members.map((m: any, i: number) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${base}/${locale}/team/${m.slug || String(m._id)}`,
      name: m.name,
    }))
  } as any;
  return (
    <Container sx={{ py: 6 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(listLd) }} />
      <Stack gap={1} sx={{ mb: 3 }}>
        <Typography component="h1" variant="h4" fontWeight={800} suppressHydrationWarning>{dict.our_team}</Typography>
        <Typography color="text.secondary">{dict.tagline}</Typography>
      </Stack>
      <Grid container spacing={3}>
        {members.map((m: any) => {
          const href = `/${locale}/team/${m.slug || String(m._id)}`;
          const initials = m.name?.split(' ').map((s: string) => s[0]).slice(0, 2).join('').toUpperCase();
          return (
            <Grid key={String(m._id)} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card variant="outlined" sx={{ borderRadius: 3, height: '100%' }}>
                <CardActionArea component={NextLink} href={href} sx={{ p: 2 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar src={m.avatarUrl || undefined}>{initials}</Avatar>
                    <Stack>
                      <Typography fontWeight={700}>{m.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{m.role}</Typography>
                      <Chip size="small" label={(dict as any)[m.discipline] || m.discipline} sx={{ mt: 0.5, width: 'fit-content' }} />
                    </Stack>
                  </Stack>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Container>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: 'en'|'fa' }> }): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDict(locale);
  return buildListMetadata({ locale, path: '/team', title: dict.our_team, description: dict.tagline });
}
