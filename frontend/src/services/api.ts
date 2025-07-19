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

  return response.json();
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
  endCycle: async (cycleId: number, endDate: string) => {
    return apiRequest(`/menstrual-cycles/${cycleId}/end`, {
      method: 'PATCH',
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
};