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
  
  // Keyboard Piano Mode
  keyboardModeEnabled: boolean;
  showKeyboardMap: boolean;
  
  // Actions
  setCurrentView: (view: View) => void;
  setShowCoach: (show: boolean) => void;
  toggleCoach: () => void;
  navigateTo: (view: View) => void;
  setShowMidiStatus: (show: boolean) => void;
  setShowProgressBar: (show: boolean) => void;
  
  // Keyboard Piano Actions
  setKeyboardModeEnabled: (enabled: boolean) => void;
  toggleKeyboardMode: () => void;
  setShowKeyboardMap: (show: boolean) => void;
  toggleKeyboardMap: () => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      currentView: View.LOGIN,
      showCoach: false,
      showMidiStatus: true,
      showProgressBar: true,
      keyboardModeEnabled: false,
      showKeyboardMap: false,

      setCurrentView: (currentView) => set({ currentView }),
      
      setShowCoach: (showCoach) => set({ showCoach }),
      
      toggleCoach: () => set((state) => ({ 
        showCoach: !state.showCoach 
      })),
      
      navigateTo: (currentView) => set({ currentView }),
      
      setShowMidiStatus: (showMidiStatus) => set({ showMidiStatus }),
      
      setShowProgressBar: (showProgressBar) => set({ showProgressBar }),
      
      setKeyboardModeEnabled: (keyboardModeEnabled) => set({ keyboardModeEnabled }),
      
      toggleKeyboardMode: () => set((state) => ({ 
        keyboardModeEnabled: !state.keyboardModeEnabled,
        // Auto-show keyboard map when enabling keyboard mode
        showKeyboardMap: !state.keyboardModeEnabled ? true : state.showKeyboardMap
      })),
      
      setShowKeyboardMap: (showKeyboardMap) => set({ showKeyboardMap }),
      
      toggleKeyboardMap: () => set((state) => ({ 
        showKeyboardMap: !state.showKeyboardMap 
      })),
    }),
    {
      name: 'zenpiano-ui',
      storage: createJSONStorage(() => localStorage),
      // Persist UI preferences
      partialize: (state) => ({
        showMidiStatus: state.showMidiStatus,
        showProgressBar: state.showProgressBar,
        currentView: state.currentView,
        keyboardModeEnabled: state.keyboardModeEnabled,
      }),
    }
  )
);
