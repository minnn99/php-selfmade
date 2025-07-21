import React, { useState } from "react";
import { DailyRecordModal } from "./DailyRecordModal";

interface DailyRecordData {
  mood: string;
  physicalCondition: string;
  waterIntake: number;
  sleepHours: number;
  notes: string;
}

export const TodaySection: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dailyData, setDailyData] = useState<DailyRecordData | null>(null);
  const today = new Date();
  const dateString = today.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  const handleSaveRecord = (data: DailyRecordData) => {
    setDailyData(data);
    // ここで実際の保存処理を実装（localStorageやAPI）
    localStorage.setItem(`daily-record-${today.toISOString().split('T')[0]}`, JSON.stringify(data));
    console.log('Daily record saved:', data);
  };

  const getMoodEmoji = (mood: string) => {
    const moodMap: { [key: string]: string } = {
      'excellent': '😊',
      'good': '🙂',
      'normal': '😐',
      'poor': '😔',
      'terrible': '😩'
    };
    return moodMap[mood] || '😐';
  };

  const getPhysicalEmoji = (condition: string) => {
    const conditionMap: { [key: string]: string } = {
      'excellent': '💪',
      'good': '👍',
      'normal': '👌',
      'poor': '😰',
      'terrible': '🤒'
    };
    return conditionMap[condition] || '👌';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-medical p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">今日の記録</h2>
          <p className="text-xs sm:text-sm text-gray-600">{dateString}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center px-4 py-3 border border-primary-300 rounded-lg text-sm sm:text-base font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 active:bg-primary-200 transition-colors min-h-[44px]"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            今日の記録を追加
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-4 sm:mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">気分</p>
          <div className="flex justify-center space-x-1">
            <span className="text-lg sm:text-xl">{dailyData ? getMoodEmoji(dailyData.mood) : '😊'}</span>
          </div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">体調</p>
          <div className="flex justify-center space-x-1">
            <span className="text-lg sm:text-xl">{dailyData ? getPhysicalEmoji(dailyData.physicalCondition) : '💪'}</span>
          </div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">水分摂取</p>
          <p className="text-sm sm:text-base font-medium text-gray-900">
            {dailyData ? `${dailyData.waterIntake}L` : '1.2L'}
          </p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">睡眠時間</p>
          <p className="text-sm sm:text-base font-medium text-gray-900">
            {dailyData ? `${dailyData.sleepHours}h` : '7.5h'}
          </p>
        </div>
      </div>

      {/* Daily Record Modal */}
      <DailyRecordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveRecord}
        date={today}
      />
    </div>
  );
};
