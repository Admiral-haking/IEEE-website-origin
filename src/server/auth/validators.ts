export {
  PasswordSchema,
  RegisterSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from '@/validators/auth';

export type RegisterInput = import('zod').infer<typeof import('@/validators/auth').RegisterSchema>;
export type LoginInput = import('zod').infer<typeof import('@/validators/auth').LoginSchema>;
export type ForgotPasswordInput = import('zod').infer<typeof import('@/validators/auth').ForgotPasswordSchema>;
export type ResetPasswordInput = import('zod').infer<typeof import('@/validators/auth').ResetPasswordSchema>;

