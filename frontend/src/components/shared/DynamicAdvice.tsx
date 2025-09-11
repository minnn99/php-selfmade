import React, { useState, useEffect } from "react";
import { menstrualStatusManager } from "../../services/menstrualStatusManager";
import { menstrualCycleAPI, partnerAPI } from "../../services/api";
import { useUserStore } from "../../stores/userStore";

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
  
  // Use global user store
  const { user, isMaleWithPartner, isUserLoading, isPartnerLoading } = useUserStore();

  useEffect(() => {
    // menstrualStatusManagerを初期化してからアドバイスを生成
    const loadStatusFirst = async () => {
      try {
        await menstrualStatusManager.loadStatus();
      } catch {
        // エラーは無視
      }
    };

    // 直接カレンダーデータを取得してアドバイスを生成
    const initializeAdvice = async () => {
      try {
        // Skip if user data is still loading
        if (isUserLoading || isPartnerLoading || !user) {
          return;
        }

        const today = new Date();
        const todayString = today.toISOString().split("T")[0];

        if (isMaleWithPartner) {
          // 男性ユーザーでパートナー接続済みの場合、パートナーのカレンダーデータを取得
          const partnerCalendarResponse = await partnerAPI.getPartnerCalendar(today.getFullYear(), today.getMonth() + 1);
          if (partnerCalendarResponse.success && partnerCalendarResponse.data) {
            const responseData = partnerCalendarResponse.data as { calendar_data?: Array<{ date: string; [key: string]: unknown }> } | Record<string, unknown>;
            
            // パートナーAPIのレスポンス形式をチェック
            if ('calendar_data' in responseData && Array.isArray(responseData.calendar_data)) {
              // 配列形式の場合
              const todayEntry = responseData.calendar_data.find(entry => entry.date === todayString);
              if (todayEntry) {
                generateMaleAdviceFromPartnerData(todayEntry);
                return;
              }
            } else {
              // オブジェクト形式の場合（通常のカレンダーAPIと同じ）
              const todayData = (responseData as Record<string, unknown>)[todayString];
              if (todayData && typeof todayData === "object") {
                generateMaleAdviceFromPartnerData(todayData as Record<string, unknown>);
                return;
              }
            }
          }
          // 男性でパートナー未接続の場合は男性向けアドバイス
          setMaleDefaultAdvice();
        } else if (user?.gender !== 'male' && user?.gender !== '男性') {
          // 女性ユーザーの場合、自分のカレンダーデータを取得
          const calendarResponse = await menstrualCycleAPI.getCalendarData(today.getFullYear(), today.getMonth() + 1);
          
          // レスポンス形式を確認して適切に今日のデータを取得
          let todayData: Record<string, unknown> | undefined;
          
          if (calendarResponse.data) {
            const responseData = calendarResponse.data as Record<string, unknown> | { dates?: Array<{ date: string; [key: string]: unknown }> };
            
            // dates配列形式の場合
            if ('dates' in responseData && Array.isArray(responseData.dates)) {
              const todayEntry = responseData.dates.find((entry: { date: string; [key: string]: unknown }) => entry.date === todayString);
              todayData = todayEntry;
            }
            // オブジェクト形式の場合（従来）
            else if (typeof responseData === 'object' && !('dates' in responseData)) {
              const data = (responseData as Record<string, unknown>)[todayString];
              todayData = data && typeof data === 'object' ? data as Record<string, unknown> : undefined;
            }
          }

          if (todayData && typeof todayData === "object") {
            generateAdviceFromCalendarData(todayData as Record<string, unknown>);
          } else {
            // カレンダーデータがない場合は周期計算ロジックを使用
            const currentStatus = menstrualStatusManager.getCurrentStatus();
            if (currentStatus) {
              await updateAdviceBasedOnStatus(currentStatus as unknown as Record<string, unknown>);
            } else {
              setDefaultAdvice();
            }
          }
        }
      } catch {
        setDefaultAdvice();
      }
    };

    // menstrualStatusManagerを先に初期化してからアドバイスを取得
    loadStatusFirst().then(() => {
      initializeAdvice();
    });

    // データ更新を監視するイベントリスナーを追加
    const handleDataUpdate = async () => {
      // キャッシュを完全にリフレッシュ
      await menstrualStatusManager.loadStatus();
      // 少し遅延を入れてDBからの最新データを確実に取得
      setTimeout(() => {
        initializeAdvice();
      }, 100);
    };

    window.addEventListener("menstrualDataUpdated", handleDataUpdate);

    return () => {
      window.removeEventListener("menstrualDataUpdated", handleDataUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isMaleWithPartner, isUserLoading, isPartnerLoading]);

  // カレンダーデータから直接アドバイスを生成する関数
  const generateAdviceFromCalendarData = (todayData: Record<string, unknown>) => {
    const todayTypedData = todayData as {
      hasPeriod?: boolean;
      isPeriodStart?: boolean;
      isPeriodEnd?: boolean;
      isOvulation?: boolean;
      isFertile?: boolean;
      isPredictedPeriod?: boolean;
    };

    if (todayTypedData.hasPeriod || todayTypedData.isPeriodStart) {
      // カレンダーデータを最優先で信頼する
      // isPeriodStartが設定されている場合は新しい周期の開始として扱う
      
      const dayOfPeriod = getDayOfPeriod(todayData);
      if (dayOfPeriod <= 3) {
        setCurrentAdvice({
          title: `生理 ${dayOfPeriod}日目`,
          message: "生理初期は体を温めて、十分な休息を取りましょう。温かいハーブティーがおすすめです。",
          bgColor: "from-red-50 to-pink-50",
          textColor: "text-red-600",
        });
      } else {
        setCurrentAdvice({
          title: `生理 ${dayOfPeriod}日目`,
          message: "軽いストレッチや散歩で血流を改善しましょう。鉄分を意識した食事も大切です。",
          bgColor: "from-red-50 to-pink-50",
          textColor: "text-red-600",
        });
      }
      return;
    } else if (todayTypedData.isPeriodEnd) {
      setCurrentAdvice({
        title: "生理終了",
        message: "お疲れさまでした。新しいサイクルの始まりです。栄養バランスの良い食事で体力回復を。",
        bgColor: "from-green-50 to-emerald-50",
        textColor: "text-green-600",
      });
      return;
    } else if (todayTypedData.isOvulation) {
      setCurrentAdvice({
        title: "排卵期",
        message: "排卵期です。基礎体温が上昇するため、水分補給を心がけましょう。",
        bgColor: "from-yellow-50 to-amber-50",
        textColor: "text-yellow-600",
      });
      return;
    } else if (todayTypedData.isFertile) {
      setCurrentAdvice({
        title: "妊娠可能期間",
        message: "妊娠可能期間です。体調管理に気をつけて、バランスの良い食事を心がけましょう。",
        bgColor: "from-pink-50 to-rose-50",
        textColor: "text-pink-600",
      });
      return;
    } else if (todayTypedData.isPredictedPeriod) {
      setCurrentAdvice({
        title: "生理予定日",
        message: "生理予定日です。体を温めて、軽いストレッチで血流を改善しましょう。十分な休息も忘れずに。",
        bgColor: "from-red-50 to-pink-50",
        textColor: "text-red-600",
      });
      return;
    } else {
      setCurrentAdvice({
        title: "エネルギー充実期",
        message: "体調が良い時期です。新しいことにチャレンジしたり、運動を始めるのに最適な時期です。",
        bgColor: "from-green-50 to-emerald-50",
        textColor: "text-green-600",
      });
      return;
    }
  };

  const updateAdviceBasedOnStatus = async (status: Record<string, unknown> | null) => {
    if (!status) {
      setDefaultAdvice();
      return;
    }

    // データが全くない場合（最初の起動時など）はデフォルトアドバイスを表示
    if (!status?.hasActiveCycle && !status?.lastCycle) {
      setDefaultAdvice();
      return;
    }

    const today = new Date();
    const cycleDay = getCycleDay(status, today);

    // 実際に生理中（アクティブな周期があり、かつその周期が現在進行中）の場合
    if (status?.hasActiveCycle && status?.activeCycle && !(status?.activeCycle as { end_date?: string })?.end_date) {
      const activeCycleStart = new Date((status.activeCycle as { start_date: string }).start_date);
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
        title: "生理予定日",
        message: "生理予定日です。体を温めて、軽いストレッチで血流を改善しましょう。十分な休息も忘れずに。",
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

  const getDayOfPeriod = (todayData: Record<string, unknown>): number => {
    // 今日が開始日なら1日目
    if ((todayData as { isPeriodStart?: boolean }).isPeriodStart) {
      return 1;
    }

    // menstrualStatusManagerから正しい日数を取得
    try {
      const currentStatus = menstrualStatusManager.getCurrentStatus();
      
      if (currentStatus?.hasActiveCycle && currentStatus?.activeCycle?.start_date) {
        const startDateStr = currentStatus.activeCycle.start_date;
        const startDate = new Date(startDateStr);
        const today = new Date();
        
        // ローカル日付で計算（時間を無視）
        const startLocal = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        
        const diffTime = todayLocal.getTime() - startLocal.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
        
        // 生理期間内（1-7日）の場合のみ返す
        if (diffDays >= 1 && diffDays <= 7) {
          return diffDays;
        }
      }
    } catch {
      // エラーは無視
    }

    // データが取得できない場合は1日目として扱う
    return 1;
  };

  const getCycleDay = (status: Record<string, unknown> | null, currentDate: Date): number => {
    // アクティブな周期がある場合、その開始日からの日数を返す
    if (status?.hasActiveCycle && (status?.activeCycle as { start_date?: string })?.start_date) {
      const activeCycleStart = new Date((status.activeCycle as { start_date: string }).start_date);
      const diffTime = currentDate.getTime() - activeCycleStart.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    }

    // アクティブな周期がない場合、最後の周期から予測
    if ((status?.lastCycle as { start_date?: string })?.start_date) {
      const lastCycleStart = new Date((status?.lastCycle as { start_date: string }).start_date);
      const diffTime = currentDate.getTime() - lastCycleStart.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      // 最後の周期の長さを取得（デフォルト28日）
      const cycleLength = (status?.lastCycle as { cycle_length?: number })?.cycle_length || 28;

      // 周期内の日数を計算
      return (diffDays % (cycleLength as number)) + 1;
    }

    return 1; // デフォルト値
  };

  // 男性ユーザー用：パートナーの状態に基づくサポートアドバイス
  const generateMaleAdviceFromPartnerData = (partnerData: Record<string, unknown>) => {
    const partnerTypedData = partnerData as {
      hasPeriod?: boolean;
      isPeriodStart?: boolean;
      isPeriodEnd?: boolean;
      isOvulation?: boolean;
      isFertile?: boolean;
    };

    if (partnerTypedData.hasPeriod || partnerTypedData.isPeriodStart) {
      setCurrentAdvice({
        title: "パートナーサポート",
        message: "パートナーが生理中です。温かい飲み物を用意したり、家事をサポートしてあげましょう。",
        bgColor: "from-blue-50 to-cyan-50",
        textColor: "text-blue-600",
      });
    } else if (partnerTypedData.isPeriodEnd) {
      setCurrentAdvice({
        title: "パートナーケア",
        message: "パートナーの生理が終了しました。お疲れ様と労いの言葉をかけてあげましょう。",
        bgColor: "from-green-50 to-emerald-50",
        textColor: "text-green-600",
      });
    } else if (partnerTypedData.isOvulation) {
      setCurrentAdvice({
        title: "パートナーサポート",
        message: "パートナーの排卵期です。妊娠を希望する場合は、お互いの体調を整えましょう。",
        bgColor: "from-yellow-50 to-orange-50",
        textColor: "text-orange-600",
      });
    } else if (partnerTypedData.isFertile) {
      setCurrentAdvice({
        title: "パートナーケア",
        message: "パートナーの妊娠しやすい時期です。お互いの健康管理を心がけましょう。",
        bgColor: "from-purple-50 to-pink-50",
        textColor: "text-purple-600",
      });
    } else {
      // その他の場合は男性向けの一般的なアドバイス
      setMaleDefaultAdvice();
    }
  };

  const setMaleDefaultAdvice = () => {
    const maleAdvices = [
      {
        title: "健康管理",
        message: "規則正しい生活と適度な運動で、健康的な毎日を送りましょう。",
        bgColor: "from-blue-50 to-cyan-50",
        textColor: "text-blue-600",
      },
      {
        title: "パートナーシップ",
        message: "パートナーとのコミュニケーションを大切にし、お互いを支え合いましょう。",
        bgColor: "from-green-50 to-teal-50",
        textColor: "text-green-600",
      },
      {
        title: "セルフケア",
        message: "ストレス管理と十分な睡眠で、心身のバランスを保ちましょう。",
        bgColor: "from-purple-50 to-indigo-50",
        textColor: "text-purple-600",
      },
    ];

    const randomAdvice = maleAdvices[Math.floor(Math.random() * maleAdvices.length)];
    setCurrentAdvice(randomAdvice);
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
    <div className={`bg-gradient-to-br ${currentAdvice.bgColor} dark:from-gray-800 dark:to-gray-700 rounded-xl border border-primary-200 dark:border-gray-600 p-3 sm:p-4 ${className}`}>
      <div className="flex items-start space-x-2 sm:space-x-3">
        <div className="min-w-0 flex-1">
          <h4 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-1 leading-tight">{currentAdvice.title}</h4>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{currentAdvice.message}</p>
        </div>
      </div>
    </div>
  );
};
