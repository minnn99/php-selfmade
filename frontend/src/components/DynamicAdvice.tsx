import React, { useState, useEffect } from "react";
import { menstrualStatusManager } from "../services/menstrualStatusManager";

interface DynamicAdviceProps {
  className?: string;
}

interface AdviceContent {
  title: string;
  message: string;
  icon: string;
  bgColor: string;
  textColor: string;
}

export const DynamicAdvice: React.FC<DynamicAdviceProps> = ({ className = "" }) => {
  const [currentAdvice, setCurrentAdvice] = useState<AdviceContent>({
    title: "今日のアドバイス",
    message: "読み込み中...",
    icon: "💫",
    bgColor: "from-primary-50 to-purple-50",
    textColor: "text-primary-600",
  });

  // Subscribe to menstrual status updates
  useEffect(() => {
    console.log('DynamicAdvice - Subscribing to menstrual status updates');
    const unsubscribe = menstrualStatusManager.subscribe((status) => {
      console.log('DynamicAdvice - Received status update:', status);
      updateAdviceBasedOnStatus(status);
    });

    return unsubscribe;
  }, []);

  const updateAdviceBasedOnStatus = (status: any) => {
    console.log('DynamicAdvice - Status received for advice update:', status);
    
    if (!status) {
      setDefaultAdvice();
      return;
    }

    const today = new Date();
    const cycleDay = getCycleDay(status, today);
    
    console.log('DynamicAdvice - Calculated cycle day:', cycleDay, 'hasActiveCycle:', status?.hasActiveCycle);

    // 実際に生理中（アクティブな周期があり、かつその周期が現在進行中）の場合
    if (status?.hasActiveCycle && status?.activeCycle && !status?.activeCycle?.end_date) {
      const activeCycleStart = new Date(status.activeCycle.start_date);
      const daysSinceStart = Math.floor((today.getTime() - activeCycleStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      if (daysSinceStart >= 1 && daysSinceStart <= 7) {
        setCurrentAdvice({
          title: "生理中のケア",
          message: `生理開始から${daysSinceStart}日目です。温かい飲み物を飲んで体を温め、無理をせずゆっくり過ごしましょう。鉄分を含む食品で栄養補給も大切です。`,
          icon: "🌺",
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
        icon: "🌺",
        bgColor: "from-red-50 to-pink-50",
        textColor: "text-red-600",
      });
    } else if (cycleDay >= 6 && cycleDay <= 13) {
      // 卵胞期
      setCurrentAdvice({
        title: "エネルギー充実期",
        message: "体調が良い時期です。新しいことにチャレンジしたり、運動を始めるのに最適な時期です。",
        icon: "✨",
        bgColor: "from-green-50 to-emerald-50",
        textColor: "text-green-600",
      });
    } else if (cycleDay >= 14 && cycleDay <= 16) {
      // 排卵期
      setCurrentAdvice({
        title: "排卵期",
        message: "排卵期です。体温が上がりやすいので、水分補給を忘れずに。妊娠を希望する場合は重要な時期です。",
        icon: "🌸",
        bgColor: "from-pink-50 to-rose-50",
        textColor: "text-pink-600",
      });
    } else if (cycleDay >= 17 && cycleDay <= 24) {
      // 黄体期前期
      setCurrentAdvice({
        title: "安定期",
        message: "比較的安定した時期です。バランスの良い食事と適度な運動を心がけましょう。",
        icon: "🌻",
        bgColor: "from-yellow-50 to-orange-50",
        textColor: "text-yellow-600",
      });
    } else if (cycleDay >= 25 && cycleDay <= 28) {
      // 黄体期後期（PMS期間）
      setCurrentAdvice({
        title: "PMS期間",
        message: "生理前の時期です。イライラや体調不良を感じやすい時期なので、リラックスを心がけ、カフェインを控えめにしましょう。",
        icon: "🌙",
        bgColor: "from-purple-50 to-indigo-50",
        textColor: "text-purple-600",
      });
    } else {
      // 状態不明の場合はデフォルトアドバイス
      setDefaultAdvice();
    }
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
      return ((diffDays % cycleLength) + 1);
    }

    return 1; // デフォルト値
  };

  const setDefaultAdvice = () => {
    const advices = [
      {
        title: "今日のアドバイス",
        message: "規則正しい生活リズムを心がけて、自分の体と向き合う時間を大切にしましょう。",
        icon: "💫",
        bgColor: "from-primary-50 to-purple-50",
        textColor: "text-primary-600",
      },
      {
        title: "健康のヒント",
        message: "水分補給を忘れずに。1日1.5-2リットルの水を飲むことで、体調管理に役立ちます。",
        icon: "💧",
        bgColor: "from-blue-50 to-cyan-50",
        textColor: "text-blue-600",
      },
      {
        title: "セルフケア",
        message: "深呼吸や軽いストレッチで、日々のストレスを和らげましょう。5分でも効果があります。",
        icon: "🧘‍♀️",
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
        <div className={`w-7 h-7 sm:w-8 sm:h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0`}>
          <span className="text-base sm:text-lg">{currentAdvice.icon}</span>
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-1 leading-tight">{currentAdvice.title}</h4>
          <p className="text-xs text-gray-600 leading-relaxed">
            {currentAdvice.message}
          </p>
        </div>
      </div>
    </div>
  );
};