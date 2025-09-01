import React from "react";
import { OverviewCards } from "../analytics/OverviewCards";
import { Calendar } from "../calendar/Calendar";
import { TodaySection } from "../analytics/TodaySection";
import { MobileActions } from "../layout/MobileActions";

export const DashboardPage: React.FC = () => {
  return (
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
  );
};