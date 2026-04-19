import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Player, RSVPStatus } from '../../types';

interface LineupCellProps {
  inningKey: string;
  pos: string;
  playerId?: string;
  players: Player[];
  gameRSVPs: Record<string, string>;
  gameLineupInning: Record<string, string>;
  isLockedInning?: boolean;
  isLockedPosition?: boolean;
  isDuplicate?: boolean;
  isOut?: boolean;
  isEditing?: boolean;
  setEditingCell?: (cell: { inning: string, position: string } | null) => void;
  handleUpdateLineupCell?: (gameId: string, inning: string, position: string, playerId: string) => void;
  selectedGameId?: string;
  readOnly?: boolean;
  darkMode?: boolean;
}

export const LineupCell = React.memo<LineupCellProps>(({
  inningKey,
  pos,
  playerId,
  players,
  gameRSVPs,
  gameLineupInning,
  isLockedInning = false,
  isLockedPosition = false,
  isDuplicate = false,
  isOut = false,
  isEditing = false,
  setEditingCell,
  handleUpdateLineupCell,
  selectedGameId = '',
  readOnly = false,
  darkMode = false,
}) => {
  const player = players.find(p => p.id === playerId);

  if (readOnly) {
    if (!player) {
      return <span className="text-slate-300 dark:text-slate-600 italic">Empty</span>;
    }
    return (
      <div className={`inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold transition-all min-w-[100px] border ${
        isOut
          ? 'bg-rose-500 dark:bg-rose-900/50 text-white border-rose-600 dark:border-rose-800'
          : isDuplicate
            ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/30'
            : isLockedInning || isLockedPosition
              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30' 
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
      }`}>
        <span>
          {player.name}
          {player.jerseyNumber && (
            <span className="opacity-50 ml-1">#{player.jerseyNumber}</span>
          )}
        </span>
        {isOut && <AlertCircle size={12} className="ml-2" />}
      </div>
    );
  }

  // Edit Mode Logic
  return (
    <>
      {isEditing && setEditingCell && handleUpdateLineupCell && (
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
              const assignedElsewhere = Object.entries(gameLineupInning)
                .filter(([pPos]) => pPos !== pos)
                .map(([_, pId]) => pId);
              
              return players
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(p => {
                  const isCurrent = p.id === playerId;
                  const isAssignedElsewhere = !isCurrent && assignedElsewhere.includes(p.id);
                  const isPlayerOut = gameRSVPs[p.id] === RSVPStatus.NO;
                  
                  let statusLabel = 'Bench';
                  let statusColor = darkMode ? '#34d399' : '#059669'; // Emerald-400 : Emerald-600
                  let statusBg = darkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600';

                  if (isPlayerOut) {
                    statusLabel = 'NO';
                    statusColor = darkMode ? '#fb7185' : '#f43f5e'; // Rose-400 : Rose-500
                    statusBg = darkMode ? 'bg-rose-900/30 text-rose-400' : 'bg-rose-50 text-rose-500';
                  } else if (isCurrent) {
                    statusLabel = 'Current';
                    statusColor = darkMode ? '#60a5fa' : '#2563eb'; // Blue-400 : Blue-600
                    statusBg = darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600';
                  } else if (isAssignedElsewhere) {
                    statusLabel = 'Field';
                    statusColor = darkMode ? '#64748b' : '#94a3b8'; // Slate-500 : Slate-400
                    statusBg = darkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400';
                  }

                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        handleUpdateLineupCell(selectedGameId, inningKey, pos, p.id);
                        setEditingCell(null);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between transition-colors group/item"
                      style={{ color: statusColor }}
                    >
                      <span>
                        {p.name}
                        {p.jerseyNumber && (
                          <span className="text-[10px] opacity-50 ml-1">#{p.jerseyNumber}</span>
                        )}
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
        onClick={() => setEditingCell && setEditingCell({ inning: inningKey, position: pos })}
        className={`inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold transition-all min-w-[100px] border ${
          isOut
            ? 'bg-rose-500 dark:bg-rose-900/50 text-white border-rose-600 dark:border-rose-800 shadow-md shadow-rose-200 dark:shadow-none'
            : isDuplicate
              ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/50 shadow-sm shadow-rose-100 dark:shadow-none'
              : isLockedInning || isLockedPosition
                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30' 
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm dark:shadow-none group-hover:border-slate-200 dark:group-hover:border-slate-600'
        } ${isEditing ? 'ring-2 ring-slate-900 dark:ring-white border-slate-900 dark:border-white' : ''}`}
      >
        {player ? (
          <span>
            {player.name}
            {player.jerseyNumber && (
              <span className="opacity-50 ml-1">#{player.jerseyNumber}</span>
            )}
          </span>
        ) : (
          <span className="text-slate-300 dark:text-slate-600 italic">Empty</span>
        )}
        {isOut && <AlertCircle size={12} className="ml-2" />}
      </button>
    </>
  );
});
