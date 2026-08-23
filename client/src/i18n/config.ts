import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import hi from './locales/hi.json';
import mr from './locales/mr.json';

const savedLanguage = localStorage.getItem('hs_lang') || 'EN';

i18n.use(initReactI18next).init({
  resources: {
    EN: { translation: en },
    HI: { translation: hi },
    MR: { translation: mr },
  },
  lng: savedLanguage,
  fallbackLng: 'EN',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
