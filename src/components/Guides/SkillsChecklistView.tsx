import React, { useState } from 'react';
import { GuideChecklistItem, GuideArticle, Drill, GuideProgress } from '../../types';
import { Check, Plus, BookOpen, Dumbbell, Trash2, Edit2, CheckCircle2, Circle, Sparkles, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { ConfirmationModal } from '../ui/ConfirmationModal';

interface SkillsChecklistViewProps {
  sectionId: string;
  sectionName: string;
  checklists: GuideChecklistItem[];
  articles: GuideArticle[];
  drills: Drill[];
  progressMap: Record<string, GuideProgress>;
  onToggleChecklist: (checklistId: string, isCompleted: boolean) => Promise<void>;
  onAddChecklist: (data: {
    sectionId: string;
    title: string;
    category?: string;
    description?: string;
    linkedArticleId?: string;
    linkedDrillId?: string;
  }) => Promise<any>;
  onUpdateChecklist: (checklistId: string, data: Partial<GuideChecklistItem>) => Promise<void>;
  onDeleteChecklist: (checklistId: string) => Promise<void>;
  onOpenArticle?: (article: GuideArticle) => void;
  onOpenDrill?: (drill: Drill) => void;
  activeSeasonName?: string;
  isAdmin?: boolean;
}

export const SkillsChecklistView: React.FC<SkillsChecklistViewProps> = ({
  sectionId,
  sectionName,
  checklists,
  articles,
  drills,
  progressMap,
  onToggleChecklist,
  onAddChecklist,
  onUpdateChecklist,
  onDeleteChecklist,
  onOpenArticle,
  onOpenDrill,
  activeSeasonName = 'Active Season',
  isAdmin = true
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'uncompleted' | 'completed'>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<GuideChecklistItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<GuideChecklistItem | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [linkedArticleId, setLinkedArticleId] = useState('');
  const [linkedDrillId, setLinkedDrillId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sectionChecklists = checklists.filter(c => c.sectionId === sectionId);
  const completedCount = sectionChecklists.filter(c => progressMap[c.id]?.isCompleted).length;
  const totalCount = sectionChecklists.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Filtered list
  const filteredChecklists = sectionChecklists.filter(item => {
    const isCompleted = progressMap[item.id]?.isCompleted || false;
    if (filterMode === 'completed') return isCompleted;
    if (filterMode === 'uncompleted') return !isCompleted;
    return true;
  });

  // Group by category
  const categories = Array.from(new Set(sectionChecklists.map(c => c.category || 'General')));

  const handleOpenAdd = () => {
    setTitle('');
    setCategory(categories[0] || 'General');
    setDescription('');
    setLinkedArticleId(articles[0]?.id || '');
    setLinkedDrillId('');
    setEditingItem(null);
    setIsAdding(true);
  };

  const handleOpenEdit = (item: GuideChecklistItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setCategory(item.category || 'General');
    setDescription(item.description || '');
    setLinkedArticleId(item.linkedArticleId || '');
    setLinkedDrillId(item.linkedDrillId || '');
    setIsAdding(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingItem) {
        await onUpdateChecklist(editingItem.id, {
          title: title.trim(),
          category: category.trim() || 'General',
          description: description.trim() || undefined,
          linkedArticleId: linkedArticleId || undefined,
          linkedDrillId: linkedDrillId || undefined
        });
      } else {
        await onAddChecklist({
          sectionId,
          title: title.trim(),
          category: category.trim() || 'General',
          description: description.trim() || undefined,
          linkedArticleId: linkedArticleId || undefined,
          linkedDrillId: linkedDrillId || undefined
        });
      }
      setIsAdding(false);
      setEditingItem(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-200">
      {/* Top Readiness Summary Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-md">
                {activeSeasonName} Readiness
              </span>
              <span className="text-xs font-bold text-slate-500">
                {completedCount} of {totalCount} Skills Covered
              </span>
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {sectionName} Skills Checklist
            </h3>
          </div>

          <div className="flex items-center gap-3">
            {/* Circular or Bar Progress Indicator */}
            <div className="text-right">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {percentage}%
              </span>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                {percentage === 100 ? 'Fully Covered!' : 'In Progress'}
              </p>
            </div>

            {isAdmin && (
              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-md shadow-emerald-600/20"
              >
                <Plus size={14} />
                <span>Add Skill</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden mt-4">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-2 flex-wrap px-1">
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterMode === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All ({sectionChecklists.length})
          </button>
          <button
            onClick={() => setFilterMode('uncompleted')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterMode === 'uncompleted'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            To Cover ({sectionChecklists.length - completedCount})
          </button>
          <button
            onClick={() => setFilterMode('completed')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterMode === 'completed'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Covered ({completedCount})
          </button>
        </div>

        <span className="text-xs text-slate-400 font-medium">
          Check off items as they are taught in practice
        </span>
      </div>

      {/* Add / Edit Inline Form Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                {editingItem ? 'Edit Skill Point' : 'Add New Skill Checkpoint'}
              </h3>
              <button
                onClick={() => setIsAdding(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Skill Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Backups: First base right field coverage"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Category Group
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Backups, Footwork, Drills"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Link to Guide Article
                  </label>
                  <select
                    value={linkedArticleId}
                    onChange={(e) => setLinkedArticleId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- None (Stand-alone) --</option>
                    {articles.map(art => (
                      <option key={art.id} value={art.id}>
                        {art.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Link to Drill Library Item (Optional)
                </label>
                <select
                  value={linkedDrillId}
                  onChange={(e) => setLinkedDrillId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- None --</option>
                  {drills.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.title} ({d.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Key Coaching Cue / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Key coaching verbal cue or reminder..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !title.trim()}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md"
                >
                  {isSubmitting ? 'Saving...' : editingItem ? 'Update Skill' : 'Add Skill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Checklist List */}
      <div className="flex flex-col gap-2.5">
        {filteredChecklists.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
            <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
              No checklist items matching this filter.
            </p>
            {isAdmin && (
              <button
                onClick={handleOpenAdd}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                <Plus size={14} />
                <span>Add Your First Skill Checkpoint</span>
              </button>
            )}
          </div>
        ) : (
          filteredChecklists.map((item) => {
            const isCompleted = progressMap[item.id]?.isCompleted || false;
            const linkedArticle = articles.find(a => a.id === item.linkedArticleId);
            const linkedDrill = drills.find(d => d.id === item.linkedDrillId);

            return (
              <div
                key={item.id}
                className={`group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border transition-all duration-200 gap-3 ${
                  isCompleted
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/60'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Left side: Checkbox + Title + Description */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => onToggleChecklist(item.id, !isCompleted)}
                    className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                      isCompleted
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'border-2 border-slate-300 dark:border-slate-600 hover:border-emerald-500 dark:hover:border-emerald-400 bg-white dark:bg-slate-800'
                    }`}
                  >
                    {isCompleted && <Check size={16} strokeWidth={3} />}
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-sm font-bold tracking-tight transition-all ${
                          isCompleted
                            ? 'text-slate-500 dark:text-slate-400 line-through decoration-emerald-500/70'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {item.title}
                      </span>

                      {item.category && item.category !== 'General' && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md">
                          {item.category}
                        </span>
                      )}
                    </div>

                    {item.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right side: Action Pills & Edit/Delete */}
                <div className="flex items-center gap-2 flex-wrap justify-end shrink-0 pl-9 sm:pl-0">
                  {linkedArticle && (
                    <button
                      onClick={() => onOpenArticle?.(linkedArticle)}
                      className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80 rounded-lg transition-colors"
                      title="Read Article Guide"
                    >
                      <BookOpen size={12} />
                      <span className="truncate max-w-[140px]">{linkedArticle.title}</span>
                    </button>
                  )}

                  {linkedDrill && (
                    <button
                      onClick={() => onOpenDrill?.(linkedDrill)}
                      className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/80 rounded-lg transition-colors"
                      title="View Practice Drill"
                    >
                      <Dumbbell size={12} />
                      <span className="truncate max-w-[140px]">{linkedDrill.title}</span>
                    </button>
                  )}

                  {isAdmin && (
                    <div className="opacity-0 group-hover:opacity-100 flex items-center transition-opacity">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Edit Skill"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => setItemToDelete(item)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete Skill"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Item Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(itemToDelete)}
        title="Delete Skill Checkpoint"
        message={`Are you sure you want to remove "${itemToDelete?.title}" from this section's skills checklist?`}
        confirmText="Delete Skill"
        onConfirm={async () => {
          if (itemToDelete) {
            await onDeleteChecklist(itemToDelete.id);
            setItemToDelete(null);
          }
        }}
        onClose={() => setItemToDelete(null)}
        variant="danger"
      />
    </div>
  );
};
