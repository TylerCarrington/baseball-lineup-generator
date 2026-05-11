import { doc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { db } from '../firebase';
import { firebaseService } from '../services/firebaseService';
import { 
  Game, 
  Player, 
  RSVPStatus, 
  OperationType, 
  TeamSettings 
} from '../types';
import { handleFirestoreError } from '../lib/utils';
import { 
  generateLineup, 
  fixLineup, 
  generateScrimmageLineup, 
  fixInningBatteries, 
  generateBatteries, 
  splitScrimmageGroups 
} from '../lib/lineupLogic';

export function useGameActions(games: Game[], players: Player[], settings: TeamSettings | null) {

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

    const updates: any = {
      rsvps: newRSVPs,
      battingOrder: newBattingOrder
    };

    if (game.scrimmageGroups && game.scrimmageGroups.length > 0 && (game.type === 'practice' || game.mode === 'scrimmage')) {
      let newGroups = [...game.scrimmageGroups.map(g => [...(g || [])])];
      const currentStatus = game.rsvps[playerId];
      const isCurrentlyOut = currentStatus === RSVPStatus.NO || !currentStatus;
      const isNowIn = newStatus === RSVPStatus.YES || newStatus === RSVPStatus.TENTATIVE;
      
      const isInAGroup = newGroups.some(group => group.includes(playerId));

      let groupsChanged = false;

      if (newStatus === RSVPStatus.NO && isInAGroup) {
        newGroups = newGroups.map(group => group.filter(id => id !== playerId));
        groupsChanged = true;
      } else if (isNowIn && (!isInAGroup && isCurrentlyOut)) {
        const numGroups = game.numGroups || 4;
        while (newGroups.length < numGroups) newGroups.push([]);

        let minIdx = 0;
        let minCount = newGroups[0].length;
        for (let i = 1; i < numGroups; i++) {
          const count = newGroups[i].length;
          if (count < minCount) {
            minCount = count;
            minIdx = i;
          }
        }
        newGroups[minIdx].push(playerId);
        groupsChanged = true;
      }

      if (groupsChanged) {
        updates.scrimmageGroups = JSON.stringify(newGroups);
      }
    }

    await firebaseService.updateGame(gameId, updates);
  };

  const handleUpdateGameDetails = async (gameId: string, updates: { name: string; opponent?: string | null; location?: string | null; date: string; time?: string | null; isHome: boolean | null; duration?: number }) => {
    await firebaseService.updateGame(gameId, {
      name: updates.name.trim(),
      opponent: updates.opponent?.trim() ?? null,
      location: updates.location?.trim() ?? null,
      date: new Date(updates.date + 'T12:00:00'),
      time: updates.time || null,
      isHome: updates.isHome,
      duration: updates.duration
    });
  };

  const handleReshuffleLineup = async (gameId: string) => {
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

  const handleClearLineup = async (gameId: string) => {
    await firebaseService.updateGame(gameId, {
      lineup: {},
      lockedInnings: [],
      lockedPositions: []
    });
    toast.success('Lineup cleared successfully');
  };

  const handleSplitScrimmageGroups = async (gameId: string) => {
    const game = games.find(g => g.id === gameId);
    if (!game) return;

    const groups = splitScrimmageGroups(game, players);

    try {
      await updateDoc(doc(db, 'games', gameId), {
        scrimmageGroups: JSON.stringify(groups),
        scrimmageStep: 2
      });
      toast.success(`Players split into ${groups.length} groups`);
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
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `games/${gameId}`);
    }
  };

  const handleGenerateBatteries = async (gameId: string) => {
    const game = games.find(g => g.id === gameId);
    if (!game) return;

    try {
      const newLineup = generateBatteries(game, players);
      await updateDoc(doc(db, 'games', gameId), { lineup: newLineup });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `games/${gameId}`);
    }
  };

  const handleFixInningBatteries = async (gameId: string, inningKey: string) => {
    const game = games.find(g => g.id === gameId);
    if (!game) return;

    try {
      const newLineup = fixInningBatteries(game, players, inningKey);
      await updateDoc(doc(db, 'games', gameId), { lineup: newLineup });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `games/${gameId}`);
    }
  };

  const handleGenerateScrimmageLineup = async (gameId: string) => {
    const game = games.find(g => g.id === gameId);
    if (!game) return;

    try {
      const newLineup = generateScrimmageLineup(game);
      await updateDoc(doc(db, 'games', gameId), {
        lineup: newLineup,
        scrimmageStep: 3
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `games/${gameId}`);
    }
  };

  const handleUpdateLineupCell = async (gameId: string, inning: string, position: string, playerId: string) => {
    const game = games.find(g => g.id === gameId);
    if (!game) return;

    const newLineup = {
      ...(game.lineup || {}),
      [inning]: {
        ...(game.lineup?.[inning] || {}),
        [position]: playerId
      }
    };

    try {
      await updateDoc(doc(db, 'games', gameId), {
        lineup: newLineup
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `games/${gameId}`);
    }
  };

  const handleGenerateLineup = async (gameId: string) => {
    const game = games.find(g => g.id === gameId);
    if (!game) return;

    try {
      const newLineup = generateLineup(game, players, settings);
      await updateDoc(doc(db, 'games', gameId), {
        lineup: newLineup
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `games/${gameId}`);
    }
  };

  const handleFixLineup = async (gameId: string) => {
    const game = games.find(g => g.id === gameId);
    if (!game) return;

    try {
      const { newLineup, newGroups, fixedAny, skippedDueToLocks } = fixLineup(game, players);
      
      if (fixedAny) {
        const updates: any = { lineup: newLineup };
        if (newGroups) {
          updates.scrimmageGroups = JSON.stringify(newGroups);
        }
        await updateDoc(doc(db, 'games', gameId), updates);

        toast.success("Lineup fixed!", {
          position: 'top-center'
        });
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

  const handleTogglePublish = async (gameId: string, currentStatus: boolean | undefined) => {
    try {
      await updateDoc(doc(db, 'games', gameId), {
        isLocked: !currentStatus
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `games/${gameId}`);
    }
  };

  const handleUpdateNumGroups = async (gameId: string, numGroups: number) => {
    const game = games.find(g => g.id === gameId);
    if (!game) return;

    // If changing number of groups, we should probably reshuffle/split again to avoid empty columns or overflow
    const groups = splitScrimmageGroups({ ...game, numGroups }, players);

    try {
      await updateDoc(doc(db, 'games', gameId), {
        numGroups,
        scrimmageGroups: JSON.stringify(groups)
      });
      toast.success(`Number of groups updated to ${numGroups}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `games/${gameId}`);
    }
  };

  return {
    handleUpdateRSVP,
    handleUpdateGameDetails,
    handleReshuffleLineup,
    handleClearLineup,
    handleSplitScrimmageGroups,
    handleMoveScrimmagePlayer,
    handleGenerateBatteries,
    handleFixInningBatteries,
    handleGenerateScrimmageLineup,
    handleUpdateLineupCell,
    handleGenerateLineup,
    handleFixLineup,
    handleTogglePositionLock,
    handleToggleInningLock,
    handleTogglePublish,
    handleUpdateNumGroups
  };
}
