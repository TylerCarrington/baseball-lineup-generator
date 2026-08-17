import React, { useEffect } from 'react';
import { GuideSection, GuideArticle, GuideChecklistItem, GuideProgress } from '../../types';
import Markdown from 'react-markdown';
import { Printer, ArrowLeft } from 'lucide-react';
import { normalizeImageUrl } from '../../lib/imageUtils';

interface PrintGuideViewProps {
  section: GuideSection;
  articles: GuideArticle[];
  checklists: GuideChecklistItem[];
  progressMap: Record<string, GuideProgress>;
  teamName?: string;
  seasonName?: string;
  onBack: () => void;
}

export const PrintGuideView: React.FC<PrintGuideViewProps> = ({
  section,
  articles,
  checklists,
  progressMap,
  teamName = 'Lineup+ Baseball',
  seasonName = 'Current Season',
  onBack
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
    }, 1000);
    return () => clearTimeout(timer);
  }, [section.id]);

  const sectionChecklists = checklists.filter(c => c.sectionId === section.id);
  const sectionArticles = articles.filter(a => a.sectionId === section.id && a.status === 'published');

  return (
    <div className="min-h-screen bg-white text-black p-6 sm:p-10 print:p-0">
      {/* On-screen controls (hidden in print) */}
      <div className="print:hidden max-w-3xl mx-auto mb-8 p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl"
        >
          <ArrowLeft size={14} />
          <span>Back to App</span>
        </button>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md"
        >
          <Printer size={16} />
          <span>Print / Save as PDF</span>
        </button>
      </div>

      {/* Printable Sheet */}
      <div className="max-w-3xl mx-auto flex flex-col gap-8 font-sans">
        {/* Header */}
        <div className="border-b-2 border-black pb-4 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-black">
              {teamName} — Coaching Binder
            </h1>
            <p className="text-sm font-semibold text-gray-800">
              Section: {section.name} • {seasonName}
            </p>
          </div>
          <div className="text-right text-xs text-gray-800 font-mono">
            Date: {new Date().toLocaleDateString()}
          </div>
        </div>

        {/* Section 1: Skills Checklist */}
        {sectionChecklists.length > 0 && (
          <div>
            <h2 className="text-lg font-black uppercase tracking-wider border-b border-black pb-1 mb-3 text-black">
              1. Skills & Fundamentals Checklist ({sectionChecklists.length} items)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {sectionChecklists.map((item) => {
                const isChecked = progressMap[item.id]?.isCompleted;
                return (
                  <div key={item.id} className="flex items-start gap-2.5 p-2 border border-black rounded bg-white">
                    <div className="w-4 h-4 border-2 border-black flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {isChecked ? '✓' : ''}
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-black">{item.title}</span>
                      {item.description && (
                        <p className="text-[10px] text-gray-700 leading-tight mt-0.5">{item.description}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Section 2: Articles & Mechanics */}
        <div className="flex flex-col gap-6">
          <h2 className="text-lg font-black uppercase tracking-wider border-b border-black pb-1 text-black">
            2. Written Guides & Breakdown
          </h2>

          {sectionArticles.map((art, idx) => (
            <div key={art.id} className="border-b border-gray-400 pb-6 page-break-inside-avoid">
              <h3 className="text-base font-bold uppercase mb-1 text-black">
                {idx + 1}. {art.title}
              </h3>
              {art.summary && (
                <p className="text-xs italic text-gray-800 mb-3">
                  Summary: {art.summary}
                </p>
              )}
              <div className="prose prose-sm max-w-none text-xs leading-relaxed text-black">
                <Markdown>{art.content}</Markdown>
              </div>

              {/* Reference Photos inside Print Binder */}
              {art.photos && art.photos.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-300">
                  <h4 className="text-xs font-bold uppercase mb-2 text-black">
                    Reference Photos ({art.photos.length})
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {art.photos.map((photo, pIdx) => {
                      const photoSrc = normalizeImageUrl(photo.url);
                      return (
                        <div key={pIdx} className="border border-gray-300 rounded overflow-hidden p-1 bg-white">
                          <img
                            src={photoSrc}
                            alt={photo.caption || `Diagram ${pIdx + 1}`}
                            referrerPolicy="no-referrer"
                            className="w-full h-36 object-cover rounded"
                          />
                          {photo.caption && (
                            <p className="text-[10px] text-gray-700 italic mt-1 text-center">{photo.caption}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Dugout Notes Area */}
        <div className="border border-black p-4 rounded mt-4 bg-white">
          <h4 className="text-xs font-bold uppercase mb-2 text-black">Coach Practice Notes & Observations</h4>
          <div className="h-20 border-b border-dashed border-gray-400 mb-4" />
          <div className="h-20 border-b border-dashed border-gray-400" />
        </div>
      </div>
    </div>
  );
};
