import React, { useState, useEffect } from "react";
import { menstrualCycleAPI, partnerAPI, authAPI } from "../../services/api";
import { FadeInUp } from "../animations";

interface SelfCareProps {
  className?: string;
}

interface SelfCareAdvice {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: "nutrition" | "exercise" | "relaxation" | "medical";
  category: "menstrual" | "pms" | "ovulation" | "general";
  difficulty: "easy" | "medium" | "hard";
}

interface PartnerAdvice {
  id: string;
  title: string;
  description: string;
  icon: string;
  situation: string;
}

export const SelfCare: React.FC<SelfCareProps> = ({ className = "" }) => {
  const [selectedSymptom, setSelectedSymptom] = useState<string>("general");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [todayStatus, setTodayStatus] = useState<string>("general");
  const [userGender, setUserGender] = useState<string>("");
  const [isConnectedToPartner, setIsConnectedToPartner] = useState<boolean>(false);
  const [partnerName, setPartnerName] = useState<string>("");
  const [isShowingPartnerStatus, setIsShowingPartnerStatus] = useState<boolean>(false);

  // パートナーの状態を取得する関数
  const getPartnerStatus = async () => {
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1;
      const todayString = today.toISOString().split("T")[0];

      // パートナーのカレンダーデータを取得
      const partnerData = await partnerAPI.getPartnerCalendar(year, month);

      // レスポンス構造を確認し、calendar_dataを取得
      const calendarData = (partnerData.data as { calendar_data?: Record<string, unknown> })?.calendar_data;

      // 日付で該当するエントリーを検索
      let partnerTodayData = null;
      if (calendarData) {
        for (const key of Object.keys(calendarData)) {
          const entry = calendarData[key] as { date?: string };
          if (entry?.date === todayString) {
            partnerTodayData = entry;
            break;
          }
        }
      }

      // パートナーの生理中の判定
      const partnerTypedData = partnerTodayData as
        | { hasPeriod?: boolean; isPeriodStart?: boolean; isPeriodEnd?: boolean; isOvulation?: boolean; isFertile?: boolean }
        | undefined;
      const hasPeriod = partnerTypedData?.hasPeriod || partnerTypedData?.isPeriodStart || partnerTypedData?.isPeriodEnd;

      if (hasPeriod) {
        return "menstrual";
      }

      // パートナーの排卵期の判定
      if (partnerTypedData?.isOvulation || partnerTypedData?.isFertile) {
        return "ovulation";
      }

      // PMS期間の判定（生理予定日の7日前から）
      if (calendarData) {
        // カレンダーデータを日付順に並べる
        const entries = Object.keys(calendarData)
          .map((key) => calendarData[key] as { date?: string; isPredictedPeriod?: boolean; hasPeriod?: boolean })
          .filter((entry) => entry?.date)
          .sort((a, b) => (a.date || "").localeCompare(b.date || ""));

        const todayIndex = entries.findIndex((entry) => entry.date === todayString);

        if (todayIndex !== -1) {
          // 今後7日以内に生理予定日があるかチェック
          for (let i = 1; i <= 7; i++) {
            const futureIndex = todayIndex + i;
            if (futureIndex < entries.length) {
              const futureEntry = entries[futureIndex];
              if (futureEntry.isPredictedPeriod || futureEntry.hasPeriod) {
                return "pms";
              }
            }
          }
        }
      }

      return "general";
    } catch (error) {
      console.error("Error fetching partner status:", error);
      return "general";
    }
  };

  // 今日の日付に基づいて状態を判定する関数
  const getTodayStatus = async () => {
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1;
      const todayString = today.toISOString().split("T")[0];

      // APIデータとローカルストレージデータの両方を取得
      const apiData = await menstrualCycleAPI.getCalendarData(year, month);
      const todayApiData = (apiData.data as Record<string, unknown>)?.[todayString];

      // ローカルストレージから今日の症状データを取得
      const localData = localStorage.getItem(`daily-symptoms-${todayString}`);
      let localParsedData = null;
      try {
        localParsedData = localData ? JSON.parse(localData) : null;
      } catch {
        // Failed to parse local data
      }

      // 生理中の判定（APIデータまたはローカルデータ）
      const todayTypedData = todayApiData as
        | { hasPeriod?: boolean; isPeriodStart?: boolean; isPeriodEnd?: boolean; isOvulation?: boolean; isFertile?: boolean }
        | undefined;
      const hasPeriod =
        todayTypedData?.hasPeriod ||
        localParsedData?.hasPeriod ||
        todayTypedData?.isPeriodStart ||
        localParsedData?.isPeriodStart ||
        todayTypedData?.isPeriodEnd ||
        localParsedData?.isPeriodEnd;

      if (hasPeriod) {
        return "menstrual";
      }

      // 排卵期の判定
      if (todayTypedData?.isOvulation || todayTypedData?.isFertile) {
        return "ovulation";
      }

      // ローカルデータから症状を確認してPMSかどうか判定
      if (localParsedData) {
        const hasSymptoms = localParsedData.symptoms && Array.isArray(localParsedData.symptoms) && localParsedData.symptoms.length > 0;
        const hasMoodIssues =
          localParsedData.mood &&
          typeof localParsedData.mood === "string" &&
          (localParsedData.mood.includes("イライラ") ||
            localParsedData.mood.includes("不安") ||
            localParsedData.mood.includes("憂鬱") ||
            localParsedData.mood.includes("落ち込み"));

        if (hasSymptoms || hasMoodIssues) {
          return "pms";
        }
      }

      // PMS期間の判定（生理予定日の7日前から）
      if (apiData.data) {
        const keys = Object.keys(apiData.data).sort();
        const todayIndex = keys.indexOf(todayString);
        if (todayIndex !== -1) {
          // 今後7日以内に生理予定日があるかチェック
          for (let i = 1; i <= 7; i++) {
            const futureIndex = todayIndex + i;
            if (futureIndex < keys.length) {
              const futureDate = keys[futureIndex];
              const futureData = (apiData.data as Record<string, { isPredictedPeriod?: boolean; hasPeriod?: boolean }>)[futureDate];
              if (futureData?.isPredictedPeriod || futureData?.hasPeriod) {
                return "pms";
              }
            }
          }
        }
      }

      return "general";
    } catch {
      return "general";
    }
  };

  // ユーザー情報とパートナー接続状況を取得
  const loadUserAndPartnerInfo = async () => {
    try {
      // ユーザー情報を取得
      const userData = await authAPI.getUser();
      const gender = (userData.data as { user?: { gender?: string } })?.user?.gender || "";
      setUserGender(gender);

      // パートナー状況を取得
      const partnerResponse = await partnerAPI.getStatus();
      if (partnerResponse.success && partnerResponse.data) {
        const partnerData = partnerResponse.data as { is_connected?: boolean; partner?: { name: string; gender: string } };
        setIsConnectedToPartner(!!partnerData.is_connected);
        if (partnerData.partner) {
          setPartnerName(partnerData.partner.name);
        }
      }
    } catch (error) {
      console.error("Failed to load user/partner info:", error);
    }
  };

  // 状態を更新する関数
  const updateTodayStatus = async () => {
    const isMale = userGender === "male" || userGender === "男性";

    // 男性ユーザーでパートナーと連携している場合はパートナーの状態を取得
    if (isMale && isConnectedToPartner) {
      const status = await getPartnerStatus();
      setTodayStatus(status);
      setSelectedSymptom(status);
      setIsShowingPartnerStatus(true);
    } else {
      const status = await getTodayStatus();
      setTodayStatus(status);
      setSelectedSymptom(status);
      setIsShowingPartnerStatus(false);
    }
  };

  // コンポーネントがマウントされた時にユーザー情報を取得
  useEffect(() => {
    const initializeComponent = async () => {
      await loadUserAndPartnerInfo();
    };
    initializeComponent();
  }, []);

  // ユーザー情報とパートナー情報が更新されたら状態を更新
  useEffect(() => {
    if (userGender) {
      updateTodayStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userGender, isConnectedToPartner]);

  // カスタムイベントリスナーを追加して、データ更新時にセルフケア状態も更新
  useEffect(() => {
    const handleDataUpdate = () => {
      updateTodayStatus();
    };

    // パートナー接続状況の更新イベントを監視
    const handlePartnerUpdate = () => {
      loadUserAndPartnerInfo();
    };

    // カスタムイベントリスナーを追加
    window.addEventListener("menstrualDataUpdated", handleDataUpdate);
    window.addEventListener("partnerStatusUpdated", handlePartnerUpdate);

    // ローカルストレージの変更を監視
    window.addEventListener("storage", handleDataUpdate);

    return () => {
      window.removeEventListener("menstrualDataUpdated", handleDataUpdate);
      window.removeEventListener("partnerStatusUpdated", handlePartnerUpdate);
      window.removeEventListener("storage", handleDataUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const symptoms = [
    { id: "menstrual", label: "生理中", color: "bg-red-100 text-red-800" },
    { id: "pms", label: "PMS", color: "bg-orange-100 text-orange-800" },
    { id: "ovulation", label: "排卵期", color: "bg-green-100 text-green-800" },
    { id: "general", label: "日常", color: "bg-blue-100 text-blue-800" },
  ];

  const categories = [
    { id: "all", label: "すべて", icon: "" },
    { id: "nutrition", label: "栄養・食事", icon: "" },
    { id: "exercise", label: "運動・ストレッチ", icon: "" },
    { id: "relaxation", label: "リラクゼーション", icon: "" },
    { id: "medical", label: "医療・薬", icon: "" },
  ];

  const selfCareAdvices: SelfCareAdvice[] = [
    // 生理中
    {
      id: "1",
      title: "温かい飲み物でリラックス",
      description: "ハーブティーや生姜湯で体を温めましょう。子宮の収縮を和らげ、痛みを軽減します。",
      icon: "",
      type: "nutrition",
      category: "menstrual",
      difficulty: "easy",
    },
    {
      id: "2",
      title: "軽いストレッチ",
      description: "腰回りや下腹部の軽いストレッチで血流を改善し、痛みを和らげましょう。",
      icon: "",
      type: "exercise",
      category: "menstrual",
      difficulty: "easy",
    },
    {
      id: "3",
      title: "温かいお風呂",
      description: "38-40度のぬるめのお湯で下半身を温めると、生理痛が軽減されます。",
      icon: "",
      type: "relaxation",
      category: "menstrual",
      difficulty: "easy",
    },
    {
      id: "4",
      title: "鉄分補給",
      description: "ほうれん草、レバー、赤身肉で鉄分を補給しましょう。貧血予防に効果的です。",
      icon: "",
      type: "nutrition",
      category: "menstrual",
      difficulty: "medium",
    },

    // PMS
    {
      id: "5",
      title: "深呼吸と瞑想",
      description: "1日10分の深呼吸や瞑想で、イライラや不安を軽減できます。",
      icon: "",
      type: "relaxation",
      category: "pms",
      difficulty: "easy",
    },
    {
      id: "6",
      title: "カルシウム・マグネシウム摂取",
      description: "乳製品やナッツ類でカルシウムとマグネシウムを摂取し、PMSを軽減しましょう。",
      icon: "",
      type: "nutrition",
      category: "pms",
      difficulty: "easy",
    },
    {
      id: "7",
      title: "適度な有酸素運動",
      description: "ウォーキングやヨガでエンドルフィンを分泌し、気分を改善しましょう。",
      icon: "",
      type: "exercise",
      category: "pms",
      difficulty: "medium",
    },

    // 排卵期
    {
      id: "8",
      title: "水分補給を強化",
      description: "排卵期は体温が上がるため、普段より多めの水分補給を心がけましょう。",
      icon: "",
      type: "nutrition",
      category: "ovulation",
      difficulty: "easy",
    },
    {
      id: "9",
      title: "葉酸を含む食品",
      description: "緑黄色野菜や豆類で葉酸を摂取し、妊娠準備を整えましょう。",
      icon: "",
      type: "nutrition",
      category: "ovulation",
      difficulty: "easy",
    },

    // 日常
    {
      id: "10",
      title: "規則正しい睡眠",
      description: "7-8時間の質の良い睡眠でホルモンバランスを整えましょう。",
      icon: "",
      type: "relaxation",
      category: "general",
      difficulty: "medium",
    },
    {
      id: "11",
      title: "ストレス管理",
      description: "趣味や読書でストレスを発散し、ホルモンバランスを保ちましょう。",
      icon: "",
      type: "relaxation",
      category: "general",
      difficulty: "easy",
    },
  ];

  const partnerAdvices: PartnerAdvice[] = [
    {
      id: "p1",
      title: "温かい飲み物を準備",
      situation: "生理痛で辛そうな時",
      description: "ハーブティーや生姜湯を温めて持っていってあげましょう。",
      icon: "",
    },
    {
      id: "p2",
      title: "家事のサポート",
      situation: "生理中で体調が悪い時",
      description: "重いものを持つ、掃除や料理など、普段より多めに家事を手伝いましょう。",
      icon: "",
    },
    {
      id: "p3",
      title: "静かな環境作り",
      situation: "PMSでイライラしている時",
      description: "音量を下げる、照明を調整するなど、リラックスできる環境を作りましょう。",
      icon: "",
    },
    {
      id: "p4",
      title: "話を聞く",
      situation: "感情的になっている時",
      description: "アドバイスより共感を。「大変だね」「お疲れさま」の言葉をかけましょう。",
      icon: "",
    },
    {
      id: "p5",
      title: "マッサージをする",
      situation: "腰痛や肩こりがある時",
      description: "軽く腰や肩をマッサージしてあげると、痛みが和らぎます。",
      icon: "",
    },
    {
      id: "p6",
      title: "健康的な食事を準備",
      situation: "食欲がない・栄養が心配な時",
      description: "鉄分やビタミンを含む栄養バランスの良い食事を作りましょう。",
      icon: "",
    },
  ];

  const getFilteredAdvices = () => {
    let filtered = selfCareAdvices.filter((advice) => selectedSymptom === "all" || advice.category === selectedSymptom);

    if (selectedCategory !== "all") {
      filtered = filtered.filter((advice) => advice.type === selectedCategory);
    }

    return filtered;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "hard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "かんたん";
      case "medium":
        return "ふつう";
      case "hard":
        return "むずかしい";
      default:
        return "";
    }
  };

  return (
    <div className={`space-y-4 sm:space-y-6 ${className}`}>
      {/* Header */}
      <FadeInUp delay={0}>
        <div className="bg-white rounded-xl shadow-sm border border-medical p-4 sm:p-6">
          <div className="flex items-center">
            <h2 className="text-lg sm:text-xl font-semibold text-neutral-900">セルフケア提案</h2>
          </div>
          <p className="text-xs sm:text-sm text-neutral-600 mt-2">
            {isShowingPartnerStatus
              ? `${partnerName}の体調に合わせたサポート方法とセルフケア提案`
              : "あなたの体調に合わせたセルフケア方法とパートナー向けサポート提案"}
          </p>
        </div>
      </FadeInUp>

      {/* Symptom Filter */}
      <FadeInUp delay={100}>
        <div className="bg-white rounded-xl shadow-sm border border-medical p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-medium text-gray-900">{isShowingPartnerStatus ? `パートナーの状態 (${partnerName})` : "現在の状態"}</h3>
            {todayStatus !== "general" && (
              <div className="flex items-center text-sm text-green-600">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                {isShowingPartnerStatus ? "パートナーの状態を自動検出" : "今日の状態を自動検出"}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {symptoms.map((symptom) => {
              const isAutoDetected = symptom.id === todayStatus;
              return (
                <button
                  key={symptom.id}
                  onClick={() => setSelectedSymptom(symptom.id)}
                  className={`p-3 rounded-lg text-sm font-medium transition-all relative ${
                    selectedSymptom === symptom.id ? symptom.color + " ring-2 ring-offset-2 ring-primary-500" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {symptom.label}
                  {isAutoDetected && <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>}
                </button>
              );
            })}
          </div>
          {todayStatus !== "general" && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-green-800">自動検出</p>
                  <p className="text-xs text-green-700 mt-1">
                    {isShowingPartnerStatus ? (
                      <>
                        パートナー（{partnerName}）のカレンダーデータから「{symptoms.find((s) => s.id === todayStatus)?.label}」を検出しました。
                        <br />
                        パートナーの体調に合わせたサポート方法をご参考ください。
                      </>
                    ) : (
                      <>
                        カレンダーデータと症状記録から「{symptoms.find((s) => s.id === todayStatus)?.label}」を検出しました。
                        <br />
                        お体の状態に合わせたセルフケアをお試しください。
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </FadeInUp>

      {/* Category Filter */}
      <FadeInUp delay={150}>
        <div className="bg-white rounded-xl shadow-sm border border-medical p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">カテゴリー</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 sm:gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`p-3 rounded-lg text-xs sm:text-sm font-medium transition-all min-h-[44px] flex flex-col items-center justify-center ${
                  selectedCategory === category.id
                    ? "bg-primary-100 text-primary-700 ring-2 ring-offset-2 ring-primary-500"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300"
                }`}
              >
                <div className="text-base sm:text-lg mb-1">{category.icon}</div>
                <span className="text-center leading-tight">{category.label}</span>
              </button>
            ))}
          </div>
        </div>
      </FadeInUp>

      {/* Self Care Recommendations */}
      <FadeInUp delay={200}>
        <div className="bg-white rounded-xl shadow-sm border border-medical p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">
            {isShowingPartnerStatus ? "パートナーサポート方法" : "おすすめのセルフケア"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {getFilteredAdvices().map((advice) => (
              <div key={advice.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-3">
                  <div className="text-xl sm:text-2xl flex-shrink-0">{advice.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 text-sm sm:text-base leading-tight">{advice.title}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${getDifficultyColor(advice.difficulty)}`}>
                        {getDifficultyLabel(advice.difficulty)}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{advice.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {getFilteredAdvices().length === 0 && (
            <div className="text-center py-6 sm:py-8 text-gray-500">
              <div className="text-3xl sm:text-4xl mb-2"></div>
              <p className="text-sm sm:text-base">この条件に合うセルフケア提案がありません</p>
            </div>
          )}
        </div>
      </FadeInUp>

      {/* Partner Support Recommendations */}
      <FadeInUp delay={300}>
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-200 p-4 sm:p-6">
          <div className="flex items-center mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-medium text-gray-900">パートナー向けサポート提案</h3>
            <span className="ml-2 text-lg sm:text-xl"></span>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">パートナーと共有して、より良いサポートを受けましょう</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {partnerAdvices.map((advice) => (
              <div key={advice.id} className="bg-white/70 backdrop-blur-sm border border-pink-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="text-xl sm:text-2xl flex-shrink-0">{advice.icon}</div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-gray-900 mb-1 text-sm sm:text-base leading-tight">{advice.title}</h4>
                    <p className="text-xs text-pink-700 font-medium mb-2 leading-tight">{advice.situation}</p>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{advice.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </FadeInUp>

      {/* Tips Section */}
      <FadeInUp delay={400}>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 sm:p-5">
          <div className="flex">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-xs sm:text-sm min-w-0">
              <p className="font-medium text-amber-800 mb-1 sm:mb-2">重要な注意事項</p>
              <ul className="text-amber-700 list-disc list-inside space-y-1 leading-relaxed">
                <li>症状が重い場合は医師に相談してください</li>
                <li>アレルギーがある場合は食材に注意してください</li>
                <li>体調に異変を感じたら無理をせず休息を取ってください</li>
                <li>個人差があるため、自分に合う方法を見つけてください</li>
              </ul>
            </div>
          </div>
        </div>
      </FadeInUp>
    </div>
  );
};
