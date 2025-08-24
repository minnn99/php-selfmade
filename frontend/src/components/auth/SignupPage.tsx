import React, { useState } from 'react';
import { SignupForm } from './SignupForm';
import { SignupConfirmPage } from './SignupConfirmPage';

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

interface SignupPageProps {
  onShowLogin?: () => void;
}

export const SignupPage: React.FC<SignupPageProps> = ({ onShowLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<'form' | 'confirm'>('form');
  const [signupData, setSignupData] = useState<SignupData | null>(null);

  const handleSignupFormSubmit = (data: SignupData) => {
    setSignupData(data);
    setCurrentStep('confirm');
  };

  const handleEditSignup = () => {
    setCurrentStep('form');
  };

  const handleConfirmSignup = async () => {
    if (!signupData) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:8000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: signupData.name,
          furigana: signupData.furigana,
          gender: signupData.gender,
          phone: signupData.phone,
          email: signupData.email,
          password: signupData.password,
          password_confirmation: signupData.password,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // 登録成功 - ニックネームを設定データとして保存
        try {
          // 認証トークンを設定
          const authData = {
            token: result.data.token,
            expires_at: result.data.expires_at,
            user: result.data.user
          };
          localStorage.setItem('auth_data', JSON.stringify(authData));

          // ニックネームを設定データとして保存
          const settingsResponse = await fetch('http://localhost:8000/api/user-data/settings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': `Bearer ${result.data.token}`,
            },
            body: JSON.stringify({
              settings: {
                userProfile: {
                  nickname: signupData.nickname,
                  fullName: signupData.name,
                  email: signupData.email,
                  phone: signupData.phone,
                  gender: signupData.gender,
                }
              }
            }),
          });

          if (settingsResponse.ok) {
          } else {
          }
        } catch (settingsError) {
        }

        alert(`${signupData.nickname || signupData.name}さん、新規登録が完了しました！ログイン画面に戻ります。`);
        
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
      alert('ネットワークエラーが発生しました。再度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  if (currentStep === 'confirm' && signupData) {
    return (
      <SignupConfirmPage
        signupData={signupData}
        onConfirm={handleConfirmSignup}
        onEdit={handleEditSignup}
        isLoading={isLoading}
      />
    );
  }

  return (
    <SignupForm 
      onSignup={handleSignupFormSubmit} 
      isLoading={isLoading} 
      onShowLogin={onShowLogin}
      initialData={signupData || undefined}
    />
  );
};