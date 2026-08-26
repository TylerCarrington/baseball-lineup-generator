import React, { useState, useRef, useMemo, useEffect } from 'react';
import { GuideChecklistItem, GuideArticle, Drill, GuideSection } from '../../types';
import { 
  parseAllSkillsCSV, 
  ParsedSkillItem, 
  SAMPLE_SKILLS_CSV, 
  ALL_SECTIONS_SKILLS_CSV, 
  ALL_SECTIONS_STARTER_SKILLS,
  findStarterDrillData,
  matchDrillByName
} from '../../lib/csvParser';
import { firebaseService } from '../../services/firebaseService';
import { getCategoryTheme } from '../../lib/drillCategories';
import { 
  Upload, 
  FileText, 
  Check, 
  AlertCircle, 
  AlertTriangle,
  X, 
  Download, 
  Copy, 
  FileSpreadsheet, 
  RefreshCw, 
  Dumbbell, 
  BookOpen, 
  Eye, 
  CheckCircle2, 
  ListFilter,
  Link2,
  Sparkles,
  Layers,
  FolderPlus,
  ArrowRight,
  Search,
  CheckSquare,
  Square,
  ChevronDown,
  ClipboardPaste,
  Trash2,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';

interface ImportSkillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionId?: string | null;
  sectionName?: string;
  sections?: GuideSection[];
  existingChecklists: GuideChecklistItem[];
  drills: Drill[];
  articles: GuideArticle[];
  onAddSection?: (data: { name: string; description?: string; color?: string }) => Promise<any>;
  onAddDrill?: (drill: any) => Promise<any>;
  onAddChecklist: (data: {
    sectionId: string;
    title: string;
    category?: string;
    description?: string;
    linkedArticleId?: string;
    linkedDrillId?: string;
  }) => Promise<any>;
  onUpdateChecklist?: (checklistId: string, data: Partial<GuideChecklistItem>) => Promise<void>;
  onDeleteChecklist?: (checklistId: string) => Promise<void>;
  onToggleChecklist?: (checklistId: string, isCompleted: boolean) => Promise<void>;
  darkMode?: boolean;
  user?: any;
}

const SECTION_COLOR_MAP: Record<string, string> = {
  batting: 'amber',
  hitting: 'amber',
  pitching: 'sky',
  throwing: 'sky',
  infield: 'emerald',
  outfield: 'indigo',
  fielding: 'emerald',
  defense: 'emerald',
  catching: 'rose',
  baserunning: 'indigo',
  running: 'indigo',
  teamdefense: 'purple',
  situational: 'purple'
};

