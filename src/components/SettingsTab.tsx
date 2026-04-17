import React from 'react';
import { Sun, Moon, Check, Copy, ExternalLink } from 'lucide-react';
import { User } from 'firebase/auth';
import { TeamSettings } from '../types';

interface SettingsTabProps {
  settings: TeamSettings | null;
  handleUpdateSettings: (updates: Partial<TeamSettings>) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  user: User | null;
  handleCopyLink: (link: string) => void;
  copySuccess: boolean;
}

export function SettingsTab({
  settings,
  handleUpdateSettings,
  darkMode,
  setDarkMode,
  user,
  handleCopyLink,
  copySuccess
}: SettingsTabProps) {
  const publicLink = `${window.location.origin}${window.location.pathname}#/shared/${user?.uid}/games`;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Team Settings</h2>
        
        <div className="space-y-6">
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
    </div>
  );
}
