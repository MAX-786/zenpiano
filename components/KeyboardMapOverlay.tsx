import React, { useState } from 'react';
import { X, Keyboard, ChevronDown, ChevronUp } from 'lucide-react';
import { KEYBOARD_MAP } from '../hooks/useKeyboardPiano';

interface KeyboardMapOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  pressedKeys: Set<string>;
}

const KeyboardMapOverlay: React.FC<KeyboardMapOverlayProps> = ({ 
  isVisible, 
  onClose,
  pressedKeys 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!isVisible) return null;

  // Keyboard layout rows - standard QWERTY layout
  const numberRow = ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='];
  const qwertyRow = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']'];
  const asdfRow = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"];
  const zxcvRow = ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'];

  const KeyButton: React.FC<{ keyChar: string; small?: boolean }> = ({ keyChar, small = false }) => {
    const mapping = KEYBOARD_MAP[keyChar];
    const isPressed = pressedKeys.has(keyChar);
    const isBlack = mapping?.isBlack;
    const hasMidi = !!mapping;
    
    // Display special characters nicely
    const displayKey = keyChar === '`' ? '`' 
      : keyChar === ';' ? ';' 
      : keyChar === "'" ? "'" 
      : keyChar === ',' ? ','
      : keyChar === '.' ? '.'
      : keyChar === '/' ? '/'
      : keyChar === '[' ? '['
      : keyChar === ']' ? ']'
      : keyChar === '-' ? '-'
      : keyChar === '=' ? '='
      : keyChar;

    return (
      <div 
        className={`
          relative flex flex-col items-center justify-center
          ${small ? 'w-6 h-7' : 'w-7 h-8'} rounded-md font-mono text-xs font-bold
          transition-all duration-75 transform
          ${!hasMidi 
            ? 'bg-slate-800/50 text-slate-600 border border-slate-700/30'
            : isBlack 
              ? isPressed 
                ? 'bg-purple-400 text-slate-900 scale-95 shadow-inner shadow-purple-300' 
                : 'bg-slate-800 text-purple-300 border border-purple-500/40 hover:bg-slate-700'
              : isPressed 
                ? 'bg-cyan-400 text-slate-900 scale-95 shadow-inner shadow-cyan-300' 
                : 'bg-slate-100 text-slate-800 border border-slate-300 hover:bg-white'
          }
        `}
        title={hasMidi ? `${mapping.label} (MIDI ${mapping.midi})` : 'Not mapped'}
      >
        <span className="uppercase text-[9px] leading-none">{displayKey}</span>
        {hasMidi && (
          <span className={`text-[7px] font-normal leading-none ${isBlack ? 'text-purple-200/80' : 'text-slate-500'}`}>
            {mapping.label.replace('#', '♯')}
          </span>
        )}
      </div>
    );
  };

  return (
    <div 
      className={`
        fixed bottom-36 right-4 z-50
        backdrop-blur-xl bg-slate-900/95 
        rounded-2xl shadow-2xl shadow-black/50
        border border-slate-700/50
        transition-all duration-300 ease-out
        max-w-[95vw] overflow-hidden
        ${isExpanded ? 'w-auto' : 'w-14'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-2.5 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20">
            <Keyboard size={14} className="text-cyan-400" />
          </div>
          {isExpanded && (
            <span className="text-xs font-medium text-slate-200">Keyboard Map</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            {isExpanded ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-2.5 space-y-2">
          {/* Keyboard layout */}
          <div className="space-y-0.5">
            {/* Number row */}
            <div className="flex gap-0.5 justify-center">
              {numberRow.map(key => (
                <KeyButton key={key} keyChar={key} small />
              ))}
            </div>
            
            {/* QWERTY row */}
            <div className="flex gap-0.5 justify-center pl-2">
              {qwertyRow.map(key => (
                <KeyButton key={key} keyChar={key} small />
              ))}
            </div>
            
            {/* ASDF row */}
            <div className="flex gap-0.5 justify-center pl-4">
              {asdfRow.map(key => (
                <KeyButton key={key} keyChar={key} small />
              ))}
            </div>
            
            {/* ZXCV row */}
            <div className="flex gap-0.5 justify-center pl-6">
              {zxcvRow.map(key => (
                <KeyButton key={key} keyChar={key} small />
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-3 pt-1.5 border-t border-slate-700/50">
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded bg-slate-100 border border-slate-300" />
              <span className="text-[9px] text-slate-400">White</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded bg-slate-800 border border-purple-500/40" />
              <span className="text-[9px] text-slate-400">Black</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded bg-slate-800/50 border border-slate-700/30" />
              <span className="text-[9px] text-slate-500">N/A</span>
            </div>
          </div>

          {/* Quick tip */}
          <p className="text-center text-[8px] text-slate-500 leading-tight">
            Z-M = C3-B3 (Oct 3) • Q-] = C4-G5 (Oct 4-5)<br/>
            Number row = black keys • F1-F12 = higher octaves
          </p>
        </div>
      )}
    </div>
  );
};

export default KeyboardMapOverlay;
