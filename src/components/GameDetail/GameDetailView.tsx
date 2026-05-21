import React, { useMemo } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { Game, Player, RSVPStatus, OperationType } from '../../types';
import { GameHeader } from './GameHeader';
import { GameDetailTabs } from './GameDetailTabs';
import { RSVPManager } from './RSVPManager';
import { ScrimmageGroupsView } from './ScrimmageGroupsView';
import { BattingOrderView } from './BattingOrderView';
import { ScrimmageGroupManager } from './ScrimmageGroupManager';
import { FieldingLineupView } from './FieldingLineupView';
import { PracticeAgendaView } from './PracticeAgendaView';
import { useGameDetail } from '../../hooks/useGameDetail';
import { useGameActions } from '../../hooks/useGameActions';
import { db } from '../../firebase';
import { handleFirestoreError } from '../../lib/utils';
import { useSettings } from '../../hooks/useSettings';
import { User } from 'firebase/auth';
import { ChevronLeft } from 'lucide-react';

import { GroupManagementView } from './GroupManagementView';

interface GameDetailViewProps {
  game: Game;
  players: Player[];
  onBack: () => void;
  games: Game[];
  user: User | null;
  isAuthReady: boolean;
  darkMode: boolean;
  setShowClearLineupConfirm: (show: boolean) => void;
  setGames: React.Dispatch<React.SetStateAction<Game[]>>;
}

