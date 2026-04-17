import React from 'react';
import { 
  Plus, 
  History, 
  Check, 
  Share2, 
  ClipboardList, 
  Trash2 
} from 'lucide-react';
import { User } from 'firebase/auth';
import { toast } from 'sonner';
import { Game, TeamSettings, RSVPStatus } from '../types';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';

interface GamesTabProps {
  showPastGames: boolean;
  setShowPastGames: (val: boolean) => void;
  settings: TeamSettings | null;
  handleCopyLink: (link: string) => void;
  user: User | null;
  handleTabChange: (tab: string) => void;
  copySuccess: boolean;
  startCreateLineup: () => void;
  games: Game[];
  handleViewGame: (id: string) => void;
  setDeleteConfirmation: (val: any) => void;
}

export function GamesTab({
  showPastGames,
  setShowPastGames,
  settings,
  handleCopyLink,
  user,
  handleTabChange,
  copySuccess,
  startCreateLineup,
  games,
  handleViewGame,
  setDeleteConfirmation
}: GamesTabProps) {
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Game Schedule</h2>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">Manage your {showPastGames ? 'past' : 'upcoming'} games and lineups</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            variant={settings?.publicSchedule ? 'secondary' : 'outline'}
            onClick={() => {
              if (settings?.publicSchedule) {
                handleCopyLink(`${window.location.origin}${window.location.pathname}#/shared/${user?.uid}/games`);
              } else {
                handleTabChange('settings');
              }
            }}
            icon={copySuccess ? Check : Share2}
            className="flex-1 sm:flex-none"
            title={settings?.publicSchedule ? 'Copy public schedule link' : 'Enable public sharing in settings'}
          >
            {copySuccess ? 'Copied!' : 'Share'}
          </Button>
          
          <Button
            variant={showPastGames ? 'primary' : 'outline'}
            onClick={() => setShowPastGames(!showPastGames)}
            icon={History}
            className="flex-1 sm:flex-none"
          >
            {showPastGames ? 'Showing Past' : 'Show Past'}
          </Button>

          <Button
            onClick={startCreateLineup}
            icon={Plus}
            className="flex-1 sm:flex-none"
          >
            New Game
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredGames.length === 0 ? (
          <Card className="p-8 sm:p-16 text-center border-dashed border-2" hover={false}>
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-3">
              <ClipboardList size={32} />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2">
              {showPastGames ? 'No past games' : 'No upcoming games'}
            </h3>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mb-8 max-w-xs mx-auto">
              {showPastGames 
                ? "You haven't completed any games yet." 
                : "Create your first game to start managing your team's lineup and availability."}
            </p>
            {!showPastGames && (
              <Button 
                onClick={startCreateLineup}
                size="lg"
                className="w-full sm:w-auto"
              >
                Schedule First Game
              </Button>
            )}
          </Card>
        ) : (
          filteredGames.map((game) => {
            const rsvpCounts = (Object.values(game.rsvps) as string[]).reduce((acc, status) => {
              acc[status] = (acc[status] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);

            const gameDateObj = game.date?.toDate ? game.date.toDate() : new Date(game.date);

            return (
              <Card 
                key={game.id}
                onClick={() => handleViewGame(game.id)}
                className="p-4 sm:p-6 group cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
                  <div className="flex items-center sm:items-start gap-4 sm:gap-5">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex flex-col items-center justify-center shadow-md shrink-0 transition-colors ${
                      showPastGames 
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500' 
                        : 'bg-slate-900 dark:bg-emerald-600 text-white'
                    }`}>
                      <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-tighter opacity-70">
                        {gameDateObj.toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-lg sm:text-xl font-bold leading-none">
                        {gameDateObj.getDate()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate group-hover:text-slate-900 dark:group-hover:text-emerald-400 transition-colors">{game.name}</h3>
                        {game.mode === 'scrimmage' && (
                          <Badge variant="info">Scrimmage</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                        <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                          {gameDateObj.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric' })}
                        </span>
                        <span className="hidden sm:block w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
                        <div className="flex items-center gap-2">
                          {game.isLocked ? (
                            <Badge variant="success" className="font-black uppercase tracking-widest">
                              Published
                            </Badge>
                          ) : (
                            <Badge variant="default" className="font-black uppercase tracking-widest">
                              Draft
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t border-slate-100 dark:border-slate-800 sm:border-0">
                    <div className="flex gap-1.5">
                      <div className="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-[10px] font-bold border border-emerald-100 dark:border-emerald-900/30">
                        {rsvpCounts[RSVPStatus.YES] || 0} Yes
                      </div>
                      <div className="px-2 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-lg text-[10px] font-bold border border-amber-100 dark:border-amber-900/30">
                        {rsvpCounts[RSVPStatus.TENTATIVE] || 0} ?
                      </div>
                      <div className="px-2 py-1 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 rounded-lg text-[10px] font-bold border border-rose-100 dark:border-rose-900/30">
                        {rsvpCounts[RSVPStatus.NO] || 0} No
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (game.isLocked) {
                            toast.error("Published games can't be deleted. Unpublish the game to delete.");
                            return;
                          }
                          setDeleteConfirmation({
                            isOpen: true,
                            type: 'game',
                            id: game.id,
                            title: 'Delete Game',
                            message: `Are you sure you want to delete "${game.name}"? This action cannot be undone.`
                          });
                        }}
                        icon={Trash2}
                        className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                        title="Delete Game"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
