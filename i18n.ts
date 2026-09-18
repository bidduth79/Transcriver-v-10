import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslation from './locales/en.json';
import bnTranslation from './locales/bn.json';

const resources = {
  en: {
    translation: enTranslation,
  },
  bn: {
    translation: bnTranslation,
  },
};

// Check local storage for existing language preference
const savedLang = localStorage.getItem('app_language') || 'bn';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLang, // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;
