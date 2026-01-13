import { create } from 'zustand';
import { MidiLogEntry } from '../types';
import { SessionService } from '../services/db';

interface SessionStore {
  // Session Logs
  sessionLog: MidiLogEntry[];
  unsyncedLogs: MidiLogEntry[];
  lastSyncTime: number;
  
  // Actions
  addLogEntry: (entry: MidiLogEntry) => void;
  clearLogs: () => void;
  syncLogs: (sessionId: string) => Promise<void>;
  getSessionStats: () => {
    totalNotes: number;
    correctNotes: number;
    accuracy: number;
    averageVelocity: number;
  };
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  sessionLog: [],
  unsyncedLogs: [],
  lastSyncTime: 0,

  addLogEntry: (entry) => set((state) => ({
    sessionLog: [...state.sessionLog, entry],
    unsyncedLogs: [...state.unsyncedLogs, entry],
  })),

  clearLogs: () => set({
    sessionLog: [],
    unsyncedLogs: [],
    lastSyncTime: 0,
  }),

  syncLogs: async (sessionId) => {
    const { unsyncedLogs } = get();
    
    if (unsyncedLogs.length === 0) return;
    
    try {
      await SessionService.syncLogs(sessionId, unsyncedLogs);
      set({ 
        unsyncedLogs: [],
        lastSyncTime: Date.now(),
      });
    } catch (error) {
      console.error('Failed to sync logs:', error);
    }
  },

  getSessionStats: () => {
    const { sessionLog } = get();
    const correctNotes = sessionLog.filter(e => e.isCorrect).length;
    const totalNotes = sessionLog.length;
    const accuracy = totalNotes > 0 ? Math.round((correctNotes / totalNotes) * 100) : 0;
    
    const velocities = sessionLog
      .filter(e => e.velocity !== undefined)
      .map(e => e.velocity || 0);
    const averageVelocity = velocities.length > 0
      ? velocities.reduce((a, b) => a + b, 0) / velocities.length
      : 0;

    return {
      totalNotes,
      correctNotes,
      accuracy,
      averageVelocity,
    };
  },
}));
