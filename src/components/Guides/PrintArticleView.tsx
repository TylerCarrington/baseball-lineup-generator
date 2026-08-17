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
      </div>
    </div>
  );
};
