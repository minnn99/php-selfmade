import React, { useState, useEffect } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { Settings } from "../settings/Settings";
import { Navigation } from "./Navigation";
import { SettingsSidebar } from "../settings/SettingsSidebar";
import { NotificationPopup } from "../modals/NotificationPopup";
import { NotificationBadge } from "../shared/NotificationBadge";
import { ConfirmationModal } from "../modals/ConfirmationModal";
import { SessionExpiredModal } from "../modals/SessionExpiredModal";
import { authAPI } from "../../services/api";
import { DarkModeToggle } from "../shared/DarkModeToggle";
import { notificationManager } from "../../services/notificationManager";

// Page components
import { DashboardPage } from "../pages/DashboardPage";
import { StatisticsPage } from "../pages/StatisticsPage";
import { StatisticsUnavailablePage } from "../pages/StatisticsUnavailablePage";
import { SelfCarePage } from "../pages/SelfCarePage";
import { PartnerConnectionPage } from "../pages/PartnerConnectionPage";
import { PregnancySupportPage } from "../pages/PregnancySupportPage";
import { MedicalRecordsPage } from "../pages/MedicalRecordsPage";
import { DailyRecordsPage } from "../pages/DailyRecordsPage";

interface MainLayoutProps {
  onLogout: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [userGender, setUserGender] = useState<string>("");
  const [userLoading, setUserLoading] = useState(true);
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // URLパスから現在のビューを決定
  const getCurrentView = () => {
    const path = location.pathname;
    if (path === "/" || path === "/dashboard") return "dashboard";
    if (path === "/statistics") return "statistics";
    if (path === "/self-care") return "self-care";
    if (path === "/partner-connection") return "partner-connection";
    if (path === "/pregnancy-support") return "pregnancy-support";
    if (path === "/medical-records") return "medical-records";
    if (path === "/daily-records") return "daily-records";
    if (path === "/settings") return "settings";
    return "dashboard";
  };

