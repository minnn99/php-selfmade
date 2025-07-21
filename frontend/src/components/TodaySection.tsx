import React from "react";

export const TodaySection: React.FC = () => {
  const today = new Date();
  const dateString = today.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-medical p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">今日の記録</h2>
          <p className="text-sm text-gray-600">{dateString}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button className="inline-flex items-center justify-center px-4 py-2 border border-primary-300 rounded-lg text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 transition-colors">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            今日の症状を記録する
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">気分</p>
          <div className="flex justify-center space-x-1">
            <span className="text-lg">😊</span>
          </div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">体調</p>
          <div className="flex justify-center space-x-1">
            <span className="text-lg">💪</span>
          </div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">水分摂取</p>
          <p className="text-sm font-medium text-gray-900">1.2L</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">睡眠時間</p>
          <p className="text-sm font-medium text-gray-900">7.5h</p>
        </div>
      </div>
    </div>
  );
};
