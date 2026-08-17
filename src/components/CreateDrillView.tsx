import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Drill } from '../types';
import { CATEGORIES, getCategoryTheme } from '../lib/drillCategories';

interface CreateDrillViewProps {
  onAddDrill: (data: Omit<Drill, 'id' | 'createdAt' | 'updatedAt'>) => Promise<any>;
  darkMode: boolean;
}

function extractYoutubeId(url: string): string | null {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : null;
}

export const CreateDrillView: React.FC<CreateDrillViewProps> = ({
  onAddDrill,
  darkMode
}) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    category: CATEGORIES[0],
    summary: '',
    setup: '',
    steps: '',
    notes: '',
    youtubeUrl: ''
  });

  const selectedTheme = getCategoryTheme(formData.category);
  const youtubeId = formData.youtubeUrl ? extractYoutubeId(formData.youtubeUrl) : null;

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.title.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const res = await onAddDrill({
        title: formData.title.trim(),
        category: formData.category,
        summary: formData.summary.trim() || undefined,
        setup: formData.setup.trim() || undefined,
        steps: formData.steps.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        youtubeUrl: formData.youtubeUrl.trim() || undefined
      });
      if (res && res.id) {
        navigate(`/drills/${res.id}`);
      } else {
        navigate('/drills');
      }
    } catch (error) {
      console.error('Failed to create drill:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`w-full max-w-4xl mx-auto pb-24 ${darkMode ? 'dark text-slate-200' : 'text-slate-800'}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={() => navigate('/drills')}
            className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Create New Drill
            </h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Add a new practice drill or training exercise to your team's library
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
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

        {/* Category */}
        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
            Category <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {CATEGORIES.map(cat => {
              const theme = getCategoryTheme(cat);
              const isSelected = formData.category === cat;
              return (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setFormData({...formData, category: cat})}
                  className={`flex items-center gap-2 p-3 rounded-xl text-xs font-bold border transition-all text-left ${
                    isSelected ? theme.filterActive : theme.filterInactive
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-white' : theme.dot}`} />
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
          {formData.youtubeUrl && !youtubeId && (
            <p className="text-xs text-amber-500 font-bold mt-1">
              Could not extract a YouTube video ID. The link will be shown as an external link.
            </p>
          )}
          {youtubeId && (
            <div className="mt-3 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video max-w-md bg-slate-900">
              <iframe 
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${youtubeId}`} 
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
            onClick={() => navigate('/drills')}
            className="px-6 py-3 font-bold text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={!formData.title.trim() || isSubmitting}
            className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-600/20"
          >
            {isSubmitting ? 'Creating Drill...' : 'Create Drill'}
          </button>
        </div>
      </form>
    </div>
  );
};
