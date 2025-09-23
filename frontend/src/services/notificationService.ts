interface NotificationData {
  title: string;
  body: string;
  tag?: string;
  icon?: string;
  badge?: string;
  requireInteraction?: boolean;
}

type NotificationType = 'period' | 'medication' | 'appointment' | 'reminder' | 'system';

class NotificationService {
  private static instance: NotificationService;
  private notificationPermission: NotificationPermission = 'default';

  private constructor() {
    this.checkPermission();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private checkPermission(): void {
    if ('Notification' in window) {
      this.notificationPermission = Notification.permission;
    }
  }

  public async requestPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      this.notificationPermission = permission;
      return permission;
    }
    return 'denied';
  }

  public hasPermission(): boolean {
    return this.notificationPermission === 'granted';
  }

  private async addToInternalNotificationSystem(title: string, message: string, type: NotificationType = 'system'): Promise<void> {
    const appNotification = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`, // より一意なIDを生成
      type,
      title: title.replace('Pairiod - ', ''),
      message: message,
      timestamp: new Date().toISOString(),
      isRead: false,
      priority: 'medium' as const,
    };

    // ユーザーIDを取得
    let userId = "unknown";
    try {
      const { authAPI } = await import('./api');
      const userData = await authAPI.getUser();
      const user = (userData.data as { user?: { id?: string | number } })?.user;
      userId = user?.id?.toString() || "unknown";
    } catch {
      // Fallback to unknown
    }

    // ユーザー固有のキーを使用
    const notificationKey = `notifications_${userId}`;

    // 既存の通知を取得
    const existingNotifications = JSON.parse(localStorage.getItem(notificationKey) || "[]");

    // 新しい通知を先頭に追加
    const updatedNotifications = [appNotification, ...existingNotifications];

    // localStorageに保存
    localStorage.setItem(notificationKey, JSON.stringify(updatedNotifications));

    // 通知更新イベントを発火
    window.dispatchEvent(new CustomEvent('notificationUpdated'));
  }


  public async sendNotification(data: NotificationData): Promise<boolean> {
    if (!this.hasPermission()) {
      console.warn('通知権限が許可されていません. 現在の権限:', Notification.permission);
      const permission = await this.requestPermission();
      if (permission === 'granted') {
        // 権限が許可されたら通知を再送信
        return this.sendNotification(data);
      }

      // 権限がなくてもアプリ内通知は追加
      const notificationType = this.getNotificationType(data.tag);
      this.addToInternalNotificationSystem(data.title, data.body, notificationType);
      return false;
    }

    try {
      // Service Workerが利用可能か確認（controllerがなくても利用可能）
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;

          const notificationOptions = {
            body: data.body,
            icon: data.icon || '/vite.svg',
            badge: data.badge || '/vite.svg',
            tag: data.tag || `pill-reminder-${Date.now()}`,
            requireInteraction: data.requireInteraction || false,
            silent: false,
            data: {
              click_action: '/',
              type: this.getNotificationType(data.tag),
              timestamp: Date.now()
            },
            vibrate: [200, 100, 200]
          };

          // Service Worker APIを使用して通知を表示
          await registration.showNotification(data.title, notificationOptions);

          // アプリ内通知システムにも追加
          const notificationType = this.getNotificationType(data.tag);
          this.addToInternalNotificationSystem(data.title, data.body, notificationType);

          return true;
        } catch (swError) {
          console.error('Service Worker notification failed, falling back to Notification API:', swError);
          // Service Workerでの通知が失敗した場合、フォールバック
        }
      }

      // Service Workerが利用できない、または失敗した場合は従来のNotification APIを使用
      const notification = new Notification(data.title, {
        body: data.body,
        icon: data.icon || '/vite.svg',
        badge: data.badge || '/vite.svg',
        tag: data.tag || `local-notification-${Date.now()}`,
        requireInteraction: data.requireInteraction || false,
        silent: false,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      notification.onerror = (error) => {
        console.error('❌ Notification API error:', error);
      };

      setTimeout(() => {
        if (notification) {
          notification.close();
        }
      }, 10000);

      // アプリ内通知システムにも追加
      const notificationType = this.getNotificationType(data.tag);
      this.addToInternalNotificationSystem(data.title, data.body, notificationType);

      return true;
    } catch (error) {
      console.error('❌ 通知送信エラー:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });

      // エラーが発生してもアプリ内通知は追加
      const notificationType = this.getNotificationType(data.tag);
      this.addToInternalNotificationSystem(data.title, data.body, notificationType);
      return false;
    }
  }

  private getNotificationType(tag?: string): NotificationType {
    if (tag?.includes('period')) return 'period';
    if (tag?.includes('medication')) return 'medication';
    if (tag?.includes('appointment')) return 'appointment';
    if (tag?.includes('reminder')) return 'reminder';
    return 'system';
  }

  // 生理予定日の通知
  public async sendPeriodReminderNotification(daysUntil: number): Promise<boolean> {
    const title = 'Pairiod - 生理予定日のお知らせ';
    let body = '';

    if (daysUntil === 0) {
      body = '今日は生理予定日です 🩸';
    } else if (daysUntil === 1) {
      body = '明日は生理予定日です。準備をお忘れなく 💊';
    } else {
      body = `あと${daysUntil}日で生理予定日です 📅`;
    }

    return this.sendNotification({
      title,
      body,
      tag: 'period-reminder',
      requireInteraction: true,
    });
  }

  // 排卵期開始の通知
  public async sendFertilityPeriodStartNotification(): Promise<boolean> {
    return this.sendNotification({
      title: 'Pairiod - 排卵期のお知らせ',
      body: '排卵期間に入りました。妊娠しやすい期間です 💕',
      tag: 'fertility-period-start',
      requireInteraction: true,
    });
  }

  // 排卵日の通知
  public async sendOvulationDayNotification(): Promise<boolean> {
    return this.sendNotification({
      title: 'Pairiod - 排卵日のお知らせ',
      body: '今日は排卵日です。最も妊娠しやすい日です 🥚',
      tag: 'ovulation-day',
      requireInteraction: true,
    });
  }

  // 後方互換性のための旧関数（テスト用）
  public async sendOvulationReminderNotification(daysUntil: number = 0): Promise<boolean> {
    if (daysUntil === 0) {
      return this.sendOvulationDayNotification();
    } else {
      return this.sendFertilityPeriodStartNotification();
    }
  }

  // パートナー向け通知
  public async sendPartnerNotification(type: 'menstrualStart' | 'ovulationPeriod'): Promise<boolean> {
    const title = 'Pairiod - パートナー情報';
    let body = '';

    switch (type) {
      case 'menstrualStart':
        body = 'パートナーの生理が始まりました 💝';
        break;
      case 'ovulationPeriod':
        body = 'パートナーの排卵期が近づいています 💕';
        break;
    }

    return this.sendNotification({
      title,
      body,
      tag: `partner-${type}`,
    });
  }

  // 服薬リマインダー
  public async sendMedicationReminder(medicationName: string, minutesBefore: number = 0): Promise<boolean> {
    let body = '';
    
    if (minutesBefore === 0) {
      body = `${medicationName}の服用時間です 💊`;
    } else if (minutesBefore < 60) {
      body = `${minutesBefore}分後に${medicationName}の服用時間です 💊`;
    } else {
      const hours = Math.floor(minutesBefore / 60);
      const minutes = minutesBefore % 60;
      if (minutes === 0) {
        body = `${hours}時間後に${medicationName}の服用時間です 💊`;
      } else {
        body = `${hours}時間${minutes}分後に${medicationName}の服用時間です 💊`;
      }
    }

    return this.sendNotification({
      title: 'Pairiod - 服薬リマインダー',
      body,
      tag: 'medication-reminder',
      requireInteraction: true,
    });
  }

  // 一般的なリマインダー
  public async sendGeneralReminder(title: string, message: string): Promise<boolean> {
    return this.sendNotification({
      title: `Pairiod - ${title}`,
      body: message,
      tag: 'general-reminder',
    });
  }

  // 症状記録のリマインダー
  public async sendSymptomReminderNotification(): Promise<boolean> {
    return this.sendNotification({
      title: 'Pairiod - 症状記録のリマインダー',
      body: '今日の症状や気分を記録しましょう 📝',
      tag: 'symptom-reminder',
    });
  }

  // 健康チェックのリマインダー
  public async sendHealthCheckReminder(): Promise<boolean> {
    return this.sendNotification({
      title: 'Pairiod - 健康チェック',
      body: '定期的な婦人科検診をお忘れなく 🏥',
      tag: 'health-check-reminder',
      requireInteraction: true,
    });
  }
}

export const notificationService = NotificationService.getInstance();