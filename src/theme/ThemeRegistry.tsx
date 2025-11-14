"use client";

import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import baseTheme from './theme';
import React from 'react';
import { usePathname } from 'next/navigation';
import { enUS, faIR } from '@mui/material/locale';

export default function ThemeRegistry({ children, initialLocale }: { children: React.ReactNode; initialLocale?: 'en'|'fa' }) {
  const pathname = usePathname();
  const seg = (pathname || '/').split('/').filter(Boolean)[0];
  const derived = seg === 'fa' ? 'fa' : 'en';
  const effectiveLocale = initialLocale || derived;
  const isRtl = effectiveLocale === 'fa';
  const themed = React.useMemo(
    () => createTheme(baseTheme, { direction: isRtl ? 'rtl' : 'ltr' }, isRtl ? faIR : enUS),
    [isRtl]
  );
  return (
    <>
      <InitColorSchemeScript attribute="class" />
      <AppRouterCacheProvider options={{ enableCssLayer: true }}>
        <ThemeProvider theme={themed}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </AppRouterCacheProvider>
    </>
  );
}
