import React from 'react';
import { GuideArticle, Drill } from '../../types';
import { FileText, Youtube, Image as ImageIcon, Dumbbell, ChevronRight, Edit3, Archive } from 'lucide-react';

interface ArticleCardProps {
  article: GuideArticle;
  drills: Drill[];
  onSelect: (article: GuideArticle) => void;
  onEdit: (article: GuideArticle) => void;
  onArchive: (article: GuideArticle) => void;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  drills,
  onSelect,
  onEdit,
  onArchive
}) => {
  const linkedDrills = drills.filter(d => article.drillIds?.includes(d.id));
  const hasVideo = Boolean(article.youtubeUrls && article.youtubeUrls.length > 0);
  const hasPhotos = Boolean(article.photos && article.photos.length > 0);

  return (
    <div
      onClick={() => onSelect(article)}
      className="group relative bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 rounded-2xl p-5 shadow-xs hover:shadow-lg hover:shadow-emerald-950/5 transition-all duration-200 cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {article.status === 'draft' ? (
              <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 rounded-md">
                Draft
              </span>
            ) : (
              <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-md">
                Published
              </span>
            )}

            {hasVideo && (
              <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-md">
                <Youtube size={12} />
                <span>Video Included</span>
              </span>
            )}

            {hasPhotos && (
              <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 rounded-md">
                <ImageIcon size={12} />
                <span>{article.photos?.length} {article.photos?.length === 1 ? 'Photo' : 'Photos'}</span>
              </span>
            )}
          </div>

          {/* Edit / Archive Actions on Hover */}
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(article);
              }}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Edit Article"
            >
              <Edit3 size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onArchive(article);
              }}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
              title="Archive Article"
            >
              <Archive size={14} />
            </button>
          </div>
        </div>

        {/* Title & Summary */}
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
            <FileText size={16} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {article.title}
            </h3>
            {article.summary && (
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {article.summary}
              </p>
            )}
          </div>
        </div>

        {/* Linked Drills */}
        {linkedDrills.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Dumbbell size={11} /> Drills:
            </span>
            {linkedDrills.slice(0, 3).map(drill => (
              <span
                key={drill.id}
                className="px-2 py-0.5 text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg"
              >
                {drill.title}
              </span>
            ))}
            {linkedDrills.length > 3 && (
              <span className="text-[10px] font-bold text-slate-400">
                +{linkedDrills.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>
          {article.lastEditedBy?.displayName ? `By ${article.lastEditedBy.displayName}` : 'Guide Reference'}
        </span>
        <div className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 text-xs group-hover:translate-x-0.5 transition-transform">
          <span>Read Full Guide</span>
          <ChevronRight size={14} />
        </div>
      </div>
    </div>
  );
};
