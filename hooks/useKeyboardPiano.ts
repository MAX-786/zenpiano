import { useState, useEffect, useCallback } from 'react';

// Helper to convert MIDI note to note name
export const midiToNoteName = (midi: number): string => {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midi / 12) - 1;
  const noteName = noteNames[midi % 12];
  return `${noteName}${octave}`;
};

// Comprehensive keyboard to MIDI note mapping
// Optimized layout for playability - similar to DAW virtual keyboards
// Uses QWERTY layout with intuitive black/white key arrangement

export const KEYBOARD_MAP: Record<string, { midi: number; label: string; isBlack: boolean }> = {
  // === OCTAVE 3 (C3-B3) - Z row for white keys, S/D/G/H/J for black ===
  'z': { midi: 48, label: 'C3', isBlack: false },
  's': { midi: 49, label: 'C#3', isBlack: true },
  'x': { midi: 50, label: 'D3', isBlack: false },
  'd': { midi: 51, label: 'D#3', isBlack: true },
  'c': { midi: 52, label: 'E3', isBlack: false },
  'v': { midi: 53, label: 'F3', isBlack: false },
  'g': { midi: 54, label: 'F#3', isBlack: true },
  'b': { midi: 55, label: 'G3', isBlack: false },
  'h': { midi: 56, label: 'G#3', isBlack: true },
  'n': { midi: 57, label: 'A3', isBlack: false },
  'j': { midi: 58, label: 'A#3', isBlack: true },
  'm': { midi: 59, label: 'B3', isBlack: false },
  
  // === OCTAVE 4 (C4-B4) - Q row for white keys, 2/3/5/6/7 for black ===
  // This is Middle C octave - most important!
  'q': { midi: 60, label: 'C4', isBlack: false },  // Middle C
  '2': { midi: 61, label: 'C#4', isBlack: true },
  'w': { midi: 62, label: 'D4', isBlack: false },
  '3': { midi: 63, label: 'D#4', isBlack: true },
  'e': { midi: 64, label: 'E4', isBlack: false },
  'r': { midi: 65, label: 'F4', isBlack: false },
  '5': { midi: 66, label: 'F#4', isBlack: true },
  't': { midi: 67, label: 'G4', isBlack: false },
  '6': { midi: 68, label: 'G#4', isBlack: true },
  'y': { midi: 69, label: 'A4', isBlack: false },  // A440
  '7': { midi: 70, label: 'A#4', isBlack: true },
  'u': { midi: 71, label: 'B4', isBlack: false },
  
  // === OCTAVE 5 (C5-G5) - Continuing with I/O/P/[/] ===
  'i': { midi: 72, label: 'C5', isBlack: false },
  '9': { midi: 73, label: 'C#5', isBlack: true },
  'o': { midi: 74, label: 'D5', isBlack: false },
  '0': { midi: 75, label: 'D#5', isBlack: true },
  'p': { midi: 76, label: 'E5', isBlack: false },
  '[': { midi: 77, label: 'F5', isBlack: false },
  '=': { midi: 78, label: 'F#5', isBlack: true },
  ']': { midi: 79, label: 'G5', isBlack: false },
  
  // === OCTAVE 2 (C2-B2) - Using comma/period area ===
  ',': { midi: 36, label: 'C2', isBlack: false },
  'l': { midi: 37, label: 'C#2', isBlack: true },
  '.': { midi: 38, label: 'D2', isBlack: false },
  ';': { midi: 39, label: 'D#2', isBlack: true },
  '/': { midi: 40, label: 'E2', isBlack: false },
  
  // === Additional mappings using number row for extended range ===
  '`': { midi: 44, label: 'G#2', isBlack: true },
  '1': { midi: 45, label: 'A2', isBlack: false },
  
  // === Alternative/duplicate keys for ergonomics ===
  'a': { midi: 60, label: 'C4', isBlack: false },  // Alternative Middle C (easier reach)
  'f': { midi: 65, label: 'F4', isBlack: false },  // Alternative F4
  'k': { midi: 71, label: 'B4', isBlack: false },  // Alternative B4
  "'": { midi: 79, label: 'G5', isBlack: false },  // Alternative G5
};

// Create a reverse mapping from MIDI to keyboard key(s) - primary key first
export const MIDI_TO_KEYBOARD: Record<number, string[]> = {};
Object.entries(KEYBOARD_MAP).forEach(([key, { midi }]) => {
  if (!MIDI_TO_KEYBOARD[midi]) {
    MIDI_TO_KEYBOARD[midi] = [];
  }
  // Add to front if it's a "main" key (letters Q-U, Z-M), otherwise to back
  const isMainKey = /^[qwertyuiopzxcvbnm]$/.test(key);
  if (isMainKey) {
    MIDI_TO_KEYBOARD[midi].unshift(key);
  } else {
    MIDI_TO_KEYBOARD[midi].push(key);
  }
});

export const useKeyboardPiano = (enabled: boolean = true) => {
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;
    
    // Ignore if user is typing in an input field
    if (event.target instanceof HTMLInputElement || 
        event.target instanceof HTMLTextAreaElement) {
      return;
    }

    const key = event.key.toLowerCase();
    
    // Prevent repeat events when key is held down
    if (pressedKeys.has(key)) return;
    
    const mapping = KEYBOARD_MAP[key];
    if (mapping) {
      event.preventDefault();
      setPressedKeys(prev => {
        const newSet = new Set(prev);
        newSet.add(key);
        return newSet;
      });
      setActiveNotes(prev => {
        const newSet = new Set(prev);
        newSet.add(mapping.midi);
        return newSet;
      });
    }
  }, [enabled, pressedKeys]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;
    
    const key = event.key.toLowerCase();
    const mapping = KEYBOARD_MAP[key];
    
    if (mapping) {
      event.preventDefault();
      setPressedKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
      setActiveNotes(prev => {
        const newSet = new Set(prev);
        newSet.delete(mapping.midi);
        return newSet;
      });
    }
  }, [enabled]);

  // Handle window blur - release all notes
  const handleBlur = useCallback(() => {
    setActiveNotes(new Set());
    setPressedKeys(new Set());
  }, []);

  useEffect(() => {
    if (!enabled) {
      setActiveNotes(new Set());
      setPressedKeys(new Set());
      return;
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [enabled, handleKeyDown, handleKeyUp, handleBlur]);

  return { activeNotes, pressedKeys };
};
