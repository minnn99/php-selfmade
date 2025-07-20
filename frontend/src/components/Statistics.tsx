import React, { useState, useEffect } from 'react';
import { menstrualCycleAPI } from '../services/api';
import { CycleChart } from './CycleChart';

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

interface FlowStats {
  averageFlowIntensity: number;
  flowDistribution: Array<{ intensity: number; count: number; percentage: number }>;
}

export const Statistics: React.FC = () => {
  const [cycleStats, setCycleStats] = useState<CycleStats | null>(null);
  const [symptomStats, setSymptomStats] = useState<SymptomStats | null>(null);
  const [flowStats, setFlowStats] = useState<FlowStats | null>(null);
  const [chartData, setChartData] = useState<Array<{cycleNumber: number; cycleLength: number; startDate: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'3months' | '6months' | '1year' | 'all'>('6months');

  useEffect(() => {
    loadStatistics();
  }, [timeRange]);

  const loadStatistics = async () => {
    setLoading(true);
    try {
      // 基本的な周期データを取得
      const cyclesResponse = await menstrualCycleAPI.getCycles();
      const cycles = cyclesResponse.data || [];
      
      if (cycles.length > 0) {
        calculateStatistics(cycles);
      }
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (cycles: any[]) => {
    // 完了した周期のみを対象とする
    const completedCycles = cycles.filter(cycle => cycle.end_date);
    
    if (completedCycles.length === 0) {
      setCycleStats(null);
      setSymptomStats(null);
      setFlowStats(null);
      return;
    }

    // 周期統計の計算
    const cycleLengths = completedCycles.map(cycle => {
      const start = new Date(cycle.start_date);
      const end = new Date(cycle.end_date);
      return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    });

    const periodLengths = completedCycles.map(cycle => {
      const start = new Date(cycle.start_date);
      const end = new Date(cycle.end_date);
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
      irregularityScore: Math.round(irregularityScore)
    });

    // チャート用データの準備
    const chartData = completedCycles.map((cycle, index) => ({
      cycleNumber: index + 1,
      cycleLength: cycleLengths[index],
      startDate: cycle.start_date
    }));
    setChartData(chartData);

    // 症状統計の計算
    const allSymptoms: string[] = [];
    completedCycles.forEach(cycle => {
      if (cycle.symptoms && Array.isArray(cycle.symptoms)) {
        allSymptoms.push(...cycle.symptoms);
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
        percentage: Math.round((count / totalSymptomCount) * 100)
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    setSymptomStats({
      mostCommonSymptoms,
      symptomsByPhase: {
        menstrual: [],
        follicular: [],
        ovulatory: [],
        luteal: []
      }
    });

    // 流量統計の計算
    const flowIntensities = completedCycles
      .filter(cycle => cycle.flow_intensity)
      .map(cycle => cycle.flow_intensity);

    if (flowIntensities.length > 0) {
      const avgFlow = flowIntensities.reduce((sum, intensity) => sum + intensity, 0) / flowIntensities.length;
      
      const flowDistribution = [1, 2, 3, 4, 5].map(intensity => {
        const count = flowIntensities.filter(f => f === intensity).length;
        return {
          intensity,
          count,
          percentage: Math.round((count / flowIntensities.length) * 100)
        };
      });

      setFlowStats({
        averageFlowIntensity: Math.round(avgFlow * 10) / 10,
        flowDistribution
      });
    }
  };

  const getFlowIntensityLabel = (intensity: number): string => {
    const labels = {
      1: '非常に軽い',
      2: '軽い',
      3: '普通',
      4: '重い',
      5: '非常に重い'
    };
    return labels[intensity as keyof typeof labels] || '不明';
  };

  const getIrregularityLevel = (score: number): string => {
    if (score < 10) return '非常に規則的';
    if (score < 20) return '規則的';
    if (score < 30) return 'やや不規則';
    if (score < 50) return '不規則';
    return '非常に不規則';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-medical p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">統計データを読み込み中...</div>
        </div>
      </div>
    );
  }

  if (!cycleStats) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-medical p-6">
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">統計データがありません</h3>
          <p className="text-gray-500">生理周期データが蓄積されると、ここに統計情報が表示されます。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-medical p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">統計・分析</h2>
            <p className="text-sm text-neutral-600">生理周期と症状の傾向を分析</p>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="3months">過去3ヶ月</option>
              <option value="6months">過去6ヶ月</option>
              <option value="1year">過去1年</option>
              <option value="all">全期間</option>
            </select>
          </div>
        </div>

        {/* 周期統計概要 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-primary-50 rounded-lg">
            <div className="text-2xl font-bold text-primary-600">{cycleStats.averageCycleLength}</div>
            <div className="text-sm text-primary-700">平均周期長</div>
            <div className="text-xs text-primary-600">日</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{cycleStats.averagePeriodLength}</div>
            <div className="text-sm text-red-700">平均生理期間</div>
            <div className="text-xs text-red-600">日</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{cycleStats.totalCycles}</div>
            <div className="text-sm text-green-700">記録した周期</div>
            <div className="text-xs text-green-600">回</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{cycleStats.irregularityScore}%</div>
            <div className="text-sm text-yellow-700">不規則性</div>
            <div className="text-xs text-yellow-600">{getIrregularityLevel(cycleStats.irregularityScore)}</div>
          </div>
        </div>
      </div>

      {/* 周期チャート */}
      {chartData.length > 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-medical p-6">
          <CycleChart data={chartData} averageLength={cycleStats.averageCycleLength} />
        </div>
      )}

      {/* 詳細統計 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 周期の詳細 */}
        <div className="bg-white rounded-xl shadow-sm border border-medical p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">周期の詳細</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">最短周期</span>
              <span className="font-medium">{cycleStats.shortestCycle}日</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">最長周期</span>
              <span className="font-medium">{cycleStats.longestCycle}日</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">前回の周期長</span>
              <span className="font-medium">{cycleStats.lastCycleLength}日</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">周期の範囲</span>
              <span className="font-medium">{cycleStats.longestCycle - cycleStats.shortestCycle}日</span>
            </div>
          </div>
        </div>

        {/* 流量統計 */}
        {flowStats && (
          <div className="bg-white rounded-xl shadow-sm border border-medical p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">流量の傾向</h3>
            <div className="mb-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">{flowStats.averageFlowIntensity}</div>
                <div className="text-sm text-blue-700">平均流量強度</div>
              </div>
            </div>
            <div className="space-y-3">
              {flowStats.flowDistribution.map((flow) => (
                <div key={flow.intensity} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{getFlowIntensityLabel(flow.intensity)}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${flow.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium w-8">{flow.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 症状統計 */}
      {symptomStats && symptomStats.mostCommonSymptoms.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-medical p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">よく見られる症状</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-3">症状の頻度</h4>
              <div className="space-y-3">
                {symptomStats.mostCommonSymptoms.slice(0, 5).map((symptom, index) => (
                  <div key={symptom.symptom} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                      <span className="text-sm text-gray-700">{symptom.symptom}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full"
                          style={{ width: `${symptom.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium w-8">{symptom.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-3">症状の回数</h4>
              <div className="space-y-2">
                {symptomStats.mostCommonSymptoms.slice(0, 5).map((symptom) => (
                  <div key={symptom.symptom} className="flex justify-between items-center py-1">
                    <span className="text-sm text-gray-600">{symptom.symptom}</span>
                    <span className="text-sm font-medium">{symptom.frequency}回</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 分析とアドバイス */}
      <div className="bg-white rounded-xl shadow-sm border border-medical p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">分析とアドバイス</h3>
        <div className="space-y-4">
          {/* 周期の規則性についてのアドバイス */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">周期の規則性</h4>
            <p className="text-sm text-blue-800">
              {cycleStats.irregularityScore < 20 
                ? "あなたの周期は規則的です。このまま良好な健康状態を維持しましょう。"
                : cycleStats.irregularityScore < 50
                ? "周期にやや変動が見られます。ストレスや生活習慣の変化が影響している可能性があります。"
                : "周期が不規則になっています。医師に相談することをお勧めします。"}
            </p>
          </div>

          {/* 周期長についてのアドバイス */}
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">周期長について</h4>
            <p className="text-sm text-green-800">
              {cycleStats.averageCycleLength >= 21 && cycleStats.averageCycleLength <= 35
                ? "平均周期長は正常範囲内（21-35日）です。"
                : cycleStats.averageCycleLength < 21
                ? "周期が短めです（21日未満）。医師に相談することをお勧めします。"
                : "周期が長めです（35日超）。医師に相談することをお勧めします。"}
            </p>
          </div>

          {/* 次回予測 */}
          <div className="p-4 bg-purple-50 rounded-lg">
            <h4 className="font-medium text-purple-900 mb-2">パターンの傾向</h4>
            <p className="text-sm text-purple-800">
              過去{cycleStats.totalCycles}回の周期を基に、あなたの平均周期は{cycleStats.averageCycleLength}日です。
              生理期間は平均{cycleStats.averagePeriodLength}日続いています。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};