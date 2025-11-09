import { z } from 'zod';

export const CreateEventSchema = z.object({
  title: z.string().min(2),
  slug: z.string().min(2),
  startAt: z.string().or(z.date()),
  endAt: z.string().or(z.date()).optional(),
  location: z.string().optional(),
  descriptionHtml: z.string().optional(),
  coverFileId: z.string().optional(),
  published: z.boolean().default(false),
  locale: z.enum(['en','fa'])
});

export const UpdateEventSchema = CreateEventSchema.partial();

export type CreateEventInput = z.infer<typeof CreateEventSchema>;
export type UpdateEventInput = z.infer<typeof UpdateEventSchema>;

