import React from 'react';
import { Game, Player, RSVPStatus } from '../../types';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { firebaseService } from '../../services/firebaseService';

interface GroupManagementViewProps {
  game: Game;
  players: Player[];
  handleMoveScrimmagePlayer: (gameId: string, fromGroup: number, toGroup: number, playerId: string) => void;
  handleSplitScrimmageGroups: (gameId: string) => void;
  handleUpdateNumGroups: (gameId: string, numGroups: number) => void;
  handleFixLineup: (gameId: string) => void;
  readOnly?: boolean;
  handleUpdateGameRSVP?: (gameId: string, playerId: string, newStatus: RSVPStatus) => Promise<void>;
}

export const GroupManagementView: React.FC<GroupManagementViewProps> = ({
  game,
  players,
  handleMoveScrimmagePlayer,
  handleSplitScrimmageGroups,
  handleUpdateNumGroups,
  handleFixLineup,
  readOnly = false,
  handleUpdateGameRSVP,
}) => {
  const numGroups = game.numGroups || 4;
  const groups = game.scrimmageGroups || [];
  const outPlayers = players.filter(p => game.rsvps[p.id] === RSVPStatus.NO).sort((a, b) => a.name.localeCompare(b.name));

  const step2HasIssues = groups.some(group => 
    group.some(playerId => game.rsvps[playerId] === RSVPStatus.NO)
  );

  return (
    <div className="space-y-6">
      {!readOnly && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Group Assignments</h3>
              {step2HasIssues && (
                <div className="flex items-center gap-1 text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mt-1">
                  <AlertCircle size={12} />
                  Some players in groups are marked as 'No'
                </div>
              )}
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Review groups and move players if needed</p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1"># of Groups</label>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
                {[1, 2, 3, 4].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleUpdateNumGroups(game.id, num)}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${numGroups === num ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {step2HasIssues && (
              <Button
                variant="outline"
                size="sm"
                icon={AlertCircle}
                onClick={() => handleFixLineup(game.id)}
                className="text-amber-600 border-amber-200 hover:bg-amber-50"
              >
                Fix Groups
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={() => handleSplitScrimmageGroups(game.id)}
            >
              Shuffle Groups
            </Button>
          </div>
        </div>
      )}

      <div className={`grid grid-cols-1 sm:grid-cols-2 ${numGroups === 4 ? 'lg:grid-cols-4' : numGroups === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-4`}>
        {Array.from({ length: numGroups }).map((_, groupIndex) => (
          <div key={groupIndex} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Group {groupIndex + 1}</h4>
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {groups[groupIndex]?.length || 0} Players
              </span>
            </div>
            <div className="space-y-2 text-left">
              {groups[groupIndex]?.map(playerId => {
                const player = players.find(p => p.id === playerId);
                const isPlayerOut = game.rsvps[playerId] === RSVPStatus.NO;
                return (
                  <div key={playerId} className={`group/player flex flex-col gap-2 p-3 rounded-xl border text-sm font-bold transition-all ${
                    isPlayerOut 
                      ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300' 
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        {isPlayerOut && <AlertCircle size={14} />}
                        {player?.name}
                        {player?.jerseyNumber && (
                          <span className="text-[10px] opacity-50 ml-1">#{player.jerseyNumber}</span>
                        )}
                      </span>
                      {!readOnly && (
                        <div className="flex gap-1">
                          {Array.from({ length: numGroups }).map((_, idx) => idx).filter(idx => idx !== groupIndex).map(targetIdx => (
                            <button
                              key={targetIdx}
                              onClick={() => handleMoveScrimmagePlayer(game.id, groupIndex, targetIdx, playerId)}
                              className="w-6 h-6 flex items-center justify-center bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md text-[10px] font-black text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                              title={`Move to Group ${targetIdx + 1}`}
                            >
                              {targetIdx + 1}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {handleUpdateGameRSVP && !readOnly && (
                      <div className="flex gap-1 pt-1 border-t border-slate-200/50 dark:border-slate-700/50 mt-1">
                        {[RSVPStatus.YES, RSVPStatus.TENTATIVE, RSVPStatus.NO].map(status => (
                          <button
                            key={status}
                            onClick={() => handleUpdateGameRSVP(game.id, playerId, status)}
                            className={`flex-1 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all border ${
                              game.rsvps[playerId] === status
                                ? status === RSVPStatus.YES 
                                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' 
                                  : status === RSVPStatus.TENTATIVE
                                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                                    : 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                                : 'bg-white dark:bg-slate-800 text-slate-300 dark:text-slate-600 border-slate-100 dark:border-slate-700 hover:text-slate-500 dark:hover:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                          >
                            {status === RSVPStatus.YES ? 'Yes' : status === RSVPStatus.TENTATIVE ? 'Maybe' : 'No'}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {(!groups[groupIndex] || groups[groupIndex].length === 0) && (
                <p className="text-xs text-slate-400 italic text-center py-4">No players assigned</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {!readOnly && (
        <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between px-2 mb-4">
            <h4 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Unassigned Players</h4>
            <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">
              Available for assignment
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {players
              .filter(p => game.rsvps[p.id] !== RSVPStatus.NO)
              .filter(p => !groups.some(g => g?.includes(p.id)))
              .map(player => (
                <div key={player.id} className="flex flex-col gap-2 p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl group/unassigned shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{player.name}</span>
                    <div className="flex gap-1">
                      {Array.from({ length: numGroups }).map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            const newGroups = [...groups.map(g => [...(g || [])])];
                            while (newGroups.length <= idx) newGroups.push([]);
                            newGroups[idx].push(player.id);
                            firebaseService.updateGame(game.id, { scrimmageGroups: JSON.stringify(newGroups) });
                          }}
                          className="w-6 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-[9px] font-black text-slate-400 hover:bg-slate-900 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white transition-all shadow-sm"
                          title={`Assign to Group ${idx + 1}`}
                        >
                          {idx + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                  {handleUpdateGameRSVP && !readOnly && (
                    <div className="flex gap-1 pt-1 border-t border-slate-100 dark:border-slate-800/50 mt-1">
                      {[RSVPStatus.YES, RSVPStatus.TENTATIVE].map(status => (
                        <button
                          key={status}
                          onClick={() => handleUpdateGameRSVP(game.id, player.id, status)}
                          className={`flex-1 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all border ${
                            game.rsvps[player.id] === status
                              ? status === RSVPStatus.YES 
                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' 
                                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 border-slate-100 dark:border-slate-700 hover:text-slate-500 dark:hover:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          {status === RSVPStatus.YES ? 'Yes' : 'Maybe'}
                        </button>
                      ))}
                      <button
                        onClick={() => handleUpdateGameRSVP(game.id, player.id, RSVPStatus.NO)}
                        className="flex-1 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all border bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 border-slate-100 dark:border-slate-700 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-900/20 dark:hover:border-rose-800"
                      >
                        No
                      </button>
                    </div>
                  )}
                </div>
              ))}
          </div>

          {outPlayers.length > 0 && handleUpdateGameRSVP && !readOnly && (
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between px-2 mb-4">
                <h4 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Not Attending</h4>
                <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">{outPlayers.length} No</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {outPlayers.map(player => (
                  <div key={player.id} className="flex items-center justify-between p-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 rounded-xl flex items-center justify-center text-xs font-black">
                        NO
                      </div>
                      <p className="font-bold text-sm text-slate-500 dark:text-slate-400">{player.name}</p>
                    </div>
                    <button
                      onClick={() => handleUpdateGameRSVP(game.id, player.id, RSVPStatus.YES)}
                      className="px-3 py-1.5 bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-50 dark:hover:bg-emerald-900/20 shadow-sm transition-all"
                    >
                      Activate
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
