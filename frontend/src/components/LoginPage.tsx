import React, { useState } from 'react';
import { LoginForm } from './LoginForm';

export const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // ログイン成功
        localStorage.setItem('auth_token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        
        alert(`${data.data.user.name}さん、ログインに成功しました！`);
        
        // メイン画面にリダイレクト（後で実装）
        window.location.reload();
        
      } else {
        // エラーメッセージの表示
        const errorMessage = data.message || 'ログインに失敗しました。';
        alert(errorMessage);
      }
      
    } catch (error) {
      console.error('Login error:', error);
      alert('ネットワークエラーが発生しました。再度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  return <LoginForm onLogin={handleLogin} isLoading={isLoading} />;
};