import React, { useState, useEffect } from 'react';
import { menstrualCycleAPI, userDataAPI, authAPI } from '../../services/api';
import { menstrualStatusManager } from '../../services/menstrualStatusManager';

export const MobileActions: React.FC = () => {
  const [menstrualStatus, setMenstrualStatus] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [isMaleUser, setIsMaleUser] = useState(false);

  // Check user gender
  useEffect(() => {
    const checkUserGender = async () => {
      try {
        const userData = await authAPI.getUser();
        const userGender = (userData.data as { user?: { gender?: string } })?.user?.gender || "";
        const isMale = userGender === "male" || userGender === "男性";
        setIsMaleUser(isMale);
      } catch {
        setIsMaleUser(false);
      }
    };

    checkUserGender();
  }, []);

  // Subscribe to menstrual status updates
  useEffect(() => {
    const unsubscribe = menstrualStatusManager.subscribe((status) => {
      setMenstrualStatus(status as Record<string, unknown> | null);
    });

    // 初期状態を読み込み
    menstrualStatusManager.loadStatus().then(() => {
      const currentStatus = menstrualStatusManager.getCurrentStatus();
      if (currentStatus) {
        setMenstrualStatus(currentStatus as unknown as Record<string, unknown> | null);
      }
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

  // 生理期間中の日付をMySQLに保存してカレンダーに反映
  const updateCalendarForPeriod = async (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // 開始日から終了日まで1日ずつループ
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dateString = getLocalDateString(currentDate);
      
      try {
        // 既存のデータを取得
        const response = await userDataAPI.getDailySymptoms(dateString);
        const existingData = response.data || {};
        
        // 既存のデータがある場合のみ生理フラグを追加更新
        if (existingData && Object.keys(existingData).length > 0) {
          const updatedData = {
            ...existingData,
            isPeriodStart: dateString === startDate,
            isPeriodEnd: dateString === endDate,
            hasPeriod: true,
            timestamp: new Date().toISOString()
          };
          await userDataAPI.saveDailySymptoms(dateString, updatedData);
        } else {
          // 既存のデータがない場合は生理フラグのみ設定
          const updatedData = {
            isPeriodStart: dateString === startDate,
            isPeriodEnd: dateString === endDate,
            hasPeriod: true,
            timestamp: new Date().toISOString()
          };
          await userDataAPI.saveDailySymptoms(dateString, updatedData);
        }
      } catch {
        // Silent error handling - failed to update calendar for period
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
      
      // 1. API周期を作成
      await menstrualCycleAPI.startCycle({
        start_date: today
      });
      
      // 2. 今日を生理開始日として明示的に設定
      await userDataAPI.saveDailySymptoms(today, {
        isPeriodStart: true,
        hasPeriod: true,
        timestamp: new Date().toISOString()
      });
      
      // 3. 生理開始から予測される5日間の期間を設定
      const startDate = new Date(today);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 4); // 5日間（開始日含む）
      const endDateString = getLocalDateString(endDate);
      
      // 生理開始日から予測終了日まで全ての日を生理中として設定
      await updateCalendarForPeriod(today, endDateString);
      
      // 4. カスタムイベントを発火してカレンダーとセルフケアを更新
      window.dispatchEvent(new CustomEvent('menstrualDataUpdated'));
      
      // 5. ステータス更新を待機
      setTimeout(async () => {
        await menstrualStatusManager.forceReloadStatus();
      }, 500);
      
      alert('生理が開始されました（5日間の期間が設定されました）');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '不明なエラー';
      alert('エラーが発生しました: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEndPeriod = async () => {
    if (loading || !menstrualStatus?.hasActiveCycle || !menstrualStatus?.activeCycle) return;
    
    setLoading(true);
    try {
      const today = getLocalDateString(new Date());
      const startDate = (menstrualStatus.activeCycle as { start_date: string }).start_date;
      
      await menstrualCycleAPI.endCycle(today);
      
      // 生理開始日から今日まで全ての日を生理中として設定
      if (startDate) {
        await updateCalendarForPeriod(startDate, today);
      }
      
      // カスタムイベントを発火してカレンダーとセルフケアを更新（すぐに実行）
      window.dispatchEvent(new CustomEvent('menstrualDataUpdated'));
      
      // Reload status after ending
      await menstrualStatusManager.forceReloadStatus();
      
      alert('生理が終了されました');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '不明なエラー';
      alert('エラーが発生しました: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const quickActions: Array<{
    id: string;
    label: string;
    color: string;
    disabled: boolean;
    onClick: () => void;
    icon: React.ReactNode;
  }> = [
    {
      id: 'period-start',
      label: '生理開始',
      color: menstrualStatus?.hasActiveCycle 
        ? 'bg-gray-300 cursor-not-allowed' 
        : 'bg-red-500 hover:bg-red-600 active:bg-red-700',
      disabled: (menstrualStatus?.hasActiveCycle as boolean) || loading,
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
disabled: !(menstrualStatus?.hasActiveCycle as boolean) || loading,
      onClick: handleEndPeriod,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
  ];

  // Hide mobile actions for male users
  if (isMaleUser) {
    return null;
  }

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
              {action.id === 'period-end' && (menstrualStatus?.hasActiveCycle as boolean) && (
                <span className="ml-1 text-xs opacity-90">(生理中)</span>
              )}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};