import React, { useMemo } from 'react';
import { Check, Lock, Unlock, AlertCircle, Wrench, RefreshCw, Trash2 } from 'lucide-react';
import { Game, Player, RSVPStatus } from '../../types';
import { getPositionAbbreviation } from '../../lib/utils';
import { LineupCell } from '../common/LineupCell';
import { NotAttendingList } from '../common/NotAttendingList';

interface FieldingLineupViewProps {
  game: Game;
  players: Player[];
  selectedGameId: string;
  isLocked: boolean;
  handleFixLineup: (gameId: string) => void;
  handleGenerateLineup: (gameId: string) => void;
  setShowClearLineupConfirm: (show: boolean) => void;
  handleToggleInningLock: (gameId: string, inning: number) => void;
  handleTogglePositionLock: (gameId: string, position: string) => void;
  editingCell: { inning: string, position: string } | null;
  setEditingCell: (cell: { inning: string, position: string } | null) => void;
  handleUpdateLineupCell: (gameId: string, inning: string, position: string, playerId: string) => void;
  darkMode: boolean;
}

export const FieldingLineupView: React.FC<FieldingLineupViewProps> = ({
  game,
  players,
  selectedGameId,
  isLocked,
  handleFixLineup,
  handleGenerateLineup,
  setShowClearLineupConfirm,
  handleToggleInningLock,
  handleTogglePositionLock,
  editingCell,
  setEditingCell,
  handleUpdateLineupCell,
  darkMode
}) => {
  const fieldPositions = [
    "Pitcher", "Catcher", "First Base", "Second Base", "Third Base", 
    "Shortstop", "Left Field", "Center Field", "Right Field"
  ];

  const fixButtonInfo = useMemo(() => {
    if (!game.lineup || Object.keys(game.lineup).length === 0) return null;
    
    const hasOutPlayers = Object.values(game.lineup).some(inning => 
      Object.values(inning).some(playerId => playerId && game.rsvps[playerId as string] === RSVPStatus.NO)
    );

    const availablePlayers = players.filter(p => game.rsvps[p.id] === RSVPStatus.YES || game.rsvps[p.id] === RSVPStatus.TENTATIVE);
    const assignedPlayerIds = new Set();
    Object.values(game.lineup).forEach(inning => {
      Object.values(inning).forEach(id => {
        if (id) assignedPlayerIds.add(id);
      });
    });
    const hasBenchedAvailable = availablePlayers.some(p => !assignedPlayerIds.has(p.id));

    const hasBackToBackBenches = availablePlayers.some(p => {
      const isBenchedInInning = (inningIdx: number) => !Object.values(game.lineup?.[inningIdx.toString()] || {}).includes(p.id);
      for (let i = 1; i <= 5; i++) {
        if (isBenchedInInning(i) && isBenchedInInning(i+1)) return true;
      }
      return false;
    });

    const hasDuplicates = Object.values(game.lineup || {}).some(inning => {
      const ids = Object.entries(inning)
        .filter(([k]) => k !== 'HittingGroup')
        .map(([_, id]) => id)
        .filter(id => id);
      return new Set(ids).size !== ids.length;
    });

    if (hasOutPlayers || hasBenchedAvailable || hasBackToBackBenches || hasDuplicates) {
      return {
        show: true,
        title: "Replace 'No' players, work in 'Activated' players, resolve back-to-back benches, and fix duplicates"
      };
    }
    return null;
  }, [game.lineup, game.rsvps, players]);

  // Helper moved outside for stability, but we can also use useMemo for benched players per inning
  const benchedPlayersByInning = useMemo(() => {
    return [1, 2, 3, 4, 5, 6].map(inning => {
      const assignedIds = new Set(Object.values(game.lineup?.[inning.toString()] || {}));
      return players.filter(p => 
        game.rsvps[p.id] !== RSVPStatus.NO && 
        !assignedIds.has(p.id)
      );
    });
  }, [game.lineup, game.rsvps, players]);

  const isBenchedInAnyInning = useMemo(() => {
    const map: Record<number, Set<string>> = {};
    [1, 2, 3, 4, 5, 6].forEach(inning => {
      map[inning] = new Set(Object.values(game.lineup?.[inning.toString()] || {}));
    });
    return (playerId: string, inning: number) => {
      if (inning < 1 || inning > 6) return false;
      return !map[inning]?.has(playerId);
    };
  }, [game.lineup]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Field Lineup</h3>
          {isLocked && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded text-[10px] font-bold uppercase tracking-wider">
              <Check size={10} />
              Published
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 print:hidden">
          {fixButtonInfo && (
            <button
              onClick={() => handleFixLineup(selectedGameId)}
              className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg text-xs font-bold hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors border border-amber-200/50 dark:border-amber-800/50"
              title={fixButtonInfo.title}
            >
              <Wrench size={14} />
              <span className="hidden sm:inline">Fix Lineup</span>
            </button>
          )}
          {!isLocked && (
            <>
              <button
                onClick={() => handleGenerateLineup(selectedGameId)}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
              >
                <RefreshCw size={14} />
                <span className="hidden sm:inline">Generate</span>
              </button>
              {game.lineup && Object.keys(game.lineup).length > 0 && (
                <button
                  onClick={() => setShowClearLineupConfirm(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
                >
                  <Trash2 size={14} />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="overflow-hidden bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                <th scope="col" className="sticky left-0 z-30 bg-slate-50 dark:bg-slate-800 py-5 pl-4 pr-2 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 border-b border-r border-slate-100 dark:border-slate-800 shadow-[2px_0_8px_rgba(0,0,0,0.05)] w-14 text-center">Pos</th>
                <th scope="col" className="text-left py-5 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">Details</th>
                {[1, 2, 3, 4, 5, 6].map(inning => (
                  <th key={inning} scope="col" className="text-center py-5 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-slate-900 dark:text-slate-200">Inning {inning}</span>
                      <button 
                        onClick={() => handleToggleInningLock(selectedGameId, inning)}
                        className={`p-1.5 rounded-lg transition-all print:hidden ${game.lockedInnings?.includes(inning) ? 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 shadow-sm' : 'text-slate-300 dark:text-slate-600 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800'}`}
                        title={game.lockedInnings?.includes(inning) ? "Unlock Inning" : "Lock Inning"}
                      >
                        {game.lockedInnings?.includes(inning) ? <Lock size={14} /> : <Unlock size={14} />}
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {fieldPositions.map(pos => (
                <tr key={pos} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <th scope="row" className="sticky left-0 z-20 bg-white dark:bg-slate-900 group-hover:bg-slate-50/50 dark:group-hover:bg-slate-800/50 py-5 pl-4 pr-2 text-center shadow-[2px_0_8px_rgba(0,0,0,0.05)] border-r border-slate-100 dark:border-slate-800 transition-colors">
                    <span className="inline-flex w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg items-center justify-center text-[10px] text-slate-600 dark:text-slate-300 font-black">
                      {getPositionAbbreviation(pos)}
                    </span>
                  </th>
                  <th scope="row" className="text-left py-5 px-4 font-black text-slate-900 dark:text-slate-200 text-sm font-normal">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleTogglePositionLock(selectedGameId, pos)}
                        className={`p-1.5 rounded-lg transition-all shrink-0 print:hidden ${game.lockedPositions?.includes(pos) ? 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 shadow-sm' : 'text-slate-300 dark:text-slate-600 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800'}`}
                        title={game.lockedPositions?.includes(pos) ? "Unlock Position" : "Lock Position"}
                      >
                        {game.lockedPositions?.includes(pos) ? <Lock size={14} /> : <Unlock size={14} />}
                      </button>
                      <span className="whitespace-nowrap">{pos}</span>
                    </div>
                  </th>
                  {[1, 2, 3, 4, 5, 6].map(inning => {
                    const inningKey = inning.toString();
                    const playerId = game.lineup?.[inningKey]?.[pos];
                    const player = players.find(p => p.id === playerId);
                    const isLockedInning = game.lockedInnings?.includes(inning);
                    const isOut = playerId && game.rsvps[playerId] === RSVPStatus.NO;
                    
                    // Check for duplicates in this inning
                    const inningLineup = game.lineup?.[inningKey] || {};
                    const playerIdsInInning = Object.values(inningLineup);
                    const isDuplicate = playerId && playerIdsInInning.filter(id => id === playerId).length > 1;
                    
                    const isEditing = editingCell?.inning === inningKey && editingCell?.position === pos;

                    return (
                      <td key={inning} className="py-4 px-4 text-center relative">
                        <LineupCell
                          inningKey={inningKey}
                          pos={pos}
                          playerId={playerId}
                          players={players}
                          gameRSVPs={game.rsvps}
                          gameLineupInning={inningLineup}
                          isLockedInning={isLockedInning}
                          isLockedPosition={game.lockedPositions?.includes(pos)}
                          isDuplicate={isDuplicate}
                          isOut={isOut}
                          isEditing={isEditing}
                          setEditingCell={setEditingCell}
                          handleUpdateLineupCell={handleUpdateLineupCell}
                          selectedGameId={selectedGameId}
                          darkMode={darkMode}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="bg-slate-50/30 dark:bg-slate-800/30">
                <th scope="row" className="sticky left-0 z-20 bg-slate-50 dark:bg-slate-800 py-5 pl-4 pr-2 text-center shadow-[2px_0_8px_rgba(0,0,0,0.05)] border-r border-slate-100 dark:border-slate-800">
                  <span className="inline-flex items-center justify-center text-[10px] text-slate-400 font-black">
                    B
                  </span>
                </th>
                <th scope="row" className="text-left py-5 px-4 font-black text-slate-400 text-sm uppercase tracking-widest relative">
                  Bench
                </th>
                {[1, 2, 3, 4, 5, 6].map((inning, idx) => {
                  const benchedPlayers = benchedPlayersByInning[idx];

                  return (
                    <td key={inning} className="py-4 px-4 text-center">
                      <div className="flex flex-col gap-1">
                        {benchedPlayers.length > 0 ? benchedPlayers.map(p => {
                          const isBTB = isBenchedInAnyInning(p.id, inning) && 
                                       (isBenchedInAnyInning(p.id, inning - 1) || isBenchedInAnyInning(p.id, inning + 1));
                          
                          return (
                            <div 
                              key={p.id} 
                              className={`text-[10px] font-black truncate max-w-[80px] mx-auto uppercase tracking-tighter ${
                                isBTB ? 'text-rose-500 flex items-center justify-center gap-0.5' : 'text-slate-400'
                              }`}
                              title={isBTB ? "Back-to-back benching detected" : ""}
                            >
                              {isBTB && <AlertCircle size={8} />}
                              <span>{p.name.split(' ')[0]}</span>
                              {p.jerseyNumber && <span>#{p.jerseyNumber}</span>}
                            </div>
                          );
                        }) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <NotAttendingList 
        outPlayers={players.filter(p => game.rsvps[p.id] === RSVPStatus.NO).sort((a, b) => a.name.localeCompare(b.name))} 
        readOnly={false} 
        gameId={game.id}
        isLocked={isLocked}
      />
    </div>
  );
};
