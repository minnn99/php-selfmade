import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { menstrualCycleAPI, userDataAPI } from "../../services/api";
import { ConfirmationModal } from "../modals/ConfirmationModal";
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

interface PregnancyHistoryRecord {
  start_date: string;
  end_date: string;
  duration_weeks: number;
  duration_days: number;
  records_data?: PregnancyRecord[];
}

export const PregnancySupport: React.FC<PregnancySupportProps> = ({ className = "" }) => {
  const [isPregnancyMode, setIsPregnancyMode] = useState(false);
  const [isPregnant, setIsPregnant] = useState(false);
  const [pregnancyStartDate, setPregnancyStartDate] = useState("");
  const [ovulationData, setOvulationData] = useState<OvulationData | null>(null);
  const [pregnancyRecords, setPregnancyRecords] = useState<PregnancyRecord[]>([]);
  const [showCancelPregnancyModal, setShowCancelPregnancyModal] = useState(false);
  const [showPregnancyConfirmModal, setShowPregnancyConfirmModal] = useState(false);
  const [showPregnancyModeEnableModal, setShowPregnancyModeEnableModal] = useState(false);
  const [showEndPregnancyModal, setShowEndPregnancyModal] = useState(false);
  const [showRecordsPage, setShowRecordsPage] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [pregnancyHistory, setPregnancyHistory] = useState<PregnancyHistoryRecord[]>([]);
  const [selectedHistoryRecord, setSelectedHistoryRecord] = useState<PregnancyHistoryRecord | null>(null);
  const [showHistoryDetailModal, setShowHistoryDetailModal] = useState(false);

  useEffect(() => {
    const savedMode = localStorage.getItem("pregnancyMode");
    const savedPregnant = localStorage.getItem("isPregnant");
    const savedStartDate = localStorage.getItem("pregnancyStartDate");
    const savedRecords = localStorage.getItem("pregnancyRecords");
    const savedHistory = localStorage.getItem("pregnancyHistory");

    if (savedMode) setIsPregnancyMode(JSON.parse(savedMode));
    if (savedPregnant) setIsPregnant(JSON.parse(savedPregnant));
    if (savedStartDate) setPregnancyStartDate(savedStartDate);
    if (savedRecords) setPregnancyRecords(JSON.parse(savedRecords));
    if (savedHistory) setPregnancyHistory(JSON.parse(savedHistory));

    if (savedMode && JSON.parse(savedMode)) {
      loadOvulationData();
    }
    
    // APIから最新のデータを読み込み
    loadPregnancyRecords();
  }, []);

  const loadPregnancyRecords = async () => {
    try {
      const response = await userDataAPI.getPregnancyRecords();
      if (response.success && response.data) {
        const responseData = response.data as { records_data?: PregnancyRecord[]; start_date?: string };
        const records = responseData.records_data || [];
        setPregnancyRecords(records);
        // ローカルストレージも更新
        localStorage.setItem("pregnancyRecords", JSON.stringify(records));
        
        // 妊娠開始日も更新
        if (responseData.start_date) {
          setPregnancyStartDate(responseData.start_date);
          localStorage.setItem("pregnancyStartDate", responseData.start_date);
          setIsPregnant(true);
          localStorage.setItem("isPregnant", JSON.stringify(true));
        }
      }
    } catch {
      // Failed to load pregnancy records
    }
  };

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
    } catch {
      // Failed to load ovulation data
    }
  };

  const togglePregnancyMode = () => {
    const newMode = !isPregnancyMode;

    if (newMode) {
      setShowPregnancyModeEnableModal(true);
    } else {
      setIsPregnancyMode(newMode);
      localStorage.setItem("pregnancyMode", JSON.stringify(newMode));
    }
  };

  const handlePregnancyModeEnable = () => {
    setIsPregnancyMode(true);
    localStorage.setItem("pregnancyMode", JSON.stringify(true));
    setShowPregnancyModeEnableModal(false);
    loadOvulationData();
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

  const handleEndPregnancy = async () => {
    if (!pregnancyStartDate) return;
    
    try {
      const endDate = new Date().toISOString().split("T")[0];
      const historyRecord: PregnancyHistoryRecord = {
        start_date: pregnancyStartDate,
        end_date: endDate,
        duration_weeks: calculatePregnancyWeeks().weeks,
        duration_days: calculatePregnancyWeeks().days,
        records_data: pregnancyRecords
      };
      
      // Save pregnancy records with end date before clearing state
      await userDataAPI.savePregnancyRecords(
        pregnancyStartDate,
        {
          records_data: pregnancyRecords,
          end_date: endDate,
          duration_weeks: calculatePregnancyWeeks().weeks,
          duration_days: calculatePregnancyWeeks().days,
        },
        false // Set as inactive to mark as completed
      );
      
      // Add to history
      const updatedHistory = [...pregnancyHistory, historyRecord];
      setPregnancyHistory(updatedHistory);
      localStorage.setItem("pregnancyHistory", JSON.stringify(updatedHistory));
      
      // Clear current pregnancy state
      setIsPregnant(false);
      setPregnancyStartDate("");
      setPregnancyRecords([]);
      localStorage.removeItem("isPregnant");
      localStorage.removeItem("pregnancyStartDate");
      localStorage.removeItem("pregnancyRecords");
      
      setShowEndPregnancyModal(false);
      
      alert("妊娠記録が保存されました。新しい妊娠記録を開始できます。");
    } catch (error) {
      console.error("Failed to save pregnancy records:", error);
      alert("記録の保存に失敗しました。もう一度お試しください。");
    }
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
  
  // Show historical records page if a historical record is selected
  if (showHistoryDetailModal && selectedHistoryRecord) {
    return (
      <PregnancyRecords 
        onBack={() => {
          setShowHistoryDetailModal(false);
          setSelectedHistoryRecord(null);
        }}
        historicalData={{
          records: selectedHistoryRecord.records_data || [],
          startDate: selectedHistoryRecord.start_date,
          endDate: selectedHistoryRecord.end_date,
          durationWeeks: selectedHistoryRecord.duration_weeks,
          durationDays: selectedHistoryRecord.duration_days
        }}
        isHistoricalView={true}
      />
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-medical dark:border-gray-700 p-4 sm:p-6 ${className}`}>
      {/* Header with BETA Badge */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center">
          <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 dark:text-white">妊娠サポート</h2>
          <span className="ml-3 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 text-xs font-medium rounded-full">BETA</span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer touch-manipulation">
          <input type="checkbox" checked={isPregnancyMode} onChange={togglePregnancyMode} className="sr-only peer" />
          <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
        </label>
      </div>

      {!isPregnancyMode ? (
        <div className="text-center py-6 sm:py-8">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">妊娠希望モード</h3>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4 px-2">
            妊娠を希望する場合、このモードを有効にすると
            <br className="hidden sm:block" />
            <span className="sm:inline">妊娠記録などの詳細機能をご利用いただけます</span>
          </p>
          <p className="text-xs sm:text-sm text-orange-600 dark:text-orange-400">※ BETA機能のため、今後仕様が変更される可能性があります</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pregnancy Status */}
          {!isPregnant ? (
            <div className="bg-pink-50 dark:bg-pink-900/30 border border-pink-200 dark:border-pink-700 rounded-lg p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div className="text-center sm:text-left">
                  <h3 className="text-base sm:text-lg font-medium text-pink-900 dark:text-pink-200">妊娠希望モード有効</h3>
                  <p className="text-pink-700 dark:text-pink-300 text-xs sm:text-sm">排卵日予測と妊娠準備をサポートします</p>
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
            <div className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/30 dark:to-rose-900/30 border border-pink-200 dark:border-pink-700 rounded-lg p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div className="flex flex-row justify-between items-start sm:flex-col sm:flex-1">
                  <div className="flex-1 sm:flex-none">
                    <div className="flex items-center space-x-2 mb-2">
                      <svg className="w-5 h-5 text-pink-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                      <h3 className="text-base sm:text-lg font-medium text-pink-900 dark:text-pink-200">妊娠中</h3>
                    </div>
                    <p className="text-pink-700 dark:text-pink-300 text-xs sm:text-sm">
                      妊娠 {calculatePregnancyWeeks().weeks}週 {calculatePregnancyWeeks().days}日
                    </p>
                  </div>
                  <div className="flex flex-col items-end sm:hidden">
                    <div className="text-right mb-2">
                      <div className="text-2xl font-bold text-pink-900 dark:text-pink-200">
                        {calculatePregnancyWeeks().weeks}w{calculatePregnancyWeeks().days}d
                      </div>
                      <div className="text-xs text-pink-700 dark:text-pink-300">妊娠週数</div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setShowEndPregnancyModal(true)}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-pink-500 hover:bg-pink-600 active:bg-pink-700 rounded-lg transition-colors min-h-[36px] touch-manipulation shadow-sm"
                        title="妊娠記録を終了して保存"
                      >
                        妊娠終了
                      </button>
                      <button
                        onClick={() => setShowCancelPregnancyModal(true)}
                        className="px-3 py-1.5 text-xs font-medium text-pink-700 dark:text-pink-300 bg-white dark:bg-gray-800 hover:bg-pink-50 dark:hover:bg-pink-900/50 active:bg-pink-100 dark:active:bg-pink-900/70 border border-pink-300 dark:border-pink-700 rounded-lg transition-colors min-h-[36px] touch-manipulation"
                        title="妊娠状態を取り消し"
                      >
                        取り消し
                      </button>
                    </div>
                  </div>
                </div>
                <div className="hidden sm:flex sm:flex-row sm:items-center sm:space-x-4">
                  <div className="text-center sm:text-right">
                    <div className="text-3xl font-bold text-pink-900 dark:text-pink-200">
                      {calculatePregnancyWeeks().weeks}w{calculatePregnancyWeeks().days}d
                    </div>
                    <div className="text-xs text-pink-700 dark:text-pink-300">妊娠週数</div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowEndPregnancyModal(true)}
                      className="px-4 py-2 text-sm font-medium text-white bg-pink-500 hover:bg-pink-600 active:bg-pink-700 rounded-lg transition-colors min-h-[40px] touch-manipulation shadow-sm"
                      title="妊娠記録を終了して保存"
                    >
                      妊娠終了
                    </button>
                    <button
                      onClick={() => setShowCancelPregnancyModal(true)}
                      className="px-4 py-2 text-sm font-medium text-pink-700 dark:text-pink-300 bg-white dark:bg-gray-800 hover:bg-pink-50 dark:hover:bg-pink-900/50 active:bg-pink-100 dark:active:bg-pink-900/70 border border-pink-300 dark:border-pink-700 rounded-lg transition-colors min-h-[40px] touch-manipulation"
                      title="妊娠状態を取り消し"
                    >
                      取り消し
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ovulation Tracking */}
          {!isPregnant && ovulationData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 border border-purple-200 dark:border-purple-700 rounded-lg p-3 sm:p-4">
                <div className="flex items-center mb-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h4 className="text-sm sm:text-base font-medium text-purple-900 dark:text-purple-200">排卵日予測</h4>
                </div>
                <div className="text-lg sm:text-2xl font-bold text-purple-900 dark:text-purple-200 mb-1">{formatDate(ovulationData.estimatedOvulationDate)}</div>
                <p className="text-xs sm:text-sm text-purple-700 dark:text-purple-300">
                  {getDaysUntilOvulation() !== null && getDaysUntilOvulation()! > 0
                    ? `あと${getDaysUntilOvulation()}日`
                    : getDaysUntilOvulation() === 0
                    ? "今日"
                    : "過去"}
                </p>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-200 dark:border-green-700 rounded-lg p-3 sm:p-4">
                <div className="flex items-center mb-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <h4 className="text-sm sm:text-base font-medium text-green-900 dark:text-green-200">妊娠しやすい期間</h4>
                </div>
                <div className="text-xs sm:text-sm text-green-900 dark:text-green-200 font-medium">
                  {formatDate(ovulationData.fertilityWindow.start)} 〜 {formatDate(ovulationData.fertilityWindow.end)}
                </div>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">周期{ovulationData.cycleDay}日目</p>
              </div>
            </div>
          )}

          {/* Recent Records Overview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">{isPregnant ? "最近の妊娠記録" : "最近の妊活記録"}</h4>
              <div className="flex space-x-2">
                {isPregnant && (
                  <button
                    onClick={() => setShowRecordsPage(true)}
                    className="px-3 py-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 active:text-primary-800 dark:active:text-primary-200 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors min-h-[40px] touch-manipulation"
                  >
                    すべて見る
                  </button>
                )}
                <button
                  onClick={() => setShowHistoryModal(true)}
                  className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 active:text-gray-800 dark:active:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors min-h-[40px] touch-manipulation"
                >
                  過去の記録
                </button>
              </div>
            </div>

            {/* Recent Records List */}
            <div className="space-y-2">
              {!isPregnant ? (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <svg className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mb-3">妊娠記録は妊娠確認後に利用できます</p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs">先に「妊娠確認」ボタンを押してください</p>
                </div>
              ) : pregnancyRecords.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mb-3">まだ記録がありません</p>
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
                      <div key={record.id} className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-2 sm:space-y-0">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center mb-1">
                              <span
                                className={`
                                px-2 py-1 rounded-full text-xs font-medium mr-2 mb-1
                                ${record.type === "symptom" ? "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400" : ""}
                                ${record.type === "test" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400" : ""}
                                ${record.type === "appointment" ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400" : ""}
                                ${record.type === "note" ? "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300" : ""}
                              `}
                              >
                                {record.type === "symptom" && "症状"}
                                {record.type === "test" && "検査"}
                                {record.type === "appointment" && "診察"}
                                {record.type === "note" && "メモ"}
                              </span>
                              <h6 className="font-medium text-gray-900 dark:text-white text-sm">{record.title}</h6>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm line-clamp-2">{record.description}</p>
                            {record.value && <p className="text-primary-600 dark:text-primary-400 text-xs sm:text-sm font-medium mt-1">結果: {record.value}</p>}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-xs text-gray-500 dark:text-gray-400">{formatDate(record.date)}</div>
                            {isPregnant && (
                              <div className="text-xs text-primary-600 dark:text-primary-400 font-medium">
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
                      <button onClick={() => setShowRecordsPage(true)} className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 active:text-primary-800 dark:active:text-primary-200">
                        他 {pregnancyRecords.length - 3} 件の記録を見る
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Tips Section */}
          <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row">
              <svg className="w-5 h-5 text-amber-400 mr-0 sm:mr-2 mb-2 sm:mb-0 sm:mt-0.5 self-center sm:self-start" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="text-xs sm:text-sm">
                <p className="text-sm sm:text-base font-medium text-amber-800 dark:text-amber-300">妊活・妊娠中のポイント</p>
                <ul className="mt-1 text-amber-700 dark:text-amber-300 list-disc list-inside space-y-1 text-xs sm:text-sm">
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

      {/* Pregnancy Mode Enable Confirmation Modal */}
      {showPregnancyModeEnableModal && (
        <ConfirmationModal
          message={`妊娠サポートモードを有効にしますか？このモードでは妊娠記録などの詳細機能をご利用いただけます。`}
          onConfirm={handlePregnancyModeEnable}
          onCancel={() => setShowPregnancyModeEnableModal(false)}
          confirmButtonText="有効にする"
          cancelButtonText="キャンセル"
          confirmButtonClass="px-4 sm:px-6 py-3 rounded-md bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 transition-colors text-sm sm:text-base font-medium min-h-[44px] flex items-center justify-center"
        />
      )}

      {/* Pregnancy Confirmation Modal */}
      {showPregnancyConfirmModal &&
        createPortal(
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 p-4 sm:p-6">
              <div className="flex items-center mb-4">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-pink-500 mr-2 sm:mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">妊娠確認</h3>
              </div>

              <div className="mb-4 sm:mb-6">
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-3">妊娠を確認しますか？</p>
                <div className="text-sm text-gray-600 dark:text-gray-300 bg-pink-50 dark:bg-pink-900/30 p-3 rounded-lg">
                  <p className="mb-2">この操作により以下が実行されます：</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>妊娠モードに切り替わります</li>
                    <li>妊娠週数の計算が開始されます</li>
                    <li>妊娠記録が利用可能になります</li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={() => setShowPregnancyConfirmModal(false)}
                  className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 active:bg-gray-300 dark:active:bg-gray-500 rounded-lg transition-colors min-h-[44px] touch-manipulation"
                >
                  キャンセル
                </button>
                <button
                  onClick={handlePregnancyConfirm}
                  className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 active:bg-pink-800 rounded-lg transition-colors min-h-[44px] touch-manipulation"
                >
                  確認
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* End Pregnancy Confirmation Modal */}
      {showEndPregnancyModal &&
        createPortal(
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 p-4 sm:p-6">
              <div className="flex items-center mb-4">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 mr-2 sm:mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">妊娠記録の終了</h3>
              </div>

              <div className="mb-4 sm:mb-6">
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-3">妊娠記録を終了して保存しますか？</p>
                <div className="text-sm text-gray-600 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
                  <p className="mb-2">この操作により以下が実行されます：</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>現在の妊娠記録が完了記録として保存されます</li>
                    <li>妊娠期間: {calculatePregnancyWeeks().weeks}週 {calculatePregnancyWeeks().days}日</li>
                    <li>記録した症状や検査結果が保持されます</li>
                    <li>新しい妊娠記録を開始できるようになります</li>
                  </ul>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">※ 保存された記録は後から「すべて見る」で確認できます</p>
              </div>

              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={() => setShowEndPregnancyModal(false)}
                  className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 active:bg-gray-300 dark:active:bg-gray-500 rounded-lg transition-colors min-h-[44px] touch-manipulation"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleEndPregnancy}
                  className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-colors min-h-[44px] touch-manipulation"
                >
                  保存して終了
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Cancel Pregnancy Confirmation Modal */}
      {showCancelPregnancyModal &&
        createPortal(
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 p-4 sm:p-6">
              <div className="flex items-center mb-4">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 mr-2 sm:mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">妊娠状態の取り消し</h3>
              </div>

              <div className="mb-4 sm:mb-6">
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-3">妊娠状態を取り消しますか？この操作により以下のデータが削除されます：</p>
                <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc list-inside space-y-1 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <li>妊娠開始日</li>
                  <li>妊娠週数の記録</li>
                  <li>妊娠中として保存された記録（妊活記録は保持されます）</li>
                </ul>
                <p className="text-sm text-red-600 dark:text-red-400 mt-3 font-medium">この操作は取り消すことができません。</p>
              </div>

              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={() => setShowCancelPregnancyModal(false)}
                  className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 active:bg-gray-300 dark:active:bg-gray-500 rounded-lg transition-colors min-h-[44px] touch-manipulation"
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
          </div>,
          document.body
        )}

      {/* Pregnancy History Modal */}
      {showHistoryModal &&
        createPortal(
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full mx-4 p-4 sm:p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">過去の妊娠記録</h3>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {pregnancyHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">保存された妊娠記録がありません</p>
                    <p className="text-gray-400 dark:text-gray-500 text-xs mt-2">妊娠記録を終了すると、ここに記録が保存されます</p>
                  </div>
                ) : (
                  pregnancyHistory.map((history, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">妊娠記録 #{index + 1}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            期間: {history.start_date} 〜 {history.end_date}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            妊娠期間: {history.duration_weeks}週 {history.duration_days}日
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500 dark:text-gray-400">{history.records_data?.length || 0} 件の記録</p>
                          <button
                            onClick={() => {
                              setSelectedHistoryRecord(history);
                              setShowHistoryDetailModal(true);
                              setShowHistoryModal(false);
                            }}
                            className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 active:text-primary-800 dark:active:text-primary-200 hover:underline"
                          >
                            詳細を見る
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-lg transition-colors"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

    </div>
  );
};
