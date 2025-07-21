import React, { useState, useEffect } from "react";

interface NotificationItem {
  id: string;
  type: "period" | "medication" | "appointment" | "reminder" | "system";
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority: "high" | "medium" | "low";
}

interface NotificationPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationPopup: React.FC<NotificationPopupProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      loadNotifications();
      // アニメーションのために少し遅延させる
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
      // アニメーション終了後にDOMから削除
      setTimeout(() => setShouldRender(false), 300);
    }
  }, [isOpen]);

  const loadNotifications = () => {
    // サンプル通知データ（実際の実装では API から取得）
    const sampleNotifications: NotificationItem[] = [
      {
        id: "1",
        type: "period",
        title: "生理予定日",
        message: "明日が生理予定日です。準備をお忘れなく！",
        timestamp: "2時間前",
        isRead: false,
        priority: "high",
      },
      {
        id: "2",
        type: "medication",
        title: "服薬リマインダー",
        message: "ピルの服薬時間です（20:00）",
        timestamp: "5時間前",
        isRead: false,
        priority: "medium",
      },
      {
        id: "3",
        type: "appointment",
        title: "病院予約",
        message: "明後日の婦人科受診をお忘れなく",
        timestamp: "1日前",
        isRead: true,
        priority: "medium",
      },
      {
        id: "4",
        type: "reminder",
        title: "症状記録",
        message: "今日の体調はいかがですか？記録してみましょう",
        timestamp: "2日前",
        isRead: true,
        priority: "low",
      },
      {
        id: "5",
        type: "system",
        title: "アプリ更新",
        message: "新機能が追加されました。アップデートをご確認ください",
        timestamp: "3日前",
        isRead: false,
        priority: "low",
      },
      {
        id: "6",
        type: "period",
        title: "排卵予定日",
        message: "排卵予定日が近づいています。妊娠を希望される方はご注意ください",
        timestamp: "6時間前",
        isRead: false,
        priority: "medium",
      },
      {
        id: "7",
        type: "reminder",
        title: "基礎体温測定",
        message: "基礎体温の測定を忘れていませんか？朝起きてすぐに測定しましょう",
        timestamp: "8時間前",
        isRead: true,
        priority: "medium",
      },
      {
        id: "8",
        type: "medication",
        title: "鉄分サプリ",
        message: "鉄分サプリメントの服用時間です",
        timestamp: "12時間前",
        isRead: true,
        priority: "low",
      },
      {
        id: "9",
        type: "appointment",
        title: "定期検診リマインダー",
        message: "子宮がん検診の予約をお忘れではありませんか？年に一度の検診をお勧めします",
        timestamp: "1日前",
        isRead: false,
        priority: "high",
      },
      {
        id: "10",
        type: "system",
        title: "データバックアップ完了",
        message: "お客様のデータが安全にバックアップされました",
        timestamp: "2日前",
        isRead: true,
        priority: "low",
      },
      {
        id: "11",
        type: "reminder",
        title: "水分補給",
        message: "生理中は脱水になりやすいです。こまめな水分補給を心がけましょう",
        timestamp: "3日前",
        isRead: false,
        priority: "medium",
      },
      {
        id: "12",
        type: "period",
        title: "PMS症状チェック",
        message: "PMS症状が予想される時期です。症状の記録をつけませんか？",
        timestamp: "4日前",
        isRead: true,
        priority: "medium",
      },
      {
        id: "13",
        type: "medication",
        title: "痛み止め確認",
        message: "生理痛に備えて痛み止めの在庫を確認しておきましょう",
        timestamp: "5日前",
        isRead: false,
        priority: "low",
      },
      {
        id: "14",
        type: "reminder",
        title: "運動記録",
        message: "適度な運動は生理不順の改善に効果があります。今日の運動を記録しませんか？",
        timestamp: "1週間前",
        isRead: true,
        priority: "low",
      },
      {
        id: "15",
        type: "system",
        title: "プライバシー設定更新",
        message: "プライバシーポリシーが更新されました。変更内容をご確認ください",
        timestamp: "1週間前",
        isRead: false,
        priority: "medium",
      },
    ];

    // 新しいサンプルデータを強制的に読み込み（開発用）
    setNotifications(sampleNotifications);
    localStorage.setItem("notifications", JSON.stringify(sampleNotifications));
  };

  const markAsRead = (id: string) => {
    const updatedNotifications = notifications.map(notification =>
      notification.id === id ? { ...notification, isRead: true } : notification
    );
    setNotifications(updatedNotifications);
    localStorage.setItem("notifications", JSON.stringify(updatedNotifications));
  };

  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(notification => ({
      ...notification,
      isRead: true,
    }));
    setNotifications(updatedNotifications);
    localStorage.setItem("notifications", JSON.stringify(updatedNotifications));
  };

  const deleteNotification = (id: string) => {
    const updatedNotifications = notifications.filter(notification => notification.id !== id);
    setNotifications(updatedNotifications);
    localStorage.setItem("notifications", JSON.stringify(updatedNotifications));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "period":
        return "🌺";
      case "medication":
        return "💊";
      case "appointment":
        return "🏥";
      case "reminder":
        return "⏰";
      case "system":
        return "⚙️";
      default:
        return "📢";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-red-500 bg-red-50";
      case "medium":
        return "border-l-yellow-500 bg-yellow-50";
      case "low":
        return "border-l-blue-500 bg-blue-50";
      default:
        return "border-l-gray-500 bg-gray-50";
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (!shouldRender) return null;

  const renderContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <h3 className="text-lg font-medium text-gray-900">通知</h3>
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-primary-600 hover:text-primary-800"
              >
                すべて既読
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="overflow-y-auto max-h-96 lg:max-h-[calc(80vh-120px)]">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-2">📭</div>
            <p>通知はありません</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 transition-colors border-l-4 ${
                  !notification.isRead ? "bg-blue-25" : ""
                } ${getPriorityColor(notification.priority)}`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 text-lg">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          !notification.isRead ? "text-gray-900" : "text-gray-700"
                        }`}>
                          {notification.title}
                        </p>
                        <p className={`text-sm mt-1 ${
                          !notification.isRead ? "text-gray-700" : "text-gray-500"
                        }`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {notification.timestamp}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1 ml-2">
                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-1 text-primary-600 hover:text-primary-800 text-xs"
                            title="既読にする"
                          >
                            ✓
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-1 text-red-500 hover:text-red-700 text-xs"
                          title="削除"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );

  return (
    <>
      {/* Backdrop - Mobile only when open */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />
      )}
      
      {/* Desktop backdrop */}
      {isOpen && (
        <div className="hidden lg:block fixed inset-0 z-40" onClick={onClose} />
      )}
      
      {/* Popup - Desktop */}
      {isOpen && (
        <div className="hidden lg:block absolute top-16 right-4 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-[80vh] overflow-hidden">
          {renderContent()}
        </div>
      )}

      {/* Popup - Mobile (Slide-in from right) */}
      <div className={`lg:hidden fixed top-0 right-0 h-full w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
        isVisible ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <h3 className="text-lg font-medium text-gray-900">通知</h3>
                {unreadCount > 0 && (
                  <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-primary-600 hover:text-primary-800"
                  >
                    すべて既読
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Notifications List - Mobile Full Height */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="text-4xl mb-2">📭</div>
                <p>通知はありません</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors border-l-4 ${
                      !notification.isRead ? "bg-blue-25" : ""
                    } ${getPriorityColor(notification.priority)}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 text-lg">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${
                              !notification.isRead ? "text-gray-900" : "text-gray-700"
                            }`}>
                              {notification.title}
                            </p>
                            <p className={`text-sm mt-1 ${
                              !notification.isRead ? "text-gray-700" : "text-gray-500"
                            }`}>
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                              {notification.timestamp}
                            </p>
                          </div>
                          <div className="flex items-center space-x-1 ml-2">
                            {!notification.isRead && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="p-1 text-primary-600 hover:text-primary-800 text-xs"
                                title="既読にする"
                              >
                                ✓
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="p-1 text-red-500 hover:text-red-700 text-xs"
                              title="削除"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};