import React, { useState, useEffect } from "react";
import { OverviewCards } from "./OverviewCards";
import { Calendar } from "./Calendar";
import { CalendarView } from "./CalendarView";
import { Statistics } from "./Statistics";
import { Settings } from "./Settings";
import { Navigation } from "./Navigation";
import { TodaySection } from "./TodaySection";
import { SettingsSidebar } from "./SettingsSidebar";
import { PartnerConnection } from "./PartnerConnection";
import { PregnancySupport } from "./PregnancySupport";
import { SelfCare } from "./SelfCare";
import { MedicalRecords } from "./MedicalRecords";
import { NotificationPopup } from "./NotificationPopup";
import { NotificationBadge } from "./NotificationBadge";
import { ConfirmationModal } from "./ConfirmationModal";
import { MobileActions } from "./MobileActions";

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

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

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
            <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">Pairiod</h1>
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
