import React, { useState, useEffect } from "react";
import { menstrualCycleAPI, partnerAPI, authAPI } from "../../services/api";
import { FadeInUp } from "../animations";

interface PredictionData {
  nextPeriodDate: string | null; // 次の生理周期開始予定日
  nextOvulationDate: string | null;
  currentCycleDay: number | null;
  averageCycleLength: number | null;
}

export const OverviewCards: React.FC = () => {
  const [predictionData, setPredictionData] = useState<PredictionData>({
    nextPeriodDate: null,
    nextOvulationDate: null,
    currentCycleDay: null,
    averageCycleLength: null,
  });
  const [loading, setLoading] = useState(true);
  const [userGender, setUserGender] = useState<string>("");
  const [isConnectedToPartner, setIsConnectedToPartner] = useState(false);

  useEffect(() => {
    const fetchPredictionData = async () => {
      try {
        // まずユーザー情報とパートナー状況を取得
        const userData = await authAPI.getUser();
        const gender = (userData.data as { user?: { gender?: string } })?.user?.gender || "";
        setUserGender(gender);

        const partnerStatus = await partnerAPI.getStatus();
        const isConnected = partnerStatus.success && (partnerStatus.data as { is_connected?: boolean })?.is_connected;
        setIsConnectedToPartner(!!isConnected);

        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;

        let combinedData: Record<string, unknown> = {};

        // 男性ユーザーでパートナーと連携している場合はパートナーのデータを取得
        if ((gender === "male" || gender === "男性") && isConnected) {
          const response = await partnerAPI.getPartnerCalendar(year, month);
          const nextMonth = month === 12 ? 1 : month + 1;
          const nextMonthYear = month === 12 ? year + 1 : year;
          const nextMonthResponse = await partnerAPI.getPartnerCalendar(nextMonthYear, nextMonth);

          if (response.success && nextMonthResponse.success) {
            // パートナーAPIからのデータを変換
            const currentMonthData: { [key: string]: unknown } = {};
            (response.data as { calendar_data: Array<{ date: string; [key: string]: unknown }> }).calendar_data.forEach((dayData) => {
              currentMonthData[dayData.date] = dayData;
            });

            const nextMonthData: { [key: string]: unknown } = {};
            (nextMonthResponse.data as { calendar_data: Array<{ date: string; [key: string]: unknown }> }).calendar_data.forEach((dayData) => {
              nextMonthData[dayData.date] = dayData;
            });

            combinedData = { ...currentMonthData, ...nextMonthData };
          }
        } else {
          // 女性ユーザーまたは連携していない場合は通常の生理周期データを取得
          const response = await menstrualCycleAPI.getCalendarData(year, month);
          const nextMonth = month === 12 ? 1 : month + 1;
          const nextMonthYear = month === 12 ? year + 1 : year;
          const nextMonthResponse = await menstrualCycleAPI.getCalendarData(nextMonthYear, nextMonth);

          combinedData = { ...(response.data as Record<string, unknown>), ...(nextMonthResponse.data as Record<string, unknown>) };
        }

        // Find next cycle start date and ovulation dates from calendar data
        let nextCycleStartDate = null;
        let nextOvulationDate = null;

        // Sort dates to find the next occurrences
        const sortedDates = Object.keys(combinedData).sort();

        const todayString = today.toISOString().split("T")[0];

        // Simple approach: skip the immediate next period if it's within 7 days
        // This handles the case where we're currently in period and want the NEXT cycle

        for (const dateKey of sortedDates) {
          const dayData = combinedData[dateKey];

          if (dateKey > todayString) {
            // 明日以降のみ
            // 次の生理周期開始日を探す
            if ((dayData as { isPredictedPeriod?: boolean }).isPredictedPeriod) {
              // 前日をチェックして、連続する予測生理日の最初の日かどうか確認
              const previousDate = new Date(dateKey);
              previousDate.setDate(previousDate.getDate() - 1);
              const previousDateKey = previousDate.toISOString().split("T")[0];
              const previousDayData = combinedData[previousDateKey];

              // 前日が予測生理日でない場合、この日が新しい周期の開始日
              if (!previousDayData || !(previousDayData as { isPredictedPeriod?: boolean }).isPredictedPeriod) {
                if (!nextCycleStartDate) {
                  const dateObj = new Date(dateKey);
                  const daysDiff = Math.floor((dateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                  // Skip if this period start is too close (within 7 days from today)
                  // This ensures we get the next full cycle, not the immediate next period
                  if (daysDiff > 7) {
                    nextCycleStartDate = dateKey;
                  }
                }
              }
            }

            if ((dayData as { isOvulation?: boolean }).isOvulation && !nextOvulationDate) {
              nextOvulationDate = dateKey;
            }

            // Break if we found both
            if (nextCycleStartDate && nextOvulationDate) {
              break;
            }
          }
        }

        // Get current cycle information from menstrual status
        let currentCycleDay = null;
        let averageCycleLength = null;

        try {
          // 男性ユーザーでパートナーと連携している場合は現在周期の計算をスキップ
          if ((gender === "male" || gender === "男性") && isConnected) {
            // パートナーの周期情報は表示しない（男性ユーザーには関係ないため）
            currentCycleDay = null;
            averageCycleLength = 28; // デフォルト値を使用
          } else {
            const statusResponse = await menstrualCycleAPI.getCurrentStatus();

            if (statusResponse.hasActiveCycle && statusResponse.activeCycle) {
              const cycleStart = new Date((statusResponse.activeCycle as { start_date: string }).start_date);
              const diffTime = today.getTime() - cycleStart.getTime();
              currentCycleDay = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
            }

            // Calculate average cycle length from recent cycles
            averageCycleLength = 28; // Default value
          }
        } catch {
          // Failed to get current status
        }

        setPredictionData({
          nextPeriodDate: nextCycleStartDate,
          nextOvulationDate,
          currentCycleDay,
          averageCycleLength,
        });
      } catch {
        // Error fetching prediction data
      } finally {
        setLoading(false);
      }
    };

    fetchPredictionData();

    // Listen for menstrual data updates
    const handleDataUpdate = () => {
      fetchPredictionData();
    };

    window.addEventListener("menstrualDataUpdated", handleDataUpdate);

    return () => {
      window.removeEventListener("menstrualDataUpdated", handleDataUpdate);
    };
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP", { month: "long", day: "numeric" });
  };

  const getDaysUntil = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getProgressPercentage = (dateString: string | null, averageCycleLength: number | null) => {
    if (!dateString) return 0;

    const daysUntil = getDaysUntil(dateString);
    if (daysUntil === null || daysUntil < 0) return 100; // 過去の日付の場合は100%

    // 一般的な28日周期を基準にした進行度を計算
    const defaultCycleLength = 28;
    const usedCycleLength = averageCycleLength || defaultCycleLength;

    // 次の生理日までの進行度を計算
    // daysUntilが大きい場合（周期の初期）は進行度が小さく
    // daysUntilが小さい場合（周期の終期）は進行度が大きく
    let progressPercentage;
    if (daysUntil > usedCycleLength) {
      // 予定日が遠い場合は、次の周期として計算
      progressPercentage = 0;
    } else {
      progressPercentage = ((usedCycleLength - daysUntil) / usedCycleLength) * 100;
    }

    return Math.max(0, Math.min(100, progressPercentage));
  };
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {/* Next Period Card */}
      <FadeInUp delay={0}>
        <div className="bg-white rounded-xl shadow-sm border border-medical p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-sm font-medium text-gray-600">
              {(userGender === "male" || userGender === "男性") && isConnectedToPartner ? "パートナーの次の生理予定日" : "次の生理周期予定日"}
            </h3>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-pink-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {loading ? (
              <p className="text-xl sm:text-2xl font-semibold text-gray-900">...</p>
            ) : predictionData.nextPeriodDate ? (
              <>
                <p className="text-xl sm:text-2xl font-semibold text-gray-900">{formatDate(predictionData.nextPeriodDate)}</p>
                <p className="text-xs sm:text-sm text-gray-500">あと{getDaysUntil(predictionData.nextPeriodDate)}日</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-pink-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getProgressPercentage(predictionData.nextPeriodDate, predictionData.averageCycleLength)}%` }}
                  ></div>
                </div>
              </>
            ) : (
              <>
                <p className="text-xl sm:text-2xl font-semibold text-gray-900">-</p>
                <p className="text-xs sm:text-sm text-gray-500">データなし</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-pink-500 h-2 rounded-full" style={{ width: "0%" }}></div>
                </div>
              </>
            )}
          </div>
        </div>
      </FadeInUp>

      {/* Ovulation Card */}
      <FadeInUp delay={100}>
        <div className="bg-white rounded-xl shadow-sm border border-medical p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-sm font-medium text-gray-600">
              {(userGender === "male" || userGender === "男性") && isConnectedToPartner ? "パートナーの排卵予定日" : "排卵予定日"}
            </h3>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {loading ? (
              <p className="text-xl sm:text-2xl font-semibold text-gray-900">...</p>
            ) : predictionData.nextOvulationDate ? (
              <>
                <p className="text-xl sm:text-2xl font-semibold text-gray-900">{formatDate(predictionData.nextOvulationDate)}</p>
                <p className="text-xs sm:text-sm text-gray-500">あと{getDaysUntil(predictionData.nextOvulationDate)}日</p>
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <span className="text-xs text-gray-500">排卵予測</span>
                </div>
              </>
            ) : (
              <>
                <p className="text-xl sm:text-2xl font-semibold text-gray-900">-</p>
                <p className="text-xs sm:text-sm text-gray-500">データなし</p>
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
                  <span className="text-xs text-gray-500">データ登録後表示</span>
                </div>
              </>
            )}
          </div>
        </div>
      </FadeInUp>

      {/* Partner Connection Status Card */}
      <FadeInUp delay={200}>
        <div className="bg-white rounded-xl shadow-sm border border-medical p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-sm font-medium text-gray-600">パートナー連携状況</h3>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
            </div>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {loading ? (
              <p className="text-xl sm:text-2xl font-semibold text-gray-900">...</p>
            ) : isConnectedToPartner ? (
              <>
                <p className="text-xl sm:text-2xl font-semibold text-gray-900">連携中</p>
                <p className="text-xs sm:text-sm text-gray-500">
                  {userGender === "male" || userGender === "男性" 
                    ? "パートナーのデータを表示中" 
                    : "パートナーとデータを共有中"}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" style={{ animationDelay: "0.3s" }}></div>
                    <div className="w-2 h-2 bg-primary-300 rounded-full animate-pulse" style={{ animationDelay: "0.6s" }}></div>
                  </div>
                  <span className="text-xs text-primary-600 font-medium">リアルタイム同期</span>
                </div>
              </>
            ) : (
              <>
                <p className="text-xl sm:text-2xl font-semibold text-gray-500">未連携</p>
                <p className="text-xs sm:text-sm text-gray-500">パートナーと連携していません</p>
                <div className="flex items-center space-x-2 mt-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="text-xs text-gray-500">連携設定で追加可能</span>
                </div>
              </>
            )}
          </div>
        </div>
      </FadeInUp>
    </div>
  );
};
