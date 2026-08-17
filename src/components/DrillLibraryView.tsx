import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Drill } from '../types';
import { Search, Plus, Trash2, PlayCircle, BookOpen, ChevronRight } from 'lucide-react';
import { CATEGORIES, getCategoryTheme } from '../lib/drillCategories';
import { ConfirmationModal } from './ui/ConfirmationModal';

interface DrillLibraryViewProps {
  drills: Drill[];
  isAdmin: boolean;
  onDeleteDrill: (id: string) => Promise<void>;
  darkMode: boolean;
}

export const DrillLibraryView: React.FC<DrillLibraryViewProps> = ({
  drills,
  isAdmin,
  onDeleteDrill,
  darkMode
}) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [drillToDelete, setDrillToDelete] = useState<Drill | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredDrills = drills.filter(drill => {
    const matchesSearch = drill.title.toLowerCase().includes(search.toLowerCase()) || 
                          (drill.summary && drill.summary.toLowerCase().includes(search.toLowerCase())) ||
                          (drill.category && drill.category.toLowerCase().includes(search.toLowerCase()));
    const matchesCat = selectedCategory ? drill.category === selectedCategory : true;
    return matchesSearch && matchesCat;
  });

  return (
    <div className={`p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 ${darkMode ? 'dark text-slate-200' : 'text-slate-800'}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Drills Library</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Master database of practice drills and activities</p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              onClick={() => navigate('/drills/new')}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-600/20"
            >
              <Plus size={18} />
              Add Drill
            </button>
          </div>
        )}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search drills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-sm font-medium dark:text-white"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap border transition-all ${
              !selectedCategory 
                ? 'bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/20 dark:bg-white dark:text-slate-900 dark:border-white' 
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'
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

      {/* Drill List */}
      {filteredDrills.length === 0 ? (
        <div className="text-center py-24 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm">
          <BookOpen size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No drills found</h3>
          <p className="text-slate-500 dark:text-slate-400">
            {search || selectedCategory ? "Try adjusting your filters" : "Your library is empty. Add a drill to get started!"}
          </p>
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
    </div>
  );
};
