"use client";
import React from 'react';
import { Box, Container, Paper, Stack, Typography } from '@mui/material';
import Image from 'next/image';
import { useColorScheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { usePathname } from 'next/navigation';
import logoLight from '@/app/logo.png';
import logoDark from '@/app/logo-dark-mode.png';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { mode } = useColorScheme();
  const logo = mode === 'dark' ? logoDark : logoLight;
  const { t } = useTranslation();
  const pathname = usePathname();
  const isSignup = (pathname || '').includes('/signup');
  const title = isSignup ? (t('signup_title') || t('sign_up')) : (t('auth_welcome_title'));
  const subtitle = isSignup ? (t('signup_subtitle') || '') : (t('auth_welcome_subtitle'));
  return (
    <Box sx={{ position: 'relative', minHeight: '100dvh', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
      <Box
        aria-hidden
        sx={{
          position: 'absolute', inset: 0, zIndex: -1,
          background: `radial-gradient(900px 500px at 50% -20%, rgba(82,168,255,0.20), transparent 60%),
                       radial-gradient(700px 400px at 90% 10%, rgba(126,87,194,0.18), transparent 60%)`
        }}
      />
      <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 } }}>
        <Stack gap={3} alignItems="center" textAlign="center">
          <Stack direction="row" spacing={1} alignItems="center">
            <Image src={logo} alt="IEEE logo" height={28} style={{ width: 'auto' }} />
            <Typography variant="h6" fontWeight={700} suppressHydrationWarning>{t('name')}</Typography>
          </Stack>
          <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.3px' }} suppressHydrationWarning>{title}</Typography>
          <Typography color="text.secondary" suppressHydrationWarning>{subtitle}</Typography>
          <Paper
            variant="outlined"
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: 4,
              width: '100%',
              backdropFilter: 'blur(8px)'
            }}
          >
            {children}
          </Paper>
          <Typography variant="caption" color="text.secondary">Protected by modern security practices</Typography>
        </Stack>
      </Container>
    </Box>
  );
}
