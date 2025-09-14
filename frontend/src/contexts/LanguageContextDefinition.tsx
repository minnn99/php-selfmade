import { createContext } from 'react';

// 言語タイプの定義
export type Language = 'ja-JP' | 'en-US' | 'ko-KR' | 'zh-CN';

// Context用の型定義
export interface LanguageContextType {
  language: Language;
  changeLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

// Context作成
export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);