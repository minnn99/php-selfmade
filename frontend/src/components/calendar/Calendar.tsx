import React, { useState, useEffect, useMemo } from "react";
import { DateRecordModal, type RecordData } from "./DateRecordModal";
import { menstrualCycleAPI, partnerAPI, authAPI, dailySymptomsAPI } from "../../services/api";
import { menstrualStatusManager } from "../../services/menstrualStatusManager";
import { getDatePeriodStatus } from "../../utils/periodStatusHelper";

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
  isFertile: boolean;
  hasPartnerPeriod?: boolean;
  hasPartnerSymptoms?: boolean;
  partnerName?: string;
}

interface CalendarDayData {
  hasPeriod?: boolean;
  isOvulation?: boolean;
  isPredictedPeriod?: boolean;
  isPeriodStart?: boolean;
  isPeriodEnd?: boolean;
  isActive?: boolean;
  isFertile?: boolean;
  cycleId?: number;
  flowIntensity?: number;
  partner_name?: string;
  symptoms?: string[];
  partner_daily_data?: {
    symptoms?: string[];
    mood?: string;
    health_notes?: string;
    flow_intensity?: number;
  };
}

interface SymptomsData {
  symptoms: string[];
  mood: string;
  healthNotes: string;
  flowIntensity?: number;
}

