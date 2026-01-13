import { useEffect, useRef } from 'react';
import * as Tone from 'tone';

export const useAudio = (activeNotes: Set<number>) => {
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const lastActiveNotes = useRef<Set<number>>(new Set());
  const isReady = useRef(false);

  useEffect(() => {
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: "triangle"
      },
      envelope: {
        attack: 0.02,
        decay: 0.1,
        sustain: 0.3,
        release: 1
      }
    }).toDestination();
    
    // Add some reverb for that "Zen" feel
    const reverb = new Tone.Reverb({
      decay: 4,
      wet: 0.5
    }).toDestination();
    
    synth.connect(reverb);
    synthRef.current = synth;

    return () => {
      synth.dispose();
      reverb.dispose();
    };
  }, []);

  // Initialize audio context on user interaction (handled externally usually, but checking here)
  const startAudio = async () => {
    if (Tone.context.state !== 'running') {
      await Tone.start();
    }
    isReady.current = true;
  };

  useEffect(() => {
    if (!synthRef.current || !isReady.current) return;

    // Determine notes to trigger attack
    activeNotes.forEach(note => {
      if (!lastActiveNotes.current.has(note)) {
        const freq = Tone.Frequency(note, "midi").toFrequency();
        synthRef.current?.triggerAttack(freq);
      }
    });

    // Determine notes to trigger release
    lastActiveNotes.current.forEach(note => {
      if (!activeNotes.has(note)) {
        const freq = Tone.Frequency(note, "midi").toFrequency();
        synthRef.current?.triggerRelease(freq);
      }
    });

    lastActiveNotes.current = new Set(activeNotes);
  }, [activeNotes]);

  return { startAudio };
};