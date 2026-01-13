import React, { useMemo } from 'react';
import { COLORS } from '../constants';
import { midiToNoteName, MIDI_TO_KEYBOARD } from '../hooks/useKeyboardPiano';

interface PianoProps {
  activeNotes: Set<number>;
  startNote?: number;
  endNote?: number;
  showLabels?: boolean;
  showKeyboardShortcuts?: boolean;
  keyboardModeEnabled?: boolean;
}

const Piano: React.FC<PianoProps> = ({ 
  activeNotes, 
  startNote = 36,  // C2 - better range for 61 keys
  endNote = 96,    // C7
  showLabels = true,
  showKeyboardShortcuts = true,
  keyboardModeEnabled = false,
}) => {
  const keys = useMemo(() => {
    const k = [];
    for (let i = startNote; i <= endNote; i++) {
      const isBlack = [1, 3, 6, 8, 10].includes(i % 12);
      const noteName = midiToNoteName(i);
      const keyboardKeys = MIDI_TO_KEYBOARD[i] || [];
      k.push({ midi: i, isBlack, noteName, keyboardKeys });
    }
    return k;
  }, [startNote, endNote]);

  const whiteKeys = useMemo(() => keys.filter(k => !k.isBlack), [keys]);
  const isNoteActive = (midi: number) => activeNotes.has(midi);

  // Calculate position for black keys relative to white keys
  const getBlackKeyPosition = (midi: number) => {
    // Count white keys before this black key
    let whiteKeyIndex = 0;
    for (let i = startNote; i < midi; i++) {
      if (![1, 3, 6, 8, 10].includes(i % 12)) {
        whiteKeyIndex++;
      }
    }
    // Black keys sit between white keys, offset to the left
    return whiteKeyIndex;
  };

  return (
    <div className="relative w-full h-32 flex justify-center bg-slate-900 shadow-xl overflow-hidden border-t-2 border-slate-700">
      {/* White Keys */}
      {whiteKeys.map((key) => {
        const isActive = isNoteActive(key.midi);
        const isC = key.midi % 12 === 0; // Highlight C notes
        return (
          <div
            key={key.midi}
            className={`
              relative flex-1 h-full 
              border-r border-slate-300/50 last:border-r-0 
              rounded-b-md transition-all duration-75
              flex flex-col items-center justify-end pb-1
              ${isActive 
                ? 'bg-gradient-to-b from-cyan-200 to-cyan-300 shadow-inner shadow-cyan-400/50' 
                : isC 
                  ? 'bg-gradient-to-b from-slate-50 to-slate-100' 
                  : 'bg-gradient-to-b from-white to-slate-50'
              }
            `}
          >
            {/* Note Label */}
            {showLabels && (
              <span className={`
                text-[8px] font-medium leading-none mb-0.5
                ${isActive ? 'text-cyan-700' : isC ? 'text-slate-600' : 'text-slate-400'}
              `}>
                {key.noteName}
              </span>
            )}
            {/* Keyboard Shortcut */}
            {showKeyboardShortcuts && keyboardModeEnabled && key.keyboardKeys.length > 0 && (
              <span className={`
                text-[9px] font-bold uppercase px-1 py-0.5 rounded
                ${isActive 
                  ? 'bg-cyan-500 text-white' 
                  : 'bg-slate-200 text-slate-600'
                }
              `}>
                {key.keyboardKeys[0]}
              </span>
            )}
          </div>
        );
      })}
      
      {/* Black Keys - Absolute positioned overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{ paddingRight: `${100 / whiteKeys.length}%` }}>
        {keys.filter(k => k.isBlack).map((key) => {
          const isActive = isNoteActive(key.midi);
          const position = getBlackKeyPosition(key.midi);
          const whiteKeyWidth = 100 / whiteKeys.length;
          const leftPos = (position * whiteKeyWidth) - (whiteKeyWidth * 0.3);
          
          return (
            <div
              key={key.midi}
              className={`
                absolute top-0 h-[60%] rounded-b-md shadow-lg
                flex flex-col items-center justify-end pb-1
                transition-all duration-75 z-10
                ${isActive 
                  ? 'bg-gradient-to-b from-purple-400 to-purple-500 shadow-purple-500/50' 
                  : 'bg-gradient-to-b from-slate-700 to-slate-900'
                }
              `}
              style={{
                left: `${leftPos}%`,
                width: `${whiteKeyWidth * 0.6}%`,
              }}
            >
              {/* Note Label */}
              {showLabels && (
                <span className={`
                  text-[7px] font-medium leading-none mb-0.5
                  ${isActive ? 'text-purple-100' : 'text-slate-400'}
                `}>
                  {key.noteName}
                </span>
              )}
              {/* Keyboard Shortcut */}
              {showKeyboardShortcuts && keyboardModeEnabled && key.keyboardKeys.length > 0 && (
                <span className={`
                  text-[8px] font-bold uppercase px-1 rounded
                  ${isActive 
                    ? 'bg-purple-300 text-purple-900' 
                    : 'bg-slate-600 text-slate-300'
                  }
                `}>
                  {key.keyboardKeys[0]}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Piano;