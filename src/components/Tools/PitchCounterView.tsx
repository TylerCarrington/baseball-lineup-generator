import React, { useState, useEffect } from 'react';
import { Player, PitchCountSession } from '../../types';
import { firebaseService } from '../../services/firebaseService';
import { 
  Activity, 
  RotateCcw, 
  Save, 
  Trash2, 
  User, 
  Calendar, 
  CheckCircle2, 
  ChevronLeft, 
  Plus, 
  Minus, 
  AlertCircle 
} from 'lucide-react';
import { toast } from 'sonner';

interface PitchCounterViewProps {
  user: any;
  players: Player[];
  darkMode: boolean;
  onBack: () => void;
}

export const PitchCounterView: React.FC<PitchCounterViewProps> = ({
  user,
  players,
  darkMode,
  onBack
}) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [balls, setBalls] = useState<number>(0);
  const [strikes, setStrikes] = useState<number>(0);
  const [inPlay, setInPlay] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSessions, setSavedSessions] = useState<PitchCountSession[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true);

  const totalPitches = balls + strikes + inPlay;
  const strikeCountWithInPlay = strikes + inPlay;
  const strikePercentage = totalPitches > 0 ? Math.round((strikeCountWithInPlay / totalPitches) * 100) : 0;

  const selectedPlayer = players.find(p => p.id === selectedPlayerId);

  useEffect(() => {
    loadHistory();
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;
    setIsLoadingHistory(true);
    try {
      const data: PitchCountSession[] = await firebaseService.getPitchCountSessions(user.uid);
      // Sort descending by creation date
      data.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (new Date(a.createdAt).getTime() || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (new Date(b.createdAt).getTime() || 0);
        return dateB - dateA;
      });
      setSavedSessions(data);
    } catch (err) {
      console.error('Error loading pitch count history', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleReset = () => {
    if (totalPitches > 0) {
      if (window.confirm('Reset current pitch count numbers?')) {
        setBalls(0);
        setStrikes(0);
        setInPlay(0);
        setNotes('');
      }
    }
  };

  const handleSaveSession = async () => {
    if (!user) {
      toast.error('You must be signed in to save sessions.');
      return;
    }
    if (totalPitches === 0) {
      toast.error('Record at least 1 pitch before saving a session.');
      return;
    }

    setIsSaving(true);
    try {
      const sessionData = {
        uid: user.uid,
        playerId: selectedPlayerId || null,
        playerName: selectedPlayer ? selectedPlayer.name : 'Unassigned Pitcher',
        balls,
        strikes,
        inPlay,
        totalPitches,
        strikePercentage,
        notes: notes.trim()
      };

      await firebaseService.addPitchCountSession(sessionData);
      toast.success('Pitch count session saved successfully!');
      
      // Reset live counter
      setBalls(0);
      setStrikes(0);
      setInPlay(0);
      setNotes('');
      
      // Reload history log
      await loadHistory();
    } catch (err) {
      console.error('Failed to save pitch count session:', err);
      toast.error('Failed to save pitch count session.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (window.confirm('Delete this saved pitch count session?')) {
      try {
        await firebaseService.deletePitchCountSession(sessionId);
        toast.success('Session deleted.');
        setSavedSessions(prev => prev.filter(s => s.id !== sessionId));
      } catch (err) {
        toast.error('Could not delete session.');
      }
    }
  };

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
          disabled={totalPitches === 0}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 disabled:opacity-40 transition-all"
        >
          <RotateCcw size={14} />
          Reset Counter
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-700/60 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 mb-2">
              <Activity size={14} /> Pitch Counter
            </div>
            <h2 className="text-2xl font-black tracking-tight">Live Pitch Tracker</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Count balls & strikes in real-time, compute strike %, and associate with your roster.
            </p>
          </div>

          {/* Roster Selector */}
          <div className="w-full sm:w-64">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Associate Pitcher
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select
                value={selectedPlayerId}
                onChange={(e) => setSelectedPlayerId(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Unassigned / Guest</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.jerseyNumber ? `#${p.jerseyNumber} ` : ''}{p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Main Pitch HUD / Displays */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Pitches */}
          <div className="col-span-2 md:col-span-1 bg-slate-900 text-white dark:bg-slate-950 p-5 rounded-2xl flex flex-col justify-between border border-slate-800 shadow-inner">
            <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Total Pitches</span>
            <div className="my-2">
              <span className="text-5xl font-black tracking-tight">{totalPitches}</span>
            </div>
            <span className="text-xs text-slate-400 font-medium">Recorded this session</span>
          </div>

          {/* Strike Percentage */}
          <div className="col-span-2 md:col-span-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 p-5 rounded-2xl flex flex-col justify-between">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">Strike %</span>
            <div className="my-2">
              <span className="text-5xl font-black text-emerald-900 dark:text-emerald-300 tracking-tight">
                {strikePercentage}%
              </span>
            </div>
            <span className="text-xs text-emerald-700/80 dark:text-emerald-400/80 font-medium">
              {strikeCountWithInPlay} strikes / {totalPitches} total
            </span>
          </div>

          {/* Balls Count */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 p-5 rounded-2xl flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <span className="text-xs font-extrabold uppercase tracking-widest text-amber-700 dark:text-amber-400">Balls</span>
              <button 
                onClick={() => setBalls(Math.max(0, balls - 1))}
                disabled={balls === 0}
                className="p-1 text-amber-700 dark:text-amber-400 hover:bg-amber-200/50 dark:hover:bg-amber-900/50 rounded-lg disabled:opacity-30"
                title="Subtract 1 ball"
              >
                <Minus size={14} />
              </button>
            </div>
            <div className="my-1">
              <span className="text-4xl font-black text-amber-900 dark:text-amber-300">{balls}</span>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((num) => (
                <div 
                  key={num} 
                  className={`h-2 flex-1 rounded-full ${num <= balls ? 'bg-amber-500' : 'bg-amber-200 dark:bg-amber-900/50'}`} 
                />
              ))}
            </div>
          </div>

          {/* Strikes Count */}
          <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/40 p-5 rounded-2xl flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-700 dark:text-indigo-400">Strikes</span>
              <button 
                onClick={() => setStrikes(Math.max(0, strikes - 1))}
                disabled={strikes === 0}
                className="p-1 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-200/50 dark:hover:bg-indigo-900/50 rounded-lg disabled:opacity-30"
                title="Subtract 1 strike"
              >
                <Minus size={14} />
              </button>
            </div>
            <div className="my-1">
              <span className="text-4xl font-black text-indigo-900 dark:text-indigo-300">{strikes}</span>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3].map((num) => (
                <div 
                  key={num} 
                  className={`h-2 flex-1 rounded-full ${num <= strikes ? 'bg-indigo-600' : 'bg-indigo-200 dark:bg-indigo-900/50'}`} 
                />
              ))}
            </div>
          </div>
        </div>

        {/* Pitch Entry Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <button
            onClick={() => setBalls(b => b + 1)}
            className="flex items-center justify-center gap-3 py-5 px-6 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
          >
            <Plus size={22} />
            + Ball
          </button>

          <button
            onClick={() => setStrikes(s => s + 1)}
            className="flex items-center justify-center gap-3 py-5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
          >
            <Plus size={22} />
            + Strike
          </button>

          <button
            onClick={() => setInPlay(p => p + 1)}
            className="flex items-center justify-center gap-3 py-5 px-6 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl font-black text-lg shadow-lg shadow-sky-600/20 active:scale-95 transition-all"
          >
            <Plus size={22} />
            + In-Play / Foul
          </button>
        </div>

        {/* Session Notes & Save CTA */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Session Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Scrimmage vs Blue Team, 2 Inning Outing..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium dark:text-white"
            />
          </div>

          <button
            onClick={handleSaveSession}
            disabled={totalPitches === 0 || isSaving}
            className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 shrink-0"
          >
            <Save size={18} />
            {isSaving ? 'Saving...' : 'Save Session'}
          </button>
        </div>
      </div>

      {/* Saved Pitch Count Sessions History */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Pitch Count History</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Past recorded pitch logging sessions</p>
          </div>
          <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300">
            {savedSessions.length} {savedSessions.length === 1 ? 'Session' : 'Sessions'}
          </span>
        </div>

        {isLoadingHistory ? (
          <div className="py-8 text-center text-sm font-medium text-slate-400">Loading pitch history...</div>
        ) : savedSessions.length === 0 ? (
          <div className="py-12 text-center text-slate-400 dark:text-slate-500 font-medium text-sm">
            No saved pitch count sessions found yet. Start tracking and save a session above!
          </div>
        ) : (
          <div className="space-y-3">
            {savedSessions.map((session) => {
              let displayDate = 'Recently';
              if (session.createdAt) {
                if (session.createdAt.toDate) {
                  displayDate = session.createdAt.toDate().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                } else if (typeof session.createdAt === 'string') {
                  displayDate = new Date(session.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                }
              }

              return (
                <div
                  key={session.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 dark:text-white text-base">
                        {session.playerName || 'Unassigned Pitcher'}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-extrabold bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950">
                        {session.totalPitches} Pitches
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {session.strikePercentage}% Strikes
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <span>Balls: <strong className="text-amber-600 dark:text-amber-400">{session.balls}</strong></span>
                      <span>Strikes: <strong className="text-indigo-600 dark:text-indigo-400">{session.strikes}</strong></span>
                      {session.inPlay !== undefined && (
                        <span>In-Play: <strong className="text-sky-600 dark:text-sky-400">{session.inPlay}</strong></span>
                      )}
                      <span className="inline-flex items-center gap-1 text-slate-400 ml-2">
                        <Calendar size={12} /> {displayDate}
                      </span>
                    </div>

                    {session.notes && (
                      <p className="text-xs italic text-slate-600 dark:text-slate-400 mt-1">
                        "{session.notes}"
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteSession(session.id)}
                    className="self-end sm:self-center p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors"
                    title="Delete session"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
