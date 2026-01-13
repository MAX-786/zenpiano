import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { GameState, Song } from '../types';
import { SAMPLE_SONG } from '../constants';

interface GameStore {
  // Game State
  gameState: GameState;
  currentSong: Song;
  progress: number;
  isZenMode: boolean;
  startTime: number;
  currentSessionId: string | null;
  
  // Actions
  setGameState: (state: GameState) => void;
  setCurrentSong: (song: Song) => void;
  setProgress: (progress: number) => void;
  toggleZenMode: () => void;
  setZenMode: (isZen: boolean) => void;
  startSession: () => void;
  resetGame: () => void;
  finishSession: () => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      gameState: GameState.IDLE,
      currentSong: SAMPLE_SONG,
      progress: 0,
      isZenMode: false,
      startTime: 0,
      currentSessionId: null,

      setGameState: (gameState) => set({ gameState }),
      
      setCurrentSong: (currentSong) => set({ 
        currentSong,
        progress: 0,
        gameState: GameState.IDLE,
      }),
      
      setProgress: (progress) => set({ progress }),
      
      toggleZenMode: () => set((state) => ({ 
        isZenMode: !state.isZenMode 
      })),
      
      setZenMode: (isZenMode) => set({ isZenMode }),
      
      startSession: () => set({ 
        startTime: Date.now(),
        currentSessionId: crypto.randomUUID(),
        gameState: GameState.PLAYING,
        progress: 0,
      }),
      
      resetGame: () => set({ 
        gameState: GameState.IDLE,
        progress: 0,
        currentSessionId: null,
      }),
      
      finishSession: () => set({ 
        gameState: GameState.FINISHED,
      }),
    }),
    {
      name: 'zenpiano-game',
      storage: createJSONStorage(() => localStorage),
      // Persist preferences but not ephemeral game state
      partialize: (state) => ({
        isZenMode: state.isZenMode,
        currentSong: state.currentSong,
      }),
    }
  )
);
