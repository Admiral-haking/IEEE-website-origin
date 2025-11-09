"use client";

import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import useAxios from 'axios-hooks';
import { Alert, Box, Button, Stack, TextField, InputAdornment, IconButton, FormControlLabel, Checkbox, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import useLocale from '@/hooks/useLocale';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import type { Route } from 'next';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

const Schema = z.object({
  identifier: z.string().min(1),
  // Keep login validation lenient; server checks credentials.
  password: z.string().min(1)
});

type Values = z.infer<typeof Schema>;

type Props = { redirectTo: string };

export default function LoginForm({ redirectTo }: Props) {
  const router = useRouter();
  const routeLocale = useLocale();
  const [showPassword, setShowPassword] = React.useState(false);
  const theme = useTheme();
  const isRtl = theme.direction === 'rtl';
  const { t, i18n } = useTranslation();
  const resendLocale = i18n.language?.startsWith('fa') ? 'fa' : 'en';

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(Schema),
    defaultValues: { identifier: '', password: '' }
  });

  const [{ error }, exec] = useAxios({ url: '/api/auth/login', method: 'POST' }, { manual: true });
  const [{ loading: resendLoading }, resendExec] = useAxios({ url: '/api/auth/verify/resend', method: 'POST' }, { manual: true });
  const [retryAfter, setRetryAfter] = React.useState<number>(0);
  const [lastIdentifier, setLastIdentifier] = React.useState('');
  const [resendFeedback, setResendFeedback] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);
  React.useEffect(() => {
    const status = (error as any)?.response?.status;
    const ra = Number((error as any)?.response?.headers?.['retry-after'] || (error as any)?.response?.headers?.['Retry-After'] || 0);
    if (status === 429 && ra > 0) {
      setRetryAfter(ra);
    }
  }, [error]);
  React.useEffect(() => {
    if (retryAfter <= 0) return;
    const id = setInterval(() => setRetryAfter((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [retryAfter]);

  const [redirecting, setRedirecting] = React.useState(false);
  const onSubmit = async (values: Values) => {
    if (retryAfter > 0) return;
    setLastIdentifier(values.identifier);
    setResendFeedback(null);
    try {
      const res = await exec({ data: values });
      const href = (redirectTo || `/${routeLocale}/panel`) as Route;
      // Smooth redirect: brief loader to avoid UI flicker and let cookie settle
      setRedirecting(true);
      if (typeof window !== 'undefined') {
        setTimeout(() => window.location.assign(href), 400);
      } else {
        router.replace(href);
      }
    } catch {
      // error state handled by axios-hooks error binding above
    }
  };

  const errResponse = (error as any)?.response as { status?: number; data?: any } | undefined;
  const errText = errResponse
    ? (errResponse.status === 401 ? t('invalid_credentials')
      : errResponse.status === 403 ? t('email_not_verified') || t('login_failed')
      : errResponse.status === 429 ? t('too_many_attempts')
      : (errResponse.data?.error || t('login_failed')))
    : '';
  const errIsUnverified = errResponse?.status === 403;

  const onResend = async () => {
    const email = lastIdentifier.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      setResendFeedback({ type: 'error', message: String(t('resend_verification_email_hint')) });
      return;
    }
    setResendFeedback(null);
    try {
      await resendExec({ data: { email, locale: resendLocale } });
      setResendFeedback({ type: 'success', message: String(t('resend_verification_success')) });
    } catch (err: any) {
      const res = err?.response as { status?: number; data?: any } | undefined;
      const message =
        res?.status === 404 ? t('resend_verification_not_found')
          : res?.status === 400 ? t('resend_verification_already')
          : res?.status === 429 ? t('too_many_attempts')
          : res?.data?.error || t('resend_verification_error');
      setResendFeedback({ type: 'error', message: String(message) });
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ position: 'relative' }}>
      <Stack gap={2.5}>
        {redirecting && (
          <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.paper', zIndex: 2, borderRadius: 2, opacity: 0.9 }}>
            <Stack alignItems="center" gap={1}>
              <Box className="spinner" sx={{ width: 28, height: 28, borderRadius: '50%', border: theme => `3px solid ${theme.palette.divider}`, borderTopColor: 'secondary.main', animation: 'spin 0.8s linear infinite' }} />
              <Typography variant="caption" color="text.secondary">{(t('signing_in') as any) || (t('loading') as any) || 'Loading...'}</Typography>
            </Stack>
            <style jsx global>{`
              @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
          </Box>
        )}
        {error && (
          <Alert
            severity="error"
            action={
              errIsUnverified ? (
                <Button color="inherit" size="small" onClick={onResend} disabled={resendLoading}>
                  {t('resend_verification')}
                </Button>
              ) : undefined
            }
          >
            {errText}
            {retryAfter > 0 ? ` (${retryAfter}s)` : ''}
          </Alert>
        )}

        {resendFeedback && (
          <Alert severity={resendFeedback.type} onClose={() => setResendFeedback(null)}>
            {resendFeedback.message}
          </Alert>
        )}

        <TextField
          label={t('login_identifier_label') || t('email_label')}
          placeholder={t('login_identifier_placeholder') || t('email_placeholder') || ''}
          autoComplete="username"
          {...register('identifier')}
          error={!!errors.identifier}
          helperText={errors.identifier?.message}
          sx={{ '& .MuiOutlinedInput-input': { px: 2 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <MailOutlineIcon fontSize="small" />
              </InputAdornment>
            )
          }}
          InputLabelProps={isRtl ? { sx: { left: 'auto', right: 16, transformOrigin: 'right top', textAlign: 'right' } } : { sx: { left: 16, transformOrigin: 'left top' } }}
        />

        <TextField
          label={t('password_label')}
          placeholder={(t('password_placeholder') as string) || ''}
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          {...register('password')}
          error={!!errors.password}
          helperText={errors.password?.message}
          sx={{ '& .MuiOutlinedInput-input': { px: 2 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockOutlinedIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton aria-label="toggle password visibility" onClick={() => setShowPassword((v) => !v)} edge="end" size="small">
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            )
          }}
          InputLabelProps={isRtl ? { sx: { left: 'auto', right: 16, transformOrigin: 'right top', textAlign: 'right' } } : { sx: { left: 16, transformOrigin: 'left top' } }}
        />

        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <FormControlLabel control={<Checkbox size="small" />} label={<Typography variant="body2">{t('remember_me')}</Typography>} />
        </Stack>

        <Button type="submit" variant="contained" color="secondary" disabled={isSubmitting || retryAfter > 0} sx={{ py: 1.2 }}>
          {t('sign_in')}
        </Button>

        <Typography variant="body2" color="text.secondary" textAlign="center">
          {t('no_account')} <Button size="small" variant="text" href={`/${routeLocale}/signup` as Route}>{t('create_one')}</Button>
        </Typography>
        <Button size="small" variant="text" href={`/${routeLocale}/forgot-password` as Route} sx={{ alignSelf: 'center' }}>
          {t('forgot_password') as string}
        </Button>
      </Stack>
    </Box>
  );
}
