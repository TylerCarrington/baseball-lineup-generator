import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Drill } from '../types';
import { Search, Plus, Trash2, PlayCircle, BookOpen, ChevronRight, Wrench, Share2, Copy, Check, Upload, Sparkles, Layers } from 'lucide-react';
import { CATEGORIES, getCategoryTheme } from '../lib/drillCategories';
import { ConfirmationModal } from './ui/ConfirmationModal';
import { ImportDrillsModal } from './ImportDrillsModal';
import { toast } from 'sonner';

interface DrillLibraryViewProps {
  drills: Drill[];
  isAdmin: boolean;
  onDeleteDrill: (id: string) => Promise<void>;
  onAddDrill?: (data: Omit<Drill, 'id' | 'createdAt' | 'updatedAt'>) => Promise<any>;
  onUpdateDrill?: (id: string, data: Partial<Drill>) => Promise<void>;
  darkMode: boolean;
  user: any;
}

export const DrillLibraryView: React.FC<DrillLibraryViewProps> = ({
  drills,
  isAdmin,
  onDeleteDrill,
  onAddDrill,
  onUpdateDrill,
  darkMode,
  user
}) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [drillToDelete, setDrillToDelete] = useState<Drill | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importInitialMode, setImportInitialMode] = useState<'pack' | 'upload' | 'paste'>('pack');

  const handleShareDrills = () => {
    if (!user) {
      toast.error('You must be signed in to share your library.');
      return;
    }
    const url = `${window.location.origin}${window.location.pathname}#/shared/drills/${user.uid}`;
    navigator.clipboard.writeText(url);
    toast.success('Public drills library share link copied to clipboard!');
  };

  // Counts by category
  const drillCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    drills.forEach(d => {
      const cat = d.category || 'Uncategorized';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [drills]);

  const filteredDrills = drills.filter(drill => {
    const matchesSearch = drill.title.toLowerCase().includes(search.toLowerCase()) || 
                          (drill.summary && drill.summary.toLowerCase().includes(search.toLowerCase())) ||
                          (drill.category && drill.category.toLowerCase().includes(search.toLowerCase()));
    const matchesCat = selectedCategory ? drill.category === selectedCategory : true;
    return matchesSearch && matchesCat;
  });

  const [copiedCSV, setCopiedCSV] = useState(false);

  const handleExportCSV = () => {
    const headers = ['Category', 'Drill Title', 'Summary', 'Video URL', 'Setup', 'Steps', 'Notes'];
    const rows = filteredDrills.map(drill => {
      const escapeCSV = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;
      return [
        escapeCSV(drill.category || 'General'),
        escapeCSV(drill.title),
        escapeCSV(drill.summary || ''),
        escapeCSV(drill.youtubeUrl || ''),
        escapeCSV(drill.setup || ''),
        escapeCSV(drill.steps || ''),
        escapeCSV(drill.notes || '')
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    
    navigator.clipboard.writeText(csvContent).then(() => {
      setCopiedCSV(true);
      setTimeout(() => setCopiedCSV(false), 2000);
      toast.success('Drills exported to clipboard with all details!');
    }).catch(err => {
      console.error('Failed to copy CSV: ', err);
      toast.error('Failed to copy CSV');
    });
  };

  const handleOpenImportModal = (mode: 'pack' | 'upload' | 'paste') => {
    setImportInitialMode(mode);
    setIsImportModalOpen(true);
  };

  return (
    <div className={`p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 ${darkMode ? 'dark text-slate-200' : 'text-slate-800'}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Drills Library</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {drills.length} Drills
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Master database of practice drills and activities across all categories</p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          {isAdmin && onAddDrill && (
            <>
              <button 
                onClick={() => handleOpenImportModal('pack')}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 border border-indigo-200 dark:border-indigo-800 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-xl font-bold transition-all shadow-2xs"
                title="Import all 28 drills across all 7 categories"
              >
                <Sparkles size={16} className="text-amber-500" />
                <span>Import All Categories</span>
              </button>

              <button 
                onClick={() => handleOpenImportModal('upload')}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl font-bold transition-all shadow-2xs text-xs sm:text-sm"
                title="Import Custom CSV File"
              >
                <Upload size={16} className="text-indigo-600 dark:text-indigo-400" />
                <span>Import CSV</span>
              </button>
            </>
          )}

          <button 
            onClick={handleExportCSV}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl font-bold transition-all shadow-2xs text-xs sm:text-sm"
            title="Export to CSV"
          >
            {copiedCSV ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} className="text-emerald-600 dark:text-emerald-400" />}
            {copiedCSV ? <span className="text-emerald-500">Copied</span> : <span>Export CSV</span>}
          </button>
          
          <button 
            onClick={handleShareDrills}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl font-bold transition-all shadow-2xs text-xs sm:text-sm"
            title="Share Drills Library"
          >
            <Share2 size={16} className="text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">Share Library</span>
          </button>

          <button 
            onClick={() => navigate('/tools')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-md shadow-emerald-600/20 text-xs sm:text-sm"
          >
            <Wrench size={16} />
            <span>Tools</span>
          </button>

          {isAdmin && (
            <button 
              onClick={() => navigate('/drills/new')}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-600/20 text-xs sm:text-sm"
            >
              <Plus size={16} />
              <span>Add Drill</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search drills by title, summary, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-sm font-medium dark:text-white"
          />
        </div>

        {/* Category selector pills with counts */}
        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar flex-nowrap sm:flex-wrap">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap border transition-all ${
              !selectedCategory 
                ? 'bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/20 dark:bg-white dark:text-slate-900 dark:border-white' 
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${!selectedCategory ? 'bg-white dark:bg-slate-900' : 'bg-slate-400'}`} />
            <span>All Categories</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-extrabold ${
              !selectedCategory ? 'bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
              {drills.length}
            </span>
          </button>
          {CATEGORIES.map(cat => {
            const theme = getCategoryTheme(cat);
            const isSelected = selectedCategory === cat;
            const count = drillCategoryCounts[cat] || 0;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap border transition-all ${
                  isSelected ? theme.filterActive : theme.filterInactive
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : theme.dot}`} />
                <span>{cat}</span>
                {count > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-extrabold ${
                    isSelected ? 'bg-white/25 text-white' : 'bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Drill List */}
      {filteredDrills.length === 0 ? (
        <div className="text-center py-16 px-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
            <BookOpen size={32} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">
              {search || selectedCategory ? "No matching drills found" : "Your Drill Library is Empty"}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {search || selectedCategory 
                ? "Try adjusting your search terms or clearing category filters." 
                : "Get started quickly by importing curated fundamental drills across all 7 core categories or uploading your CSV."}
            </p>
          </div>

          {isAdmin && onAddDrill && (
            <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
              <button
                onClick={() => handleOpenImportModal('pack')}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md shadow-indigo-600/20"
              >
                <Sparkles size={16} className="text-amber-300" />
                <span>Import All 28 Core Drills Across All Categories</span>
              </button>
              <button
                onClick={() => handleOpenImportModal('upload')}
                className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-2xs"
              >
                <Upload size={16} className="text-indigo-600 dark:text-indigo-400" />
                <span>Upload Custom CSV</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredDrills.map(drill => {
            const theme = getCategoryTheme(drill.category);
            return (
              <div 
                key={drill.id} 
                onClick={() => navigate('/drills/' + drill.id)}
                className={`group flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl ${theme.cardHover} hover:shadow-md transition-all cursor-pointer`}
              >
                <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
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
                  {isAdmin && (
                    <div className="flex items-center gap-1 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setDrillToDelete(drill);
                        }} 
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors" 
                        title="Delete Drill"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                  <ChevronRight size={20} className="text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmationModal
        isOpen={!!drillToDelete}
        title="Delete Drill"
        message={`Are you sure you want to delete "${drillToDelete?.title}"? This action cannot be undone.`}
        confirmText={isDeleting ? "Deleting..." : "Delete Drill"}
        variant="danger"
        onClose={() => !isDeleting && setDrillToDelete(null)}
        onConfirm={async () => {
          if (!drillToDelete) return;
          try {
            setIsDeleting(true);
            await onDeleteDrill(drillToDelete.id);
            setDrillToDelete(null);
          } catch (error) {
            console.error('Failed to delete drill:', error);
          } finally {
            setIsDeleting(false);
          }
        }}
      />

      {onAddDrill && (
        <ImportDrillsModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          existingDrills={drills}
          onAddDrill={onAddDrill}
          onUpdateDrill={onUpdateDrill}
          darkMode={darkMode}
          initialMode={importInitialMode}
        />
      )}
    </div>
  );
};

