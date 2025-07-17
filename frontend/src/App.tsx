import { useState, useEffect } from "react";
import { MainLayout } from "./components/MainLayout";
import { LoginPage } from "./components/LoginPage";
import { WelcomeScreen } from "./components/WelcomeScreen";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [currentView, setCurrentView] = useState<"welcome" | "login" | "main">("login");

  useEffect(() => {
    // 初回起動チェック
    const hasVisited = localStorage.getItem("has_visited");

    // ローカルストレージから認証トークンを確認
    const token = localStorage.getItem("auth_token");
    const user = localStorage.getItem("user");

    if (token && user) {
      setIsAuthenticated(true);
      setCurrentView("main");
    } else if (!hasVisited) {
      setIsFirstTime(true);
      setCurrentView("welcome");
    } else {
      setCurrentView("login");
    }

    setIsLoading(false);
  }, []);

  const handleLogout = () => {
    // ローカルストレージから認証情報を削除
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setCurrentView("login");
  };

  const handleGetStarted = () => {
    // 訪問フラグをセットして登録ページへ
    localStorage.setItem("has_visited", "true");
    setIsFirstTime(false);
    setCurrentView("login");
  };

  const handleWelcomeLogin = () => {
    // 訪問フラグをセットしてログインページへ
    localStorage.setItem("has_visited", "true");
    setIsFirstTime(false);
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

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <MainLayout onLogout={handleLogout} />;
}

export default App;
