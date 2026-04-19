import React from 'react';
import { Game, Player, RSVPStatus } from '../../types';
import { getPositionAbbreviation } from '../../lib/utils';

interface ScrimmageGroupsViewProps {
  game: Game;
  players: Player[];
  handleUpdateGameRSVP: (gameId: string, playerId: string, newStatus: RSVPStatus) => Promise<void>;
}

export const ScrimmageGroupsView: React.FC<ScrimmageGroupsViewProps> = ({
  game,
  players,
  handleUpdateGameRSVP,
}) => {
  const numGroups = game.numGroups || 4;
  const groups = game.scrimmageGroups || [];
  const inPlayers = players.filter(p => game.rsvps[p.id] !== RSVPStatus.NO);
  const outPlayers = players.filter(p => game.rsvps[p.id] === RSVPStatus.NO).sort((a, b) => a.name.localeCompare(b.name));
  
  const groupedPlayers: Record<string, Player[]> = {};
  for (let i = 1; i <= numGroups; i++) {
    groupedPlayers[`Group ${i}`] = [];
  }
  groupedPlayers['Unassigned'] = [];
  
  inPlayers.forEach(p => {
    let assigned = false;
    for (let i = 0; i < numGroups; i++) {
      if (groups[i] && groups[i].includes(p.id)) {
        groupedPlayers[`Group ${i + 1}`].push(p);
        assigned = true;
        break;
      }
    }
    if (!assigned) {
      groupedPlayers['Unassigned'].push(p);
    }
  });
  
  Object.keys(groupedPlayers).forEach(key => {
    groupedPlayers[key].sort((a, b) => a.name.localeCompare(b.name));
  });

  const groupNames = [...Array.from({ length: numGroups }).map((_, i) => `Group ${i + 1}`), 'Unassigned'];

  return (
    <div className="space-y-8">
      {groupNames.map(groupName => {
        const groupPlayers = groupedPlayers[groupName];
        if (groupPlayers.length === 0) return null;
        
        return (
          <div key={groupName} className="space-y-3">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{groupName}</h3>
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{groupPlayers.length} Players</span>
            </div>
            <div className="overflow-hidden bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                    <th scope="col" className="text-left py-4 px-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 border-b border-slate-50 dark:border-slate-800 min-w-[150px]">Player</th>
                    {game.type !== 'practice' && [1, 2, 3, 4, 5, 6].map(inning => (
                      <th key={inning} scope="col" className="text-center py-4 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 border-b border-slate-50 dark:border-slate-800">Inn {inning}</th>
                    ))}
                    <th scope="col" className="text-right py-4 px-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 border-b border-slate-50 dark:border-slate-800 min-w-[140px]">RSVP Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {groupPlayers.map(player => {
                    const inningPositions: Record<number, string> = {};
                    if (game.type !== 'practice' && game.lineup) {
                      [1, 2, 3, 4, 5, 6].forEach(inning => {
                        const inningLineup = game.lineup?.[inning.toString()] || {};
                        let position = Object.entries(inningLineup).find(([key, id]) => id === player.id && key !== 'HittingGroup')?.[0];
                        
                        if (!position) {
                          const hittingGroupIdxStr = inningLineup['HittingGroup'];
                          if (hittingGroupIdxStr != null) {
                            const hittingGroupIdx = parseInt(hittingGroupIdxStr as string);
                            if (game.scrimmageGroups?.[hittingGroupIdx]?.includes(player.id)) {
                              position = 'Hitting';
                            }
                          }
                        }
                        
                        if (!position) position = 'Hitting';
                        if (position.startsWith('Extra Hitter')) position = 'EH';
                        inningPositions[inning] = position;
                      });
                    }

                    return (
                      <tr key={player.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <th scope="row" className="py-4 px-5 text-left">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg flex items-center justify-center text-xs font-black">
                              {player.name.charAt(0)}
                            </div>
                            <span className="font-black text-slate-900 dark:text-slate-200 text-sm">{player.name}</span>
                          </div>
                        </th>
                        {game.type !== 'practice' && [1, 2, 3, 4, 5, 6].map(inning => {
                          const position = inningPositions[inning];
                          const isHitting = position === 'Hitting';
                          return (
                            <td key={inning} className="py-4 px-2 text-center">
                              {position ? (
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-lg border inline-block min-w-[32px] ${
                                  isHitting
                                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-100/50 dark:border-indigo-800/50'
                                    : 'bg-slate-50/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-700/50'
                                }`}>
                                  {getPositionAbbreviation(position)}
                                </span>
                              ) : (
                                <span className="text-slate-200 dark:text-slate-800">—</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="py-4 px-5 text-right">
                          <div className="flex gap-1 justify-end">
                            {[RSVPStatus.YES, RSVPStatus.TENTATIVE, RSVPStatus.NO].map(status => (
                              <button
                                key={status}
                                onClick={() => handleUpdateGameRSVP(game.id, player.id, status)}
                                className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all border ${
                                  game.rsvps[player.id] === status
                                    ? status === RSVPStatus.YES 
                                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' 
                                      : status === RSVPStatus.TENTATIVE
                                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                                        : 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                                    : 'bg-white dark:bg-slate-800 text-slate-300 dark:text-slate-600 border-slate-100 dark:border-slate-700 hover:text-slate-500 dark:hover:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                                }`}
                              >
                                {status.charAt(0)}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {outPlayers.length > 0 && (
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
                  <p className="font-bold text-slate-500 dark:text-slate-400">{player.name}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleUpdateGameRSVP(game.id, player.id, RSVPStatus.YES)}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all"
                  >
                    Activate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
