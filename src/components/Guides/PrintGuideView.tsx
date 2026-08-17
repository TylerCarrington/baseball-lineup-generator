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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
