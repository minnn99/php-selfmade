import React, { useState, useEffect } from "react";

interface AppearanceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: AppearanceSettings) => void;
}

interface AppearanceSettings {
  theme: {
    mode: "light" | "dark" | "auto";
    primaryColor: string;
    accentColor: string;
  };
  language: {
    locale: string;
    dateFormat: string;
    timeFormat: "12h" | "24h";
  };
  display: {
    fontSize: "small" | "medium" | "large";
    compactMode: boolean;
    showCalendarNumbers: boolean;
    showWeekNumbers: boolean;
    firstDayOfWeek: 0 | 1; // 0: 日曜日, 1: 月曜日
  };
}

const themeColors = [
  { name: "ピンク", value: "#ec4899" },
  { name: "パープル", value: "#8b5cf6" },
  { name: "ブルー", value: "#3b82f6" },
  { name: "グリーン", value: "#10b981" },
  { name: "オレンジ", value: "#f59e0b" },
  { name: "レッド", value: "#ef4444" },
];

const accentColors = [
  { name: "ライト", value: "#f8fafc" },
  { name: "ピンク", value: "#fdf2f8" },
  { name: "パープル", value: "#f3e8ff" },
  { name: "ブルー", value: "#eff6ff" },
  { name: "グリーン", value: "#ecfdf5" },
  { name: "イエロー", value: "#fffbeb" },
];

const languageOptions = [
  { value: "ja-JP", label: "日本語" },
  { value: "en-US", label: "English" },
  { value: "ko-KR", label: "한국어" },
  { value: "zh-CN", label: "中文（简体）" },
];

const dateFormatOptions = [
  { value: "YYYY/MM/DD", label: "2025/01/20" },
  { value: "MM/DD/YYYY", label: "01/20/2025" },
  { value: "DD/MM/YYYY", label: "20/01/2025" },
  { value: "YYYY-MM-DD", label: "2025-01-20" },
];

export const AppearanceSettingsModal: React.FC<AppearanceSettingsModalProps> = ({ isOpen, onClose, onSave }) => {
  const [settings, setSettings] = useState<AppearanceSettings>({
    theme: {
      mode: "light",
      primaryColor: "#ec4899",
      accentColor: "#fdf2f8",
    },
    language: {
      locale: "ja-JP",
      dateFormat: "YYYY/MM/DD",
      timeFormat: "24h",
    },
    display: {
      fontSize: "medium",
      compactMode: false,
      showCalendarNumbers: true,
      showWeekNumbers: false,
      firstDayOfWeek: 1,
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
              <h3 className="text-lg font-medium text-gray-900">テーマ・色設定</h3>
              <p className="text-sm text-gray-500">アプリの見た目とカラーテーマを設定</p>
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

            {/* プライマリカラー */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">プライマリカラー</label>
              <div className="grid grid-cols-6 gap-3">
                {themeColors.map((color) => (
                  <label key={color.value} className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="primaryColor"
                      value={color.value}
                      checked={settings.theme.primaryColor === color.value}
                      onChange={(e) => updateSetting("theme", "primaryColor", e.target.value)}
                      className="sr-only peer"
                    />
                    <div
                      className="w-10 h-10 rounded-full border-2 border-gray-300 peer-checked:border-gray-600 peer-checked:scale-110 transition-all"
                      style={{ backgroundColor: color.value }}
                    />
                    <span className="text-xs mt-1 text-gray-600">{color.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* アクセントカラー */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">アクセントカラー</label>
              <div className="grid grid-cols-6 gap-3">
                {accentColors.map((color) => (
                  <label key={color.value} className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="accentColor"
                      value={color.value}
                      checked={settings.theme.accentColor === color.value}
                      onChange={(e) => updateSetting("theme", "accentColor", e.target.value)}
                      className="sr-only peer"
                    />
                    <div
                      className="w-10 h-10 rounded-full border-2 border-gray-300 peer-checked:border-gray-600 peer-checked:scale-110 transition-all"
                      style={{ backgroundColor: color.value }}
                    />
                    <span className="text-xs mt-1 text-gray-600">{color.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* 言語設定 */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">言語設定</h3>
              <p className="text-sm text-gray-500">表示言語と日付・時刻の形式設定</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">日付形式</label>
                <select
                  value={settings.language.dateFormat}
                  onChange={(e) => updateSetting("language", "dateFormat", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {dateFormatOptions.map((format) => (
                    <option key={format.value} value={format.value}>
                      {format.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">時刻形式</label>
                <select
                  value={settings.language.timeFormat}
                  onChange={(e) => updateSetting("language", "timeFormat", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="24h">24時間表記 (13:30)</option>
                  <option value="12h">12時間表記 (1:30 PM)</option>
                </select>
              </div>
            </div>
          </div>

          {/* 表示設定 */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">表示設定</h3>
              <p className="text-sm text-gray-500">カレンダーやUIの表示をカスタマイズ</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">フォントサイズ</label>
                  <select
                    value={settings.display.fontSize}
                    onChange={(e) => updateSetting("display", "fontSize", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="small">小</option>
                    <option value="medium">中</option>
                    <option value="large">大</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">週の始まり</label>
                  <select
                    value={settings.display.firstDayOfWeek}
                    onChange={(e) => updateSetting("display", "firstDayOfWeek", parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value={1}>月曜日</option>
                    <option value={0}>日曜日</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">コンパクトモード</span>
                  <input
                    type="checkbox"
                    checked={settings.display.compactMode}
                    onChange={(e) => updateSetting("display", "compactMode", e.target.checked)}
                    className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">カレンダーに日付番号を表示</span>
                  <input
                    type="checkbox"
                    checked={settings.display.showCalendarNumbers}
                    onChange={(e) => updateSetting("display", "showCalendarNumbers", e.target.checked)}
                    className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">週番号を表示</span>
                  <input
                    type="checkbox"
                    checked={settings.display.showWeekNumbers}
                    onChange={(e) => updateSetting("display", "showWeekNumbers", e.target.checked)}
                    className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                  />
                </label>
              </div>
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