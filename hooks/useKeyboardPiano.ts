import { useState, useEffect, useCallback } from 'react';

// Helper to convert MIDI note to note name
export const midiToNoteName = (midi: number): string => {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midi / 12) - 1;
  const noteName = noteNames[midi % 12];
  return `${noteName}${octave}`;
};

// Complete 61-key keyboard mapping (MIDI 36-96, C2 to C7)
// Layout designed for maximum coverage using standard QWERTY keyboard
// Primary layout uses familiar piano-style arrangement

export const KEYBOARD_MAP: Record<string, { midi: number; label: string; isBlack: boolean }> = {
  // === OCTAVE 2 (C2-B2) - Comma/Period row + some number keys ===
  ',': { midi: 36, label: 'C2', isBlack: false },
  'l': { midi: 37, label: 'C#2', isBlack: true },
  '.': { midi: 38, label: 'D2', isBlack: false },
  ';': { midi: 39, label: 'D#2', isBlack: true },
  '/': { midi: 40, label: 'E2', isBlack: false },
  'shift': { midi: 41, label: 'F2', isBlack: false },  // Shift key for F2
  '\\': { midi: 42, label: 'F#2', isBlack: true },
  '`': { midi: 43, label: 'G2', isBlack: false },
  '1': { midi: 44, label: 'G#2', isBlack: true },
  'tab': { midi: 45, label: 'A2', isBlack: false },
  'capslock': { midi: 46, label: 'A#2', isBlack: true },
  'a': { midi: 47, label: 'B2', isBlack: false },
  
  // === OCTAVE 3 (C3-B3) - Z row for white keys, upper row for black ===
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
  
  // === OCTAVE 4 (C4-B4) - Q row for white keys, number row for black ===
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
  
  // === OCTAVE 5 (C5-B5) - Continuing Q row + brackets ===
  'i': { midi: 72, label: 'C5', isBlack: false },
  '9': { midi: 73, label: 'C#5', isBlack: true },
  'o': { midi: 74, label: 'D5', isBlack: false },
  '0': { midi: 75, label: 'D#5', isBlack: true },
  'p': { midi: 76, label: 'E5', isBlack: false },
  '[': { midi: 77, label: 'F5', isBlack: false },
  '=': { midi: 78, label: 'F#5', isBlack: true },
  ']': { midi: 79, label: 'G5', isBlack: false },
  '-': { midi: 80, label: 'G#5', isBlack: true },
  'backspace': { midi: 81, label: 'A5', isBlack: false },
  
  // === OCTAVE 5 continued + OCTAVE 6 (A#5-C7) - Function keys area ===
  // These are less accessible but complete the 61 keys
  'f1': { midi: 82, label: 'A#5', isBlack: true },
  'f2': { midi: 83, label: 'B5', isBlack: false },
  'f3': { midi: 84, label: 'C6', isBlack: false },
  'f4': { midi: 85, label: 'C#6', isBlack: true },
  'f5': { midi: 86, label: 'D6', isBlack: false },
  'f6': { midi: 87, label: 'D#6', isBlack: true },
  'f7': { midi: 88, label: 'E6', isBlack: false },
  'f8': { midi: 89, label: 'F6', isBlack: false },
  'f9': { midi: 90, label: 'F#6', isBlack: true },
  'f10': { midi: 91, label: 'G6', isBlack: false },
  'f11': { midi: 92, label: 'G#6', isBlack: true },
  'f12': { midi: 93, label: 'A6', isBlack: false },
  'insert': { midi: 94, label: 'A#6', isBlack: true },
  'home': { midi: 95, label: 'B6', isBlack: false },
  'pageup': { midi: 96, label: 'C7', isBlack: false },
  
  // === Duplicate/Alternative mappings for ergonomics ===
  'f': { midi: 65, label: 'F4', isBlack: false },  // Alternative F4
  'k': { midi: 71, label: 'B4', isBlack: false },  // Alternative B4
  "'": { midi: 79, label: 'G5', isBlack: false },  // Alternative G5
  '4': { midi: 64, label: 'E4', isBlack: false },  // Alternative E4
  '8': { midi: 72, label: 'C5', isBlack: false },  // Alternative C5
};

// Create a reverse mapping from MIDI to keyboard key(s) - primary key first
export const MIDI_TO_KEYBOARD: Record<number, string[]> = {};
Object.entries(KEYBOARD_MAP).forEach(([key, { midi }]) => {
  if (!MIDI_TO_KEYBOARD[midi]) {
    MIDI_TO_KEYBOARD[midi] = [];
  }
  // Add to front if it's a "main" key (single letters), otherwise to back
  const isMainKey = /^[a-z]$/.test(key);
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

    // Get key in lowercase, handle special keys
    let key = event.key.toLowerCase();
    
    // Handle special key names
    if (event.key === 'Tab') key = 'tab';
    else if (event.key === 'CapsLock') key = 'capslock';
    else if (event.key === 'Shift') key = 'shift';
    else if (event.key === 'Backspace') key = 'backspace';
    else if (event.key === 'Insert') key = 'insert';
    else if (event.key === 'Home') key = 'home';
    else if (event.key === 'PageUp') key = 'pageup';
    else if (event.key.startsWith('F') && event.key.length <= 3) key = event.key.toLowerCase();
    
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
    
    // Get key in lowercase, handle special keys
    let key = event.key.toLowerCase();
    
    // Handle special key names
    if (event.key === 'Tab') key = 'tab';
    else if (event.key === 'CapsLock') key = 'capslock';
    else if (event.key === 'Shift') key = 'shift';
    else if (event.key === 'Backspace') key = 'backspace';
    else if (event.key === 'Insert') key = 'insert';
    else if (event.key === 'Home') key = 'home';
    else if (event.key === 'PageUp') key = 'pageup';
    else if (event.key.startsWith('F') && event.key.length <= 3) key = event.key.toLowerCase();
    
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
