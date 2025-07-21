import React, { useState } from "react";
import { menstrualCycleAPI } from "../services/api";
import { ConfirmationModal } from "./ConfirmationModal";
import { NotificationSettingsModal } from "./NotificationSettingsModal";
import { PrivacySettingsModal } from "./PrivacySettingsModal";
import { AppearanceSettingsModal } from "./AppearanceSettingsModal";
import { DataManagementModal } from "./DataManagementModal";
import { ProfileSettingsModal } from "./ProfileSettingsModal";
import { SupportModal } from "./SupportModal";
import { SecuritySettingsModal } from "./SecuritySettingsModal";

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
}

export const Settings: React.FC<SettingsProps> = ({ onDataDeleted, onLogout }) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSecondConfirmModal, setShowSecondConfirmModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showAppearanceModal, setShowAppearanceModal] = useState(false);
  const [showDataManagementModal, setShowDataManagementModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  const handleInitialDeleteClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmFirst = () => {
    setShowConfirmModal(false);
    setShowSecondConfirmModal(true);
  };

  const handleConfirmSecond = async () => {
    setShowSecondConfirmModal(false);
    try {
      await menstrualCycleAPI.deleteAllCycles();
      onDataDeleted();
    } catch (error: any) {
      console.error('Failed to delete all cycles:', error);
      
      let errorMessage = '全削除に失敗しました。';
      if (error.response) {
        const errorData = error.response.data;
        if (errorData.message) {
          errorMessage += `\nエラー: ${errorData.message}`;
        }
        errorMessage += `\nステータス: ${error.response.status}`;
      } else if (error.message) {
        errorMessage += `\nエラー: ${error.message}`;
      }
      alert(errorMessage);
    }
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
    setShowSecondConfirmModal(false);
  };

  const handleNotificationSave = (settings: any) => {
    console.log('Notification settings saved:', settings);
    // ここで実際の保存処理を実装
  };

  const handlePrivacySave = (settings: any) => {
    console.log('Privacy settings saved:', settings);
    // ここで実際の保存処理を実装
  };

  const handleAppearanceSave = (settings: any) => {
    console.log('Appearance settings saved:', settings);
    // ここで実際の保存処理を実装
  };

  const handleProfileSave = (profileData: any) => {
    console.log('Profile data saved:', profileData);
    // プロフィールデータは既にProfileSettingsModal内でlocalStorageに保存済み
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
      description: "プッシュ通知、メール通知の設定",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
      onClick: () => {
        setShowNotificationModal(true);
      },
    },
    {
      id: "privacy",
      title: "プライバシー",
      description: "データ共有、プライバシー設定",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
      onClick: () => {
        setShowPrivacyModal(true);
      },
    },
    {
      id: "security",
      title: "セキュリティ",
      description: "パスワード変更、2段階認証",
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
      description: "データのエクスポート、削除",
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
      description: "テーマ、表示設定",
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
    {
      id: "delete_all_data",
      title: "全データ削除",
      description: "全ての生理周期データを完全に削除します",
      icon: (
        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      onClick: handleInitialDeleteClick,
    },
  ];

  // Add logout item if onLogout is provided (mobile only)
  if (onLogout) {
    settingItems.push({
      id: "logout",
      title: "ログアウト",
      description: "アカウントからログアウトします",
      icon: (
        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      ),
      onClick: onLogout,
    });
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-medical p-6">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">設定</h2>
            <p className="text-sm text-neutral-600">アプリの設定を管理</p>
          </div>
        </div>

        {/* Settings Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-medical p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {settingItems.map((item) => (
              <button
                key={item.id}
                onClick={item.onClick}
                className="flex items-center p-4 rounded-lg hover:bg-neutral-50 transition-colors text-left group border border-gray-200 hover:border-primary-300"
              >
                <div className="flex-shrink-0 p-3 bg-primary-50 rounded-lg text-primary-600 group-hover:bg-primary-100 transition-colors">
                  {item.icon}
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-sm font-medium text-neutral-900 group-hover:text-primary-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1">{item.description}</p>
                </div>
                <div className="flex-shrink-0 ml-2">
                  <svg
                    className="w-4 h-4 text-neutral-400 group-hover:text-primary-600 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* App Info */}
        <div className="bg-white rounded-xl shadow-sm border border-medical p-6">
          <div className="text-center text-sm text-neutral-500">
            <p className="font-medium">Pairiod v1.0.0</p>
            <p className="mt-1">© 2025 Pairiod. All rights reserved.</p>
          </div>
        </div>
      </div>

      {/* Confirmation Modals */}
      {showConfirmModal && (
        <ConfirmationModal
          message="全ての生理周期データを削除しますか？この操作は取り消すことができません。"
          onConfirm={handleConfirmFirst}
          onCancel={handleCancel}
        />
      )}

      {showSecondConfirmModal && (
        <ConfirmationModal
          message="本当に全てのデータを削除しますか？※この操作は永続的で復元できません※"
          onConfirm={handleConfirmSecond}
          onCancel={handleCancel}
        />
      )}

      {/* Notification Settings Modal */}
      <NotificationSettingsModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        onSave={handleNotificationSave}
      />

      {/* Privacy Settings Modal */}
      <PrivacySettingsModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        onSave={handlePrivacySave}
      />

      {/* Appearance Settings Modal */}
      <AppearanceSettingsModal
        isOpen={showAppearanceModal}
        onClose={() => setShowAppearanceModal(false)}
        onSave={handleAppearanceSave}
      />

      {/* Data Management Modal */}
      <DataManagementModal
        isOpen={showDataManagementModal}
        onClose={() => setShowDataManagementModal(false)}
      />

      {/* Profile Settings Modal */}
      <ProfileSettingsModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onSave={handleProfileSave}
      />

      {/* Support Modal */}
      <SupportModal
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
      />

      {/* Security Settings Modal */}
      <SecuritySettingsModal
        isOpen={showSecurityModal}
        onClose={() => setShowSecurityModal(false)}
      />
    </>
  );
};