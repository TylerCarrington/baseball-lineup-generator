import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Drill } from '../types';
import { parseDrillsCSV, ParsedDrillItem } from '../lib/csvParser';
import { CATEGORIES, getCategoryTheme, normalizeCategory } from '../lib/drillCategories';
import { ALL_CATEGORIES_DRILLS_CSV, ALL_CATEGORIES_STARTER_DRILLS } from '../data/allCategoriesDrills';
import { 
  Upload, 
  FileText, 
  Check, 
  AlertCircle, 
  X, 
  Download, 
  Copy, 
  FileSpreadsheet, 
  RefreshCw, 
  PlayCircle,
  Eye,
  CheckCircle2,
  ListFilter,
  Sparkles,
  Layers,
  CheckSquare,
  Square,
  HelpCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface ImportDrillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingDrills: Drill[];
  onAddDrill: (data: Omit<Drill, 'id' | 'createdAt' | 'updatedAt'>) => Promise<any>;
  onUpdateDrill?: (id: string, data: Partial<Drill>) => Promise<void>;
  darkMode: boolean;
  initialMode?: 'pack' | 'upload' | 'paste';
}

export const ImportDrillsModal: React.FC<ImportDrillsModalProps> = ({
  isOpen,
  onClose,
  existingDrills,
  onAddDrill,
  onUpdateDrill,
  darkMode,
  initialMode = 'pack'
}) => {
  const [activeTab, setActiveTab] = useState<'pack' | 'upload' | 'paste'>(initialMode);
  const [rawText, setRawText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedDrills, setParsedDrills] = useState<ParsedDrillItem[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [duplicateAction, setDuplicateAction] = useState<'skip' | 'update' | 'add'>('skip');
  const [previewCategoryFilter, setPreviewCategoryFilter] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);
  const [previewDetailDrill, setPreviewDetailDrill] = useState<ParsedDrillItem | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadStarterPack = () => {
    setActiveTab('pack');
    setFileName(null);
    setRawText(ALL_CATEGORIES_DRILLS_CSV);
    const parsed = parseDrillsCSV(ALL_CATEGORIES_DRILLS_CSV, existingDrills);
    setParsedDrills(parsed);

    // Select all valid items (skip existing by default)
    const validIndices = new Set<number>();
    parsed.forEach((item, idx) => {
      if (item.isValid) {
        if (!item.isDuplicate || duplicateAction !== 'skip') {
          validIndices.add(idx);
        }
      }
    });
    setSelectedIndices(validIndices);
  };

  // Load starter pack by default if initialMode is 'pack' or whenever opening fresh
  useEffect(() => {
    if (isOpen) {
      if (initialMode === 'pack') {
        loadStarterPack();
      } else {
        setActiveTab(initialMode);
      }
    }
  }, [isOpen, initialMode]);

  // Group counts by category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, { total: number; selected: number }> = {};
    parsedDrills.forEach((drill, idx) => {
      if (!drill.isValid) return;
      const cat = drill.category || 'Uncategorized';
      if (!counts[cat]) {
        counts[cat] = { total: 0, selected: 0 };
      }
      counts[cat].total++;
      if (selectedIndices.has(idx)) {
        counts[cat].selected++;
      }
    });
    return counts;
  }, [parsedDrills, selectedIndices]);

  // Unique categories in current parsed list
  const discoveredCategories = useMemo(() => {
    const list = Object.keys(categoryCounts);
    // Sort with standard categories first, then others
    return list.sort((a, b) => {
      const idxA = CATEGORIES.indexOf(a);
      const idxB = CATEGORIES.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [categoryCounts]);

  const displayedDrills = useMemo(() => {
    return parsedDrills
      .map((drill, idx) => ({ drill, idx }))
      .filter(({ drill }) => {
        if (!previewCategoryFilter) return true;
        return drill.category === previewCategoryFilter;
      });
  }, [parsedDrills, previewCategoryFilter]);

  const uniqueSelectedCategoryCount = useMemo(() => {
    const selectedCats = new Set<string>();
    selectedIndices.forEach(idx => {
      const d = parsedDrills[idx];
      if (d && d.isValid) {
        selectedCats.add(d.category);
      }
    });
    return selectedCats.size;
  }, [selectedIndices, parsedDrills]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawText(content);
        processCSVContent(content);
      }
    };
    reader.readAsText(file);
  };

  const processCSVContent = (content: string) => {
    const parsed = parseDrillsCSV(content, existingDrills);
    setParsedDrills(parsed);

    // By default select all valid non-duplicates, or all valid if none
    const validIndices = new Set<number>();
    parsed.forEach((item, idx) => {
      if (item.isValid) {
        if (!item.isDuplicate || duplicateAction !== 'skip') {
          validIndices.add(idx);
        }
      }
    });
    setSelectedIndices(validIndices);
  };

  const handleTextChange = (text: string) => {
    setRawText(text);
    if (text.trim()) {
      processCSVContent(text);
    } else {
      setParsedDrills([]);
      setSelectedIndices(new Set());
    }
  };

  const handleDuplicateActionChange = (action: 'skip' | 'update' | 'add') => {
    setDuplicateAction(action);
    const newSelected = new Set<number>();
    parsedDrills.forEach((item, idx) => {
      if (item.isValid) {
        if (item.isDuplicate && action === 'skip') {
          // do not select
        } else {
          newSelected.add(idx);
        }
      }
    });
    setSelectedIndices(newSelected);
  };

  const handleToggleSelect = (idx: number) => {
    const next = new Set(selectedIndices);
    if (next.has(idx)) {
      next.delete(idx);
    } else {
      next.add(idx);
    }
    setSelectedIndices(next);
  };

  const handleToggleSelectAll = () => {
    const validIndices = parsedDrills
      .map((d, idx) => ({ d, idx }))
      .filter(({ d }) => d.isValid)
      .map(({ idx }) => idx);

    if (selectedIndices.size === validIndices.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(validIndices));
    }
  };

  const handleSelectFilteredCategoryOnly = (cat: string | null) => {
    const next = new Set(selectedIndices);
    parsedDrills.forEach((item, idx) => {
      if (item.isValid) {
        if (cat === null || item.category === cat) {
          next.add(idx);
        }
      }
    });
    setSelectedIndices(next);
  };

  const handleDeselectFilteredCategory = (cat: string | null) => {
    const next = new Set(selectedIndices);
    parsedDrills.forEach((item, idx) => {
      if (cat === null || item.category === cat) {
        next.delete(idx);
      }
    });
    setSelectedIndices(next);
  };

  const handleCategoryChangeForDrill = (drillIdx: number, newCategory: string) => {
    const updated = [...parsedDrills];
    if (updated[drillIdx]) {
      updated[drillIdx] = {
        ...updated[drillIdx],
        category: newCategory
      };
      setParsedDrills(updated);
    }
  };

  const handleCopySample = () => {
    navigator.clipboard.writeText(ALL_CATEGORIES_DRILLS_CSV);
    toast.success('Complete All-Categories CSV copied to clipboard!');
  };

  const handleDownloadSample = () => {
    const blob = new Blob([ALL_CATEGORIES_DRILLS_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'all_categories_drills_library.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Downloaded complete All-Categories CSV template');
  };

  const handleImport = async () => {
    const itemsToImport = Array.from(selectedIndices).map(idx => parsedDrills[idx]).filter(Boolean);
    if (itemsToImport.length === 0) {
      toast.error('Please select at least one drill to import.');
      return;
    }

    setIsProcessing(true);
    setImportProgress({ current: 0, total: itemsToImport.length });

    let successAddCount = 0;
    let successUpdateCount = 0;
    let failCount = 0;

    for (let i = 0; i < itemsToImport.length; i++) {
      const item = itemsToImport[i];
      setImportProgress({ current: i + 1, total: itemsToImport.length });

      try {
        if (item.isDuplicate && duplicateAction === 'update' && item.existingId && onUpdateDrill) {
          await onUpdateDrill(item.existingId, {
            title: item.title,
            category: item.category,
            summary: item.summary || undefined,
            setup: item.setup || undefined,
            steps: item.steps || undefined,
            notes: item.notes || undefined,
            youtubeUrl: item.youtubeUrl || undefined
          });
          successUpdateCount++;
        } else {
          await onAddDrill({
            title: item.title,
            category: item.category,
            summary: item.summary || undefined,
            setup: item.setup || undefined,
            steps: item.steps || undefined,
            notes: item.notes || undefined,
            youtubeUrl: item.youtubeUrl || undefined
          });
          successAddCount++;
        }
      } catch (err) {
        console.error('Failed to import drill:', item.title, err);
        failCount++;
      }
    }

    setIsProcessing(false);
    setImportProgress(null);

    if (failCount === 0) {
      const parts = [];
      if (successAddCount > 0) parts.push(`${successAddCount} added`);
      if (successUpdateCount > 0) parts.push(`${successUpdateCount} updated`);
      toast.success(`Import complete! ${parts.join(', ')}.`);
      onClose();
    } else {
      toast.warning(`Import finished: ${successAddCount + successUpdateCount} succeeded, ${failCount} failed.`);
    }
  };

  const validItems = parsedDrills.filter(d => d.isValid);
  const duplicateItems = parsedDrills.filter(d => d.isValid && d.isDuplicate);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Layers size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  Import Drills Across All Categories
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  <Sparkles size={11} /> 7 Core Categories
                </span>
              </div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Bulk import comprehensive baseball & softball drills or upload your custom CSV file
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Top Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl">
            <button
              type="button"
              onClick={loadStarterPack}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'pack'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles size={15} className="text-amber-500" />
              <span>All-Categories Pack ({ALL_CATEGORIES_STARTER_DRILLS.length} Drills)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('upload');
                if (parsedDrills.length === 0 || activeTab === 'pack') {
                  setParsedDrills([]);
                  setSelectedIndices(new Set());
                  setRawText('');
                  setFileName(null);
                }
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'upload'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Upload size={15} />
              <span>Upload CSV / Spreadsheet</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('paste');
                if (activeTab === 'pack') {
                  setParsedDrills([]);
                  setSelectedIndices(new Set());
                  setRawText('');
                  setFileName(null);
                }
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'paste'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText size={15} />
              <span>Paste CSV / Text</span>
            </button>
          </div>

          {/* Quick Actions & Format helper */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                <FileSpreadsheet size={15} className="text-indigo-600 dark:text-indigo-400" />
                <span>Multi-Category CSV Format</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Columns: <code className="text-slate-700 dark:text-slate-300 font-mono">Category, Drill Title, Summary, Video URL, Setup, Steps, Notes</code>
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleCopySample}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-2xs"
                title="Copy all 28 drills CSV template to clipboard"
              >
                <Copy size={13} />
                <span>Copy All-Categories CSV</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadSample}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all shadow-2xs"
                title="Download CSV spreadsheet template with all categories"
              >
                <Download size={13} />
                <span>Download Template</span>
              </button>
            </div>
          </div>

          {/* Active Tab Input Details */}
          {activeTab === 'pack' && (
            <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-indigo-950 dark:text-indigo-200 uppercase tracking-tight">
                    Curated Master Library Loaded
                  </h4>
                  <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80 font-medium">
                    28 high-impact drills spanning Batting, Pitching, Catching, Fielding, Base Running, Conditioning, and Competitions.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                >
                  {selectedIndices.size === validItems.length ? 'Deselect All' : 'Select All 28 Drills'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) processFile(file);
              }}
              className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all flex flex-col items-center justify-center gap-3 cursor-pointer ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-slate-50/50 dark:bg-slate-800/30'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, .tsv, .txt, text/csv, text/tab-separated-values, text/plain"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Upload size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {fileName ? fileName : 'Click to select or drag and drop a multi-category CSV file'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Supports .csv, .tsv, and exported spreadsheets with any categories
                </p>
              </div>
              {fileName && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-full text-xs font-bold mt-1">
                  <Check size={12} /> File Loaded ({parsedDrills.length} drills across {discoveredCategories.length} categories detected)
                </span>
              )}
            </div>
          )}

          {activeTab === 'paste' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Paste Multi-Category CSV or Tab-Separated Data:
                </label>
                <button
                  type="button"
                  onClick={() => handleTextChange(ALL_CATEGORIES_DRILLS_CSV)}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <Sparkles size={12} /> Insert 28 All-Categories Sample
                </button>
              </div>
              <textarea
                value={rawText}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="Paste CSV rows spanning multiple categories, e.g.:&#10;Category,Drill Title,Summary,Video URL&#10;Batting & Offense,Top Hand Tee Drill,Isolate top hand through contact,https://youtu.be/sample&#10;Pitching & Throwing,Towel Extension Drill,Encourage full extension,https://youtu.be/sample&#10;Catching,Pitch Framing,Stick borderline pitches,https://youtu.be/sample&#10;Fielding & Defense,Short Hop Pickups,Soft hands work,https://youtu.be/sample&#10;Base Running,Round & Read 1st to 3rd,Banana route curve,https://youtu.be/sample&#10;Conditioning & Warm-Up,Agility Ladder,Quick feet,https://youtu.be/sample&#10;Games & Competitions,21 Outs Scrimmage,Simulate pressure outs,https://youtu.be/sample"
                rows={5}
                className="w-full p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 resize-y"
              />
            </div>
          )}

          {/* Parsed Drills Preview Section */}
          {parsedDrills.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              
              {/* Category Filter & Stats Strip */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <ListFilter size={16} className="text-indigo-600 dark:text-indigo-400" />
                      <span>Ready to Import: {selectedIndices.size} Drills across {uniqueSelectedCategoryCount} Categories</span>
                    </h3>
                  </div>

                  {/* Duplicate handling selector */}
                  {duplicateItems.length > 0 && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        {duplicateItems.length} existing in library:
                      </span>
                      <select
                        value={duplicateAction}
                        onChange={(e) => handleDuplicateActionChange(e.target.value as any)}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="skip">Skip existing</option>
                        <option value="update">Overwrite / Update existing</option>
                        <option value="add">Import anyway (allow duplicate)</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Category Pills Filter Bar */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 hide-scrollbar flex-wrap">
                  <button
                    type="button"
                    onClick={() => setPreviewCategoryFilter(null)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      previewCategoryFilter === null
                        ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>All Categories</span>
                    <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-extrabold ${
                      previewCategoryFilter === null
                        ? 'bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      {validItems.length}
                    </span>
                  </button>

                  {discoveredCategories.map(cat => {
                    const theme = getCategoryTheme(cat);
                    const isCurrent = previewCategoryFilter === cat;
                    const stats = categoryCounts[cat] || { total: 0, selected: 0 };
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setPreviewCategoryFilter(isCurrent ? null : cat)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                          isCurrent
                            ? theme.filterActive
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-white' : theme.dot}`} />
                        <span>{cat}</span>
                        <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-extrabold ${
                          isCurrent
                            ? 'bg-white/25 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}>
                          {stats.selected}/{stats.total}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Bulk Select / Deselect for category or all */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectFilteredCategoryOnly(previewCategoryFilter)}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Select all {previewCategoryFilter ? `in "${previewCategoryFilter}"` : 'across all categories'}
                    </button>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <button
                      type="button"
                      onClick={() => handleDeselectFilteredCategory(previewCategoryFilter)}
                      className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                      Deselect {previewCategoryFilter ? `in "${previewCategoryFilter}"` : 'all'}
                    </button>
                  </div>

                  {previewCategoryFilter && (
                    <button
                      type="button"
                      onClick={() => setPreviewCategoryFilter(null)}
                      className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                    >
                      Clear filter (Show all)
                    </button>
                  )}
                </div>
              </div>

              {/* Table / List Preview */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-80 overflow-y-auto shadow-inner">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/90 sticky top-0 z-10 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIndices.size > 0 && selectedIndices.size === validItems.length}
                          onChange={handleToggleSelectAll}
                          className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
                        />
                      </th>
                      <th className="p-3 w-44">Category</th>
                      <th className="p-3">Drill Title</th>
                      <th className="p-3 hidden sm:table-cell">Summary / Objective</th>
                      <th className="p-3 w-16 text-center">Preview</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {displayedDrills.map(({ drill, idx }) => {
                      const theme = getCategoryTheme(drill.category);
                      const isSelected = selectedIndices.has(idx);

                      if (!drill.isValid) {
                        return (
                          <tr key={idx} className="bg-rose-50/40 dark:bg-rose-950/20 text-slate-400">
                            <td className="p-3 text-center">
                              <AlertCircle size={16} className="text-rose-500 mx-auto" />
                            </td>
                            <td className="p-3 font-semibold text-rose-500">Invalid Row</td>
                            <td className="p-3 text-rose-600 dark:text-rose-400 font-medium" colSpan={3}>
                              {drill.error || 'Missing required drill name/title'}
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr
                          key={idx}
                          onClick={() => handleToggleSelect(idx)}
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${
                            isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/25' : ''
                          }`}
                        >
                          <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelect(idx)}
                              className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="p-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1.5">
                              <select
                                value={drill.category}
                                onChange={(e) => handleCategoryChangeForDrill(idx, e.target.value)}
                                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold focus:ring-2 focus:ring-indigo-500 max-w-[170px]"
                              >
                                {CATEGORIES.map(cat => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                                {!CATEGORIES.includes(drill.category) && (
                                  <option value={drill.category}>{drill.category} (Custom)</option>
                                )}
                              </select>
                            </div>
                          </td>
                          <td className="p-3 font-bold text-slate-900 dark:text-white">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span>{drill.title}</span>
                              {drill.isDuplicate && (
                                <span className={`px-1.5 py-0.2 text-[9px] font-extrabold rounded ${
                                  duplicateAction === 'update' 
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' 
                                    : duplicateAction === 'skip'
                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                    : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                                }`}>
                                  {duplicateAction === 'update' ? 'Will Overwrite' : duplicateAction === 'skip' ? 'Already in Library' : 'Import as Duplicate'}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-slate-500 dark:text-slate-400 truncate max-w-xs hidden sm:table-cell font-medium">
                            {drill.summary || <span className="text-slate-300 dark:text-slate-600 italic">No summary</span>}
                          </td>
                          <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setPreviewDetailDrill(drill)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              title="View full drill content"
                            >
                              <Eye size={15} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Drill Detail Preview Modal */}
          {previewDetailDrill && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs font-bold rounded border ${getCategoryTheme(previewDetailDrill.category).badge}`}>
                      {previewDetailDrill.category}
                    </span>
                    <h4 className="font-black text-slate-900 dark:text-white text-base">
                      {previewDetailDrill.title}
                    </h4>
                  </div>
                  <button
                    onClick={() => setPreviewDetailDrill(null)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto text-xs">
                  {previewDetailDrill.summary && (
                    <div>
                      <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Summary</span>
                      <p className="text-slate-700 dark:text-slate-300 font-medium">{previewDetailDrill.summary}</p>
                    </div>
                  )}

                  {previewDetailDrill.youtubeUrl && (
                    <div>
                      <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Video Demo URL</span>
                      <p className="text-indigo-600 dark:text-indigo-400 font-medium truncate">{previewDetailDrill.youtubeUrl}</p>
                    </div>
                  )}

                  {previewDetailDrill.setup && (
                    <div>
                      <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Setup</span>
                      <p className="text-slate-700 dark:text-slate-300 font-medium whitespace-pre-line">{previewDetailDrill.setup}</p>
                    </div>
                  )}

                  {previewDetailDrill.steps && (
                    <div>
                      <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Execution Steps</span>
                      <p className="text-slate-700 dark:text-slate-300 font-medium whitespace-pre-line">{previewDetailDrill.steps}</p>
                    </div>
                  )}

                  {previewDetailDrill.notes && (
                    <div>
                      <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Coaching Notes & Cues</span>
                      <p className="text-slate-700 dark:text-slate-300 font-medium whitespace-pre-line">{previewDetailDrill.notes}</p>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={() => setPreviewDetailDrill(null)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Progress Bar during Import */}
          {importProgress && (
            <div className="space-y-2 p-4 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 rounded-2xl">
              <div className="flex justify-between text-xs font-bold text-indigo-900 dark:text-indigo-200">
                <span>Importing drills across categories...</span>
                <span>{importProgress.current} / {importProgress.total}</span>
              </div>
              <div className="w-full bg-indigo-200 dark:bg-indigo-900/60 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 dark:bg-indigo-400 h-full rounded-full transition-all duration-200"
                  style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 sm:p-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-xs"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 hidden sm:inline-block">
              {selectedIndices.size} selected ({uniqueSelectedCategoryCount} categories)
            </span>
            <button
              type="button"
              onClick={handleImport}
              disabled={isProcessing || selectedIndices.size === 0}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl transition-all shadow-md shadow-indigo-600/20"
            >
              {isProcessing ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Import {selectedIndices.size} Drill{selectedIndices.size === 1 ? '' : 's'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
