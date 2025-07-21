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
    statisticsSharing: boolean;
    predictionDataSharing: boolean;
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
      partnerDataSharing: true,
      statisticsSharing: false,
      predictionDataSharing: false
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

  const updateSetting = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      dataSharing: {
        ...prev.dataSharing,
        [field]: value
      }
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ margin: 0, top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="bg-white rounded-t-xl sm:rounded-xl shadow-2xl w-full sm:max-w-3xl sm:w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">プライバシー設定</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
          {/* データ共有設定 */}
          <div className="space-y-3 sm:space-y-4">
            <div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900">データ共有設定</h3>
              <p className="text-xs sm:text-sm text-gray-500">アプリや統計データの共有設定を管理</p>
            </div>
            
            <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
              <label className="flex items-start justify-between space-x-3">
                <div className="flex-1 min-w-0">
                  <span className="text-xs sm:text-sm font-medium text-gray-700 block">使用統計の共有</span>
                  <p className="text-xs text-gray-500 mt-1 leading-tight">アプリ改善のための匿名使用データ</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.dataSharing.analyticsEnabled}
                  onChange={(e) => updateSetting('analyticsEnabled', e.target.checked)}
                  className="w-5 h-5 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 flex-shrink-0 mt-1"
                />
              </label>


              <label className="flex items-start justify-between space-x-3">
                <div className="flex-1 min-w-0">
                  <span className="text-xs sm:text-sm font-medium text-gray-700 block">パートナーとのデータ共有</span>
                  <p className="text-xs text-gray-500 mt-1 leading-tight">連携したパートナーとの基本情報共有</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.dataSharing.partnerDataSharing}
                  onChange={(e) => updateSetting('partnerDataSharing', e.target.checked)}
                  className="w-5 h-5 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 flex-shrink-0 mt-1"
                />
              </label>

              <label className="flex items-start justify-between space-x-3">
                <div className="flex-1 min-w-0">
                  <span className="text-xs sm:text-sm font-medium text-gray-700 block">統計情報の共有</span>
                  <p className="text-xs text-gray-500 mt-1 leading-tight">匿名化された統計データの共有</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.dataSharing.statisticsSharing}
                  onChange={(e) => updateSetting('statisticsSharing', e.target.checked)}
                  className="w-5 h-5 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 flex-shrink-0 mt-1"
                />
              </label>

              <label className="flex items-start justify-between space-x-3">
                <div className="flex-1 min-w-0">
                  <span className="text-xs sm:text-sm font-medium text-gray-700 block">予測データの共有</span>
                  <p className="text-xs text-gray-500 mt-1 leading-tight">生理・排卵予測データの共有</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.dataSharing.predictionDataSharing}
                  onChange={(e) => updateSetting('predictionDataSharing', e.target.checked)}
                  className="w-5 h-5 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 flex-shrink-0 mt-1"
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
    </div>
  );
};