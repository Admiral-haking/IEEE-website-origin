import React from 'react';
import { redirect } from 'next/navigation';
import { getTokenFromCookies } from '@/server/auth/jwt';
import '@/lib/mongoose';
import Solution from '@/models/Solution';
import Capability from '@/models/Capability';
import BlogPost from '@/models/BlogPost';
import CaseStudy from '@/models/CaseStudy';
import Job from '@/models/Job';
import Hero from '@/views/home/components/Hero';
import StatsBand from '@/views/home/components/StatsBand';
import NextLink from 'next/link';
import { Container, Stack, Typography, Card, CardActionArea, CardContent, Chip, Box, Button } from '@mui/material';
import Image from 'next/image';
import type { Metadata } from 'next';
import { buildListMetadata } from '@/lib/metadata';
export const revalidate = 60;

async function getDict(locale: 'en' | 'fa') {
  return locale === 'fa' ? (await import('@/locales/fa/common.json')).default : (await import('@/locales/en/common.json')).default;
}

export default async function HomePage({ params }: { params: Promise<{ locale: 'en' | 'fa' }> }) {
  const { locale } = await params;
  const isFa = locale === 'fa';
  // If authenticated, route to role panel for a smoother experience
  try { await getTokenFromCookies(); redirect(`/${locale}/panel`); } catch {}
  const dict = await getDict(locale);
  const [solutions, capabilities, posts, cases, jobs] = await Promise.all([
    Solution.find({ locale, published: true }).sort({ createdAt: -1 }).limit(6).select('title slug summary category imageFileId').lean(),
    Capability.find({ locale }).sort({ title: 1 }).limit(6).select('title slug area description imageFileId').lean(),
    BlogPost.find({ locale, published: true }).sort({ createdAt: -1 }).limit(3).select('title slug excerpt coverFileId createdAt tags').lean(),
    CaseStudy.find({ locale, published: true }).sort({ createdAt: -1 }).limit(3).select('title slug summary coverFileId createdAt').lean(),
    Job.find({ locale, published: true }).sort({ createdAt: -1 }).limit(3).select('title slug type location imageFileId').lean()
  ]);
  const [solutionsTotal, postsTotal, casesTotal, jobsTotal] = await Promise.all([
    Solution.countDocuments({ locale, published: true }),
    BlogPost.countDocuments({ locale, published: true }),
    CaseStudy.countDocuments({ locale, published: true }),
    Job.countDocuments({ locale, published: true })
  ]);

  return (
    <>
      <Hero />
      <Container sx={{ py: { xs: 6, md: 10 } }}>
        <StatsBand stats={[
          { value: solutionsTotal, label: dict.stats_projects || 'Solutions' },
          { value: postsTotal, label: dict.stats_blog_posts || 'Blog posts' },
          { value: casesTotal, label: dict.stats_case_studies || 'Case studies' },
          { value: jobsTotal, label: dict.stats_jobs || 'Open jobs' }
        ]} />
        {/* Solutions */}
        <Stack gap={1} sx={{ mb: 2, mt: { xs: isFa ? 0.5 : 0, md: 0 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography component="h2" variant="h5" fontWeight={800} noWrap={false} sx={{ fontSize: { xs: isFa ? 17 : 18, md: 'inherit' } }}>{dict.solutions}</Typography>
              <Typography color="text.secondary" sx={{ fontSize: { xs: 13, md: 'inherit' } }}>{dict.nav_solutions_sub}</Typography>
            </Box>
            <Button component={NextLink} href={`/${locale}/solutions`} size="small">{dict.view_all || 'View all'}</Button>
          </Stack>
        </Stack>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: { xs: isFa ? 3 : 2.5, md: 3 }, mb: 6 }}>
          {solutions.map((s: any, i: number) => (
            <Card key={String(s._id)} variant="outlined" sx={{ height: '100%', borderRadius: { xs: 2, md: 3 } }}>
              <CardActionArea component={NextLink as any} href={`/${locale}/solutions/${s.slug || s._id}`}>
                {s.imageFileId && (
                  <Box sx={{ position: 'relative', height: { xs: 140, md: 160 } }}>
                    <Image
                      src={`/api/media/${s.imageFileId}`}
                      alt={s.title}
                      fill
                      sizes="(max-width: 900px) 100vw, 33vw"
                      style={{ objectFit: 'cover' }}
                      priority={i === 0}
                      fetchPriority={i === 0 ? 'high' : 'auto'}
                    />
                  </Box>
                )}
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                    <Typography variant="h6" fontWeight={700} sx={{ fontSize: { xs: 16, md: 'inherit' } }}>{s.title}</Typography>
                    <Chip size="small" label={(dict as any)[s.category] || s.category} />
                  </Stack>
                  {s.summary && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        display: '-webkit-box', WebkitLineClamp: { xs: 2, md: 'unset' }, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        fontSize: { xs: 13, md: 'inherit' }
                      }}
                    >
                      {s.summary}
                    </Typography>
                  )}
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>

        {/* Capabilities */}
        <Stack gap={1} sx={{ mb: 2, mt: { xs: isFa ? 0.5 : 0, md: 0 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography component="h2" variant="h5" fontWeight={800} noWrap={false} sx={{ fontSize: { xs: isFa ? 17 : 18, md: 'inherit' } }}>{dict.capabilities}</Typography>
              <Typography color="text.secondary" sx={{ fontSize: { xs: 13, md: 'inherit' } }}>{dict.nav_capabilities_sub}</Typography>
            </Box>
            <Button component={NextLink} href={`/${locale}/capabilities`} size="small">{dict.view_all || 'View all'}</Button>
          </Stack>
        </Stack>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: { xs: isFa ? 3 : 2.5, md: 3 }, mb: 6 }}>
          {capabilities.map((c: any) => (
            <Card key={String(c._id)} variant="outlined" sx={{ height: '100%', borderRadius: { xs: 2, md: 3 } }}>
              <CardActionArea component={NextLink as any} href={`/${locale}/capabilities/${c.slug || c._id}`}>
                {c.imageFileId && (
                  <Box sx={{ position: 'relative', height: { xs: 120, md: 140 } }}>
                    <Image
                      src={`/api/media/${c.imageFileId}`}
                      alt={c.title}
                      fill
                      sizes="(max-width: 900px) 100vw, 50vw"
                      style={{ objectFit: 'cover' }}
                      fetchPriority="auto"
                    />
                  </Box>
                )}
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                    <Typography variant="h6" fontWeight={700} sx={{ fontSize: { xs: 16, md: 'inherit' } }}>{c.title}</Typography>
                    <Chip size="small" label={(dict as any)[c.area] || c.area} />
                  </Stack>
                  {c.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        display: '-webkit-box', WebkitLineClamp: { xs: 2, md: 'unset' }, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        fontSize: { xs: 13, md: 'inherit' }
                      }}
                    >
                      {c.description}
                    </Typography>
                  )}
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>

        {/* Case studies & Blog */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: { xs: isFa ? 3.25 : 2.5, md: 4 }, mb: 6 }}>
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Box>
                <Typography component="h2" variant="h5" fontWeight={800} sx={{ fontSize: { xs: 18, md: 'inherit' } }}>{dict.case_studies}</Typography>
                <Typography color="text.secondary">{dict.nav_case_studies_sub}</Typography>
              </Box>
              <Button component={NextLink} href={`/${locale}/case-studies`} size="small">{dict.view_all || 'View all'}</Button>
            </Stack>
            <Stack gap={{ xs: isFa ? 2.5 : 2, md: 2 }}>
              {cases.map((c: any) => (
                <Card key={String(c._id)} variant="outlined" sx={{ borderRadius: { xs: 2, md: 3 } }}>
                  <CardActionArea component={NextLink as any} href={`/${locale}/case-studies/${c.slug}`} sx={{ display: 'flex', alignItems: 'stretch', flexDirection: { xs: 'column', md: 'row' } }}>
                    {c.coverFileId && (
                      <Box sx={{ position: 'relative', width: { xs: '100%', md: 140 }, height: { xs: 160, md: 140 }, flexShrink: 0 }}>
                        <Image
                          src={`/api/media/${c.coverFileId}`}
                          alt={c.title}
                          fill
                          sizes="(max-width: 900px) 100vw, 140px"
                          style={{ objectFit: 'cover' }}
                        />
                      </Box>
                    )}
                    <CardContent sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight={700} sx={{ fontSize: { xs: 15, md: 'inherit' } }}>{c.title}</Typography>
                      {c.summary && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ display: '-webkit-box', WebkitLineClamp: { xs: 2, md: 'unset' }, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontSize: { xs: 13, md: 'inherit' } }}
                        >
                          {c.summary}
                        </Typography>
                      )}
                    </CardContent>
                  </CardActionArea>
                </Card>
              ))}
            </Stack>
          </Box>
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Box>
                <Typography component="h2" variant="h5" fontWeight={800} sx={{ fontSize: { xs: 18, md: 'inherit' } }}>{dict.blog}</Typography>
                <Typography color="text.secondary">{dict.nav_blog_sub}</Typography>
              </Box>
              <Button component={NextLink} href={`/${locale}/blog`} size="small">{dict.view_all || 'View all'}</Button>
            </Stack>
            <Stack gap={{ xs: isFa ? 2.5 : 2, md: 2 }}>
              {posts.map((p: any) => (
                <Card key={String(p._id)} variant="outlined" sx={{ borderRadius: { xs: 2, md: 3 } }}>
                  <CardActionArea component={NextLink} href={`/${locale}/blog/${p.slug}`} sx={{ display: 'flex', alignItems: 'stretch', flexDirection: { xs: 'column', md: 'row' } }}>
                    {p.coverFileId && (
                      <Box sx={{ position: 'relative', width: { xs: '100%', md: 140 }, height: { xs: 160, md: 140 }, flexShrink: 0 }}>
                        <Image
                          src={`/api/media/${p.coverFileId}`}
                          alt={p.title}
                          fill
                          sizes="(max-width: 900px) 100vw, 140px"
                          style={{ objectFit: 'cover' }}
                        />
                      </Box>
                    )}
                    <CardContent sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight={700} sx={{ fontSize: { xs: 15, md: 'inherit' } }}>{p.title}</Typography>
                      {p.excerpt && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ display: '-webkit-box', WebkitLineClamp: { xs: 2, md: 'unset' }, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontSize: { xs: 13, md: 'inherit' } }}
                        >
                          {p.excerpt}
                        </Typography>
                      )}
                    </CardContent>
                  </CardActionArea>
                </Card>
              ))}
            </Stack>
          </Box>
        </Box>

        {/* Jobs */}
        <Stack gap={1} sx={{ mb: 2, mt: { xs: isFa ? 0.5 : 0, md: 0 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography component="h2" variant="h5" fontWeight={800} sx={{ fontSize: { xs: isFa ? 17 : 18, md: 'inherit' } }}>{dict.jobs}</Typography>
              <Typography color="text.secondary" sx={{ fontSize: { xs: 13, md: 'inherit' } }}>{dict.nav_jobs_sub}</Typography>
            </Box>
            <Button component={NextLink} href={`/${locale}/jobs`} size="small">{dict.view_all || 'View all'}</Button>
          </Stack>
        </Stack>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: { xs: isFa ? 3 : 2.5, md: 3 } }}>
          {jobs.map((j: any) => (
            <Card key={String(j._id)} variant="outlined" sx={{ borderRadius: { xs: 2, md: 3 }, height: '100%' }}>
              <CardActionArea component={NextLink} href={`/${locale}/jobs/${j.slug}`}>
                {j.imageFileId && (
                  <Box sx={{ position: 'relative', height: { xs: 100, md: 120 } }}>
                    <Image
                      src={`/api/media/${j.imageFileId}`}
                      alt={j.title}
                      fill
                      sizes="(max-width: 900px) 100vw, 33vw"
                      style={{ objectFit: 'cover' }}
                    />
                  </Box>
                )}
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                    <Typography variant="h6" fontWeight={700} sx={{ fontSize: { xs: 16, md: 'inherit' } }}>{j.title}</Typography>
                    <Chip size="small" label={j.type} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: 13, md: 'inherit' } }}>{j.location}</Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      </Container>
    </>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: 'en'|'fa' }> }): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDict(locale);
  return buildListMetadata({
    locale,
    path: '',
    title: dict.title,
    description: dict.tagline
  });
}
