// API Base URL
const API_BASE = "http://localhost:8000/api";

// API Response interface
interface ApiResponse {
  success: boolean;
  data?: unknown;
  message?: string;
  [key: string]: unknown;
}

// Auth token management
interface AuthData {
  token: string;
  expires_at: string;
  user: {
    id: number;
    name: string;
    email: string;
    [key: string]: unknown;
  };
}

const getAuthToken = (): string | null => {
  const authData = getAuthData();
  if (!authData) return null;

  // Check if token is expired
  if (isTokenExpired(authData.expires_at)) {
    logout(true); // Show notification when session expires
    return null;
  }

  return authData.token;
};

const getAuthData = (): AuthData | null => {
  try {
    const authDataStr = localStorage.getItem("auth_data");
    return authDataStr ? JSON.parse(authDataStr) : null;
  } catch {
    return null;
  }
};

const setAuthData = (data: AuthData) => {
  localStorage.setItem("auth_data", JSON.stringify(data));
};

const isTokenExpired = (expiresAt: string): boolean => {
  // If user chose to remember login, don't auto-expire tokens
  const authData = getAuthData();
  if (authData && localStorage.getItem("rememberMe") === "true") {
    return false;
  }
  return new Date() >= new Date(expiresAt);
};

const logout = (showNotification = false) => {
  // セッション期限切れの通知を表示
  if (showNotification) {
    // カスタムイベントを発火して通知を表示
    window.dispatchEvent(new CustomEvent('sessionExpired', {
      detail: { message: 'セッションの有効期限が切れました。再度ログインしてください。' }
    }));
    
    // 通知表示時はローカルストレージのクリアのみ行い、リダイレクトは App.tsx で制御
    clearAuthData();
  } else {
    performLogout();
  }
};

const clearAuthData = () => {
  localStorage.removeItem("auth_data");
  localStorage.removeItem("auth_token"); // 後方互換性のため
  localStorage.removeItem("rememberMe"); // Clear remember me setting
  sessionStorage.removeItem("redirectAfterLogin"); // Clear any pending redirects
};

const performLogout = () => {
  clearAuthData();

  // Redirect to login page
  window.location.href = "/";
};

// Automatic token expiration checker
let tokenCheckInterval: number | null = null;

const startTokenExpirationChecker = () => {
  // Clear existing interval
  if (tokenCheckInterval) {
    clearInterval(tokenCheckInterval);
  }

  // Check token expiration every minute
  tokenCheckInterval = window.setInterval(() => {
    const authData = getAuthData();
    if (authData && isTokenExpired(authData.expires_at)) {
      logout(true); // Show notification when session expires
    }
  }, 60000); // Check every minute
};

const stopTokenExpirationChecker = () => {
  if (tokenCheckInterval) {
    clearInterval(tokenCheckInterval);
    tokenCheckInterval = null;
  }
};

// API request helper
const apiRequest = async (endpoint: string, options: RequestInit = {}): Promise<ApiResponse> => {
  const token = getAuthToken();

  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };


  const response = await fetch(`${API_BASE}${endpoint}`, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));

    // 401 Unauthorized error - token expired or invalid
    if (response.status === 401) {
      
      // ログインエンドポイントの場合はlogout()を呼ばない（認証失敗のためログアウト不要）
      if (!endpoint.includes("/login")) {
        logout(true); // Show notification for unauthorized access
      }
      
      // 401エラーはエラーとしてthrowして、呼び出し元でcatchできるようにする
      const authError = new Error("認証が必要です");
      (authError as Error & { response?: { status: number; data: unknown } }).response = { status: response.status, data: error };
      throw authError;
    }

    const apiError = new Error(error.message || `Request failed: ${response.status} ${response.statusText}`);
    (apiError as Error & { response?: { status: number; data: unknown } }).response = { status: response.status, data: error };
    throw apiError;
  }

  const result = (await response.json()) as ApiResponse;
  return result;
};

