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
  partnerData?: {
    symptoms: string[];
    mood: string;
    healthNotes: string;
    flowIntensity?: number;
    partnerName?: string;
  };
}

export const DateRecordModal: React.FC<DateRecordModalProps> = ({ isOpen, onClose, selectedDate, onSave, onDelete, existingData, isInPeriod = false }) => {
  const [formData, setFormData] = useState<RecordData>({
    isPeriodStart: false,
    isPeriodEnd: false,
    symptoms: [],
    mood: "",
    healthNotes: "",
    flowIntensity: undefined,
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
        flowIntensity: undefined,
      });
    }
  }, [existingData, isOpen]);

  const symptomOptions = ["頭痛", "腰痛", "腹痛", "胸の張り", "むくみ", "疲労感", "イライラ", "気分の落ち込み", "食欲の変化", "眠気", "不眠", "肌荒れ"];

  const moodOptions = [
    { value: "very_good", label: "とても良い", color: "bg-green-500" },
    { value: "good", label: "良い", color: "bg-green-400" },
    { value: "normal", label: "普通", color: "bg-gray-400" },
    { value: "bad", label: "悪い", color: "bg-orange-400" },
    { value: "very_bad", label: "とても悪い", color: "bg-red-500" },
  ];

  const flowIntensityOptions = [
    { value: 1, label: "非常に軽い", color: "bg-red-200" },
    { value: 2, label: "軽い", color: "bg-red-300" },
    { value: 3, label: "普通", color: "bg-red-400" },
    { value: 4, label: "重い", color: "bg-red-500" },
    { value: 5, label: "非常に重い", color: "bg-red-600" },
  ];

  const handleSymptomToggle = (symptom: string) => {
    setFormData((prev) => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom) ? prev.symptoms.filter((s) => s !== symptom) : [...prev.symptoms, symptom],
    }));
  };

  const handleSave = () => {
    // 生理開始と終了の両方が選択されていないかチェック
    if (formData.isPeriodStart && formData.isPeriodEnd) {
      alert("生理開始日と終了日の両方を同時に選択することはできません。どちらか一つを選択してください。");
      return;
    }

    onSave(formData);

    // データ更新イベントを発火してセルフケア状態を更新
    window.dispatchEvent(new CustomEvent("menstrualDataUpdated"));

    onClose();
  };

  // 削除処理
  const handleDelete = () => {
    if (existingData?.cycleId && onDelete) {
      if (confirm("この生理周期を削除しますか？")) {
        onDelete(existingData.cycleId);

        // データ削除イベントを発火してセルフケア状態を更新
        window.dispatchEvent(new CustomEvent("menstrualDataUpdated"));

        onClose();
      }
    }
  };

  // 生理開始が選択された時に終了を無効化
  const handlePeriodStartChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      isPeriodStart: checked,
      isPeriodEnd: checked ? false : prev.isPeriodEnd, // 開始が選択されたら終了を無効化
    }));
  };

  // 生理終了が選択された時に開始を無効化
  const handlePeriodEndChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      isPeriodEnd: checked,
      isPeriodStart: checked ? false : prev.isPeriodStart, // 終了が選択されたら開始を無効化
    }));
  };

  if (!isOpen) return null;

  const formatDate = (date: Date) => {
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full sm:max-w-2xl sm:w-full max-h-[85vh] sm:max-h-[90vh] overflow-y-auto sm:m-4">
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-2 pb-1">
          <div className="w-8 h-1 bg-gray-300 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">{formatDate(selectedDate)}の記録</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* パートナーの記録セクション - 上段に配置 */}
          {existingData?.partnerData && (
            <div className="space-y-4 bg-pink-50 rounded-lg p-4 border border-pink-200">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-pink-400 rounded-full"></div>
                <h3 className="text-lg font-medium text-pink-800">{existingData.partnerData.partnerName || "パートナー"}の記録</h3>
              </div>

              {/* パートナーの経血量 */}
              {existingData.partnerData.flowIntensity && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-pink-700">経血量</label>
                  <div className="text-sm text-pink-600">
                    {flowIntensityOptions.find((option) => option.value === existingData.partnerData?.flowIntensity)?.label || "記録なし"}
                  </div>
                </div>
              )}

              {/* パートナーの症状 */}
              {existingData.partnerData.symptoms && existingData.partnerData.symptoms.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-pink-700">症状</label>
                  <div className="flex flex-wrap gap-2">
                    {existingData.partnerData.symptoms.map((symptom, index) => (
                      <span key={index} className="px-2 py-1 bg-pink-200 text-pink-800 rounded-full text-xs">
                        {symptom}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* パートナーの気分 */}
              {existingData.partnerData.mood && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-pink-700">気分</label>
                  <div className="text-sm text-pink-600">
                    {moodOptions.find((option) => option.value === existingData.partnerData?.mood)?.label || "記録なし"}
                  </div>
                </div>
              )}

              {/* パートナーの健康メモ */}
              {existingData.partnerData.healthNotes && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-pink-700">健康メモ</label>
                  <div className="text-sm text-pink-600 bg-white p-3 rounded border border-pink-200">{existingData.partnerData.healthNotes}</div>
                </div>
              )}
            </div>
          )}

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
                      onClick={() => setFormData((prev) => ({ ...prev, flowIntensity: option.value }))}
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
              {(formData.symptoms.length > 0 || formData.mood || formData.healthNotes.trim() || formData.flowIntensity) && (
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, symptoms: [], mood: "", healthNotes: "", flowIntensity: undefined }))}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  全てクリア
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {symptomOptions.map((symptom) => (
                <button
                  key={symptom}
                  type="button"
                  onClick={() => handleSymptomToggle(symptom)}
                  className={`p-3 sm:p-3 rounded-lg border text-xs sm:text-sm font-medium transition-all min-h-[44px] ${
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
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {moodOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, mood: option.value }))}
                  className={`p-2 sm:p-3 rounded-lg border text-xs font-medium transition-all min-h-[44px] ${
                    formData.mood === option.value ? `${option.color} text-white border-transparent` : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
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
              onChange={(e) => setFormData((prev) => ({ ...prev, healthNotes: e.target.value }))}
              placeholder="体調や気になることを記録してください..."
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none text-sm sm:text-base"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-gray-200 space-y-3 sm:space-y-0">
          {existingData?.cycleId && onDelete && (
            <div className="sm:hidden">
              <button
                onClick={handleDelete}
                className="w-full px-4 py-3 text-sm font-medium text-red-700 bg-red-50 border border-red-300 rounded-lg hover:bg-red-100 transition-colors"
              >
                生理周期を削除
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
            <div className="hidden sm:block">
              {existingData?.cycleId && onDelete && (
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-300 rounded-lg hover:bg-red-100 transition-colors"
                >
                  生理周期を削除
                </button>
              )}
            </div>

            <div className="flex w-full sm:w-auto space-x-3">
              <button
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-3 sm:py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleSave}
                className="flex-1 sm:flex-none px-4 py-3 sm:py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
