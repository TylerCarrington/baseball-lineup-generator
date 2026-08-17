import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Drill } from '../types';
import { ArrowLeft, Edit2, Trash2, ExternalLink } from 'lucide-react';
import { CATEGORIES, getCategoryTheme } from '../lib/drillCategories';
import { ConfirmationModal } from './ui/ConfirmationModal';

interface DrillDetailViewProps {
  drills: Drill[];
  isAdmin: boolean;
  onUpdateDrill: (id: string, data: Partial<Drill>) => Promise<void>;
  onDeleteDrill: (id: string) => Promise<void>;
  darkMode: boolean;
}

function extractYoutubeId(url: string): string | null {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : null;
}

export const DrillDetailView: React.FC<DrillDetailViewProps> = ({
  drills,
  isAdmin,
  onUpdateDrill,
  onDeleteDrill,
  darkMode
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const drill = drills.find(d => d.id === id);
  const theme = getCategoryTheme(drill?.category);
  
  const [formData, setFormData] = useState({
    title: '',
    category: CATEGORIES[0],
    summary: '',
    setup: '',
    steps: '',
    notes: '',
    youtubeUrl: ''
  });

  useEffect(() => {
    if (drill) {
      setFormData({
        title: drill.title,
        category: drill.category || CATEGORIES[0],
        summary: drill.summary || '',
        setup: drill.setup || '',
        steps: drill.steps || '',
        notes: drill.notes || '',
        youtubeUrl: drill.youtubeUrl || ''
      });
    }
  }, [drill]);

  if (!drill) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8">
        <p className="text-slate-500 font-medium mb-4">Drill not found or loading...</p>
        <button 
          onClick={() => navigate('/drills')}
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold"
        >
          Back to Library
        </button>
      </div>
    );
  }

  const handleSave = async () => {
    if (!formData.title.trim()) return;
    await onUpdateDrill(drill.id, {
      title: formData.title.trim(),
      category: formData.category,
      summary: formData.summary.trim() || undefined,
      setup: formData.setup.trim() || undefined,
      steps: formData.steps.trim() || undefined,
      notes: formData.notes.trim() || undefined,
      youtubeUrl: formData.youtubeUrl.trim() || undefined
    });
    setIsEditing(false);
  };

  const youtubeId = drill.youtubeUrl ? extractYoutubeId(drill.youtubeUrl) : null;
  const editYoutubeId = formData.youtubeUrl ? extractYoutubeId(formData.youtubeUrl) : null;

  return (
    <div className={`w-full max-w-4xl mx-auto pb-24 ${darkMode ? 'dark text-slate-200' : 'text-slate-800'}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={() => {
              if (isEditing) {
                setIsEditing(false);
              } else {
                navigate('/drills');
              }
            }}
            className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              {isEditing ? 'Edit Drill' : drill.title}
            </h1>
            {isEditing ? (
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Update drill instructions, category, and coaching notes
              </p>
            ) : (
              <div className="mt-1.5 flex items-center gap-3 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${theme.badge}`}>
                  <span className={`w-2 h-2 rounded-full ${theme.dot}`} />
                  {drill.category || 'Uncategorized'}
                </span>
                {drill.summary && (
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {drill.summary}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {!isEditing && isAdmin && (
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
            >
              <Edit2 size={18} />
              Edit Drill
            </button>
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl font-bold hover:bg-red-100 dark:hover:bg-red-500/20 transition-all shadow-sm"
            >
              <Trash2 size={18} />
              Delete
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }} 
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm"
        >
          {/* Title */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Drill Name <span className="text-rose-500">*</span>
            </label>
            <input 
              type="text" 
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-base"
              placeholder="e.g. Infield 6-4-3 Double Play Drill"
              required
              autoFocus
            />
          </div>

          {/* Category Picker */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Category <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {CATEGORIES.map(cat => {
                const catTheme = getCategoryTheme(cat);
                const isSelected = formData.category === cat;
                return (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => setFormData({...formData, category: cat})}
                    className={`flex items-center gap-2 p-3 rounded-xl text-xs font-bold border transition-all text-left ${
                      isSelected ? catTheme.filterActive : catTheme.filterInactive
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-white' : catTheme.dot}`} />
                    <span className="truncate">{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Short Summary */}
          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Short Summary (Optional)
              </label>
              <span className="text-[10px] font-bold text-slate-400">
                {formData.summary.length}/140
              </span>
            </div>
            <input 
              type="text" 
              value={formData.summary}
              onChange={(e) => setFormData({...formData, summary: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
              placeholder="e.g. Quick infield footwork, glove positioning, and quick release transitions"
              maxLength={140}
            />
          </div>

          {/* Setup */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Setup & Equipment (Optional)
            </label>
            <textarea 
              value={formData.setup}
              onChange={(e) => setFormData({...formData, setup: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium min-h-[110px]"
              placeholder="e.g. SS and 2B at respective positions, bucket of baseballs behind mound, 1st base target net..."
            />
          </div>

          {/* Execution Steps */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Execution Steps (Optional)
            </label>
            <textarea 
              value={formData.steps}
              onChange={(e) => setFormData({...formData, steps: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium min-h-[160px]"
              placeholder="1. Coach hits grounder to SS.&#10;2. SS charges, fields with soft hands, makes underhand feed to 2B.&#10;3. 2B crosses the bag, clears the lane, and makes a strong throw to 1B."
            />
          </div>

          {/* Coaching Notes */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Coaching Notes & Focus Points (Optional)
            </label>
            <textarea 
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium min-h-[100px]"
              placeholder="Key things to emphasize: stays low through the ball, eyes on target before throw, safety clear on the turn..."
            />
          </div>

          {/* YouTube URL */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              YouTube Video URL (Optional)
            </label>
            <input 
              type="url" 
              value={formData.youtubeUrl}
              onChange={(e) => setFormData({...formData, youtubeUrl: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
              placeholder="https://www.youtube.com/watch?v=..."
            />
            {formData.youtubeUrl && !editYoutubeId && (
              <p className="text-xs text-amber-500 font-bold mt-1">
                Could not extract a YouTube video ID. The link will be shown as an external link.
              </p>
            )}
            {editYoutubeId && (
              <div className="mt-3 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video max-w-md bg-slate-900">
                <iframe 
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${editYoutubeId}`} 
                  title="Video Preview"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button 
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-6 py-3 font-bold text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={!formData.title.trim()}
              className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-600/20"
            >
              Save Changes
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-6 sm:p-8 space-y-8">
            {drill.setup && (
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  Setup
                </h4>
                <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                  <p className="text-base font-medium text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{drill.setup}</p>
                </div>
              </div>
            )}

            {drill.steps && (
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  Execution Steps
                </h4>
                <div className="p-5 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl">
                  <p className="text-base font-medium text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{drill.steps}</p>
                </div>
              </div>
            )}

            {drill.notes && (
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  Coaching Notes
                </h4>
                <div className="p-5 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-500/20 rounded-2xl">
                  <p className="text-base font-medium text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{drill.notes}</p>
                </div>
              </div>
            )}

            {!drill.setup && !drill.steps && !drill.notes && !drill.youtubeUrl && (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  No additional setup or execution details have been added for this drill yet. Click "Edit Drill" above to add instructions.
                </p>
              </div>
            )}

            {/* Video Demonstration at bottom */}
            {youtubeId && (
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  Video Demonstration
                </h4>
                <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video max-w-2xl bg-slate-900 shadow-sm">
                  <iframe 
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${youtubeId}`} 
                    title={drill.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            )}
            
            {drill.youtubeUrl && !youtubeId && (
              <div className="pt-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  External Resource
                </h4>
                <a 
                  href={drill.youtubeUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-2 px-5 py-3 bg-slate-50 dark:bg-slate-900 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm transition-colors"
                >
                  <ExternalLink size={18} /> Open External Link
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        title="Delete Drill"
        message={`Are you sure you want to delete "${drill.title}"? This action cannot be undone.`}
        confirmText={isDeleting ? "Deleting..." : "Delete Drill"}
        variant="danger"
        onClose={() => !isDeleting && setShowDeleteConfirm(false)}
        onConfirm={async () => {
          try {
            setIsDeleting(true);
            await onDeleteDrill(drill.id);
            navigate('/drills');
          } catch (error) {
            console.error('Failed to delete drill:', error);
            setIsDeleting(false);
            setShowDeleteConfirm(false);
          }
        }}
      />
    </div>
  );
};
