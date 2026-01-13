import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export enum View {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  PRACTICE = 'PRACTICE'
}

interface UIStore {
  // View Management
  currentView: View;
  showCoach: boolean;
  
  // UI Preferences (persisted)
  showMidiStatus: boolean;
  showProgressBar: boolean;
  
  // Actions
  setCurrentView: (view: View) => void;
  setShowCoach: (show: boolean) => void;
  toggleCoach: () => void;
  navigateTo: (view: View) => void;
  setShowMidiStatus: (show: boolean) => void;
  setShowProgressBar: (show: boolean) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      currentView: View.LOGIN,
      showCoach: false,
      showMidiStatus: true,
      showProgressBar: true,

      setCurrentView: (currentView) => set({ currentView }),
      
      setShowCoach: (showCoach) => set({ showCoach }),
      
      toggleCoach: () => set((state) => ({ 
        showCoach: !state.showCoach 
      })),
      
      navigateTo: (currentView) => set({ currentView }),
      
      setShowMidiStatus: (showMidiStatus) => set({ showMidiStatus }),
      
      setShowProgressBar: (showProgressBar) => set({ showProgressBar }),
    }),
    {
      name: 'zenpiano-ui',
      storage: createJSONStorage(() => localStorage),
      // Persist UI preferences
      partialize: (state) => ({
        showMidiStatus: state.showMidiStatus,
        showProgressBar: state.showProgressBar,
        currentView: state.currentView,
      }),
    }
  )
);
