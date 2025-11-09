import { z } from 'zod';

export const SolutionFormSchema = z.object({
  title: z.string().min(1),
  slug: z.string().optional(),
  category: z.enum(['software', 'hardware', 'networking']),
  summary: z.string().optional().default(''),
  contentHtml: z.string().optional().default(''),
  imageFileId: z.string().optional(),
  published: z.boolean().optional().default(false),
});

