// API Base URL
const API_BASE = 'http://localhost:8000/api';

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
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
    throw new Error(error.message || `Request failed: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  console.log('API Response:', { endpoint, result });
  return result;
};

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    return apiRequest('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  register: async (userData: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    gender: string;
    phone: string;
  }) => {
    return apiRequest('/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  logout: async () => {
    return apiRequest('/logout', { method: 'POST' });
  },

  getUser: async () => {
    return apiRequest('/user');
  },
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