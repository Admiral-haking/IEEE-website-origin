"use client";

import React from 'react';
import { Box, CircularProgress, Fade, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from '@mui/material/styles';
import Image from 'next/image';
import logoLight from '@/app/logo.png';
import logoDark from '@/app/logo-dark-mode.png';

export default function SplashScreen() {
  const { mode } = useColorScheme();
  const [visible, setVisible] = React.useState(true);
  const { t } = useTranslation();

  React.useEffect(() => {
    const done = () => setVisible(false);
    if (document.readyState === 'complete') {
      // Ensure the splash is visible at least briefly even if load already fired
      const id = setTimeout(done, 400);
      return () => clearTimeout(id);
    }
    window.addEventListener('load', done, { once: true });
    return () => window.removeEventListener('load', done);
  }, []);

  const logo = mode === 'dark' ? logoDark : logoLight;

  return (
    <Fade in={visible} timeout={{ enter: 100, exit: 400 }} unmountOnExit>
      <Box
        aria-label="Loading"
        role="status"
        sx={{
          position: 'fixed', inset: 0, zIndex: (t) => t.zIndex.modal + 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          bgcolor: 'background.default'
        }}
      >
        <Stack gap={2} alignItems="center">
          <Image src={logo} alt={(t('logo_alt') as any) || 'IEEE logo'} height={48} style={{ width: 'auto' }} />
          <Typography variant="body2" color="text.secondary">{t('loading') as any || 'Loading...'}</Typography>
          <CircularProgress size={20} thickness={5} color="secondary" />
        </Stack>
      </Box>
    </Fade>
  );
}
