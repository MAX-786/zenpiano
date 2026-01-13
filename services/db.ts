import { User, Session, MidiLogEntry } from '../types';
import { apiRequest } from './apiClient';

// In a real environment, this points to your backend
const API_BASE = '/api'; 

export const AuthService = {
  login: async (username: string, password: string): Promise<{ 
    user: User; 
    accessToken: string; 
    refreshToken: string;
    expiresIn: number;
  }> => {
    try {
      // Don't use apiRequest here as it adds auth header
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      if (!response.ok) {
         // Throw error
         console.error("Login failed", response.statusText);
         return Promise.reject(new Error('Login failed'));
         
      }
      return await response.json();
    } catch (e) {
      console.warn("Network error, returning mock user for UI demo");
      const mockToken = 'demo-access-token-' + Math.random().toString(36);
      const mockRefresh = 'demo-refresh-token-' + Math.random().toString(36);
      return {
        user: {
           id: 'demo-user-id',
           username,
           skillLevel: 'Beginner'
        },
        accessToken: mockToken,
        refreshToken: mockRefresh,
        expiresIn: 900 // 15 minutes
      };
    }
  },
  
  logout: async (refreshToken: string) => {
    try {
      await apiRequest(`${API_BASE}/auth/logout`, { 
        method: 'POST',
        body: JSON.stringify({ refreshToken })
      });
    } catch (e) { 
      console.error(e); 
    }
  }
};

export const SessionService = {
  saveSession: async (session: Omit<Session, 'id'>, logs: MidiLogEntry[]): Promise<string> => {
    try {
      const data = await apiRequest<{ id: string }>(`${API_BASE}/sessions`, {
        method: 'POST',
        body: JSON.stringify({ session, logs })
      });
      return data.id;
    } catch (e) {
      console.error("Save session failed (Backend missing in preview)", e);
      return crypto.randomUUID();
    }
  },

  syncLogs: async (sessionId: string, logs: MidiLogEntry[]) => {
    try {
      await apiRequest(`${API_BASE}/logs`, {
        method: 'POST',
        body: JSON.stringify({ sessionId, logs })
      });
    } catch (e) {
      console.error("Log sync failed", e);
    }
  },

  getUserStats: async (userId: string) => {
    try {
      return await apiRequest(`${API_BASE}/users/${userId}/stats`);
    } catch (e) {
      console.warn("Fetch stats failed (Backend missing), returning mock stats");
      // Return mock stats so the dashboard doesn't crash in preview
      return {
        totalSessions: 12,
        totalMinutes: 45,
        avgAccuracy: 78,
        recentSessions: [],
        troubleNotes: { 66: 5, 69: 3 }
      };
    }
  }
};

export const TokenService = {
  getStats: async (userId: string) => {
    try {
      return await apiRequest(`${API_BASE}/tokens/stats/${userId}`);
    } catch (e) {
      console.warn("Fetch token stats failed, returning mock data");
      return {
        today: { totalTokens: 1286, promptTokens: 123, candidatesTokens: 181 },
        thisMonth: { totalTokens: 45000, promptTokens: 5200, candidatesTokens: 6800 },
        last30Days: { totalTokens: 52000, promptTokens: 6100, candidatesTokens: 7900 },
        dailyBreakdown: []
      };
    }
  }
};
