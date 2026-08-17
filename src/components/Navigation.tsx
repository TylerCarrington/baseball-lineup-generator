import React, { useState } from 'react';
import { Trophy, User as UserIcon, Menu, LogOut, ChevronDown } from 'lucide-react';
import { User } from 'firebase/auth';
import { Season } from '../types';

interface NavigationProps {
  user: User;
  currentTab: string;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  handleTabChange: (tab: 'roster' | 'games' | 'settings' | 'drills' | 'guides') => void;
  handleLogout: () => void;
  seasons: Season[];
  activeSeasonId: string;
  onSeasonChange: (id: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  user,
  currentTab,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  handleTabChange,
  handleLogout,
  seasons,
  activeSeasonId,
  onSeasonChange
}) => {
  const [showSeasonDropdown, setShowSeasonDropdown] = useState(false);

  const allSeasons = [{ id: 'legacy', name: 'Legacy Season' }, ...seasons];
  const activeSeasonName = allSeasons.find(s => s.id === activeSeasonId)?.name || 'Legacy Season';
  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 transition-all duration-300 print:hidden">
      <div className="max-w-5xl mx-auto px-4 h-16 sm:h-20 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div 
            onClick={() => handleTabChange('games')}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group"
          >
            <div className="p-1.5 w-8 h-8 sm:w-10 sm:h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-600/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
              <Trophy size={18} />
            </div>
            <span className="font-black text-lg sm:text-xl tracking-tighter text-slate-900 dark:text-white uppercase transition-colors hidden sm:block">Lineup+</span>
          </div>

          <div className="relative">
            <button 
              onClick={() => setShowSeasonDropdown(!showSeasonDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              <span className="max-w-[120px] truncate">{activeSeasonName}</span>
              <ChevronDown size={14} className={`transition-transform ${showSeasonDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showSeasonDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowSeasonDropdown(false)} />
                <div className="absolute top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50">
                  <div className="max-h-64 overflow-y-auto">
                    {allSeasons.map(s => (
                      <button
                        key={s.id}
                        onClick={() => {
                          onSeasonChange(s.id);
                          setShowSeasonDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${activeSeasonId === s.id ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-700 p-2">
                    <button
                      onClick={() => {
                        handleTabChange('settings');
                        setShowSeasonDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      Manage Seasons...
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <nav className="hidden md:flex items-center gap-1">
            <button 
              onClick={() => handleTabChange('roster')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${currentTab === 'roster' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Roster
            </button>
            <button 
              onClick={() => handleTabChange('games')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${currentTab === 'games' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Events
            </button>
            <button 
              onClick={() => handleTabChange('drills')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${currentTab === 'drills' || currentTab === 'tools' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Drills
            </button>
            <button 
              onClick={() => handleTabChange('guides')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${currentTab === 'guides' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Guides
            </button>
            <button 
              onClick={() => handleTabChange('settings')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${currentTab === 'settings' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Settings
            </button>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <UserIcon size={16} />
            <span>{user.displayName}</span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Menu"
          >
            <Menu size={20} />
          </button>
          <button 
            onClick={handleLogout}
            className="hidden md:flex p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 print:hidden">
          <div className="p-4 flex flex-col gap-2">
            <button 
              onClick={() => handleTabChange('roster')}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${currentTab === 'roster' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Roster
            </button>
            <button 
              onClick={() => handleTabChange('games')}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${currentTab === 'games' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Events
            </button>
            <button 
              onClick={() => handleTabChange('drills')}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${currentTab === 'drills' || currentTab === 'tools' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Drills
            </button>
            <button 
              onClick={() => handleTabChange('guides')}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${currentTab === 'guides' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Guides
            </button>
            <button 
              onClick={() => handleTabChange('settings')}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${currentTab === 'settings' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Settings
            </button>
            <div className="sm:hidden border-t border-slate-100 dark:border-slate-800 mt-2 pt-2 px-4 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <UserIcon size={16} />
              <span>{user.displayName}</span>
            </div>
            <div className="border-t border-slate-100 dark:border-slate-800 mt-2 pt-2">
              <button 
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors flex items-center gap-2"
              >
                <LogOut size={18} />
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
