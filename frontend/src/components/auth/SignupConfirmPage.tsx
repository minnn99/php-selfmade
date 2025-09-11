import React from "react";
import { FadeInUp, ScaleIn, InteractiveBackground } from "../animations";

interface SignupData {
  name: string;
  furigana: string;
  nickname: string;
  gender: string;
  phone: string;
  email: string;
  password: string;
}

interface SignupConfirmPageProps {
  signupData: SignupData;
  onConfirm: () => void;
  onEdit: () => void;
  isLoading?: boolean;
}

const getGenderLabel = (gender: string): string => {
  switch (gender) {
    case "male":
      return "男性";
    case "female":
      return "女性";
    case "other":
      return "その他";
    default:
      return gender;
  }
};

export const SignupConfirmPage: React.FC<SignupConfirmPageProps> = ({ signupData, onConfirm, onEdit, isLoading = false }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-medical/5 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-800 flex items-center justify-center py-6 px-4 sm:py-12 sm:px-6 lg:px-8 relative">
      <InteractiveBackground />
      <div className="max-w-md w-full space-y-6 sm:space-y-8 relative z-10">
        {/* Header */}
        <FadeInUp delay={0}>
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">登録内容の確認</h2>
            <p className="mt-2 text-sm text-neutral-600 dark:text-gray-300">入力された内容をご確認ください</p>
          </div>
        </FadeInUp>

        {/* Confirmation Card */}
        <ScaleIn delay={100}>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-medical/20 dark:border-gray-700/50 p-6 sm:p-8">
          <div className="space-y-4 sm:space-y-6">
            {/* Name */}
            <div className="border-b border-neutral-200 dark:border-gray-600 pb-3 sm:pb-4">
              <label className="block text-sm font-medium text-neutral-600 dark:text-gray-400 mb-1">お名前</label>
              <p className="text-base sm:text-lg text-neutral-900 dark:text-white font-medium break-words">{signupData.name}</p>
            </div>

            {/* Furigana */}
            <div className="border-b border-neutral-200 dark:border-gray-600 pb-3 sm:pb-4">
              <label className="block text-sm font-medium text-neutral-600 dark:text-gray-400 mb-1">フリガナ</label>
              <p className="text-base sm:text-lg text-neutral-900 dark:text-white font-medium break-words">{signupData.furigana}</p>
            </div>

            {/* Nickname */}
            <div className="border-b border-neutral-200 dark:border-gray-600 pb-3 sm:pb-4">
              <label className="block text-sm font-medium text-neutral-600 dark:text-gray-400 mb-1">ニックネーム</label>
              <p className="text-base sm:text-lg text-neutral-900 dark:text-white font-medium break-words">{signupData.nickname}</p>
              <p className="text-xs text-neutral-500 dark:text-gray-400 mt-1">ヘッダーに表示される名前です</p>
            </div>

            {/* Gender */}
            <div className="border-b border-neutral-200 dark:border-gray-600 pb-3 sm:pb-4">
              <label className="block text-sm font-medium text-neutral-600 dark:text-gray-400 mb-1">性別</label>
              <p className="text-base sm:text-lg text-neutral-900 dark:text-white font-medium">{getGenderLabel(signupData.gender)}</p>
            </div>

            {/* Phone */}
            <div className="border-b border-neutral-200 dark:border-gray-600 pb-3 sm:pb-4">
              <label className="block text-sm font-medium text-neutral-600 dark:text-gray-400 mb-1">電話番号</label>
              <p className="text-base sm:text-lg text-neutral-900 dark:text-white font-medium">{signupData.phone}</p>
            </div>

            {/* Email */}
            <div className="border-b border-neutral-200 dark:border-gray-600 pb-3 sm:pb-4">
              <label className="block text-sm font-medium text-neutral-600 dark:text-gray-400 mb-1">メールアドレス</label>
              <p className="text-base sm:text-lg text-neutral-900 dark:text-white font-medium break-all">{signupData.email}</p>
            </div>

            {/* Password */}
            <div className="pb-3 sm:pb-4">
              <label className="block text-sm font-medium text-neutral-600 dark:text-gray-400 mb-1">パスワード</label>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm sm:text-base text-neutral-600 dark:text-gray-300">パスワードが設定されました</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 sm:mt-8 space-y-3 sm:space-y-4">
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed touch-manipulation min-h-[48px] text-base"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  登録中...
                </div>
              ) : (
                "上記の内容で登録する"
              )}
            </button>

            <button
              onClick={onEdit}
              disabled={isLoading}
              className="w-full bg-neutral-100 dark:bg-gray-600 hover:bg-neutral-200 dark:hover:bg-gray-500 disabled:bg-neutral-50 dark:disabled:bg-gray-700 text-neutral-700 dark:text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed touch-manipulation min-h-[48px] text-base"
            >
              内容を修正する
            </button>
          </div>
        </div>
        </ScaleIn>

        {/* Note */}
        <FadeInUp delay={200}>
          <div className="text-center px-2">
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-gray-400 leading-relaxed">
              登録を行うことで、
              <span className="text-primary-600">利用規約</span>
              および
              <span className="text-primary-600">プライバシーポリシー</span>
              に同意したものとみなします。
            </p>
          </div>
        </FadeInUp>
      </div>
    </div>
  );
};
