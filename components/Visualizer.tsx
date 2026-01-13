import React, { useRef, useEffect, useCallback } from 'react';
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
  const lastFrameTimeRef = useRef<number | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const songDuration = song.duration;
  
  // Clone notes to track "played" state locally
  const notesRef = useRef<Note[]>(JSON.parse(JSON.stringify(song.notes)));
  
  // Store callbacks in refs to avoid re-creating animation loop
  const activeNotesRef = useRef(activeNotes);
  const gameStateRef = useRef(gameState);
  const showNoteLabelsRef = useRef(showNoteLabels);
  
  // Update refs when props change
  useEffect(() => {
    activeNotesRef.current = activeNotes;
  }, [activeNotes]);
  
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);
  
  useEffect(() => {
    showNoteLabelsRef.current = showNoteLabels;
  }, [showNoteLabels]);

  const reset = useCallback(() => {
    currentTimeRef.current = 0;
    noteIndexRef.current = 0;
    notesRef.current = JSON.parse(JSON.stringify(song.notes));
    lastFrameTimeRef.current = null;
  }, [song.notes]);

  // Reset when game becomes IDLE or song changes
  useEffect(() => {
    if (gameState === GameState.IDLE) {
      reset();
    }
  }, [gameState, reset]);
  
  // Reset notes when song changes
  useEffect(() => {
    notesRef.current = JSON.parse(JSON.stringify(song.notes));
  }, [song]);

  // Main render loop - only recreate when song or callbacks change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = (timestamp: number) => {
      // Initialize lastFrameTime on first frame
      if (lastFrameTimeRef.current === null) {
        lastFrameTimeRef.current = timestamp;
      }
      
      const deltaTime = Math.min((timestamp - lastFrameTimeRef.current) / 1000, 0.1); // Cap at 100ms to prevent jumps
      lastFrameTimeRef.current = timestamp;

      // Handle Resize
      const parentWidth = canvas.parentElement?.clientWidth || 800;
      const parentHeight = canvas.parentElement?.clientHeight || 600;
      
      if (canvas.width !== parentWidth || canvas.height !== parentHeight) {
        canvas.width = parentWidth;
        canvas.height = parentHeight;
      }

      const width = canvas.width;
      const height = canvas.height;
      const pixelsPerSecond = height / VISUALIZER_CONFIG.lookAhead;
      
      // Read current state from refs
      const currentGameState = gameStateRef.current;
      const currentActiveNotes = activeNotesRef.current;
      const currentShowLabels = showNoteLabelsRef.current;

      // --- GAME LOGIC (WAIT MODE) ---
      
      let isWaiting = false;
      let waitingForNotes: number[] = [];

      if (currentGameState === GameState.PLAYING) {
        let canAdvance = true;
        const nextNoteIndex = noteIndexRef.current;
        
        for (let i = nextNoteIndex; i < notesRef.current.length; i++) {
            const note = notesRef.current[i];
            
            if (note.time > currentTimeRef.current + 0.05) break; 
            
            if (!note.played) {
                if (currentActiveNotes.has(note.midi)) {
                    note.played = true;
                    onLogEntry({
                        timestamp: Date.now(),
                        note: note.midi,
                        isCorrect: true,
                        expectedNote: note.midi
                    });
                } else {
                    canAdvance = false;
                    waitingForNotes.push(note.midi);
                    isWaiting = true;
                }
            }
        }

        while(notesRef.current[noteIndexRef.current]?.played) {
            noteIndexRef.current++;
        }

        if (canAdvance) {
            currentTimeRef.current += deltaTime;
        }
        
        if (currentTimeRef.current > songDuration + 1) {
            setGameState(GameState.FINISHED);
            onSongComplete();
        }
        
        onProgress(currentTimeRef.current);
      }

      // --- DRAWING ---

      // Background - ALWAYS draw first
      ctx.fillStyle = COLORS.polarNight.darker;
      ctx.fillRect(0, 0, width, height);

      // Hit Line
      const hitLineY = height - 100;
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
      const minVisibleTime = currentTimeRef.current - 1;
      const maxVisibleTime = currentTimeRef.current + VISUALIZER_CONFIG.lookAhead;

      const minMidi = 36;
      const maxMidi = 96;
      const keyWidth = width / (maxMidi - minMidi + 1);

      notesRef.current.forEach(note => {
        if (note.time + note.duration < minVisibleTime || note.time > maxVisibleTime) return;

        const timeDiff = note.time - currentTimeRef.current;
        const y = hitLineY - (timeDiff * pixelsPerSecond);
        const noteHeight = Math.max(note.duration * pixelsPerSecond, 20);
        const x = (note.midi - minMidi) * keyWidth;
        const isBlack = [1, 3, 6, 8, 10].includes(note.midi % 12);

        let color = isBlack ? COLORS.aurora.purple : COLORS.frost.cyan;
        if (note.played) color = COLORS.aurora.green;
        else if (isWaiting && note.time <= currentTimeRef.current + 0.05 && !note.played) {
             color = COLORS.aurora.yellow;
        }

        const noteX = x + 2;
        const noteY = y - noteHeight;
        const noteW = keyWidth - 4;
        const noteH = noteHeight;
        const radius = 4;
        
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(noteX, noteY, noteW, noteH, radius);
        ctx.fill();
        
        if ((isWaiting && note.time <= currentTimeRef.current + 0.05 && !note.played) || (note.played && (note.time + note.duration > currentTimeRef.current))) {
           ctx.shadowBlur = 15;
           ctx.shadowColor = color;
           ctx.beginPath();
           ctx.roundRect(noteX, noteY, noteW, noteH, radius);
           ctx.fill();
           ctx.shadowBlur = 0;
        }
        
        if (currentShowLabels && noteH > 18 && noteW > 12) {
          const noteName = midiToNoteName(note.midi);
          ctx.save();
          ctx.font = 'bold 10px Inter, system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          if (note.played) {
            ctx.fillStyle = '#1a472a';
          } else if (isWaiting && note.time <= currentTimeRef.current + 0.05 && !note.played) {
            ctx.fillStyle = '#5c4813';
          } else {
            ctx.fillStyle = isBlack ? '#4a2040' : '#1a3a4a';
          }
          
          const textX = noteX + noteW / 2;
          const textY = noteY + noteH / 2;
          ctx.fillText(noteName, textX, textY);
          ctx.restore();
        }
      });
      
      // Draw "Waiting" Overlay
      if (isWaiting && Math.floor(timestamp / 500) % 2 === 0) {
         ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
         ctx.fillRect(0, 0, width, height);
         
         ctx.font = "18px Inter, system-ui, sans-serif";
         ctx.fillStyle = COLORS.snowStorm.light;
         ctx.textAlign = "center";
         ctx.fillText("Waiting for input...", width / 2, height / 2);
      }
      
      // Draw IDLE state message
      if (currentGameState === GameState.IDLE) {
        ctx.font = "24px Inter, system-ui, sans-serif";
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.textAlign = "center";
        ctx.fillText("Press Start to begin", width / 2, height / 2);
      }

      animationFrameIdRef.current = requestAnimationFrame(render);
    };

    // Start the animation loop
    animationFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      // Reset lastFrameTime so next loop starts fresh
      lastFrameTimeRef.current = null;
    };
  }, [song, songDuration, setGameState, onSongComplete, onLogEntry, onProgress]);

  return <canvas ref={canvasRef} className="w-full h-full block" />;
};

export default Visualizer;