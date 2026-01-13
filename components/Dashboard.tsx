import React, { useEffect, useState } from 'react';
import { Session, Song } from '../types';
import { SessionService, TokenService } from '../services/db';
import { generatePredictiveExercise } from '../services/geminiService';
import { Activity, Clock, Target, Play, Brain, BarChart3, Zap, TrendingUp } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface DashboardProps {
  onPlaySong: (song: Song) => void; // Standard Play
  onPlayExercise: (song: Song) => void; // Predictive Play
}

const Dashboard: React.FC<DashboardProps> = ({ onPlaySong, onPlayExercise }) => {
  const user = useAuthStore((state) => state.user);
  const [stats, setStats] = useState<any>(null);
  const [tokenStats, setTokenStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    Promise.all([
      SessionService.getUserStats(user.id),
      TokenService.getStats(user.id)
    ]).then(([sessionData, tokenData]) => {
      setStats(sessionData);
      setTokenStats(tokenData);
      setLoading(false);
    });
  }, [user]);

  const handleGenerateExercise = async () => {
    setGenerating(true);
    // Get top 3 trouble notes
    const troubleNotes = Object.entries(stats.troubleNotes as Record<string, number>)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([note]) => parseInt(note));
      
    try {
      const exercise = await generatePredictiveExercise(troubleNotes.length ? troubleNotes : [60, 62, 64]);
      onPlayExercise(exercise);
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div className="p-8 text-white">Loading stats...</div>;
  if (!user) return <div className="p-8 text-white">Please log in.</div>;

  return (
    <div className="flex-1 bg-slate-900 text-white p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-light">Welcome back, <span className="font-bold text-cyan-400">{user.username}</span></h1>
          <p className="text-slate-400 mt-2">Here is your learning velocity.</p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex items-center gap-4">
            <div className="p-3 bg-purple-500/20 rounded-lg text-purple-400">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Practice</p>
              <h3 className="text-2xl font-bold">{stats.totalMinutes}m</h3>
            </div>
          </div>
          
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex items-center gap-4">
            <div className="p-3 bg-green-500/20 rounded-lg text-green-400">
              <Target size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Avg Accuracy</p>
              <h3 className="text-2xl font-bold">{stats.avgAccuracy}%</h3>
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex items-center gap-4">
            <div className="p-3 bg-cyan-500/20 rounded-lg text-cyan-400">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Sessions</p>
              <h3 className="text-2xl font-bold">{stats.totalSessions}</h3>
            </div>
          </div>
        </div>

        {/* Token Usage Stats - NEW! */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-10">
          <div className="flex items-center gap-2 mb-6">
            <Zap size={20} className="text-yellow-400" />
            <h3 className="font-semibold text-lg">AI Token Usage</h3>
            <span className="ml-auto text-xs text-slate-400">Powered by Gemini 3.0 Flash</span>
          </div>

          {tokenStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Today */}
              <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-slate-400 text-sm">Today</p>
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                </div>
                <h4 className="text-2xl font-bold text-white mb-1">
                  {tokenStats.today.totalTokens.toLocaleString()}
                </h4>
                <div className="text-xs text-slate-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Prompt:</span>
                    <span className="text-cyan-400">{tokenStats.today.promptTokens}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Response:</span>
                    <span className="text-pink-400">{tokenStats.today.candidatesTokens}</span>
                  </div>
                </div>
              </div>

              {/* This Month */}
              <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-slate-400 text-sm">This Month</p>
                  <TrendingUp size={14} className="text-blue-400" />
                </div>
                <h4 className="text-2xl font-bold text-white mb-1">
                  {tokenStats.thisMonth.totalTokens.toLocaleString()}
                </h4>
                <div className="text-xs text-slate-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Prompt:</span>
                    <span className="text-cyan-400">{tokenStats.thisMonth.promptTokens.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Response:</span>
                    <span className="text-pink-400">{tokenStats.thisMonth.candidatesTokens.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Last 30 Days */}
              <div className="bg-gradient-to-br from-slate-900/50 to-purple-900/20 p-4 rounded-lg border border-purple-700/50">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-slate-400 text-sm">Last 30 Days</p>
                  <Brain size={14} className="text-purple-400" />
                </div>
                <h4 className="text-2xl font-bold text-white mb-1">
                  {tokenStats.last30Days.totalTokens.toLocaleString()}
                </h4>
                <div className="text-xs text-slate-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Prompt:</span>
                    <span className="text-cyan-400">{tokenStats.last30Days.promptTokens.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Response:</span>
                    <span className="text-pink-400">{tokenStats.last30Days.candidatesTokens.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 p-3 bg-slate-900/30 rounded-lg border border-slate-700/50">
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <span className="text-yellow-400">💡</span>
              Token tracking helps you understand AI resource usage. Each AI coaching session and exercise generation consumes tokens.
            </p>
          </div>
        </div>

        {/* Predictive Practice CTA */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-800/50 p-8 rounded-2xl border border-slate-700 mb-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <Brain size={120} />
          </div>
          <div className="relative z-10">
             <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <Brain size={20} className="text-pink-400" /> AI Adaptive Lesson
             </h2>
             <p className="text-slate-300 max-w-xl mb-6">
               Based on your recent mistakes (specifically MIDI notes {Object.keys(stats.troubleNotes).slice(0,3).join(', ')}), 
               Gemini can generate a custom exercise to fix your weak spots.
             </p>
             <button 
                onClick={handleGenerateExercise}
                disabled={generating}
                className="px-6 py-3 bg-pink-600 hover:bg-pink-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
             >
                {generating ? 'Generating...' : <><Play size={18} fill="currentColor"/> Start AI Lesson</>}
             </button>
          </div>
        </div>

        {/* Recent Sessions List */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-700 flex justify-between items-center">
             <h3 className="font-semibold flex items-center gap-2">
               <BarChart3 size={18} className="text-slate-400" /> Recent Activity
             </h3>
          </div>
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-900/50 uppercase tracking-wider text-xs">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Song</th>
                <th className="p-4">Accuracy</th>
                <th className="p-4">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {stats.recentSessions.map((s: Session) => (
                <tr key={s.id} className="hover:bg-slate-700/50">
                  <td className="p-4">{new Date(s.startTime).toLocaleDateString()}</td>
                  <td className="p-4 text-white font-medium">{s.songTitle}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                       s.accuracy > 90 ? 'bg-green-500/20 text-green-400' : 
                       s.accuracy > 70 ? 'bg-yellow-500/20 text-yellow-400' : 
                       'bg-red-500/20 text-red-400'
                    }`}>
                      {s.accuracy}%
                    </span>
                  </td>
                  <td className="p-4">{Math.round((s.endTime - s.startTime)/1000)}s</td>
                </tr>
              ))}
              {stats.recentSessions.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">No sessions recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;