import { create } from 'zustand';
import axios from 'axios';

export type UserRole = 'PATIENT' | 'DOCTOR' | 'RECEPTIONIST' | 'AMBULANCE_OPERATOR' | 'ADMIN';
export type Language = 'EN' | 'HI' | 'MR';

export interface UserProfile {
  id: string;
  fullName?: string;
  profilePhotoUrl?: string;
  [key: string]: any;
}

export interface User {
  id: string;
  phone: string;
  role: UserRole;
  languagePreference: Language;
  profile?: UserProfile;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  language: Language;
  selectedCountryCode: string;

  // Actions
  setLanguage: (lang: Language) => void;
  setCountryCode: (code: string) => void;
  sendOTP: (phone: string, countryCode?: string) => Promise<{ success: boolean; message: string }>;
  verifyOTP: (phone: string, otp: string, countryCode?: string) => Promise<{ isNewUser: boolean }>;
  loginWithCredentials: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
  initAuth: () => void;
}

const API_BASE = '/api/v1/auth';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('hs_token'),
  refreshToken: localStorage.getItem('hs_refresh_token'),
  isAuthenticated: !!localStorage.getItem('hs_token'),
  isLoading: false,
  language: (localStorage.getItem('hs_lang') as Language) || 'EN',
  selectedCountryCode: '+91',

  setLanguage: (lang: Language) => {
    localStorage.setItem('hs_lang', lang);
    set({ language: lang });
    // Switch document language attribute
    document.documentElement.lang = lang.toLowerCase();
  },

  setCountryCode: (code: string) => {
    set({ selectedCountryCode: code });
  },

  sendOTP: async (phone: string, countryCode?: string) => {
    set({ isLoading: true });
    try {
      const code = countryCode || get().selectedCountryCode;
      const res = await axios.post(`${API_BASE}/otp/send`, { phone, countryCode: code });
      set({ isLoading: false });
      return { success: true, message: res.data.message };
    } catch (err: any) {
      set({ isLoading: false });
      const errorMsg = err.response?.data?.error?.message || 'Failed to send OTP';
      throw new Error(errorMsg);
    }
  },

  verifyOTP: async (phone: string, otp: string, countryCode?: string) => {
    set({ isLoading: true });
    try {
      const code = countryCode || get().selectedCountryCode;
      const lang = get().language;
      const res = await axios.post(`${API_BASE}/otp/verify`, {
        phone,
        countryCode: code,
        otp,
        language: lang,
      });

      const { token, refreshToken, user, isNewUser } = res.data.data;

      localStorage.setItem('hs_token', token);
      localStorage.setItem('hs_refresh_token', refreshToken);
      localStorage.setItem('hs_user', JSON.stringify(user));

      set({
        token,
        refreshToken,
        user,
        isAuthenticated: true,
        isLoading: false,
      });

      return { isNewUser };
    } catch (err: any) {
      set({ isLoading: false });
      const errorMsg = err.response?.data?.error?.message || 'Failed to verify OTP';
      throw new Error(errorMsg);
    }
  },

  loginWithCredentials: async (identifier: string, password: string) => {
    set({ isLoading: true });
    try {
      const res = await axios.post(`${API_BASE}/login`, { identifier, password });
      const { token, refreshToken, user } = res.data.data;

      localStorage.setItem('hs_token', token);
      localStorage.setItem('hs_refresh_token', refreshToken);
      localStorage.setItem('hs_user', JSON.stringify(user));

      set({
        token,
        refreshToken,
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: any) {
      set({ isLoading: false });
      const errorMsg = err.response?.data?.error?.message || 'Invalid credentials';
      throw new Error(errorMsg);
    }
  },

  logout: () => {
    localStorage.removeItem('hs_token');
    localStorage.removeItem('hs_refresh_token');
    localStorage.removeItem('hs_user');
    set({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },

  initAuth: () => {
    const token = localStorage.getItem('hs_token');
    const userStr = localStorage.getItem('hs_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ user, token, isAuthenticated: true });
      } catch {
        get().logout();
      }
    }
  },
}));

export default useAuthStore;
