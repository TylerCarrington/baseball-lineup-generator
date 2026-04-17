import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  X, 
  User as UserIcon, 
  Edit2, 
  Trash2, 
  Save, 
  ClipboardList 
} from 'lucide-react';
import { Player } from '../types';
import { ALL_POSITIONS } from '../constants';
import { getPositionAbbreviation } from '../lib/utils';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { firebaseService } from '../services/firebaseService';
import { User } from 'firebase/auth';

interface RosterTabProps {
  players: Player[];
  user: User | null;
  startCreateLineup: () => void;
  setDeleteConfirmation: React.Dispatch<React.SetStateAction<any>>;
}

interface RosterPlayerCardProps {
  player: Player;
  index: number;
  editingId: string | null;
  editName: string;
  editJerseyNumber: string;
  editPositions: string[];
  setEditName: (val: string) => void;
  setEditJerseyNumber: (val: string) => void;
  togglePosition: (pos: string, isEdit: boolean) => void;
  setEditPositions: React.Dispatch<React.SetStateAction<string[]>>;
  handleUpdatePlayer: (id: string) => Promise<void>;
  cancelEdit: () => void;
  startEdit: (player: Player) => void;
  handleDeletePlayer: (player: Player) => void;
}

const RosterPlayerCard = React.memo<RosterPlayerCardProps>(({
  player,
  index,
  editingId,
  editName,
  editJerseyNumber,
  editPositions,
  setEditName,
  setEditJerseyNumber,
  togglePosition,
  setEditPositions,
  handleUpdatePlayer,
  cancelEdit,
  startEdit,
  handleDeletePlayer
}) => {
  const isEditing = editingId === player.id;

  return (
    <Card className="p-4 flex items-center justify-between group">
      {isEditing ? (
        <div className="flex-1 flex flex-col gap-3 mr-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Name"
              />
            </div>
            <div className="col-span-1">
              <Input
                value={editJerseyNumber}
                onChange={(e) => setEditJerseyNumber(e.target.value)}
                placeholder="#"
              />
            </div>
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
                <Badge key={pos} className="uppercase tracking-wider">
                  {getPositionAbbreviation(pos)}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-1">
        {isEditing ? (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleUpdatePlayer(player.id)}
              icon={Save}
              className="text-emerald-600 hover:bg-emerald-50"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={cancelEdit}
              icon={X}
              className="text-slate-400 hover:bg-slate-100"
            />
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => startEdit(player)}
              icon={Edit2}
              className="text-slate-400 hover:text-slate-900 dark:hover:text-white"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeletePlayer(player)}
              icon={Trash2}
              className="text-slate-400 hover:text-red-600 dark:hover:text-rose-500 hover:bg-red-50 dark:hover:bg-rose-900/20"
            />
          </>
        )}
      </div>
    </Card>
  );
});

export function RosterTab({
  players,
  user,
  startCreateLineup,
  setDeleteConfirmation
}: RosterTabProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editJerseyNumber, setEditJerseyNumber] = useState('');
  const [editPositions, setEditPositions] = useState<string[]>([]);
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [newName, setNewName] = useState('');
  const [newJerseyNumber, setNewJerseyNumber] = useState('');
  const [newPositions, setNewPositions] = useState<string[]>([]);

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => a.name.localeCompare(b.name));
  }, [players]);

  const togglePosition = (pos: string, isEdit: boolean) => {
    if (isEdit) {
      setEditPositions(prev => 
        prev.includes(pos) ? prev.filter(p => p !== pos) : [...prev, pos]
      );
    } else {
      setNewPositions(prev => 
        prev.includes(pos) ? prev.filter(p => p !== pos) : [...prev, pos]
      );
    }
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newName.trim() || newPositions.length === 0) return;
    if (players.length >= 15) {
      alert("Maximum of 15 players reached.");
      return;
    }

    await firebaseService.addPlayer({
      name: newName.trim(),
      jerseyNumber: newJerseyNumber.trim(),
      positions: newPositions,
      uid: user.uid,
      createdAt: new Date(),
    });

    setIsAddingPlayer(false);
    setNewName('');
    setNewJerseyNumber('');
    setNewPositions([]);
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
    await firebaseService.updatePlayer(id, {
      name: editName.trim(),
      jerseyNumber: editJerseyNumber.trim(),
      positions: editPositions
    });
    setEditingId(null);
  };

  return (
    <div className={`grid grid-cols-1 ${isAddingPlayer ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-8`}>
      
      {/* Left Column: Add Player Form */}
      {isAddingPlayer && (
        <div className="lg:col-span-1">
          <Card className="sticky top-24" hover={false}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <Plus size={20} />
                Add Player
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsAddingPlayer(false)}
                icon={X}
              />
            </div>
            <form onSubmit={handleAddPlayer} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Input
                    label="Player Name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Shohei Ohtani"
                    required
                  />
                </div>
                <div className="col-span-1">
                  <Input
                    label="#"
                    value={newJerseyNumber}
                    onChange={(e) => setNewJerseyNumber(e.target.value)}
                    placeholder="00"
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
              <Button 
                type="submit"
                fullWidth
                disabled={players.length >= 15}
                icon={Plus}
              >
                Add to Roster
              </Button>
              {players.length >= 15 && (
                <p className="text-xs text-red-500 text-center mt-2">Roster is full (max 15)</p>
              )}
            </form>
          </Card>
        </div>
      )}

      {/* Right Column: Player List */}
      <div className={isAddingPlayer ? "lg:col-span-2" : "lg:col-span-1"}>
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Team Roster</h2>
            <Badge variant="default">
              {players.length} / 15 Players
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant={isAddingPlayer ? 'primary' : 'outline'}
              onClick={() => setIsAddingPlayer(!isAddingPlayer)}
              icon={Plus}
            >
              {isAddingPlayer ? 'Cancel' : 'Add Player'}
            </Button>
            <Button
              variant="outline"
              onClick={startCreateLineup}
              icon={ClipboardList}
            >
              Add Game
            </Button>
          </div>
        </div>

        <div className="space-y-3">
            {sortedPlayers.length === 0 ? (
              <Card className="p-12 text-center border-dashed border-2" hover={false}>
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserIcon size={24} />
                </div>
                <p className="text-slate-500 dark:text-slate-400">No players added yet. Start by adding your first player.</p>
              </Card>
            ) : (
              sortedPlayers.map((player, index) => (
                <RosterPlayerCard
                  key={player.id}
                  player={player}
                  index={index}
                  editingId={editingId}
                  editName={editName}
                  editJerseyNumber={editJerseyNumber}
                  editPositions={editPositions}
                  setEditName={setEditName}
                  setEditJerseyNumber={setEditJerseyNumber}
                  togglePosition={togglePosition}
                  setEditPositions={setEditPositions}
                  handleUpdatePlayer={handleUpdatePlayer}
                  cancelEdit={cancelEdit}
                  startEdit={startEdit}
                  handleDeletePlayer={handleDeletePlayer}
                />
              ))
            )}
        </div>
      </div>
    </div>
  );
}
