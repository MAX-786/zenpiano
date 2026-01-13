import React, { useMemo } from 'react';
import { COLORS } from '../constants';

interface PianoProps {
  activeNotes: Set<number>;
  startNote?: number;
  endNote?: number;
}

const Piano: React.FC<PianoProps> = ({ activeNotes, startNote = 21, endNote = 108 }) => {
  const keys = useMemo(() => {
    const k = [];
    for (let i = startNote; i <= endNote; i++) {
      const isBlack = [1, 3, 6, 8, 10].includes(i % 12);
      k.push({ midi: i, isBlack });
    }
    return k;
  }, [startNote, endNote]);

  const isNoteActive = (midi: number) => activeNotes.has(midi);

  return (
    <div className="relative w-full h-32 flex justify-center bg-gray-900 shadow-xl overflow-hidden rounded-b-lg border-t-4 border-gray-700">
      {keys.map((key) => {
        if (key.isBlack) return null; // Render whites first
        const isActive = isNoteActive(key.midi);
        return (
          <div
            key={key.midi}
            className={`relative flex-1 h-full border-r border-gray-300 last:border-r-0 rounded-b-md transition-colors duration-100 ${
              isActive ? 'bg-cyan-200' : 'bg-gray-100'
            }`}
          />
        );
      })}
      
      {/* Absolute positioning for black keys to overlay correctly */}
      <div className="absolute inset-0 flex pointer-events-none">
         {keys.map((key, index) => {
           if (!key.isBlack) {
              // Invisible spacer for white keys to maintain alignment logic if needed, 
              // but purely visual overlay is easier:
              // We need to calculate position. simpler approach:
              return <div key={key.midi} className="flex-1 invisible" />;
           }
           const isActive = isNoteActive(key.midi);
           return (
             <div
               key={key.midi}
               className="flex-1 flex justify-center z-10"
             >
                <div 
                  className={`w-[60%] h-[60%] rounded-b-md shadow-md transition-colors duration-100 -mx-[30%] ${
                    isActive ? 'bg-purple-400' : 'bg-gray-800'
                  }`}
                />
             </div>
           );
         })}
      </div>
    </div>
  );
};

export default Piano;