// Menstrual status management with centralized API calls and debouncing
import { menstrualCycleAPI } from './api';

interface MenstrualStatus {
  hasActiveCycle: boolean;
  activeCycle: {
    id: number;
    start_date: string;
    end_date?: string;
    [key: string]: unknown;
  } | null;
  lastCycle: {
    id: number;
    start_date: string;
    end_date?: string;
    [key: string]: unknown;
  } | null;
  daysSinceLastPeriod: number;
}

class MenstrualStatusManager {
  private status: MenstrualStatus | null = null;
  private listeners: Set<(status: MenstrualStatus | null) => void> = new Set();
  private isLoading = false;
  private loadPromise: Promise<void> | null = null;
  private debounceTimeout: number | null = null;

  // Subscribe to status updates
  subscribe(callback: (status: MenstrualStatus | null) => void) {
    this.listeners.add(callback);
    
    // Immediately call with current status if available
    if (this.status) {
      callback(this.status);
    }

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  // Get current status (returns cached if available)
  getCurrentStatus(): MenstrualStatus | null {
    return this.status;
  }

  // Load status with debouncing to prevent duplicate API calls
  async loadStatus(force: boolean = false): Promise<void> {
    // If already loading and not forced, return existing promise
    if (this.loadPromise && !force) {
      return this.loadPromise;
    }

    // Clear existing debounce
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = null;
    }

    // Create new debounced load
    this.loadPromise = new Promise((resolve) => {
      this.debounceTimeout = window.setTimeout(async () => {
        if (this.isLoading && !force) {
          resolve();
          return;
        }

        this.isLoading = true;
        try {
          const response = await menstrualCycleAPI.getCurrentStatus();
          this.status = response.data as MenstrualStatus;
          
          // Notify all subscribers
          this.listeners.forEach(callback => callback(this.status));
          
        } catch (error) {
          // Notify subscribers with null on error
          this.listeners.forEach(callback => callback(null));
        } finally {
          this.isLoading = false;
          this.loadPromise = null;
          resolve();
        }
      }, 100); // 100ms debounce
    });

    return this.loadPromise;
  }

  // Force reload status (bypasses cache and debounce)
  async forceReloadStatus(): Promise<void> {
    return this.loadStatus(true);
  }

  // Clear cached status
  clearStatus(): void {
    this.status = null;
    this.listeners.forEach(callback => callback(null));
  }

  // Check if currently loading
  isLoadingStatus(): boolean {
    return this.isLoading;
  }
}

// Create singleton instance
export const menstrualStatusManager = new MenstrualStatusManager();

// Note: Manual initialization is required after authentication
// Components should call menstrualStatusManager.loadStatus() after user login

// Listen for menstrualDataUpdated events globally
window.addEventListener('menstrualDataUpdated', () => {
  menstrualStatusManager.loadStatus().then(() => {
    // Auto-update period status after reloading
    import('../utils/periodStatusHelper').then(({ autoUpdatePeriodStatusForActiveCycle }) => {
      autoUpdatePeriodStatusForActiveCycle();
    });
  });
});