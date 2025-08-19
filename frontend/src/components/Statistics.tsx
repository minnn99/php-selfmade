import React, { useState, useEffect } from "react";
import { menstrualCycleAPI, dailySymptomsAPI } from "../services/api";

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
  const [loadingTimeoutId, setLoadingTimeoutId] = useState<number | null>(null);

  useEffect(() => {
    loadStatistics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  // カレンダーデータ更新時に統計を再読み込み
  useEffect(() => {
    const handleDataUpdate = () => {
      console.log("Statistics: Menstrual data updated, reloading statistics...");
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
  const enrichCyclesWithDailySymptoms = async (cycles: CycleData[]) => {
    console.log("Statistics: Starting symptoms enrichment for", cycles.length, "cycles");

    if (cycles.length === 0) {
      return cycles;
    }

    // 全周期の開始日と終了日の範囲を取得
    const allDates = cycles.map((cycle) => ({
      start: cycle.start_date,
      end: cycle.end_date || new Date().toISOString().split("T")[0],
    }));

    const earliestDate = allDates.reduce((min, cycle) => (cycle.start < min ? cycle.start : min), allDates[0].start);
    const latestDate = allDates.reduce((max, cycle) => (cycle.end > max ? cycle.end : max), allDates[0].end);

    console.log(`Statistics: Fetching symptoms data from ${earliestDate} to ${latestDate}`);

    // バッチAPIで期間内の全症状データを一括取得
    let allSymptomsData: Record<string, DailySymptomsData> = {};
    try {
      const response = await dailySymptomsAPI.getSymptomsRange(earliestDate, latestDate);
      if (response.success && response.data) {
        allSymptomsData = response.data as Record<string, DailySymptomsData>;
        console.log("Statistics: Batch API response:", allSymptomsData);
      }
    } catch {
      console.log("Statistics: Failed to fetch symptoms data from API, using local storage fallback");
    }

    // 各周期に症状データを統合
    const enrichedCycles = cycles.map((cycle) => {
      const enrichedCycle = { ...cycle };
      const allSymptoms = [...(cycle.symptoms || [])];
      console.log(`Statistics: Processing cycle ${cycle.id}, original symptoms:`, cycle.symptoms);

      if (cycle.start_date) {
        const startDate = new Date(cycle.start_date);
        const endDate = cycle.end_date ? new Date(cycle.end_date) : new Date();

        // 周期期間内の各日の症状データを統合
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split("T")[0];

          // APIから取得したデータを使用
          if (allSymptomsData[dateStr] && allSymptomsData[dateStr].symptoms) {
            allSymptoms.push(...allSymptomsData[dateStr].symptoms);
            console.log(`Statistics: Added API symptoms for ${dateStr}:`, allSymptomsData[dateStr].symptoms);
          }

          // APIにデータがない場合はローカルストレージからフォールバック
          if (!allSymptomsData[dateStr]) {
            try {
              const localData = localStorage.getItem(`daily-symptoms-${dateStr}`);
              if (localData) {
                const parsed = JSON.parse(localData);
                if (parsed.symptoms && Array.isArray(parsed.symptoms) && parsed.symptoms.length > 0) {
                  allSymptoms.push(...parsed.symptoms);
                  console.log(`Statistics: Added local symptoms for ${dateStr}:`, parsed.symptoms);
                }
              }
            } catch (error) {
              console.log(`Statistics: Failed to parse local symptoms for ${dateStr}:`, error);
            }
          }
        }
      }

      // 重複を除去して統合
      const uniqueSymptoms = [...new Set(allSymptoms)];
      enrichedCycle.symptoms = uniqueSymptoms;
      console.log(`Statistics: Final symptoms for cycle ${cycle.id}:`, uniqueSymptoms);

      return enrichedCycle;
    });

    console.log("Statistics: Symptoms enrichment completed, enriched cycles:", enrichedCycles);
    return enrichedCycles;
  };

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
      // 認証情報を確認
      const authData = localStorage.getItem("auth_data");
      console.log("Statistics: Auth data exists:", !!authData);
      if (authData) {
        const parsed = JSON.parse(authData);
        console.log("Statistics: User email:", parsed.user?.email);
        console.log("Statistics: Token exists:", !!parsed.token);
      }

      // 基本的な周期データを取得
      console.log("Statistics: Loading cycle data...");
      const cyclesResponse = await menstrualCycleAPI.getCycles();
      console.log("Statistics: API Response:", cyclesResponse);

      const cycles = Array.isArray(cyclesResponse.data) ? cyclesResponse.data as CycleData[] : [];
      console.log("Statistics: Extracted cycles:", cycles);
      console.log("Statistics: Cycles count:", cycles.length);

      // 日別症状データも取得して統合
      console.log("Statistics: Loading daily symptoms data...");
      const enrichedCycles = await enrichCyclesWithDailySymptoms(cycles);
      console.log("Statistics: Enriched cycles with daily symptoms:", enrichedCycles);

      if (enrichedCycles.length > 0) {
        console.log("Statistics: Calculating statistics for", enrichedCycles.length, "enriched cycles");
        await calculateStatistics(enrichedCycles);
      } else {
        console.log("Statistics: No cycles found, resetting stats");
        // データがない場合の状態をリセット
        setCycleStats(null);
        setSymptomStats(null);
        setFlowStats(null);
      }
    } catch (error: unknown) {
      console.error("Failed to load statistics:", error);
      setError(error instanceof Error ? error.message : "統計データの読み込みに失敗しました");
      // エラー時は既存データを保持（リセットしない）
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = async (cycles: CycleData[]) => {
    console.log("Statistics: Starting calculation with cycles:", cycles);

    // 完了した周期のみを対象とする
    let completedCycles = cycles.filter((cycle) => cycle.end_date);
    console.log("Statistics: Completed cycles (with end_date):", completedCycles);

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

    console.log("Statistics: Time range filter:", timeRange, "cutoff date:", cutoffDate);

    completedCycles = completedCycles.filter((cycle) => new Date(cycle.start_date) >= cutoffDate);

    console.log("Statistics: Filtered cycles after time range:", completedCycles);

    if (completedCycles.length === 0) {
      console.log("Statistics: No completed cycles found after filtering");
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
    console.log("Statistics: Starting symptom calculation with cycles:", completedCycles);
    const allSymptoms: string[] = [];
    const symptomsWithPhase: Array<{ symptom: string; phase: 'menstrual' | 'follicular' | 'ovulatory' | 'luteal'; date: string }> = [];
    const symptomsByPhase = {
      menstrual: [] as Array<{ symptom: string; count: number }>,
      follicular: [] as Array<{ symptom: string; count: number }>,
      ovulatory: [] as Array<{ symptom: string; count: number }>,
      luteal: [] as Array<{ symptom: string; count: number }>,
    };

    // 日付から周期段階を判定する関数
    const getCyclePhase = (date: string, cycles: CycleData[]): 'menstrual' | 'follicular' | 'ovulatory' | 'luteal' => {
      const targetDate = new Date(date);
      
      // 該当する周期を見つける
      const cycle = cycles.find(c => {
        const startDate = new Date(c.start_date);
        const endDate = c.end_date ? new Date(c.end_date) : new Date(startDate.getTime() + 35 * 24 * 60 * 60 * 1000); // デフォルト35日
        return targetDate >= startDate && targetDate <= endDate;
      });
      
      if (!cycle) return 'follicular'; // デフォルト
      
      const cycleStart = new Date(cycle.start_date);
      const dayOfCycle = Math.floor((targetDate.getTime() - cycleStart.getTime()) / (24 * 60 * 60 * 1000)) + 1;
      
      // 実際の生理終了日がある場合はそれを使用、なければデフォルト5日
      let menstrualEndDay = 5;
      if (cycle.end_date && cycle.start_date) {
        const actualMenstrualLength = Math.floor((new Date(cycle.end_date).getTime() - new Date(cycle.start_date).getTime()) / (24 * 60 * 60 * 1000)) + 1;
        if (actualMenstrualLength > 0 && actualMenstrualLength <= 10) { // 妥当な範囲
          menstrualEndDay = actualMenstrualLength;
        }
      }
      
      // 周期段階の判定
      if (dayOfCycle <= menstrualEndDay) return 'menstrual';      // 生理期
      else if (dayOfCycle <= 13) return 'follicular'; // 卵胞期
      else if (dayOfCycle <= 16) return 'ovulatory';  // 排卵期
      else return 'luteal';                           // 黄体期
    };

    // 1. 周期データから症状を収集（周期開始日の症状として生理期に分類）
    completedCycles.forEach((cycle) => {
      console.log(`Statistics: Processing cycle ${cycle.id} symptoms:`, cycle.symptoms);
      if (cycle.symptoms && Array.isArray(cycle.symptoms)) {
        console.log(`Statistics: Adding ${cycle.symptoms.length} symptoms from cycle ${cycle.id}`);
        cycle.symptoms.forEach(symptom => {
          allSymptoms.push(symptom);
          // 周期データの症状は生理開始日の症状として扱う
          symptomsWithPhase.push({ symptom, phase: 'menstrual', date: cycle.start_date });
        });
      }
    });

    // 2. 日別症状データから直接収集（API + localStorage）
    if (completedCycles.length > 0) {
      const allDates = completedCycles.map((cycle) => ({
        start: cycle.start_date,
        end: cycle.end_date || new Date().toISOString().split("T")[0],
      }));

      const earliestDate = allDates.reduce((min, cycle) => (cycle.start < min ? cycle.start : min), allDates[0].start);
      const latestDate = allDates.reduce((max, cycle) => (cycle.end > max ? cycle.end : max), allDates[0].end);

      // APIから症状データを取得
      try {
        const response = await dailySymptomsAPI.getSymptomsRange(earliestDate, latestDate);
        if (response.success && response.data) {
          console.log("Statistics: API response data type and structure:", typeof response.data, response.data);

          // レスポンスデータが配列の場合の処理
          if (Array.isArray(response.data)) {
            response.data.forEach((dayData: DailySymptomsData) => {
              if (dayData.symptoms && Array.isArray(dayData.symptoms) && dayData.date) {
                const phase = getCyclePhase(String(dayData.date), completedCycles);
                dayData.symptoms.forEach(symptom => {
                  allSymptoms.push(symptom);
                  symptomsWithPhase.push({ symptom, phase, date: String(dayData.date) });
                });
              }
            });
          }
          // レスポンスデータがオブジェクトの場合の処理
          else if (typeof response.data === "object" && response.data !== null) {
            Object.entries(response.data).forEach(([date, dayData]) => {
              if (dayData && typeof dayData === "object" && (dayData as DailySymptomsData).symptoms && Array.isArray((dayData as DailySymptomsData).symptoms)) {
                const phase = getCyclePhase(date, completedCycles);
                (dayData as DailySymptomsData).symptoms!.forEach(symptom => {
                  allSymptoms.push(symptom);
                  symptomsWithPhase.push({ symptom, phase, date });
                });
              }
            });
          }
        }
      } catch {
        console.log("Statistics: Failed to fetch symptoms range for symptom statistics");
      }

      // ローカルストレージからも収集
      completedCycles.forEach((cycle) => {
        if (cycle.start_date) {
          const startDate = new Date(cycle.start_date);
          const endDate = cycle.end_date ? new Date(cycle.end_date) : new Date();

          for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split("T")[0];

            try {
              const localData = localStorage.getItem(`daily-symptoms-${dateStr}`);
              if (localData) {
                const parsed = JSON.parse(localData);
                if (parsed.symptoms && Array.isArray(parsed.symptoms)) {
                  const phase = getCyclePhase(dateStr, completedCycles);
                  parsed.symptoms.forEach((symptom: string) => {
                    allSymptoms.push(symptom);
                    symptomsWithPhase.push({ symptom, phase, date: dateStr });
                  });
                }
              }
            } catch {
              // エラーは無視
            }
          }
        }
      });
    }

    console.log("Statistics: All collected symptoms before processing:", allSymptoms);
    console.log("Statistics: Symptoms with phase information:", symptomsWithPhase);

    // 症状の周期別分類（日付ベースで正確に分類）
    symptomsWithPhase.forEach(({ symptom, phase }) => {
      const existing = symptomsByPhase[phase].find((s) => s.symptom === symptom);
      if (existing) {
        existing.count++;
      } else {
        symptomsByPhase[phase].push({ symptom, count: 1 });
      }
    });

    console.log("Statistics: All collected symptoms:", allSymptoms);

    const symptomCounts = allSymptoms.reduce((acc: Record<string, number>, symptom) => {
      acc[symptom] = (acc[symptom] || 0) + 1;
      return acc;
    }, {});

    console.log("Statistics: Symptom counts:", symptomCounts);

    const totalSymptomCount = allSymptoms.length;
    const mostCommonSymptoms = Object.entries(symptomCounts)
      .map(([symptom, count]) => ({
        symptom,
        frequency: count,
        percentage: Math.round((count / totalSymptomCount) * 100),
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    console.log("Statistics: Most common symptoms calculated:", mostCommonSymptoms);

    // 各フェーズの症状を頻度順にソート
    (Object.keys(symptomsByPhase) as Array<keyof typeof symptomsByPhase>).forEach((phase) => {
      symptomsByPhase[phase].sort((a, b) => b.count - a.count);
    });

    const finalSymptomStats = {
      mostCommonSymptoms,
      symptomsByPhase,
    };

    console.log("Statistics: Final symptom stats being set:", finalSymptomStats);
    setSymptomStats(finalSymptomStats);

    // 流量統計の計算 - 日別症状データから流量データを収集
    console.log("Statistics: Checking flow data in cycles:", completedCycles);
    console.log(
      "Statistics: Cycles with flow_intensity:",
      completedCycles.filter((cycle) => cycle.flow_intensity)
    );

    // 周期データからの流量データ
    const cycleFlowIntensities = completedCycles.filter((cycle) => cycle.flow_intensity).map((cycle) => cycle.flow_intensity);

    // 日別症状データから流量データを収集
    const allFlowIntensities = [...cycleFlowIntensities];

    // 範囲でAPIから症状データを取得
    if (completedCycles.length > 0) {
      const allDates = completedCycles.map((cycle) => ({
        start: cycle.start_date,
        end: cycle.end_date || new Date().toISOString().split("T")[0],
      }));

      const earliestDate = allDates.reduce((min, cycle) => (cycle.start < min ? cycle.start : min), allDates[0].start);
      const latestDate = allDates.reduce((max, cycle) => (cycle.end > max ? cycle.end : max), allDates[0].end);

      try {
        const response = await dailySymptomsAPI.getSymptomsRange(earliestDate, latestDate);
        if (response.success && response.data) {
          console.log("Statistics: Symptoms range data for flow calculation:", response.data);

          // レスポンスデータが配列の場合の処理
          if (Array.isArray(response.data)) {
            response.data.forEach((dayData: DailySymptomsData) => {
              if (dayData.flowIntensity && dayData.flowIntensity > 0) {
                console.log(`Statistics: Found flow intensity ${dayData.flowIntensity} from API (array format)`);
                allFlowIntensities.push(dayData.flowIntensity);
              }
            });
          }
          // レスポンスデータがオブジェクトの場合の処理
          else if (typeof response.data === "object" && response.data !== null) {
            Object.entries(response.data).forEach(([date, dayData]) => {
              // console.log(`Statistics: Checking API data for ${date}:`, dayData);
              if (dayData && typeof dayData === "object" && (dayData as DailySymptomsData).flowIntensity && (dayData as DailySymptomsData).flowIntensity! > 0) {
                console.log(`Statistics: Found flow intensity ${(dayData as DailySymptomsData).flowIntensity} for ${date} from API`);
                allFlowIntensities.push((dayData as DailySymptomsData).flowIntensity!);
              }
            });
          }
        } else {
          console.log("Statistics: API response failed or no data:", response);
        }
      } catch (error) {
        console.log("Statistics: Failed to fetch symptoms range for flow data, using local storage fallback:", error);
      }
    }

    // ローカルストレージからもフォールバック
    completedCycles.forEach((cycle) => {
      if (cycle.start_date) {
        const startDate = new Date(cycle.start_date);
        const endDate = cycle.end_date ? new Date(cycle.end_date) : new Date();

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split("T")[0];

          try {
            const localData = localStorage.getItem(`daily-symptoms-${dateStr}`);
            if (localData) {
              const parsed = JSON.parse(localData);
              // console.log(`Statistics: Checking localStorage data for ${dateStr}:`, parsed);
              if (parsed.flowIntensity && parsed.flowIntensity > 0) {
                console.log(`Statistics: Found flow intensity ${parsed.flowIntensity} for ${dateStr} from localStorage`);
                allFlowIntensities.push(parsed.flowIntensity);
              }
            }
          } catch (error) {
            console.log(`Statistics: Error parsing localStorage data for ${dateStr}:`, error);
          }
        }
      }
    });

    // 有効な値のみをフィルタ（重複除去はしない - 各日のデータは独立）
    console.log("Statistics: All collected flow intensities before filtering:", allFlowIntensities);
    const flowIntensities = allFlowIntensities.filter((intensity) => intensity && intensity > 0);

    console.log("Statistics: Final flow intensities array after deduplication and filtering:", flowIntensities);
    console.log("Statistics: Flow intensities length:", flowIntensities.length);
    console.log("Statistics: Unique flow values:", [...new Set(flowIntensities)]);

    if (flowIntensities.length > 0) {
      const avgFlow = flowIntensities.filter(intensity => intensity != null).reduce((sum: number, intensity: number) => sum + intensity, 0) / flowIntensities.length;

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
      console.log("Statistics: No flow data available, setting empty flow stats");
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
      <div className="bg-white rounded-xl shadow-sm border border-medical p-4 sm:p-6">
        <div className="flex items-center justify-center h-32 sm:h-64">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            <div className="text-sm sm:text-base text-gray-500">統計データを読み込み中...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-medical p-4 sm:p-6">
        <div className="text-center py-8 sm:py-12">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">データの読み込みに失敗しました</h3>
          <p className="text-sm sm:text-base text-gray-500 px-4 mb-4">{error}</p>
          <button
            onClick={() => loadStatistics(false)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  if (!cycleStats) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-medical p-4 sm:p-6">
        <div className="text-center py-8 sm:py-12">
          <div className="text-gray-500 mb-4">
            <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">統計データがありません</h3>
          <p className="text-sm sm:text-base text-gray-500 px-4 mb-4">生理周期データが蓄積されると、ここに統計情報が表示されます。</p>
          <div className="text-xs text-gray-400">
            選択した期間: {timeRange === "3months" ? "過去3ヶ月" : timeRange === "6months" ? "過去6ヶ月" : timeRange === "1year" ? "過去1年" : "全期間"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-medical p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-neutral-900">統計・分析</h2>
            <p className="text-xs sm:text-sm text-neutral-600">生理周期と症状の傾向を分析</p>
          </div>
          <div className="flex items-center">
            <div className="flex gap-2">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as "3months" | "6months" | "1year" | "all")}
                className="px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[44px] w-full sm:w-auto touch-manipulation"
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
          <div className="text-center p-3 sm:p-4 bg-primary-50 rounded-lg min-h-[80px] sm:min-h-[100px] flex flex-col justify-center">
            <div className="text-lg sm:text-2xl font-bold text-primary-600 mb-1">{cycleStats.averageCycleLength}</div>
            <div className="text-xs sm:text-sm text-primary-700 leading-tight">平均周期長</div>
            <div className="text-xs text-primary-600 mt-0.5">日</div>
          </div>
          <div className="text-center p-3 sm:p-4 bg-red-50 rounded-lg min-h-[80px] sm:min-h-[100px] flex flex-col justify-center">
            <div className="text-lg sm:text-2xl font-bold text-red-600 mb-1">{cycleStats.averagePeriodLength}</div>
            <div className="text-xs sm:text-sm text-red-700 leading-tight">平均生理期間</div>
            <div className="text-xs text-red-600 mt-0.5">日</div>
          </div>
          <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg min-h-[80px] sm:min-h-[100px] flex flex-col justify-center">
            <div className="text-lg sm:text-2xl font-bold text-green-600 mb-1">{cycleStats.totalCycles}</div>
            <div className="text-xs sm:text-sm text-green-700 leading-tight">記録した周期</div>
            <div className="text-xs text-green-600 mt-0.5">回</div>
          </div>
          <div className="text-center p-3 sm:p-4 bg-yellow-50 rounded-lg min-h-[80px] sm:min-h-[100px] flex flex-col justify-center">
            <div className="text-lg sm:text-2xl font-bold text-yellow-600 mb-1">{cycleStats.irregularityScore}%</div>
            <div className="text-xs sm:text-sm text-yellow-700 leading-tight">不規則性</div>
            <div className="text-xs text-yellow-600 mt-0.5 truncate">{getIrregularityLevel(cycleStats.irregularityScore)}</div>
          </div>
        </div>
      </div>

      {/* 詳細統計 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* 周期の詳細 */}
        <div className="bg-white rounded-xl shadow-sm border border-medical p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">周期の詳細</h3>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex justify-between items-center py-2 sm:py-3 border-b border-gray-100">
              <span className="text-xs sm:text-sm text-gray-600">最短周期</span>
              <span className="text-sm sm:text-base font-medium">{cycleStats.shortestCycle}日</span>
            </div>
            <div className="flex justify-between items-center py-2 sm:py-3 border-b border-gray-100">
              <span className="text-xs sm:text-sm text-gray-600">最長周期</span>
              <span className="text-sm sm:text-base font-medium">{cycleStats.longestCycle}日</span>
            </div>
            <div className="flex justify-between items-center py-2 sm:py-3 border-b border-gray-100">
              <span className="text-xs sm:text-sm text-gray-600">前回の周期長</span>
              <span className="text-sm sm:text-base font-medium">{cycleStats.lastCycleLength}日</span>
            </div>
            <div className="flex justify-between items-center py-2 sm:py-3">
              <span className="text-xs sm:text-sm text-gray-600">周期の範囲</span>
              <span className="text-sm sm:text-base font-medium">{cycleStats.longestCycle - cycleStats.shortestCycle}日</span>
            </div>
          </div>
        </div>

        {/* 流量統計 */}
        {flowStats && (
          <div className="bg-white rounded-xl shadow-sm border border-medical p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">流量の傾向</h3>
            <div className="mb-3 sm:mb-4">
              <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                <div className="text-base sm:text-lg font-bold text-blue-600 mb-1">{flowStats.averageFlowIntensity}</div>
                <div className="text-xs sm:text-sm text-blue-700">平均流量強度</div>
              </div>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {flowStats.flowDistribution.map((flow) => (
                <div key={flow.intensity} className="flex items-center justify-between gap-2 sm:gap-3">
                  <span className="text-xs sm:text-sm text-gray-600 flex-shrink-0 w-16 sm:w-20 text-left">{getFlowIntensityLabel(flow.intensity)}</span>
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <div className="bg-gray-200 rounded-full h-2 flex-1 min-w-[40px]">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${flow.percentage}%` }}></div>
                    </div>
                    <span className="text-xs sm:text-sm font-medium w-8 sm:w-10 text-right flex-shrink-0">{flow.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 症状統計 */}
      {symptomStats && (
        <div className="bg-white rounded-xl shadow-sm border border-medical p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">よく見られる症状</h3>
          {symptomStats.mostCommonSymptoms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <h4 className="text-sm sm:text-base font-medium text-gray-700 mb-2 sm:mb-3">症状の頻度</h4>
                <div className="space-y-2 sm:space-y-3">
                  {symptomStats.mostCommonSymptoms.slice(0, 5).map((symptom, index) => (
                    <div key={symptom.symptom} className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                          {index + 1}
                        </div>
                        <span className="text-xs sm:text-sm text-gray-700 truncate max-w-[80px] sm:max-w-none">{symptom.symptom}</span>
                      </div>
                      <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0 min-w-[60px] sm:min-w-[80px]">
                        <div className="bg-gray-200 rounded-full h-2 flex-1 min-w-[30px] sm:min-w-[40px]">
                          <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${symptom.percentage}%` }}></div>
                        </div>
                        <span className="text-xs sm:text-sm font-medium w-8 text-right">{symptom.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-medium text-gray-700 mb-2 sm:mb-3">症状の回数</h4>
                <div className="space-y-1 sm:space-y-2">
                  {symptomStats.mostCommonSymptoms.slice(0, 5).map((symptom) => (
                    <div key={symptom.symptom} className="flex justify-between items-center py-1 gap-2">
                      <span className="text-xs sm:text-sm text-gray-600 truncate max-w-[100px] sm:max-w-none">{symptom.symptom}</span>
                      <span className="text-xs sm:text-sm font-medium flex-shrink-0">{symptom.frequency}回</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-2">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">症状データがありません</h4>
              <p className="text-sm text-gray-500">カレンダーで症状を記録すると、ここに統計情報が表示されます。</p>
            </div>
          )}
        </div>
      )}

      {/* 周期別症状分析 */}
      {symptomStats && (
        <div className="bg-white rounded-xl shadow-sm border border-medical p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">周期別症状分析</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 生理期 */}
            <div className="p-3 bg-red-50 rounded-lg">
              <h4 className="text-sm font-medium text-red-800 mb-2 flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                生理期
              </h4>
              <div className="space-y-1">
                {symptomStats.symptomsByPhase.menstrual.slice(0, 3).map((symptom) => (
                  <div key={symptom.symptom} className="flex justify-between items-center text-xs">
                    <span className="text-red-700 truncate">{symptom.symptom}</span>
                    <span className="text-red-600 font-medium">{symptom.count}</span>
                  </div>
                ))}
                {symptomStats.symptomsByPhase.menstrual.length === 0 && <span className="text-xs text-red-600">データなし</span>}
              </div>
            </div>

            {/* 卵胞期 */}
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                卵胞期
              </h4>
              <div className="space-y-1">
                {symptomStats.symptomsByPhase.follicular.slice(0, 3).map((symptom) => (
                  <div key={symptom.symptom} className="flex justify-between items-center text-xs">
                    <span className="text-blue-700 truncate">{symptom.symptom}</span>
                    <span className="text-blue-600 font-medium">{symptom.count}</span>
                  </div>
                ))}
                {symptomStats.symptomsByPhase.follicular.length === 0 && <span className="text-xs text-blue-600">データなし</span>}
              </div>
            </div>

            {/* 排卵期 */}
            <div className="p-3 bg-green-50 rounded-lg">
              <h4 className="text-sm font-medium text-green-800 mb-2 flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                排卵期
              </h4>
              <div className="space-y-1">
                {symptomStats.symptomsByPhase.ovulatory.slice(0, 3).map((symptom) => (
                  <div key={symptom.symptom} className="flex justify-between items-center text-xs">
                    <span className="text-green-700 truncate">{symptom.symptom}</span>
                    <span className="text-green-600 font-medium">{symptom.count}</span>
                  </div>
                ))}
                {symptomStats.symptomsByPhase.ovulatory.length === 0 && <span className="text-xs text-green-600">データなし</span>}
              </div>
            </div>

            {/* 黄体期 */}
            <div className="p-3 bg-yellow-50 rounded-lg">
              <h4 className="text-sm font-medium text-yellow-800 mb-2 flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                黄体期
              </h4>
              <div className="space-y-1">
                {symptomStats.symptomsByPhase.luteal.slice(0, 3).map((symptom) => (
                  <div key={symptom.symptom} className="flex justify-between items-center text-xs">
                    <span className="text-yellow-700 truncate">{symptom.symptom}</span>
                    <span className="text-yellow-600 font-medium">{symptom.count}</span>
                  </div>
                ))}
                {symptomStats.symptomsByPhase.luteal.length === 0 && <span className="text-xs text-yellow-600">データなし</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 健康指標の詳細 */}
      {cycleStats && (
        <div className="bg-white rounded-xl shadow-sm border border-medical p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">健康指標の詳細</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 周期安定性 */}
            <div className="p-4 border rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">周期安定性</h4>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-primary-600">{cycleStats.irregularityScore}%</span>
                <div
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    cycleStats.irregularityScore < 20
                      ? "bg-green-100 text-green-800"
                      : cycleStats.irregularityScore < 50
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {getIrregularityLevel(cycleStats.irregularityScore)}
                </div>
              </div>
              <div className="text-xs text-gray-600">変動幅: {cycleStats.longestCycle - cycleStats.shortestCycle}日</div>
            </div>

            {/* 予測精度 */}
            <div className="p-4 border rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">予測精度</h4>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-blue-600">{cycleStats.totalCycles >= 3 ? Math.max(60, 100 - cycleStats.irregularityScore) : 0}%</span>
                <div
                  className={`px-2 py-1 rounded text-xs font-medium ${cycleStats.totalCycles >= 3 ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}
                >
                  {cycleStats.totalCycles >= 3 ? "利用可能" : "データ不足"}
                </div>
              </div>
              <div className="text-xs text-gray-600">データ数: {cycleStats.totalCycles}周期</div>
            </div>

            {/* 健康状態スコア */}
            <div className="p-4 border rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">健康状態スコア</h4>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-emerald-600">
                  {Math.round(
                    (cycleStats.averageCycleLength >= 21 && cycleStats.averageCycleLength <= 35 ? 40 : 20) +
                      (cycleStats.irregularityScore < 20 ? 40 : cycleStats.irregularityScore < 50 ? 20 : 0) +
                      (cycleStats.totalCycles >= 3 ? 20 : 10)
                  )}
                </span>
                <div className="px-2 py-1 rounded text-xs font-medium bg-emerald-100 text-emerald-800">/100</div>
              </div>
              <div className="text-xs text-gray-600">総合評価</div>
            </div>
          </div>
        </div>
      )}

      {/* 分析とアドバイス */}
      <div className="bg-white rounded-xl shadow-sm border border-medical p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">分析とアドバイス</h3>
        <div className="space-y-3 sm:space-y-4">
          {/* 周期の規則性についてのアドバイス */}
          <div className="p-3 sm:p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm sm:text-base font-medium text-blue-900 mb-1 sm:mb-2">周期の規則性</h4>
            <p className="text-xs sm:text-sm text-blue-800 leading-relaxed">
              {cycleStats.irregularityScore < 20
                ? "あなたの周期は規則的です。このまま良好な健康状態を維持しましょう。"
                : cycleStats.irregularityScore < 50
                ? "周期にやや変動が見られます。ストレスや生活習慣の変化が影響している可能性があります。"
                : "周期が不規則になっています。医師に相談することをお勧めします。"}
            </p>
          </div>

          {/* 周期長についてのアドバイス */}
          <div className="p-3 sm:p-4 bg-green-50 rounded-lg">
            <h4 className="text-sm sm:text-base font-medium text-green-900 mb-1 sm:mb-2">周期長について</h4>
            <p className="text-xs sm:text-sm text-green-800 leading-relaxed">
              {cycleStats.averageCycleLength >= 21 && cycleStats.averageCycleLength <= 35
                ? "平均周期長は正常範囲内（21-35日）です。"
                : cycleStats.averageCycleLength < 21
                ? "周期が短めです（21日未満）。医師に相談することをお勧めします。"
                : "周期が長めです（35日超）。医師に相談することをお勧めします。"}
            </p>
          </div>

          {/* 次回予測 */}
          <div className="p-3 sm:p-4 bg-purple-50 rounded-lg">
            <h4 className="text-sm sm:text-base font-medium text-purple-900 mb-1 sm:mb-2">パターンの傾向</h4>
            <p className="text-xs sm:text-sm text-purple-800 leading-relaxed">
              過去{cycleStats.totalCycles}回の周期を基に、あなたの平均周期は{cycleStats.averageCycleLength}日です。 生理期間は平均
              {cycleStats.averagePeriodLength}日続いています。
            </p>
          </div>

          {/* PMS傾向分析 */}
          {symptomStats && (
            <div className="p-3 sm:p-4 bg-orange-50 rounded-lg">
              <h4 className="text-sm sm:text-base font-medium text-orange-900 mb-1 sm:mb-2">PMS傾向分析</h4>
              <p className="text-xs sm:text-sm text-orange-800 leading-relaxed">
                {symptomStats.symptomsByPhase.luteal.length > 0
                  ? `黄体期に${symptomStats.symptomsByPhase.luteal.length}種類の症状が記録されています。最も多いのは「${symptomStats.symptomsByPhase.luteal[0]?.symptom}」です。`
                  : "黄体期の症状データが不足しています。日々の症状記録を継続することで、PMS傾向の把握が可能になります。"}
              </p>
            </div>
          )}

          {/* 健康状態の改善提案 */}
          <div className="p-3 sm:p-4 bg-teal-50 rounded-lg">
            <h4 className="text-sm sm:text-base font-medium text-teal-900 mb-1 sm:mb-2">健康管理のアドバイス</h4>
            <p className="text-xs sm:text-sm text-teal-800 leading-relaxed">
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
