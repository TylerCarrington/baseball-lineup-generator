import React, { useEffect } from 'react';
import { GuideArticle, GuideSection, Drill } from '../../types';
import Markdown from 'react-markdown';
import { Printer, ArrowLeft, Dumbbell } from 'lucide-react';
import { normalizeImageUrl } from '../../lib/imageUtils';

interface PrintArticleViewProps {
  article: GuideArticle;
  section?: GuideSection;
  drills?: Drill[];
  teamName?: string;
  seasonName?: string;
  onBack: () => void;
}

export const PrintArticleView: React.FC<PrintArticleViewProps> = ({
  article,
  section,
  drills = [],
  teamName = 'Lineup+ Baseball',
  seasonName = 'Current Season',
  onBack
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
    }, 1000);
    return () => clearTimeout(timer);
  }, [article.id]);

  const linkedDrills = drills.filter(d => article.drillIds?.includes(d.id));

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
      <div className="max-w-3xl mx-auto flex flex-col gap-6 font-sans">
        {/* Header */}
        <div className="border-b-2 border-black pb-4 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-black">
              {teamName} — Coaching Guide
            </h1>
            <p className="text-sm font-semibold text-gray-800">
              {section ? `Section: ${section.name} • ` : ''}{seasonName}
            </p>
          </div>
          <div className="text-right text-xs text-gray-800 font-mono">
            Date: {new Date().toLocaleDateString()}
          </div>
        </div>

        {/* Article Header */}
        <div>
          <h2 className="text-xl font-black uppercase text-black mb-1">
            {article.title}
          </h2>
          {article.summary && (
            <p className="text-sm italic text-gray-800 border-l-2 border-black pl-3 py-0.5 mt-1">
              {article.summary}
            </p>
          )}
        </div>

        {/* Article Body */}
        <div className="prose prose-sm max-w-none text-xs leading-relaxed text-black">
          <Markdown>{article.content}</Markdown>
        </div>

        {/* Reference Photos */}
        {article.photos && article.photos.length > 0 && (
          <div className="pt-4 border-t border-gray-400">
            <h3 className="text-xs font-bold uppercase mb-3 text-black">
              Reference Diagrams & Photos ({article.photos.length})
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {article.photos.map((photo, idx) => {
                const photoSrc = normalizeImageUrl(photo.url);
                return (
                  <div key={idx} className="border border-gray-300 rounded overflow-hidden p-1.5 bg-white">
                    <img
                      src={photoSrc}
                      alt={photo.caption || `Diagram ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-44 object-cover rounded"
                    />
                    {photo.caption && (
                      <p className="text-[11px] text-gray-700 italic mt-1.5 text-center font-medium">
                        {photo.caption}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Linked Drills */}
        {linkedDrills.length > 0 && (
          <div className="pt-4 border-t border-gray-400">
            <h3 className="text-xs font-bold uppercase mb-2 text-black flex items-center gap-1.5">
              <Dumbbell size={14} /> Recommended Practice Drills
            </h3>
            <div className="space-y-2">
              {linkedDrills.map((drill) => (
                <div key={drill.id} className="p-2 border border-black rounded bg-white text-xs">
                  <div className="font-bold text-black">{drill.title}</div>
                  {drill.summary && <div className="text-[11px] text-gray-700 mt-0.5">{drill.summary}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dugout Notes Area */}
        <div className="border border-black p-4 rounded mt-4 bg-white">
          <h4 className="text-xs font-bold uppercase mb-2 text-black">Coach Practice Notes & Observations</h4>
          <div className="h-16 border-b border-dashed border-gray-400 mb-3" />
          <div className="h-16 border-b border-dashed border-gray-400" />
        </div>
      </div>
    </div>
  );
};
