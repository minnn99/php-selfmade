import React, { useState } from "react";
import { OverviewCards } from "./OverviewCards";
import { Calendar } from "./Calendar";
import { CalendarView } from "./CalendarView";
import { Navigation } from "./Navigation";
import { TodaySection } from "./TodaySection";
import { SettingsSidebar } from "./SettingsSidebar";
import { PartnerConnection } from "./PartnerConnection";

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
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="設定"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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

                {/* Partner Connection */}
                <PartnerConnection />
              </>
            )}

            {currentView === "calendar" && (
              <CalendarView refreshKey={calendarRefreshKey} />
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
