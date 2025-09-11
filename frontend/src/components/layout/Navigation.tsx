import React, { useState, useEffect } from "react";
import { menstrualCycleAPI, userDataAPI, authAPI } from "../../services/api";
import { menstrualStatusManager } from "../../services/menstrualStatusManager";
import { DynamicAdvice } from "../shared/DynamicAdvice";

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
  const [menstrualStatus, setMenstrualStatus] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [isMaleUser, setIsMaleUser] = useState(false);
  const [isGenderLoading, setIsGenderLoading] = useState(true);

  // Subscribe to menstrual status updates
  useEffect(() => {
    const unsubscribe = menstrualStatusManager.subscribe((status) => {
      setMenstrualStatus(status as Record<string, unknown> | null);
    });

    return unsubscribe;
  }, []);

  // Check if user is male
  useEffect(() => {
    const checkUserGender = async () => {
      try {
        const userData = await authAPI.getUser();
        const userGender = (userData.data as { user?: { gender?: string } })?.user?.gender || "";
        const isMale = userGender === "male" || userGender === "男性";
        setIsMaleUser(isMale);
      } catch {
        setIsMaleUser(false);
      } finally {
        setIsGenderLoading(false);
      }
    };

    checkUserGender();
  }, []);

  // ローカルタイムゾーンで日付文字列を取得
  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
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
            timestamp: new Date().toISOString(),
          };
          await userDataAPI.saveDailySymptoms(dateString, updatedData);
        } else {
          // 既存のデータがない場合は生理フラグのみ設定
          const updatedData = {
            isPeriodStart: dateString === startDate,
            isPeriodEnd: dateString === endDate,
            hasPeriod: true,
            timestamp: new Date().toISOString(),
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
      await menstrualCycleAPI.startCycle({
        start_date: today,
      });

      // 生理開始から予測される5日間を生理期間として自動設定
      const startDate = new Date(today);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 4); // 5日間（開始日含む）
      const endDateString = getLocalDateString(endDate);

      // 生理開始日から予測終了日まで全ての日を生理中として設定
      await updateCalendarForPeriod(today, endDateString);

      // Reload status first to get the new active cycle
      await menstrualStatusManager.forceReloadStatus();

      // カスタムイベントを発火してカレンダーとセルフケアを更新
      window.dispatchEvent(new CustomEvent("menstrualDataUpdated"));

      alert("生理が開始されました（予測5日間の期間が設定されました）");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "不明なエラー";
      alert("エラーが発生しました: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEndPeriod = async () => {
    if (loading || !menstrualStatus?.hasActiveCycle || !menstrualStatus?.activeCycle) return;
    
    const today = getLocalDateString(new Date());
    const startDate = (menstrualStatus.activeCycle as { start_date?: string }).start_date;
    
    // 同日開始・終了を防ぐ
    if (startDate === today) {
      alert('生理開始日と同じ日に終了することはできません。翌日以降に終了してください。');
      return;
    }

    setLoading(true);
    try {
      await menstrualCycleAPI.endCycle(today);

      // 生理開始日から今日まで全ての日を生理中として設定
      if (startDate) {
        await updateCalendarForPeriod(startDate, today);
      }

      // カスタムイベントを発火してカレンダーとセルフケアを更新
      window.dispatchEvent(new CustomEvent("menstrualDataUpdated"));

      // Reload status after ending
      await menstrualStatusManager.forceReloadStatus();
      alert("生理が終了されました");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "不明なエラー";
      alert("エラーが発生しました: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPeriodStart = async () => {
    if (loading || !menstrualStatus?.hasActiveCycle || !menstrualStatus?.activeCycle) return;
    
    const today = getLocalDateString(new Date());
    const startDate = (menstrualStatus.activeCycle as { start_date: string }).start_date;
    
    // 開始日が今日でない場合はキャンセルできない
    if (startDate !== today) {
      alert('生理開始をキャンセルできるのは開始日当日のみです。');
      return;
    }
    
    const confirmed = confirm('生理開始をキャンセルしますか？');
    if (!confirmed) return;
    
    setLoading(true);
    try {
      const cycleId = (menstrualStatus.activeCycle as { id: number }).id;
      
      // 周期を削除
      await menstrualCycleAPI.deleteCycle(cycleId);
      
      // 今日の生理データを削除
      try {
        const response = await userDataAPI.getDailySymptoms(today);
        const existingData = response.data || {};
        
        if (existingData && Object.keys(existingData).length > 0) {
          const updatedData = {
            ...existingData,
            isPeriodStart: false,
            isPeriodEnd: false,
            hasPeriod: false,
            timestamp: new Date().toISOString()
          };
          await userDataAPI.saveDailySymptoms(today, updatedData);
        }
      } catch {
        // Silent error handling
      }
      
      // カスタムイベントを発火してカレンダーとセルフケアを更新
      window.dispatchEvent(new CustomEvent('menstrualDataUpdated'));
      
      // ステータス更新 - より確実に更新するため遅延を追加
      await menstrualStatusManager.forceReloadStatus();
      
      // 追加でイベント発火を遅延実行
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('menstrualDataUpdated'));
      }, 200);
      
      alert('生理開始がキャンセルされました');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '不明なエラー';
      alert('エラーが発生しました: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const navigationItems: NavigationItem[] = [
    {
      id: "dashboard",
      label: "ダッシュボード",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      ),
      isActive: activeView === "dashboard",
    },
    {
      id: "pregnancy-support",
      label: "妊娠サポート",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      ),
      isActive: activeView === "pregnancy-support",
      badge: "BETA",
    },
    {
      id: "partner-connection",
      label: "パートナー連動",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
          />
        </svg>
      ),
      isActive: activeView === "partner-connection",
    },
    {
      id: "self-care",
      label: "セルフケア",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      ),
      isActive: activeView === "self-care",
    },
    {
      id: "medical-records",
      label: "診断記録",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      ),
      isActive: activeView === "medical-records",
    },
    {
      id: "statistics",
      label: "統計",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      isActive: activeView === "statistics",
    },
    {
      id: "settings",
      label: "設定",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      isActive: activeView === "settings",
    },
  ];

  // Helper function to check if today is the period start date
  const isTodayPeriodStart = () => {
    if (!menstrualStatus?.hasActiveCycle || !menstrualStatus?.activeCycle) return false;
    const today = getLocalDateString(new Date());
    const startDate = (menstrualStatus.activeCycle as { start_date: string }).start_date;
    return startDate === today;
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
      id: "period-start",
      label: "生理開始",
      color: menstrualStatus?.hasActiveCycle ? "bg-gray-300 cursor-not-allowed" : "bg-red-500 hover:bg-red-600 active:bg-red-700",
      disabled: (menstrualStatus?.hasActiveCycle as boolean) || loading,
      onClick: handleStartPeriod,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
    },
    ...(menstrualStatus?.hasActiveCycle && isTodayPeriodStart() ? [{
      id: 'period-cancel',
      label: 'キャンセル',
      color: 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700',
      disabled: loading,
      onClick: handleCancelPeriodStart,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
    }] : []),
    {
      id: "period-end",
      label: "生理終了",
      color: !menstrualStatus?.hasActiveCycle || isTodayPeriodStart() ? "bg-gray-300 cursor-not-allowed" : "bg-green-500 hover:bg-green-600 active:bg-green-700",
      disabled: !(menstrualStatus?.hasActiveCycle as boolean) || loading || isTodayPeriodStart(),
      onClick: handleEndPeriod,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
  ];

  // Show all navigation items (no filtering needed)
  const filteredNavigationItems = navigationItems;

  // モバイルメニュー専用の場合はメニュー項目のみを返す
  if (mobileMenuOnly) {
    return (
      <div className="p-4 sm:p-6">
        <nav className="space-y-2">
          {filteredNavigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center px-4 py-3 text-sm sm:text-base font-medium rounded-lg transition-colors min-h-[48px] ${
                item.isActive ? "bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600"
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
              {item.badge && <span className="ml-auto bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300 text-xs px-2 py-1 rounded-full font-medium">{item.badge}</span>}
            </button>
          ))}
        </nav>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-medical dark:border-gray-700 p-4 sm:p-5">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">メニュー</h3>
        <nav className="space-y-1">
          {filteredNavigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors min-h-[40px] ${
                item.isActive ? "bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
              {item.badge && <span className="ml-auto bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300 text-xs px-2 py-1 rounded-full font-medium">{item.badge}</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* Quick Actions - hide while loading or for male users */}
      {!isGenderLoading && !isMaleUser && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-medical dark:border-gray-700 p-4">
          <h3 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">クイックアクション</h3>
          <div className="space-y-2">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={action.onClick}
                disabled={action.disabled}
                className={`w-full flex items-center justify-center px-3 py-2 text-xs sm:text-sm md:text-base font-medium text-white rounded-lg transition-colors ${action.color}`}
              >
                <span className="mr-2">{action.icon}</span>
                {loading === true ? "処理中..." : action.label}
                {action.id === "period-end" && (menstrualStatus?.hasActiveCycle as boolean) && <span className="ml-1 text-xs opacity-90">(生理中)</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Health Tips */}
      <DynamicAdvice />
    </div>
  );
};
