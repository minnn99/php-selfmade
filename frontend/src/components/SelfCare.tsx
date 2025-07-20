import React, { useState, useEffect } from "react";

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
  const [selectedSymptom, setSelectedSymptom] = useState<string>("menstrual");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const symptoms = [
    { id: "menstrual", label: "生理中", color: "bg-red-100 text-red-800" },
    { id: "pms", label: "PMS", color: "bg-orange-100 text-orange-800" },
    { id: "ovulation", label: "排卵期", color: "bg-green-100 text-green-800" },
    { id: "general", label: "日常", color: "bg-blue-100 text-blue-800" },
  ];

  const categories = [
    { id: "all", label: "すべて", icon: "🌟" },
    { id: "nutrition", label: "栄養・食事", icon: "🥗" },
    { id: "exercise", label: "運動・ストレッチ", icon: "🧘‍♀️" },
    { id: "relaxation", label: "リラクゼーション", icon: "🛁" },
    { id: "medical", label: "医療・薬", icon: "💊" },
  ];

  const selfCareAdvices: SelfCareAdvice[] = [
    // 生理中
    {
      id: "1",
      title: "温かい飲み物でリラックス",
      description: "ハーブティーや生姜湯で体を温めましょう。子宮の収縮を和らげ、痛みを軽減します。",
      icon: "☕",
      type: "nutrition",
      category: "menstrual",
      difficulty: "easy",
    },
    {
      id: "2",
      title: "軽いストレッチ",
      description: "腰回りや下腹部の軽いストレッチで血流を改善し、痛みを和らげましょう。",
      icon: "🤸‍♀️",
      type: "exercise",
      category: "menstrual",
      difficulty: "easy",
    },
    {
      id: "3",
      title: "温かいお風呂",
      description: "38-40度のぬるめのお湯で下半身を温めると、生理痛が軽減されます。",
      icon: "🛁",
      type: "relaxation",
      category: "menstrual",
      difficulty: "easy",
    },
    {
      id: "4",
      title: "鉄分補給",
      description: "ほうれん草、レバー、赤身肉で鉄分を補給しましょう。貧血予防に効果的です。",
      icon: "🥩",
      type: "nutrition",
      category: "menstrual",
      difficulty: "medium",
    },

    // PMS
    {
      id: "5",
      title: "深呼吸と瞑想",
      description: "1日10分の深呼吸や瞑想で、イライラや不安を軽減できます。",
      icon: "🧘‍♀️",
      type: "relaxation",
      category: "pms",
      difficulty: "easy",
    },
    {
      id: "6",
      title: "カルシウム・マグネシウム摂取",
      description: "乳製品やナッツ類でカルシウムとマグネシウムを摂取し、PMSを軽減しましょう。",
      icon: "🥛",
      type: "nutrition",
      category: "pms",
      difficulty: "easy",
    },
    {
      id: "7",
      title: "適度な有酸素運動",
      description: "ウォーキングやヨガでエンドルフィンを分泌し、気分を改善しましょう。",
      icon: "🚶‍♀️",
      type: "exercise",
      category: "pms",
      difficulty: "medium",
    },

    // 排卵期
    {
      id: "8",
      title: "水分補給を強化",
      description: "排卵期は体温が上がるため、普段より多めの水分補給を心がけましょう。",
      icon: "💧",
      type: "nutrition",
      category: "ovulation",
      difficulty: "easy",
    },
    {
      id: "9",
      title: "葉酸を含む食品",
      description: "緑黄色野菜や豆類で葉酸を摂取し、妊娠準備を整えましょう。",
      icon: "🥬",
      type: "nutrition",
      category: "ovulation",
      difficulty: "easy",
    },

    // 日常
    {
      id: "10",
      title: "規則正しい睡眠",
      description: "7-8時間の質の良い睡眠でホルモンバランスを整えましょう。",
      icon: "😴",
      type: "relaxation",
      category: "general",
      difficulty: "medium",
    },
    {
      id: "11",
      title: "ストレス管理",
      description: "趣味や読書でストレスを発散し、ホルモンバランスを保ちましょう。",
      icon: "📚",
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
      icon: "☕",
    },
    {
      id: "p2",
      title: "家事のサポート",
      situation: "生理中で体調が悪い時",
      description: "重いものを持つ、掃除や料理など、普段より多めに家事を手伝いましょう。",
      icon: "🏠",
    },
    {
      id: "p3",
      title: "静かな環境作り",
      situation: "PMSでイライラしている時",
      description: "音量を下げる、照明を調整するなど、リラックスできる環境を作りましょう。",
      icon: "🔇",
    },
    {
      id: "p4",
      title: "話を聞く",
      situation: "感情的になっている時",
      description: "アドバイスより共感を。「大変だね」「お疲れさま」の言葉をかけましょう。",
      icon: "👂",
    },
    {
      id: "p5",
      title: "マッサージをする",
      situation: "腰痛や肩こりがある時",
      description: "軽く腰や肩をマッサージしてあげると、痛みが和らぎます。",
      icon: "💆‍♀️",
    },
    {
      id: "p6",
      title: "健康的な食事を準備",
      situation: "食欲がない・栄養が心配な時",
      description: "鉄分やビタミンを含む栄養バランスの良い食事を作りましょう。",
      icon: "🍽️",
    },
  ];

  const getFilteredAdvices = () => {
    let filtered = selfCareAdvices.filter(advice => 
      selectedSymptom === "all" || advice.category === selectedSymptom
    );

    if (selectedCategory !== "all") {
      filtered = filtered.filter(advice => advice.type === selectedCategory);
    }

    return filtered;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "bg-green-100 text-green-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "hard": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "かんたん";
      case "medium": return "ふつう";
      case "hard": return "むずかしい";
      default: return "";
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-medical p-6">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold text-neutral-900">セルフケア提案</h2>
          <span className="ml-3 text-2xl">🌸</span>
        </div>
        <p className="text-sm text-neutral-600 mt-2">
          あなたの体調に合わせたセルフケア方法とパートナー向けサポート提案
        </p>
      </div>

      {/* Symptom Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-medical p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">現在の状態</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {symptoms.map((symptom) => (
            <button
              key={symptom.id}
              onClick={() => setSelectedSymptom(symptom.id)}
              className={`p-3 rounded-lg text-sm font-medium transition-all ${
                selectedSymptom === symptom.id
                  ? symptom.color + " ring-2 ring-offset-2 ring-primary-500"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {symptom.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-medical p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">カテゴリー</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`p-3 rounded-lg text-sm font-medium transition-all ${
                selectedCategory === category.id
                  ? "bg-primary-100 text-primary-700 ring-2 ring-offset-2 ring-primary-500"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <div className="text-lg mb-1">{category.icon}</div>
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Self Care Recommendations */}
      <div className="bg-white rounded-xl shadow-sm border border-medical p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">おすすめのセルフケア</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {getFilteredAdvices().map((advice) => (
            <div key={advice.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start space-x-3">
                <div className="text-2xl flex-shrink-0">{advice.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{advice.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(advice.difficulty)}`}>
                      {getDifficultyLabel(advice.difficulty)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{advice.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {getFilteredAdvices().length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🌸</div>
            <p>この条件に合うセルフケア提案がありません</p>
          </div>
        )}
      </div>

      {/* Partner Support Recommendations */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-200 p-6">
        <div className="flex items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">パートナー向けサポート提案</h3>
          <span className="ml-2 text-xl">💕</span>
        </div>
        <p className="text-sm text-gray-600 mb-4">パートナーと共有して、より良いサポートを受けましょう</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {partnerAdvices.map((advice) => (
            <div key={advice.id} className="bg-white/70 backdrop-blur-sm border border-pink-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="text-2xl flex-shrink-0">{advice.icon}</div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">{advice.title}</h4>
                  <p className="text-xs text-pink-700 font-medium mb-2">{advice.situation}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{advice.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex">
          <svg className="w-5 h-5 text-amber-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div className="text-sm">
            <p className="font-medium text-amber-800">重要な注意事項</p>
            <ul className="mt-1 text-amber-700 list-disc list-inside space-y-1">
              <li>症状が重い場合は医師に相談してください</li>
              <li>アレルギーがある場合は食材に注意してください</li>
              <li>体調に異変を感じたら無理をせず休息を取ってください</li>
              <li>個人差があるため、自分に合う方法を見つけてください</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};