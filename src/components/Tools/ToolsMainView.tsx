import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Player } from '../../types';
import { PitchCounterView } from './PitchCounterView';
import { StopwatchView } from './StopwatchView';
import { 
  Activity, 
  Timer, 
  ChevronRight, 
  Wrench, 
  ArrowLeft 
} from 'lucide-react';

interface ToolsMainViewProps {
  user: any;
  players: Player[];
  darkMode: boolean;
}

export const ToolsMainView: React.FC<ToolsMainViewProps> = ({
  user,
  players,
  darkMode
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Route path handling e.g. /tools, /tools/pitch-counter, /tools/stopwatch
  const pathParts = location.pathname.split('/');
  const subTool = pathParts[2] || ''; // 'pitch-counter', 'stopwatch', or ''

  return (
    <div className={`p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 ${darkMode ? 'dark text-slate-200' : 'text-slate-800'}`}>
      {subTool === 'pitch-counter' ? (
        <PitchCounterView
          user={user}
          players={players}
          darkMode={darkMode}
          onBack={() => navigate('/tools')}
        />
      ) : subTool === 'stopwatch' ? (
        <StopwatchView
          players={players}
          darkMode={darkMode}
          onBack={() => navigate('/tools')}
        />
      ) : (
        /* Tools Landing / List Page */
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => navigate('/drills')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
                >
                  <ArrowLeft size={14} /> Back to Drills
                </button>
              </div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                <Wrench className="text-emerald-600 dark:text-emerald-400" size={32} />
                Coaching Tools
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                Baseball utilities for live game tracking, timing drills, and roster analytics
              </p>
            </div>
          </div>

          {/* Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tool 1: Pitch Counter */}
            <div
              onClick={() => navigate('/tools/pitch-counter')}
              className="group p-6 sm:p-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm hover:shadow-xl hover:border-emerald-500/50 dark:hover:border-emerald-400/50 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 flex items-center justify-center">
                    <Activity size={28} />
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Live Game & Practice
                  </span>
                </div>

                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Pitch Counter
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-2 leading-relaxed">
                    Track balls, strikes, and total pitch counts live. Calculate strike percentages in real time, associate sessions with players on your roster, and log pitch history for future viewing.
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                <span>Open Pitch Counter</span>
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Tool 2: Stopwatch */}
            <div
              onClick={() => navigate('/tools/stopwatch')}
              className="group p-6 sm:p-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm hover:shadow-xl hover:border-indigo-500/50 dark:hover:border-indigo-400/50 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 flex items-center justify-center">
                    <Timer size={28} />
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                    Timing & Speed
                  </span>
                </div>

                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Stopwatch
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-2 leading-relaxed">
                    High-precision digital stopwatch with lap/split time recording. Ideal for timing sprint reps, base running drills, and catcher pop times with optional player tagging from your roster.
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                <span>Open Stopwatch</span>
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