// Auth API
export const authAPI = {
  login: async (email: string, password: string, rememberMe: boolean = false) => {
    const response = await apiRequest("/login", {
      method: "POST",
      body: JSON.stringify({ email, password, remember_me: rememberMe }),
    });

    // Save auth data after successful login
    if (response.success && response.data) {
      const responseData = response.data as { token: string; expires_at: string; user: AuthData["user"] };
      const authData: AuthData = {
        token: responseData.token,
        expires_at: responseData.expires_at,
        user: responseData.user,
      };
      setAuthData(authData);

      // Store remember me preference
      localStorage.setItem("rememberMe", rememberMe.toString());
    }

    return response;
  },

  register: async (userData: { name: string; email: string; password: string; password_confirmation: string; gender: string; phone: string }) => {
    const response = await apiRequest("/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });

    // Save auth data after successful registration
    if (response.success && response.data) {
      const responseData = response.data as { token: string; expires_at: string; user: AuthData["user"] };
      const authData: AuthData = {
        token: responseData.token,
        expires_at: responseData.expires_at,
        user: responseData.user,
      };
      setAuthData(authData);
    }

    return response;
  },

  logout: async () => {
    try {
      await apiRequest("/logout", { method: "POST" });
    } catch (error) {
    } finally {
      performLogout(); // Always clear local auth data and redirect
    }
  },

  getUser: async () => {
    return apiRequest("/user");
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const authData = getAuthData();
    return !!(authData && !isTokenExpired(authData.expires_at));
  },

  // Get current user from stored auth data
  getCurrentUser: () => {
    const authData = getAuthData();
    return authData?.user || null;
  },

  // Start automatic token expiration checking
  startTokenChecker: () => {
    if (authAPI.isAuthenticated()) {
      startTokenExpirationChecker();
    }
  },

  // Stop automatic token expiration checking
  stopTokenChecker: stopTokenExpirationChecker,

  // Delete user account
  updateUser: async (userData: { name?: string; email?: string; phone?: string; [key: string]: unknown }) => {
    const response = await apiRequest("/user", {
      method: "PUT",
      body: JSON.stringify(userData),
    });

    // Update local auth data if update successful
    if (response.success && response.data) {
      const authData = getAuthData();
      if (authData) {
        const updatedUserData = response.data as { user: AuthData["user"] };
        const updatedAuthData: AuthData = {
          ...authData,
          user: { ...authData.user, ...updatedUserData.user },
        };
        setAuthData(updatedAuthData);
      }
    }

    return response;
  },

  deleteAccount: async () => {
    return apiRequest("/user", {
      method: "DELETE",
    });
  },

  // Change password
  changePassword: async (passwordData: {
    currentPassword: string;
    newPassword: string;
    password_confirmation: string;
  }) => {
    return apiRequest("/user/change-password", {
      method: "POST",
      body: JSON.stringify(passwordData),
    });
  },

  // Export utility functions
  getAuthData,
  isTokenExpired
};

// Menstrual Cycle API
export const menstrualCycleAPI = {
  // Get all cycles
  getCycles: async () => {
    return apiRequest("/menstrual-cycles");
  },

  // Start new cycle
  startCycle: async (data: { start_date: string; flow_intensity?: number; symptoms?: string[]; notes?: string }) => {
    return apiRequest("/menstrual-cycles", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // End cycle
  endCycle: async (endDate: string) => {
    return apiRequest(`/menstrual-cycles/end`, {
      method: "POST",
      body: JSON.stringify({ end_date: endDate }),
    });
  },

  // Get calendar data for specific month
  getCalendarData: async (year: number, month: number) => {
    return apiRequest(`/menstrual-cycles/calendar?year=${year}&month=${month}`);
  },

  // Get current status (active cycle, etc.)
  getCurrentStatus: async () => {
    return apiRequest("/menstrual-cycles/status");
  },

  // Get active cycle for specific end date
  getActiveCycleForEndDate: async (endDate: string) => {
    return apiRequest(`/menstrual-cycles/active-for-end-date?end_date=${endDate}`);
  },

  // Get specific cycle details
  getCycle: async (cycleId: number) => {
    return apiRequest(`/menstrual-cycles/${cycleId}`);
  },

  // Update existing cycle
  updateCycle: async (
    cycleId: number,
    data: {
      start_date?: string;
      end_date?: string;
      flow_intensity?: number;
      symptoms?: string[];
      notes?: string;
    }
  ) => {
    return apiRequest(`/menstrual-cycles/${cycleId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  // Delete cycle
  deleteCycle: async (cycleId: number) => {
    return apiRequest(`/menstrual-cycles/${cycleId}`, {
      method: "DELETE",
    });
  },

  // Delete all cycles
  deleteAllCycles: async () => {
    return apiRequest("/menstrual-cycles/delete-all", {
      method: "DELETE",
    });
  },

  // Delete all user data except account
  deleteAllUserData: async () => {
    return apiRequest("/user/delete-all-data", {
      method: "DELETE",
    });
  },
};

// User Data API
export const userDataAPI = {
  // Get user settings
  getSettings: async () => {
    return apiRequest("/user-data/settings");
  },

  // Save user settings
  saveSettings: async (settings: Record<string, unknown>) => {
    return apiRequest("/user-data/settings", {
      method: "POST",
      body: JSON.stringify({ settings }),
    });
  },

  // Get daily symptoms
  getDailySymptoms: async (date?: string) => {
    const url = date ? `/user-data/daily-symptoms?date=${date}` : "/user-data/daily-symptoms";
    return apiRequest(url);
  },

  // Save daily symptoms
  saveDailySymptoms: async (date: string, symptomsData: Record<string, unknown>) => {
    return apiRequest("/user-data/daily-symptoms", {
      method: "POST",
      body: JSON.stringify({
        date,
        symptoms_data: symptomsData,
      }),
    });
  },

  // Get pregnancy records
  getPregnancyRecords: async () => {
    return apiRequest("/user-data/pregnancy-records");
  },

  // Save pregnancy records
  savePregnancyRecords: async (startDate: string | null, recordsData: unknown, isActive: boolean = true) => {
    return apiRequest("/user-data/pregnancy-records", {
      method: "POST",
      body: JSON.stringify({
        start_date: startDate,
        records_data: recordsData,
        is_active: isActive,
      }),
    });
  },

  // Get medical records
  getMedicalRecords: async () => {
    return apiRequest("/user-data/medical-records");
  },

  // Save medical records
  saveMedicalRecords: async (type: "hospitalVisits" | "testResults" | "medications", data: unknown[]) => {
    return apiRequest("/user-data/medical-records", {
      method: "POST",
      body: JSON.stringify({
        type,
        data,
      }),
    });
  },
};

// Partner API
export const partnerAPI = {
  // Generate invite code (female users only)
  generateInvite: async () => {
    return apiRequest("/partner/generate-invite", {
      method: "POST",
    });
  },

  // Join partner with invite code (male users only)
  joinPartner: async (inviteCode: string) => {
    return apiRequest("/partner/join", {
      method: "POST",
      body: JSON.stringify({ invite_code: inviteCode }),
    });
  },

  // Get partner status
  getStatus: async () => {
    return apiRequest("/partner/status");
  },

  // Disconnect from partner
  disconnect: async () => {
    return apiRequest("/partner/disconnect", {
      method: "DELETE",
    });
  },

  // Get partner's calendar data
  getPartnerCalendar: async (year: number, month: number) => {
    return apiRequest(`/partner/calendar?year=${year}&month=${month}`);
  },
};

// Daily Symptoms API
export const dailySymptomsAPI = {
  // Save daily symptoms data
  saveSymptoms: async (data: { date: string; symptoms: string[]; mood: string; healthNotes: string; flowIntensity?: number }) => {
    return apiRequest("/daily-symptoms", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Get daily symptoms for a specific date
  getSymptoms: async (date: string) => {
    return apiRequest(`/daily-symptoms?date=${date}`);
  },

  // Get daily symptoms for a date range (for statistics)
  getSymptomsRange: async (startDate: string, endDate: string) => {
    return apiRequest(`/daily-symptoms/range?start_date=${startDate}&end_date=${endDate}`);
  },

  // Bulk save symptoms data (for migration)
  bulkSaveSymptoms: async (
    symptomsData: Array<{
      date: string;
      symptoms: string[];
      mood: string;
      healthNotes: string;
      flowIntensity?: number;
    }>
  ) => {
    return apiRequest("/daily-symptoms/bulk", {
      method: "POST",
      body: JSON.stringify({ symptoms_data: symptomsData }),
    });
  },

  // Delete all symptoms data
  deleteAllSymptoms: async () => {
    return apiRequest("/daily-symptoms/delete-all", {
      method: "DELETE",
    });
  },
};