  const currentView = getCurrentView();

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = () => {
    setShowLogoutModal(false);
    onLogout();
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  const handleSessionExpiredClose = () => {
    setShowSessionExpiredModal(false);
    // ログアウト処理を実行（既にapi.tsで処理中だが、確実にするため）
    onLogout();
  };


  // ユーザー情報を取得
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        // まずローカル認証データから取得を試行
        const authData = authAPI.getAuthData();
        
        // APIから基本ユーザーデータと設定データを並行取得
        const [userResponse, settingsResponse] = await Promise.all([
          authAPI.getUser().catch((error) => {
            // 401エラーの場合は通知処理が既にapi.tsで実行されているので、エラーを再スロー
            if (error?.response?.status === 401) {
              throw error;
            }
            return { success: false, data: null };
          }),
          import('../../services/api').then(api => api.userDataAPI.getSettings().catch(() => ({ success: false, data: null })))
        ]);

        const apiUser = (userResponse.data as { user?: { name?: string; furigana?: string; gender?: string } })?.user;
        const settings = (settingsResponse.data as { userProfile?: { nickname?: string; fullName?: string } })?.userProfile;
        
        // ローカル認証データを取得
        const localUser = authData?.user;
        
        // 表示名の優先順位: 1.設定のニックネーム 2.ローカル認証データの名前 3.API名前 4.フリガナ 5.デフォルト
        let displayName = "ユーザー";
        let userGender = "";
        
        // ニックネーム（設定データ）を最優先
        if (settings?.nickname && typeof settings.nickname === 'string' && settings.nickname.trim()) {
          displayName = settings.nickname.trim();
        }
        // 次にローカル認証データの名前
        else if (localUser?.name && typeof localUser.name === 'string' && localUser.name.trim()) {
          displayName = localUser.name.trim();
        }
        // 次にAPI名前
        else if (apiUser?.name && typeof apiUser.name === 'string' && apiUser.name.trim()) {
          displayName = apiUser.name.trim();
        }
        // 最後にフリガナ
        else if (apiUser?.furigana && typeof apiUser.furigana === 'string' && apiUser.furigana.trim()) {
          displayName = apiUser.furigana.trim();
        }

        // 性別を設定（ローカル優先、次にAPI）
        if (localUser?.gender && typeof localUser.gender === 'string') {
          userGender = localUser.gender;
        } else if (apiUser?.gender && typeof apiUser.gender === 'string') {
          userGender = apiUser.gender;
        }

        setUserName(displayName);
        setUserGender(userGender);
      } catch (error) {
        
        // 401エラーの場合は、api.tsで既に通知処理が実行されているため、ここでは何もしない
        if ((error as { response?: { status: number } })?.response?.status === 401) {
          // セッション切れの場合は、ユーザー情報をクリアして処理を中断
          setUserName("");
          setUserGender("");
          setUserLoading(false);
          return;
        }
        
        // その他のエラーの場合はフォールバック値を設定
        setUserName("ユーザー");
        setUserGender("");
      } finally {
        setUserLoading(false);
      }
    };

    fetchUserInfo();

    // プロフィール更新時の再読み込みリスナー
    const handleProfileUpdate = () => {
      fetchUserInfo();
    };

    window.addEventListener('userProfileUpdated', handleProfileUpdate);

    return () => {
      window.removeEventListener('userProfileUpdated', handleProfileUpdate);
    };
  }, []);

  // セッション期限切れイベントのリスナー
  useEffect(() => {
    const handleSessionExpired = (event: CustomEvent) => {
      const message = event.detail?.message || 'セッションの有効期限が切れました。再度ログインしてください。';
      setSessionExpiredMessage(message);
      setShowSessionExpiredModal(true);
    };

    window.addEventListener('sessionExpired', handleSessionExpired as EventListener);

    return () => {
      window.removeEventListener('sessionExpired', handleSessionExpired as EventListener);
    };
  }, []);


  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Initialize notification manager
  useEffect(() => {
    // Initialize notification manager and check for today's notifications
    notificationManager.checkTodayNotifications();

    // アプリ起動時に生理データ更新イベントを発火して通知をスケジュール
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('menstrualDataUpdated'));
    }, 1000); // 1秒遅延で実行
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // ドロップダウンの外側をクリックした時にメニューを閉じる
      if (showUserDropdown) {
        const target = event.target as Element;
        if (!target.closest('.user-dropdown-container')) {
          setShowUserDropdown(false);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showUserDropdown]);

  // 性別に基づく色分けのヘルパー関数
  const getGenderColors = (gender: string) => {
    const isMale = gender === 'male' || gender === '男性';
    
    return {
      bgColor: isMale ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-primary-50 dark:bg-primary-900/30',
      borderColor: isMale ? 'border-blue-200 dark:border-blue-700' : 'border-primary-200 dark:border-primary-700',
      iconBg: isMale ? 'bg-blue-100 dark:bg-blue-800' : 'bg-primary-100 dark:bg-primary-800',
      iconColor: isMale ? 'text-blue-600 dark:text-blue-400' : 'text-primary-600 dark:text-primary-400',
      textColor: isMale ? 'text-blue-700 dark:text-blue-300' : 'text-primary-700 dark:text-primary-300',
      textSecondary: isMale ? 'text-blue-600 dark:text-blue-400' : 'text-primary-600 dark:text-primary-400'
    };
  };

  // データ削除成功時にカレンダーをリフレッシュするためのハンドラ
  const handleDataDeleted = () => {
    // カレンダーデータ更新イベントを発火
    window.dispatchEvent(new Event('menstrualDataUpdated'));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-medical dark:border-gray-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">Pairiod</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Dark Mode Toggle */}
              <DarkModeToggle />

              {/* Notification Button - Always visible */}
              <div className="relative">
                <button
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className="p-2 sm:p-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title="通知"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <NotificationBadge />
                </button>

                <NotificationPopup
                  isOpen={isNotificationOpen}
                  onClose={() => setIsNotificationOpen(false)}
                />
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 sm:p-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="メニュー"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>

              {/* Desktop User Menu with Dropdown */}
              {(() => {
                const colors = getGenderColors(userGender);
                return (
                  <div className="hidden lg:block relative user-dropdown-container">
                    <button
                      onClick={() => setShowUserDropdown(!showUserDropdown)}
                      className={`flex items-center justify-center w-10 h-10 ${colors.iconBg} rounded-full hover:bg-opacity-80 transition-colors`}
                      title={userLoading ? "..." : userName}
                    >
                      <svg className={`w-5 h-5 ${colors.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {showUserDropdown && (
                      <>
                        {/* Backdrop */}
                        <div
                          className="fixed inset-0 z-10 animate-[fadeIn_0.15s_ease-out]"
                          onClick={() => setShowUserDropdown(false)}
                        />

                        {/* Dropdown Content */}
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 animate-[dropdownIn_0.2s_ease-out] origin-top-right">
                          {/* User Info */}
                          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {userLoading ? "読み込み中..." : userName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {userGender === '女性' || userGender === 'female' ? '女性' : '男性'}
                            </p>
                          </div>

                          {/* Menu Items */}
                          <div className="py-1">
                            <button
                              onClick={() => {
                                setShowUserDropdown(false);
                                handleLogoutClick();
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                              </svg>
                              ログアウト
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Mobile Menu Drawer */}
      <div className={`lg:hidden fixed top-0 right-0 h-full w-72 sm:w-80 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
        isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">メニュー</h2>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* モバイル版ユーザー情報 */}
          {(() => {
            const colors = getGenderColors(userGender);
            return (
              <div className={`mt-4 flex items-center space-x-3 p-3 ${colors.bgColor} rounded-lg border ${colors.borderColor}`}>
                <div className={`w-8 h-8 ${colors.iconBg} rounded-full flex items-center justify-center`}>
                  <svg className={`w-4 h-4 ${colors.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className={`text-sm font-medium ${colors.textColor}`}>
                    {userLoading ? "読み込み中..." : userName}
                  </p>
                  <p className={`text-xs ${colors.textSecondary}`}>ログイン中</p>
                </div>
              </div>
            );
          })()}
        </div>
        <div className="overflow-y-auto h-full pb-20">
          <Navigation 
            activeView={currentView}
            onViewChange={(view) => {
              navigate(`/${view}`);
              setIsMobileMenuOpen(false);
            }}
            mobileMenuOnly={true}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-4 sm:space-y-6 lg:space-y-8 w-full">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route 
                path="/statistics" 
                element={
                  userGender === "male" || userGender === "男性" ? 
                    <StatisticsUnavailablePage /> : 
                    <StatisticsPage />
                } 
              />
              <Route path="/pregnancy-support" element={<PregnancySupportPage />} />
              <Route path="/partner-connection" element={<PartnerConnectionPage />} />
              <Route path="/self-care" element={<SelfCarePage />} />
              <Route path="/medical-records" element={<MedicalRecordsPage />} />
              <Route path="/daily-records" element={<DailyRecordsPage />} />
              <Route path="/settings" element={
                <Settings 
                  onDataDeleted={handleDataDeleted} 
                  onLogout={isMobile ? onLogout : undefined}
                />
              } />
            </Routes>
          </div>

          {/* Desktop Sidebar Navigation */}
          <div className="hidden lg:block lg:col-span-1">
            <Navigation 
              activeView={currentView}
              onViewChange={(view) => navigate(`/${view}`)}
            />
          </div>
        </div>
      </div>

      {/* Settings Sidebar */}
      <SettingsSidebar 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onDataDeleted={handleDataDeleted}
      />

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <ConfirmationModal
          message="ログアウトしますか？"
          onConfirm={handleLogoutConfirm}
          onCancel={handleLogoutCancel}
        />
      )}

      {/* Session Expired Modal */}
      <SessionExpiredModal
        isOpen={showSessionExpiredModal}
        onClose={handleSessionExpiredClose}
        message={sessionExpiredMessage}
      />
    </div>
  );
};
