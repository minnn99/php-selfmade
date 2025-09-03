import React, { useState, useEffect } from "react";
import { OverviewCards } from "../analytics/OverviewCards";
import { Calendar } from "../calendar/Calendar";
import { TodaySection } from "../analytics/TodaySection";
import { MobileActions } from "../layout/MobileActions";
import { authAPI, partnerAPI } from "../../services/api";

export const DashboardPage: React.FC = () => {
  const [isMaleWithPartner, setIsMaleWithPartner] = useState(false);

  useEffect(() => {
    const checkMalePartnerStatus = async () => {
      try {
        const userData = await authAPI.getUser();
        const userGender = (userData.data as { user?: { gender?: string } })?.user?.gender || "";
        const isMale = userGender === "male" || userGender === "男性";

        if (isMale) {
          const partnerResponse = await partnerAPI.getStatus();
          const isConnected = partnerResponse.success && (partnerResponse.data as { is_connected?: boolean })?.is_connected;
          setIsMaleWithPartner(!!isConnected);
        } else {
          setIsMaleWithPartner(false);
        }
      } catch {
        setIsMaleWithPartner(false);
      }
    };

    checkMalePartnerStatus();
  }, []);

  return (
    <>
      {/* Overview Cards */}
      <OverviewCards />

      {/* Mobile Actions - only visible on mobile and not for male with partner */}
      {!isMaleWithPartner && <MobileActions />}

      {/* Calendar */}
      <Calendar />

      {/* Today Section - hide for male with partner */}
      {!isMaleWithPartner && <TodaySection />}
    </>
  );
};