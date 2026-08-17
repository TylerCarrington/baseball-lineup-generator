import React, { useState } from 'react';
import { GuideArticle, GuideSection, Drill } from '../../types';
import { extractYoutubeId } from '../../lib/youtube';
import { MarkdownContent } from './MarkdownContent';
import { normalizeImageUrl } from '../../lib/imageUtils';
import { ArrowLeft, Edit3, Youtube, Dumbbell, ExternalLink, Printer, CheckCircle, Clock, User, Sparkles } from 'lucide-react';

interface ArticleDetailViewProps {
  article: GuideArticle;
  section?: GuideSection;
  drills: Drill[];
  onBack: () => void;
  onEdit: () => void;
  onOpenDrill?: (drill: Drill) => void;
  isAdmin?: boolean;
}

export const ArticleDetailView: React.FC<ArticleDetailViewProps> = ({
  article,
  section,
  drills,
  onBack,
  onEdit,
  onOpenDrill,
  isAdmin = true
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const linkedDrills = drills.filter(d => article.drillIds?.includes(d.id));
  const primaryYoutubeUrl = article.youtubeUrls?.[0];
  const youtubeId = primaryYoutubeUrl ? extractYoutubeId(primaryYoutubeUrl) : null;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200 max-w-4xl mx-auto pb-16">
      {/* Top Header Actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to {section?.name || 'Guides'}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors shadow-2xs"
          >
            <Printer size={13} />
            <span className="hidden sm:inline">Print Guide</span>
          </button>

          {isAdmin && (
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-md shadow-emerald-600/20"
            >
              <Edit3 size={13} />
              <span>Edit Guide</span>
            </button>
          )}
        </div>
      </div>

      {/* Article Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-2 flex-wrap mb-4">
          {section && (
            <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 rounded-lg">
              {section.name}
            </span>
          )}

          {article.status === 'draft' ? (
            <span className="px-2 py-0.5 text-[11px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 rounded-md">
              Draft
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md">
              <CheckCircle size={12} className="text-emerald-500" />
              Published Reference
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
          {article.title}
        </h1>

        {article.summary && (
          <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
              <Sparkles size={13} />
              <span>Coaching Summary</span>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {article.summary}
            </p>
          </div>
        )}

        {/* Author / Timestamp metadata */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <User size={13} />
            <span>
              {article.lastEditedBy?.displayName ? `Edited by ${article.lastEditedBy.displayName}` : 'Coach Reference'}
            </span>
          </div>
          {article.updatedAt && (
            <div className="flex items-center gap-1">
              <Clock size={12} />
              <span>Updated recently</span>
            </div>
          )}
        </div>
      </div>

      {/* YouTube Video Section (if attached) */}
      {primaryYoutubeUrl && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
                <Youtube size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  Demonstration Video
                </h3>
                <p className="text-[11px] text-slate-500">Visual mechanics breakdown</p>
              </div>
            </div>

            <a
              href={primaryYoutubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400"
            >
              <span>Watch on YouTube</span>
              <ExternalLink size={12} />
            </a>
          </div>

          {youtubeId ? (
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 shadow-inner border border-slate-800">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0`}
                title={article.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          ) : (
            <div className="p-6 bg-slate-50 dark:bg-slate-800/60 rounded-2xl text-center">
              <p className="text-xs text-slate-500 mb-2">Embedded link format not recognized</p>
              <a
                href={primaryYoutubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold"
              >
                <Youtube size={14} />
                <span>Open Video Link</span>
              </a>
            </div>
          )}
        </div>
      )}

      {/* Main Written Content (Markdown) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xs">
        <MarkdownContent content={article.content} />
      </div>

      {/* Photo Gallery (if attached) */}
      {article.photos && article.photos.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight uppercase tracking-wider mb-4">
            Reference Photos ({article.photos.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {article.photos.map((photo, idx) => {
              const photoSrc = normalizeImageUrl(photo.url);
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedPhoto(photoSrc)}
                  className="group relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 cursor-pointer aspect-4/3 bg-slate-100 dark:bg-slate-800"
                >
                  <img
                    src={photoSrc}
                    alt={photo.caption || `Photo ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {photo.caption && (
                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-[11px] text-white font-medium">
                      {photo.caption}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cross-Linked Drills */}
      {linkedDrills.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Dumbbell size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                Recommended Practice Drills ({linkedDrills.length})
              </h3>
              <p className="text-xs text-slate-500">Reinforce these mechanics in live practice stations</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {linkedDrills.map((drill) => (
              <div
                key={drill.id}
                onClick={() => onOpenDrill?.(drill)}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 hover:border-indigo-500/50 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 cursor-pointer transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-md">
                      {drill.category || 'Drill'}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {drill.title}
                  </h4>
                  {drill.summary && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                      {drill.summary}
                    </p>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                  <span>View Step-by-Step</span>
                  <ExternalLink size={12} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Photo Lightbox Modal */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={selectedPhoto}
              alt="Enlarged reference"
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
            />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-3 right-3 px-3 py-1.5 bg-black/60 hover:bg-black/90 text-white text-xs font-bold rounded-xl"
            >
              Close ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
