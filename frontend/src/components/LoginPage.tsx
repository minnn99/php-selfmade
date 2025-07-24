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

  const handleLogin = async (email: string, password: string, rememberMe: boolean = false) => {
    setIsLoading(true);
    
    try {
      const response = await authAPI.login(email, password, rememberMe);

      if (response.success) {
        // ログイン成功
        alert(`${response.data.user.name}さん、ログインに成功しました！`);
        onLoginSuccess(); // App.tsxの状態を更新
      } else {
        // エラーメッセージの表示
        const errorMessage = response.message || 'ログインに失敗しました。';
        alert(errorMessage);
      }
      
    } catch (error) {
      console.error('Login error:', error);
      alert('ネットワークエラーが発生しました。再度お試しください。');
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
    />
  );
};