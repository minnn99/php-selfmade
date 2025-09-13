import { notificationService } from './notificationService';

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

class NotificationManager {
  private static instance: NotificationManager;
  private settings: UserSettings;
  private scheduledNotifications: Set<string> = new Set();

  private constructor() {
    this.settings = this.loadSettings();
    this.initializeEventListeners();
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
  }

  private async handleMenstrualDataUpdate(): Promise<void> {
    if (!notificationService.hasPermission()) {
      return;
    }

    try {
      // Get current cycle data to determine what notifications to schedule
      const cycleData = await this.getCurrentCycleData();
      
      if (cycleData) {
        await this.scheduleUpcomingNotifications(cycleData);
        
        // Send immediate notifications if appropriate
        if (cycleData.isPeriodStart && this.settings.partnerNotifications) {
          this.sendPartnerNotification('menstrualStart');
        }
      }
    } catch (error) {
      console.error('Error handling menstrual data update:', error);
    }
  }

  private handlePartnerUpdate(): void {
    // Handle partner-related notifications
    if (this.settings.partnerNotifications && notificationService.hasPermission()) {
      // This could be expanded based on specific partner events
      console.log('Partner status updated - notifications could be sent here');
    }
  }

  private async getCurrentCycleData(): Promise<CycleData | null> {
    try {
      // Get cycle data from localStorage
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

  private async scheduleUpcomingNotifications(cycleData: CycleData): Promise<void> {
    if (!cycleData.startDate) return;

    const detailedSettings = this.loadDetailedSettings();
    if (!detailedSettings) return;

    const startDate = new Date(cycleData.startDate);
    const cycleLength = 28; // Default cycle length, should be user-configurable
    const today = new Date();

    // Calculate next period date
    const nextPeriodDate = new Date(startDate);
    nextPeriodDate.setDate(nextPeriodDate.getDate() + cycleLength);

    // Schedule period reminders based on user settings
    if (this.settings.periodReminders && detailedSettings.menstrualReminder?.enabled) {
      const daysBefore = detailedSettings.menstrualReminder.daysBeforeStart || 1;
      const time = detailedSettings.menstrualReminder.time || "09:00";
      
      const notificationDate = new Date(nextPeriodDate);
      notificationDate.setDate(notificationDate.getDate() - daysBefore);
      
      const [hours, minutes] = time.split(':').map(Number);
      notificationDate.setHours(hours, minutes, 0, 0);

      const timeUntilNotification = notificationDate.getTime() - today.getTime();
      
      if (timeUntilNotification > 0 && timeUntilNotification <= 7 * 24 * 60 * 60 * 1000) { // 7日以内
        const notificationKey = `period-${notificationDate.toDateString()}-${time}`;
        if (!this.scheduledNotifications.has(notificationKey)) {
          setTimeout(() => {
            notificationService.sendPeriodReminderNotification(daysBefore);
          }, timeUntilNotification);
          
          this.scheduledNotifications.add(notificationKey);
          console.log(`生理リマインド scheduled for ${notificationDate.toLocaleString()} (${daysBefore}日前, ${time})`);
        }
      }
    }

    // Schedule fertility period and ovulation notifications based on user settings
    if (this.settings.ovulationReminders && detailedSettings.ovulationReminder?.enabled) {
      const time = detailedSettings.ovulationReminder.time || "09:00";
      
      // Calculate ovulation date (typically 14 days before next period)
      const ovulationDate = new Date(nextPeriodDate);
      ovulationDate.setDate(ovulationDate.getDate() - 14);
      
      // Calculate fertility period start (typically 5 days before ovulation)
      const fertilityStartDate = new Date(ovulationDate);
      fertilityStartDate.setDate(fertilityStartDate.getDate() - 5);
      
      const [hours, minutes] = time.split(':').map(Number);
      
      // Schedule fertility period start notification
      const fertilityNotificationDate = new Date(fertilityStartDate);
      fertilityNotificationDate.setHours(hours, minutes, 0, 0);
      
      const timeUntilFertilityNotification = fertilityNotificationDate.getTime() - today.getTime();
      
      if (timeUntilFertilityNotification > 0 && timeUntilFertilityNotification <= 7 * 24 * 60 * 60 * 1000) {
        const fertilityNotificationKey = `fertility-start-${fertilityNotificationDate.toDateString()}-${time}`;
        if (!this.scheduledNotifications.has(fertilityNotificationKey)) {
          setTimeout(() => {
            notificationService.sendFertilityPeriodStartNotification();
          }, timeUntilFertilityNotification);
          
          this.scheduledNotifications.add(fertilityNotificationKey);
          console.log(`排卵期開始 scheduled for ${fertilityNotificationDate.toLocaleString()}`);
        }
      }
      
      // Schedule ovulation day notification
      const ovulationNotificationDate = new Date(ovulationDate);
      ovulationNotificationDate.setHours(hours, minutes, 0, 0);
      
      const timeUntilOvulationNotification = ovulationNotificationDate.getTime() - today.getTime();
      
      if (timeUntilOvulationNotification > 0 && timeUntilOvulationNotification <= 7 * 24 * 60 * 60 * 1000) {
        const ovulationNotificationKey = `ovulation-day-${ovulationNotificationDate.toDateString()}-${time}`;
        if (!this.scheduledNotifications.has(ovulationNotificationKey)) {
          setTimeout(() => {
            notificationService.sendOvulationDayNotification();
          }, timeUntilOvulationNotification);
          
          this.scheduledNotifications.add(ovulationNotificationKey);
          console.log(`排卵日 scheduled for ${ovulationNotificationDate.toLocaleString()}`);
        }
      }
    }

    // Schedule pill reminders based on user settings
    if (this.settings.pillReminders && detailedSettings.pillReminder?.enabled) {
      const pillName = detailedSettings.pillReminder.pillName || "ピル";
      const times = detailedSettings.pillReminder.times || ["08:00"];
      const reminderMinutes = detailedSettings.pillReminder.reminderMinutes || 0;

      times.forEach((time) => {
        // Calculate notification time for today and tomorrow
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        [today, tomorrow].forEach(targetDate => {
          const [hours, minutes] = time.split(':').map(Number);
          const notificationDate = new Date(targetDate);
          notificationDate.setHours(hours, minutes - reminderMinutes, 0, 0);

          const timeUntilNotification = notificationDate.getTime() - Date.now();

          // Schedule if notification time is in the future and within next 48 hours
          if (timeUntilNotification > 0 && timeUntilNotification <= 48 * 60 * 60 * 1000) {
            const notificationKey = `pill-${pillName}-${notificationDate.toDateString()}-${time}`;
            if (!this.scheduledNotifications.has(notificationKey)) {
              setTimeout(() => {
                notificationService.sendMedicationReminder(pillName, reminderMinutes);
              }, timeUntilNotification);

              this.scheduledNotifications.add(notificationKey);
              console.log(`ピルリマインド scheduled for ${notificationDate.toLocaleString()} (${reminderMinutes}分前)`);
            }
          }
        });
      });
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
  }

  public clearScheduledNotifications(): void {
    this.scheduledNotifications.clear();
  }

  // テスト用: 設定に基づいてスケジュールされる通知を表示
  public async getScheduledNotificationsInfo(): Promise<string[]> {
    const info: string[] = [];
    const detailedSettings = this.loadDetailedSettings();
    const cycleData = await this.getCurrentCycleData();
    
    if (!detailedSettings || !cycleData?.startDate) {
      info.push("通知スケジュールを計算するためには生理データが必要です");
      return info;
    }

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

    // ピルリマインド情報
    if (detailedSettings.pillReminder?.enabled) {
      const pillName = detailedSettings.pillReminder.pillName || "ピル";
      const times = detailedSettings.pillReminder.times || ["08:00"];
      const reminderMinutes = detailedSettings.pillReminder.reminderMinutes || 0;
      const reminderText = reminderMinutes === 0 ? "ちょうど" : `${reminderMinutes}分前`;
      
      times.forEach((time) => {
        const today = new Date();
        const [hours, minutes] = time.split(':').map(Number);
        const notificationTime = new Date(today);
        notificationTime.setHours(hours, minutes - reminderMinutes, 0, 0);
        
        // If today's time has passed, show tomorrow's time
        if (notificationTime < today) {
          notificationTime.setDate(notificationTime.getDate() + 1);
        }
        
        info.push(`💊 ${pillName}リマインド: ${notificationTime.toLocaleString('ja-JP')} (${reminderText})`);
      });
    } else {
      info.push("💊 ピルリマインド: 無効");
    }

    return info;
  }

  // テスト用: 現在の設定で即座にテスト通知を送信
  public async testScheduledNotifications(): Promise<void> {
    const detailedSettings = this.loadDetailedSettings();
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