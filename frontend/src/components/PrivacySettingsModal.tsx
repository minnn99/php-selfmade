import React, { useState, useEffect } from 'react';

interface PrivacySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: PrivacySettings) => void;
}

interface PrivacySettings {
  dataSharing: {
    analyticsEnabled: boolean;
    partnerDataSharing: boolean;
  };
  dataRetention: {
    period: 'forever' | '1year' | '2years' | '5years';
    autoDeleteAfterInactive: boolean;
    inactivityPeriod: number; // months
  };
  visibility: {
    profileVisibility: 'private' | 'partner_only' | 'limited_public';
    statisticsSharing: boolean;
    predictionDataSharing: boolean;
  };
  security: {
    twoFactorAuth: boolean;
    dataEncryption: boolean;
    secureBackup: boolean;
    loginNotifications: boolean;
  };
}

export const PrivacySettingsModal: React.FC<PrivacySettingsModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [settings, setSettings] = useState<PrivacySettings>({
    dataSharing: {
      analyticsEnabled: false,
      partnerDataSharing: true
    },
    dataRetention: {
      period: 'forever',
      autoDeleteAfterInactive: false,
      inactivityPeriod: 12
    },
    visibility: {
      profileVisibility: 'private',
      statisticsSharing: false,
      predictionDataSharing: false
    },
    security: {
      twoFactorAuth: false,
      dataEncryption: true,
      secureBackup: true,
      loginNotifications: true
    }
  });

  // ローカルストレージから設定を読み込み
  useEffect(() => {
    const savedSettings = localStorage.getItem('privacySettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('privacySettings', JSON.stringify(settings));
    onSave(settings);
    onClose();
  };

  const updateSetting = (category: keyof PrivacySettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" style={{ margin: 0, top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">プライバシー設定</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* データ共有設定 */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">データ共有設定</h3>
              <p className="text-sm text-gray-500">どのデータを共有するかを設定できます</p>
            </div>
            
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <label className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700">使用統計の共有</span>
                  <p className="text-xs text-gray-500">アプリ改善のための匿名使用データ</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.dataSharing.analyticsEnabled}
                  onChange={(e) => updateSetting('dataSharing', 'analyticsEnabled', e.target.checked)}
                  className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                />
              </label>


              <label className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700">パートナーとのデータ共有</span>
                  <p className="text-xs text-gray-500">連携したパートナーとの基本情報共有</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.dataSharing.partnerDataSharing}
                  onChange={(e) => updateSetting('dataSharing', 'partnerDataSharing', e.target.checked)}
                  className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                />
              </label>
            </div>
          </div>

          {/* データ保存期間設定 */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">データ保存期間設定</h3>
              <p className="text-sm text-gray-500">データの保存期間を管理できます</p>
            </div>
            
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  データ保存期間
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'forever', label: '無期限（削除するまで保存）' },
                    { value: '1year', label: '1年間' },
                    { value: '2years', label: '2年間' },
                    { value: '5years', label: '5年間' }
                  ].map((option) => (
                    <label key={option.value} className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="dataRetentionPeriod"
                        value={option.value}
                        checked={settings.dataRetention.period === option.value}
                        onChange={(e) => updateSetting('dataRetention', 'period', e.target.value)}
                        className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <label className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700">非アクティブ時の自動削除</span>
                  <p className="text-xs text-gray-500">一定期間使用されていない場合の自動削除</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.dataRetention.autoDeleteAfterInactive}
                  onChange={(e) => updateSetting('dataRetention', 'autoDeleteAfterInactive', e.target.checked)}
                  className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                />
              </label>

              {settings.dataRetention.autoDeleteAfterInactive && (
                <div className="ml-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    非アクティブ期間（ヶ月）
                  </label>
                  <select
                    value={settings.dataRetention.inactivityPeriod}
                    onChange={(e) => updateSetting('dataRetention', 'inactivityPeriod', parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value={6}>6ヶ月</option>
                    <option value={12}>12ヶ月</option>
                    <option value={18}>18ヶ月</option>
                    <option value={24}>24ヶ月</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* 表示・公開設定 */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">表示・公開設定</h3>
              <p className="text-sm text-gray-500">プロフィールや統計情報の公開範囲を設定</p>
            </div>
            
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  プロフィール公開範囲
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'private', label: 'プライベート（自分のみ）' },
                    { value: 'partner_only', label: 'パートナーのみ' },
                    { value: 'limited_public', label: '制限公開（統計のみ）' }
                  ].map((option) => (
                    <label key={option.value} className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="profileVisibility"
                        value={option.value}
                        checked={settings.visibility.profileVisibility === option.value}
                        onChange={(e) => updateSetting('visibility', 'profileVisibility', e.target.value)}
                        className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <label className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700">統計情報の共有</span>
                  <p className="text-xs text-gray-500">匿名化された統計データの共有</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.visibility.statisticsSharing}
                  onChange={(e) => updateSetting('visibility', 'statisticsSharing', e.target.checked)}
                  className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                />
              </label>

              <label className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700">予測データの共有</span>
                  <p className="text-xs text-gray-500">生理・排卵予測データの共有</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.visibility.predictionDataSharing}
                  onChange={(e) => updateSetting('visibility', 'predictionDataSharing', e.target.checked)}
                  className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                />
              </label>
            </div>
          </div>

          {/* セキュリティ設定 */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">セキュリティ設定</h3>
              <p className="text-sm text-gray-500">アカウントとデータのセキュリティ設定</p>
            </div>
            
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <label className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700">2段階認証</span>
                  <p className="text-xs text-gray-500">ログイン時の追加認証</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.security.twoFactorAuth}
                  onChange={(e) => updateSetting('security', 'twoFactorAuth', e.target.checked)}
                  className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                />
              </label>

              <label className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700">データ暗号化</span>
                  <p className="text-xs text-gray-500">保存データの暗号化</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.security.dataEncryption}
                  onChange={(e) => updateSetting('security', 'dataEncryption', e.target.checked)}
                  className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                />
              </label>

              <label className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700">セキュアバックアップ</span>
                  <p className="text-xs text-gray-500">暗号化されたクラウドバックアップ</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.security.secureBackup}
                  onChange={(e) => updateSetting('security', 'secureBackup', e.target.checked)}
                  className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                />
              </label>

              <label className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700">ログイン通知</span>
                  <p className="text-xs text-gray-500">新しいデバイスからのログイン通知</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.security.loginNotifications}
                  onChange={(e) => updateSetting('security', 'loginNotifications', e.target.checked)}
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