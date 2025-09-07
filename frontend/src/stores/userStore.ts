import { create } from 'zustand';
import { authAPI, partnerAPI } from '../services/api';

interface UserData {
  id?: number;
  name?: string;
  email?: string;
  gender?: string;
}

interface PartnerData {
  is_connected: boolean;
  partner?: {
    id: number;
    name: string;
  };
}

interface UserState {
  // User data
  user: UserData | null;
  isUserLoading: boolean;
  
  // Partner data
  partner: PartnerData | null;
  isPartnerLoading: boolean;
  
  // Computed values
  isMaleWithPartner: boolean;
  
  // Actions
  fetchUser: () => Promise<void>;
  fetchPartnerStatus: () => Promise<void>;
  initializeUserData: () => Promise<void>;
  clearUserData: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  // Initial state
  user: null,
  isUserLoading: false,
  partner: null,
  isPartnerLoading: false,
  isMaleWithPartner: false,
  
  // Fetch user data
  fetchUser: async () => {
    try {
      set({ isUserLoading: true });
      const response = await authAPI.getUser();
      const userData = response.data as { user?: UserData };
      
      set((state) => ({
        user: userData.user || null,
        isUserLoading: false,
        isMaleWithPartner: state.partner?.is_connected && 
          (userData.user?.gender === 'male' || userData.user?.gender === '男性')
      }));
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      set({ user: null, isUserLoading: false });
    }
  },
  
  // Fetch partner status
  fetchPartnerStatus: async () => {
    try {
      set({ isPartnerLoading: true });
      const response = await partnerAPI.getStatus();
      const partnerData = response.success ? response.data as PartnerData : { is_connected: false };
      
      set((state) => ({
        partner: partnerData,
        isPartnerLoading: false,
        isMaleWithPartner: partnerData.is_connected && 
          (state.user?.gender === 'male' || state.user?.gender === '男性')
      }));
    } catch (error) {
      console.error('Failed to fetch partner status:', error);
      set({ partner: { is_connected: false }, isPartnerLoading: false });
    }
  },
  
  // Initialize all user data
  initializeUserData: async () => {
    const { fetchUser, fetchPartnerStatus } = get();
    await Promise.all([
      fetchUser(),
      fetchPartnerStatus()
    ]);
  },
  
  // Clear user data (for logout)
  clearUserData: () => {
    set({
      user: null,
      partner: null,
      isUserLoading: false,
      isPartnerLoading: false,
      isMaleWithPartner: false
    });
  }
}));