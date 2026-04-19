import React from 'react';
import { AlertCircle, ChevronRight, RefreshCw, RotateCcw, Wrench } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Game, Player, RSVPStatus } from '../../types';
import { getPositionAbbreviation } from '../../lib/utils';

import { GroupManagementView } from './GroupManagementView';

interface ScrimmageGroupManagerProps {
  game: Game;
  players: Player[];
  selectedGameId: string;
  setGames: React.Dispatch<React.SetStateAction<Game[]>>;
  handleGenerateBatteries: (gameId: string) => void;
  handleSplitScrimmageGroups: (gameId: string) => void;
  handleGenerateScrimmageLineup: (gameId: string) => void;
  handleFixInningBatteries: (gameId: string, inning: string) => void;
  handleUpdateLineupCell: (gameId: string, inning: string, position: string, playerId: string) => void;
  handleMoveScrimmagePlayer: (gameId: string, fromGroup: number, toGroup: number, playerId: string) => void;
  handleFixLineup: (gameId: string) => void;
  handleUpdateNumGroups: (gameId: string, numGroups: number) => void;
  editingCell: { inning: string; position: string } | null;
  setEditingCell: React.Dispatch<React.SetStateAction<{ inning: string; position: string } | null>>;
  backupLineup: any;
  setBackupLineup: React.Dispatch<React.SetStateAction<any>>;
  backupScrimmageGroups: any;
  setBackupScrimmageGroups: React.Dispatch<React.SetStateAction<any>>;
  darkMode: boolean;
}

