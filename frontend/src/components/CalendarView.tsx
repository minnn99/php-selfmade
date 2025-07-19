import React, { useState, useEffect } from "react";
import { menstrualCycleAPI } from "../services/api";
import { DateRecordModal, type RecordData } from "./DateRecordModal";

interface CalendarDay {
  date: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasPeriod: boolean;
  hasSymptoms: boolean;
  isOvulation: boolean;
  isPredictedPeriod: boolean;
  isPeriodStart: boolean;
  isPeriodEnd: boolean;
  isActive: boolean;
}

interface CalendarViewProps {
  // 将来的にAPI連携時に使用予定
}

export const CalendarView: React.FC<CalendarViewProps> = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarApiData, setCalendarApiData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDateForModal, setSelectedDateForModal] = useState<Date | null>(null);
  const [existingDataForModal, setExistingDataForModal] = useState<RecordData | undefined>(undefined);

  // 現在の月の年と月を取得
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Load calendar data when date changes
  useEffect(() => {
    loadCalendarData();
  }, [currentYear, currentMonth]);

  const loadCalendarData = async () => {
    setLoading(true);
    try {
      const data = await menstrualCycleAPI.getCalendarData(currentYear, currentMonth + 1);
      console.log('Calendar API Response:', data.data); // デバッグログ追加
      setCalendarApiData(data.data || {});
    } catch (error) {
      console.error('Failed to load calendar data:', error);
      setCalendarApiData({});
    } finally {
      setLoading(false);
    }
  };

  // 月の名前
  const monthNames = [
    "1月", "2月", "3月", "4月", "5月", "6月",
    "7月", "8月", "9月", "10月", "11月", "12月"
  ];

  // 週の名前
  const dayNames = ["日", "月", "火", "水", "木", "金", "土"];

  // 前月・次月への移動
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // カレンダーの日付データを生成（APIデータを使用）
  const generateCalendarDays = (): CalendarDay[] => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const firstDayWeekday = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();
    
    const days: CalendarDay[] = [];
    const today = new Date();

    // 前月の末尾の日付を追加
    const prevMonth = new Date(currentYear, currentMonth - 1, 0);
    for (let i = firstDayWeekday - 1; i >= 0; i--) {
      const prevDate = prevMonth.getDate() - i;
      const dateKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(prevDate).padStart(2, '0')}`;
      const dayData = calendarApiData[dateKey];

      days.push({
        date: prevDate,
        isCurrentMonth: false,
        isToday: false,
        hasPeriod: dayData?.hasPeriod || false,
        hasSymptoms: dayData?.symptoms?.length > 0 || false,
        isOvulation: false, // TODO: 排卵日計算を追加
        isPredictedPeriod: false, // TODO: 予測機能を追加
        isPeriodStart: dayData?.isPeriodStart || false,
        isPeriodEnd: dayData?.isPeriodEnd || false,
        isActive: dayData?.isActive || false,
      });
    }

    // 当月の日付を追加（APIデータを使用）
    for (let date = 1; date <= daysInMonth; date++) {
      const isToday = 
        today.getFullYear() === currentYear &&
        today.getMonth() === currentMonth &&
        today.getDate() === date;

      const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
      const dayData = calendarApiData[dateKey];

      // デバッグログ: 期間に関連するデータがある日付のみログ出力
      if (dayData && (dayData.hasPeriod || dayData.isPeriodStart || dayData.isPeriodEnd)) {
        console.log(`Date ${dateKey}:`, dayData);
      }

      days.push({
        date,
        isCurrentMonth: true,
        isToday,
        hasPeriod: dayData?.hasPeriod || false,
        hasSymptoms: dayData?.symptoms?.length > 0 || false,
        isOvulation: false, // TODO: 排卵日計算を追加
        isPredictedPeriod: false, // TODO: 予測機能を追加
        isPeriodStart: dayData?.isPeriodStart || false,
        isPeriodEnd: dayData?.isPeriodEnd || false,
        isActive: dayData?.isActive || false,
      });
    }

    // 次月の初頭の日付を追加
    const remainingDays = 42 - days.length; // 6週間分（42日）
    for (let date = 1; date <= remainingDays; date++) {
      const nextMonth = currentMonth + 1;
      const nextYear = nextMonth > 11 ? currentYear + 1 : currentYear;
      const actualNextMonth = nextMonth > 11 ? 0 : nextMonth;
      
      const dateKey = `${nextYear}-${String(actualNextMonth + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
      const dayData = calendarApiData[dateKey];
      
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        hasPeriod: dayData?.hasPeriod || false,
        hasSymptoms: dayData?.symptoms?.length > 0 || false,
        isOvulation: false,
        isPredictedPeriod: false, // TODO: 予測機能を追加
        isPeriodStart: dayData?.isPeriodStart || false,
        isPeriodEnd: dayData?.isPeriodEnd || false,
        isActive: dayData?.isActive || false,
      });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  // 日付がクリックされた時の処理
  const handleDateClick = async (day: CalendarDay) => {
    if (day.isCurrentMonth) {
      const clickedDate = new Date(currentYear, currentMonth, day.date);
      setSelectedDateForModal(clickedDate);

      // 既存の周期データを取得
      const existingData = await getExistingDataForDate(clickedDate);
      setExistingDataForModal(existingData);

      setIsModalOpen(true);
    }
  };

  // 選択された日の既存データを取得
  const getExistingDataForDate = async (date: Date): Promise<RecordData | undefined> => {
    const dateKey = getLocalDateString(date);
    const dayData = calendarApiData[dateKey];
    
    console.log('Getting existing data for date:', dateKey, 'Found data:', dayData); // デバッグログ
    
    if (!dayData) return undefined;

    // 生理期間中またはアクティブな開始日の場合、その周期の詳細情報を取得
    if ((dayData.hasPeriod || dayData.isPeriodStart || dayData.isActive) && dayData.cycleId) {
      try {
        const cycleData = await menstrualCycleAPI.getCycle(dayData.cycleId);
        
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
          existingCycleData: cycleData
        };
      } catch (error) {
        console.error('Failed to fetch cycle details:', error);
      }
    }

    return {
      isPeriodStart: false,
      isPeriodEnd: false,
      symptoms: dayData.symptoms || [],
      mood: dayData.mood || "",
      healthNotes: dayData.notes || "",
      flowIntensity: dayData.flowIntensity
    };
  };

  // ローカルタイムゾーンで日付文字列を取得
  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
      alert('記録が保存されました！');

    } catch (error: any) {
      console.error('Failed to save record:', error);
      let errorMessage = '記録の保存に失敗しました。';
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
      alert('生理周期が削除されました');
    } catch (error: any) {
      console.error('Failed to delete cycle:', error);
      alert('削除に失敗しました');
    }
  };

  

  // モーダルを閉じる処理
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedDateForModal(null);
    setExistingDataForModal(undefined);
  };

  // 日付セルのスタイルを決定
  const getDayStyle = (day: CalendarDay) => {
    let baseStyle = "h-12 w-full flex items-center justify-center text-sm font-medium cursor-pointer transition-colors relative ";
    
    if (!day.isCurrentMonth) {
      baseStyle += "text-gray-300 ";
    } else if (day.isToday && (day.hasPeriod || day.isPeriodStart)) {
      // 今日かつ生理関連の場合
      baseStyle += "bg-red-600 text-white rounded-lg ";
    } else if (day.isToday) {
      // 今日のみの場合
      baseStyle += "bg-primary-600 text-white rounded-lg ";
    } else if (day.hasPeriod || day.isPeriodStart || day.isPeriodEnd) {
      // 生理期間中・開始日・終了日の場合（既存の赤いスタイル）
      baseStyle += "bg-red-500 text-white rounded-lg ";
    } else if (day.isPredictedPeriod) {
      // 予測生理日の場合
      baseStyle += "bg-red-100 text-red-700 border border-red-300 rounded-lg ";
    } else if (day.isOvulation) {
      // 排卵日の場合
      baseStyle += "bg-pink-500 text-white rounded-lg ";
    } else {
      // 通常の日付
      baseStyle += "text-gray-700 hover:bg-gray-100 rounded-lg ";
    }

    return baseStyle;
  };

  // 日付セルの装飾を決定
  const getDayDecorations = (day: CalendarDay) => {
    const decorations = [];

    // 生理日は背景色で表示するため、ドットは不要
    // 予測生理日の場合のみドット表示
    if (day.isPredictedPeriod && !day.hasPeriod) {
      decorations.push(
        <div key="predicted" className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 border-2 border-red-400 rounded-full bg-white"></div>
      );
    }

    // 排卵日も背景色で表示するため、生理日と重複しない場合のみ
    if (day.isOvulation && !day.hasPeriod) {
      decorations.push(
        <div key="ovulation" className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-pink-500 rounded-full"></div>
      );
    }

    // 症状がある場合は小さなドットを表示
    if (day.hasSymptoms) {
      decorations.push(
        <div key="symptoms" className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
      );
    }

    return decorations;
  };

  

  return (
    <div className="bg-white rounded-xl shadow-sm border border-medical p-6 relative">
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
          <p className="text-white text-lg">Loading...</p>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">カレンダー</h2>
          <p className="text-sm text-neutral-600">生理周期と症状を確認</p>
        </div>
        <div className="flex items-center space-x-3">
          
          <div className="flex items-center space-x-1">
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="px-4 py-2 text-lg font-semibold text-gray-900 min-w-[120px] text-center">
              {currentYear}年{monthNames[currentMonth]}
            </div>
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {/* Day Headers */}
        {dayNames.map((dayName, index) => (
          <div key={dayName} className={`h-10 flex items-center justify-center text-sm font-medium ${
            index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-600'
          }`}>
            {dayName}
          </div>
        ))}

        {/* Calendar Days */}
        {calendarDays.map((day, index) => (
          <div
            key={index}
            className={getDayStyle(day)}
            onClick={() => handleDateClick(day)}
          >
            {day.date}
            {getDayDecorations(day)}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">凡例</h3>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-gray-600">生理日</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 border-2 border-red-400 rounded-full"></div>
            <span className="text-gray-600">予測生理日</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
            <span className="text-gray-600">排卵日</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
            <span className="text-gray-600">症状記録</span>
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