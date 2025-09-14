import React, { useState } from "react";
import { menstrualCycleAPI } from "../../services/api";
import { ConfirmationModal } from "../modals/ConfirmationModal"; // 追加
import { useTranslation } from "../../contexts/LanguageContext";

interface SettingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onDataDeleted: () => void; // 追加
}

interface SettingItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ isOpen, onClose, onDataDeleted }) => {
  const { t } = useTranslation();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSecondConfirmModal, setShowSecondConfirmModal] = useState(false);

  // 最初の確認モーダルを表示する関数
  const handleInitialDeleteClick = () => {
    setShowConfirmModal(true);
  };

  // 最初の確認モーダルで「はい」が押された時の処理
  const handleConfirmFirst = () => {
    setShowConfirmModal(false); // 最初のモーダルを閉じる
    setShowSecondConfirmModal(true); // 次の確認モーダルを表示
  };

  // ローカルストレージから全ての生理データを削除
  const clearAllPeriodDataFromLocalStorage = () => {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('daily-symptoms-')) {
        keys.push(key);
      }
    }
    
    keys.forEach(key => {
      const existingData = JSON.parse(localStorage.getItem(key) || '{}');
      
      // 生理関連のフラグのみを削除（他の症状データは保持）
      const updatedData = {
        ...existingData,
        isPeriodStart: false,
        isPeriodEnd: false,
        hasPeriod: false,
        flowIntensity: undefined
      };
      
      // 他に意味のあるデータがない場合は完全に削除
      const hasOtherData = 
        (updatedData.symptoms && updatedData.symptoms.length > 0) ||
        (updatedData.mood && updatedData.mood.trim() !== "") ||
        (updatedData.healthNotes && updatedData.healthNotes.trim() !== "");
        
      if (hasOtherData) {
        // 他のデータがある場合は生理情報のみクリア
        localStorage.setItem(key, JSON.stringify(updatedData));
      } else {
        // 他にデータがない場合は完全に削除
        localStorage.removeItem(key);
      }
    });
    
  };

  // 2番目の確認モーダルで「はい」が押された時の処理（実際の削除処理）
  const handleConfirmSecond = async () => {
    setShowSecondConfirmModal(false); // 2番目のモーダルを閉じる
    try {
      const response = await menstrualCycleAPI.deleteAllCycles();
      
      // ローカルストレージから全ての生理データを削除
      clearAllPeriodDataFromLocalStorage();
      
      // カスタムイベントを発火してアプリ全体を更新
      window.dispatchEvent(new CustomEvent('menstrualDataUpdated'));
      
      alert(`全ての生理周期データが削除されました\n削除件数: ${response.deleted_count || 0}件`);
      onClose();
      onDataDeleted(); // データ削除成功時に親に通知
    } catch (error: unknown) {

      let errorMessage = "全削除に失敗しました。";
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response: { data: { message?: string }, status: number } };
        const errorData = axiosError.response.data;
        if (errorData.message) {
          errorMessage += `\nエラー: ${errorData.message}`;
        }
        errorMessage += `\nステータス: ${axiosError.response.status}`;
      } else if (error instanceof Error) {
        errorMessage += `\nエラー: ${error.message}`;
      }
      alert(errorMessage); // ここもカスタムモーダルに置き換えるのが理想
    }
  };

  // モーダルを閉じる共通の処理
  const handleCancel = () => {
    setShowConfirmModal(false);
    setShowSecondConfirmModal(false);
  };

  const settingItems: SettingItem[] = [
    {
      id: "profile",
      title: t('settings.profile'),
      description: t('settings.profileDescription'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      onClick: () => {
      },
    },
    {
      id: "notifications",
      title: t('settings.notifications'),
      description: t('settings.notificationsDescription'),
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
      },
    },
    {
      id: "privacy",
      title: t('settings.privacy'),
      description: t('settings.privacyDescription'),
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
      },
    },
    {
      id: "security",
      title: t('settings.security'),
      description: t('settings.securityDescription'),
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
      },
    },
    {
      id: "data",
      title: t('settings.dataManagement'),
      description: t('settings.dataManagementDescription'),
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
      },
    },
    {
      id: "appearance",
      title: t('settings.appearance'),
      description: t('settings.appearanceDescription'),
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
      },
    },
    {
      id: "support",
      title: t('settings.support'),
      description: t('settings.supportDescription'),
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
      },
    },
    {
      id: "delete_all_data",
      title: t('settings.deleteAllData'),
      description: t('settings.deleteAllDataDescription'),
      icon: (
        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      ),
      onClick: handleInitialDeleteClick, // ここを修正
    },
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300" onClick={onClose} />}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-900">{t('settings.title')}</h2>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
            <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Settings List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-2">
            {settingItems.map((item) => (
              <button
                key={item.id}
                onClick={item.onClick}
                className="w-full flex items-center p-4 rounded-lg hover:bg-neutral-50 transition-colors text-left group"
              >
                <div className="flex-shrink-0 p-2 bg-primary-50 rounded-lg text-primary-600 group-hover:bg-primary-100 transition-colors">{item.icon}</div>
                <div className="ml-4 flex-1">
                  <h3 className="text-sm font-medium text-neutral-900 group-hover:text-primary-600 transition-colors">{item.title}</h3>
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

        {/* Footer */}
        <div className="p-6 border-t border-neutral-200">
          <div className="text-center text-xs text-neutral-500">
            <p>Pairiod v1.0.0</p>
            <p className="mt-1">© 2025 Pairiod. All rights reserved.</p>
          </div>
        </div>
      </div>

      {/* 最初の確認モーダル */}
      {showConfirmModal && (
        <ConfirmationModal
          message="全ての生理周期データを削除しますか？この操作は取り消すことができません。"
          onConfirm={handleConfirmFirst}
          onCancel={handleCancel}
        />
      )}

      {/* 2番目の確認モーダル */}
      {showSecondConfirmModal && (
        <ConfirmationModal
          message="本当に全てのデータを削除しますか？※この操作は永続的で復元できません※"
          onConfirm={handleConfirmSecond}
          onCancel={handleCancel}
        />
      )}
    </>
  );
};
