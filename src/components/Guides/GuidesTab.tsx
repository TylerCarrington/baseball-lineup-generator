import React, { useState, useMemo } from 'react';
import { useGuides } from '../../hooks/useGuides';
import { Drill, Season, GuideArticle, GuideSection } from '../../types';
import { SectionList } from './SectionList';
import { ArticleCard } from './ArticleCard';
import { ArticleDetailView } from './ArticleDetailView';
import { ArticleEditorModal } from './ArticleEditorModal';
import { SkillsChecklistView } from './SkillsChecklistView';
import { PrintGuideView } from './PrintGuideView';
import { DrillDetailModal } from '../ui/DrillDetailModal';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import {
  BookOpen,
  CheckSquare,
  Search,
  Plus,
  Printer,
  ChevronRight,
  Filter,
  CheckCircle2,
  Folder,
  Layers,
  ArrowLeft,
  Share2
} from 'lucide-react';

interface GuidesTabProps {
  user: any;
  activeSeason: Season | null;
  seasons: Season[];
  drills: Drill[];
  isAdmin: boolean;
  darkMode: boolean;
}

export const GuidesTab: React.FC<GuidesTabProps> = ({
  user,
  activeSeason,
  seasons,
  drills,
  isAdmin,
  darkMode
}) => {
  const {
    activeSections,
    activeArticles,
    activeChecklists,
    progressMap,
    readinessMetrics,
    loading,
    addSection,
    updateSection,
    archiveSection,
    addArticle,
    updateArticle,
    archiveArticle,
    addChecklistItem,
    updateChecklistItem,
    deleteChecklistItem,
    toggleChecklistProgress
  } = useGuides(user, activeSeason?.id);

  const [activeSectionId, setActiveSectionId] = useState<string>('');
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'articles' | 'checklist'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isArticleEditorOpen, setIsArticleEditorOpen] = useState(false);
  const [articleToEdit, setArticleToEdit] = useState<GuideArticle | null>(null);
  const [articleToArchive, setArticleToArchive] = useState<GuideArticle | null>(null);
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [activeModalDrill, setActiveModalDrill] = useState<Drill | null>(null);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  // Default active section if none selected
  const effectiveSectionId = useMemo(() => {
    if (activeSectionId && activeSections.some(s => s.id === activeSectionId)) {
      return activeSectionId;
    }
    return activeSections[0]?.id || '';
  }, [activeSectionId, activeSections]);

  const currentSection = activeSections.find(s => s.id === effectiveSectionId);
  const selectedArticle = activeArticles.find(a => a.id === selectedArticleId);

  // Search filtering
  const filteredArticles = useMemo(() => {
    let list = activeArticles.filter(a => a.sectionId === effectiveSectionId);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = activeArticles.filter(
        a => a.title.toLowerCase().includes(q) || (a.summary && a.summary.toLowerCase().includes(q)) || a.content.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeArticles, effectiveSectionId, searchQuery]);

  const handleOpenCreateArticle = () => {
    setArticleToEdit(null);
    setIsArticleEditorOpen(true);
  };

  const handleOpenEditArticle = (article: GuideArticle) => {
    setArticleToEdit(article);
    setIsArticleEditorOpen(true);
  };

  const handleSaveArticle = async (data: any) => {
    if (articleToEdit) {
      await updateArticle(articleToEdit.id, data);
    } else {
      const newArt = await addArticle(data);
      if (newArt?.id) {
        setSelectedArticleId(newArt.id);
      }
    }
  };

  const handleShareGuides = () => {
    const url = `${window.location.origin}${window.location.pathname}#/shared/guides/${user.uid}`;
    navigator.clipboard.writeText(url);
    setCopiedShareLink(true);
    setTimeout(() => setCopiedShareLink(false), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-bold text-slate-500">Loading Coaching Guides...</span>
        </div>
      </div>
    );
  }

  // Print Mode
  if (isPrintMode && currentSection) {
    return (
      <PrintGuideView
        section={currentSection}
        articles={activeArticles}
        checklists={activeChecklists}
        progressMap={progressMap}
        seasonName={activeSeason?.name || 'Current Season'}
        onBack={() => setIsPrintMode(false)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
      {/* 1. Global Season Readiness Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <BookOpen size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Coaching Guides & Skills Reference
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-md">
                  {activeSeason?.name || 'All-Season'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Your living playbook: Capture coaching cues, embedded video breakdown, and track team readiness.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Overall Percentage Pill */}
            <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl">
              <div className="text-right">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Season Readiness
                </div>
                <div className="text-sm font-black text-slate-900 dark:text-white">
                  {readinessMetrics.completedSkills} / {readinessMetrics.totalSkills} Skills ({readinessMetrics.overallPercentage}%)
                </div>
              </div>
              <div className="w-9 h-9 rounded-full border-3 border-slate-200 dark:border-slate-700 flex items-center justify-center font-black text-xs text-emerald-600 dark:text-emerald-400">
                {readinessMetrics.overallPercentage}%
              </div>
            </div>

            {/* Share Link for Parents & Players */}
            <button
              onClick={handleShareGuides}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors"
              title="Copy shareable link for coaches, parents, and players"
            >
              <Share2 size={14} />
              <span>{copiedShareLink ? 'Link Copied!' : 'Share Guides'}</span>
            </button>

            {/* Print Section */}
            {currentSection && (
              <button
                onClick={() => {
                  const printUrl = `${window.location.origin}${window.location.pathname}#/print/guides/section/${currentSection.id}`;
                  window.open(printUrl, '_blank');
                }}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors"
                title="Print Coaching Binder Sheet"
              >
                <Printer size={14} />
                <span className="hidden sm:inline">Print Section</span>
              </button>
            )}
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-4">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${readinessMetrics.overallPercentage}%` }}
          />
        </div>
      </div>

      {/* 2. Main Two-Column Guide Explorer */}
      {selectedArticle ? (
        <ArticleDetailView
          article={selectedArticle}
          section={currentSection}
          drills={drills}
          onBack={() => setSelectedArticleId(null)}
          onEdit={() => handleOpenEditArticle(selectedArticle)}
          onOpenDrill={(drill) => setActiveModalDrill(drill)}
          isAdmin={isAdmin}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (lg:col-span-4): Section List */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Mobile Section Horizontal Carousel */}
            {activeSections.length > 0 && (
              <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {activeSections.map(s => {
                  const isActive = s.id === effectiveSectionId;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setActiveSectionId(s.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                        isActive
                          ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-md'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <Folder size={14} />
                      <span>{s.name}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Desktop Section List */}
            <div className="hidden lg:block">
              <SectionList
                sections={activeSections}
                activeSectionId={effectiveSectionId}
                onSelectSection={(id) => setActiveSectionId(id)}
                onAddSection={addSection}
                onUpdateSection={updateSection}
                onArchiveSection={archiveSection}
                perSectionMetrics={readinessMetrics.perSection}
                isAdmin={isAdmin}
              />
            </div>
          </div>

          {/* Right Column (lg:col-span-8): Active Section Stage */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {!currentSection ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center justify-center min-h-[320px]">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-3">
                  <Folder size={24} />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
                  No Section Selected
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
                  Create or select a guide section on the left to start viewing and adding coaching articles and skills checklists.
                </p>
              </div>
            ) : (
              <>
                {/* Header & Controls Bar */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* View Mode Pills (All / Guides / Skills) */}
                  <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold w-fit">
                    <button
                      onClick={() => setViewMode('all')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                        viewMode === 'all'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Layers size={13} />
                      <span>All</span>
                    </button>
                    <button
                      onClick={() => setViewMode('articles')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                        viewMode === 'articles'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <BookOpen size={13} />
                      <span>Guides ({filteredArticles.length})</span>
                    </button>
                    <button
                      onClick={() => setViewMode('checklist')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                        viewMode === 'checklist'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <CheckSquare size={13} />
                      <span>Skills Checklist</span>
                    </button>
                  </div>

                  {/* Search Bar & Add Guide Button */}
                  <div className="flex items-center gap-2 flex-1 sm:justify-end">
                    <div className="relative flex-1 sm:max-w-xs">
                      <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search guides & skills..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    {isAdmin && (
                      <button
                        onClick={handleOpenCreateArticle}
                        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-600/20 transition-all shrink-0"
                      >
                        <Plus size={14} />
                        <span>Write Guide</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Content Area */}
                {(viewMode === 'all' || viewMode === 'articles') && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Written Guides & Video References ({filteredArticles.length})
                      </h3>
                    </div>

                    {filteredArticles.length === 0 ? (
                      <div className="p-8 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                        <BookOpen size={28} className="mx-auto text-slate-400 mb-2" />
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                          No written guides in this section yet.
                        </p>
                        {isAdmin && (
                          <button
                            onClick={handleOpenCreateArticle}
                            className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs"
                          >
                            <Plus size={14} />
                            <span>Write the First Guide</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {filteredArticles.map((article) => (
                          <ArticleCard
                            key={article.id}
                            article={article}
                            drills={drills}
                            onSelect={(art) => setSelectedArticleId(art.id)}
                            onEdit={(art) => handleOpenEditArticle(art)}
                            onArchive={(art) => setArticleToArchive(art)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Skills Checklist Section */}
                {(viewMode === 'all' || viewMode === 'checklist') && currentSection && (
                  <SkillsChecklistView
                    sectionId={currentSection.id}
                    sectionName={currentSection.name}
                    checklists={activeChecklists}
                    articles={activeArticles}
                    drills={drills}
                    progressMap={progressMap}
                    onToggleChecklist={(chkId, isComp) =>
                      toggleChecklistProgress(chkId, currentSection.id, isComp)
                    }
                    onAddChecklist={addChecklistItem}
                    onUpdateChecklist={updateChecklistItem}
                    onDeleteChecklist={deleteChecklistItem}
                    onOpenArticle={(art) => setSelectedArticleId(art.id)}
                    onOpenDrill={(drill) => setActiveModalDrill(drill)}
                    activeSeasonName={activeSeason?.name || 'Current Season'}
                    isAdmin={isAdmin}
                  />
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Article Editor Modal */}
      <ArticleEditorModal
        isOpen={isArticleEditorOpen}
        onClose={() => {
          setIsArticleEditorOpen(false);
          setArticleToEdit(null);
        }}
        onSave={handleSaveArticle}
        articleToEdit={articleToEdit}
        defaultSectionId={effectiveSectionId}
        sections={activeSections}
        drills={drills}
      />

      {/* Drill Detail Modal */}
      <DrillDetailModal
        isOpen={Boolean(activeModalDrill)}
        onClose={() => setActiveModalDrill(null)}
        drill={activeModalDrill}
      />

      {/* Archive Article Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(articleToArchive)}
        title="Archive Guide Article"
        message={`Are you sure you want to archive "${articleToArchive?.title}"?`}
        confirmText="Archive Guide"
        onConfirm={async () => {
          if (articleToArchive) {
            await archiveArticle(articleToArchive.id);
            setArticleToArchive(null);
          }
        }}
        onClose={() => setArticleToArchive(null)}
        variant="danger"
      />
    </div>
  );
};
