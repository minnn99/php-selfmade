import React, { useState, useEffect } from "react";
import { menstrualCycleAPI, dailySymptomsAPI } from "../../services/api";

interface CycleStats {
  averageCycleLength: number;
  averagePeriodLength: number;
  totalCycles: number;
  shortestCycle: number;
  longestCycle: number;
  lastCycleLength: number;
  irregularityScore: number;
}

interface SymptomStats {
  mostCommonSymptoms: Array<{ symptom: string; frequency: number; percentage: number }>;
  symptomsByPhase: {
    menstrual: Array<{ symptom: string; count: number }>;
    follicular: Array<{ symptom: string; count: number }>;
    ovulatory: Array<{ symptom: string; count: number }>;
    luteal: Array<{ symptom: string; count: number }>;
  };
}

interface CycleData {
  id?: number;
  start_date: string;
  end_date?: string;
  symptoms?: string[];
  flow_intensity?: number;
  [key: string]: unknown;
}

interface DailySymptomsData {
  symptoms?: string[];
  flowIntensity?: number;
  [key: string]: unknown;
}

interface FlowStats {
  averageFlowIntensity: number;
  flowDistribution: Array<{ intensity: number; count: number; percentage: number }>;
}

export const Statistics: React.FC = () => {
  const [cycleStats, setCycleStats] = useState<CycleStats | null>(null);
  const [symptomStats, setSymptomStats] = useState<SymptomStats | null>(null);
  const [flowStats, setFlowStats] = useState<FlowStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"3months" | "6months" | "1year" | "all">("6months");
  const [loadingTimeoutId, setLoadingTimeoutId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadStatistics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  // カレンダーデータ更新時に統計を再読み込み
  useEffect(() => {
    const handleDataUpdate = () => {
      // デバウンス機能付きで統計を再読み込み
      loadStatistics(true);
    };

    window.addEventListener("menstrualDataUpdated", handleDataUpdate);
    return () => {
      window.removeEventListener("menstrualDataUpdated", handleDataUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 周期データに日別症状データを統合する関数（バッチAPI使用）

  const loadStatistics = async (debounced = false) => {
    // デバウンス処理：連続呼び出しを防ぐ
    if (debounced) {
      if (loadingTimeoutId) {
        clearTimeout(loadingTimeoutId);
      }

      const timeoutId = setTimeout(() => {
        loadStatistics(false);
      }, 300);

      setLoadingTimeoutId(timeoutId);
      return;
    }

    setLoading(true);
    setError(null);
    // データ取得中は既存の統計データを保持
    try {
      // 基本的な周期データを取得
      const cyclesResponse = await menstrualCycleAPI.getCycles();

      const cycles = Array.isArray(cyclesResponse.data) ? (cyclesResponse.data as CycleData[]) : [];

      if (cycles.length > 0) {
        await calculateStatistics(cycles);
      } else {
        // データがない場合の状態をリセット
        setCycleStats(null);
        setSymptomStats(null);
        setFlowStats(null);
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "統計データの読み込みに失敗しました");
      // エラー時は既存データを保持（リセットしない）
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = async (cycles: CycleData[]) => {
    // 完了した周期のみを対象とする
    let completedCycles = cycles.filter((cycle) => cycle.end_date);

    // 時間範囲でフィルタリング
    const now = new Date();
    const cutoffDate = new Date();

    switch (timeRange) {
      case "3months":
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case "6months":
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case "1year":
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      case "all":
      default:
        cutoffDate.setFullYear(1900); // 全期間の場合は過去の日付に設定
        break;
    }

    completedCycles = completedCycles.filter((cycle) => new Date(cycle.start_date) >= cutoffDate);

    if (completedCycles.length === 0) {
      setCycleStats(null);
      setSymptomStats(null);
      setFlowStats(null);
      return;
    }

    // 周期統計の計算
    const cycleLengths = completedCycles.map((cycle) => {
      const start = new Date(cycle.start_date);
      const end = cycle.end_date ? new Date(cycle.end_date) : new Date();
      return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    });

    const periodLengths = completedCycles.map((cycle) => {
      const start = new Date(cycle.start_date);
      const end = cycle.end_date ? new Date(cycle.end_date) : new Date();
      return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    });

    const avgCycleLength = cycleLengths.reduce((sum, length) => sum + length, 0) / cycleLengths.length;
    const avgPeriodLength = periodLengths.reduce((sum, length) => sum + length, 0) / periodLengths.length;

    // 不規則性スコアの計算（標準偏差ベース）
    const variance = cycleLengths.reduce((sum, length) => sum + Math.pow(length - avgCycleLength, 2), 0) / cycleLengths.length;
    const stdDev = Math.sqrt(variance);
    const irregularityScore = Math.min(100, (stdDev / avgCycleLength) * 100);

    setCycleStats({
      averageCycleLength: Math.round(avgCycleLength),
      averagePeriodLength: Math.round(avgPeriodLength),
      totalCycles: completedCycles.length,
      shortestCycle: Math.min(...cycleLengths),
      longestCycle: Math.max(...cycleLengths),
      lastCycleLength: cycleLengths[cycleLengths.length - 1] || 0,
      irregularityScore: Math.round(irregularityScore),
    });

    // 症状統計の計算 - 日別症状データも直接収集
    const allSymptoms: string[] = [];
    const symptomsWithPhase: Array<{ symptom: string; phase: "menstrual" | "follicular" | "ovulatory" | "luteal"; date: string }> = [];
    const symptomsByPhase = {
      menstrual: [] as Array<{ symptom: string; count: number }>,
      follicular: [] as Array<{ symptom: string; count: number }>,
      ovulatory: [] as Array<{ symptom: string; count: number }>,
      luteal: [] as Array<{ symptom: string; count: number }>,
    };

    // 日付から周期段階を判定する関数（次回周期開始日前も考慮）
    const getCyclePhase = (date: string, cycleArray: CycleData[]): "menstrual" | "follicular" | "ovulatory" | "luteal" => {
      const targetDate = new Date(date);

      // 日付順にソートされた周期を作成
      const sortedCycles = [...cycleArray].sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

      // 適切な周期を見つける
      let appropriateCycle: CycleData | null = null;

      for (let i = 0; i < sortedCycles.length; i++) {
        const cycle = sortedCycles[i];
        const cycleStart = new Date(cycle.start_date);
        const nextCycle = sortedCycles[i + 1];

        if (nextCycle) {
          // 次の周期がある場合：現在の周期開始日から次の周期開始日の前日まで
          const nextCycleStart = new Date(nextCycle.start_date);
          const cycleEnd = new Date(nextCycleStart.getTime() - 24 * 60 * 60 * 1000); // 前日

          if (targetDate >= cycleStart && targetDate <= cycleEnd) {
            appropriateCycle = cycle;
            break;
          }
        } else {
          // 最後の周期の場合：開始日から35日後まで
          const cycleEnd = new Date(cycleStart.getTime() + 35 * 24 * 60 * 60 * 1000);

          if (targetDate >= cycleStart && targetDate <= cycleEnd) {
            appropriateCycle = cycle;
            break;
          }
        }
      }

      // 適切な周期が見つからない場合は最も近い周期を使用
      if (!appropriateCycle) {
        let minDistance = Infinity;
        sortedCycles.forEach((cycle) => {
          const startDate = new Date(cycle.start_date);
          const distance = Math.abs(targetDate.getTime() - startDate.getTime());
          if (distance < minDistance) {
            minDistance = distance;
            appropriateCycle = cycle;
          }
        });
      }

      if (!appropriateCycle) return "follicular";

      const cycle = appropriateCycle as CycleData;
      const cycleStart = new Date(cycle.start_date);
      const dayOfCycle = Math.floor((targetDate.getTime() - cycleStart.getTime()) / (24 * 60 * 60 * 1000)) + 1;

      // 実際の生理終了日がある場合はそれを使用、なければデフォルト5日
      let menstrualEndDay = 5;
      if (cycle.end_date && cycle.start_date) {
        const actualMenstrualLength = Math.floor((new Date(cycle.end_date).getTime() - new Date(cycle.start_date).getTime()) / (24 * 60 * 60 * 1000)) + 1;
        if (actualMenstrualLength > 0 && actualMenstrualLength <= 10) {
          menstrualEndDay = actualMenstrualLength;
        }
      }

      // 周期段階の判定（マイナス値の場合は生理前として扱う）
      if (dayOfCycle < 1) return "luteal"; // 次回生理開始日前は生理前
      if (dayOfCycle >= 1 && dayOfCycle <= menstrualEndDay) return "menstrual";
      else if (dayOfCycle > menstrualEndDay && dayOfCycle <= 11) return "follicular";
      else if (dayOfCycle > 11 && dayOfCycle <= 18) return "ovulatory";
      else return "luteal";
    };

    // 日別症状データのみを使用（DB優先アプローチ）
    // 全ての周期を含め、現在までのデータを取得
    const allCycles = cycles; // 完了した周期だけでなく全ての周期を対象

    if (allCycles.length > 0) {
      // 時間範囲に基づいて期間を設定
      const now = new Date();
      const cutoffDate = new Date();

      switch (timeRange) {
        case "3months":
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
        case "6months":
          cutoffDate.setMonth(now.getMonth() - 6);
          break;
        case "1year":
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
        case "all":
        default:
          cutoffDate.setFullYear(1900);
          break;
      }

      const earliestDate = cutoffDate.toISOString().split("T")[0];
      // 将来の日付も含めるため、現在日付の30日後まで取得
      const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const latestDate = futureDate.toISOString().split("T")[0];

      // APIから症状データを取得
      const processedDates = new Set<string>();

      try {
        const response = await dailySymptomsAPI.getSymptomsRange(earliestDate, latestDate);
        if (response.success && response.data) {
          // レスポンスデータが配列の場合の処理
          if (Array.isArray(response.data)) {
            response.data.forEach((dayData: DailySymptomsData) => {
              if (dayData.symptoms && Array.isArray(dayData.symptoms) && dayData.date) {
                const dateStr = String(dayData.date);
                processedDates.add(dateStr);
                const phase = getCyclePhase(dateStr, allCycles);
                dayData.symptoms.forEach((symptom) => {
                  allSymptoms.push(symptom);
                  symptomsWithPhase.push({ symptom, phase, date: dateStr });
                });
              }
            });
          }
          // レスポンスデータがオブジェクトの場合の処理
          else if (typeof response.data === "object" && response.data !== null) {
            Object.entries(response.data).forEach(([date, dayData]) => {
              if (dayData && typeof dayData === "object" && (dayData as DailySymptomsData).symptoms && Array.isArray((dayData as DailySymptomsData).symptoms)) {
                const dateStr = date.split(" ")[0]; // "2025-08-05 00:00:00" -> "2025-08-05"

                // 重複した日付をスキップ
                if (processedDates.has(dateStr)) {
                  return;
                }
                processedDates.add(dateStr);

                const phase = getCyclePhase(dateStr, allCycles);

                (dayData as DailySymptomsData).symptoms!.forEach((symptom) => {
                  allSymptoms.push(symptom);
                  symptomsWithPhase.push({ symptom, phase, date: dateStr });
                });
              }
            });
          }
        }
      } catch {
        // Silent error handling - failed to get symptoms range
      }
    }

    // 症状の周期別分類（日付ベースで正確に分類）
    symptomsWithPhase.forEach(({ symptom, phase }) => {
      const existing = symptomsByPhase[phase].find((s) => s.symptom === symptom);
      if (existing) {
        existing.count++;
      } else {
        symptomsByPhase[phase].push({ symptom, count: 1 });
      }
    });

    const symptomCounts = allSymptoms.reduce((acc: Record<string, number>, symptom) => {
      acc[symptom] = (acc[symptom] || 0) + 1;
      return acc;
    }, {});

    const totalSymptomCount = allSymptoms.length;
    const mostCommonSymptoms = Object.entries(symptomCounts)
      .map(([symptom, count]) => ({
        symptom,
        frequency: count,
        percentage: Math.round((count / totalSymptomCount) * 100),
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    // 各フェーズの症状を頻度順にソート
    (Object.keys(symptomsByPhase) as Array<keyof typeof symptomsByPhase>).forEach((phase) => {
      symptomsByPhase[phase].sort((a, b) => b.count - a.count);
    });

    const finalSymptomStats = {
      mostCommonSymptoms,
      symptomsByPhase,
    };

    setSymptomStats(finalSymptomStats);

    // 流量統計の計算 - 日別症状データから流量データを収集

    // 周期データからの流量データ
    const cycleFlowIntensities = allCycles.filter((cycle) => cycle.flow_intensity).map((cycle) => cycle.flow_intensity);

    // 日別症状データから流量データを収集
    const allFlowIntensities = [...cycleFlowIntensities];

    // 範囲でAPIから症状データを取得
    if (allCycles.length > 0) {
      try {
        // 時間範囲に基づいて期間を設定
        const now = new Date();
        const cutoffDate = new Date();

        switch (timeRange) {
          case "3months":
            cutoffDate.setMonth(now.getMonth() - 3);
            break;
          case "6months":
            cutoffDate.setMonth(now.getMonth() - 6);
            break;
          case "1year":
            cutoffDate.setFullYear(now.getFullYear() - 1);
            break;
          case "all":
          default:
            cutoffDate.setFullYear(1900);
            break;
        }

        const flowEarliestDate = cutoffDate.toISOString().split("T")[0];
        const flowLatestDate = now.toISOString().split("T")[0];

        const response = await dailySymptomsAPI.getSymptomsRange(flowEarliestDate, flowLatestDate);
        if (response.success && response.data) {
          const flowProcessedDates = new Set<string>();

          // レスポンスデータが配列の場合の処理
          if (Array.isArray(response.data)) {
            response.data.forEach((dayData: DailySymptomsData) => {
              if (dayData.flowIntensity && dayData.flowIntensity > 0 && dayData.date) {
                const dateStr = String(dayData.date);
                if (!flowProcessedDates.has(dateStr)) {
                  flowProcessedDates.add(dateStr);
                  allFlowIntensities.push(dayData.flowIntensity);
                }
              }
            });
          }
          // レスポンスデータがオブジェクトの場合の処理
          else if (typeof response.data === "object" && response.data !== null) {
            Object.entries(response.data).forEach(([date, dayData]) => {
              if (dayData && typeof dayData === "object" && (dayData as DailySymptomsData).flowIntensity && (dayData as DailySymptomsData).flowIntensity! > 0) {
                const dateStr = date.split(" ")[0];
                if (!flowProcessedDates.has(dateStr)) {
                  flowProcessedDates.add(dateStr);
                  allFlowIntensities.push((dayData as DailySymptomsData).flowIntensity!);
                }
              }
            });
          }
        } else {
          // No stored flow data found
        }
      } catch {
        // Silent error handling - failed to get symptoms range for flow data
      }
    }

    // 有効な値のみをフィルタ（重複除去はしない - 各日のデータは独立）
    const flowIntensities = allFlowIntensities.filter((intensity) => intensity && intensity > 0);

    if (flowIntensities.length > 0) {
      const avgFlow =
        flowIntensities.filter((intensity) => intensity != null).reduce((sum: number, intensity: number) => sum + intensity, 0) / flowIntensities.length;

      const flowDistribution = [1, 2, 3, 4, 5].map((intensity) => {
        const count = flowIntensities.filter((f) => f === intensity).length;
        return {
          intensity,
          count,
          percentage: Math.round((count / flowIntensities.length) * 100),
        };
      });

      setFlowStats({
        averageFlowIntensity: Math.round(avgFlow * 10) / 10,
        flowDistribution,
      });
    } else {
      // 流量データがない場合でも基本的な構造を設定
      setFlowStats({
        averageFlowIntensity: 0,
        flowDistribution: [
          { intensity: 1, count: 0, percentage: 0 },
          { intensity: 2, count: 0, percentage: 0 },
          { intensity: 3, count: 0, percentage: 0 },
          { intensity: 4, count: 0, percentage: 0 },
          { intensity: 5, count: 0, percentage: 0 },
        ],
      });
    }
  };

  const getFlowIntensityLabel = (intensity: number): string => {
    const labels = {
      1: "非常に軽い",
      2: "軽い",
      3: "普通",
      4: "重い",
      5: "非常に重い",
    };
    return labels[intensity as keyof typeof labels] || "不明";
  };

  const getIrregularityLevel = (score: number): string => {
    if (score < 10) return "非常に規則的";
    if (score < 20) return "規則的";
    if (score < 30) return "やや不規則";
    if (score < 50) return "不規則";
    return "非常に不規則";
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-medical dark:border-gray-700 p-4 sm:p-6">
        <div className="flex items-center justify-center h-32 sm:h-64">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            <div className="text-sm sm:text-base text-gray-500 dark:text-gray-400">統計データを読み込み中...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-medical dark:border-gray-700 p-4 sm:p-6">
        <div className="text-center py-8 sm:py-12">
          <div className="text-red-500 dark:text-red-400 mb-4">
            <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">データの読み込みに失敗しました</h3>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 px-4 mb-4">{error}</p>
          <button
            onClick={() => loadStatistics(false)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 active:bg-primary-800 transition-colors text-sm"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  if (!cycleStats) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-medical dark:border-gray-700 p-4 sm:p-6">
        <div className="text-center py-8 sm:py-12">
          <div className="text-gray-500 dark:text-gray-400 mb-4">
            <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">統計データがありません</h3>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 px-4 mb-4">生理周期データが蓄積されると、ここに統計情報が表示されます。</p>
          <div className="text-xs text-gray-400 dark:text-gray-500">
            選択した期間: {timeRange === "3months" ? "過去3ヶ月" : timeRange === "6months" ? "過去6ヶ月" : timeRange === "1year" ? "過去1年" : "全期間"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-medical dark:border-gray-700 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 dark:text-white">統計・分析</h2>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-gray-300">生理周期と症状の傾向を分析</p>
          </div>
          <div className="flex items-center">
            <div className="flex gap-2">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as "3months" | "6months" | "1year" | "all")}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[44px] w-full sm:w-auto touch-manipulation bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="3months">過去3ヶ月</option>
                <option value="6months">過去6ヶ月</option>
                <option value="1year">過去1年</option>
                <option value="all">全期間</option>
              </select>
            </div>
          </div>
        </div>

        {/* 周期統計概要 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="text-center p-3 sm:p-4 bg-primary-50 dark:bg-primary-900/30 rounded-lg min-h-[80px] sm:min-h-[100px] flex flex-col justify-center">
            <div className="text-lg sm:text-2xl font-bold text-primary-600 dark:text-primary-400 mb-1">{cycleStats.averageCycleLength}</div>
            <div className="text-xs sm:text-sm text-primary-700 dark:text-primary-300 leading-tight">平均周期長</div>
            <div className="text-xs text-primary-600 dark:text-primary-400 mt-0.5">日</div>
          </div>
          <div className="text-center p-3 sm:p-4 bg-red-50 dark:bg-red-900/30 rounded-lg min-h-[80px] sm:min-h-[100px] flex flex-col justify-center">
            <div className="text-lg sm:text-2xl font-bold text-red-600 dark:text-red-400 mb-1">{cycleStats.averagePeriodLength}</div>
            <div className="text-xs sm:text-sm text-red-700 dark:text-red-300 leading-tight">平均生理期間</div>
            <div className="text-xs text-red-600 dark:text-red-400 mt-0.5">日</div>
          </div>
          <div className="text-center p-3 sm:p-4 bg-green-50 dark:bg-green-900/30 rounded-lg min-h-[80px] sm:min-h-[100px] flex flex-col justify-center">
            <div className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400 mb-1">{cycleStats.totalCycles}</div>
            <div className="text-xs sm:text-sm text-green-700 dark:text-green-300 leading-tight">記録した周期</div>
            <div className="text-xs text-green-600 dark:text-green-400 mt-0.5">回</div>
          </div>
          <div className="text-center p-3 sm:p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg min-h-[80px] sm:min-h-[100px] flex flex-col justify-center">
            <div className="text-lg sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">{cycleStats.irregularityScore}%</div>
            <div className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-300 leading-tight">不規則性</div>
            <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-0.5 truncate">{getIrregularityLevel(cycleStats.irregularityScore)}</div>
          </div>
        </div>
      </div>

      {/* 詳細統計 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* 周期の詳細 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-medical dark:border-gray-700 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">周期の詳細</h3>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex justify-between items-center py-2 sm:py-3 border-b border-gray-100 dark:border-gray-700">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">最短周期</span>
              <span className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">{cycleStats.shortestCycle}日</span>
            </div>
            <div className="flex justify-between items-center py-2 sm:py-3 border-b border-gray-100 dark:border-gray-700">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">最長周期</span>
              <span className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">{cycleStats.longestCycle}日</span>
            </div>
            <div className="flex justify-between items-center py-2 sm:py-3 border-b border-gray-100 dark:border-gray-700">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">前回の周期長</span>
              <span className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">{cycleStats.lastCycleLength}日</span>
            </div>
            <div className="flex justify-between items-center py-2 sm:py-3">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">周期の範囲</span>
              <span className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">{cycleStats.longestCycle - cycleStats.shortestCycle}日</span>
            </div>
          </div>
        </div>

        {/* 流量統計 */}
        {flowStats && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-medical dark:border-gray-700 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">流量の傾向</h3>
            <div className="mb-3 sm:mb-4">
              <div className="text-center p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <div className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400 mb-1">{flowStats.averageFlowIntensity}</div>
                <div className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">平均流量強度</div>
              </div>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {flowStats.flowDistribution.map((flow) => (
                <div key={flow.intensity} className="flex items-center justify-between gap-2 sm:gap-3">
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 flex-shrink-0 w-16 sm:w-20 text-left">{getFlowIntensityLabel(flow.intensity)}</span>
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <div className="bg-gray-200 dark:bg-gray-600 rounded-full h-2 flex-1 min-w-[40px]">
                      <div className="bg-blue-500 dark:bg-blue-400 h-2 rounded-full" style={{ width: `${flow.percentage}%` }}></div>
                    </div>
                    <span className="text-xs sm:text-sm font-medium w-8 sm:w-10 text-right flex-shrink-0 text-gray-900 dark:text-white">{flow.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 症状統計 */}
      {symptomStats && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-medical dark:border-gray-700 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">よく見られる症状</h3>
          {symptomStats.mostCommonSymptoms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <h4 className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">症状の頻度</h4>
                <div className="space-y-2 sm:space-y-3">
                  {symptomStats.mostCommonSymptoms.slice(0, 5).map((symptom, index) => (
                    <div key={symptom.symptom} className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                          {index + 1}
                        </div>
                        <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 truncate max-w-[80px] sm:max-w-none">{symptom.symptom}</span>
                      </div>
                      <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0 min-w-[60px] sm:min-w-[80px]">
                        <div className="bg-gray-200 dark:bg-gray-600 rounded-full h-2 flex-1 min-w-[30px] sm:min-w-[40px]">
                          <div className="bg-purple-500 dark:bg-purple-400 h-2 rounded-full" style={{ width: `${symptom.percentage}%` }}></div>
                        </div>
                        <span className="text-xs sm:text-sm font-medium w-8 text-right text-gray-900 dark:text-white">{symptom.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">症状の回数</h4>
                <div className="space-y-1 sm:space-y-2">
                  {symptomStats.mostCommonSymptoms.slice(0, 5).map((symptom) => (
                    <div key={symptom.symptom} className="flex justify-between items-center py-1 gap-2">
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate max-w-[100px] sm:max-w-none">{symptom.symptom}</span>
                      <span className="text-xs sm:text-sm font-medium flex-shrink-0 text-gray-900 dark:text-white">{symptom.frequency}回</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-500 dark:text-gray-400 mb-2">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">症状データがありません</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">カレンダーで症状を記録すると、ここに統計情報が表示されます。</p>
            </div>
          )}
        </div>
      )}

      {/* 周期別症状分析 */}
      {symptomStats && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-medical dark:border-gray-700 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">周期別症状分析</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 生理日 */}
            <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-lg">
              <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2 flex items-center">
                <div className="w-3 h-3 bg-red-500 dark:bg-red-400 rounded-full mr-2"></div>
                生理日
              </h4>
              <div className="space-y-1">
                {symptomStats.symptomsByPhase.menstrual.slice(0, 5).map((symptom) => (
                  <div key={symptom.symptom} className="flex justify-between items-center text-xs">
                    <span className="text-red-700 dark:text-red-300 truncate">{symptom.symptom}</span>
                    <span className="text-red-600 dark:text-red-400 font-medium">{symptom.count}</span>
                  </div>
                ))}
                {symptomStats.symptomsByPhase.menstrual.length === 0 && <span className="text-xs text-red-600 dark:text-red-400">データなし</span>}
              </div>
            </div>

            {/* 生理後 */}
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2 flex items-center">
                <div className="w-3 h-3 bg-blue-500 dark:bg-blue-400 rounded-full mr-2"></div>
                生理後
              </h4>
              <div className="space-y-1">
                {symptomStats.symptomsByPhase.follicular.slice(0, 5).map((symptom) => (
                  <div key={symptom.symptom} className="flex justify-between items-center text-xs">
                    <span className="text-blue-700 dark:text-blue-300 truncate">{symptom.symptom}</span>
                    <span className="text-blue-600 dark:text-blue-400 font-medium">{symptom.count}</span>
                  </div>
                ))}
                {symptomStats.symptomsByPhase.follicular.length === 0 && <span className="text-xs text-blue-600 dark:text-blue-400">データなし</span>}
              </div>
            </div>

            {/* 排卵日周辺 */}
            <div className="p-3 bg-pink-50 dark:bg-pink-900/30 rounded-lg">
              <h4 className="text-sm font-medium text-pink-800 dark:text-pink-200 mb-2 flex items-center">
                <div className="w-3 h-3 bg-pink-500 dark:bg-pink-400 rounded-full mr-2"></div>
                排卵日周辺
              </h4>
              <div className="space-y-1">
                {symptomStats.symptomsByPhase.ovulatory.slice(0, 5).map((symptom) => (
                  <div key={symptom.symptom} className="flex justify-between items-center text-xs">
                    <span className="text-pink-700 dark:text-pink-300 truncate">{symptom.symptom}</span>
                    <span className="text-pink-600 dark:text-pink-400 font-medium">{symptom.count}</span>
                  </div>
                ))}
                {symptomStats.symptomsByPhase.ovulatory.length === 0 && <span className="text-xs text-pink-600 dark:text-pink-400">データなし</span>}
              </div>
            </div>

            {/* 生理前 */}
            <div className="p-3 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
              <h4 className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-2 flex items-center">
                <div className="w-3 h-3 bg-orange-500 dark:bg-orange-400 rounded-full mr-2"></div>
                生理前
              </h4>
              <div className="space-y-1">
                {symptomStats.symptomsByPhase.luteal.slice(0, 5).map((symptom) => (
                  <div key={symptom.symptom} className="flex justify-between items-center text-xs">
                    <span className="text-orange-700 dark:text-orange-300 truncate">{symptom.symptom}</span>
                    <span className="text-orange-600 dark:text-orange-400 font-medium">{symptom.count}</span>
                  </div>
                ))}
                {symptomStats.symptomsByPhase.luteal.length === 0 && <span className="text-xs text-orange-600 dark:text-orange-400">データなし</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 健康指標の詳細 */}
      {cycleStats && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-medical dark:border-gray-700 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">健康指標の詳細</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 周期安定性 */}
            <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">周期安定性</h4>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">{cycleStats.irregularityScore}%</span>
                <div
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    cycleStats.irregularityScore < 20
                      ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                      : cycleStats.irregularityScore < 50
                      ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                      : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                  }`}
                >
                  {getIrregularityLevel(cycleStats.irregularityScore)}
                </div>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">変動幅: {cycleStats.longestCycle - cycleStats.shortestCycle}日</div>
            </div>

            {/* 予測精度 */}
            <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">予測精度</h4>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{cycleStats.totalCycles >= 3 ? Math.max(60, 100 - cycleStats.irregularityScore) : 0}%</span>
                <div
                  className={`px-2 py-1 rounded text-xs font-medium ${cycleStats.totalCycles >= 3 ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300" : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"}`}
                >
                  {cycleStats.totalCycles >= 3 ? "利用可能" : "データ不足"}
                </div>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">データ数: {cycleStats.totalCycles}周期</div>
            </div>

            {/* 健康状態スコア */}
            <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">健康状態スコア</h4>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {Math.round(
                    (cycleStats.averageCycleLength >= 21 && cycleStats.averageCycleLength <= 35 ? 40 : 20) +
                      (cycleStats.irregularityScore < 20 ? 40 : cycleStats.irregularityScore < 50 ? 20 : 0) +
                      (cycleStats.totalCycles >= 3 ? 20 : 10)
                  )}
                </span>
                <div className="px-2 py-1 rounded text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300">/100</div>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">総合評価</div>
            </div>
          </div>
        </div>
      )}

      {/* 分析とアドバイス */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-medical dark:border-gray-700 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">分析とアドバイス</h3>
        <div className="space-y-3 sm:space-y-4">
          {/* 周期の規則性についてのアドバイス */}
          <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <h4 className="text-sm sm:text-base font-medium text-blue-900 dark:text-blue-200 mb-1 sm:mb-2">周期の規則性</h4>
            <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
              {cycleStats.irregularityScore < 20
                ? "あなたの周期は規則的です。このまま良好な健康状態を維持しましょう。"
                : cycleStats.irregularityScore < 50
                ? "周期にやや変動が見られます。ストレスや生活習慣の変化が影響している可能性があります。"
                : "周期が不規則になっています。医師に相談することをお勧めします。"}
            </p>
          </div>

          {/* 周期長についてのアドバイス */}
          <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
            <h4 className="text-sm sm:text-base font-medium text-green-900 dark:text-green-200 mb-1 sm:mb-2">周期長について</h4>
            <p className="text-xs sm:text-sm text-green-800 dark:text-green-300 leading-relaxed">
              {cycleStats.averageCycleLength >= 21 && cycleStats.averageCycleLength <= 35
                ? "平均周期長は正常範囲内（21-35日）です。"
                : cycleStats.averageCycleLength < 21
                ? "周期が短めです（21日未満）。医師に相談することをお勧めします。"
                : "周期が長めです（35日超）。医師に相談することをお勧めします。"}
            </p>
          </div>

          {/* 次回予測 */}
          <div className="p-3 sm:p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
            <h4 className="text-sm sm:text-base font-medium text-purple-900 dark:text-purple-200 mb-1 sm:mb-2">パターンの傾向</h4>
            <p className="text-xs sm:text-sm text-purple-800 dark:text-purple-300 leading-relaxed">
              過去{cycleStats.totalCycles}回の周期を基に、あなたの平均周期は{cycleStats.averageCycleLength}日です。 生理期間は平均
              {cycleStats.averagePeriodLength}日続いています。
            </p>
          </div>

          {/* PMS傾向分析 */}
          {symptomStats && (
            <div className="p-3 sm:p-4 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
              <h4 className="text-sm sm:text-base font-medium text-orange-900 dark:text-orange-200 mb-1 sm:mb-2">PMS傾向分析</h4>
              <p className="text-xs sm:text-sm text-orange-800 dark:text-orange-300 leading-relaxed">
                {symptomStats.symptomsByPhase.luteal.length > 0
                  ? `黄体期に${symptomStats.symptomsByPhase.luteal.length}種類の症状が記録されています。最も多いのは「${symptomStats.symptomsByPhase.luteal[0]?.symptom}」です。`
                  : "黄体期の症状データが不足しています。日々の症状記録を継続することで、PMS傾向の把握が可能になります。"}
              </p>
            </div>
          )}

          {/* 健康状態の改善提案 */}
          <div className="p-3 sm:p-4 bg-teal-50 dark:bg-teal-900/30 rounded-lg">
            <h4 className="text-sm sm:text-base font-medium text-teal-900 dark:text-teal-200 mb-1 sm:mb-2">健康管理のアドバイス</h4>
            <p className="text-xs sm:text-sm text-teal-800 dark:text-teal-300 leading-relaxed">
              {cycleStats.totalCycles >= 3
                ? "十分なデータが蓄積されています。定期的な婦人科検診と健康的な生活習慣の維持をお勧めします。"
                : "より正確な分析のため、引き続き周期データの記録をお続けください。3周期以上のデータで傾向がより明確になります。"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
