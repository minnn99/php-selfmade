import React, { useState, useEffect } from 'react';
import { PrivacyPolicyModal } from '../modals/PrivacyPolicyModal';
import { TermsOfServiceModal } from '../modals/TermsOfServiceModal';
import { CustomSelect } from '../shared/CustomSelect';
import { FadeInUp, ScaleIn, InteractiveBackground } from '../animations';

interface SignupFormProps {
  onSignup: (data: SignupData) => void;
  isLoading?: boolean;
  onShowLogin?: () => void;
  initialData?: Partial<SignupData>;
}

interface SignupData {
  name: string;
  furigana: string;
  nickname: string;
  gender: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface PasswordValidation {
  length: boolean;
  uppercase: boolean;
  number: boolean;
  isValid: boolean;
}

interface ValidationErrors {
  name?: string;
  furigana?: string;
  nickname?: string;
  gender?: string;
  phone?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export const SignupForm: React.FC<SignupFormProps> = ({ onSignup, isLoading = false, onShowLogin, initialData }) => {
  const [formData, setFormData] = useState<SignupData>({
    name: initialData?.name || '',
    furigana: initialData?.furigana || '',
    nickname: initialData?.nickname || '',
    gender: initialData?.gender || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    password: initialData?.password || '',
    confirmPassword: initialData?.confirmPassword || ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>({
    length: false,
    uppercase: false,
    number: false,
    isValid: false
  });
  const [touched, setTouched] = useState({
    name: false,
    furigana: false,
    nickname: false,
    gender: false,
    phone: false,
    email: false,
    password: false,
    confirmPassword: false
  });
  const [errors, setErrors] = useState<ValidationErrors>({});

  // フォームとエラーをリセットする関数
  const resetForm = React.useCallback(() => {
    if (!initialData) { // initialDataがない場合のみリセット
      setFormData({
        name: '',
        furigana: '',
        nickname: '',
        gender: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
      setShowPassword(false);
      setShowConfirmPassword(false);
      setAgreedToTerms(false);
      setPasswordValidation({
        length: false,
        uppercase: false,
        number: false,
        isValid: false
      });
      setTouched({
        name: false,
        furigana: false,
        nickname: false,
        gender: false,
        phone: false,
        email: false,
        password: false,
        confirmPassword: false
      });
      setErrors({});
    }
  }, [initialData]);

  // initialDataがある場合（修正ボタンから戻ってきた場合）にパスワードバリデーション状態を復元
  useEffect(() => {
    if (initialData?.password) {
      setPasswordValidation(validatePassword(initialData.password));
    }
  }, [initialData]);

  // コンポーネントのアンマウント時にリセット
  useEffect(() => {
    return () => {
      resetForm();
    };
  }, [resetForm]);

  const validateName = (name: string): string | undefined => {
    if (!name.trim()) {
      return "お名前は必須です";
    }
    if (name.trim().length < 1 || name.trim().length > 50) {
      return "お名前は1文字以上50文字以内で入力してください";
    }
    if (!/^[\u3041-\u3096\u30A1-\u30FC\u4E00-\u9FAFa-zA-Z\s]+$/.test(name.trim())) {
      return "お名前は日本語・英語のみ使用できます";
    }
    return undefined;
  };

  const validateFurigana = (furigana: string): string | undefined => {
    if (!furigana.trim()) {
      return "フリガナは必須です";
    }
    if (furigana.trim().length < 1 || furigana.trim().length > 50) {
      return "フリガナは1文字以上50文字以内で入力してください";
    }
    // カタカナ（全角）のみ許可、長音符（ー）、濁点・半濁点も含む
    if (!/^[\u30A1-\u30FC\u30FC\s]+$/.test(furigana.trim())) {
      return "フリガナは全角カタカナのみ入力してください";
    }
    return undefined;
  };

  const validateNickname = (nickname: string): string | undefined => {
    if (!nickname.trim()) {
      return "ニックネームは必須です";
    }
    if (nickname.trim().length < 1 || nickname.trim().length > 20) {
      return "ニックネームは1文字以上20文字以内で入力してください";
    }
    // 日本語・英語・数字・一部記号を許可
    if (!/^[\u3041-\u3096\u30A1-\u30FC\u4E00-\u9FAFa-zA-Z0-9_\-\s]+$/.test(nickname.trim())) {
      return "ニックネームは日本語・英語・数字・アンダースコア・ハイフンのみ使用できます";
    }
    return undefined;
  };

  const validateGender = (gender: string): string | undefined => {
    if (!gender) {
      return "性別を選択してください";
    }
    if (!['male', 'female'].includes(gender)) {
      return "正しい性別を選択してください";
    }
    return undefined;
  };

  const validatePhone = (phone: string): string | undefined => {
    if (!phone.trim()) {
      return "電話番号は必須です";
    }
    const phoneRegex = /^(0\d{1,4}-\d{1,4}-\d{4}|0\d{10,11})$/;
    if (!phoneRegex.test(phone.replace(/[^\d-]/g, ''))) {
      return "ハイフンは不要です。数字は半角で入力してください（例：09012345678）";
    }
    return undefined;
  };

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

  const validatePassword = (password: string): PasswordValidation => {
    const length = password.length >= 8;
    const uppercase = /[A-Z]/.test(password);
    const number = /[0-9]/.test(password);
    const isValid = length && uppercase && number;
    
    return { length, uppercase, number, isValid };
  };

  const validateConfirmPassword = (password: string, confirmPassword: string): string | undefined => {
    if (!confirmPassword) {
      return "パスワード確認は必須です";
    }
    if (password !== confirmPassword) {
      return "パスワードが一致しません";
    }
    return undefined;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'password') {
      setPasswordValidation(validatePassword(value));
    }

    // リアルタイムバリデーション（タッチされた項目のみ）
    if (touched[name as keyof typeof touched] && name !== 'confirmPassword') {
      validateField(name, value);
    } else if (name === 'confirmPassword' && touched.confirmPassword) {
      validateField(name, value);
    }
  };

  const validateField = (fieldName: string, value: string, currentFormData?: SignupData) => {
    try {
      let error: string | undefined;
      const dataToUse = currentFormData || formData;
      
      switch (fieldName) {
        case 'name':
          error = validateName(value);
          break;
        case 'furigana':
          error = validateFurigana(value);
          break;
        case 'nickname':
          error = validateNickname(value);
          break;
        case 'gender':
          error = validateGender(value);
          break;
        case 'phone':
          error = validatePhone(value);
          break;
        case 'email':
          error = validateEmail(value);
          break;
        case 'confirmPassword':
          error = validateConfirmPassword(dataToUse.password || '', value);
          break;
      }

      setErrors(prev => ({
        ...prev,
        [fieldName]: error
      }));
    } catch {
      // Silent error handling - field validation error
    }
  };

  const handleBlur = (fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    const currentValue = formData[fieldName as keyof SignupData];
    if (currentValue !== undefined) {
      validateField(fieldName, currentValue);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 全フィールドをバリデーション
    const nameError = validateName(formData.name);
    const furiganaError = validateFurigana(formData.furigana);
    const nicknameError = validateNickname(formData.nickname);
    const genderError = validateGender(formData.gender);
    const phoneError = validatePhone(formData.phone);
    const emailError = validateEmail(formData.email);
    const confirmPasswordError = validateConfirmPassword(formData.password, formData.confirmPassword);
    
    const hasErrors = nameError || furiganaError || nicknameError || genderError || phoneError || emailError || !passwordValidation.isValid || confirmPasswordError;
    
    if (hasErrors) {
      setErrors({
        name: nameError,
        furigana: furiganaError,
        nickname: nicknameError,
        gender: genderError,
        phone: phoneError,
        email: emailError,
        confirmPassword: confirmPasswordError
      });
      setTouched({
        name: true,
        furigana: true,
        nickname: true,
        gender: true,
        phone: true,
        email: true,
        password: true,
        confirmPassword: true
      });
      return;
    }
    
    if (!agreedToTerms) {
      alert('利用規約・プライバシーポリシーに同意してください');
      return;
    }
    
    onSignup(formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-6 px-4 sm:py-12 sm:px-6 lg:px-8 relative">
      <InteractiveBackground />
      <div className="max-w-md w-full space-y-6 sm:space-y-8 relative z-10">
        {/* Header */}
        <FadeInUp delay={0}>
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white mb-2">Pairiod</h1>
            <p className="text-base sm:text-lg text-neutral-600 dark:text-gray-300 mb-6 sm:mb-8">新規アカウントを作成</p>
          </div>
        </FadeInUp>

        {/* Signup Card */}
        <ScaleIn delay={100}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-medical dark:border-gray-700 p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-neutral-900 dark:text-white text-center">新規登録</h2>
            <p className="text-sm sm:text-base text-neutral-600 dark:text-gray-300 text-center mt-2">必要な情報を入力してください</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
                お名前 <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                onBlur={() => handleBlur('name')}
                className={`w-full px-3 py-3 sm:px-4 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-gray-500 text-base min-h-[44px] touch-manipulation bg-white dark:bg-gray-700 ${
                  errors.name && touched.name
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-medical dark:border-gray-600 focus:ring-primary-500'
                }`}
                placeholder="山田太郎"
              />
              {errors.name && touched.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
              )}
            </div>

            {/* Furigana Field */}
            <div>
              <label htmlFor="furigana" className="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
                フリガナ <span className="text-red-500">*</span>
              </label>
              <input
                id="furigana"
                name="furigana"
                type="text"
                required
                value={formData.furigana}
                onChange={handleChange}
                onBlur={() => handleBlur('furigana')}
                className={`w-full px-3 py-3 sm:px-4 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-gray-500 text-base min-h-[44px] touch-manipulation bg-white dark:bg-gray-700 ${
                  errors.furigana && touched.furigana
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-medical dark:border-gray-600 focus:ring-primary-500'
                }`}
                placeholder="ヤマダタロウ"
              />
              {errors.furigana && touched.furigana && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.furigana}</p>
              )}
            </div>

            {/* Nickname Field */}
            <div>
              <label htmlFor="nickname" className="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
                ニックネーム <span className="text-red-500">*</span>
              </label>
              <input
                id="nickname"
                name="nickname"
                type="text"
                required
                value={formData.nickname}
                onChange={handleChange}
                onBlur={() => handleBlur('nickname')}
                className={`w-full px-3 py-3 sm:px-4 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-gray-500 text-base min-h-[44px] touch-manipulation bg-white dark:bg-gray-700 ${
                  errors.nickname && touched.nickname
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-medical dark:border-gray-600 focus:ring-primary-500'
                }`}
                placeholder="タロウ"
                maxLength={20}
              />
              <p className="mt-1 text-xs text-neutral-500 dark:text-gray-400">
                ヘッダーに表示される名前です（20文字以内）
              </p>
              {errors.nickname && touched.nickname && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.nickname}</p>
              )}
            </div>

            {/* Gender Field */}
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2" id="gender-label">
                性別 <span className="text-red-500">*</span>
              </label>
              <CustomSelect
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={(value) => {
                  setFormData(prev => ({ ...prev, gender: value }));
                  setTouched(prev => ({ ...prev, gender: true }));
                  
                  // リアルタイムバリデーション（タッチされた項目のみ）
                  if (touched.gender) {
                    setErrors(prev => ({ ...prev, gender: validateGender(value) }));
                  }
                }}
                onBlur={() => {
                  // Gender field doesn't need validation on blur since it's handled in onChange
                  setTouched(prev => ({ ...prev, gender: true }));
                }}
                options={[
                  { value: "female", label: "女性" },
                  { value: "male", label: "男性" }
                ]}
                placeholder="選択してください"
                error={!!(errors.gender && touched.gender)}
                required
              />
              {errors.gender && touched.gender && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.gender}</p>
              )}
            </div>

