import { z } from 'zod';

export const JobFormSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  location: z.string().optional().default('Remote'),
  type: z.enum(['full-time', 'part-time', 'contract', 'internship']),
  descriptionHtml: z.string().optional().default(''),
  requirements: z.string().optional().default(''),
  applyLink: z.string().optional().default(''),
  imageFileId: z.string().optional(),
  published: z.boolean().optional().default(false),
});

