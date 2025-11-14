"use client";
import React from 'react';
import { Paper, Stack, Typography, Button, Grid, Box, Link } from '@mui/material';
import AssistWidget from '@/components/AssistWidget';
import NextLink from 'next/link';
import { useTranslation } from 'react-i18next';

export default function HelpClient() {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language?.startsWith('fa') ? 'fa' : 'en') as 'fa'|'en';
  return (
    <>
      <Typography variant="h5" fontWeight={800} gutterBottom>{t('help') as any || 'Help'}</Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
            <Stack gap={1}>
              <Typography variant="subtitle1" fontWeight={700}>{t('access') as any || 'Access'}</Typography>
              <Typography variant="body2" color="text.secondary">{t('access_doc') as any || 'Roles and permissions documentation'}</Typography>
              <Box>
                <Button LinkComponent={NextLink} href={`/${locale}/help/access`} variant="contained" size="small" color="secondary">
                  {(t('access') as any) || 'Access'}
                </Button>
              </Box>
            </Stack>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
            <Stack gap={1}>
              <Typography variant="subtitle1" fontWeight={700}>{t('contact') as any || 'Contact'}</Typography>
              <Typography variant="body2" color="text.secondary">{t('prefer_email_detail') as any}</Typography>
              <Stack direction="row" spacing={1}>
                <Button LinkComponent={NextLink} href={`/${locale}/contact`} variant="outlined" size="small">{t('contact_now') as any || t('contact')}</Button>
                <Button LinkComponent={NextLink} href={`/${locale}/privacy`} variant="text" size="small">{t('privacy') as any || 'Privacy'}</Button>
                <Button LinkComponent={NextLink} href={`/${locale}/terms`} variant="text" size="small">{t('terms') as any || 'Terms'}</Button>
              </Stack>
            </Stack>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>{t('help_faq_title') as any || 'FAQ'}</Typography>
            <Stack gap={1.5}>
              <Box>
                <Typography id="faq-login" variant="subtitle2">{t('sign_in') as any}</Typography>
                <Typography variant="body2" color="text.secondary">{t('auth_welcome_subtitle') as any}</Typography>
              </Box>
              <Box>
                <Typography id="faq-membership" variant="subtitle2">{t('membership') as any}</Typography>
                <Typography variant="body2" color="text.secondary">{t('membership_review_desc') as any}</Typography>
              </Box>
              <Box>
                <Typography id="faq-notifications" variant="subtitle2">{t('unread_notifications') as any}</Typography>
                <Typography variant="body2" color="text.secondary">{t('help_hint_dashboard') as any}</Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
      <AssistWidget />
    </>
  );
}
