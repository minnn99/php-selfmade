import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

// 言語タイプの定義
export type Language = 'ja-JP' | 'en-US' | 'ko-KR' | 'zh-CN';

// Context用の型定義
interface LanguageContextType {
  language: Language;
  changeLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

// Context作成
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// LanguageProvider Props
interface LanguageProviderProps {
  children: ReactNode;
}

// 翻訳データのインポート
import { ja } from '../locales/ja';
import { ko } from '../locales/ko';
import { en } from '../locales/en';
import { zh } from '../locales/zh';

const translations: Record<Language, Record<string, any>> = {
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
    let value: any = translations[language];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
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

// カスタムフック
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// useTranslation フック（react-i18next風）
export const useTranslation = () => {
  const { t } = useLanguage();
  return { t };
};