import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Lock, 
  Trophy, 
  Sun, 
  Moon, 
  ChevronLeft, 
  Calendar, 
  ClipboardList, 
  LayoutGrid, 
  History, 
  ChevronRight 
} from 'lucide-react';
import { POSITION_ORDER } from '../constants';
import { getPositionAbbreviation, cn } from '../lib/utils';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { useSharedData } from '../hooks/useSharedData';

interface SharedViewProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

import { GameHeader } from './GameDetail/GameHeader';
import { GameDetailTabs } from './GameDetail/GameDetailTabs';
import { BattingOrderView } from './GameDetail/BattingOrderView';

export function SharedView({ darkMode, setDarkMode }: SharedViewProps) {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Manually parse params since SharedView is rendered directly by BaseballApp
  const pathParts = location.pathname.split('/');
  const ownerId = pathParts[2];
  const gameId = pathParts[4];
  
  const { games, players, settings, loading, error } = useSharedData(ownerId);
  const [activeTab, setActiveTab] = useState<'batting' | 'lineup'>('batting');
  const [showPastGames, setShowPastGames] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-900 dark:border-emerald-500 border-t-transparent rounded-full mx-auto mb-4 animate-spin"></div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Loading schedule...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
        <Card className="max-w-md w-full p-8 text-center" hover={false}>
          <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Access Restricted</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">{error}</p>
          <Button 
            fullWidth
            onClick={() => navigate('/')}
            size="lg"
          >
            Go to Home
          </Button>
        </Card>
      </div>
    );
  }

  const selectedGame = gameId ? games.find(g => g.id === gameId) : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 font-bold text-xl">
            <div className="p-1.5 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
              <Trophy size={16} />
            </div>
            <span className="text-slate-900 dark:text-white">Lineup+</span>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              icon={darkMode ? Sun : Moon}
            />
            <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Shared View
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
          {gameId && selectedGame ? (
            !selectedGame.isLocked ? (
              <div key="game-not-published" className="max-w-xl mx-auto">
                <Card className="p-12 text-center" hover={false}>
                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-100 dark:border-slate-700">
                    <Lock size={32} className="text-slate-300 dark:text-slate-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Lineup Not Published</h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xs mx-auto">
                    The lineup for this game is still being finalized. Please check back later.
                  </p>
                  <Button 
                    onClick={() => navigate(`/shared/${ownerId}/games`)}
                    size="lg"
                  >
                    Back to Schedule
                  </Button>
                </Card>
              </div>
            ) : (
              <div key="game-detail">
                <GameHeader 
                  game={selectedGame} 
                  readOnly={true} 
                  onBack={() => navigate(`/shared/${ownerId}/games`)}
                />

                <Card className="overflow-hidden mb-8" hover={false}>
                  <div className="p-6 sm:p-8">
                    <GameDetailTabs 
                      game={selectedGame}
                      gameViewTab={activeTab}
                      setGameViewTab={setActiveTab}
                      readOnly={true}
                    />

                  <div>
                    {/* Batting Order / Groups */}
                    {activeTab === 'batting' && (
                      <div>
                        {selectedGame.mode === 'scrimmage' ? (
                          <>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                              <ClipboardList size={20} className="text-slate-400 dark:text-slate-500" />
                              Groups
                            </h3>
                            <div className="space-y-2">
                              {selectedGame.scrimmageGroups && selectedGame.scrimmageGroups.some(g => g.length > 0) ? (
                                <div className="space-y-4">
                                  {[0, 1, 2, 3].map(groupIndex => {
                                    const group = selectedGame.scrimmageGroups?.[groupIndex] || [];
                                    if (group.length === 0) return null;
                                    return (
                                      <div key={groupIndex} className="space-y-2">
                                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Group {groupIndex + 1}</h4>
                                        {group.map(playerId => {
                                          const player = players.find(p => p.id === playerId);
                                          return (
                                            <div key={playerId} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 transition-colors duration-300">
                                              <span className="w-6 h-6 bg-slate-900 dark:bg-indigo-600 text-white rounded-lg flex items-center justify-center text-[10px] font-black shrink-0">
                                                {player?.name.charAt(0) || '?'}
                                              </span>
                                              <span className="font-bold text-slate-700 dark:text-slate-200">
                                                {player?.name || 'Unknown Player'}
                                                {player?.jerseyNumber && <span className="ml-1 text-slate-400 dark:text-slate-500 text-xs">#{player.jerseyNumber}</span>}
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-sm text-slate-400 dark:text-slate-500 italic p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 border-dashed text-center transition-colors duration-300">
                                  No groups set yet.
                                </p>
                              )}
                            </div>
                          </>
                        ) : (
                          <BattingOrderView 
                            game={selectedGame}
                            players={players}
                            localBattingOrder={selectedGame.battingOrder || []}
                            readOnly={true}
                          />
                        )}
                      </div>
                    )}

                    {/* Fielding Lineup */}
                    {activeTab === 'lineup' && (
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                          <LayoutGrid size={20} className="text-slate-400 dark:text-slate-500" />
                          Fielding Lineup
                        </h3>
                        <div className="space-y-4">
                          {selectedGame.lineup && Object.keys(selectedGame.lineup).length > 0 ? (
                            Object.entries(selectedGame.lineup).sort(([a], [b]) => Number(a) - Number(b)).map(([inningNum, inning]) => (
                              <div key={inningNum} className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 transition-colors duration-300">
                                <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Inning {inningNum}</h4>
                                {selectedGame.mode === 'scrimmage' && inning['HittingGroup'] != null && (
                                  <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
                                    <div className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-2">Hitting Group {parseInt(inning['HittingGroup']) + 1}</div>
                                    <div className="flex flex-wrap gap-2">
                                      {selectedGame.scrimmageGroups?.[parseInt(inning['HittingGroup'])]?.map(playerId => {
                                        const p = players.find(p => p.id === playerId);
                                        return p ? (
                                          <Badge key={playerId} variant="outline" className="bg-white dark:bg-slate-800">
                                            {p.name.split(' ')[0]}
                                            {p.jerseyNumber && <span className="ml-1 text-slate-400 dark:text-slate-500 text-[10px]">#{p.jerseyNumber}</span>}
                                          </Badge>
                                        ) : null;
                                      })}
                                      {Object.entries(inning)
                                        .filter(([pos]) => pos.startsWith('Extra Hitter'))
                                        .map(([pos, playerId]) => {
                                          const p = players.find(p => p.id === playerId);
                                          return p ? (
                                            <Badge key={playerId} variant="info">
                                              EH: {p.name.split(' ')[0]}
                                              {p.jerseyNumber && <span className="ml-1 text-indigo-400 dark:text-indigo-300 text-[10px]">#{p.jerseyNumber}</span>}
                                            </Badge>
                                          ) : null;
                                        })}
                                    </div>
                                  </div>
                                )}
                                <div className="grid grid-cols-2 gap-2">
                                  {Object.entries(inning)
                                    .filter(([pos]) => pos !== 'HittingGroup' && !pos.startsWith('Extra Hitter'))
                                    .sort(([posA], [posB]) => (POSITION_ORDER[posA] || 99) - (POSITION_ORDER[posB] || 99))
                                    .map(([pos, playerId]) => {
                                      const player = players.find(p => p.id === playerId);
                                      const isDuplicate = playerId && Object.values(inning).filter(id => id === playerId).length > 1;
                                      return (
                                        <div key={pos} className={`flex items-center gap-2 p-2 rounded-lg border shadow-sm transition-colors duration-300 ${
                                          isDuplicate 
                                            ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/30' 
                                            : 'bg-white dark:bg-slate-700 border-slate-100 dark:border-slate-600'
                                        }`}>
                                          <span className={`text-[10px] font-black w-6 shrink-0 ${isDuplicate ? 'text-rose-400 dark:text-rose-500' : 'text-slate-400 dark:text-slate-400'}`}>{getPositionAbbreviation(pos)}</span>
                                          <span className={`text-xs font-bold truncate ${isDuplicate ? 'text-rose-700 dark:text-rose-300' : 'text-slate-700 dark:text-slate-200'}`}>
                                            {player?.name || <span className="italic opacity-30">Empty</span>}
                                            {player?.jerseyNumber && <span className="ml-1 text-slate-400 dark:text-slate-500 text-[10px]">#{player.jerseyNumber}</span>}
                                          </span>
                                        </div>
                                      );
                                    })}
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-slate-400 dark:text-slate-500 italic p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 border-dashed text-center transition-colors duration-300">
                              No fielding lineup set yet.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          )
        ) : (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Game Schedule</h2>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">View upcoming games and lineups</p>
                </div>
                <Button
                  variant={showPastGames ? 'primary' : 'outline'}
                  onClick={() => setShowPastGames(!showPastGames)}
                  icon={History}
                >
                  {showPastGames ? 'Showing All Games' : 'Show Past Games'}
                </Button>
              </div>

              {(() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const filteredGames = games.filter(game => {
                  const gameDate = game.date?.toDate ? game.date.toDate() : new Date(game.date);
                  gameDate.setHours(0, 0, 0, 0);
                  return showPastGames ? gameDate < today : gameDate >= today;
                }).sort((a, b) => {
                  const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
                  const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
                  return showPastGames ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
                });

                if (filteredGames.length === 0) {
                  return (
                    <Card className="p-12 text-center border-dashed border-2" hover={false}>
                      <Calendar size={48} className="text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {showPastGames ? 'No past games' : 'No upcoming games'}
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400">
                        Check back later for updates.
                      </p>
                    </Card>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredGames.map((game) => {
                      const gameDate = game.date?.toDate ? game.date.toDate() : new Date(game.date);
                      const isPublished = game.isLocked || false;
                      
                      return (
                        <Card
                          key={game.id}
                          onClick={() => {
                            if (isPublished) {
                              navigate(`/shared/${ownerId}/games/${game.id}`);
                            }
                          }}
                          className={cn(
                            "p-6 text-left relative overflow-hidden",
                            !isPublished && "opacity-70 cursor-default"
                          )}
                          hover={isPublished}
                        >
                          {!isPublished && (
                            <Badge className="absolute top-3 right-3" variant="outline">
                              Draft
                            </Badge>
                          )}
                          {isPublished && (
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                              <ChevronRight size={20} className="text-slate-400 dark:text-slate-500" />
                            </div>
                          )}
                          <div className="flex items-start gap-4">
                            <div className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors",
                              isPublished ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" : "bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600"
                            )}>
                              <Calendar size={24} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white truncate">{game.name}</h3>
                                {game.mode === 'scrimmage' && (
                                  <Badge variant="info">Scrimmage</Badge>
                                )}
                              </div>
                              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                {gameDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                              </p>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}
      </main>
    </div>
  );
}
