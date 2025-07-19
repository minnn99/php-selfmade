import React, { useState, useEffect } from 'react';
import { DateRecordModal, type RecordData } from './DateRecordModal';
import { menstrualCycleAPI } from '../services/api';

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
  const [loading, setLoading] = useState(false);
  const [existingDataForModal, setExistingDataForModal] = useState<RecordData | undefined>(undefined);
  
  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ];
  
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];

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
  
  const getDaysInMonth = (date: Date): DayData[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startWeekday = firstDay.getDay();
    
    const days: DayData[] = [];
    
    // Previous month's trailing days
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = startWeekday - 1; i >= 0; i--) {
      const prevDate = prevMonth.getDate() - i;
      const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(prevDate).padStart(2, '0')}`;
      const dayData = calendarApiData[dateKey];

      days.push({
        date: prevDate,
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
    
    // Current month's days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = 
        today.getFullYear() === year &&
        today.getMonth() === month &&
        today.getDate() === day;

      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayData = calendarApiData[dateKey];
      
      days.push({
        date: day,
        isCurrentMonth: true,
        isToday,
        hasPeriod: dayData?.hasPeriod || false,
        hasSymptoms: dayData?.symptoms?.length > 0 || false,
        isOvulation: false, // TODO: 排卵日計算を追加
        isFertile: false, // TODO: 妊娠しやすい日計算を追加
        isPredictedPeriod: false, // TODO: 予測機能を追加
        isPeriodStart: dayData?.isPeriodStart || false,
        isPeriodEnd: dayData?.isPeriodEnd || false,
        isActive: dayData?.isActive || false,
      });
    }
    
    // Next month's leading days
    const remainingSlots = 42 - days.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingSlots; day++) {
      const nextMonth = month + 1;
      const nextYear = nextMonth > 11 ? year + 1 : year;
      const actualNextMonth = nextMonth > 11 ? 0 : nextMonth;
      
      const dateKey = `${nextYear}-${String(actualNextMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayData = calendarApiData[dateKey];

      days.push({
        date: day,
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
    
    return days;
  };
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
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
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 既存データ取得機能
  const getExistingDataForDate = async (date: Date): Promise<RecordData | undefined> => {
    const dateKey = getLocalDateString(date);
    const dayData = calendarApiData[dateKey];
    
    if (!dayData) return undefined;

    // 生理期間中またはアクティブな開始日の場合、その周期の詳細情報を取得
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

  // 日付がクリックされた時の処理
  const handleDateClick = async (day: DayData) => {
    if (day.isCurrentMonth) {
      const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day.date);
      setSelectedDateForModal(clickedDate);
      
      // 既存データを非同期で取得
      let existingData = await getExistingDataForDate(clickedDate);

      // 既存データがない場合、アクティブな周期がないか確認する
      if (!existingData) {
        const statusResponse = await menstrualCycleAPI.getCurrentStatus();
        if (statusResponse.data?.hasActiveCycle && statusResponse.data?.activeCycle) {
          const activeCycle = statusResponse.data.activeCycle;
          const startDate = new Date(activeCycle.start_date);
          // クリックされた日付がアクティブな周期の開始日以降である場合
          if (clickedDate >= startDate) {
            existingData = {
              isPeriodStart: false,
              isPeriodEnd: true, // 終了日として設定する
              symptoms: [],
              mood: "",
              healthNotes: "",
              cycleId: activeCycle.id,
              existingCycleData: activeCycle
            };
          }
        }
      }
      
      setExistingDataForModal(existingData);
      
      setIsModalOpen(true);
    }
  };

  // モーダルのデータ保存処理
  const handleModalSave = async (data: RecordData) => {
    if (!selectedDateForModal) return;

    try {
      const dateStr = getLocalDateString(selectedDateForModal);

      if (data.isPeriodStart) {
        // 新しい周期を開始
        await menstrualCycleAPI.startCycle({
          start_date: dateStr,
          flow_intensity: data.flowIntensity,
          symptoms: data.symptoms,
          notes: data.healthNotes,
        });
      } else if (data.isPeriodEnd) {
        // 既存の周期を終了
        await menstrualCycleAPI.endCycle(dateStr);
      } else if (data.cycleId) {
        // 既存の周期情報を更新（症状やメモなど）
        await menstrualCycleAPI.updateCycle(data.cycleId, {
          flow_intensity: data.flowIntensity,
          symptoms: data.symptoms,
          notes: data.healthNotes,
        });
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

  // 全データ削除処理
  const handleDeleteAll = async () => {
    const confirmMessage = '全ての生理周期データを削除しますか？\nこの操作は取り消すことができません。';
    
    if (confirm(confirmMessage)) {
      const secondConfirm = '本当に全てのデータを削除しますか？\n※この操作は永続的で復元できません※';
      
      if (confirm(secondConfirm)) {
        try {
          const response = await menstrualCycleAPI.deleteAllCycles();
          await loadCalendarData();
          alert(`全ての生理周期データが削除されました\n削除件数: ${response.data?.deleted_count || 0}件`);
        } catch (error: any) {
          console.error('Failed to delete all cycles:', error);
          
          let errorMessage = '全削除に失敗しました。';
          if (error.response) {
            const errorData = error.response.data;
            if (errorData.message) {
              errorMessage += `\nエラー: ${errorData.message}`;
            }
            errorMessage += `\nステータス: ${error.response.status}`;
          } else if (error.message) {
            errorMessage += `\nエラー: ${error.message}`;
          }
          
          alert(errorMessage);
        }
      }
    }
  };

  // モーダルを閉じる処理
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedDateForModal(null);
    setExistingDataForModal(undefined);
  };
  
  const days = getDaysInMonth(currentDate);
  
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-medical p-6 flex items-center justify-center h-64">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  const getDayClassName = (day: DayData): string => {
    let className = 'w-10 h-10 flex items-center justify-center text-sm font-medium transition-colors relative cursor-pointer ';
    
    if (!day.isCurrentMonth) {
      className += 'text-gray-300 ';
    } else if (day.isToday && (day.hasPeriod || day.isPeriodStart)) {
      // 今日かつ生理関連の場合
      className += 'bg-red-600 text-white rounded-lg ';
    } else if (day.isToday) {
      // 今日のみの場合
      className += 'bg-primary-600 text-white rounded-lg ';
    } else if (day.hasPeriod || day.isPeriodStart || day.isPeriodEnd) {
      // 生理期間中・開始日・終了日の場合（既存の赤いスタイル）
      className += 'bg-red-500 text-white rounded-lg ';
    } else if (day.isPredictedPeriod) {
      // 予測生理日の場合
      className += 'bg-red-100 text-red-700 border border-red-300 rounded-lg ';
    } else if (day.isOvulation) {
      // 排卵日の場合
      className += 'bg-pink-500 text-white rounded-lg ';
    } else if (day.isFertile) {
      // 妊娠しやすい日の場合
      className += 'bg-purple-100 text-purple-700 rounded-lg ';
    } else {
      // 通常の日付
      className += 'text-gray-700 hover:bg-gray-100 rounded-lg ';
    }
    
    return className;
  };
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-medical p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleDeleteAll}
            className="px-2 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-300 rounded hover:bg-red-100 transition-colors"
          >
            全削除
          </button>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 text-sm text-primary-600 hover:text-primary-700 transition-colors"
            >
              今日
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {weekdays.map(day => (
          <div key={day} className="w-10 h-8 flex items-center justify-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => (
          <button
            key={index}
            className={getDayClassName(day)}
            onClick={() => handleDateClick(day)}
          >
            {day.date}
            {/* 症状がある場合は小さなドットを表示 */}
            {day.hasSymptoms && (
              <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
            )}
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