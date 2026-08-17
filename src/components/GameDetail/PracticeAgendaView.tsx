import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  Plus, 
  Trash2, 
  Users, 
  Layers,
  Calendar,
  AlertCircle,
  Timer,
  ClipboardList,
  GripVertical,
  X,
  ArrowDown,
  ArrowUp,
  RotateCw,
  Edit2
} from 'lucide-react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDraggable,
  useDroppable,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DragOverEvent,
  DragStartEvent
} from '@dnd-kit/core';
import {
  restrictToVerticalAxis,
  restrictToFirstScrollableAncestor,
  restrictToWindowEdges
} from '@dnd-kit/modifiers';
import { 
  SortableContext, 
  verticalListSortingStrategy, 
  arrayMove, 
  useSortable 
} from '@dnd-kit/sortable';
import { Game, PracticeActivity, PracticeNote, PracticeNoteSection, Drill } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { firebaseService } from '../../services/firebaseService';
import { useAuth } from '../../hooks/useAuth';
import { useDrills } from '../../hooks/useDrills';
import { toast } from 'sonner';

const MINUTES_PER_SLOT = 5;
const PIXELS_PER_MINUTE = 6; // 1 minute = 6px, 5 mins = 30px, 90 mins = 540px


interface PracticeAgendaViewProps {
  game: Game;
  readOnly?: boolean;
  allowEditWhenLocked?: boolean;
}

