import React, { useState, useEffect, useMemo } from "react";
import { menstrualCycleAPI, partnerAPI, authAPI, dailySymptomsAPI } from "../../services/api";
import { DateRecordModal, type RecordData } from "./DateRecordModal";

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
  status?: string;
  partner_daily_data?: {
    symptoms?: string[];
    mood?: string;
    health_notes?: string;
    flow_intensity?: number;
  };
}

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
  isFertile?: boolean;
  hasPartnerPeriod?: boolean;
  hasPartnerSymptoms?: boolean;
  partnerName?: string;
}

interface CalendarViewProps {
  refreshKey?: number; // 外部からのデータ更新をトリガーするためのキー
}

interface SymptomsData {
  symptoms: string[];
  mood: string;
  healthNotes: string;
  flowIntensity?: number;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ refreshKey }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarApiData, setCalendarApiData] = useState<Record<string, CalendarDayData>>({});
  const [partnerCalendarData, setPartnerCalendarData] = useState<Record<string, CalendarDayData>>({});
  const [symptomsData, setSymptomsData] = useState<Record<string, SymptomsData>>({});
  const [loading, setLoading] = useState(false); // 日付クリック時のローディング専用
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDateForModal, setSelectedDateForModal] = useState<Date | null>(null);
  const [existingDataForModal, setExistingDataForModal] = useState<RecordData | undefined>(undefined);
  const [userGender, setUserGender] = useState<string>("");
  const [isConnectedToPartner, setIsConnectedToPartner] = useState(false);

  // 現在の月の年と月を取得
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Load calendar data when date changes
  useEffect(() => {
    const loadData = async () => {
      // まずユーザー情報を読み込み
      const userData = await authAPI.getUser();
      const gender = (userData.data as { user?: { gender?: string } })?.user?.gender || "";
      setUserGender(gender);
      // パートナー状況を確認
      const partnerStatus = await partnerAPI.getStatus();
      const isConnected = partnerStatus.success && (partnerStatus.data as { is_connected?: boolean })?.is_connected;
      setIsConnectedToPartner(!!isConnected);

      // ユーザー情報取得後にカレンダーデータを読み込み
      await loadCalendarData(gender, isConnected);

      // 初回読み込み時にローカルストレージデータを移行
      await migrateLocalStorageData();

      cleanupOldLocalStorageData();
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentYear, currentMonth, refreshKey]);

  // ローカルストレージデータをAPIに移行する関数
  const migrateLocalStorageData = async () => {
    const migrationKey = "symptoms-data-migrated";

    // 既に移行済みの場合はスキップ
    if (localStorage.getItem(migrationKey) === "true") {
      console.log("Symptoms data already migrated, skipping...");
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
          } catch (error) {
            console.error("Error parsing local storage data for key:", key, error);
          }
        }
      }

      if (symptomsData.length > 0) {
        console.log(`Migrating ${symptomsData.length} symptoms records from localStorage to API...`);
        const response = await dailySymptomsAPI.bulkSaveSymptoms(symptomsData);

        if (response.success) {
          console.log("Migration successful:", response.data);
          localStorage.setItem(migrationKey, "true");
        } else {
          console.error("Migration failed:", response);
        }
      } else {
        console.log("No symptoms data found in localStorage to migrate");
        localStorage.setItem(migrationKey, "true");
      }
    } catch (error) {
      console.error("Error during symptoms data migration:", error);
    }
  };

  // 古いローカルストレージデータをクリーンアップする関数
  const cleanupOldLocalStorageData = () => {
    const currentYearMonth = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;

    // 現在月のローカルストレージキーを取得
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`daily-symptoms-${currentYearMonth}`)) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || "{}");
          const hasSymptoms = data.symptoms && data.symptoms.length > 0;
          const hasMood = data.mood && data.mood.trim() !== "";
          const hasHealthNotes = data.healthNotes && data.healthNotes.trim() !== "";
          const hasFlowIntensity = data.flowIntensity !== undefined && data.flowIntensity !== null && data.flowIntensity > 0;

          // 全てのデータが空の場合は削除
          if (!hasSymptoms && !hasMood && !hasHealthNotes && !hasFlowIntensity) {
            localStorage.removeItem(key);
          }
        } catch {
          // 破損したデータも削除
          localStorage.removeItem(key);
        }
      }
    }
  };

  const loadCalendarData = async (gender?: string, isConnected?: boolean) => {
    // パラメータが指定されていない場合は現在の状態を使用
    const currentGender = gender ?? userGender;
    const currentConnected = isConnected ?? isConnectedToPartner;

    try {
      const data = await menstrualCycleAPI.getCalendarData(currentYear, currentMonth + 1);
      const rawData = (data.data as Record<string, unknown>) || {};

      // 古いデータをフィルタリング（30日以上前のデータは無視）
      const currentDate = new Date();
      const thirtyDaysAgo = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      const filteredData: Record<string, CalendarDayData> = {};

      Object.keys(rawData).forEach((dateKey) => {
        const keyDate = new Date(dateKey);
        if (keyDate >= thirtyDaysAgo || keyDate.getMonth() === currentMonth) {
          // 30日以内、または表示中の月のデータのみ保持
          filteredData[dateKey] = rawData[dateKey] as CalendarDayData;
        }
      });

      setCalendarApiData(filteredData);

      // 症状データをAPIから取得（現在月の範囲）
      try {
        const startDate = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`;
        const endDate = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-31`;
        const symptomsResponse = await dailySymptomsAPI.getSymptomsRange(startDate, endDate);
        
        if (symptomsResponse.success && symptomsResponse.data) {
          const symptomsMap: Record<string, SymptomsData> = {};
          const symptomsDataResponse = symptomsResponse.data as Record<string, unknown>;
          
          // オブジェクトの各キー（日付）を処理
          Object.keys(symptomsDataResponse).forEach((dateKey) => {
            const symptomData = symptomsDataResponse[dateKey] as {
              symptoms?: string[];
              mood?: string;
              health_notes?: string;
              flow_intensity?: number;
            };
            // 日付キーをYYYY-MM-DD形式に変換（時刻部分を削除）
            const formattedDate = dateKey.split(' ')[0]; // "2025-08-01 00:00:00" -> "2025-08-01"
            
            symptomsMap[formattedDate] = {
              symptoms: symptomData.symptoms || [],
              mood: symptomData.mood || "",
              healthNotes: symptomData.health_notes || "",
              flowIntensity: symptomData.flow_intensity,
            };
          });
          
          setSymptomsData(symptomsMap);
        } else {
          setSymptomsData({});
        }
      } catch (error) {
        console.error("Failed to load symptoms data:", error);
        setSymptomsData({});
      }

      // 男性ユーザーで、パートナーと連動している場合、パートナーのカレンダーデータも読み込み
      if (currentConnected && (currentGender === "male" || currentGender === "男性")) {
        try {
          const partnerData = await partnerAPI.getPartnerCalendar(currentYear, currentMonth + 1);

          if (partnerData.success && (partnerData.data as { calendar_data?: Array<{ date: string; [key: string]: unknown }> })?.calendar_data) {
            const partnerCalendarMap: Record<string, CalendarDayData> = {};
            (partnerData.data as { calendar_data: Array<{ date: string; [key: string]: unknown }> }).calendar_data.forEach((dayData) => {
              partnerCalendarMap[dayData.date] = dayData as CalendarDayData;
            });
            setPartnerCalendarData(partnerCalendarMap);
          } else {
            setPartnerCalendarData({});
          }
        } catch (error) {
          console.error("Failed to load partner calendar data:", error);
          setPartnerCalendarData({});
        }
      } else {
        setPartnerCalendarData({});
      }
    } catch (error) {
      console.error("Failed to load calendar data:", error);
      setCalendarApiData({});
      setPartnerCalendarData({});
    }
  };

  // 月の名前
  const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

  // 週の名前
  const dayNames = ["日", "月", "火", "水", "木", "金", "土"];

  // 前月・次月への移動
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Helper function to check if a date has user input data from API
  const hasUserInputForDate = useMemo(() => {
    return (dateKey: string): boolean => {
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
  }, [symptomsData]); // symptomsDataに依存

  // Helper function to check if a date has symptoms data (user or partner)
  const hasSymptomsForDate = (dateKey: string, partnerData?: CalendarDayData): boolean => {
    // 自分の症状データをチェック
    const hasUserSymptoms = hasUserInputForDate(dateKey);

    // 男性ユーザーの場合、パートナーの症状も含める
    const isMaleUser = userGender === "male" || userGender === "男性";
    const hasPartnerSymptoms = !!(
      partnerData?.partner_daily_data?.symptoms &&
      Array.isArray(partnerData.partner_daily_data.symptoms) &&
      partnerData.partner_daily_data.symptoms.length > 0
    );

    if (isMaleUser && isConnectedToPartner) {
      return hasUserSymptoms || hasPartnerSymptoms;
    }

    return hasUserSymptoms;
  };

  // カレンダーの日付データを生成（APIデータを使用）
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
        hasPartnerPeriod: partnerData?.status === "period" || false,
        hasPartnerSymptoms: partnerData?.partner_daily_data
          ? Boolean(
              (partnerData.partner_daily_data.symptoms && partnerData.partner_daily_data.symptoms.length > 0) ||
                (partnerData.partner_daily_data.mood && String(partnerData.partner_daily_data.mood).trim() !== "") ||
                (partnerData.partner_daily_data.health_notes && String(partnerData.partner_daily_data.health_notes).trim() !== "")
            )
          : false,
        partnerName: partnerData?.partner_name,
      });
    }

    // 今月分
    for (let date = 1; date <= daysInMonth; date++) {
      const isToday = today.getFullYear() === currentYear && today.getMonth() === currentMonth && today.getDate() === date;
      const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
      const dayData = calendarApiData[dateKey];
      const partnerData = partnerCalendarData[dateKey];
      const hasSymptoms = hasSymptomsForDate(dateKey, partnerData);
      
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
        hasSymptoms,
        isOvulation: displayData?.isOvulation || false,
        isPredictedPeriod: displayData?.isPredictedPeriod || false,
        isPeriodStart: displayData?.isPeriodStart || false,
        isPeriodEnd: displayData?.isPeriodEnd || false,
        isActive: displayData?.isActive || false,
        isFertile: displayData?.isFertile || false,
        hasPartnerPeriod: partnerData?.status === "period" || false,
        hasPartnerSymptoms: partnerData?.partner_daily_data
          ? Boolean(
              (partnerData.partner_daily_data.symptoms && partnerData.partner_daily_data.symptoms.length > 0) ||
                (partnerData.partner_daily_data.mood && String(partnerData.partner_daily_data.mood).trim() !== "") ||
                (partnerData.partner_daily_data.health_notes && String(partnerData.partner_daily_data.health_notes).trim() !== "")
            )
          : false,
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
        hasPartnerPeriod: partnerData?.status === "period" || false,
        hasPartnerSymptoms: partnerData?.partner_daily_data
          ? Boolean(
              (partnerData.partner_daily_data.symptoms && partnerData.partner_daily_data.symptoms.length > 0) ||
                (partnerData.partner_daily_data.mood && String(partnerData.partner_daily_data.mood).trim() !== "") ||
                (partnerData.partner_daily_data.health_notes && String(partnerData.partner_daily_data.health_notes).trim() !== "")
            )
          : false,
        partnerName: partnerData?.partner_name,
      });
      nextMonthDate++;
    }

    return days;
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const calendarDays = useMemo(() => generateCalendarDays(), [currentYear, currentMonth, calendarApiData, partnerCalendarData, symptomsData, refreshKey]);

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

  // 選択された日の既存データを取得
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
            flowIntensity: localFlowIntensity !== undefined ? localFlowIntensity : (cycleData as { flow_intensity?: number }).flow_intensity,
            cycleId: (cycleData as { id?: number }).id,
            existingCycleData: cycleData as Record<string, unknown>,
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

  // ローカルタイムゾーンで日付文字列を取得
  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // モーダルのデータ保存処理
  const handleModalSave = async (data: RecordData) => {
    if (!selectedDateForModal) return;

    try {
      const dateStr = getLocalDateString(selectedDateForModal);

      // 症状、気分、メモ、経血量のいずれかが入力されている場合のみ保存
      const hasSymptoms = data.symptoms.length > 0;
      const hasMood = data.mood && data.mood.trim() !== "";
      const hasHealthNotes = data.healthNotes && data.healthNotes.trim() !== "";
      const hasFlowIntensity = data.flowIntensity !== undefined && data.flowIntensity !== null && data.flowIntensity > 0;

      // 1. 症状データをAPIに保存
      if (hasSymptoms || hasMood || hasHealthNotes || hasFlowIntensity) {
        try {
          console.log(`Calendar: Saving symptoms data to API for ${dateStr}:`, {
            date: dateStr,
            symptoms: data.symptoms,
            mood: data.mood,
            healthNotes: data.healthNotes,
            flowIntensity: data.flowIntensity,
          });

          const apiResponse = await dailySymptomsAPI.saveSymptoms({
            date: dateStr,
            symptoms: data.symptoms,
            mood: data.mood,
            healthNotes: data.healthNotes,
            flowIntensity: data.flowIntensity,
          });

          console.log(`Calendar: API save response for ${dateStr}:`, apiResponse);
        } catch (error) {
          console.error(`API ERROR: Failed to save symptoms data for ${dateStr}:`, error);
          // 症状データのAPI保存が失敗してもローカルストレージには保存する
        }
      }

      // 2. ローカルストレージにも保存（バックアップとして）
      const dailyRecord = {
        date: dateStr,
        symptoms: data.symptoms,
        mood: data.mood,
        healthNotes: data.healthNotes,
        flowIntensity: data.flowIntensity,
        timestamp: new Date().toISOString(),
      };

      if (hasSymptoms || hasMood || hasHealthNotes || hasFlowIntensity) {
        console.log(`Calendar: Saving to localStorage for ${dateStr}:`, dailyRecord);
        localStorage.setItem(`daily-symptoms-${dateStr}`, JSON.stringify(dailyRecord));
      } else {
        // データがない場合は削除
        localStorage.removeItem(`daily-symptoms-${dateStr}`);
      }

      // 3. 生理周期情報はAPIに保存（症状・経血量データは除く）
      if (data.cycleId) {
        // 既存の周期IDがある場合：周期の更新（症状・経血量データは送信しない）
        const updateData: { start_date?: string; end_date?: string } = {};

        if (data.isPeriodStart) {
          // 開始日を更新
          updateData.start_date = dateStr;
        } else if (data.isPeriodEnd) {
          // 終了日を更新
          updateData.end_date = dateStr;
        }

        // 更新データがある場合のみAPI呼び出し
        if (Object.keys(updateData).length > 0) {
          await menstrualCycleAPI.updateCycle(data.cycleId, updateData);
        }
      } else {
        // 既存の周期IDがない場合：新規作成（症状・経血量データは送信しない）
        if (data.isPeriodStart) {
          await menstrualCycleAPI.startCycle({
            start_date: dateStr,
            // flow_intensity, symptoms, notes は送信しない
          });
        } else if (data.isPeriodEnd) {
          await menstrualCycleAPI.endCycle(dateStr);
        }
      }

      // データ更新イベントを発火
      window.dispatchEvent(new CustomEvent("menstrualDataUpdated"));
      alert("記録が保存されました！");
    } catch (error: unknown) {
      console.error("Failed to save record:", error);
      let errorMessage = "記録の保存に失敗しました。";
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response: { data: { message?: string } } };
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      }
      alert(errorMessage);
    }
  };

  // 削除処理
  const handleDelete = async (cycleId: number) => {
    try {
      await menstrualCycleAPI.deleteCycle(cycleId);
      window.dispatchEvent(new CustomEvent("menstrualDataUpdated"));
      alert("生理周期が削除されました");
    } catch (error: unknown) {
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

  // 日付セルのスタイルを決定
  const getDayStyle = (day: CalendarDay) => {
    let baseStyle = "h-10 sm:h-12 w-full flex items-center justify-center text-sm font-medium cursor-pointer transition-colors relative touch-manipulation ";

    if (!day.isCurrentMonth) {
      baseStyle += "text-gray-300 ";
    } else if (day.isToday && (day.hasPeriod || day.isPeriodStart)) {
      // 今日かつ生理関連の場合
      baseStyle += "bg-purple-600 text-white rounded-lg ";
    } else if (day.isToday && day.hasPartnerPeriod) {
      // 今日かつパートナーの生理期間の場合
      baseStyle += "bg-purple-600 text-white rounded-lg ";
    } else if (day.isToday && day.isPredictedPeriod) {
      // 今日かつ予測生理日の場合
      baseStyle += "bg-purple-600 text-white rounded-lg ";
    } else if (day.isToday && day.isOvulation) {
      // 今日かつ排卵日の場合
      baseStyle += "bg-purple-600 text-white rounded-lg ";
    } else if (day.isToday && day.isFertile) {
      // 今日かつ妊娠可能期間の場合
      baseStyle += "bg-purple-600 text-white rounded-lg ";
    } else if (day.isToday) {
      // 今日のみの場合
      baseStyle += "bg-purple-500 text-white font-bold rounded-lg ";
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
    } else if (day.isFertile) {
      // 妊娠可能期間の場合
      baseStyle += "bg-pink-100 text-pink-800 border border-pink-300 rounded-lg ";
    } else {
      // 通常の日付
      baseStyle += "text-gray-700 hover:bg-gray-100 active:bg-gray-200 rounded-lg ";
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
    <div className="bg-white rounded-xl shadow-sm border border-medical p-4 sm:p-6">
      {/* ローディングオーバーレイを削除してスムーズな切り替えを実現 */}
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
            <div className="w-3 h-3 bg-purple-500 rounded-full flex-shrink-0"></div>
            <span className="text-gray-600">今日</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0"></div>
            <span className="text-gray-600">生理日</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-100 border border-red-300 rounded-full flex-shrink-0"></div>
            <span className="text-gray-600">予測生理日</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-pink-500 rounded-full flex-shrink-0"></div>
            <span className="text-gray-600">排卵日</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-pink-100 border border-pink-300 rounded-full flex-shrink-0"></div>
            <span className="text-gray-600">妊娠しやすい時期</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-amber-500 rounded-full flex-shrink-0"></div>
            <span className="text-gray-600">症状記録</span>
          </div>
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
