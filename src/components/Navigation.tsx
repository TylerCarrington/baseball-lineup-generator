import React from 'react';
import { Trophy, User as UserIcon, Menu, LogOut } from 'lucide-react';
import { User } from 'firebase/auth';

interface NavigationProps {
  user: User;
  currentTab: string;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  handleTabChange: (tab: 'roster' | 'games' | 'settings') => void;
  handleLogout: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  user,
  currentTab,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  handleTabChange,
  handleLogout
}) => {
  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 transition-all duration-300">
      <div className="max-w-5xl mx-auto px-4 h-16 sm:h-20 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div 
            onClick={() => handleTabChange('games')}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group"
          >
            <div className="p-1.5 w-8 h-8 sm:w-10 sm:h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-600/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
              <Trophy size={18} />
            </div>
            <span className="font-black text-lg sm:text-xl tracking-tighter text-slate-900 dark:text-white uppercase transition-colors">Lineup+</span>
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
        <div className="md:hidden border-t border-slate-100 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
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
