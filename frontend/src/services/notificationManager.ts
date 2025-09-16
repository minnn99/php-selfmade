import { notificationService } from './notificationService';
import { userDataAPI } from './api';

interface UserSettings {
  periodReminders: boolean;
  ovulationReminders: boolean;
  partnerNotifications: boolean;
  medicationReminders: boolean;
  pillReminders: boolean;
  generalReminders: boolean;
}

interface CycleData {
  startDate: string;
  endDate?: string;
  isPeriodStart?: boolean;
}

interface DetailedSettings {
  menstrualReminder?: {
    enabled: boolean;
    daysBeforeStart: number;
    time: string;
  };
  ovulationReminder?: {
    enabled: boolean;
    daysBeforeOvulation: number;
    time: string;
  };
  pillReminder?: {
    enabled: boolean;
    pillName: string;
    times: string[];
    reminderMinutes: number;
  };
}

interface UserDataResponse {
  success: boolean;
  data?: {
    notificationSettings?: DetailedSettings;
    [key: string]: unknown;
  };
  message?: string;
}

class NotificationManager {
  private static instance: NotificationManager;
  private settings: UserSettings;
  private scheduledNotifications: Set<string> = new Set();
  private checkInterval: number | null = null;
  private lastCheckDate: string | null = null;

  private constructor() {
    this.settings = this.loadSettings();
    this.initializeEventListeners();
    this.startPeriodicCheck();
  }

  public static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  private loadSettings(): UserSettings {
    try {
      const saved = localStorage.getItem('notificationSettings');
      return saved ? JSON.parse(saved) : {
        periodReminders: true,
        ovulationReminders: true,
        partnerNotifications: true,
        medicationReminders: true,
        pillReminders: true,
        generalReminders: true,
      };
    } catch {
      return {
        periodReminders: true,
        ovulationReminders: true,
        partnerNotifications: true,
        medicationReminders: true,
        pillReminders: true,
        generalReminders: true,
      };
    }
  }

  private loadDetailedSettings(): DetailedSettings | null {
    try {
      const saved = localStorage.getItem('notificationSettings');
      if (saved) {
        const settings = JSON.parse(saved);
        return settings.notificationSettings || settings;
      }
      return null;
    } catch {
      return null;
    }
  }

  private async loadDetailedSettingsFromAPI(): Promise<DetailedSettings | null> {
    try {
      const response = await userDataAPI.getSettings() as UserDataResponse;
      if (response.data?.notificationSettings) {
        return response.data.notificationSettings;
      }
      return null;
    } catch (error) {
      console.error('Failed to load notification settings from API:', error);
      return null;
    }
  }

  public updateSettings(newSettings: Partial<UserSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    localStorage.setItem('notificationSettings', JSON.stringify(this.settings));
  }

  public getSettings(): UserSettings {
    return { ...this.settings };
  }

