import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Users, ClipboardList, Trophy, CalendarCheck } from 'lucide-react';
import { Player, RSVPStatus, PracticeActivity } from '../types';
import { getPositionAbbreviation, getLocalDateString } from '../lib/utils';
import { firebaseService } from '../services/firebaseService';
import { User } from 'firebase/auth';
import { serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';

interface CreateGameViewProps {
  players: Player[];
  user: User | null;
  activeSeasonId: string;
}

export function CreateGameView({
  players,
  user,
  activeSeasonId
}: CreateGameViewProps) {
  const navigate = useNavigate();
  
  // Internalised state for creation
  const [viewStep, setViewStep] = useState<1 | 2>(1);
  const [eventType, setEventType] = useState<'game' | 'practice'>('game');
  const [opponent, setOpponent] = useState('');
  const [opponentError, setOpponentError] = useState(false);
  const [location, setLocation] = useState('');
  const [gameDate, setGameDate] = useState(getLocalDateString());
  const [gameTime, setGameTime] = useState('');
  const [duration, setDuration] = useState(90);
  const [numGroups, setNumGroups] = useState(3);
  const [isHome, setIsHome] = useState(true);
  const [gameMode, setGameMode] = useState<'standard' | 'scrimmage'>('standard');
  const [playerRSVPs, setPlayerRSVPs] = useState<Record<string, RSVPStatus>>({});

  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return getLocalDateString(d);
  });

  // Initialize RSVPs to YES by default for all players
  useEffect(() => {
    const initialRSVPs: Record<string, RSVPStatus> = {};
    players.forEach(p => {
      initialRSVPs[p.id] = RSVPStatus.YES;
    });
    setPlayerRSVPs(initialRSVPs);
  }, [players]);

  const handleRSVPChange = (playerId: string, status: RSVPStatus) => {
    setPlayerRSVPs(prev => ({
      ...prev,
      [playerId]: status
    }));
  };

  const handleCreateGame = async () => {
    if (eventType === 'game' && gameMode === 'standard' && !opponent.trim()) {
      setOpponentError(true);
      toast.error("Opponent is required", {
        description: "Please specify the opponent for standard games.",
        position: 'top-center',
      });
      return;
    }
    setOpponentError(false);

    // Initial batting order: Yes first, then Tentative
    const yesPlayers = players.filter(p => playerRSVPs[p.id] === RSVPStatus.YES).map(p => p.id).sort(() => Math.random() - 0.5);
    const tentativePlayers = players.filter(p => playerRSVPs[p.id] === RSVPStatus.TENTATIVE).map(p => p.id).sort(() => Math.random() - 0.5);
    const initialBattingOrder = [...yesPlayers, ...tentativePlayers];

    const generatedName = eventType === 'practice'
      ? 'Practice'
      : gameMode === 'scrimmage' 
        ? 'Scrimmage' 
        : `${isHome ? 'vs' : '@'} ${opponent.trim()}`;

    const eventsToCreate: { date: Date }[] = [];
    const baseDate = new Date(gameDate + 'T12:00:00');
    
    if (isRecurring && eventType === 'practice') {
      const endDate = new Date(recurrenceEndDate + 'T23:59:59');
      let current = new Date(baseDate);
      while (current <= endDate) {
        eventsToCreate.push({ date: new Date(current) });
        current.setDate(current.getDate() + 7);
      }
    } else {
      eventsToCreate.push({ date: baseDate });
    }

    let firstDocRef = null;

    try {
      for (const event of eventsToCreate) {
        // Generate new UUIDs for each event's agenda so they don't share identical IDs if cloned
        const eventAgenda: PracticeActivity[] = eventType === 'practice' ? [
          { id: crypto.randomUUID(), name: 'Warmups', duration: 10, type: 'team', category: 'Conditioning & Warm-Up', startTimeOffset: 0 },
          { id: crypto.randomUUID(), name: 'Game', duration: 10, type: 'team', category: 'Teamwork & Situational', startTimeOffset: Math.max(0, duration - 10) }
        ] : [];

        const docRef = await firebaseService.addGame({
          name: generatedName,
          opponent: eventType === 'practice' ? null : (opponent.trim() || null),
          location: location.trim() || null,
          date: event.date,
          time: gameTime || null,
          duration: eventType === 'practice' ? duration : null,
          isHome: (eventType === 'practice' || gameMode === 'scrimmage') ? null : isHome,
          rsvps: playerRSVPs,
          battingOrder: initialBattingOrder,
          mode: eventType === 'practice' ? 'standard' : gameMode,
          type: eventType,
          practiceAgenda: eventAgenda,
          numGroups: (eventType === 'practice' || gameMode === 'scrimmage') ? numGroups : null,
          uid: user.uid,
          seasonId: activeSeasonId,
          createdAt: serverTimestamp()
        });
        
        if (!firstDocRef) firstDocRef = docRef;
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to create all events.");
      return;
    }

    if (firstDocRef) {
      toast.success(`${eventsToCreate.length} ${eventType === 'practice' ? 'Practice' : 'Game'}${eventsToCreate.length > 1 ? 's' : ''} created successfully!`);
      navigate('/games');
    }
  };

  const onCancel = () => {
    navigate('/games');
  };
  if (viewStep === 1) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-0">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Select Event Type</h2>
                <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">What would you like to schedule?</p>
              </div>
              <button 
                onClick={onCancel}
                className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => {
                  setEventType('game');
                  setGameMode('standard');
                  setViewStep(2);
                }}
                className="group relative overflow-hidden p-6 sm:p-8 bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-100 dark:border-slate-700 hover:border-slate-900 dark:hover:border-indigo-500 transition-all text-left"
              >
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center text-slate-900 dark:text-white mb-6 group-hover:bg-slate-900 dark:group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Trophy size={24} />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Game</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Schedule a matchup against an opponent.</p>
              </button>

              <button
                onClick={() => {
                  setEventType('game');
                  setGameMode('scrimmage');
                  setViewStep(2);
                }}
                className="group relative overflow-hidden p-6 sm:p-8 bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-100 dark:border-slate-700 hover:border-slate-900 dark:hover:border-indigo-500 transition-all text-left"
              >
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center text-slate-900 dark:text-white mb-6 group-hover:bg-slate-900 dark:group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <ClipboardList size={24} />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Scrimmage</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Organize an intrasquad scrimmage.</p>
              </button>

              <button
                onClick={() => {
                  setEventType('practice');
                  setGameMode('standard');
                  setViewStep(2);
                }}
                className="group relative overflow-hidden p-6 sm:p-8 bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-100 dark:border-slate-700 hover:border-slate-900 dark:hover:border-indigo-500 transition-all text-left"
              >
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center text-slate-900 dark:text-white mb-6 group-hover:bg-slate-900 dark:group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <CalendarCheck size={24} />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Practice</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Organize training sessions and drills.</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-0">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Add {eventType === 'practice' ? 'New Practice' : gameMode === 'scrimmage' ? 'New Scrimmage' : 'New Game'}
              </h2>
              <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">Set player availability for this {eventType === 'practice' ? 'practice' : gameMode === 'scrimmage' ? 'scrimmage' : 'game'}</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setViewStep(1)}
                className="text-xs font-bold text-slate-400 hover:text-slate-900 dark:hover:text-white px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors"
                title="Go back to selection"
              >
                Back
              </button>
              <button 
                onClick={onCancel}
                className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Mode selection has been removed since it's on step 1 */}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {eventType === 'game' && gameMode === 'standard' && (
              <div className="space-y-2">
                <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Opponent</label>
                <input 
                  type="text" 
                  value={opponent}
                  onChange={(e) => {
                    setOpponent(e.target.value);
                    if (e.target.value.trim()) setOpponentError(false);
                  }}
                  placeholder="e.g. Vipers"
                  className={`w-full px-4 sm:px-6 py-3 sm:py-4 bg-white dark:bg-slate-800 border rounded-2xl focus:outline-none focus:ring-4 transition-all text-base sm:text-lg font-medium text-slate-900 dark:text-white ${
                    opponentError 
                      ? 'border-red-500 focus:ring-red-500/10 focus:border-red-500' 
                      : 'border-slate-200 dark:border-slate-700 focus:ring-slate-900/5 dark:focus:ring-indigo-500/10 focus:border-slate-900 dark:focus:border-indigo-500'
                  }`}
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Location (Optional)</label>
              <input 
                type="text" 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Field 4"
                className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-slate-900/5 dark:focus:ring-indigo-500/10 focus:border-slate-900 dark:focus:border-indigo-500 transition-all text-base sm:text-lg font-medium text-slate-900 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                {eventType === 'practice' ? 'Practice Date' : gameMode === 'scrimmage' ? 'Scrimmage Date' : 'Game Date'}
              </label>
              <input 
                type="date" 
                value={gameDate}
                onChange={(e) => setGameDate(e.target.value)}
                className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-slate-900/5 dark:focus:ring-indigo-500/10 focus:border-slate-900 dark:focus:border-indigo-500 transition-all text-base sm:text-lg font-medium text-slate-900 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                {eventType === 'practice' ? 'Practice Time' : gameMode === 'scrimmage' ? 'Scrimmage Time' : 'Game Time'} (Optional)
              </label>
              <input 
                type="time" 
                value={gameTime}
                onChange={(e) => setGameTime(e.target.value)}
                className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-slate-900/5 dark:focus:ring-indigo-500/10 focus:border-slate-900 dark:focus:border-indigo-500 transition-all text-base sm:text-lg font-medium text-slate-900 dark:text-white"
              />
            </div>
            {eventType === 'practice' && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Practice Duration</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-slate-900/5 dark:focus:ring-indigo-500/10 focus:border-slate-900 dark:focus:border-indigo-500 transition-all text-base sm:text-lg font-medium text-slate-900 dark:text-white appearance-none"
                  >
                    <option value={60}>60 Minutes</option>
                    <option value={75}>75 Minutes</option>
                    <option value={90}>90 Minutes (Default)</option>
                    <option value={105}>105 Minutes</option>
                    <option value={120}>120 Minutes</option>
                  </select>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-bold text-slate-900 dark:text-white">Repeat Weekly?</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={isRecurring}
                        onChange={(e) => setIsRecurring(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                  
                  {isRecurring && (
                    <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                        Repeat Until
                      </label>
                      <input 
                        type="date" 
                        value={recurrenceEndDate}
                        onChange={(e) => setRecurrenceEndDate(e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium text-slate-900 dark:text-white"
                      />
                      <p className="text-xs text-slate-500 mt-2">
                        This creates a separate practice for every week on the same day. You can customize the activities for each individual practice later.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
            {(eventType === 'practice' || (eventType === 'game' && gameMode === 'scrimmage')) && (
              <div className="space-y-2">
                <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Number of Groups</label>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
                  {[1, 2, 3, 4].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setNumGroups(num)}
                      className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${numGroups === num ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {eventType === 'game' && gameMode !== 'scrimmage' && (
              <div className="space-y-2">
                <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Home / Away</label>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setIsHome(true)}
                    className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${isHome ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                  >
                    Home
                  </button>
                  <button
                    onClick={() => setIsHome(false)}
                    className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${!isHome ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                  >
                    Away
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="font-bold text-slate-900 dark:text-white">Player Availability</h3>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{players.length} Total</span>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {[...players].sort((a, b) => a.name.localeCompare(b.name)).map((player) => (
              <div key={player.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 transition-all gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-900 dark:text-white font-bold border border-slate-200 dark:border-slate-600 shrink-0">
                    {player.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white truncate">{player.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">{(player.positions || []).map(getPositionAbbreviation).join(', ')}</p>
                  </div>
                </div>

                <div className="flex bg-white dark:bg-slate-700 p-1 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm w-full sm:w-auto">
                  {[RSVPStatus.YES, RSVPStatus.TENTATIVE, RSVPStatus.NO].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleRSVPChange(player.id, status)}
                      className={`flex-1 px-3 sm:px-4 py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${
                        playerRSVPs[player.id] === status
                          ? status === RSVPStatus.YES 
                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' 
                            : status === RSVPStatus.TENTATIVE
                              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                              : 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                          : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
                      }`}
                    >
                      {status === RSVPStatus.TENTATIVE ? 'Maybe' : status}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 sm:p-8 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button 
            onClick={handleCreateGame}
            className="flex-1 py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-bold hover:bg-slate-800 dark:hover:bg-indigo-500 transition-all shadow-lg shadow-slate-900/20 dark:shadow-indigo-900/20 active:scale-[0.98]"
          >
            Add {eventType === 'practice' ? 'Practice' : gameMode === 'scrimmage' ? 'Scrimmage' : 'Game'}
          </button>
          <button 
            onClick={onCancel}
            className="flex-1 py-4 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-[0.98]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
