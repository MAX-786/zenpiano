import React, { useRef, useEffect, useState } from 'react';
import { Song, Note, GameState, MidiLogEntry } from '../types';
import { COLORS, VISUALIZER_CONFIG } from '../constants';

// Helper to convert MIDI note to note name
const midiToNoteName = (midi: number): string => {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midi / 12) - 1;
  const noteName = noteNames[midi % 12];
  return `${noteName}${octave}`;
};

interface VisualizerProps {
  song: Song;
  activeNotes: Set<number>;
  gameState: GameState;
  onSongComplete: () => void;
  onLogEntry: (entry: MidiLogEntry) => void;
  onProgress: (time: number) => void;
  setGameState: (state: GameState) => void;
  showNoteLabels?: boolean;
}

const Visualizer: React.FC<VisualizerProps> = ({ 
  song, 
  activeNotes, 
  gameState, 
  onSongComplete,
  onLogEntry,
  onProgress,
  setGameState,
  showNoteLabels = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentTimeRef = useRef(0);
  const noteIndexRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  const songDuration = song.duration;
  
  // Clone notes to track "played" state locally without mutating props directly (though shallow copy of array of objs)
  // Ideally, use a deeper state management, but for perf refs are good.
  const notesRef = useRef<Note[]>(JSON.parse(JSON.stringify(song.notes)));

  const reset = () => {
    currentTimeRef.current = 0;
    noteIndexRef.current = 0;
    notesRef.current = JSON.parse(JSON.stringify(song.notes));
    lastFrameTimeRef.current = performance.now();
  };

  useEffect(() => {
    if (gameState === GameState.IDLE) {
      reset();
    }
  }, [gameState, song]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = (timestamp: number) => {
      if (!lastFrameTimeRef.current) lastFrameTimeRef.current = timestamp;
      const deltaTime = (timestamp - lastFrameTimeRef.current) / 1000;
      lastFrameTimeRef.current = timestamp;

      // Handle Resize
      canvas.width = canvas.parentElement?.clientWidth || 800;
      canvas.height = canvas.parentElement?.clientHeight || 600;

      const width = canvas.width;
      const height = canvas.height;
      const pixelsPerSecond = height / VISUALIZER_CONFIG.lookAhead;

      // --- GAME LOGIC (WAIT MODE) ---
      
      let isWaiting = false;
      let waitingForNotes: number[] = [];

      if (gameState === GameState.PLAYING) {
        // Look at upcoming notes
        // We only care about the "next" unplayed note(s) that should be played NOW or passed
        // For wait mode, we usually stop time at the note's start time until it is hit.
        
        let canAdvance = true;
        
        // Find the earliest unplayed note that we have reached time-wise
        const nextNoteIndex = noteIndexRef.current;
        
        // Check all notes that are "current" (within a tiny window or past due)
        // In strict wait mode, if time >= note.time and !note.played, we pause time.
        
        for (let i = nextNoteIndex; i < notesRef.current.length; i++) {
            const note = notesRef.current[i];
            
            // If note is far in future, we can stop checking
            if (note.time > currentTimeRef.current + 0.05) break; 
            
            if (!note.played) {
                // We reached a note that hasn't been played.
                // Check if user is pressing it right now
                if (activeNotes.has(note.midi)) {
                    note.played = true;
                    // Log success
                    onLogEntry({
                        timestamp: Date.now(),
                        note: note.midi,
                        isCorrect: true,
                        expectedNote: note.midi
                    });
                    
                    // Visual flare? (Handled in draw)
                } else {
                    // User is NOT pressing it.
                    // We must WAIT.
                    canAdvance = false;
                    waitingForNotes.push(note.midi);
                    isWaiting = true;
                    
                    // Check for incorrect inputs (notes pressed that aren't expected)
                    // Simplified: just check activeNotes against waiting notes
                    // In a real app we'd debounce this logging
                }
            }
        }

        // Clean up index
        while(notesRef.current[noteIndexRef.current]?.played) {
            noteIndexRef.current++;
        }

        if (canAdvance) {
            currentTimeRef.current += deltaTime;
        }
        
        // Check for song end
        if (currentTimeRef.current > songDuration + 1) { // 1 sec buffer
            setGameState(GameState.FINISHED);
            onSongComplete();
        }
        
        onProgress(currentTimeRef.current);
      }

      // --- DRAWING ---

      // Background - always draw
      ctx.fillStyle = COLORS.polarNight.darker;
      ctx.fillRect(0, 0, width, height);

      // Hit Line
      const hitLineY = height - 100; // Fixed hit line position
      ctx.strokeStyle = COLORS.polarNight.light;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, hitLineY);
      ctx.lineTo(width, hitLineY);
      ctx.stroke();
      
      // Add subtle glow line
      ctx.strokeStyle = 'rgba(136, 192, 208, 0.3)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, hitLineY);
      ctx.lineTo(width, hitLineY);
      ctx.stroke();

      // Draw Notes
      // Visible Range: [currentTime - 1, currentTime + lookAhead]
      const minVisibleTime = currentTimeRef.current - 1;
      const maxVisibleTime = currentTimeRef.current + VISUALIZER_CONFIG.lookAhead;

      // Map MIDI key to X position (range 36 to 96 for 61-key keyboard)
      const minMidi = 36;
      const maxMidi = 96;
      const keyWidth = width / (maxMidi - minMidi + 1);

      notesRef.current.forEach(note => {
        if (note.time < minVisibleTime || note.time > maxVisibleTime) return;

        // Y position: 
        // Note time T should hit the line at T = currentTime.
        // Distance from line = (NoteTime - CurrentTime) * speed
        // Y = HitLineY - (NoteTime - CurrentTime) * PixelsPerSecond
        // Note: As time advances (CurrentTime increases), Y increases (moves down).
        
        const timeDiff = note.time - currentTimeRef.current;
        const y = hitLineY - (timeDiff * pixelsPerSecond);
        const noteHeight = Math.max(note.duration * pixelsPerSecond, 20); // Minimum height for visibility
        const x = (note.midi - minMidi) * keyWidth;
        const isBlack = [1, 3, 6, 8, 10].includes(note.midi % 12);

        // Color Logic
        let color = isBlack ? COLORS.aurora.purple : COLORS.frost.cyan;
        if (note.played) color = COLORS.aurora.green;
        else if (isWaiting && note.time <= currentTimeRef.current + 0.05 && !note.played) {
             // This is the note we are waiting for
             color = COLORS.aurora.yellow;
        }

        // Draw Note Rect with rounded corners
        const noteX = x + 2;
        const noteY = y - noteHeight;
        const noteW = keyWidth - 4;
        const noteH = noteHeight;
        const radius = 4;
        
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(noteX, noteY, noteW, noteH, radius);
        ctx.fill();
        
        // Glow if active/waiting
        if ((isWaiting && note.time <= currentTimeRef.current + 0.05 && !note.played) || (note.played && (note.time + note.duration > currentTimeRef.current))) {
           ctx.shadowBlur = 15;
           ctx.shadowColor = color;
           ctx.beginPath();
           ctx.roundRect(noteX, noteY, noteW, noteH, radius);
           ctx.fill();
           ctx.shadowBlur = 0;
        }
        
        // Draw note label if enabled and note is tall enough
        if (showNoteLabels && noteH > 18 && noteW > 12) {
          const noteName = midiToNoteName(note.midi);
          ctx.save();
          ctx.font = 'bold 10px Inter, system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Text color based on background
          if (note.played) {
            ctx.fillStyle = '#1a472a'; // Dark green for played
          } else if (isWaiting && note.time <= currentTimeRef.current + 0.05 && !note.played) {
            ctx.fillStyle = '#5c4813'; // Dark yellow for waiting
          } else {
            ctx.fillStyle = isBlack ? '#4a2040' : '#1a3a4a'; // Dark purple/cyan
          }
          
          // Draw text centered in the note
          const textX = noteX + noteW / 2;
          const textY = noteY + noteH / 2;
          ctx.fillText(noteName, textX, textY);
          ctx.restore();
        }
      });
      
      // Draw "Waiting" Overlay if paused
      if (isWaiting && Math.floor(timestamp / 500) % 2 === 0) { // Blink
         ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
         ctx.fillRect(0, 0, width, height);
         
         ctx.font = "18px Inter, system-ui, sans-serif";
         ctx.fillStyle = COLORS.snowStorm.light;
         ctx.textAlign = "center";
         ctx.fillText("Waiting for input...", width / 2, height / 2);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render(performance.now());

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameState, activeNotes, song, setGameState, onSongComplete, onLogEntry, onProgress, showNoteLabels]);

  return <canvas ref={canvasRef} className="w-full h-full block" />;
};

export default Visualizer;