import React from 'react';

interface CycleData {
  cycleNumber: number;
  cycleLength: number;
  startDate: string;
}

interface CycleChartProps {
  data: CycleData[];
  averageLength: number;
}

export const CycleChart: React.FC<CycleChartProps> = ({ data, averageLength }) => {
  if (!data || data.length === 0) return null;

  const maxLength = Math.max(...data.map(d => d.cycleLength), averageLength);
  const minLength = Math.min(...data.map(d => d.cycleLength), averageLength);
  const range = maxLength - minLength;
  const chartHeight = 200;
  const chartWidth = 600;
  const padding = 40;

  // SVGポイントの計算
  const points = data.map((cycle, index) => {
    const x = padding + (index / (data.length - 1)) * (chartWidth - padding * 2);
    const y = chartHeight - padding - ((cycle.cycleLength - minLength) / range) * (chartHeight - padding * 2);
    return { x, y, cycle };
  });

  // 平均線のY座標
  const avgY = chartHeight - padding - ((averageLength - minLength) / range) * (chartHeight - padding * 2);

  // ライン用のパス文字列
  const linePath = points.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ');

  return (
    <div className="bg-white rounded-lg p-4">
      <h4 className="text-md font-medium text-gray-700 mb-4">周期長の変化</h4>
      <div className="relative">
        <svg 
          width={chartWidth} 
          height={chartHeight} 
          className="border border-gray-200 rounded"
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        >
          {/* 背景グリッド */}
          <defs>
            <pattern id="grid" width="50" height="25" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 25" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* 平均線 */}
          <line 
            x1={padding} 
            y1={avgY} 
            x2={chartWidth - padding} 
            y2={avgY} 
            stroke="#10b981" 
            strokeWidth="2" 
            strokeDasharray="5,5"
          />
          <text 
            x={chartWidth - padding + 5} 
            y={avgY + 5} 
            className="text-xs fill-green-600"
          >
            平均: {averageLength}日
          </text>

          {/* データライン */}
          <path 
            d={linePath} 
            fill="none" 
            stroke="#3b82f6" 
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* データポイント */}
          {points.map((point, index) => (
            <g key={index}>
              <circle 
                cx={point.x} 
                cy={point.y} 
                r="6" 
                fill="#3b82f6"
                stroke="white"
                strokeWidth="2"
                className="hover:r-8 transition-all cursor-pointer"
              />
              {/* ツールチップ風の表示 */}
              <g className="opacity-0 hover:opacity-100 transition-opacity">
                <rect 
                  x={point.x - 25} 
                  y={point.y - 35} 
                  width="50" 
                  height="25" 
                  fill="black" 
                  fillOpacity="0.8" 
                  rx="4"
                />
                <text 
                  x={point.x} 
                  y={point.y - 20} 
                  textAnchor="middle" 
                  className="text-xs fill-white"
                >
                  {point.cycle.cycleLength}日
                </text>
              </g>
            </g>
          ))}

          {/* Y軸ラベル */}
          <text 
            x="15" 
            y="20" 
            className="text-xs fill-gray-600" 
            textAnchor="middle"
          >
            周期長(日)
          </text>
          
          {/* Y軸目盛り */}
          {[minLength, Math.round((minLength + maxLength) / 2), maxLength].map((value, index) => {
            const y = chartHeight - padding - ((value - minLength) / range) * (chartHeight - padding * 2);
            return (
              <g key={index}>
                <line x1={padding - 5} y1={y} x2={padding} y2={y} stroke="#6b7280" strokeWidth="1"/>
                <text x={padding - 10} y={y + 3} className="text-xs fill-gray-600" textAnchor="end">
                  {value}
                </text>
              </g>
            );
          })}

          {/* X軸ラベル */}
          <text 
            x={chartWidth / 2} 
            y={chartHeight - 5} 
            className="text-xs fill-gray-600" 
            textAnchor="middle"
          >
            周期番号
          </text>
        </svg>
      </div>
      
      {/* レジェンド */}
      <div className="flex items-center justify-center space-x-6 mt-4 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-0.5 bg-blue-500"></div>
          <span className="text-gray-600">実際の周期長</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-0.5 bg-green-500 border-dashed"></div>
          <span className="text-gray-600">平均周期長</span>
        </div>
      </div>
    </div>
  );
};