function inferSectionColor(name: string): string {
  const norm = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const [key, color] of Object.entries(SECTION_COLOR_MAP)) {
    if (norm.includes(key) || key.includes(norm)) {
      return color;
    }
  }
  const colors = ['emerald', 'amber', 'sky', 'indigo', 'rose', 'purple'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export const ImportSkillsModal: React.FC<ImportSkillsModalProps> = ({
  isOpen,
  onClose,
  sectionId = null,
  sectionName = '',
  sections = [],
  existingChecklists,
  drills,
  articles,
  onAddSection,
  onAddDrill,
  onAddChecklist,
  onUpdateChecklist,
  onDeleteChecklist,
  onToggleChecklist,
  user
}) => {
  // Mode: 'all' (all sections) vs 'single' (specific section)
  const [importScope, setImportScope] = useState<'all' | 'single'>(sectionId ? 'single' : 'all');
  const [activeTab, setActiveTab] = useState<'paste' | 'starter' | 'upload'>('paste');
  const [rawText, setRawText] = useState(ALL_SECTIONS_SKILLS_CSV);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedSkills, setParsedSkills] = useState<ParsedSkillItem[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [duplicateAction, setDuplicateAction] = useState<'skip' | 'update' | 'add'>('skip');
  const [isResetMasterList, setIsResetMasterList] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [drillFilter, setDrillFilter] = useState<'all' | 'matched' | 'unmatched'>('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number; sectionName?: string } | null>(null);
  const [previewDetailSkill, setPreviewDetailSkill] = useState<ParsedSkillItem | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute skills that will be deleted if Reset Master List mode is active
  const skillsToDelete = useMemo(() => {
    if (!isResetMasterList) return [];

    const scopeChecklists = importScope === 'single' && sectionId
      ? existingChecklists.filter(c => c.sectionId === sectionId)
      : existingChecklists;

    const retainedExistingIds = new Set<string>();
    parsedSkills.forEach((item, index) => {
      if (item.isValid && selectedIndices.has(index) && item.existingId) {
        retainedExistingIds.add(item.existingId);
      }
    });

    return scopeChecklists.filter(c => !retainedExistingIds.has(c.id));
  }, [isResetMasterList, importScope, sectionId, existingChecklists, parsedSkills, selectedIndices]);

  // Initialize or re-parse when modal opens or scope changes
  useEffect(() => {
    if (isOpen) {
      if (sectionId) {
        setImportScope('single');
      } else {
        setImportScope('all');
      }
      
      const initialCsv = (importScope === 'single' && sectionId)
        ? SAMPLE_SKILLS_CSV
        : ALL_SECTIONS_SKILLS_CSV;
      
      setRawText(initialCsv);
      processCSVContent(initialCsv, importScope === 'single' ? sectionId : undefined);
    }
  }, [isOpen, sectionId]);

  const processCSVContent = (content: string, targetDefaultSectionId?: string | null) => {
    const parsed = parseAllSkillsCSV(
      content,
      sections,
      existingChecklists,
      drills,
      articles,
      targetDefaultSectionId || undefined
    );
    setParsedSkills(parsed);

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

  const handleScopeChange = (scope: 'all' | 'single') => {
    setImportScope(scope);
    const targetSection = scope === 'single' ? sectionId : undefined;
    const content = scope === 'all' ? ALL_SECTIONS_SKILLS_CSV : SAMPLE_SKILLS_CSV;
    setRawText(content);
    processCSVContent(content, targetSection);
  };

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
        setActiveTab('paste');
        processCSVContent(content, importScope === 'single' ? sectionId : undefined);
        toast.success(`Loaded ${file.name}`);
      }
    };
    reader.readAsText(file);
  };

  const handleTextChange = (text: string) => {
    setRawText(text);
    if (text.trim()) {
      processCSVContent(text, importScope === 'single' ? sectionId : undefined);
    } else {
      setParsedSkills([]);
      setSelectedIndices(new Set());
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        toast.error('Clipboard is empty. Please copy your skills CSV text first.');
        return;
      }
      setRawText(text);
      setActiveTab('paste');
      setFileName(null);
      processCSVContent(text, importScope === 'single' ? sectionId : undefined);
      toast.success('Pasted and parsed skills from clipboard!');
    } catch (err) {
      toast.error('Unable to read clipboard automatically. Please paste directly into the text area below.');
    }
  };

  const handleClearText = () => {
    setRawText('');
    setFileName(null);
    setParsedSkills([]);
    setSelectedIndices(new Set());
    toast.info('Cleared skills input area');
  };

  const handleLoadStarterPack = () => {
    setRawText(ALL_SECTIONS_SKILLS_CSV);
    setFileName(null);
    setActiveTab('paste');
    processCSVContent(ALL_SECTIONS_SKILLS_CSV, importScope === 'single' ? sectionId : undefined);
    toast.success('Loaded Master Curriculum (38 skills across 7 baseball sections)');
  };

  const handleDuplicateActionChange = (action: 'skip' | 'update' | 'add') => {
    setDuplicateAction(action);
    const newSelected = new Set<number>();
    parsedSkills.forEach((item, idx) => {
      if (item.isValid) {
        if (item.isDuplicate && action === 'skip') {
          // skip
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
    const validCount = parsedSkills.filter(d => d.isValid).length;
    if (selectedIndices.size === validCount) {
      setSelectedIndices(new Set());
    } else {
      const allValid = new Set<number>();
      parsedSkills.forEach((d, idx) => {
        if (d.isValid) allValid.add(idx);
      });
      setSelectedIndices(allValid);
    }
  };

  const handleSelectSectionOnly = (secName: string) => {
    const next = new Set(selectedIndices);
    parsedSkills.forEach((item, idx) => {
      if (item.sectionName === secName && item.isValid) {
        next.add(idx);
      }
    });
    setSelectedIndices(next);
  };

  const handleDeselectSectionOnly = (secName: string) => {
    const next = new Set(selectedIndices);
    parsedSkills.forEach((item, idx) => {
      if (item.sectionName === secName) {
        next.delete(idx);
      }
    });
    setSelectedIndices(next);
  };

  const handleSectionAssignmentChange = (idx: number, newSectionName: string) => {
    const updated = [...parsedSkills];
    const matched = sections.find(s => s.name.toLowerCase() === newSectionName.toLowerCase());
    updated[idx] = {
      ...updated[idx],
      sectionName: newSectionName,
      matchedSection: matched,
      sectionId: matched?.id || undefined,
      willCreateSection: !matched
    };
    setParsedSkills(updated);
  };

  const handleDrillChange = (idx: number, drillValue: string) => {
    const updated = [...parsedSkills];
    if (!drillValue) {
      updated[idx] = {
        ...updated[idx],
        linkedDrillId: undefined,
        matchedDrill: undefined,
        isDrillMatched: false,
        isDrillUnmatched: !!updated[idx].rawDrillInput || !!updated[idx].linkedDrillTitle
      };
    } else {
      const drill = drills.find(d => d.id === drillValue);
      updated[idx] = {
        ...updated[idx],
        linkedDrillId: drillValue,
        matchedDrill: drill,
        linkedDrillTitle: drill ? drill.title : updated[idx].linkedDrillTitle,
        isDrillMatched: true,
        isDrillUnmatched: false
      };
    }
    setParsedSkills(updated);
  };

  const handleCopySample = () => {
    const content = importScope === 'all' ? ALL_SECTIONS_SKILLS_CSV : SAMPLE_SKILLS_CSV;
    navigator.clipboard.writeText(content);
    toast.success('Skills CSV template copied to clipboard!');
  };

  const handleDownloadSample = () => {
    const content = importScope === 'all' ? ALL_SECTIONS_SKILLS_CSV : SAMPLE_SKILLS_CSV;
    const namePrefix = importScope === 'all' ? 'all_sections_master' : (sectionName || 'section').toLowerCase().replace(/[^a-z0-9]/g, '_');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${namePrefix}_skills_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Downloaded skills CSV template');
  };

  const handleExportAllExistingSkills = () => {
    const headers = ['Section', 'Category', 'Skill Title', 'Description', 'Linked Drill', 'Status'];
    const rows = existingChecklists.map(item => {
      const sec = sections.find(s => s.id === item.sectionId);
      const secTitle = sec ? sec.name : 'General';
      const linkedDrill = drills.find(d => d.id === item.linkedDrillId);
      const linkedDrillTitle = linkedDrill ? linkedDrill.title : '';
      const escapeCSV = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;
      
      return [
        escapeCSV(secTitle),
        escapeCSV(item.category || 'General'),
        escapeCSV(item.title),
        escapeCSV(item.description || ''),
        escapeCSV(linkedDrillTitle),
        escapeCSV('To Cover')
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `all_existing_skills_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${existingChecklists.length} skills to CSV!`);
  };

  // Perform bulk import
  const handleImport = async () => {
    const itemsToImport = Array.from(selectedIndices).map(idx => parsedSkills[idx]).filter(Boolean);
    if (itemsToImport.length === 0) {
      toast.error('Please select at least one skill to import.');
      return;
    }

    if (isResetMasterList && skillsToDelete.length > 0) {
      setShowResetConfirmModal(true);
      return;
    }

    await executeImport(itemsToImport);
  };

  const executeImport = async (overrideItemsToImport?: ParsedSkillItem[]) => {
    setShowResetConfirmModal(false);
    const itemsToImport = overrideItemsToImport || Array.from(selectedIndices).map(idx => parsedSkills[idx]).filter(Boolean);
    if (itemsToImport.length === 0) return;

    setIsProcessing(true);
    setImportProgress({ current: 0, total: itemsToImport.length });

    // 1. Identify which sections need to be auto-created
    const sectionCache: Record<string, string> = {};
    sections.forEach(s => {
      sectionCache[s.name.trim().toLowerCase()] = s.id;
    });

    // Determine unique missing sections from itemsToImport
    const missingSectionNames = new Set<string>();
    itemsToImport.forEach(item => {
      const sName = (item.sectionName || sectionName || 'General').trim();
      const sNameLower = sName.toLowerCase();
      if (!sectionCache[sNameLower] && !item.sectionId) {
        missingSectionNames.add(sName);
      }
    });

    let createdSectionsCount = 0;
    if (missingSectionNames.size > 0 && onAddSection) {
      for (const mName of Array.from(missingSectionNames)) {
        try {
          const newSec = await onAddSection({
            name: mName,
            description: `Core coaching drills and skill checklists for ${mName}.`,
            color: inferSectionColor(mName)
          });
          if (newSec?.id) {
            sectionCache[mName.toLowerCase()] = newSec.id;
            createdSectionsCount++;
          }
        } catch (err) {
          console.error('Failed to create section:', mName, err);
        }
      }
    }

    let successAddCount = 0;
    let successUpdateCount = 0;
    let failCount = 0;
    const retainedSkillIds = new Set<string>();

    for (let i = 0; i < itemsToImport.length; i++) {
      const item = itemsToImport[i];
      const sName = (item.sectionName || sectionName || 'General').trim();
      const targetSecId = item.sectionId || sectionCache[sName.toLowerCase()] || sectionId;

      setImportProgress({ 
        current: i + 1, 
        total: itemsToImport.length,
        sectionName: sName
      });

      if (!targetSecId) {
        console.error('No valid section ID found for skill:', item.title);
        failCount++;
        continue;
      }

      // Resolve linked drill ID if manually selected or matched with existing Playbook drill
      const resolvedDrillId = item.linkedDrillId || null;

      try {
        if (item.isDuplicate && duplicateAction === 'update' && item.existingId && onUpdateChecklist) {
          await onUpdateChecklist(item.existingId, {
            title: item.title,
            category: item.category,
            description: item.description || '',
            linkedDrillId: resolvedDrillId || null,
            linkedArticleId: item.linkedArticleId || null
          });
          if (item.isCompleted && onToggleChecklist) {
            await onToggleChecklist(item.existingId, true);
          }
          retainedSkillIds.add(item.existingId);
          successUpdateCount++;
        } else if (item.isDuplicate && duplicateAction === 'skip' && item.existingId) {
          // Keep existing item in DB without updating
          retainedSkillIds.add(item.existingId);
        } else {
          const res = await onAddChecklist({
            sectionId: targetSecId,
            title: item.title,
            category: item.category,
            description: item.description || undefined,
            linkedDrillId: resolvedDrillId || undefined,
            linkedArticleId: item.linkedArticleId || undefined
          });

          const createdId = res?.id;
          if (createdId) {
            retainedSkillIds.add(createdId);
          }
          
          if (item.isCompleted && onToggleChecklist && createdId) {
            await onToggleChecklist(createdId, true);
          }
          successAddCount++;
        }
      } catch (err) {
        console.error('Failed to import skill:', item.title, err);
        failCount++;
      }
    }

    // 2. Perform Reset Master List Deletions if enabled
    let deletedCount = 0;
    if (isResetMasterList) {
      const scopeChecklists = importScope === 'single' && sectionId
        ? existingChecklists.filter(c => c.sectionId === sectionId)
        : existingChecklists;

      const toDelete = scopeChecklists.filter(c => !retainedSkillIds.has(c.id));

      for (const itemToDelete of toDelete) {
        try {
          if (onDeleteChecklist) {
            await onDeleteChecklist(itemToDelete.id);
          } else {
            await firebaseService.deleteGuideChecklist(itemToDelete.id);
          }
          deletedCount++;
        } catch (err) {
          console.error('Failed to delete skill during master list reset:', itemToDelete.title, err);
        }
      }
    }

    setIsProcessing(false);
    setImportProgress(null);

    const summaryParts: string[] = [];
    if (successAddCount > 0) summaryParts.push(`${successAddCount} added`);
    if (successUpdateCount > 0) summaryParts.push(`${successUpdateCount} updated`);
    if (createdSectionsCount > 0) summaryParts.push(`${createdSectionsCount} sections created`);
    if (deletedCount > 0) summaryParts.push(`${deletedCount} obsolete skills removed`);
    if (failCount > 0) summaryParts.push(`${failCount} failed`);

    toast.success(`Skills Master List ${isResetMasterList ? 'Reset & Import' : 'Import'} complete: ${summaryParts.join(', ')}`);
    onClose();
  };

  // Sections summary
  const distinctSections = useMemo(() => {
    const map = new Map<string, number>();
    parsedSkills.forEach(item => {
      const name = item.sectionName || sectionName || 'General';
      map.set(name, (map.get(name) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [parsedSkills, sectionName]);

  // Sections that don't exist yet and will be auto-created
  const newSectionsToCreate = useMemo(() => {
    return distinctSections.filter(sec => {
      const exists = sections.some(s => s.name.trim().toLowerCase() === sec.name.trim().toLowerCase());
      return !exists;
    });
  }, [distinctSections, sections]);

  const unmatchedDrillsCount = useMemo(() => {
    return parsedSkills.filter(d => d.isValid && (d.isDrillUnmatched || (!d.linkedDrillId && !!d.rawDrillInput))).length;
  }, [parsedSkills]);

  const matchedDrillsCount = useMemo(() => {
    return parsedSkills.filter(d => d.isValid && (d.isDrillMatched || !!d.linkedDrillId)).length;
  }, [parsedSkills]);

  // Filtered skills based on section filter, drill filter, and search
  const filteredSkillsWithIndices = useMemo(() => {
    return parsedSkills
      .map((item, originalIndex) => ({ item, originalIndex }))
      .filter(({ item }) => {
        // Section filter
        if (selectedSectionFilter !== 'all') {
          const sName = item.sectionName || sectionName || 'General';
          if (sName.toLowerCase() !== selectedSectionFilter.toLowerCase()) {
            return false;
          }
        }
        // Drill filter
        if (drillFilter === 'matched') {
          if (!item.linkedDrillId && !item.isDrillMatched) return false;
        } else if (drillFilter === 'unmatched') {
          if (item.linkedDrillId || !item.isDrillUnmatched) return false;
        }
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchDesc = item.description.toLowerCase().includes(q);
          const matchCat = item.category.toLowerCase().includes(q);
          const matchSec = (item.sectionName || '').toLowerCase().includes(q);
          const matchDrill = (item.linkedDrillTitle || item.rawDrillInput || '').toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchCat && !matchSec && !matchDrill) {
            return false;
          }
        }
        return true;
      });
  }, [parsedSkills, selectedSectionFilter, drillFilter, searchQuery, sectionName]);

  const validItems = parsedSkills.filter(d => d.isValid);
  const duplicateItems = parsedSkills.filter(d => d.isValid && d.isDuplicate);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 gap-4 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <Layers size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Import Skills Curriculum
                </h2>
                <span className="px-2.5 py-0.5 text-[11px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-md border border-emerald-300 dark:border-emerald-800">
                  {importScope === 'all' ? 'Universal Multi-Section' : `Section: ${sectionName || 'Single'}`}
                </span>
              </div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                {importScope === 'all'
                  ? 'Import baseball skills across ALL sections simultaneously with automated drill links and section setup'
                  : `Bulk import skill checkpoints directly into ${sectionName}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* Scope Switcher Pill */}
            {sectionId && (
              <div className="flex items-center bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => handleScopeChange('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    importScope === 'all'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-black'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  All Sections
                </button>
                <button
                  onClick={() => handleScopeChange('single')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    importScope === 'single'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-black'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  This Section Only
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              disabled={isProcessing}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Top Control Tabs & Utilities */}
        <div className="px-6 pt-4 pb-2 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Source Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold w-fit flex-wrap">
            <button
              onClick={() => setActiveTab('paste')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'paste'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <FileText size={14} />
              <span>Paste CSV / Text Editor</span>
            </button>

            <button
              onClick={handleLoadStarterPack}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'starter'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Sparkles size={14} />
              <span>Load 38-Skill Master Pack</span>
            </button>

            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Upload size={14} />
              <span>Upload File</span>
            </button>
          </div>

          {/* Quick Helper Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handlePasteFromClipboard}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 transition-all cursor-pointer shadow-2xs"
              title="Paste CSV text directly from your clipboard"
            >
              <ClipboardPaste size={13} />
              <span>Paste from Clipboard</span>
            </button>

            <button
              type="button"
              onClick={handleCopySample}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer"
              title="Copy CSV Template Header and Sample Rows"
            >
              <Copy size={13} />
              <span>Copy Template</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadSample}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer"
              title="Download CSV spreadsheet template file"
            >
              <Download size={13} />
              <span>Download CSV</span>
            </button>

            {existingChecklists.length > 0 && (
              <button
                type="button"
                onClick={handleExportAllExistingSkills}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                title="Export all current skills across sections to a CSV spreadsheet"
              >
                <FileSpreadsheet size={13} />
                <span>Export ({existingChecklists.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50/30 dark:bg-slate-900/30">
          
          {/* Tab 1: Direct CSV Text Area Editor */}
          {activeTab === 'paste' && (
            <div className="space-y-2 bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText size={14} className="text-emerald-500" />
                    <span>CSV / Spreadsheet Text Input</span>
                  </label>
                  <span className="text-[11px] font-bold text-slate-400">
                    ({parsedSkills.length} skills parsed)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePasteFromClipboard}
                    className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-md hover:bg-emerald-100 transition-all cursor-pointer"
                  >
                    <ClipboardPaste size={12} />
                    <span>Paste Clipboard</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClearText}
                    className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 bg-slate-100 dark:bg-slate-700 rounded-md transition-all cursor-pointer"
                  >
                    <Trash2 size={12} />
                    <span>Clear</span>
                  </button>
                </div>
              </div>
              <textarea
                rows={6}
                value={rawText}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="Section,Category,Skill Title,Description,Linked Drill,Status&#10;Batting,Stance & Balance,Load & Coil Balance,Stay anchored on inside of rear foot...,Rear-Hip Hinge & Load Tee Drill,To Cover"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>Columns: <span className="font-semibold text-slate-700 dark:text-slate-300">Section, Category, Skill Title, Description, Linked Drill, Status</span></span>
                <span>{rawText.split('\n').filter(Boolean).length} lines</span>
              </div>
            </div>
          )}

          {/* Tab 2: Upload File Mode */}
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
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                isDragging 
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20' 
                  : 'border-slate-300 dark:border-slate-700 hover:border-emerald-400 bg-white dark:bg-slate-800/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, .tsv, .txt, text/csv, text/tab-separated-values"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                <Upload size={24} />
              </div>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {fileName ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center justify-center gap-1.5">
                    <FileSpreadsheet size={16} />
                    {fileName} (Loaded)
                  </span>
                ) : (
                  'Click to upload or drag & drop CSV file'
                )}
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                CSV or TSV with columns: <span className="font-semibold text-slate-600 dark:text-slate-300">Section, Category, Skill Title, Description, Linked Drill, Status</span>
              </p>
            </div>
          )}

          {/* Master Starter Pack Banner */}
          {activeTab === 'starter' && (
            <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/20">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    Master Baseball Skills Curriculum (38 Skills)
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Spans 7 essential disciplines: Batting (7), Pitching (7), Infield (7), Outfield (4), Catching (5), Base Running (4), and Team Defense (4). Complete with coaching cues and linked drills!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Intelligence & Auto-Section Creation Banner */}
          {newSectionsToCreate.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl p-4 flex items-start gap-3">
              <FolderPlus size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-bold text-amber-900 dark:text-amber-200">
                  {newSectionsToCreate.length} New Guide Section(s) Will Be Automatically Created
                </div>
                <p className="text-amber-700 dark:text-amber-300/80 mt-0.5">
                  The imported skills belong to sections not yet in your database:
                </p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {newSectionsToCreate.map(sec => (
                    <span
                      key={sec.name}
                      className="px-2.5 py-1 bg-white dark:bg-slate-900 text-amber-800 dark:text-amber-300 font-extrabold rounded-lg border border-amber-300 dark:border-amber-700 text-[11px] flex items-center gap-1.5 shadow-2xs"
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      {sec.name} ({sec.count} skills)
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Section Filter Pills and Search */}
          {parsedSkills.length > 0 && (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
              {/* Section Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
                <button
                  type="button"
                  onClick={() => setSelectedSectionFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectedSectionFilter === 'all'
                      ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span>All Sections</span>
                  <span className="px-1.5 py-0.2 bg-black/20 text-white rounded-full text-[10px]">
                    {parsedSkills.length}
                  </span>
                </button>

                {distinctSections.map(sec => (
                  <button
                    key={sec.name}
                    type="button"
                    onClick={() => setSelectedSectionFilter(sec.name)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                      selectedSectionFilter === sec.name
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span>{sec.name}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      selectedSectionFilter === sec.name ? 'bg-black/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      {sec.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search in preview */}
              <div className="relative min-w-[200px] shrink-0">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search skills & cues..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
          )}

          {/* Drill Integration & Unmatched Alert Banner */}
          {unmatchedDrillsCount > 0 ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Unmatched Drills:</span>
                <span className="font-medium text-amber-800 dark:text-amber-300">
                  {unmatchedDrillsCount} skill(s) reference drill names not found in your Playbook. No drills will be auto-created.
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setDrillFilter(drillFilter === 'unmatched' ? 'all' : 'unmatched')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    drillFilter === 'unmatched'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-white dark:bg-slate-800 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700'
                  }`}
                >
                  {drillFilter === 'unmatched' ? 'Show All Skills' : `Filter ${unmatchedDrillsCount} Unmatched`}
                </button>
              </div>
            </div>
          ) : matchedDrillsCount > 0 ? (
            <div className="flex items-center gap-2 p-3 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl text-xs font-bold text-emerald-900 dark:text-emerald-200">
              <Dumbbell size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Drill Match Status:</span>
              <span className="font-medium text-emerald-700 dark:text-emerald-300">
                All {matchedDrillsCount} specified drills matched existing items in your Playbook!
              </span>
            </div>
          ) : null}

          {/* Master List Options & Duplicate Strategy Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl">
            <div className="flex items-center gap-3">
              <label htmlFor="resetMasterListToggle" className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="resetMasterListToggle"
                  checked={isResetMasterList}
                  onChange={(e) => setIsResetMasterList(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                />
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <RotateCcw size={14} className={isResetMasterList ? "text-rose-600 dark:text-rose-400" : "text-slate-400"} />
                  <span>Reset / Replace Master List</span>
                </span>
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                (Deletes existing DB skills not in this upload)
              </span>
            </div>

            {/* Duplicate Handling Options */}
            {duplicateItems.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs font-bold shrink-0">
                <span className="text-slate-500 text-[11px] mr-1">Duplicates ({duplicateItems.length}):</span>
                <button
                  type="button"
                  onClick={() => handleDuplicateActionChange('skip')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    duplicateAction === 'skip'
                      ? 'bg-amber-600 text-white font-extrabold shadow-2xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={() => handleDuplicateActionChange('update')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    duplicateAction === 'update'
                      ? 'bg-amber-600 text-white font-extrabold shadow-2xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => handleDuplicateActionChange('add')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    duplicateAction === 'add'
                      ? 'bg-amber-600 text-white font-extrabold shadow-2xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Add as New
                </button>
              </div>
            )}
          </div>

          {/* Reset Master List Active Warning Banner */}
          {isResetMasterList && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900/60 rounded-2xl animate-in fade-in duration-150">
              <div className="flex items-center gap-2.5 text-xs font-bold text-rose-900 dark:text-rose-200">
                <AlertTriangle size={18} className="text-rose-600 dark:text-rose-400 shrink-0 animate-pulse" />
                <div>
                  <span className="font-extrabold uppercase text-[11px] tracking-wide block sm:inline mr-1 text-rose-700 dark:text-rose-300">
                    Reset Mode Active:
                  </span>
                  <span className="font-medium text-rose-800 dark:text-rose-200">
                    {skillsToDelete.length > 0 ? (
                      <>
                        <strong>{skillsToDelete.length}</strong> existing skill(s) currently in your database will be <strong>permanently deleted</strong> because they are not included in this upload.
                      </>
                    ) : (
                      <>All existing database skills in this scope match items in your upload. No extra skills will be deleted.</>
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Skills Preview List */}
          <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl overflow-hidden shadow-xs">
            {/* List Table Header */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300 hover:text-emerald-600 transition-colors cursor-pointer"
                >
                  {selectedIndices.size === validItems.length && validItems.length > 0 ? (
                    <CheckSquare size={16} className="text-emerald-600" />
                  ) : selectedIndices.size > 0 ? (
                    <div className="w-4 h-4 rounded bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">
                      -
                    </div>
                  ) : (
                    <Square size={16} className="text-slate-400" />
                  )}
                  <span>Select All ({selectedIndices.size} / {validItems.length})</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-400 font-semibold lowercase">
                Showing {filteredSkillsWithIndices.length} skills
              </div>
            </div>

            {/* List Rows */}
            <div className="divide-y divide-slate-100 dark:divide-slate-700/60 max-h-[380px] overflow-y-auto">
              {filteredSkillsWithIndices.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  {rawText.trim() ? 'No skills found matching your filters.' : 'Please paste or load skills above.'}
                </div>
              ) : (
                filteredSkillsWithIndices.map(({ item, originalIndex }) => {
                  const isSelected = selectedIndices.has(originalIndex);
                  const isInvalid = !item.isValid;
                  const theme = getCategoryTheme(item.category);

                  const isLinkedToExisting = !!item.linkedDrillId || !!item.matchedDrill;
                  const isUnmatched = !isLinkedToExisting && (item.isDrillUnmatched || !!item.linkedDrillTitle || !!item.rawDrillInput);

                  return (
                    <div
                      key={originalIndex}
                      className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                        !item.isValid
                          ? 'bg-rose-50/50 dark:bg-rose-950/20'
                          : isSelected
                          ? 'bg-emerald-50/30 dark:bg-emerald-950/10'
                          : 'hover:bg-slate-50/60 dark:hover:bg-slate-750'
                      }`}
                    >
                      {/* Left: Checkbox + Target Section + Title + Details */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <button
                          type="button"
                          disabled={isInvalid}
                          onClick={() => handleToggleSelect(originalIndex)}
                          className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors shrink-0 cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare size={18} className="text-emerald-600" />
                          ) : (
                            <Square size={18} className={isInvalid ? 'opacity-30' : ''} />
                          )}
                        </button>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Section Badge */}
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[10px] font-extrabold rounded-md border border-slate-200 dark:border-slate-600 flex items-center gap-1">
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                item.willCreateSection ? 'bg-amber-500' : 'bg-emerald-500'
                              }`} />
                              {item.sectionName || sectionName || 'General'}
                              {item.willCreateSection && (
                                <span className="text-amber-600 text-[9px] font-bold">(New Section)</span>
                              )}
                            </span>

                            {/* Category Badge */}
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${theme.badge}`}>
                              {item.category}
                            </span>

                            {/* Unmatched Drill Badge */}
                            {isUnmatched && (
                              <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[10px] font-bold rounded-md border border-amber-300 dark:border-amber-800/80 flex items-center gap-1">
                                <AlertTriangle size={11} className="text-amber-600 dark:text-amber-400 shrink-0" />
                                Drill Not Found: "{item.linkedDrillTitle || item.rawDrillInput}"
                              </span>
                            )}

                            {/* Duplicate Tag */}
                            {item.isDuplicate && (
                              <span className="px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold rounded">
                                Duplicate in Section
                              </span>
                            )}
                          </div>

                          <div className="text-sm font-bold text-slate-900 dark:text-white">
                            {item.title}
                          </div>

                          {item.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Linked Drill Picker & Details */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {/* Drill selector */}
                        <div className="relative min-w-[210px] max-w-[270px]">
                          <select
                            value={item.linkedDrillId || ''}
                            onChange={(e) => handleDrillChange(originalIndex, e.target.value)}
                            className={`w-full pl-7 pr-7 py-1.5 bg-white dark:bg-slate-800 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 appearance-none truncate cursor-pointer transition-colors ${
                              isLinkedToExisting
                                ? 'border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 bg-emerald-50/20'
                                : isUnmatched
                                ? 'border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 bg-amber-50/20'
                                : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            {item.matchedDrill && (
                              <option value={item.matchedDrill.id}>
                                🟢 Linked: {item.matchedDrill.title}
                              </option>
                            )}
                            <option value="">
                              {isUnmatched ? `⚠️ Not Found: "${item.linkedDrillTitle || item.rawDrillInput}" (No Link)` : '(No Drill Linked)'}
                            </option>
                            <optgroup label="Link Existing Drill from Playbook">
                              {drills.map(d => (
                                <option key={d.id} value={d.id}>
                                  {d.title} ({d.category || 'General'})
                                </option>
                              ))}
                            </optgroup>
                          </select>
                          <Dumbbell 
                            size={13} 
                            className={`absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                              isLinkedToExisting 
                                ? 'text-emerald-600 dark:text-emerald-400' 
                                : isUnmatched 
                                ? 'text-amber-600 dark:text-amber-400' 
                                : 'text-slate-400'
                            }`} 
                          />
                          <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>

                        {/* View Full Cue Detail */}
                        <button
                          type="button"
                          onClick={() => setPreviewDetailSkill(item)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          title="Inspect Coaching Cue & Drill Info"
                        >
                          <Eye size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer with Progress and Actions */}
        <div className="p-5 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-wrap">
            <span className="font-black text-slate-900 dark:text-white">
              {selectedIndices.size}
            </span>
            <span>of {validItems.length} skills selected for import across {distinctSections.length} section(s)</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleImport}
              disabled={isProcessing || selectedIndices.size === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>
                    Importing {importProgress?.current} of {importProgress?.total}...
                  </span>
                </>
              ) : (
                <>
                  <Check size={15} />
                  <span>
                    {isResetMasterList
                      ? `Reset & Import (${selectedIndices.size} Skills)`
                      : `Import ${selectedIndices.size} Skills`}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Detail Inspection Modal */}
        {previewDetailSkill && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold rounded-lg">
                    {previewDetailSkill.sectionName || sectionName}
                  </span>
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg">
                    {previewDetailSkill.category}
                  </span>
                </div>
                <button
                  onClick={() => setPreviewDetailSkill(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {previewDetailSkill.title}
                </h3>
              </div>

              {previewDetailSkill.description && (
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  <div className="font-bold uppercase text-[10px] text-slate-400 mb-1">
                    Coaching Cues & Checkpoint Notes
                  </div>
                  {previewDetailSkill.description}
                </div>
              )}

              {previewDetailSkill.linkedDrillTitle && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs">
                  <Dumbbell size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold text-emerald-800 dark:text-emerald-300">Linked Practice Drill: </span>
                    <span className="text-slate-700 dark:text-slate-200">{previewDetailSkill.linkedDrillTitle}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setPreviewDetailSkill(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-200 rounded-xl cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Master List Reset Confirmation Overlay Modal */}
        {showResetConfirmModal && (
          <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 rounded-2xl shrink-0">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Confirm Master List Reset</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Permanent Database Update</p>
                </div>
              </div>

              <div className="space-y-3 p-4 bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl text-xs text-rose-950 dark:text-rose-100">
                <p className="font-bold">
                  Are you sure you want to reset your database skills list?
                </p>
                <ul className="space-y-1.5 list-disc pl-4 font-medium">
                  <li>
                    Import / sync <strong className="font-extrabold text-slate-900 dark:text-white">{selectedIndices.size}</strong> skill(s) from your uploaded file.
                  </li>
                  <li>
                    Permanently delete <strong className="font-extrabold text-rose-700 dark:text-rose-300">{skillsToDelete.length}</strong> existing database skill(s) that are NOT in this CSV file.
                  </li>
                </ul>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetConfirmModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => executeImport()}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-rose-600/20 transition-all cursor-pointer"
                >
                  Confirm & Reset Database
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
