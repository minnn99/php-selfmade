import React, { useState, useEffect } from "react";

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
    height: "",
    weight: "",
    bloodType: "",
    allergies: "",
    medications: "",
    medicalHistory: "",
  });

  useEffect(() => {
    if (isOpen) {
      loadProfileData();
    }
  }, [isOpen]);

  const loadProfileData = () => {
    const savedProfile = localStorage.getItem("userProfile");
    const userData = localStorage.getItem("user");
    
    if (savedProfile) {
      setProfileData(JSON.parse(savedProfile));
    } else if (userData) {
      // 既存のユーザーデータから初期値を設定
      const user = JSON.parse(userData);
      setProfileData(prev => ({
        ...prev,
        fullName: user.name || "",
        email: user.email || "",
      }));
    }
  };

  const handleSave = () => {
    localStorage.setItem("userProfile", JSON.stringify(profileData));
    onSave(profileData);
    onClose();
  };

  const updateField = (field: keyof ProfileData, value: string | boolean) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value,
    }));
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
    { id: "basic", label: "基本情報", icon: "👤" },
    { id: "health", label: "健康情報", icon: "🏥" },
  ];

  const renderBasicInfo = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ニックネーム</label>
          <input
            type="text"
            value={profileData.nickname}
            onChange={(e) => updateField("nickname", e.target.value)}
            placeholder="表示用の名前"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">本名</label>
          <input
            type="text"
            value={profileData.fullName}
            onChange={(e) => updateField("fullName", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
          <input
            type="email"
            value={profileData.email}
            onChange={(e) => updateField("email", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">電話番号</label>
          <input
            type="tel"
            value={profileData.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">生年月日</label>
          <input
            type="date"
            value={profileData.birthDate}
            onChange={(e) => updateField("birthDate", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          {calculateAge() && <p className="text-sm text-gray-500 mt-1">年齢: {calculateAge()}歳</p>}
        </div>
      </div>
      
    </div>
  );

  const renderHealthInfo = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">身長 (cm)</label>
          <input
            type="number"
            value={profileData.height}
            onChange={(e) => updateField("height", e.target.value)}
            placeholder="160"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">体重 (kg)</label>
          <input
            type="number"
            value={profileData.weight}
            onChange={(e) => updateField("weight", e.target.value)}
            placeholder="50"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">血液型</label>
          <select
            value={profileData.bloodType}
            onChange={(e) => updateField("bloodType", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
        <label className="block text-sm font-medium text-gray-700 mb-1">アレルギー</label>
        <textarea
          value={profileData.allergies}
          onChange={(e) => updateField("allergies", e.target.value)}
          rows={3}
          placeholder="食物アレルギー、薬物アレルギーなど"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">現在服用中の薬</label>
        <textarea
          value={profileData.medications}
          onChange={(e) => updateField("medications", e.target.value)}
          rows={3}
          placeholder="薬名、用量、服用理由など"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">既往歴</label>
        <textarea
          value={profileData.medicalHistory}
          onChange={(e) => updateField("medicalHistory", e.target.value)}
          rows={4}
          placeholder="過去の病気、手術歴、入院歴など"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
    </div>
  );


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" style={{ margin: 0, top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold text-gray-900">プロフィール設定</h2>
            <span className="ml-2 text-xl">👤</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-white text-primary-700 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === "basic" && renderBasicInfo()}
          {activeTab === "health" && renderHealthInfo()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};