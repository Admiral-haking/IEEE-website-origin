import React from 'react';
import '@/lib/mongoose';
import TeamMember from '@/models/TeamMember';
import { Avatar, Box, Button, Chip, Container, Grid, Link, Stack, Typography } from '@mui/material';
import type { Metadata } from 'next';
import { buildDocMetadata, getBaseUrl } from '@/lib/metadata';
import mongooseConn from '@/lib/mongoose';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TwitterIcon from '@mui/icons-material/Twitter';
import LanguageIcon from '@mui/icons-material/Language';
import PlaceIcon from '@mui/icons-material/Place';

function isObjectId(str: string) {
  return /^[a-fA-F0-9]{24}$/.test(str);
}

async function getDict(locale: 'en'|'fa') {
  return locale === 'fa' ? (await import('@/locales/fa/common.json')).default : (await import('@/locales/en/common.json')).default;
}

export default async function TeamMemberPage({ params }: { params: Promise<{ locale: 'en'|'fa'; slug: string }> }) {
  const { locale, slug } = await params;
  const dict = await getDict(locale);
  const query: any = { locale };
  if (isObjectId(slug)) query._id = slug; else query.slug = slug;
  const m = await TeamMember.findOne(query).lean();
  if (!m) return <Container sx={{ py: 6 }}><Typography>Not found</Typography></Container>;

  const initials = (m as any).name?.split(' ').map((s: string) => s[0]).slice(0, 2).join('').toUpperCase();
  const avatarSrc = (m as any).avatarUrl || undefined;

  return (
    <Box sx={{ background: 'radial-gradient(600px 300px at 10% -10%, rgba(82,168,255,0.18), transparent 60%), radial-gradient(600px 300px at 90% 0%, rgba(126,87,194,0.15), transparent 60%)' }}>
      {/* JSON-LD Person schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: (m as any).name,
          jobTitle: (m as any).role,
          image: avatarSrc ? (String(avatarSrc).startsWith('http') ? avatarSrc : `${getBaseUrl()}${avatarSrc}`) : undefined,
          url: `${getBaseUrl()}/${(m as any).locale}/team/${(m as any).slug || String((m as any)._id)}`,
          homeLocation: (m as any).location || undefined,
          sameAs: [
            (m as any).socials?.github,
            (m as any).socials?.linkedin,
            (m as any).socials?.twitter,
            (m as any).socials?.website
          ].filter(Boolean)
        }) }}
      />
      <Container sx={{ py: 6 }}>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack gap={2} alignItems={{ xs: 'flex-start' }}>
              <Avatar src={avatarSrc} sx={{ width: 96, height: 96, fontSize: 32 }}>{initials}</Avatar>
              <Stack>
                <Typography component="h1" variant="h5" fontWeight={800}>{(m as any).name}</Typography>
                <Typography variant="body1" color="text.secondary">{(m as any).role}</Typography>
                {(m as any).discipline && <Chip size="small" sx={{ mt: 1, width: 'fit-content' }} label={(dict as any)[(m as any).discipline] || (m as any).discipline} />}
              </Stack>
              {(m as any).location && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <PlaceIcon fontSize="small" />
                  <Typography variant="body2" color="text.secondary">{(m as any).location}</Typography>
                </Stack>
              )}
              <Stack direction="row" spacing={1}>
                {(m as any).socials?.github && <Button component={Link as any} href={(m as any).socials.github} target="_blank" rel="noopener" startIcon={<GitHubIcon />}>GitHub</Button>}
                {(m as any).socials?.linkedin && <Button component={Link as any} href={(m as any).socials.linkedin} target="_blank" rel="noopener" startIcon={<LinkedInIcon />}>LinkedIn</Button>}
                {(m as any).socials?.twitter && <Button component={Link as any} href={(m as any).socials.twitter} target="_blank" rel="noopener" startIcon={<TwitterIcon />}>Twitter</Button>}
                {(m as any).socials?.website && <Button component={Link as any} href={(m as any).socials.website} target="_blank" rel="noopener" startIcon={<LanguageIcon />}>{dict.website_label || 'Website'}</Button>}
              </Stack>
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <Stack gap={2}>
              {(m as any).bio && (
                <Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>{dict.bio_label || 'Bio'}</Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>{(m as any).bio}</Typography>
                </Box>
              )}
              {Array.isArray((m as any).skills) && (m as any).skills.length > 0 && (
                <Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>{dict.skills_label || 'Skills'}</Typography>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    {(m as any).skills.map((s: string, i: number) => <Chip key={`${s}-${i}`} label={s} />)}
                  </Stack>
                </Box>
              )}
              <Stack direction="row" spacing={1}>
                {(m as any).portfolioLink && <Button component={Link as any} href={(m as any).portfolioLink} target="_blank" rel="noopener">{dict.portfolio_label || 'Portfolio link'}</Button>}
                {(m as any).resumeFileId && <Button component={Link as any} href={`/api/media/${(m as any).resumeFileId}`} target="_blank" rel="noopener">{dict.select_resume || 'Resume'}</Button>}
              </Stack>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: 'en'|'fa'; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  await mongooseConn;
  const q: any = { locale };
  if (/^[a-fA-F0-9]{24}$/.test(slug)) q._id = slug; else q.slug = slug;
  const m = await TeamMember.findOne(q).select('name role discipline location avatarUrl slug _id').lean();
  const title = m ? `${(m as any).name} — ${(m as any).role}` : 'Team member';
  const description = m ? `${(m as any).role}${(m as any).location ? ' | ' + (m as any).location : ''}` : '';
  const avatar = (m as any)?.avatarUrl ? (String((m as any).avatarUrl).startsWith('http') ? (m as any).avatarUrl : `${getBaseUrl()}${(m as any).avatarUrl}`) : undefined;
  return buildDocMetadata({ locale, path: `/team/${slug}`, title, description, image: avatar });
}
