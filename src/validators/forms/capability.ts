import { z } from 'zod';

export const CapabilityFormSchema = z.object({
  title: z.string().min(1),
  slug: z.string().optional(),
  area: z.enum(['software', 'hardware', 'networking', 'devops']),
  description: z.string().optional().default(''),
  contentHtml: z.string().optional().default(''),
  imageFileId: z.string().optional(),
});

