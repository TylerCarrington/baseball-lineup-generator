import React from 'react';
import { 
  ChevronLeft, 
  Calendar, 
  Users, 
  RotateCcw, 
  Check, 
  Save, 
  Edit2,
  MapPin 
} from 'lucide-react';
import { Game, RSVPStatus } from '../../types';
import { 
  getLocalDateString 
} from '../../lib/utils';

interface GameHeaderProps {
  game: Game;
  readOnly?: boolean;
  onBack?: () => void;
  isEditingRSVPs?: boolean;
  setIsEditingRSVPs?: (val: boolean) => void;
  editOpponent?: string;
  setEditOpponent?: (val: string) => void;
  editLocation?: string;
  setEditLocation?: (val: string) => void;
  editGameName?: string;
  setEditGameName?: (val: string) => void;
  editGameDate?: string;
  setEditGameDate?: (val: string) => void;
  editGameTime?: string;
  setEditGameTime?: (val: string) => void;
  editIsHome?: boolean;
  setEditIsHome?: (val: boolean) => void;
  handleTogglePublish?: (gameId: string, currentStatus: boolean) => Promise<void>;
  handleUpdateGameDetails?: () => Promise<void>;
  resetEditState?: (game: Game) => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  game,
  readOnly = false,
  onBack,
  isEditingRSVPs = false,
  setIsEditingRSVPs,
  editOpponent = '',
  setEditOpponent,
  editLocation = '',
  setEditLocation,
  editGameName = '',
  setEditGameName,
  editGameDate = '',
  setEditGameDate,
  editGameTime = '',
  setEditGameTime,
  editIsHome = true,
  setEditIsHome,
  handleTogglePublish,
  handleUpdateGameDetails,
  resetEditState,
}) => {
  const isLocked = game.isLocked || false;
  const confirmedCount = Object.values(game.rsvps || {}).filter(v => v === RSVPStatus.YES).length;

  const gameDateObj = game.date?.toDate ? game.date.toDate() : new Date(game.date);
  const formattedDate = gameDateObj.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });

  return (
    <div className="space-y-6 mb-6">
      {onBack && (
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold text-sm mb-6 transition-colors group"
        >
          <ChevronLeft size={18} />
          Back to Schedule
        </button>
      )}

      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-xl border border-slate-800">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="flex-1 min-w-0">
            {isEditingRSVPs ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
                {game.mode === 'standard' ? (
                  <>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Opponent</label>
                      <input 
                        type="text" 
                        value={editOpponent}
                        onChange={(e) => setEditOpponent?.(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-2xl focus:outline-none focus:border-emerald-500 shadow-sm transition-all font-bold"
                        placeholder="e.g. Vipers"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Location</label>
                      <input 
                        type="text" 
                        value={editLocation}
                        onChange={(e) => setEditLocation?.(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-2xl focus:outline-none focus:border-emerald-500 shadow-sm transition-all font-bold"
                        placeholder="e.g. Field 4"
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Location (Optional)</label>
                    <input 
                      type="text" 
                      value={editLocation}
                      onChange={(e) => setEditLocation?.(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-2xl focus:outline-none focus:border-emerald-500 shadow-sm transition-all font-bold"
                      placeholder="e.g. Field 4 (Optional)"
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Game Date</label>
                  <input 
                    type="date" 
                    value={editGameDate}
                    onChange={(e) => setEditGameDate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-2xl focus:outline-none focus:border-emerald-500 shadow-sm transition-all font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Game Time</label>
                  <input 
                    type="time" 
                    value={editGameTime}
                    onChange={(e) => setEditGameTime(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-2xl focus:outline-none focus:border-emerald-500 shadow-sm transition-all font-bold"
                  />
                </div>
                {game.mode !== 'scrimmage' && (
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Home / Away</label>
                    <div className="flex bg-slate-700 p-1 rounded-2xl border border-slate-600">
                      <button
                        onClick={() => setEditIsHome(true)}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${editIsHome ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'}`}
                      >
                        Home
                      </button>
                      <button
                        onClick={() => setEditIsHome(false)}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!editIsHome ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'}`}
                      >
                        Away
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="mb-3">
                  <h2 className="text-3xl sm:text-5xl font-black tracking-tighter truncate leading-tight">
                    {game.name}
                  </h2>
                  <div className="flex items-center gap-3 mt-3">
                    {isLocked && (
                      <span className="px-2 py-0.5 bg-emerald-500 text-white rounded text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                        Published
                      </span>
                    )}
                    {game.mode === 'scrimmage' && (
                      <span className="px-2 py-0.5 bg-indigo-500 text-white rounded text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20">
                        Scrimmage
                      </span>
                    )}
                    {game.mode !== 'scrimmage' && (
                      <span className={`px-2 py-0.5 ${game.isHome ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700'} rounded text-[10px] font-black uppercase tracking-widest shadow-sm`}>
                        {game.isHome ? 'Home' : 'Away'}
                      </span>
                    )}
                    {game.time && (
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                        {(() => {
                          const [hours, minutes] = game.time.split(':');
                          const h = parseInt(hours);
                          const ampm = h >= 12 ? 'PM' : 'AM';
                          const h12 = h % 12 || 12;
                          return `${h12}:${minutes} ${ampm}`;
                        })()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-6 text-slate-400">
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-emerald-500" />
                    <span className="text-base font-bold">
                      {formattedDate}
                    </span>
                  </div>
                  {game.location && (
                    <div className="flex items-center gap-2">
                      <MapPin size={18} className="text-emerald-500" />
                      <span className="text-base font-bold">
                        {game.location}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Users size={18} className="text-emerald-500" />
                    <span className="text-base font-bold">
                      {confirmedCount} Players In
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {!readOnly && (
            <div className="flex flex-row items-center gap-3 shrink-0 w-full lg:w-auto">
              <button 
                onClick={() => handleTogglePublish?.(game.id, isLocked)}
                className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 sm:px-8 py-3 sm:py-4 rounded-2xl transition-all text-xs sm:text-sm font-black border shadow-lg ${
                  isLocked 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 shadow-emerald-500/5' 
                    : 'bg-white/10 text-white border-white/10 hover:bg-white/20 shadow-black/5'
                }`}
              >
                {isLocked ? <RotateCcw size={18} className="sm:size-20" /> : <Check size={18} className="sm:size-20" />}
                <span>{isLocked ? 'Unpublish' : 'Publish'}</span>
              </button>
              <button 
                onClick={() => {
                  if (isEditingRSVPs) {
                    handleUpdateGameDetails?.();
                  } else {
                    resetEditState?.(game);
                    setIsEditingRSVPs?.(true);
                  }
                }}
                className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 sm:px-8 py-3 sm:py-4 rounded-2xl transition-all text-xs sm:text-sm font-black border ${
                  isEditingRSVPs 
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-xl shadow-emerald-500/30' 
                    : 'bg-white text-slate-900 border-white hover:bg-slate-100 shadow-xl shadow-black/10'
                }`}
              >
                {isEditingRSVPs ? <Save size={18} className="sm:size-20" /> : <Edit2 size={18} className="sm:size-20" />}
                <span>{isEditingRSVPs ? 'Save' : 'Edit'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
