import React from "react";

export const StatisticsUnavailablePage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-xl shadow-sm border border-medical p-8 text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-4">統計機能をご利用いただけません</h2>

        {/* Message */}
        <div className="max-w-md mx-auto">
          <p className="text-gray-600 mb-6 leading-relaxed">統計機能は女性ユーザー専用となっております。</p>
        </div>
        {/* Contact support */}
        <p className="text-xs text-gray-500">
          ご質問やお困りのことがございましたら、
          <br />
          サポートまでお気軽にお問い合わせください。
        </p>
      </div>
    </div>
  );
};
