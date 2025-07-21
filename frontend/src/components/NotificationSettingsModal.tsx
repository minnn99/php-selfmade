import React, { useState, useEffect } from "react";

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: NotificationSettings) => void;
}

interface NotificationSettings {
  menstrualReminder: {
    enabled: boolean;
    daysBeforeStart: number;
    time: string;
  };
  ovulationReminder: {
    enabled: boolean;
    daysBeforeOvulation: number;
    time: string;
  };
  partnerNotifications: {
    enabled: boolean;
    menstrualStart: boolean;
    ovulationPeriod: boolean;
    moodChanges: boolean;
  };
  generalSettings: {
    pushNotifications: boolean;
    soundEnabled: boolean;
  };
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({ isOpen, onClose, onSave }) => {
  const [settings, setSettings] = useState<NotificationSettings>({
    menstrualReminder: {
      enabled: true,
      daysBeforeStart: 1,
      time: "09:00",
    },
    ovulationReminder: {
      enabled: true,
      daysBeforeOvulation: 2,
      time: "09:00",
    },
    partnerNotifications: {
      enabled: false,
      menstrualStart: true,
      ovulationPeriod: true,
      moodChanges: false,
    },
    generalSettings: {
      pushNotifications: true,
      soundEnabled: true,
    },
  });

  // ローカルストレージから設定を読み込み
  useEffect(() => {
    const savedSettings = localStorage.getItem("notificationSettings");
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem("notificationSettings", JSON.stringify(settings));
    onSave(settings);
    onClose();
  };

  const updateSetting = (category: keyof NotificationSettings, field: string, value: any) => {
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
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">通知設定</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* 生理リマインド設定 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">生理リマインド</h3>
                <p className="text-sm text-gray-500">予測される生理開始日の通知設定</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.menstrualReminder.enabled}
                  onChange={(e) => updateSetting("menstrualReminder", "enabled", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            {settings.menstrualReminder.enabled && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium text-gray-700 min-w-0 flex-shrink-0">通知タイミング　:</label>
                  <select
                    value={settings.menstrualReminder.daysBeforeStart}
                    onChange={(e) => updateSetting("menstrualReminder", "daysBeforeStart", parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value={0}>当日</option>
                    <option value={1}>1日前</option>
                    <option value={2}>2日前</option>
                    <option value={3}>3日前</option>
                    <option value={4}>4日前</option>
                    <option value={5}>5日前</option>
                    <option value={6}>6日前</option>
                    <option value={7}>7日前</option>
                  </select>
                </div>
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium text-gray-700 min-w-0 flex-shrink-0">通知時刻　:</label>
                  <input
                    type="time"
                    value={settings.menstrualReminder.time}
                    onChange={(e) => updateSetting("menstrualReminder", "time", e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 排卵日リマインド設定 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">排卵日リマインド</h3>
                <p className="text-sm text-gray-500">予測される排卵日の通知設定</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.ovulationReminder.enabled}
                  onChange={(e) => updateSetting("ovulationReminder", "enabled", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            {settings.ovulationReminder.enabled && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium text-gray-700 min-w-0 flex-shrink-0">通知タイミング　:</label>
                  <select
                    value={settings.ovulationReminder.daysBeforeOvulation}
                    onChange={(e) => updateSetting("ovulationReminder", "daysBeforeOvulation", parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value={0}>当日</option>
                    <option value={1}>1日前</option>
                    <option value={2}>2日前</option>
                    <option value={3}>3日前</option>
                    <option value={4}>4日前</option>
                    <option value={5}>5日前</option>
                    <option value={6}>6日前</option>
                    <option value={7}>7日前</option>
                  </select>
                </div>
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium text-gray-700 min-w-0 flex-shrink-0">通知時刻　:</label>
                  <input
                    type="time"
                    value={settings.ovulationReminder.time}
                    onChange={(e) => updateSetting("ovulationReminder", "time", e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* パートナー向け通知設定 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">パートナー向け通知</h3>
                <p className="text-sm text-gray-500">パートナーに重要な情報を共有</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.partnerNotifications.enabled}
                  onChange={(e) => updateSetting("partnerNotifications", "enabled", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            {settings.partnerNotifications.enabled && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.partnerNotifications.menstrualStart}
                      onChange={(e) => updateSetting("partnerNotifications", "menstrualStart", e.target.checked)}
                      className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">生理開始時の通知</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.partnerNotifications.ovulationPeriod}
                      onChange={(e) => updateSetting("partnerNotifications", "ovulationPeriod", e.target.checked)}
                      className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">排卵期の通知</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.partnerNotifications.moodChanges}
                      onChange={(e) => updateSetting("partnerNotifications", "moodChanges", e.target.checked)}
                      className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">気分の変化に関する通知</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* 一般設定 */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">一般設定</h3>
              <p className="text-sm text-gray-500">プッシュ通知と音声設定</p>
            </div>
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700">プッシュ通知</span>
                <input
                  type="checkbox"
                  checked={settings.generalSettings.pushNotifications}
                  onChange={(e) => updateSetting("generalSettings", "pushNotifications", e.target.checked)}
                  className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700">通知音</span>
                <input
                  type="checkbox"
                  checked={settings.generalSettings.soundEnabled}
                  onChange={(e) => updateSetting("generalSettings", "soundEnabled", e.target.checked)}
                  className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                />
              </label>
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
