import React, { useState, useEffect } from 'react';
import { menstrualCycleAPI } from '../services/api';

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
}

export const Navigation: React.FC<NavigationProps> = ({ activeView, onViewChange }) => {
  const [menstrualStatus, setMenstrualStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Load menstrual status on component mount
  useEffect(() => {
    loadMenstrualStatus();
  }, []);

  const loadMenstrualStatus = async () => {
    try {
      const status = await menstrualCycleAPI.getCurrentStatus();
      setMenstrualStatus(status);
    } catch (error) {
      console.error('Failed to load menstrual status:', error);
    }
  };

  const handleStartPeriod = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
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
    if (loading || !menstrualStatus?.activeCycle) return;
    
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await menstrualCycleAPI.endCycle(menstrualStatus.activeCycle.id, today);
      
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
      id: 'symptoms',
      label: '症状記録',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: 'statistics',
      label: '統計',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      id: 'predictions',
      label: '予測',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
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
    },
  ];

  const quickActions = [
    {
      id: 'period-start',
      label: '生理開始',
      color: menstrualStatus?.hasActiveCycle 
        ? 'bg-gray-300 cursor-not-allowed' 
        : 'bg-red-500 hover:bg-red-600',
      disabled: menstrualStatus?.hasActiveCycle || loading,
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
      color: !menstrualStatus?.hasActiveCycle 
        ? 'bg-gray-300 cursor-not-allowed' 
        : 'bg-gray-500 hover:bg-gray-600',
      disabled: !menstrualStatus?.hasActiveCycle || loading,
      onClick: handleEndPeriod,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Main Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-medical p-4">
        <h3 className="text-sm font-medium text-gray-600 mb-4">メニュー</h3>
        <nav className="space-y-1">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                item.isActive
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
              {item.badge && (
                <span className="ml-auto bg-primary-100 text-primary-600 text-xs px-2 py-1 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-medical p-4">
        <h3 className="text-sm font-medium text-gray-600 mb-4">クイックアクション</h3>
        <div className="space-y-2">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={action.onClick}
              disabled={action.disabled}
              className={`w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors ${action.color}`}
            >
              <span className="mr-2">{action.icon}</span>
              {loading ? '処理中...' : action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Health Tips */}
      <div className="bg-gradient-to-br from-primary-50 to-purple-50 rounded-xl border border-primary-200 p-4">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-1">今日のアドバイス</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              生理前の期間です。カルシウムやマグネシウムを含む食品を摂取することで、PMSの症状を軽減できます。
            </p>
          </div>
        </div>
      </div>

      {/* Cycle Progress */}
      <div className="bg-white rounded-xl shadow-sm border border-medical p-4">
        <h3 className="text-sm font-medium text-gray-600 mb-4">周期の進行状況</h3>
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