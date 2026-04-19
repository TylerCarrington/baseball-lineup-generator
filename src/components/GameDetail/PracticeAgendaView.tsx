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
  RotateCw
} from 'lucide-react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDraggable,
  useDroppable,
  DragOverlay,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import {
  restrictToVerticalAxis,
  restrictToFirstScrollableAncestor
} from '@dnd-kit/modifiers';
import { Game, PracticeActivity } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { firebaseService } from '../../services/firebaseService';
import { toast } from 'sonner';

const MINUTES_PER_SLOT = 5;
const PIXELS_PER_MINUTE = 6; // 1 minute = 6px, 5 mins = 30px, 90 mins = 540px

const DRILL_CATEGORIES: Record<string, string[]> = {
  "Hitting & Offense": [
    "Batting practice",
    "Tee work",
    "Soft toss drills",
    "Bunting practice",
    "Live at-bats"
  ],
  "Fielding & Defense": [
    "Ground ball drills",
    "Fly ball shagging",
    "Double play practice",
    "Infield/outfield drills",
    "First step reactions"
  ],
  "Throwing & Pitching": [
    "Long toss",
    "Bullpen sessions",
    "Pitcher's warm-up",
    "Pick-off move practice",
    "Catching bullpens"
  ],
  "Base Running": [
    "Baserunning drills",
    "Leadoff practice",
    "Stealing bases",
    "Sliding practice",
    "Home-to-first sprints"
  ],
  "Conditioning & Warm-Up": [
    "Dynamic stretching",
    "Running poles",
    "Agility ladder drills",
    "Arm circles",
    "Sprints"
  ],
  "Teamwork & Situational": [
    "Rundown practice",
    "Cutoff/relay drills",
    "Bunt coverage",
    "First and third defense",
    "Situational scrimmage"
  ]
};

interface PracticeAgendaViewProps {
  game: Game;
  readOnly?: boolean;
}

