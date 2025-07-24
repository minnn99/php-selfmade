// API Base URL
const API_BASE = 'http://localhost:8000/api';

// Auth token management
interface AuthData {
  token: string;
  expires_at: string;
  user: any;
}

const getAuthToken = (): string | null => {
  const authData = getAuthData();
  if (!authData) return null;
  
  // Check if token is expired
  if (isTokenExpired(authData.expires_at)) {
    logout();
    return null;
  }
  
  return authData.token;
};

const getAuthData = (): AuthData | null => {
  try {
    const authDataStr = localStorage.getItem('auth_data');
    return authDataStr ? JSON.parse(authDataStr) : null;
  } catch {
    return null;
  }
};

const setAuthData = (data: AuthData) => {
  localStorage.setItem('auth_data', JSON.stringify(data));
};

const isTokenExpired = (expiresAt: string): boolean => {
  return new Date() >= new Date(expiresAt);
};

const logout = () => {
  localStorage.removeItem('auth_data');
  localStorage.removeItem('auth_token'); // 後方互換性のため
  sessionStorage.removeItem('redirectAfterLogin'); // Clear any pending redirects
  
  // Redirect to login page
  window.location.href = '/';
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
      console.log('Token expired, logging out...');
      logout();
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
const apiRequest = async (
  endpoint: string, 
  options: RequestInit = {}
): Promise<any> => {
  const token = getAuthToken();
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  console.log('API Request:', {
    endpoint,
    hasToken: !!token,
    method: options.method || 'GET'
  });

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    console.error('API Error:', {
      status: response.status,
      statusText: response.statusText,
      error,
      endpoint,
      token: !!token
    });
    
    const apiError = new Error(error.message || `Request failed: ${response.status} ${response.statusText}`);
    (apiError as any).response = { status: response.status, data: error };
    throw apiError;
  }

  const result = await response.json();
  console.log('API Response:', { endpoint, result });
  return result;
};

// Auth API
export const authAPI = {
  login: async (email: string, password: string, rememberMe: boolean = false) => {
    const response = await apiRequest('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, remember_me: rememberMe }),
    });
    
    // Save auth data after successful login
    if (response.success && response.data) {
      const authData: AuthData = {
        token: response.data.token,
        expires_at: response.data.expires_at,
        user: response.data.user
      };
      setAuthData(authData);
    }
    
    return response;
  },

  register: async (userData: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    gender: string;
    phone: string;
  }) => {
    const response = await apiRequest('/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    // Save auth data after successful registration
    if (response.success && response.data) {
      const authData: AuthData = {
        token: response.data.token,
        expires_at: response.data.expires_at,
        user: response.data.user
      };
      setAuthData(authData);
    }
    
    return response;
  },

  logout: async () => {
    try {
      await apiRequest('/logout', { method: 'POST' });
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      logout(); // Always clear local auth data
    }
  },

  getUser: async () => {
    return apiRequest('/user');
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
  deleteAccount: async () => {
    return apiRequest('/user', {
      method: 'DELETE',
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
    return apiRequest('/menstrual-cycles');
  },

  // Start new cycle
  startCycle: async (data: {
    start_date: string;
    flow_intensity?: number;
    symptoms?: string[];
    notes?: string;
  }) => {
    return apiRequest('/menstrual-cycles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // End cycle
  endCycle: async (endDate: string) => {
    return apiRequest(`/menstrual-cycles/end`, {
      method: 'POST',
      body: JSON.stringify({ end_date: endDate }),
    });
  },

  // Get calendar data for specific month
  getCalendarData: async (year: number, month: number) => {
    return apiRequest(`/menstrual-cycles/calendar?year=${year}&month=${month}`);
  },

  // Get current status (active cycle, etc.)
  getCurrentStatus: async () => {
    return apiRequest('/menstrual-cycles/status');
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
  updateCycle: async (cycleId: number, data: {
    start_date?: string;
    end_date?: string;
    flow_intensity?: number;
    symptoms?: string[];
    notes?: string;
  }) => {
    return apiRequest(`/menstrual-cycles/${cycleId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete cycle
  deleteCycle: async (cycleId: number) => {
    return apiRequest(`/menstrual-cycles/${cycleId}`, {
      method: 'DELETE',
    });
  },

  // Delete all cycles
  deleteAllCycles: async () => {
    return apiRequest('/menstrual-cycles/delete-all', {
      method: 'DELETE',
    });
  },
};