export function PracticeAgendaView({ game, readOnly = false, allowEditWhenLocked = false }: PracticeAgendaViewProps) {
  const { user } = useAuth();
  const { drills } = useDrills(user);

  const dynamicDrillCategories = useMemo(() => {
    const categories: Record<string, Drill[]> = {};
    drills.forEach(drill => {
      const cat = drill.category || 'Uncategorized';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(drill);
    });
    return categories;
  }, [drills]);

  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activityForm, setActivityForm] = useState<Partial<PracticeActivity>>({
    name: '',
    duration: 15,
    type: 'team',
    category: '',
    drillName: '',
    groupMap: { 0: '', 1: '', 2: '', 3: '' },
    groupCategoryMap: { 0: '', 1: '', 2: '', 3: '' },
    startTimeOffset: 0
  });

  const agenda = game.practiceAgenda || [];
  const numGroups = game.numGroups || 3;
  const practiceDuration = game.duration || 90;

  // Process agenda for rendering
  const processedAgenda = useMemo(() => {
    let runningCumulative = 0;
    return agenda.map(activity => {
      const start = activity.startTimeOffset !== undefined ? activity.startTimeOffset : runningCumulative;
      const end = start + activity.duration;
      runningCumulative = end;
      return { ...activity, calculatedStart: start, calculatedEnd: end };
    }).sort((a, b) => a.calculatedStart - b.calculatedStart);
  }, [agenda]);

  const maxEndTime = Math.max(0, ...processedAgenda.map(a => a.calculatedEnd));

  const earliestGapStart = useMemo(() => {
    // We want the earliest chunk of time that is at least 15 min long
    // Sort events by start time.
    const sorted = [...processedAgenda].sort((a, b) => a.calculatedStart - b.calculatedStart);
    let checkTime = 0;
    const requiredDuration = 15;

    for (const activity of sorted) {
      if (activity.calculatedStart - checkTime >= requiredDuration) {
        return checkTime;
      }
      // Move checkTime to the end of the current activity, if it extends past checkTime
      checkTime = Math.max(checkTime, activity.calculatedEnd);
    }
    
    // Check if there is space at the end
    if (practiceDuration - checkTime > 0) {
      return checkTime; // Even if it's less than 15 min, it's the remaining block
    }
    
    return maxEndTime; // Default to maxEndTime if there's no gap
  }, [processedAgenda, practiceDuration, maxEndTime]);

  const scheduledTime = processedAgenda.reduce((sum, a) => sum + a.duration, 0);
  const remainingTime = practiceDuration - scheduledTime;

  const practiceNotes = game.practiceNotes || [];
  const noteSections = useMemo(() => {
    if (game.practiceNoteSections && game.practiceNoteSections.length > 0) {
      return game.practiceNoteSections;
    }
    // Backward compatibility: If we have old practiceNotes, migrate them to a "General" section
    if (practiceNotes.length > 0) {
      return [{
        id: 'general-section',
        title: 'General',
        notes: practiceNotes.map(n => ({ id: crypto.randomUUID(), text: n }))
      }];
    }
    return [];
  }, [game.practiceNoteSections, practiceNotes]);

  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');
  const [addingNoteToSectionId, setAddingNoteToSectionId] = useState<string | null>(null);
  const [editingNoteIndex, setEditingNoteIndex] = useState<{sectionId: string, index: number} | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionTitle, setEditingSectionTitle] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const formatStartTime = (minutesFromStart: number) => {
    if (!game.time) return `${minutesFromStart}m`;
    const [hours, mins] = game.time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins + minutesFromStart, 0);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, delta } = event;
    setActiveId(null);

    if (!active || readOnly) return;

    const activity = agenda.find(a => a.id === active.id);
    if (!activity) return;

    // Calculate new offset based on delta.y
    const minuteDelta = Math.round(delta.y / PIXELS_PER_MINUTE);
    const currentOffset = activity.startTimeOffset ?? 0;
    
    // Snap to 5 minute increments
    let newOffset = Math.round((currentOffset + minuteDelta) / MINUTES_PER_SLOT) * MINUTES_PER_SLOT;
    
    // Constraints: Don't go below 0 or beyond practice duration (roughly)
    newOffset = Math.max(0, Math.min(newOffset, Math.max(0, practiceDuration - 5)));
    
    if (newOffset !== currentOffset) {
      const updatedAgenda = agenda.map(a => 
        a.id === active.id ? { ...a, startTimeOffset: newOffset } : a
      );
      await firebaseService.updateGame(game.id, { practiceAgenda: updatedAgenda });
      toast.success(`Updated ${activity.name} start time`);
    }
  };

  const handleDeleteActivity = async (id: string) => {
    const updatedAgenda = agenda.filter(a => a.id !== id);
    await firebaseService.updateGame(game.id, { practiceAgenda: updatedAgenda });
    toast.success("Activity removed");
  };

  const handleSaveActivity = async () => {
    // Validation
    const finalDuration = parseInt(activityForm.duration as any);
    if (isNaN(finalDuration) || finalDuration <= 0) {
      toast.error("Please enter a valid duration");
      return;
    }

    if (activityForm.type === 'team') {
      if (!activityForm.category) {
        toast.error("Category is required for Whole Team activities");
        return;
      }
    } else if (activityForm.type === 'groups' || activityForm.type === 'rotating') {
      for (let i = 0; i < numGroups; i++) {
        if (!activityForm.groupCategoryMap?.[i]) {
          toast.error(`Category is required for Group ${i + 1}`);
          return;
        }
      }
    }

    let finalName = activityForm.name?.trim();
    if (!finalName) {
      if (activityForm.type === 'team') {
        finalName = activityForm.drillName || activityForm.category || 'Team Activity';
      } else if (activityForm.type === 'rotating') {
        finalName = 'Rotations';
      } else if (activityForm.type === 'groups') {
        finalName = 'Split Groups';
      }
    }

    if (editingActivityId) {
      // Update existing
      const updatedAgenda = agenda.map(a => 
        a.id === editingActivityId 
          ? { 
              ...a, 
              name: finalName!, 
              duration: finalDuration,
              type: activityForm.type as 'team' | 'groups' | 'rotating',
              category: activityForm.type === 'team' ? activityForm.category : undefined,
              drillName: activityForm.type === 'team' ? activityForm.drillName : undefined,
              groupMap: activityForm.type !== 'team' ? activityForm.groupMap : undefined,
              groupCategoryMap: activityForm.type !== 'team' ? activityForm.groupCategoryMap : undefined,
              startTimeOffset: activityForm.startTimeOffset ?? 0,
              notes: activityForm.notes || undefined
            } 
          : a
      );
      await firebaseService.updateGame(game.id, { practiceAgenda: updatedAgenda });
      toast.success("Activity updated");
    } else {
      // Add new
      const activity: PracticeActivity = {
        id: crypto.randomUUID(),
        name: finalName!,
        duration: finalDuration,
        type: activityForm.type as 'team' | 'groups' | 'rotating',
        category: activityForm.type === 'team' ? activityForm.category : undefined,
        drillName: activityForm.type === 'team' ? activityForm.drillName : undefined,
        groupMap: activityForm.type !== 'team' ? activityForm.groupMap : undefined,
        groupCategoryMap: activityForm.type !== 'team' ? activityForm.groupCategoryMap : undefined,
        startTimeOffset: activityForm.startTimeOffset ?? 0,
        notes: activityForm.notes || undefined
      };

      const updatedAgenda = [...agenda, activity];
      await firebaseService.updateGame(game.id, { practiceAgenda: updatedAgenda });
      toast.success("Activity added");
    }

    setIsAddingActivity(false);
    setEditingActivityId(null);
    setActivityForm({ name: '', duration: 15, type: 'team', category: '', drillName: '', groupMap: { 0: '', 1: '', 2: '', 3: '' }, groupCategoryMap: { 0: '', 1: '', 2: '', 3: '' }, startTimeOffset: 0, notes: '' });
  };

  const handleAddSection = async () => {
    if (!newSectionTitle.trim()) return;
    const newSection: PracticeNoteSection = {
      id: crypto.randomUUID(),
      title: newSectionTitle.trim(),
      notes: []
    };
    const updatedSections = [...noteSections, newSection];
    await firebaseService.updateGame(game.id, { 
      practiceNoteSections: updatedSections,
      practiceNotes: [] // Clear old format
    });
    setNewSectionTitle('');
    setIsAddingSection(false);
    toast.success("Section added");
  };

  const handleUpdateSection = async () => {
    if (!editingSectionId || !editingSectionTitle.trim()) return;
    const updatedSections = noteSections.map(s => 
      s.id === editingSectionId ? { ...s, title: editingSectionTitle.trim() } : s
    );
    await firebaseService.updateGame(game.id, { practiceNoteSections: updatedSections });
    setEditingSectionId(null);
    setEditingSectionTitle('');
    toast.success("Section renamed");
  };

  const handleDeleteSection = async (sectionId: string) => {
    const updatedSections = noteSections.filter(s => s.id !== sectionId);
    await firebaseService.updateGame(game.id, { practiceNoteSections: updatedSections });
    toast.success("Section removed");
  };

  const handleMoveSection = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= noteSections.length) return;

    const updatedSections = arrayMove(noteSections, index, newIndex);
    await firebaseService.updateGame(game.id, { practiceNoteSections: updatedSections });
  };

  const handleAddNoteToSection = async (sectionId: string) => {
    if (!newNote.trim()) return;
    const updatedSections = noteSections.map(s => {
      if (s.id === sectionId) {
        return { ...s, notes: [...s.notes, { id: crypto.randomUUID(), text: newNote.trim() }] };
      }
      return s;
    });
    await firebaseService.updateGame(game.id, { 
      practiceNoteSections: updatedSections,
      practiceNotes: []
    });
    setNewNote('');
    setAddingNoteToSectionId(null);
    toast.success("Note added");
  };

  const handleDeleteNote = async (sectionId: string, noteId: string) => {
    const updatedSections = noteSections.map(s => {
      if (s.id === sectionId) {
        return { ...s, notes: s.notes.filter(n => n.id !== noteId) };
      }
      return s;
    });
    await firebaseService.updateGame(game.id, { practiceNoteSections: updatedSections });
    toast.success("Note removed");
  };

  const handleUpdateNote = async () => {
    if (editingNoteIndex === null || !editingNoteText.trim()) return;
    const updatedSections = noteSections.map(s => {
      if (s.id === editingNoteIndex.sectionId) {
        const updatedNotes = [...s.notes];
        updatedNotes[editingNoteIndex.index] = { ...updatedNotes[editingNoteIndex.index], text: editingNoteText.trim() };
        return { ...s, notes: updatedNotes };
      }
      return s;
    });
    await firebaseService.updateGame(game.id, { practiceNoteSections: updatedSections });
    setEditingNoteIndex(null);
    setEditingNoteText('');
    toast.success("Note updated");
  };

  const handleNoteDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveNoteId(null);
    if (!over || readOnly) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find active section and over section
    const activeSection = noteSections.find(s => s.notes.some(n => n.id === activeId));
    const overSection = noteSections.find(s => s.id === overId || s.notes.some(n => n.id === overId));

    if (!activeSection || !overSection) return;

    if (activeSection.id === overSection.id) {
      // Reorder within same section
      const oldIndex = activeSection.notes.findIndex(n => n.id === activeId);
      const newIndex = overSection.notes.findIndex(n => n.id === overId);
      
      if (oldIndex !== newIndex) {
        const updatedSection = {
          ...activeSection,
          notes: arrayMove(activeSection.notes, oldIndex, newIndex)
        };
        const updatedSections = noteSections.map(s => s.id === updatedSection.id ? updatedSection : s);
        await firebaseService.updateGame(game.id, { practiceNoteSections: updatedSections });
      }
    } else {
      // Move between sections
      const activeIndex = activeSection.notes.findIndex(n => n.id === activeId);
      const note = activeSection.notes[activeIndex];
      
      const newActiveSection = {
        ...activeSection,
        notes: activeSection.notes.filter(n => n.id !== activeId)
      };
      
      let overIndex = overSection.notes.findIndex(n => n.id === overId);
      if (overIndex === -1) {
        overIndex = overSection.notes.length;
      }

      const newOverSection = {
        ...overSection,
        notes: [
          ...overSection.notes.slice(0, overIndex),
          note,
          ...overSection.notes.slice(overIndex)
        ]
      };

      const updatedSections = noteSections.map(s => {
        if (s.id === newActiveSection.id) return newActiveSection;
        if (s.id === newOverSection.id) return newOverSection;
        return s;
      });
      await firebaseService.updateGame(game.id, { practiceNoteSections: updatedSections });
      toast.success("Note moved");
    }
  };

  const handleEditClick = (activity: PracticeActivity) => {
    if (readOnly && !allowEditWhenLocked) return;
    setEditingActivityId(activity.id);
    setActivityForm({
      name: activity.name,
      duration: activity.duration,
      type: activity.type,
      category: activity.category || '',
      drillName: activity.drillName || '',
      groupMap: activity.groupMap || { 0: '', 1: '', 2: '', 3: '' },
      groupCategoryMap: activity.groupCategoryMap || { 0: '', 1: '', 2: '', 3: '' },
      startTimeOffset: activity.startTimeOffset,
      notes: activity.notes || ''
    });
    setIsAddingActivity(true);
  };

  // Generate 5-minute time slots for the background
  const timeSlots = Array.from({ length: Math.ceil(practiceDuration / MINUTES_PER_SLOT) + 1 }, (_, i) => i * MINUTES_PER_SLOT);

  return (
    <div className="space-y-8 pb-32">
      {/* Stats Cards */}
      {!readOnly && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 bg-slate-50 dark:bg-slate-800/50" hover={false}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                <Calendar size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{practiceDuration}m</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-slate-50 dark:bg-slate-800/50" hover={false}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${scheduledTime > practiceDuration ? 'text-rose-600' : 'text-emerald-600'}`}>
                <Clock size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Time</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{scheduledTime}m</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-slate-50 dark:bg-slate-800/50" hover={false}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                <Timer size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Remaining</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{remainingTime}m</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Calendar Header */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Timeline</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Drag blocks to schedule</p>
        </div>
        {!readOnly && (
          <Button 
            onClick={() => {
              setActivityForm({ 
                name: '', 
                duration: 15, 
                type: 'team', 
                category: '',
                drillName: '',
                groupMap: { 0: '', 1: '', 2: '', 3: '' },
                groupCategoryMap: { 0: '', 1: '', 2: '', 3: '' },
                startTimeOffset: Math.min(earliestGapStart, Math.max(0, practiceDuration - 5))
              });
              setEditingActivityId(null);
              setIsAddingActivity(true);
            }} 
            icon={Plus}
          >
            Add Block
          </Button>
        )}
      </div>

      {/* Calendar Grid */}
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(e) => setActiveId(e.active.id as string)}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis, restrictToFirstScrollableAncestor]}
      >
        <div className="relative border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 overflow-hidden shadow-xl print:shadow-none print:border-none">
          {/* Time Slots Background (Full Width) */}
          {!readOnly && timeSlots.map((slot, i) => i < timeSlots.length - 1 && (
            <div 
              key={`click-${slot}`}
              onClick={() => {
                setActivityForm({ 
                  name: '', 
                  duration: 15, 
                  type: 'team', 
                  groupMap: { 0: '', 1: '', 2: '', 3: '' },
                  startTimeOffset: slot 
                });
                setEditingActivityId(null);
                setIsAddingActivity(true);
              }}
              className="absolute left-0 right-0 group cursor-pointer hover:bg-slate-50 dark:hover:bg-indigo-500/5 transition-colors z-0 print:hidden"
              style={{ 
                top: `${slot * PIXELS_PER_MINUTE}px`, 
                height: `${MINUTES_PER_SLOT * PIXELS_PER_MINUTE}px` 
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                <div className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-sm z-30">
                  <Plus size={10} className="text-indigo-500" />
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none pt-0.5">Add Block @ {formatStartTime(slot)}</span>
                </div>
              </div>
            </div>
          ))}

          {/* Time Labels Sidebar */}
          <div className="absolute left-0 top-0 bottom-0 w-20 border-r border-slate-100 dark:border-slate-800 bg-slate-50/10 dark:bg-slate-800/5 z-0 pointer-events-none">
            {timeSlots.map(slot => (
              <div 
                key={slot} 
                className="absolute w-full px-2 flex items-start justify-end pr-3"
                style={{ top: `${slot * PIXELS_PER_MINUTE}px`, height: `${MINUTES_PER_SLOT * PIXELS_PER_MINUTE}px` }}
              >
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter leading-none pt-1">
                  {formatStartTime(slot)}
                </span>
              </div>
            ))}
          </div>

          {/* Grid Area */}
          <div 
            className="relative ml-20 pointer-events-none"
            style={{ height: `${practiceDuration * PIXELS_PER_MINUTE}px` }}
          >
            {/* Grid Lines */}
            {timeSlots.map(slot => (
              <div 
                key={slot} 
                className={`absolute left-0 right-0 border-t ${slot % 15 === 0 ? 'border-slate-200 dark:border-slate-700' : 'border-slate-100 dark:border-slate-800/50'}`}
                style={{ top: `${slot * PIXELS_PER_MINUTE}px` }}
              />
            ))}

            {/* Activities Container (Needs pointer events for dragging) */}
            <div className="relative h-full w-full pointer-events-auto">
              {processedAgenda.map(activity => (
                <DraggableActivity 
                  key={activity.id} 
                  activity={activity} 
                  readOnly={readOnly}
                  allowEditWhenLocked={allowEditWhenLocked}
                  onDelete={handleDeleteActivity}
                  onEdit={() => handleEditClick(activity)}
                  isOverlapping={processedAgenda.some(other => 
                    other.id !== activity.id && 
                    activity.calculatedStart < other.calculatedEnd && 
                    activity.calculatedEnd > other.calculatedStart
                  )}
                  numGroups={numGroups}
                  formatStartTime={formatStartTime}
                />
              ))}
            </div>
          </div>
        </div>

        <DragOverlay adjustScale={false}>
          {activeId ? (
            <ActivityItem 
              activity={processedAgenda.find(a => a.id === activeId)!} 
              isOverlay 
              numGroups={numGroups}
              formatStartTime={formatStartTime}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Notes Section with Sections */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(e) => setActiveNoteId(e.active.id as string)}
        onDragEnd={handleNoteDragEnd}
        modifiers={[restrictToWindowEdges]}
      >
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Practice Notes</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Organized training focus & reminders</p>
            </div>
            {!readOnly && (
              <Button 
                variant="outline" 
                size="sm" 
                icon={Plus}
                onClick={() => setIsAddingSection(true)}
              >
                New Section
              </Button>
            )}
          </div>

          {!readOnly && isAddingSection && (
            <Card className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/30" hover={false}>
              <div className="flex gap-3">
                <input
                  type="text"
                  autoFocus
                  placeholder="Section Title (e.g. Warmups, Drills, Reminders)..."
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddSection();
                    if (e.key === 'Escape') setIsAddingSection(false);
                  }}
                  className="flex-1 px-4 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-sm"
                />
                <Button onClick={handleAddSection}>Add Section</Button>
                <Button variant="outline" onClick={() => setIsAddingSection(false)}>Cancel</Button>
              </div>
            </Card>
          )}

          {noteSections.length > 0 ? (
            <div className="grid grid-cols-1 gap-8">
              {noteSections.map((section, index) => (
                <div key={section.id} className="space-y-4">
                  <div className="flex items-center justify-between group">
                    {editingSectionId === section.id ? (
                      <div className="flex gap-2 flex-1">
                        <input
                          type="text"
                          autoFocus
                          value={editingSectionTitle}
                          onChange={(e) => setEditingSectionTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdateSection();
                            if (e.key === 'Escape') setEditingSectionId(null);
                          }}
                          className="px-3 py-1 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-sm"
                        />
                        <button onClick={handleUpdateSection} className="text-emerald-500 font-bold text-xs uppercase">Save</button>
                        <button onClick={() => setEditingSectionId(null)} className="text-slate-400 font-bold text-xs uppercase">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">{section.title}</h4>
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">{section.notes.length}</span>
                        </div>
                        
                        {!readOnly && (
                          <div className="flex items-center gap-0.5">
                            <div className="flex items-center mr-2 border-r border-slate-200 dark:border-slate-700 pr-2 gap-0.5">
                              <button 
                                onClick={() => handleMoveSection(index, 'up')}
                                disabled={index === 0}
                                className="p-1 text-slate-400 hover:text-indigo-500 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                                title="Move Up"
                              >
                                <ArrowUp size={12} />
                              </button>
                              <button 
                                onClick={() => handleMoveSection(index, 'down')}
                                disabled={index === noteSections.length - 1}
                                className="p-1 text-slate-400 hover:text-indigo-500 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                                title="Move Down"
                              >
                                <ArrowDown size={12} />
                              </button>
                            </div>
                            <button 
                              onClick={() => {
                                setEditingSectionId(section.id);
                                setEditingSectionTitle(section.title);
                              }}
                              className="p-1 text-slate-400 hover:text-indigo-500 transition-colors"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button 
                              onClick={() => handleDeleteSection(section.id)}
                              className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {!readOnly && addingNoteToSectionId !== section.id && (
                      <button 
                        onClick={() => setAddingNoteToSectionId(section.id)}
                        className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:underline"
                      >
                        + Add Note
                      </button>
                    )}
                  </div>

                  <DroppableSection id={section.id}>
                    <SortableContext 
                      items={section.notes.map(n => n.id)} 
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 min-h-[40px]">
                        {section.notes.map((note, index) => (
                          <SortableNote 
                            key={note.id}
                            id={note.id}
                            note={note}
                            readOnly={readOnly}
                            isEditing={editingNoteIndex?.sectionId === section.id && editingNoteIndex?.index === index}
                            editingText={editingNoteText}
                            setEditingText={setEditingNoteText}
                            onEdit={() => {
                              setEditingNoteIndex({ sectionId: section.id, index });
                              setEditingNoteText(note.text);
                            }}
                            onSave={handleUpdateNote}
                            onCancel={() => setEditingNoteIndex(null)}
                            onDelete={() => handleDeleteNote(section.id, note.id)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DroppableSection>

                  {!readOnly && addingNoteToSectionId === section.id && (
                    <div className="flex gap-3 mt-2">
                      <input
                        type="text"
                        autoFocus
                        placeholder="Type note..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddNoteToSection(section.id);
                          if (e.key === 'Escape') setAddingNoteToSectionId(null);
                        }}
                        className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-sm"
                      />
                      <Button size="sm" onClick={() => handleAddNoteToSection(section.id)}>Save</Button>
                      <Button size="sm" variant="outline" onClick={() => setAddingNoteToSectionId(null)}>Cancel</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 mb-4">
                <ClipboardList size={24} />
              </div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No practice notes yet</p>
              {!readOnly && <p className="text-xs text-slate-500 mt-1">Add sections and notes to organize your session</p>}
            </div>
          )}
        </div>

        <DragOverlay>
          {activeNoteId ? (
            <div className="w-[300px]">
              <NoteCard 
                text={noteSections.flatMap(s => s.notes).find(n => n.id === activeNoteId)?.text || ''} 
                isDragging 
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Modal and Helper Components */}
      {isAddingActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <Card className="w-full max-w-md p-0 flex flex-col max-h-[90vh] shadow-2xl" hover={false}>
            <div className="flex items-center justify-between p-6 sm:p-8 pb-4 sm:pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {editingActivityId ? 'Edit Block' : 'Add Block'}
              </h3>
              <button 
                onClick={() => {
                  setIsAddingActivity(false);
                  setEditingActivityId(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-800 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
              <div className="space-y-4">
                {activityForm.type !== 'rotating' && (
                  <Input 
                    label="Activity Name (Optional)"
                    placeholder={activityForm.type === 'team' ? "Auto-fills from Category/Drill if blank" : "e.g. Infield Drill"}
                    value={activityForm.name}
                    onChange={(e) => {
                      const newName = e.target.value;
                      const updates: Partial<PracticeActivity> = { name: newName };
                      const lowerName = newName.toLowerCase().trim();
                      
                      if (activityForm.type === 'team' && !activityForm.category) {
                        if (lowerName === 'warmups' || lowerName === 'warmup') {
                          updates.category = 'Conditioning & Warm-Up';
                        } else if (lowerName === 'game') {
                          updates.category = 'Teamwork & Situational';
                        }
                      }
                      
                      setActivityForm({ ...activityForm, ...updates });
                    }}
                  />
                )}

                {activityForm.type === 'team' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Category *</label>
                      <select
                        value={activityForm.category}
                        onChange={(e) => setActivityForm({...activityForm, category: e.target.value, drillName: ''})}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-slate-900/5 dark:focus:ring-indigo-500/10 transition-all font-bold text-sm"
                      >
                        <option value="">Select Category...</option>
                        {Object.keys(dynamicDrillCategories).map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Drill (Optional)</label>
                      <select
                        value={activityForm.drillName || ''}
                        onChange={(e) => {
                          const drillName = e.target.value;
                          const drill = dynamicDrillCategories[activityForm.category || '']?.find(d => d.title === drillName);
                          setActivityForm({
                            ...activityForm, 
                            drillName,
                            drillId: drill?.id,
                            drillSetup: drill?.setup,
                            drillSteps: drill?.steps,
                            drillYoutubeUrl: drill?.youtubeUrl
                          });
                        }}
                        disabled={!activityForm.category}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-slate-900/5 dark:focus:ring-indigo-500/10 transition-all font-bold text-sm disabled:opacity-50"
                      >
                        <option value="">Select Drill...</option>
                        {(activityForm.category ? dynamicDrillCategories[activityForm.category] || [] : []).map(drill => (
                          <option key={drill.id} value={drill.title}>{drill.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Type</label>
                    <select
                      value={activityForm.type}
                      onChange={(e) => setActivityForm({...activityForm, type: e.target.value as 'team' | 'groups' | 'rotating'})}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-slate-900/5 dark:focus:ring-indigo-500/10 focus:border-slate-900 dark:focus:border-indigo-500 transition-all font-bold appearance-none"
                    >
                      <option value="team">Whole Team</option>
                      <option value="groups">Split Groups</option>
                      <option value="rotating">Rotating Groups</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Start Time</label>
                    <input 
                      type="time"
                      value={(() => {
                        if (!game.time) return "00:00";
                        const [h, m] = game.time.split(':').map(Number);
                        const totalMins = h * 60 + m + (activityForm.startTimeOffset || 0);
                        const outH = Math.floor(totalMins / 60) % 24;
                        const outM = totalMins % 60;
                        return `${String(outH).padStart(2, '0')}:${String(outM).padStart(2, '0')}`;
                      })()}
                      onChange={(e) => {
                        if (!game.time) return;
                        const [baseH, baseM] = game.time.split(':').map(Number);
                        const [h, m] = e.target.value.split(':').map(Number);
                        const baseTotal = baseH * 60 + baseM;
                        const newTotal = h * 60 + m;
                        
                        let calculatedOffset = newTotal - baseTotal;
                        
                        // Handle crossing midnight correctly for very late practices
                        if (calculatedOffset < -12 * 60) calculatedOffset += 24 * 60;
                        
                        // Ensure it's not past the end of the practice by more than - 1 minute
                        const maxAllowedOffset = Math.max(0, practiceDuration - 1);
                        calculatedOffset = Math.min(calculatedOffset, maxAllowedOffset);
                        calculatedOffset = Math.max(0, calculatedOffset); // Don't allow before practice starts
                        
                        setActivityForm({...activityForm, startTimeOffset: calculatedOffset});
                      }}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-slate-900/5 dark:focus:ring-indigo-500/10 focus:border-slate-900 dark:focus:border-indigo-500 transition-all font-bold dark:[color-scheme:dark]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Duration (m)</label>
                  <input 
                    type="number"
                    step="5"
                    min="5"
                    value={activityForm.duration === '' as any ? '' : activityForm.duration}
                    onChange={(e) => setActivityForm({...activityForm, duration: e.target.value === '' ? '' as any : parseInt(e.target.value)})}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-slate-900/5 dark:focus:ring-indigo-500/10 focus:border-slate-900 dark:focus:border-indigo-500 transition-all font-bold"
                  />
                </div>

                {activityForm.type !== 'team' && (
                  <div className="space-y-3 pt-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                      {activityForm.type === 'rotating' ? `Required Drills (One per Group, total ${numGroups})` : 'Group Drill Settings'}
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                      {Array.from({ length: numGroups }).map((_, i) => (
                        <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] font-black text-slate-500 w-12 uppercase tracking-tighter shrink-0 pt-2 sm:pt-0">
                            {activityForm.type === 'rotating' ? `Drill ${i + 1}` : `Grp ${i + 1}`}
                          </span>
                          <div className="flex-1 flex flex-col sm:flex-row gap-2 min-w-0">
                            <select
                              value={activityForm.groupCategoryMap?.[i] || ''}
                              onChange={(e) => setActivityForm({
                                ...activityForm, 
                                groupCategoryMap: { ...activityForm.groupCategoryMap, [i]: e.target.value },
                                groupMap: { ...activityForm.groupMap, [i]: '' } // Reset drill when category changes
                              })}
                              className="flex-1 min-w-0 px-3 py-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-indigo-500 transition-all text-xs font-bold"
                            >
                              <option value="">Select Category *</option>
                              {Object.keys(dynamicDrillCategories).map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                            <select
                              value={activityForm.groupMap?.[i] || ''}
                              onChange={(e) => {
                                const drillName = e.target.value;
                                setActivityForm({
                                  ...activityForm, 
                                  groupMap: { ...activityForm.groupMap, [i]: drillName }
                                })
                              }}
                              disabled={!activityForm.groupCategoryMap?.[i]}
                              className="flex-1 min-w-0 px-3 py-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-indigo-500 transition-all text-xs font-bold disabled:opacity-50"
                            >
                              <option value="">Select Drill (Optional)</option>
                              {(activityForm.groupCategoryMap?.[i] ? dynamicDrillCategories[activityForm.groupCategoryMap[i]] || [] : []).map(drill => (
                                <option key={drill.id} value={drill.title}>{drill.title}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2">Activity Notes (Optional)</label>
                <textarea
                  value={activityForm.notes || ''}
                  onChange={(e) => setActivityForm({...activityForm, notes: e.target.value})}
                  placeholder="Add context to this activity (e.g., focus on throws to first)"
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-slate-900/5 dark:focus:ring-indigo-500/10 focus:border-slate-900 dark:focus:border-indigo-500 transition-all font-bold text-sm min-h-[80px] resize-y"
                />
              </div>
            </div>

            <div className="flex gap-3 p-6 sm:p-8 pt-4 sm:pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button fullWidth onClick={handleSaveActivity}>{editingActivityId ? 'Update Block' : 'Add Block'}</Button>
              <Button fullWidth variant="outline" onClick={() => {
                setIsAddingActivity(false);
                setEditingActivityId(null);
              }}>Cancel</Button>
            </div>
          </Card>
        </div>
      )}

    </div>
  );
}

function DroppableSection({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id });
  return <div ref={setNodeRef}>{children}</div>;
}

function SortableNote({ 
  id, 
  note, 
  readOnly, 
  isEditing, 
  editingText, 
  setEditingText, 
  onEdit, 
  onSave, 
  onCancel, 
  onDelete 
}: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 60 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`p-4 bg-slate-50 dark:bg-slate-800/50 group h-full ${isDragging ? 'shadow-2xl ring-2 ring-indigo-500' : ''}`} hover={false}>
        {isEditing ? (
          <div className="flex gap-3 h-full items-center">
            <input
              type="text"
              autoFocus
              value={editingText}
              onChange={(e) => setEditingText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSave();
                if (e.key === 'Escape') onCancel();
              }}
              className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-sm"
            />
            <div className="flex gap-1">
              <Button size="sm" onClick={onSave}>Save</Button>
              <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-4 h-full">
            <div className="flex gap-3 flex-1 min-w-0 h-full items-start">
              {!readOnly && (
                <div {...attributes} {...listeners} className="mt-1 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-900 dark:hover:text-white shrink-0" style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}>
                  <GripVertical size={14} />
                </div>
              )}
              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300 break-words">{note.text}</p>
            </div>
            {!readOnly && (
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={onEdit}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={onDelete}
                  className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

function NoteCard({ text, isDragging }: { text: string; isDragging?: boolean }) {
  return (
    <Card className={`p-4 bg-white dark:bg-slate-800 shadow-2xl border-indigo-500 border-2 ${isDragging ? 'rotate-1 scale-105' : ''} z-[100]`} hover={false}>
      <div className="flex items-start gap-3">
        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{text}</p>
      </div>
    </Card>
  );
}

interface DraggableActivityProps {
  activity: any;
  readOnly: boolean;
  onDelete: (id: string) => void;
  onEdit: () => void;
  isOverlapping: boolean;
  numGroups: number;
  formatStartTime: (m: number) => string;
}

function DraggableActivity({ 
  activity, 
  readOnly, 
  allowEditWhenLocked,
  onDelete, 
  onEdit, 
  isOverlapping,
  numGroups,
  formatStartTime 
}: DraggableActivityProps & { allowEditWhenLocked?: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: activity.id,
    disabled: readOnly,
  });

  const style = transform ? {
    transform: `translate3d(0, ${transform.y}px, 0)`,
    zIndex: isDragging ? 50 : 20,
  } : {
    zIndex: 20,
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        position: 'absolute',
        top: `${activity.calculatedStart * PIXELS_PER_MINUTE}px`,
        height: `${activity.duration * PIXELS_PER_MINUTE}px`,
        left: '8px',
        right: '8px',
      }}
      className={`group transition-opacity ${isDragging ? 'opacity-50' : 'opacity-100'}`}
    >
      <ActivityItem 
        activity={activity} 
        attributes={attributes} 
        listeners={listeners}
        readOnly={readOnly}
        allowEditWhenLocked={allowEditWhenLocked}
        onDelete={onDelete}
        onEdit={onEdit}
        isOverlapping={isOverlapping}
        numGroups={numGroups}
        formatStartTime={formatStartTime}
      />
    </div>
  );
}

function ActivityItem({ 
  activity, 
  attributes, 
  listeners, 
  isOverlay, 
  readOnly, 
  allowEditWhenLocked,
  onDelete,
  onEdit,
  isOverlapping,
  numGroups,
  formatStartTime 
}: {
  activity: PracticeActivity & { calculatedStart: number; calculatedEnd: number };
  attributes?: any;
  listeners?: any;
  isOverlay?: boolean;
  readOnly?: boolean;
  allowEditWhenLocked?: boolean;
  onDelete?: (id: string) => void;
  onEdit?: () => void;
  isOverlapping?: boolean;
  numGroups: number;
  formatStartTime: (m: number) => string;
}) {
  const rotationDuration = Math.round(activity.duration / numGroups);

  return (
    <div 
      onClick={(e) => {
        // Only trigger edit if it wasn't a delete click or drag handle click
        if (onEdit && (!readOnly || allowEditWhenLocked)) onEdit();
      }}
      className={`h-full w-full rounded-2xl border flex flex-col overflow-hidden transition-all duration-300 ${
        isOverlay 
          ? 'bg-white dark:bg-slate-800 shadow-2xl scale-105 border-indigo-500 ring-4 ring-indigo-500/10 cursor-grabbing' 
          : activity.type === 'rotating'
            ? 'bg-emerald-50/90 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 shadow-sm cursor-pointer'
            : activity.type === 'groups'
              ? 'bg-amber-50/90 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50 hover:bg-amber-50 dark:hover:bg-amber-900/20 shadow-sm cursor-pointer'
              : 'bg-indigo-50/90 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 shadow-sm cursor-pointer'
      } ${isOverlapping ? 'ring-2 ring-rose-500/30 border-rose-300 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20' : ''}`}
    >
      <div className="flex-1 p-2 flex gap-3 min-w-0">
        {!readOnly && (
          <div 
            {...attributes} 
            {...listeners} 
            onClick={(e) => e.stopPropagation()} // Prevent edit modal on drag start
            className="w-6 shrink-0 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-grab active:cursor-grabbing bg-white/50 dark:bg-black/20 rounded-lg print:hidden"
            style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
          >
            <GripVertical size={14} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 overflow-hidden">
            <h4 className={`font-black uppercase tracking-tighter truncate leading-none ${
              activity.type === 'rotating' ? 'text-emerald-800 dark:text-emerald-400' :
              activity.type === 'groups' ? 'text-amber-800 dark:text-amber-400' : 'text-indigo-800 dark:text-indigo-400'
            }`}>
              {activity.name}
            </h4>
            <div className="flex items-center gap-1.5 shrink-0">
              {activity.type === 'rotating' && <RotateCw size={10} className="text-emerald-500 animate-spin-slow print:hidden" />}
              <span className={`text-[9px] font-black uppercase ${
                activity.type === 'rotating' ? 'text-emerald-700/60 dark:text-emerald-400/60' :
                activity.type === 'groups' ? 'text-amber-700/60 dark:text-amber-400/60' : 'text-indigo-700/60 dark:text-indigo-400/60'
              }`}>{activity.duration}m</span>
              {!readOnly && !isOverlay && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onDelete) onDelete(activity.id);
                  }}
                  className={`p-1 hover:bg-rose-500 hover:text-white rounded-md transition-colors print:hidden ${
                    activity.type === 'rotating' ? 'text-emerald-700/50 dark:text-emerald-400/50' :
                    activity.type === 'groups' ? 'text-amber-700/50 dark:text-amber-400/50' : 'text-indigo-700/50 dark:text-indigo-400/50'
                  }`}
                >
                  <Trash2 size={10} />
                </button>
              )}
            </div>
          </div>
          
          {activity.type === 'rotating' && (activity.groupMap || activity.groupCategoryMap) ? (
            <div className="mt-1.5 space-y-1.5 overflow-hidden">
              {Array.from({ length: numGroups }).map((_, r) => (
                <div key={r} className="border-t border-emerald-100/50 dark:border-emerald-800/30 pt-1 first:border-0 first:pt-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-[7px] font-black text-emerald-600 dark:text-emerald-500 bg-emerald-100 dark:bg-emerald-900/40 px-1 rounded uppercase tracking-tighter">
                      ROT {r + 1} • {formatStartTime(activity.calculatedStart + r * rotationDuration)}
                    </span>
                    <span className="text-[6px] font-bold text-slate-400 uppercase">{rotationDuration}m</span>
                  </div>
                  <div className="flex flex-wrap gap-x-1.5 gap-y-0.5">
                    {Array.from({ length: numGroups }).map((_, g) => {
                      const drillIndex = (g + r) % numGroups;
                      const drill = activity.groupMap?.[drillIndex] || activity.groupCategoryMap?.[drillIndex];
                      return drill && (
                        <span key={g} className="text-[7px] font-black text-slate-600 dark:text-slate-400 flex items-center gap-0.5 max-w-[60px] truncate">
                          <span className="w-1 h-1 rounded-full bg-indigo-400"></span>
                          G{g + 1}: {drill}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : activity.type === 'groups' && ((activity.groupMap && Object.values(activity.groupMap).some(Boolean)) || (activity.groupCategoryMap && Object.values(activity.groupCategoryMap).some(Boolean))) ? (
            <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1 overflow-hidden">
              {Object.entries(activity.groupCategoryMap || activity.groupMap || {}).map(([gi, _]) => {
                const arrIndex = parseInt(gi);
                const drillLabel = activity.groupMap?.[arrIndex] || activity.groupCategoryMap?.[arrIndex];
                return drillLabel && (
                  <span key={gi} className="text-[8px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-tighter flex items-center gap-1 truncate max-w-[80px]">
                    <span className="w-1 h-1 rounded-full bg-amber-400"></span>
                    G{arrIndex + 1}: {drillLabel as string}
                  </span>
                )
              })}
            </div>
          ) : (
            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1 truncate">
              {activity.type === 'rotating' ? 'Rotation System' : activity.type === 'groups' ? 'Split Groups' : 'Whole Team'}
            </p>
          )}

          {activity.notes && (
            <div className="mt-1 border-t border-slate-200/50 dark:border-slate-700/50 pt-1">
              <p className="text-[9px] font-bold text-slate-600 dark:text-slate-400 break-words leading-tight line-clamp-2">
                Note: {activity.notes}
              </p>
            </div>
          )}

          {isOverlapping && !isOverlay && (
            <div className="mt-1.5 px-2 py-0.5 bg-rose-500/10 text-rose-500 dark:text-rose-400 rounded-md text-[8px] font-black uppercase flex items-center gap-1.5 border border-rose-500/20 animate-pulse">
              <AlertCircle size={8} />
              Conflict Detected
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


