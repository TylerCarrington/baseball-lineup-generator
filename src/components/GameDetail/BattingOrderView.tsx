import React, { useMemo } from 'react';
import { RefreshCw, ChevronUp, ChevronDown, AlertCircle } from 'lucide-react';
import { Game, Player, RSVPStatus } from '../../types';
import { getPositionAbbreviation } from '../../lib/utils';

interface BattingOrderViewProps {
  game: Game;
  players: Player[];
  localBattingOrder: string[];
  readOnly?: boolean;
  handleReshuffleLineup?: (gameId: string | null) => Promise<void>;
  handleMovePlayerToPosition?: (playerId: string, newPositionIndex: number) => Promise<void>;
  handleUpdateGameRSVP?: (gameId: string, playerId: string, status: RSVPStatus) => Promise<void>;
  handleMovePlayer?: (playerId: string, direction: 'up' | 'down') => void;
}

interface BattingOrderRowProps {
  player: Player;
  index: number;
  totalInOrder: number;
  game: Game;
  readOnly: boolean;
  playerPositions: Record<number, string>;
  handleMovePlayerToPosition?: (playerId: string, newPositionIndex: number) => Promise<void>;
  handleUpdateGameRSVP?: (gameId: string, playerId: string, status: RSVPStatus) => Promise<void>;
  handleMovePlayer?: (playerId: string, direction: 'up' | 'down') => void;
  inOrder: string[];
}

