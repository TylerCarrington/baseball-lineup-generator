import React, { useState, useEffect, Component, ReactNode } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation, useParams, Navigate } from 'react-router-dom';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  setDoc,
  deleteDoc, 
  doc, 
  updateDoc, 
  serverTimestamp,
  orderBy,
  getDocFromServer
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User,
  signOut
} from 'firebase/auth';
import { db, auth } from './firebase';

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

import { Plus, Trash2, Edit2, LogIn, LogOut, User as UserIcon, Trophy, Save, X, ClipboardList, Check, AlertCircle, RotateCcw, LayoutGrid, RefreshCw, Lock, Unlock, ChevronLeft, ChevronRight, Menu, Calendar, History, Share2, ExternalLink, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface Player {
  id: string;
  name: string;
  positions: string[];
  battingOrder?: number;
  uid: string;
  createdAt: any;
}

interface TeamSettings {
  id?: string;
  allowDesignatedHitter: boolean;
  allowOutfieldTwiceInRow: boolean;
  publicSchedule?: boolean;
  uid: string;
}

interface Game {
  id: string;
  name: string;
  date: any;
  rsvps: Record<string, RSVPStatus>;
  battingOrder?: string[];
  lineup?: Record<string, Record<string, string>>; // Inning -> Position -> PlayerId
  isLocked?: boolean;
  lockedInnings?: number[];
  lockedPositions?: string[];
  uid: string;
  createdAt: any;
}

enum RSVPStatus {
  YES = 'Yes',
  NO = 'No',
  TENTATIVE = 'Tentative'
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

// --- Error Handling ---
function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email || undefined,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Error Boundary ---
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false, error: null };
  public props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      let message = "Something went wrong.";
      try {
        const parsed = JSON.parse(this.state.error.message);
        if (parsed.error) message = `Error: ${parsed.error}`;
      } catch (e) {
        message = this.state.error.message || message;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-red-100">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <X size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Application Error</h2>
            <p className="text-slate-600 mb-6">{message}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Helper Functions ---

const POSITION_ORDER: Record<string, number> = {
  "Pitcher": 1,
  "Starting Pitcher": 1,
  "Relief Pitcher": 1,
  "Catcher": 2,
  "First Base": 3,
  "Second Base": 4,
  "Third Base": 5,
  "Shortstop": 6,
  "Left Field": 7,
  "Center Field": 8,
  "Right Field": 9,
  "Designated Hitter": 10
};

const getPositionAbbreviation = (pos: string) => {
  const mapping: Record<string, string> = {
    "Starting Pitcher": "SP",
    "Relief Pitcher": "RP",
    "Pitcher": "P",
    "Catcher": "C",
    "First Base": "1B",
    "Second Base": "2B",
    "Third Base": "3B",
    "Shortstop": "SS",
    "Left Field": "LF",
    "Center Field": "CF",
    "Right Field": "RF",
    "Designated Hitter": "DH"
  };
  return mapping[pos] || pos;
};

// --- Shared View Component ---

function SharedView() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Manually parse params since SharedView is rendered directly by BaseballApp
  const pathParts = location.pathname.split('/');
  const ownerId = pathParts[2];
  const gameId = pathParts[4];
  
  const [games, setGames] = useState<Game[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [settings, setSettings] = useState<TeamSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'batting' | 'fielding'>('batting');

  useEffect(() => {
    console.log("SharedView mounted, ownerId:", ownerId);
    if (!ownerId) {
      setError("Invalid share link.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // 1. Fetch Settings to check if publicSchedule is enabled
    const settingsRef = doc(db, 'settings', ownerId);
    const unsubSettings = onSnapshot(settingsRef, (snapshot) => {
      console.log("Settings snapshot received, exists:", snapshot.exists());
      if (snapshot.exists()) {
        const data = snapshot.data() as TeamSettings;
        console.log("Settings data:", data);
        if (data.publicSchedule) {
          setSettings({ id: snapshot.id, ...data });
        } else {
          setError("This schedule is not public.");
          setLoading(false);
        }
      } else {
        setError("Schedule not found.");
        setLoading(false);
      }
    }, (err) => {
      console.error("Error fetching settings:", err);
      setError("Unable to load schedule. Please check the link.");
      setLoading(false);
    });

    return () => unsubSettings();
  }, [ownerId]);

  useEffect(() => {
    if (!settings || !ownerId) return;

    console.log("Fetching games for owner:", ownerId);
    // 2. Fetch Games
    const gamesQuery = query(
      collection(db, 'games'),
      where('uid', '==', ownerId),
      orderBy('date', 'desc')
    );
    const unsubGames = onSnapshot(gamesQuery, (snapshot) => {
      console.log("Games snapshot received, count:", snapshot.size);
      const gamesData: Game[] = [];
      snapshot.forEach((doc) => {
        gamesData.push({ id: doc.id, ...doc.data() } as Game);
      });
      setGames(gamesData);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching games:", err);
      setLoading(false);
    });

    // 3. Fetch Players (for names in lineups)
    const playersQuery = query(
      collection(db, 'players'),
      where('uid', '==', ownerId)
    );
    const unsubPlayers = onSnapshot(playersQuery, (snapshot) => {
      const playersData: Player[] = [];
      snapshot.forEach((doc) => {
        playersData.push({ id: doc.id, ...doc.data() } as Player);
      });
      setPlayers(playersData);
    });

    return () => {
      unsubGames();
      unsubPlayers();
    };
  }, [settings, ownerId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium">Loading schedule...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Restricted</h2>
          <p className="text-slate-500 mb-8">{error}</p>
          <button 
            onClick={() => navigate('/')}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  const selectedGame = gameId ? games.find(g => g.id === gameId) : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            <Trophy className="text-slate-900" size={24} />
            <span>Lineup+</span>
          </div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Shared View
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {gameId && selectedGame ? (
            !selectedGame.isLocked ? (
              <motion.div
                key="game-not-published"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-xl mx-auto"
              >
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-100">
                    <Lock size={32} className="text-slate-300" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Lineup Not Published</h3>
                  <p className="text-slate-500 mb-8 max-w-xs mx-auto">
                    The lineup for this game is still being finalized. Please check back later.
                  </p>
                  <button 
                    onClick={() => navigate(`/shared/${ownerId}/games`)}
                    className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
                  >
                    Back to Schedule
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="game-detail"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <button 
                  onClick={() => navigate(`/shared/${ownerId}/games`)}
                  className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm mb-6 transition-colors"
                >
                  <ChevronLeft size={18} />
                  Back to Schedule
                </button>

                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden mb-8">
                  <div className="p-6 sm:p-8 bg-slate-900 text-white">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-emerald-500 text-white rounded text-[10px] font-bold uppercase tracking-wider">
                            Published
                          </span>
                          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{selectedGame.name}</h2>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 mt-1">
                          <Calendar size={16} />
                          <span className="text-sm font-medium">
                            {(() => {
                              const date = selectedGame.date;
                              if (!date) return 'No Date';
                              const d = date.toDate ? date.toDate() : new Date(date);
                              return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                <div className="p-6 sm:p-8">
                  {/* Tabs */}
                  <div className="flex p-1 bg-slate-100 rounded-2xl mb-8">
                    <button
                      onClick={() => setActiveTab('batting')}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                        activeTab === 'batting'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <ClipboardList size={18} />
                      Batting Order
                    </button>
                    <button
                      onClick={() => setActiveTab('fielding')}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                        activeTab === 'fielding'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <LayoutGrid size={18} />
                      Fielding Lineup
                    </button>
                  </div>

                  <div>
                    {/* Batting Order */}
                    {activeTab === 'batting' && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                          <ClipboardList size={20} className="text-slate-400" />
                          Batting Order
                        </h3>
                        <div className="space-y-2">
                          {selectedGame.battingOrder && selectedGame.battingOrder.length > 0 ? (
                            selectedGame.battingOrder.map((playerId, index) => {
                              const player = players.find(p => p.id === playerId);
                              return (
                                <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                  <span className="w-6 h-6 bg-slate-900 text-white rounded-lg flex items-center justify-center text-[10px] font-black shrink-0">
                                    {index + 1}
                                  </span>
                                  <span className="font-bold text-slate-700">{player?.name || 'Unknown Player'}</span>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-sm text-slate-400 italic p-4 bg-slate-50 rounded-xl border border-slate-100 border-dashed text-center">
                              No batting order set yet.
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* Fielding Lineup */}
                    {activeTab === 'fielding' && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                          <LayoutGrid size={20} className="text-slate-400" />
                          Fielding Lineup
                        </h3>
                        <div className="space-y-4">
                          {selectedGame.lineup && Object.keys(selectedGame.lineup).length > 0 ? (
                            Object.entries(selectedGame.lineup).sort(([a], [b]) => Number(a) - Number(b)).map(([inningNum, inning]) => (
                              <div key={inningNum} className="bg-slate-50 rounded-2xl border border-slate-100 p-4">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Inning {inningNum}</h4>
                                <div className="grid grid-cols-2 gap-2">
                                  {Object.entries(inning)
                                    .sort(([posA], [posB]) => (POSITION_ORDER[posA] || 99) - (POSITION_ORDER[posB] || 99))
                                    .map(([pos, playerId]) => {
                                      const player = players.find(p => p.id === playerId);
                                      return (
                                        <div key={pos} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-100 shadow-sm">
                                          <span className="text-[10px] font-black text-slate-400 w-6 shrink-0">{getPositionAbbreviation(pos)}</span>
                                          <span className="text-xs font-bold text-slate-700 truncate">{player?.name || 'Bench'}</span>
                                        </div>
                                      );
                                    })}
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-slate-400 italic p-4 bg-slate-50 rounded-xl border border-slate-100 border-dashed text-center">
                              No fielding lineup set yet.
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )
        ) : (
            <motion.div
              key="schedule-list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="mb-8">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Game Schedule</h2>
                <p className="text-slate-500 mt-1">View upcoming games and lineups</p>
              </div>

              {games.length === 0 ? (
                <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center">
                  <Calendar size={48} className="text-slate-200 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-900">No games scheduled</h3>
                  <p className="text-slate-500">Check back later for updates.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {games.map((game) => {
                    const gameDate = game.date?.toDate ? game.date.toDate() : new Date(game.date);
                    const isPublished = game.isLocked || false;
                    
                    return (
                      <button
                        key={game.id}
                        onClick={() => {
                          if (isPublished) {
                            navigate(`/shared/${ownerId}/games/${game.id}`);
                          }
                        }}
                        className={`group bg-white p-6 rounded-3xl border border-slate-200 shadow-sm transition-all text-left relative overflow-hidden ${
                          isPublished 
                            ? 'hover:shadow-xl hover:border-slate-900 cursor-pointer' 
                            : 'opacity-70 cursor-default'
                        }`}
                      >
                        {!isPublished && (
                          <div className="absolute top-3 right-3 px-2 py-0.5 bg-slate-100 text-slate-400 rounded text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                            Draft
                          </div>
                        )}
                        {isPublished && (
                          <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ChevronRight size={20} className="text-slate-400" />
                          </div>
                        )}
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex flex-col items-center justify-center shrink-0 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                            <span className="text-[10px] font-black uppercase tracking-tighter opacity-50">
                              {gameDate.toLocaleDateString('en-US', { month: 'short' })}
                            </span>
                            <span className="text-lg font-black leading-none">
                              {gameDate.getDate()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-black text-xl text-slate-900 truncate group-hover:text-slate-900 transition-colors">{game.name}</h3>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                                <Calendar size={12} />
                                {gameDate.toLocaleDateString('en-US', { weekday: 'short' })}
                              </span>
                              <span className="w-1 h-1 bg-slate-200 rounded-full" />
                              <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                                <ClipboardList size={12} />
                                {game.battingOrder?.length || 0} Players
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// --- Main App Component ---

function BaseballApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [settings, setSettings] = useState<TeamSettings | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Lineup Creation State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCreatingLineup, setIsCreatingLineup] = useState(false);
  const [gameName, setGameName] = useState('');
  const [gameDate, setGameDate] = useState(new Date().toISOString().split('T')[0]);
  const [playerRSVPs, setPlayerRSVPs] = useState<Record<string, RSVPStatus>>({});
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  // Form state
  const [newName, setNewName] = useState('');
  const [newPositions, setNewPositions] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPositions, setEditPositions] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'roster' | 'games' | 'settings'>('roster');
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [isEditingRSVPs, setIsEditingRSVPs] = useState(false);
  const [showPastGames, setShowPastGames] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    type: 'player' | 'game';
    id: string;
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'player',
    id: '',
    title: '',
    message: ''
  });
  const [editGameName, setEditGameName] = useState('');
  const [editGameDate, setEditGameDate] = useState('');
  const [gameViewTab, setGameViewTab] = useState<'batting' | 'lineup'>('batting');
  const [games, setGames] = useState<Game[]>([]);

  // Sync state with URL
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/shared/')) {
      // Shared view handles its own state
      return;
    }
    if (path === '/') {
      navigate('/games', { replace: true });
    } else if (path === '/games') {
      setActiveTab('games');
      setSelectedGameId(null);
      setIsCreatingLineup(false);
    } else if (path.startsWith('/games/')) {
      setActiveTab('games');
      const gameId = path.split('/games/')[1];
      if (gameId === 'new') {
        setSelectedGameId(null);
        setIsCreatingLineup(true);
      } else {
        setSelectedGameId(gameId);
        setIsCreatingLineup(false);
      }
    } else if (path === '/roster') {
      setActiveTab('roster');
      setSelectedGameId(null);
    } else if (path === '/settings') {
      setActiveTab('settings');
      setSelectedGameId(null);
    }
  }, [location.pathname, navigate]);

  const handleTabChange = (tab: 'roster' | 'games' | 'settings') => {
    navigate(`/${tab}`);
    setIsMobileMenuOpen(false);
  };

  const POSITIONS = [
    "Starting Pitcher",
    "Relief Pitcher",
    "Catcher",
    "First Base",
    "Second Base",
    "Third Base",
    "Shortstop",
    "Left Field",
    "Center Field",
    "Right Field"
  ];

  const ALL_POSITIONS = [
    ...POSITIONS,
    ...(settings?.allowDesignatedHitter ? ["Designated Hitter"] : [])
  ];

  const togglePosition = (pos: string, isEdit: boolean) => {
    const update = (prev: string[]) => {
      let next = prev.includes(pos) ? prev.filter(p => p !== pos) : [...prev, pos];
      return next;
    };

    if (isEdit) {
      setEditPositions(prev => update(prev));
    } else {
      setNewPositions(prev => update(prev));
    }
  };

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Players Listener
  useEffect(() => {
    if (!isAuthReady || !user) {
      setPlayers([]);
      return;
    }

    const q = query(
      collection(db, 'players'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const playersData: Player[] = [];
      snapshot.forEach((doc) => {
        playersData.push({ id: doc.id, ...doc.data() } as Player);
      });
      setPlayers(playersData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'players');
    });

    return () => unsubscribe();
  }, [isAuthReady, user]);

  // Games Listener
  useEffect(() => {
    if (!isAuthReady || !user) {
      setGames([]);
      return;
    }

    const q = query(
      collection(db, 'games'),
      where('uid', '==', user.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const gamesData: Game[] = [];
      snapshot.forEach((doc) => {
        gamesData.push({ id: doc.id, ...doc.data() } as Game);
      });
      setGames(gamesData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'games');
    });

    return () => unsubscribe();
  }, [isAuthReady, user]);

  // Settings Listener
  useEffect(() => {
    if (!isAuthReady || !user) {
      setSettings(null);
      return;
    }

    const settingsDocRef = doc(db, 'settings', user.uid);

    const unsubscribe = onSnapshot(settingsDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        // Migration: Ensure all fields exist
        if (data.allowDesignatedHitter === undefined || data.allowOutfieldTwiceInRow === undefined) {
          updateDoc(settingsDocRef, {
            allowDesignatedHitter: data.allowDesignatedHitter ?? false,
            allowOutfieldTwiceInRow: data.allowOutfieldTwiceInRow ?? false,
            uid: user.uid
          });
        }
        setSettings({ id: snapshot.id, ...data } as TeamSettings);
      } else {
        // Create default settings if not exists
        const createDefault = async () => {
          try {
            await setDoc(settingsDocRef, {
              allowDesignatedHitter: false,
              allowOutfieldTwiceInRow: false,
              uid: user.uid
            });
          } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, `settings/${user.uid}`);
          }
        };
        createDefault();
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `settings/${user.uid}`);
    });

    return () => unsubscribe();
  }, [isAuthReady, user]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/games');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const startCreateLineup = () => {
    const initialRSVPs: Record<string, RSVPStatus> = {};
    players.forEach(p => {
      initialRSVPs[p.id] = RSVPStatus.YES;
    });
    setPlayerRSVPs(initialRSVPs);
    setGameName('');
    setGameDate(new Date().toISOString().split('T')[0]);
    navigate('/games/new');
  };

  const handleRSVPChange = (playerId: string, status: RSVPStatus) => {
    setPlayerRSVPs(prev => ({
      ...prev,
      [playerId]: status
    }));
  };

  const handleCreateGame = async () => {
    if (!user || !gameName.trim()) {
      alert("Please provide a game name.");
      return;
    }

    // Initial batting order: Yes first, then Tentative
    const yesPlayers = players.filter(p => playerRSVPs[p.id] === RSVPStatus.YES).map(p => p.id).sort(() => Math.random() - 0.5);
    const tentativePlayers = players.filter(p => playerRSVPs[p.id] === RSVPStatus.TENTATIVE).map(p => p.id).sort(() => Math.random() - 0.5);
    const initialBattingOrder = [...yesPlayers, ...tentativePlayers];

    try {
      await addDoc(collection(db, 'games'), {
        name: gameName.trim(),
        date: new Date(gameDate),
        rsvps: playerRSVPs,
        battingOrder: initialBattingOrder,
        uid: user.uid,
        createdAt: serverTimestamp()
      });
      navigate('/games');
      setGameName('');
      setGameDate(new Date().toISOString().split('T')[0]);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'games');
    }
  };

  const handleViewGame = async (gameId: string) => {
    const game = games.find(g => g.id === gameId);
    if (!game) return;

    // If no batting order, generate one following the logic
    if (!game.battingOrder || game.battingOrder.length === 0) {
      const yesPlayers = players.filter(p => game.rsvps[p.id] === RSVPStatus.YES).map(p => p.id).sort(() => Math.random() - 0.5);
      const tentativePlayers = players.filter(p => game.rsvps[p.id] === RSVPStatus.TENTATIVE).map(p => p.id).sort(() => Math.random() - 0.5);
      const shuffled = [...yesPlayers, ...tentativePlayers];

      try {
        await updateDoc(doc(db, 'games', gameId), {
          battingOrder: shuffled
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `games/${gameId}`);
      }
    }

    navigate(`/games/${gameId}`);
    setIsEditingRSVPs(false);
    setGameViewTab('batting');
  };

  const recalculateBattingOrder = (currentOrder: string[], rsvps: Record<string, RSVPStatus>, allPlayers: Player[]) => {
    const yesPlayers = currentOrder.filter(id => rsvps[id] === RSVPStatus.YES && allPlayers.some(p => p.id === id));
    const tentativePlayers = currentOrder.filter(id => rsvps[id] === RSVPStatus.TENTATIVE && allPlayers.some(p => p.id === id));
    
    const allPlayerIds = allPlayers.map(p => p.id);
    const missingYes = allPlayerIds.filter(id => rsvps[id] === RSVPStatus.YES && !yesPlayers.includes(id));
    const missingTentative = allPlayerIds.filter(id => rsvps[id] === RSVPStatus.TENTATIVE && !tentativePlayers.includes(id));
    
    return [...yesPlayers, ...missingYes, ...tentativePlayers, ...missingTentative];
  };

  const handleUpdateRSVP = async (gameId: string, playerId: string, newStatus: RSVPStatus) => {
    const game = games.find(g => g.id === gameId);
    if (!game) return;

    const newRSVPs = { ...game.rsvps, [playerId]: newStatus };
    const newBattingOrder = recalculateBattingOrder(game.battingOrder || [], newRSVPs, players);

    try {
      await updateDoc(doc(db, 'games', gameId), {
        rsvps: newRSVPs,
        battingOrder: newBattingOrder
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `games/${gameId}`);
    }
  };

  const handleUpdateGameDetails = async () => {
    if (!selectedGameId || !editGameName.trim()) return;
    try {
      const gameRef = doc(db, 'games', selectedGameId);
      await updateDoc(gameRef, {
        name: editGameName.trim(),
        date: new Date(editGameDate + 'T12:00:00')
      });
      setIsEditingRSVPs(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `games/${selectedGameId}`);
    }
  };

  const handleReshuffleLineup = async (gameId: string | null) => {
    if (!gameId) return;
    const game = games.find(g => g.id === gameId);
    if (!game) return;

    if (game.isLocked) {
      alert("This game is published. Please unpublish it to reshuffle the batting order.");
      return;
    }

    const yesPlayers = players.filter(p => game.rsvps[p.id] === RSVPStatus.YES).map(p => p.id).sort(() => Math.random() - 0.5);
    const tentativePlayers = players.filter(p => game.rsvps[p.id] === RSVPStatus.TENTATIVE).map(p => p.id).sort(() => Math.random() - 0.5);
    
    const newOrder = [...yesPlayers, ...tentativePlayers];

    try {
      await updateDoc(doc(db, 'games', gameId), {
        battingOrder: newOrder
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `games/${gameId}`);
    }
  };

  const handleGenerateLineup = async (gameId: string | null) => {
    if (!gameId) return;
    const game = games.find(g => g.id === gameId);
    if (!game) return;

    if (game.isLocked) {
      alert("This game is published. Please unpublish it to regenerate the lineup.");
      return;
    }

    const availablePlayers = players.filter(p => game.rsvps[p.id] !== RSVPStatus.NO);
    if (availablePlayers.length < 8) {
      alert("At least 8 players are required to generate a lineup.");
      return;
    }

    const fieldPositions = [
      "Pitcher", "Catcher", "First Base", "Second Base", "Third Base", 
      "Shortstop", "Left Field", "Center Field", "Right Field"
    ];

    const canPlay = (player: Player, pos: string) => {
      if (pos === "Pitcher") return player.positions.includes("Starting Pitcher") || player.positions.includes("Relief Pitcher");
      return player.positions.includes(pos);
    };

    // Calculate position rarity (how many available players can play each position)
    const rarity: Record<string, number> = {};
    fieldPositions.forEach(pos => {
      rarity[pos] = availablePlayers.filter(p => canPlay(p, pos)).length;
    });

    // Sort positions by rarity (least available players first)
    const sortedPositions = [...fieldPositions].sort((a, b) => rarity[a] - rarity[b]);

    const lineup: Record<string, Record<string, string>> = {};
    const lockedInnings = game.lockedInnings || [];
    const lockedPositions = game.lockedPositions || [];
    let lastBenched: Set<string> = new Set();
    const previousPitchers: Set<string> = new Set();
    const benchCounts: Record<string, number> = {};
    availablePlayers.forEach(p => benchCounts[p.id] = 0);

    for (let inning = 1; inning <= 6; inning++) {
      const inningKey = inning.toString();
      const isLocked = lockedInnings.includes(inning);
      const assignedThisInning: Set<string> = new Set();

      if (isLocked && game.lineup?.[inningKey]) {
        // Use existing data for locked inning
        lineup[inningKey] = { ...game.lineup[inningKey] };
        Object.values(lineup[inningKey]).forEach(playerId => {
          assignedThisInning.add(playerId);
        });
        
        // Update previousPitchers if needed
        if (lineup[inningKey]["Pitcher"]) {
          previousPitchers.add(lineup[inningKey]["Pitcher"]);
        }
      } else {
        // Generate new data for unlocked inning
        lineup[inningKey] = {};

        // Pre-assign ALL locked positions for this inning first
        fieldPositions.forEach(pos => {
          if (lockedPositions.includes(pos) && game.lineup?.[inningKey]?.[pos]) {
            const pId = game.lineup[inningKey][pos];
            lineup[inningKey][pos] = pId;
            assignedThisInning.add(pId);
            if (pos === "Pitcher") {
              previousPitchers.add(pId);
            }
          }
        });

        // Helper to pick candidate with highest bench count
        const pickBestCandidate = (candidates: Player[]) => {
          // Filter out players already assigned this inning (including locked positions)
          const filteredCandidates = candidates.filter(p => !assignedThisInning.has(p.id));
          if (filteredCandidates.length === 0) return null;
          const maxBench = Math.max(...filteredCandidates.map(p => benchCounts[p.id]));
          const topCandidates = filteredCandidates.filter(p => benchCounts[p.id] === maxBench);
          return topCandidates[Math.floor(Math.random() * topCandidates.length)];
        };

        // 1. Handle Pitcher (Special Rules)
        if (!lineup[inningKey]["Pitcher"]) {
          let pitcherId = "";
          if (inning === 1 || inning === 2) {
            // Starting Pitcher for 2 innings
            if (inning === 1) {
              const starters = availablePlayers.filter(p => p.positions.includes("Starting Pitcher"));
              const pool = starters.length > 0 ? starters : availablePlayers.filter(p => canPlay(p, "Pitcher"));
              pitcherId = pickBestCandidate(pool)?.id || pool.filter(p => !assignedThisInning.has(p.id))[0]?.id;
              if (pitcherId) previousPitchers.add(pitcherId);
            } else {
              // If inning 1 was locked, we should still try to match its pitcher if possible
              pitcherId = lineup["1"]?.["Pitcher"] || "";
              // Ensure the pitcher from inning 1 isn't locked in another position in inning 2
              if (pitcherId && assignedThisInning.has(pitcherId)) {
                pitcherId = "";
              }
              
              if (!pitcherId) {
                const starters = availablePlayers.filter(p => p.positions.includes("Starting Pitcher"));
                const pool = starters.length > 0 ? starters : availablePlayers.filter(p => canPlay(p, "Pitcher"));
                pitcherId = pickBestCandidate(pool)?.id || pool.filter(p => !assignedThisInning.has(p.id))[0]?.id;
              }
            }
          } else {
            // Relief Pitchers for 1 inning each
            const relievers = availablePlayers.filter(p => p.positions.includes("Relief Pitcher") && !previousPitchers.has(p.id));
            const pool = relievers.length > 0 ? relievers : availablePlayers.filter(p => canPlay(p, "Pitcher") && !previousPitchers.has(p.id));
            
            // Prioritize those benched last inning if possible
            const filteredPool = pool.filter(p => lastBenched.has(p.id));
            const finalPool = filteredPool.length > 0 ? filteredPool : pool;
            
            const selected = pickBestCandidate(finalPool);
            if (selected) {
              pitcherId = selected.id;
              previousPitchers.add(pitcherId);
            } else {
              // Absolute fallback if everyone has pitched (unlikely but safe)
              const fallbackPool = availablePlayers.filter(p => !assignedThisInning.has(p.id));
              pitcherId = fallbackPool[Math.floor(Math.random() * fallbackPool.length)]?.id;
            }
          }

          if (pitcherId) {
            lineup[inningKey]["Pitcher"] = pitcherId;
            assignedThisInning.add(pitcherId);
          }
        }

        // 2. Assign other positions based on rarity
        const remainingPositions = sortedPositions.filter(pos => pos !== "Pitcher");
        
        // Players available for other positions this inning
        let pool = availablePlayers.filter(p => !assignedThisInning.has(p.id));

        for (const pos of remainingPositions) {
          if (lineup[inningKey][pos]) continue; // Already assigned because it was locked

          // Find players who can play this position
          let candidates = pool.filter(p => canPlay(p, pos) && !assignedThisInning.has(p.id));
          
          // Apply Catcher constraints
          if (pos === "Catcher") {
            candidates = candidates.filter(p => {
              // 1. Max 4 innings in a game
              let totalCaught = 0;
              for (let i = 1; i < inning; i++) {
                if (lineup[i.toString()]["Catcher"] === p.id) totalCaught++;
              }
              if (totalCaught >= 4) return false;

              // 2. Max 2 innings in a row
              if (inning > 2) {
                const caughtLast = lineup[(inning - 1).toString()]["Catcher"] === p.id;
                const caughtTwoAgo = lineup[(inning - 2).toString()]["Catcher"] === p.id;
                if (caughtLast && caughtTwoAgo) return false;
              }

              // 3. Cannot catch if already pitched 2 innings in the game
              let totalPitched = 0;
              for (let i = 1; i < inning; i++) {
                if (lineup[i.toString()]["Pitcher"] === p.id) totalPitched++;
              }
              if (totalPitched >= 2) return false;

              // 4. Cannot catch then pitch then catch again
              let hasCaughtBefore = false;
              let hasPitchedAfterCatching = false;
              for (let i = 1; i < inning; i++) {
                if (lineup[i.toString()]["Catcher"] === p.id) {
                  hasCaughtBefore = true;
                } else if (hasCaughtBefore && lineup[i.toString()]["Pitcher"] === p.id) {
                  hasPitchedAfterCatching = true;
                }
              }
              if (hasCaughtBefore && hasPitchedAfterCatching) return false;
              
              return true;
            });
          }

          // Apply "Avoid Outfield Twice in Row" logic (default behavior)
          if (!settings?.allowOutfieldTwiceInRow && (pos === "Left Field" || pos === "Center Field" || pos === "Right Field")) {
            const outfieldPositions = ["Left Field", "Center Field", "Right Field"];
            const prevInningKey = (inning - 1).toString();
            const prevLineup = inning > 1 ? lineup[prevInningKey] : null;
            
            if (prevLineup) {
              // Avoid players who played outfield last inning
              const filteredNoRepeat = candidates.filter(p => {
                const playedOutfieldLastInning = outfieldPositions.some(op => prevLineup[op] === p.id);
                return !playedOutfieldLastInning;
              });
              
              if (filteredNoRepeat.length > 0) {
                candidates = filteredNoRepeat;
              }
            }
          }

          if (candidates.length === 0) {
            // Fallback: anyone who isn't assigned (to avoid empty spots if roster is tight/restricted)
            candidates = pool.filter(p => !assignedThisInning.has(p.id));
          }

          // Prioritize players who were benched last inning (MUST play)
          const mustPlay = candidates.filter(p => lastBenched.has(p.id));
          const finalCandidates = mustPlay.length > 0 ? mustPlay : candidates;
          
          const selected = pickBestCandidate(finalCandidates);
          if (selected) {
            lineup[inningKey][pos] = selected.id;
            assignedThisInning.add(selected.id);
          }
        }
      }

      // 3. Update lastBenched for next inning
      const currentBenched = new Set<string>();
      availablePlayers.forEach(p => {
        if (!assignedThisInning.has(p.id)) {
          currentBenched.add(p.id);
          benchCounts[p.id]++;
        }
      });
      lastBenched = currentBenched;
    }

    try {
      await updateDoc(doc(db, 'games', gameId), {
        lineup: lineup
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `games/${gameId}`);
    }
  };

  const handleTogglePositionLock = async (gameId: string, position: string) => {
    const game = games.find(g => g.id === gameId);
    if (!game) return;

    const currentLocked = game.lockedPositions || [];
    let newLocked: string[];
    if (currentLocked.includes(position)) {
      newLocked = currentLocked.filter(p => p !== position);
    } else {
      newLocked = [...currentLocked, position];
    }

    try {
      await updateDoc(doc(db, 'games', gameId), {
        lockedPositions: newLocked
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `games/${gameId}`);
    }
  };

  const handleToggleInningLock = async (gameId: string, inning: number) => {
    const game = games.find(g => g.id === gameId);
    if (!game) return;

    const currentLocked = game.lockedInnings || [];
    let newLocked: number[];
    if (currentLocked.includes(inning)) {
      newLocked = currentLocked.filter(i => i !== inning);
    } else {
      newLocked = [...currentLocked, inning];
    }

    try {
      await updateDoc(doc(db, 'games', gameId), {
        lockedInnings: newLocked
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `games/${gameId}`);
    }
  };

  const handleTogglePublish = async (gameId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'games', gameId), {
        isLocked: !currentStatus
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `games/${gameId}`);
    }
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newName.trim() || newPositions.length === 0) return;
    if (players.length >= 15) {
      alert("Maximum of 15 players reached.");
      return;
    }

    try {
      await addDoc(collection(db, 'players'), {
        name: newName.trim(),
        positions: newPositions,
        uid: user.uid,
        createdAt: serverTimestamp()
      });
      setNewName('');
      setNewPositions([]);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'players');
    }
  };

  const handleDeletePlayer = (player: Player) => {
    setDeleteConfirmation({
      isOpen: true,
      type: 'player',
      id: player.id,
      title: 'Delete Player',
      message: `Are you sure you want to delete ${player.name}? This will remove them from the roster and all future game lineups.`
    });
  };

  const confirmDelete = async () => {
    const { type, id } = deleteConfirmation;
    try {
      if (type === 'player') {
        await deleteDoc(doc(db, 'players', id));
      } else {
        await deleteDoc(doc(db, 'games', id));
        if (selectedGameId === id) navigate('/games');
      }
      setDeleteConfirmation(prev => ({ ...prev, isOpen: false }));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${type}s/${id}`);
    }
  };

  const startEdit = (player: Player) => {
    setEditingId(player.id);
    setEditName(player.name);
    setEditPositions(player.positions || []);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditPositions([]);
  };

  const handleUpdatePlayer = async (id: string) => {
    if (!editName.trim() || editPositions.length === 0) return;
    try {
      await updateDoc(doc(db, 'players', id), {
        name: editName.trim(),
        positions: editPositions
      });
      setEditingId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `players/${id}`);
    }
  };

  const handleUpdateSettings = async (updates: Partial<TeamSettings>) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'settings', user.uid), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `settings/${user.uid}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin text-slate-900">
          <Trophy size={48} />
        </div>
      </div>
    );
  }

  // Handle Shared View
  if (location.pathname.startsWith('/shared/')) {
    return <SharedView />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-slate-100 text-center"
        >
          <div className="w-20 h-20 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3">
            <Trophy size={40} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Lineup+</h1>
          <p className="text-slate-600 mb-8">Organize your team, manage your roster, and win the game.</p>
          <button 
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 py-4 bg-slate-900 text-white rounded-2xl font-semibold hover:bg-slate-800 transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
          >
            <LogIn size={20} />
            Sign in with Google
          </button>
          <p className="mt-8 text-xs text-slate-400 font-medium uppercase tracking-widest">Secure Baseball Management</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 font-bold text-xl">
              <Trophy className="text-slate-900" size={24} />
              <span>Lineup+</span>
            </div>
            <nav className="hidden md:flex items-center gap-1">
              <button 
                onClick={() => handleTabChange('roster')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'roster' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Roster
              </button>
              <button 
                onClick={() => handleTabChange('games')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'games' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Games
              </button>
              <button 
                onClick={() => handleTabChange('settings')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Settings
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600">
              <UserIcon size={16} />
              <span>{user.displayName}</span>
            </div>
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-500 hover:text-slate-900 transition-colors"
              title="Menu"
            >
              <Menu size={20} />
            </button>
            <button 
              onClick={handleLogout}
              className="hidden md:flex p-2 text-slate-500 hover:text-slate-900 transition-colors"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-slate-100 overflow-hidden bg-white"
            >
              <div className="p-4 flex flex-col gap-2">
                <button 
                  onClick={() => handleTabChange('roster')}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'roster' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  Roster
                </button>
                <button 
                  onClick={() => handleTabChange('games')}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'games' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  Games
                </button>
                <button 
                  onClick={() => handleTabChange('settings')}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  Settings
                </button>
                <div className="sm:hidden border-t border-slate-100 mt-2 pt-2 px-4 flex items-center gap-2 text-sm text-slate-600">
                  <UserIcon size={16} />
                  <span>{user.displayName}</span>
                </div>
                <div className="border-t border-slate-100 mt-2 pt-2">
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50 transition-colors flex items-center gap-2"
                  >
                    <LogOut size={18} />
                    Log Out
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {selectedGameId ? (
            <motion.div 
              key="game-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-3xl mx-auto"
            >
              <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-6 gap-4">
                    <div className="flex-1 min-w-0">
                      {isEditingRSVPs ? (
                        <div className="space-y-4 max-w-md">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Game Name</label>
                            <input 
                              type="text" 
                              value={editGameName}
                              onChange={(e) => setEditGameName(e.target.value)}
                              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 shadow-sm"
                              placeholder="Game Name"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Game Date</label>
                            <input 
                              type="date" 
                              value={editGameDate}
                              onChange={(e) => setEditGameDate(e.target.value)}
                              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 shadow-sm"
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight truncate">
                            {games.find(g => g.id === selectedGameId)?.name || 'Game Details'}
                          </h2>
                          <p className="text-slate-500 mt-1 flex items-center gap-2">
                            <Calendar size={16} className="text-slate-400" />
                            {(() => {
                              const game = games.find(g => g.id === selectedGameId);
                              if (!game) return '';
                              const gameDateObj = game.date?.toDate ? game.date.toDate() : new Date(game.date);
                              return gameDateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
                            })()}
                          </p>
                        </>
                      )}
                      <div className="flex flex-wrap items-center gap-2 mt-4">
                        {(() => {
                          const game = games.find(g => g.id === selectedGameId);
                          if (!game) return null;
                          const isLocked = game.isLocked || false;
                          return (
                            <>
                              <button 
                                onClick={() => handleTogglePublish(game.id, isLocked)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-sm font-semibold border ${
                                  isLocked 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {isLocked ? <RotateCcw size={16} /> : <Check size={16} />}
                                {isLocked ? 'Unpublish' : 'Publish'}
                              </button>
                              <button 
                                onClick={() => {
                                  if (!isLocked) {
                                    if (isEditingRSVPs) {
                                      handleUpdateGameDetails();
                                    } else {
                                      const game = games.find(g => g.id === selectedGameId);
                                      if (game) {
                                        setEditGameName(game.name);
                                        const dateStr = game.date?.toDate ? game.date.toDate().toISOString().split('T')[0] : new Date(game.date).toISOString().split('T')[0];
                                        setEditGameDate(dateStr);
                                      }
                                      setIsEditingRSVPs(true);
                                    }
                                  }
                                }}
                                disabled={isLocked}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-sm font-semibold border ${
                                  isLocked
                                    ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                                    : isEditingRSVPs 
                                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20' 
                                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                                }`}
                              >
                                {isEditingRSVPs ? <Save size={16} /> : <Edit2 size={16} />}
                                {isEditingRSVPs ? 'Save' : 'Edit'}
                              </button>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    <button 
                      onClick={() => navigate('/games')}
                      className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200"
                    >
                      <X size={24} />
                    </button>
                  </div>
                </div>

                <div className="p-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                    <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 w-full sm:w-auto">
                      <button 
                        onClick={() => setGameViewTab('batting')}
                        className={`flex-1 sm:flex-none px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                          gameViewTab === 'batting' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        <ClipboardList size={18} />
                        Batting Order
                      </button>
                      <button 
                        onClick={() => setGameViewTab('lineup')}
                        className={`flex-1 sm:flex-none px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                          gameViewTab === 'lineup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        <LayoutGrid size={18} />
                        Field Lineup
                      </button>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      {(() => {
                        const game = games.find(g => g.id === selectedGameId);
                        if (!game) return null;
                        const isLocked = game.isLocked || false;
                        return !isEditingRSVPs && !isLocked && (
                          <button 
                            onClick={() => {
                              if (gameViewTab === 'batting') {
                                handleReshuffleLineup(selectedGameId);
                              } else {
                                handleGenerateLineup(selectedGameId);
                              }
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all text-sm font-semibold border border-slate-200"
                          >
                            <RotateCcw size={16} />
                            {gameViewTab === 'batting' ? 'Reshuffle' : 'Regenerate'}
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {(() => {
                      const game = games.find(g => g.id === selectedGameId);
                      if (!game) return null;

                      if (isEditingRSVPs) {
                        return (
                          <div className="space-y-3">
                            {[...players].sort((a, b) => a.name.localeCompare(b.name)).map(player => (
                              <div key={player.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 font-bold">
                                    <UserIcon size={20} />
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-900">{player.name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{(player.positions || []).map(getPositionAbbreviation).join(', ')}</p>
                                  </div>
                                </div>
                                <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                                  {Object.values(RSVPStatus).map(status => (
                                    <button
                                      key={status}
                                      onClick={() => handleUpdateRSVP(game.id, player.id, status)}
                                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                        game.rsvps[player.id] === status
                                          ? status === RSVPStatus.YES 
                                            ? 'bg-emerald-500 text-white shadow-sm' 
                                            : status === RSVPStatus.TENTATIVE
                                              ? 'bg-amber-500 text-white shadow-sm'
                                              : 'bg-rose-500 text-white shadow-sm'
                                          : 'text-slate-500 hover:bg-slate-200'
                                      }`}
                                    >
                                      {status}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      
                      if (gameViewTab === 'batting') {
                        if (!game.battingOrder) return null;
                        
                        const order = game.battingOrder.filter(id => 
                          players.some(p => p.id === id) && 
                          game.rsvps[id] !== RSVPStatus.NO
                        );
                        
                        return order.map((playerId, index) => {
                          const player = players.find(p => p.id === playerId);
                          if (!player) return null;
                          
                          return (
                            <div key={playerId} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-900 font-bold border border-slate-200">
                                  {index + 1}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900">{player.name}</p>
                                  {game.lineup ? (
                                    <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1">
                                      {[1, 2, 3, 4, 5, 6].map(inning => {
                                        const inningKey = inning.toString();
                                        const inningLineup = game.lineup?.[inningKey] || {};
                                        let position = "Bench";
                                        for (const [pos, pId] of Object.entries(inningLineup)) {
                                          if (pId === playerId) {
                                            position = getPositionAbbreviation(pos);
                                            break;
                                          }
                                        }
                                        const isBench = position === "Bench";
                                        return (
                                          <span key={inning} className={`text-[9px] font-bold px-1.5 py-0.5 rounded border transition-colors ${
                                            isBench 
                                              ? 'text-amber-600 bg-amber-50 border-amber-100' 
                                              : 'text-slate-500 bg-white border-slate-100'
                                          }`}>
                                            <span className={`${isBench ? 'text-amber-300' : 'text-slate-300'} mr-1`}>{inning}</span>
                                            {position}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{(player.positions || []).map(getPositionAbbreviation).join(', ')}</p>
                                  )}
                                </div>
                              </div>
                              <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                game.rsvps[playerId] === RSVPStatus.YES 
                                  ? 'bg-emerald-100 text-emerald-700' 
                                  : game.rsvps[playerId] === RSVPStatus.TENTATIVE
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-rose-100 text-rose-700'
                              }`}>
                                {game.rsvps[playerId] || 'No RSVP'}
                              </div>
                            </div>
                          );
                        });
                      } else {
                        // Lineup View
                        if (!game.lineup) {
                          return (
                            <div className="text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                              <LayoutGrid className="mx-auto text-slate-300 mb-4" size={48} />
                              <h4 className="text-lg font-bold text-slate-900">No Lineup Generated</h4>
                              <p className="text-slate-500 mb-6">Generate a 6-inning field lineup based on player RSVPs.</p>
                              <button 
                                onClick={() => handleGenerateLineup(selectedGameId)}
                                className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-md"
                              >
                                Generate Now
                              </button>
                            </div>
                          );
                        }

                        const isLocked = game.isLocked || false;
                        const fieldPositions = [
                          "Pitcher", "Catcher", "First Base", "Second Base", "Third Base", 
                          "Shortstop", "Left Field", "Center Field", "Right Field"
                        ];

                        return (
                          <div className="space-y-6">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <h3 className="text-xl font-bold text-slate-900">Field Lineup</h3>
                                {isLocked && (
                                  <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold uppercase tracking-wider">
                                    <Check size={10} />
                                    Published
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="overflow-x-auto -mx-8 px-8">
                              <table className="w-full border-collapse">
                                <thead>
                                  <tr>
                                    <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">Position</th>
                                    {[1, 2, 3, 4, 5, 6].map(inning => (
                                      <th key={inning} className="text-center py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                                        <div className="flex flex-col items-center gap-1">
                                          <div className="flex items-center gap-1">
                                            <span>Inn {inning}</span>
                                          </div>
                                          {!isLocked && (
                                            <button 
                                              onClick={() => handleToggleInningLock(selectedGameId, inning)}
                                              className={`p-1 rounded transition-colors ${game.lockedInnings?.includes(inning) ? 'text-emerald-600 bg-emerald-50' : 'text-slate-300 hover:text-slate-900'}`}
                                              title={game.lockedInnings?.includes(inning) ? "Unlock Inning" : "Lock Inning"}
                                            >
                                              {game.lockedInnings?.includes(inning) ? <Lock size={12} /> : <Unlock size={12} />}
                                            </button>
                                          )}
                                        </div>
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                              <tbody>
                                {fieldPositions.map(pos => (
                                  <tr key={pos} className="group hover:bg-slate-50/50">
                                    <td className="py-4 px-4 border-b border-slate-50 font-bold text-slate-900 text-sm">
                                      <div className="flex items-center gap-2">
                                        {!isLocked && (
                                          <button 
                                            onClick={() => handleTogglePositionLock(selectedGameId, pos)}
                                            className={`p-1 rounded transition-colors ${game.lockedPositions?.includes(pos) ? 'text-emerald-600 bg-emerald-50' : 'text-slate-300 hover:text-slate-900'}`}
                                            title={game.lockedPositions?.includes(pos) ? "Unlock Position" : "Lock Position"}
                                          >
                                            {game.lockedPositions?.includes(pos) ? <Lock size={12} /> : <Unlock size={12} />}
                                          </button>
                                        )}
                                        <span className="sm:hidden">{getPositionAbbreviation(pos)}</span>
                                        <span className="hidden sm:inline">{pos}</span>
                                      </div>
                                    </td>
                                    {[1, 2, 3, 4, 5, 6].map(inning => {
                                      const playerId = game.lineup?.[inning.toString()]?.[pos];
                                      const player = players.find(p => p.id === playerId);
                                      return (
                                        <td key={inning} className="py-4 px-4 border-b border-slate-50 text-center">
                                          {player ? (
                                            <div className="text-xs font-semibold text-slate-700 truncate max-w-[100px] mx-auto" title={player.name}>
                                              {player.name.split(' ')[0]}
                                            </div>
                                          ) : (
                                            <span className="text-slate-300">—</span>
                                          )}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ))}
                                <tr className="bg-slate-50/30">
                                  <td className="py-4 px-4 border-b border-slate-50 font-bold text-slate-500 text-sm">Bench</td>
                                  {[1, 2, 3, 4, 5, 6].map(inning => {
                                    const assignedIds = Object.values(game.lineup?.[inning.toString()] || {});
                                    const benchedPlayers = players.filter(p => 
                                      game.rsvps[p.id] !== RSVPStatus.NO && 
                                      !assignedIds.includes(p.id)
                                    );
                                    return (
                                      <td key={inning} className="py-4 px-4 border-b border-slate-50 text-center">
                                        <div className="flex flex-col gap-1">
                                          {benchedPlayers.length > 0 ? benchedPlayers.map(p => (
                                            <div key={p.id} className="text-[10px] font-bold text-slate-400 truncate max-w-[80px] mx-auto">
                                              {p.name.split(' ')[0]}
                                            </div>
                                          )) : (
                                            <span className="text-slate-300">—</span>
                                          )}
                                        </div>
                                      </td>
                                    );
                                  })}
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    }
                  })()}
                  </div>
                </div>

                <div className="p-8 bg-slate-50 border-t border-slate-100">
                  <button 
                    onClick={() => navigate('/games')}
                    className="w-full py-4 bg-white text-slate-600 border border-slate-200 rounded-2xl font-bold hover:bg-slate-100 transition-all active:scale-[0.98]"
                  >
                    Back to Schedule
                  </button>
                </div>
              </div>
            </motion.div>
          ) : isCreatingLineup ? (
            <motion.div 
              key="lineup-creator"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-3xl mx-auto px-4 sm:px-0"
            >
              <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Add New Game</h2>
                      <p className="text-sm sm:text-base text-slate-500 mt-1">Set player availability for this game</p>
                    </div>
                    <button 
                      onClick={() => navigate('/games')}
                      className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Game Name</label>
                      <input 
                        type="text" 
                        value={gameName}
                        onChange={(e) => setGameName(e.target.value)}
                        placeholder="e.g. May 20th - Vipers"
                        className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-base sm:text-lg font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Game Date</label>
                      <input 
                        type="date" 
                        value={gameDate}
                        onChange={(e) => setGameDate(e.target.value)}
                        className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-base sm:text-lg font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:p-8">
                  <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="font-bold text-slate-900">Player RSVP</h3>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{players.length} Total</span>
                  </div>

                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {[...players].sort((a, b) => a.name.localeCompare(b.name)).map((player) => (
                      <div key={player.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-900 font-bold border border-slate-200 shrink-0">
                            {player.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">{player.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">{(player.positions || []).map(getPositionAbbreviation).join(', ')}</p>
                          </div>
                        </div>

                        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-full sm:w-auto">
                          {[RSVPStatus.YES, RSVPStatus.TENTATIVE, RSVPStatus.NO].map((status) => (
                            <button
                              key={status}
                              onClick={() => handleRSVPChange(player.id, status)}
                              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${
                                playerRSVPs[player.id] === status
                                  ? status === RSVPStatus.YES 
                                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' 
                                    : status === RSVPStatus.TENTATIVE
                                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                                      : 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 sm:p-8 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <button 
                    onClick={handleCreateGame}
                    className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 active:scale-[0.98]"
                  >
                    Add Game
                  </button>
                  <button 
                    onClick={() => navigate('/games')}
                    className="flex-1 py-4 bg-white text-slate-600 border border-slate-200 rounded-2xl font-bold hover:bg-slate-100 transition-all active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {activeTab === 'roster' ? (
          <div className={`grid grid-cols-1 ${isAddingPlayer ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-8`}>
            
            {/* Left Column: Add Player Form */}
            {isAddingPlayer && (
              <div className="lg:col-span-1">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 sticky top-24">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <Plus size={20} />
                      Add Player
                    </h2>
                    <button 
                      onClick={() => setIsAddingPlayer(false)}
                      className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <form onSubmit={handleAddPlayer} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Player Name</label>
                      <input 
                        type="text" 
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="e.g. Shohei Ohtani"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                        required
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Positions</label>
                        <div className="flex gap-3">
                          <button 
                            type="button"
                            onClick={() => setNewPositions(ALL_POSITIONS)}
                            className="text-[10px] font-bold text-slate-400 hover:text-slate-900 uppercase tracking-tighter transition-colors"
                          >
                            Select All
                          </button>
                          <button 
                            type="button"
                            onClick={() => setNewPositions([])}
                            className="text-[10px] font-bold text-slate-400 hover:text-slate-900 uppercase tracking-tighter transition-colors"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                        {ALL_POSITIONS.map(pos => (
                          <label key={pos} className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 p-1 rounded transition-colors">
                            <input 
                              type="checkbox"
                              checked={newPositions.includes(pos)}
                              onChange={() => togglePosition(pos, false)}
                              className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                            />
                            <span className="text-sm text-slate-700">{pos} <span className="text-[10px] font-bold text-slate-400">({getPositionAbbreviation(pos)})</span></span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <button 
                      type="submit"
                      disabled={players.length >= 15}
                      className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                        players.length >= 15 
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                          : 'bg-slate-900 text-white hover:bg-slate-800 shadow-md hover:shadow-lg active:scale-[0.98]'
                      }`}
                    >
                      <Plus size={18} />
                      Add to Roster
                    </button>
                    {players.length >= 15 && (
                      <p className="text-xs text-red-500 text-center mt-2">Roster is full (max 15)</p>
                    )}
                  </form>
                </div>
              </div>
            )}

            {/* Right Column: Player List */}
            <div className={isAddingPlayer ? "lg:col-span-2" : "lg:col-span-1"}>
              <div className="mb-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-900">Team Roster</h2>
                  <span className="px-3 py-1 bg-slate-200 text-slate-700 rounded-full text-xs font-bold">
                    {players.length} / 15 Players
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsAddingPlayer(!isAddingPlayer)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-sm font-semibold border ${
                      isAddingPlayer 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Plus size={18} />
                    {isAddingPlayer ? 'Cancel' : 'Add Player'}
                  </button>
                  <button 
                    onClick={startCreateLineup}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all text-sm font-semibold border border-slate-200"
                  >
                    <ClipboardList size={18} />
                    Add Game
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {players.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center"
                    >
                      <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserIcon size={24} />
                      </div>
                      <p className="text-slate-500">No players added yet. Start by adding your first player.</p>
                    </motion.div>
                  ) : (
                    [...players].sort((a, b) => a.name.localeCompare(b.name)).map((player, index) => (
                      <motion.div 
                        key={player.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between group hover:border-slate-300 transition-all"
                      >
                        {editingId === player.id ? (
                          <div className="flex-1 flex flex-col gap-3 mr-4">
                            <input 
                              type="text" 
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                            />
                            <div className="flex items-center justify-between mb-1 px-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Positions</span>
                              <div className="flex gap-2">
                                <button 
                                  type="button"
                                  onClick={() => setEditPositions(ALL_POSITIONS)}
                                  className="text-[9px] font-bold text-slate-400 hover:text-slate-900 uppercase transition-colors"
                                >
                                  All
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => setEditPositions([])}
                                  className="text-[9px] font-bold text-slate-400 hover:text-slate-900 uppercase transition-colors"
                                >
                                  Clear
                                </button>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg max-h-32 overflow-y-auto">
                              {ALL_POSITIONS.map(pos => (
                                <label key={pos} className="flex items-center gap-2 cursor-pointer">
                                  <input 
                                    type="checkbox"
                                    checked={editPositions.includes(pos)}
                                    onChange={() => togglePosition(pos, true)}
                                    className="w-3 h-3 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                                  />
                                  <span className="text-xs text-slate-600">{pos} <span className="text-[9px] font-bold text-slate-400">({getPositionAbbreviation(pos)})</span></span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 font-bold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-900">{player.name}</h3>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {(player.positions || []).map(pos => (
                                  <span key={pos} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wider">
                                    {getPositionAbbreviation(pos)}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-1">
                          {editingId === player.id ? (
                            <>
                              <button 
                                onClick={() => handleUpdatePlayer(player.id)}
                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              >
                                <Save size={18} />
                              </button>
                              <button 
                                onClick={cancelEdit}
                                className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                              >
                                <X size={18} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                onClick={() => startEdit(player)}
                                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button 
                                onClick={() => handleDeletePlayer(player)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        ) : activeTab === 'games' ? (
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Game Schedule</h2>
                <p className="text-sm sm:text-base text-slate-500 mt-1">Manage your {showPastGames ? 'past' : 'upcoming'} games and lineups</p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button 
                  onClick={() => {
                    if (settings?.publicSchedule) {
                      handleCopyLink(`${window.location.origin}${window.location.pathname}#/shared/${user?.uid}/games`);
                    } else {
                      handleTabChange('settings');
                    }
                  }}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl transition-all font-bold border flex-1 sm:flex-none ${
                    settings?.publicSchedule 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                  title={settings?.publicSchedule ? 'Copy public schedule link' : 'Enable public sharing in settings'}
                >
                  {copySuccess ? <Check size={18} /> : <Share2 size={18} />}
                  {copySuccess ? 'Copied!' : 'Share'}
                </button>
                <button 
                  onClick={() => setShowPastGames(!showPastGames)}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl transition-all font-bold border flex-1 sm:flex-none ${
                    showPastGames 
                      ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20' 
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <History size={18} />
                  {showPastGames ? 'Showing Past' : 'Show Past'}
                </button>
                <button 
                  onClick={startCreateLineup}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all font-bold shadow-lg shadow-slate-900/20 active:scale-[0.95] flex-1 sm:flex-none"
                >
                  <Plus size={20} />
                  New Game
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {(() => {
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

                if (filteredGames.length === 0) {
                  return (
                    <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-8 sm:p-16 text-center">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-3">
                        <ClipboardList size={28} className="sm:hidden" />
                        <ClipboardList size={32} className="hidden sm:block" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
                        {showPastGames ? 'No past games' : 'No upcoming games'}
                      </h3>
                      <p className="text-sm sm:text-base text-slate-500 mb-8 max-w-xs mx-auto">
                        {showPastGames 
                          ? "You haven't completed any games yet." 
                          : "Create your first game to start managing your team's lineup and availability."}
                      </p>
                      {!showPastGames && (
                        <button 
                          onClick={startCreateLineup}
                          className="px-6 sm:px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all w-full sm:w-auto"
                        >
                          Schedule First Game
                        </button>
                      )}
                    </div>
                  );
                }

                return filteredGames.map((game) => {
                  const rsvpCounts = (Object.values(game.rsvps) as string[]).reduce((acc, status) => {
                    acc[status] = (acc[status] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>);

                  const gameDateObj = game.date?.toDate ? game.date.toDate() : new Date(game.date);

                  return (
                    <motion.div 
                      key={game.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => handleViewGame(game.id)}
                      className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-200 hover:border-slate-900 hover:shadow-md transition-all group cursor-pointer"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
                        <div className="flex items-center sm:items-start gap-4 sm:gap-5">
                          <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex flex-col items-center justify-center shadow-md shrink-0 transition-colors ${
                            showPastGames ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white'
                          }`}>
                            <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-tighter opacity-70">
                              {gameDateObj.toLocaleDateString('en-US', { month: 'short' })}
                            </span>
                            <span className="text-lg sm:text-xl font-bold leading-none">
                              {gameDateObj.getDate()}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-lg sm:text-xl font-bold text-slate-900 truncate group-hover:text-slate-900">{game.name}</h3>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                              <span className="text-xs sm:text-sm text-slate-500 font-medium whitespace-nowrap">
                                {gameDateObj.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric' })}
                              </span>
                              <span className="hidden sm:block w-1 h-1 bg-slate-300 rounded-full"></span>
                              <div className="flex items-center gap-2">
                                <div className="flex -space-x-1.5">
                                  {[...Array(Math.min(3, rsvpCounts[RSVPStatus.YES] || 0))].map((_, i) => (
                                    <div key={i} className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center">
                                      <Check size={8} className="text-emerald-600 sm:hidden" />
                                      <Check size={10} className="text-emerald-600 hidden sm:block" />
                                    </div>
                                  ))}
                                </div>
                                <span className="text-[10px] sm:text-xs font-bold text-emerald-600 uppercase tracking-widest">
                                  {rsvpCounts[RSVPStatus.YES] || 0} In
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t border-slate-100 sm:border-0">
                          <div className="flex gap-1.5 sm:mr-2">
                            <div className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold border border-emerald-100">
                              {rsvpCounts[RSVPStatus.YES] || 0} Yes
                            </div>
                            <div className="px-2 py-1 bg-amber-50 text-amber-700 rounded-lg text-[10px] font-bold border border-amber-100">
                              {rsvpCounts[RSVPStatus.TENTATIVE] || 0} ?
                            </div>
                            <div className="px-2 py-1 bg-rose-50 text-rose-700 rounded-lg text-[10px] font-bold border border-rose-100">
                              {rsvpCounts[RSVPStatus.NO] || 0} No
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={async (e) => {
                                e.stopPropagation();
                                setDeleteConfirmation({
                                  isOpen: true,
                                  type: 'game',
                                  id: game.id,
                                  title: 'Delete Game',
                                  message: `Are you sure you want to delete "${game.name}"? This action cannot be undone.`
                                });
                              }}
                              className="p-2.5 sm:p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl sm:rounded-2xl transition-all border border-transparent hover:border-rose-100"
                              title="Delete Game"
                            >
                              <Trash2 size={18} className="sm:hidden" />
                              <Trash2 size={20} className="hidden sm:block" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                });
              })()}
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200">
              <h2 className="text-2xl font-bold mb-6">Team Settings</h2>
              
              <div className="space-y-6">
                <div className="flex items-start sm:items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900">Allow Designated Hitter</h3>
                    <p className="text-sm text-slate-500">Enable "Designated Hitter" as a position option for your lineup.</p>
                  </div>
                  <button 
                    onClick={() => handleUpdateSettings({ allowDesignatedHitter: !settings?.allowDesignatedHitter })}
                    className={`w-14 h-8 rounded-full transition-colors relative shrink-0 ${settings?.allowDesignatedHitter ? 'bg-slate-900' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings?.allowDesignatedHitter ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                <div className="flex items-start sm:items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900">Allow Outfield Twice in Row</h3>
                    <p className="text-sm text-slate-500">Allow assigning the same player to an outfield position in consecutive innings. By default, the app tries to avoid this.</p>
                  </div>
                  <button 
                    onClick={() => handleUpdateSettings({ allowOutfieldTwiceInRow: !settings?.allowOutfieldTwiceInRow })}
                    className={`w-14 h-8 rounded-full transition-colors relative shrink-0 ${settings?.allowOutfieldTwiceInRow ? 'bg-slate-900' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings?.allowOutfieldTwiceInRow ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                <div className="flex flex-col p-4 bg-slate-50 rounded-2xl border border-slate-100 gap-4">
                  <div className="flex items-start sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900">Public Schedule Sharing</h3>
                      <p className="text-sm text-slate-500">Allow others to view your game schedule and lineups without logging in.</p>
                    </div>
                    <button 
                      onClick={() => handleUpdateSettings({ publicSchedule: !settings?.publicSchedule })}
                      className={`w-14 h-8 rounded-full transition-colors relative shrink-0 ${settings?.publicSchedule ? 'bg-slate-900' : 'bg-slate-200'}`}
                    >
                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings?.publicSchedule ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                  
                  {settings?.publicSchedule && (
                    <div className="mt-2 p-3 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-3">
                      <div className="flex-1 min-w-0 w-full">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Your Public Link</p>
                        <p className="text-xs text-slate-600 truncate font-mono bg-slate-50 p-2 rounded-lg border border-slate-100">
                          {`${window.location.origin}${window.location.pathname}#/shared/${user?.uid}/games`}
                        </p>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button 
                          onClick={() => handleCopyLink(`${window.location.origin}${window.location.pathname}#/shared/${user?.uid}/games`)}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all text-xs font-bold"
                        >
                          {copySuccess ? <Check size={14} /> : <Copy size={14} />}
                          {copySuccess ? 'Copied!' : 'Copy'}
                        </button>
                        <a 
                          href={`${window.location.origin}${window.location.pathname}#/shared/${user?.uid}/games`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all text-xs font-bold shadow-sm"
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
        )}
      </motion.div>
    )}
  </AnimatePresence>
      </main>

      <AnimatePresence>
        {deleteConfirmation.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmation(prev => ({ ...prev, isOpen: false }))}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 p-8 max-w-md w-full overflow-hidden"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center shrink-0">
                  <AlertCircle size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900">{deleteConfirmation.title}</h3>
                  <p className="text-slate-500 text-sm mt-1">{deleteConfirmation.message}</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setDeleteConfirmation(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-6 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
);
}

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <BaseballApp />
      </HashRouter>
    </ErrorBoundary>
  );
}
