import React, { useState, useEffect } from "react";
import { OverviewCards } from "../analytics/OverviewCards";
import { Calendar } from "../calendar/Calendar";
import { CalendarView } from "../calendar/CalendarView";
import { Statistics } from "../analytics/Statistics";
import { Settings } from "../settings/Settings";
import { Navigation } from "./Navigation";
import { TodaySection } from "../analytics/TodaySection";
import { SettingsSidebar } from "../settings/SettingsSidebar";
import { PartnerConnection } from "../medical/PartnerConnection";
import { PregnancySupport } from "../medical/PregnancySupport";
import { SelfCare } from "../analytics/SelfCare";
import { MedicalRecords } from "../medical/MedicalRecords";
import { NotificationPopup } from "../modals/NotificationPopup";
import { NotificationBadge } from "../shared/NotificationBadge";
import { ConfirmationModal } from "../modals/ConfirmationModal";
import { MobileActions } from "./MobileActions";
import { authAPI } from "../../services/api";

interface MainLayoutProps {
  onLogout: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ onLogout }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<string>("dashboard");
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0); // 追加
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [userGender, setUserGender] = useState<string>("");
  const [userLoading, setUserLoading] = useState(true);

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

  // ユーザー情報を取得
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await authAPI.getUser();
        const user = (response.data as { user?: { name?: string; furigana?: string; gender?: string } })?.user;
        if (user) {
          // 名前またはフリガナを表示（名前が優先）
          const displayName = user.name || user.furigana || "ユーザー";
          setUserName(displayName);
          setUserGender(user.gender || "");
        }
      } catch (error) {
        console.error("Failed to fetch user info:", error);
        setUserName("ユーザー"); // フォールバック
        setUserGender("");
      } finally {
        setUserLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // 性別に基づく色分けのヘルパー関数
  const getGenderColors = (gender: string) => {
    const isMale = gender === 'male' || gender === '男性';
    
    return {
      bgColor: isMale ? 'bg-blue-50' : 'bg-primary-50',
      borderColor: isMale ? 'border-blue-200' : 'border-primary-200',
      iconBg: isMale ? 'bg-blue-100' : 'bg-primary-100',
      iconColor: isMale ? 'text-blue-600' : 'text-primary-600',
      textColor: isMale ? 'text-blue-700' : 'text-primary-700',
      textSecondary: isMale ? 'text-blue-600' : 'text-primary-600'
    };
  };

  // データ削除成功時にカレンダーをリフレッシュするためのハンドラ
  const handleDataDeleted = () => {
    setCalendarRefreshKey(prevKey => prevKey + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-medical sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">Pairiod</h1>
              {/* ユーザー名表示 */}
              {(() => {
                const colors = getGenderColors(userGender);
                return (
                  <div className={`hidden sm:flex items-center space-x-2 px-3 py-1.5 ${colors.bgColor} rounded-full border ${colors.borderColor}`}>
                    <div className={`w-6 h-6 ${colors.iconBg} rounded-full flex items-center justify-center`}>
                      <svg className={`w-3 h-3 ${colors.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <span className={`text-sm font-medium ${colors.textColor}`}>
                      {userLoading ? "..." : userName}
                    </span>
                  </div>
                );
              })()}
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Notification Button - Always visible */}
              <div className="relative">
                <button 
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className="p-2 sm:p-3 text-gray-400 hover:text-gray-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" 
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
                className="lg:hidden p-2 sm:p-3 text-gray-400 hover:text-gray-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
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
              
              {/* Desktop Logout Button */}
              <button
                onClick={handleLogoutClick}
                className="hidden lg:flex p-2 sm:p-3 text-gray-400 hover:text-red-600 transition-colors min-h-[44px] min-w-[44px] items-center justify-center"
                title="ログアウト"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Mobile Menu Drawer */}
      <div className={`lg:hidden fixed top-0 right-0 h-full w-72 sm:w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
        isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">メニュー</h2>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              setCurrentView(view);
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
            {currentView === "dashboard" && (
              <>
                {/* Overview Cards */}
                <OverviewCards />

                {/* Mobile Actions - only visible on mobile */}
                <MobileActions />

                {/* Calendar */}
                <Calendar />

                {/* Today Section */}
                <TodaySection />
              </>
            )}

            {currentView === "calendar" && (
              <CalendarView refreshKey={calendarRefreshKey} />
            )}

            {currentView === "statistics" && (
              <Statistics />
            )}

            {currentView === "pregnancy-support" && (
              <PregnancySupport />
            )}

            {currentView === "partner-connection" && (
              <PartnerConnection />
            )}

            {currentView === "self-care" && (
              <SelfCare />
            )}

            {currentView === "medical-records" && (
              <MedicalRecords />
            )}

            {currentView === "settings" && (
              <Settings 
                onDataDeleted={handleDataDeleted} 
                onLogout={isMobile ? onLogout : undefined}
              />
            )}
          </div>

          {/* Desktop Sidebar Navigation */}
          <div className="hidden lg:block lg:col-span-1">
            <Navigation 
              activeView={currentView}
              onViewChange={setCurrentView}
            />
          </div>
        </div>
      </div>

      {/* Settings Sidebar */}
      <SettingsSidebar 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onDataDeleted={handleDataDeleted} // 追加
      />

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <ConfirmationModal
          message="ログアウトしますか？"
          onConfirm={handleLogoutConfirm}
          onCancel={handleLogoutCancel}
        />
      )}
    </div>
  );
};