export const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDateForModal, setSelectedDateForModal] = useState<Date | null>(null);
  const [calendarApiData, setCalendarApiData] = useState<Record<string, CalendarDayData>>({});
  const [partnerCalendarData, setPartnerCalendarData] = useState<Record<string, CalendarDayData>>({});
  const [symptomsData, setSymptomsData] = useState<Record<string, SymptomsData>>({});
  const [loading, setLoading] = useState(false); // 日付クリック時のローディング専用
  const [existingDataForModal, setExistingDataForModal] = useState<RecordData | undefined>(undefined);
  const [refreshKey, setRefreshKey] = useState(0); // カレンダー強制再描画用
  const [userGender, setUserGender] = useState<string>("");
  const [isConnectedToPartner, setIsConnectedToPartner] = useState(false);
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false); // 初回ロード完了フラグ
  const [loadedMonthsRange, setLoadedMonthsRange] = useState<{start: Date; end: Date} | null>(null); // ロード済み月範囲

  const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

  const dayNames = ["日", "月", "火", "水", "木", "金", "土"];

  // 現在の月の年と月を取得
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // 前後何ヶ月分のデータをプリロードするか
  const MONTHS_TO_PRELOAD = 3;

  // 初回ロード時に複数月のデータを一括取得
  useEffect(() => {
    const loadInitialData = async () => {
      // まずユーザー情報を読み込み
      const userData = await authAPI.getUser();
      const gender = (userData.data as { user?: { gender?: string } })?.user?.gender || "";
      setUserGender(gender);
      // パートナー状況を確認
      const partnerStatus = await partnerAPI.getStatus();
      const isConnected = partnerStatus.success && (partnerStatus.data as { is_connected?: boolean })?.is_connected;
      setIsConnectedToPartner(!!isConnected);

      // 初回のみ複数月のデータを一括ロード
      if (!isInitialLoadComplete) {
        await loadMultipleMonthsData(gender, isConnected);
        setIsInitialLoadComplete(true);
      }

      // MenstrualStatusManagerを初期化（認証後に実行）
      try {
        await menstrualStatusManager.loadStatus();
        // Auto-update period status after loading
        const { autoUpdatePeriodStatusForActiveCycle } = await import("../../utils/periodStatusHelper");
        autoUpdatePeriodStatusForActiveCycle();
      } catch {
        // Silent error handling - menstrual status manager initialization failed
      }

      // 初回読み込み時にローカルストレージデータを移行
      await migrateLocalStorageData();

      cleanupOldLocalStorageData();
    };

    if (!isInitialLoadComplete) {
      loadInitialData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 月が変更された時、必要に応じて追加データをロード
  useEffect(() => {
    const checkAndLoadAdditionalData = async () => {
      if (!isInitialLoadComplete || !loadedMonthsRange) return;
      
      // 現在表示している月がロード済み範囲内かチェック
      const currentMonthDate = new Date(currentYear, currentMonth, 1);
      
      if (currentMonthDate < loadedMonthsRange.start || currentMonthDate > loadedMonthsRange.end) {
        // 範囲外の場合、追加でデータをロード
        const monthsToLoad = [];
        for (let i = -MONTHS_TO_PRELOAD; i <= MONTHS_TO_PRELOAD; i++) {
          const targetDate = new Date(currentYear, currentMonth + i, 1);
          monthsToLoad.push({
            year: targetDate.getFullYear(),
            month: targetDate.getMonth() + 1
          });
        }
        
        // 新しい範囲でデータを再ロード
        await loadMultipleMonthsData(userGender, isConnectedToPartner);
        
        // 新しいロード済み範囲を更新
        const newStartDate = new Date(currentYear, currentMonth - MONTHS_TO_PRELOAD, 1);
        const newEndDate = new Date(currentYear, currentMonth + MONTHS_TO_PRELOAD + 1, 0);
        setLoadedMonthsRange({ start: newStartDate, end: newEndDate });
      }
    };
    
    checkAndLoadAdditionalData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentYear, currentMonth]);

  // Listen for menstrual data updates with debounce (DISABLED FOR SYMPTOMS)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleDataUpdate = async () => {
      
      // Clear existing timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Reload calendar data to reflect changes
      timeoutId = setTimeout(async () => {
        // 初回ロードが完了している場合は、複数月分を再ロード
        if (isInitialLoadComplete) {
          await loadMultipleMonthsData(userGender, isConnectedToPartner);
        } else {
          await loadCalendarData(userGender, isConnectedToPartner);
        }
        setRefreshKey((prev) => prev + 1);
      }, 100);
    };

    window.addEventListener("menstrualDataUpdated", handleDataUpdate);

    return () => {
      window.removeEventListener("menstrualDataUpdated", handleDataUpdate);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 古いローカルストレージデータをクリーンアップする関数
  // ローカルストレージデータをAPIに移行する関数
  const migrateLocalStorageData = async () => {
    const migrationKey = "symptoms-data-migrated";

    // 既に移行済みの場合はスキップ
    if (localStorage.getItem(migrationKey) === "true") {
      return;
    }

    try {
      const symptomsData = [];

      // ローカルストレージから症状データを収集
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("daily-symptoms-")) {
          try {
            const data = JSON.parse(localStorage.getItem(key) || "{}");
            const dateMatch = key.match(/daily-symptoms-(\d{4}-\d{2}-\d{2})/);

            if (dateMatch && dateMatch[1]) {
              const date = dateMatch[1];
              const hasSymptoms = data.symptoms && data.symptoms.length > 0;
              const hasMood = data.mood && data.mood.trim() !== "";
              const hasHealthNotes = data.healthNotes && data.healthNotes.trim() !== "";
              const hasFlowIntensity = data.flowIntensity !== undefined && data.flowIntensity !== null && data.flowIntensity > 0;

              // 有効なデータがある場合のみ移行対象に追加
              if (hasSymptoms || hasMood || hasHealthNotes || hasFlowIntensity) {
                symptomsData.push({
                  date: date,
                  symptoms: data.symptoms || [],
                  mood: data.mood || "",
                  healthNotes: data.healthNotes || "",
                  flowIntensity: data.flowIntensity || null,
                });
              }
            }
          } catch {
            // Silent error handling - failed to parse local storage data for migration
          }
        }
      }

      if (symptomsData.length > 0) {
        const response = await dailySymptomsAPI.bulkSaveSymptoms(symptomsData);

        if (response.success) {
          localStorage.setItem(migrationKey, "true");
        } else {
          // Migration not successful - data will remain in localStorage
        }
      } else {
        localStorage.setItem(migrationKey, "true");
      }
    } catch {
      // Silent error handling - migration failed
    }
  };

  // 複数月のデータを一括で読み込む関数
  const loadMultipleMonthsData = async (gender?: string, isConnected?: boolean) => {
    const currentGender = gender ?? userGender;
    const currentConnected = isConnected ?? isConnectedToPartner;

    try {
      const baseDate = currentDate; // 現在表示中の月を基準にする
      const monthsToLoad = [];

      // 前後3ヶ月分の年月を計算
      for (let i = -MONTHS_TO_PRELOAD; i <= MONTHS_TO_PRELOAD; i++) {
        const targetDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, 1);
        monthsToLoad.push({
          year: targetDate.getFullYear(),
          month: targetDate.getMonth() + 1 // API用に1-indexed
        });
      }

      // ロード済み範囲を記録
      const startDate = new Date(baseDate.getFullYear(), baseDate.getMonth() - MONTHS_TO_PRELOAD, 1);
      const endDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + MONTHS_TO_PRELOAD + 1, 0);
      setLoadedMonthsRange({ start: startDate, end: endDate });
      
      // 並列で全月のデータを取得
      const allCalendarData = await Promise.all(
        monthsToLoad.map(({ year, month }) => 
          menstrualCycleAPI.getCalendarData(year, month)
        )
      );
      
      // 全データを結合
      const combinedCalendarData: Record<string, CalendarDayData> = {};
      allCalendarData.forEach(response => {
        const data = (response.data as Record<string, CalendarDayData>) || {};
        Object.assign(combinedCalendarData, data);
      });
      
      setCalendarApiData(combinedCalendarData);
      
      // 症状データも同様に取得
      const allSymptomsData = await Promise.all(
        monthsToLoad.map(({ year, month }) => {
          const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
          const lastDay = new Date(year, month, 0).getDate();
          const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
          return dailySymptomsAPI.getSymptomsRange(startDate, endDate);
        })
      );
      
      // 症状データを結合
      const combinedSymptomsData: Record<string, SymptomsData> = {};
      allSymptomsData.forEach(response => {
        if (response.success && response.data) {
          const symptomsDataResponse = response.data as Record<string, unknown>;
          Object.keys(symptomsDataResponse).forEach((dateKey) => {
            const symptomData = symptomsDataResponse[dateKey] as {
              symptoms?: string[];
              mood?: string;
              healthNotes?: string;
              health_notes?: string;
              flowIntensity?: number;
              flow_intensity?: number;
            };
            const formattedDate = dateKey.split(' ')[0];
            combinedSymptomsData[formattedDate] = {
              symptoms: symptomData.symptoms || [],
              mood: symptomData.mood || "",
              healthNotes: symptomData.healthNotes || symptomData.health_notes || "",
              flowIntensity: symptomData.flowIntensity || symptomData.flow_intensity || undefined,
            };
          });
        }
      });
      
      setSymptomsData(combinedSymptomsData);
      
      // パートナーデータも取得（該当する場合）
      if (currentConnected && (currentGender === "male" || currentGender === "男性")) {
        const allPartnerData = await Promise.all(
          monthsToLoad.map(({ year, month }) => 
            partnerAPI.getPartnerCalendar(year, month)
          )
        );
        
        const combinedPartnerData: Record<string, CalendarDayData> = {};
        allPartnerData.forEach(response => {
          if (response.success && (response.data as { calendar_data?: Array<CalendarDayData & { date: string }> })?.calendar_data) {
            (response.data as { calendar_data: Array<CalendarDayData & { date: string }> }).calendar_data.forEach((dayData) => {
              combinedPartnerData[dayData.date] = dayData;
            });
          }
        });
        
        setPartnerCalendarData(combinedPartnerData);
      }
      
    } catch (error) {
      console.error("Failed to load multiple months data:", error);
      // フォールバック：現在月のみ読み込む
      await loadCalendarData(currentGender, currentConnected);
    }
  };

  const cleanupOldLocalStorageData = () => {
    // 一回だけ実行する7月データの完全クリーンアップ
    const hasCleanedJuly = localStorage.getItem("july-data-cleanup-completed");
    if (hasCleanedJuly) return;

    // 全ての7月のデータを強制削除（古いバージョンで保存された可能性のあるデータ）
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("daily-symptoms-2025-07-")) {
        keys.push(key);
      }
    }

    if (keys.length > 0) {
      keys.forEach((key) => {
        localStorage.removeItem(key);
      });
    }

    localStorage.setItem("july-data-cleanup-completed", "true");
  };

  const loadCalendarData = async (gender?: string, isConnected?: boolean) => {
    // パラメータが指定されていない場合は現在の状態を使用
    const currentGender = gender ?? userGender;
    const currentConnected = isConnected ?? isConnectedToPartner;
    // 月切り替え時はローディング状態を設定しない（スムーズな切り替えのため）
    try {
      const data = await menstrualCycleAPI.getCalendarData(currentYear, currentMonth + 1);
      const rawData = (data.data as Record<string, CalendarDayData>) || {};

      // すべてのデータをそのまま使用（フィルタリングを削除）
      setCalendarApiData(rawData);

      // 症状データをAPIから取得（現在月の範囲）
      try {
        const startDate = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`;
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const endDate = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(lastDayOfMonth).padStart(2, "0")}`;
        const symptomsResponse = await dailySymptomsAPI.getSymptomsRange(startDate, endDate);
        
        if (symptomsResponse.success && symptomsResponse.data) {
          const symptomsMap: Record<string, SymptomsData> = {};
          const symptomsDataResponse = symptomsResponse.data as Record<string, unknown>;
          
          // オブジェクトの各キー（日付）を処理
          Object.keys(symptomsDataResponse).forEach((dateKey) => {
            const symptomData = symptomsDataResponse[dateKey] as {
              symptoms?: string[];
              mood?: string;
              healthNotes?: string;
              health_notes?: string;
              flowIntensity?: number;
              flow_intensity?: number;
            };
            // 日付キーをYYYY-MM-DD形式に変換（時刻部分を削除）
            const formattedDate = dateKey.split(' ')[0]; // "2025-08-01 00:00:00" -> "2025-08-01"
            
            symptomsMap[formattedDate] = {
              symptoms: symptomData.symptoms || [],
              mood: symptomData.mood || "",
              healthNotes: symptomData.healthNotes || symptomData.health_notes || "",
              flowIntensity: symptomData.flowIntensity || symptomData.flow_intensity || undefined,
            };
          });
          
          setSymptomsData(symptomsMap);
        } else {
          setSymptomsData({});
        }
      } catch {
        setSymptomsData({});
      }

      // 男性ユーザーで、パートナーと連動している場合、パートナーのカレンダーデータも読み込み
      if (currentConnected && (currentGender === "male" || currentGender === "男性")) {
        try {
          const partnerData = await partnerAPI.getPartnerCalendar(currentYear, currentMonth + 1);

          if (partnerData.success && (partnerData.data as { calendar_data?: Array<CalendarDayData & { date: string }> })?.calendar_data) {
            const partnerCalendarMap: Record<string, CalendarDayData> = {};
            (partnerData.data as { calendar_data: Array<CalendarDayData & { date: string }> }).calendar_data.forEach((dayData) => {
              partnerCalendarMap[dayData.date] = dayData;
            });
            setPartnerCalendarData(partnerCalendarMap);
          } else {
            setPartnerCalendarData({});
          }
        } catch {
          setPartnerCalendarData({});
        }
      } else {
        setPartnerCalendarData({});
      }
    } catch {
      setCalendarApiData({});
      setPartnerCalendarData({});
    }
  };

  // Helper function to check if a date has user input data from API
  const hasUserInputForDate = (dateKey: string): boolean => {
    const data = symptomsData[dateKey];
    
    if (!data) {
      return false;
    }

    // Check if any meaningful data exists (not just empty/default values)
    const result = (
      (data.symptoms && Array.isArray(data.symptoms) && data.symptoms.length > 0) ||
      (data.mood && data.mood.trim() !== "") ||
      (data.healthNotes && data.healthNotes.trim() !== "") ||
      (data.flowIntensity !== undefined && data.flowIntensity !== null && data.flowIntensity > 0)
    );
    
    return result;
  };

  // Helper function to check if a date has symptoms data (user or partner)
  const hasSymptomsForDate = (dateKey: string, partnerData?: CalendarDayData): boolean => {
    // 自分の症状データをチェック
    const hasUserSymptoms = hasUserInputForDate(dateKey);
    
    // 男性ユーザーの場合、パートナーの症状も含める
    const isMaleUser = userGender === "male" || userGender === "男性";
    
    // パートナーの症状データをチェック - より詳細なログ
    const hasPartnerSymptoms = !!(partnerData?.partner_daily_data?.symptoms && 
                                 Array.isArray(partnerData.partner_daily_data.symptoms) && 
                                 partnerData.partner_daily_data.symptoms.length > 0);
    
    
    if (isMaleUser && isConnectedToPartner) {
      return hasUserSymptoms || hasPartnerSymptoms;
    }
    
    return hasUserSymptoms;
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
      
      // 男性ユーザーで、パートナーと連動している場合、パートナーのデータを優先
      const isMaleUser = userGender === "male" || userGender === "男性";
      const displayData = (isMaleUser && isConnectedToPartner) ? partnerData : dayData;
      
      days.push({
        year: prevMonthYear,
        month: prevMonth,
        date,
        isCurrentMonth: false,
        isToday: false,
        hasPeriod: displayData?.hasPeriod || false,
        hasSymptoms: hasSymptomsForDate(dateKey, partnerData),
        isOvulation: displayData?.isOvulation || false,
        isPredictedPeriod: displayData?.isPredictedPeriod || false,
        isPeriodStart: displayData?.isPeriodStart || false,
        isPeriodEnd: displayData?.isPeriodEnd || false,
        isActive: displayData?.isActive || false,
        isFertile: displayData?.isFertile || false,
        hasPartnerPeriod: partnerData?.hasPeriod || false,
        hasPartnerSymptoms: (partnerData?.partner_daily_data?.symptoms && Array.isArray(partnerData.partner_daily_data.symptoms) && partnerData.partner_daily_data.symptoms.length > 0) || false,
        partnerName: partnerData?.partner_name,
      });
    }

    // 今月分
    for (let date = 1; date <= daysInMonth; date++) {
      const isToday = today.getFullYear() === currentYear && today.getMonth() === currentMonth && today.getDate() === date;
      const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
      const dayData = calendarApiData[dateKey];
      const partnerData = partnerCalendarData[dateKey];
      
      // 男性ユーザーで、パートナーと連動している場合、パートナーのデータを優先
      const isMaleUser = userGender === "male" || userGender === "男性";
      const displayData = (isMaleUser && isConnectedToPartner) ? partnerData : dayData;
      
      days.push({
        year: currentYear,
        month: currentMonth,
        date,
        isCurrentMonth: true,
        isToday,
        hasPeriod: displayData?.hasPeriod || false,
        hasSymptoms: hasSymptomsForDate(dateKey, partnerData),
        isOvulation: displayData?.isOvulation || false,
        isPredictedPeriod: displayData?.isPredictedPeriod || false,
        isPeriodStart: displayData?.isPeriodStart || false,
        isPeriodEnd: displayData?.isPeriodEnd || false,
        isActive: displayData?.isActive || false,
        isFertile: displayData?.isFertile || false,
        hasPartnerPeriod: partnerData?.hasPeriod || false,
        hasPartnerSymptoms: (partnerData?.partner_daily_data?.symptoms && Array.isArray(partnerData.partner_daily_data.symptoms) && partnerData.partner_daily_data.symptoms.length > 0) || false,
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
      
      // 男性ユーザーで、パートナーと連動している場合、パートナーのデータを優先
      const isMaleUser = userGender === "male" || userGender === "男性";
      const displayData = (isMaleUser && isConnectedToPartner) ? partnerData : dayData;
      
      days.push({
        year: nextMonthYear,
        month: nextMonth,
        date: nextMonthDate,
        isCurrentMonth: false,
        isToday: false,
        hasPeriod: displayData?.hasPeriod || false,
        hasSymptoms: hasSymptomsForDate(dateKey, partnerData),
        isOvulation: displayData?.isOvulation || false,
        isPredictedPeriod: displayData?.isPredictedPeriod || false,
        isPeriodStart: displayData?.isPeriodStart || false,
        isPeriodEnd: displayData?.isPeriodEnd || false,
        isActive: displayData?.isActive || false,
        isFertile: displayData?.isFertile || false,
        hasPartnerPeriod: partnerData?.hasPeriod || false,
        hasPartnerSymptoms: (partnerData?.partner_daily_data?.symptoms && Array.isArray(partnerData.partner_daily_data.symptoms) && partnerData.partner_daily_data.symptoms.length > 0) || false,
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

    // APIから取得した症状・気分・メモ・経血量データを取得
    let localSymptoms: string[] = [];
    let localMood = "";
    let localHealthNotes = "";
    let localFlowIntensity: number | undefined = undefined;

    const symptomsForDate = symptomsData[dateKey];
    if (symptomsForDate) {
      localSymptoms = symptomsForDate.symptoms || [];
      localMood = symptomsForDate.mood || "";
      localHealthNotes = symptomsForDate.healthNotes || "";
      localFlowIntensity = symptomsForDate.flowIntensity;
    }

    // パートナーのデータがある場合は含める
    let partnerDailyData = undefined;
    if (partnerData?.partner_daily_data) {
      partnerDailyData = {
        symptoms: partnerData.partner_daily_data.symptoms || [],
        mood: partnerData.partner_daily_data.mood || "",
        healthNotes: partnerData.partner_daily_data.health_notes || "",
        flowIntensity: partnerData.partner_daily_data.flow_intensity,
        partnerName: partnerData.partner_name,
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
          const isStartDate = (cycleData as { start_date?: string }).start_date === selectedDateStr;
          const isEndDate = (cycleData as { end_date?: string }).end_date === selectedDateStr;

          return {
            isPeriodStart: isStartDate,
            isPeriodEnd: isEndDate,
            symptoms: localSymptoms, // ローカルデータを使用
            mood: localMood, // ローカルデータを使用
            healthNotes: localHealthNotes, // ローカルデータを使用
            flowIntensity: localFlowIntensity || (cycleData as { flow_intensity?: number }).flow_intensity,
            cycleId: (cycleData as { id?: number }).id,
            existingCycleData: cycleData as Record<string, unknown>,
            partnerData: partnerDailyData, // パートナーデータを追加
          };
        }
      } catch {
        // Error case - use local data
      }
    }

    // API呼び出しが不要な場合やエラーの場合
    return {
      isPeriodStart: dayData?.isPeriodStart || false,
      isPeriodEnd: dayData?.isPeriodEnd || false,
      symptoms: localSymptoms, // ローカルデータを使用
      mood: localMood, // ローカルデータを使用
      healthNotes: localHealthNotes, // ローカルデータを使用
      flowIntensity: localFlowIntensity || dayData?.flowIntensity,
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
          const updateData: Record<string, string> = {};

          if (data.isPeriodStart) {
            updateData.start_date = dateStr;
          } else if (data.isPeriodEnd) {
            updateData.end_date = dateStr;
          }

          if (Object.keys(updateData).length > 0) {
            await menstrualCycleAPI.updateCycle(data.cycleId, updateData);
          }
        } else {
          // 既存の周期IDがない場合
          if (data.isPeriodStart) {
            await menstrualCycleAPI.startCycle({
              start_date: dateStr,
            });
          } else if (data.isPeriodEnd) {
            // 終了日を設定する場合、直接アクティブな周期を取得

            try {
              const response = await menstrualCycleAPI.getCurrentStatus();

              if (response.hasActiveCycle && response.activeCycle) {
                const activeCycle = response.activeCycle as { id: number; start_date: string };

                await menstrualCycleAPI.updateCycle(activeCycle.id, { end_date: dateStr });
              } else {
                throw new Error("終了する生理周期が見つかりません。先に生理開始日を設定してください。");
              }
            } catch {
              throw new Error("終了する生理周期が見つかりません。先に生理開始日を設定してください。");
            }
          }
        }
      }

      // 2. 症状データをAPIに保存（空のデータも保存してクリアを反映）
      try {
        await dailySymptomsAPI.saveSymptoms({
          date: dateStr,
          symptoms: data.symptoms,
          mood: data.mood,
          healthNotes: data.healthNotes,
          flowIntensity: data.flowIntensity,
        });
        
        // 保存成功後、即座にsymptomsDataを更新
        setSymptomsData(prev => ({
          ...prev,
          [dateStr]: {
            symptoms: data.symptoms,
            mood: data.mood,
            healthNotes: data.healthNotes,
            flowIntensity: data.flowIntensity,
          }
        }));
      } catch {
        // 症状データのAPI保存が失敗してもローカルストレージには保存する
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
      } else {
        localStorage.removeItem(`daily-symptoms-${dateStr}`);
      }

      alert("記録が保存されました！");
      
      // 生理周期情報が変更された場合のみ、強制的にカレンダー更新
      if (hasPeriodInfo) {
        
        setTimeout(async () => {
          if (isInitialLoadComplete) {
            await loadMultipleMonthsData();
          } else {
            await loadCalendarData();
          }
          setRefreshKey((prev) => prev + 1);
        }, 100);
      } else {
        // 症状のみの場合は一切更新しない
        // カレンダーAPIデータはそのまま維持され、生理日表示は保持される
      }
    } catch (error: unknown) {
      let errorMessage = "記録の保存に失敗しました。";
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { response?: { data?: { message?: string } } };
        if (apiError.response?.data?.message) {
          errorMessage = apiError.response.data.message;
        }
      }
      alert(errorMessage);
    }
  };

  // ローカルストレージから生理データを削除する関数（完全削除版）
  const clearPeriodDataFromLocalStorage = (cycleId: number) => {

    // まず calendarApiData から該当するサイクルの全ての日付を特定
    const cycleDates = [];
    for (const dateKey of Object.keys(calendarApiData)) {
      const dayData = calendarApiData[dateKey] as { cycleId?: number; [key: string]: unknown };
      if (dayData.cycleId === cycleId) {
        cycleDates.push(dateKey);
      }
    }


    // 該当する日付のローカルストレージを完全削除
    cycleDates.forEach((dateString) => {
      const localStorageKey = `daily-symptoms-${dateString}`;
      const existingData = localStorage.getItem(localStorageKey);

      if (existingData) {
        localStorage.removeItem(localStorageKey);
      }
    });

    // さらに、現在の月の全ての日付で生理関連データをクリア（追加の安全策）
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // 今月の全ての日をチェック
    for (let day = 1; day <= 31; day++) {
      const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const localStorageKey = `daily-symptoms-${dateString}`;
      const existingData = localStorage.getItem(localStorageKey);

      if (existingData) {
        try {
          const data = JSON.parse(existingData);
          // 生理関連のフラグがある場合はクリア
          if (data.hasPeriod || data.isPeriodStart || data.isPeriodEnd) {

            const updatedData = {
              ...data,
              isPeriodStart: false,
              isPeriodEnd: false,
              hasPeriod: false,
              flowIntensity: undefined,
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
        } catch {
          // Silent error handling - failed to parse local storage cleanup data
        }
      }
    }
  };

  // 削除処理（改良版）
  const handleDelete = async (cycleId: number) => {
    try {

      // ローカルストレージを先に削除（API削除前に実行）
      clearPeriodDataFromLocalStorage(cycleId);

      // API からサイクルを削除
      await menstrualCycleAPI.deleteCycle(cycleId);

      // カレンダーデータを再読み込み
      if (isInitialLoadComplete) {
        await loadMultipleMonthsData(); // 複数月分を再ロード
      } else {
        await loadCalendarData(); // 既存の状態を使用
      }

      // カレンダーを強制再描画
      setRefreshKey((prev) => prev + 1);

      // カスタムイベントを発火してアプリ全体を更新
      window.dispatchEvent(new CustomEvent("menstrualDataUpdated"));

      alert("生理周期が削除されました");
    } catch {
      alert("削除に失敗しました");
    }
  };

  // モーダルを閉じる処理
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedDateForModal(null);
    setExistingDataForModal(undefined);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const calendarDays = useMemo(() => generateCalendarDays(), [currentYear, currentMonth, calendarApiData, partnerCalendarData, symptomsData, refreshKey]);

  // 日付セルのスタイルを決定
  const getDayStyle = (day: CalendarDay) => {
    let baseStyle = "h-10 sm:h-12 w-full flex items-center justify-center text-sm font-medium cursor-pointer transition-colors relative touch-manipulation box-border border ";

    if (!day.isCurrentMonth) {
      baseStyle += "text-gray-300 dark:text-gray-600 border-transparent ";
    } else if (day.isToday && (day.hasPeriod || day.isPeriodStart)) {
      // 今日かつ生理関連の場合
      baseStyle += "bg-purple-600 text-white rounded-lg border-transparent ";
    } else if (day.isToday && day.hasPartnerPeriod) {
      // 今日かつパートナーの生理期間の場合
      baseStyle += "bg-purple-600 text-white rounded-lg border-transparent ";
    } else if (day.isToday && day.isPredictedPeriod) {
      // 今日かつ予測生理日の場合
      baseStyle += "bg-purple-600 text-white rounded-lg border-transparent ";
    } else if (day.isToday && day.isOvulation) {
      // 今日かつ排卵日の場合
      baseStyle += "bg-purple-600 text-white rounded-lg border-transparent ";
    } else if (day.isToday && day.isFertile) {
      // 今日かつ妊娠可能期間の場合
      baseStyle += "bg-purple-600 text-white rounded-lg border-transparent ";
    } else if (day.isToday) {
      // 今日のみの場合
      baseStyle += "bg-purple-500 text-white font-bold rounded-lg border-transparent ";
    } else if (day.hasPeriod || day.isPeriodStart || day.isPeriodEnd || day.hasPartnerPeriod) {
      // 生理期間中・開始日・終了日・パートナーの生理期間の場合（統一して赤いスタイル）
      baseStyle += "bg-red-500 text-white rounded-lg border-transparent ";
    } else if (day.isPredictedPeriod) {
      // 予測生理日の場合
      baseStyle += "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700 rounded-lg ";
    } else if (day.isOvulation) {
      // 排卵日の場合
      baseStyle += "bg-pink-500 text-white rounded-lg border-transparent ";
    } else if (day.isFertile) {
      // 妊娠可能期間の場合
      baseStyle += "bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-300 border-pink-300 dark:border-pink-700 rounded-lg ";
    } else {
      // 通常の日付
      baseStyle += "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 rounded-lg border-transparent ";
    }

    return baseStyle;
  };

  // 日付セルの装飾を決定
  const getDayDecorations = (day: CalendarDay) => {
    const decorations = [];

    // 排卵日も背景色で表示するため、生理日と重複しない場合のみ
    if (day.isOvulation && !day.hasPeriod) {
      decorations.push(<div key="ovulation" className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-pink-500 rounded-full"></div>);
    }

    // 症状がある場合は小さなドットを表示（自分の症状またはパートナーの症状）
    if (day.hasSymptoms) {
      decorations.push(<div key="symptoms" className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-500 rounded-full"></div>);
    }

    return decorations;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-medical dark:border-gray-700 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 dark:text-white">カレンダー</h2>
          <p className="text-sm text-neutral-600 dark:text-gray-400">生理周期と症状を確認</p>
        </div>
        <div className="flex items-center justify-center sm:space-x-3">
          <div className="flex items-center space-x-1">
            <button onClick={goToPreviousMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors touch-manipulation">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="px-3 py-2 sm:px-4 text-base sm:text-lg font-semibold text-gray-900 dark:text-white min-w-[100px] sm:min-w-[120px] text-center">
              {currentYear}年{monthNames[currentMonth]}
            </div>
            <button onClick={goToNextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors touch-manipulation">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              index === 0 ? "text-red-600 dark:text-red-400" : index === 6 ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-300"
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
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">凡例</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full flex-shrink-0"></div>
            <span className="text-gray-600 dark:text-gray-400">今日</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0"></div>
            <span className="text-gray-600 dark:text-gray-400">生理日</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-100 dark:bg-red-900 ring-1 ring-red-300 dark:ring-red-700 rounded-full flex-shrink-0"></div>
            <span className="text-gray-600 dark:text-gray-400">予測生理日</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-pink-500 rounded-full flex-shrink-0"></div>
            <span className="text-gray-600 dark:text-gray-400">排卵日</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-pink-100 dark:bg-pink-900 ring-1 ring-pink-300 dark:ring-pink-700 rounded-full flex-shrink-0"></div>
            <span className="text-gray-600 dark:text-gray-400">妊娠しやすい時期</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-amber-500 rounded-full flex-shrink-0"></div>
            <span className="text-gray-600 dark:text-gray-400">症状記録</span>
          </div>
        </div>
      </div>

      {/* DateRecordModal */}
      {selectedDateForModal && (() => {
        const dateString = getLocalDateString(selectedDateForModal);
        const periodStatus = getDatePeriodStatus(dateString);
        return (
          <DateRecordModal
            isOpen={isModalOpen}
            onClose={handleModalClose}
            selectedDate={selectedDateForModal}
            onSave={handleModalSave}
            onDelete={handleDelete}
            existingData={existingDataForModal}
            isInPeriod={periodStatus.isInPeriod}
            isMiddleOfPeriod={periodStatus.isMiddleOfPeriod}
            isTodayPeriodStart={periodStatus.isPeriodStart}
            isTodayPeriodEnd={periodStatus.isPeriodEnd}
          />
        );
      })()}
    </div>
  );
};
