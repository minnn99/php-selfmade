import React, { useState } from 'react';
import { ForgotPasswordForm } from './ForgotPasswordForm';

interface ForgotPasswordPageProps {
  onBackToLogin: () => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onBackToLogin }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (email: string) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:8000/api/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('パスワードリセット用のリンクをメールに送信しました。メールをご確認ください。');
        onBackToLogin();
      } else {
        const errorMessage = data.message || 'パスワードリセットに失敗しました。';
        alert(errorMessage);
      }
      
    } catch {
      alert('ネットワークエラーが発生しました。再度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ForgotPasswordForm 
      onSubmit={handleSubmit} 
      onBackToLogin={onBackToLogin}
      isLoading={isLoading} 
    />
  );
};