export function PracticeAgendaView({ game, readOnly = false }: PracticeAgendaViewProps) {
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
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
              duration: activityForm.duration || 10,
              type: activityForm.type as 'team' | 'groups' | 'rotating',
              category: activityForm.type === 'team' ? activityForm.category : undefined,
              drillName: activityForm.type === 'team' ? activityForm.drillName : undefined,
              groupMap: activityForm.type !== 'team' ? activityForm.groupMap : undefined,
              groupCategoryMap: activityForm.type !== 'team' ? activityForm.groupCategoryMap : undefined,
              startTimeOffset: activityForm.startTimeOffset ?? 0
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
        duration: activityForm.duration || 10,
        type: activityForm.type as 'team' | 'groups' | 'rotating',
        category: activityForm.type === 'team' ? activityForm.category : undefined,
        drillName: activityForm.type === 'team' ? activityForm.drillName : undefined,
        groupMap: activityForm.type !== 'team' ? activityForm.groupMap : undefined,
        groupCategoryMap: activityForm.type !== 'team' ? activityForm.groupCategoryMap : undefined,
        startTimeOffset: activityForm.startTimeOffset ?? 0
      };

      const updatedAgenda = [...agenda, activity];
      await firebaseService.updateGame(game.id, { practiceAgenda: updatedAgenda });
      toast.success("Activity added");
    }

    setIsAddingActivity(false);
    setEditingActivityId(null);
    setActivityForm({ name: '', duration: 15, type: 'team', category: '', drillName: '', groupMap: { 0: '', 1: '', 2: '', 3: '' }, groupCategoryMap: { 0: '', 1: '', 2: '', 3: '' }, startTimeOffset: 0 });
  };

  const handleEditClick = (activity: PracticeActivity) => {
    if (readOnly) return;
    setEditingActivityId(activity.id);
    setActivityForm({
      name: activity.name,
      duration: activity.duration,
      type: activity.type,
      category: activity.category || '',
      drillName: activity.drillName || '',
      groupMap: activity.groupMap || { 0: '', 1: '', 2: '', 3: '' },
      groupCategoryMap: activity.groupCategoryMap || { 0: '', 1: '', 2: '', 3: '' },
      startTimeOffset: activity.startTimeOffset
    });
    setIsAddingActivity(true);
  };

  // Generate 5-minute time slots for the background
  const timeSlots = Array.from({ length: Math.ceil(practiceDuration / MINUTES_PER_SLOT) + 1 }, (_, i) => i * MINUTES_PER_SLOT);

  return (
    <div className="space-y-8 pb-32">
      {/* Stats Cards */}
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

      {/* Calendar Header */}
      <div className="flex items-center justify-between">
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
        <div className="relative border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 overflow-hidden shadow-xl">
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
              className="absolute left-0 right-0 group cursor-pointer hover:bg-slate-50 dark:hover:bg-indigo-500/5 transition-colors z-0"
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

      {/* Modal and Helper Components */}
      {isAddingActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6 sm:p-8 space-y-6 shadow-2xl" hover={false}>
            <div className="flex items-center justify-between">
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

            <div className="space-y-4">
              {activityForm.type !== 'rotating' && (
                <Input 
                  label="Activity Name (Optional)"
                  placeholder={activityForm.type === 'team' ? "Auto-fills from Category/Drill if blank" : "e.g. Infield Drill"}
                  value={activityForm.name}
                  onChange={(e) => setActivityForm({...activityForm, name: e.target.value})}
                />
              )}

              {activityForm.type === 'team' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Category *</label>
                    <select
                      value={activityForm.category}
                      onChange={(e) => setActivityForm({...activityForm, category: e.target.value, drillName: ''})}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-slate-900/5 dark:focus:ring-indigo-500/10 transition-all font-bold text-sm"
                    >
                      <option value="">Select Category...</option>
                      {Object.keys(DRILL_CATEGORIES).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Drill (Optional)</label>
                    <select
                      value={activityForm.drillName}
                      onChange={(e) => setActivityForm({...activityForm, drillName: e.target.value})}
                      disabled={!activityForm.category}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-slate-900/5 dark:focus:ring-indigo-500/10 transition-all font-bold text-sm disabled:opacity-50"
                    >
                      <option value="">Select Drill...</option>
                      {(activityForm.category ? DRILL_CATEGORIES[activityForm.category] : []).map(drill => (
                        <option key={drill} value={drill}>{drill}</option>
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
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-slate-900/5 dark:focus:ring-indigo-500/10 focus:border-slate-900 dark:focus:border-indigo-500 transition-all font-bold appearance-none"
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
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-slate-900/5 dark:focus:ring-indigo-500/10 focus:border-slate-900 dark:focus:border-indigo-500 transition-all font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Duration (m)</label>
                <input 
                  type="number"
                  step="5"
                  min="5"
                  value={activityForm.duration}
                  onChange={(e) => setActivityForm({...activityForm, duration: Math.max(5, parseInt(e.target.value) || 5)})}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-slate-900/5 dark:focus:ring-indigo-500/10 focus:border-slate-900 dark:focus:border-indigo-500 transition-all font-bold"
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
                            className="flex-1 min-w-0 px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-indigo-500 transition-all text-xs font-bold"
                          >
                            <option value="">Select Category *</option>
                            {Object.keys(DRILL_CATEGORIES).map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                          <select
                            value={activityForm.groupMap?.[i] || ''}
                            onChange={(e) => setActivityForm({
                              ...activityForm, 
                              groupMap: { ...activityForm.groupMap, [i]: e.target.value }
                            })}
                            disabled={!activityForm.groupCategoryMap?.[i]}
                            className="flex-1 min-w-0 px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-indigo-500 transition-all text-xs font-bold disabled:opacity-50"
                          >
                            <option value="">Select Drill (Optional)</option>
                            {(activityForm.groupCategoryMap?.[i] ? DRILL_CATEGORIES[activityForm.groupCategoryMap[i]] : []).map(drill => (
                              <option key={drill} value={drill}>{drill}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
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
  onDelete, 
  onEdit, 
  isOverlapping,
  numGroups,
  formatStartTime 
}: DraggableActivityProps) {
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
        if (onEdit && !readOnly) onEdit();
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
            className="w-6 shrink-0 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-grab active:cursor-grabbing bg-white/50 dark:bg-black/20 rounded-lg"
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
              {activity.type === 'rotating' && <RotateCw size={10} className="text-emerald-500 animate-spin-slow" />}
              <span className="text-[9px] font-black opacity-60 uppercase">{activity.duration}m</span>
              {!readOnly && !isOverlay && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onDelete) onDelete(activity.id);
                  }}
                  className="p-1 hover:bg-rose-500 hover:text-white rounded-md transition-colors"
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


