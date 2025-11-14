import type { MetadataRoute } from 'next';
import '@/lib/mongoose';
import BlogPost from '@/models/BlogPost';
import CaseStudy from '@/models/CaseStudy';
import Job from '@/models/Job';
import Event from '@/models/Event';
import Solution from '@/models/Solution';
import Capability from '@/models/Capability';
import TeamMember from '@/models/TeamMember';
import Project from '@/models/Project';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const locales: Array<'en'|'fa'> = ['en', 'fa'];
  const now = new Date();

  const staticPaths = ['', '/solutions', '/capabilities', '/blog', '/case-studies', '/jobs', '/team', '/about', '/contact', '/privacy', '/terms', '/projects', '/help', '/events'];
  const staticEntries = locales.flatMap((l) =>
    staticPaths.map((p) => ({
      url: `${base}/${l}${p}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: p === '' ? 1 : 0.7,
    })),
  );

  const [blogPosts, caseStudies, jobs, events, solutions, capabilities, teamMembers, projects] = await Promise.all([
    BlogPost.find({ published: true }).select('slug locale updatedAt').lean(),
    CaseStudy.find({ published: true }).select('slug locale updatedAt').lean(),
    Job.find({ published: true }).select('slug locale updatedAt').lean(),
    Event.find({ published: true }).select('slug locale updatedAt').lean(),
    Solution.find({ published: true }).select('slug locale updatedAt').lean(),
    Capability.find({}).select('slug locale updatedAt').lean(),
    TeamMember.find({}).select('slug locale updatedAt').lean(),
    Project.find({ published: true }).select('_id locale updatedAt').lean(),
  ]);

  const dynamicEntries: MetadataRoute.Sitemap = [];

  // Blog posts
  for (const p of blogPosts as any[]) {
    if (!p.slug || !p.locale) continue;
    dynamicEntries.push({
      url: `${base}/${p.locale}/blog/${p.slug}`,
      lastModified: p.updatedAt || now,
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  }

  // Case studies
  for (const c of caseStudies as any[]) {
    if (!c.slug || !c.locale) continue;
    dynamicEntries.push({
      url: `${base}/${c.locale}/case-studies/${c.slug}`,
      lastModified: c.updatedAt || now,
      changeFrequency: 'monthly',
      priority: 0.7,
    });
  }

  // Jobs
  for (const j of jobs as any[]) {
    if (!j.slug || !j.locale) continue;
    dynamicEntries.push({
      url: `${base}/${j.locale}/jobs/${j.slug}`,
      lastModified: j.updatedAt || now,
      changeFrequency: 'weekly',
      priority: 0.7,
    });
  }

  // Events
  for (const e of events as any[]) {
    if (!e.slug || !e.locale) continue;
    dynamicEntries.push({
      url: `${base}/${e.locale}/events/${e.slug}`,
      lastModified: e.updatedAt || now,
      changeFrequency: 'weekly',
      priority: 0.7,
    });
  }

  // Solutions
  for (const s of solutions as any[]) {
    if (!s.slug || !s.locale) continue;
    dynamicEntries.push({
      url: `${base}/${s.locale}/solutions/${s.slug}`,
      lastModified: s.updatedAt || now,
      changeFrequency: 'monthly',
      priority: 0.7,
    });
  }

  // Capabilities
  for (const c of capabilities as any[]) {
    if (!c.slug || !c.locale) continue;
    dynamicEntries.push({
      url: `${base}/${c.locale}/capabilities/${c.slug}`,
      lastModified: c.updatedAt || now,
      changeFrequency: 'monthly',
      priority: 0.6,
    });
  }

  // Team members
  for (const m of teamMembers as any[]) {
    if (!m.slug || !m.locale) continue;
    dynamicEntries.push({
      url: `${base}/${m.locale}/team/${m.slug}`,
      lastModified: m.updatedAt || now,
      changeFrequency: 'monthly',
      priority: 0.5,
    });
  }

  // Projects (detail pages)
  for (const p of projects as any[]) {
    if (!p._id || !p.locale) continue;
    dynamicEntries.push({
      url: `${base}/${p.locale}/projects/${p._id}`,
      lastModified: p.updatedAt || now,
      changeFrequency: 'weekly',
      priority: 0.6,
    });
  }

  return [...staticEntries, ...dynamicEntries];
}
