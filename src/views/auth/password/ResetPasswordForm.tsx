"use client";

import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import useAxios from 'axios-hooks';
import { Alert, Box, Button, Stack, TextField, InputAdornment, IconButton, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import type { Route } from 'next';
import { useTranslation } from 'react-i18next';

const PasswordSchema = z
  .string()
  .min(8, 'Min 8 chars')
  .regex(/^(?=.*[A-Z])(?=.*\d).+$/, 'Must include an uppercase and a number');

const Schema = z.object({
  password: PasswordSchema,
  confirm: z.string().min(8),
}).refine((d) => d.password === d.confirm, { path: ['confirm'], message: 'Passwords must match' });

type Values = z.infer<typeof Schema>;

export default function ResetPasswordForm({ token, locale }: { token: string; locale: 'en'|'fa' }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isRtl = theme.direction === 'rtl';
  const [showPassword, setShowPassword] = React.useState(false);
  const [{ data, error, loading }, exec] = useAxios({ url: '/api/auth/reset-password', method: 'POST' }, { manual: true });
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<Values>({
    resolver: zodResolver(Schema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: { password: '', confirm: '' },
  });

  const onSubmit = async (values: Values) => {
    await exec({ data: { token, password: values.password } });
    if (!error) reset({ password: '', confirm: '' });
  };

  const success = data?.ok;
  const errResponse = (error as any)?.response as { status?: number; data?: any } | undefined;
  const errText = errResponse?.data?.error || t('password_reset_error');

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ maxWidth: 400, mx: 'auto' }}>
      <Stack gap={2.5}>
        <Typography variant="h5" fontWeight={800} textAlign="center">
          {t('password_reset_title') as string}
        </Typography>
        {success && (
          <Alert severity="success">{t('password_reset_success') as string}</Alert>
        )}
        {error && !success && (
          <Alert severity="error">{String(errText)}</Alert>
        )}
        <TextField
          type={showPassword ? 'text' : 'password'}
          label={t('password_label')}
          placeholder="••••••••"
          autoComplete="new-password"
          {...register('password')}
          error={!!errors.password}
          helperText={errors.password?.message}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockOutlinedIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword((v) => !v)} edge="end" size="small">
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            )
          }}
          InputLabelProps={isRtl ? { sx: { left: 14, right: 'auto', transformOrigin: 'left top', textAlign: 'left' } } : undefined}
        />
        <TextField
          type={showPassword ? 'text' : 'password'}
          label={t('confirm_password')}
          placeholder="••••••••"
          autoComplete="new-password"
          {...register('confirm')}
          error={!!errors.confirm}
          helperText={errors.confirm?.message}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockOutlinedIcon fontSize="small" />
              </InputAdornment>
            )
          }}
          InputLabelProps={isRtl ? { sx: { left: 14, right: 'auto', transformOrigin: 'left top', textAlign: 'left' } } : undefined}
        />
        <Button type="submit" variant="contained" color="secondary" disabled={isSubmitting || loading}>
          {t('password_reset_cta') as string}
        </Button>
        <Button variant="text" href={`/${locale}/signin` as Route} sx={{ alignSelf: 'center' }}>
          {t('sign_in')}
        </Button>
      </Stack>
    </Box>
  );
}
