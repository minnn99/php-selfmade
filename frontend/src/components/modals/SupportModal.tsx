import React, { useState } from "react";
import { createPortal } from "react-dom";
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

interface ContactFormErrors {
  name?: string;
  email?: string;
  category?: string;
  subject?: string;
  message?: string;
}

interface ContactHistory {
  id: string;
  name: string;
  email: string;
  category: string;
  subject: string;
  message: string;
  status: 'pending' | 'responded' | 'closed';
  submittedAt: string;
  responseAt?: string;
  response?: string;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<"faq" | "contact" | "info" | "history">("faq");
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
  const [contactErrors, setContactErrors] = useState<ContactFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactHistory, setContactHistory] = useState<ContactHistory[]>([]);

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

  // ローカルストレージから問い合わせ履歴を読み込み
  const loadContactHistory = () => {
    const saved = localStorage.getItem("contactHistory");
    if (saved) {
      setContactHistory(JSON.parse(saved));
    }
  };

  // フォームとエラーをリセット
  const resetContactForm = () => {
    setContactForm({
      name: "",
      email: "",
      category: "",
      subject: "",
      message: "",
    });
    setContactErrors({});
    setIsSubmitting(false);
  };

  // タブ変更時のハンドラー
  const handleTabChange = (newTab: "faq" | "contact" | "info" | "history") => {
    // お問い合わせタブから他のタブに移動する時はエラーをクリア
    if (activeTab === "contact" && newTab !== "contact") {
      setContactErrors({});
    }
    setActiveTab(newTab);
  };

  // モーダル閉じる時のハンドラー
  const handleClose = () => {
    resetContactForm();
    setActiveTab("faq");
    onClose();
  };

  // 初回読み込み時に履歴を取得
  React.useEffect(() => {
    if (isOpen) {
      loadContactHistory();
    } else {
      // モーダルが閉じられた時にリセット
      resetContactForm();
      setActiveTab("faq");
    }
  }, [isOpen]);

  const validateContactForm = (): ContactFormErrors => {
    const errors: ContactFormErrors = {};
    
    if (!contactForm.name.trim()) {
      errors.name = "お名前は必須です";
    } else if (contactForm.name.trim().length < 2) {
      errors.name = "お名前は2文字以上で入力してください";
    }
    
    if (!contactForm.email.trim()) {
      errors.email = "メールアドレスは必須です";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactForm.email)) {
      errors.email = "有効なメールアドレスを入力してください";
    }
    
    if (!contactForm.category.trim()) {
      errors.category = "カテゴリを選択してください";
    }
    
    if (!contactForm.subject.trim()) {
      errors.subject = "件名は必須です";
    } else if (contactForm.subject.trim().length > 100) {
      errors.subject = "件名は100文字以下で入力してください";
    }
    
    if (!contactForm.message.trim()) {
      errors.message = "お問い合わせ内容は必須です";
    } else if (contactForm.message.trim().length < 10) {
      errors.message = "お問い合わせ内容は10文字以上で入力してください";
    }
    
    return errors;
  };

  const updateContactForm = (field: keyof ContactForm, value: string) => {
    setContactForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    
    // フィールド変更時にそのフィールドのエラーをクリア
    if (contactErrors[field]) {
      setContactErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleSubmitContact = async () => {
    const errors = validateContactForm();
    setContactErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // 新しい問い合わせを作成
      const newContact: ContactHistory = {
        id: Date.now().toString(),
        name: contactForm.name.trim(),
        email: contactForm.email.trim(),
        category: contactForm.category,
        subject: contactForm.subject.trim(),
        message: contactForm.message.trim(),
        status: 'pending',
        submittedAt: new Date().toISOString(),
      };
      
      // 履歴に追加
      const updatedHistory = [newContact, ...contactHistory];
      setContactHistory(updatedHistory);
      localStorage.setItem("contactHistory", JSON.stringify(updatedHistory));
      
      // 実際の実装では、お問い合わせデータをサーバーに送信
      // await submitContactToServer(newContact);
      
      alert("お問い合わせを送信しました。回答まで1-2営業日お待ちください。");
      
      // フォームをリセット
      resetContactForm();
      
      // 履歴タブに切り替え
      setActiveTab("history");
    } catch (error) {
      alert("送信に失敗しました。もう一度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const tabs = [
    { id: "faq", label: "よくある質問", icon: "" },
    { id: "contact", label: "お問い合わせ", icon: "" },
    { id: "history", label: "履歴", icon: "" },
    { id: "info", label: "アプリ情報", icon: "" },
  ];

  const renderFAQ = () => (
    <div className="space-y-3 sm:space-y-4">
      <div className="mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">よくある質問</h3>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-tight">Pairiodの使い方や機能について、よく寄せられる質問をまとめました。</p>
      </div>

      <div className="space-y-2 sm:space-y-3">
        {faqItems.map((item, index) => (
          <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg">
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full px-3 sm:px-4 py-3 text-left flex items-start sm:items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors min-h-[44px] touch-manipulation"
            >
              <div className="flex-1 mr-3">
                <span className="inline-block px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-xs rounded-full mr-2 mb-1 sm:mb-0">
                  {item.category}
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white break-words">{item.question}</span>
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform flex-shrink-0 ${expandedFAQ === index ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {expandedFAQ === index && (
              <div className="px-3 sm:px-4 pb-3 text-xs sm:text-sm text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-gray-600">
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
        <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">お問い合わせ</h3>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-tight">
          ご質問やご要望がございましたら、下記フォームよりお気軽にお問い合わせください。
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 whitespace-nowrap">お名前 *</label>
          <input
            type="text"
            value={contactForm.name}
            onChange={(e) => updateContactForm("name", e.target.value)}
            className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-h-[44px] touch-manipulation bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
              contactErrors.name ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="山田 花子"
          />
          {contactErrors.name && (
            <p className="mt-1 text-sm text-red-500 dark:text-red-400">{contactErrors.name}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 whitespace-nowrap">メールアドレス *</label>
          <input
            type="email"
            value={contactForm.email}
            onChange={(e) => updateContactForm("email", e.target.value)}
            className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-h-[44px] touch-manipulation bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
              contactErrors.email ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="example@email.com"
          />
          {contactErrors.email && (
            <p className="mt-1 text-sm text-red-500 dark:text-red-400">{contactErrors.email}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 whitespace-nowrap">カテゴリ *</label>
        <select
          value={contactForm.category}
          onChange={(e) => updateContactForm("category", e.target.value)}
          className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-h-[44px] touch-manipulation bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
            contactErrors.category ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
          }`}
        >
          <option value="">選択してください</option>
          {contactCategories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        {contactErrors.category && (
          <p className="mt-1 text-sm text-red-500 dark:text-red-400">{contactErrors.category}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 whitespace-nowrap">件名 *</label>
        <input
          type="text"
          value={contactForm.subject}
          onChange={(e) => updateContactForm("subject", e.target.value)}
          className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-h-[44px] touch-manipulation bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
            contactErrors.subject ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
          }`}
          placeholder="お問い合わせの件名を入力してください"
        />
        {contactErrors.subject && (
          <p className="mt-1 text-sm text-red-500 dark:text-red-400">{contactErrors.subject}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 whitespace-nowrap">お問い合わせ内容 *</label>
        <textarea
          value={contactForm.message}
          onChange={(e) => updateContactForm("message", e.target.value)}
          rows={6}
          className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-h-[120px] touch-manipulation bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
            contactErrors.message ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
          }`}
          placeholder="詳細をお聞かせください..."
        />
        {contactErrors.message && (
          <p className="mt-1 text-sm text-red-500 dark:text-red-400">{contactErrors.message}</p>
        )}
      </div>

      <button
        onClick={handleSubmitContact}
        disabled={isSubmitting}
        className="w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 disabled:bg-primary-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium min-h-[44px] flex items-center justify-center touch-manipulation"
      >
        {isSubmitting ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            送信中...
          </>
        ) : (
          '送信'
        )}
      </button>
    </div>
  );

  const renderHistory = () => {
    const getStatusColor = (status: ContactHistory['status']) => {
      switch (status) {
        case 'pending':
          return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
        case 'responded':
          return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
        case 'closed':
          return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
        default:
          return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
      }
    };

    const getStatusText = (status: ContactHistory['status']) => {
      switch (status) {
        case 'pending':
          return '回答待ち';
        case 'responded':
          return '回答済み';
        case 'closed':
          return '解決済み';
        default:
          return '不明';
      }
    };

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleString('ja-JP', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    return (
      <div className="space-y-3 sm:space-y-4">
        <div className="mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">お問い合わせ履歴</h3>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-tight">
            これまでに送信されたお問い合わせの一覧です。
          </p>
        </div>

        {contactHistory.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-4h-3m-2 4h-3m-4 0h3m-3 0v-2m0-2v-2" />
              </svg>
            </div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">お問い合わせ履歴がありません</h4>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">お問い合わせタブから新しいお問い合わせを送信できます。</p>
          </div>
        ) : (
          <div className="space-y-3">
            {contactHistory.map((contact) => (
              <div key={contact.id} className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(contact.status)}`}>
                        {getStatusText(contact.status)}
                      </span>
                      {contact.category && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                          {contact.category}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      {contact.subject || '件名なし'}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(contact.submittedAt)}
                    </p>
                  </div>
                </div>
                
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-3">
                  <p className="line-clamp-3">{contact.message}</p>
                </div>
                
                {contact.response && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      <span className="text-xs font-medium text-blue-800 dark:text-blue-300">サポートからの回答</span>
                      {contact.responseAt && (
                        <span className="text-xs text-blue-600 dark:text-blue-400">
                          {formatDate(contact.responseAt)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300">{contact.response}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderInfo = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">Pairiod</h3>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 px-4 sm:px-0">女性の健康をサポートする生理管理アプリ</p>
      </div>

      <div className="bg-gradient-to-r from-primary-50 to-pink-50 dark:from-primary-900/30 dark:to-pink-900/30 rounded-lg p-4 sm:p-6">
        <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white mb-3">アプリについて</h4>
        <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          Pairiodは、女性の生理周期管理を通じて健康な生活をサポートするアプリです。 生理記録だけでなく、症状記録、妊娠サポート、パートナーとの情報共有など、
          女性の様々なライフステージに寄り添う機能を提供しています。
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 sm:p-4">
          <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2 sm:mb-3">バージョン情報</h5>
          <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
            <p>アプリバージョン: v1.0.0</p>
            <p>リリース日: 2025年1月</p>
            <p>最終更新: 2025年1月20日</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 sm:p-4">
          <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2 sm:mb-3">開発者情報</h5>
          <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
            <p>開発: Pairiod Team</p>
            <p>サポート: support@pairiod.com</p>
            <p>公式サイト: www.pairiod.com</p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-600 pt-4 sm:pt-6">
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6">
          <button
            onClick={() => setShowTermsModal(true)}
            className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 active:text-primary-700 dark:active:text-primary-300 transition-colors min-h-[40px] flex items-center touch-manipulation"
          >
            利用規約
          </button>
          <span className="hidden sm:inline text-gray-300 dark:text-gray-600">|</span>
          <button
            onClick={() => setShowPrivacyModal(true)}
            className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 active:text-primary-700 dark:active:text-primary-300 transition-colors min-h-[40px] flex items-center touch-manipulation"
          >
            プライバシーポリシー
          </button>
        </div>
      </div>

      <div className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 px-4 sm:px-0">
        <p>© 2025 Pairiod. All rights reserved.</p>
        <p className="mt-1 sm:mt-2">女性の健康と幸せのために</p>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ margin: 0, top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-t-xl sm:rounded-xl shadow-2xl w-full sm:max-w-4xl sm:w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">サポート</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="px-4 sm:px-6 pt-3 sm:pt-4 flex-shrink-0">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as "faq" | "contact" | "info" | "history")}
                className={`flex-1 flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 py-2 sm:py-3 px-1 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors min-h-[60px] sm:min-h-[44px] ${
                  activeTab === tab.id
                    ? "bg-white dark:bg-gray-600 text-primary-700 dark:text-primary-300 shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
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
          {activeTab === "history" && renderHistory()}
          {activeTab === "info" && renderInfo()}
        </div>
      </div>

      {/* Terms of Service Modal */}
      <TermsOfServiceModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />

      {/* Privacy Policy Modal */}
      <PrivacyPolicyModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />
    </div>,
    document.body
  );
};
