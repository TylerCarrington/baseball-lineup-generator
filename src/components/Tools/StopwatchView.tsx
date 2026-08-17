import React, { useState, useEffect, useRef } from 'react';
import { Player } from '../../types';
import { 
  Timer, 
  Play, 
  Pause, 
  RotateCcw, 
  Flag, 
  ChevronLeft, 
  User, 
  Trash2, 
  Clock 
} from 'lucide-react';

interface LapRecord {
  id: number;
  splitMs: number;
  totalMs: number;
  playerId?: string;
}

interface StopwatchViewProps {
  players: Player[];
  darkMode: boolean;
  onBack: () => void;
}

export const StopwatchView: React.FC<StopwatchViewProps> = ({
  players,
  darkMode,
  onBack
}) => {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [elapsedTimeMs, setElapsedTimeMs] = useState<number>(0);
  const [laps, setLaps] = useState<LapRecord[]>([]);

  const intervalRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now() - elapsedTimeMs;
      intervalRef.current = setInterval(() => {
        setElapsedTimeMs(Date.now() - startTimeRef.current);
      }, 10);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const handleStartPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setElapsedTimeMs(0);
    setLaps([]);
  };

  const handleLap = () => {
    if (!isRunning && elapsedTimeMs === 0) return;

    const previousTotalMs = laps.length > 0 ? laps[0].totalMs : 0;
    const currentSplitMs = elapsedTimeMs - previousTotalMs;

    const newLap: LapRecord = {
      id: laps.length + 1,
      splitMs: currentSplitMs,
      totalMs: elapsedTimeMs
    };

    setLaps([newLap, ...laps]);
  };

  const handleAssignPlayerToLap = (lapId: number, playerId: string) => {
    setLaps(prev => prev.map(l => l.id === lapId ? { ...l, playerId } : l));
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const hundredths = Math.floor((ms % 1000) / 10);

    const pad = (num: number, digits = 2) => String(num).padStart(digits, '0');

    return {
      minutes: pad(minutes),
      seconds: pad(seconds),
      hundredths: pad(hundredths)
    };
  };

  const formatted = formatTime(elapsedTimeMs);

  return (
    <div className={`space-y-6 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ChevronLeft size={18} />
          Back to Tools
        </button>

        <button
          onClick={handleReset}
          disabled={elapsedTimeMs === 0 && laps.length === 0}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 disabled:opacity-40 transition-all"
        >
          <RotateCcw size={14} />
          Reset
        </button>
      </div>

      {/* Main Stopwatch HUD */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 sm:p-10 shadow-sm text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300">
          <Timer size={14} /> Stopwatch
        </div>

        {/* Digital Time Display */}
        <div className="py-6 px-4 bg-slate-900 text-white dark:bg-slate-950 rounded-3xl border border-slate-800 shadow-inner font-mono tracking-wider flex items-baseline justify-center gap-1 sm:gap-2 select-none">
          <span className="text-5xl sm:text-7xl font-black">{formatted.minutes}</span>
          <span className="text-3xl sm:text-5xl text-indigo-400 font-bold">:</span>
          <span className="text-5xl sm:text-7xl font-black">{formatted.seconds}</span>
          <span className="text-2xl sm:text-4xl text-emerald-400 font-bold">.{formatted.hundredths}</span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 max-w-sm mx-auto">
          <button
            onClick={handleStartPause}
            className={`flex-1 py-4 px-6 rounded-2xl font-black text-lg shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${
              isRunning 
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20' 
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
            }`}
          >
            {isRunning ? <Pause size={22} /> : <Play size={22} />}
            {isRunning ? 'Pause' : elapsedTimeMs > 0 ? 'Resume' : 'Start'}
          </button>

          <button
            onClick={handleLap}
            disabled={!isRunning && elapsedTimeMs === 0}
            className="flex-1 py-4 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Flag size={20} />
            Lap / Split
          </button>
        </div>
      </div>

      {/* Laps / Splits History */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-4">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Splits & Lap Records</h3>
          </div>
          {laps.length > 0 && (
            <button
              onClick={() => setLaps([])}
              className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors"
            >
              Clear Laps
            </button>
          )}
        </div>

        {laps.length === 0 ? (
          <div className="py-12 text-center text-slate-400 dark:text-slate-500 font-medium text-sm">
            No lap splits recorded yet. Press "Lap / Split" while the timer is running!
          </div>
        ) : (
          <div className="space-y-2.5">
            {laps.map((lap) => {
              const splitFormatted = formatTime(lap.splitMs);
              const totalFormatted = formatTime(lap.totalMs);

              return (
                <div
                  key={lap.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-black text-xs flex items-center justify-center">
                      #{lap.id}
                    </span>
                    <div>
                      <div className="text-sm font-black font-mono text-slate-900 dark:text-white">
                        Split: {splitFormatted.minutes}:{splitFormatted.seconds}.{splitFormatted.hundredths}
                      </div>
                      <div className="text-xs font-mono text-slate-400">
                        Total: {totalFormatted.minutes}:{totalFormatted.seconds}.{totalFormatted.hundredths}
                      </div>
                    </div>
                  </div>

                  {/* Player Tag Selector */}
                  <div className="w-full sm:w-56">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <select
                        value={lap.playerId || ''}
                        onChange={(e) => handleAssignPlayerToLap(lap.id, e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="">Tag Player (Optional)</option>
                        {players.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.jerseyNumber ? `#${p.jerseyNumber} ` : ''}{p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
