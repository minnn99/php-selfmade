import React, { useState, useEffect } from "react";
import { createPortal } from 'react-dom';
import { authAPI } from "../../services/api";

interface SecuritySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SecuritySettings {
  passwordPolicy: {
    requireUppercase: boolean;
    requireNumbers: boolean;
    requireSymbols: boolean;
    minLength: number;
    lastChanged: string;
  };
  loginSecurity: {
    sessionTimeout: number; // minutes
    deviceRemembering: boolean;
    loginNotifications: boolean;
    suspiciousActivityAlerts: boolean;
  };
}

export const SecuritySettingsModal: React.FC<SecuritySettingsModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<SecuritySettings>({
    passwordPolicy: {
      requireUppercase: true,
      requireNumbers: true,
      requireSymbols: false,
      minLength: 8,
      lastChanged: "",
    },
    loginSecurity: {
      sessionTimeout: 60,
      deviceRemembering: true,
      loginNotifications: true,
      suspiciousActivityAlerts: true,
    },
  });

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = () => {
    const savedSettings = localStorage.getItem("securitySettings");
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  };

  const handleSave = () => {
    localStorage.setItem("securitySettings", JSON.stringify(settings));
    onClose();
    alert("セキュリティ設定が保存されました");
  };

  const updateSetting = (category: keyof SecuritySettings, field: string, value: boolean | string | number | string[]) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
  };

  const handlePasswordChange = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      alert("全ての項目を入力してください");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("新しいパスワードが一致しません");
      return;
    }

    if (passwordForm.newPassword.length < settings.passwordPolicy.minLength) {
      alert(`パスワードは${settings.passwordPolicy.minLength}文字以上で入力してください`);
      return;
    }

    // パスワード強度チェック
    const validation = validatePassword(passwordForm.newPassword);
    if (!validation.isValid) {
      alert("パスワードがポリシーの要件を満たしていません");
      return;
    }

    setPasswordLoading(true);
    try {
      // 実際のAPIでパスワード変更
      const response = await authAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        password_confirmation: passwordForm.confirmPassword
      });
      
      if (response.success) {
        // パスワード変更成功時の処理
        updateSetting("passwordPolicy", "lastChanged", new Date().toISOString().split("T")[0]);
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setShowPasswordForm(false);
        alert("パスワードが正常に変更されました");
      } else {
        alert(response.message || "パスワード変更に失敗しました");
      }
    } catch (error: unknown) {
      
      // APIエラーのハンドリング
      let errorMessage = "パスワード変更に失敗しました";
      
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { response: { status: number; data: { message?: string } } };
        if (apiError.response.status === 400) {
          errorMessage = "現在のパスワードが間違っているか、新しいパスワードが要件を満たしていません";
        } else if (apiError.response.status === 401) {
          errorMessage = "認証エラーです。再度ログインしてください";
        } else if (apiError.response.data.message) {
          errorMessage = apiError.response.data.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setPasswordLoading(false);
    }
  };

  const validatePassword = (password: string) => {
    const length = password.length >= settings.passwordPolicy.minLength;
    const uppercase = settings.passwordPolicy.requireUppercase ? /[A-Z]/.test(password) : true;
    const numbers = settings.passwordPolicy.requireNumbers ? /[0-9]/.test(password) : true;
    const symbols = settings.passwordPolicy.requireSymbols ? /[!@#$%^&*(),.?":{}|<>]/.test(password) : true;
    const isValid = length && uppercase && numbers && symbols;
    
    return { length, uppercase, numbers, symbols, isValid };
  };


  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ margin: 0, top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div className="bg-white rounded-t-xl sm:rounded-xl shadow-2xl w-full sm:max-w-3xl sm:w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">セキュリティ設定</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
          {/* パスワード設定 */}
          <div className="space-y-3 sm:space-y-4">
            <div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900">パスワード設定</h3>
              <p className="text-xs sm:text-sm text-gray-500 leading-tight">パスワード変更と強度設定</p>
            </div>

            <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start sm:items-center justify-between">
                <div className="flex-1 mr-4">
                  <span className="text-sm font-medium text-gray-700">パスワード</span>
                  <p className="text-xs text-gray-500 mt-1">最終変更: {settings.passwordPolicy.lastChanged || "未設定"}</p>
                </div>
                <button
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                  className="px-3 py-2 text-sm bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white rounded-lg transition-colors min-h-[44px] flex items-center justify-center flex-shrink-0"
                >
                  {showPasswordForm ? "キャンセル" : "変更"}
                </button>
              </div>

              {showPasswordForm && (
                <form onSubmit={(e) => { e.preventDefault(); handlePasswordChange(); }} className="space-y-3 sm:space-y-4 border-t pt-3 sm:pt-4">
                  {/* Hidden username field for accessibility and password managers */}
                  <input
                    type="text"
                    name="username"
                    autoComplete="username"
                    style={{ display: 'none' }}
                    readOnly
                    tabIndex={-1}
                    aria-hidden="true"
                  />
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">現在のパスワード</label>
                    <input
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      autoComplete="current-password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-h-[44px] touch-manipulation"
                    />
                  </div>
                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">新しいパスワード</label>
                    <input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      autoComplete="new-password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-h-[44px] touch-manipulation"
                    />
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">新しいパスワード（確認）</label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-h-[44px] touch-manipulation"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 disabled:bg-primary-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium min-h-[44px] flex items-center justify-center touch-manipulation"
                  >
                    {passwordLoading ? "変更中..." : "パスワードを変更"}
                  </button>
                </form>
              )}

              <div className="space-y-2 sm:space-y-3">
                <label className="block text-sm font-medium text-gray-700">パスワード要件</label>
                <div className="text-xs sm:text-sm text-gray-600 space-y-2">
                  <div className="flex items-center p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <span className={`mr-2 ${settings.passwordPolicy.minLength >= 8 ? "text-green-600" : "text-gray-400"}`}>
                      {settings.passwordPolicy.minLength >= 8 ? "✓" : "○"}
                    </span>
                    最低{settings.passwordPolicy.minLength}文字
                  </div>
                  <div className="flex items-center p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <span className={`mr-2 ${settings.passwordPolicy.requireUppercase ? "text-green-600" : "text-gray-400"}`}>
                      {settings.passwordPolicy.requireUppercase ? "✓" : "○"}
                    </span>
                    大文字を含む
                  </div>
                  <div className="flex items-center p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <span className={`mr-2 ${settings.passwordPolicy.requireNumbers ? "text-green-600" : "text-gray-400"}`}>
                      {settings.passwordPolicy.requireNumbers ? "✓" : "○"}
                    </span>
                    数字を含む
                  </div>
                </div>
              </div>
            </div>
          </div>


          {/* ログインセキュリティ */}
          <div className="space-y-3 sm:space-y-4">
            <div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900">ログインセキュリティ</h3>
              <p className="text-xs sm:text-sm text-gray-500 leading-tight">ログイン関連のセキュリティ設定</p>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <label className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer min-h-[44px]">
                <div className="flex-1 mr-4">
                  <span className="text-sm font-medium text-gray-700">ログイン通知</span>
                  <p className="text-xs text-gray-500 mt-1">新しいデバイスからのログイン通知</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.loginSecurity.loginNotifications}
                  onChange={(e) => updateSetting("loginSecurity", "loginNotifications", e.target.checked)}
                  className="w-5 h-5 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                />
              </label>

              <label className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer min-h-[44px]">
                <div className="flex-1 mr-4">
                  <span className="text-sm font-medium text-gray-700">デバイス記憶</span>
                  <p className="text-xs text-gray-500 mt-1">信頼できるデバイスを記憶</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.loginSecurity.deviceRemembering}
                  onChange={(e) => updateSetting("loginSecurity", "deviceRemembering", e.target.checked)}
                  className="w-5 h-5 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                />
              </label>

              <label className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer min-h-[44px]">
                <div className="flex-1 mr-4">
                  <span className="text-sm font-medium text-gray-700">不審なアクティビティ通知</span>
                  <p className="text-xs text-gray-500 mt-1">異常なアクセスパターンの検知</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.loginSecurity.suspiciousActivityAlerts}
                  onChange={(e) => updateSetting("loginSecurity", "suspiciousActivityAlerts", e.target.checked)}
                  className="w-5 h-5 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                />
              </label>
            </div>
          </div>
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
            className="px-4 py-3 text-sm sm:text-base font-medium text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 rounded-lg transition-colors min-h-[44px] flex items-center justify-center"
          >
            保存
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
