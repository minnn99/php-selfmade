// Helper functions for managing period status automatically
import { menstrualStatusManager } from '../services/menstrualStatusManager';

export const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Check if a given date is within an active period cycle
 */
export const isDateInActivePeriod = (dateString: string): boolean => {
  const status = menstrualStatusManager.getCurrentStatus();
  
  if (!status?.hasActiveCycle || !status?.activeCycle) {
    return false;
  }
  
  const activeCycle = status.activeCycle;
  const startDate = activeCycle.start_date;
  const endDate = activeCycle.end_date;
  
  // If no end date, check if date is >= start date (ongoing period)
  if (!endDate) {
    return dateString >= startDate;
  }
  
  // If end date exists, check if date is within range
  return dateString >= startDate && dateString <= endDate;
};

/**
 * Get period status for today based on active cycle
 */
export const getTodayPeriodStatus = () => {
  const today = getLocalDateString(new Date());
  const status = menstrualStatusManager.getCurrentStatus();
  
  if (!status?.hasActiveCycle || !status?.activeCycle) {
    return {
      hasPeriod: false,
      isPeriodStart: false,
      isPeriodEnd: false
    };
  }
  
  const activeCycle = status.activeCycle;
  const startDate = activeCycle.start_date;
  const endDate = activeCycle.end_date;
  
  const isInPeriod = isDateInActivePeriod(today);
  const isStartDate = today === startDate;
  const isEndDate = endDate ? today === endDate : false;
  
  return {
    hasPeriod: isInPeriod,
    isPeriodStart: isStartDate,
    isPeriodEnd: isEndDate
  };
};

/**
 * Update local storage for a date with period status based on active cycle
 */
export const updateDailyDataWithPeriodStatus = async (dateString: string) => {
  const periodStatus = isDateInActivePeriod(dateString);
  
  if (!periodStatus) {
    return; // No active period, don't modify data
  }
  
  const status = menstrualStatusManager.getCurrentStatus();
  const activeCycle = status?.activeCycle;
  
  if (!activeCycle) return;
  
  const startDate = activeCycle.start_date;
  const endDate = activeCycle.end_date;
  
  try {
    // Import userDataAPI dynamically to avoid circular imports
    const { userDataAPI } = await import('../services/api');
    
    // Get existing data
    const response = await userDataAPI.getDailySymptoms(dateString);
    const existingData = response.data || {};
    
    // Create updated data with period status
    const updatedData = {
      ...existingData,
      isPeriodStart: dateString === startDate,
      isPeriodEnd: endDate ? dateString === endDate : false,
      hasPeriod: true,
      timestamp: new Date().toISOString()
    };
    
    await userDataAPI.saveDailySymptoms(dateString, updatedData);
  } catch {
    // Silent error handling - failed to update daily data with period status
  }
};

/**
 * Initialize period status for today when app loads
 */
export const initializeTodayPeriodStatus = () => {
  const today = getLocalDateString(new Date());
  
  // Wait for menstrual status to load before updating
  const checkAndUpdate = () => {
    const status = menstrualStatusManager.getCurrentStatus();
    
    if (!status) {
      // Status not loaded yet, wait a bit more
      setTimeout(checkAndUpdate, 100);
      return;
    }
    
    if (status?.hasActiveCycle) {
      updateDailyDataWithPeriodStatus(today);
      
      // Dispatch event to update UI components
      window.dispatchEvent(new CustomEvent('dailyDataUpdated'));
    }
  };
  
  checkAndUpdate();
};

/**
 * Auto-update period status for dates within active cycle
 */
export const autoUpdatePeriodStatusForActiveCycle = () => {
  const status = menstrualStatusManager.getCurrentStatus();
  
  if (!status?.hasActiveCycle || !status?.activeCycle) {
    return;
  }
  
  const activeCycle = status.activeCycle;
  const startDate = activeCycle.start_date;
  const endDate = activeCycle.end_date;
  
  // Create date range from start to end (or today if no end date)
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date(); // Use today if no end date
  
  // Update all dates in the period range
  const currentDate = new Date(start);
  while (currentDate <= end) {
    const dateString = getLocalDateString(currentDate);
    updateDailyDataWithPeriodStatus(dateString);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Dispatch event to update UI components
  window.dispatchEvent(new CustomEvent('dailyDataUpdated'));
};