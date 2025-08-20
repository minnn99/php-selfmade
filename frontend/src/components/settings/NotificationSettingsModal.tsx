import React, { useState, useEffect } from "react";
import { userDataAPI } from '../../services/api';

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
  const [loading, setLoading] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");

  // 通知権限をチェック
  useEffect(() => {
    if (isOpen && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, [isOpen]);

  // MySQLから設定を読み込み
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await userDataAPI.getSettings();
        if (response.success && response.data) {
          const responseData = response.data as { notificationSettings?: Record<string, unknown> };
          if (responseData.notificationSettings) {
            setSettings(responseData.notificationSettings as unknown as NotificationSettings);
          }
        }
      } catch (error) {
        console.error('Failed to load notification settings:', error);
      }
    };

    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  // 通知権限を要求
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        // テスト通知を送信
        new Notification('Pairiod', {
          body: '通知が有効になりました',
          icon: '/favicon.ico'
        });
      }
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await userDataAPI.saveSettings({
        notificationSettings: settings
      });
      onSave(settings);
      onClose();
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      alert('設定の保存に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (category: keyof NotificationSettings, field: string, value: boolean | number | string) => {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ margin: 0, top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="bg-white rounded-t-xl sm:rounded-xl shadow-2xl w-full sm:max-w-2xl sm:w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">通知設定</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
          {/* 生理リマインド設定 */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-start sm:items-center justify-between">
              <div className="flex-1 mr-4">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">生理リマインド</h3>
                <p className="text-xs sm:text-sm text-gray-500 leading-tight">予測される生理開始日の通知設定</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
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
              <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <label className="text-xs sm:text-sm font-medium text-gray-700 flex-shrink-0">通知タイミング:</label>
                  <select
                    value={settings.menstrualReminder.daysBeforeStart}
                    onChange={(e) => updateSetting("menstrualReminder", "daysBeforeStart", parseInt(e.target.value))}
                    className="w-full sm:w-auto px-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[44px]"
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
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <label className="text-xs sm:text-sm font-medium text-gray-700 flex-shrink-0">通知時刻:</label>
                  <input
                    type="time"
                    value={settings.menstrualReminder.time}
                    onChange={(e) => updateSetting("menstrualReminder", "time", e.target.value)}
                    className="w-full sm:w-auto px-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[44px]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 排卵日リマインド設定 */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-start sm:items-center justify-between">
              <div className="flex-1 mr-4">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">排卵日リマインド</h3>
                <p className="text-xs sm:text-sm text-gray-500 leading-tight">予測される排卵日の通知設定</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
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
              <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <label className="text-xs sm:text-sm font-medium text-gray-700 flex-shrink-0">通知タイミング:</label>
                  <select
                    value={settings.ovulationReminder.daysBeforeOvulation}
                    onChange={(e) => updateSetting("ovulationReminder", "daysBeforeOvulation", parseInt(e.target.value))}
                    className="w-full sm:w-auto px-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[44px]"
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
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <label className="text-xs sm:text-sm font-medium text-gray-700 flex-shrink-0">通知時刻:</label>
                  <input
                    type="time"
                    value={settings.ovulationReminder.time}
                    onChange={(e) => updateSetting("ovulationReminder", "time", e.target.value)}
                    className="w-full sm:w-auto px-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[44px]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* パートナー向け通知設定 */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-start sm:items-center justify-between">
              <div className="flex-1 mr-4">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">パートナー向け通知</h3>
                <p className="text-xs sm:text-sm text-gray-500 leading-tight">パートナーに重要な情報を共有</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
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
              <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                <div className="space-y-3 sm:space-y-4">
                  <label className="flex items-center justify-between p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer min-h-[44px]">
                    <span className="text-sm font-medium text-gray-700">生理開始時の通知</span>
                    <input
                      type="checkbox"
                      checked={settings.partnerNotifications.menstrualStart}
                      onChange={(e) => updateSetting("partnerNotifications", "menstrualStart", e.target.checked)}
                      className="w-5 h-5 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                    />
                  </label>
                  <label className="flex items-center justify-between p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer min-h-[44px]">
                    <span className="text-sm font-medium text-gray-700">排卵期の通知</span>
                    <input
                      type="checkbox"
                      checked={settings.partnerNotifications.ovulationPeriod}
                      onChange={(e) => updateSetting("partnerNotifications", "ovulationPeriod", e.target.checked)}
                      className="w-5 h-5 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                    />
                  </label>
                  <label className="flex items-center justify-between p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer min-h-[44px]">
                    <span className="text-sm font-medium text-gray-700">気分の変化に関する通知</span>
                    <input
                      type="checkbox"
                      checked={settings.partnerNotifications.moodChanges}
                      onChange={(e) => updateSetting("partnerNotifications", "moodChanges", e.target.checked)}
                      className="w-5 h-5 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* 一般設定 */}
          <div className="space-y-3 sm:space-y-4">
            <div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900">一般設定</h3>
              <p className="text-xs sm:text-sm text-gray-500 leading-tight">プッシュ通知と音声設定</p>
            </div>
            
            {/* ブラウザ通知権限 */}
            <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">ブラウザ通知権限</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  notificationPermission === 'granted' 
                    ? 'bg-green-100 text-green-700' 
                    : notificationPermission === 'denied'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {notificationPermission === 'granted' ? '許可済み' : 
                   notificationPermission === 'denied' ? '拒否' : '未設定'}
                </span>
              </div>
              {notificationPermission !== 'granted' && (
                <div>
                  <p className="text-xs text-gray-600 mb-2">
                    ブラウザ通知を受信するには権限が必要です
                  </p>
                  <button
                    onClick={requestNotificationPermission}
                    className="text-xs bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded-lg transition-colors"
                  >
                    権限を許可
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2 sm:space-y-3">
              <label className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer min-h-[44px]">
                <span className="text-sm font-medium text-gray-700">プッシュ通知</span>
                <input
                  type="checkbox"
                  checked={settings.generalSettings.pushNotifications}
                  onChange={(e) => updateSetting("generalSettings", "pushNotifications", e.target.checked)}
                  className="w-5 h-5 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                />
              </label>
              <label className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer min-h-[44px]">
                <span className="text-sm font-medium text-gray-700">通知音</span>
                <input
                  type="checkbox"
                  checked={settings.generalSettings.soundEnabled}
                  onChange={(e) => updateSetting("generalSettings", "soundEnabled", e.target.checked)}
                  className="w-5 h-5 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end space-y-2 sm:space-y-0 sm:space-x-3 p-4 sm:p-6 border-t border-gray-200 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-3 text-sm sm:text-base font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-lg transition-colors min-h-[44px] flex items-center justify-center">
            キャンセル
          </button>
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="px-4 py-3 text-sm sm:text-base font-medium text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 disabled:bg-primary-400 disabled:cursor-not-allowed rounded-lg transition-colors min-h-[44px] flex items-center justify-center"
          >
            {loading ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
};
