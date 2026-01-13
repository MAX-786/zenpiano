import React, { useCallback, useEffect, useMemo } from 'react';
import { Play, Pause, RefreshCw, Maximize2, Minimize2, Zap, ArrowLeft, Keyboard, Map } from 'lucide-react';
import { useMidi } from './hooks/useMidi';
import { useKeyboardPiano } from './hooks/useKeyboardPiano';
import { useAudio } from './hooks/useAudio';
import Piano from './components/Piano';
import Visualizer from './components/Visualizer';
import Coach from './components/Coach';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import KeyboardMapOverlay from './components/KeyboardMapOverlay';
import { SessionService, AuthService } from './services/db';
import { initializeAuth } from './services/apiClient';
import { SAMPLE_SONG, COLORS } from './constants';
import { GameState, MidiLogEntry, Song } from './types';
import { useAuthStore } from './store/authStore';
import { useGameStore } from './store/gameStore';
import { useSessionStore } from './store/sessionStore';
import { useUIStore, View } from './store/uiStore';

function App() {
  // Zustand Stores
  const { user, refreshToken, isAuthenticated } = useAuthStore();
  const logout = useAuthStore((state) => state.logout);
  const { 
    gameState, 
    currentSong, 
    progress, 
    isZenMode, 
    currentSessionId,
    startTime,
    setGameState, 
    setCurrentSong, 
    setProgress, 
    toggleZenMode,
    startSession,
    resetGame,
    finishSession,
  } = useGameStore();
  const { 
    sessionLog, 
    unsyncedLogs,
    addLogEntry, 
    clearLogs, 
    syncLogs,
    getSessionStats,
  } = useSessionStore();
  const { 
    currentView, 
    showCoach, 
    setCurrentView, 
    setShowCoach, 
    toggleCoach,
    keyboardModeEnabled,
    showKeyboardMap,
    toggleKeyboardMode,
    toggleKeyboardMap,
    setShowKeyboardMap,
  } = useUIStore();
  
  // MIDI and Audio
  const { activeNotes: midiNotes, error: midiError } = useMidi();
  const { activeNotes: keyboardNotes, pressedKeys } = useKeyboardPiano(keyboardModeEnabled);
  
  // Combine MIDI and keyboard notes
  const activeNotes = useMemo(() => {
    const combined = new Set<number>();
    midiNotes.forEach(note => combined.add(note));
    keyboardNotes.forEach(note => combined.add(note));
    return combined;
  }, [midiNotes, keyboardNotes]);
  
  const { startAudio } = useAudio(activeNotes);

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  // Handle logout with refresh token cleanup
  const handleLogout = async () => {
    if (refreshToken) {
      await AuthService.logout(refreshToken);
    }
    logout();
    setCurrentView(View.LOGIN);
  };

  // --- Navigation Handlers ---
  const navigateToPractice = (song: Song = SAMPLE_SONG) => {
    setCurrentSong(song);
    clearLogs();
    setShowCoach(false);
    setCurrentView(View.PRACTICE);
  };

  const navigateToDashboard = () => {
    resetGame();
    setCurrentView(View.DASHBOARD);
  };

  // --- Gameplay Handlers ---
  const handleStart = async () => {
    await startAudio();
    clearLogs();
    startSession();
    setShowCoach(false);
  };

  const handlePause = () => setGameState(GameState.PAUSED);
  
  const handleReset = () => {
    resetGame();
    clearLogs();
  };

  const handleSongComplete = useCallback(async () => {
    finishSession();
    const endTime = Date.now();
    
    // Get stats from store
    const stats = getSessionStats();
    
    // Final Save
    if (user && currentSessionId) {
      await SessionService.saveSession({
        userId: user.id,
        startTime: startTime,
        endTime,
        songTitle: currentSong.title,
        accuracy: stats.accuracy,
        totalNotes: stats.totalNotes,
        averageVelocity: stats.averageVelocity
      }, sessionLog);
      
      // Clear unsynced queue
      clearLogs();
    }

    setShowCoach(true);
  }, [user, currentSong, currentSessionId, startTime, sessionLog, finishSession, getSessionStats, clearLogs, setShowCoach]);

  const handleLogEntry = useCallback((entry: MidiLogEntry) => {
    addLogEntry(entry);
  }, [addLogEntry]);

  // --- Batch Logging Effect ---
  useEffect(() => {
    const interval = setInterval(() => {
        if (gameState === GameState.PLAYING && unsyncedLogs.length > 0 && currentSessionId) {
            syncLogs(currentSessionId);
        }
    }, 30000); // 30 Seconds

    return () => clearInterval(interval);
  }, [gameState, unsyncedLogs, currentSessionId, syncLogs]);

  // --- RENDER ROUTER ---
  
  if (currentView === View.LOGIN) {
    return <Login />;
  }

  if (currentView === View.DASHBOARD && user) {
    return (
      <div className="h-screen flex flex-col bg-slate-900">
        <header className="h-16 flex items-center justify-between px-8 border-b border-slate-700 bg-slate-800">
          <div className="flex items-center gap-4">
             <h1 className="text-xl font-light tracking-widest text-white">
              ZEN<span className="font-bold text-cyan-400">PIANO</span>
            </h1>
          </div>
          <div className="flex gap-4">
             <button onClick={() => navigateToPractice(SAMPLE_SONG)} className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600 text-sm">
                Free Practice
             </button>
             <button onClick={handleLogout} className="text-slate-400 hover:text-white text-sm">
               Log Out
             </button>
          </div>
        </header>
        <Dashboard 
          onPlaySong={navigateToPractice}
          onPlayExercise={navigateToPractice}
        />
      </div>
    );
  }

  // --- PRACTICE VIEW ---
  return (
    <div className={`relative w-full h-screen flex flex-col overflow-hidden ${isZenMode ? 'cursor-none' : ''}`} style={{ backgroundColor: COLORS.polarNight.darker }}>
      
      {/* HEADER / CONTROLS - Hidden in Zen Mode */}
      {!isZenMode && (
        <header className="h-16 flex items-center justify-between px-6 bg-slate-800 border-b border-slate-700 z-40">
          <div className="flex items-center gap-4">
            <button onClick={navigateToDashboard} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors">
               <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-light tracking-widest text-white hidden md:block">
              ZEN<span className="font-bold text-cyan-400">PIANO</span>
            </h1>
            <span className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-300">
               {midiError ? 'MIDI Disconnected' : 'MIDI Connected'}
            </span>
            {keyboardModeEnabled && (
              <span className="text-xs px-2 py-1 rounded bg-gradient-to-r from-cyan-900/50 to-purple-900/50 text-cyan-300 border border-cyan-500/30">
                ⌨️ Keyboard Active
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
             {gameState === GameState.IDLE || gameState === GameState.FINISHED ? (
               <button onClick={handleStart} className="flex items-center gap-2 px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full transition-all shadow-lg shadow-cyan-900/50">
                 <Play size={18} fill="currentColor" /> Start
               </button>
             ) : gameState === GameState.PLAYING ? (
               <button onClick={handlePause} className="p-2 rounded-full bg-slate-700 hover:bg-slate-600 text-white transition-colors">
                 <Pause size={20} />
               </button>
             ) : (
                <button onClick={handleStart} className="p-2 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white transition-colors">
                 <Play size={20} fill="currentColor" />
               </button>
             )}
             
             <button onClick={handleReset} className="p-2 text-slate-400 hover:text-white transition-colors" title="Reset">
               <RefreshCw size={18} />
             </button>

             <div className="w-px h-6 bg-slate-600 mx-2" />

             {/* Keyboard Mode Toggle */}
             <div className="flex items-center gap-1">
               <button 
                 onClick={toggleKeyboardMode}
                 className={`p-2 rounded-lg transition-all duration-200 ${keyboardModeEnabled 
                   ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 ring-1 ring-cyan-500/30' 
                   : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                 title={keyboardModeEnabled ? 'Disable Keyboard Mode' : 'Enable Keyboard Mode'}
               >
                 <Keyboard size={20} />
               </button>
               {keyboardModeEnabled && (
                 <button 
                   onClick={toggleKeyboardMap}
                   className={`p-2 rounded-lg transition-all duration-200 ${showKeyboardMap 
                     ? 'bg-cyan-500/20 text-cyan-300' 
                     : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                   title={showKeyboardMap ? 'Hide Key Map' : 'Show Key Map'}
                 >
                   <Map size={18} />
                 </button>
               )}
             </div>

             <button 
                onClick={() => setShowCoach(!showCoach)} 
                className={`p-2 rounded-lg transition-colors ${showCoach ? 'bg-purple-500/20 text-purple-300' : 'text-slate-400 hover:text-white'}`}
                title="AI Coach"
              >
               <Zap size={20} />
             </button>
             
             <button 
               onClick={toggleZenMode} 
               className="p-2 text-slate-400 hover:text-white transition-colors"
               title="Enter Zen Mode"
             >
               <Maximize2 size={18} />
             </button>
          </div>
        </header>
      )}

      {/* ZEN MODE FLOATING CONTROLS */}
      {isZenMode && (
        <div className="absolute top-4 right-4 z-50 opacity-0 hover:opacity-100 transition-opacity duration-300">
          <div className="flex items-center gap-2 p-2 bg-slate-800/80 backdrop-blur-lg rounded-2xl border border-slate-700/50">
            {/* Keyboard toggle in Zen Mode */}
            <button 
              onClick={toggleKeyboardMode}
              className={`p-2.5 rounded-xl transition-all duration-200 ${keyboardModeEnabled 
                ? 'bg-gradient-to-r from-cyan-500/30 to-purple-500/30 text-cyan-300' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
              title={keyboardModeEnabled ? 'Disable Keyboard Mode' : 'Enable Keyboard Mode'}
            >
              <Keyboard size={20} />
            </button>
            {keyboardModeEnabled && (
              <button 
                onClick={toggleKeyboardMap}
                className={`p-2.5 rounded-xl transition-all duration-200 ${showKeyboardMap 
                  ? 'bg-cyan-500/30 text-cyan-300' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
                title={showKeyboardMap ? 'Hide Key Map' : 'Show Key Map'}
              >
                <Map size={18} />
              </button>
            )}
            <div className="w-px h-6 bg-slate-600" />
            <button onClick={toggleZenMode} className="p-2.5 rounded-xl hover:bg-slate-700/50 text-white transition-colors">
              <Minimize2 size={20} />
            </button>
          </div>
        </div>
      )}
      
      {/* Keyboard Map in Zen Mode */}
      {isZenMode && keyboardModeEnabled && showKeyboardMap && (
        <KeyboardMapOverlay 
          isVisible={true}
          onClose={() => setShowKeyboardMap(false)}
          pressedKeys={pressedKeys}
        />
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 relative flex flex-col">
         <div className="flex-1 relative">
            <Visualizer 
              song={currentSong}
              activeNotes={activeNotes}
              gameState={gameState}
              onSongComplete={handleSongComplete}
              onLogEntry={handleLogEntry}
              onProgress={setProgress}
              setGameState={setGameState}
            />
            
            {gameState === GameState.PLAYING && (
              <div className="absolute top-4 left-4 pointer-events-none opacity-50">
                <h3 className="text-2xl font-thin text-white">{currentSong.title}</h3>
                <p className="text-sm text-cyan-200">{currentSong.artist}</p>
              </div>
            )}
         </div>

         <div className="flex-shrink-0 z-30">
            <Piano activeNotes={activeNotes} />
         </div>

         <Coach log={sessionLog} isVisible={showCoach && !isZenMode} />
         
         {/* Keyboard Map Overlay */}
         <KeyboardMapOverlay 
           isVisible={keyboardModeEnabled && showKeyboardMap && !isZenMode}
           onClose={() => setShowKeyboardMap(false)}
           pressedKeys={pressedKeys}
         />
      </main>
      
      <div className="h-1 bg-slate-800 w-full">
         <div 
           className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-300"
           style={{ width: `${Math.min(100, (progress / currentSong.duration) * 100)}%` }}
         />
      </div>

    </div>
  );
}

export default App;