import { z } from 'zod';

export const UpdateContactMessageSchema = z.object({
  resolved: z.boolean().optional()
});

export type UpdateContactMessageInput = z.infer<typeof UpdateContactMessageSchema>;

