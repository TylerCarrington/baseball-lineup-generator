import { useState, useEffect } from 'react';
import { Game, RSVPStatus } from '../types';
import { getLocalDateString } from '../lib/utils';

export function useGameDetail(selectedGame: Game | null | undefined) {
  // Game Detail UI State
  const [gameViewTab, setGameViewTab] = useState<'batting' | 'lineup' | 'agenda' | 'groups'>('batting');
  const [localBattingOrder, setLocalBattingOrder] = useState<string[]>([]);
  const [editingCell, setEditingCell] = useState<{ inning: string; position: string } | null>(null);
  const [isEditingRSVPs, setIsEditingRSVPs] = useState(false);
  
  // Game Editing State
  const [editOpponent, setEditOpponent] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editGameName, setEditGameName] = useState('');
  const [editGameDate, setEditGameDate] = useState('');
  const [editGameTime, setEditGameTime] = useState('');
  const [editIsHome, setEditIsHome] = useState(true);

  // Scrimmage Backup State
  const [backupLineup, setBackupLineup] = useState<Record<string, Record<string, string>> | null>(null);
  const [backupScrimmageGroups, setBackupScrimmageGroups] = useState<string[][] | null>(null);

  // Sync state when game changes
  useEffect(() => {
    if (selectedGame) {
      if (selectedGame.battingOrder) {
        // Only update local if it's actually different to prevent "jump back"
        if (JSON.stringify(selectedGame.battingOrder) !== JSON.stringify(localBattingOrder)) {
          setLocalBattingOrder(selectedGame.battingOrder);
        }
      } else if (localBattingOrder.length > 0) {
        setLocalBattingOrder([]);
      }
    }
  }, [selectedGame, localBattingOrder]);

  // Reset UI states when switching games
  useEffect(() => {
    setIsEditingRSVPs(false);
    setEditingCell(null);
    setGameViewTab(selectedGame?.type === 'practice' ? 'agenda' : 'batting');
  }, [selectedGame?.id, selectedGame?.type]);

  const resetEditState = (game: Game) => {
    setEditGameName(game.name || '');
    setEditOpponent(game.opponent || '');
    setEditLocation(game.location || '');
    const dateStr = game.date?.toDate ? getLocalDateString(game.date.toDate()) : getLocalDateString(new Date(game.date));
    setEditGameDate(dateStr);
    setEditGameTime(game.time || '');
    setEditIsHome(game.isHome !== false);
  };

  return {
    gameViewTab,
    setGameViewTab,
    localBattingOrder,
    setLocalBattingOrder,
    editingCell,
    setEditingCell,
    isEditingRSVPs,
    setIsEditingRSVPs,
    editOpponent,
    setEditOpponent,
    editLocation,
    setEditLocation,
    editGameName,
    setEditGameName,
    editGameDate,
    setEditGameDate,
    editGameTime,
    setEditGameTime,
    editIsHome,
    setEditIsHome,
    backupLineup,
    setBackupLineup,
    backupScrimmageGroups,
    setBackupScrimmageGroups,
    resetEditState
  };
}
