import { z } from 'zod';

export const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/^(?=.*[A-Z])(?=.*\d).+$/, 'Password must include an uppercase letter and a number');

// Shared auth schemas (client/server)
export const RegisterSchema = z.object({
  email: z.string().email().transform((s) => s.toLowerCase()),
  password: PasswordSchema,
  // English display name (Latin)
  name: z.string().min(2, 'Required'),
  // Persian full name (local)
  full_name: z.string().min(2, 'Required'),
  // Phone number (basic validation, 7-15 digits allowing + and spaces)
  phone: z
    .string()
    .min(7, 'Invalid phone')
    .max(20, 'Invalid phone')
    .regex(/^[+]?[- 0-9()]{7,20}$/i, 'Invalid phone'),
  // Optional at signup, required later in profile
  student_id: z.string().min(5).optional(),
  username: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-z0-9_\.]+$/)
    .transform((s) => s.toLowerCase())
    .optional(),
  locale: z.enum(['en','fa']).optional().default('en')
});

export const LoginSchema = z.object({
  identifier: z.string().min(1),
  // keep login lenient; server authenticates
  password: z.string().min(1),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email().transform((s) => s.toLowerCase()),
  locale: z.enum(['en','fa']).optional(),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(10),
  password: PasswordSchema,
});
