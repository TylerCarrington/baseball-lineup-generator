import React from 'react';
import { Player, Game, RSVPStatus } from '../../types';

interface NotAttendingListProps {
  outPlayers: Player[];
  readOnly?: boolean;
  gameId?: string;
  isLocked?: boolean;
  handleUpdateGameRSVP?: (gameId: string, playerId: string, newStatus: RSVPStatus) => Promise<void>;
}

export const NotAttendingList: React.FC<NotAttendingListProps> = ({
  outPlayers,
  readOnly = false,
  gameId,
  isLocked = false,
  handleUpdateGameRSVP
}) => {
  if (outPlayers.length === 0) return null;

  return (
    <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-lg font-black text-slate-400 dark:text-slate-500 uppercase tracking-tight">Not Attending</h3>
        <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">{outPlayers.length} Out</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {outPlayers.map(player => (
          <div key={player.id} className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 rounded-xl flex items-center justify-center text-xs font-black">
                OUT
              </div>
              <p className="font-bold text-slate-500 dark:text-slate-400">
                {player.name}
                {player.jerseyNumber && (
                  <span className="text-xs text-slate-400 dark:text-slate-500 ml-1">#{player.jerseyNumber}</span>
                )}
              </p>
            </div>
            {!readOnly && !isLocked && gameId && handleUpdateGameRSVP && (
              <div className="flex gap-1 print:hidden">
                <button
                  onClick={() => handleUpdateGameRSVP(gameId, player.id, RSVPStatus.YES)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all"
                >
                  Activate
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
