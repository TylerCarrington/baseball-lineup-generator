import React, { useState, useEffect, Component, ReactNode } from 'react';
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

import { Plus, Trash2, Edit2, LogIn, LogOut, User as UserIcon, Trophy, Save, X, ClipboardList, Check, AlertCircle, RotateCcw, LayoutGrid, RefreshCw, Lock, Unlock, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
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
  allowAnyOutfielder: boolean;
  allowDesignatedHitter: boolean;
  avoidOutfieldTwiceInRow: boolean;
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
    "Any Outfielder": "OF",
    "Designated Hitter": "DH"
  };
  return mapping[pos] || pos;
};

// --- Main App Component ---

function BaseballApp() {
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
  const [gameViewTab, setGameViewTab] = useState<'batting' | 'lineup'>('batting');
  const [games, setGames] = useState<Game[]>([]);

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
    ...(settings?.allowAnyOutfielder ? ["Any Outfielder"] : []),
    ...POSITIONS,
    ...(settings?.allowDesignatedHitter ? ["Designated Hitter"] : [])
  ];

  const togglePosition = (pos: string, isEdit: boolean) => {
    const update = (prev: string[]) => {
      let next = prev.includes(pos) ? prev.filter(p => p !== pos) : [...prev, pos];
      
      // Special logic for Any Outfielder
      if (pos === "Any Outfielder") {
        if (next.includes("Any Outfielder")) {
          // Add all OF positions
          next = Array.from(new Set([...next, "Left Field", "Center Field", "Right Field"]));
        } else {
          // Remove all OF positions? Or just Any Outfielder?
          // User said "enable Right, Left, and Center Field by default when set to true"
          // Let's just keep it simple.
        }
      }
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
        if (data.allowDesignatedHitter === undefined || data.allowAnyOutfielder === undefined || data.avoidOutfieldTwiceInRow === undefined) {
          updateDoc(settingsDocRef, {
            allowAnyOutfielder: data.allowAnyOutfielder ?? false,
            allowDesignatedHitter: data.allowDesignatedHitter ?? false,
            avoidOutfieldTwiceInRow: data.avoidOutfieldTwiceInRow ?? false,
            uid: user.uid
          });
        }
        setSettings({ id: snapshot.id, ...data } as TeamSettings);
      } else {
        // Create default settings if not exists
        const createDefault = async () => {
          try {
            await setDoc(settingsDocRef, {
              allowAnyOutfielder: false,
              allowDesignatedHitter: false,
              avoidOutfieldTwiceInRow: false,
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
    setIsCreatingLineup(true);
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
      setIsCreatingLineup(false);
      setGameName('');
      setGameDate(new Date().toISOString().split('T')[0]);
      setActiveTab('games');
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

    setSelectedGameId(gameId);
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

  const handleReshuffleLineup = async (gameId: string | null) => {
    if (!gameId) return;
    const game = games.find(g => g.id === gameId);
    if (!game) return;

    if (game.isLocked) {
      alert("This game is locked. Please unlock it to reshuffle the batting order.");
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
      alert("This game is locked. Please unlock it to regenerate the lineup.");
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
      if (pos === "Left Field" || pos === "Center Field" || pos === "Right Field") {
        return player.positions.includes(pos) || player.positions.includes("Any Outfielder");
      }
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
    let lastBenched: Set<string> = new Set();
    const previousPitchers: Set<string> = new Set();
    const benchCounts: Record<string, number> = {};
    availablePlayers.forEach(p => benchCounts[p.id] = 0);

    for (let inning = 1; inning <= 6; inning++) {
      const inningKey = inning.toString();
      lineup[inningKey] = {};
      const assignedThisInning: Set<string> = new Set();

      // Helper to pick candidate with highest bench count
      const pickBestCandidate = (candidates: Player[]) => {
        if (candidates.length === 0) return null;
        const maxBench = Math.max(...candidates.map(p => benchCounts[p.id]));
        const topCandidates = candidates.filter(p => benchCounts[p.id] === maxBench);
        return topCandidates[Math.floor(Math.random() * topCandidates.length)];
      };

      // 1. Handle Pitcher (Special Rules)
      let pitcherId = "";
      if (inning === 1 || inning === 2) {
        // Starting Pitcher for 2 innings
        if (inning === 1) {
          const starters = availablePlayers.filter(p => p.positions.includes("Starting Pitcher"));
          const pool = starters.length > 0 ? starters : availablePlayers.filter(p => canPlay(p, "Pitcher"));
          pitcherId = pickBestCandidate(pool)?.id || pool[0].id;
          previousPitchers.add(pitcherId);
        } else {
          pitcherId = lineup["1"]["Pitcher"];
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
          pitcherId = availablePlayers[Math.floor(Math.random() * availablePlayers.length)].id;
        }
      }

      lineup[inningKey]["Pitcher"] = pitcherId;
      assignedThisInning.add(pitcherId);

      // 2. Assign other positions based on rarity
      const remainingPositions = sortedPositions.filter(pos => pos !== "Pitcher");
      
      // Players available for other positions this inning
      let pool = availablePlayers.filter(p => p.id !== pitcherId);

      for (const pos of remainingPositions) {
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
            
            return true;
          });
        }

        // Apply "Avoid Outfield Twice in Row" logic
        if (settings?.avoidOutfieldTwiceInRow && (pos === "Left Field" || pos === "Center Field" || pos === "Right Field")) {
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

  const handleGenerateInning = async (gameId: string | null, targetInning: number) => {
    if (!gameId) return;
    const game = games.find(g => g.id === gameId);
    if (!game) return;

    if (game.isLocked) {
      alert("This game is locked. Please unlock it to regenerate the inning.");
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
      if (pos === "Left Field" || pos === "Center Field" || pos === "Right Field") {
        return player.positions.includes(pos) || player.positions.includes("Any Outfielder");
      }
      return player.positions.includes(pos);
    };

    // Calculate position rarity
    const rarity: Record<string, number> = {};
    fieldPositions.forEach(pos => {
      rarity[pos] = availablePlayers.filter(p => canPlay(p, pos)).length;
    });
    const sortedPositions = [...fieldPositions].sort((a, b) => rarity[a] - rarity[b]);

    const currentLineup = { ...(game.lineup || {}) };
    
    // Calculate constraints from PREVIOUS innings
    let lastBenched: Set<string> = new Set();
    const previousPitchers: Set<string> = new Set();
    const totalCaught: Record<string, number> = {};
    const benchCounts: Record<string, number> = {};
    availablePlayers.forEach(p => benchCounts[p.id] = 0);

    for (let i = 1; i < targetInning; i++) {
      const inningKey = i.toString();
      const inningData = currentLineup[inningKey] || {};
      const assignedIds = Object.values(inningData);
      
      // Bench
      lastBenched = new Set();
      availablePlayers.forEach(p => {
        if (!assignedIds.includes(p.id)) {
          lastBenched.add(p.id);
          benchCounts[p.id]++;
        }
      });

      // Pitchers
      if (inningData["Pitcher"]) previousPitchers.add(inningData["Pitcher"]);

      // Catchers
      if (inningData["Catcher"]) {
        totalCaught[inningData["Catcher"]] = (totalCaught[inningData["Catcher"]] || 0) + 1;
      }
    }

    // Helper to pick candidate with highest bench count
    const pickBestCandidate = (candidates: Player[]) => {
      if (candidates.length === 0) return null;
      const maxBench = Math.max(...candidates.map(p => benchCounts[p.id]));
      const topCandidates = candidates.filter(p => benchCounts[p.id] === maxBench);
      return topCandidates[Math.floor(Math.random() * topCandidates.length)];
    };

    // Special case for Inning 2: must match Inning 1 pitcher
    let pitcherId = "";
    if (targetInning === 2) {
      pitcherId = currentLineup["1"]?.["Pitcher"] || "";
      if (!pitcherId) {
         alert("Please generate Inning 1 first.");
         return;
      }
    } else if (targetInning === 1) {
       const starters = availablePlayers.filter(p => p.positions.includes("Starting Pitcher"));
       const pool = starters.length > 0 ? starters : availablePlayers.filter(p => canPlay(p, "Pitcher"));
       pitcherId = pickBestCandidate(pool)?.id || pool[0].id;
    } else {
       // Relief Pitchers
       const relievers = availablePlayers.filter(p => p.positions.includes("Relief Pitcher") && !previousPitchers.has(p.id));
       const pool = relievers.length > 0 ? relievers : availablePlayers.filter(p => canPlay(p, "Pitcher") && !previousPitchers.has(p.id));
       
       // Prioritize those benched last inning if possible
       const filteredPool = pool.filter(p => lastBenched.has(p.id));
       const finalPool = filteredPool.length > 0 ? filteredPool : pool;
       
       pitcherId = pickBestCandidate(finalPool)?.id || availablePlayers[Math.floor(Math.random() * availablePlayers.length)].id;
    }

    const newInningLineup: Record<string, string> = {};
    newInningLineup["Pitcher"] = pitcherId;
    const assignedThisInning: Set<string> = new Set([pitcherId]);

    const remainingPositions = sortedPositions.filter(pos => pos !== "Pitcher");
    let pool = availablePlayers.filter(p => p.id !== pitcherId);

    for (const pos of remainingPositions) {
      let candidates = pool.filter(p => canPlay(p, pos) && !assignedThisInning.has(p.id));
      
      if (pos === "Catcher") {
        candidates = candidates.filter(p => {
          if ((totalCaught[p.id] || 0) >= 4) return false;
          if (targetInning > 2) {
            const caughtLast = currentLineup[(targetInning - 1).toString()]?.["Catcher"] === p.id;
            const caughtTwoAgo = currentLineup[(targetInning - 2).toString()]?.["Catcher"] === p.id;
            if (caughtLast && caughtTwoAgo) return false;
          }
          return true;
        });
      }

      if (settings?.avoidOutfieldTwiceInRow && (pos === "Left Field" || pos === "Center Field" || pos === "Right Field")) {
        const outfieldPositions = ["Left Field", "Center Field", "Right Field"];
        const prevLineup = targetInning > 1 ? currentLineup[(targetInning - 1).toString()] : null;
        if (prevLineup) {
          const filteredNoRepeat = candidates.filter(p => !outfieldPositions.some(op => prevLineup[op] === p.id));
          if (filteredNoRepeat.length > 0) candidates = filteredNoRepeat;
        }
      }

      if (candidates.length === 0) candidates = pool.filter(p => !assignedThisInning.has(p.id));
      const mustPlay = candidates.filter(p => lastBenched.has(p.id));
      const finalCandidates = mustPlay.length > 0 ? mustPlay : candidates;
      
      const selected = pickBestCandidate(finalCandidates);
      if (selected) {
        newInningLineup[pos] = selected.id;
        assignedThisInning.add(selected.id);
      }
    }

    currentLineup[targetInning.toString()] = newInningLineup;

    if (targetInning === 1 && currentLineup["2"]) {
      currentLineup["2"]["Pitcher"] = pitcherId;
    }

    try {
      await updateDoc(doc(db, 'games', gameId), { lineup: currentLineup });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `games/${gameId}`);
    }
  };

  const handleToggleLock = async (gameId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'games', gameId), {
        isLocked: !currentStatus
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `games/${gameId}`);
    }
  };

  const handleSwapInnings = async (gameId: string, inningA: number, inningB: number) => {
    const game = games.find(g => g.id === gameId);
    if (!game || !game.lineup || game.isLocked) return;

    const newLineup = { ...game.lineup };
    const temp = newLineup[inningA.toString()];
    newLineup[inningA.toString()] = newLineup[inningB.toString()];
    newLineup[inningB.toString()] = temp;

    try {
      await updateDoc(doc(db, 'games', gameId), { lineup: newLineup });
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

  const handleDeletePlayer = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'players', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `players/${id}`);
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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Baseball Lineup Pro</h1>
          <p className="text-slate-600 mb-8">Organize your team, manage your roster, and win the game.</p>
          <button 
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 py-4 bg-slate-900 text-white rounded-2xl font-semibold hover:bg-slate-800 transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
          >
            <LogIn size={20} />
            Sign in with Google
          </button>
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
              <span>Lineup Pro</span>
            </div>
            <nav className="hidden md:flex items-center gap-1">
              <button 
                onClick={() => setActiveTab('roster')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'roster' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Roster
              </button>
              <button 
                onClick={() => setActiveTab('games')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'games' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Games
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
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
                  onClick={() => { setActiveTab('roster'); setIsMobileMenuOpen(false); }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'roster' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  Roster
                </button>
                <button 
                  onClick={() => { setActiveTab('games'); setIsMobileMenuOpen(false); }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'games' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  Games
                </button>
                <button 
                  onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }}
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
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                        {games.find(g => g.id === selectedGameId)?.name || 'Game Details'}
                      </h2>
                      <p className="text-slate-500 mt-1">
                        {(() => {
                          const game = games.find(g => g.id === selectedGameId);
                          if (!game) return '';
                          const gameDateObj = game.date?.toDate ? game.date.toDate() : new Date(game.date);
                          return gameDateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
                        })()}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-4">
                        {(() => {
                          const game = games.find(g => g.id === selectedGameId);
                          if (!game) return null;
                          const isLocked = game.isLocked || false;
                          return (
                            <>
                              <button 
                                onClick={() => handleToggleLock(game.id, isLocked)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-sm font-semibold border ${
                                  isLocked 
                                    ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' 
                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {isLocked ? <Unlock size={16} /> : <Lock size={16} />}
                                {isLocked ? 'Unlock' : 'Lock'}
                              </button>
                              <button 
                                onClick={() => !isLocked && setIsEditingRSVPs(!isEditingRSVPs)}
                                disabled={isLocked}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-sm font-semibold border ${
                                  isLocked
                                    ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                                    : isEditingRSVPs 
                                      ? 'bg-slate-900 text-white border-slate-900' 
                                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                                }`}
                              >
                                <Edit2 size={16} />
                                {isEditingRSVPs ? 'Finish' : 'Edit RSVPs'}
                              </button>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedGameId(null)}
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
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{(player.positions || []).join(', ')}</p>
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
                                        return (
                                          <span key={inning} className="text-[9px] font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-100">
                                            <span className="text-slate-300 mr-1">{inning}</span>
                                            {position}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{(player.positions || []).join(', ')}</p>
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
                                  <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold uppercase tracking-wider">
                                    <Lock size={10} />
                                    Locked
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
                                            {inning > 1 && !isLocked && (
                                              <button 
                                                onClick={() => handleSwapInnings(selectedGameId, inning, inning - 1)}
                                                className="p-0.5 text-slate-300 hover:text-slate-900 transition-colors"
                                                title="Move Left"
                                              >
                                                <ChevronLeft size={10} />
                                              </button>
                                            )}
                                            <span>Inn {inning}</span>
                                            {inning < 6 && !isLocked && (
                                              <button 
                                                onClick={() => handleSwapInnings(selectedGameId, inning, inning + 1)}
                                                className="p-0.5 text-slate-300 hover:text-slate-900 transition-colors"
                                                title="Move Right"
                                              >
                                                <ChevronRight size={10} />
                                              </button>
                                            )}
                                          </div>
                                          {!isLocked && (
                                            <button 
                                              onClick={() => handleGenerateInning(selectedGameId, inning)}
                                              className="p-1 text-slate-300 hover:text-slate-900 transition-colors"
                                              title={`Regenerate Inning ${inning}`}
                                            >
                                              <RefreshCw size={10} />
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
                                    <td className="py-4 px-4 border-b border-slate-50 font-bold text-slate-900 text-sm">{pos}</td>
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
                    onClick={() => setSelectedGameId(null)}
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
              className="max-w-3xl mx-auto"
            >
              <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Add New Game</h2>
                      <p className="text-slate-500 mt-1">Set player availability for this game</p>
                    </div>
                    <button 
                      onClick={() => setIsCreatingLineup(false)}
                      className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Game Name</label>
                      <input 
                        type="text" 
                        value={gameName}
                        onChange={(e) => setGameName(e.target.value)}
                        placeholder="e.g. May 20th - Vipers"
                        className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-lg font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Game Date</label>
                      <input 
                        type="date" 
                        value={gameDate}
                        onChange={(e) => setGameDate(e.target.value)}
                        className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-lg font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="font-bold text-slate-900">Player RSVP</h3>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{players.length} Total</span>
                  </div>

                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {[...players].sort((a, b) => a.name.localeCompare(b.name)).map((player) => (
                      <div key={player.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-900 font-bold border border-slate-200">
                            {player.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{player.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{(player.positions || []).join(', ')}</p>
                          </div>
                        </div>

                        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                          {[RSVPStatus.YES, RSVPStatus.TENTATIVE, RSVPStatus.NO].map((status) => (
                            <button
                              key={status}
                              onClick={() => handleRSVPChange(player.id, status)}
                              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
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

                <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={handleCreateGame}
                    className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 active:scale-[0.98]"
                  >
                    Add Game
                  </button>
                  <button 
                    onClick={() => setIsCreatingLineup(false)}
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
                            <span className="text-sm text-slate-700">{pos}</span>
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
                                  <span className="text-xs text-slate-600">{pos}</span>
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
                                onClick={() => handleDeletePlayer(player.id)}
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
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Game Schedule</h2>
                <p className="text-slate-500 mt-1">Manage your upcoming games and lineups</p>
              </div>
              <button 
                onClick={startCreateLineup}
                className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all font-bold shadow-lg shadow-slate-900/20 active:scale-[0.95]"
              >
                <Plus size={20} />
                New Game
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {games.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center">
                  <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-3">
                    <ClipboardList size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">No games scheduled</h3>
                  <p className="text-slate-500 mb-8 max-w-xs mx-auto">Create your first game to start managing your team's lineup and availability.</p>
                  <button 
                    onClick={startCreateLineup}
                    className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
                  >
                    Schedule First Game
                  </button>
                </div>
              ) : (
                games.map((game) => {
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
                      className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 hover:border-slate-300 transition-all group"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="flex items-start gap-5">
                          <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex flex-col items-center justify-center shadow-md">
                            <span className="text-[10px] font-bold uppercase tracking-tighter opacity-70">
                              {gameDateObj.toLocaleDateString('en-US', { month: 'short' })}
                            </span>
                            <span className="text-xl font-bold leading-none">
                              {gameDateObj.getDate()}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-slate-900 group-hover:text-slate-900 transition-colors">{game.name}</h3>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-sm text-slate-500 font-medium">
                                {gameDateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric' })}
                              </span>
                              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                              <div className="flex items-center gap-2">
                                <div className="flex -space-x-2">
                                  {[...Array(Math.min(3, rsvpCounts[RSVPStatus.YES] || 0))].map((_, i) => (
                                    <div key={i} className="w-5 h-5 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center">
                                      <Check size={10} className="text-emerald-600" />
                                    </div>
                                  ))}
                                </div>
                                <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
                                  {rsvpCounts[RSVPStatus.YES] || 0} Attending
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex flex-col items-end mr-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">RSVP Status</span>
                            <div className="flex gap-2">
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
                          </div>
                          <button 
                            onClick={() => handleViewGame(game.id)}
                            className="p-3 bg-slate-50 text-slate-900 rounded-2xl hover:bg-slate-100 transition-all border border-slate-200"
                          >
                            <ClipboardList size={20} />
                          </button>
                          <button 
                            onClick={async () => {
                              try {
                                await deleteDoc(doc(db, 'games', game.id));
                              } catch (error) {
                                handleFirestoreError(error, OperationType.DELETE, `games/${game.id}`);
                              }
                            }}
                            className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all border border-transparent hover:border-rose-100"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
              <h2 className="text-2xl font-bold mb-6">Team Settings</h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-900">Allow Any Outfielder</h3>
                    <p className="text-sm text-slate-500">Enable "Any Outfielder" as a position option. Selecting it will automatically include Left, Center, and Right Field.</p>
                  </div>
                  <button 
                    onClick={() => handleUpdateSettings({ allowAnyOutfielder: !settings?.allowAnyOutfielder })}
                    className={`w-14 h-8 rounded-full transition-colors relative ${settings?.allowAnyOutfielder ? 'bg-slate-900' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings?.allowAnyOutfielder ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-900">Allow Designated Hitter</h3>
                    <p className="text-sm text-slate-500">Enable "Designated Hitter" as a position option for your lineup.</p>
                  </div>
                  <button 
                    onClick={() => handleUpdateSettings({ allowDesignatedHitter: !settings?.allowDesignatedHitter })}
                    className={`w-14 h-8 rounded-full transition-colors relative ${settings?.allowDesignatedHitter ? 'bg-slate-900' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings?.allowDesignatedHitter ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-900">Avoid Outfield Twice in Row</h3>
                    <p className="text-sm text-slate-500">Try to avoid assigning the same player to an outfield position in consecutive innings, and avoid bench-to-outfield transitions.</p>
                  </div>
                  <button 
                    onClick={() => handleUpdateSettings({ avoidOutfieldTwiceInRow: !settings?.avoidOutfieldTwiceInRow })}
                    className={`w-14 h-8 rounded-full transition-colors relative ${settings?.avoidOutfieldTwiceInRow ? 'bg-slate-900' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings?.avoidOutfieldTwiceInRow ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    )}
  </AnimatePresence>
</main>
</div>
);
}

export default function App() {
  return (
    <ErrorBoundary>
      <BaseballApp />
    </ErrorBoundary>
  );
}
