import React, { useState } from "react";
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

interface MainLayoutProps {
  onLogout: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ onLogout }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<string>("dashboard");
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0); // 追加

  // データ削除成功時にカレンダーをリフレッシュするためのハンドラ
  const handleDataDeleted = () => {
    setCalendarRefreshKey(prevKey => prevKey + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-medical">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">Pairiod</h1>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors" title="通知">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                onClick={onLogout}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                title="ログアウト"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {currentView === "dashboard" && (
              <>
                {/* Overview Cards */}
                <OverviewCards />

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

            {currentView === "settings" && (
              <Settings onDataDeleted={handleDataDeleted} />
            )}
          </div>

          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
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
    </div>
  );
};
