import React from 'react';
import { Routes, Route, Link, useParams, useLocation, Navigate } from 'react-router-dom';
import { Calendar, Dumbbell, BookOpen, PenTool, Sun, Moon, Trophy } from 'lucide-react';
import { SharedView } from './SharedView';
import { PublicDrillsView } from './PublicDrillsView';
import { PublicGuidesView } from './Guides/PublicGuidesView';
import { PublicToolsView } from './PublicToolsView';

interface PublicPortalLayoutProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export const PublicPortalLayout: React.FC<PublicPortalLayoutProps> = ({ darkMode, setDarkMode }) => {
  const location = useLocation();
  // We can extract UID from the path since it mounts at /shared/:uid
  const pathParts = location.pathname.split('/');
  const uid = pathParts[2];

  const tabs = [
    { id: 'schedule', label: 'Schedule', icon: Calendar, path: `/shared/${uid}/schedule` },
    { id: 'drills', label: 'Drills', icon: Dumbbell, path: `/shared/${uid}/drills` },
    { id: 'guides', label: 'Guides', icon: BookOpen, path: `/shared/${uid}/guides` },
    { id: 'tools', label: 'Tools', icon: PenTool, path: `/shared/${uid}/tools` },
  ];

  const currentTab = pathParts[3] || 'schedule';

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300 ${darkMode ? 'dark' : ''}`}>
      {/* Header - Hidden in Print */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 print:hidden">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-900 dark:bg-emerald-500 rounded-lg flex items-center justify-center text-white shadow-lg">
              <Trophy size={18} />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">Team Portal</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Lineup+ Shared View</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Desktop Navigation */}
            <nav className="hidden sm:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              {tabs.map(tab => (
                <Link
                  key={tab.id}
                  to={tab.path}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    currentTab === tab.id
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </Link>
              ))}
            </nav>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 transition-colors"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 py-8 pb-24 sm:pb-8">
        <Routes>
          <Route path="/shared/:uid" element={<Navigate to={`schedule`} replace />} />
          <Route path="/shared/:uid/schedule/*" element={<SharedView darkMode={darkMode} setDarkMode={setDarkMode} />} />
          <Route path="/shared/:uid/drills/*" element={<PublicDrillsView />} />
          <Route path="/shared/:uid/guides/*" element={<PublicGuidesView />} />
          <Route path="/shared/:uid/tools/*" element={<PublicToolsView />} />
        </Routes>
      </main>

      {/* Mobile Navigation - Hidden in Print */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pb-safe z-50 print:hidden">
        <div className="flex justify-around items-center h-16">
          {tabs.map(tab => (
            <Link
              key={tab.id}
              to={tab.path}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                currentTab === tab.id
                  ? 'text-emerald-600 dark:text-emerald-500'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <tab.icon size={20} />
              <span className="text-[10px] font-semibold">{tab.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
};
