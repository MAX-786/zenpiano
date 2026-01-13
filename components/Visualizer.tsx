import React, { useRef, useEffect, useState } from 'react';
import { Song, Note, GameState, MidiLogEntry } from '../types';
import { COLORS, VISUALIZER_CONFIG } from '../constants';

interface VisualizerProps {
  song: Song;
  activeNotes: Set<number>;
  gameState: GameState;
  onSongComplete: () => void;
  onLogEntry: (entry: MidiLogEntry) => void;
  onProgress: (time: number) => void;
  setGameState: (state: GameState) => void;
}

const Visualizer: React.FC<VisualizerProps> = ({ 
  song, 
  activeNotes, 
  gameState, 
  onSongComplete,
  onLogEntry,
  onProgress,
  setGameState
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

      // Background
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

      // Draw Notes
      // Visible Range: [currentTime - 1, currentTime + lookAhead]
      const minVisibleTime = currentTimeRef.current - 1;
      const maxVisibleTime = currentTimeRef.current + VISUALIZER_CONFIG.lookAhead;

      // Map MIDI key to X position (assume range 21 to 108)
      const minMidi = 21;
      const maxMidi = 108;
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
        const noteHeight = note.duration * pixelsPerSecond;
        const x = (note.midi - minMidi) * keyWidth;

        // Color Logic
        let color = COLORS.frost.blue;
        if (note.played) color = COLORS.aurora.green;
        else if (isWaiting && note.time <= currentTimeRef.current + 0.05 && !note.played) {
             // This is the note we are waiting for
             color = COLORS.aurora.yellow;
        }

        // Draw Note Rect
        // We draw "up" from y if we think of duration, but typically piano rolls draw length upwards if falling?
        // Actually, if it falls, the "Start" is the bottom of the block.
        // So the block extends from Y (start) upwards to Y - height.
        
        ctx.fillStyle = color;
        // Rounded rect mock
        ctx.fillRect(x + 1, y - noteHeight, keyWidth - 2, noteHeight);
        
        // Glow if active/waiting
        if ((isWaiting && note.time <= currentTimeRef.current + 0.05 && !note.played) || note.played && (note.time + note.duration > currentTimeRef.current)) {
           ctx.shadowBlur = 15;
           ctx.shadowColor = color;
           ctx.fillRect(x + 1, y - noteHeight, keyWidth - 2, noteHeight);
           ctx.shadowBlur = 0;
        }
      });
      
      // Draw "Waiting" Overlay if paused
      if (isWaiting && Math.floor(timestamp / 500) % 2 === 0) { // Blink
         ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
         ctx.fillRect(0, 0, width, height);
         
         ctx.font = "20px Inter";
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
  }, [gameState, activeNotes, song, setGameState, onSongComplete, onLogEntry, onProgress]);

  return <canvas ref={canvasRef} className="w-full h-full block" />;
};

export default Visualizer;