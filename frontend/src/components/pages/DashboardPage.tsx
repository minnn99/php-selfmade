import React, { useState, useEffect } from "react";
import { OverviewCards } from "../analytics/OverviewCards";
import { Calendar } from "../calendar/Calendar";
import { TodaySection } from "../analytics/TodaySection";
import { MobileActions } from "../layout/MobileActions";
import { authAPI } from "../../services/api";
import { FadeInUp } from "../animations";

export const DashboardPage: React.FC = () => {
  const [isMaleUser, setIsMaleUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUserGender = async () => {
      try {
        const userData = await authAPI.getUser();
        const userGender = (userData.data as { user?: { gender?: string } })?.user?.gender || "";
        const isMale = userGender === "male" || userGender === "男性";
        setIsMaleUser(isMale);
      } catch {
        setIsMaleUser(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserGender();
  }, []);

  return (
    <>
      {/* Overview Cards */}
      <FadeInUp delay={100}>
        <OverviewCards />
      </FadeInUp>

      {/* Mobile Actions - hide for male users */}
      {!isLoading && !isMaleUser && (
        <FadeInUp delay={200}>
          <MobileActions />
        </FadeInUp>
      )}

      {/* Calendar */}
      <FadeInUp delay={300}>
        <Calendar />
      </FadeInUp>

      {/* Today Section - hide for male users */}
      {!isLoading && !isMaleUser && (
        <FadeInUp delay={100}>
          <TodaySection />
        </FadeInUp>
      )}
    </>
  );
};
