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
  ChevronRight,
  Users
} from 'lucide-react';
import { POSITION_ORDER } from '../constants';
import { getPositionAbbreviation, cn } from '../lib/utils';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { useSharedData } from '../hooks/useSharedData';
import { NotAttendingList } from './common/NotAttendingList';
import { RSVPStatus } from '../types';

interface SharedViewProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

import { GameHeader } from './GameDetail/GameHeader';
import { GameDetailTabs } from './GameDetail/GameDetailTabs';
import { BattingOrderView } from './GameDetail/BattingOrderView';
import { PracticeAgendaView } from './GameDetail/PracticeAgendaView';

export function SharedView({ darkMode, setDarkMode }: SharedViewProps) {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Manually parse params since SharedView is rendered directly by BaseballApp
  const pathParts = location.pathname.split('/');
  const ownerId = pathParts[2];
  const gameId = pathParts[4];
  
  const { games, players, settings, loading, error } = useSharedData(ownerId);
  const selectedGame = gameId ? games.find(g => g.id === gameId) : null;
  const [activeTab, setActiveTab] = useState<'batting' | 'lineup' | 'agenda' | 'groups'>('batting');
  const [showPastGames, setShowPastGames] = useState(false);

  // Set default tab based on game type once selectedGame is available
  React.useEffect(() => {
    if (selectedGame) {
      if (selectedGame.type === 'practice') setActiveTab('agenda');
      else setActiveTab('batting');
    }
  }, [selectedGame?.type]);

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
                    The {selectedGame.type === 'practice' ? 'agenda' : 'lineup'} for this {selectedGame.type === 'practice' ? 'practice' : 'game'} is still being finalized. Please check back later.
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
                  players={players}
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
                    {/* Agenda */}
                    {activeTab === 'agenda' && selectedGame.type === 'practice' && (
                      <PracticeAgendaView game={selectedGame} readOnly={true} />
                    )}

                    {/* Batting Order / Groups */}
                    {(activeTab === 'batting' || activeTab === 'groups') && (
                      <div>
                        {selectedGame.mode === 'scrimmage' || selectedGame.type === 'practice' ? (
                          <div className="space-y-6">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                              {selectedGame.type === 'practice' ? <ClipboardList size={20} className="text-slate-400 dark:text-slate-500" /> : <Users size={20} className="text-slate-400 dark:text-slate-500" />}
                              Groups
                            </h3>
                            <div className="space-y-2">
                              {selectedGame.scrimmageGroups && selectedGame.scrimmageGroups.some(g => g.length > 0) ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                                  {Array.from({ length: selectedGame.numGroups || 4 }).map((_, groupIndex) => {
                                    const group = selectedGame.scrimmageGroups?.[groupIndex] || [];
                                    if (group.length === 0) return null;
                                    return (
                                      <div key={groupIndex} className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 transition-colors duration-300">
                                        <div className="flex items-center justify-between mb-4">
                                          <h4 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Group {groupIndex + 1}</h4>
                                          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{group.length} Players</span>
                                        </div>
                                        <div className="space-y-2">
                                          {group.map(playerId => {
                                            const player = players.find(p => p.id === playerId);
                                            return (
                                              <div key={playerId} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-300">
                                                <span className="w-8 h-8 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg flex items-center justify-center text-xs font-black shrink-0">
                                                  {player?.name.charAt(0) || '?'}
                                                </span>
                                                <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                                                  {player?.name || 'Unknown Player'}
                                                  {player?.jerseyNumber && <span className="ml-1 text-[10px] text-slate-400 dark:text-slate-500 opacity-50">#{player.jerseyNumber}</span>}
                                                </span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-sm text-slate-400 dark:text-slate-500 italic p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 border-dashed text-center transition-colors duration-300">
                                  No groups set yet.
                                </p>
                              )}
                            </div>
                          </div>
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
                                {(() => {
                                  const assignedIds = new Set(Object.values(inning).filter(Boolean) as string[]);
                                  const benchedPlayers = players.filter(p => 
                                    selectedGame.rsvps?.[p.id] !== RSVPStatus.NO && 
                                    !assignedIds.has(p.id)
                                  );

                                  if (benchedPlayers.length === 0) return null;

                                  return (
                                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                                      <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Bench</div>
                                      <div className="flex flex-wrap gap-2">
                                        {benchedPlayers.map(p => (
                                          <Badge key={p.id} variant="default" className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                            {p.name.split(' ')[0]}
                                            {p.jerseyNumber && <span className="ml-1 opacity-70 text-[10px]">#{p.jerseyNumber}</span>}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-slate-400 dark:text-slate-500 italic p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 border-dashed text-center transition-colors duration-300">
                              No fielding lineup set yet.
                            </p>
                          )}
                        </div>

                        <div className="mt-8">
                          <NotAttendingList 
                            outPlayers={players.filter(p => selectedGame.rsvps?.[p.id] === RSVPStatus.NO).sort((a, b) => a.name.localeCompare(b.name))} 
                            readOnly={true} 
                          />
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
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Event Schedule</h2>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">View upcoming events and lineups</p>
                </div>
                <Button
                  variant={showPastGames ? 'primary' : 'outline'}
                  onClick={() => setShowPastGames(!showPastGames)}
                  icon={History}
                >
                  {showPastGames ? 'Show Upcoming' : 'Show Past'}
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
                        {showPastGames ? 'No past events' : 'No upcoming events'}
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
                              isPublished ? (game.type === 'practice' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400") : "bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600"
                            )}>
                              {game.type === 'practice' ? <ClipboardList size={24} /> : <Calendar size={24} />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white truncate">{game.name}</h3>
                                {game.type === 'practice' && (
                                  <Badge variant="warning">Practice</Badge>
                                )}
                                {game.mode === 'scrimmage' && (
                                  <Badge variant="info">Scrimmage</Badge>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                  {gameDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                </p>
                                {game.time && (
                                  <>
                                    <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full shrink-0"></span>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                      {(() => {
                                        const [hours, minutes] = game.time.split(':');
                                        const h = parseInt(hours);
                                        const ampm = h >= 12 ? 'PM' : 'AM';
                                        const h12 = h % 12 || 12;
                                        return `${h12}:${minutes} ${ampm}`;
                                      })()}
                                    </p>
                                  </>
                                )}
                                {game.type === 'practice' && game.duration && (
                                  <>
                                    <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full shrink-0"></span>
                                    <span className="text-sm text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                                      {game.duration} min
                                    </span>
                                  </>
                                )}
                                {game.location && (
                                  <>
                                    <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full shrink-0"></span>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium truncate">
                                      {game.location}
                                    </p>
                                  </>
                                )}
                              </div>
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
