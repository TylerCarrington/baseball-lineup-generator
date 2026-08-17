import React, { useState } from 'react';
import { GuideSection } from '../../types';
import { Plus, Folder, Archive, Edit2, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { ConfirmationModal } from '../ui/ConfirmationModal';

interface SectionListProps {
  sections: GuideSection[];
  activeSectionId: string | null;
  onSelectSection: (sectionId: string) => void;
  onAddSection: (data: { name: string; description?: string; color?: string }) => Promise<any>;
  onUpdateSection: (sectionId: string, data: Partial<GuideSection>) => Promise<void>;
  onArchiveSection: (sectionId: string) => Promise<void>;
  perSectionMetrics: Record<string, { total: number; completed: number; percentage: number }>;
  isAdmin?: boolean;
}

const SECTION_COLORS: { id: string; label: string; bg: string; text: string; border: string; activeBg: string }[] = [
  { id: 'emerald', label: 'Emerald', bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800', activeBg: 'bg-emerald-600 text-white' },
  { id: 'amber', label: 'Amber', bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800', activeBg: 'bg-amber-600 text-white' },
  { id: 'indigo', label: 'Indigo', bg: 'bg-indigo-50 dark:bg-indigo-950/40', text: 'text-indigo-700 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-800', activeBg: 'bg-indigo-600 text-white' },
  { id: 'sky', label: 'Sky', bg: 'bg-sky-50 dark:bg-sky-950/40', text: 'text-sky-700 dark:text-sky-400', border: 'border-sky-200 dark:border-sky-800', activeBg: 'bg-sky-600 text-white' },
  { id: 'rose', label: 'Rose', bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800', activeBg: 'bg-rose-600 text-white' }
];

export const SectionList: React.FC<SectionListProps> = ({
  sections,
  activeSectionId,
  onSelectSection,
  onAddSection,
  onUpdateSection,
  onArchiveSection,
  perSectionMetrics
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<GuideSection | null>(null);
  const [sectionToArchive, setSectionToArchive] = useState<GuideSection | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('emerald');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check near duplicates
  const nearDuplicateMatch = sections.find(s => {
    if (editingSection && s.id === editingSection.id) return false;
    const lowerInput = name.trim().toLowerCase();
    const lowerExisting = s.name.trim().toLowerCase();
    if (!lowerInput) return false;
    if (lowerInput === lowerExisting) return true;
    // Common baseball aliases
    if ((lowerInput === 'hitting' && lowerExisting === 'batting') || (lowerInput === 'batting' && lowerExisting === 'hitting')) return true;
    if ((lowerInput === 'running' && lowerExisting.includes('running')) || (lowerInput.includes('run') && lowerExisting.includes('run'))) return true;
    return false;
  });

  const handleOpenCreate = () => {
    setName('');
    setDescription('');
    setColor('emerald');
    setEditingSection(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (e: React.MouseEvent, section: GuideSection) => {
    e.stopPropagation();
    setEditingSection(section);
    setName(section.name);
    setDescription(section.description || '');
    setColor(section.color || 'emerald');
    setIsCreateModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingSection) {
        await onUpdateSection(editingSection.id, {
          name: name.trim(),
          description: description.trim(),
          color
        });
      } else {
        const newSec = await onAddSection({
          name: name.trim(),
          description: description.trim(),
          color
        });
        if (newSec?.id) {
          onSelectSection(newSec.id);
        }
      }
      setIsCreateModalOpen(false);
      setEditingSection(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmArchive = async () => {
    if (sectionToArchive) {
      await onArchiveSection(sectionToArchive.id);
      setSectionToArchive(null);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Guide Sections ({sections.length})
        </h2>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
          title="Add Section"
        >
          <Plus size={14} />
          <span>New Section</span>
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        {sections.length === 0 && (
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-center flex flex-col items-center justify-center">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3">
              No sections created yet.
            </p>
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
            >
              <Plus size={14} />
              <span>Create Section</span>
            </button>
          </div>
        )}
        {sections.map((section) => {
          const isActive = section.id === activeSectionId;
          const metric = perSectionMetrics[section.id] || { total: 0, completed: 0, percentage: 0 };
          const colorConfig = SECTION_COLORS.find(c => c.id === (section.color || 'emerald')) || SECTION_COLORS[0];

          return (
            <div
              key={section.id}
              onClick={() => onSelectSection(section.id)}
              className={`group relative flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all duration-200 border ${
                isActive
                  ? 'bg-slate-900 dark:bg-emerald-600 text-white border-transparent shadow-md shadow-slate-900/10 dark:shadow-emerald-950/30'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : `${colorConfig.bg} ${colorConfig.text}`
                  }`}
                >
                  <Folder size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm tracking-tight truncate">
                      {section.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs mt-0.5 opacity-80">
                    <span>
                      {metric.completed}/{metric.total} Skills
                    </span>
                    <span>•</span>
                    <span className={metric.percentage === 100 ? 'text-emerald-400 font-semibold' : ''}>
                      {metric.percentage}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {metric.percentage === 100 && (
                  <CheckCircle2 size={16} className={isActive ? 'text-emerald-300' : 'text-emerald-500'} />
                )}

                {/* Edit & Archive on Hover */}
                <div className="opacity-0 group-hover:opacity-100 flex items-center transition-opacity">
                  <button
                    onClick={(e) => handleOpenEdit(e, section)}
                    className={`p-1.5 rounded-lg hover:bg-white/20 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
                    }`}
                    title="Edit Section"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSectionToArchive(section);
                    }}
                    className={`p-1.5 rounded-lg hover:bg-white/20 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 hover:text-rose-500'
                    }`}
                    title="Archive Section"
                  >
                    <Archive size={13} />
                  </button>
                </div>

                <ChevronRight
                  size={16}
                  className={`transition-transform group-hover:translate-x-0.5 ${
                    isActive ? 'text-white/60' : 'text-slate-300 dark:text-slate-600'
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Section Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {editingSection ? 'Edit Section' : 'Create Guide Section'}
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Section Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pitching, Hitting, Baserunning, Mental Game"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {nearDuplicateMatch && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
                  <AlertCircle size={16} className="shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <span className="font-bold">Similar Section Exists:</span> "{nearDuplicateMatch.name}" is already in your guide library. You can still save this if you want a separate section.
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Briefly describe what coaching points belong in this section..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Color Theme
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {SECTION_COLORS.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setColor(c.id)}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                        color === c.id
                          ? `${c.activeBg} ring-2 ring-emerald-500/50 shadow-sm`
                          : `${c.bg} ${c.text} ${c.border}`
                      }`}
                    >
                      <div className={`w-3 h-3 rounded-full ${c.activeBg}`} />
                      <span className="text-[10px]">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim()}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all"
                >
                  {isSubmitting ? 'Saving...' : editingSection ? 'Update Section' : 'Create Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Archiving Section */}
      <ConfirmationModal
        isOpen={Boolean(sectionToArchive)}
        title="Archive Section"
        message={`Are you sure you want to archive "${sectionToArchive?.name}"? Its articles and checklist items will be moved out of active views, but can be restored anytime.`}
        confirmText="Archive Section"
        onConfirm={confirmArchive}
        onClose={() => setSectionToArchive(null)}
        variant="danger"
      />
    </div>
  );
};
