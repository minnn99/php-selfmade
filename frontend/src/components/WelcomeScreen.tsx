import React from 'react';

interface WelcomeScreenProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGetStarted, onLogin }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-medical/5 to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl font-bold text-neutral-900 mb-4">
            Pairiod
          </h1>
          <p className="text-xl text-neutral-600 max-w-2xl mx-auto leading-relaxed">
            あなたの健康管理をサポートする
            <br />
            パーソナルヘルスケアアプリ
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center p-6 bg-white/50 rounded-xl border border-medical/20 shadow-sm">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">健康データの記録</h3>
            <p className="text-neutral-600 text-sm">
              日々の体調や症状を簡単に記録して、健康状態を可視化します
            </p>
          </div>

          <div className="text-center p-6 bg-white/50 rounded-xl border border-medical/20 shadow-sm">
            <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">スマートリマインダー</h3>
            <p className="text-neutral-600 text-sm">
              服薬時間や健康チェックのタイミングを自動でお知らせします
            </p>
          </div>

          <div className="text-center p-6 bg-white/50 rounded-xl border border-medical/20 shadow-sm">
            <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">パーソナル分析</h3>
            <p className="text-neutral-600 text-sm">
              蓄積されたデータから個人に最適な健康アドバイスを提供します
            </p>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-white/70 rounded-2xl p-8 border border-medical/20 shadow-sm max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-neutral-900 text-center mb-6">
            Pairiodで始める健康習慣
          </h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-neutral-700">
                <span className="font-medium">簡単な日々の記録</span> - わずか1分で健康状態を入力
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-neutral-700">
                <span className="font-medium">プライバシー保護</span> - あなたのデータは安全に保護されます
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-neutral-700">
                <span className="font-medium">無料で利用開始</span> - すぐに健康管理を始められます
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center space-y-4">
          <button
            onClick={onGetStarted}
            className="w-full max-w-sm mx-auto bg-primary-600 hover:bg-primary-700 text-white font-semibold py-4 px-8 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-lg"
          >
            今すぐ始める
          </button>
          
          <div className="text-center">
            <p className="text-neutral-600 text-sm">
              すでにアカウントをお持ちですか？{' '}
              <button
                onClick={onLogin}
                className="text-primary-600 hover:text-primary-700 font-medium underline"
              >
                ログイン
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-neutral-500 text-sm">
          <p>© 2025 Pairiod. すべての権利を保有しています。</p>
        </div>
      </div>
    </div>
  );
};