import React, { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { LanguageContext, type Language } from './LanguageContextDefinition';

// LanguageProvider Props
interface LanguageProviderProps {
  children: ReactNode;
}

// 翻訳データのインポート
import { ja } from '../locales/ja';
import { ko } from '../locales/ko';
import { en } from '../locales/en';
import { zh } from '../locales/zh';

const translations: Record<Language, Record<string, unknown>> = {
  'ja-JP': ja,
  'en-US': en,
  'ko-KR': ko,
  'zh-CN': zh
};

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('ja-JP');

  // 初期化時に保存された言語設定を読み込み
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('appearanceSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        if (settings.language?.locale) {
          setLanguage(settings.language.locale as Language);
        }
      }
    } catch (error) {
      console.warn('Failed to load language settings:', error);
    }
  }, []);

  // 言語変更関数
  const changeLanguage = (lang: Language) => {
    setLanguage(lang);

    // localStorage に保存
    try {
      const currentSettings = localStorage.getItem('appearanceSettings');
      const settings = currentSettings ? JSON.parse(currentSettings) : {};
      settings.language = { locale: lang };
      localStorage.setItem('appearanceSettings', JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save language settings:', error);
    }
  };

  // 翻訳関数
  const t = (key: string): string => {
    const keys = key.split('.');
    let value: unknown = translations[language];

    for (const k of keys) {
      if (value && typeof value === 'object' && value !== null && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        // キーが見つからない場合はキーをそのまま返す
        return key;
      }
    }

    return typeof value === 'string' ? value : key;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

