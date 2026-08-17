import React, { useState } from 'react';
import { Sun, Moon, Check, Copy, ExternalLink, Plus, Trash2 } from 'lucide-react';
import { User } from 'firebase/auth';
import { TeamSettings, Season, Player } from '../types';
import { firebaseService } from '../services/firebaseService';
import { ConfirmationModal } from './ui/ConfirmationModal';

interface SettingsTabProps {
  settings: TeamSettings | null;
  handleUpdateSettings: (updates: Partial<TeamSettings>) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  user: User | null;
  handleCopyLink: (link: string) => void;
  copySuccess: boolean;
  seasons: Season[];
  activeSeasonId: string;
  players: Player[];
}

export function SettingsTab({
  settings,
  handleUpdateSettings,
  darkMode,
  setDarkMode,
  user,
  handleCopyLink,
  copySuccess,
  seasons,
  activeSeasonId,
  players
}: SettingsTabProps) {
  const publicLink = `${window.location.origin}${window.location.pathname}#/shared/${user?.uid}/games`;
  
  const [isCreatingSeason, setIsCreatingSeason] = useState(false);
  const [newSeasonName, setNewSeasonName] = useState('');
  const [copyPlayers, setCopyPlayers] = useState(true);
  const [seasonToDelete, setSeasonToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingSeason, setIsDeletingSeason] = useState(false);

  const handleCreateSeason = async () => {
    if (!newSeasonName.trim() || !user) return;
    
    const seasonRef = await firebaseService.addSeason({
      name: newSeasonName.trim(),
      uid: user.uid,
      createdAt: new Date()
    });

    if (seasonRef && copyPlayers) {
      // Copy current players into the new season
      for (const player of players) {
        await firebaseService.addPlayer({
          name: player.name,
          positions: player.positions,
          jerseyNumber: player.jerseyNumber || null,
          battingOrder: player.battingOrder || null,
          uid: user.uid,
          seasonId: seasonRef.id,
          createdAt: new Date()
        });
      }
    }

    if (seasonRef) {
      handleUpdateSettings({ activeSeasonId: seasonRef.id });
      setIsCreatingSeason(false);
      setNewSeasonName('');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Team Settings</h2>
        
        <div className="space-y-6">
          <div className="flex flex-col p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 gap-4 transition-colors duration-300">
            <div className="flex items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 dark:text-slate-100">Seasons & Teams</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Manage your historical data by creating distinct seasons.</p>
              </div>
            </div>
            
            <div className="space-y-2 mt-2">
              {[{ id: 'legacy', name: 'Legacy Season' }, ...seasons].map((season) => (
                <div key={season.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="font-medium text-slate-700 dark:text-slate-200">{season.name}</span>
                  <div className="flex items-center gap-2">
                    {activeSeasonId === season.id ? (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded">Active</span>
                    ) : (
                      <button
                        onClick={() => handleUpdateSettings({ activeSeasonId: season.id })}
                        className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white px-2 py-1"
                      >
                        Set Active
                      </button>
                    )}
                    {season.id !== 'legacy' && (
                      <button
                        onClick={() => setSeasonToDelete(season)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                        title="Delete Season"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {isCreatingSeason ? (
              <div className="mt-4 p-4 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-4">
                <h4 className="font-bold text-slate-800 dark:text-slate-200">Create New Season</h4>
                <input
                  type="text"
                  value={newSeasonName}
                  onChange={(e) => setNewSeasonName(e.target.value)}
                  placeholder="e.g. Fall 2026"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={copyPlayers}
                    onChange={(e) => setCopyPlayers(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  Copy current roster into this new season
                </label>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setIsCreatingSeason(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition-colors">Cancel</button>
                  <button onClick={handleCreateSeason} disabled={!newSeasonName.trim()} className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-colors">Create Season</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsCreatingSeason(true)}
                className="mt-2 w-full py-3 flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-600 dark:hover:border-emerald-500 dark:hover:text-emerald-400 text-slate-500 dark:text-slate-400 rounded-xl transition-colors font-medium text-sm"
              >
                <Plus size={16} />
                Create New Season
              </button>
            )}
          </div>

          <div className="flex items-start sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 gap-4 transition-colors duration-300">
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Allow Designated Hitter</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Enable "Designated Hitter" as a position option for your lineup.</p>
            </div>
            <button 
              onClick={() => handleUpdateSettings({ allowDesignatedHitter: !settings?.allowDesignatedHitter })}
              className={`w-14 h-8 rounded-full transition-colors relative shrink-0 ${settings?.allowDesignatedHitter ? 'bg-slate-900 dark:bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}
            >
              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings?.allowDesignatedHitter ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div className="flex items-start sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 gap-4 transition-colors duration-300">
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Allow Outfield Twice in Row</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Allow assigning the same player to an outfield position in consecutive innings. By default, the app tries to avoid this.</p>
            </div>
            <button 
              onClick={() => handleUpdateSettings({ allowOutfieldTwiceInRow: !settings?.allowOutfieldTwiceInRow })}
              className={`w-14 h-8 rounded-full transition-colors relative shrink-0 ${settings?.allowOutfieldTwiceInRow ? 'bg-slate-900 dark:bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}
            >
              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings?.allowOutfieldTwiceInRow ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div className="flex flex-col p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 gap-4 transition-colors duration-300">
            <div className="flex items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 dark:text-slate-100">Dark Mode</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Switch the application to a dark color scheme.</p>
              </div>
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className={`w-14 h-8 rounded-full transition-colors relative shrink-0 flex items-center px-1 ${darkMode ? 'bg-emerald-500' : 'bg-slate-200'}`}
                title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                <div className={`w-6 h-6 bg-white rounded-full transition-all flex items-center justify-center shadow-sm ${darkMode ? 'translate-x-6' : 'translate-x-0'}`}>
                  {darkMode ? <Sun size={14} className="text-emerald-500" /> : <Moon size={14} className="text-slate-400" />}
                </div>
              </button>
            </div>
          </div>

          <div className="flex flex-col p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 gap-4 transition-colors duration-300">
            <div className="flex items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 dark:text-slate-100">Public Schedule Sharing</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Allow others to view your game schedule and lineups without logging in.</p>
              </div>
              <button 
                onClick={() => handleUpdateSettings({ publicSchedule: !settings?.publicSchedule })}
                className={`w-14 h-8 rounded-full transition-colors relative shrink-0 ${settings?.publicSchedule ? 'bg-slate-900 dark:bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings?.publicSchedule ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
            
            {settings?.publicSchedule && (
              <div className="mt-2 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-3 transition-colors duration-300">
                <div className="flex-1 min-w-0 w-full">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Your Public Link</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 truncate font-mono bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                    {publicLink}
                  </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button 
                    onClick={() => handleCopyLink(publicLink)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-xs font-bold"
                  >
                    {copySuccess ? <Check size={14} /> : <Copy size={14} />}
                    {copySuccess ? 'Copied!' : 'Copy'}
                  </button>
                  <a 
                    href={publicLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-white transition-all text-xs font-bold shadow-sm"
                  >
                    <ExternalLink size={14} />
                    Open
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!seasonToDelete}
        title="Delete Season"
        message={`Are you sure you want to delete "${seasonToDelete?.name}"? This action cannot be undone. You will also need to delete any remaining players and games manually or they will be orphaned.`}
        confirmText={isDeletingSeason ? "Deleting..." : "Delete Season"}
        variant="danger"
        onClose={() => !isDeletingSeason && setSeasonToDelete(null)}
        onConfirm={async () => {
          if (!seasonToDelete) return;
          try {
            setIsDeletingSeason(true);
            await firebaseService.deleteSeason(seasonToDelete.id);
            if (activeSeasonId === seasonToDelete.id) {
              handleUpdateSettings({ activeSeasonId: 'legacy' });
            }
            setSeasonToDelete(null);
          } catch (error) {
            console.error('Failed to delete season:', error);
          } finally {
            setIsDeletingSeason(false);
          }
        }}
      />
    </div>
  );
}
