import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { GuideSection, GuideArticle, TeamSettings, GuideChecklistItem, GuideProgress, Drill } from '../../types';
import { BookOpen, Youtube, ArrowLeft, Folder, ExternalLink } from 'lucide-react';
import { MarkdownContent } from './MarkdownContent';
import { extractYoutubeId } from '../../lib/youtube';
import { SkillsChecklistView } from './SkillsChecklistView';

const SECTION_ORDER_MAP: Record<string, number> = {
  'batting': 1, 'hitting': 1,
  'pitching': 2,
  'catching': 3,
  'fielding': 4,
  'base running': 5, 'baserunning': 5, 'running': 5,
};

function getSectionSortOrder(sec: GuideSection): number {
  const nameKey = (sec.name || '').toLowerCase().trim();
  const idKey = (sec.id || '').toLowerCase().trim();
  if (SECTION_ORDER_MAP[nameKey] !== undefined) return SECTION_ORDER_MAP[nameKey];
  if (SECTION_ORDER_MAP[idKey] !== undefined) return SECTION_ORDER_MAP[idKey];
  return sec.order ?? 999;
}

export const PublicGuidesView: React.FC = () => {
  const { uid } = useParams<{ uid: string }>();

  const [sections, setSections] = useState<GuideSection[]>([]);
  const [articles, setArticles] = useState<GuideArticle[]>([]);
  const [checklists, setChecklists] = useState<GuideChecklistItem[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, GuideProgress>>({});
  const [drills, setDrills] = useState<Drill[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string>('');
  const [selectedArticle, setSelectedArticle] = useState<GuideArticle | null>(null);
  const [teamSettings, setTeamSettings] = useState<TeamSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPublicGuides() {
      if (!uid) {
        setError('Invalid guide link.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);

        let fetchedSettings: TeamSettings | null = null;
        // 1. Fetch settings if available (non-blocking)
        try {
          const settingsSnap = await getDoc(doc(db, 'settings', uid));
          if (settingsSnap.exists()) {
            fetchedSettings = settingsSnap.data() as TeamSettings;
            setTeamSettings(fetchedSettings);
          }
        } catch (e) {
          console.warn('Could not fetch settings for public guide view', e);
        }

        // 2. Fetch sections
        const secSnap = await getDocs(query(collection(db, 'guideSections'), where('uid', '==', uid)));
        const secList = secSnap.docs.map(d => ({ id: d.id, ...d.data() })) as GuideSection[];
        
        secList.sort((a, b) => {
          const orderA = getSectionSortOrder(a);
          const orderB = getSectionSortOrder(b);
          if (orderA !== orderB) return orderA - orderB;
          return (a.order ?? 999) - (b.order ?? 999);
        });

        setSections(secList);
        if (secList.length > 0) {
          setActiveSectionId(secList[0].id);
        }

        // 3. Fetch published articles
        const artSnap = await getDocs(query(
          collection(db, 'guideArticles'),
          where('uid', '==', uid),
          where('status', '==', 'published')
        ));
        const artList = artSnap.docs.map(d => ({ id: d.id, ...d.data() })) as GuideArticle[];
        artList.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
        setArticles(artList);

        // 4. Fetch drills
        const drillsSnap = await getDocs(query(
          collection(db, 'drills'),
          where('uid', '==', uid)
        ));
        const drillsList = drillsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Drill[];
        setDrills(drillsList);

        // 5. Fetch guide checklists (skills)
        const checklistsSnap = await getDocs(query(
          collection(db, 'guideChecklists'),
          where('uid', '==', uid)
        ));
        const checklistsList = checklistsSnap.docs
          .map(d => ({ id: d.id, ...d.data() })) as GuideChecklistItem[];
        setChecklists(checklistsList.filter(c => !c.isArchived));

        // 6. Fetch guide progress
        if (fetchedSettings) {
          const progressSnap = await getDocs(query(
            collection(db, 'guideProgress'),
            where('uid', '==', uid),
            where('seasonId', '==', fetchedSettings.activeSeasonId || 'legacy')
          ));
          const progressMapData: Record<string, GuideProgress> = {};
          progressSnap.docs.forEach(d => {
            const data = { id: d.id, ...d.data() } as GuideProgress;
            progressMapData[data.checklistId] = data;
          });
          setProgressMap(progressMapData);
        }
      } catch (err: any) {
        console.error('Error loading shared coaching guides:', err);
        setError('Unable to load shared coaching guides.');
      } finally {
        setLoading(false);
      }
    }

    loadPublicGuides();
  }, [uid]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-bold text-slate-500">Loading Playbook Guides...</span>
        </div>
      </div>
    );
  }

  if (error || sections.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-md w-full text-center">
          <BookOpen size={32} className="mx-auto text-slate-400 mb-3" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Guides Not Found</h2>
          <p className="text-xs text-slate-500 mt-2">
            No published coaching guides are currently available at this link.
          </p>
        </div>
      </div>
    );
  }

  const currentSection = sections.find(s => s.id === activeSectionId) || sections[0];
  const sectionArticles = articles.filter(a => a.sectionId === currentSection?.id);

  return (
    <div className="w-full flex flex-col gap-6">
        {/* Article Reader Mode */}
        {selectedArticle ? (
          <div className="flex flex-col gap-6">
            <button
              onClick={() => setSelectedArticle(null)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-fit"
            >
              <ArrowLeft size={14} />
              <span>Back to {currentSection?.name}</span>
            </button>

            {/* Video (if present) */}
            {selectedArticle.youtubeUrls?.[0] && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
                {(() => {
                  const yId = extractYoutubeId(selectedArticle.youtubeUrls[0]);
                  return yId ? (
                    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black">
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${yId}`}
                        title={selectedArticle.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full border-0"
                      />
                    </div>
                  ) : null;
                })()}
              </div>
            )}

            {/* Article Content */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xs">
              <h1 className="text-2xl sm:text-3xl font-black mb-4">{selectedArticle.title}</h1>
              {selectedArticle.summary && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl mb-6 text-sm text-slate-700 dark:text-slate-300 font-medium">
                  {selectedArticle.summary}
                </div>
              )}
              <MarkdownContent content={selectedArticle.content} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Sections */}
            <div className="lg:col-span-4 flex flex-col gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1 mb-1">
                Sections
              </h2>
              {sections.map(section => {
                const isActive = section.id === activeSectionId;
                const secArts = articles.filter(a => a.sectionId === section.id);
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSectionId(section.id)}
                    className={`p-3.5 rounded-2xl text-left font-bold text-sm flex items-center justify-between border transition-all ${
                      isActive
                        ? 'bg-slate-900 dark:bg-emerald-600 text-white border-transparent shadow-md'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Folder size={18} className="opacity-80" />
                      <span>{section.name}</span>
                    </div>
                    <span className="text-xs opacity-75">{secArts.length} Guides</span>
                  </button>
                );
              })}
            </div>

            {/* Right Column: Articles in current section */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
                {currentSection?.name} Guides ({sectionArticles.length})
              </h2>

              {sectionArticles.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-sm text-slate-500">
                  No published guides in this section.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {sectionArticles.map(art => (
                    <div
                      key={art.id}
                      onClick={() => setSelectedArticle(art)}
                      className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 rounded-2xl cursor-pointer shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        {art.youtubeUrls?.[0] && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-red-50 text-red-600 rounded-md mb-2">
                            <Youtube size={12} /> Video Attached
                          </span>
                        )}
                        <h3 className="font-bold text-base text-slate-900 dark:text-white">
                          {art.title}
                        </h3>
                        {art.summary && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{art.summary}</p>
                        )}
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-emerald-600 flex items-center justify-between">
                        <span>Read Breakdown</span>
                        <ExternalLink size={12} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Skills Checklist Section */}
              {currentSection && (
                <div className="mt-8">
                  <SkillsChecklistView
                    sectionId={currentSection.id}
                    sectionName={currentSection.name}
                    checklists={checklists}
                    articles={articles}
                    drills={drills}
                    progressMap={progressMap}
                    onToggleChecklist={async () => {}}
                    onAddChecklist={async () => {}}
                    onUpdateChecklist={async () => {}}
                    onDeleteChecklist={async () => {}}
                    onOpenArticle={(art) => setSelectedArticle(art)}
                    isAdmin={false}
                    activeSeasonName="Current Season"
                  />
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  );
};
