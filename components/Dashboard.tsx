import React, { useEffect, useState } from 'react';
import { User, Session, Song } from '../types';
import { SessionService } from '../services/db';
import { generatePredictiveExercise } from '../services/geminiService';
import { Activity, Clock, Target, Play, Brain, BarChart3 } from 'lucide-react';

interface DashboardProps {
  user: User;
  onPlaySong: (song: Song) => void; // Standard Play
  onPlayExercise: (song: Song) => void; // Predictive Play
}

const Dashboard: React.FC<DashboardProps> = ({ user, onPlaySong, onPlayExercise }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    SessionService.getUserStats(user.id).then(data => {
      setStats(data);
      setLoading(false);
    });
  }, [user.id]);

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