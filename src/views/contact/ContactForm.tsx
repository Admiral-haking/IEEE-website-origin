"use client";

import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Box, Button, Grid, InputAdornment, Stack, TextField } from '@mui/material';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import SubjectIcon from '@mui/icons-material/Subject';
import MessageIcon from '@mui/icons-material/Message';
import PhoneIphoneOutlinedIcon from '@mui/icons-material/PhoneIphoneOutlined';
import useAxios from 'axios-hooks';
import { useTranslation } from 'react-i18next';

const Schema = z.object({
  name: z.string().min(2, 'Required'),
  email: z.string().email('Invalid email'),
  phone: z
    .string()
    .min(8, 'Invalid phone number')
    .max(32, 'Invalid phone number')
    .regex(/^\+?[0-9()\-\s]+$/, 'Invalid phone number'),
  subject: z.string().optional(),
  message: z.string().min(10, 'Too short')
});

type Values = z.infer<typeof Schema>;

declare global { interface Window { turnstile?: any } }

export default function ContactForm({ locale, emailFallback, phoneFallback }: { locale: 'en'|'fa'; emailFallback?: string; phoneFallback?: string }) {
  const { t } = useTranslation();
  const isFa = locale === 'fa';
  // In Farsi (RTL), float labels should anchor top-left per design
  const labelProps = isFa ? { sx: { left: 14, right: 'auto', transformOrigin: 'left top', textAlign: 'left' } } : undefined;
  const [{ data, error, loading, response }, exec] = useAxios({ url: '/api/contact', method: 'POST' }, { manual: true });
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<Values>({
    resolver: zodResolver(Schema),
    defaultValues: { name: '', email: '', phone: '', subject: '', message: '' }
  });
  const [tsToken, setTsToken] = React.useState<string>('');
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  React.useEffect(() => {
    if (!siteKey) return;
    const id = 'cf-turnstile-script';
    if (document.getElementById(id)) return;
    const s = document.createElement('script');
    s.id = id; s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'; s.async = true; s.defer = true;
    document.head.appendChild(s);
  }, [siteKey]);

  const onSubmit = async (values: Values) => {
    await exec({ data: { ...values, locale, turnstileToken: tsToken || undefined } });
    if (!error) reset({ name: '', email: '', phone: '', subject: '', message: '' });
  };

  const success = response && response.status === 201;

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack gap={1.5}>
        {success && <Alert severity="success">{t('contact_success') || 'Message sent.'}</Alert>}
        {error && <Alert severity="error">{String((error as any)?.response?.data?.error || t('contact_error'))}</Alert>}
      </Stack>
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label={t('name_label')}
            placeholder={t('name_placeholder') || ''}
            {...register('name')}
            error={!!errors.name}
            helperText={errors.name?.message}
            fullWidth
            autoComplete="name"
            InputProps={{ startAdornment: (<InputAdornment position="start"><PersonOutlineIcon fontSize="small" /></InputAdornment>) }}
            InputLabelProps={labelProps}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label={t('email_label')}
            placeholder={t('email_placeholder') || ''}
            type="email"
            {...register('email')}
            error={!!errors.email}
            helperText={errors.email?.message}
            fullWidth
            autoComplete="email"
            InputProps={{ startAdornment: (<InputAdornment position="start"><MailOutlineIcon fontSize="small" /></InputAdornment>) }}
            InputLabelProps={labelProps}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label={t('phone_label')}
            placeholder={t('phone_placeholder') || ''}
            {...register('phone')}
            error={!!errors.phone}
            helperText={errors.phone?.message}
            fullWidth
            autoComplete="tel"
            InputProps={{ startAdornment: (<InputAdornment position="start"><PhoneIphoneOutlinedIcon fontSize="small" /></InputAdornment>) }}
            InputLabelProps={labelProps}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField
            label={t('subject_label')}
            placeholder={t('subject_placeholder') || ''}
            {...register('subject')}
            fullWidth
            InputProps={{ startAdornment: (<InputAdornment position="start"><SubjectIcon fontSize="small" /></InputAdornment>) }}
            InputLabelProps={labelProps}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField
            label={t('message_label')}
            placeholder={t('message_placeholder') || ''}
            {...register('message')}
            error={!!errors.message}
            helperText={errors.message?.message}
            fullWidth
            multiline minRows={5}
            InputProps={{ startAdornment: (<InputAdornment position="start"><MessageIcon fontSize="small" /></InputAdornment>) }}
            InputLabelProps={labelProps}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button type="submit" variant="contained" color="secondary" disabled={isSubmitting || loading}>{t('send')}</Button>
            {emailFallback && <Button variant="outlined" href={`mailto:${emailFallback}`}>{t('email_us')}</Button>}
            {phoneFallback && <Button variant="outlined" href={`tel:${phoneFallback}`}>{t('call_us') || 'Call us'}</Button>}
          </Stack>
        </Grid>
        {siteKey && (
          <Grid size={{ xs: 12 }}>
            <Box className="cf-turnstile" data-sitekey={siteKey} data-callback={(token: string) => setTsToken(token)}></Box>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
