import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { SignupPage } from './SignupPage';
import { ForgotPasswordPage } from './ForgotPasswordPage';
import { authAPI } from '../services/api';

interface LoginPageProps {
  onLoginSuccess: () => void;
  onShowWelcome?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onShowWelcome }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [serverError, setServerError] = useState<string>('');

  const handleLogin = async (email: string, password: string, rememberMe: boolean = false) => {
    setIsLoading(true);
    setServerError('');
    
    try {
      const response = await authAPI.login(email, password, rememberMe);

      if (response.success) {
        onLoginSuccess();
      } else {
        const errorMessage = response.message || 'ログインに失敗しました。';
        setServerError(errorMessage);
      }
      
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.response?.status === 422) {
        const validationErrors = error.response.data.errors;
        if (validationErrors) {
          const errorMessages = Object.values(validationErrors).flat();
          setServerError(errorMessages.join(', '));
        } else {
          setServerError('入力内容に誤りがあります。');
        }
      } else if (error.response?.status === 401) {
        setServerError('メールアドレスまたはパスワードが正しくありません。');
      } else {
        setServerError('ネットワークエラーが発生しました。再度お試しください。');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (showSignup) {
    return <SignupPage onShowLogin={() => setShowSignup(false)} />;
  }

  if (showForgotPassword) {
    return <ForgotPasswordPage onBackToLogin={() => setShowForgotPassword(false)} />;
  }

  return (
    <LoginForm 
      onLogin={handleLogin} 
      isLoading={isLoading} 
      onShowSignup={() => setShowSignup(true)}
      onShowForgotPassword={() => setShowForgotPassword(true)}
      onShowWelcome={onShowWelcome}
      serverError={serverError}
    />
  );
};