export const ScrimmageGroupManager: React.FC<ScrimmageGroupManagerProps> = ({
  game,
  players,
  selectedGameId,
  setGames,
  handleGenerateBatteries,
  handleSplitScrimmageGroups,
  handleGenerateScrimmageLineup,
  handleFixInningBatteries,
  handleUpdateLineupCell,
  handleMoveScrimmagePlayer,
  handleFixLineup,
  handleUpdateNumGroups,
  editingCell,
  setEditingCell,
  backupLineup,
  setBackupLineup,
  backupScrimmageGroups,
  setBackupScrimmageGroups,
  darkMode,
}) => {
  const currentStep = game.scrimmageStep || 1;
  const numGroups = game.numGroups || 4;
  const fieldPositions = ["Pitcher", "Catcher"];
  
  const hasOutPlayersInBatteries = currentStep === 1 && [1, 2, 3, 4, 5, 6].some(inning => {
    const inningKey = inning.toString();
    return fieldPositions.some(pos => {
      const playerId = game.lineup?.[inningKey]?.[pos];
      return playerId && game.rsvps[playerId] === RSVPStatus.NO;
    });
  });

  const step1HasIssues = [1, 2, 3, 4, 5, 6].some(inning => {
    const inningKey = inning.toString();
    return ["Pitcher", "Catcher"].some(pos => {
      const playerId = game.lineup?.[inningKey]?.[pos];
      return playerId && game.rsvps[playerId] === RSVPStatus.NO;
    });
  });

  const step2HasIssues = (game.scrimmageGroups || []).some(group => 
    group.some(playerId => game.rsvps[playerId] === RSVPStatus.NO)
  );

  const step3HasIssues = [1, 2, 3, 4, 5, 6].some(inning => {
    const inningKey = inning.toString();
    const inningLineup = game.lineup?.[inningKey] || {};
    return Object.entries(inningLineup).some(([pos, playerId]) => {
      if (pos === 'HittingGroup') return false;
      return playerId && game.rsvps[playerId] === RSVPStatus.NO;
    });
  });

  return (
    <div className="space-y-8">
      {/* Step Indicator */}
      <div className="flex items-center justify-between px-4 py-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {[1, 2, 3].map((step) => (
          <div 
            key={step} 
            className={`flex flex-col items-center gap-2 flex-1 relative ${step < currentStep ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
            onClick={async () => {
              if (step < currentStep) {
                if (currentStep === 3) {
                  setBackupLineup(JSON.parse(JSON.stringify(game.lineup || {})));
                  setBackupScrimmageGroups(JSON.parse(JSON.stringify(game.scrimmageGroups || [])));
                }
                await updateDoc(doc(db, 'games', game.id), { scrimmageStep: step });
                setGames(prevGames => prevGames.map(g => g.id === game.id ? {...g, scrimmageStep: step} : g));
              }
            }}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black z-10 transition-all relative ${
              currentStep >= step 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600'
            }`}>
              {step}
              {((step === 1 && step1HasIssues) || (step === 2 && step2HasIssues) || (step === 3 && step3HasIssues)) && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center">
                  <AlertCircle size={10} className="text-white" />
                </div>
              )}
            </div>
            <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${
              currentStep >= step ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-600'
            }`}>
              {step === 1 ? 'Pitchers/Catchers' : step === 2 ? 'Groups' : 'Final Lineup'}
            </span>
            {step < 3 && (
              <div className={`absolute top-5 left-1/2 w-full h-[2px] -z-0 ${
                currentStep > step ? 'bg-indigo-600' : 'bg-slate-100 dark:bg-slate-800'
              }`} />
            )}
          </div>
        ))}
      </div>

      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Step 1: Pitcher & Catcher Selection</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Assign your batteries for all 6 innings</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleGenerateBatteries(selectedGameId)}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                >
                  <RefreshCw size={14} />
                  Generate Batteries
                </button>
                {(backupLineup || backupScrimmageGroups) && (
                  <button
                    onClick={async () => {
                      if (backupLineup || backupScrimmageGroups) {
                        const updates: any = { scrimmageStep: 3 };
                        if (backupLineup) updates.lineup = backupLineup;
                        if (backupScrimmageGroups) updates.scrimmageGroups = JSON.stringify(backupScrimmageGroups);
                        await updateDoc(doc(db, 'games', game.id), updates);
                        setGames(prevGames => prevGames.map(g => g.id === game.id ? {...g, scrimmageStep: 3, lineup: backupLineup || g.lineup, scrimmageGroups: backupScrimmageGroups || g.scrimmageGroups} : g));
                        setBackupLineup(null);
                        setBackupScrimmageGroups(null);
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={async () => {
                    if (game.scrimmageGroups && game.scrimmageGroups.length > 0) {
                      await updateDoc(doc(db, 'games', game.id), { scrimmageStep: 2 });
                      setGames(prevGames => prevGames.map(g => g.id === game.id ? {...g, scrimmageStep: 2} : g));
                    } else {
                      handleSplitScrimmageGroups(selectedGameId);
                    }
                  }}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl ${
                    hasOutPlayersInBatteries 
                      ? 'bg-amber-500 hover:bg-amber-400 text-white shadow-amber-500/20 ring-4 ring-amber-500/20' 
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                  }`}
                >
                  {hasOutPlayersInBatteries && <AlertCircle size={16} />}
                  Next: Group Players
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(inning => {
                const inningKey = inning.toString();
                const hasInningError = fieldPositions.some(pos => {
                  const playerId = game.lineup?.[inningKey]?.[pos];
                  return playerId && game.rsvps[playerId] === RSVPStatus.NO;
                });

                return (
                  <div key={inning} className={`rounded-2xl p-4 border transition-all ${
                    hasInningError 
                      ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 ring-1 ring-amber-200 dark:ring-amber-800' 
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Inning {inning}</h4>
                      {hasInningError && (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                            <AlertCircle size={12} />
                            Player Out
                          </div>
                          <button
                            onClick={() => handleFixInningBatteries(selectedGameId, inningKey)}
                            className="flex items-center gap-1 px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-sm"
                          >
                            <RotateCcw size={10} />
                            Fix
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      {fieldPositions.map(pos => {
                        const playerId = game.lineup?.[inningKey]?.[pos];
                        const player = players.find(p => p.id === playerId);
                        const isEditing = editingCell?.inning === inningKey && editingCell?.position === pos;
                        const isPlayerOut = playerId && game.rsvps[playerId] === RSVPStatus.NO;

                        return (
                          <div key={pos} className="flex items-center justify-between relative">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{pos}</span>
                            {isEditing && (
                              <>
                                <div 
                                  className="fixed inset-0 z-[55]" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingCell(null);
                                  }} 
                                />
                                <div className="absolute z-[60] top-full right-0 mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-2 max-h-64 overflow-y-auto">
                                  <button
                                    onClick={() => {
                                      handleUpdateLineupCell(selectedGameId, inningKey, pos, '');
                                      setEditingCell(null);
                                    }}
                                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 italic transition-colors"
                                  >
                                    — Empty —
                                  </button>
                                  {players.filter(p => game.rsvps[p.id] !== RSVPStatus.NO).sort((a, b) => a.name.localeCompare(b.name)).map(p => (
                                    <button
                                      key={p.id}
                                      onClick={() => {
                                        handleUpdateLineupCell(selectedGameId, inningKey, pos, p.id);
                                        setEditingCell(null);
                                      }}
                                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between transition-colors"
                                    >
                                      <span>
                                        {p.name}
                                        {p.jerseyNumber && (
                                          <span className="text-[10px] opacity-50 ml-1">#{p.jerseyNumber}</span>
                                        )}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                            <button
                              onClick={() => setEditingCell({ inning: inningKey, position: pos })}
                              className={`inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold transition-all min-w-[120px] border ${
                                isEditing 
                                  ? 'ring-2 ring-slate-900 border-slate-900' 
                                  : isPlayerOut
                                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-200 dark:hover:bg-amber-900/50'
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-100 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700'
                              }`}
                            >
                              {player ? (
                                <span className="flex items-center gap-1">
                                  {isPlayerOut && <AlertCircle size={12} />}
                                  {player.name}
                                  {player.jerseyNumber && (
                                    <span className="opacity-50 ml-1">#{player.jerseyNumber}</span>
                                  )}
                                </span>
                              ) : (
                                <span className="text-slate-300 italic">Empty</span>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Step 2: Group Players</h3>
                {step2HasIssues && (
                  <div className="flex items-center gap-1 text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mt-1">
                    <AlertCircle size={12} />
                    Some players in groups are marked as 'Out'
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
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${numGroups === num ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {(backupLineup || backupScrimmageGroups) && (
                <button
                  onClick={async () => {
                    if (backupLineup || backupScrimmageGroups) {
                      const updates: any = { scrimmageStep: 3 };
                      if (backupLineup) updates.lineup = backupLineup;
                      if (backupScrimmageGroups) updates.scrimmageGroups = JSON.stringify(backupScrimmageGroups);
                      await updateDoc(doc(db, 'games', game.id), updates);
                      setGames(prevGames => prevGames.map(g => g.id === game.id ? {...g, scrimmageStep: 3, lineup: backupLineup || g.lineup, scrimmageGroups: backupScrimmageGroups || g.scrimmageGroups} : g));
                      setBackupLineup(null);
                      setBackupScrimmageGroups(null);
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={() => handleSplitScrimmageGroups(selectedGameId)}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
              >
                <RefreshCw size={14} />
                Reshuffle
              </button>
              <button
                onClick={() => {
                  setBackupLineup(null);
                  setBackupScrimmageGroups(null);
                  handleGenerateScrimmageLineup(selectedGameId);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20"
              >
                Generate Final Lineup
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <GroupManagementView
            game={game}
            players={players}
            handleMoveScrimmagePlayer={handleMoveScrimmagePlayer}
            handleSplitScrimmageGroups={handleSplitScrimmageGroups}
            handleUpdateNumGroups={handleUpdateNumGroups}
            handleFixLineup={handleFixLineup}
          />
        </div>
      )}

      {currentStep === 3 && (
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Step 3: Final Scrimmage Lineup</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">One group hits each inning. Extra hitters are listed below.</p>
            </div>
            {!game.isLocked && (
              <div className="flex flex-col sm:flex-row gap-3">
                {(() => {
                  const hasOutPlayers = Object.values(game.lineup || {}).some(inning => 
                    Object.values(inning).some(playerId => playerId && game.rsvps[playerId as string] === RSVPStatus.NO)
                  );
                  const availablePlayers = players.filter(p => game.rsvps[p.id] === RSVPStatus.YES || game.rsvps[p.id] === RSVPStatus.TENTATIVE);
                  const assignedPlayerIds = new Set();
                  Object.values(game.lineup || {}).forEach(inning => {
                    Object.entries(inning).forEach(([pos, id]) => {
                      if (pos !== 'HittingGroup' && id) assignedPlayerIds.add(id);
                    });
                  });
                  const hasBenchedAvailable = availablePlayers.some(p => !assignedPlayerIds.has(p.id));
                  const hasBackToBackBenches = availablePlayers.some(p => {
                    const isBenched = (inning: number) => {
                      const lineup = game.lineup?.[inning.toString()] || {};
                      const assigned = Object.entries(lineup)
                        .filter(([k]) => k !== 'HittingGroup')
                        .map(([_, id]) => id);
                      const hittingGroupIdx = lineup['HittingGroup'];
                      const hittingGroupIds = hittingGroupIdx != null && game.scrimmageGroups?.[parseInt(hittingGroupIdx)]
                        ? game.scrimmageGroups[parseInt(hittingGroupIdx)]
                        : [];
                      return !assigned.includes(p.id) && !hittingGroupIds.includes(p.id);
                    };
                    for (let i = 1; i <= 5; i++) {
                      if (isBenched(i) && isBenched(i+1)) return true;
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
                    return (
                      <button
                        onClick={() => handleFixLineup(selectedGameId)}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-black uppercase tracking-widest border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-all"
                        title="Replace 'Out' players, work in 'Activated' players, resolve back-to-back benches, and fix duplicates"
                      >
                        <Wrench size={14} />
                        Fix Lineup
                      </button>
                    );
                  }
                  return null;
                })()}
                <button
                  onClick={async () => {
                    setBackupLineup(JSON.parse(JSON.stringify(game.lineup || {})));
                    setBackupScrimmageGroups(JSON.parse(JSON.stringify(game.scrimmageGroups || [])));
                    await updateDoc(doc(db, 'games', game.id), { scrimmageStep: 1 });
                    setGames(prevGames => prevGames.map(g => g.id === game.id ? {...g, scrimmageStep: 1} : g));
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                >
                  <RotateCcw size={14} />
                  Start Over
                </button>
                <button
                  onClick={() => handleGenerateScrimmageLineup(selectedGameId)}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                >
                  <RefreshCw size={14} />
                  Regenerate
                </button>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                    <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">Position</th>
                    {[1, 2, 3, 4, 5, 6].map(inning => (
                      <th key={inning} className="text-center py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">Inning {inning}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {/* Field Positions */}
                  {[
                    "Pitcher", "Catcher", "First Base", "Second Base", "Third Base", 
                    "Shortstop", "Left Field", "Center Field", "Right Field"
                  ].map(pos => (
                    <tr key={pos} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-4 px-6 font-black text-slate-900 dark:text-slate-200 text-sm">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-[10px] text-slate-500 dark:text-slate-400 font-black">
                            {getPositionAbbreviation(pos)}
                          </span>
                          {pos}
                        </div>
                      </td>
                      {[1, 2, 3, 4, 5, 6].map(inning => {
                        const inningKey = inning.toString();
                        const playerId = game.lineup?.[inningKey]?.[pos];
                        const player = players.find(p => p.id === playerId);
                        const isOut = playerId && game.rsvps[playerId] === RSVPStatus.NO;
                        
                        // Check for duplicates in this inning
                        const inningLineup = game.lineup?.[inningKey] || {};
                        const playerIdsInInning = Object.entries(inningLineup)
                          .filter(([k]) => k !== 'HittingGroup')
                          .map(([_, id]) => id);
                        const isDuplicate = playerId && playerIdsInInning.filter(id => id === playerId).length > 1;
                        
                        const isEditing = editingCell?.inning === inningKey && editingCell?.position === pos;

                        // Hitting group for this inning
                        const hittingGroupIdx = game.lineup?.[inningKey]?.['HittingGroup'];
                        const hittingGroupIds = hittingGroupIdx != null && game.scrimmageGroups?.[parseInt(hittingGroupIdx)]
                          ? game.scrimmageGroups[parseInt(hittingGroupIdx)]
                          : [];

                        return (
                          <td key={inning} className="py-4 px-4 text-center relative">
                            {isEditing && (
                              <>
                                <div 
                                  className="fixed inset-0 z-[55]" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingCell(null);
                                  }} 
                                />
                                <div className="absolute z-[60] top-full left-1/2 -translate-x-1/2 mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-2 max-h-64 overflow-y-auto">
                                  <div className="px-3 py-2 border-b border-slate-50 dark:border-slate-700 mb-1">
                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Select Player</p>
                                  </div>
                                  <button
                                    onClick={() => {
                                      handleUpdateLineupCell(selectedGameId, inningKey, pos, '');
                                      setEditingCell(null);
                                    }}
                                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 italic transition-colors"
                                  >
                                    — Empty —
                                  </button>
                                  {(() => {
                                    const assignedElsewhere = Object.entries(inningLineup)
                                      .filter(([pPos, _]) => pPos !== pos && pPos !== 'HittingGroup')
                                      .map(([_, pId]) => pId);
                                    
                                    const isDark = darkMode;

                                    return players
                                      .sort((a, b) => a.name.localeCompare(b.name))
                                      .map(p => {
                                        const isCurrent = p.id === playerId;
                                        const isAssignedElsewhere = !isCurrent && assignedElsewhere.includes(p.id);
                                        const isPlayerOut = game.rsvps[p.id] === RSVPStatus.NO;
                                        const isHitting = hittingGroupIds.includes(p.id);
                                        
                                        let statusLabel = 'Bench';
                                        let statusColor = isDark ? '#34d399' : '#059669'; // Emerald-400 : Emerald-600
                                        let statusBg = isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600';

                                        if (isPlayerOut) {
                                          statusLabel = 'OUT';
                                          statusColor = isDark ? '#fb7185' : '#f43f5e'; // Rose-400 : Rose-500
                                          statusBg = isDark ? 'bg-rose-900/30 text-rose-400' : 'bg-rose-50 text-rose-500';
                                        } else if (isHitting) {
                                          statusLabel = 'Hitting';
                                          statusColor = isDark ? '#818cf8' : '#4f46e5'; // Indigo-400 : Indigo-600
                                          statusBg = isDark ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-50 text-indigo-600';
                                        } else if (isCurrent) {
                                          statusLabel = 'Current';
                                          statusColor = isDark ? '#60a5fa' : '#2563eb'; // Blue-400 : Blue-600
                                          statusBg = isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600';
                                        } else if (isAssignedElsewhere) {
                                          statusLabel = 'Field';
                                          statusColor = isDark ? '#64748b' : '#94a3b8'; // Slate-500 : Slate-400
                                          statusBg = isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400';
                                        }

                                        return (
                                          <button
                                            key={p.id}
                                            onClick={() => {
                                              if (!isHitting) {
                                                handleUpdateLineupCell(selectedGameId, inningKey, pos, p.id);
                                                setEditingCell(null);
                                              }
                                            }}
                                            disabled={isHitting}
                                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors group/item ${
                                              isHitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                                            }`}
                                            style={{ color: statusColor }}
                                          >
                                            <span>
                                              {p.name}
                                            </span>
                                            <span className={`text-[8px] uppercase px-1.5 py-0.5 rounded-md ${statusBg}`}>
                                              {statusLabel}
                                            </span>
                                          </button>
                                        );
                                      });
                                  })()}
                                </div>
                              </>
                            )}
                            
                            <button
                              onClick={() => setEditingCell({ inning: inningKey, position: pos })}
                              className={`inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold transition-all min-w-[100px] border ${
                                isOut
                                  ? 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-200'
                                  : isDuplicate
                                    ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-sm shadow-rose-100'
                                    : 'bg-white text-slate-700 border border-slate-100 shadow-sm hover:border-slate-200 hover:bg-slate-50'
                              } ${isEditing ? 'ring-2 ring-slate-900 border-slate-900' : ''}`}
                            >
                              {player ? (
                                <span>
                                  {player.name}
                                </span>
                              ) : (
                                <span className="text-slate-300 italic">Empty</span>
                              )}
                              {isOut && <AlertCircle size={12} className="ml-2" />}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {/* Hitting Group Row */}
                  <tr className="bg-indigo-50/30 dark:bg-indigo-900/10">
                    <td className="py-4 px-6 font-black text-indigo-600 dark:text-indigo-400 text-xs uppercase tracking-widest">Hitting Group</td>
                    {[1, 2, 3, 4, 5, 6].map(inning => {
                      const hittingGroupIdx = game.lineup?.[inning.toString()]?.['HittingGroup'];
                      const groupPlayers = hittingGroupIdx != null && game.scrimmageGroups?.[parseInt(hittingGroupIdx)]
                        ? game.scrimmageGroups[parseInt(hittingGroupIdx)].map(id => {
                            const p = players.find(p => p.id === id);
                            return p ? `${p.name}` : null;
                          }).filter(Boolean)
                        : [];
                      return (
                        <td key={inning} className="py-4 px-6 text-center">
                          <div className="flex flex-col gap-1 items-center">
                            <span className="px-3 py-1 bg-indigo-600 text-white rounded-full text-[10px] font-black mb-1">
                              Group {hittingGroupIdx != null ? parseInt(hittingGroupIdx) + 1 : '?'}
                            </span>
                            {groupPlayers.map((name, i) => (
                              <span key={i} className="text-[9px] font-bold text-indigo-700 dark:text-indigo-300">
                                {name}
                              </span>
                            ))}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                  {/* Extra Hitters */}
                  {(() => {
                    const maxExtraHitters = Math.max(
                      0,
                      ...[1, 2, 3, 4, 5, 6].map(inning => {
                        const lineup = game.lineup?.[inning.toString()] || {};
                        return Object.keys(lineup).filter(k => k.startsWith('Extra Hitter')).length;
                      })
                    );
                    
                    if (maxExtraHitters === 0) return null;
                    
                    return Array.from({ length: maxExtraHitters }, (_, i) => `Extra Hitter ${i + 1}`).map(pos => (
                      <tr key={pos} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-4 px-6 font-black text-slate-900 dark:text-slate-200 text-sm">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-[10px] text-slate-500 dark:text-slate-400 font-black">
                              EH
                            </span>
                            {pos}
                          </div>
                        </td>
                        {[1, 2, 3, 4, 5, 6].map(inning => {
                          const inningKey = inning.toString();
                          const playerId = game.lineup?.[inningKey]?.[pos];
                          const player = players.find(p => p.id === playerId);
                          const isOut = playerId && game.rsvps[playerId] === RSVPStatus.NO;
                          
                          // Check for duplicates in this inning
                          const inningLineup = game.lineup?.[inningKey] || {};
                          const playerIdsInInning = Object.entries(inningLineup)
                            .filter(([k]) => k !== 'HittingGroup')
                            .map(([_, id]) => id);
                          const isDuplicate = playerId && playerIdsInInning.filter(id => id === playerId).length > 1;
                          
                          const isEditing = editingCell?.inning === inningKey && editingCell?.position === pos;

                          // Hitting group for this inning
                          const hittingGroupIdx = game.lineup?.[inningKey]?.['HittingGroup'];
                          const hittingGroupIds = hittingGroupIdx != null && game.scrimmageGroups?.[parseInt(hittingGroupIdx)]
                            ? game.scrimmageGroups[parseInt(hittingGroupIdx)]
                            : [];

                          return (
                            <td key={inning} className="py-4 px-4 text-center relative">
                              {isEditing && (
                                <>
                                  <div 
                                    className="fixed inset-0 z-[55]" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingCell(null);
                                    }} 
                                  />
                                  <div className="absolute z-[60] top-full left-1/2 -translate-x-1/2 mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-2 max-h-64 overflow-y-auto">
                                    <div className="px-3 py-2 border-b border-slate-50 dark:border-slate-700 mb-1">
                                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Select Player</p>
                                    </div>
                                    <button
                                      onClick={() => handleUpdateLineupCell(selectedGameId, inningKey, pos, '')}
                                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 italic transition-colors"
                                    >
                                      — Empty —
                                    </button>
                                    {(() => {
                                      const assignedElsewhere = Object.entries(inningLineup)
                                        .filter(([pPos, _]) => pPos !== pos && pPos !== 'HittingGroup')
                                        .map(([_, pId]) => pId);
                                      
                                      const isDark = darkMode;

                                      return players
                                        .sort((a, b) => a.name.localeCompare(b.name))
                                        .map(p => {
                                          const isCurrent = p.id === playerId;
                                          const isAssignedElsewhere = !isCurrent && assignedElsewhere.includes(p.id);
                                          const isPlayerOut = game.rsvps[p.id] === RSVPStatus.NO;
                                          const isHitting = hittingGroupIds.includes(p.id);
                                          
                                          let statusLabel = 'Bench';
                                          let statusColor = isDark ? '#34d399' : '#059669'; // Emerald-400 : Emerald-600
                                          let statusBg = isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600';

                                          if (isPlayerOut) {
                                            statusLabel = 'OUT';
                                            statusColor = isDark ? '#fb7185' : '#f43f5e'; // Rose-400 : Rose-500
                                            statusBg = isDark ? 'bg-rose-900/30 text-rose-400' : 'bg-rose-50 text-rose-500';
                                          } else if (isHitting) {
                                            statusLabel = 'Hitting';
                                            statusColor = isDark ? '#818cf8' : '#4f46e5'; // Indigo-400 : Indigo-600
                                            statusBg = isDark ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-50 text-indigo-600';
                                          } else if (isCurrent) {
                                            statusLabel = 'Current';
                                            statusColor = isDark ? '#60a5fa' : '#2563eb'; // Blue-400 : Blue-600
                                            statusBg = isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600';
                                          } else if (isAssignedElsewhere) {
                                            statusLabel = 'Field';
                                            statusColor = isDark ? '#64748b' : '#94a3b8'; // Slate-500 : Slate-400
                                            statusBg = isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400';
                                          }

                                          return (
                                            <button
                                              key={p.id}
                                              onClick={() => {
                                                if (!isHitting) {
                                                  handleUpdateLineupCell(selectedGameId, inningKey, pos, p.id);
                                                }
                                              }}
                                              disabled={isHitting}
                                              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors group/item ${
                                                isHitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                                              }`}
                                              style={{ color: statusColor }}
                                            >
                                              <span>
                                                {p.name}
                                              </span>
                                              <span className={`text-[8px] uppercase px-1.5 py-0.5 rounded-md ${statusBg}`}>
                                                {statusLabel}
                                              </span>
                                            </button>
                                          );
                                        });
                                    })()}
                                  </div>
                                </>
                              )}
                              
                              <button
                                onClick={() => setEditingCell({ inning: inningKey, position: pos })}
                                className={`inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold transition-all min-w-[100px] border ${
                                  isOut
                                    ? 'bg-rose-500 text-white border-rose-600 shadow-md shadow-rose-200'
                                    : isDuplicate
                                      ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-sm shadow-rose-100'
                                      : 'bg-white text-slate-700 border border-slate-100 shadow-sm hover:border-slate-200 hover:bg-slate-50'
                                } ${isEditing ? 'ring-2 ring-slate-900 border-slate-900' : ''}`}
                              >
                                {player ? (
                                  <span>
                                    {player.name}
                                  </span>
                                ) : (
                                  <span className="text-slate-300 italic">Empty</span>
                                )}
                                {isOut && <AlertCircle size={12} className="ml-2" />}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ));
                  })()}
                  {/* Bench Row */}
                  <tr className="bg-slate-50/30 dark:bg-slate-800/30">
                    <td className="py-5 px-6 font-black text-slate-400 dark:text-slate-500 text-sm uppercase tracking-widest">Bench</td>
                    {[1, 2, 3, 4, 5, 6].map(inning => {
                      const inningKey = inning.toString();
                      const inningLineup = game.lineup?.[inningKey] || {};
                      
                      const assignedIds = Object.entries(inningLineup)
                        .filter(([k]) => k !== 'HittingGroup')
                        .map(([_, id]) => id);
                        
                      const hittingGroupIdx = inningLineup['HittingGroup'];
                      const hittingGroupIds = hittingGroupIdx != null && game.scrimmageGroups?.[parseInt(hittingGroupIdx)]
                        ? game.scrimmageGroups[parseInt(hittingGroupIdx)]
                        : [];
                        
                      const benchedPlayers = players.filter(p => 
                        game.rsvps[p.id] !== RSVPStatus.NO && 
                        !assignedIds.includes(p.id) &&
                        !hittingGroupIds.includes(p.id)
                      );
                      
                      const isBackToBackBench = (playerId: string, currentInning: number) => {
                        const isBenched = (inning: number) => {
                          if (inning < 1 || inning > 6) return false;
                          const lineup = game.lineup?.[inning.toString()] || {};
                          const assigned = Object.entries(lineup)
                            .filter(([k]) => k !== 'HittingGroup')
                            .map(([_, id]) => id);
                          const hittingGroupIdx = lineup['HittingGroup'];
                          const hittingGroupIds = hittingGroupIdx != null && game.scrimmageGroups?.[parseInt(hittingGroupIdx)]
                            ? game.scrimmageGroups[parseInt(hittingGroupIdx)]
                            : [];
                          return !assigned.includes(playerId) && !hittingGroupIds.includes(playerId);
                        };
                        
                        if (!isBenched(currentInning)) return false;
                        return isBenched(currentInning - 1) || isBenched(currentInning + 1);
                      };

                      return (
                        <td key={inning} className="py-4 px-4 text-center">
                          <div className="flex flex-col gap-1">
                            {benchedPlayers.length > 0 ? benchedPlayers.map(p => {
                              const isBTB = isBackToBackBench(p.id, inning);
                              return (
                                <div 
                                  key={p.id} 
                                  className={`text-[10px] font-black truncate max-w-[80px] mx-auto uppercase tracking-tighter ${
                                    isBTB ? 'text-rose-500 flex items-center justify-center gap-0.5' : 'text-slate-400 dark:text-slate-500'
                                  }`}
                                  title={isBTB ? "Back-to-back benching detected" : ""}
                                >
                                  {isBTB && <AlertCircle size={8} />}
                                  <span>{p.name.split(' ')[0]}</span>
                                </div>
                              );
                            }) : (
                              <span className="text-slate-300 dark:text-slate-700">—</span>
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
        </div>
      )}
    </div>
  );
};
