import React, { useEffect, useMemo } from 'react';
import { Game, Player, RSVPStatus } from '../types';

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
              {game.name}
            </h1>
            <div className="text-black flex items-center gap-4 text-sm font-bold">
              <span>{gameDateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
              {game.time && (
                <span>{(() => {
                    const [hours, minutes] = game.time.split(':');
                    const h = parseInt(hours);
                    const ampm = h >= 12 ? 'PM' : 'AM';
                    const h12 = h % 12 || 12;
                    return `${h12}:${minutes} ${ampm}`;
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
          <div className="mb-12">
            <h2 className="text-2xl font-bold uppercase border-b border-black pb-2 mb-6 text-black">Expected Players</h2>
            <ul className="grid grid-cols-3 gap-2 py-4">
              {attendingPlayers.map(player => (
                  <li key= {player.id} className="text-lg font-bold text-black" >
                    {player.name} {game.rsvps?.[player.id] === RSVPStatus.TENTATIVE && <span className="text-black italic text-sm font-bold">(?)</span>}
                  </li>
              ))}
            </ul>
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
                        <div className="text-sm font-bold truncate leading-tight">{player.name}</div>
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
