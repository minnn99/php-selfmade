import React, { useState, useEffect } from 'react';
import { menstrualCycleAPI } from '../services/api';

export const MobileActions: React.FC = () => {
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

  return (
    <div className="lg:hidden space-y-6">
      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-medical p-4">
        <h3 className="text-xs sm:text-sm font-medium text-gray-600 mb-4">クイックアクション</h3>
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={action.onClick}
              disabled={action.disabled}
              className={`flex items-center justify-center px-3 py-2 text-xs sm:text-sm font-medium text-white rounded-lg transition-colors ${action.color}`}
            >
              <span className="mr-2">{action.icon}</span>
              {loading ? '処理中...' : action.label}
            </button>
          ))}
        </div>
      </div>

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