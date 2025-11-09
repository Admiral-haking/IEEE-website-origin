"use client";

import React from 'react';
import { Box, Button, Container, Stack, Typography } from '@mui/material';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';

export default function Hero() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const parts = (pathname || '/').split('/').filter(Boolean);
  const locale = parts[0] === 'en' || parts[0] === 'fa' ? parts[0] : 'en';
  const isFa = locale === 'fa';
  return (
    <Box sx={{ position: 'relative', pt: { xs: 8, md: 16 }, pb: { xs: 6, md: 12 }, overflow: 'hidden' }}>
      <Box
        aria-hidden
        sx={{
          position: 'absolute', inset: 0, zIndex: -1,
          background: 'radial-gradient(800px 400px at 50% -50%, rgba(82,168,255,0.35), transparent 50%), radial-gradient(600px 300px at 80% 20%, rgba(126,87,194,0.25), transparent 60%)'
        }}
      />
      <Container>
        <Stack gap={{ xs: isFa ? 1.75 : 1.5, md: 2 }} alignItems="center" textAlign="center">
          <Typography
            variant="h2"
            fontWeight={800}
            sx={{ letterSpacing: isFa ? 0 : '-0.5px', fontSize: { xs: isFa ? 27 : 28, sm: 32, md: 'inherit' }, lineHeight: { xs: 1.2, md: 'inherit' } }}
          >
            {t('title')}
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ fontSize: { xs: 14, sm: 16, md: 'inherit' }, lineHeight: { xs: 1.6, md: 'inherit' }, maxWidth: 720 }}
          >
            {t('tagline')}
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5} sx={{ mt: 1, width: '100%', maxWidth: 520 }}>
            <Button component={NextLink} href={`/${locale}/solutions`} fullWidth sx={{ py: { xs: 1.1, md: 1 } }} variant="contained" color="primary">{t('explore_solutions')}</Button>
            <Button component={NextLink} href={`/${locale}/contact`} fullWidth sx={{ py: { xs: 1.1, md: 1 } }} variant="outlined" color="inherit">{t('contact_now')}</Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
