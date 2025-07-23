
'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import arTranslation from '../../public/locales/ar/common.json';
import enTranslation from '../../public/locales/en/common.json';

const resources = {
  en: {
    common: enTranslation,
  },
  ar: {
    common: arTranslation,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false, 
    },
    detection: {
      order: ['sessionStorage', 'navigator'],
      caches: ['sessionStorage'],
    }
  });

export default i18n;
