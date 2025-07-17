import React from "react";

interface SignupData {
  name: string;
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-medical/5 to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-neutral-900">登録内容の確認</h2>
          <p className="mt-2 text-sm text-neutral-600">入力された内容をご確認ください</p>
        </div>

        {/* Confirmation Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-medical/20 p-8">
          <div className="space-y-6">
            {/* Name */}
            <div className="border-b border-neutral-200 pb-4">
              <label className="block text-sm font-medium text-neutral-600 mb-1">お名前</label>
              <p className="text-lg text-neutral-900 font-medium">{signupData.name}</p>
            </div>

            {/* Gender */}
            <div className="border-b border-neutral-200 pb-4">
              <label className="block text-sm font-medium text-neutral-600 mb-1">性別</label>
              <p className="text-lg text-neutral-900 font-medium">{getGenderLabel(signupData.gender)}</p>
            </div>

            {/* Phone */}
            <div className="border-b border-neutral-200 pb-4">
              <label className="block text-sm font-medium text-neutral-600 mb-1">電話番号</label>
              <p className="text-lg text-neutral-900 font-medium">{signupData.phone}</p>
            </div>

            {/* Email */}
            <div className="border-b border-neutral-200 pb-4">
              <label className="block text-sm font-medium text-neutral-600 mb-1">メールアドレス</label>
              <p className="text-lg text-neutral-900 font-medium">{signupData.email}</p>
            </div>

            {/* Password */}
            <div className="pb-4">
              <label className="block text-sm font-medium text-neutral-600 mb-1">パスワード</label>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-lg text-neutral-600">パスワードが設定されました</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 space-y-4">
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed"
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
              className="w-full bg-neutral-100 hover:bg-neutral-200 disabled:bg-neutral-50 text-neutral-700 font-medium py-3 px-4 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
            >
              内容を修正する
            </button>
          </div>
        </div>

        {/* Note */}
        <div className="text-center">
          <p className="text-xs text-neutral-500">
            登録を行うことで、
            <span className="text-primary-600">利用規約</span>
            および
            <span className="text-primary-600">プライバシーポリシー</span>
            に同意したものとみなします。
          </p>
        </div>
      </div>
    </div>
  );
};
