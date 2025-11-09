import { z } from 'zod';

export const UserRoleSchema = z.enum(['member', 'volunteer', 'executive', 'admin']);

const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/^(?=.*[A-Z])(?=.*\d).+$/, 'Password must include an uppercase letter and a number');

export const CreateUserSchema = z.object({
  name: z.string().min(1).optional(),
  full_name: z.string().min(1).optional(),
  phone: z.string().min(5).optional(),
  username: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-z0-9_\.]+$/)
    .transform((s) => s.toLowerCase())
    .optional(),
  email: z.string().email().transform((s) => s.toLowerCase()),
  password: PasswordSchema,
  role: UserRoleSchema.default('member'),
  membership_status: z.enum(['active', 'expired', 'pending', 'reviewed', 'approved', 'rejected', 'none']).optional(),
});

export const UpdateUserSchema = z.object({
  name: z.string().min(1).optional(),
  full_name: z.string().min(1).optional(),
  username: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-z0-9_\.]+$/)
    .transform((s) => s.toLowerCase())
    .optional(),
  email: z.string().email().transform((s) => s.toLowerCase()).optional(),
  password: PasswordSchema.optional(),
  role: UserRoleSchema.optional(),
  membership_status: z.enum(['active', 'expired', 'pending', 'reviewed', 'approved', 'rejected', 'none']).optional(),
  phone: z.string().min(5).optional(),
  major: z.enum(['computer','electrical']).optional(),
  degree: z.enum(['bachelor','master','phd']).optional(),
  student_id: z.string().min(5).optional(),
  bio: z.string().optional(),
  social_links: z
    .array(z.object({ platform: z.string().min(1), url: z.string().url().or(z.string().min(1)) }))
    .optional(),
  projects: z
    .array(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        link: z.string().url().optional(),
        start_date: z.coerce.date().optional(),
        end_date: z.coerce.date().optional(),
      })
    )
    .optional(),
  certificates: z
    .array(
      z.object({
        name: z.string().min(1),
        issuer: z.string().optional(),
        issue_date: z.coerce.date().optional(),
        credential_id: z.string().optional(),
        credential_url: z.string().optional(),
      })
    )
    .optional(),
  profile_picture: z.string().min(1).optional(),
  permissions: z.record(z.any()).optional(),
  locale: z.enum(['en','fa']).optional(),
});

export const ProfileRequiredSchema = z.object({
  name: z.string().min(1),
  full_name: z.string().min(1),
  username: z.string().min(3).max(32).regex(/^[a-z0-9_\.]+$/).transform((s) => s.toLowerCase()),
  email: z.string().email().transform((s) => s.toLowerCase()),
  phone: z.string().min(5),
  university: z.string().optional(),
  major: z.enum(['computer','electrical']),
  degree: z.enum(['bachelor','master','phd']),
  entry_year: z.coerce.number().int().optional(),
  student_id: z.string().min(5),
  ieee_membership_id: z.string().optional(),
  profile_picture: z.string().min(1).optional(),
  bio: z.string().optional(),
  social_links: z
    .array(z.object({ platform: z.string().min(1), url: z.string().url().or(z.string().min(1)) }))
    .optional(),
  projects: z
    .array(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        link: z.string().url().optional(),
        start_date: z.coerce.date().optional(),
        end_date: z.coerce.date().optional(),
      })
    )
    .optional(),
  certificates: z
    .array(
      z.object({
        name: z.string().min(1),
        issuer: z.string().optional(),
        issue_date: z.coerce.date().optional(),
        credential_id: z.string().optional(),
        credential_url: z.string().optional(),
      })
    )
    .optional(),
  locale: z.enum(['en','fa']).optional(),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type ProfileRequiredInput = z.infer<typeof ProfileRequiredSchema>;