const BattingOrderRow = React.memo<BattingOrderRowProps>(({
  player,
  index,
  totalInOrder,
  game,
  readOnly,
  playerPositions,
  handleMovePlayerToPosition,
  handleUpdateGameRSVP,
  handleMovePlayer,
  inOrder
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all group gap-4">
      <div className="flex items-center gap-4 sm:gap-6">
        {game.mode !== 'scrimmage' && !readOnly && handleMovePlayerToPosition ? (
          <div className="relative group/order">
            <select
              disabled={game.isLocked}
              value={index}
              onChange={(e) => handleMovePlayerToPosition(player.id, parseInt(e.target.value))}
              className={`absolute inset-0 w-full h-full opacity-0 z-10 ${game.isLocked ? 'cursor-not-allowed' : 'cursor-pointer'} bg-white dark:bg-slate-900 text-slate-900 dark:text-white`}
            >
              {inOrder.map((_, i) => (
                <option key={i} value={i} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {i + 1}
                </option>
              ))}
            </select>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl sm:rounded-2xl flex items-center justify-center text-xs sm:text-sm font-black shadow-xl shadow-slate-900/20 dark:shadow-indigo-900/20 group-hover:scale-110 transition-transform flex-shrink-0">
              {index + 1}
            </div>
          </div>
        ) : (
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl sm:rounded-2xl flex items-center justify-center text-xs sm:text-sm font-black shadow-xl shadow-slate-900/20 dark:shadow-indigo-900/20 group-hover:scale-110 transition-transform flex-shrink-0">
            {index + 1}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-black text-slate-900 dark:text-white text-lg sm:text-xl tracking-tight truncate">
            {player.name}
            {player.jerseyNumber && (
              <span className="text-sm text-slate-400 dark:text-slate-500 ml-2">#{player.jerseyNumber}</span>
            )}
          </p>
          {game.lineup ? (
            <div className="flex flex-wrap gap-x-1.5 gap-y-1 mt-1.5">
              {[1, 2, 3, 4, 5, 6].map(inning => {
                const position = playerPositions[inning] || "Bench";
                const isBench = position === "Bench";
                return (
                  <span key={inning} className={`text-[8px] sm:text-[9px] font-black px-1.5 sm:px-2 py-0.5 rounded-lg border transition-all ${
                    isBench
                      ? 'text-rose-600 bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/30'
                      : 'text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'
                  }`}>
                    <span className={`${isBench ? 'text-amber-300' : 'text-slate-500 dark:text-slate-600'} mr-1`}>{inning}</span>
                    {position}
                  </span>
                );
              })}
            </div>
          ) : (
            <p className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest mt-1 truncate">{(player.positions || []).map(getPositionAbbreviation).join(', ')}</p>
          )}
        </div>
      </div>
      {!readOnly && (
        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 border-t sm:border-t-0 border-slate-50 dark:border-slate-800 pt-3 sm:pt-0">
          <div className="flex gap-1 flex-1 sm:flex-none">
            {[RSVPStatus.YES, RSVPStatus.TENTATIVE, RSVPStatus.NO].map(status => (
              <button
                key={status}
                onClick={() => handleUpdateGameRSVP?.(game.id, player.id, status)}
                className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest transition-all border ${
                  game.rsvps[player.id] === status
                    ? status === RSVPStatus.YES
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                      : status === RSVPStatus.TENTATIVE
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                        : 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                    : 'bg-white dark:bg-slate-800 text-slate-300 dark:text-slate-600 border-slate-100 dark:border-slate-700 hover:text-slate-500 dark:hover:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          {game.mode === 'scrimmage' && handleMovePlayer && (
            <div className="flex sm:flex-col gap-1">
              <button
                onClick={() => handleMovePlayer(player.id, 'up')}
                disabled={index === 0}
                className={`p-2 sm:p-1 rounded-lg transition-all ${
                  index === 0
                    ? 'text-slate-100 dark:text-slate-800 cursor-not-allowed'
                    : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ChevronUp size={20} />
              </button>
              <button
                onClick={() => handleMovePlayer(player.id, 'down')}
                disabled={index === totalInOrder - 1}
                className={`p-2 sm:p-1 rounded-lg transition-all ${
                  index === totalInOrder - 1
                    ? 'text-slate-100 dark:text-slate-800 cursor-not-allowed'
                    : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ChevronDown size={20} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export const BattingOrderView: React.FC<BattingOrderViewProps> = ({
  game,
  players,
  localBattingOrder,
  readOnly = false,
  handleReshuffleLineup,
  handleMovePlayerToPosition,
  handleUpdateGameRSVP,
  handleMovePlayer,
}) => {
  const inOrder = useMemo(() => localBattingOrder.filter(id =>
    players.some(p => p.id === id) &&
    game.rsvps[id] !== RSVPStatus.NO
  ), [localBattingOrder, players, game.rsvps]);

  const outPlayers = useMemo(() => players.filter(p =>
    game.rsvps[p.id] === RSVPStatus.NO
  ).sort((a, b) => a.name.localeCompare(b.name)), [players, game.rsvps]);

  const playerPositionsByInning = useMemo(() => {
    const map: Record<string, Record<number, string>> = {};
    if (!game.lineup) return map;

    Object.entries(game.lineup).forEach(([inningKey, inningLineup]) => {
      const inning = parseInt(inningKey);
      Object.entries(inningLineup).forEach(([pos, pId]) => {
        if (pId && typeof pId === 'string') {
          if (!map[pId]) map[pId] = {};
          map[pId][inning] = getPositionAbbreviation(pos);
        }
      });
    });
    return map;
  }, [game.lineup]);

  if (!game.battingOrder) return null;

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Batting Order</h3>
          <div className="flex items-center gap-3">
            {!game.isLocked && !readOnly && handleReshuffleLineup && (
              <button
                onClick={() => handleReshuffleLineup(game.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <RefreshCw size={12} />
                Reshuffle
              </button>
            )}
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{inOrder.length} In</span>
          </div>
        </div>
        <div className="space-y-3">
          {inOrder.map((playerId, index) => {
            const player = players.find(p => p.id === playerId);
            if (!player) return null;

            return (
              <BattingOrderRow
                key={playerId}
                player={player}
                index={index}
                totalInOrder={inOrder.length}
                game={game}
                readOnly={readOnly}
                playerPositions={playerPositionsByInning[playerId] || {}}
                handleMovePlayerToPosition={handleMovePlayerToPosition}
                handleUpdateGameRSVP={handleUpdateGameRSVP}
                handleMovePlayer={handleMovePlayer}
                inOrder={inOrder}
              />
            );
          })}
        </div>
      </div>

      {outPlayers.length > 0 && !readOnly && (
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
                  <p className="font-bold text-slate-500 dark:text-slate-400">
                    {player.name}
                    {player.jerseyNumber && (
                      <span className="text-xs text-slate-400 dark:text-slate-500 ml-1">#{player.jerseyNumber}</span>
                    )}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleUpdateGameRSVP?.(game.id, player.id, RSVPStatus.YES)}
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
