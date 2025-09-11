import { useState, useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import { LoginPage } from "./components/auth/LoginPage";
import { SignupPage } from "./components/auth/SignupPage";
import { WelcomeScreen } from "./components/auth/WelcomeScreen";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { SessionExpiredModal } from "./components/modals/SessionExpiredModal";
import { authAPI } from "./services/api";
import { initializeTodayPeriodStatus } from "./utils/periodStatusHelper";
import { useTokenInteractionChecker } from "./hooks/useTokenInteractionChecker";
import { useUserStore } from "./stores/userStore";
import { initializeNotifications } from "./main";
import { ThemeProvider } from "./contexts/ThemeContext";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<"welcome" | "login" | "signup" | "main">("login");
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState("");

  // User store
  const { initializeUserData, clearUserData } = useUserStore();

  // Enable user interaction token checking
  useTokenInteractionChecker();

  useEffect(() => {
    let mounted = true;
    
    const checkAuth = () => {
      // 初回起動チェック
      const hasVisited = localStorage.getItem("has_visited");

      // 新しい認証システムで認証状態をチェック
      const isAuth = authAPI.isAuthenticated();

      if (!mounted) return; // コンポーネントがアンマウントされている場合は何もしない

      if (isAuth) {
        setIsAuthenticated(true);
        setCurrentView("main");
        // Start automatic token expiration checking
        authAPI.startTokenChecker();
        // Initialize user data in global store
        initializeUserData();
        // Initialize today's period status when authenticated
        initializeTodayPeriodStatus();
        // Initialize FCM notifications for logged-in users
        initializeNotifications();
      } else if (!hasVisited) {
        setCurrentView("welcome");
      } else {
        setCurrentView("login");
      }

      setIsLoading(false);
    };

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [initializeUserData]);

  // セッション期限切れ通知のイベントリスナー
  useEffect(() => {
    const handleSessionExpired = (event: CustomEvent<{ message: string }>) => {
      setSessionExpiredMessage(event.detail.message);
      setShowSessionExpiredModal(true);
    };

    window.addEventListener('sessionExpired', handleSessionExpired as EventListener);

    return () => {
      window.removeEventListener('sessionExpired', handleSessionExpired as EventListener);
    };
  }, []);

  const handleSessionExpiredModalClose = () => {
    setShowSessionExpiredModal(false);
    setIsAuthenticated(false);
    setCurrentView("login");
    authAPI.stopTokenChecker();
    // Clear user data from global store
    clearUserData();
  };

  // ページ遷移時にスクロール位置をトップに戻す
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView]);

  const handleLogout = async () => {
    // 新しい認証システムを使用してログアウト
    await authAPI.logout();
    authAPI.stopTokenChecker();
    // Clear user data from global store
    clearUserData();
    setIsAuthenticated(false);
    setCurrentView("login");
  };

  // ログイン画面表示時はトークンチェッカーを停止
  useEffect(() => {
    if (!isAuthenticated && currentView === "login") {
      authAPI.stopTokenChecker();
    }
  }, [isAuthenticated, currentView]);

  const handleGetStarted = () => {
    // 訪問フラグをセットして新規登録ページへ
    localStorage.setItem("has_visited", "true");
    setCurrentView("signup");
  };

  const handleWelcomeLogin = () => {
    // 訪問フラグをセットしてログインページへ
    localStorage.setItem("has_visited", "true");
    setCurrentView("login");
  };

  // ローディング中の表示
  if (isLoading) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-neutral-600 dark:text-gray-300">読み込み中...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  if (currentView === "welcome") {
    return (
      <ThemeProvider>
        <WelcomeScreen onGetStarted={handleGetStarted} onLogin={handleWelcomeLogin} />
      </ThemeProvider>
    );
  }

  // Add notification to notification center
  const addLoginNotification = (userName: string) => {
    // Get existing notifications
    const storedNotifications = localStorage.getItem("notifications");
    const notifications = storedNotifications ? JSON.parse(storedNotifications) : [];
    
    // Create new login notification
    const newNotification = {
      id: `login-${Date.now()}`,
      type: "system" as const,
      title: "ログイン成功",
      message: `${userName}さん、ログインしました`,
      timestamp: new Date().toISOString(),
      isRead: false,
      priority: "low" as const
    };
    
    // Add to notifications array (newest first)
    notifications.unshift(newNotification);
    
    // Keep only last 50 notifications
    if (notifications.length > 50) {
      notifications.pop();
    }
    
    // Save to localStorage
    localStorage.setItem("notifications", JSON.stringify(notifications));
    
    // Dispatch event to update notification badge
    window.dispatchEvent(new CustomEvent('notificationUpdated'));
  };

  const handleLoginSuccess = async () => {
    setIsAuthenticated(true);
    setCurrentView("main");
    authAPI.startTokenChecker();
    
    // Initialize user data in global store
    initializeUserData();
    // Initialize today's period status after login
    initializeTodayPeriodStatus();
    
    // Get user data and add notification
    try {
      const userData = await authAPI.getUser();
      const userName = (userData.data as { user?: { nickname?: string; name?: string } })?.user?.nickname || 
                       (userData.data as { user?: { nickname?: string; name?: string } })?.user?.name || 
                       "ユーザー";
      
      // Add login notification to notification center
      addLoginNotification(userName);
    } catch {
      // Add generic notification if user data fetch fails
      addLoginNotification("ユーザー");
    }
    
    // Check for redirect URL after login
    const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
    if (redirectUrl) {
      sessionStorage.removeItem('redirectAfterLogin');
      window.location.href = redirectUrl;
    }
  };

  if (currentView === "signup") {
    return (
      <ThemeProvider>
        <SignupPage onShowLogin={() => setCurrentView("login")} />
      </ThemeProvider>
    );
  }

  const handleShowWelcome = () => {
    localStorage.removeItem("has_visited");
    setCurrentView("welcome");
  };

  if (!isAuthenticated) {
    return (
      <ThemeProvider>
        <LoginPage key="login" onLoginSuccess={handleLoginSuccess} onShowWelcome={handleShowWelcome} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <BrowserRouter>
        <ProtectedRoute
          onUnauthorized={() => {
            setIsAuthenticated(false);
            setCurrentView("login");
            authAPI.stopTokenChecker();
            // Clear user data from global store
            clearUserData();
          }}
        >
          <MainLayout onLogout={handleLogout} />
        </ProtectedRoute>
        
        {/* セッション期限切れモーダル */}
        <SessionExpiredModal
          isOpen={showSessionExpiredModal}
          onClose={handleSessionExpiredModalClose}
          message={sessionExpiredMessage}
        />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
