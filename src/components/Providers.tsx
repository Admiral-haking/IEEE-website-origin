"use client";

import React, { Suspense } from 'react';
import I18nProvider from '@/components/I18nProvider';
import RtlProvider from '@/theme/rtl';
import ThemeRegistry from '@/theme/ThemeRegistry';
import SplashScreen from '@/components/SplashScreen';
import TopProgressBar from '@/components/TopProgressBar';
import { configure } from 'axios-hooks';
import axios from '@/lib/axios';
import VitalsReporter from '@/components/VitalsReporter';

export default function Providers({ children, initialLocale }: { children: React.ReactNode; initialLocale?: 'en'|'fa' }) {
  // Configure axios-hooks to use our axios instance with baseURL
  // and disable SSR data fetching to avoid server-side auth/cookie issues.
  configure({ axios, defaultOptions: { ssr: false } });
  return (
    <I18nProvider initialLocale={initialLocale}>
      <RtlProvider initialLocale={initialLocale}>
        <ThemeRegistry initialLocale={initialLocale}>
          <Suspense fallback={null}>
            <TopProgressBar />
          </Suspense>
          <VitalsReporter />
          {children}
          <SplashScreen />
        </ThemeRegistry>
      </RtlProvider>
    </I18nProvider>
  );
}
