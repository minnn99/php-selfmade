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
    // localStorageから通知を読み込み（実際の実装では API から取得）
    const storedNotifications = localStorage.getItem("notifications");
    if (storedNotifications) {
      setNotifications(JSON.parse(storedNotifications));
    } else {
      setNotifications([]);
    }
  };

  const markAsRead = (id: string) => {
    const updatedNotifications = notifications.map(notification =>
      notification.id === id ? { ...notification, isRead: true } : notification
    );
    setNotifications(updatedNotifications);
    localStorage.setItem("notifications", JSON.stringify(updatedNotifications));
    // Dispatch custom event to update badge
    window.dispatchEvent(new CustomEvent('notificationUpdated'));
  };

  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(notification => ({
      ...notification,
      isRead: true,
    }));
    setNotifications(updatedNotifications);
    localStorage.setItem("notifications", JSON.stringify(updatedNotifications));
    // Dispatch custom event to update badge
    window.dispatchEvent(new CustomEvent('notificationUpdated'));
  };

  const deleteNotification = (id: string) => {
    const updatedNotifications = notifications.filter(notification => notification.id !== id);
    setNotifications(updatedNotifications);
    localStorage.setItem("notifications", JSON.stringify(updatedNotifications));
    // Dispatch custom event to update badge
    window.dispatchEvent(new CustomEvent('notificationUpdated'));
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
      <div className="px-3 sm:px-4 py-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <h3 className="text-base sm:text-lg font-medium text-gray-900">通知</h3>
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
                className="text-xs sm:text-sm text-primary-600 hover:text-primary-800 min-h-[44px] px-2 flex items-center"
              >
                すべて既読
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="overflow-y-auto max-h-96 lg:max-h-[calc(80vh-120px)]">
        {notifications.length === 0 ? (
          <div className="p-6 sm:p-8 text-center text-gray-500">
            <div className="text-3xl sm:text-4xl mb-2">📭</div>
            <p className="text-sm sm:text-base">通知はありません</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 sm:p-4 hover:bg-gray-50 transition-colors border-l-4 ${
                  !notification.isRead ? "bg-blue-25" : ""
                } ${getPriorityColor(notification.priority)}`}
              >
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <div className="flex-shrink-0 text-base sm:text-lg">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 mr-2">
                        <p className={`text-xs sm:text-sm font-medium leading-tight ${
                          !notification.isRead ? "text-gray-900" : "text-gray-700"
                        }`}>
                          {notification.title}
                        </p>
                        <p className={`text-xs sm:text-sm mt-1 leading-relaxed ${
                          !notification.isRead ? "text-gray-700" : "text-gray-500"
                        }`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {notification.timestamp}
                        </p>
                      </div>
                      <div className="flex items-start space-x-1 flex-shrink-0">
                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-2 text-primary-600 hover:text-primary-800 text-sm min-h-[44px] min-w-[44px] flex items-center justify-center"
                            title="既読にする"
                          >
                            ✓
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-2 text-red-500 hover:text-red-700 text-sm min-h-[44px] min-w-[44px] flex items-center justify-center"
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
      <div className={`lg:hidden fixed top-0 right-0 h-full w-72 sm:w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
        isVisible ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-3 sm:px-4 py-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">通知</h3>
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
                    className="text-xs sm:text-sm text-primary-600 hover:text-primary-800 min-h-[44px] px-2 flex items-center"
                  >
                    すべて既読
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Notifications List - Mobile Full Height */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-6 sm:p-8 text-center text-gray-500">
                <div className="text-3xl sm:text-4xl mb-2">📭</div>
                <p className="text-sm sm:text-base">通知はありません</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 sm:p-4 hover:bg-gray-50 transition-colors border-l-4 ${
                      !notification.isRead ? "bg-blue-25" : ""
                    } ${getPriorityColor(notification.priority)}`}
                  >
                    <div className="flex items-start space-x-2 sm:space-x-3">
                      <div className="flex-shrink-0 text-base sm:text-lg">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0 mr-2">
                            <p className={`text-xs sm:text-sm font-medium leading-tight ${
                              !notification.isRead ? "text-gray-900" : "text-gray-700"
                            }`}>
                              {notification.title}
                            </p>
                            <p className={`text-xs sm:text-sm mt-1 leading-relaxed ${
                              !notification.isRead ? "text-gray-700" : "text-gray-500"
                            }`}>
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                              {notification.timestamp}
                            </p>
                          </div>
                          <div className="flex items-start space-x-1 flex-shrink-0">
                            {!notification.isRead && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="p-2 text-primary-600 hover:text-primary-800 text-sm min-h-[44px] min-w-[44px] flex items-center justify-center"
                                title="既読にする"
                              >
                                ✓
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="p-2 text-red-500 hover:text-red-700 text-sm min-h-[44px] min-w-[44px] flex items-center justify-center"
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