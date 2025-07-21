import React, { useState, useEffect } from 'react';
import { menstrualCycleAPI } from '../services/api';
import { DynamicAdvice } from './DynamicAdvice';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  isActive?: boolean;
  badge?: string;
}

interface NavigationProps {
  activeView: string;
  onViewChange: (view: string) => void;
  mobileMenuOnly?: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({ activeView, onViewChange, mobileMenuOnly = false }) => {
  const [menstrualStatus, setMenstrualStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Load menstrual status on component mount
  useEffect(() => {
    loadMenstrualStatus();
  }, []);

  const loadMenstrualStatus = async () => {
    try {
      const status = await menstrualCycleAPI.getCurrentStatus();
      console.log('Menstrual status response:', status); // デバッグログ
      setMenstrualStatus(status);
    } catch (error) {
      console.error('Failed to load menstrual status:', error);
    }
  };

  // ローカルタイムゾーンで日付文字列を取得
  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleStartPeriod = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const today = getLocalDateString(new Date());
      await menstrualCycleAPI.startCycle({
        start_date: today
      });
      
      // Reload status after starting
      await loadMenstrualStatus();
      alert('生理が開始されました');
    } catch (error: any) {
      alert('エラーが発生しました: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEndPeriod = async () => {
    if (loading || !menstrualStatus?.data?.hasActiveCycle || !menstrualStatus?.data?.activeCycle) return;
    
    setLoading(true);
    try {
      const today = getLocalDateString(new Date());
      await menstrualCycleAPI.endCycle(today);
      
      // Reload status after ending
      await loadMenstrualStatus();
      alert('生理が終了されました');
    } catch (error: any) {
      alert('エラーが発生しました: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'ダッシュボード',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
      isActive: activeView === 'dashboard',
    },
    {
      id: 'calendar',
      label: 'カレンダー',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      isActive: activeView === 'calendar',
    },
    {
      id: 'pregnancy-support',
      label: '妊娠サポート',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      isActive: activeView === 'pregnancy-support',
      badge: 'BETA',
    },
    {
      id: 'partner-connection',
      label: 'パートナー連動',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
      isActive: activeView === 'partner-connection',
    },
    {
      id: 'self-care',
      label: 'セルフケア',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      isActive: activeView === 'self-care',
    },
    {
      id: 'medical-records',
      label: '診断記録',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      isActive: activeView === 'medical-records',
    },
    {
      id: 'statistics',
      label: '統計',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      isActive: activeView === 'statistics',
    },
    {
      id: 'settings',
      label: '設定',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      isActive: activeView === 'settings',
    },
  ];

  const quickActions = [
    {
      id: 'period-start',
      label: '生理開始',
      color: menstrualStatus?.data?.hasActiveCycle 
        ? 'bg-gray-300 cursor-not-allowed' 
        : 'bg-red-500 hover:bg-red-600',
      disabled: menstrualStatus?.data?.hasActiveCycle || loading,
      onClick: handleStartPeriod,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
    },
    {
      id: 'period-end',
      label: '生理終了',
      color: !menstrualStatus?.data?.hasActiveCycle 
        ? 'bg-gray-300 cursor-not-allowed' 
        : 'bg-gray-500 hover:bg-gray-600',
      disabled: !menstrualStatus?.data?.hasActiveCycle || loading,
      onClick: handleEndPeriod,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
        </svg>
      ),
    },
  ];

  // モバイルメニュー専用の場合はメニュー項目のみを返す
  if (mobileMenuOnly) {
    return (
      <div className="p-4">
        <nav className="space-y-1">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center px-3 py-2 text-xs sm:text-sm md:text-base font-medium rounded-lg transition-colors ${
                item.isActive
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
              {item.badge && (
                <span className="ml-auto bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full font-medium">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-medical p-4">
        <h3 className="text-xs sm:text-sm font-medium text-gray-600 mb-4">メニュー</h3>
        <nav className="space-y-1">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center px-3 py-2 text-xs sm:text-sm md:text-base font-medium rounded-lg transition-colors ${
                item.isActive
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
              {item.badge && (
                <span className="ml-auto bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full font-medium">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-medical p-4">
        <h3 className="text-xs sm:text-sm font-medium text-gray-600 mb-4">クイックアクション</h3>
        <div className="space-y-2">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={action.onClick}
              disabled={action.disabled}
              className={`w-full flex items-center justify-center px-3 py-2 text-xs sm:text-sm md:text-base font-medium text-white rounded-lg transition-colors ${action.color}`}
            >
              <span className="mr-2">{action.icon}</span>
              {loading ? '処理中...' : action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Health Tips */}
      <DynamicAdvice />

      {/* Cycle Progress */}
      <div className="bg-white rounded-xl shadow-sm border border-medical p-4">
        <h3 className="text-xs sm:text-sm font-medium text-gray-600 mb-4">周期の進行状況</h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>現在の周期</span>
              <span>22/28日</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-primary-500 h-2 rounded-full" style={{width: '79%'}}></div>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            次の生理まで約6日
          </div>
        </div>
      </div>

    </div>
  );
};