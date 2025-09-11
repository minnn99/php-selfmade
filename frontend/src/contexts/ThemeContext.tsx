import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // ローカルストレージまたはシステム設定から初期値を取得
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    // ローカルストレージをチェック
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    // システムのダークモード設定をチェック
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // ダークモードの切り替え
  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  // ダークモードの状態が変更されたときの処理
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // システムのダークモード設定の変更を監視
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // ローカルストレージに設定が保存されていない場合のみ、システム設定に従う
      if (!localStorage.getItem('theme')) {
        setIsDarkMode(e.matches);
      }
    };

    // イベントリスナーの追加
    mediaQuery.addEventListener('change', handleChange);

    // クリーンアップ
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};