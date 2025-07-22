import { useState, useEffect } from "react";
import { MainLayout } from "./components/MainLayout";
import { LoginPage } from "./components/LoginPage";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { authAPI } from "./services/api";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<"welcome" | "login" | "main">("login");

  useEffect(() => {
    // 初回起動チェック
    const hasVisited = localStorage.getItem("has_visited");

    // 新しい認証システムで認証状態をチェック
    const isAuth = authAPI.isAuthenticated();

    if (isAuth) {
      setIsAuthenticated(true);
      setCurrentView("main");
      // Start automatic token expiration checking
      authAPI.startTokenChecker();
    } else if (!hasVisited) {
      setCurrentView("welcome");
    } else {
      setCurrentView("login");
    }

    setIsLoading(false);
  }, []);

  const handleLogout = async () => {
    // 新しい認証システムを使用してログアウト
    await authAPI.logout();
    authAPI.stopTokenChecker();
    setIsAuthenticated(false);
    setCurrentView("login");
  };

  const handleGetStarted = () => {
    // 訪問フラグをセットして登録ページへ
    localStorage.setItem("has_visited", "true");
    setCurrentView("login");
  };

  const handleWelcomeLogin = () => {
    // 訪問フラグをセットしてログインページへ
    localStorage.setItem("has_visited", "true");
    setCurrentView("login");
  };

  // ローディング中の表示
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (currentView === "welcome") {
    return <WelcomeScreen onGetStarted={handleGetStarted} onLogin={handleWelcomeLogin} />;
  }

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setCurrentView("main");
    authAPI.startTokenChecker();
    
    // Check for redirect URL after login
    const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
    if (redirectUrl) {
      sessionStorage.removeItem('redirectAfterLogin');
      window.location.href = redirectUrl;
    }
  };

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <ProtectedRoute
      onUnauthorized={() => {
        setIsAuthenticated(false);
        setCurrentView("login");
        authAPI.stopTokenChecker();
      }}
    >
      <MainLayout onLogout={handleLogout} />
    </ProtectedRoute>
  );
}

export default App;
