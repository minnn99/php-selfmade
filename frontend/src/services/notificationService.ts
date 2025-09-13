interface NotificationData {
  title: string;
  body: string;
  tag?: string;
  icon?: string;
  badge?: string;
  requireInteraction?: boolean;
}

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

  private addToInternalNotificationSystem(title: string, message: string, type: string = 'system'): void {
    const appNotification = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`, // より一意なIDを生成
      type: type as any,
      title: title.replace('Pairiod - ', ''),
      message: message,
      timestamp: new Date().toISOString(),
      isRead: false,
      priority: 'medium' as const,
    };

    // 既存の通知を取得
    const existingNotifications = JSON.parse(localStorage.getItem("notifications") || "[]");
    
    // 新しい通知を先頭に追加
    const updatedNotifications = [appNotification, ...existingNotifications];
    
    // localStorageに保存
    localStorage.setItem("notifications", JSON.stringify(updatedNotifications));
    
    // 通知更新イベントを発火
    window.dispatchEvent(new CustomEvent('notificationUpdated'));
  }


  public sendNotification(data: NotificationData): boolean {
    if (!this.hasPermission()) {
      console.warn('通知権限が許可されていません');
      return false;
    }

    try {
      const notification = new Notification(data.title, {
        body: data.body,
        icon: data.icon || '/vite.svg',
        badge: data.badge || '/vite.svg',
        tag: data.tag || 'pairiod-notification',
        requireInteraction: data.requireInteraction || false,
      });

      // 通知がクリックされた時の処理
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // 5秒後に自動で閉じる
      setTimeout(() => {
        notification.close();
      }, 5000);

      // アプリ内通知システムにも追加
      const notificationType = data.tag?.includes('period') ? 'period' : 
                              data.tag?.includes('medication') ? 'medication' : 
                              data.tag?.includes('appointment') ? 'appointment' : 
                              data.tag?.includes('reminder') ? 'reminder' : 'system';
      this.addToInternalNotificationSystem(data.title, data.body, notificationType);

      return true;
    } catch (error) {
      console.error('通知送信エラー:', error);
      return false;
    }
  }

  // 生理予定日の通知
  public sendPeriodReminderNotification(daysUntil: number): boolean {
    let title = 'Pairiod - 生理予定日のお知らせ';
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
  public sendFertilityPeriodStartNotification(): boolean {
    return this.sendNotification({
      title: 'Pairiod - 排卵期のお知らせ',
      body: '排卵期間に入りました。妊娠しやすい期間です 💕',
      tag: 'fertility-period-start',
      requireInteraction: true,
    });
  }

  // 排卵日の通知
  public sendOvulationDayNotification(): boolean {
    return this.sendNotification({
      title: 'Pairiod - 排卵日のお知らせ',
      body: '今日は排卵日です。最も妊娠しやすい日です 🥚',
      tag: 'ovulation-day',
      requireInteraction: true,
    });
  }

  // 後方互換性のための旧関数（テスト用）
  public sendOvulationReminderNotification(daysUntil: number = 0): boolean {
    if (daysUntil === 0) {
      return this.sendOvulationDayNotification();
    } else {
      return this.sendFertilityPeriodStartNotification();
    }
  }

  // パートナー向け通知
  public sendPartnerNotification(type: 'menstrualStart' | 'ovulationPeriod'): boolean {
    let title = 'Pairiod - パートナー情報';
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
  public sendMedicationReminder(medicationName: string, minutesBefore: number = 0): boolean {
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
  public sendGeneralReminder(title: string, message: string): boolean {
    return this.sendNotification({
      title: `Pairiod - ${title}`,
      body: message,
      tag: 'general-reminder',
    });
  }

  // 症状記録のリマインダー
  public sendSymptomReminderNotification(): boolean {
    return this.sendNotification({
      title: 'Pairiod - 症状記録のリマインダー',
      body: '今日の症状や気分を記録しましょう 📝',
      tag: 'symptom-reminder',
    });
  }

  // 健康チェックのリマインダー
  public sendHealthCheckReminder(): boolean {
    return this.sendNotification({
      title: 'Pairiod - 健康チェック',
      body: '定期的な婦人科検診をお忘れなく 🏥',
      tag: 'health-check-reminder',
      requireInteraction: true,
    });
  }
}

export const notificationService = NotificationService.getInstance();