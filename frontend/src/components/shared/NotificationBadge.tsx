import React, { useState, useEffect } from 'react';

interface NotificationItem {
  id: string;
  type: "period" | "medication" | "appointment" | "reminder" | "system";
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority: "high" | "medium" | "low";
}

export const NotificationBadge: React.FC = () => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const loadUnreadCount = async () => {
      // Get current user ID
      let userId = "unknown";
      try {
        const { authAPI } = await import('../../services/api');
        const userData = await authAPI.getUser();
        const user = (userData.data as { user?: { id?: string | number } })?.user;
        userId = user?.id?.toString() || "unknown";
      } catch {
        // Fallback
      }

      const notificationKey = `notifications_${userId}`;
      const storedNotifications = localStorage.getItem(notificationKey);
      if (storedNotifications) {
        const notifications: NotificationItem[] = JSON.parse(storedNotifications);
        const unreadNotifications = notifications.filter(n => !n.isRead);
        setUnreadCount(unreadNotifications.length);
      } else {
        setUnreadCount(0);
      }
    };

    // Initial load
    loadUnreadCount();

    // Listen for storage changes to update badge when notifications change
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.startsWith("notifications_")) {
        loadUnreadCount();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom events within the same window
    const handleNotificationUpdate = () => {
      loadUnreadCount();
    };

    window.addEventListener('notificationUpdated', handleNotificationUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('notificationUpdated', handleNotificationUpdate);
    };
  }, []);

  // Only show badge if there are unread notifications
  if (unreadCount === 0) {
    return null;
  }

  return (
    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
  );
};