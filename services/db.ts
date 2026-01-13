import { User, Session, MidiLogEntry } from '../types';

// In a real environment, this points to your backend
const API_BASE = '/api'; 

export const AuthService = {
  login: async (username: string, password: string): Promise<User> => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      if (!response.ok) {
         // Fallback for demo environment if API is missing
         console.warn("Backend unreachable, returning mock user");
         return {
           id: 'demo-user-id',
           username,
           skillLevel: 'Beginner'
         };
      }
      return await response.json();
    } catch (e) {
      console.warn("Network error, returning mock user for UI demo");
      return {
         id: 'demo-user-id',
         username,
         skillLevel: 'Beginner'
      };
    }
  },
  
  logout: async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, { method: 'POST' });
    } catch (e) { console.error(e); }
  }
};

export const SessionService = {
  saveSession: async (session: Omit<Session, 'id'>, logs: MidiLogEntry[]): Promise<string> => {
    try {
      const response = await fetch(`${API_BASE}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session, logs })
      });
      
      if (!response.ok) throw new Error("Failed to save session");
      const data = await response.json();
      return data.id;
    } catch (e) {
      console.error("Save session failed (Backend missing in preview)", e);
      return crypto.randomUUID();
    }
  },

  syncLogs: async (sessionId: string, logs: MidiLogEntry[]) => {
    try {
        await fetch(`${API_BASE}/logs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, logs })
        });
    } catch (e) {
        console.error("Log sync failed");
    }
  },

  getUserStats: async (userId: string) => {
    try {
      const response = await fetch(`${API_BASE}/users/${userId}/stats`);
      if (!response.ok) throw new Error("Failed to fetch stats");
      return await response.json();
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
      const response = await fetch(`${API_BASE}/tokens/stats/${userId}`);
      if (!response.ok) throw new Error("Failed to fetch token stats");
      return await response.json();
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
