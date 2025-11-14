"use client";

import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import useAxios from 'axios-hooks';
import { Alert, Box, Button, Stack, TextField, Typography, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import type { Route } from 'next';

const Schema = z.object({
  email: z.string().email('Invalid email'),
});

type Values = z.infer<typeof Schema>;

export default function ForgotPasswordForm({ locale }: { locale: 'en'|'fa' }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isRtl = theme.direction === 'rtl';
  const [{ data, error, loading }, exec] = useAxios({ url: '/api/auth/forgot-password', method: 'POST' }, { manual: true });
  const { register, handleSubmit, formState: { errors, isSubmitting, touchedFields, isSubmitted } } = useForm<Values>({
    resolver: zodResolver(Schema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: Values) => {
    await exec({ data: { ...values, locale } });
  };

  const success = data?.ok;
  const errResponse = (error as any)?.response as { status?: number; data?: any } | undefined;
  const errText = errResponse?.data?.error || t('password_reset_error');

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ maxWidth: 400, mx: 'auto' }}>
      <Stack gap={2.5}>
        <Typography variant="h5" fontWeight={800} textAlign="center">
          {t('forgot_password') as string}
        </Typography>
        {success && (
          <Alert severity="success">{t('password_reset_requested') as string}</Alert>
        )}
        {error && !success && (
          <Alert severity="error">{String(errText)}</Alert>
        )}
        <Tooltip open={!!errors.email && (touchedFields.email || isSubmitted)} title={(touchedFields.email || isSubmitted) ? (errors.email?.message || '') : ''} placement="top" arrow>
          <TextField
            type="email"
            label={t('email_label')}
            placeholder={t('email_placeholder') || ''}
            autoComplete="email"
            {...register('email')}
            error={!!errors.email && (touchedFields.email || isSubmitted)}
            helperText={(!!errors.email && (touchedFields.email || isSubmitted)) ? errors.email?.message : ''}
            InputLabelProps={isRtl ? { sx: { left: 14, right: 'auto', transformOrigin: 'left top', textAlign: 'left' } } : undefined}
          />
        </Tooltip>
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
