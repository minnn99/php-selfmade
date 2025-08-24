import React, { useState } from "react";
import { TermsOfServiceModal } from "./TermsOfServiceModal";
import { PrivacyPolicyModal } from "./PrivacyPolicyModal";

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

interface ContactForm {
  name: string;
  email: string;
  category: string;
  subject: string;
  message: string;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<"faq" | "contact" | "info">("faq");
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [contactForm, setContactForm] = useState<ContactForm>({
    name: "",
    email: "",
    category: "",
    subject: "",
    message: "",
  });

  const faqItems: FAQItem[] = [
    {
      question: "生理周期の記録はどのように行いますか？",
      answer: "メイン画面のクイックアクションから「生理開始」ボタンを押すことで記録できます。終了時も同様に「生理終了」ボタンを押してください。",
      category: "基本操作",
    },
    {
      question: "データをバックアップする方法は？",
      answer: "設定画面の「データ管理」から、JSONやCSV形式でデータをエクスポートできます。定期的なバックアップをお勧めします。",
      category: "データ管理",
    },
    {
      question: "プライバシー設定はどこで変更できますか？",
      answer: "設定画面の「プライバシー」から、データ共有設定やプロフィール公開範囲を変更できます。",
      category: "プライバシー",
    },
    {
      question: "パートナーとの連携はどのように行いますか？",
      answer: "メニューの「パートナー連動」から連携コードを生成し、パートナーと共有することで情報を同期できます。",
      category: "パートナー連携",
    },
    {
      question: "妊娠サポート機能（BETA）とは何ですか？",
      answer: "妊娠希望時の排卵日予測や妊娠記録機能です。現在BETA版として提供しており、今後機能が追加される予定です。",
      category: "機能説明",
    },
    {
      question: "通知設定を変更するには？",
      answer: "設定画面の「通知設定」から、生理予定日や服薬リマインダーなどの通知をカスタマイズできます。",
      category: "設定",
    },
    {
      question: "症状記録のデータは医師に見せても大丈夫ですか？",
      answer: "はい。記録データは医療相談時の参考資料として活用できます。データ管理画面からPDF形式でエクスポートすることも可能です。",
      category: "医療",
    },
    {
      question: "アプリを削除した場合、データは復元できますか？",
      answer: "事前にバックアップを取っていれば復元可能です。データ管理画面からエクスポートしたファイルをインポートしてください。",
      category: "データ管理",
    },
  ];

  const contactCategories = ["アプリの不具合", "機能に関する質問", "データに関する問題", "プライバシーについて", "機能改善の提案", "その他"];

  const updateContactForm = (field: keyof ContactForm, value: string) => {
    setContactForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmitContact = () => {
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      alert("必須項目を入力してください");
      return;
    }

    // 実際の実装では、お問い合わせデータをサーバーに送信
    alert("お問い合わせを送信しました。回答まで1-2営業日お待ちください。");
    setContactForm({
      name: "",
      email: "",
      category: "",
      subject: "",
      message: "",
    });
  };

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const tabs = [
    { id: "faq", label: "よくある質問", icon: "" },
    { id: "contact", label: "お問い合わせ", icon: "" },
    { id: "info", label: "アプリ情報", icon: "" },
  ];

