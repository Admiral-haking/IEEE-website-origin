import { z } from 'zod';

export const CaseFormSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  summary: z.string().optional().default(''),
  contentHtml: z.string().optional().default(''),
  client: z.string().optional().default(''),
  industry: z.string().optional().default(''),
  date: z.string().optional().default(''),
  coverFileId: z.string().optional(),
  published: z.boolean().optional().default(false),
});

