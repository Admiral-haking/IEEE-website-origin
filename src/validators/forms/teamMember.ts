import { z } from 'zod';

export const MemberFormSchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  role: z.string().min(1),
  discipline: z.enum(['software', 'hardware', 'networking']),
  avatarUrl: z.string().optional().or(z.literal('')),
  location: z.string().optional().or(z.literal('')),
  bio: z.string().optional().or(z.literal('')),
  skills: z.string().optional().or(z.literal('')),
  github: z.string().optional().or(z.literal('')),
  linkedin: z.string().optional().or(z.literal('')),
  twitter: z.string().optional().or(z.literal('')),
  website: z.string().optional().or(z.literal('')),
  portfolioLink: z.string().optional().or(z.literal('')),
  resumeFileId: z.string().optional().or(z.literal('')),
});