  const renderFAQ = () => (
    <div className="space-y-3 sm:space-y-4">
      <div className="mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">よくある質問</h3>
        <p className="text-xs sm:text-sm text-gray-600 leading-tight">Pairiodの使い方や機能について、よく寄せられる質問をまとめました。</p>
      </div>

      <div className="space-y-2 sm:space-y-3">
        {faqItems.map((item, index) => (
          <div key={index} className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full px-3 sm:px-4 py-3 text-left flex items-start sm:items-center justify-between hover:bg-gray-50 transition-colors min-h-[44px] touch-manipulation"
            >
              <div className="flex-1 mr-3">
                <span className="inline-block px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full mr-2 mb-1 sm:mb-0">{item.category}</span>
                <span className="text-sm font-medium text-gray-900 break-words">{item.question}</span>
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${expandedFAQ === index ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {expandedFAQ === index && (
              <div className="px-3 sm:px-4 pb-3 text-xs sm:text-sm text-gray-600 border-t border-gray-100">
                <p className="pt-3 leading-relaxed">{item.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderContact = () => (
    <div className="space-y-3 sm:space-y-4">
      <div className="mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">お問い合わせ</h3>
        <p className="text-xs sm:text-sm text-gray-600 leading-tight">ご質問やご要望がございましたら、下記フォームよりお気軽にお問い合わせください。</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">お名前 *</label>
          <input
            type="text"
            value={contactForm.name}
            onChange={(e) => updateContactForm("name", e.target.value)}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-h-[44px] touch-manipulation"
            placeholder="山田 花子"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">メールアドレス *</label>
          <input
            type="email"
            value={contactForm.email}
            onChange={(e) => updateContactForm("email", e.target.value)}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-h-[44px] touch-manipulation"
            placeholder="example@email.com"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">カテゴリ</label>
        <select
          value={contactForm.category}
          onChange={(e) => updateContactForm("category", e.target.value)}
          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-h-[44px] touch-manipulation"
        >
          <option value="">選択してください</option>
          {contactCategories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">件名</label>
        <input
          type="text"
          value={contactForm.subject}
          onChange={(e) => updateContactForm("subject", e.target.value)}
          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-h-[44px] touch-manipulation"
          placeholder="お問い合わせの件名を入力してください"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">お問い合わせ内容 *</label>
        <textarea
          value={contactForm.message}
          onChange={(e) => updateContactForm("message", e.target.value)}
          rows={6}
          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-h-[120px] touch-manipulation"
          placeholder="詳細をお聞かせください..."
        />
      </div>

      <button
        onClick={handleSubmitContact}
        className="w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white rounded-lg transition-colors text-sm font-medium min-h-[44px] flex items-center justify-center touch-manipulation"
      >
        送信
      </button>
    </div>
  );

  const renderInfo = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center">
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
          <span className="text-xl sm:text-2xl"></span>
        </div>
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Pairiod</h3>
        <p className="text-xs sm:text-sm text-gray-600 px-4 sm:px-0">女性の健康をサポートする生理管理アプリ</p>
      </div>

      <div className="bg-gradient-to-r from-primary-50 to-pink-50 rounded-lg p-4 sm:p-6">
        <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-3">アプリについて</h4>
        <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
          Pairiodは、女性の生理周期管理を通じて健康な生活をサポートするアプリです。 生理記録だけでなく、症状記録、妊娠サポート、パートナーとの情報共有など、
          女性の様々なライフステージに寄り添う機能を提供しています。
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
          <h5 className="text-sm font-medium text-gray-900 mb-2 sm:mb-3">バージョン情報</h5>
          <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-600">
            <p>アプリバージョン: v1.0.0</p>
            <p>リリース日: 2025年1月</p>
            <p>最終更新: 2025年1月20日</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
          <h5 className="text-sm font-medium text-gray-900 mb-2 sm:mb-3">開発者情報</h5>
          <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-600">
            <p>開発: Pairiod Team</p>
            <p>サポート: support@pairiod.com</p>
            <p>公式サイト: www.pairiod.com</p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4 sm:pt-6">
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6">
          <button
            onClick={() => setShowTermsModal(true)}
            className="text-xs sm:text-sm text-gray-600 hover:text-primary-600 active:text-primary-700 transition-colors min-h-[40px] flex items-center touch-manipulation"
          >
            利用規約
          </button>
          <span className="hidden sm:inline text-gray-300">|</span>
          <button
            onClick={() => setShowPrivacyModal(true)}
            className="text-xs sm:text-sm text-gray-600 hover:text-primary-600 active:text-primary-700 transition-colors min-h-[40px] flex items-center touch-manipulation"
          >
            プライバシーポリシー
          </button>
        </div>
      </div>

      <div className="text-center text-xs sm:text-sm text-gray-500 px-4 sm:px-0">
        <p>© 2025 Pairiod. All rights reserved.</p>
        <p className="mt-1 sm:mt-2">女性の健康と幸せのために</p>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ margin: 0, top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div className="bg-white rounded-t-xl sm:rounded-xl shadow-2xl w-full sm:max-w-4xl sm:w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">サポート</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="px-4 sm:px-6 pt-3 sm:pt-4 flex-shrink-0">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'faq' | 'contact' | 'info')}
                className={`flex-1 flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 py-2 sm:py-3 px-1 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors min-h-[60px] sm:min-h-[44px] ${
                  activeTab === tab.id ? "bg-white text-primary-700 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <span className="text-base sm:text-base">{tab.icon}</span>
                <span className="text-xs sm:text-sm whitespace-nowrap leading-tight text-center">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === "faq" && renderFAQ()}
          {activeTab === "contact" && renderContact()}
          {activeTab === "info" && renderInfo()}
        </div>
      </div>

      {/* Terms of Service Modal */}
      <TermsOfServiceModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />

      {/* Privacy Policy Modal */}
      <PrivacyPolicyModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />
    </div>
  );
};
