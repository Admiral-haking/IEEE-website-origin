import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from '@/locales/en/common.json';
import faCommon from '@/locales/fa/common.json';

let initialized = false;

export function ensureI18n(lng?: 'en'|'fa') {
  if (!initialized && !i18n.isInitialized) {
    i18n
      .use(LanguageDetector)
      .use(initReactI18next)
      .init({
        lng: lng || 'en',
        resources: {
          en: { common: enCommon },
          fa: { common: faCommon }
        },
        supportedLngs: ['en', 'fa'],
        fallbackLng: 'en',
        defaultNS: 'common',
        ns: ['common'],
        interpolation: { escapeValue: false },
        detection: {
          order: ['localStorage', 'cookie', 'navigator', 'htmlTag'],
          caches: ['localStorage', 'cookie']
        }
      });
    initialized = true;
  }
  return i18n;
}

export default i18n;
