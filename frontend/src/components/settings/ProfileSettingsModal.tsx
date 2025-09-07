import React, { useState, useEffect } from "react";
import { createPortal } from 'react-dom';
import { authAPI, userDataAPI } from "../../services/api";
import { ConfirmationModal } from "../modals/ConfirmationModal";

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profileData: ProfileData) => void;
}

interface ProfileData {
  // 基本情報
  nickname: string;
  fullName: string;
  email: string;
  phone: string;
  birthDate: string;
  gender: string;

  // 健康情報
  height: string;
  weight: string;
  bloodType: string;
  allergies: string;
  medications: string;
  medicalHistory: string;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({ isOpen, onClose, onSave }) => {
  const [activeTab, setActiveTab] = useState<"basic" | "health">("basic");
  const [profileData, setProfileData] = useState<ProfileData>({
    nickname: "",
    fullName: "",
    email: "",
    phone: "",
    birthDate: "",
    gender: "",
    height: "",
    weight: "",
    bloodType: "",
    allergies: "",
    medications: "",
    medicalHistory: "",
  });
  const [loading, setLoading] = useState(false);
  const [showAccountDeleteModal, setShowAccountDeleteModal] = useState(false);
  const [showAccountDeleteConfirmModal, setShowAccountDeleteConfirmModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadProfileData();
    }
  }, [isOpen]);

  // Listen for profile updates to refresh data when modal is open
  useEffect(() => {
    const handleProfileUpdate = () => {
      if (isOpen) {
        loadProfileData();
      }
    };

    window.addEventListener('userProfileUpdated', handleProfileUpdate);

    return () => {
      window.removeEventListener('userProfileUpdated', handleProfileUpdate);
    };
  }, [isOpen]);

  const loadProfileData = async () => {
    try {
      // まずローカル認証データから取得（最新の更新内容を反映）
      const authData = authAPI.getAuthData();
      
      // APIから設定データを取得
      const [userResponse, settingsResponse] = await Promise.all([authAPI.getUser(), userDataAPI.getSettings()]);

      const userResponseData = userResponse.data as { user?: { name?: string; email?: string; phone?: string; gender?: string } };
      const apiUser = userResponseData.user;
      const settingsResponseData = settingsResponse.data as { userProfile?: ProfileData };
      const savedProfile = settingsResponse.success ? settingsResponseData.userProfile : null;

      // ローカル認証データを優先し、不足分をAPIデータで補完（型安全性を確保）
      const localUser = authData?.user;
      const userData = {
        fullName: (typeof localUser?.name === 'string' ? localUser.name : '') || (typeof apiUser?.name === 'string' ? apiUser.name : '') || "",
        email: (typeof localUser?.email === 'string' ? localUser.email : '') || (typeof apiUser?.email === 'string' ? apiUser.email : '') || "",
        phone: (typeof localUser?.phone === 'string' ? localUser.phone : '') || (typeof apiUser?.phone === 'string' ? apiUser.phone : '') || "",
        gender: (typeof localUser?.gender === 'string' ? localUser.gender : '') || (typeof apiUser?.gender === 'string' ? apiUser.gender : '') || "",
      };

      if (savedProfile) {
        setProfileData({
          ...savedProfile,
          ...userData, // ローカルデータで基本情報を上書き
        });
      } else {
        // 初期値を設定
        setProfileData((prev) => ({
          ...prev,
          ...userData,
        }));
      }
    } catch {
      // Silent error handling - failed to load profile data
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // 1. APIサーバー側のユーザー情報を更新
      await authAPI.updateUser({
        name: profileData.fullName,
        email: profileData.email,
        phone: profileData.phone,
      });

      // 2. 詳細プロフィール情報を設定として保存
      await userDataAPI.saveSettings({
        userProfile: profileData,
      });

      onSave(profileData);
      onClose();
      
      // カスタムイベントを発火してユーザー情報の再読み込みを促す
      window.dispatchEvent(new CustomEvent('userProfileUpdated'));
      
      alert("プロフィールが保存されました");
      
    } catch {
      alert("プロフィールの保存に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof ProfileData, value: string | boolean) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const getGenderDisplay = (gender: string) => {
    switch (gender) {
      case "male":
        return "男性";
      case "female":
        return "女性";
      case "other":
        return "その他";
      default:
        return "未設定";
    }
  };

  const calculateAge = () => {
    if (!profileData.birthDate) return "";
    const birth = new Date(profileData.birthDate);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return (age - 1).toString();
    }
    return age.toString();
  };

  // アカウント削除機能
  const handleAccountDeleteClick = () => {
    setShowAccountDeleteModal(true);
  };

  const handleAccountDeleteConfirm = () => {
    setShowAccountDeleteModal(false);
    setShowAccountDeleteConfirmModal(true);
  };

  const handleAccountDeleteFinal = async () => {
    setShowAccountDeleteConfirmModal(false);
    try {
      await authAPI.deleteAccount();
      localStorage.clear();
      authAPI.stopTokenChecker();
      alert("アカウントが正常に削除されました。ご利用ありがとうございました。");
      window.location.reload();
    } catch (error: unknown) {
      let errorMessage = "アカウント削除に失敗しました。";
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
      alert(errorMessage);
    }
  };

  const handleAccountDeleteCancel = () => {
    setShowAccountDeleteModal(false);
    setShowAccountDeleteConfirmModal(false);
  };

  const calculateBMI = () => {
    const heightNum = parseFloat(profileData.height);
    const weightNum = parseFloat(profileData.weight);
    if (heightNum && weightNum) {
      const heightM = heightNum / 100;
      const bmi = weightNum / (heightM * heightM);
      return bmi.toFixed(1);
    }
    return "";
  };

  const tabs = [
    { id: "basic", label: "基本情報", icon: "" },
    { id: "health", label: "健康情報", icon: "" },
  ];

  const renderBasicInfo = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">ニックネーム</label>
          <input
            type="text"
            value={profileData.nickname || ""}
            onChange={(e) => updateField("nickname", e.target.value)}
            placeholder="表示用の名前"
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-h-[44px] touch-manipulation"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">本名</label>
          <input
            type="text"
            value={profileData.fullName || ""}
            onChange={(e) => updateField("fullName", e.target.value)}
            placeholder="ミンジェ"
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-h-[44px] touch-manipulation"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">メールアドレス</label>
          <input
            type="email"
            value={profileData.email || ""}
            onChange={(e) => updateField("email", e.target.value)}
            placeholder="minjae@test.com"
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-h-[44px] touch-manipulation"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">電話番号</label>
          <input
            type="tel"
            value={profileData.phone || ""}
            onChange={(e) => updateField("phone", e.target.value)}
            placeholder="090-1234-5678"
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-h-[44px] touch-manipulation"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">生年月日</label>
          <input
            type="date"
            value={profileData.birthDate || ""}
            onChange={(e) => updateField("birthDate", e.target.value)}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-h-[44px] touch-manipulation"
          />
          {calculateAge() && <p className="text-sm text-gray-500 mt-2">年齢: {calculateAge()}歳</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">性別</label>
          <div className="w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 text-sm min-h-[44px] flex items-center text-gray-600">
            {getGenderDisplay(profileData.gender)}
          </div>
          <p className="text-xs text-gray-500 mt-1">性別は変更できません</p>
        </div>
      </div>
      
      {/* Account Delete Section */}
      <div className="mt-8 border-t border-gray-200 pt-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="flex-shrink-0 w-5 h-5 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">アカウント削除</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>アカウントと全てのデータを完全に削除します。この操作は取り消すことができません。</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={handleAccountDeleteClick}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg transition-colors"
                >
                  アカウントを削除
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHealthInfo = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">身長 (cm)</label>
          <input
            type="number"
            value={profileData.height || ""}
            onChange={(e) => updateField("height", e.target.value)}
            placeholder="160"
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-h-[44px] touch-manipulation"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">体重 (kg)</label>
          <input
            type="number"
            value={profileData.weight || ""}
            onChange={(e) => updateField("weight", e.target.value)}
            placeholder="50"
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-h-[44px] touch-manipulation"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">血液型</label>
          <select
            value={profileData.bloodType || ""}
            onChange={(e) => updateField("bloodType", e.target.value)}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-h-[44px] touch-manipulation"
          >
            <option value="">選択してください</option>
            <option value="A">A型</option>
            <option value="B">B型</option>
            <option value="O">O型</option>
            <option value="AB">AB型</option>
          </select>
        </div>
      </div>

      {calculateBMI() && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">BMI: {calculateBMI()}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">アレルギー</label>
        <textarea
          value={profileData.allergies || ""}
          onChange={(e) => updateField("allergies", e.target.value)}
          rows={3}
          placeholder="食物アレルギー、薬物アレルギーなど"
          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-h-[80px] touch-manipulation"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">現在服用中の薬</label>
        <textarea
          value={profileData.medications || ""}
          onChange={(e) => updateField("medications", e.target.value)}
          rows={3}
          placeholder="薬名、用量、服用理由など"
          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-h-[80px] touch-manipulation"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">既往歴</label>
        <textarea
          value={profileData.medicalHistory || ""}
          onChange={(e) => updateField("medicalHistory", e.target.value)}
          rows={4}
          placeholder="過去の病気、手術歴、入院歴など"
          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-h-[100px] touch-manipulation"
        />
      </div>
    </div>
  );

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ margin: 0, top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div className="bg-white rounded-t-xl sm:rounded-xl shadow-2xl w-full sm:max-w-4xl sm:w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">プロフィール設定</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="px-4 sm:px-6 pt-3 sm:pt-4 flex-shrink-0">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as "basic" | "health")}
                className={`flex-1 flex items-center justify-center space-x-1 sm:space-x-2 py-2 sm:py-3 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors min-h-[44px] ${
                  activeTab === tab.id ? "bg-white text-primary-700 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <span className="text-sm sm:text-base">{tab.icon}</span>
                <span className="text-xs sm:text-sm whitespace-nowrap">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === "basic" && renderBasicInfo()}
          {activeTab === "health" && renderHealthInfo()}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end space-y-2 sm:space-y-0 sm:space-x-3 p-4 sm:p-6 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-3 text-sm sm:text-base font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-lg transition-colors min-h-[44px] flex items-center justify-center"
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
      
      {/* Account Delete Confirmation Modals */}
      {showAccountDeleteModal && (
        <ConfirmationModal
          message="アカウントを削除しますか？この操作により、アカウントと全てのデータが完全に削除され、復元できません。"
          onConfirm={handleAccountDeleteConfirm}
          onCancel={handleAccountDeleteCancel}
        />
      )}

      {showAccountDeleteConfirmModal && (
        <ConfirmationModal
          message="最終確認&#10;&#10;アカウント削除を実行します。この操作は永続的で、一切復元できません。&#10;&#10;本当にアカウントを削除しますか？"
          onConfirm={handleAccountDeleteFinal}
          onCancel={handleAccountDeleteCancel}
        />
      )}
    </div>,
    document.body
  );
};
