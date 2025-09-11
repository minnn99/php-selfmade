import React, { useState } from 'react';
import { InteractiveBackground } from '../animations';

interface ForgotPasswordFormProps {
  onSubmit: (email: string) => void;
  onBackToLogin: () => void;
  isLoading?: boolean;
}

interface ValidationErrors {
  email?: string;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ 
  onSubmit, 
  onBackToLogin, 
  isLoading = false 
}) => {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState({ email: false });

  // フォームとエラーをリセットする関数
  const resetForm = React.useCallback(() => {
    setEmail('');
    setErrors({});
    setTouched({ email: false });
  }, []);

  // コンポーネントのアンマウント時にリセット
  React.useEffect(() => {
    return () => {
      resetForm();
    };
  }, [resetForm]);

  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) {
      return "メールアドレスは必須です";
    }
    if (email.length > 255) {
      return "メールアドレスは255文字以内で入力してください";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "正しいメールアドレス形式で入力してください";
    }
    return undefined;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);

    if (touched.email) {
      setErrors((prev) => ({
        ...prev,
        email: validateEmail(value),
      }));
    }
  };

  const handleEmailBlur = () => {
    setTouched((prev) => ({ ...prev, email: true }));
    setErrors((prev) => ({
      ...prev,
      email: validateEmail(email),
    }));
  };

  const validateForm = (): boolean => {
    const emailError = validateEmail(email);
    setErrors({ email: emailError });
    setTouched({ email: true });
    return !emailError;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(email);
    }
  };

  const handleBackToLogin = () => {
    resetForm();
    onBackToLogin();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-6 px-4 sm:py-12 sm:px-6 lg:px-8 relative">
      <InteractiveBackground />
      <div className="max-w-md w-full space-y-6 sm:space-y-8 relative z-20">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white mb-2">Pairiod</h1>
          <p className="text-base sm:text-lg text-neutral-600 dark:text-gray-300 mb-6 sm:mb-8">パスワードをリセット</p>
        </div>

        {/* Reset Password Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-medical dark:border-gray-700 p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-neutral-900 dark:text-white text-center">パスワードリセット</h2>
            <p className="text-sm sm:text-base text-neutral-600 dark:text-gray-300 text-center mt-2 leading-relaxed">
              登録されているメールアドレスを入力してください。<br className="hidden sm:block" />
              <span className="block sm:inline">パスワードリセット用のリンクをお送りします。</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
                メールアドレス
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={handleEmailBlur}
                  className={`w-full px-3 py-3 sm:px-4 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-gray-500 text-base bg-white dark:bg-gray-700 ${
                    errors.email && touched.email ? "border-red-500 focus:ring-red-500" : "border-medical dark:border-gray-600 focus:ring-primary-500"
                  }`}
                  placeholder="example@email.com"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <svg className="h-5 w-5 text-neutral-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
              </div>
              {errors.email && touched.email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !!(errors.email && touched.email)}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 touch-manipulation min-h-[48px]"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  送信中...
                </div>
              ) : (
                'リセットリンクを送信'
              )}
            </button>
          </form>

          {/* Back to Login Link */}
          <div className="mt-6 text-center">
            <button
              onClick={handleBackToLogin}
              className="text-sm font-medium text-primary-600 hover:text-primary-500 active:text-primary-700 transition-colors touch-manipulation"
            >
              ← ログイン画面に戻る
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-gray-400">
            © 2025 Pairiod. すべての権利を保有します。
          </p>
        </div>
      </div>
    </div>
  );
};