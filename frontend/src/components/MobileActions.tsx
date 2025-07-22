import React, { useState, useEffect } from 'react';
import { menstrualCycleAPI } from '../services/api';

export const MobileActions: React.FC = () => {
  const [menstrualStatus, setMenstrualStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);

  // Load menstrual status on component mount
  useEffect(() => {
    loadMenstrualStatus();
  }, []);

  // Debounced listener for menstrual data updates
  useEffect(() => {
    let timeoutId: number;
    
    const handleDataUpdate = () => {
      console.log('MobileActions - Menstrual data updated, debouncing reload...');
      
      // Clear existing timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Set new timeout
      timeoutId = setTimeout(() => {
        if (!isLoadingStatus && !loading) {
          loadMenstrualStatus();
        }
      }, 600); // 600ms debounce for MobileActions
    };

    window.addEventListener('menstrualDataUpdated', handleDataUpdate);
    
    return () => {
      window.removeEventListener('menstrualDataUpdated', handleDataUpdate);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isLoadingStatus, loading]);

  const loadMenstrualStatus = async () => {
    if (isLoadingStatus) {
      console.log('MobileActions - Already loading status, skipping...');
      return;
    }

    setIsLoadingStatus(true);
    try {
      const status = await menstrualCycleAPI.getCurrentStatus();
      console.log('MobileActions - Loaded menstrual status:', status);
      setMenstrualStatus(status);
    } catch (error) {
      console.error('MobileActions - Failed to load menstrual status:', error);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  // ローカルタイムゾーンで日付文字列を取得
  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 生理期間中の日付をローカルストレージに保存してカレンダーに反映
  const updateCalendarForPeriod = async (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // 開始日から終了日まで1日ずつループ
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dateString = getLocalDateString(currentDate);
      
      // 既存のデータを取得
      const existingData = JSON.parse(localStorage.getItem(`daily-symptoms-${dateString}`) || '{}');
      
      // 生理中のフラグを設定
      const updatedData = {
        ...existingData,
        isPeriodStart: dateString === startDate,
        isPeriodEnd: dateString === endDate,
        hasPeriod: true,
        symptoms: existingData.symptoms || [],
        mood: existingData.mood || '',
        healthNotes: existingData.healthNotes || '',
        flowIntensity: existingData.flowIntensity || 2, // デフォルトは普通
        timestamp: new Date().toISOString()
      };
      
      // ローカルストレージに保存
      localStorage.setItem(`daily-symptoms-${dateString}`, JSON.stringify(updatedData));
      
      // 次の日へ
      currentDate.setDate(currentDate.getDate() + 1);
    }
  };

  const handleStartPeriod = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const today = getLocalDateString(new Date());
      await menstrualCycleAPI.startCycle({
        start_date: today
      });
      
      // 生理開始から今日まで（つまり今日だけ）を生理中として設定
      await updateCalendarForPeriod(today, today);
      
      // カスタムイベントを発火してカレンダーとセルフケアを更新（すぐに実行）
      window.dispatchEvent(new CustomEvent('menstrualDataUpdated'));
      
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
    if (loading || !menstrualStatus?.hasActiveCycle || !menstrualStatus?.activeCycle) return;
    
    setLoading(true);
    try {
      const today = getLocalDateString(new Date());
      const startDate = menstrualStatus.activeCycle.start_date;
      
      await menstrualCycleAPI.endCycle(today);
      
      // 生理開始日から今日まで全ての日を生理中として設定
      await updateCalendarForPeriod(startDate, today);
      
      // カスタムイベントを発火してカレンダーとセルフケアを更新（すぐに実行）
      window.dispatchEvent(new CustomEvent('menstrualDataUpdated'));
      
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
      color: menstrualStatus?.hasActiveCycle 
        ? 'bg-gray-300 cursor-not-allowed' 
        : 'bg-red-500 hover:bg-red-600 active:bg-red-700',
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
        : 'bg-green-500 hover:bg-green-600 active:bg-green-700',
      disabled: !menstrualStatus?.hasActiveCycle || loading,
      onClick: handleEndPeriod,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
  ];

  return (
    <div className="lg:hidden space-y-6">
      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-medical p-4">
        <h3 className="text-xs sm:text-sm font-medium text-gray-600 mb-4">
          クイックアクション
          {/* デバッグ情報 */}
          {menstrualStatus && (
            <span className="ml-2 text-xs text-gray-400">
              (Active: {menstrualStatus.hasActiveCycle ? 'Yes' : 'No'})
            </span>
          )}
        </h3>
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
              {/* 生理中状態の表示 */}
              {action.id === 'period-end' && menstrualStatus?.hasActiveCycle && (
                <span className="ml-1 text-xs opacity-90">(生理中)</span>
              )}
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