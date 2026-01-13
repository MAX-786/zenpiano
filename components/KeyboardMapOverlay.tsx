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

  // Group keys by row for visual layout
  const topRow = ['w', 'e', 't', 'y', 'u', 'o', 'p', '['];
  const middleRow = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"];
  const bottomRow = ['z', 'x', 'c', 'v', 'b', 'n', 'm'];

  const KeyButton: React.FC<{ keyChar: string; className?: string }> = ({ keyChar, className = '' }) => {
    const mapping = KEYBOARD_MAP[keyChar];
    const isPressed = pressedKeys.has(keyChar);
    const isBlack = mapping?.isBlack;
    
    if (!mapping) {
      return <div className={`w-10 h-10 ${className}`} />;
    }

    return (
      <div 
        className={`
          relative flex flex-col items-center justify-center
          w-10 h-10 rounded-lg font-mono text-xs font-bold
          transition-all duration-100 transform
          ${isBlack 
            ? isPressed 
              ? 'bg-purple-400 text-slate-900 scale-95 shadow-inner' 
              : 'bg-slate-800 text-purple-300 border border-purple-500/30 hover:bg-slate-700'
            : isPressed 
              ? 'bg-cyan-400 text-slate-900 scale-95 shadow-inner' 
              : 'bg-slate-200 text-slate-800 border border-slate-300 hover:bg-white'
          }
          ${className}
        `}
      >
        <span className="uppercase">{keyChar === ';' ? ';' : keyChar === "'" ? "'" : keyChar}</span>
        <span className={`text-[10px] font-normal ${isBlack ? 'text-purple-200' : 'text-slate-500'}`}>
          {mapping.label}
        </span>
      </div>
    );
  };

  return (
    <div 
      className={`
        fixed bottom-36 right-4 z-50
        backdrop-blur-xl bg-slate-900/90 
        rounded-2xl shadow-2xl shadow-black/50
        border border-slate-700/50
        transition-all duration-300 ease-out
        ${isExpanded ? 'w-auto' : 'w-14'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20">
            <Keyboard size={16} className="text-cyan-400" />
          </div>
          {isExpanded && (
            <span className="text-sm font-medium text-slate-200">Keyboard Map</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Main keyboard layout */}
          <div className="space-y-1.5">
            {/* Top row - Black keys */}
            <div className="flex gap-1 pl-5">
              {topRow.map((key, i) => (
                <React.Fragment key={key}>
                  <KeyButton keyChar={key} />
                  {/* Spacing for keyboard layout */}
                  {(i === 1 || i === 4) && <div className="w-10" />}
                </React.Fragment>
              ))}
            </div>
            
            {/* Middle row - White keys (main octaves) */}
            <div className="flex gap-1">
              {middleRow.map(key => (
                <KeyButton key={key} keyChar={key} />
              ))}
            </div>
            
            {/* Bottom row - Lower octave */}
            <div className="flex gap-1 pl-2">
              {bottomRow.map(key => (
                <KeyButton key={key} keyChar={key} />
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 pt-2 border-t border-slate-700/50">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-slate-200 border border-slate-300" />
              <span className="text-xs text-slate-400">White Keys</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-slate-800 border border-purple-500/30" />
              <span className="text-xs text-slate-400">Black Keys</span>
            </div>
          </div>

          {/* Quick tip */}
          <div className="text-center">
            <p className="text-[10px] text-slate-500">
              Press any key to play • 2.5 octaves available
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default KeyboardMapOverlay;
