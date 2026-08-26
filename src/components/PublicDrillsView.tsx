import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Drill, TeamSettings } from '../types';
import { Search, PlayCircle, BookOpen, ChevronRight, ArrowLeft, ExternalLink, Dumbbell, Youtube, Copy, Check } from 'lucide-react';
import { CATEGORIES, getCategoryTheme, normalizeCategory } from '../lib/drillCategories';

function extractYoutubeId(url: string): string | null {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : null;
}

export const PublicDrillsView: React.FC = () => {
  const { uid, '*': splat } = useParams<{ uid: string; '*': string }>();
  const navigate = useNavigate();

  const drillId = splat?.startsWith('drill/') ? splat.replace('drill/', '') : null;

  const [drills, setDrills] = useState<Drill[]>([]);
  const selectedDrill = drillId ? drills.find(d => d.id === drillId) : null;
  const [teamSettings, setTeamSettings] = useState<TeamSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    async function loadPublicDrills() {
      if (!uid) {
        setError('Invalid sharing link.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch settings if available (non-blocking)
        try {
          const settingsSnap = await getDoc(doc(db, 'settings', uid));
          if (settingsSnap.exists()) {
            setTeamSettings(settingsSnap.data() as TeamSettings);
          }
        } catch (e) {
          console.warn('Could not fetch settings for public drills view', e);
        }

        // 2. Fetch all drills (global library + seeded drills)
        const allDrillsSnap = await getDocs(collection(db, 'drills'));
        let drillList = allDrillsSnap.docs.map(d => {
          const data = d.data();
          // Include all drills, since the library is global as per the design
          return { id: d.id, ...data, category: normalizeCategory(data.category) };
        }) as Drill[];

        // Sort by createdAt descending
        drillList.sort((a, b) => {
          const timeA = a.createdAt ? (typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : (a.createdAt as any).seconds * 1000) : 0;
          const timeB = b.createdAt ? (typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : (b.createdAt as any).seconds * 1000) : 0;
          return timeB - timeA;
        });

        setDrills(drillList);
      } catch (err: any) {
        console.error('Error loading shared drills:', err);
        setError('Unable to load shared drills library.');
      } finally {
        setLoading(false);
      }
    }

    loadPublicDrills();
  }, [uid]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-bold text-slate-500">Loading Practice Drills...</span>
        </div>
      </div>
    );
  }

  if (error || drills.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-md text-center">
          <Dumbbell size={32} className="mx-auto text-slate-400 mb-3" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Drills Library Not Found</h2>
          <p className="text-xs text-slate-500 mt-2">
            No drills are currently available at this link. Check back later!
          </p>
        </div>
      </div>
    );
  }

  const filteredDrills = drills.filter(drill => {
    const matchesSearch = drill.title.toLowerCase().includes(search.toLowerCase()) || 
                          (drill.summary && drill.summary.toLowerCase().includes(search.toLowerCase())) ||
                          (drill.category && drill.category.toLowerCase().includes(search.toLowerCase()));
    const matchesCat = selectedCategory ? drill.category === selectedCategory : true;
    return matchesSearch && matchesCat;
  });

  const [copiedCSV, setCopiedCSV] = useState(false);

  const handleExportCSV = () => {
    const headers = ['Category', 'Drill Title', 'Summary', 'Video URL'];
    const rows = filteredDrills.map(drill => {
      const escapeCSV = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;
      return [
        escapeCSV(drill.category || 'General'),
        escapeCSV(drill.title),
        escapeCSV(drill.summary || ''),
        escapeCSV(drill.youtubeUrl || '')
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    
    navigator.clipboard.writeText(csvContent).then(() => {
      setCopiedCSV(true);
      setTimeout(() => setCopiedCSV(false), 2000);
    }).catch(err => {
      console.error('Failed to copy CSV: ', err);
    });
  };

  return (
    <div className="w-full flex flex-col gap-6">
        {selectedDrill ? (
          /* Drill Detail View */
          <div className="flex flex-col gap-6">
            <button
              onClick={() => navigate(`/shared/${uid}/drills`)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-fit"
            >
              <ArrowLeft size={14} />
              <span>Back to Library</span>
            </button>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-8 shadow-xs">
              {/* Info */}
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl ${getCategoryTheme(selectedDrill.category).iconBox} flex items-center justify-center shrink-0`}>
                  <PlayCircle size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    {selectedDrill.title}
                  </h2>
                  <div className="mt-1.5 flex items-center gap-3 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${getCategoryTheme(selectedDrill.category).badge}`}>
                      <span className={`w-2 h-2 rounded-full ${getCategoryTheme(selectedDrill.category).dot}`} />
                      {selectedDrill.category || 'Uncategorized'}
                    </span>
                    {selectedDrill.summary && (
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        {selectedDrill.summary}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Video Embedding */}
              {selectedDrill.youtubeUrl && extractYoutubeId(selectedDrill.youtubeUrl) && (
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-slate-200 dark:border-slate-800 shadow-sm">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${extractYoutubeId(selectedDrill.youtubeUrl)}`}
                    title={selectedDrill.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                </div>
              )}

              {/* Drill Body Content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                {selectedDrill.setup && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Setup & Equipment</h3>
                    <div className="p-5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap font-medium text-slate-700 dark:text-slate-200">
                      {selectedDrill.setup}
                    </div>
                  </div>
                )}

                {selectedDrill.steps && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Drill Instructions</h3>
                    <div className="p-5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap font-medium text-slate-700 dark:text-slate-200">
                      {selectedDrill.steps}
                    </div>
                  </div>
                )}
              </div>

              {selectedDrill.notes && (
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800/60 space-y-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Coaching Tips & Notes</h3>
                  <div className="p-5 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/60 dark:border-indigo-900/40 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap font-medium text-indigo-900 dark:text-indigo-200">
                    {selectedDrill.notes}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Drills List View */
          <div className="space-y-6">
            <div className="flex justify-end">
              <button 
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl font-bold transition-all shadow-sm text-sm"
                title="Export to CSV"
              >
                {copiedCSV ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} className="text-emerald-600 dark:text-emerald-400" />}
                {copiedCSV ? <span className="text-emerald-500">Copied</span> : <span>Export CSV</span>}
              </button>
            </div>
            {/* Search & Filters */}
            <div className="flex flex-col gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Search drills..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium dark:text-white"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap border transition-all ${
                    !selectedCategory 
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md dark:bg-white dark:text-slate-900 dark:border-white' 
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${!selectedCategory ? 'bg-white dark:bg-slate-900' : 'bg-slate-400'}`} />
                  All Categories
                </button>
                {CATEGORIES.map(cat => {
                  const theme = getCategoryTheme(cat);
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap border transition-all ${
                        isSelected ? theme.filterActive : theme.filterInactive
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : theme.dot}`} />
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Drills Grid */}
            {filteredDrills.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs">
                <BookOpen size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No drills found</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs">Try adjusting your filters or search terms</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredDrills.map(drill => {
                  const theme = getCategoryTheme(drill.category);
                  return (
                    <div 
                      key={drill.id} 
                      onClick={() => navigate(`/shared/${uid}/drills/drill/${drill.id}`)}
                      className={`group flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl ${theme.cardHover} hover:shadow-xs transition-all cursor-pointer`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`w-10 h-10 shrink-0 rounded-xl ${theme.iconBox} flex items-center justify-center`}>
                          <PlayCircle size={20} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-slate-900 dark:text-white truncate text-base">{drill.title}</h3>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${theme.badge}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
                              {drill.category || 'Uncategorized'}
                            </span>
                          </div>
                          {drill.summary && (
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                              {drill.summary}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <ChevronRight size={20} className="text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
    </div>
  );
};
