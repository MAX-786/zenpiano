import { useState, useEffect, useCallback } from 'react';

// Keyboard to MIDI note mapping
// Two octaves starting from C4 (middle C = MIDI 60)
// Lower row: white keys (A-L, ;)
// Upper row: black keys (W, E, T, Y, U, O, P)
export const KEYBOARD_MAP: Record<string, { midi: number; label: string; isBlack: boolean }> = {
  // First octave - C4 to B4
  'a': { midi: 60, label: 'C4', isBlack: false },
  'w': { midi: 61, label: 'C#4', isBlack: true },
  's': { midi: 62, label: 'D4', isBlack: false },
  'e': { midi: 63, label: 'D#4', isBlack: true },
  'd': { midi: 64, label: 'E4', isBlack: false },
  'f': { midi: 65, label: 'F4', isBlack: false },
  't': { midi: 66, label: 'F#4', isBlack: true },
  'g': { midi: 67, label: 'G4', isBlack: false },
  'y': { midi: 68, label: 'G#4', isBlack: true },
  'h': { midi: 69, label: 'A4', isBlack: false },
  'u': { midi: 70, label: 'A#4', isBlack: true },
  'j': { midi: 71, label: 'B4', isBlack: false },
  
  // Second octave - C5 to B5
  'k': { midi: 72, label: 'C5', isBlack: false },
  'o': { midi: 73, label: 'C#5', isBlack: true },
  'l': { midi: 74, label: 'D5', isBlack: false },
  'p': { midi: 75, label: 'D#5', isBlack: true },
  ';': { midi: 76, label: 'E5', isBlack: false },
  "'": { midi: 77, label: 'F5', isBlack: false },
  '[': { midi: 78, label: 'F#5', isBlack: true },
  
  // Extend with lower octave using Z row
  'z': { midi: 48, label: 'C3', isBlack: false },
  'x': { midi: 50, label: 'D3', isBlack: false },
  'c': { midi: 52, label: 'E3', isBlack: false },
  'v': { midi: 53, label: 'F3', isBlack: false },
  'b': { midi: 55, label: 'G3', isBlack: false },
  'n': { midi: 57, label: 'A3', isBlack: false },
  'm': { midi: 59, label: 'B3', isBlack: false },
};

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