export const GameDetailView: React.FC<GameDetailViewProps> = ({
  game,
  players,
  onBack,
  games,
  user,
  isAuthReady,
  darkMode,
  setShowClearLineupConfirm,
  setGames
}) => {
  const { settings } = useSettings(user, isAuthReady);
  const {
    gameViewTab, setGameViewTab,
    localBattingOrder, setLocalBattingOrder,
    editingCell, setEditingCell,
    isEditingRSVPs, setIsEditingRSVPs,
    editOpponent, setEditOpponent,
    editLocation, setEditLocation,
    editGameName, setEditGameName,
    editGameDate, setEditGameDate,
    editGameTime, setEditGameTime,
    editIsHome, setEditIsHome,
    editDuration, setEditDuration,
    backupLineup, setBackupLineup,
    backupScrimmageGroups, setBackupScrimmageGroups,
    resetEditState
  } = useGameDetail(game);

  const {
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
    handleUpdateNumGroups,
    handleToggleBattingOrderCheck
  } = useGameActions(games, players, settings);

  const handleMovePlayerToPosition = async (playerId: string, newPositionIndex: number) => {
    if (!game.id || !user) return;
    
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
      const gameRef = doc(db, 'games', game.id);
      await updateDoc(gameRef, {
        battingOrder: currentOrder
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `games/${game.id}`);
    }
  };

  const handleMovePlayer = (playerId: string, direction: 'up' | 'down') => {
    const currentIndex = localBattingOrder.indexOf(playerId);
    if (currentIndex === -1) return;
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= localBattingOrder.length) return;
    handleMovePlayerToPosition(playerId, newIndex);
  };

  const isLocked = game.isLocked || false;

  const previousGame = useMemo(() => {
    const standardGames = [...games]
      .filter(g => g.type !== 'practice' && g.mode !== 'scrimmage')
      .sort((a, b) => {
        const aDate = a.date?.toDate ? a.date.toDate().getTime() : new Date(a.date).getTime();
        const bDate = b.date?.toDate ? b.date.toDate().getTime() : new Date(b.date).getTime();
        
        if (aDate === bDate) {
          if (a.time && b.time) return a.time.localeCompare(b.time);
          if (a.time) return 1;
          if (b.time) return -1;
          
          const aCreated = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          const bCreated = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
          return aCreated - bCreated;
        }
        return aDate - bDate;
      });

    const currentIndex = standardGames.findIndex(g => g.id === game.id);
    
    if (currentIndex > 0) {
      return standardGames[currentIndex - 1];
    }
    
    if (currentIndex === -1) {
      const currentGameDate = game.date?.toDate ? game.date.toDate().getTime() : new Date(game.date).getTime();
      return [...standardGames].reverse().find(g => {
        const gDate = g.date?.toDate ? g.date.toDate().getTime() : new Date(g.date).getTime();
        return gDate <= currentGameDate;
      });
    }

    return undefined;
  }, [games, game]);

  return (
    <div key="game-view">
      <GameHeader
        game={game}
        players={players}
        onBack={onBack}
        isEditingRSVPs={isEditingRSVPs}
        setIsEditingRSVPs={setIsEditingRSVPs}
        editOpponent={editOpponent}
        setEditOpponent={setEditOpponent}
        editLocation={editLocation}
        setEditLocation={setEditLocation}
        editGameName={editGameName}
        setEditGameName={setEditGameName}
        editGameDate={editGameDate}
        setEditGameDate={setEditGameDate}
        editGameTime={editGameTime}
        setEditGameTime={setEditGameTime}
        editIsHome={editIsHome}
        setEditIsHome={setEditIsHome}
        editDuration={editDuration}
        setEditDuration={setEditDuration}
        handleTogglePublish={handleTogglePublish}
        handleUpdateGameDetails={async () => {
          let generatedName = game.name;
          if (game.type !== 'practice') {
            generatedName = game.mode === 'scrimmage' 
              ? 'Scrimmage' 
              : `${editIsHome ? 'vs' : '@'} ${editOpponent.trim()}`;
          }
          
          await handleUpdateGameDetails(game.id, {
            name: game.mode === 'standard' ? generatedName : editGameName,
            opponent: game.mode === 'standard' ? editOpponent : null,
            location: editLocation,
            date: editGameDate,
            time: editGameTime,
            isHome: editIsHome,
            duration: editDuration
          });
          setIsEditingRSVPs(false);
        }}
        resetEditState={resetEditState}
      />

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden mb-12">
        <div className="p-6 sm:p-10">
          <GameDetailTabs 
            game={game}
            gameViewTab={gameViewTab}
            setGameViewTab={setGameViewTab}
            onFieldLineupClick={() => {
              if (game.mode === 'scrimmage' && game.lineup && Object.keys(game.lineup).length > 0 && game.scrimmageStep !== 3 && !backupLineup) {
                const isFullLineup = Object.values(game.lineup).some(inning => 
                  Object.keys(inning).some(pos => pos !== 'Pitcher' && pos !== 'Catcher')
                );
                if (isFullLineup) {
                  updateDoc(doc(db, 'games', game.id), { scrimmageStep: 3 });
                  setGames(prevGames => prevGames.map(g => g.id === game.id ? {...g, scrimmageStep: 3} : g));
                }
              }
            }}
          />
          
          <div className="space-y-6">
            {isEditingRSVPs ? (
              <RSVPManager
                game={game}
                players={players}
                handleUpdateRSVP={handleUpdateRSVP}
                onFinish={() => setIsEditingRSVPs(false)}
              />
            ) : (gameViewTab === 'batting' || gameViewTab === 'groups' || gameViewTab === 'agenda') ? (
              game.type === 'practice' ? (
                gameViewTab === 'agenda' ? (
                  <PracticeAgendaView game={game} readOnly={isLocked} allowEditWhenLocked={true} />
                ) : (
                  <div className="space-y-12">
                    <GroupManagementView
                      game={game}
                      players={players}
                      handleMoveScrimmagePlayer={handleMoveScrimmagePlayer}
                      handleSplitScrimmageGroups={handleSplitScrimmageGroups}
                      handleUpdateNumGroups={handleUpdateNumGroups}
                      handleFixLineup={handleFixLineup}
                      readOnly={isLocked}
                      handleUpdateGameRSVP={handleUpdateRSVP}
                    />
                  </div>
                )
              ) : game.mode === 'scrimmage' ? (
                <ScrimmageGroupsView
                  game={game}
                  players={players}
                  handleUpdateGameRSVP={handleUpdateRSVP}
                />
              ) : (
                <BattingOrderView
                  game={game}
                  players={players}
                  localBattingOrder={localBattingOrder}
                  handleReshuffleLineup={() => handleReshuffleLineup(game.id)}
                  handleMovePlayerToPosition={handleMovePlayerToPosition}
                  handleUpdateGameRSVP={handleUpdateRSVP}
                  handleMovePlayer={handleMovePlayer}
                  previousGame={previousGame}
                  handleToggleCheck={(gameId: string, playerId: string) => handleToggleBattingOrderCheck(gameId, playerId)}
                />
              )
            ) : (
              game.mode === 'scrimmage' ? (
                <ScrimmageGroupManager
                  game={game}
                  players={players}
                  selectedGameId={game.id}
                  setGames={setGames}
                  handleGenerateBatteries={handleGenerateBatteries}
                  handleSplitScrimmageGroups={handleSplitScrimmageGroups}
                  handleGenerateScrimmageLineup={handleGenerateScrimmageLineup}
                  handleFixInningBatteries={handleFixInningBatteries}
                  handleUpdateLineupCell={handleUpdateLineupCell}
                  handleMoveScrimmagePlayer={handleMoveScrimmagePlayer}
                  handleFixLineup={handleFixLineup}
                  handleUpdateNumGroups={handleUpdateNumGroups}
                  editingCell={editingCell}
                  setEditingCell={setEditingCell}
                  backupLineup={backupLineup}
                  setBackupLineup={setBackupLineup}
                  backupScrimmageGroups={backupScrimmageGroups}
                  setBackupScrimmageGroups={setBackupScrimmageGroups}
                  darkMode={darkMode}
                />
              ) : (
                <FieldingLineupView
                  game={game}
                  players={players}
                  selectedGameId={game.id}
                  isLocked={isLocked}
                  handleFixLineup={handleFixLineup}
                  handleGenerateLineup={handleGenerateLineup}
                  setShowClearLineupConfirm={setShowClearLineupConfirm}
                  handleToggleInningLock={handleToggleInningLock}
                  handleTogglePositionLock={handleTogglePositionLock}
                  editingCell={editingCell}
                  setEditingCell={setEditingCell}
                  handleUpdateLineupCell={handleUpdateLineupCell}
                  darkMode={darkMode}
                />
              )
            )}
          </div>
        </div>
        <div className="p-10 bg-slate-50 border-t border-slate-100 flex justify-center">
          <button 
            onClick={onBack}
            className="px-10 py-4 bg-white text-slate-900 border border-slate-200 rounded-2xl font-black hover:bg-slate-100 transition-all active:scale-[0.98] shadow-sm flex items-center gap-2 text-sm uppercase tracking-widest"
          >
            <ChevronLeft size={18} />
            Back to Schedule
          </button>
        </div>
      </div>
    </div>
  );
};
