"use client";

import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import useAxios from 'axios-hooks';
import { Alert, Box, Button, Stack, TextField, InputAdornment, IconButton, Typography } from '@mui/material';
import { usePathname, useRouter } from 'next/navigation';
import useLocale from '@/hooks/useLocale';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import PhoneIphoneOutlinedIcon from '@mui/icons-material/PhoneIphoneOutlined';
import type { Route } from 'next';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { RegisterSchema as BaseRegisterSchema } from '@/validators/auth';

// Reuse server schema and extend with confirm
const Schema = BaseRegisterSchema.extend({
  confirm: z.string().min(8),
}).refine((d) => d.password === d.confirm, { message: 'Passwords must match', path: ['confirm'] });

type Values = z.infer<typeof Schema>;

export default function SignupForm() {
  const router = useRouter();
  const locale = useLocale();
  const [showPassword, setShowPassword] = React.useState(false);
  const theme = useTheme();
  const isRtl = theme.direction === 'rtl';
  const { t } = useTranslation();

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<Values>({
    resolver: zodResolver(Schema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: { name: '', full_name: '', phone: '', student_id: '', username: '', email: '', password: '', confirm: '' }
  });

  const [{ error }, exec] = useAxios({ url: '/api/auth/register', method: 'POST' }, { manual: true });
  const [verificationPending, setVerificationPending] = React.useState(false);
  const [submittedEmail, setSubmittedEmail] = React.useState('');
  const [retryAfter, setRetryAfter] = React.useState<number>(0);
  React.useEffect(() => {
    const status = (error as any)?.response?.status;
    const ra = Number((error as any)?.response?.headers?.['retry-after'] || (error as any)?.response?.headers?.['Retry-After'] || 0);
    if (status === 429 && ra > 0) setRetryAfter(ra);
  }, [error]);
  React.useEffect(() => {
    if (retryAfter <= 0) return;
    const id = setInterval(() => setRetryAfter((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [retryAfter]);

  const onSubmit = async (values: Values) => {
    if (retryAfter > 0) return;
    try {
      const payload = { ...values, locale } as Values & { locale: 'en'|'fa' };
      const res = await exec({ data: payload });
      const needsVerification = !!(res as any)?.data?.needsVerification;
      setVerificationPending(needsVerification);
      if (needsVerification) {
        setSubmittedEmail(values.email);
        return;
      }
      const role: string | undefined = (res as any)?.data?.user?.role;
      const dest = role === 'admin' ? `/${locale}/admin` : `/${locale}/profile`;
      router.push(dest as Route);
    } catch (e: any) {
      setVerificationPending(false);
      setSubmittedEmail('');
      const res = e?.response as { status?: number; data?: any } | undefined;
      const issues = res?.data?.errors as Array<{ path?: any[]; message?: string }> | undefined;
      if (Array.isArray(issues)) {
        issues.forEach((it) => {
          const key = String(it?.path?.[0] || '');
          const msg = it?.message || 'Invalid';
          if (key) (setError as any)?.(key, { type: 'server', message: msg });
        });
      }
      if (res?.status === 409) {
        const msg = String(res?.data?.error || '').toLowerCase();
        if (msg.includes('username')) (setError as any)?.('username', { type: 'server', message: (t('username_exists') as any) || 'Username exists' });
        if (msg.includes('email')) (setError as any)?.('email', { type: 'server', message: (t('email_exists') as any) || 'Email exists' });
        if (msg.includes('phone')) (setError as any)?.('phone', { type: 'server', message: (t('phone_exists') as any) || 'Phone exists' });
        if (msg.includes('student')) (setError as any)?.('student_id', { type: 'server', message: (t('student_id_exists') as any) || 'Student ID exists' });
      }
      throw e;
    }
  };

  const labelProps = isRtl ? { sx: { left: 14, right: 'auto', transformOrigin: 'left top', textAlign: 'left' } } : undefined;

  const errResponse = (error as any)?.response as { status?: number; data?: any } | undefined;
  const errText = errResponse
    ? (errResponse.status === 409 ? ((String(errResponse.data?.error || '').toLowerCase().includes('username') ? t('username_exists') : t('email_exists'))) 
      : errResponse.status === 429 ? t('too_many_attempts')
      : (errResponse.data?.error || t('signup_failed')))
    : '';

  return (
    <Box sx={{ py: 3 }}>
      <Stack gap={3}>
        <Typography variant="h5" component="h1" fontWeight={800}>{t('signup_title') || t('sign_up')}</Typography>
        {verificationPending && (
          <Alert severity="success">
            {t('signup_verify_email_notice', { email: submittedEmail }) || 'Please check your inbox to verify your email before signing in.'}
          </Alert>
        )}
        {error && (<Alert severity="error">{String(errText)}</Alert>)}
        <Box className="w-full max-w-2xl mx-auto" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <Box sx={{ gridColumn: { xs: '1', sm: '1 / span 2' } }}>
            <TextField fullWidth label={t('email_label')} placeholder={t('email_placeholder') || ''} type="email" autoComplete="email"
              {...register('email')} error={!!errors.email} helperText={errors.email?.message}
              InputProps={{ startAdornment: (<InputAdornment position="start"><MailOutlineIcon fontSize="small" /></InputAdornment>) }}
              InputLabelProps={labelProps}
            />
          </Box>
          <TextField fullWidth label={t('password_label')} placeholder="••••••••" type={showPassword ? 'text' : 'password'} autoComplete="new-password"
            {...register('password')} error={!!errors.password} helperText={errors.password?.message}
            InputProps={{
              startAdornment: (<InputAdornment position="start"><LockOutlinedIcon fontSize="small" /></InputAdornment>),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton aria-label="toggle password visibility" onClick={() => setShowPassword((v) => !v)} edge="end" size="small">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
            InputLabelProps={labelProps}
          />
          <TextField fullWidth label={t('confirm_password')} placeholder="••••••••" type={showPassword ? 'text' : 'password'} autoComplete="new-password"
            {...register('confirm')} error={!!errors.confirm} helperText={errors.confirm?.message}
            InputProps={{ startAdornment: (<InputAdornment position="start"><LockOutlinedIcon fontSize="small" /></InputAdornment>) }}
            InputLabelProps={labelProps}
          />
          <TextField fullWidth label={t('full_name_en') as any || t('full_name')} placeholder={t('name_placeholder') || ''} autoComplete="name"
            {...register('name')} error={!!errors.name} helperText={errors.name?.message}
            InputProps={{ startAdornment: (<InputAdornment position="start"><PersonOutlineIcon fontSize="small" /></InputAdornment>) }}
            InputLabelProps={labelProps}
          />
          <TextField fullWidth label={t('full_name_fa') as any || t('full_name')} placeholder={t('full_name') as any} autoComplete="name"
            {...register('full_name' as const)} error={!!(errors as any).full_name} helperText={(errors as any).full_name?.message as any}
            InputProps={{ startAdornment: (<InputAdornment position="start"><PersonOutlineIcon fontSize="small" /></InputAdornment>) }}
            InputLabelProps={labelProps}
          />
          <TextField fullWidth label={t('phone_label') as any || t('phone')} placeholder={t('phone_placeholder') as any || ''} autoComplete="tel" type="tel"
            {...register('phone')} error={!!(errors as any).phone} helperText={(errors as any).phone?.message as any}
            InputProps={{ startAdornment: (<InputAdornment position="start"><PhoneIphoneOutlinedIcon fontSize="small" /></InputAdornment>) }}
            InputLabelProps={labelProps}
          />
          <TextField fullWidth label={t('username_label') || 'Username'} placeholder={t('username_label') || ''} autoComplete="username"
            {...register('username')} error={!!errors.username} helperText={errors.username?.message}
            InputProps={{ startAdornment: (<InputAdornment position="start"><PersonOutlineIcon fontSize="small" /></InputAdornment>) }}
            InputLabelProps={labelProps}
          />
          <TextField fullWidth label={t('student_id') as any || 'Student ID'} placeholder={t('student_id') as any} autoComplete="off"
            {...register('student_id' as any)} error={!!(errors as any).student_id} helperText={(errors as any).student_id?.message as any}
            InputLabelProps={labelProps}
          />
        </Box>
        <Button type="button" onClick={() => handleSubmit(onSubmit)()} variant="contained" color="secondary" disabled={isSubmitting || retryAfter > 0} sx={{ py: 1.2, alignSelf: 'flex-start' }}>
          {t('sign_up')}
        </Button>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          {t('have_account')} <Button size="small" variant="text" href={`/${locale}/signin` as Route}>{t('sign_in')}</Button>
        </Typography>
      </Stack>
    </Box>
  );
}
