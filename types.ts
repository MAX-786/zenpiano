export interface Note {
  midi: number;
  time: number; // Start time in seconds
  duration: number; // Duration in seconds
  velocity: number;
  played?: boolean;
  id: string;
}

export interface Song {
  title: string;
  artist: string;
  notes: Note[];
  duration: number;
}

export interface MidiLogEntry {
  timestamp: number;
  note: number;
  expectedNote?: number;
  isCorrect: boolean;
  timeGap?: number; // How late/early (ms)
  velocity?: number; // Added for dynamics analysis
}

export enum GameState {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  FINISHED = 'FINISHED'
}

export interface CoachInsight {
  summary: string;
  strengths: string[];
  improvements: string[];
  practiceRoutine: string;
  moodAnalysis?: string; // New Empathy feature
}

// -- Persistence Schemas --

export interface User {
  id: string;
  username: string;
  skillLevel: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface Session {
  id: string;
  userId: string;
  startTime: number;
  endTime: number;
  songTitle: string;
  accuracy: number;
  totalNotes: number;
  averageVelocity: number; // 0-1
}

export interface PersistenceData {
  users: User[];
  sessions: Session[];
  logs: Record<string, MidiLogEntry[]>; // SessionId -> Logs
}