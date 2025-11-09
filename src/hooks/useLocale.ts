"use client";

import { useTranslation } from 'react-i18next';
import { usePathname } from 'next/navigation';

// Returns the current app locale ('en' | 'fa') prioritizing i18n state,
// with a safe fallback to the URL path segment.
export default function useLocale(): 'en' | 'fa' {
  const { i18n } = useTranslation();
  const pathname = usePathname();

  const lng = (i18n?.resolvedLanguage || i18n?.language || '').toLowerCase();
  if (lng.startsWith('fa')) return 'fa';
  if (lng.startsWith('en')) return 'en';

  const seg = (pathname || '/').split('/').filter(Boolean)[0];
  return seg === 'fa' ? 'fa' : 'en';
}

