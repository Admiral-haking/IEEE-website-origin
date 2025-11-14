import React from 'react';
import { Container, Stack, Avatar, Typography, Chip, IconButton, Tooltip, Box } from '@mui/material';
import NextLink from 'next/link';
import type { Metadata } from 'next';
import { getBaseUrl } from '@/lib/metadata';
import TeamMember from '@/models/TeamMember';
import Project from '@/models/Project';
import '@/lib/mongoose';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import LanguageIcon from '@mui/icons-material/Language';

export async function generateMetadata({ params }: { params: Promise<{ locale: 'en'|'fa'; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const base = getBaseUrl();
  let title = 'Team Member';
  let description: string | undefined;
  let image: string | undefined;
  let member: any = null;
  try {
    member = await TeamMember.findOne({ slug, locale }).select('name role bio avatarUrl userId slug').lean();
    if (member) {
      title = `${member.name} — ${member.role}`;
      if (member.bio) description = String(member.bio).slice(0, 180);
      if (member.avatarUrl) image = member.avatarUrl.startsWith('http') ? member.avatarUrl : `${base}${member.avatarUrl}`;
    }
  } catch {}
  const url = `${base}/${locale}/team/${slug}`;
  // Build alternates only for locales that exist
  const other = locale === 'en' ? 'fa' : 'en';
  let otherSlug: string | undefined;
  try {
    const sameSlug = await TeamMember.findOne({ slug, locale: other }).select('slug').lean();
    if (sameSlug) otherSlug = sameSlug.slug as string;
    else if (member?.userId) {
      const byUser = await TeamMember.findOne({ userId: member.userId, locale: other }).select('slug').lean();
      if (byUser) otherSlug = byUser.slug as string;
    }
  } catch {}
  const languages: Record<string, string> = { [locale]: url };
  if (otherSlug) languages[other] = `${base}/${other}/team/${otherSlug}`;
  return {
    title,
    description: description || title,
    alternates: { canonical: url, languages },
    openGraph: {
      title,
      description: description || title,
      url,
      type: 'profile',
      images: image ? [{ url: image }] : undefined
    },
    twitter: {
      card: 'summary',
      title,
      description: description || title,
      images: image ? [image] : undefined
    }
  };
}

export default async function TeamMemberPage({ params, searchParams }: { params: Promise<{ locale: 'en'|'fa'; slug: string }>; searchParams?: Promise<{ status?: 'open'|'in_progress'|'completed'|'archived' }> }) {
  const { locale, slug } = await params;
  const sp = (await (searchParams || Promise.resolve({}))) as any;
  const m: any = await TeamMember.findOne({ slug, locale }).lean();
  if (!m) {
    return (
      <Container sx={{ py: 6 }}>
        <Typography variant="h5" fontWeight={800}>Not found</Typography>
        <Typography color="text.secondary">Member profile is not available.</Typography>
      </Container>
    );
  }
  const base = getBaseUrl();
  const sameAs: string[] = [];
  if (m.socials) {
    ['github','linkedin','twitter','website'].forEach((k) => { const u = m.socials[k]; if (u) sameAs.push(u); });
  }
  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: m.name,
    jobTitle: m.role,
    description: m.bio || undefined,
    image: m.avatarUrl ? (m.avatarUrl.startsWith('http') ? m.avatarUrl : `${base}${m.avatarUrl}`) : undefined,
    url: `${base}/${locale}/team/${slug}`,
    email: m.email ? `mailto:${m.email}` : undefined,
    sameAs: sameAs.length ? sameAs : undefined,
    homeLocation: m.location ? { '@type': 'Place', name: m.location } : undefined,
  } as any;
  const initials = String(m.name || '').split(' ').map((s: string) => s[0]).slice(0,2).join('').toUpperCase();
  const chipColor = m.discipline === 'software' ? 'primary' : m.discipline === 'hardware' ? 'success' : 'info';
  const skills: string[] = Array.isArray(m.skills) ? m.skills : [];
  const socials = m.socials || {};
  // Related projects by tags intersecting member.skills
  let projects: any[] = [];
  try {
    const filters: any = { locale, published: true };
    if (sp?.status) filters.status = sp.status;
    const ors: any[] = [];
    if (m.userId) ors.push({ team_members: m.userId });
    if (skills.length) ors.push({ tags: { $in: skills } });
    projects = await Project.find(ors.length ? { $and: [filters, { $or: ors }] } : filters)
      .select('title description tags status createdAt')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
  } catch {}
  return (
    <Container sx={{ py: 6 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ xs: 'flex-start', sm: 'center' }}>
        <Avatar src={m.avatarUrl || undefined} sx={{ width: 88, height: 88, fontSize: 32 }}>{initials}</Avatar>
        <Stack sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="h5" fontWeight={800} noWrap>{m.name}</Typography>
          <Typography variant="body1" color="text.secondary" noWrap>{m.role}</Typography>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
            <Chip size="small" color={chipColor as any} label={m.discipline} />
            {m.location && <Typography variant="caption" color="text.secondary">• {m.location}</Typography>}
          </Stack>
          <Stack direction="row" spacing={0.5} sx={{ mt: 1 }}>
            {m.email && (<Tooltip title={m.email}><IconButton size="small" href={`mailto:${m.email}`}><MailOutlineIcon fontSize="small" /></IconButton></Tooltip>)}
            {socials.github && (<Tooltip title="GitHub"><IconButton size="small" href={socials.github} target="_blank" rel="noreferrer"><GitHubIcon fontSize="small" /></IconButton></Tooltip>)}
            {socials.linkedin && (<Tooltip title="LinkedIn"><IconButton size="small" href={socials.linkedin} target="_blank" rel="noreferrer"><LinkedInIcon fontSize="small" /></IconButton></Tooltip>)}
            {socials.website && (<Tooltip title="Website"><IconButton size="small" href={socials.website} target="_blank" rel="noreferrer"><LanguageIcon fontSize="small" /></IconButton></Tooltip>)}
          </Stack>
        </Stack>
      </Stack>
      {m.bio && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>About</Typography>
          <Typography sx={{ whiteSpace: 'pre-wrap' }}>{m.bio}</Typography>
        </Box>
      )}
      {!!skills.length && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>Skills</Typography>
          <Stack direction="row" spacing={0.5} flexWrap="wrap">
            {skills.map((s, i) => (<Chip key={i} size="small" label={s} sx={{ mr: 0.5, mb: 0.5 }} />))}
          </Stack>
        </Box>
      )}
      {!!projects.length && (
        <Box sx={{ mt: 3 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1} sx={{ mb: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">Related projects</Typography>
            <Stack direction="row" spacing={1}>
              {['open','in_progress','completed','archived'].map((s) => (
                <Chip key={s} size="small" label={s.replace('_',' ')} component={NextLink as any} href={`/${locale}/team/${slug}?status=${s}`} clickable />
              ))}
            </Stack>
            <Box sx={{ flex: 1 }} />
            <Typography component={NextLink as any} href={`/${locale}/projects?member=${encodeURIComponent(m.slug)}`} variant="caption" sx={{ color: 'secondary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>View all</Typography>
          </Stack>
          <Stack spacing={1.25}>
            {projects.map((p: any, i: number) => (
              <Box key={i} sx={{ p: 1.25, borderRadius: 2, border: (t) => `1px solid ${t.palette.divider}` }}>
                <Typography fontWeight={700}>{p.title}</Typography>
                {!!p.description && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }} noWrap>{p.description}</Typography>}
                {!!(p.tags||[]).length && (
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                    {(p.tags || []).slice(0, 5).map((t: string, idx: number) => <Chip key={idx} size="small" label={t} />)}
                  </Stack>
                )}
              </Box>
            ))}
          </Stack>
        </Box>
      )}
    </Container>
  );
}
