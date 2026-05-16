import React, { useEffect, useMemo } from 'react';
import { Game, Player, RSVPStatus } from '../types';
import { getPositionAbbreviation } from '../lib/utils';

interface PrintGameViewProps {
  game: Game;
  players: Player[];
  games: Game[];
  user: any;
  isAuthReady: boolean;
  setGames: any;
}

const POSITION_COORDINATES: Record<string, { x: number; y: number; anchor: string }> = {
  "Starting Pitcher": { x: 50, y: 58, anchor: "middle" },
  "Relief Pitcher": { x: 50, y: 58, anchor: "middle" },
  "Pitcher": { x: 50, y: 58, anchor: "middle" },
  "Catcher": { x: 50, y: 94, anchor: "middle" },
  "First Base": { x: 88, y: 50, anchor: "start" },
  "Second Base": { x: 72, y: 32, anchor: "start" },
  "Third Base": { x: 12, y: 50, anchor: "end" },
  "Shortstop": { x: 28, y: 32, anchor: "end" },
  "Left Field": { x: 15, y: 10, anchor: "middle" },
  "Center Field": { x: 50, y: 4, anchor: "middle" },
  "Right Field": { x: 85, y: 10, anchor: "middle" }
};

export function PrintGameView({ game, players }: PrintGameViewProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
    }, 1200);
    return () => clearTimeout(timer);
  }, [game.id]);

  const gameDateObj = useMemo(() => {
    return game.date?.seconds 
      ? new Date(game.date.seconds * 1000) 
      : new Date(game.date);
  }, [game]);

  const battingOrderPlayers = useMemo(() => {
    if (!game.battingOrder) return [];
    return game.battingOrder
      .map(id => players.find(p => p.id === id))
      .filter((p): p is Player => p !== undefined);
  }, [game.battingOrder, players]);

  const attendingPlayers = useMemo(() => {
    return players.filter(p => game.rsvps?.[p.id] === RSVPStatus.YES || game.rsvps?.[p.id] === RSVPStatus.TENTATIVE);
  }, [players, game.rsvps]);

  const notAttendingPlayers = useMemo(() => {
    return players.filter(p => game.rsvps?.[p.id] === RSVPStatus.NO);
  }, [players, game.rsvps]);

  const noteSections = useMemo(() => {
    if (game.practiceNoteSections && game.practiceNoteSections.length > 0) {
      return game.practiceNoteSections;
    }
    if (game.practiceNotes && game.practiceNotes.length > 0) {
      return [{
        id: 'general',
        title: 'Practice Notes',
        notes: game.practiceNotes.map(n => ({ id: '', text: n }))
      }];
    }
    return [];
  }, [game.practiceNoteSections, game.practiceNotes]);

  const firstInningPositionMap = useMemo(() => {
    if (!game.lineup?.['1']) return {};
    return Object.entries(game.lineup['1']).reduce((acc, [pos, pId]) => {
      if (pId) acc[pId] = getPositionAbbreviation(pos);
      return acc;
    }, {} as Record<string, string>);
  }, [game.lineup]);

  const renderDiamond = (inning: number) => {
    const inningStr = inning.toString();
    const inningLineup = game.lineup?.[inningStr] || {};
    
    // Find players assigned to positions in this inning
    const assignedPlayerIds = new Set(Object.values(inningLineup));
    
    // Find bench players (attending but not assigned)
    const benchPlayers = attendingPlayers.filter(p => !assignedPlayerIds.has(p.id));

    return (
      <div key={inning} className="relative border border-black p-1.5 rounded-md bg-white">
        <div className="absolute top-0.5 left-1.5 font-bold text-[10px] uppercase tracking-tighter text-black">Inning {inning}</div>
        
        <div className="aspect-square relative w-[80%] mx-auto overflow-visible py-2 mt-1">
          <svg viewBox="-20 -10 140 120" className="w-full h-full text-black overflow-visible">
            {/* Diamond lines - Shrink from center (50, 50) */}
            <path d="M 50 82 L 82 50 L 50 18 L 18 50 Z" fill="none" stroke="black" strokeWidth="0.4" />
            <circle cx="50" cy="82" r="1" fill="black" />   {/* Home */}
            <circle cx="82" cy="50" r="1" fill="black" />   {/* 1B */}
            <circle cx="50" cy="18" r="1" fill="black" />   {/* 2B */}
            <circle cx="18" cy="50" r="1" fill="black" />   {/* 3B */}
            
            {/* Player Markers */}
            {Object.entries(inningLineup).map(([pos, pId]) => {
              const coords = POSITION_COORDINATES[pos];
              if (!coords) return null;
              const player = players.find(p => p.id === pId);
              if (!player) return null;
              
              return (
                <g key={pos}>
                  <text 
                    x={coords.x} 
                    y={coords.y} 
                    textAnchor={coords.anchor as any}
                    className="fill-black font-black text-[7.5px]"
                  >
                    {player.name}
                  </text>
                  <text 
                    x={coords.x} 
                    y={coords.y + 7} 
                    textAnchor={coords.anchor as any}
                    className="fill-black font-extrabold text-[6px]"
                  >
                    #{player.jerseyNumber || ''}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Bench List */}
        <div className="mt-1 border-t border-black pt-0.5">
          <div className="text-[7px] font-bold text-black uppercase leading-none mb-0.5">Bench</div>
          <div className="flex flex-wrap gap-x-1.5 gap-y-0.5">
            {benchPlayers.length > 0 ? (
              benchPlayers.map(p => (
                <span key={p.id} className="text-[10px] text-black whitespace-nowrap font-medium">
                  {p.name} {p.jerseyNumber && `#${p.jerseyNumber}`}
                </span>
              ))
            ) : (
              <span className="text-[7px] text-black italic font-medium">None</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white text-black min-h-screen p-6 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* Print Header */}
        <div className="border-b-2 border-black pb-3 mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-extrabold uppercase tracking-tight leading-none mb-1">
              {game.type === 'practice' ? 'Practice' : game.name}
            </h1>
            <div className="text-black flex items-center gap-4 text-sm font-bold">
              <span>{gameDateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
              {game.time && (
                <span>{(() => {
                    const [hours, minutes] = game.time.split(':');
                    const h = parseInt(hours);
                    const ampm = h >= 12 ? 'PM' : 'AM';
                    const h12 = h % 12 || 12;
                    const timeStr = `${h12}:${minutes} ${ampm}`;
                    if (game.type === 'practice' && game.duration) {
                      return `${timeStr} (${game.duration} mins)`;
                    }
                    return timeStr;
                  })()}</span>
              )}
              {game.location && <span>{game.location}</span>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-black uppercase text-black tracking-widest">Lineup+ Official Card</div>
          </div>
        </div>

        {/* Practice view remains simple */}
        {game.type === 'practice' ? (
          <div className="grid grid-cols-[1fr_250px] gap-8">
            {/* Practice Agenda */}
            <div className="space-y-8">
              {game.practiceAgenda && game.practiceAgenda.length > 0 && (
                <div>
                  <h2 className="text-sm font-black uppercase border-b border-black pb-1 mb-4 text-black tracking-widest">Practice Agenda</h2>
                  <div className="space-y-0">
                    {(() => {
                      let runningCumulative = 0;
                      const agendaWithTimes = game.practiceAgenda.map(activity => {
                        const startOffset = activity.startTimeOffset !== undefined ? activity.startTimeOffset : runningCumulative;
                        runningCumulative = startOffset + (activity.duration || 0);
                        return { ...activity, startOffset };
                      }).sort((a, b) => a.startOffset - b.startOffset);

                      const getClockTime = (baseTime: string, offsetMinutes: number) => {
                        const [hoursStr, minutesStr] = baseTime.split(':');
                        let hours = parseInt(hoursStr, 10);
                        let minutes = parseInt(minutesStr, 10) + offsetMinutes;
                        hours += Math.floor(minutes / 60);
                        minutes = minutes % 60;
                        const ampm = hours >= 12 ? 'pm' : 'am';
                        const h12 = hours % 12 || 12;
                        return `${h12}:${minutes.toString().padStart(2, '0')}${ampm}`;
                      };

                      return agendaWithTimes.map((activity) => {
                        return (
                          <div key={activity.id} className="flex gap-4 items-start py-2.5 border-b border-black last:border-0 border-opacity-30">
                            <div className="w-16 shrink-0 pt-0.5">
                              <div className="text-sm font-black text-black leading-none">
                                {game.time ? getClockTime(game.time, activity.startOffset) : `${activity.startOffset}m`}
                              </div>
                              <div className="text-[8px] font-black text-black uppercase tracking-widest mt-1">{activity.duration} min</div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-0.5 gap-2">
                                <h3 className="text-sm font-black text-black uppercase tracking-tight leading-tight">{activity.name}</h3>
                                <span className="text-[8px] font-black uppercase text-black border border-black px-1 py-0.5 rounded leading-none shrink-0">{activity.type}</span>
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-1.5">
                                {(activity.type === 'groups' || activity.type === 'rotating') && activity.groupMap && (
                                  Object.entries(activity.groupMap).map(([idx, drill]) => (
                                    drill && (
                                      <div key={idx} className="flex flex-col">
                                        <span className="text-[7px] font-black uppercase text-black opacity-60 leading-none mb-0.5">
                                          {activity.type === 'rotating' ? `Drill ${parseInt(idx) + 1}` : `Group ${parseInt(idx) + 1}`}
                                        </span>
                                        <span className="text-xs font-bold text-black leading-snug">{drill}</span>
                                      </div>
                                    )
                                  ))
                                )}
                                {activity.drillName && (
                                  <div className="flex flex-col">
                                    <span className="text-[7px] font-black uppercase text-black opacity-60 leading-none mb-0.5">Drill</span>
                                    <span className="text-xs font-bold text-black leading-snug">{activity.drillName}</span>
                                  </div>
                                )}
                                {activity.category && (
                                  <div className="flex flex-col">
                                    <span className="text-[7px] font-black uppercase text-black opacity-60 leading-none mb-0.5">Category</span>
                                    <span className="text-xs font-bold text-black leading-snug">{activity.category}</span>
                                  </div>
                                )}
                              </div>
                              {activity.notes && (
                                <div className="mt-2 text-xs font-bold text-black border-t border-black border-opacity-10 pt-1">
                                  <span className="opacity-60 italic mr-1">Note:</span>
                                  {activity.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}
            </div>

            {/* Groups */}
            <div className="space-y-8">
              {game.numGroups && game.numGroups > 1 && game.scrimmageGroups && (
                <div>
                  <h2 className="text-sm font-black uppercase border-b border-black pb-1 mb-2 text-black tracking-widest">Groups</h2>
                  <div className="space-y-3">
                    {Array.from({ length: game.numGroups }).map((_, i) => {
                      const groupPlayerIds = game.scrimmageGroups![i] || [];
                      const groupPlayers = attendingPlayers.filter(p => groupPlayerIds.includes(p.id));
                      
                      if (groupPlayers.length === 0) return null;
                      
                      return (
                        <div key={i}>
                          <h3 className="text-[10px] font-black uppercase text-black opacity-70 mb-0.5">Group {i + 1}</h3>
                          <p className="text-[11px] font-bold text-black leading-snug">
                            {groupPlayers.map(p => {
                              const isTentative = game.rsvps?.[p.id] === RSVPStatus.TENTATIVE;
                              const jersey = p.jerseyNumber ? ` (#${p.jerseyNumber})` : '';
                              const tentative = isTentative ? ' (?)' : '';
                              return `${p.name}${jersey}${tentative}`;
                            }).join(', ')}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {notAttendingPlayers.length > 0 && (
                <div>
                  <h2 className="text-sm font-black uppercase border-b border-black pb-1 mb-2 text-black tracking-widest">Players Out</h2>
                  <p className="text-xs font-bold text-black leading-snug">
                    {notAttendingPlayers.map(p => `${p.name}${p.jerseyNumber ? ` (#${p.jerseyNumber})` : ''}`).join(' • ')}
                  </p>
                </div>
              )}

              {noteSections.length > 0 && (
                <div className="space-y-6">
                  {noteSections.map((section) => (
                    <div key={section.id}>
                      <h2 className="text-sm font-black uppercase border-b border-black pb-1 mb-2 text-black tracking-widest">{section.title}</h2>
                      <ul className="space-y-1.5">
                        {section.notes.map((note, index) => (
                          <li key={index} className="flex gap-2 items-start">
                            <div className="mt-1.5 w-1 h-1 rounded-full bg-black shrink-0" />
                            <p className="text-[11px] font-bold text-black leading-tight">{note.text}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Multi-column Layout for Games */
          <div className="grid grid-cols-[200px_1fr] gap-8">
            
            {/* Left Column: Batting Order */}
            <div className="border-r border-black pr-6">
              <h2 className="text-sm font-black uppercase tracking-widest text-black mb-4 pb-1 border-b border-black">Batting Order</h2>
              {battingOrderPlayers.length > 0 ? (
                <ol className="space-y-1.5">
                  {battingOrderPlayers.map((player, idx) => (
                    <li key={player.id} className="flex items-center gap-3 py-1 border-b border-black last:border-0 text-black">
                      <span className="w-5 text-sm font-black text-black">{(idx + 1).toString().padStart(2, '0')}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold truncate leading-tight">
                          {player.name}
                          <span className="ml-1 opacity-60">({firstInningPositionMap[player.id] || 'EH'})</span>
                        </div>
                        {player.jerseyNumber && <div className="text-[10px] text-black font-black leading-none">#{player.jerseyNumber}</div>}
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-xs text-black italic font-bold">No batting order</p>
              )}

              {/* Not Attending Section */}
              <div className="mt-8">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-black mb-2 pb-0.5 border-b border-black">Not Attending</h2>
                {notAttendingPlayers.length > 0 ? (
                  <ul className="space-y-1">
                    {notAttendingPlayers.map(player => (
                      <li key={player.id} className="text-[10px] text-black font-black">
                        {player.name} {player.jerseyNumber && `#${player.jerseyNumber}`}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[8px] text-black italic font-bold">None</p>
                )}
              </div>
            </div>

            {/* Right Column: Inning Diamonds */}
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-black mb-4 pb-1 border-b border-black">Fielding Lineup</h2>
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4, 5, 6].map(inning => renderDiamond(inning))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-black text-[8px] text-black text-center uppercase tracking-widest font-black">
          Created with Lineup+
        </div>

      </div>
    </div>
  );
}
