import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import jaTranslation from './locales/ja.json';
import koTranslation from './locales/ko.json';
import enTranslation from './locales/en.json';
import zhTranslation from './locales/zh.json';

const resources = {
  'ja-JP': {
    translation: jaTranslation
  },
  'ko-KR': {
    translation: koTranslation
  },
  'en-US': {
    translation: enTranslation
  },
  'zh-CN': {
    translation: zhTranslation
  }
};

// localStorageを安全に取得する関数
const getSavedLanguage = () => {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || !window.localStorage) {
      return 'ja-JP';
    }

    const savedSettings = localStorage.getItem('appearanceSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      return settings.language?.locale || 'ja-JP';
    }
    return 'ja-JP';
  } catch {
    return 'ja-JP';
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getSavedLanguage(),
    fallbackLng: 'ja-JP',
    debug: false,

    interpolation: {
      escapeValue: false
    }
  });

export default i18n;