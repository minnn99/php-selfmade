import React, { useEffect, useState } from 'react';
import { authAPI } from '../services/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onUnauthorized?: () => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback,
  onUnauthorized
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthentication();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuthentication = async () => {
    try {
      // Check if user is authenticated
      const isAuth = authAPI.isAuthenticated();
      
      if (isAuth) {
        // Verify with server if token is still valid
        try {
          await authAPI.getUser();
          setIsAuthenticated(true);
        } catch (error) {
          // Token is invalid or expired
          console.warn('Token validation failed:', error);
          setIsAuthenticated(false);
          handleUnauthorized();
        }
      } else {
        setIsAuthenticated(false);
        handleUnauthorized();
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      setIsAuthenticated(false);
      handleUnauthorized();
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnauthorized = () => {
    if (onUnauthorized) {
      onUnauthorized();
    } else {
      // Default behavior: redirect to login
      window.location.href = '/';
    }
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">認証状態を確認中...</p>
        </div>
      </div>
    );
  }

  // Show fallback or redirect if not authenticated
  if (!isAuthenticated) {
    return (
      fallback || (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center">
          <div className="text-center p-8">
            <div className="text-red-500 text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">アクセスが拒否されました</h2>
            <p className="text-gray-600 mb-4">このページにアクセスするにはログインが必要です。</p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              ログインページに戻る
            </button>
          </div>
        </div>
      )
    );
  }

  // Render protected content if authenticated
  return <>{children}</>;
};

// Higher-Order Component version for easier usage
// eslint-disable-next-line react-refresh/only-export-components
export const withAuthProtection = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: {
    fallback?: React.ReactNode;
    onUnauthorized?: () => void;
  }
) => {
  return (props: P) => (
    <ProtectedRoute 
      fallback={options?.fallback}
      onUnauthorized={options?.onUnauthorized}
    >
      <WrappedComponent {...props} />
    </ProtectedRoute>
  );
};