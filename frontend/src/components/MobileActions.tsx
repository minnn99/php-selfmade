import React, { useState, useEffect } from 'react';
import { menstrualCycleAPI } from '../services/api';
import { menstrualStatusManager } from '../services/menstrualStatusManager';

export const MobileActions: React.FC = () => {
  const [menstrualStatus, setMenstrualStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Subscribe to menstrual status updates
  useEffect(() => {
    console.log('MobileActions - Subscribing to menstrual status updates');
    const unsubscribe = menstrualStatusManager.subscribe((status) => {
      console.log('MobileActions - Received status update:', status);
      setMenstrualStatus(status);
    });

    return unsubscribe;
  }, []);

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
      
      // 既存のデータがある場合のみ生理フラグを追加更新
      if (existingData && Object.keys(existingData).length > 0) {
        const updatedData = {
          ...existingData,
          isPeriodStart: dateString === startDate,
          isPeriodEnd: dateString === endDate,
          hasPeriod: true,
          timestamp: new Date().toISOString()
        };
        localStorage.setItem(`daily-symptoms-${dateString}`, JSON.stringify(updatedData));
      } else {
        // 既存のデータがない場合は生理フラグのみ設定
        const updatedData = {
          isPeriodStart: dateString === startDate,
          isPeriodEnd: dateString === endDate,
          hasPeriod: true,
          timestamp: new Date().toISOString()
        };
        localStorage.setItem(`daily-symptoms-${dateString}`, JSON.stringify(updatedData));
      }
      
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
      
      // Reload status first to get the new active cycle
      await menstrualStatusManager.forceReloadStatus();
      
      // カスタムイベントを発火してカレンダーとセルフケアを更新（すぐに実行）
      window.dispatchEvent(new CustomEvent('menstrualDataUpdated'));
      
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
      await menstrualStatusManager.forceReloadStatus();
      
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

    </div>
  );
};