import React, { useState, useEffect } from "react";
import { menstrualCycleAPI } from "../services/api";

interface CalendarDay {
  date: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasPeriod: boolean;
  hasSymptoms: boolean;
  isOvulation: boolean;
  isPredictedPeriod: boolean;
}

interface CalendarViewProps {
  // 将来的にAPI連携時に使用予定
}

export const CalendarView: React.FC<CalendarViewProps> = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarApiData, setCalendarApiData] = useState<any>({});
  const [loading, setLoading] = useState(false);

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

      days.push({
        date,
        isCurrentMonth: true,
        isToday,
        hasPeriod: dayData?.hasPeriod || false,
        hasSymptoms: dayData?.symptoms?.length > 0 || false,
        isOvulation: false, // TODO: 排卵日計算を追加
        isPredictedPeriod: false, // TODO: 予測機能を追加
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
      });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  // 日付がクリックされた時の処理
  const handleDateClick = (day: CalendarDay) => {
    if (day.isCurrentMonth) {
      setSelectedDate(new Date(currentYear, currentMonth, day.date));
    }
  };

  // 日付セルのスタイルを決定
  const getDayStyle = (day: CalendarDay) => {
    let baseStyle = "h-12 w-full flex items-center justify-center text-sm font-medium cursor-pointer transition-colors relative ";
    
    if (!day.isCurrentMonth) {
      baseStyle += "text-gray-300 ";
    } else if (day.isToday) {
      baseStyle += "bg-primary-600 text-white rounded-lg ";
    } else {
      baseStyle += "text-gray-700 hover:bg-gray-100 rounded-lg ";
    }

    return baseStyle;
  };

  // 日付セルの装飾を決定
  const getDayDecorations = (day: CalendarDay) => {
    const decorations = [];

    if (day.hasPeriod) {
      decorations.push(
        <div key="period" className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full"></div>
      );
    }

    if (day.isPredictedPeriod) {
      decorations.push(
        <div key="predicted" className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 border-2 border-red-400 rounded-full"></div>
      );
    }

    if (day.isOvulation) {
      decorations.push(
        <div key="ovulation" className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-pink-500 rounded-full"></div>
      );
    }

    if (day.hasSymptoms) {
      decorations.push(
        <div key="symptoms" className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
      );
    }

    return decorations;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-medical p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">カレンダー</h2>
          <p className="text-sm text-neutral-600">生理周期と症状を確認</p>
        </div>
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

      {/* Selected Date Info */}
      {selectedDate && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            {selectedDate.getFullYear()}年{selectedDate.getMonth() + 1}月{selectedDate.getDate()}日
          </h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center justify-between">
              <span>症状記録</span>
              <button className="text-primary-600 hover:text-primary-700 font-medium">
                追加
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span>メモ</span>
              <button className="text-primary-600 hover:text-primary-700 font-medium">
                追加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};