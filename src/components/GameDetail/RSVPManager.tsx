import React from 'react';
import { User as UserIcon } from 'lucide-react';
import { Game, Player, RSVPStatus } from '../../types';
import { getPositionAbbreviation } from '../../lib/utils';

interface RSVPManagerProps {
  game: Game;
  players: Player[];
  handleUpdateRSVP: (gameId: string, playerId: string, newStatus: RSVPStatus) => Promise<void>;
  onFinish?: () => void;
}

export const RSVPManager: React.FC<RSVPManagerProps> = ({
  game,
  players,
  handleUpdateRSVP,
  onFinish
}) => {
  const confirmedCount = players.filter(p => game.rsvps[p.id] === RSVPStatus.YES).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Manage RSVPs</h3>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-2xl text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            {confirmedCount} Confirmed
          </div>
          {onFinish && (
            <button
              onClick={onFinish}
              className="px-4 py-2 bg-slate-900 dark:bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity"
            >
              Done
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...players].sort((a, b) => a.name.localeCompare(b.name)).map(player => (
          <div key={player.id} className="flex items-center justify-between p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                game.rsvps[player.id] === RSVPStatus.YES ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 
                game.rsvps[player.id] === RSVPStatus.NO ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' : 
                'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
              }`}>
                <UserIcon size={20} />
              </div>
              <div>
                <p className="font-black text-slate-900 dark:text-white">{player.name}</p>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {(player.positions || []).map(getPositionAbbreviation).join(', ')}
                </p>
              </div>
            </div>
            <div className="flex gap-1 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-2xl w-full sm:w-auto">
              {[RSVPStatus.YES, RSVPStatus.TENTATIVE, RSVPStatus.NO].map(status => (
                <button
                  key={status}
                  onClick={() => handleUpdateRSVP(game.id, player.id, status)}
                  className={`flex-1 px-2 sm:px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    game.rsvps[player.id] === status
                      ? status === RSVPStatus.YES ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' :
                        status === RSVPStatus.NO ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/20' :
                        'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                      : 'text-slate-400 dark:text-slate-500 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300'
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
  );
};
