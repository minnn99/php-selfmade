import React, { useState, useEffect, useMemo } from "react";
import { DateRecordModal, type RecordData } from "./DateRecordModal";
import { menstrualCycleAPI, partnerAPI, authAPI, dailySymptomsAPI } from "../services/api";
import { menstrualStatusManager } from "../services/menstrualStatusManager";

interface CalendarDay {
  year: number;
  month: number; // 0-indexed (JS標準)
  date: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasPeriod: boolean;
  hasSymptoms: boolean;
  isOvulation: boolean;
  isPredictedPeriod: boolean;
  isPeriodStart: boolean;
  isPeriodEnd: boolean;
  isActive: boolean;
  hasPartnerPeriod?: boolean;
  hasPartnerSymptoms?: boolean;
  partnerName?: string;
}

export const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDateForModal, setSelectedDateForModal] = useState<Date | null>(null);
  const [calendarApiData, setCalendarApiData] = useState<any>({});
  const [partnerCalendarData, setPartnerCalendarData] = useState<any>({});
  const [loading, setLoading] = useState(false); // 日付クリック時のローディング専用
  const [existingDataForModal, setExistingDataForModal] = useState<RecordData | undefined>(undefined);
  const [refreshKey, setRefreshKey] = useState(0); // カレンダー強制再描画用
  const [userGender, setUserGender] = useState<string>("");
  const [isConnectedToPartner, setIsConnectedToPartner] = useState(false);

  const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

  const dayNames = ["日", "月", "火", "水", "木", "金", "土"];

  // 現在の月の年と月を取得
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Load calendar data when date changes
  useEffect(() => {
    const loadData = async () => {
      // まずユーザー情報を読み込み
      const userData = await authAPI.getUser();
      const gender = userData.data?.user?.gender || "";
      setUserGender(gender);
      console.log('Calendar: User gender set to:', gender);

      // パートナー状況を確認
      const partnerStatus = await partnerAPI.getStatus();
      const isConnected = partnerStatus.success && partnerStatus.data?.is_connected;
      setIsConnectedToPartner(isConnected);
      console.log('Calendar: Partner connection status:', { 
        success: partnerStatus.success, 
        is_connected: partnerStatus.data?.is_connected,
        isConnected 
      });

      // ユーザー情報取得後にカレンダーデータを読み込み
      await loadCalendarData(gender, isConnected);
      
      // MenstrualStatusManagerを初期化（認証後に実行）
      try {
        await menstrualStatusManager.loadStatus();
        // Auto-update period status after loading
        const { autoUpdatePeriodStatusForActiveCycle } = await import('../utils/periodStatusHelper');
        autoUpdatePeriodStatusForActiveCycle();
      } catch (error) {
        console.error('Failed to initialize menstrual status manager:', error);
      }
      
      // 初回読み込み時にローカルストレージデータを移行
      await migrateLocalStorageData();
      
      cleanupOldLocalStorageData();
    };
    
    loadData();
  }, [currentYear, currentMonth]);

  // Listen for menstrual data updates with debounce
  useEffect(() => {
    let timeoutId: number;
    
    const handleDataUpdate = () => {
      console.log('Calendar - Menstrual data updated, debouncing reload...');
      
      // Clear existing timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Set new timeout
      timeoutId = setTimeout(() => {
        loadCalendarData(); // 既存の状態を使用
        setRefreshKey(prev => prev + 1); // カレンダーを強制再描画
      }, 400); // 400ms debounce for Calendar
    };

    window.addEventListener('menstrualDataUpdated', handleDataUpdate);
    
    return () => {
      window.removeEventListener('menstrualDataUpdated', handleDataUpdate);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  // 古いローカルストレージデータをクリーンアップする関数
  // ローカルストレージデータをAPIに移行する関数
  const migrateLocalStorageData = async () => {
    const migrationKey = 'symptoms-data-migrated';
    
    // 既に移行済みの場合はスキップ
    if (localStorage.getItem(migrationKey) === 'true') {
      console.log('Symptoms data already migrated, skipping...');
      return;
    }
    
    try {
      const symptomsData = [];
      
      // ローカルストレージから症状データを収集
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('daily-symptoms-')) {
          try {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            const dateMatch = key.match(/daily-symptoms-(\d{4}-\d{2}-\d{2})/);
            
            if (dateMatch && dateMatch[1]) {
              const date = dateMatch[1];
              const hasSymptoms = data.symptoms && data.symptoms.length > 0;
              const hasMood = data.mood && data.mood.trim() !== '';
              const hasHealthNotes = data.healthNotes && data.healthNotes.trim() !== '';
              const hasFlowIntensity = data.flowIntensity !== undefined && data.flowIntensity !== null && data.flowIntensity > 0;
              
              // 有効なデータがある場合のみ移行対象に追加
              if (hasSymptoms || hasMood || hasHealthNotes || hasFlowIntensity) {
                symptomsData.push({
                  date: date,
                  symptoms: data.symptoms || [],
                  mood: data.mood || '',
                  healthNotes: data.healthNotes || '',
                  flowIntensity: data.flowIntensity || null
                });
              }
            }
          } catch (error) {
            console.error('Error parsing local storage data for key:', key, error);
          }
        }
      }
      
      if (symptomsData.length > 0) {
        console.log(`Migrating ${symptomsData.length} symptoms records from localStorage to API...`);
        const response = await dailySymptomsAPI.bulkSaveSymptoms(symptomsData);
        
        if (response.success) {
          console.log('Migration successful:', response.data);
          localStorage.setItem(migrationKey, 'true');
        } else {
          console.error('Migration failed:', response);
        }
      } else {
        console.log('No symptoms data found in localStorage to migrate');
        localStorage.setItem(migrationKey, 'true');
      }
    } catch (error) {
      console.error('Error during symptoms data migration:', error);
    }
  };

  const cleanupOldLocalStorageData = () => {
    // 一回だけ実行する7月データの完全クリーンアップ
    const hasCleanedJuly = localStorage.getItem('july-data-cleanup-completed');
    if (hasCleanedJuly) return;

    // 全ての7月のデータを強制削除（古いバージョンで保存された可能性のあるデータ）
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('daily-symptoms-2025-07-')) {
        keys.push(key);
      }
    }
    
    if (keys.length > 0) {
      keys.forEach(key => {
        localStorage.removeItem(key);
      });
      console.log(`Cleaned up ${keys.length} old July data entries`);
    }
    
    localStorage.setItem('july-data-cleanup-completed', 'true');
  };

  // ユーザー情報とパートナー状況を読み込み
  const loadUserInfo = async () => {
    try {
      const userData = await authAPI.getUser();
      const gender = userData.data?.user?.gender || "";
      setUserGender(gender);
      console.log('Calendar: User gender set to:', gender);

      // パートナー状況を確認
      const partnerStatus = await partnerAPI.getStatus();
      const isConnected = partnerStatus.success && partnerStatus.data?.is_connected;
      setIsConnectedToPartner(isConnected);
      console.log('Calendar: Partner connection status:', { 
        success: partnerStatus.success, 
        is_connected: partnerStatus.data?.is_connected,
        isConnected 
      });
    } catch (error) {
      console.error("Failed to load user info:", error);
    }
  };

  const loadCalendarData = async (gender?: string, isConnected?: boolean) => {
    // パラメータが指定されていない場合は現在の状態を使用
    const currentGender = gender ?? userGender;
    const currentConnected = isConnected ?? isConnectedToPartner;
    // 月切り替え時はローディング状態を設定しない（スムーズな切り替えのため）
    try {
      const data = await menstrualCycleAPI.getCalendarData(currentYear, currentMonth + 1);
      const rawData = data.data || {};

      // 古いデータをフィルタリング（30日以上前のデータは無視）
      const currentDate = new Date();
      const thirtyDaysAgo = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      const filteredData: any = {};

      Object.keys(rawData).forEach((dateKey) => {
        const keyDate = new Date(dateKey);
        if (keyDate >= thirtyDaysAgo || keyDate.getMonth() === currentMonth) {
          // 30日以内、または表示中の月のデータのみ保持
          filteredData[dateKey] = rawData[dateKey];
        } else {
          // console.log(`Filtering out old data for ${dateKey}`);
        }
      });

      setCalendarApiData(filteredData);

      // 男性ユーザーで、パートナーと連動している場合、パートナーのカレンダーデータも読み込み
      console.log('Calendar: Loading partner data check', {
        currentConnected,
        currentGender,
        isMale: currentGender === "male" || currentGender === "男性"
      });
      
      if (currentConnected && (currentGender === "male" || currentGender === "男性")) {
        try {
          console.log('Calendar: Fetching partner calendar data for', currentYear, currentMonth + 1);
          const partnerData = await partnerAPI.getPartnerCalendar(currentYear, currentMonth + 1);
          console.log('Calendar: Partner data response:', partnerData);
          
          if (partnerData.success && partnerData.data?.calendar_data) {
            const partnerCalendarMap: any = {};
            partnerData.data.calendar_data.forEach((dayData: any) => {
              partnerCalendarMap[dayData.date] = dayData;
            });
            setPartnerCalendarData(partnerCalendarMap);
            console.log('Calendar: Partner calendar map set:', partnerCalendarMap);
          } else {
            console.log('Calendar: No partner calendar data found');
            setPartnerCalendarData({});
          }
        } catch (error) {
          console.error("Failed to load partner calendar data:", error);
          setPartnerCalendarData({});
        }
      } else {
        console.log('Calendar: Not loading partner data - not male or not connected');
        setPartnerCalendarData({});
      }
    } catch (error) {
      console.error("Failed to load calendar data:", error);
      setCalendarApiData({});
      setPartnerCalendarData({});
    }
  };

  // Helper function to check if a date has user input data stored locally
  const hasUserInputForDate = (dateKey: string): boolean => {
    const storedData = localStorage.getItem(`daily-symptoms-${dateKey}`);
    if (!storedData) return false;

    try {
      const data = JSON.parse(storedData);
      // Check if any meaningful data exists (not just empty/default values)
      const hasSymptoms = data.symptoms && Array.isArray(data.symptoms) && data.symptoms.length > 0;
      const hasMood = data.mood && typeof data.mood === 'string' && data.mood.trim() !== "";
      const hasHealthNotes = data.healthNotes && typeof data.healthNotes === 'string' && data.healthNotes.trim() !== "";
      const hasFlowIntensity = data.flowIntensity !== undefined && data.flowIntensity !== null && typeof data.flowIntensity === 'number' && data.flowIntensity > 0;
      const hasPeriodInfo = data.isPeriodStart === true || data.isPeriodEnd === true || data.hasPeriod === true;

      // 黄色の点は症状・気分・健康ノート・経血量のみで判定（生理フラグは除外）
      const result = hasSymptoms || hasMood || hasHealthNotes || hasFlowIntensity;
      
      // 特定の日付についてのみデバッグログ（より詳細に）
      if (dateKey.endsWith('-22') || result) {
        console.log(`hasUserInputForDate(${dateKey}):`, {
          result, 
          hasSymptoms, 
          hasMood, 
          hasHealthNotes, 
          hasFlowIntensity, 
          hasPeriodInfo,
          'data.symptoms': data.symptoms,
          'data.mood': data.mood,
          'data.healthNotes': data.healthNotes,
          'data.flowIntensity': data.flowIntensity,
          'data.isPeriodStart': data.isPeriodStart,
          'data.isPeriodEnd': data.isPeriodEnd,
          'data.hasPeriod': data.hasPeriod,
          storedData, 
          parsedData: data
        });
      }

      return result;
    } catch {
      return false;
    }
  };

  const generateCalendarDays = (): CalendarDay[] => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const firstDayWeekday = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const days: CalendarDay[] = [];
    const today = new Date();

    // 前月の情報
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const prevMonthLastDay = new Date(prevMonthYear, prevMonth + 1, 0);
    const prevMonthLastDate = prevMonthLastDay.getDate();

    // 前月分
    for (let i = 0; i < firstDayWeekday; i++) {
      const date = prevMonthLastDate - firstDayWeekday + 1 + i;
      const dateKey = `${prevMonthYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
      const dayData = calendarApiData[dateKey];
      const partnerData = partnerCalendarData[dateKey];
      days.push({
        year: prevMonthYear,
        month: prevMonth,
        date,
        isCurrentMonth: false,
        isToday: false,
        hasPeriod: dayData?.hasPeriod || false,
        hasSymptoms: hasUserInputForDate(dateKey),
        isOvulation: dayData?.isOvulation || false,
        isPredictedPeriod: dayData?.isPredictedPeriod || false,
        isPeriodStart: dayData?.isPeriodStart || false,
        isPeriodEnd: dayData?.isPeriodEnd || false,
        isActive: dayData?.isActive || false,
        hasPartnerPeriod: partnerData?.status === 'period' || false,
        hasPartnerSymptoms: partnerData?.partner_daily_data ? (
          (partnerData.partner_daily_data.symptoms && partnerData.partner_daily_data.symptoms.length > 0) ||
          (partnerData.partner_daily_data.mood && partnerData.partner_daily_data.mood.trim() !== '') ||
          (partnerData.partner_daily_data.health_notes && partnerData.partner_daily_data.health_notes.trim() !== '')
        ) : false,
        partnerName: partnerData?.partner_name,
      });
    }

    // 今月分
    for (let date = 1; date <= daysInMonth; date++) {
      const isToday = today.getFullYear() === currentYear && today.getMonth() === currentMonth && today.getDate() === date;
      const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
      const dayData = calendarApiData[dateKey];
      const partnerData = partnerCalendarData[dateKey];
      days.push({
        year: currentYear,
        month: currentMonth,
        date,
        isCurrentMonth: true,
        isToday,
        hasPeriod: dayData?.hasPeriod || false,
        hasSymptoms: hasUserInputForDate(dateKey),
        isOvulation: dayData?.isOvulation || false,
        isPredictedPeriod: dayData?.isPredictedPeriod || false,
        isPeriodStart: dayData?.isPeriodStart || false,
        isPeriodEnd: dayData?.isPeriodEnd || false,
        isActive: dayData?.isActive || false,
        hasPartnerPeriod: partnerData?.status === 'period' || false,
        hasPartnerSymptoms: partnerData?.partner_daily_data ? (
          (partnerData.partner_daily_data.symptoms && partnerData.partner_daily_data.symptoms.length > 0) ||
          (partnerData.partner_daily_data.mood && partnerData.partner_daily_data.mood.trim() !== '') ||
          (partnerData.partner_daily_data.health_notes && partnerData.partner_daily_data.health_notes.trim() !== '')
        ) : false,
        partnerName: partnerData?.partner_name,
      });
    }

    // 次月分
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    let nextMonthDate = 1;
    while (days.length < 42) {
      const dateKey = `${nextMonthYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(nextMonthDate).padStart(2, "0")}`;
      const dayData = calendarApiData[dateKey];
      const partnerData = partnerCalendarData[dateKey];
      days.push({
        year: nextMonthYear,
        month: nextMonth,
        date: nextMonthDate,
        isCurrentMonth: false,
        isToday: false,
        hasPeriod: dayData?.hasPeriod || false,
        hasSymptoms: hasUserInputForDate(dateKey),
        isOvulation: dayData?.isOvulation || false,
        isPredictedPeriod: dayData?.isPredictedPeriod || false,
        isPeriodStart: dayData?.isPeriodStart || false,
        isPeriodEnd: dayData?.isPeriodEnd || false,
        isActive: dayData?.isActive || false,
        hasPartnerPeriod: partnerData?.status === 'period' || false,
        hasPartnerSymptoms: partnerData?.partner_daily_data ? (
          (partnerData.partner_daily_data.symptoms && partnerData.partner_daily_data.symptoms.length > 0) ||
          (partnerData.partner_daily_data.mood && partnerData.partner_daily_data.mood.trim() !== '') ||
          (partnerData.partner_daily_data.health_notes && partnerData.partner_daily_data.health_notes.trim() !== '')
        ) : false,
        partnerName: partnerData?.partner_name,
      });
      nextMonthDate++;
    }

    return days;
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // ローカルタイムゾーンで日付文字列を取得
  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // 既存データ取得機能
  const getExistingDataForDate = async (date: Date): Promise<RecordData | undefined> => {
    const dateKey = getLocalDateString(date);
    const dayData = calendarApiData[dateKey];
    const partnerData = partnerCalendarData[dateKey];

    // ローカルストレージから症状・気分・メモ・経血量データを取得
    let localSymptoms: string[] = [];
    let localMood = "";
    let localHealthNotes = "";
    let localFlowIntensity: number | undefined = undefined;

    try {
      const localData = localStorage.getItem(`daily-symptoms-${dateKey}`);
      if (localData) {
        const parsed = JSON.parse(localData);
        localSymptoms = parsed.symptoms || [];
        localMood = parsed.mood || "";
        localHealthNotes = parsed.healthNotes || "";
        localFlowIntensity = parsed.flowIntensity;
      }
    } catch (error) {
      console.error("Failed to parse local symptoms data:", error);
    }

    // パートナーのデータがある場合は含める
    let partnerDailyData = undefined;
    if (partnerData?.partner_daily_data) {
      partnerDailyData = {
        symptoms: partnerData.partner_daily_data.symptoms || [],
        mood: partnerData.partner_daily_data.mood || '',
        healthNotes: partnerData.partner_daily_data.health_notes || '',
        flowIntensity: partnerData.partner_daily_data.flow_intensity,
        partnerName: partnerData.partner_name
      };
    }

    // 生理期間中またはアクティブな開始日で cycleId がある場合のみ API を呼び出す
    if (dayData && (dayData.hasPeriod || dayData.isPeriodStart || dayData.isActive) && dayData.cycleId) {
      try {
        const cycleResponse = await menstrualCycleAPI.getCycle(dayData.cycleId);
        const cycleData = cycleResponse.data;

        // cycleDataが存在することを確認
        if (cycleData) {
          // 選択した日付が開始日・終了日かを判定
          const selectedDateStr = getLocalDateString(date);
          const isStartDate = cycleData.start_date === selectedDateStr;
          const isEndDate = cycleData.end_date === selectedDateStr;

          return {
            isPeriodStart: isStartDate,
            isPeriodEnd: isEndDate,
            symptoms: localSymptoms, // ローカルデータを使用
            mood: localMood, // ローカルデータを使用
            healthNotes: localHealthNotes, // ローカルデータを使用
            flowIntensity: localFlowIntensity !== undefined ? localFlowIntensity : cycleData.flow_intensity,
            cycleId: cycleData.id,
            existingCycleData: cycleData,
            partnerData: partnerDailyData, // パートナーデータを追加
          };
        }
      } catch (error) {
        console.error("Failed to fetch cycle details:", error);
        // エラーの場合はローカルデータを使用
      }
    }

    // API呼び出しが不要な場合やエラーの場合
    return {
      isPeriodStart: dayData?.isPeriodStart || false,
      isPeriodEnd: dayData?.isPeriodEnd || false,
      symptoms: localSymptoms, // ローカルデータを使用
      mood: localMood, // ローカルデータを使用
      healthNotes: localHealthNotes, // ローカルデータを使用
      flowIntensity: localFlowIntensity !== undefined ? localFlowIntensity : dayData?.flowIntensity,
      cycleId: dayData?.cycleId,
      partnerData: partnerDailyData, // パートナーデータを追加
    };
  };

  // 日付がクリックされた時の処理
  const handleDateClick = async (day: CalendarDay) => {
    if (day.isCurrentMonth && !loading) {
      const clickedDate = new Date(day.year, day.month, day.date);
      setSelectedDateForModal(clickedDate);

      try {
        setLoading(true);
        // 既存の周期データを取得
        const existingData = await getExistingDataForDate(clickedDate);
        setExistingDataForModal(existingData);
        setIsModalOpen(true);
      } finally {
        setLoading(false);
      }
    }
  };

  // モーダルのデータ保存処理
  const handleModalSave = async (data: RecordData) => {
    if (!selectedDateForModal) return;

    try {
      const dateStr = getLocalDateString(selectedDateForModal);

      // データの存在チェック
      const hasSymptoms = data.symptoms.length > 0;
      const hasMood = data.mood && data.mood.trim() !== "";
      const hasHealthNotes = data.healthNotes && data.healthNotes.trim() !== "";
      const hasFlowIntensity = data.flowIntensity !== undefined && data.flowIntensity !== null && data.flowIntensity > 0;
      const hasPeriodInfo = data.isPeriodStart || data.isPeriodEnd;

      // 1. まず生理周期情報をAPIに保存（失敗したらローカル保存しない）
      if (hasPeriodInfo) {
        if (data.cycleId) {
          // 既存の周期IDがある場合：周期の更新
          const updateData: any = {};

          if (data.isPeriodStart) {
            updateData.start_date = dateStr;
          } else if (data.isPeriodEnd) {
            updateData.end_date = dateStr;
          }

          if (Object.keys(updateData).length > 0) {
            await menstrualCycleAPI.updateCycle(data.cycleId, updateData);
            console.log(`API SUCCESS: Updated cycle ${data.cycleId}:`, updateData);
          }
        } else {
          // 既存の周期IDがない場合
          if (data.isPeriodStart) {
            await menstrualCycleAPI.startCycle({
              start_date: dateStr,
            });
            console.log(`API SUCCESS: Started new cycle on ${dateStr}`);
          } else if (data.isPeriodEnd) {
            // 終了日を設定する場合、既存のアクティブな周期を探す
            await loadCalendarData(); // 既存の状態を使用 // 既存の状態を使用
            
            console.log(`Searching for active cycle to end on ${dateStr}`);
            console.log('Current calendar data:', calendarApiData);
            
            let foundCycleId = null;
            let foundStartDate = '';
            
            // アクティブな周期（isActive: trueまたは終了日が未設定）を探す
            for (const [dateKey, dayData] of Object.entries(calendarApiData)) {
              const apiData = dayData as any;
              console.log(`Checking date ${dateKey}:`, apiData);
              
              if (apiData.cycleId && apiData.isPeriodStart === true && dateKey <= dateStr) {
                // この開始日に対応する終了日があるかチェック
                const hasEndDate = Object.values(calendarApiData).some(
                  (d: any) => d.cycleId === apiData.cycleId && d.isPeriodEnd === true
                );
                
                if (!hasEndDate || apiData.isActive === true) {
                  foundCycleId = apiData.cycleId;
                  foundStartDate = dateKey;
                  console.log(`Found active cycle: ID=${foundCycleId}, start=${foundStartDate}`);
                  break;
                }
              }
            }
            
            if (foundCycleId) {
              await menstrualCycleAPI.updateCycle(foundCycleId, { end_date: dateStr });
              console.log(`API SUCCESS: Updated cycle ${foundCycleId} with end date ${dateStr}`);
            } else {
              throw new Error('終了する生理周期が見つかりません。先に生理開始日を設定してください。');
            }
          }
        }
      }

      // 2. 症状データをAPIに保存
      if (hasSymptoms || hasMood || hasHealthNotes || hasFlowIntensity) {
        try {
          await dailySymptomsAPI.saveSymptoms({
            date: dateStr,
            symptoms: data.symptoms,
            mood: data.mood,
            healthNotes: data.healthNotes,
            flowIntensity: data.flowIntensity,
          });
          console.log(`API SUCCESS: Saved symptoms data for ${dateStr}`);
        } catch (error) {
          console.error(`API ERROR: Failed to save symptoms data for ${dateStr}:`, error);
          // 症状データのAPI保存が失敗してもローカルストレージには保存する
        }
      }

      // 3. ローカルストレージにも保存（バックアップとして）
      const dailyRecord = {
        date: dateStr,
        symptoms: data.symptoms,
        mood: data.mood,
        healthNotes: data.healthNotes,
        flowIntensity: data.flowIntensity,
        isPeriodStart: data.isPeriodStart,
        isPeriodEnd: data.isPeriodEnd,
        hasPeriod: data.isPeriodStart || data.isPeriodEnd || false,
        timestamp: new Date().toISOString(),
      };

      if (hasSymptoms || hasMood || hasHealthNotes || hasFlowIntensity || hasPeriodInfo) {
        localStorage.setItem(`daily-symptoms-${dateStr}`, JSON.stringify(dailyRecord));
        console.log(`LOCAL SAVE: Saved data for ${dateStr}:`, dailyRecord);
      } else {
        localStorage.removeItem(`daily-symptoms-${dateStr}`);
        console.log(`LOCAL REMOVE: Removed data for ${dateStr}`);
      }

      await loadCalendarData(); // 既存の状態を使用
      // カレンダーを強制的に再描画
      setRefreshKey((prev) => prev + 1);
      console.log(`Calendar refresh triggered for ${dateStr}, refreshKey: ${refreshKey + 1}`);
      alert("記録が保存されました！");
    } catch (error: any) {
      console.error("Failed to save record:", error);
      let errorMessage = "記録の保存に失敗しました。";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      alert(errorMessage);
    }
  };

  // ローカルストレージから生理データを削除する関数（完全削除版）
  const clearPeriodDataFromLocalStorage = (cycleId: number) => {
    console.log(`Clearing period data for cycle ID: ${cycleId}`);
    
    // まず calendarApiData から該当するサイクルの全ての日付を特定
    const cycleDates = [];
    for (const dateKey of Object.keys(calendarApiData)) {
      const dayData = calendarApiData[dateKey] as any;
      if (dayData.cycleId === cycleId) {
        cycleDates.push(dateKey);
      }
    }
    
    console.log(`Found ${cycleDates.length} dates for cycle ${cycleId}:`, cycleDates);
    
    // 該当する日付のローカルストレージを完全削除
    cycleDates.forEach(dateString => {
      const localStorageKey = `daily-symptoms-${dateString}`;
      const existingData = localStorage.getItem(localStorageKey);
      
      if (existingData) {
        console.log(`Removing localStorage data for ${dateString}`);
        localStorage.removeItem(localStorageKey);
      }
    });
    
    // さらに、現在の月の全ての日付で生理関連データをクリア（追加の安全策）
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // 今月の全ての日をチェック
    for (let day = 1; day <= 31; day++) {
      const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const localStorageKey = `daily-symptoms-${dateString}`;
      const existingData = localStorage.getItem(localStorageKey);
      
      if (existingData) {
        try {
          const data = JSON.parse(existingData);
          // 生理関連のフラグがある場合はクリア
          if (data.hasPeriod || data.isPeriodStart || data.isPeriodEnd) {
            console.log(`Clearing period flags from ${dateString}`);
            
            const updatedData = {
              ...data,
              isPeriodStart: false,
              isPeriodEnd: false,
              hasPeriod: false,
              flowIntensity: undefined
            };
            
            // 他に意味のあるデータがない場合は完全に削除
            const hasOtherData = 
              (updatedData.symptoms && updatedData.symptoms.length > 0) ||
              (updatedData.mood && updatedData.mood.trim() !== "") ||
              (updatedData.healthNotes && updatedData.healthNotes.trim() !== "");
              
            if (hasOtherData) {
              localStorage.setItem(localStorageKey, JSON.stringify(updatedData));
            } else {
              localStorage.removeItem(localStorageKey);
            }
          }
        } catch (e) {
          console.error(`Error processing localStorage data for ${dateString}:`, e);
        }
      }
    }
  };

  // 削除処理（改良版）
  const handleDelete = async (cycleId: number) => {
    try {
      console.log(`Starting deletion process for cycle ${cycleId}`);
      
      // ローカルストレージを先に削除（API削除前に実行）
      clearPeriodDataFromLocalStorage(cycleId);
      
      // API からサイクルを削除
      await menstrualCycleAPI.deleteCycle(cycleId);
      console.log(`Successfully deleted cycle ${cycleId} from API`);
      
      // カレンダーデータを再読み込み
      await loadCalendarData(); // 既存の状態を使用
      
      // カレンダーを強制再描画
      setRefreshKey(prev => prev + 1);
      
      // カスタムイベントを発火してアプリ全体を更新
      window.dispatchEvent(new CustomEvent('menstrualDataUpdated'));
      
      alert("生理周期が削除されました");
    } catch (error: any) {
      console.error("Failed to delete cycle:", error);
      alert("削除に失敗しました");
    }
  };

  // モーダルを閉じる処理
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedDateForModal(null);
    setExistingDataForModal(undefined);
  };

  const calendarDays = useMemo(() => generateCalendarDays(), [currentYear, currentMonth, calendarApiData, partnerCalendarData, refreshKey]);

  // 日付セルのスタイルを決定
  const getDayStyle = (day: CalendarDay) => {
    let baseStyle = "h-10 sm:h-12 w-full flex items-center justify-center text-sm font-medium cursor-pointer transition-colors relative touch-manipulation ";

    if (!day.isCurrentMonth) {
      baseStyle += "text-gray-300 ";
    } else if (day.isToday && (day.hasPeriod || day.isPeriodStart)) {
      // 今日かつ生理関連の場合
      baseStyle += "bg-red-600 text-white rounded-lg ";
    } else if (day.isToday) {
      // 今日のみの場合
      baseStyle += "bg-primary-600 text-white rounded-lg ";
    } else if (day.hasPeriod || day.isPeriodStart || day.isPeriodEnd) {
      // 生理期間中・開始日・終了日の場合（既存の赤いスタイル）
      baseStyle += "bg-red-500 text-white rounded-lg ";
    } else if (day.hasPartnerPeriod) {
      // パートナーの生理期間の場合（ピンク色で表示）
      baseStyle += "bg-pink-300 text-white rounded-lg ";
    } else if (day.isPredictedPeriod) {
      // 予測生理日の場合
      baseStyle += "bg-red-100 text-red-700 border border-red-300 rounded-lg ";
    } else if (day.isOvulation) {
      // 排卵日の場合
      baseStyle += "bg-pink-500 text-white rounded-lg ";
    } else {
      // 通常の日付
      baseStyle += "text-gray-700 hover:bg-gray-100 active:bg-gray-200 rounded-lg ";
    }

    return baseStyle;
  };

  // 日付セルの装飾を決定
  const getDayDecorations = (day: CalendarDay) => {
    const decorations = [];

    // 生理日は背景色で表示するため、ドットは不要
    // 予測生理日の場合のみドット表示
    if (day.isPredictedPeriod && !day.hasPeriod) {
      decorations.push(
        <div key="predicted" className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 border-2 border-red-400 rounded-full bg-white"></div>
      );
    }

    // 排卵日も背景色で表示するため、生理日と重複しない場合のみ
    if (day.isOvulation && !day.hasPeriod) {
      decorations.push(<div key="ovulation" className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-pink-500 rounded-full"></div>);
    }

    // 症状がある場合は小さなドットを表示
    if (day.hasSymptoms) {
      decorations.push(<div key="symptoms" className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-500 rounded-full"></div>);
    }

    // パートナーの症状がある場合は別色のドットを表示
    if (day.hasPartnerSymptoms && !day.hasSymptoms) {
      decorations.push(<div key="partner-symptoms" className="absolute top-1 right-1 w-1.5 h-1.5 bg-purple-500 rounded-full"></div>);
    } else if (day.hasPartnerSymptoms && day.hasSymptoms) {
      // 自分とパートナー両方の症状がある場合は2つのドットを表示
      decorations.push(<div key="partner-symptoms" className="absolute top-1 left-1 w-1.5 h-1.5 bg-purple-500 rounded-full"></div>);
    }

    return decorations;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-medical p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-neutral-900">カレンダー</h2>
          <p className="text-sm text-neutral-600">生理周期と症状を確認</p>
        </div>
        <div className="flex items-center justify-center sm:space-x-3">
          <div className="flex items-center space-x-1">
            <button onClick={goToPreviousMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="px-3 py-2 sm:px-4 text-base sm:text-lg font-semibold text-gray-900 min-w-[100px] sm:min-w-[120px] text-center">
              {currentYear}年{monthNames[currentMonth]}
            </div>
            <button onClick={goToNextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {/* Day Headers */}
        {dayNames.map((dayName, index) => (
          <div
            key={dayName}
            className={`h-8 sm:h-10 flex items-center justify-center text-xs sm:text-sm font-medium ${
              index === 0 ? "text-red-600" : index === 6 ? "text-blue-600" : "text-gray-600"
            }`}
          >
            {dayName}
          </div>
        ))}

        {/* Calendar Days */}
        {calendarDays.map((day, index) => (
          <div key={index} className={getDayStyle(day)} onClick={() => handleDateClick(day)}>
            {day.date}
            {getDayDecorations(day)}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">凡例</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0"></div>
            <span className="text-gray-600">生理日</span>
          </div>
          {isConnectedToPartner && (userGender === "male" || userGender === "男性") && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-pink-300 rounded-full flex-shrink-0"></div>
              <span className="text-gray-600">パートナーの生理日</span>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 border-2 border-red-400 rounded-full flex-shrink-0"></div>
            <span className="text-gray-600">予測生理日</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-pink-500 rounded-full flex-shrink-0"></div>
            <span className="text-gray-600">排卵日</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-amber-500 rounded-full flex-shrink-0"></div>
            <span className="text-gray-600">症状記録</span>
          </div>
          {isConnectedToPartner && (userGender === "male" || userGender === "男性") && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full flex-shrink-0"></div>
              <span className="text-gray-600">パートナーの症状</span>
            </div>
          )}
        </div>
      </div>

      {/* DateRecordModal */}
      {selectedDateForModal && (
        <DateRecordModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          selectedDate={selectedDateForModal}
          onSave={handleModalSave}
          onDelete={handleDelete}
          existingData={existingDataForModal}
          isInPeriod={calendarApiData[getLocalDateString(selectedDateForModal)]?.hasPeriod || false}
        />
      )}
    </div>
  );
};
