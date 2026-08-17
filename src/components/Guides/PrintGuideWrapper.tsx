import React from 'react';
import { useLocation } from 'react-router-dom';
import { useGuides } from '../../hooks/useGuides';
import { PrintGuideView } from './PrintGuideView';
import { PrintArticleView } from './PrintArticleView';
import { Drill, Season } from '../../types';

interface PrintGuideWrapperProps {
  user: any;
  activeSeasonId?: string;
  activeSeason?: Season | null;
  drills: Drill[];
}

export const PrintGuideWrapper: React.FC<PrintGuideWrapperProps> = ({
  user,
  activeSeasonId,
  activeSeason,
  drills
}) => {
  const location = useLocation();
  const {
    activeSections,
    activeArticles,
    activeChecklists,
    progressMap,
    loading
  } = useGuides(user, activeSeasonId);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-slate-800 p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-bold text-slate-600">Preparing Guide Print Sheet...</span>
        </div>
      </div>
    );
  }

  const pathParts = location.pathname.split('/');
  // Routes: /print/guides/article/:id OR /print/guides/section/:id OR /print/article/:id OR /print/section/:id
  const isArticle = location.pathname.includes('/article/');
  const isSection = location.pathname.includes('/section/');
  
  // Last segment is the ID
  const targetId = pathParts[pathParts.length - 1];

  if (isArticle) {
    const article = activeArticles.find(a => a.id === targetId);
    if (!article) {
      return (
        <div className="p-8 text-center text-slate-600 font-bold">
          Article not found for printing (ID: {targetId})
        </div>
      );
    }
    const section = activeSections.find(s => s.id === article.sectionId);

    return (
      <PrintArticleView
        article={article}
        section={section}
        drills={drills}
        seasonName={activeSeason?.name || 'Current Season'}
        onBack={() => {
          if (window.history.length > 1) window.close();
          else window.location.hash = '#/guides';
        }}
      />
    );
  }

  if (isSection) {
    const section = activeSections.find(s => s.id === targetId);
    if (!section) {
      return (
        <div className="p-8 text-center text-slate-600 font-bold">
          Section not found for printing (ID: {targetId})
        </div>
      );
    }

    return (
      <PrintGuideView
        section={section}
        articles={activeArticles}
        checklists={activeChecklists}
        progressMap={progressMap}
        seasonName={activeSeason?.name || 'Current Season'}
        onBack={() => {
          if (window.history.length > 1) window.close();
          else window.location.hash = '#/guides';
        }}
      />
    );
  }

  // Fallback if targetId matches a section or article directly
  const directArticle = activeArticles.find(a => a.id === targetId);
  if (directArticle) {
    const section = activeSections.find(s => s.id === directArticle.sectionId);
    return (
      <PrintArticleView
        article={directArticle}
        section={section}
        drills={drills}
        seasonName={activeSeason?.name || 'Current Season'}
        onBack={() => window.close()}
      />
    );
  }

  const directSection = activeSections.find(s => s.id === targetId);
  if (directSection) {
    return (
      <PrintGuideView
        section={directSection}
        articles={activeArticles}
        checklists={activeChecklists}
        progressMap={progressMap}
        seasonName={activeSeason?.name || 'Current Season'}
        onBack={() => window.close()}
      />
    );
  }

  return (
    <div className="p-8 text-center text-slate-600 font-bold">
      Guide print content not found.
    </div>
  );
};
