import React, { useState } from 'react';
import { SignupForm } from './SignupForm';

interface SignupData {
  name: string;
  gender: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface SignupPageProps {
  onShowLogin?: () => void;
}

export const SignupPage: React.FC<SignupPageProps> = ({ onShowLogin }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (data: SignupData) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:8000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          gender: data.gender,
          phone: data.phone,
          email: data.email,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // 登録成功
        alert(`${result.data.user.name}さん、新規登録が完了しました！ログイン画面に戻ります。`);
        
        // ログイン画面に戻る
        if (onShowLogin) {
          onShowLogin();
        }
        
      } else {
        // エラーメッセージの表示
        const errorMessage = result.message || '新規登録に失敗しました。';
        alert(errorMessage);
      }
      
    } catch (error) {
      console.error('Signup error:', error);
      alert('ネットワークエラーが発生しました。再度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  return <SignupForm onSignup={handleSignup} isLoading={isLoading} onShowLogin={onShowLogin} />;
};