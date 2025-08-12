import React, { useState, useEffect } from "react";
import { menstrualCycleAPI } from "../services/api";
import { ConfirmationModal } from "./ConfirmationModal";
import { PregnancyRecords } from "./PregnancyRecords";

interface PregnancySupportProps {
  className?: string;
}

interface OvulationData {
  estimatedOvulationDate: string;
  fertilityWindow: {
    start: string;
    end: string;
  };
  nextOvulation: string;
  cycleDay: number;
}

interface PregnancyRecord {
  id: string;
  date: string;
  type: "symptom" | "test" | "appointment" | "note";
  title: string;
  description: string;
  value?: string;
}

export const PregnancySupport: React.FC<PregnancySupportProps> = ({ className = "" }) => {
  const [isPregnancyMode, setIsPregnancyMode] = useState(false);
  const [isPregnant, setIsPregnant] = useState(false);
  const [pregnancyStartDate, setPregnancyStartDate] = useState("");
  const [ovulationData, setOvulationData] = useState<OvulationData | null>(null);
  const [pregnancyRecords, setPregnancyRecords] = useState<PregnancyRecord[]>([]);
  const [showCancelPregnancyModal, setShowCancelPregnancyModal] = useState(false);
  const [showPregnancyConfirmModal, setShowPregnancyConfirmModal] = useState(false);
  const [showRecordsPage, setShowRecordsPage] = useState(false);

  useEffect(() => {
    const savedMode = localStorage.getItem("pregnancyMode");
    const savedPregnant = localStorage.getItem("isPregnant");
    const savedStartDate = localStorage.getItem("pregnancyStartDate");
    const savedRecords = localStorage.getItem("pregnancyRecords");

    if (savedMode) setIsPregnancyMode(JSON.parse(savedMode));
    if (savedPregnant) setIsPregnant(JSON.parse(savedPregnant));
    if (savedStartDate) setPregnancyStartDate(savedStartDate);
    if (savedRecords) setPregnancyRecords(JSON.parse(savedRecords));

    if (savedMode && JSON.parse(savedMode)) {
      loadOvulationData();
    }
  }, []);

  const loadOvulationData = async () => {
    try {
      const response = await menstrualCycleAPI.getCurrentStatus();
      if (response.data) {
        // 実際のAPIレスポンスに基づいて調整が必要
        setOvulationData({
          estimatedOvulationDate: "2025-01-27",
          fertilityWindow: {
            start: "2025-01-25",
            end: "2025-01-29",
          },
          nextOvulation: "2025-02-10",
          cycleDay: 14,
        });
      }
    } catch (error) {
      console.error("Failed to load ovulation data:", error);
    }
  };

  const togglePregnancyMode = () => {
    const newMode = !isPregnancyMode;
    setIsPregnancyMode(newMode);
    localStorage.setItem("pregnancyMode", JSON.stringify(newMode));

    if (newMode) {
      loadOvulationData();
    }
  };

  const handlePregnancyConfirm = () => {
    const today = new Date().toISOString().split("T")[0];
    setIsPregnant(true);
    setPregnancyStartDate(today);
    localStorage.setItem("isPregnant", JSON.stringify(true));
    localStorage.setItem("pregnancyStartDate", today);
    setShowPregnancyConfirmModal(false);
  };

  const handleCancelPregnancy = () => {
    setIsPregnant(false);
    setPregnancyStartDate("");
    localStorage.removeItem("isPregnant");
    localStorage.removeItem("pregnancyStartDate");
    setShowCancelPregnancyModal(false);
  };

  const calculatePregnancyWeeks = () => {
    if (!pregnancyStartDate) return { weeks: 0, days: 0 };

    const start = new Date(pregnancyStartDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const weeks = Math.floor(diffDays / 7);
    const days = diffDays % 7;

    return { weeks, days };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      month: "short",
      day: "numeric",
    });
  };

  const calculateWeeksFromDate = (recordDate: string) => {
    if (!pregnancyStartDate) return { weeks: 0, days: 0 };

    const start = new Date(pregnancyStartDate);
    const record = new Date(recordDate);
    const diffTime = Math.abs(record.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const weeks = Math.floor(diffDays / 7);
    const days = diffDays % 7;

    return { weeks, days };
  };

  const getRecentRecords = () => {
    return pregnancyRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3);
  };

  const getDaysUntilOvulation = () => {
    if (!ovulationData) return null;
    const today = new Date();
    const ovulationDate = new Date(ovulationData.estimatedOvulationDate);
    const diffTime = ovulationDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Show records page if requested
  if (showRecordsPage) {
    return <PregnancyRecords onBack={() => setShowRecordsPage(false)} />;
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-medical p-4 sm:p-6 ${className}`}>
      {/* Header with BETA Badge */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center">
          <h2 className="text-lg sm:text-xl font-semibold text-neutral-900">妊娠サポート</h2>
          <span className="ml-3 px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">BETA</span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer touch-manipulation">
          <input type="checkbox" checked={isPregnancyMode} onChange={togglePregnancyMode} className="sr-only peer" />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
        </label>
      </div>

      {!isPregnancyMode ? (
        <div className="text-center py-6 sm:py-8">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">妊娠希望モード</h3>
          <p className="text-sm sm:text-base text-gray-600 mb-4 px-2">
            妊娠を希望する場合、このモードを有効にすると
            <br className="hidden sm:block" />
            <span className="sm:inline">排卵日予測や妊娠記録などの詳細機能をご利用いただけます</span>
          </p>
          <p className="text-xs sm:text-sm text-orange-600">※ BETA機能のため、今後仕様が変更される可能性があります</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pregnancy Status */}
          {!isPregnant ? (
            <div className="bg-pink-50 border border-pink-200 rounded-lg p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div className="text-center sm:text-left">
                  <h3 className="text-base sm:text-lg font-medium text-pink-900">妊娠希望モード有効</h3>
                  <p className="text-pink-700 text-xs sm:text-sm">排卵日予測と妊娠準備をサポートします</p>
                </div>
                <button
                  onClick={() => setShowPregnancyConfirmModal(true)}
                  className="w-full sm:w-auto px-4 py-2 bg-pink-600 hover:bg-pink-700 active:bg-pink-800 text-white rounded-lg text-sm transition-colors min-h-[44px] touch-manipulation"
                >
                  妊娠確認
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                    <div className="text-center sm:text-left">
                      <h3 className="text-base sm:text-lg font-medium text-blue-900">妊娠中</h3>
                      <p className="text-blue-700 text-xs sm:text-sm">
                        妊娠 {calculatePregnancyWeeks().weeks}週 {calculatePregnancyWeeks().days}日
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-center sm:text-right sm:ml-4">
                  <div className="text-xl sm:text-2xl font-bold text-blue-900">
                    {calculatePregnancyWeeks().weeks}w{calculatePregnancyWeeks().days}d
                  </div>
                  <div className="text-xs text-blue-700">妊娠週数</div>
                  <button
                    onClick={() => setShowCancelPregnancyModal(true)}
                    className="px-3 py-1 text-xs text-red-600 hover:text-red-800 active:text-red-900 hover:bg-red-50 rounded-lg transition-colors min-h-[36px] touch-manipulation mt-2"
                    title="妊娠状態を取り消し"
                  >
                    取り消し
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Ovulation Tracking */}
          {!isPregnant && ovulationData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-center mb-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h4 className="text-sm sm:text-base font-medium text-purple-900">排卵日予測</h4>
                </div>
                <div className="text-lg sm:text-2xl font-bold text-purple-900 mb-1">{formatDate(ovulationData.estimatedOvulationDate)}</div>
                <p className="text-xs sm:text-sm text-purple-700">
                  {getDaysUntilOvulation() !== null && getDaysUntilOvulation()! > 0
                    ? `あと${getDaysUntilOvulation()}日`
                    : getDaysUntilOvulation() === 0
                    ? "今日"
                    : "過去"}
                </p>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-center mb-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <h4 className="text-sm sm:text-base font-medium text-green-900">妊娠しやすい期間</h4>
                </div>
                <div className="text-xs sm:text-sm text-green-900 font-medium">
                  {formatDate(ovulationData.fertilityWindow.start)} 〜 {formatDate(ovulationData.fertilityWindow.end)}
                </div>
                <p className="text-xs text-green-700 mt-1">周期{ovulationData.cycleDay}日目</p>
              </div>
            </div>
          )}

          {/* Recent Records Overview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm sm:text-base font-medium text-gray-900">{isPregnant ? "最近の妊娠記録" : "最近の妊活記録"}</h4>
              <button
                onClick={() => setShowRecordsPage(true)}
                className="px-3 py-2 text-sm text-primary-600 hover:text-primary-700 active:text-primary-800 hover:bg-primary-50 rounded-lg transition-colors min-h-[40px] touch-manipulation"
              >
                すべて見る
              </button>
            </div>

            {/* Recent Records List */}
            <div className="space-y-2">
              {pregnancyRecords.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 text-xs sm:text-sm mb-3">まだ記録がありません</p>
                  <button
                    onClick={() => setShowRecordsPage(true)}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm transition-colors min-h-[40px] touch-manipulation"
                  >
                    最初の記録を追加
                  </button>
                </div>
              ) : (
                <>
                  {getRecentRecords().map((record) => {
                    const weekData = calculateWeeksFromDate(record.date);
                    return (
                      <div key={record.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-2 sm:space-y-0">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center mb-1">
                              <span
                                className={`
                                px-2 py-1 rounded-full text-xs font-medium mr-2 mb-1
                                ${record.type === "symptom" ? "bg-orange-100 text-orange-800" : ""}
                                ${record.type === "test" ? "bg-blue-100 text-blue-800" : ""}
                                ${record.type === "appointment" ? "bg-green-100 text-green-800" : ""}
                                ${record.type === "note" ? "bg-gray-100 text-gray-800" : ""}
                              `}
                              >
                                {record.type === "symptom" && "症状"}
                                {record.type === "test" && "検査"}
                                {record.type === "appointment" && "診察"}
                                {record.type === "note" && "メモ"}
                              </span>
                              <h6 className="font-medium text-gray-900 text-sm">{record.title}</h6>
                            </div>
                            <p className="text-gray-700 text-xs sm:text-sm line-clamp-2">{record.description}</p>
                            {record.value && <p className="text-primary-600 text-xs sm:text-sm font-medium mt-1">結果: {record.value}</p>}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-xs text-gray-500">{formatDate(record.date)}</div>
                            {isPregnant && (
                              <div className="text-xs text-primary-600 font-medium">
                                {weekData.weeks}w{weekData.days}d
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {pregnancyRecords.length > 3 && (
                    <div className="text-center pt-2">
                      <button onClick={() => setShowRecordsPage(true)} className="text-sm text-primary-600 hover:text-primary-700 active:text-primary-800">
                        他 {pregnancyRecords.length - 3} 件の記録を見る
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Tips Section */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row">
              <svg className="w-5 h-5 text-amber-400 mr-0 sm:mr-2 mb-2 sm:mb-0 sm:mt-0.5 self-center sm:self-start" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="text-xs sm:text-sm">
                <p className="text-sm sm:text-base font-medium text-amber-800">妊活・妊娠中のポイント</p>
                <ul className="mt-1 text-amber-700 list-disc list-inside space-y-1 text-xs sm:text-sm">
                  <li>規則正しい生活リズムを心がけましょう</li>
                  <li>葉酸サプリメントの摂取を検討しましょう</li>
                  <li>定期的な健康チェックを受けましょう</li>
                  <li>気になる症状があれば医師に相談しましょう</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pregnancy Confirmation Modal */}
      {showPregnancyConfirmModal && (
        <ConfirmationModal
          message={`妊娠を確認しますか？

この操作により妊娠モードに切り替わり、
妊娠週数の計算と記録が開始されます。`}
          onConfirm={handlePregnancyConfirm}
          onCancel={() => setShowPregnancyConfirmModal(false)}
          confirmButtonText="確認"
          cancelButtonText="キャンセル"
          confirmButtonClass="px-4 sm:px-6 py-3 rounded-md bg-pink-600 text-white hover:bg-pink-700 active:bg-pink-800 transition-colors text-sm sm:text-base font-medium min-h-[44px] flex items-center justify-center"
        />
      )}

      {/* Cancel Pregnancy Confirmation Modal */}
      {showCancelPregnancyModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          style={{ margin: 0, top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-4 sm:p-6">
            <div className="flex items-center mb-4">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 mr-2 sm:mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">妊娠状態の取り消し</h3>
            </div>

            <div className="mb-4 sm:mb-6">
              <p className="text-sm sm:text-base text-gray-700 mb-3">妊娠状態を取り消しますか？この操作により以下のデータが削除されます：</p>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1 bg-gray-50 p-3 rounded-lg">
                <li>妊娠開始日</li>
                <li>妊娠週数の記録</li>
                <li>妊娠中として保存された記録（妊活記録は保持されます）</li>
              </ul>
              <p className="text-sm text-red-600 mt-3 font-medium">この操作は取り消すことができません。</p>
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setShowCancelPregnancyModal(false)}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-lg transition-colors min-h-[44px] touch-manipulation"
              >
                キャンセル
              </button>
              <button
                onClick={handleCancelPregnancy}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg transition-colors min-h-[44px] touch-manipulation"
              >
                取り消し実行
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
