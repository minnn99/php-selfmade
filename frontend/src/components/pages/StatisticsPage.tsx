import React, { useState, useEffect } from "react";
import { Statistics } from "../analytics/Statistics";
import { authAPI } from "../../services/api";
import { FadeInUp, ScaleIn } from "../animations";

export const StatisticsPage: React.FC = () => {
  const [isMaleUser, setIsMaleUser] = useState(false);
  const [loading, setLoading] = useState(true);

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
        setLoading(false);
      }
    };

    checkUserGender();
  }, []);

  if (loading) {
    return (
      <ScaleIn delay={100}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-medical dark:border-gray-700 p-4 sm:p-6">
          <div className="flex items-center justify-center py-8 sm:py-12">
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </ScaleIn>
    );
  }

  // Show warning for male users
  if (isMaleUser) {
    return (
      <FadeInUp delay={100}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-medical dark:border-gray-700 p-4 sm:p-6">
          <div className="text-center py-8 sm:py-12">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">アクセス制限</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              男性ユーザーは統計機能をご利用いただけません。
            </p>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              戻る
            </button>
          </div>
        </div>
      </FadeInUp>
    );
  }

  return (
    <FadeInUp delay={100}>
      <Statistics />
    </FadeInUp>
  );
};