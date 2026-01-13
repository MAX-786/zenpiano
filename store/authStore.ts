import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiresAt: number | null; // Unix timestamp
  isAuthenticated: boolean;
  
  // Actions
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string, expiresIn: number) => void;
  login: (user: User, accessToken: string, refreshToken: string, expiresIn: number) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  isTokenExpired: () => boolean;
  shouldRefreshToken: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      tokenExpiresAt: null,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      setTokens: (accessToken, refreshToken, expiresIn) => {
        const expiresAt = Date.now() + expiresIn * 1000; // Convert to milliseconds
        set({ 
          accessToken, 
          refreshToken, 
          tokenExpiresAt: expiresAt 
        });
      },
      
      login: (user, accessToken, refreshToken, expiresIn) => {
        const expiresAt = Date.now() + expiresIn * 1000;
        set({ 
          user, 
          accessToken,
          refreshToken,
          tokenExpiresAt: expiresAt,
          isAuthenticated: true 
        });
      },
      
      logout: () => set({ 
        user: null, 
        accessToken: null,
        refreshToken: null,
        tokenExpiresAt: null,
        isAuthenticated: false 
      }),
      
      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null
      })),

      isTokenExpired: () => {
        const { tokenExpiresAt } = get();
        if (!tokenExpiresAt) return true;
        return Date.now() >= tokenExpiresAt;
      },

      shouldRefreshToken: () => {
        const { tokenExpiresAt } = get();
        if (!tokenExpiresAt) return false;
        // Refresh if token expires in less than 2 minutes
        return Date.now() >= tokenExpiresAt - 2 * 60 * 1000;
      }
    }),
    {
      name: 'zenpiano-auth',
      storage: createJSONStorage(() => localStorage),
      // Persist all auth data including tokens
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        tokenExpiresAt: state.tokenExpiresAt,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
