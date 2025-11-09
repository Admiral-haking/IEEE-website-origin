import { z } from 'zod';

export const PostFormSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  excerpt: z.string().optional().default(''),
  contentHtml: z.string().optional().default(''),
  coverFileId: z.string().optional(),
  tags: z.string().optional().default(''),
  published: z.boolean().optional().default(false),
});

