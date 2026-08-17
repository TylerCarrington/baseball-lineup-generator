import React, { useEffect } from 'react';
import { Drill } from '../../types';
import { 
  X, 
  Layers, 
  ListOrdered, 
  Lightbulb, 
  ExternalLink, 
  Video, 
  PlayCircle,
  BookOpen
} from 'lucide-react';
import { getCategoryTheme } from '../../lib/drillCategories';

interface DrillDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  drill: Drill | null | undefined;
  fallbackTitle?: string;
  fallbackCategory?: string;
}

function extractYoutubeId(url?: string): string | null {
  if (!url) return null;
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : null;
}

export const DrillDetailModal: React.FC<DrillDetailModalProps> = ({
  isOpen,
  onClose,
  drill,
  fallbackTitle,
  fallbackCategory
}) => {
  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const title = drill?.title || fallbackTitle || 'Drill Details';
  const category = drill?.category || fallbackCategory;
  const theme = getCategoryTheme(category);
  const youtubeId = extractYoutubeId(drill?.youtubeUrl);

  const hasDetails = Boolean(
    drill?.summary || 
    drill?.setup || 
    drill?.steps || 
    drill?.notes || 
    drill?.youtubeUrl
  );

  return (
    <div 
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 sm:p-7 pb-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="space-y-1.5 pr-4 min-w-0">
            {category && (
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider border ${theme.badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
                  {category}
                </span>
              </div>
            )}
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight">
              {title}
            </h3>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-sm shrink-0"
            title="Close (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-7 space-y-6">
          {/* Summary */}
          {drill?.summary && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                {drill.summary}
              </p>
            </div>
          )}

          {/* Setup & Equipment */}
          {drill?.setup && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Layers size={16} className="text-indigo-500" />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-200">
                  Setup & Equipment
                </h4>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {drill.setup}
              </div>
            </div>
          )}

          {/* Execution Steps */}
          {drill?.steps && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <ListOrdered size={16} className="text-indigo-500" />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-200">
                  Execution Steps
                </h4>
              </div>
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {drill.steps}
              </div>
            </div>
          )}

          {/* Coaching Points / Notes */}
          {drill?.notes && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Lightbulb size={16} className="text-amber-500" />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-200">
                  Coaching Focus & Tips
                </h4>
              </div>
              <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-2xl text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {drill.notes}
              </div>
            </div>
          )}

          {/* Video Demonstration */}
          {youtubeId && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Video size={16} className="text-red-500" />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-200">
                  Video Demonstration
                </h4>
              </div>
              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video w-full bg-slate-950 shadow-inner">
                <iframe 
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${youtubeId}`} 
                  title={title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* Non-embedded external resource */}
          {drill?.youtubeUrl && !youtubeId && (
            <div className="pt-2">
              <a 
                href={drill.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors"
              >
                <PlayCircle size={16} className="text-red-500" />
                Watch External Video Resource
                <ExternalLink size={14} className="text-slate-400" />
              </a>
            </div>
          )}

          {/* Fallback if no detailed content exists */}
          {!hasDetails && (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 mx-auto bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 rounded-xl flex items-center justify-center mb-3">
                <BookOpen size={20} />
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No extra instructions attached to this drill yet
              </p>
              <p className="text-xs font-medium text-slate-400 mt-1">
                You can add setup instructions, execution steps, and video links in the Drill Library.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          {drill?.id ? (
            <a
              href={`#/drills/${drill.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <ExternalLink size={13} />
              Open in Drill Library
            </a>
          ) : (
            <div />
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
