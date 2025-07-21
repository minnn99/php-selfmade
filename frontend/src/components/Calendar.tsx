import React, { useState, useEffect } from "react";
import { DateRecordModal, type RecordData } from "./DateRecordModal";
import { menstrualCycleAPI } from "../services/api";

interface DayData {
  date: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasPeriod: boolean;
  hasSymptoms: boolean;
  isOvulation: boolean;
  isFertile: boolean;
  isPredictedPeriod: boolean;
  isPeriodStart: boolean;
  isPeriodEnd: boolean;
  isActive: boolean;
}

export const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDateForModal, setSelectedDateForModal] = useState<Date | null>(null);
  const [calendarApiData, setCalendarApiData] = useState<any>({});
  const [loading, setLoading] = useState(false); // 日付クリック時のローディング専用
  const [existingDataForModal, setExistingDataForModal] = useState<RecordData | undefined>(undefined);

  const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

  // 現在の月の年と月を取得
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Load calendar data when date changes
  useEffect(() => {
    loadCalendarData();
  }, [currentYear, currentMonth]);

  const loadCalendarData = async () => {
    // 月切り替え時はローディング状態を設定しない（スムーズな切り替えのため）
    try {
      const data = await menstrualCycleAPI.getCalendarData(currentYear, currentMonth + 1);
      setCalendarApiData(data.data || {});
    } catch (error) {
      console.error("Failed to load calendar data:", error);
      setCalendarApiData({});
    }
  };

  const generateDays = () => {
    const year = currentYear;
    const month = currentMonth;
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayWeekday = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();
    const days: DayData[] = [];
    const today = new Date();

    // 前月の情報
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevMonthYear = month === 0 ? year - 1 : year;
    const prevMonthLastDay = new Date(prevMonthYear, prevMonth + 1, 0);
    const prevMonthLastDate = prevMonthLastDay.getDate();

    // 前月分
    for (let i = 0; i < firstDayWeekday; i++) {
      const date = prevMonthLastDate - firstDayWeekday + 1 + i;
      const dateKey = `${prevMonthYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
      const dayData = calendarApiData[dateKey];
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        hasPeriod: dayData?.hasPeriod || false,
        hasSymptoms: dayData?.symptoms?.length > 0 || false,
        isOvulation: false,
        isFertile: false,
        isPredictedPeriod: false,
        isPeriodStart: dayData?.isPeriodStart || false,
        isPeriodEnd: dayData?.isPeriodEnd || false,
        isActive: dayData?.isActive || false,
      });
    }

    // 今月分
    for (let date = 1; date <= daysInMonth; date++) {
      const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === date;
      const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
      const dayData = calendarApiData[dateKey];
      days.push({
        date,
        isCurrentMonth: true,
        isToday,
        hasPeriod: dayData?.hasPeriod || false,
        hasSymptoms: dayData?.symptoms?.length > 0 || false,
        isOvulation: false,
        isFertile: false,
        isPredictedPeriod: false,
        isPeriodStart: dayData?.isPeriodStart || false,
        isPeriodEnd: dayData?.isPeriodEnd || false,
        isActive: dayData?.isActive || false,
      });
    }

    // 次月分
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextMonthYear = month === 11 ? year + 1 : year;
    let nextMonthDate = 1;
    while (days.length < 42) {
      const dateKey = `${nextMonthYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(nextMonthDate).padStart(2, "0")}`;
      const dayData = calendarApiData[dateKey];
      days.push({
        date: nextMonthDate,
        isCurrentMonth: false,
        isToday: false,
        hasPeriod: dayData?.hasPeriod || false,
        hasSymptoms: dayData?.symptoms?.length > 0 || false,
        isOvulation: false,
        isFertile: false,
        isPredictedPeriod: false,
        isPeriodStart: dayData?.isPeriodStart || false,
        isPeriodEnd: dayData?.isPeriodEnd || false,
        isActive: dayData?.isActive || false,
      });
      nextMonthDate++;
    }
    return days;
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  // ローカルタイムゾーンで日付文字列を取得
  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // 既存データ取得機能
  const getExistingDataForDate = async (date: Date): Promise<RecordData | undefined> => {
    const dateKey = getLocalDateString(date);
    const dayData = calendarApiData[dateKey];

    // データがない場合は即座に基本データを返す
    if (!dayData) {
      return {
        isPeriodStart: false,
        isPeriodEnd: false,
        symptoms: [],
        mood: "",
        healthNotes: "",
        flowIntensity: undefined,
      };
    }

    // 生理期間中またはアクティブな開始日で cycleId がある場合のみ API を呼び出す
    if ((dayData.hasPeriod || dayData.isPeriodStart || dayData.isActive) && dayData.cycleId) {
      try {
        const cycleResponse = await menstrualCycleAPI.getCycle(dayData.cycleId);
        const cycleData = cycleResponse.data;

        // 選択した日付が開始日・終了日かを判定
        const selectedDateStr = getLocalDateString(date);
        const isStartDate = cycleData.start_date === selectedDateStr;
        const isEndDate = cycleData.end_date === selectedDateStr;

        return {
          isPeriodStart: isStartDate,
          isPeriodEnd: isEndDate,
          symptoms: cycleData.symptoms || [],
          mood: "",
          healthNotes: cycleData.notes || "",
          flowIntensity: cycleData.flow_intensity,
          cycleId: cycleData.id,
          existingCycleData: cycleData,
        };
      } catch (error) {
        console.error("Failed to fetch cycle details:", error);
        // エラーの場合は基本データを返す
      }
    }

    // API呼び出しが不要な場合やエラーの場合
    return {
      isPeriodStart: dayData.isPeriodStart || false,
      isPeriodEnd: dayData.isPeriodEnd || false,
      symptoms: dayData.symptoms || [],
      mood: dayData.mood || "",
      healthNotes: dayData.notes || "",
      flowIntensity: dayData.flowIntensity,
      cycleId: dayData.cycleId,
    };
  };

  // 日付がクリックされた時の処理
  const handleDateClick = async (day: DayData) => {
    if (day.isCurrentMonth && !loading) {
      const clickedDate = new Date(currentYear, currentMonth, day.date);
      setSelectedDateForModal(clickedDate);

      try {
        setLoading(true);
        // 既存の周期データを取得
        const existingData = await getExistingDataForDate(clickedDate);
        setExistingDataForModal(existingData);
        setIsModalOpen(true);
      } finally {
        setLoading(false);
      }
    }
  };

  // モーダルのデータ保存処理
  const handleModalSave = async (data: RecordData) => {
    if (!selectedDateForModal) return;

    try {
      const dateStr = getLocalDateString(selectedDateForModal);

      if (data.cycleId) {
        // 既存の周期IDがある場合：周期の更新
        const updateData: any = {
          flow_intensity: data.flowIntensity,
          symptoms: data.symptoms,
          notes: data.healthNotes,
        };

        if (data.isPeriodStart) {
          // 開始日を更新
          updateData.start_date = dateStr;
        } else if (data.isPeriodEnd) {
          // 終了日を更新
          updateData.end_date = dateStr;
        }

        await menstrualCycleAPI.updateCycle(data.cycleId, updateData);
      } else {
        // 既存の周期IDがない場合：新規作成
        if (data.isPeriodStart) {
          await menstrualCycleAPI.startCycle({
            start_date: dateStr,
            flow_intensity: data.flowIntensity,
            symptoms: data.symptoms,
            notes: data.healthNotes,
          });
        } else if (data.isPeriodEnd) {
          await menstrualCycleAPI.endCycle(dateStr);
        }
      }

      await loadCalendarData();
      alert("記録が保存されました！");
    } catch (error: any) {
      console.error("Failed to save record:", error);
      let errorMessage = "記録の保存に失敗しました。";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      alert(errorMessage);
    }
  };

  // 削除処理
  const handleDelete = async (cycleId: number) => {
    try {
      await menstrualCycleAPI.deleteCycle(cycleId);
      await loadCalendarData();
      alert("生理周期が削除されました");
    } catch (error: any) {
      console.error("Failed to delete cycle:", error);
      alert("削除に失敗しました");
    }
  };


  // モーダルを閉じる処理
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedDateForModal(null);
    setExistingDataForModal(undefined);
  };

  const days = generateDays();

  const getDayClassName = (day: DayData): string => {
    let className = "w-10 h-10 flex items-center justify-center text-sm font-medium transition-colors relative cursor-pointer ";

    if (!day.isCurrentMonth) {
      className += "text-gray-300 ";
    } else if (day.isToday && (day.hasPeriod || day.isPeriodStart)) {
      // 今日かつ生理関連の場合
      className += "bg-red-600 text-white rounded-lg ";
    } else if (day.isToday) {
      // 今日のみの場合
      className += "bg-primary-600 text-white rounded-lg ";
    } else if (day.hasPeriod || day.isPeriodStart || day.isPeriodEnd) {
      // 生理期間中・開始日・終了日の場合（既存の赤いスタイル）
      className += "bg-red-500 text-white rounded-lg ";
    } else if (day.isPredictedPeriod) {
      // 予測生理日の場合
      className += "bg-red-100 text-red-700 border border-red-300 rounded-lg ";
    } else if (day.isOvulation) {
      // 排卵日の場合
      className += "bg-pink-500 text-white rounded-lg ";
    } else if (day.isFertile) {
      // 妊娠しやすい日の場合
      className += "bg-purple-100 text-purple-700 rounded-lg ";
    } else {
      // 通常の日付
      className += "text-gray-700 hover:bg-gray-100 rounded-lg ";
    }

    return className;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-medical p-6">{/* ローディングオーバーレイを削除してスムーズな切り替えを実現 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <button onClick={() => navigateMonth("prev")} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-sm text-primary-600 hover:text-primary-700 transition-colors">
              今日
            </button>
            <button onClick={() => navigateMonth("next")} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {weekdays.map((day, index) => (
          <div key={day} className={`w-10 h-8 flex items-center justify-center text-sm font-medium ${
            index === 0 ? "text-red-600" : index === 6 ? "text-blue-600" : "text-gray-500"
          }`}>
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => (
          <button key={index} className={getDayClassName(day)} onClick={() => handleDateClick(day)}>
            {day.date}
            {/* 症状がある場合は小さなドットを表示 */}
            {day.hasSymptoms && <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-500 rounded-full"></div>}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-gray-600">生理日</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-500 rounded"></div>
            <span className="text-gray-600">排卵日</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-100 border border-purple-300 rounded"></div>
            <span className="text-gray-600">妊娠しやすい日</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
            <span className="text-gray-600">予測日</span>
          </div>
        </div>
      </div>

      {/* DateRecordModal */}
      {selectedDateForModal && (
        <DateRecordModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          selectedDate={selectedDateForModal}
          onSave={handleModalSave}
          onDelete={handleDelete}
          existingData={existingDataForModal}
        />
      )}
    </div>
  );
};
