import React, { useEffect, useState } from 'react';
import { generatePracticeInsights } from '../services/geminiService';
import { MidiLogEntry, CoachInsight } from '../types';
import { Bot, Sparkles, AlertCircle, CheckCircle, BookOpen, HeartPulse } from 'lucide-react';

interface CoachProps {
  log: MidiLogEntry[];
  isVisible: boolean;
}

const Coach: React.FC<CoachProps> = ({ log, isVisible }) => {
  const [insight, setInsight] = useState<CoachInsight | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isVisible && log.length > 0) {
      setLoading(true);
      generatePracticeInsights(log)
        .then(setInsight)
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isVisible, log]);

  if (!isVisible) return null;

  return (
    <div className="absolute top-0 right-0 h-full w-80 bg-slate-800 border-l border-slate-700 shadow-2xl p-6 overflow-y-auto transform transition-transform duration-300 z-50">
      <div className="flex items-center gap-2 mb-6">
        <Bot className="w-6 h-6 text-cyan-400" />
        <h2 className="text-xl font-semibold text-white">AI Coach</h2>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400 animate-pulse">
          <Sparkles className="w-8 h-8 mb-2" />
          <p>Analyzing your performance...</p>
        </div>
      ) : insight ? (
        <div className="space-y-6">
          <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
            <h3 className="text-xs uppercase tracking-wider text-slate-400 mb-2">Summary</h3>
            <p className="text-slate-200 text-sm leading-relaxed">{insight.summary}</p>
          </div>

          {/* Empathy Analysis Block */}
          {insight.moodAnalysis && (
            <div className="bg-pink-900/20 p-4 rounded-lg border border-pink-700/30">
               <h3 className="flex items-center gap-2 text-pink-400 font-medium mb-2 text-sm">
                 <HeartPulse className="w-4 h-4" /> Vibe Check
               </h3>
               <p className="text-pink-100 text-sm italic">"{insight.moodAnalysis}"</p>
            </div>
          )}

          <div>
            <h3 className="flex items-center gap-2 text-green-400 font-medium mb-3 text-sm">
              <CheckCircle className="w-4 h-4" /> Strengths
            </h3>
            <ul className="space-y-2">
              {insight.strengths.map((s, i) => (
                <li key={i} className="text-sm text-slate-300 bg-slate-900/50 p-2 rounded border-l-2 border-green-500">
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="flex items-center gap-2 text-yellow-400 font-medium mb-3 text-sm">
              <AlertCircle className="w-4 h-4" /> Improvements
            </h3>
            <ul className="space-y-2">
              {insight.improvements.map((s, i) => (
                <li key={i} className="text-sm text-slate-300 bg-slate-900/50 p-2 rounded border-l-2 border-yellow-500">
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <div>
             <h3 className="flex items-center gap-2 text-purple-400 font-medium mb-3 text-sm">
              <BookOpen className="w-4 h-4" /> Routine
            </h3>
             <div className="text-sm text-slate-300 bg-slate-900/50 p-3 rounded border border-slate-700">
                {insight.practiceRoutine}
             </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-slate-500 mt-10">
          <p>Play through the song to generate insights.</p>
        </div>
      )}
    </div>
  );
};

export default Coach;