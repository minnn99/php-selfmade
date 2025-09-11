import React from 'react';
import { InteractiveBackground } from '../animations';

interface WelcomeScreenProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGetStarted, onLogin }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-100 via-primary-200/50 to-primary-300/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 flex items-center justify-center py-6 px-4 sm:py-12 sm:px-6 lg:px-8 relative">
      <InteractiveBackground />
      <div className="max-w-4xl w-full space-y-8 sm:space-y-12 relative z-20">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 dark:text-white mb-3 sm:mb-4">
            Pairiod
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-neutral-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed px-2">
            パートナーと一緒に支え合う
            <br />
            健康管理アプリ
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto">
          <div className="text-center p-4 sm:p-6 bg-white/85 dark:bg-gray-800/85 rounded-xl border border-medical/30 dark:border-gray-600/30 shadow-md touch-manipulation">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-white mb-2">健康データの記録</h3>
            <p className="text-neutral-600 dark:text-gray-300 text-xs sm:text-sm">
              日々の体調や症状を簡単に記録して、健康状態を可視化します
            </p>
          </div>

          <div className="text-center p-4 sm:p-6 bg-white/85 dark:bg-gray-800/85 rounded-xl border border-medical/30 dark:border-gray-600/30 shadow-md touch-manipulation">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-white mb-2">スマートリマインダー</h3>
            <p className="text-neutral-600 dark:text-gray-300 text-xs sm:text-sm">
              服薬時間や健康チェックのタイミングを自動でお知らせします
            </p>
          </div>

          <div className="text-center p-4 sm:p-6 bg-white/85 dark:bg-gray-800/85 rounded-xl border border-medical/30 dark:border-gray-600/30 shadow-md touch-manipulation">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-white mb-2">パーソナル分析</h3>
            <p className="text-neutral-600 dark:text-gray-300 text-xs sm:text-sm">
              蓄積されたデータから個人に最適な健康アドバイスを提供します
            </p>
          </div>

          <div className="text-center p-4 sm:p-6 bg-white/85 dark:bg-gray-800/85 rounded-xl border border-medical/30 dark:border-gray-600/30 shadow-md touch-manipulation">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-white mb-2">パートナー連動</h3>
            <p className="text-neutral-600 dark:text-gray-300 text-xs sm:text-sm">
              パートナーと健康情報を共有し、お互いをサポートし合えます
            </p>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-white/85 dark:bg-gray-800/85 rounded-2xl p-4 sm:p-6 md:p-8 border border-medical/30 dark:border-gray-600/30 shadow-md max-w-3xl mx-auto">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-neutral-900 dark:text-white text-center mb-4 sm:mb-6">
            Pairiodで始める健康習慣
          </h2>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-neutral-700 dark:text-gray-300 text-sm sm:text-base">
                <span className="font-medium">簡単な日々の記録</span> - わずか1分で健康状態を入力
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-neutral-700 dark:text-gray-300 text-sm sm:text-base">
                <span className="font-medium">プライバシー保護</span> - あなたのデータは安全に保護されます
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-neutral-700 dark:text-gray-300 text-sm sm:text-base">
                <span className="font-medium">パートナーと共有</span> - 大切な人と健康情報を安全に共有
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-neutral-700 dark:text-gray-300 text-sm sm:text-base">
                <span className="font-medium">無料で利用開始</span> - すぐに健康管理を始められます
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center space-y-3 sm:space-y-4">
          <button
            onClick={onGetStarted}
            className="w-full max-w-sm mx-auto bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-semibold py-3 sm:py-4 px-6 sm:px-8 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-base sm:text-lg min-h-[48px] touch-manipulation"
          >
            今すぐ始める
          </button>
          
          <div className="text-center">
            <p className="text-neutral-600 dark:text-gray-300 text-xs sm:text-sm px-4">
              すでにアカウントをお持ちですか？{' '}
              <button
                onClick={onLogin}
                className="text-primary-600 hover:text-primary-700 active:text-primary-800 font-medium underline touch-manipulation"
              >
                ログイン
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-neutral-500 dark:text-gray-400 text-xs sm:text-sm px-4">
          <p>© 2025 Pairiod. すべての権利を保有しています。</p>
        </div>
      </div>
    </div>
  );
};