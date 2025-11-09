import React from 'react';
import '@/lib/mongoose';
import BlogPost from '@/models/BlogPost';
import { Container, Typography, Box } from '@mui/material';
import Image from 'next/image';
import type { Metadata } from 'next';
import { buildDocMetadata, getBaseUrl } from '@/lib/metadata';
import mongooseConn from '@/lib/mongoose';
export const revalidate = 300;

export default async function BlogPostPage({ params }: { params: Promise<{ locale: 'en'|'fa'; slug: string }> }) {
  const { locale, slug } = await params;
  const post = await BlogPost.findOne({ locale, slug, published: true }).lean();
  if (!post) return <Container sx={{ py: 6 }}><Typography>Not found</Typography></Container>;
  return (
    <Container sx={{ py: 6 }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: post.title,
          description: post.excerpt || '',
          image: post.coverFileId ? [`${getBaseUrl()}/api/media/${post.coverFileId}`] : undefined,
          datePublished: (post as any).createdAt || undefined,
          inLanguage: (post as any).locale || undefined,
          url: `${getBaseUrl()}/${(post as any).locale}/blog/${(post as any).slug}`
        }) }}
      />
      {post.coverFileId && (
        <Box sx={{ position: 'relative', width: '100%', height: { xs: 220, md: 420 }, borderRadius: 2, overflow: 'hidden', mb: 2 }}>
          <Image src={`/api/media/${post.coverFileId}`} alt={post.title} fill sizes="100vw" style={{ objectFit: 'cover' }} />
        </Box>
      )}
      <Typography component="h1" variant="h3" fontWeight={800} gutterBottom>{post.title}</Typography>
      {post.excerpt && <Typography color="text.secondary" gutterBottom>{post.excerpt}</Typography>}
      <Box mt={3} sx={{ '& img': { maxWidth: '100%', height: 'auto' } }} dangerouslySetInnerHTML={{ __html: post.contentHtml || '' }} />
    </Container>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: 'en'|'fa'; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  await mongooseConn;
  const post = await BlogPost.findOne({ locale, slug, published: true }).select('title excerpt coverFileId').lean();
  const title = post?.title || 'Blog';
  const description = post?.excerpt || '';
  const image = post?.coverFileId ? `${getBaseUrl()}/api/media/${post.coverFileId}` : undefined;
  return buildDocMetadata({ locale, path: `/blog/${slug}`, title, description, image });
}
