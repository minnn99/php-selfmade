import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { userDataAPI } from "../../services/api";
import { notificationManager } from "../../services/notificationManager";
import { notificationService } from "../../services/notificationService";

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
  };
  pillReminder: {
    enabled: boolean;
    pillName: string;
    times: string[]; // 複数の服用時間をサポート
    reminderMinutes: number; // 何分前に通知するか
  };
  generalSettings: {
    pushNotifications: boolean;
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
    },
    pillReminder: {
      enabled: false,
      pillName: "ピル",
      times: ["08:00"], // デフォルトは朝8時
      reminderMinutes: 0, // ちょうどの時間に通知
    },
    generalSettings: {
      pushNotifications: true,
    },
  });
  const [loading, setLoading] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const [scheduleInfo, setScheduleInfo] = useState<string[]>([]);

  // 通知権限をチェック
  useEffect(() => {
    if (isOpen && "Notification" in window) {
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
            const loadedSettings = responseData.notificationSettings as unknown as NotificationSettings;
            
            // デフォルト設定とマージして、新しい項目（pillReminder）が確実に含まれるようにする
            setSettings(prevSettings => ({
              menstrualReminder: loadedSettings.menstrualReminder || prevSettings.menstrualReminder,
              ovulationReminder: loadedSettings.ovulationReminder || prevSettings.ovulationReminder,
              partnerNotifications: loadedSettings.partnerNotifications || prevSettings.partnerNotifications,
              pillReminder: loadedSettings.pillReminder || prevSettings.pillReminder,
              generalSettings: loadedSettings.generalSettings || prevSettings.generalSettings,
            }));
          }
        }
      } catch {
        // Silent error handling - failed to load notification settings
      }
    };

    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  // 通知権限を要求
  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === "granted") {
        // テスト通知を送信
        new Notification("Pairiod", {
          body: "通知が有効になりました",
          icon: "/favicon.ico",
        });
      }
    }
  };

  // テスト通知を送信
  const sendTestNotification = () => {
    if (notificationPermission === "granted") {
      try {
        const notification = new Notification("Pairiod - テスト通知", {
          body: "通知システムが正常に動作しています！🎉",
          icon: "/vite.svg",
          badge: "/vite.svg",
          tag: "test-notification",
          requireInteraction: false,
        });

        // 通知がクリックされた時の処理
        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        // 3秒後に自動で閉じる
        setTimeout(() => {
          notification.close();
        }, 3000);

        // アプリ内通知パネルにも追加
        const appNotification = {
          id: `test-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`, // より一意なIDを生成
          type: "system" as const,
          title: "テスト通知",
          message: "通知システムが正常に動作しています！🎉",
          timestamp: new Date().toISOString(),
          isRead: false,
          priority: "medium" as const,
        };

        // 既存の通知を取得
        const existingNotifications = JSON.parse(localStorage.getItem("notifications") || "[]");
        
        // 新しい通知を先頭に追加
        const updatedNotifications = [appNotification, ...existingNotifications];
        
        // localStorageに保存
        localStorage.setItem("notifications", JSON.stringify(updatedNotifications));
        
        // 通知更新イベントを発火
        window.dispatchEvent(new CustomEvent('notificationUpdated'));

        // 成功メッセージを表示
        alert("テスト通知を送信しました！通知パネルを確認してください。");
      } catch (error) {
        console.error("通知送信エラー:", error);
        alert("通知の送信に失敗しました。ブラウザの設定を確認してください。");
      }
    } else {
      alert("通知権限が許可されていません。先に権限を許可してください。");
    }
  };

  // 生理リマインドのテスト
  const testPeriodReminder = () => {
    if (notificationPermission === "granted") {
      notificationService.sendPeriodReminderNotification(1); // 明日が生理予定日
      alert("生理リマインド通知をテストしました！");
    } else {
      alert("通知権限が必要です");
    }
  };

  // 排卵期通知のテスト
  const testOvulationReminder = () => {
    if (notificationPermission === "granted") {
      notificationService.sendFertilityPeriodStartNotification();
      setTimeout(() => {
        notificationService.sendOvulationDayNotification();
      }, 1000);
      alert("排卵期通知をテストしました！（排卵期開始と排卵日の2つの通知）");
    } else {
      alert("通知権限が必要です");
    }
  };

  // パートナー通知のテスト
  const testPartnerNotification = () => {
    if (notificationPermission === "granted") {
      notificationService.sendPartnerNotification('menstrualStart');
      alert("パートナー通知をテストしました！");
    } else {
      alert("通知権限が必要です");
    }
  };

  // 服薬リマインドのテスト
  const testMedicationReminder = () => {
    if (notificationPermission === "granted") {
      const pillName = settings.pillReminder?.pillName || "ピル";
      const reminderMinutes = settings.pillReminder?.reminderMinutes || 0;
      notificationService.sendMedicationReminder(pillName, reminderMinutes);
      alert("服薬リマインド通知をテストしました！");
    } else {
      alert("通知権限が必要です");
    }
  };

  // スケジュール確認
  const checkSchedule = async () => {
    try {
      const info = await notificationManager.getScheduledNotificationsInfo();
      setScheduleInfo(info);
      alert("スケジュール情報を確認してください（下に表示されます）");
    } catch (error) {
      alert("スケジュール情報の取得に失敗しました");
    }
  };

  // 設定ベーステスト
  const testWithCurrentSettings = async () => {
    if (notificationPermission === "granted") {
      try {
        await notificationManager.testScheduledNotifications();
        alert("現在の設定で通知をテストしました！");
      } catch (error) {
        alert("テストに失敗しました");
      }
    } else {
      alert("通知権限が必要です");
    }
  };

  // 全機能テスト
  const testAllFeatures = async () => {
    if (notificationPermission !== "granted") {
      alert("通知権限が必要です");
      return;
    }

    const results: string[] = [];

    // プッシュ通知設定をテスト
    if (settings.generalSettings.pushNotifications) {
      results.push("✅ プッシュ通知: 有効");
    } else {
      results.push("❌ プッシュ通知: 無効");
    }


    // 生理リマインド設定をテスト
    if (settings.menstrualReminder.enabled) {
      results.push(`✅ 生理リマインド: ${settings.menstrualReminder.daysBeforeStart}日前 ${settings.menstrualReminder.time}`);
      notificationService.sendPeriodReminderNotification(settings.menstrualReminder.daysBeforeStart);
    } else {
      results.push("❌ 生理リマインド: 無効");
    }

    // 排卵期通知設定をテスト
    if (settings.ovulationReminder.enabled) {
      results.push(`✅ 排卵期通知: ${settings.ovulationReminder.time} (排卵期開始と排卵日)`);
      notificationService.sendFertilityPeriodStartNotification();
      setTimeout(() => {
        notificationService.sendOvulationDayNotification();
      }, 1000);
    } else {
      results.push("❌ 排卵期通知: 無効");
    }

    // パートナー通知設定をテスト
    if (settings.partnerNotifications.enabled) {
      const enabledTypes = [];
      if (settings.partnerNotifications.menstrualStart) enabledTypes.push("生理開始");
      if (settings.partnerNotifications.ovulationPeriod) enabledTypes.push("排卵期");
      
      results.push(`✅ パートナー通知: ${enabledTypes.join(", ")}`);
      
      // パートナー通知のテスト送信
      if (settings.partnerNotifications.menstrualStart) {
        notificationService.sendPartnerNotification('menstrualStart');
      }
      if (settings.partnerNotifications.ovulationPeriod) {
        notificationService.sendPartnerNotification('ovulationPeriod');
      }
    } else {
      results.push("❌ パートナー通知: 無効");
    }

    // ピルリマインダー設定をテスト
    if (settings.pillReminder?.enabled) {
      const timesText = (settings.pillReminder?.times || []).join(", ");
      const reminderText = (settings.pillReminder?.reminderMinutes || 0) === 0 ? "ちょうど" : `${settings.pillReminder?.reminderMinutes}分前`;
      results.push(`✅ ピルリマインダー: ${settings.pillReminder?.pillName || "ピル"} - ${timesText} (${reminderText})`);
      
      // ピルリマインダーのテスト送信
      const pillName = settings.pillReminder?.pillName || "ピル";
      const reminderMinutes = settings.pillReminder?.reminderMinutes || 0;
      notificationService.sendMedicationReminder(pillName, reminderMinutes);
    } else {
      results.push("❌ ピルリマインダー: 無効");
    }

    // 結果を表示
    setScheduleInfo([
      "=== 設定機能テスト結果 ===",
      ...results,
      "",
      "有効な通知タイプのテスト通知を送信しました！"
    ]);

    alert(`全機能テストが完了しました！\n\n${results.join("\n")}\n\n詳細は下のスケジュール情報を確認してください。`);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await userDataAPI.saveSettings({
        notificationSettings: settings,
      });
      
      // Update notification manager settings
      notificationManager.updateSettings({
        periodReminders: settings.menstrualReminder.enabled,
        ovulationReminders: settings.ovulationReminder.enabled,
        partnerNotifications: settings.partnerNotifications.enabled,
        medicationReminders: true, // This could be added to the UI later
        pillReminders: settings.pillReminder.enabled,
        generalReminders: settings.generalSettings.pushNotifications,
      });
      
      onSave(settings);
      onClose();
    } catch {
      alert("設定の保存に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (category: keyof NotificationSettings, field: string, value: boolean | number | string | string[]) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ margin: 0, top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-t-xl sm:rounded-xl shadow-2xl w-full sm:max-w-2xl sm:w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">通知設定</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
          {/* 生理リマインド設定 */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-start sm:items-center justify-between">
              <div className="flex-1 mr-4">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">生理リマインド</h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-tight">予測される生理開始日の通知設定</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  checked={settings.menstrualReminder.enabled}
                  onChange={(e) => updateSetting("menstrualReminder", "enabled", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-gray-300 after:border-gray-300 dark:after:border-gray-500 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 dark:peer-checked:bg-primary-500"></div>
              </label>
            </div>

            {settings.menstrualReminder.enabled && (
              <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 flex-shrink-0">通知タイミング:</label>
                  <select
                    value={settings.menstrualReminder.daysBeforeStart}
                    onChange={(e) => updateSetting("menstrualReminder", "daysBeforeStart", parseInt(e.target.value))}
                    className="w-full sm:w-auto px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[44px] bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
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
                  <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 flex-shrink-0">通知時刻:</label>
                  <input
                    type="time"
                    value={settings.menstrualReminder.time}
                    onChange={(e) => updateSetting("menstrualReminder", "time", e.target.value)}
                    className="w-full sm:w-auto px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[44px] bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 排卵期通知設定 */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-start sm:items-center justify-between">
              <div className="flex-1 mr-4">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">排卵期通知</h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-tight">妊娠しやすい期間と排卵日の通知設定</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  checked={settings.ovulationReminder.enabled}
                  onChange={(e) => updateSetting("ovulationReminder", "enabled", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-gray-300 after:border-gray-300 dark:after:border-gray-500 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 dark:peer-checked:bg-primary-500"></div>
              </label>
            </div>

            {settings.ovulationReminder.enabled && (
              <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 flex-shrink-0">通知時刻:</label>
                  <input
                    type="time"
                    value={settings.ovulationReminder.time}
                    onChange={(e) => updateSetting("ovulationReminder", "time", e.target.value)}
                    className="w-full sm:w-auto px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[44px] bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                  💡 排卵期間（妊娠しやすい期間）の開始時と、排卵日当日に通知が送信されます
                </div>
              </div>
            )}
          </div>

          {/* パートナー向け通知設定 */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-start sm:items-center justify-between">
              <div className="flex-1 mr-4">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">パートナー向け通知</h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-tight">パートナーに重要な情報を共有</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  checked={settings.partnerNotifications.enabled}
                  onChange={(e) => updateSetting("partnerNotifications", "enabled", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-gray-300 after:border-gray-300 dark:after:border-gray-500 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 dark:peer-checked:bg-primary-500"></div>
              </label>
            </div>

            {settings.partnerNotifications.enabled && (
              <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="space-y-3 sm:space-y-4">
                  <label className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors cursor-pointer min-h-[44px]">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">生理開始時の通知</span>
                    <input
                      type="checkbox"
                      checked={settings.partnerNotifications.menstrualStart}
                      onChange={(e) => updateSetting("partnerNotifications", "menstrualStart", e.target.checked)}
                      className="w-5 h-5 text-primary-600 bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500 rounded focus:ring-primary-500 focus:ring-2"
                    />
                  </label>
                  <label className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors cursor-pointer min-h-[44px]">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">排卵期の通知</span>
                    <input
                      type="checkbox"
                      checked={settings.partnerNotifications.ovulationPeriod}
                      onChange={(e) => updateSetting("partnerNotifications", "ovulationPeriod", e.target.checked)}
                      className="w-5 h-5 text-primary-600 bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500 rounded focus:ring-primary-500 focus:ring-2"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* ピル服用リマインダー設定 */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-start sm:items-center justify-between">
              <div className="flex-1 mr-4">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">ピル服用リマインダー</h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-tight">毎日の服用時間を通知</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  checked={settings.pillReminder?.enabled || false}
                  onChange={(e) => updateSetting("pillReminder", "enabled", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-gray-300 after:border-gray-300 dark:after:border-gray-500 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 dark:peer-checked:bg-primary-500"></div>
              </label>
            </div>

            {(settings.pillReminder?.enabled || false) && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4 space-y-4">
                {/* ピル名設定 */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ピルの名前</label>
                  <input
                    type="text"
                    value={settings.pillReminder?.pillName || ""}
                    onChange={(e) => updateSetting("pillReminder", "pillName", e.target.value)}
                    placeholder="例: 低用量ピル"
                    className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                {/* 服用時間設定 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">服用時間</label>
                    <button
                      type="button"
                      onClick={() => {
                        const newTimes = [...(settings.pillReminder?.times || ["08:00"]), "20:00"];
                        updateSetting("pillReminder", "times", newTimes);
                      }}
                      className="text-xs px-2 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded transition-colors"
                    >
                      時間追加
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(settings.pillReminder?.times || []).map((time, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="time"
                          value={time}
                          onChange={(e) => {
                            const newTimes = [...(settings.pillReminder?.times || [])];
                            newTimes[index] = e.target.value;
                            updateSetting("pillReminder", "times", newTimes);
                          }}
                          className="flex-1 p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                        {(settings.pillReminder?.times || []).length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newTimes = (settings.pillReminder?.times || []).filter((_, i) => i !== index);
                              updateSetting("pillReminder", "times", newTimes);
                            }}
                            className="p-2 text-red-600 hover:text-red-800 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* リマインダーのタイミング */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">通知タイミング</label>
                  <select
                    value={settings.pillReminder?.reminderMinutes || 0}
                    onChange={(e) => updateSetting("pillReminder", "reminderMinutes", parseInt(e.target.value))}
                    className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value={0}>ちょうどの時間</option>
                    <option value={5}>5分前</option>
                    <option value={10}>10分前</option>
                    <option value={15}>15分前</option>
                    <option value={30}>30分前</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* 一般設定 */}
          <div className="space-y-3 sm:space-y-4">
            <div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">一般設定</h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-tight">プッシュ通知設定</p>
            </div>

            {/* ブラウザ通知権限 */}
            <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">ブラウザ通知権限</span>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    notificationPermission === "granted"
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                      : notificationPermission === "denied"
                      ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                      : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                  }`}
                >
                  {notificationPermission === "granted" ? "許可済み" : notificationPermission === "denied" ? "拒否" : "未設定"}
                </span>
              </div>
              {notificationPermission !== "granted" ? (
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">ブラウザ通知を受信するには権限が必要です</p>
                  <button
                    onClick={requestNotificationPermission}
                    className="text-xs bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded-lg transition-colors"
                  >
                    権限を許可
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">通知機能が正常に動作するかテストできます</p>
                  <div className="space-y-3">
                    {/* 基本テスト */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={sendTestNotification}
                        className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors"
                      >
                        基本テスト
                      </button>
                      <button
                        onClick={testMedicationReminder}
                        className="text-xs bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded-lg transition-colors"
                      >
                        服薬リマインド
                      </button>
                    </div>

                    {/* 設定ベーステスト */}
                    <div className="border-t pt-3 dark:border-gray-600">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">設定に基づくテスト</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={checkSchedule}
                          className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg transition-colors"
                        >
                          📅 スケジュール確認
                        </button>
                        <button
                          onClick={testWithCurrentSettings}
                          className="text-xs bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-lg transition-colors"
                        >
                          ⚡ 設定でテスト
                        </button>
                      </div>
                      {/* 全機能テスト */}
                      <div className="mt-2">
                        <button
                          onClick={testAllFeatures}
                          className="w-full text-xs bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-3 py-2 rounded-lg transition-all shadow-md"
                        >
                          🧪 全機能テスト (設定状況確認)
                        </button>
                      </div>
                    </div>

                    {/* 個別テスト */}
                    <div className="border-t pt-3 dark:border-gray-600">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">個別テスト</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={testPeriodReminder}
                          className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-colors"
                        >
                          🩸 生理リマインド
                        </button>
                        <button
                          onClick={testOvulationReminder}
                          className="text-xs bg-pink-500 hover:bg-pink-600 text-white px-3 py-2 rounded-lg transition-colors"
                        >
                          💕🥚 排卵期通知
                        </button>
                        <button
                          onClick={testPartnerNotification}
                          className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg transition-colors"
                        >
                          💕 パートナー通知
                        </button>
                      </div>
                    </div>

                    {/* スケジュール情報表示 */}
                    {scheduleInfo.length > 0 && (
                      <div className="border-t pt-3 dark:border-gray-600">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">次回通知予定：</p>
                        <div className="space-y-1">
                          {scheduleInfo.map((info, index) => (
                            <p key={index} className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                              {info}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2 sm:space-y-3">
              <label className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg transition-colors cursor-pointer min-h-[44px]">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">プッシュ通知</span>
                <input
                  type="checkbox"
                  checked={settings.generalSettings.pushNotifications}
                  onChange={(e) => updateSetting("generalSettings", "pushNotifications", e.target.checked)}
                  className="w-5 h-5 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                />
              </label>
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
            disabled={loading}
            className="px-4 py-3 text-sm sm:text-base font-medium text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 disabled:bg-primary-400 disabled:cursor-not-allowed rounded-lg transition-colors min-h-[44px] flex items-center justify-center"
          >
            {loading ? "保存中..." : "保存"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
