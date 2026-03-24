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

import { Plus, Trash2, Edit2, LogIn, LogOut, User as UserIcon, Users, Trophy, Save, X, ClipboardList, Check, AlertCircle, RotateCcw, LayoutGrid, RefreshCw, Lock, Unlock, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Menu, Calendar, History, Share2, ExternalLink, Copy, Sun, Moon, Wrench } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';

// --- Types ---
interface Player {
  id: string;
  name: string;
  positions: string[];
  battingOrder?: number;
  jerseyNumber?: string;
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
  time?: string;
  isHome?: boolean;
  rsvps: Record<string, RSVPStatus>;
  battingOrder?: string[];
  lineup?: Record<string, Record<string, string>>; // Inning -> Position -> PlayerId
  isLocked?: boolean;
  lockedInnings?: number[];
  lockedPositions?: string[];
  uid: string;
  createdAt: any;
  mode?: 'standard' | 'scrimmage';
  scrimmageGroups?: string[][];
  scrimmageStep?: number;
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

const getLocalDateString = (date?: Date) => {
  const now = date || new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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

function SharedView({ darkMode, setDarkMode }: { darkMode: boolean; setDarkMode: (val: boolean) => void }) {
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
  const [showPastGames, setShowPastGames] = useState(false);

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
      orderBy('date', 'asc')
    );

    const unsubGames = onSnapshot(gamesQuery, (snapshot) => {
      console.log("Games snapshot received, count:", snapshot.size);
      const gamesData: Game[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.scrimmageGroups && typeof data.scrimmageGroups === 'string') {
          try {
            data.scrimmageGroups = JSON.parse(data.scrimmageGroups);
          } catch (e) {
            console.error("Error parsing scrimmageGroups:", e);
          }
        }
        gamesData.push({ id: doc.id, ...data } as Game);
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-900 dark:border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Loading schedule...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 text-center">
          <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Access Restricted</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">{error}</p>
          <button 
            onClick={() => navigate('/')}
            className="w-full py-4 bg-slate-900 dark:bg-emerald-600 text-white rounded-2xl font-bold hover:bg-slate-800 dark:hover:bg-emerald-500 transition-all shadow-lg"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  const selectedGame = gameId ? games.find(g => g.id === gameId) : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            <Trophy className="text-slate-900 dark:text-white" size={24} />
            <span className="text-slate-900 dark:text-white">Lineup+</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Shared View
            </div>
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
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-sm transition-colors duration-300">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-100 dark:border-slate-700">
                    <Lock size={32} className="text-slate-300 dark:text-slate-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Lineup Not Published</h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xs mx-auto">
                    The lineup for this game is still being finalized. Please check back later.
                  </p>
                  <button 
                    onClick={() => navigate(`/shared/${ownerId}/games`)}
                    className="px-8 py-3 bg-slate-900 dark:bg-emerald-600 text-white rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-emerald-500 transition-all shadow-lg"
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
                  className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold text-sm mb-6 transition-colors"
                >
                  <ChevronLeft size={18} />
                  Back to Schedule
                </button>

                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden mb-8 transition-colors duration-300">
                  <div className="p-6 sm:p-8 bg-slate-900 dark:bg-slate-800 text-white">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="px-2 py-0.5 bg-emerald-500 text-white rounded text-[10px] font-bold uppercase tracking-wider">
                            Published
                          </span>
                          {selectedGame.mode === 'scrimmage' && (
                            <span className="px-2 py-0.5 bg-indigo-500 text-white rounded text-[10px] font-bold uppercase tracking-wider">
                              Scrimmage
                            </span>
                          )}
                          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white w-full mt-1">{selectedGame.name}</h2>
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
                  <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-8 transition-colors duration-300">
                    <button
                      onClick={() => setActiveTab('batting')}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                        activeTab === 'batting'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      <ClipboardList size={18} />
                      {selectedGame.mode === 'scrimmage' ? 'Groups' : 'Batting Order'}
                    </button>
                    <button
                      onClick={() => setActiveTab('fielding')}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                        activeTab === 'fielding'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      <LayoutGrid size={18} />
                      Fielding Lineup
                    </button>
                  </div>

                  <div>
                    {/* Batting Order / Groups */}
                    {activeTab === 'batting' && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                          <ClipboardList size={20} className="text-slate-400 dark:text-slate-500" />
                          {selectedGame.mode === 'scrimmage' ? 'Groups' : 'Batting Order'}
                        </h3>
                        <div className="space-y-2">
                          {selectedGame.mode === 'scrimmage' ? (
                            selectedGame.scrimmageGroups && selectedGame.scrimmageGroups.some(g => g.length > 0) ? (
                              <div className="space-y-4">
                                {[0, 1, 2, 3].map(groupIndex => {
                                  const group = selectedGame.scrimmageGroups?.[groupIndex] || [];
                                  if (group.length === 0) return null;
                                  return (
                                    <div key={groupIndex} className="space-y-2">
                                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Group {groupIndex + 1}</h4>
                                      {group.map(playerId => {
                                        const player = players.find(p => p.id === playerId);
                                        return (
                                          <div key={playerId} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 transition-colors duration-300">
                                            <span className="w-6 h-6 bg-slate-900 dark:bg-indigo-600 text-white rounded-lg flex items-center justify-center text-[10px] font-black shrink-0">
                                              {player?.name.charAt(0) || '?'}
                                            </span>
                                            <span className="font-bold text-slate-700 dark:text-slate-200">{player?.name || 'Unknown Player'}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-sm text-slate-400 dark:text-slate-500 italic p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 border-dashed text-center transition-colors duration-300">
                                No groups set yet.
                              </p>
                            )
                          ) : (
                            selectedGame.battingOrder && selectedGame.battingOrder.length > 0 ? (
                              selectedGame.battingOrder.map((playerId, index) => {
                                const player = players.find(p => p.id === playerId);
                                return (
                                  <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 transition-colors duration-300">
                                    <span className="w-6 h-6 bg-slate-900 dark:bg-emerald-600 text-white rounded-lg flex items-center justify-center text-[10px] font-black shrink-0">
                                      {index + 1}
                                    </span>
                                    <span className="font-bold text-slate-700 dark:text-slate-200">{player?.name || 'Unknown Player'}</span>
                                  </div>
                                );
                              })
                            ) : (
                              <p className="text-sm text-slate-400 dark:text-slate-500 italic p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 border-dashed text-center transition-colors duration-300">
                                No batting order set yet.
                              </p>
                            )
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
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                          <LayoutGrid size={20} className="text-slate-400 dark:text-slate-500" />
                          Fielding Lineup
                        </h3>
                        <div className="space-y-4">
                          {selectedGame.lineup && Object.keys(selectedGame.lineup).length > 0 ? (
                            Object.entries(selectedGame.lineup).sort(([a], [b]) => Number(a) - Number(b)).map(([inningNum, inning]) => (
                              <div key={inningNum} className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 transition-colors duration-300">
                                <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Inning {inningNum}</h4>
                                {selectedGame.mode === 'scrimmage' && inning['HittingGroup'] != null && (
                                  <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
                                    <div className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-2">Hitting Group {parseInt(inning['HittingGroup']) + 1}</div>
                                    <div className="flex flex-wrap gap-2">
                                      {selectedGame.scrimmageGroups?.[parseInt(inning['HittingGroup'])]?.map(playerId => {
                                        const p = players.find(p => p.id === playerId);
                                        return p ? (
                                          <span key={playerId} className="px-2 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-xs font-bold shadow-sm border border-slate-200 dark:border-slate-700">
                                            {p.name.split(' ')[0]}
                                          </span>
                                        ) : null;
                                      })}
                                      {Object.entries(inning)
                                        .filter(([pos]) => pos.startsWith('Extra Hitter'))
                                        .map(([pos, playerId]) => {
                                          const p = players.find(p => p.id === playerId);
                                          return p ? (
                                            <span key={playerId} className="px-2 py-1 bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-200 rounded-md text-xs font-bold shadow-sm border border-indigo-200 dark:border-indigo-700">
                                              EH: {p.name.split(' ')[0]}
                                            </span>
                                          ) : null;
                                        })}
                                    </div>
                                  </div>
                                )}
                                <div className="grid grid-cols-2 gap-2">
                                  {Object.entries(inning)
                                    .filter(([pos]) => pos !== 'HittingGroup' && !pos.startsWith('Extra Hitter'))
                                    .sort(([posA], [posB]) => (POSITION_ORDER[posA] || 99) - (POSITION_ORDER[posB] || 99))
                                    .map(([pos, playerId]) => {
                                      const player = players.find(p => p.id === playerId);
                                      const isDuplicate = playerId && Object.values(inning).filter(id => id === playerId).length > 1;
                                      return (
                                        <div key={pos} className={`flex items-center gap-2 p-2 rounded-lg border shadow-sm transition-colors duration-300 ${
                                          isDuplicate 
                                            ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/30' 
                                            : 'bg-white dark:bg-slate-700 border-slate-100 dark:border-slate-600'
                                        }`}>
                                          <span className={`text-[10px] font-black w-6 shrink-0 ${isDuplicate ? 'text-rose-400 dark:text-rose-500' : 'text-slate-400 dark:text-slate-400'}`}>{getPositionAbbreviation(pos)}</span>
                                          <span className={`text-xs font-bold truncate ${isDuplicate ? 'text-rose-700 dark:text-rose-300' : 'text-slate-700 dark:text-slate-200'}`}>
                                            {player?.name || <span className="italic opacity-30">Empty</span>}
                                          </span>
                                        </div>
                                      );
                                    })}
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-slate-400 dark:text-slate-500 italic p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 border-dashed text-center transition-colors duration-300">
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
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Game Schedule</h2>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">View upcoming games and lineups</p>
                </div>
                <button
                  onClick={() => setShowPastGames(!showPastGames)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    showPastGames 
                      ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-md' 
                      : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <History size={16} />
                  {showPastGames ? 'Showing All Games' : 'Show Past Games'}
                </button>
              </div>

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
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-12 text-center transition-colors duration-300">
                      <Calendar size={48} className="text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {showPastGames ? 'No past games' : 'No upcoming games'}
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400">
                        {showPastGames ? 'Check back later for updates.' : 'Check back later for updates.'}
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredGames.map((game) => {
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
                          className={`group bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all text-left relative overflow-hidden ${
                            isPublished 
                              ? 'hover:shadow-xl dark:hover:shadow-emerald-900/10 hover:border-slate-900 dark:hover:border-emerald-500 cursor-pointer' 
                              : 'opacity-70 cursor-default'
                          }`}
                        >
                          {!isPublished && (
                            <div className="absolute top-3 right-3 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded text-[10px] font-bold uppercase tracking-wider border border-slate-200 dark:border-slate-700">
                              Draft
                            </div>
                          )}
                          {isPublished && (
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                              <ChevronRight size={20} className="text-slate-400 dark:text-slate-500" />
                            </div>
                          )}
                          <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                              isPublished ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600'
                            }`}>
                              <Calendar size={24} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white truncate">{game.name}</h3>
                                {game.mode === 'scrimmage' && (
                                  <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded text-[10px] font-bold uppercase tracking-wider shrink-0">
                                    Scrimmage
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                {gameDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// --- Main App Component ---

function BaseballApp({ darkMode, setDarkMode }: { darkMode: boolean; setDarkMode: (val: boolean) => void }) {
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
  const [gameNameError, setGameNameError] = useState(false);
  const [gameDate, setGameDate] = useState(getLocalDateString());
  const [gameTime, setGameTime] = useState('');
  const [isHome, setIsHome] = useState(true);
  const [gameMode, setGameMode] = useState<'standard' | 'scrimmage'>('standard');
  const [backupLineup, setBackupLineup] = useState<Record<string, Record<string, string>> | null>(null);
  const [backupScrimmageGroups, setBackupScrimmageGroups] = useState<string[][] | null>(null);
  const [playerRSVPs, setPlayerRSVPs] = useState<Record<string, RSVPStatus>>({});
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  // Form state
  const [newName, setNewName] = useState('');
  const [newJerseyNumber, setNewJerseyNumber] = useState('');
  const [newPositions, setNewPositions] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editJerseyNumber, setEditJerseyNumber] = useState('');
  const [editPositions, setEditPositions] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'roster' | 'games' | 'settings'>('roster');
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [isEditingRSVPs, setIsEditingRSVPs] = useState(false);
  const [showPastGames, setShowPastGames] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const [showClearLineupConfirm, setShowClearLineupConfirm] = useState(false);

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
  const [editGameTime, setEditGameTime] = useState('');
  const [editIsHome, setEditIsHome] = useState(true);
  const [gameViewTab, setGameViewTab] = useState<'batting' | 'lineup'>('batting');
  const [localBattingOrder, setLocalBattingOrder] = useState<string[]>([]);
  const [editingCell, setEditingCell] = useState<{ inning: string; position: string } | null>(null);
  const [games, setGames] = useState<Game[]>([]);

  useEffect(() => {
    const game = games.find(g => g.id === selectedGameId);
    if (game?.battingOrder) {
      // Only update local if it's actually different
      // We remove localBattingOrder from dependencies to prevent "jump back"
      // before the Firestore update arrives.
      if (JSON.stringify(game.battingOrder) !== JSON.stringify(localBattingOrder)) {
        setLocalBattingOrder(game.battingOrder);
      }
    } else if (localBattingOrder.length > 0) {
      setLocalBattingOrder([]);
    }
  }, [selectedGameId, games]); // Removed localBattingOrder from dependencies

  const handleMovePlayerToPosition = async (playerId: string, newPositionIndex: number) => {
    if (!selectedGameId || !user) return;
    
    // Use localBattingOrder as the base for rapid sequential moves
    const currentOrder = [...localBattingOrder];
    const currentIndex = currentOrder.indexOf(playerId);
    if (currentIndex === -1 || currentIndex === newPositionIndex) return;

    // Remove the player from their current position
    currentOrder.splice(currentIndex, 1);
    // Insert the player at the new position
    currentOrder.splice(newPositionIndex, 0, playerId);

    // Update local state immediately for smooth UI
    setLocalBattingOrder(currentOrder);

    try {
      const gameRef = doc(db, 'games', selectedGameId);
      await updateDoc(gameRef, {
        battingOrder: currentOrder
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `games/${selectedGameId}`);
    }
  };

  const handleMovePlayer = (playerId: string, direction: 'up' | 'down') => {
    const currentIndex = localBattingOrder.indexOf(playerId);
    if (currentIndex === -1) return;
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= localBattingOrder.length) return;
    handleMovePlayerToPosition(playerId, newIndex);
  };

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
      orderBy('date', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const gamesData: Game[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.scrimmageGroups && typeof data.scrimmageGroups === 'string') {
          try {
            data.scrimmageGroups = JSON.parse(data.scrimmageGroups);
          } catch (e) {
            console.error("Error parsing scrimmageGroups:", e);
          }
        }
        gamesData.push({ id: doc.id, ...data } as Game);
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
    setGameDate(getLocalDateString());
    navigate('/games/new');
  };

  const handleUpdateGameRSVP = async (gameId: string, playerId: string, status: RSVPStatus) => {
    try {
      const game = games.find(g => g.id === gameId);
      if (!game) return;

      const newRSVPs = { ...game.rsvps, [playerId]: status };
      
      // If changing to NO, we might want to remove from batting order, but let's keep it for now
      // and just filter in the view to allow easy "re-entry"
      
      await updateDoc(doc(db, 'games', gameId), {
        rsvps: newRSVPs
      });
      
      toast.success(`RSVP updated for ${players.find(p => p.id === playerId)?.name}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `games/${gameId}`);
    }
  };

  const handleRSVPChange = (playerId: string, status: RSVPStatus) => {
    setPlayerRSVPs(prev => ({
      ...prev,
      [playerId]: status
    }));
  };

  const handleCreateGame = async () => {
    if (!user || !gameName.trim()) {
      setGameNameError(true);
      toast.error("Game name is required", {
        description: "Please provide a name for this game before continuing.",
        position: 'top-center',
      });
      return;
    }
    setGameNameError(false);

    // Initial batting order: Yes first, then Tentative
    const yesPlayers = players.filter(p => playerRSVPs[p.id] === RSVPStatus.YES).map(p => p.id).sort(() => Math.random() - 0.5);
    const tentativePlayers = players.filter(p => playerRSVPs[p.id] === RSVPStatus.TENTATIVE).map(p => p.id).sort(() => Math.random() - 0.5);
    const initialBattingOrder = [...yesPlayers, ...tentativePlayers];

    try {
      await addDoc(collection(db, 'games'), {
        name: gameName.trim(),
        date: new Date(gameDate + 'T12:00:00'),
        time: gameTime || null,
        isHome: gameMode === 'scrimmage' ? null : isHome,
        rsvps: playerRSVPs,
        battingOrder: initialBattingOrder,
        mode: gameMode,
        uid: user.uid,
        createdAt: serverTimestamp()
      });
      navigate('/games');
      setGameName('');
      setGameDate(getLocalDateString());
      setGameTime('');
      setIsHome(true);
      setGameMode('standard');
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
    const game = games.find(g => g.id === selectedGameId);
    if (!game) return;
    try {
      const gameRef = doc(db, 'games', selectedGameId);
      await updateDoc(gameRef, {
        name: editGameName.trim(),
        date: new Date(editGameDate + 'T12:00:00'),
        time: editGameTime || null,
        isHome: game.mode === 'scrimmage' ? null : editIsHome
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

  const handleClearLineup = async (gameId: string | null) => {
    if (!gameId) return;
    try {
      await updateDoc(doc(db, 'games', gameId), {
        lineup: {},
        lockedInnings: [],
        lockedPositions: []
      });
      setShowClearLineupConfirm(false);
      toast.success('Lineup cleared successfully');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `games/${gameId}`);
    }
  };

  const handleSplitScrimmageGroups = async (gameId: string | null) => {
    if (!gameId) return;
    const game = games.find(g => g.id === gameId);
    if (!game) return;

    // Get all players who are IN (YES or TENTATIVE)
    const availablePlayers = players.filter(p => game.rsvps[p.id] !== RSVPStatus.NO);
    
    // Get players already assigned as Pitcher or Catcher in any inning
    const assignedIds = new Set<string>();
    if (game.lineup) {
      Object.values(game.lineup).forEach(inningLineup => {
        if (inningLineup['Pitcher']) assignedIds.add(inningLineup['Pitcher']);
        if (inningLineup['Catcher']) assignedIds.add(inningLineup['Catcher']);
      });
    }

    // Split into 4 groups (include all available players)
    const shuffled = [...availablePlayers].sort(() => Math.random() - 0.5);
    
    const groups: string[][] = [[], [], [], []];
    shuffled.forEach((p, i) => {
      groups[i % 4].push(p.id);
    });

    try {
      await updateDoc(doc(db, 'games', gameId), {
        scrimmageGroups: JSON.stringify(groups),
        scrimmageStep: 2
      });
      // Manually update local state
      setGames(prevGames => prevGames.map(g => g.id === gameId ? {...g, scrimmageGroups: groups, scrimmageStep: 2} : g));
      toast.success('Players split into 4 groups');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `games/${gameId}`);
    }
  };

  const handleMoveScrimmagePlayer = async (gameId: string, fromGroup: number, toGroup: number, playerId: string) => {
    const game = games.find(g => g.id === gameId);
    if (!game || !game.scrimmageGroups) return;

    const newGroups = [...game.scrimmageGroups.map(g => [...g])];
    newGroups[fromGroup] = newGroups[fromGroup].filter(id => id !== playerId);
    newGroups[toGroup].push(playerId);

    try {
      await updateDoc(doc(db, 'games', gameId), {
        scrimmageGroups: JSON.stringify(newGroups)
      });
      setGames(prevGames => prevGames.map(g => g.id === gameId ? {...g, scrimmageGroups: newGroups} : g));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `games/${gameId}`);
    }
  };

  const handleGenerateBatteries = async (gameId: string) => {
    const game = games.find(g => g.id === gameId);
    if (!game) return;

    const eligiblePitchers = players.filter(p => 
      p.positions.includes('Starting Pitcher') || 
      p.positions.includes('Relief Pitcher') || 
      p.positions.includes('First Base')
    );
    const eligibleCatchers = players.filter(p => 
      p.positions.includes('Catcher') || 
      p.positions.includes('First Base') || 
      p.positions.includes('Third Base')
    );

    const newLineup = { ...game.lineup };
    const pitchCounts: Record<string, number> = {};
    const catchCounts: Record<string, number> = {};

    for (let inning = 1; inning <= 6; inning++) {
      const inningKey = inning.toString();
      if (!newLineup[inningKey]) newLineup[inningKey] = {};
      
      const availablePitchers = [...eligiblePitchers].sort((a, b) => (pitchCounts[a.id] || 0) - (pitchCounts[b.id] || 0));
      const minPitchCount = availablePitchers.length > 0 ? (pitchCounts[availablePitchers[0].id] || 0) : 0;
      const bestPitchers = availablePitchers.filter(p => (pitchCounts[p.id] || 0) === minPitchCount);
      
      const pitcher = bestPitchers.length > 0 
        ? bestPitchers[Math.floor(Math.random() * bestPitchers.length)] 
        : null;
      
      if (pitcher) {
        newLineup[inningKey]['Pitcher'] = pitcher.id;
        pitchCounts[pitcher.id] = (pitchCounts[pitcher.id] || 0) + 1;
      }

      const availableCatchers = eligibleCatchers.filter(p => p.id !== pitcher?.id).sort((a, b) => (catchCounts[a.id] || 0) - (catchCounts[b.id] || 0));
      const minCatchCount = availableCatchers.length > 0 ? (catchCounts[availableCatchers[0].id] || 0) : 0;
      const bestCatchers = availableCatchers.filter(p => (catchCounts[p.id] || 0) === minCatchCount);

      const catcher = bestCatchers.length > 0 
        ? bestCatchers[Math.floor(Math.random() * bestCatchers.length)] 
        : null;
      
      if (catcher) {
        newLineup[inningKey]['Catcher'] = catcher.id;
        catchCounts[catcher.id] = (catchCounts[catcher.id] || 0) + 1;
      }
    }

    await updateDoc(doc(db, 'games', gameId), { lineup: newLineup });
    setGames(prevGames => prevGames.map(g => g.id === gameId ? {...g, lineup: newLineup} : g));
  };

  const handleFixInningBatteries = async (gameId: string, inningKey: string) => {
    const game = games.find(g => g.id === gameId);
    if (!game) return;

    const eligiblePitchers = players.filter(p => 
      (p.positions.includes('Starting Pitcher') || 
      p.positions.includes('Relief Pitcher') || 
      p.positions.includes('First Base')) &&
      game.rsvps[p.id] !== RSVPStatus.NO
    );
    const eligibleCatchers = players.filter(p => 
      (p.positions.includes('Catcher') || 
      p.positions.includes('First Base') || 
      p.positions.includes('Third Base')) &&
      game.rsvps[p.id] !== RSVPStatus.NO
    );

    const newLineup = { ...game.lineup };
    if (!newLineup[inningKey]) newLineup[inningKey] = {};

    const pitchCounts: Record<string, number> = {};
    const catchCounts: Record<string, number> = {};

    for (let i = 1; i <= 6; i++) {
      const ik = i.toString();
      if (ik === inningKey) continue;
      
      const pId = newLineup[ik]?.['Pitcher'];
      const cId = newLineup[ik]?.['Catcher'];
      if (pId) pitchCounts[pId] = (pitchCounts[pId] || 0) + 1;
      if (cId) catchCounts[cId] = (catchCounts[cId] || 0) + 1;
    }

    const currentPitcherId = newLineup[inningKey]['Pitcher'];
    const currentCatcherId = newLineup[inningKey]['Catcher'];

    let newPitcherId = currentPitcherId;
    let newCatcherId = currentCatcherId;

    if (currentPitcherId && game.rsvps[currentPitcherId] === RSVPStatus.NO) {
      const availablePitchers = eligiblePitchers.filter(p => p.id !== currentCatcherId).sort((a, b) => (pitchCounts[a.id] || 0) - (pitchCounts[b.id] || 0));
      const minPitchCount = availablePitchers.length > 0 ? (pitchCounts[availablePitchers[0].id] || 0) : 0;
      const bestPitchers = availablePitchers.filter(p => (pitchCounts[p.id] || 0) === minPitchCount);
      const chosenPitcher = bestPitchers.length > 0 ? bestPitchers[Math.floor(Math.random() * bestPitchers.length)] : null;
      if (chosenPitcher) {
        newPitcherId = chosenPitcher.id;
        newLineup[inningKey]['Pitcher'] = newPitcherId;
      }
    }

    if (currentCatcherId && game.rsvps[currentCatcherId] === RSVPStatus.NO) {
      const availableCatchers = eligibleCatchers.filter(p => p.id !== newPitcherId).sort((a, b) => (catchCounts[a.id] || 0) - (catchCounts[b.id] || 0));
      const minCatchCount = availableCatchers.length > 0 ? (catchCounts[availableCatchers[0].id] || 0) : 0;
      const bestCatchers = availableCatchers.filter(p => (catchCounts[p.id] || 0) === minCatchCount);
      const chosenCatcher = bestCatchers.length > 0 ? bestCatchers[Math.floor(Math.random() * bestCatchers.length)] : null;
      if (chosenCatcher) {
        newCatcherId = chosenCatcher.id;
        newLineup[inningKey]['Catcher'] = newCatcherId;
      }
    }

    await updateDoc(doc(db, 'games', gameId), { lineup: newLineup });
    setGames(prevGames => prevGames.map(g => g.id === gameId ? {...g, lineup: newLineup} : g));
  };

  const handleGenerateScrimmageLineup = async (gameId: string) => {
    const game = games.find(g => g.id === gameId);
    if (!game || !game.scrimmageGroups) return;

    const newLineup = { ...game.lineup };
    const groups = game.scrimmageGroups;
    
    // Positions to fill (excluding P/C)
    const otherPositions = ["First Base", "Second Base", "Third Base", "Shortstop", "Left Field", "Center Field", "Right Field"];
    
    // We need to assign hitting groups for innings 1-4 (all 4 must hit)
    // Then 5-6 can be whatever, but no group hits more than twice total.
    
    // Generate all valid schedules (24 permutations for first 4 innings * 12 combinations for last 2 = 288 total)
    const allSchedules: number[][] = [];
    const permute = (arr: number[]): number[][] => {
      if (arr.length === 0) return [[]];
      const result: number[][] = [];
      for (let i = 0; i < arr.length; i++) {
        const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
        for (const p of permute(rest)) {
          result.push([arr[i], ...p]);
        }
      }
      return result;
    };
    
    const first4Perms = permute([0, 1, 2, 3]);
    for (const f4 of first4Perms) {
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          if (i !== j) {
            allSchedules.push([...f4, i, j]);
          }
        }
      }
    }
    
    // Filter by P/C constraints
    const validSchedules = allSchedules.filter(schedule => {
      for (let inning = 1; inning <= 6; inning++) {
        const inningKey = inning.toString();
        const pId = game.lineup?.[inningKey]?.['Pitcher'];
        const cId = game.lineup?.[inningKey]?.['Catcher'];
        const groupIdx = schedule[inning - 1];
        if ((pId && groups[groupIdx].includes(pId)) || (cId && groups[groupIdx].includes(cId))) {
          return false;
        }
      }
      return true;
    });
    
    let hittingSchedule: number[];
    if (validSchedules.length > 0) {
      let bestSchedules: number[][] = [];
      let maxScore = -1;

      for (const schedule of validSchedules) {
        let score = 0;
        // Priority: group that batted 1st bats 5th, group that batted 2nd bats 6th
        if (schedule[4] === schedule[0]) score += 100;
        if (schedule[5] === schedule[1]) score += 100;
        
        // Secondary priority: longest wait time
        const wait5 = 4 - schedule.indexOf(schedule[4]); 
        score += wait5;
        
        const wait6 = 5 - schedule.indexOf(schedule[5]);
        score += wait6;

        if (score > maxScore) {
          maxScore = score;
          bestSchedules = [schedule];
        } else if (score === maxScore) {
          bestSchedules.push(schedule);
        }
      }
      hittingSchedule = bestSchedules[Math.floor(Math.random() * bestSchedules.length)];
    } else {
      // Fallback: just satisfy P/C constraints, trying to balance hits and wait time
      hittingSchedule = [];
      const counts = [0, 0, 0, 0];
      const lastBatted = [-1, -1, -1, -1];
      for (let inning = 1; inning <= 6; inning++) {
        const inningKey = inning.toString();
        const pId = game.lineup?.[inningKey]?.['Pitcher'];
        const cId = game.lineup?.[inningKey]?.['Catcher'];
        
        let bestGroup = -1;
        let minHits = 999;
        let maxWait = -1;
        
        const availableGroups = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
        for (const j of availableGroups) {
          if ((!pId || !groups[j].includes(pId)) && (!cId || !groups[j].includes(cId))) {
            const wait = lastBatted[j] === -1 ? 999 : inning - lastBatted[j];
            if (counts[j] < minHits || (counts[j] === minHits && wait > maxWait)) {
              minHits = counts[j];
              maxWait = wait;
              bestGroup = j;
            }
          }
        }
        
        if (bestGroup === -1) bestGroup = 0;
        hittingSchedule.push(bestGroup);
        counts[bestGroup]++;
        lastBatted[bestGroup] = inning;
      }
    }

    const extraHitterCounts: Record<string, number> = {};
    const outfieldCounts: Record<string, number> = {};

    const twoHitGroups = [hittingSchedule[4], hittingSchedule[5]];
    const oneHitGroups = [0, 1, 2, 3].filter(g => !twoHitGroups.includes(g));

    const isOneHitGroup = (pid: string) => {
      return oneHitGroups.some(gIdx => groups[gIdx].includes(pid));
    };

    for (let inning = 1; inning <= 6; inning++) {
      const inningKey = inning.toString();
      const hittingGroupIndex = hittingSchedule[inning - 1];
      
      const pId = game.lineup?.[inningKey]?.['Pitcher'];
      const cId = game.lineup?.[inningKey]?.['Catcher'];
      
      const actualHittingGroup = groups[hittingGroupIndex];
      const fieldingGroups = groups.filter((_, idx) => idx !== hittingGroupIndex);
      
      // All players in fielding groups who are NOT P or C
      let fieldingPool: string[] = [];
      fieldingGroups.forEach(g => {
        g.forEach(pid => {
          if (pid !== pId && pid !== cId) {
            fieldingPool.push(pid);
          }
        });
      });
      
      // Shuffle fielding pool, but prioritize those with MORE extra hitter assignments
      // to play in the field (so they don't get EH again)
      fieldingPool.sort((a, b) => {
        const countA = extraHitterCounts[a] || 0;
        const countB = extraHitterCounts[b] || 0;
        if (countA !== countB) return countB - countA; // Descending
        
        // Lower priority: prioritize players from one-hit groups to be Extra Hitters
        const aOneHit = isOneHitGroup(a);
        const bOneHit = isOneHitGroup(b);
        if (aOneHit && !bOneHit) return 1; // a is one-hit, push to end (EH)
        if (!aOneHit && bOneHit) return -1; // b is one-hit, push to end (EH)
        
        return Math.random() - 0.5;
      });
      
      const inningLineup: Record<string, string> = { 
        Pitcher: pId || '', 
        Catcher: cId || '' 
      };
      
      const selectedFielders = fieldingPool.slice(0, otherPositions.length);
      const extraHitters = fieldingPool.slice(otherPositions.length);
      
      // Sort selected fielders to minimize outfield time
      // otherPositions: ["First Base", "Second Base", "Third Base", "Shortstop", "Left Field", "Center Field", "Right Field"]
      // Indices 0-3 are Infield, 4-6 are Outfield
      // Prioritize players with MORE outfield assignments to get Infield (put them at the start)
      selectedFielders.sort((a, b) => {
        const countA = outfieldCounts[a] || 0;
        const countB = outfieldCounts[b] || 0;
        if (countA !== countB) return countB - countA; // Descending
        return Math.random() - 0.5;
      });
      
      // Assign to field positions
      otherPositions.forEach((pos, idx) => {
        if (selectedFielders[idx]) {
          inningLineup[pos] = selectedFielders[idx];
          if (["Left Field", "Center Field", "Right Field"].includes(pos)) {
            outfieldCounts[selectedFielders[idx]] = (outfieldCounts[selectedFielders[idx]] || 0) + 1;
          }
        }
      });
      
      // Extra Hitters
      extraHitters.forEach((pid, idx) => {
        inningLineup[`Extra Hitter ${idx + 1}`] = pid;
        extraHitterCounts[pid] = (extraHitterCounts[pid] || 0) + 1;
      });
      
      // Store hitting group index
      inningLineup['HittingGroup'] = hittingGroupIndex.toString();
      
      newLineup[inningKey] = inningLineup;
    }

    try {
      await updateDoc(doc(db, 'games', gameId), {
        lineup: newLineup,
        scrimmageStep: 3
      });
      setGames(prevGames => prevGames.map(g => g.id === gameId ? {...g, lineup: newLineup, scrimmageStep: 3} : g));
      toast.success('Scrimmage lineup generated!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `games/${gameId}`);
    }
  };

  const handleGenerateLineup = async (gameId: string | null) => {
    if (!gameId) return;
    const game = games.find(g => g.id === gameId);
    if (!game) return;

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
          
          // Apply Catcher constraints (League Rules)
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

              // 4. Cannot catch then pitch then catch again (even 1 inning of pitching)
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

  const handleUpdateLineupCell = async (gameId: string, inning: string, position: string, playerId: string) => {
    const game = games.find(g => g.id === gameId);
    if (!game) return;

    const newLineup = { ...game.lineup };
    // Deep copy the inning to avoid direct state mutation
    newLineup[inning] = { ...(newLineup[inning] || {}) };
    
    if (playerId) {
      newLineup[inning][position] = playerId;
    } else {
      delete newLineup[inning][position];
    }

    try {
      await updateDoc(doc(db, 'games', gameId), {
        lineup: newLineup
      });
      setEditingCell(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `games/${gameId}`);
    }
  };

  const handleFixLineup = async (gameId: string | null) => {
    if (!gameId) return;
    const game = games.find(g => g.id === gameId);
    if (!game || !game.lineup) return;

    const newLineup = JSON.parse(JSON.stringify(game.lineup));
    let fixedAny = false;
    let skippedDueToLocks = false;

    const availablePlayers = players.filter(p => game.rsvps[p.id] === RSVPStatus.YES || game.rsvps[p.id] === RSVPStatus.TENTATIVE);
    
    const fieldPositions = [
      "Pitcher", "Catcher", "First Base", "Second Base", "Third Base", 
      "Shortstop", "Left Field", "Center Field", "Right Field"
    ];

    const isPosLocked = (pos: string, inning: number) => {
      if (game.lockedInnings?.includes(inning)) return true;
      if (game.lockedPositions?.includes(pos)) return true;
      if (game.mode === 'scrimmage' && (pos === "Pitcher" || pos === "Catcher")) return true;
      return false;
    };

    const canPlay = (player: Player, pos: string) => {
      if (pos === "Pitcher") return (player.positions || []).includes("Starting Pitcher") || (player.positions || []).includes("Relief Pitcher");
      return (player.positions || []).includes(pos);
    };

    // Helper to get play counts
    const getPlayCounts = (lineup: any) => {
      const counts: Record<string, number> = {};
      availablePlayers.forEach(p => counts[p.id] = 0);
      Object.values(lineup).forEach((inning: any) => {
        Object.entries(inning).forEach(([pos, id]) => {
          if (pos !== 'HittingGroup' && id && counts[id as string] !== undefined) {
            counts[id as string]++;
          }
        });
      });
      return counts;
    };

    // Helper to try and fill a vacant position
    const tryToFillPosition = (inning: number, pos: string, currentInningLineup: any): boolean => {
      const hittingGroupIdx = currentInningLineup['HittingGroup'];
      const hittingGroupIds = (game.mode === 'scrimmage' && hittingGroupIdx != null && game.scrimmageGroups?.[parseInt(hittingGroupIdx)])
        ? game.scrimmageGroups[parseInt(hittingGroupIdx)]
        : [];

      // 1. Try Extra Hitters (EH positions) first if scrimmage
      if (game.mode === 'scrimmage') {
        const ehPositions = Object.keys(currentInningLineup).filter(k => k.startsWith('Extra Hitter'));
        for (const ehPos of ehPositions) {
          const ehPlayerId = currentInningLineup[ehPos];
          if (ehPlayerId) {
            const p = players.find(player => player.id === ehPlayerId);
            if (p && canPlay(p, pos)) {
              currentInningLineup[pos] = ehPlayerId;
              delete currentInningLineup[ehPos];
              return true;
            }
          }
        }
      }

      // 2. Try players on the "Bench" (not in field, not hitting, not in EH)
      const allAssignedIds = new Set(Object.values(currentInningLineup).filter(id => id && typeof id === 'string'));
      const benchCandidates = availablePlayers.filter(p => 
        !hittingGroupIds.includes(p.id) && 
        !allAssignedIds.has(p.id)
      );

      const preferred = benchCandidates.filter(p => canPlay(p, pos));
      
      if (preferred.length > 0) {
        currentInningLineup[pos] = preferred[0].id;
        return true;
      }

      if (benchCandidates.length > 0) {
        currentInningLineup[pos] = benchCandidates[0].id;
        return true;
      }

      // 3. "Outfield second" - if pos is infield, try to move an outfielder
      const outfieldPos = ["Left Field", "Center Field", "Right Field"];
      if (!outfieldPos.includes(pos)) {
        for (const ofPos of outfieldPos) {
          const ofPlayerId = currentInningLineup[ofPos];
          if (ofPlayerId) {
            const ofPlayer = players.find(p => p.id === ofPlayerId);
            if (ofPlayer && canPlay(ofPlayer, pos)) {
              // Move outfielder to this position
              currentInningLineup[pos] = ofPlayerId;
              // Now try to fill the outfield position from the bench
              const filledOF = tryToFillPosition(inning, ofPos, currentInningLineup);
              if (!filledOF) {
                delete currentInningLineup[ofPos];
              }
              return true;
            }
          }
        }
      }

      return false;
    };

    // Phase -1: Ensure hitting group members are NOT in the field (Scrimmage only)
    if (game.mode === 'scrimmage') {
      for (let inning = 1; inning <= 6; inning++) {
        const inningKey = inning.toString();
        const inningLineup = newLineup[inningKey] || {};
        const hittingGroupIdx = inningLineup['HittingGroup'];
        const hittingGroupIds = (hittingGroupIdx != null && game.scrimmageGroups?.[parseInt(hittingGroupIdx)])
          ? game.scrimmageGroups[parseInt(hittingGroupIdx)]
          : [];

        const allPositions = Object.keys(inningLineup).filter(k => k !== 'HittingGroup');
        for (const pos of allPositions) {
          const playerId = inningLineup[pos];
          if (playerId && hittingGroupIds.includes(playerId)) {
            delete inningLineup[pos];
            fixedAny = true;
          }
        }
        newLineup[inningKey] = inningLineup;
      }
    }

    // Phase 0: Fix duplicate players in an inning
    for (let inning = 1; inning <= 6; inning++) {
      const inningKey = inning.toString();
      const inningLineup = newLineup[inningKey] || {};
      
      // Find players assigned more than once
      const playerPositions: Record<string, string[]> = {};
      Object.entries(inningLineup).forEach(([pos, id]) => {
        if (id && pos !== 'HittingGroup') {
          if (!playerPositions[id as string]) playerPositions[id as string] = [];
          playerPositions[id as string].push(pos);
        }
      });

      Object.entries(playerPositions).forEach(([playerId, positions]) => {
        if (positions.length > 1) {
          // Duplicate found
          if (game.lockedInnings?.includes(inning)) {
            skippedDueToLocks = true;
            return;
          }

          const lockedPositionsForPlayer = positions.filter(pos => isPosLocked(pos, inning));
          
          if (lockedPositionsForPlayer.length > 1) {
            // More than one locked position for this player - can't fix
            skippedDueToLocks = true;
          } else {
            // 0 or 1 locked position
            let positionToKeep = lockedPositionsForPlayer.length === 1 
              ? lockedPositionsForPlayer[0] 
              : positions[0]; // If none locked, pick the first one
            
            positions.forEach(pos => {
              if (pos !== positionToKeep) {
                const replaced = tryToFillPosition(inning, pos, inningLineup);
                if (!replaced) {
                  delete inningLineup[pos];
                }
                fixedAny = true;
              }
            });
          }
        }
      });
      newLineup[inningKey] = inningLineup;
    }

    // Phase 1: Replace players marked as "Out"
    for (let inning = 1; inning <= 6; inning++) {
      const inningKey = inning.toString();
      const inningLineup = newLineup[inningKey] || {};
      
      for (const pos of fieldPositions) {
        if (isPosLocked(pos, inning)) continue;
        const playerId = inningLineup[pos];
        if (playerId && game.rsvps[playerId] === RSVPStatus.NO) {
          delete inningLineup[pos];
          const replaced = tryToFillPosition(inning, pos, inningLineup);
          if (replaced) {
            fixedAny = true;
          } else {
            // Already deleted above
            fixedAny = true;
          }
        }
      }
      newLineup[inningKey] = inningLineup;
    }

    // Phase 2: Work in "Activated" players (those with 0 play time)
    let playCounts = getPlayCounts(newLineup);
    const zeroPlayPlayers = availablePlayers.filter(p => playCounts[p.id] === 0);

    if (zeroPlayPlayers.length > 0) {
      // Aim for at least 1 or 2 innings depending on roster size
      const targetInnings = availablePlayers.length > 13 ? 1 : 2;

      for (const player of zeroPlayPlayers) {
        let assignedCount = 0;
        // Try all innings, prioritizing unlocked ones
        const innings = [1, 2, 3, 4, 5, 6].sort((a, b) => {
          const aLocked = game.lockedInnings?.includes(a) ? 1 : 0;
          const bLocked = game.lockedInnings?.includes(b) ? 1 : 0;
          return aLocked - bLocked;
        });

        for (const inning of innings) {
          if (assignedCount >= targetInnings) break;
          const inningKey = inning.toString();
          const inningLineup = newLineup[inningKey] || {};
          
          if (Object.values(inningLineup).includes(player.id)) continue;

          let bestPosToSwap = "";
          let maxPlayCount = -1;

          for (const pos of fieldPositions) {
            // Skip locked positions unless they are empty
            if (isPosLocked(pos, inning) && inningLineup[pos]) continue;

            const currentPlayerId = inningLineup[pos] as string;
            if (!currentPlayerId) {
              bestPosToSwap = pos;
              maxPlayCount = 999;
              break;
            }

            if (canPlay(player, pos)) {
              const currentCount = playCounts[currentPlayerId] || 0;
              if (currentCount > maxPlayCount) {
                maxPlayCount = currentCount;
                bestPosToSwap = pos;
              }
            }
          }

          if (bestPosToSwap && (maxPlayCount > 1 || maxPlayCount === 999)) {
            inningLineup[bestPosToSwap] = player.id;
            fixedAny = true;
            assignedCount++;
            playCounts = getPlayCounts(newLineup);
          }
        }
      }
    }

    // Phase 3: Fix back-to-back benches
    // Attempt to fix back-to-back benches regardless of roster size
    if (availablePlayers.length > 0) {
      let hasBackToBack = true;
      let iterations = 0;
      while (hasBackToBack && iterations < 10) {
        hasBackToBack = false;
        iterations++;
        
        for (const player of availablePlayers) {
          const isBenched = (inning: number) => {
            if (inning < 1 || inning > 6) return false;
            const lineup = newLineup[inning.toString()] || {};
            // In scrimmage, EH positions are also considered benched for defense
            const assignedToField = Object.entries(lineup)
              .filter(([k]) => k !== 'HittingGroup' && !k.startsWith('Extra Hitter'))
              .map(([_, id]) => id);
            const hittingGroupIdx = lineup['HittingGroup'];
            const hittingGroupIds = (game.mode === 'scrimmage' && hittingGroupIdx != null && game.scrimmageGroups?.[parseInt(hittingGroupIdx)])
              ? game.scrimmageGroups[parseInt(hittingGroupIdx)]
              : [];
            return !assignedToField.includes(player.id) && !hittingGroupIds.includes(player.id);
          };
          
          for (let i = 1; i <= 5; i++) {
            if (isBenched(i) && isBenched(i+1)) {
              // Back-to-back bench found at inning i and i+1
              const targetInnings = [i, i + 1];
              let swapped = false;

              for (const targetInning of targetInnings) {
                if (swapped) break;
                const inningKey = targetInning.toString();
                const inningLineup = newLineup[inningKey] || {};
                
                // Only target standard field positions to resolve a benching issue
                for (const pos of fieldPositions) {
                  if (isPosLocked(pos, targetInning) && inningLineup[pos]) continue;

                  const currentPlayerId = inningLineup[pos] as string;
                  
                  // If position is empty, just put the player there
                  if (!currentPlayerId) {
                    inningLineup[pos] = player.id;
                    swapped = true;
                    fixedAny = true;
                    break;
                  }

                  // If position is occupied, try to swap
                  if (canPlay(player, pos)) {
                    const isBenchedAfterSwap = (inn: number) => {
                      if (inn < 1 || inn > 6) return false;
                      if (inn === targetInning) return true; // They are being swapped out
                      
                      const l = newLineup[inn.toString()] || {};
                      const field = Object.entries(l).filter(([k]) => k !== 'HittingGroup').map(([_, id]) => id);
                      const hgIdx = l['HittingGroup'];
                      const hgIds = (game.mode === 'scrimmage' && hgIdx != null && game.scrimmageGroups?.[parseInt(hgIdx)])
                        ? game.scrimmageGroups[parseInt(hgIdx)]
                        : [];
                      return !field.includes(currentPlayerId) && !hgIds.includes(currentPlayerId);
                    };
                    
                    const wouldCreateBTB = (isBenchedAfterSwap(targetInning - 1) || isBenchedAfterSwap(targetInning + 1));
                    
                    // Swap if it doesn't create a new BTB issue for the other player
                    // We are more lenient here - if it fixes a BTB for 'player', we take it unless it breaks 'currentPlayer'
                    if (!wouldCreateBTB) {
                      inningLineup[pos] = player.id;
                      swapped = true;
                      fixedAny = true;
                      break;
                    }
                  }
                }
              }
              
              if (swapped) {
                hasBackToBack = true;
                break;
              }
            }
          }
        }
      }
    }

    if (fixedAny) {
      try {
        await updateDoc(doc(db, 'games', gameId), {
          lineup: newLineup
        });
        
        let description = "Replaced 'Out' players, worked in 'Activated' players, and resolved back-to-back benches.";
        if (skippedDueToLocks) {
          description += " Note: Some duplicates were skipped due to locks.";
        }

        toast.success("Lineup fixed!", {
          description,
          position: 'top-center'
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `games/${gameId}`);
      }
    } else {
      if (skippedDueToLocks) {
        toast.warning("Unable to fix some issues", {
          description: "Some duplicate players could not be fixed because multiple positions are locked or the inning is locked.",
          position: 'top-center'
        });
      } else {
        toast.info("No changes needed for the lineup.");
      }
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
        jerseyNumber: newJerseyNumber.trim(),
        positions: newPositions,
        uid: user.uid,
        createdAt: serverTimestamp()
      });
      setNewName('');
      setNewJerseyNumber('');
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
    setEditJerseyNumber(player.jerseyNumber || '');
    setEditPositions(player.positions || []);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditJerseyNumber('');
    setEditPositions([]);
  };

  const handleUpdatePlayer = async (id: string) => {
    if (!editName.trim() || editPositions.length === 0) return;
    try {
      await updateDoc(doc(db, 'players', id), {
        name: editName.trim(),
        jerseyNumber: editJerseyNumber.trim(),
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="animate-spin text-slate-900 dark:text-emerald-500">
          <Trophy size={48} />
        </div>
      </div>
    );
  }

  // Handle Shared View
  if (location.pathname.startsWith('/shared/')) {
    return <SharedView darkMode={darkMode} setDarkMode={setDarkMode} />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors duration-300">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 text-center"
        >
          <div className="w-20 h-20 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3">
            <Trophy size={40} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Lineup+</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-8">Organize your team, manage your roster, and win the game.</p>
          <button 
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 py-4 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-2xl font-semibold hover:bg-slate-800 dark:hover:bg-white transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 font-bold text-xl">
              <Trophy className="text-slate-900" size={24} />
              <span>Lineup+</span>
            </div>
            <nav className="hidden md:flex items-center gap-1">
              <button 
                onClick={() => handleTabChange('roster')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'roster' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
              >
                Roster
              </button>
              <button 
                onClick={() => handleTabChange('games')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'games' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
              >
                Games
              </button>
              <button 
                onClick={() => handleTabChange('settings')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
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
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-slate-100 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900"
            >
              <div className="p-4 flex flex-col gap-2">
                <button 
                  onClick={() => handleTabChange('roster')}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'roster' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                  Roster
                </button>
                <button 
                  onClick={() => handleTabChange('games')}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'games' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                  Games
                </button>
                <button 
                  onClick={() => handleTabChange('settings')}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
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
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {selectedGameId ? (
            <motion.div 
              key="game-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <button 
                onClick={() => navigate('/games')}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm mb-6 transition-colors group"
              >
                <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                Back to Schedule
              </button>

              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden mb-12">
                {(() => {
                  const game = games.find(g => g.id === selectedGameId);
                  if (!game) return null;
                  const isLocked = game.isLocked || false;
                  
                  return (
                    <>
                      <div className="p-8 sm:p-12 bg-slate-900 text-white relative overflow-hidden">
                        {/* Decorative background element */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                        
                        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                          <div className="flex-1 min-w-0">
                            {isEditingRSVPs ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
                                <div className="space-y-1.5">
                                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Game Name</label>
                                  <input 
                                    type="text" 
                                    value={editGameName}
                                    onChange={(e) => setEditGameName(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-2xl focus:outline-none focus:border-emerald-500 shadow-sm transition-all font-bold"
                                    placeholder="Game Name"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Game Date</label>
                                  <input 
                                    type="date" 
                                    value={editGameDate}
                                    onChange={(e) => setEditGameDate(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-2xl focus:outline-none focus:border-emerald-500 shadow-sm transition-all font-bold"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Game Time</label>
                                  <input 
                                    type="time" 
                                    value={editGameTime}
                                    onChange={(e) => setEditGameTime(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-2xl focus:outline-none focus:border-emerald-500 shadow-sm transition-all font-bold"
                                  />
                                </div>
                                {game.mode !== 'scrimmage' && (
                                  <div className="space-y-1.5">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Home / Away</label>
                                    <div className="flex bg-slate-700 p-1 rounded-2xl border border-slate-600">
                                      <button
                                        onClick={() => setEditIsHome(true)}
                                        className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${editIsHome ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'}`}
                                      >
                                        Home
                                      </button>
                                      <button
                                        onClick={() => setEditIsHome(false)}
                                        className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!editIsHome ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'}`}
                                      >
                                        Away
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <>
                                <div className="mb-3">
                                  <h2 className="text-3xl sm:text-5xl font-black tracking-tighter truncate leading-tight">
                                    {game.name}
                                  </h2>
                                  <div className="flex items-center gap-3 mt-3">
                                    {isLocked && (
                                      <span className="px-2 py-0.5 bg-emerald-500 text-white rounded text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                                        Published
                                      </span>
                                    )}
                                    {game.mode === 'scrimmage' && (
                                      <span className="px-2 py-0.5 bg-indigo-500 text-white rounded text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20">
                                        Scrimmage
                                      </span>
                                    )}
                                    {game.mode !== 'scrimmage' && (
                                      <span className={`px-2 py-0.5 ${game.isHome ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700'} rounded text-[10px] font-black uppercase tracking-widest shadow-sm`}>
                                        {game.isHome ? 'Home' : 'Away'}
                                      </span>
                                    )}
                                    {game.time && (
                                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                                        {(() => {
                                          const [hours, minutes] = game.time.split(':');
                                          const h = parseInt(hours);
                                          const ampm = h >= 12 ? 'PM' : 'AM';
                                          const h12 = h % 12 || 12;
                                          return `${h12}:${minutes} ${ampm}`;
                                        })()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-6 text-slate-400">
                                  <div className="flex items-center gap-2">
                                    <Calendar size={18} className="text-emerald-500" />
                                    <span className="text-base font-bold">
                                      {(() => {
                                        const gameDateObj = game.date?.toDate ? game.date.toDate() : new Date(game.date);
                                        return gameDateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
                                      })()}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Users size={18} className="text-emerald-500" />
                                    <span className="text-base font-bold">
                                      {Object.values(game.rsvps || {}).filter(v => v === RSVPStatus.YES).length} Players In
                                    </span>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 shrink-0">
                            <button 
                              onClick={() => handleTogglePublish(game.id, isLocked)}
                              className={`flex items-center justify-center gap-2 px-8 py-4 rounded-2xl transition-all text-sm font-black border shadow-lg ${
                                isLocked 
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 shadow-emerald-500/5' 
                                  : 'bg-white/10 text-white border-white/10 hover:bg-white/20 shadow-black/5'
                              }`}
                            >
                              {isLocked ? <RotateCcw size={20} /> : <Check size={20} />}
                              {isLocked ? 'Unpublish' : 'Publish Lineup'}
                            </button>
                            <button 
                              onClick={() => {
                                if (isEditingRSVPs) {
                                  handleUpdateGameDetails();
                                } else {
                                  setEditGameName(game.name);
                                  const dateStr = game.date?.toDate ? getLocalDateString(game.date.toDate()) : getLocalDateString(new Date(game.date));
                                  setEditGameDate(dateStr);
                                  setEditGameTime(game.time || '');
                                  setEditIsHome(game.isHome !== false); // Default to true if undefined
                                  setIsEditingRSVPs(true);
                                }
                              }}
                              className={`flex items-center justify-center gap-2 px-8 py-4 rounded-2xl transition-all text-sm font-black border ${
                                isEditingRSVPs 
                                  ? 'bg-emerald-500 text-white border-emerald-500 shadow-xl shadow-emerald-500/30' 
                                  : 'bg-white text-slate-900 border-white hover:bg-slate-100 shadow-xl shadow-black/10'
                              }`}
                            >
                              {isEditingRSVPs ? <Save size={20} /> : <Edit2 size={20} />}
                              {isEditingRSVPs ? 'Save Changes' : 'Edit Details'}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 sm:p-10">
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
                                  if (game.mode === 'scrimmage' && game.lineup && Object.keys(game.lineup).length > 0 && game.scrimmageStep !== 3 && !backupLineup) {
                                    const isFullLineup = Object.values(game.lineup).some(inning => 
                                      Object.keys(inning).some(pos => pos !== 'Pitcher' && pos !== 'Catcher')
                                    );
                                    if (isFullLineup) {
                                      updateDoc(doc(db, 'games', game.id), { scrimmageStep: 3 });
                                      setGames(prevGames => prevGames.map(g => g.id === game.id ? {...g, scrimmageStep: 3} : g));
                                    }
                                  }
                                  setGameViewTab('lineup');
                                }}
                              className={`flex-1 sm:flex-none px-8 py-3 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 relative ${
                                gameViewTab === 'lineup' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                              }`}
                            >
                              <LayoutGrid size={20} />
                              Field Lineup
                              {(() => {
                                const g = games.find(g => g.id === selectedGameId);
                                if (!g || g.mode !== 'scrimmage') return null;
                                
                                const s1Issues = [1, 2, 3, 4, 5, 6].some(inning => {
                                  const ik = inning.toString();
                                  return ["Pitcher", "Catcher"].some(pos => {
                                    const pId = g.lineup?.[ik]?.[pos];
                                    return pId && g.rsvps[pId] === RSVPStatus.NO;
                                  });
                                });

                                const s2Issues = (g.scrimmageGroups || []).some(group => 
                                  group.some(pId => g.rsvps[pId] === RSVPStatus.NO)
                                );

                                const s3Issues = [1, 2, 3, 4, 5, 6].some(inning => {
                                  const ik = inning.toString();
                                  const iLineup = g.lineup?.[ik] || {};
                                  return Object.entries(iLineup).some(([pos, pId]) => {
                                    if (pos === 'HittingGroup') return false;
                                    return pId && g.rsvps[pId] === RSVPStatus.NO;
                                  });
                                });

                                if (s1Issues || s2Issues || s3Issues) {
                                  return (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center">
                                      <AlertCircle size={10} className="text-white" />
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </button>
                          </div>
                        </div>
                        
                        <div className="space-y-6">
                    {(() => {
                      const game = games.find(g => g.id === selectedGameId);
                      if (!game) return null;

                      if (isEditingRSVPs) {
                        return (
                          <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="flex items-center justify-between">
                              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Manage RSVPs</h3>
                              <div className="px-4 py-2 bg-slate-100 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                {players.filter(p => game.rsvps[p.id] === RSVPStatus.YES).length} Confirmed
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {[...players].sort((a, b) => a.name.localeCompare(b.name)).map(player => (
                                <div key={player.id} className="flex items-center justify-between p-5 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                                  <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                                      game.rsvps[player.id] === RSVPStatus.YES ? 'bg-emerald-100 text-emerald-600' : 
                                      game.rsvps[player.id] === RSVPStatus.NO ? 'bg-rose-100 text-rose-600' : 
                                      'bg-slate-100 text-slate-400'
                                    }`}>
                                      <UserIcon size={20} />
                                    </div>
                                    <div>
                                      <p className="font-black text-slate-900">{player.name}</p>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{(player.positions || []).map(getPositionAbbreviation).join(', ')}</p>
                                    </div>
                                  </div>
                                  <div className="flex gap-1 bg-slate-50 p-1.5 rounded-2xl">
                                    {[RSVPStatus.YES, RSVPStatus.TENTATIVE, RSVPStatus.NO].map(status => (
                                      <button
                                        key={status}
                                        onClick={() => handleUpdateRSVP(selectedGameId, player.id, status)}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                          game.rsvps[player.id] === status
                                            ? status === RSVPStatus.YES ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' :
                                              status === RSVPStatus.NO ? 'bg-rose-600 text-white shadow-lg shadow-rose-200' :
                                              'bg-amber-500 text-white shadow-lg shadow-amber-200'
                                            : 'text-slate-400 hover:bg-white hover:text-slate-600'
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
                        );
                      }
                      
                      if (gameViewTab === 'batting') {
                        if (game.mode === 'scrimmage') {
                          const groups = game.scrimmageGroups || [];
                          const inPlayers = players.filter(p => game.rsvps[p.id] !== RSVPStatus.NO);
                          const outPlayers = players.filter(p => game.rsvps[p.id] === RSVPStatus.NO).sort((a, b) => a.name.localeCompare(b.name));
                          
                          const groupedPlayers: Record<string, typeof players> = {
                            'Group 1': [],
                            'Group 2': [],
                            'Group 3': [],
                            'Group 4': [],
                            'Unassigned': []
                          };
                          
                          inPlayers.forEach(p => {
                            let assigned = false;
                            for (let i = 0; i < 4; i++) {
                              if (groups[i] && groups[i].includes(p.id)) {
                                groupedPlayers[`Group ${i + 1}`].push(p);
                                assigned = true;
                                break;
                              }
                            }
                            if (!assigned) {
                              groupedPlayers['Unassigned'].push(p);
                            }
                          });
                          
                          Object.keys(groupedPlayers).forEach(key => {
                            groupedPlayers[key].sort((a, b) => a.name.localeCompare(b.name));
                          });

                          return (
                            <div className="space-y-8">
                              {['Group 1', 'Group 2', 'Group 3', 'Group 4', 'Unassigned'].map(groupName => {
                                const groupPlayers = groupedPlayers[groupName];
                                if (groupPlayers.length === 0) return null;
                                
                                return (
                                  <div key={groupName} className="space-y-3">
                                    <div className="flex items-center justify-between px-2">
                                      <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{groupName}</h3>
                                      <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{groupPlayers.length} Players</span>
                                    </div>
                                    <div className="space-y-3">
                                      {groupPlayers.map(player => {
                                        const playerPositions = game.lineup ? [1, 2, 3, 4, 5, 6].map(inning => {
                                          const inningLineup = game.lineup?.[inning.toString()] || {};
                                          let position = Object.entries(inningLineup).find(([key, id]) => id === player.id && key !== 'HittingGroup')?.[0];
                                          
                                          if (!position) {
                                            const hittingGroupIdxStr = inningLineup['HittingGroup'];
                                            if (hittingGroupIdxStr != null) {
                                              const hittingGroupIdx = parseInt(hittingGroupIdxStr);
                                              if (game.scrimmageGroups?.[hittingGroupIdx]?.includes(player.id)) {
                                                position = 'Hitting';
                                              }
                                            }
                                          }
                                          
                                          if (!position) position = 'Hitting';
                                          
                                          if (position.startsWith('Extra Hitter')) position = 'EH';
                                          
                                          return { inning, position };
                                        }).filter(p => p.position) : [];

                                        return (
                                          <div
                                            key={player.id}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all group gap-4"
                                          >
                                            <div className="flex items-center gap-4 sm:gap-6">
                                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl sm:rounded-2xl flex items-center justify-center text-xs sm:text-sm font-black shadow-xl shadow-slate-900/20 dark:shadow-indigo-900/20 group-hover:scale-110 transition-transform flex-shrink-0">
                                                {player.name.charAt(0)}
                                              </div>
                                              <div className="min-w-0 flex-1">
                                                <p className="font-black text-slate-900 dark:text-white text-lg sm:text-xl tracking-tight truncate">{player.name}</p>
                                                {playerPositions.length > 0 ? (
                                                  <div className="flex flex-wrap gap-x-1.5 gap-y-1 mt-1.5">
                                                    {playerPositions.map(({ inning, position }) => {
                                                      const isHitting = position === 'Hitting';
                                                      return (
                                                        <span key={inning} className={`text-[8px] sm:text-[9px] font-black px-1.5 sm:px-2 py-0.5 rounded-lg border transition-all ${
                                                          isHitting
                                                            ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800/50'
                                                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                                                        }`}>
                                                          <span className={`${isHitting ? 'text-indigo-400 dark:text-indigo-500' : 'text-slate-400 dark:text-slate-500'} mr-1`}>{inning}</span>
                                                          {getPositionAbbreviation(position)}
                                                        </span>
                                                      );
                                                    })}
                                                  </div>
                                                ) : (
                                                  <p className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest mt-1 truncate">{(player.positions || []).map(getPositionAbbreviation).join(', ')}</p>
                                                )}
                                              </div>
                                            </div>
                                            <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 border-t sm:border-t-0 border-slate-50 dark:border-slate-800 pt-3 sm:pt-0">
                                              <div className="flex gap-1 flex-1 sm:flex-none">
                                                {[RSVPStatus.YES, RSVPStatus.TENTATIVE, RSVPStatus.NO].map(status => (
                                                  <button
                                                    key={status}
                                                    onClick={() => handleUpdateGameRSVP(game.id, player.id, status)}
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
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}

                              {outPlayers.length > 0 && (
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
                                          <p className="font-bold text-slate-500 dark:text-slate-400">{player.name}</p>
                                        </div>
                                        <div className="flex gap-1">
                                          <button
                                            onClick={() => handleUpdateGameRSVP(game.id, player.id, RSVPStatus.YES)}
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
                        }

                        if (!game.battingOrder) return null;
                        
                        const inOrder = localBattingOrder.filter(id => 
                          players.some(p => p.id === id) && 
                          game.rsvps[id] !== RSVPStatus.NO
                        );

                        const outPlayers = players.filter(p => 
                          game.rsvps[p.id] === RSVPStatus.NO
                        ).sort((a, b) => a.name.localeCompare(b.name));
                        
                        return (
                          <div className="space-y-8">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between px-2">
                                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Batting Order</h3>
                                <div className="flex items-center gap-3">
                                  {!game.isLocked && (
                                    <button
                                      onClick={() => handleReshuffleLineup(selectedGameId)}
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
                                    <div
                                      key={playerId}
                                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all group gap-4"
                                    >
                                      <div className="flex items-center gap-4 sm:gap-6">
                                        {game.mode !== 'scrimmage' ? (
                                          <div className="relative group/order">
                                            <select
                                              disabled={game.isLocked}
                                              value={index}
                                              onChange={(e) => handleMovePlayerToPosition(playerId, parseInt(e.target.value))}
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
                                      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 border-t sm:border-t-0 border-slate-50 dark:border-slate-800 pt-3 sm:pt-0">
                                        <div className="flex gap-1 flex-1 sm:flex-none">
                                          {[RSVPStatus.YES, RSVPStatus.TENTATIVE, RSVPStatus.NO].map(status => (
                                            <button
                                              key={status}
                                              onClick={() => handleUpdateGameRSVP(game.id, playerId, status)}
                                              className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest transition-all border ${
                                                game.rsvps[playerId] === status
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
                                        {game.mode === 'scrimmage' && (
                                          <div className="flex sm:flex-col gap-1">
                                            <button
                                              onClick={() => handleMovePlayer(playerId, 'up')}
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
                                              onClick={() => handleMovePlayer(playerId, 'down')}
                                              disabled={index === inOrder.length - 1}
                                              className={`p-2 sm:p-1 rounded-lg transition-all ${
                                                index === inOrder.length - 1 
                                                  ? 'text-slate-100 dark:text-slate-800 cursor-not-allowed' 
                                                  : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                                              }`}
                                            >
                                              <ChevronDown size={20} />
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {outPlayers.length > 0 && (
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
                                          onClick={() => handleUpdateGameRSVP(game.id, player.id, RSVPStatus.YES)}
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
                      } else {
                        // Lineup View
                        const isLocked = game.isLocked || false;

                        if (game.mode === 'scrimmage') {
                          const currentStep = game.scrimmageStep || 1;
                          const fieldPositions = ["Pitcher", "Catcher"];
                          
                          const hasOutPlayersInBatteries = currentStep === 1 && [1, 2, 3, 4, 5, 6].some(inning => {
                            const inningKey = inning.toString();
                            return fieldPositions.some(pos => {
                              const playerId = game.lineup?.[inningKey]?.[pos];
                              return playerId && game.rsvps[playerId] === RSVPStatus.NO;
                            });
                          });

                          const step1HasIssues = [1, 2, 3, 4, 5, 6].some(inning => {
                            const inningKey = inning.toString();
                            return ["Pitcher", "Catcher"].some(pos => {
                              const playerId = game.lineup?.[inningKey]?.[pos];
                              return playerId && game.rsvps[playerId] === RSVPStatus.NO;
                            });
                          });

                          const step2HasIssues = (game.scrimmageGroups || []).some(group => 
                            group.some(playerId => game.rsvps[playerId] === RSVPStatus.NO)
                          );

                          const step3HasIssues = [1, 2, 3, 4, 5, 6].some(inning => {
                            const inningKey = inning.toString();
                            const inningLineup = game.lineup?.[inningKey] || {};
                            return Object.entries(inningLineup).some(([pos, playerId]) => {
                              if (pos === 'HittingGroup') return false;
                              return playerId && game.rsvps[playerId] === RSVPStatus.NO;
                            });
                          });

                          const anyStepHasIssues = step1HasIssues || step2HasIssues || step3HasIssues;

                          return (
                            <div className="space-y-8">
                              {/* Step Indicator */}
                              <div className="flex items-center justify-between px-4 py-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                {[1, 2, 3].map((step) => (
                                  <div 
                                    key={step} 
                                    className={`flex flex-col items-center gap-2 flex-1 relative ${step < currentStep ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                                    onClick={async () => {
                                      if (step < currentStep) {
                                        if (currentStep === 3) {
                                          setBackupLineup(JSON.parse(JSON.stringify(game.lineup || {})));
                                          setBackupScrimmageGroups(JSON.parse(JSON.stringify(game.scrimmageGroups || [])));
                                        }
                                        await updateDoc(doc(db, 'games', game.id), { scrimmageStep: step });
                                        setGames(prevGames => prevGames.map(g => g.id === game.id ? {...g, scrimmageStep: step} : g));
                                      }
                                    }}
                                  >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black z-10 transition-all relative ${
                                      currentStep >= step 
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600'
                                    }`}>
                                      {step}
                                      {((step === 1 && step1HasIssues) || (step === 2 && step2HasIssues) || (step === 3 && step3HasIssues)) && (
                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center">
                                          <AlertCircle size={10} className="text-white" />
                                        </div>
                                      )}
                                    </div>
                                    <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${
                                      currentStep >= step ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-600'
                                    }`}>
                                      {step === 1 ? 'Pitchers/Catchers' : step === 2 ? 'Groups' : 'Final Lineup'}
                                    </span>
                                    {step < 3 && (
                                      <div className={`absolute top-5 left-1/2 w-full h-[2px] -z-0 ${
                                        currentStep > step ? 'bg-indigo-600' : 'bg-slate-100 dark:bg-slate-800'
                                      }`} />
                                    )}
                                  </div>
                                ))}
                              </div>

                              {currentStep === 1 && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                      <div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Step 1: Pitcher & Catcher Selection</h3>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Assign your batteries for all 6 innings</p>
                                      </div>
                                      <div className="flex flex-col sm:flex-row gap-3">
                                        <button
                                          onClick={() => handleGenerateBatteries(selectedGameId)}
                                          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                                        >
                                          <RefreshCw size={14} />
                                          Generate Batteries
                                        </button>
                                        {(backupLineup || backupScrimmageGroups) && (
                                          <button
                                            onClick={async () => {
                                              if (backupLineup || backupScrimmageGroups) {
                                                const updates: any = { scrimmageStep: 3 };
                                                if (backupLineup) updates.lineup = backupLineup;
                                                if (backupScrimmageGroups) updates.scrimmageGroups = JSON.stringify(backupScrimmageGroups);
                                                await updateDoc(doc(db, 'games', game.id), updates);
                                                setGames(prevGames => prevGames.map(g => g.id === game.id ? {...g, scrimmageStep: 3, lineup: backupLineup || g.lineup, scrimmageGroups: backupScrimmageGroups || g.scrimmageGroups} : g));
                                                setBackupLineup(null);
                                                setBackupScrimmageGroups(null);
                                              }
                                            }}
                                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                                          >
                                            Cancel
                                          </button>
                                        )}
                                        <button
                                          onClick={async () => {
                                            if (game.scrimmageGroups && game.scrimmageGroups.length > 0) {
                                              await updateDoc(doc(db, 'games', game.id), { scrimmageStep: 2 });
                                              setGames(prevGames => prevGames.map(g => g.id === game.id ? {...g, scrimmageStep: 2} : g));
                                            } else {
                                              handleSplitScrimmageGroups(selectedGameId);
                                            }
                                          }}
                                          className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl ${
                                            hasOutPlayersInBatteries 
                                              ? 'bg-amber-500 hover:bg-amber-400 text-white shadow-amber-500/20 ring-4 ring-amber-500/20' 
                                              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                                          }`}
                                        >
                                          {hasOutPlayersInBatteries && <AlertCircle size={16} />}
                                          Next: Group Players
                                          <ChevronRight size={16} />
                                        </button>
                                      </div>
                                    </div>
                                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                      {[1, 2, 3, 4, 5, 6].map(inning => {
                                        const inningKey = inning.toString();
                                        const hasInningError = fieldPositions.some(pos => {
                                          const playerId = game.lineup?.[inningKey]?.[pos];
                                          return playerId && game.rsvps[playerId] === RSVPStatus.NO;
                                        });

                                        return (
                                          <div key={inning} className={`rounded-2xl p-4 border transition-all ${
                                            hasInningError 
                                              ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 ring-1 ring-amber-200 dark:ring-amber-800' 
                                              : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'
                                          }`}>
                                            <div className="flex items-center justify-between mb-4">
                                              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Inning {inning}</h4>
                                              {hasInningError && (
                                                <div className="flex items-center gap-2">
                                                  <div className="flex items-center gap-1 text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                                                    <AlertCircle size={12} />
                                                    Player Out
                                                  </div>
                                                  <button
                                                    onClick={() => handleFixInningBatteries(selectedGameId, inningKey)}
                                                    className="flex items-center gap-1 px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-sm"
                                                  >
                                                    <RotateCcw size={10} />
                                                    Fix
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                            <div className="space-y-3">
                                              {fieldPositions.map(pos => {
                                                const playerId = game.lineup?.[inningKey]?.[pos];
                                                const player = players.find(p => p.id === playerId);
                                                const isEditing = editingCell?.inning === inningKey && editingCell?.position === pos;
                                                const isPlayerOut = playerId && game.rsvps[playerId] === RSVPStatus.NO;

                                                return (
                                                  <div key={pos} className="flex items-center justify-between relative">
                                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{pos}</span>
                                                    {isEditing && (
                                                      <>
                                                        <div 
                                                          className="fixed inset-0 z-[55]" 
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingCell(null);
                                                          }} 
                                                        />
                                                        <div className="absolute z-[60] top-full right-0 mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-2 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                                                          <button
                                                            onClick={() => handleUpdateLineupCell(selectedGameId, inningKey, pos, '')}
                                                            className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 italic transition-colors"
                                                          >
                                                            — Empty —
                                                          </button>
                                                          {players.filter(p => game.rsvps[p.id] !== RSVPStatus.NO).sort((a, b) => a.name.localeCompare(b.name)).map(p => (
                                                            <button
                                                              key={p.id}
                                                              onClick={() => handleUpdateLineupCell(selectedGameId, inningKey, pos, p.id)}
                                                              className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between transition-colors"
                                                            >
                                                              <span>
                                                                {p.name}
                                                                {p.jerseyNumber && (
                                                                  <span className="text-[10px] opacity-50 ml-1">#{p.jerseyNumber}</span>
                                                                )}
                                                              </span>
                                                            </button>
                                                          ))}
                                                        </div>
                                                      </>
                                                    )}
                                                    <button
                                                      onClick={() => setEditingCell({ inning: inningKey, position: pos })}
                                                      className={`inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold transition-all min-w-[120px] border ${
                                                        isEditing 
                                                          ? 'ring-2 ring-slate-900 border-slate-900' 
                                                          : isPlayerOut
                                                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-200 dark:hover:bg-amber-900/50'
                                                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-100 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700'
                                                      }`}
                                                    >
                                                      {player ? (
                                                        <span className="flex items-center gap-1">
                                                          {isPlayerOut && <AlertCircle size={12} />}
                                                          {player.name}
                                                          {player.jerseyNumber && (
                                                            <span className="opacity-50 ml-1">#{player.jerseyNumber}</span>
                                                          )}
                                                        </span>
                                                      ) : (
                                                        <span className="text-slate-300 italic">Empty</span>
                                                      )}
                                                    </button>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {currentStep === 2 && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 gap-4">
                                    <div>
                                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">Step 2: Group Players</h3>
                                      {step2HasIssues && (
                                        <div className="flex items-center gap-1 text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mt-1">
                                          <AlertCircle size={12} />
                                          Some players in groups are marked as 'Out'
                                        </div>
                                      )}
                                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Review groups and move players if needed</p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                      {(backupLineup || backupScrimmageGroups) && (
                                        <button
                                          onClick={async () => {
                                            if (backupLineup || backupScrimmageGroups) {
                                              const updates: any = { scrimmageStep: 3 };
                                              if (backupLineup) updates.lineup = backupLineup;
                                              if (backupScrimmageGroups) updates.scrimmageGroups = JSON.stringify(backupScrimmageGroups);
                                              await updateDoc(doc(db, 'games', game.id), updates);
                                              setGames(prevGames => prevGames.map(g => g.id === game.id ? {...g, scrimmageStep: 3, lineup: backupLineup || g.lineup, scrimmageGroups: backupScrimmageGroups || g.scrimmageGroups} : g));
                                              setBackupLineup(null);
                                              setBackupScrimmageGroups(null);
                                            }
                                          }}
                                          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                                        >
                                          Cancel
                                        </button>
                                      )}
                                      <button
                                        onClick={() => handleSplitScrimmageGroups(selectedGameId)}
                                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                                      >
                                        <RefreshCw size={14} />
                                        Reshuffle
                                      </button>
                                      <button
                                        onClick={() => {
                                          setBackupLineup(null);
                                          setBackupScrimmageGroups(null);
                                          handleGenerateScrimmageLineup(selectedGameId);
                                        }}
                                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20"
                                      >
                                        Generate Final Lineup
                                        <ChevronRight size={16} />
                                      </button>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {[0, 1, 2, 3].map(groupIndex => (
                                      <div key={groupIndex} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                        <div className="flex items-center justify-between mb-4">
                                          <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Group {groupIndex + 1}</h4>
                                          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                            {game.scrimmageGroups?.[groupIndex]?.length || 0} Players
                                          </span>
                                        </div>
                                        <div className="space-y-2">
                                          {game.scrimmageGroups?.[groupIndex]?.map(playerId => {
                                            const player = players.find(p => p.id === playerId);
                                            const isPlayerOut = game.rsvps[playerId] === RSVPStatus.NO;
                                            return (
                                              <div key={playerId} className={`group/player p-3 rounded-xl border text-sm font-bold flex items-center justify-between transition-all ${
                                                isPlayerOut 
                                                  ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300' 
                                                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                              }`}>
                                                <span className="flex items-center gap-2">
                                                  {isPlayerOut && <AlertCircle size={14} />}
                                                  {player?.name}
                                                  {player?.jerseyNumber && (
                                                    <span className="text-[10px] opacity-50 ml-1">#{player.jerseyNumber}</span>
                                                  )}
                                                </span>
                                                <div className="flex gap-1 opacity-0 group-hover/player:opacity-100 transition-opacity">
                                                  {[0, 1, 2, 3].filter(idx => idx !== groupIndex).map(targetIdx => (
                                                    <button
                                                      key={targetIdx}
                                                      onClick={() => handleMoveScrimmagePlayer(game.id, groupIndex, targetIdx, playerId)}
                                                      className="w-6 h-6 flex items-center justify-center bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md text-[10px] font-black text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                                      title={`Move to Group ${targetIdx + 1}`}
                                                    >
                                                      {targetIdx + 1}
                                                    </button>
                                                  ))}
                                                </div>
                                              </div>
                                            );
                                          })}
                                          {(!game.scrimmageGroups?.[groupIndex] || game.scrimmageGroups[groupIndex].length === 0) && (
                                            <p className="text-xs text-slate-400 italic text-center py-4">No players assigned</p>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {currentStep === 3 && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 gap-4">
                                    <div>
                                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">Step 3: Final Scrimmage Lineup</h3>
                                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">One group hits each inning. Extra hitters are listed below.</p>
                                    </div>
                                    {!game.isLocked && (
                                      <div className="flex flex-col sm:flex-row gap-3">
                                        {(() => {
                                          const hasOutPlayers = Object.values(game.lineup || {}).some(inning => 
                                            Object.values(inning).some(playerId => playerId && game.rsvps[playerId as string] === RSVPStatus.NO)
                                          );
                                          const availablePlayers = players.filter(p => game.rsvps[p.id] === RSVPStatus.YES || game.rsvps[p.id] === RSVPStatus.TENTATIVE);
                                          const assignedPlayerIds = new Set();
                                          Object.values(game.lineup || {}).forEach(inning => {
                                            Object.entries(inning).forEach(([pos, id]) => {
                                              if (pos !== 'HittingGroup' && id) assignedPlayerIds.add(id);
                                            });
                                          });
                                          const hasBenchedAvailable = availablePlayers.some(p => !assignedPlayerIds.has(p.id));
                                          const hasBackToBackBenches = availablePlayers.some(p => {
                                            const isBenched = (inning: number) => {
                                              const lineup = game.lineup?.[inning.toString()] || {};
                                              const assigned = Object.entries(lineup)
                                                .filter(([k]) => k !== 'HittingGroup')
                                                .map(([_, id]) => id);
                                              const hittingGroupIdx = lineup['HittingGroup'];
                                              const hittingGroupIds = hittingGroupIdx != null && game.scrimmageGroups?.[parseInt(hittingGroupIdx)]
                                                ? game.scrimmageGroups[parseInt(hittingGroupIdx)]
                                                : [];
                                              return !assigned.includes(p.id) && !hittingGroupIds.includes(p.id);
                                            };
                                            for (let i = 1; i <= 5; i++) {
                                              if (isBenched(i) && isBenched(i+1)) return true;
                                            }
                                            return false;
                                          });
                                          const hasDuplicates = Object.values(game.lineup || {}).some(inning => {
                                            const ids = Object.entries(inning)
                                              .filter(([k]) => k !== 'HittingGroup')
                                              .map(([_, id]) => id)
                                              .filter(id => id);
                                            return new Set(ids).size !== ids.length;
                                          });

                                          if (hasOutPlayers || hasBenchedAvailable || hasBackToBackBenches || hasDuplicates) {
                                            return (
                                              <button
                                                onClick={() => handleFixLineup(selectedGameId)}
                                                className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-black uppercase tracking-widest border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-all"
                                                title="Replace 'Out' players, work in 'Activated' players, resolve back-to-back benches, and fix duplicates"
                                              >
                                                <Wrench size={14} />
                                                Fix Lineup
                                              </button>
                                            );
                                          }
                                          return null;
                                        })()}
                                        <button
                                          onClick={async () => {
                                            setBackupLineup(JSON.parse(JSON.stringify(game.lineup || {})));
                                            setBackupScrimmageGroups(JSON.parse(JSON.stringify(game.scrimmageGroups || [])));
                                            await updateDoc(doc(db, 'games', game.id), { scrimmageStep: 1 });
                                            setGames(prevGames => prevGames.map(g => g.id === game.id ? {...g, scrimmageStep: 1} : g));
                                          }}
                                          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                                        >
                                          <RotateCcw size={14} />
                                          Start Over
                                        </button>
                                        <button
                                          onClick={() => handleGenerateScrimmageLineup(selectedGameId)}
                                          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                                        >
                                          <RefreshCw size={14} />
                                          Regenerate
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                                    <div className="overflow-x-auto">
                                      <table className="w-full border-collapse">
                                        <thead>
                                          <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                                            <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">Position</th>
                                            {[1, 2, 3, 4, 5, 6].map(inning => (
                                              <th key={inning} className="text-center py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">Inning {inning}</th>
                                            ))}
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                          {/* Field Positions */}
                                          {[
                                            "Pitcher", "Catcher", "First Base", "Second Base", "Third Base", 
                                            "Shortstop", "Left Field", "Center Field", "Right Field"
                                          ].map(pos => (
                                            <tr key={pos} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                              <td className="py-4 px-6 font-black text-slate-900 dark:text-slate-200 text-sm">
                                                <div className="flex items-center gap-3">
                                                  <span className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-[10px] text-slate-500 dark:text-slate-400 font-black">
                                                    {getPositionAbbreviation(pos)}
                                                  </span>
                                                  {pos}
                                                </div>
                                              </td>
                                              {[1, 2, 3, 4, 5, 6].map(inning => {
                                                const inningKey = inning.toString();
                                                const playerId = game.lineup?.[inningKey]?.[pos];
                                                const player = players.find(p => p.id === playerId);
                                                const isOut = playerId && game.rsvps[playerId] === RSVPStatus.NO;
                                                
                                                // Check for duplicates in this inning
                                                const inningLineup = game.lineup?.[inningKey] || {};
                                                const playerIdsInInning = Object.entries(inningLineup)
                                                  .filter(([k]) => k !== 'HittingGroup')
                                                  .map(([_, id]) => id);
                                                const isDuplicate = playerId && playerIdsInInning.filter(id => id === playerId).length > 1;
                                                
                                                const isEditing = editingCell?.inning === inningKey && editingCell?.position === pos;

                                                // Hitting group for this inning
                                                const hittingGroupIdx = game.lineup?.[inningKey]?.['HittingGroup'];
                                                const hittingGroupIds = hittingGroupIdx != null && game.scrimmageGroups?.[parseInt(hittingGroupIdx)]
                                                  ? game.scrimmageGroups[parseInt(hittingGroupIdx)]
                                                  : [];

                                                return (
                                                  <td key={inning} className="py-4 px-4 text-center relative">
                                                    {isEditing && (
                                                      <>
                                                        <div 
                                                          className="fixed inset-0 z-[55]" 
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingCell(null);
                                                          }} 
                                                        />
                                                        <div className="absolute z-[60] top-full left-1/2 -translate-x-1/2 mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-2 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                                                          <div className="px-3 py-2 border-b border-slate-50 dark:border-slate-700 mb-1">
                                                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Select Player</p>
                                                          </div>
                                                          <button
                                                            onClick={() => handleUpdateLineupCell(selectedGameId, inningKey, pos, '')}
                                                            className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 italic transition-colors"
                                                          >
                                                            — Empty —
                                                          </button>
                                                          {(() => {
                                                            const assignedElsewhere = Object.entries(inningLineup)
                                                              .filter(([pPos, _]) => pPos !== pos && pPos !== 'HittingGroup')
                                                              .map(([_, pId]) => pId);
                                                            
                                                            const isDark = darkMode;

                                                            return players
                                                              .sort((a, b) => a.name.localeCompare(b.name))
                                                              .map(p => {
                                                                const isCurrent = p.id === playerId;
                                                                const isAssignedElsewhere = !isCurrent && assignedElsewhere.includes(p.id);
                                                                const isPlayerOut = game.rsvps[p.id] === RSVPStatus.NO;
                                                                const isHitting = hittingGroupIds.includes(p.id);
                                                                
                                                                let statusLabel = 'Bench';
                                                                let statusColor = isDark ? '#34d399' : '#059669'; // Emerald-400 : Emerald-600
                                                                let statusBg = isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600';

                                                                if (isPlayerOut) {
                                                                  statusLabel = 'OUT';
                                                                  statusColor = isDark ? '#fb7185' : '#f43f5e'; // Rose-400 : Rose-500
                                                                  statusBg = isDark ? 'bg-rose-900/30 text-rose-400' : 'bg-rose-50 text-rose-500';
                                                                } else if (isHitting) {
                                                                  statusLabel = 'Hitting';
                                                                  statusColor = isDark ? '#818cf8' : '#4f46e5'; // Indigo-400 : Indigo-600
                                                                  statusBg = isDark ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-50 text-indigo-600';
                                                                } else if (isCurrent) {
                                                                  statusLabel = 'Current';
                                                                  statusColor = isDark ? '#60a5fa' : '#2563eb'; // Blue-400 : Blue-600
                                                                  statusBg = isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600';
                                                                } else if (isAssignedElsewhere) {
                                                                  statusLabel = 'Field';
                                                                  statusColor = isDark ? '#64748b' : '#94a3b8'; // Slate-500 : Slate-400
                                                                  statusBg = isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400';
                                                                }

                                                                return (
                                                                  <button
                                                                    key={p.id}
                                                                    onClick={() => {
                                                                      if (!isHitting) {
                                                                        handleUpdateLineupCell(selectedGameId, inningKey, pos, p.id);
                                                                      }
                                                                    }}
                                                                    disabled={isHitting}
                                                                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors group/item ${
                                                                      isHitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                                                                    }`}
                                                                    style={{ color: statusColor }}
                                                                  >
                                                                    <span>
                                                                      {p.name}
                                                                    </span>
                                                                    <span className={`text-[8px] uppercase px-1.5 py-0.5 rounded-md ${statusBg}`}>
                                                                      {statusLabel}
                                                                    </span>
                                                                  </button>
                                                                );
                                                              });
                                                          })()}
                                                        </div>
                                                      </>
                                                    )}
                                                    
                                                    <button
                                                      onClick={() => setEditingCell({ inning: inningKey, position: pos })}
                                                      className={`inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold transition-all min-w-[100px] border ${
                                                        isOut
                                                          ? 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-200'
                                                          : isDuplicate
                                                            ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-sm shadow-rose-100'
                                                            : 'bg-white text-slate-700 border border-slate-100 shadow-sm hover:border-slate-200 hover:bg-slate-50'
                                                      } ${isEditing ? 'ring-2 ring-slate-900 border-slate-900' : ''}`}
                                                    >
                                                      {player ? (
                                                        <span>
                                                          {player.name}
                                                        </span>
                                                      ) : (
                                                        <span className="text-slate-300 italic">Empty</span>
                                                      )}
                                                      {isOut && <AlertCircle size={12} className="ml-2" />}
                                                    </button>
                                                  </td>
                                                );
                                              })}
                                            </tr>
                                          ))}
                                          {/* Hitting Group Row */}
                                          <tr className="bg-indigo-50/30 dark:bg-indigo-900/10">
                                            <td className="py-4 px-6 font-black text-indigo-600 dark:text-indigo-400 text-xs uppercase tracking-widest">Hitting Group</td>
                                            {[1, 2, 3, 4, 5, 6].map(inning => {
                                              const hittingGroupIdx = game.lineup?.[inning.toString()]?.['HittingGroup'];
                                              const groupPlayers = hittingGroupIdx != null && game.scrimmageGroups?.[parseInt(hittingGroupIdx)]
                                                ? game.scrimmageGroups[parseInt(hittingGroupIdx)].map(id => {
                                                    const p = players.find(p => p.id === id);
                                                    return p ? `${p.name}` : null;
                                                  }).filter(Boolean)
                                                : [];
                                              return (
                                                <td key={inning} className="py-4 px-6 text-center">
                                                  <div className="flex flex-col gap-1 items-center">
                                                    <span className="px-3 py-1 bg-indigo-600 text-white rounded-full text-[10px] font-black mb-1">
                                                      Group {hittingGroupIdx != null ? parseInt(hittingGroupIdx) + 1 : '?'}
                                                    </span>
                                                    {groupPlayers.map((name, i) => (
                                                      <span key={i} className="text-[9px] font-bold text-indigo-700 dark:text-indigo-300">
                                                        {name}
                                                      </span>
                                                    ))}
                                                  </div>
                                                </td>
                                              );
                                            })}
                                          </tr>
                                          {/* Extra Hitters */}
                                          {(() => {
                                            const maxExtraHitters = Math.max(
                                              0,
                                              ...[1, 2, 3, 4, 5, 6].map(inning => {
                                                const lineup = game.lineup?.[inning.toString()] || {};
                                                return Object.keys(lineup).filter(k => k.startsWith('Extra Hitter')).length;
                                              })
                                            );
                                            
                                            if (maxExtraHitters === 0) return null;
                                            
                                            return Array.from({ length: maxExtraHitters }, (_, i) => `Extra Hitter ${i + 1}`).map(pos => (
                                              <tr key={pos} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="py-4 px-6 font-black text-slate-900 dark:text-slate-200 text-sm">
                                                  <div className="flex items-center gap-3">
                                                    <span className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-[10px] text-slate-500 dark:text-slate-400 font-black">
                                                      EH
                                                    </span>
                                                    {pos}
                                                  </div>
                                                </td>
                                                {[1, 2, 3, 4, 5, 6].map(inning => {
                                                  const inningKey = inning.toString();
                                                  const playerId = game.lineup?.[inningKey]?.[pos];
                                                  const player = players.find(p => p.id === playerId);
                                                  const isOut = playerId && game.rsvps[playerId] === RSVPStatus.NO;
                                                  
                                                  // Check for duplicates in this inning
                                                  const inningLineup = game.lineup?.[inningKey] || {};
                                                  const playerIdsInInning = Object.entries(inningLineup)
                                                    .filter(([k]) => k !== 'HittingGroup')
                                                    .map(([_, id]) => id);
                                                  const isDuplicate = playerId && playerIdsInInning.filter(id => id === playerId).length > 1;
                                                  
                                                  const isEditing = editingCell?.inning === inningKey && editingCell?.position === pos;

                                                  // Hitting group for this inning
                                                  const hittingGroupIdx = game.lineup?.[inningKey]?.['HittingGroup'];
                                                  const hittingGroupIds = hittingGroupIdx != null && game.scrimmageGroups?.[parseInt(hittingGroupIdx)]
                                                    ? game.scrimmageGroups[parseInt(hittingGroupIdx)]
                                                    : [];

                                                  return (
                                                    <td key={inning} className="py-4 px-4 text-center relative">
                                                      {isEditing && (
                                                        <>
                                                          <div 
                                                            className="fixed inset-0 z-[55]" 
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              setEditingCell(null);
                                                            }} 
                                                          />
                                                          <div className="absolute z-[60] top-full left-1/2 -translate-x-1/2 mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-2 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                                                            <div className="px-3 py-2 border-b border-slate-50 dark:border-slate-700 mb-1">
                                                              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Select Player</p>
                                                            </div>
                                                            <button
                                                              onClick={() => handleUpdateLineupCell(selectedGameId, inningKey, pos, '')}
                                                              className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 italic transition-colors"
                                                            >
                                                              — Empty —
                                                            </button>
                                                            {(() => {
                                                              const assignedElsewhere = Object.entries(inningLineup)
                                                                .filter(([pPos, _]) => pPos !== pos && pPos !== 'HittingGroup')
                                                                .map(([_, pId]) => pId);
                                                              
                                                              const isDark = darkMode;

                                                              return players
                                                                .sort((a, b) => a.name.localeCompare(b.name))
                                                                .map(p => {
                                                                  const isCurrent = p.id === playerId;
                                                                  const isAssignedElsewhere = !isCurrent && assignedElsewhere.includes(p.id);
                                                                  const isPlayerOut = game.rsvps[p.id] === RSVPStatus.NO;
                                                                  const isHitting = hittingGroupIds.includes(p.id);
                                                                  
                                                                  let statusLabel = 'Bench';
                                                                  let statusColor = isDark ? '#34d399' : '#059669'; // Emerald-400 : Emerald-600
                                                                  let statusBg = isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600';

                                                                  if (isPlayerOut) {
                                                                    statusLabel = 'OUT';
                                                                    statusColor = isDark ? '#fb7185' : '#f43f5e'; // Rose-400 : Rose-500
                                                                    statusBg = isDark ? 'bg-rose-900/30 text-rose-400' : 'bg-rose-50 text-rose-500';
                                                                  } else if (isHitting) {
                                                                    statusLabel = 'Hitting';
                                                                    statusColor = isDark ? '#818cf8' : '#4f46e5'; // Indigo-400 : Indigo-600
                                                                    statusBg = isDark ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-50 text-indigo-600';
                                                                  } else if (isCurrent) {
                                                                    statusLabel = 'Current';
                                                                    statusColor = isDark ? '#60a5fa' : '#2563eb'; // Blue-400 : Blue-600
                                                                    statusBg = isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600';
                                                                  } else if (isAssignedElsewhere) {
                                                                    statusLabel = 'Field';
                                                                    statusColor = isDark ? '#64748b' : '#94a3b8'; // Slate-500 : Slate-400
                                                                    statusBg = isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400';
                                                                  }

                                                                  return (
                                                                    <button
                                                                      key={p.id}
                                                                      onClick={() => {
                                                                        if (!isHitting) {
                                                                          handleUpdateLineupCell(selectedGameId, inningKey, pos, p.id);
                                                                        }
                                                                      }}
                                                                      disabled={isHitting}
                                                                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors group/item ${
                                                                        isHitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                                                                      }`}
                                                                      style={{ color: statusColor }}
                                                                    >
                                                                      <span>
                                                                        {p.name}

                                                                      </span>
                                                                      <span className={`text-[8px] uppercase px-1.5 py-0.5 rounded-md ${statusBg}`}>
                                                                        {statusLabel}
                                                                      </span>
                                                                    </button>
                                                                  );
                                                                });
                                                            })()}
                                                          </div>
                                                        </>
                                                      )}
                                                      
                                                      <button
                                                        onClick={() => setEditingCell({ inning: inningKey, position: pos })}
                                                        className={`inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold transition-all min-w-[100px] border ${
                                                          isOut
                                                            ? 'bg-rose-500 text-white border-rose-600 shadow-md shadow-rose-200'
                                                            : isDuplicate
                                                              ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-sm shadow-rose-100'
                                                              : 'bg-white text-slate-700 border border-slate-100 shadow-sm hover:border-slate-200 hover:bg-slate-50'
                                                        } ${isEditing ? 'ring-2 ring-slate-900 border-slate-900' : ''}`}
                                                      >
                                                        {player ? (
                                                          <span>
                                                            {player.name}
                                                          </span>
                                                        ) : (
                                                          <span className="text-slate-300 italic">Empty</span>
                                                        )}
                                                        {isOut && <AlertCircle size={12} className="ml-2" />}
                                                      </button>
                                                    </td>
                                                  );
                                                })}
                                              </tr>
                                            ));
                                          })()}
                                          {/* Bench Row */}
                                          <tr className="bg-slate-50/30 dark:bg-slate-800/30">
                                            <td className="py-5 px-6 font-black text-slate-400 dark:text-slate-500 text-sm uppercase tracking-widest">Bench</td>
                                            {[1, 2, 3, 4, 5, 6].map(inning => {
                                              const inningKey = inning.toString();
                                              const inningLineup = game.lineup?.[inningKey] || {};
                                              
                                              const assignedIds = Object.entries(inningLineup)
                                                .filter(([k]) => k !== 'HittingGroup')
                                                .map(([_, id]) => id);
                                                
                                              const hittingGroupIdx = inningLineup['HittingGroup'];
                                              const hittingGroupIds = hittingGroupIdx != null && game.scrimmageGroups?.[parseInt(hittingGroupIdx)]
                                                ? game.scrimmageGroups[parseInt(hittingGroupIdx)]
                                                : [];
                                                
                                              const benchedPlayers = players.filter(p => 
                                                game.rsvps[p.id] !== RSVPStatus.NO && 
                                                !assignedIds.includes(p.id) &&
                                                !hittingGroupIds.includes(p.id)
                                              );
                                              
                                              const isBackToBackBench = (playerId: string, currentInning: number) => {
                                                const isBenched = (inning: number) => {
                                                  if (inning < 1 || inning > 6) return false;
                                                  const lineup = game.lineup?.[inning.toString()] || {};
                                                  const assigned = Object.entries(lineup)
                                                    .filter(([k]) => k !== 'HittingGroup')
                                                    .map(([_, id]) => id);
                                                  const hittingGroupIdx = lineup['HittingGroup'];
                                                  const hittingGroupIds = hittingGroupIdx != null && game.scrimmageGroups?.[parseInt(hittingGroupIdx)]
                                                    ? game.scrimmageGroups[parseInt(hittingGroupIdx)]
                                                    : [];
                                                  return !assigned.includes(playerId) && !hittingGroupIds.includes(playerId);
                                                };
                                                
                                                if (!isBenched(currentInning)) return false;
                                                return isBenched(currentInning - 1) || isBenched(currentInning + 1);
                                              };

                                              return (
                                                <td key={inning} className="py-4 px-4 text-center">
                                                  <div className="flex flex-col gap-1">
                                                    {benchedPlayers.length > 0 ? benchedPlayers.map(p => {
                                                      const isBTB = isBackToBackBench(p.id, inning);
                                                      return (
                                                        <div 
                                                          key={p.id} 
                                                          className={`text-[10px] font-black truncate max-w-[80px] mx-auto uppercase tracking-tighter ${
                                                            isBTB ? 'text-rose-500 flex items-center justify-center gap-0.5' : 'text-slate-400 dark:text-slate-500'
                                                          }`}
                                                          title={isBTB ? "Back-to-back benching detected" : ""}
                                                        >
                                                          {isBTB && <AlertCircle size={8} />}
                                                          <span>{p.name.split(' ')[0]}</span>
                                                        </div>
                                                      );
                                                    }) : (
                                                      <span className="text-slate-300 dark:text-slate-700">—</span>
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
                                </div>
                              )}
                            </div>
                          );
                        }

                        const fieldPositions = [
                          "Pitcher", "Catcher", "First Base", "Second Base", "Third Base", 
                          "Shortstop", "Left Field", "Center Field", "Right Field"
                        ];

                        return (
                          <div className="space-y-6">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Field Lineup</h3>
                                {isLocked && (
                                  <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded text-[10px] font-bold uppercase tracking-wider">
                                    <Check size={10} />
                                    Published
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {(() => {
                                  if (!game.lineup || Object.keys(game.lineup).length === 0) return null;
                                  
                                  const hasOutPlayers = Object.values(game.lineup).some(inning => 
                                    Object.values(inning).some(playerId => playerId && game.rsvps[playerId as string] === RSVPStatus.NO)
                                  );

                                  const availablePlayers = players.filter(p => game.rsvps[p.id] === RSVPStatus.YES || game.rsvps[p.id] === RSVPStatus.TENTATIVE);
                                  const assignedPlayerIds = new Set();
                                  Object.values(game.lineup).forEach(inning => {
                                    Object.values(inning).forEach(id => {
                                      if (id) assignedPlayerIds.add(id);
                                    });
                                  });
                                  const hasBenchedAvailable = availablePlayers.some(p => !assignedPlayerIds.has(p.id));

                                  const hasBackToBackBenches = availablePlayers.some(p => {
                                    const isBenched = (inning: number) => !Object.values(game.lineup?.[inning.toString()] || {}).includes(p.id);
                                    for (let i = 1; i <= 5; i++) {
                                      if (isBenched(i) && isBenched(i+1)) return true;
                                    }
                                    return false;
                                  });

                                  const hasDuplicates = Object.values(game.lineup || {}).some(inning => {
                                    const ids = Object.entries(inning)
                                      .filter(([k]) => k !== 'HittingGroup')
                                      .map(([_, id]) => id)
                                      .filter(id => id);
                                    return new Set(ids).size !== ids.length;
                                  });

                                  if (hasOutPlayers || hasBenchedAvailable || hasBackToBackBenches || hasDuplicates) {
                                    return (
                                      <button
                                        onClick={() => handleFixLineup(selectedGameId)}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg text-xs font-bold hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors border border-amber-200/50 dark:border-amber-800/50"
                                        title="Replace 'Out' players, work in 'Activated' players, resolve back-to-back benches, and fix duplicates"
                                      >
                                        <Wrench size={14} />
                                        <span className="hidden sm:inline">Fix Lineup</span>
                                      </button>
                                    );
                                  }
                                  return null;
                                })()}
                                {!isLocked && (
                                  <>
                                    <button
                                      onClick={() => handleGenerateLineup(selectedGameId)}
                                      className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                                    >
                                      <RefreshCw size={14} />
                                      <span className="hidden sm:inline">Generate</span>
                                    </button>
                                    {game.lineup && Object.keys(game.lineup).length > 0 && (
                                      <button
                                        onClick={() => setShowClearLineupConfirm(true)}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
                                      >
                                        <Trash2 size={14} />
                                        <span className="hidden sm:inline">Clear</span>
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="overflow-hidden bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                              <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                  <thead>
                                    <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                                      <th className="text-left py-5 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">Position</th>
                                      {[1, 2, 3, 4, 5, 6].map(inning => (
                                        <th key={inning} className="text-center py-5 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
                                          <div className="flex flex-col items-center gap-2">
                                            <span className="text-slate-900 dark:text-slate-200">Inning {inning}</span>
                                            <button 
                                              onClick={() => handleToggleInningLock(selectedGameId, inning)}
                                              className={`p-1.5 rounded-lg transition-all ${game.lockedInnings?.includes(inning) ? 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 shadow-sm' : 'text-slate-300 dark:text-slate-600 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800'}`}
                                              title={game.lockedInnings?.includes(inning) ? "Unlock Inning" : "Lock Inning"}
                                            >
                                              {game.lockedInnings?.includes(inning) ? <Lock size={14} /> : <Unlock size={14} />}
                                            </button>
                                          </div>
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                  {fieldPositions.map(pos => (
                                    <tr key={pos} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                      <td className="py-5 px-6 font-black text-slate-900 dark:text-slate-200 text-sm">
                                        <div className="flex items-center gap-3">
                                          <button 
                                            onClick={() => handleTogglePositionLock(selectedGameId, pos)}
                                            className={`p-1.5 rounded-lg transition-all ${game.lockedPositions?.includes(pos) ? 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 shadow-sm' : 'text-slate-300 dark:text-slate-600 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800'}`}
                                            title={game.lockedPositions?.includes(pos) ? "Unlock Position" : "Lock Position"}
                                          >
                                            {game.lockedPositions?.includes(pos) ? <Lock size={14} /> : <Unlock size={14} />}
                                          </button>
                                          <span className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-[10px] text-slate-500 dark:text-slate-400 font-black">
                                            {getPositionAbbreviation(pos)}
                                          </span>
                                          {pos}
                                        </div>
                                      </td>
                                      {[1, 2, 3, 4, 5, 6].map(inning => {
                                        const inningKey = inning.toString();
                                        const playerId = game.lineup?.[inningKey]?.[pos];
                                        const player = players.find(p => p.id === playerId);
                                        const isLockedInning = game.lockedInnings?.includes(inning);
                                        const isOut = playerId && game.rsvps[playerId] === RSVPStatus.NO;
                                        
                                        // Check for duplicates in this inning
                                        const inningLineup = game.lineup?.[inningKey] || {};
                                        const playerIdsInInning = Object.values(inningLineup);
                                        const isDuplicate = playerId && playerIdsInInning.filter(id => id === playerId).length > 1;
                                        
                                        const isEditing = editingCell?.inning === inningKey && editingCell?.position === pos;

                                        return (
                                          <td key={inning} className="py-4 px-4 text-center relative">
                                          {isEditing && (
                                              <>
                                                <div 
                                                  className="fixed inset-0 z-[55]" 
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingCell(null);
                                                  }} 
                                                />
                                                <div className="absolute z-[60] top-full left-1/2 -translate-x-1/2 mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-2 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                                                  <div className="px-3 py-2 border-b border-slate-50 dark:border-slate-700 mb-1">
                                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Select Player</p>
                                                  </div>
                                                  <button
                                                    onClick={() => handleUpdateLineupCell(selectedGameId, inningKey, pos, '')}
                                                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 italic transition-colors"
                                                  >
                                                    — Empty —
                                                  </button>
                                                  {(() => {
                                                    const inningLineup = game.lineup?.[inningKey] || {};
                                                    const assignedElsewhere = Object.entries(inningLineup)
                                                      .filter(([pPos]) => pPos !== pos)
                                                      .map(([_, pId]) => pId);
                                                    
                                                    const isDark = darkMode;

                                                    return players
                                                      .sort((a, b) => a.name.localeCompare(b.name))
                                                      .map(p => {
                                                        const isCurrent = p.id === playerId;
                                                        const isAssignedElsewhere = !isCurrent && assignedElsewhere.includes(p.id);
                                                        const isPlayerOut = game.rsvps[p.id] === RSVPStatus.NO;
                                                        
                                                        let statusLabel = 'Bench';
                                                        let statusColor = isDark ? '#34d399' : '#059669'; // Emerald-400 : Emerald-600
                                                        let statusBg = isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600';

                                                        if (isPlayerOut) {
                                                          statusLabel = 'OUT';
                                                          statusColor = isDark ? '#fb7185' : '#f43f5e'; // Rose-400 : Rose-500
                                                          statusBg = isDark ? 'bg-rose-900/30 text-rose-400' : 'bg-rose-50 text-rose-500';
                                                        } else if (isCurrent) {
                                                          statusLabel = 'Current';
                                                          statusColor = isDark ? '#60a5fa' : '#2563eb'; // Blue-400 : Blue-600
                                                          statusBg = isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600';
                                                        } else if (isAssignedElsewhere) {
                                                          statusLabel = 'Field';
                                                          statusColor = isDark ? '#64748b' : '#94a3b8'; // Slate-500 : Slate-400
                                                          statusBg = isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400';
                                                        }

                                                        return (
                                                          <button
                                                            key={p.id}
                                                            onClick={() => handleUpdateLineupCell(selectedGameId, inningKey, pos, p.id)}
                                                            className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between transition-colors group/item"
                                                            style={{ color: statusColor }}
                                                          >
                                                            <span>
                                                              {p.name}
                                                              {p.jerseyNumber && (
                                                                <span className="text-[10px] opacity-50 ml-1">#{p.jerseyNumber}</span>
                                                              )}
                                                            </span>
                                                            <span className={`text-[8px] uppercase px-1.5 py-0.5 rounded-md ${statusBg}`}>
                                                              {statusLabel}
                                                            </span>
                                                          </button>
                                                        );
                                                      });
                                                  })()}
                                                </div>
                                              </>
                                            )}
                                            
                                            <button
                                              onClick={() => setEditingCell({ inning: inningKey, position: pos })}
                                              className={`inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold transition-all min-w-[100px] border ${
                                                isOut
                                                  ? 'bg-rose-500 text-white border-rose-600 shadow-md shadow-rose-200'
                                                  : isDuplicate
                                                    ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-sm shadow-rose-100'
                                                    : isLockedInning 
                                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                                      : 'bg-white text-slate-700 border border-slate-100 shadow-sm group-hover:border-slate-200 hover:bg-slate-50'
                                              } ${isEditing ? 'ring-2 ring-slate-900 border-slate-900' : ''}`}
                                            >
                                              {player ? (
                                                <span>
                                                  {player.name}
                                                  {player.jerseyNumber && (
                                                    <span className="opacity-50 ml-1">#{player.jerseyNumber}</span>
                                                  )}
                                                </span>
                                              ) : (
                                                <span className="text-slate-300 italic">Empty</span>
                                              )}
                                              {isOut && <AlertCircle size={12} className="ml-2" />}
                                            </button>
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  ))}
                                  <tr className="bg-slate-50/30">
                                    <td className="py-5 px-6 font-black text-slate-400 text-sm uppercase tracking-widest">Bench</td>
                                    {[1, 2, 3, 4, 5, 6].map(inning => {
                                      const assignedIds = Object.values(game.lineup?.[inning.toString()] || {});
                                      const benchedPlayers = players.filter(p => 
                                        game.rsvps[p.id] !== RSVPStatus.NO && 
                                        !assignedIds.includes(p.id)
                                      );

                                      const isBackToBackBench = (playerId: string, currentInning: number) => {
                                        const isBenched = (inning: number) => {
                                          if (inning < 1 || inning > 6) return false;
                                          const assigned = Object.values(game.lineup?.[inning.toString()] || {});
                                          return !assigned.includes(playerId);
                                        };
                                        
                                        if (!isBenched(currentInning)) return false;
                                        return isBenched(currentInning - 1) || isBenched(currentInning + 1);
                                      };

                                      return (
                                        <td key={inning} className="py-4 px-4 text-center">
                                          <div className="flex flex-col gap-1">
                                            {benchedPlayers.length > 0 ? benchedPlayers.map(p => {
                                              const isBTB = isBackToBackBench(p.id, inning);
                                              return (
                                                <div 
                                                  key={p.id} 
                                                  className={`text-[10px] font-black truncate max-w-[80px] mx-auto uppercase tracking-tighter ${
                                                    isBTB ? 'text-rose-500 flex items-center justify-center gap-0.5' : 'text-slate-400'
                                                  }`}
                                                  title={isBTB ? "Back-to-back benching detected" : ""}
                                                >
                                                  {isBTB && <AlertCircle size={8} />}
                                                  <span>{p.name.split(' ')[0]}</span>
                                                  {p.jerseyNumber && <span>#{p.jerseyNumber}</span>}
                                                </div>
                                              );
                                            }) : (
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
                      </div>
                    );
                  }
                })()}
              </div>
            </div>
          </>
        );
      })()}
              <div className="p-10 bg-slate-50 border-t border-slate-100 flex justify-center">
                <button 
                  onClick={() => navigate('/games')}
                  className="px-10 py-4 bg-white text-slate-900 border border-slate-200 rounded-2xl font-black hover:bg-slate-100 transition-all active:scale-[0.98] shadow-sm flex items-center gap-2 text-sm uppercase tracking-widest"
                >
                  <ChevronLeft size={18} />
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
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Add New Game</h2>
                      <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">Set player availability for this game</p>
                    </div>
                    <button 
                      onClick={() => navigate('/games')}
                      className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
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
                        onChange={(e) => {
                          setGameName(e.target.value);
                          if (e.target.value.trim()) setGameNameError(false);
                        }}
                        placeholder="e.g. May 20th - Vipers"
                        className={`w-full px-4 sm:px-6 py-3 sm:py-4 bg-white dark:bg-slate-800 border rounded-2xl focus:outline-none focus:ring-4 transition-all text-base sm:text-lg font-medium text-slate-900 dark:text-white ${
                          gameNameError 
                            ? 'border-red-500 focus:ring-red-500/10 focus:border-red-500' 
                            : 'border-slate-200 dark:border-slate-700 focus:ring-slate-900/5 dark:focus:ring-indigo-500/10 focus:border-slate-900 dark:focus:border-indigo-500'
                        }`}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Game Date</label>
                      <input 
                        type="date" 
                        value={gameDate}
                        onChange={(e) => setGameDate(e.target.value)}
                        className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-slate-900/5 dark:focus:ring-indigo-500/10 focus:border-slate-900 dark:focus:border-indigo-500 transition-all text-base sm:text-lg font-medium text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Game Time (Optional)</label>
                      <input 
                        type="time" 
                        value={gameTime}
                        onChange={(e) => setGameTime(e.target.value)}
                        className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-slate-900/5 dark:focus:ring-indigo-500/10 focus:border-slate-900 dark:focus:border-indigo-500 transition-all text-base sm:text-lg font-medium text-slate-900 dark:text-white"
                      />
                    </div>
                    {gameMode !== 'scrimmage' && (
                      <div className="space-y-2">
                        <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Home / Away</label>
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
                          <button
                            onClick={() => setIsHome(true)}
                            className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${isHome ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                          >
                            Home
                          </button>
                          <button
                            onClick={() => setIsHome(false)}
                            className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${!isHome ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                          >
                            Away
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 space-y-3">
                    <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Game Mode</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setGameMode('standard')}
                        className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                          gameMode === 'standard'
                            ? 'bg-slate-900 dark:bg-indigo-600 text-white border-slate-900 dark:border-indigo-600 shadow-lg shadow-slate-900/20 dark:shadow-indigo-600/20'
                            : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${gameMode === 'standard' ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700'}`}>
                          <ClipboardList size={18} />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-black uppercase tracking-tight">Standard</p>
                          <p className="text-[10px] opacity-70">Full lineup generation</p>
                        </div>
                      </button>
                      <button
                        onClick={() => setGameMode('scrimmage')}
                        className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                          gameMode === 'scrimmage'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20'
                            : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${gameMode === 'scrimmage' ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700'}`}>
                          <Users size={18} />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-black uppercase tracking-tight">Scrimmage</p>
                          <p className="text-[10px] opacity-70">Manual P/C & Groups</p>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:p-8">
                  <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="font-bold text-slate-900 dark:text-white">Player RSVP</h3>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{players.length} Total</span>
                  </div>

                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {[...players].sort((a, b) => a.name.localeCompare(b.name)).map((player) => (
                      <div key={player.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 transition-all gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-900 dark:text-white font-bold border border-slate-200 dark:border-slate-600 shrink-0">
                            {player.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white truncate">{player.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">{(player.positions || []).map(getPositionAbbreviation).join(', ')}</p>
                          </div>
                        </div>

                        <div className="flex bg-white dark:bg-slate-700 p-1 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm w-full sm:w-auto">
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
                                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
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

                <div className="p-6 sm:p-8 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <button 
                    onClick={handleCreateGame}
                    className="flex-1 py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-bold hover:bg-slate-800 dark:hover:bg-indigo-500 transition-all shadow-lg shadow-slate-900/20 dark:shadow-indigo-900/20 active:scale-[0.98]"
                  >
                    Add Game
                  </button>
                  <button 
                    onClick={() => navigate('/games')}
                    className="flex-1 py-4 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-[0.98]"
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
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 sticky top-24 transition-colors duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
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
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Player Name</label>
                        <input 
                          type="text" 
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          placeholder="e.g. Shohei Ohtani"
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-emerald-500/10 focus:border-slate-900 dark:focus:border-emerald-500 text-slate-900 dark:text-white transition-all"
                          required
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">#</label>
                        <input 
                          type="text" 
                          value={newJerseyNumber}
                          onChange={(e) => setNewJerseyNumber(e.target.value)}
                          placeholder="00"
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-emerald-500/10 focus:border-slate-900 dark:focus:border-emerald-500 text-slate-900 dark:text-white transition-all"
                        />
                      </div>
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
                      <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors duration-300">
                        {ALL_POSITIONS.map(pos => (
                          <label key={pos} className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 p-1 rounded transition-colors">
                            <input 
                              type="checkbox"
                              checked={newPositions.includes(pos)}
                              onChange={() => togglePosition(pos, false)}
                              className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-slate-900 dark:text-emerald-500 focus:ring-slate-900 dark:focus:ring-emerald-500 bg-white dark:bg-slate-900"
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-200">{pos} <span className="text-[10px] font-bold text-slate-400">({getPositionAbbreviation(pos)})</span></span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <button 
                      type="submit"
                      disabled={players.length >= 15}
                      className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                        players.length >= 15 
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed' 
                          : 'bg-slate-900 dark:bg-emerald-600 text-white hover:bg-slate-800 dark:hover:bg-emerald-500 shadow-md hover:shadow-lg active:scale-[0.98]'
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
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Team Roster</h2>
                  <span className="px-3 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-xs font-bold transition-colors duration-300">
                    {players.length} / 15 Players
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsAddingPlayer(!isAddingPlayer)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-sm font-semibold border ${
                      isAddingPlayer 
                        ? 'bg-slate-900 dark:bg-emerald-600 text-white border-slate-900 dark:border-emerald-600 shadow-md' 
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Plus size={18} />
                    {isAddingPlayer ? 'Cancel' : 'Add Player'}
                  </button>
                  <button 
                    onClick={startCreateLineup}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-sm font-semibold border border-slate-200 dark:border-slate-700"
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
                      className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center transition-colors duration-300"
                    >
                      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserIcon size={24} />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400">No players added yet. Start by adding your first player.</p>
                    </motion.div>
                  ) : (
                    [...players].sort((a, b) => a.name.localeCompare(b.name)).map((player, index) => (
                      <motion.div 
                        key={player.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between group hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                      >
                        {editingId === player.id ? (
                          <div className="flex-1 flex flex-col gap-3 mr-4">
                            <div className="grid grid-cols-3 gap-2">
                              <input 
                                type="text" 
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="col-span-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-slate-900 dark:focus:border-emerald-500 text-slate-900 dark:text-white"
                                placeholder="Name"
                              />
                              <input 
                                type="text" 
                                value={editJerseyNumber}
                                onChange={(e) => setEditJerseyNumber(e.target.value)}
                                className="col-span-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-slate-900 dark:focus:border-emerald-500 text-slate-900 dark:text-white"
                                placeholder="#"
                              />
                            </div>
                            <div className="flex items-center justify-between mb-1 px-1">
                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Positions</span>
                              <div className="flex gap-2">
                                <button 
                                  type="button"
                                  onClick={() => setEditPositions(ALL_POSITIONS)}
                                  className="text-[9px] font-bold text-slate-400 hover:text-slate-900 dark:hover:text-white uppercase transition-colors"
                                >
                                  All
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => setEditPositions([])}
                                  className="text-[9px] font-bold text-slate-400 hover:text-slate-900 dark:hover:text-white uppercase transition-colors"
                                >
                                  Clear
                                </button>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg max-h-32 overflow-y-auto">
                              {ALL_POSITIONS.map(pos => (
                                <label key={pos} className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 p-1 rounded transition-colors">
                                  <input 
                                    type="checkbox"
                                    checked={editPositions.includes(pos)}
                                    onChange={() => togglePosition(pos, true)}
                                    className="w-3 h-3 rounded border-slate-300 dark:border-slate-600 text-slate-900 dark:text-emerald-500 focus:ring-slate-900 dark:focus:ring-emerald-500 bg-white dark:bg-slate-900"
                                  />
                                  <span className="text-xs text-slate-600 dark:text-slate-300">{pos} <span className="text-[9px] font-bold text-slate-400">({getPositionAbbreviation(pos)})</span></span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 font-bold text-sm transition-colors duration-300">
                              {player.jerseyNumber || index + 1}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-slate-900 dark:text-white">{player.name}</h3>
                                {player.jerseyNumber && (
                                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500">#{player.jerseyNumber}</span>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {(player.positions || []).map(pos => (
                                  <span key={pos} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-[10px] font-bold uppercase tracking-wider transition-colors duration-300">
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
                                className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button 
                                onClick={() => handleDeletePlayer(player)}
                                className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-rose-500 hover:bg-red-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
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
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Game Schedule</h2>
                <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">Manage your {showPastGames ? 'past' : 'upcoming'} games and lineups</p>
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
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40' 
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
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
                      ? 'bg-slate-900 dark:bg-emerald-600 text-white border-slate-900 dark:border-emerald-600 shadow-lg shadow-slate-900/20 dark:shadow-none' 
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <History size={18} />
                  {showPastGames ? 'Showing Past' : 'Show Past'}
                </button>
                <button 
                  onClick={startCreateLineup}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 dark:bg-emerald-600 text-white rounded-2xl hover:bg-slate-800 dark:hover:bg-emerald-500 transition-all font-bold shadow-lg shadow-slate-900/20 dark:shadow-none active:scale-[0.95] flex-1 sm:flex-none"
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
                    <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-16 text-center transition-colors duration-300">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-3">
                        <ClipboardList size={28} className="sm:hidden" />
                        <ClipboardList size={32} className="hidden sm:block" />
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
                        <button 
                          onClick={startCreateLineup}
                          className="px-6 sm:px-8 py-3 bg-slate-900 dark:bg-emerald-600 text-white rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-emerald-500 transition-all w-full sm:w-auto shadow-lg shadow-slate-200 dark:shadow-none"
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
                      className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 hover:border-slate-900 dark:hover:border-emerald-500 hover:shadow-md transition-all group cursor-pointer"
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
                                <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded text-[10px] font-bold uppercase tracking-wider shrink-0">
                                  Scrimmage
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                              <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                                {gameDateObj.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric' })}
                              </span>
                              <span className="hidden sm:block w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
                              <div className="flex items-center gap-2">
                                {game.isLocked ? (
                                  <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded text-[10px] font-black uppercase tracking-widest border border-emerald-200 dark:border-emerald-800">
                                    Published
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                                    Draft
                                  </span>
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
                            <button 
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
                              className="p-2.5 sm:p-3 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl sm:rounded-2xl transition-all border border-transparent hover:border-rose-100 dark:hover:border-rose-900/30"
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
                          {`${window.location.origin}${window.location.pathname}#/shared/${user?.uid}/games`}
                        </p>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button 
                          onClick={() => handleCopyLink(`${window.location.origin}${window.location.pathname}#/shared/${user?.uid}/games`)}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-xs font-bold"
                        >
                          {copySuccess ? <Check size={14} /> : <Copy size={14} />}
                          {copySuccess ? 'Copied!' : 'Copy'}
                        </button>
                        <a 
                          href={`${window.location.origin}${window.location.pathname}#/shared/${user?.uid}/games`}
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
              className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8 max-w-md w-full overflow-hidden"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center shrink-0">
                  <AlertCircle size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{deleteConfirmation.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{deleteConfirmation.message}</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setDeleteConfirmation(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
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

        {/* Clear Lineup Confirmation Modal */}
        {showClearLineupConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowClearLineupConfirm(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8 max-w-md w-full overflow-hidden"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center shrink-0">
                  <AlertCircle size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Clear Lineup?</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">This will reset all innings and positions to blank. This action cannot be undone.</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowClearLineupConfirm(false)}
                  className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleClearLineup(selectedGameId)}
                  className="flex-1 px-6 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20"
                >
                  Clear All
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
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    console.log('Theme changed:', darkMode ? 'dark' : 'light');
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <ErrorBoundary>
      <Toaster richColors closeButton />
      <HashRouter>
        <BaseballApp darkMode={darkMode} setDarkMode={setDarkMode} />
      </HashRouter>
    </ErrorBoundary>
  );
}
