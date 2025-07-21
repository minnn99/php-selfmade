import React, { useState, useEffect } from 'react';

interface DailyRecordData {
  mood: string;
  physicalCondition: string;
  waterIntake: number;
  sleepHours: number;
  notes: string;
}

interface DailyRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: DailyRecordData) => void;
  date: Date;
}

export const DailyRecordModal: React.FC<DailyRecordModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  date 
}) => {
  const [formData, setFormData] = useState<DailyRecordData>({
    mood: '',
    physicalCondition: '',
    waterIntake: 0,
    sleepHours: 0,
    notes: ''
  });

  const moodOptions = [
    { value: 'excellent', label: '😊 とても良い', emoji: '😊' },
    { value: 'good', label: '🙂 良い', emoji: '🙂' },
    { value: 'normal', label: '😐 普通', emoji: '😐' },
    { value: 'poor', label: '😔 悪い', emoji: '😔' },
    { value: 'terrible', label: '😩 とても悪い', emoji: '😩' }
  ];

  const physicalOptions = [
    { value: 'excellent', label: '💪 とても良い', emoji: '💪' },
    { value: 'good', label: '👍 良い', emoji: '👍' },
    { value: 'normal', label: '👌 普通', emoji: '👌' },
    { value: 'poor', label: '😰 悪い', emoji: '😰' },
    { value: 'terrible', label: '🤒 とても悪い', emoji: '🤒' }
  ];

  useEffect(() => {
    if (isOpen) {
      // モーダルが開かれた時にフォームをリセット
      setFormData({
        mood: '',
        physicalCondition: '',
        waterIntake: 0,
        sleepHours: 0,
        notes: ''
      });
    }
  }, [isOpen]);

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-white rounded-t-xl sm:rounded-xl shadow-2xl w-full sm:max-w-md sm:w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">今日の記録</h2>
            <p className="text-xs sm:text-sm text-gray-600">{formatDate(date)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* 気分 */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">今日の気分</label>
            <div className="grid grid-cols-1 gap-2">
              {moodOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFormData(prev => ({ ...prev, mood: option.value }))}
                  className={`flex items-center p-3 sm:p-4 rounded-lg border-2 transition-colors min-h-[44px] ${
                    formData.mood === option.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300 active:bg-gray-50'
                  }`}
                >
                  <span className="text-lg sm:text-xl mr-3 flex-shrink-0">{option.emoji}</span>
                  <span className="text-sm sm:text-base">{option.label.split(' ')[1]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 体調 */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">今日の体調</label>
            <div className="grid grid-cols-1 gap-2">
              {physicalOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFormData(prev => ({ ...prev, physicalCondition: option.value }))}
                  className={`flex items-center p-3 sm:p-4 rounded-lg border-2 transition-colors min-h-[44px] ${
                    formData.physicalCondition === option.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300 active:bg-gray-50'
                  }`}
                >
                  <span className="text-lg sm:text-xl mr-3 flex-shrink-0">{option.emoji}</span>
                  <span className="text-sm sm:text-base">{option.label.split(' ')[1]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 水分摂取量 */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">水分摂取量</label>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={formData.waterIntake}
                onChange={(e) => setFormData(prev => ({ ...prev, waterIntake: parseFloat(e.target.value) || 0 }))}
                className="w-20 sm:w-24 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm min-h-[44px]"
              />
              <span className="text-xs sm:text-sm text-gray-600">リットル</span>
            </div>
          </div>

          {/* 睡眠時間 */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">睡眠時間</label>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={formData.sleepHours}
                onChange={(e) => setFormData(prev => ({ ...prev, sleepHours: parseFloat(e.target.value) || 0 }))}
                className="w-20 sm:w-24 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm min-h-[44px]"
              />
              <span className="text-xs sm:text-sm text-gray-600">時間</span>
            </div>
          </div>

          {/* メモ */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">メモ</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="今日の出来事や体調の詳細など..."
              rows={3}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-sm"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end space-y-2 sm:space-y-0 sm:space-x-3 p-4 sm:p-6 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-3 text-sm sm:text-base font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-lg transition-colors min-h-[44px] flex items-center justify-center"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-3 text-sm sm:text-base font-medium text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 rounded-lg transition-colors min-h-[44px] flex items-center justify-center"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};