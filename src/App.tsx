import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { doc, getDocFromServer } from 'firebase/firestore';
import { Toaster } from 'sonner';
import { Trophy, LogIn } from 'lucide-react';

import { db } from './firebase';
import { firebaseService } from './services/firebaseService';
import { useAuth } from './hooks/useAuth';
import { usePlayers } from './hooks/usePlayers';
import { useGames } from './hooks/useGames';
import { useSettings } from './hooks/useSettings';
import { useSeasons } from './hooks/useSeasons';
import { useDrills } from './hooks/useDrills';
import { RosterTab } from './components/RosterTab';
import { SettingsTab } from './components/SettingsTab';
import { GamesTab } from './components/GamesTab';
import { CreateGameView } from './components/CreateGameView';
import { GameDetailView } from './components/GameDetail/GameDetailView';
import { PrintGameView } from './components/PrintGameView';
import { SharedView } from './components/SharedView';
import { Navigation } from './components/Navigation';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { ConfirmationModal } from './components/ui/ConfirmationModal';
import { Button } from './components/ui/Button';
import { DrillLibraryView } from './components/DrillLibraryView';
import { DrillDetailView } from './components/DrillDetailView';
import { CreateDrillView } from './components/CreateDrillView';
import { GuidesTab } from './components/Guides/GuidesTab';
import { PublicGuidesView } from './components/Guides/PublicGuidesView';
import { PrintGuideWrapper } from './components/Guides/PrintGuideWrapper';
import { ToolsMainView } from './components/Tools/ToolsMainView';

