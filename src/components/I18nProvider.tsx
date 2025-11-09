"use client";

import React from 'react';
import { I18nextProvider } from 'react-i18next';
import { ensureI18n } from '@/i18n';
import { usePathname } from 'next/navigation';

export default function I18nProvider({ children, initialLocale }: { children: React.ReactNode; initialLocale?: 'en'|'fa' }) {
  // Initialize with SSR-provided locale to avoid hydration mismatch
  const i18n = ensureI18n(initialLocale);
  const pathname = usePathname();
  // Change language outside render to avoid React warning
  React.useEffect(() => {
    const ssrLocale = initialLocale;
    if (ssrLocale && i18n.language !== ssrLocale) {
      i18n.changeLanguage(ssrLocale);
      return;
    }
    if (pathname) {
      const seg = pathname.split('/').filter(Boolean)[0];
      if ((seg === 'en' || seg === 'fa') && i18n.language !== seg) {
        i18n.changeLanguage(seg);
      }
    }
  }, [initialLocale, pathname, i18n]);
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
