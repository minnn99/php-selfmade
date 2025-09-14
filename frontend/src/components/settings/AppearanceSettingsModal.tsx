import React from "react";
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';

interface AppearanceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const AppearanceSettingsModal: React.FC<AppearanceSettingsModalProps> = ({ isOpen, onClose, onSave }) => {
  const { isDarkMode, toggleDarkMode } = useTheme();

  const handleSave = () => {
    onSave();
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ margin: 0, top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-t-xl sm:rounded-xl shadow-2xl w-full sm:max-w-3xl sm:w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">外観</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
          {/* テーマ設定 */}
          <div className="space-y-3 sm:space-y-4">
            <div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">テーマ設定</h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-tight">ダークモード/ライトモードの切り替えはヘッダーのボタンから行えます</p>
            </div>

            {/* 現在のテーマ状態を表示 */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{isDarkMode ? "🌙" : "☀️"}</div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      現在のテーマ: {isDarkMode ? "ダークモード" : "ライトモード"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      ヘッダーのボタンで切り替えできます
                    </p>
                  </div>
                </div>
                <button
                  onClick={toggleDarkMode}
                  className="px-4 py-2 text-sm font-medium text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30 hover:bg-primary-100 dark:hover:bg-primary-900/50 rounded-lg transition-colors"
                >
                  切り替え
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end space-y-2 sm:space-y-0 sm:space-x-3 p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-3 text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 active:bg-gray-300 dark:active:bg-gray-500 rounded-lg transition-colors min-h-[44px] flex items-center justify-center"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-3 text-sm sm:text-base font-medium text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 rounded-lg transition-colors min-h-[44px] flex items-center justify-center"
          >
            保存
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
