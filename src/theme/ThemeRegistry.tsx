"use client";

import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import baseTheme from './theme';
import React from 'react';
import { usePathname } from 'next/navigation';
import { enUS, faIR } from '@mui/material/locale';

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const seg = (pathname || '/').split('/').filter(Boolean)[0];
  const isRtl = seg === 'fa';
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
