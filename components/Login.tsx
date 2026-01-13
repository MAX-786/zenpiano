import React, { useState } from 'react';
import { AuthService } from '../services/db';
import { User } from '../types';
import { KeyRound, ArrowRight } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    
    setLoading(true);
    try {
      const user = await AuthService.login(username);
      onLogin(user);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4">
      <div className="w-full max-w-md bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mb-4">
            <KeyRound className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-3xl font-light tracking-widest">
            ZEN<span className="font-bold text-cyan-400">PIANO</span>
          </h1>
          <p className="text-slate-400 mt-2">Sign in to track your progress</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
              placeholder="Enter your name..."
              autoFocus
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-medium py-3 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Accessing...' : (
              <>
                Start Practice <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
        
        <p className="text-xs text-center text-slate-500 mt-6">
          * Demo Mode: A new account will be created if the username doesn't exist.
        </p>
      </div>
    </div>
  );
};

export default Login;