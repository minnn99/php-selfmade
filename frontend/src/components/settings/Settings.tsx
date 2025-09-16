import React, { useState, useEffect } from "react";
import { ConfirmationModal } from "../modals/ConfirmationModal";
import { NotificationSettingsModal } from "./NotificationSettingsModal";
import { AppearanceSettingsModal } from "./AppearanceSettingsModal";
import { DataManagementModal } from "../modals/DataManagementModal";
import { ProfileSettingsModal } from "./ProfileSettingsModal";
import { SupportModal } from "../modals/SupportModal";
import { SecuritySettingsModal } from "./SecuritySettingsModal";
import { FadeInUp } from "../animations";
import { notificationManager } from "../../services/notificationManager";

interface SettingsProps {
  onDataDeleted: () => void;
  onLogout?: () => void;
}

interface SettingItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  badge?: string;
}

export const Settings: React.FC<SettingsProps> = ({ onDataDeleted, onLogout }) => {
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showAppearanceModal, setShowAppearanceModal] = useState(false);
  const [showDataManagementModal, setShowDataManagementModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [userGender, setUserGender] = useState<"male" | "female" | "">("");

  // ユーザーの性別を取得（DBから）
  useEffect(() => {
    const getUserGender = async () => {
      try {
        // APIから直接取得（DBから）
        const { authAPI } = await import('../../services/api');
        const userData = await authAPI.getUser();

        const responseData = userData.data as { user?: { gender?: "male" | "female"; name?: string; birth_date?: string } };
        if (responseData?.user && responseData.user.gender) {
          const user = responseData.user;
          // DBから取得した性別を設定
          setUserGender(user.gender as "male" | "female");

          // localStorageにも保存（キャッシュとして）
          const profileToSave = {
            name: user.name || "",
            gender: user.gender || "",
            birthDate: user.birth_date || ""
          };
          localStorage.setItem("profileData", JSON.stringify(profileToSave));
        } else {
          // 性別情報がない場合は女性として扱う（制限をかけない）
          setUserGender("female");
        }
      } catch (error) {
        console.error("Failed to get user gender from API:", error);
        // エラーの場合は制限をかけない（女性として扱う）
        setUserGender("female");
      }
    };
    getUserGender();
  }, []);

  const handleNotificationSave = () => {
    // ここで実際の保存処理を実装
  };

  const handleAppearanceSave = () => {
    // ここで実際の保存処理を実装
  };

  const handleProfileSave = () => {
    // プロフィールデータは既にProfileSettingsModal内でlocalStorageに保存済み
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = () => {
    setShowLogoutModal(false);
    if (onLogout) {
      onLogout();
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  // 通知デバッグ機能
  const handleNotificationDebug = async () => {
    try {
      console.log("=== 通知デバッグ開始 ===");

      // 現在のスケジュール情報を取得
      const scheduleInfo = await notificationManager.getScheduledNotificationsInfo();
      console.log("📅 スケジュールされた通知:");
      scheduleInfo.forEach((info) => console.log(info));

      // テスト通知を送信
      await notificationManager.testScheduledNotifications();
      console.log("✅ テスト通知送信完了");

      alert("通知テスト完了！コンソールでスケジュール情報を確認してください。");
    } catch (error) {
      console.error("通知テストエラー:", error);
      alert("通知テストでエラーが発生しました。コンソールを確認してください。");
    }
  };

  // 即座に通知をテスト送信
  const handleImmediateNotificationTest = () => {
    try {
      console.log("=== 即座通知テスト開始 ===");

      // Import notificationService
      import("../../services/notificationService").then(({ notificationService }) => {
        console.log("1. notificationServiceが読み込まれました");

        // 通知権限を確認
        console.log("2. 通知権限チェック:", Notification.permission);
        console.log("3. hasPermission()結果:", notificationService.hasPermission());

        // 権限がない場合はリクエスト
        if (Notification.permission !== "granted") {
          console.log("4. 通知権限をリクエスト中...");
          Notification.requestPermission().then((permission) => {
            console.log("5. 権限リクエスト結果:", permission);
            if (permission === "granted") {
              sendTestNotification(notificationService);
            } else {
              alert("通知権限が拒否されました。ブラウザ設定で通知を許可してください。");
            }
          });
        } else {
          sendTestNotification(notificationService);
        }
      });
    } catch (error) {
      console.error("即座通知テストエラー:", error);
      alert("通知テストでエラーが発生しました。");
    }
  };

  const sendTestNotification = (notificationService: any) => {
    console.log("6. テスト通知送信開始");

    try {
      // 直接Notification APIを使用してテスト
      console.log("7. 直接Notification API使用テスト");
      const directNotification = new Notification("直接通知テスト", {
        body: "これは直接Notification APIを使用したテストです",
        icon: "/vite.svg",
      });
      console.log("8. 直接通知オブジェクト:", directNotification);

      setTimeout(() => directNotification.close(), 5000);

      // サービス経由でのテスト
      console.log("9. notificationService経由のテスト");
      const success = notificationService.sendMedicationReminder("テスト用ピル", 0);
      console.log("10. 通知送信結果:", success);

      if (success) {
        console.log("✅ 通知が正常に送信されました");
        alert("テスト通知を送信しました！通知パネルを確認してください。");
      } else {
        console.log("❌ 通知送信に失敗しました");
        alert("通知送信に失敗しました。権限やブラウザ設定を確認してください。");
      }
    } catch (error) {
      console.error("通知送信中のエラー:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`通知送信エラー: ${errorMessage}`);
    }
  };

  const settingItems: SettingItem[] = [
    {
      id: "profile",
      title: "ユーザー情報",
      description: "名前、プロフィール、アカウント情報",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      onClick: () => {
        setShowProfileModal(true);
      },
    },
    {
      id: "notifications",
      title: "通知設定",
      description: userGender === "male" ? "男性ユーザーには利用できません" : "生理日、排卵日リマインダー、その他通知",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
      ),
      onClick: () => {
        setShowNotificationModal(true);
      },
    },
    {
      id: "security",
      title: "セキュリティ",
      description: "パスワード変更",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      ),
      onClick: () => {
        setShowSecurityModal(true);
      },
    },
    {
      id: "data",
      title: "データ管理",
      description: userGender === "male" ? "男性ユーザーには利用できません" : "データのエクスポート、削除",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
          />
        </svg>
      ),
      onClick: () => {
        setShowDataManagementModal(true);
      },
    },
    {
      id: "appearance",
      title: "外観",
      description: "テーマ",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
          />
        </svg>
      ),
      onClick: () => {
        setShowAppearanceModal(true);
      },
    },
    {
      id: "support",
      title: "サポート",
      description: "ヘルプ、お問い合わせ",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      onClick: () => {
        setShowSupportModal(true);
      },
    },
  ];

  // Add logout item if onLogout is provided (mobile only)
  if (onLogout) {
    settingItems.push({
      id: "logout",
      title: "ログアウト",
      description: "アカウントからログアウトします",
      icon: (
        <svg className="w-5 h-5 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
      ),
      onClick: handleLogoutClick,
    });
  }

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <FadeInUp delay={0}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-medical dark:border-gray-700 p-4 sm:p-6">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 dark:text-white">設定</h2>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-gray-300">アプリの設定を管理</p>
            </div>
          </div>
        </FadeInUp>

        {/* Settings Grid */}
        <FadeInUp delay={100}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-medical dark:border-gray-700 p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {settingItems.map((item) => {
                const isRestricted = userGender === "male" && (item.id === "notifications" || item.id === "data");
                return (
                  <button
                    key={item.id}
                    onClick={isRestricted ? undefined : item.onClick}
                    disabled={isRestricted}
                    className={`flex items-center p-3 sm:p-4 rounded-lg transition-colors text-left group border min-h-[44px] ${
                      isRestricted
                        ? "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
                        : "hover:bg-neutral-50 dark:hover:bg-gray-700 active:bg-neutral-100 dark:active:bg-gray-600 border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-600"
                    }`}
                  >
                  <div className={`flex-shrink-0 p-2 sm:p-3 rounded-lg transition-colors ${
                    isRestricted
                      ? "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
                      : "bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50"
                  }`}>
                    {item.icon}
                  </div>
                  <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                    <div className="flex items-center">
                      <h3 className={`text-sm sm:text-base font-medium transition-colors truncate ${
                        isRestricted
                          ? "text-gray-400 dark:text-gray-500"
                          : "text-neutral-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400"
                      }`}>
                        {item.title}
                      </h3>
                      {item.badge && (
                        <span className="ml-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs px-2 py-1 rounded-full font-medium flex-shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs sm:text-sm mt-1 leading-relaxed break-words ${
                      isRestricted
                        ? "text-gray-400 dark:text-gray-600"
                        : "text-neutral-500 dark:text-gray-400"
                    }`}>{item.description}</p>
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    <svg
                      className={`w-4 h-4 transition-colors ${
                        isRestricted
                          ? "text-gray-300 dark:text-gray-600"
                          : "text-neutral-400 dark:text-gray-500 group-hover:text-primary-600 dark:group-hover:text-primary-400"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
                );
              })}
            </div>
          </div>
        </FadeInUp>

        {/* App Info */}
        <FadeInUp delay={200}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-medical dark:border-gray-700 p-4 sm:p-6">
            <div className="text-center text-xs sm:text-sm text-neutral-500 dark:text-gray-400">
              <p className="font-medium">Pairiod v1.0.0</p>
              <p className="mt-1">© 2025 Pairiod. All rights reserved.</p>

              {/* デバッグ機能 */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                <p className="text-xs text-neutral-400 dark:text-gray-500 mb-2">開発者機能</p>
                <div className="space-y-2">
                  <button
                    onClick={handleNotificationDebug}
                    className="px-3 py-1.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors w-full"
                  >
                    通知テスト・デバッグ
                  </button>
                  <button
                    onClick={handleImmediateNotificationTest}
                    className="px-3 py-1.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors w-full"
                  >
                    即座通知テスト
                  </button>
                  <button
                    onClick={() => {
                      console.log("=== 環境チェック ===");
                      console.log("User Agent:", navigator.userAgent);
                      console.log("User Agent Platform:", (navigator as any).userAgentData?.platform || "Unknown");
                      console.log("Notification Support:", "Notification" in window);
                      console.log("Permission:", Notification.permission);
                      console.log("Document visibility:", document.visibilityState);
                      console.log("Document hasFocus:", document.hasFocus());
                      console.log("Current URL:", window.location.href);
                      console.log("Is HTTPS:", window.location.protocol === "https:");
                      alert("環境情報をコンソールに出力しました");
                    }}
                    className="px-3 py-1.5 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors w-full"
                  >
                    環境チェック
                  </button>
                  <button
                    onClick={() => {
                      console.log("=== 1分後に通知テスト ===");
                      const now = new Date();
                      const oneMinuteLater = new Date(now.getTime() + 60 * 1000);
                      console.log(`現在時刻: ${now.toLocaleTimeString()}`);
                      console.log(`通知予定時刻: ${oneMinuteLater.toLocaleTimeString()}`);

                      // 1分後に通知を送信
                      setTimeout(() => {
                        console.log("=== 1分後の通知を送信 ===");
                        import("../../services/notificationService").then(({ notificationService }) => {
                          notificationService.sendMedicationReminder("テストピル（1分後）", 0);
                          console.log("1分後の通知が送信されました");
                        });
                      }, 60 * 1000);

                      alert(`1分後（${oneMinuteLater.toLocaleTimeString()}）に通知が送信されます。\nベルアイコンから通知パネルを確認してください。`);
                    }}
                    className="px-3 py-1.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors w-full"
                  >
                    1分後に通知テスト
                  </button>
                </div>
              </div>
            </div>
          </div>
        </FadeInUp>
      </div>

      {/* Notification Settings Modal */}
      <NotificationSettingsModal isOpen={showNotificationModal} onClose={() => setShowNotificationModal(false)} onSave={handleNotificationSave} />

      {/* Appearance Settings Modal */}
      <AppearanceSettingsModal isOpen={showAppearanceModal} onClose={() => setShowAppearanceModal(false)} onSave={handleAppearanceSave} />

      {/* Data Management Modal */}
      <DataManagementModal isOpen={showDataManagementModal} onClose={() => setShowDataManagementModal(false)} onDataDeleted={onDataDeleted} />

      {/* Profile Settings Modal */}
      <ProfileSettingsModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} onSave={handleProfileSave} />

      {/* Support Modal */}
      <SupportModal isOpen={showSupportModal} onClose={() => setShowSupportModal(false)} />

      {/* Security Settings Modal */}
      <SecuritySettingsModal isOpen={showSecurityModal} onClose={() => setShowSecurityModal(false)} />

      {/* Logout Confirmation Modal */}
      {showLogoutModal && <ConfirmationModal message="ログアウトしますか？" onConfirm={handleLogoutConfirm} onCancel={handleLogoutCancel} />}
    </>
  );
};
