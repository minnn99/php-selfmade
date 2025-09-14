import { useContext } from 'react';
import { LanguageContext, type LanguageContextType } from '../contexts/LanguageContextDefinition';

// カスタムフック
export const useLanguage = (): LanguageContextType => {
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