  private initializeEventListeners(): void {
    // Listen for menstrual data updates
    window.addEventListener('menstrualDataUpdated', this.handleMenstrualDataUpdate.bind(this));

    // Listen for partner status updates
    window.addEventListener('partnerStatusUpdated', this.handlePartnerUpdate.bind(this));

    // Listen for visibility change to restart check when page becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.checkAndSendDueNotifications();
      }
    });
  }

  // 定期チェックシステムを開始
  private startPeriodicCheck(): void {
    // 既存のインターバルをクリア
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // 1分ごとにチェック
    this.checkInterval = window.setInterval(() => {
      this.checkAndSendDueNotifications();
    }, 60000); // 1分間隔

    // 初回実行
    this.checkAndSendDueNotifications();
  }

  // 現在時刻に送信すべき通知をチェックして送信
  private async checkAndSendDueNotifications(): Promise<void> {
    if (!notificationService.hasPermission()) return;

    const now = new Date();
    const today = now.toDateString();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // 日付が変わった場合、送信済み通知をリセット
    if (this.lastCheckDate !== today) {
      this.scheduledNotifications.clear();
      this.lastCheckDate = today;
    }

    try {
      // MySQLから設定を読み込み
      let detailedSettings = await this.loadDetailedSettingsFromAPI();
      if (!detailedSettings) {
        detailedSettings = this.loadDetailedSettings();
      }
      if (!detailedSettings) return;

      // ピルリマインダーのチェック
      if (this.settings.pillReminders && detailedSettings.pillReminder?.enabled) {
        await this.checkPillNotifications(detailedSettings.pillReminder, currentTime, today);
      }

      // 生理・排卵期通知のチェック（生理データが必要）
      const cycleData = await this.getCurrentCycleData();
      if (cycleData?.startDate) {
        await this.checkCycleNotifications(detailedSettings, cycleData, currentTime, today);
      }
    } catch (error) {
      console.error('定期チェック中にエラーが発生:', error);
    }
  }

  // ピル通知のチェック
  private async checkPillNotifications(pillReminder: DetailedSettings['pillReminder'], currentTime: string, today: string): Promise<void> {
    if (!pillReminder) return;

    const pillName = pillReminder.pillName || "ピル";
    const times = pillReminder.times || ["08:00"];
    const reminderMinutes = pillReminder.reminderMinutes || 0;

    for (const time of times) {
      const [targetHours, targetMinutes] = time.split(':').map(Number);
      const notificationTime = new Date();
      notificationTime.setHours(targetHours, targetMinutes - reminderMinutes, 0, 0);

      const notificationTimeStr = `${String(notificationTime.getHours()).padStart(2, '0')}:${String(notificationTime.getMinutes()).padStart(2, '0')}`;
      const notificationKey = `pill-${pillName}-${today}-${time}`;

      // 現在時刻と通知時刻が一致し、まだ送信していない場合
      if (notificationTimeStr === currentTime && !this.scheduledNotifications.has(notificationKey)) {
        await notificationService.sendMedicationReminder(pillName, reminderMinutes);
        this.scheduledNotifications.add(notificationKey);

        // UIの即座更新のために追加のイベントを発火
        window.dispatchEvent(new CustomEvent('notificationUpdated'));
      }
    }
  }

  // 生理・排卵期通知のチェック
  private async checkCycleNotifications(detailedSettings: DetailedSettings, cycleData: CycleData, currentTime: string, today: string): Promise<void> {
    const startDate = new Date(cycleData.startDate);
    const cycleLength = 28;
    const nextPeriodDate = new Date(startDate);
    nextPeriodDate.setDate(nextPeriodDate.getDate() + cycleLength);

    // 生理リマインダーのチェック
    if (this.settings.periodReminders && detailedSettings.menstrualReminder?.enabled) {
      const daysBefore = detailedSettings.menstrualReminder.daysBeforeStart || 1;
      const time = detailedSettings.menstrualReminder.time || "09:00";

      const notificationDate = new Date(nextPeriodDate);
      notificationDate.setDate(notificationDate.getDate() - daysBefore);

      const todayDate = new Date().toDateString();
      const notificationDateStr = notificationDate.toDateString();

      if (todayDate === notificationDateStr && time === currentTime) {
        const notificationKey = `period-${today}-${time}`;
        if (!this.scheduledNotifications.has(notificationKey)) {
          await notificationService.sendPeriodReminderNotification(daysBefore);
          this.scheduledNotifications.add(notificationKey);

          // UIの即座更新のために追加のイベントを発火
          window.dispatchEvent(new CustomEvent('notificationUpdated'));
        }
      }
    }

    // 排卵期通知のチェック
    if (this.settings.ovulationReminders && detailedSettings.ovulationReminder?.enabled) {
      const time = detailedSettings.ovulationReminder.time || "09:00";

      // 排卵日計算（次回生理の14日前）
      const ovulationDate = new Date(nextPeriodDate);
      ovulationDate.setDate(ovulationDate.getDate() - 14);

      // 妊娠しやすい期間開始（排卵日の5日前）
      const fertilityStartDate = new Date(ovulationDate);
      fertilityStartDate.setDate(fertilityStartDate.getDate() - 5);

      const todayDate = new Date().toDateString();

      // 妊娠しやすい期間開始の通知
      if (todayDate === fertilityStartDate.toDateString() && time === currentTime) {
        const notificationKey = `fertility-start-${today}-${time}`;
        if (!this.scheduledNotifications.has(notificationKey)) {
          await notificationService.sendFertilityPeriodStartNotification();
          this.scheduledNotifications.add(notificationKey);

          // UIの即座更新のために追加のイベントを発火
          window.dispatchEvent(new CustomEvent('notificationUpdated'));
        }
      }

      // 排卵日の通知
      if (todayDate === ovulationDate.toDateString() && time === currentTime) {
        const notificationKey = `ovulation-day-${today}-${time}`;
        if (!this.scheduledNotifications.has(notificationKey)) {
          await notificationService.sendOvulationDayNotification();
          this.scheduledNotifications.add(notificationKey);

          // UIの即座更新のために追加のイベントを発火
          window.dispatchEvent(new CustomEvent('notificationUpdated'));
        }
      }
    }
  }

  private async handleMenstrualDataUpdate(): Promise<void> {
    if (!notificationService.hasPermission()) {
      return;
    }

    try {
      // Get current cycle data to determine what notifications to schedule
      const cycleData = await this.getCurrentCycleData();

      if (cycleData) {
        // Send immediate notifications if appropriate
        if (cycleData.isPeriodStart && this.settings.partnerNotifications) {
          this.sendPartnerNotification('menstrualStart');
        }
      }

      // 定期チェックシステムがピル通知を処理するため、手動スケジューリングは不要
    } catch (error) {
      console.error('Error handling menstrual data update:', error);
    }
  }

  // クリーンアップメソッド
  public destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private handlePartnerUpdate(): void {
    // Handle partner-related notifications
    if (this.settings.partnerNotifications && notificationService.hasPermission()) {
      // This could be expanded based on specific partner events
    }
  }

  private async getCurrentCycleData(): Promise<CycleData | null> {
    try {
      // まずDBから最新のカレンダーデータを取得
      const { menstrualCycleAPI } = await import('./api');
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1;

      // 現在月とその前月のデータを取得
      const [currentMonthData, prevMonthData] = await Promise.all([
        menstrualCycleAPI.getCalendarData(currentYear, currentMonth),
        menstrualCycleAPI.getCalendarData(
          currentMonth === 1 ? currentYear - 1 : currentYear,
          currentMonth === 1 ? 12 : currentMonth - 1
        )
      ]);

      // 全カレンダーデータを結合
      const allCalendarData = {
        ...(prevMonthData.data as Record<string, unknown> || {}),
        ...(currentMonthData.data as Record<string, unknown> || {})
      };


      // 生理開始日を探す（最新の生理開始日を取得）
      const menstrualStartDates: Array<{ date: string; dateObj: Date }> = [];

      Object.entries(allCalendarData).forEach(([dateStr, dayData]: [string, unknown]) => {
        if (dayData && typeof dayData === 'object' && dayData !== null && 'is_period_start' in dayData && (dayData as { is_period_start: boolean }).is_period_start === true) {
          menstrualStartDates.push({
            date: dateStr,
            dateObj: new Date(dateStr)
          });
        }
      });

      if (menstrualStartDates.length === 0) {
        console.log('❌ 生理開始日が見つかりません');
        return null;
      }

      // 最新の生理開始日を取得
      menstrualStartDates.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
      const latestCycle = menstrualStartDates[0];

      const cycleData: CycleData = {
        startDate: latestCycle.date,
        isPeriodStart: true
      };

      return cycleData;
    } catch (error) {
      console.error('DB からの生理データ取得エラー:', error);

      // フォールバック: localStorageからの取得を試行
      try {
        const cycleData = JSON.parse(localStorage.getItem('cycleData') || '[]');

        if (!cycleData.length) return null;

        // Find current or most recent cycle
        const today = new Date();
        const currentCycle = cycleData.find((cycle: CycleData) => {
          const startDate = new Date(cycle.startDate);
          const endDate = cycle.endDate ? new Date(cycle.endDate) : null;
          return startDate <= today && (!endDate || endDate >= today);
        });

        return currentCycle || cycleData[cycleData.length - 1];
      } catch {
        return null;
      }
    }
  }



  public sendPartnerNotification(type: 'menstrualStart' | 'ovulationPeriod'): void {
    if (this.settings.partnerNotifications && notificationService.hasPermission()) {
      notificationService.sendPartnerNotification(type);
    }
  }

  public sendMedicationReminder(medicationName: string, minutesBefore: number = 0): void {
    if (this.settings.medicationReminders && notificationService.hasPermission()) {
      notificationService.sendMedicationReminder(medicationName, minutesBefore);
    }
  }

  public sendGeneralReminder(title: string, message: string): void {
    if (this.settings.generalReminders && notificationService.hasPermission()) {
      notificationService.sendGeneralReminder(title, message);
    }
  }

  // Method to check and send today's notifications
  public checkTodayNotifications(): void {
    if (!notificationService.hasPermission()) return;

    const today = new Date();
    const todayString = today.toDateString();

    // Check if we should send symptom recording reminder
    const lastSymptomReminder = localStorage.getItem('lastSymptomReminder');
    if (!lastSymptomReminder || lastSymptomReminder !== todayString) {
      // Send reminder at a reasonable time (not immediately on app load)
      setTimeout(() => {
        notificationService.sendSymptomReminderNotification();
        localStorage.setItem('lastSymptomReminder', todayString);
      }, 5000); // 5 seconds delay
    }

    // Check for health check reminders (monthly)
    const lastHealthCheck = localStorage.getItem('lastHealthCheckReminder');
    const lastHealthCheckDate = lastHealthCheck ? new Date(lastHealthCheck) : null;
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    if (!lastHealthCheckDate || lastHealthCheckDate < oneMonthAgo) {
      setTimeout(() => {
        notificationService.sendHealthCheckReminder();
        localStorage.setItem('lastHealthCheckReminder', todayString);
      }, 10000); // 10 seconds delay
    }

    // 定期チェックシステムがすべての通知を処理するため、手動スケジューリングは不要
  }

  public clearScheduledNotifications(): void {
    this.scheduledNotifications.clear();
  }

  // テスト用: 設定に基づいてスケジュールされる通知を表示
  public async getScheduledNotificationsInfo(): Promise<string[]> {
    const info: string[] = [];

    // MySQLから設定を優先的に読み込み
    let detailedSettings = await this.loadDetailedSettingsFromAPI();
    if (!detailedSettings) {
      detailedSettings = this.loadDetailedSettings();
    }

    const cycleData = await this.getCurrentCycleData();

    if (!detailedSettings) {
      info.push("通知設定が見つかりません");
      return info;
    }

    info.push("📋 定期チェックシステムで管理される通知:");

    // 生理・排卵期通知は生理データが必要
    if (cycleData?.startDate) {
      const startDate = new Date(cycleData.startDate);
      const cycleLength = 28;
      const nextPeriodDate = new Date(startDate);
      nextPeriodDate.setDate(nextPeriodDate.getDate() + cycleLength);

      // 生理リマインド情報
      if (detailedSettings.menstrualReminder?.enabled) {
        const daysBefore = detailedSettings.menstrualReminder.daysBeforeStart || 1;
        const time = detailedSettings.menstrualReminder.time || "09:00";

        const notificationDate = new Date(nextPeriodDate);
        notificationDate.setDate(notificationDate.getDate() - daysBefore);
        const [hours, minutes] = time.split(':').map(Number);
        notificationDate.setHours(hours, minutes, 0, 0);

        info.push(`🩸 生理リマインド: ${notificationDate.toLocaleString('ja-JP')} (${daysBefore}日前, ${time})`);
      } else {
        info.push("🩸 生理リマインド: 無効");
      }

      // 排卵期通知情報
      if (detailedSettings.ovulationReminder?.enabled) {
        const time = detailedSettings.ovulationReminder.time || "09:00";

        const ovulationDate = new Date(nextPeriodDate);
        ovulationDate.setDate(ovulationDate.getDate() - 14);

        const fertilityStartDate = new Date(ovulationDate);
        fertilityStartDate.setDate(fertilityStartDate.getDate() - 5);

        const [hours, minutes] = time.split(':').map(Number);

        const fertilityNotificationDate = new Date(fertilityStartDate);
        fertilityNotificationDate.setHours(hours, minutes, 0, 0);

        const ovulationNotificationDate = new Date(ovulationDate);
        ovulationNotificationDate.setHours(hours, minutes, 0, 0);

        info.push(`💕 排卵期開始: ${fertilityNotificationDate.toLocaleString('ja-JP')} (${time})`);
        info.push(`🥚 排卵日: ${ovulationNotificationDate.toLocaleString('ja-JP')} (${time})`);
      } else {
        info.push("💕🥚 排卵期通知: 無効");
      }
    } else {
      info.push("🩸 生理リマインド: 生理データが必要です");
      info.push("💕🥚 排卵期通知: 生理データが必要です");
    }

    // ピルリマインド情報
    if (detailedSettings.pillReminder?.enabled) {
      const pillName = detailedSettings.pillReminder.pillName || "ピル";
      const times = detailedSettings.pillReminder.times || ["08:00"];
      const reminderMinutes = detailedSettings.pillReminder.reminderMinutes || 0;
      const reminderText = reminderMinutes === 0 ? "ちょうど" : `${reminderMinutes}分前`;

      times.forEach((time) => {
        const now = new Date();
        const [hours, minutes] = time.split(':').map(Number);
        const notificationTime = new Date(now);
        notificationTime.setHours(hours, minutes - reminderMinutes, 0, 0);

        // If today's time has passed, show tomorrow's time
        if (notificationTime <= now) {
          notificationTime.setDate(notificationTime.getDate() + 1);
        }

        info.push(`💊 ${pillName}リマインド: 毎日 ${time} (${reminderText})`);
        info.push(`   次回: ${notificationTime.toLocaleString('ja-JP')}`);
      });
    } else {
      info.push("💊 ピルリマインド: 無効");
    }

    info.push("");
    info.push("⏰ システム状態:");
    info.push(`   定期チェック: ${this.checkInterval ? '動作中' : '停止中'}`);
    info.push(`   最終チェック日: ${this.lastCheckDate || '未実行'}`);
    info.push(`   今日送信済み通知数: ${this.scheduledNotifications.size}`);

    return info;
  }

  // テスト用: 現在の設定で即座にテスト通知を送信
  public async testScheduledNotifications(): Promise<void> {
    // MySQLから設定を優先的に読み込み
    let detailedSettings = await this.loadDetailedSettingsFromAPI();
    if (!detailedSettings) {
      detailedSettings = this.loadDetailedSettings();
    }
    if (!detailedSettings) return;

    if (detailedSettings.menstrualReminder?.enabled) {
      const daysBefore = detailedSettings.menstrualReminder.daysBeforeStart || 1;
      notificationService.sendPeriodReminderNotification(daysBefore);
    }

    if (detailedSettings.ovulationReminder?.enabled) {
      notificationService.sendFertilityPeriodStartNotification();
      // 少し遅延させて2つ目の通知を送信
      setTimeout(() => {
        notificationService.sendOvulationDayNotification();
      }, 1000);
    }

    if (detailedSettings.pillReminder?.enabled) {
      const pillName = detailedSettings.pillReminder.pillName || "ピル";
      const reminderMinutes = detailedSettings.pillReminder.reminderMinutes || 0;
      notificationService.sendMedicationReminder(pillName, reminderMinutes);
    }
  }
}

export const notificationManager = NotificationManager.getInstance();