            {/* Phone Field */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
                電話番号 <span className="text-red-500">*</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={handleChange}
                onBlur={() => handleBlur('phone')}
                className={`w-full px-3 py-3 sm:px-4 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-gray-500 text-base min-h-[44px] touch-manipulation bg-white dark:bg-gray-700 ${
                  errors.phone && touched.phone
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-medical dark:border-gray-600 focus:ring-primary-500'
                }`}
                placeholder="09012345678"
              />
              {errors.phone && touched.phone && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.phone}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
                メールアドレス <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                onBlur={() => handleBlur('email')}
                className={`w-full px-3 py-3 sm:px-4 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-gray-500 text-base min-h-[44px] touch-manipulation bg-white dark:bg-gray-700 ${
                  errors.email && touched.email
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-medical dark:border-gray-600 focus:ring-primary-500'
                }`}
                placeholder="example@email.com"
              />
              {errors.email && touched.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
                パスワード <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={() => handleBlur('password')}
                  className={`w-full px-3 py-3 sm:px-4 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-gray-500 text-base min-h-[44px] touch-manipulation bg-white dark:bg-gray-700 ${
                    touched.password && !passwordValidation.isValid
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-medical dark:border-gray-600 focus:ring-primary-500'
                  }`}
                  placeholder="大文字・数字を含む8文字以上"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center touch-manipulation"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5 text-neutral-400 dark:text-gray-500 hover:text-neutral-600 dark:hover:text-gray-400 active:text-neutral-700 dark:active:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-neutral-400 dark:text-gray-500 hover:text-neutral-600 dark:hover:text-gray-400 active:text-neutral-700 dark:active:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center space-x-2 text-xs">
                    <div className={`w-2 h-2 rounded-full ${passwordValidation.length ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className={passwordValidation.length ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                      8文字以上
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <div className={`w-2 h-2 rounded-full ${passwordValidation.uppercase ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className={passwordValidation.uppercase ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                      大文字を含む
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <div className={`w-2 h-2 rounded-full ${passwordValidation.number ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className={passwordValidation.number ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                      数字を含む
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
                パスワード（確認用） <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={() => handleBlur('confirmPassword')}
                  className={`w-full px-3 py-3 sm:px-4 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-gray-500 text-base min-h-[44px] touch-manipulation bg-white dark:bg-gray-700 ${
                    errors.confirmPassword && touched.confirmPassword
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-medical dark:border-gray-600 focus:ring-primary-500'
                  }`}
                  placeholder="パスワードを再入力"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center touch-manipulation"
                >
                  {showConfirmPassword ? (
                    <svg className="h-5 w-5 text-neutral-400 dark:text-gray-500 hover:text-neutral-600 dark:hover:text-gray-400 active:text-neutral-700 dark:active:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-neutral-400 dark:text-gray-500 hover:text-neutral-600 dark:hover:text-gray-400 active:text-neutral-700 dark:active:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirmPassword && touched.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Terms and Privacy Policy Agreement */}
            <div className="flex items-start space-x-3">
              <div className="flex items-center h-6 mt-0.5">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600 focus:ring-primary-500 border-medical dark:border-gray-600 rounded touch-manipulation min-h-[20px] min-w-[20px] bg-white dark:bg-gray-700"
                />
              </div>
              <div className="text-sm sm:text-base leading-relaxed">
                <label htmlFor="terms" className="text-neutral-700 dark:text-gray-300 cursor-pointer">
                  <span className="text-red-500">*</span> 
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(true)}
                    className="text-primary-600 hover:text-primary-500 active:text-primary-700 transition-colors touch-manipulation underline font-medium"
                  >
                    利用規約
                  </button>
                  および
                  <button
                    type="button"
                    onClick={() => setShowPrivacyModal(true)}
                    className="text-primary-600 hover:text-primary-500 active:text-primary-700 transition-colors touch-manipulation underline font-medium"
                  >
                    プライバシーポリシー
                  </button>
                  に同意します
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={
                isLoading || 
                !passwordValidation.isValid || 
                formData.password !== formData.confirmPassword || 
                !agreedToTerms ||
                !formData.name.trim() ||
                !formData.furigana.trim() ||
                !formData.nickname.trim() ||
                !formData.gender ||
                !formData.phone.trim() ||
                !formData.email.trim()
              }
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 touch-manipulation min-h-[48px]"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  登録中...
                </div>
              ) : (
                '新規登録'
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600 dark:text-gray-300">
              既にアカウントをお持ちの方は{' '}
              <button
                onClick={() => {
                  // ログイン画面に戻る（リセットは親コンポーネントで処理）
                  onShowLogin?.();
                }}
                className="font-medium text-primary-600 hover:text-primary-500 active:text-primary-700 transition-colors touch-manipulation"
              >
                ログイン
              </button>
            </p>
          </div>
        </div>
        </ScaleIn>

        {/* Footer */}
        <FadeInUp delay={200}>
          <div className="text-center">
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-gray-400">
              © 2025 Pairiod. すべての権利を保有します。
            </p>
          </div>
        </FadeInUp>
      </div>

      {/* Privacy Policy Modal */}
      <PrivacyPolicyModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />

      {/* Terms of Service Modal */}
      <TermsOfServiceModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
      />
    </div>
  );
};