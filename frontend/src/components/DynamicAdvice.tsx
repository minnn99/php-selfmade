import React, { useState, useEffect } from "react";
import { menstrualStatusManager } from "../services/menstrualStatusManager";
import { menstrualCycleAPI } from "../services/api";

interface DynamicAdviceProps {
  className?: string;
}

interface AdviceContent {
  title: string;
  message: string;
  bgColor: string;
  textColor: string;
}

export const DynamicAdvice: React.FC<DynamicAdviceProps> = ({ className = "" }) => {
  const [currentAdvice, setCurrentAdvice] = useState<AdviceContent>({
    title: "今日のアドバイス",
    message: "読み込み中...",
    bgColor: "from-primary-50 to-purple-50",
    textColor: "text-primary-600",
  });

  // Subscribe to menstrual status updates
  useEffect(() => {
    console.log("DynamicAdvice - Subscribing to menstrual status updates");
    const unsubscribe = menstrualStatusManager.subscribe((status) => {
      console.log("DynamicAdvice - Received status update:", status);
      updateAdviceBasedOnStatus(status);
    });

    return unsubscribe;
  }, []);

  const updateAdviceBasedOnStatus = async (status: any) => {
    console.log("DynamicAdvice - Status received for advice update:", status);

    if (!status) {
      setDefaultAdvice();
      return;
    }

    // 今日のカレンダーデータを取得
    const today = new Date();
    const todayString = today.toISOString().split("T")[0];

    try {
      const calendarResponse = await menstrualCycleAPI.getCalendarData(today.getFullYear(), today.getMonth() + 1);
      const todayData = calendarResponse.data[todayString];

      console.log("DynamicAdvice - Today calendar data:", todayData);
      console.log("DynamicAdvice - Today string:", todayString);
      console.log("DynamicAdvice - Calendar response data keys:", Object.keys(calendarResponse.data || {}));

      // 今日のカレンダーステータスに基づいてアドバイスを決定
      if (todayData) {
        console.log("DynamicAdvice - Today data found, checking status...");
        console.log("DynamicAdvice - hasPeriod:", todayData.hasPeriod);
        console.log("DynamicAdvice - isPeriodStart:", todayData.isPeriodStart);
        console.log("DynamicAdvice - isPeriodEnd:", todayData.isPeriodEnd);
        console.log("DynamicAdvice - isOvulation:", todayData.isOvulation);
        console.log("DynamicAdvice - isFertile:", todayData.isFertile);
        console.log("DynamicAdvice - isPredictedPeriod:", todayData.isPredictedPeriod);

        if (todayData.hasPeriod || todayData.isPeriodStart || todayData.isPeriodEnd) {
          // 実際の生理日
          const dayNumber = getDayOfPeriod(todayData);
          console.log("DynamicAdvice - Setting period advice, day number:", dayNumber);
          setCurrentAdvice({
            title: "生理中のケア",
            message: `生理${dayNumber}日目です。温かい飲み物を飲んで体を温め、無理をせずゆっくり過ごしましょう。鉄分を含む食品で栄養補給も大切です。`,
            bgColor: "from-red-50 to-pink-50",
            textColor: "text-red-600",
          });
          return;
        } else if (todayData.isOvulation) {
          // 排卵日
          setCurrentAdvice({
            title: "排卵期",
            message: "排卵期です。体温が上がりやすいので、水分補給を忘れずに。妊娠を希望する場合は重要な時期です。",
            bgColor: "from-pink-50 to-rose-50",
            textColor: "text-pink-600",
          });
          return;
        } else if (todayData.isFertile) {
          // 妊娠可能期間
          setCurrentAdvice({
            title: "妊娠可能期間",
            message: "妊娠可能期間です。体調管理に気をつけて、バランスの良い食事を心がけましょう。",
            bgColor: "from-pink-50 to-rose-50",
            textColor: "text-pink-600",
          });
          return;
        } else if (todayData.isPredictedPeriod) {
          // 予測生理日
          setCurrentAdvice({
            title: "生理予定日",
            message: "生理予定日です。体を温めて、軽いストレッチで血流を改善しましょう。十分な休息も忘れずに。",
            bgColor: "from-red-50 to-pink-50",
            textColor: "text-red-600",
          });
          return;
        } else {
          // 今日のデータがあるが特別なステータスがない場合
          console.log("DynamicAdvice - Today data found but no special status, setting default advice");
          setCurrentAdvice({
            title: "エネルギー充実期",
            message: "体調が良い時期です。新しいことにチャレンジしたり、運動を始めるのに最適な時期です。",
            bgColor: "from-green-50 to-emerald-50",
            textColor: "text-green-600",
          });
          return;
        }
      } else {
        // 今日のデータがない場合
        console.log("DynamicAdvice - No today data found in calendar response");
      }
    } catch (error) {
      console.error("DynamicAdvice - Failed to get calendar data for advice:", error);
    }

    // カレンダーデータが取得できない場合は従来のロジックを使用
    const cycleDay = getCycleDay(status, today);

    console.log("DynamicAdvice - Calculated cycle day:", cycleDay, "hasActiveCycle:", status?.hasActiveCycle);

    // 実際に生理中（アクティブな周期があり、かつその周期が現在進行中）の場合
    if (status?.hasActiveCycle && status?.activeCycle && !status?.activeCycle?.end_date) {
      const activeCycleStart = new Date(status.activeCycle.start_date);
      const daysSinceStart = Math.floor((today.getTime() - activeCycleStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      if (daysSinceStart >= 1 && daysSinceStart <= 7) {
        setCurrentAdvice({
          title: "生理中のケア",
          message: `生理開始から${daysSinceStart}日目です。温かい飲み物を飲んで体を温め、無理をせずゆっくり過ごしましょう。鉄分を含む食品で栄養補給も大切です。`,
          bgColor: "from-red-50 to-pink-50",
          textColor: "text-red-600",
        });
        return;
      }
    }

    // 周期に基づいた予測（生理中でない場合）
    if (cycleDay >= 1 && cycleDay <= 5) {
      // 生理期間（予測）
      setCurrentAdvice({
        title: "生理期間の予測",
        message: "生理予定期間です。体を温めて、軽いストレッチで血流を改善しましょう。十分な休息も忘れずに。",
        bgColor: "from-red-50 to-pink-50",
        textColor: "text-red-600",
      });
    } else if (cycleDay >= 6 && cycleDay <= 13) {
      // 卵胞期
      setCurrentAdvice({
        title: "エネルギー充実期",
        message: "体調が良い時期です。新しいことにチャレンジしたり、運動を始めるのに最適な時期です。",
        bgColor: "from-green-50 to-emerald-50",
        textColor: "text-green-600",
      });
    } else if (cycleDay >= 14 && cycleDay <= 16) {
      // 排卵期
      setCurrentAdvice({
        title: "排卵期",
        message: "排卵期です。体温が上がりやすいので、水分補給を忘れずに。妊娠を希望する場合は重要な時期です。",
        bgColor: "from-pink-50 to-rose-50",
        textColor: "text-pink-600",
      });
    } else if (cycleDay >= 17 && cycleDay <= 24) {
      // 黄体期前期
      setCurrentAdvice({
        title: "安定期",
        message: "比較的安定した時期です。バランスの良い食事と適度な運動を心がけましょう。",
        bgColor: "from-yellow-50 to-orange-50",
        textColor: "text-yellow-600",
      });
    } else if (cycleDay >= 25 && cycleDay <= 28) {
      // 黄体期後期（PMS期間）
      setCurrentAdvice({
        title: "PMS期間",
        message: "生理前の時期です。イライラや体調不良を感じやすい時期なので、リラックスを心がけ、カフェインを控えめにしましょう。",
        bgColor: "from-purple-50 to-indigo-50",
        textColor: "text-purple-600",
      });
    } else {
      // 状態不明の場合はデフォルトアドバイス
      setDefaultAdvice();
    }
  };

  const getDayOfPeriod = (todayData: any): number => {
    // 今日が開始日なら1日目
    if (todayData.isPeriodStart) {
      return 1;
    }

    // アクティブな周期がある場合、開始日から今日までの日数を計算
    const currentStatus = menstrualStatusManager.getCurrentStatus();
    if (currentStatus?.hasActiveCycle && currentStatus?.activeCycle?.start_date) {
      const startDate = new Date(currentStatus.activeCycle.start_date);
      const today = new Date();
      const diffTime = today.getTime() - startDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

      // 生理期間内（一般的に1-7日）の場合のみ返す
      if (diffDays >= 1 && diffDays <= 7) {
        return diffDays;
      }
    }

    // デフォルトとして1を返す
    return 1;
  };

  const getCycleDay = (status: any, currentDate: Date): number => {
    // アクティブな周期がある場合、その開始日からの日数を返す
    if (status?.hasActiveCycle && status?.activeCycle?.start_date) {
      const activeCycleStart = new Date(status.activeCycle.start_date);
      const diffTime = currentDate.getTime() - activeCycleStart.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    }

    // アクティブな周期がない場合、最後の周期から予測
    if (status?.lastCycle?.start_date) {
      const lastCycleStart = new Date(status.lastCycle.start_date);
      const diffTime = currentDate.getTime() - lastCycleStart.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      // 最後の周期の長さを取得（デフォルト28日）
      const cycleLength = status?.lastCycle?.cycle_length || 28;

      // 周期内の日数を計算
      return (diffDays % cycleLength) + 1;
    }

    return 1; // デフォルト値
  };

  const setDefaultAdvice = () => {
    const advices = [
      {
        title: "今日のアドバイス",
        message: "規則正しい生活リズムを心がけて、自分の体と向き合う時間を大切にしましょう。",
        bgColor: "from-primary-50 to-purple-50",
        textColor: "text-primary-600",
      },
      {
        title: "健康のヒント",
        message: "水分補給を忘れずに。1日1.5-2リットルの水を飲むことで、体調管理に役立ちます。",
        bgColor: "from-blue-50 to-cyan-50",
        textColor: "text-blue-600",
      },
      {
        title: "セルフケア",
        message: "深呼吸や軽いストレッチで、日々のストレスを和らげましょう。5分でも効果があります。",
        bgColor: "from-green-50 to-teal-50",
        textColor: "text-green-600",
      },
    ];

    const randomAdvice = advices[Math.floor(Math.random() * advices.length)];
    setCurrentAdvice(randomAdvice);
  };

  return (
    <div className={`bg-gradient-to-br ${currentAdvice.bgColor} rounded-xl border border-primary-200 p-3 sm:p-4 ${className}`}>
      <div className="flex items-start space-x-2 sm:space-x-3">
        <div className="min-w-0 flex-1">
          <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-1 leading-tight">{currentAdvice.title}</h4>
          <p className="text-xs text-gray-600 leading-relaxed">{currentAdvice.message}</p>
        </div>
      </div>
    </div>
  );
};
