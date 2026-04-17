import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Users, ClipboardList } from 'lucide-react';
import { Player, RSVPStatus } from '../types';
import { getPositionAbbreviation, getLocalDateString } from '../lib/utils';
import { firebaseService } from '../services/firebaseService';
import { User } from 'firebase/auth';
import { serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';

interface CreateGameViewProps {
  players: Player[];
  user: User | null;
}

export function CreateGameView({
  players,
  user
}: CreateGameViewProps) {
  const navigate = useNavigate();
  
  // Internalised state for creation
  const [gameName, setGameName] = useState('');
  const [gameNameError, setGameNameError] = useState(false);
  const [gameDate, setGameDate] = useState(getLocalDateString());
  const [gameTime, setGameTime] = useState('');
  const [isHome, setIsHome] = useState(true);
  const [gameMode, setGameMode] = useState<'standard' | 'scrimmage'>('standard');
  const [playerRSVPs, setPlayerRSVPs] = useState<Record<string, RSVPStatus>>({});

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
    if (!user || !gameName.trim()) {
      setGameNameError(true);
      toast.error("Game name is required", {
        description: "Please provide a name for this game before continuing.",
        position: 'top-center',
      });
      return;
    }
    setGameNameError(false);

    // Initial batting order: Yes first, then Tentative
    const yesPlayers = players.filter(p => playerRSVPs[p.id] === RSVPStatus.YES).map(p => p.id).sort(() => Math.random() - 0.5);
    const tentativePlayers = players.filter(p => playerRSVPs[p.id] === RSVPStatus.TENTATIVE).map(p => p.id).sort(() => Math.random() - 0.5);
    const initialBattingOrder = [...yesPlayers, ...tentativePlayers];

    const docRef = await firebaseService.addGame({
      name: gameName.trim(),
      date: new Date(gameDate + 'T12:00:00'),
      time: gameTime || null,
      isHome: gameMode === 'scrimmage' ? null : isHome,
      rsvps: playerRSVPs,
      battingOrder: initialBattingOrder,
      mode: gameMode,
      uid: user.uid,
      createdAt: serverTimestamp()
    });

    if (docRef) {
      toast.success("Game created successfully!");
      navigate('/games');
    }
  };

  const onCancel = () => {
    navigate('/games');
  };
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-0">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Add New Game</h2>
              <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">Set player availability for this game</p>
            </div>
            <button 
              onClick={onCancel}
              className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            >
              <X size={24} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Game Name</label>
              <input 
                type="text" 
                value={gameName}
                onChange={(e) => {
                  setGameName(e.target.value);
                  if (e.target.value.trim()) setGameNameError(false);
                }}
                placeholder="e.g. May 20th - Vipers"
                className={`w-full px-4 sm:px-6 py-3 sm:py-4 bg-white dark:bg-slate-800 border rounded-2xl focus:outline-none focus:ring-4 transition-all text-base sm:text-lg font-medium text-slate-900 dark:text-white ${
                  gameNameError 
                    ? 'border-red-500 focus:ring-red-500/10 focus:border-red-500' 
                    : 'border-slate-200 dark:border-slate-700 focus:ring-slate-900/5 dark:focus:ring-indigo-500/10 focus:border-slate-900 dark:focus:border-indigo-500'
                }`}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Game Date</label>
              <input 
                type="date" 
                value={gameDate}
                onChange={(e) => setGameDate(e.target.value)}
                className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-slate-900/5 dark:focus:ring-indigo-500/10 focus:border-slate-900 dark:focus:border-indigo-500 transition-all text-base sm:text-lg font-medium text-slate-900 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Game Time (Optional)</label>
              <input 
                type="time" 
                value={gameTime}
                onChange={(e) => setGameTime(e.target.value)}
                className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-slate-900/5 dark:focus:ring-indigo-500/10 focus:border-slate-900 dark:focus:border-indigo-500 transition-all text-base sm:text-lg font-medium text-slate-900 dark:text-white"
              />
            </div>
            {gameMode !== 'scrimmage' && (
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

          <div className="mt-6 space-y-3">
            <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Game Mode</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setGameMode('standard')}
                className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                  gameMode === 'standard'
                    ? 'bg-slate-900 dark:bg-indigo-600 text-white border-slate-900 dark:border-indigo-600 shadow-lg shadow-slate-900/20 dark:shadow-indigo-600/20'
                    : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${gameMode === 'standard' ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700'}`}>
                  <ClipboardList size={18} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-black uppercase tracking-tight">Standard</p>
                  <p className="text-[10px] opacity-70">Full lineup generation</p>
                </div>
              </button>
              <button
                onClick={() => setGameMode('scrimmage')}
                className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                  gameMode === 'scrimmage'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20'
                    : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${gameMode === 'scrimmage' ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700'}`}>
                  <Users size={18} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-black uppercase tracking-tight">Scrimmage</p>
                  <p className="text-[10px] opacity-70">Manual P/C & Groups</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="font-bold text-slate-900 dark:text-white">Player RSVP</h3>
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
                      className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${
                        playerRSVPs[player.id] === status
                          ? status === RSVPStatus.YES 
                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' 
                            : status === RSVPStatus.TENTATIVE
                              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                              : 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                          : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
                      }`}
                    >
                      {status}
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
            Add Game
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