// --- Connection Test ---
async function testConnection() {
  try {
    await getDocFromServer(doc(db, '_connection_test_', 'ping'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is offline.");
    }
  }
}
testConnection();

function BaseballApp({ darkMode, setDarkMode }: { darkMode: boolean; setDarkMode: (val: boolean) => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthReady, loading, login, logout } = useAuth();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showPastGames, setShowPastGames] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showClearLineupConfirm, setShowClearLineupConfirm] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, type: 'player' as 'player'|'game', id: '', title: '', message: '' });

  const pathParts = location.pathname.split('/');
  const isPrintMode = location.pathname.startsWith('/print/');
  const selectedGameId = ((pathParts[1] === 'games' && pathParts[2] && pathParts[2] !== 'new') ? pathParts[2] : (isPrintMode && pathParts[2] ? pathParts[2] : null));
  const currentTab = pathParts[1] || 'games';

  const { settings } = useSettings(user, isAuthReady);
  const activeSeasonId = settings?.activeSeasonId || 'legacy';
  const { seasons } = useSeasons(user, isAuthReady);

  const { players } = usePlayers(user, isAuthReady, activeSeasonId);
  const { games, selectedGame, setGames } = useGames(user, isAuthReady, selectedGameId, activeSeasonId);
  const { drills, addDrill, updateDrill, deleteDrill } = useDrills(user);
  
  const isAdmin = user?.email?.toLowerCase() === 'tylercarringtonwa@gmail.com';

  const handleLogout = async () => {
    await logout();
    navigate('/games');
  };

  const handleCopyLink = (link: string) => { navigator.clipboard.writeText(link); setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2000); };

  
  const confirmDelete = async () => {
    if (deleteConfirmation.type === 'player') await firebaseService.deletePlayer(deleteConfirmation.id);
    else { await firebaseService.deleteGame(deleteConfirmation.id); if (selectedGameId === deleteConfirmation.id) navigate('/games'); }
    setDeleteConfirmation(prev => ({ ...prev, isOpen: false }));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950"><div className="text-slate-900 dark:text-emerald-500"><Trophy size={48} /></div></div>;

  if (location.pathname.startsWith('/shared/guides/')) {
    return <PublicGuidesView />;
  }

  if (location.pathname.startsWith('/shared/')) return <SharedView darkMode={darkMode} setDarkMode={setDarkMode} />;

  if (isPrintMode) {
    const isGuidePrint = location.pathname.includes('/guides/') || location.pathname.includes('/article/') || location.pathname.includes('/section/');
    if (isGuidePrint) {
      const activeSeasonForPrint = seasons.find(s => s.id === activeSeasonId) || null;
      return <PrintGuideWrapper user={user} activeSeasonId={activeSeasonId} activeSeason={activeSeasonForPrint} drills={drills} />;
    }
    if (!selectedGame || loading) return <div className="text-center py-12">Loading game for print...</div>;
    return <PrintGameView game={selectedGame} players={players} games={games} user={user} isAuthReady={isAuthReady} setGames={setGames} />;
  }

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8 text-center border border-slate-200 dark:border-slate-800">
        <div className="w-16 h-16 bg-slate-900 dark:bg-emerald-500 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg shadow-emerald-500/20"><Trophy size={32} /></div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Lineup+</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">Professional baseball management simplified.</p>
        <Button onClick={login} size="lg" className="w-full h-14 rounded-2xl text-lg font-bold"><LogIn className="mr-2" size={20} /> Sign in with Google</Button>
      </div>
    </div>
  );

  const activeSeason = seasons.find(s => s.id === activeSeasonId) || null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Navigation user={user} currentTab={currentTab} isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} handleTabChange={(t) => { navigate(`/${t}`); setIsMobileMenuOpen(false); }} handleLogout={handleLogout} seasons={seasons} activeSeasonId={activeSeasonId} onSeasonChange={(id) => firebaseService.updateSettings(user.uid, { activeSeasonId: id })} />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Navigate to="/games" replace />} />
          <Route path="/games" element={<GamesTab games={games} players={players} user={user} settings={settings} showPastGames={showPastGames} setShowPastGames={setShowPastGames} handleCopyLink={handleCopyLink} handleTabChange={(t) => navigate(`/${t}`)} copySuccess={copySuccess} startCreateLineup={() => navigate('/games/new')} handleViewGame={(id) => navigate(`/games/${id}`)} setDeleteConfirmation={setDeleteConfirmation} />} />
          <Route path="/games/new" element={<CreateGameView players={players} user={user} activeSeasonId={activeSeasonId} />} />
          <Route path="/games/:id" element={selectedGame ? <GameDetailView game={selectedGame} players={players} games={games} user={user} isAuthReady={isAuthReady} darkMode={darkMode} setShowClearLineupConfirm={setShowClearLineupConfirm} onBack={() => navigate('/games')} setGames={setGames} /> : <div className="text-center py-12 text-slate-500">Loading game...</div>} />
          <Route path="/roster" element={<RosterTab players={players} user={user} startCreateLineup={() => navigate('/games/new')} setDeleteConfirmation={setDeleteConfirmation} activeSeasonId={activeSeasonId} />} />
          <Route path="/settings" element={<SettingsTab settings={settings} handleUpdateSettings={(u) => firebaseService.updateSettings(user.uid, u)} darkMode={darkMode} setDarkMode={setDarkMode} user={user} handleCopyLink={handleCopyLink} copySuccess={copySuccess} seasons={seasons} activeSeasonId={activeSeasonId} players={players} />} />
          <Route path="/drills" element={<DrillLibraryView drills={drills} isAdmin={isAdmin} onDeleteDrill={deleteDrill} darkMode={darkMode} />} />
          <Route path="/drills/new" element={<CreateDrillView onAddDrill={addDrill} darkMode={darkMode} />} />
          <Route path="/drills/:id" element={<DrillDetailView drills={drills} isAdmin={isAdmin} onUpdateDrill={updateDrill} onDeleteDrill={deleteDrill} darkMode={darkMode} />} />
          <Route path="/tools/*" element={<ToolsMainView user={user} players={players} darkMode={darkMode} />} />
          <Route path="/guides/*" element={<GuidesTab user={user} activeSeason={activeSeason} seasons={seasons} drills={drills} isAdmin={isAdmin} darkMode={darkMode} />} />
        </Routes>
      </main>
      <ConfirmationModal isOpen={deleteConfirmation.isOpen} title={deleteConfirmation.title} message={deleteConfirmation.message} onConfirm={confirmDelete} onClose={() => setDeleteConfirmation(prev => ({ ...prev, isOpen: false }))} variant="danger" />
      <ConfirmationModal isOpen={showClearLineupConfirm} title="Clear Lineup" message="Are you sure you want to clear the entire fielding lineup for all innings?" onConfirm={() => selectedGameId && firebaseService.updateGame(selectedGameId, { lineup: {}, lockedInnings: [], lockedPositions: [] }).then(() => setShowClearLineupConfirm(false))} onClose={() => setShowClearLineupConfirm(false)} variant="danger" />
    </div>
  );
}

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      return saved !== null ? JSON.parse(saved) : window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  return (
    <ErrorBoundary>
      <HashRouter>
        <div className={darkMode && !window.location.hash.startsWith('#/print/') ? 'dark' : ''}>
          <BaseballApp darkMode={darkMode} setDarkMode={setDarkMode} />
          <Toaster richColors closeButton position="top-right" />
        </div>
      </HashRouter>
    </ErrorBoundary>
  );
}
