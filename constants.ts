import { Song } from './types';

// Nord Color Palette
export const COLORS = {
  polarNight: {
    darkest: '#242933',
    darker: '#2E3440',
    dark: '#3B4252',
    light: '#434C5E',
  },
  snowStorm: {
    light: '#ECEFF4',
    dark: '#D8DEE9',
  },
  frost: {
    green: '#8FBCBB',
    cyan: '#88C0D0',
    blue: '#81A1C1',
    darkBlue: '#5E81AC',
  },
  aurora: {
    red: '#BF616A',
    orange: '#D08770',
    yellow: '#EBCB8B',
    green: '#A3BE8C',
    purple: '#B48EAD',
  }
};

// Simple Gymnopédie No.1 fragment (Simplified for demo)
// Time is in seconds
export const SAMPLE_SONG: Song = {
  title: "Gymnopédie No.1 (Fragment)",
  artist: "Erik Satie",
  duration: 30,
  notes: [
    // Left Hand chords simplified + Right Hand melody
    { id: '1', midi: 43, time: 0.0, duration: 2.0, velocity: 0.6 }, // G2
    { id: '2', midi: 62, time: 1.0, duration: 1.0, velocity: 0.5 }, // D4
    { id: '3', midi: 66, time: 1.0, duration: 1.0, velocity: 0.5 }, // F#4
    { id: '4', midi: 69, time: 1.0, duration: 1.0, velocity: 0.5 }, // A4
    
    { id: '5', midi: 40, time: 3.0, duration: 2.0, velocity: 0.6 }, // D2
    { id: '6', midi: 62, time: 4.0, duration: 1.0, velocity: 0.5 }, // D4
    { id: '7', midi: 66, time: 4.0, duration: 1.0, velocity: 0.5 }, // F#4
    { id: '8', midi: 69, time: 4.0, duration: 1.0, velocity: 0.5 }, // A4

    // Melody enters
    { id: '9', midi: 43, time: 6.0, duration: 2.0, velocity: 0.6 }, // G2
    { id: '10', midi: 78, time: 6.0, duration: 2.5, velocity: 0.7 }, // F#5 (Melody)
    { id: '11', midi: 62, time: 7.0, duration: 1.0, velocity: 0.5 }, 
    { id: '12', midi: 66, time: 7.0, duration: 1.0, velocity: 0.5 }, 
    { id: '13', midi: 69, time: 7.0, duration: 1.0, velocity: 0.5 }, 

    { id: '14', midi: 40, time: 9.0, duration: 2.0, velocity: 0.6 }, // D2
    { id: '15', midi: 76, time: 9.0, duration: 2.5, velocity: 0.7 }, // A5 (Melody)
    { id: '16', midi: 62, time: 10.0, duration: 1.0, velocity: 0.5 }, 
    { id: '17', midi: 66, time: 10.0, duration: 1.0, velocity: 0.5 }, 
    { id: '18', midi: 69, time: 10.0, duration: 1.0, velocity: 0.5 }, 

    { id: '19', midi: 43, time: 12.0, duration: 2.0, velocity: 0.6 }, // G2
    { id: '20', midi: 73, time: 12.0, duration: 1.5, velocity: 0.7 }, // G5 (Melody)
    { id: '21', midi: 62, time: 13.0, duration: 1.0, velocity: 0.5 }, 
    { id: '22', midi: 66, time: 13.0, duration: 1.0, velocity: 0.5 }, 
    { id: '23', midi: 69, time: 13.0, duration: 1.0, velocity: 0.5 },
    
    { id: '24', midi: 74, time: 13.5, duration: 0.5, velocity: 0.7 }, // F#5 (Grace)
    
    { id: '25', midi: 40, time: 15.0, duration: 2.0, velocity: 0.6 }, // D2
    { id: '26', midi: 71, time: 15.0, duration: 1.0, velocity: 0.7 }, // C#5 (Melody)
    { id: '27', midi: 62, time: 16.0, duration: 1.0, velocity: 0.5 }, 
    { id: '28', midi: 66, time: 16.0, duration: 1.0, velocity: 0.5 }, 
    { id: '29', midi: 69, time: 16.0, duration: 1.0, velocity: 0.5 }, 

    { id: '30', midi: 70, time: 16.0, duration: 1.0, velocity: 0.7 }, // B4 (Melody)
    { id: '31', midi: 71, time: 17.0, duration: 1.0, velocity: 0.7 }, // C#5 (Melody)
    { id: '32', midi: 69, time: 18.0, duration: 2.0, velocity: 0.7 }, // D5 (Melody)
  ].sort((a, b) => a.time - b.time)
};

export const VISUALIZER_CONFIG = {
  lookAhead: 4, // Seconds to see into future
  noteSpeed: 100, // Pixels per second (calculated dynamically usually, but baseline)
  keyboardHeight: 120,
};