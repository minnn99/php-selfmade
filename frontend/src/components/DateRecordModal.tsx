import React, { useState, useEffect } from "react";

interface DateRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  onSave: (data: RecordData) => void;
  onDelete?: (cycleId: number) => void;
  existingData?: RecordData;
  isInPeriod?: boolean; // 生理期間中かどうか
}

export interface RecordData {
  isPeriodStart: boolean;
  isPeriodEnd: boolean;
  symptoms: string[];
  mood: string;
  healthNotes: string;
  flowIntensity?: number;
  cycleId?: number;
  existingCycleData?: any;
}

export const DateRecordModal: React.FC<DateRecordModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  onSave,
  onDelete,
  existingData,
  isInPeriod = false
}) => {
  const [formData, setFormData] = useState<RecordData>({
    isPeriodStart: false,
    isPeriodEnd: false,
    symptoms: [],
    mood: "",
    healthNotes: "",
    flowIntensity: undefined
  });

  useEffect(() => {
    if (existingData) {
      setFormData(existingData);
    } else {
      setFormData({
        isPeriodStart: false,
        isPeriodEnd: false,
        symptoms: [],
        mood: "",
        healthNotes: "",
        flowIntensity: undefined
      });
    }
  }, [existingData, isOpen]);

  const symptomOptions = [
    "頭痛", "腰痛", "腹痛", "胸の張り", "むくみ", "疲労感",
    "イライラ", "気分の落ち込み", "食欲の変化", "眠気", "不眠", "肌荒れ"
  ];

  const moodOptions = [
    { value: "very_good", label: "とても良い", color: "bg-green-500" },
    { value: "good", label: "良い", color: "bg-green-400" },
    { value: "normal", label: "普通", color: "bg-gray-400" },
    { value: "bad", label: "悪い", color: "bg-orange-400" },
    { value: "very_bad", label: "とても悪い", color: "bg-red-500" }
  ];

  const flowIntensityOptions = [
    { value: 1, label: "軽い", color: "bg-red-200" },
    { value: 2, label: "普通", color: "bg-red-300" },
    { value: 3, label: "多い", color: "bg-red-400" },
    { value: 4, label: "とても多い", color: "bg-red-500" },
    { value: 5, label: "過多", color: "bg-red-600" }
  ];

  const handleSymptomToggle = (symptom: string) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom]
    }));
  };

  const handleSave = () => {
    // 生理開始と終了の両方が選択されていないかチェック
    if (formData.isPeriodStart && formData.isPeriodEnd) {
      alert('生理開始日と終了日の両方を同時に選択することはできません。どちらか一つを選択してください。');
      return;
    }

    onSave(formData);
    onClose();
  };

  // 削除処理
  const handleDelete = () => {
    if (existingData?.cycleId && onDelete) {
      if (confirm('この生理周期を削除しますか？')) {
        onDelete(existingData.cycleId);
        onClose();
      }
    }
  };

  // 生理開始が選択された時に終了を無効化
  const handlePeriodStartChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      isPeriodStart: checked,
      isPeriodEnd: checked ? false : prev.isPeriodEnd // 開始が選択されたら終了を無効化
    }));
  };

  // 生理終了が選択された時に開始を無効化
  const handlePeriodEndChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      isPeriodEnd: checked,
      isPeriodStart: checked ? false : prev.isPeriodStart // 終了が選択されたら開始を無効化
    }));
  };

  if (!isOpen) return null;

  const formatDate = (date: Date) => {
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {formatDate(selectedDate)}の記録
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* 生理記録セクション */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">生理記録</h3>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.isPeriodStart}
                  onChange={(e) => handlePeriodStartChange(e.target.checked)}
                  className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">生理開始日にする</span>
              </label>
              <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.isPeriodEnd}
                  onChange={(e) => handlePeriodEndChange(e.target.checked)}
                  className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">生理終了日にする</span>
              </label>
            </div>

            {/* 経血量 */}
            {(formData.isPeriodStart || formData.isPeriodEnd || isInPeriod) && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">経血量</label>
                <div className="grid grid-cols-5 gap-2">
                  {flowIntensityOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, flowIntensity: option.value }))}
                      className={`p-3 rounded-lg border text-xs font-medium transition-all ${
                        formData.flowIntensity === option.value
                          ? `${option.color} text-white border-transparent`
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 症状セクション */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">症状</h3>
              {(formData.symptoms.length > 0 || formData.mood || formData.healthNotes.trim()) && (
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, symptoms: [], mood: "", healthNotes: "" }))}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  全てクリア
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {symptomOptions.map((symptom) => (
                <button
                  key={symptom}
                  type="button"
                  onClick={() => handleSymptomToggle(symptom)}
                  className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                    formData.symptoms.includes(symptom)
                      ? "bg-primary-50 text-primary-700 border-primary-200"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {symptom}
                </button>
              ))}
            </div>
          </div>

          {/* 気分セクション */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">気分</h3>
            <div className="grid grid-cols-5 gap-2">
              {moodOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, mood: option.value }))}
                  className={`p-3 rounded-lg border text-xs font-medium transition-all ${
                    formData.mood === option.value
                      ? `${option.color} text-white border-transparent`
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 健康メモセクション */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">健康メモ</h3>
            <textarea
              value={formData.healthNotes}
              onChange={(e) => setFormData(prev => ({ ...prev, healthNotes: e.target.value }))}
              placeholder="体調や気になることを記録してください..."
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div>
            {existingData?.cycleId && onDelete && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-300 rounded-lg hover:bg-red-100 transition-colors"
              >
                生理周期を削除
              </button>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 transition-colors"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};