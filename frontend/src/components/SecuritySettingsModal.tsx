import React, { useState, useEffect } from "react";

interface SecuritySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SecuritySettings {
  twoFactorAuth: {
    enabled: boolean;
    method: "sms" | "email" | "app";
    backupCodes: string[];
  };
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
    twoFactorAuth: {
      enabled: false,
      method: "email",
      backupCodes: [],
    },
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

  const updateSetting = (category: keyof SecuritySettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
  };

  const handlePasswordChange = () => {
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

    // 実際の実装では、サーバーでパスワード変更処理
    updateSetting("passwordPolicy", "lastChanged", new Date().toISOString().split("T")[0]);
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setShowPasswordForm(false);
    alert("パスワードが変更されました");
  };

  const generateBackupCodes = () => {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }
    updateSetting("twoFactorAuth", "backupCodes", codes);
    alert("バックアップコードが生成されました");
  };

  const enable2FA = () => {
    updateSetting("twoFactorAuth", "enabled", true);
    generateBackupCodes();
    alert(`${settings.twoFactorAuth.method === "sms" ? "SMS" : settings.twoFactorAuth.method === "email" ? "メール" : "認証アプリ"}による2段階認証が有効になりました`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" style={{ margin: 0, top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold text-gray-900">セキュリティ設定</h2>
            <span className="ml-2 text-xl">🔒</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* パスワード設定 */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">パスワード設定</h3>
              <p className="text-sm text-gray-500">アカウントのパスワードを管理</p>
            </div>
            
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700">パスワード</span>
                  <p className="text-xs text-gray-500">
                    最終変更: {settings.passwordPolicy.lastChanged || "未設定"}
                  </p>
                </div>
                <button
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                  className="px-3 py-1 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                >
                  {showPasswordForm ? "キャンセル" : "変更"}
                </button>
              </div>

              {showPasswordForm && (
                <div className="space-y-3 border-t pt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">現在のパスワード</label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">新しいパスワード</label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">新しいパスワード（確認）</label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <button
                    onClick={handlePasswordChange}
                    className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                  >
                    パスワードを変更
                  </button>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">パスワード要件</label>
                <div className="text-xs text-gray-600 space-y-1">
                  <div className="flex items-center">
                    <span className={`mr-2 ${settings.passwordPolicy.minLength >= 8 ? 'text-green-600' : 'text-gray-400'}`}>
                      {settings.passwordPolicy.minLength >= 8 ? '✓' : '○'}
                    </span>
                    最低{settings.passwordPolicy.minLength}文字
                  </div>
                  <div className="flex items-center">
                    <span className={`mr-2 ${settings.passwordPolicy.requireUppercase ? 'text-green-600' : 'text-gray-400'}`}>
                      {settings.passwordPolicy.requireUppercase ? '✓' : '○'}
                    </span>
                    大文字を含む
                  </div>
                  <div className="flex items-center">
                    <span className={`mr-2 ${settings.passwordPolicy.requireNumbers ? 'text-green-600' : 'text-gray-400'}`}>
                      {settings.passwordPolicy.requireNumbers ? '✓' : '○'}
                    </span>
                    数字を含む
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2段階認証 */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">2段階認証</h3>
              <p className="text-sm text-gray-500">ログイン時の追加セキュリティ</p>
            </div>
            
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700">2段階認証</span>
                  <p className="text-xs text-gray-500">
                    {settings.twoFactorAuth.enabled ? "有効" : "無効"}
                  </p>
                </div>
                <button
                  onClick={() => settings.twoFactorAuth.enabled 
                    ? updateSetting("twoFactorAuth", "enabled", false)
                    : enable2FA()
                  }
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    settings.twoFactorAuth.enabled
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-primary-600 hover:bg-primary-700 text-white"
                  }`}
                >
                  {settings.twoFactorAuth.enabled ? "無効にする" : "有効にする"}
                </button>
              </div>

              {settings.twoFactorAuth.enabled && (
                <div className="space-y-3 border-t pt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">認証方法</label>
                    <select
                      value={settings.twoFactorAuth.method}
                      onChange={(e) => updateSetting("twoFactorAuth", "method", e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="email">メール</option>
                      <option value="sms">SMS</option>
                      <option value="app">認証アプリ</option>
                    </select>
                  </div>

                  {settings.twoFactorAuth.backupCodes.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-yellow-800 mb-2">バックアップコード</p>
                      <p className="text-xs text-yellow-700 mb-2">
                        デバイスにアクセスできない場合に使用してください
                      </p>
                      <div className="grid grid-cols-2 gap-1 text-xs font-mono">
                        {settings.twoFactorAuth.backupCodes.slice(0, 4).map((code, index) => (
                          <span key={index} className="bg-yellow-100 px-2 py-1 rounded">
                            {code}
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={generateBackupCodes}
                        className="mt-2 text-xs text-yellow-700 hover:text-yellow-900 underline"
                      >
                        新しいコードを生成
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ログインセキュリティ */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">ログインセキュリティ</h3>
              <p className="text-sm text-gray-500">ログイン関連のセキュリティ設定</p>
            </div>
            
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <label className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700">ログイン通知</span>
                  <p className="text-xs text-gray-500">新しいデバイスからのログイン通知</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.loginSecurity.loginNotifications}
                  onChange={(e) => updateSetting("loginSecurity", "loginNotifications", e.target.checked)}
                  className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                />
              </label>

              <label className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700">デバイス記憶</span>
                  <p className="text-xs text-gray-500">信頼できるデバイスを記憶</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.loginSecurity.deviceRemembering}
                  onChange={(e) => updateSetting("loginSecurity", "deviceRemembering", e.target.checked)}
                  className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                />
              </label>

              <label className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700">不審なアクティビティ通知</span>
                  <p className="text-xs text-gray-500">異常なアクセスパターンの検知</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.loginSecurity.suspiciousActivityAlerts}
                  onChange={(e) => updateSetting("loginSecurity", "suspiciousActivityAlerts", e.target.checked)}
                  className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                />
              </label>
            </div>
          </div>

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