import React, { useState, useEffect } from "react";

interface AppearanceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: AppearanceSettings) => void;
}

interface AppearanceSettings {
  theme: {
    mode: "light" | "dark" | "auto";
  };
  language: {
    locale: string;
  };
}


const languageOptions = [
  { value: "ja-JP", label: "日本語" },
  { value: "en-US", label: "English" },
  { value: "ko-KR", label: "한국어" },
  { value: "zh-CN", label: "中文（简体）" },
];

export const AppearanceSettingsModal: React.FC<AppearanceSettingsModalProps> = ({ isOpen, onClose, onSave }) => {
  const [settings, setSettings] = useState<AppearanceSettings>({
    theme: {
      mode: "light",
    },
    language: {
      locale: "ja-JP",
    },
  });

  useEffect(() => {
    const savedSettings = localStorage.getItem("appearanceSettings");
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem("appearanceSettings", JSON.stringify(settings));
    onSave(settings);
    onClose();
  };

  const updateSetting = (category: keyof AppearanceSettings, field: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" style={{ margin: 0, top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">外観設定</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* テーマ・色設定 */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">テーマ・言語設定</h3>
              <p className="text-sm text-gray-500">アプリのテーマモードと言語を設定</p>
            </div>

            {/* テーマモード */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">テーマモード</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "light", label: "ライト", icon: "☀️" },
                  { value: "dark", label: "ダーク", icon: "🌙" },
                  { value: "auto", label: "自動", icon: "🔄" },
                ].map((mode) => (
                  <label key={mode.value} className="flex items-center">
                    <input
                      type="radio"
                      name="themeMode"
                      value={mode.value}
                      checked={settings.theme.mode === mode.value}
                      onChange={(e) => updateSetting("theme", "mode", e.target.value)}
                      className="sr-only peer"
                    />
                    <div className="w-full p-3 text-center border border-gray-300 rounded-lg cursor-pointer peer-checked:border-primary-500 peer-checked:bg-primary-50 hover:bg-gray-50 transition-colors">
                      <div className="text-lg mb-1">{mode.icon}</div>
                      <div className="text-sm font-medium">{mode.label}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

          </div>

          {/* 言語設定 */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">言語設定</h3>
              <p className="text-sm text-gray-500">アプリで使用する言語を選択</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">表示言語</label>
              <select
                value={settings.language.locale}
                onChange={(e) => updateSetting("language", "locale", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {languageOptions.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            キャンセル
          </button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors">
            保存
          </button>
        </div>
      </div>
    </div>
  );
};
