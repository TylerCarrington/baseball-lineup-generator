import React, { useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useSharedData } from '../hooks/useSharedData';
import { PitchCounterView } from './Tools/PitchCounterView';
import { StopwatchView } from './Tools/StopwatchView';
import { 
  Activity, 
  Timer, 
  ChevronRight, 
  Wrench, 
  ArrowLeft,
  Trophy
} from 'lucide-react';

export const PublicToolsView: React.FC = () => {
  const { uid: paramUid } = useParams<{ uid: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  // Extract UID from URL path (e.g. /shared/tools/:uid)
  const pathParts = location.pathname.split('/');
  const toolsIdx = pathParts.indexOf('tools');
  const ownerId = paramUid || (toolsIdx !== -1 && pathParts[toolsIdx + 1] ? pathParts[toolsIdx + 1] : undefined);

  // We reuse useSharedData to fetch settings and players for this shared coach!
  const { players, loading, error } = useSharedData(ownerId);

  // Check which sub-tool is active from sub-path, e.g. /shared/tools/:uid/pitch-counter
  const isPitchCounter = location.pathname.endsWith('/pitch-counter');
  const isStopwatch = location.pathname.endsWith('/stopwatch');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-900 dark:border-emerald-500 border-t-transparent rounded-full mx-auto mb-4 animate-spin"></div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Loading coaching tools...</p>
        </div>
      </div>
    );
  }

  if (error || !ownerId) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-md text-center shadow-md">
          <Wrench size={32} className="mx-auto text-slate-400 mb-3" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Tools Dashboard Not Found</h2>
          <p className="text-xs text-slate-500 mt-2">
            The shared coaching tools dashboard could not be loaded at this link.
          </p>
        </div>
      </div>
    );
  }

  const navigateToSubtool = (toolName: string) => {
    navigate(`/shared/tools/${ownerId}/${toolName}`);
  };

  const navigateBackToTools = () => {
    navigate(`/shared/tools/${ownerId}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-4 sm:p-8">
      {isPitchCounter ? (
        <div className="max-w-4xl mx-auto">
          <PitchCounterView
            user={{ uid: ownerId }}
            players={players}
            darkMode={true}
            onBack={navigateBackToTools}
          />
        </div>
      ) : isStopwatch ? (
        <div className="max-w-4xl mx-auto">
          <StopwatchView
            players={players}
            darkMode={true}
            onBack={navigateBackToTools}
          />
        </div>
      ) : (
        /* Tools Landing / List Page for shared visitors */
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Wrench size={24} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">Coaching Tools</h1>
                <p className="text-xs text-slate-500">Interactive baseball utilities & logs</p>
              </div>
            </div>
          </div>

          {/* Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tool 1: Pitch Counter */}
            <div
              onClick={() => navigateToSubtool('pitch-counter')}
              className="group p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 rounded-3xl cursor-pointer shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 flex items-center justify-center">
                    <Activity size={28} />
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Live Pitch Counter
                  </span>
                </div>

                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Pitch Counter
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2 font-medium">
                    Track pitch statistics live. View historical sessions logged for team pitchers, complete with strike/ball counts and metrics.
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                <span>Launch Pitch Counter</span>
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Tool 2: Stopwatch */}
            <div
              onClick={() => navigateToSubtool('stopwatch')}
              className="group p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 rounded-3xl cursor-pointer shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 flex items-center justify-center">
                    <Timer size={28} />
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                    Precision Stopwatch
                  </span>
                </div>

                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Stopwatch
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2 font-medium">
                    Time runs, pop times, or reps with split recordings, and optionally tag players from the roster.
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between font-bold text-indigo-600 dark:text-indigo-400 text-xs">
                <span>Launch Stopwatch</span>
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
