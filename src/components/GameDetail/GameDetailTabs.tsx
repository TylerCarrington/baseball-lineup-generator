import React from 'react';
import { ClipboardList, LayoutGrid, AlertCircle } from 'lucide-react';
import { Game, RSVPStatus } from '../../types';

interface GameDetailTabsProps {
  game: Game;
  gameViewTab: 'batting' | 'lineup';
  setGameViewTab: (tab: 'batting' | 'lineup') => void;
  onFieldLineupClick?: () => void;
  readOnly?: boolean;
}

export const GameDetailTabs: React.FC<GameDetailTabsProps> = ({
  game,
  gameViewTab,
  setGameViewTab,
  onFieldLineupClick,
  readOnly = false,
}) => {
  const getScrimmageIssues = () => {
    if (game.mode !== 'scrimmage') return false;

    const s1Issues = [1, 2, 3, 4, 5, 6].some(inning => {
      const ik = inning.toString();
      return ["Pitcher", "Catcher"].some(pos => {
        const pId = game.lineup?.[ik]?.[pos];
        return pId && game.rsvps[pId] === RSVPStatus.NO;
      });
    });

    const s2Issues = (game.scrimmageGroups || []).some(group => 
      group.some(pId => game.rsvps[pId] === RSVPStatus.NO)
    );

    const s3Issues = [1, 2, 3, 4, 5, 6].some(inning => {
      const ik = inning.toString();
      const iLineup = game.lineup?.[ik] || {};
      return Object.entries(iLineup).some(([pos, pId]) => {
        if (pos === 'HittingGroup') return false;
        return pId && game.rsvps[pId] === RSVPStatus.NO;
      });
    });

    return s1Issues || s2Issues || s3Issues;
  };

  const hasScrimmageIssues = !readOnly && getScrimmageIssues();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-6">
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl gap-1 w-full sm:w-auto">
        <button 
          onClick={() => setGameViewTab('batting')}
          className={`flex-1 sm:flex-none px-8 py-3 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 ${
            gameViewTab === 'batting' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <ClipboardList size={20} />
          {game.mode === 'scrimmage' ? 'Groups' : 'Batting Order'}
        </button>
        <button 
          onClick={() => {
            if (onFieldLineupClick) onFieldLineupClick();
            setGameViewTab('lineup');
          }}
          className={`flex-1 sm:flex-none px-8 py-3 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 relative ${
            gameViewTab === 'lineup' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <LayoutGrid size={20} />
          Field Lineup
          {hasScrimmageIssues && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center">
              <AlertCircle size={10} className="text-white" />
            </div>
          )}
        </button>
      </div>
    </div>
  );
};
