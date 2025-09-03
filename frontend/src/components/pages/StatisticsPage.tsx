import React, { useState, useEffect } from "react";
import { Statistics } from "../analytics/Statistics";
import { authAPI, partnerAPI } from "../../services/api";

export const StatisticsPage: React.FC = () => {
  const [isMaleWithPartner, setIsMaleWithPartner] = useState(false);
  const [loading, setLoading] = useState(true);

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
      } finally {
        setLoading(false);
      }
    };

    checkMalePartnerStatus();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-medical p-4 sm:p-6">
        <div className="flex items-center justify-center py-8 sm:py-12">
          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  // Show warning for male users with partner connection
  if (isMaleWithPartner) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-medical p-4 sm:p-6">
        <div className="text-center py-8 sm:py-12">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">アクセス制限</h3>
          <p className="text-sm text-gray-600 mb-4">
            パートナー連動中の男性ユーザーは統計機能をご利用いただけません。
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            戻る
          </button>
        </div>
      </div>
    );
  }

  return <Statistics />;
};