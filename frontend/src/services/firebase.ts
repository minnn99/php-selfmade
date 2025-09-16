import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { isSupported } from 'firebase/messaging';

// Firebase設定（実際の値は.envから読み込み）
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Firebase初期化
const app = initializeApp(firebaseConfig);

// FCM関数
export const initializeFCM = async () => {
  try {
    // ブラウザがFCMをサポートしているかチェック
    const supported = await isSupported();
    if (!supported) {
      console.log('このブラウザはFCMをサポートしていません');
      return null;
    }

    const messaging = getMessaging(app);
    
    // VAPID公開キーでトークンを取得
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
    });
    
    if (token) {
      console.log('FCMトークンを取得しました:', token);
      
      // サーバーにトークンを送信
      // auth_dataから認証トークンを取得 (暗号化されたデータを考慮)
      const authDataStr = localStorage.getItem('auth_data');
      if (!authDataStr) {
        console.error('認証情報が見つかりません');
        return null;
      }
      
      // 暗号化機能をimportして使用
      const { decryptData, isEncrypted } = await import('../utils/encryption');
      const dataToUse = isEncrypted(authDataStr) ? decryptData(authDataStr) : authDataStr;
      const authData = JSON.parse(dataToUse);
      const authToken = authData.token;
      
      const response = await fetch('/api/user/fcm-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ fcmToken: token })
      });
      
      if (response.ok) {
        console.log('FCMトークンをサーバーに送信しました');
      } else {
        console.error('FCMトークンの送信に失敗しました:', response.status);
      }
      
      return token;
    } else {
      console.log('FCMトークンの取得に失敗しました');
      return null;
    }
  } catch (error) {
    console.error('FCM初期化エラー:', error);
    return null;
  }
};

// フォアグラウンド通知受信
export const setupForegroundListener = () => {
  const messaging = getMessaging(app);

  onMessage(messaging, async (payload) => {
    console.log('フォアグラウンド通知受信:', payload);

    // カスタム通知を作成
    const notification = {
      id: Date.now().toString(),
      type: payload.data?.type || 'system',
      title: payload.notification?.title || 'お知らせ',
      message: payload.notification?.body || '',
      timestamp: new Date().toLocaleString('ja-JP'),
      isRead: false,
      priority: payload.data?.priority || 'medium'
    };

    // Get user ID for user-specific storage
    let userId = "unknown";
    try {
      const { authAPI } = await import('./api');
      const userData = await authAPI.getUser();
      const user = (userData.data as { user?: { id?: string | number } })?.user;
      userId = user?.id?.toString() || "unknown";
    } catch {
      // Fallback
    }

    // LocalStorageにユーザー固有で保存
    const notificationKey = `notifications_${userId}`;
    const notifications = JSON.parse(localStorage.getItem(notificationKey) || '[]');
    notifications.unshift(notification);
    localStorage.setItem(notificationKey, JSON.stringify(notifications));
    
    // バッジ更新イベント発火
    window.dispatchEvent(new CustomEvent('notificationUpdated'));
    
    // ブラウザ通知表示（FCMメッセージの場合のみ）
    // ローカル通知との競合を避けるため、FCMから来た通知のみ表示
    if (Notification.permission === 'granted' && payload.from) {
      console.log('Creating FCM browser notification:', notification.title);
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
        silent: false
      });
    } else {
      console.log('Skipping FCM browser notification to avoid conflicts');
    }
  });
};

export { app };