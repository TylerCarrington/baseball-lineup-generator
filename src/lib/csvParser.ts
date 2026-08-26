import { Drill, GuideChecklistItem, GuideArticle, GuideSection } from '../types';
import { CATEGORIES, normalizeCategory } from './drillCategories';
import { ALL_SECTIONS_SKILLS_CSV, ALL_SECTIONS_STARTER_SKILLS, StarterSkillItem } from '../data/allSectionsSkills';
import { ALL_CATEGORIES_DRILLS_CSV, ALL_CATEGORIES_STARTER_DRILLS, StarterDrillData } from '../data/allCategoriesDrills';

export interface ParsedDrillItem {
  id?: string;
  title: string;
  category: string;
  summary: string;
  setup?: string;
  steps?: string;
  notes?: string;
  youtubeUrl?: string;
  isValid: boolean;
  error?: string;
  isDuplicate?: boolean;
  existingId?: string;
}

export interface ParsedSkillItem {
  id?: string;
  sectionId?: string;
  sectionName?: string;
  matchedSection?: GuideSection;
  willCreateSection?: boolean;
  title: string;
  category: string;
  description: string;
  rawDrillInput?: string;
  linkedDrillTitle?: string;
  linkedDrillId?: string;
  matchedDrill?: Drill;
  isDrillMatched?: boolean;
  isDrillUnmatched?: boolean;
  rawArticleInput?: string;
  linkedArticleTitle?: string;
  linkedArticleId?: string;
  matchedArticle?: GuideArticle;
  isArticleMatched?: boolean;
  isArticleUnmatched?: boolean;
  status?: string;
  isCompleted?: boolean;
  isValid: boolean;
  error?: string;
  isDuplicate?: boolean;
  existingId?: string;
}

/**
 * Fuzzy/normalized matcher for finding existing drills in state
 */
export function matchDrillByName(rawName: string, drills: Drill[]): Drill | undefined {
  if (!rawName) return undefined;
  let cleanName = rawName.trim();
  // Strip prefixes like "Drill: " or "Drill - "
  cleanName = cleanName.replace(/^(drill\s*[:\-]\s*)/i, '').trim();
  const lower = cleanName.toLowerCase();
  const alphaNumeric = lower.replace(/[^a-z0-9]/g, '');

  // 1. Direct ID match
  let matched = drills.find(d => d.id === cleanName);
  if (matched) return matched;

  // 2. Exact lower-case title match
  matched = drills.find(d => d.title.trim().toLowerCase() === lower);
  if (matched) return matched;

  // 3. Alphanumeric stripped match (handles hyphens, spacing, capitalization)
  matched = drills.find(d => {
    const dAlpha = d.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    return dAlpha === alphaNumeric && dAlpha.length > 0;
  });
  if (matched) return matched;

  // 4. Substring inclusion
  matched = drills.find(d => {
    const dLower = d.title.trim().toLowerCase();
    return dLower.includes(lower) || lower.includes(dLower);
  });
  if (matched) return matched;

  // 5. Without trailing "Drill" / "Drills"
  const strippedLower = lower.replace(/\s+drill(s)?$/i, '').trim();
  const strippedAlpha = strippedLower.replace(/[^a-z0-9]/g, '');
  if (strippedAlpha.length >= 4) {
    matched = drills.find(d => {
      const dStrippedAlpha = d.title.toLowerCase().replace(/\s+drill(s)?$/i, '').replace(/[^a-z0-9]/g, '');
      return dStrippedAlpha === strippedAlpha || dStrippedAlpha.includes(strippedAlpha) || strippedAlpha.includes(dStrippedAlpha);
    });
    if (matched) return matched;
  }

  return undefined;
}

/**
 * Looks up starter drill definition in master catalog for rich metadata
 */
export function findStarterDrillData(rawName: string): StarterDrillData | undefined {
  if (!rawName) return undefined;
  let cleanName = rawName.trim().replace(/^(drill\s*[:\-]\s*)/i, '').trim();
  const lower = cleanName.toLowerCase();
  const alphaNumeric = lower.replace(/[^a-z0-9]/g, '');

  let matched = ALL_CATEGORIES_STARTER_DRILLS.find(d => d.title.trim().toLowerCase() === lower);
  if (matched) return matched;

  matched = ALL_CATEGORIES_STARTER_DRILLS.find(d => {
    const dAlpha = d.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    return dAlpha === alphaNumeric && dAlpha.length > 0;
  });
  if (matched) return matched;

  matched = ALL_CATEGORIES_STARTER_DRILLS.find(d => {
    const dLower = d.title.trim().toLowerCase();
    return dLower.includes(lower) || lower.includes(dLower);
  });
  if (matched) return matched;

  // Without trailing drill
  const strippedAlpha = lower.replace(/\s+drill(s)?$/i, '').replace(/[^a-z0-9]/g, '');
  if (strippedAlpha.length >= 4) {
    matched = ALL_CATEGORIES_STARTER_DRILLS.find(d => {
      const dStrippedAlpha = d.title.toLowerCase().replace(/\s+drill(s)?$/i, '').replace(/[^a-z0-9]/g, '');
      return dStrippedAlpha === strippedAlpha || dStrippedAlpha.includes(strippedAlpha) || strippedAlpha.includes(dStrippedAlpha);
    });
    if (matched) return matched;
  }

  return undefined;
}

/**
 * Robust CSV/TSV line parser that respects quoted fields, multi-line quotes, and escaped quotes.
 */
export function parseCSVToRows(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;

  // Normalize line endings
  const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Detect delimiter (Tab or Comma or Semicolon) by checking the first line
  const firstLine = cleanText.split('\n')[0] || '';
  let delimiter = ',';
  if (firstLine.includes('\t') && (firstLine.split('\t').length >= firstLine.split(',').length)) {
    delimiter = '\t';
  } else if (firstLine.includes(';') && (firstLine.split(';').length > firstLine.split(',').length)) {
    delimiter = ';';
  }

  while (i < cleanText.length) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          currentField += '"';
          i += 2;
          continue;
        } else {
          // End of quoted field
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        currentField += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
        continue;
      } else if (char === delimiter) {
        currentRow.push(currentField.trim());
        currentField = '';
        i++;
        continue;
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        // Only push row if it contains non-empty data
        if (currentRow.some(col => col.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
        i++;
        continue;
      } else {
        currentField += char;
        i++;
        continue;
      }
    }
  }

  // Final field and row
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(col => col.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Normalizes header string to find matching field key
 */
function matchHeaderColumn(header: string): string | null {
  const norm = header.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  if (['category', 'cat', 'drillcategory', 'section', 'group', 'type'].includes(norm)) {
    return 'category';
  }
  if (['title', 'drilltitle', 'name', 'drillname', 'drill', 'activity', 'item'].includes(norm)) {
    return 'title';
  }
  if (['summary', 'description', 'desc', 'overview', 'drillsummary', 'details'].includes(norm)) {
    return 'summary';
  }
  if (['videourl', 'youtubeurl', 'youtube', 'video', 'url', 'link', 'videolink', 'youtubelink'].includes(norm)) {
    return 'youtubeUrl';
  }
  if (['setup', 'equipment', 'drillsetup', 'materials', 'fieldsetup'].includes(norm)) {
    return 'setup';
  }
  if (['steps', 'instructions', 'drillsteps', 'execution', 'drillinstructions', 'howtoplay', 'drillssteps'].includes(norm)) {
    return 'steps';
  }
  if (['notes', 'coachingtips', 'tips', 'drillnotes', 'coachingnotes', 'coachnotes'].includes(norm)) {
    return 'notes';
  }
  
  return null;
}

/**
 * Parses raw CSV string into structured drill items
 */
export function parseDrillsCSV(csvText: string, existingDrills: Drill[] = []): ParsedDrillItem[] {
  const rows = parseCSVToRows(csvText);
  if (rows.length === 0) return [];

  const existingTitlesMap = new Map<string, Drill>();
  existingDrills.forEach(d => {
    existingTitlesMap.set(d.title.trim().toLowerCase(), d);
  });

  const firstRow = rows[0];
  let hasHeader = false;
  const columnIndexMap: Record<string, number> = {};

  // Check if first row is a header
  firstRow.forEach((col, idx) => {
    const matchedKey = matchHeaderColumn(col);
    if (matchedKey) {
      columnIndexMap[matchedKey] = idx;
      hasHeader = true;
    }
  });

  // Default standard positional mapping if no header matches found
  // (Standard export format: Category, Drill Title, Summary, Video URL)
  if (!hasHeader || Object.keys(columnIndexMap).length === 0) {
    columnIndexMap['category'] = 0;
    columnIndexMap['title'] = 1;
    columnIndexMap['summary'] = 2;
    columnIndexMap['youtubeUrl'] = 3;
    columnIndexMap['setup'] = 4;
    columnIndexMap['steps'] = 5;
    columnIndexMap['notes'] = 6;
  }

  const dataRows = hasHeader ? rows.slice(1) : rows;
  const parsedItems: ParsedDrillItem[] = [];

  dataRows.forEach((row) => {
    // Skip completely empty rows
    if (!row || row.every(val => !val || val.trim() === '')) return;

    const getValue = (key: string): string => {
      const idx = columnIndexMap[key];
      if (idx !== undefined && idx < row.length) {
        return row[idx]?.trim() || '';
      }
      return '';
    };

    let title = getValue('title');
    let rawCategory = getValue('category');
    let summary = getValue('summary');
    let youtubeUrl = getValue('youtubeUrl');
    let setup = getValue('setup');
    let steps = getValue('steps');
    let notes = getValue('notes');

    // If title is missing but row has 1 column, perhaps the column was misplaced
    if (!title && row.length === 1 && row[0]) {
      title = row[0];
    } else if (!title && row.length >= 2 && !hasHeader) {
      // Maybe format was Title, Category
      title = row[0];
      rawCategory = row[1];
    }

    const normalizedCategory = normalizeCategory(rawCategory) || CATEGORIES[0];
    const cleanTitle = title.trim();

    if (!cleanTitle) {
      parsedItems.push({
        title: '(Empty Title)',
        category: normalizedCategory,
        summary,
        setup,
        steps,
        notes,
        youtubeUrl,
        isValid: false,
        error: 'Drill name/title is required'
      });
      return;
    }

    const existingMatch = existingTitlesMap.get(cleanTitle.toLowerCase());

    parsedItems.push({
      title: cleanTitle,
      category: normalizedCategory,
      summary,
      setup: setup || undefined,
      steps: steps || undefined,
      notes: notes || undefined,
      youtubeUrl: youtubeUrl || undefined,
      isValid: true,
      isDuplicate: !!existingMatch,
      existingId: existingMatch?.id
    });
  });

  return parsedItems;
}

export { ALL_CATEGORIES_DRILLS_CSV, ALL_CATEGORIES_STARTER_DRILLS };
export { ALL_SECTIONS_SKILLS_CSV, ALL_SECTIONS_STARTER_SKILLS };
export type { StarterSkillItem };
export const SAMPLE_DRILLS_CSV = ALL_CATEGORIES_DRILLS_CSV;

/**
 * Normalizes header string to find matching skill field key
 */
function matchSkillsHeaderColumn(header: string): string | null {
  const norm = header.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  if (['section', 'sectionname', 'guidesection', 'playbooksection', 'guide', 'module', 'sportsection'].includes(norm)) {
    return 'section';
  }
  if (['category', 'cat', 'skillcategory', 'group', 'type', 'skillgroup', 'subcategory'].includes(norm)) {
    return 'category';
  }
  if (['title', 'skilltitle', 'skill', 'name', 'skillname', 'checkpoint', 'item', 'skillpoint', 'skillcheckpoint'].includes(norm)) {
    return 'title';
  }
  if (['description', 'desc', 'notes', 'coachingcue', 'cue', 'summary', 'details', 'coachingnotes', 'tips', 'keycoachingcue', 'keycoachingcuenotes', 'cues'].includes(norm)) {
    return 'description';
  }
  if (['linkeddrill', 'drill', 'drillitem', 'drilltitle', 'drillname', 'practicedrill', 'linkeddrilltitle', 'drilllink', 'linktodrill', 'linktodrillitem', 'drilllibraryitem'].includes(norm)) {
    return 'linkedDrill';
  }
  if (['linkedarticle', 'article', 'guidearticle', 'articletitle', 'articlename', 'linktoarticle', 'linktoguidearticle'].includes(norm)) {
    return 'linkedArticle';
  }
  if (['status', 'covered', 'completed', 'state', 'skillstatus', 'readiness'].includes(norm)) {
    return 'status';
  }
  
  return null;
}

/**
 * Matches a raw section name string against existing GuideSection records
 * Supports exact match, normalized alphanumeric, and common baseball/softball aliases.
 */
export function matchSectionByName(
  rawSectionName: string,
  existingSections: GuideSection[]
): GuideSection | undefined {
  if (!rawSectionName || !rawSectionName.trim()) return undefined;
  const norm = rawSectionName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

  // 1. Direct case-insensitive or stripped match
  const direct = existingSections.find(s => {
    const sNorm = s.name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    return sNorm === norm;
  });
  if (direct) return direct;

  // 2. Common baseball/softball aliases
  const ALIAS_MAP: Record<string, string[]> = {
    batting: ['hitting', 'hitter', 'swing', 'offense', 'batters', 'battingoffense', 'plateapproach'],
    pitching: ['throwing', 'pitcher', 'pitchingthrowing', 'armcare', 'bullpen', 'mound'],
    infield: ['infielddefense', 'infielding', 'groundballs', 'middleinfield', 'corners', 'infieldfielding'],
    outfield: ['outfielddefense', 'outfielding', 'flyballs', 'outfielders'],
    fielding: ['defense', 'teamdefense', 'fieldingdefense', 'glovework'],
    catching: ['catcher', 'catchers', 'blocking', 'receiving'],
    baserunning: ['running', 'baserunner', 'stealing', 'speed', 'baserunningfundamentals', 'base-running'],
    teamdefense: ['defense', 'situational', 'situations', 'relays', 'cutoffs', 'buntdefense', 'team-defense']
  };

  for (const [targetKey, aliases] of Object.entries(ALIAS_MAP)) {
    if (aliases.includes(norm) || targetKey === norm) {
      const aliasMatch = existingSections.find(s => {
        const sNorm = s.name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        return sNorm === targetKey || aliases.includes(sNorm);
      });
      if (aliasMatch) return aliasMatch;
    }
  }

  // 3. Substring match
  return existingSections.find(s => {
    const sNorm = s.name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    return sNorm.length >= 3 && (sNorm.includes(norm) || norm.includes(sNorm));
  });
}

/**
 * Universal parser for importing skills across ALL sections or a single target section.
 * Automatically identifies Section columns, matches with existing sections, links drills, and flags duplicates.
 */
export function parseAllSkillsCSV(
  csvText: string,
  existingSections: GuideSection[] = [],
  existingChecklists: GuideChecklistItem[] = [],
  drills: Drill[] = [],
  articles: GuideArticle[] = [],
  defaultSectionId?: string
): ParsedSkillItem[] {
  const rows = parseCSVToRows(csvText);
  if (rows.length === 0) return [];

  const defaultSection = defaultSectionId 
    ? existingSections.find(s => s.id === defaultSectionId)
    : undefined;

  // Map of existing checklist items for fast duplicate checks (keyed by `${sectionId}_${title}`)
  const existingChecklistMap = new Map<string, GuideChecklistItem>();
  existingChecklists.forEach(c => {
    const key = `${c.sectionId}_${c.title.trim().toLowerCase()}`;
    existingChecklistMap.set(key, c);
  });

  const firstRow = rows[0];
  let hasHeader = false;
  const columnIndexMap: Record<string, number> = {};

  firstRow.forEach((col, idx) => {
    const matchedKey = matchSkillsHeaderColumn(col);
    if (matchedKey) {
      columnIndexMap[matchedKey] = idx;
      hasHeader = true;
    }
  });

  // Default standard positional mapping if no recognized headers:
  if (!hasHeader || Object.keys(columnIndexMap).length === 0) {
    if (firstRow.length >= 6) {
      // [Section, Category, Skill Title, Description, Linked Drill, Status]
      columnIndexMap['section'] = 0;
      columnIndexMap['category'] = 1;
      columnIndexMap['title'] = 2;
      columnIndexMap['description'] = 3;
      columnIndexMap['linkedDrill'] = 4;
      columnIndexMap['status'] = 5;
    } else if (firstRow.length === 5) {
      // Detect if 1st column is likely a section name
      const sampleCol0 = (rows[1]?.[0] || firstRow[0]).toLowerCase();
      const isKnownSection = ['batting', 'hitting', 'pitching', 'fielding', 'infield', 'outfield', 'catching', 'base running', 'baserunning', 'team defense'].some(s => sampleCol0.includes(s));
      
      if (isKnownSection) {
        columnIndexMap['section'] = 0;
        columnIndexMap['category'] = 1;
        columnIndexMap['title'] = 2;
        columnIndexMap['description'] = 3;
        columnIndexMap['linkedDrill'] = 4;
      } else {
        columnIndexMap['category'] = 0;
        columnIndexMap['title'] = 1;
        columnIndexMap['description'] = 2;
        columnIndexMap['linkedDrill'] = 3;
        columnIndexMap['status'] = 4;
      }
    } else if (firstRow.length === 4) {
      columnIndexMap['category'] = 0;
      columnIndexMap['title'] = 1;
      columnIndexMap['description'] = 2;
      columnIndexMap['linkedDrill'] = 3;
    } else if (firstRow.length === 3) {
      columnIndexMap['category'] = 0;
      columnIndexMap['title'] = 1;
      columnIndexMap['description'] = 2;
    } else if (firstRow.length === 2) {
      columnIndexMap['category'] = 0;
      columnIndexMap['title'] = 1;
    } else {
      columnIndexMap['title'] = 0;
    }
  }

  const dataRows = hasHeader ? rows.slice(1) : rows;
  const parsedItems: ParsedSkillItem[] = [];

  dataRows.forEach((row) => {
    if (!row || row.every(val => !val || val.trim() === '')) return;

    const getValue = (key: string): string => {
      const idx = columnIndexMap[key];
      if (idx !== undefined && idx < row.length) {
        return row[idx]?.trim() || '';
      }
      return '';
    };

    let rawSection = getValue('section');
    let rawCategory = getValue('category');
    let title = getValue('title');
    let description = getValue('description');
    let rawDrill = getValue('linkedDrill');
    let rawArticle = getValue('linkedArticle');
    let status = getValue('status');

    // Handle positional shift if title is blank but row has content
    if (!title && row.length === 1 && row[0]) {
      title = row[0];
    } else if (!title && row.length >= 2 && !hasHeader) {
      if (columnIndexMap['section'] !== undefined) {
        title = row[2] || row[1] || row[0];
      } else {
        title = row[1] || row[0];
      }
    }

    const cleanTitle = title.trim();

    // Section resolution
    let targetSectionName = rawSection.trim();
    if (!targetSectionName && defaultSection) {
      targetSectionName = defaultSection.name;
    }
    if (!targetSectionName) {
      // Inferred from category if known, else 'General'
      targetSectionName = rawCategory.trim() || 'General';
    }

    const matchedSection = matchSectionByName(targetSectionName, existingSections) || (defaultSectionId && !rawSection ? defaultSection : undefined);
    const resolvedSectionId = matchedSection?.id || undefined;
    const willCreateSection = !matchedSection;

    if (!cleanTitle) {
      parsedItems.push({
        sectionId: resolvedSectionId,
        sectionName: targetSectionName,
        matchedSection,
        willCreateSection,
        title: '(Empty Title)',
        category: rawCategory || 'General',
        description,
        isValid: false,
        error: 'Skill Title is required'
      });
      return;
    }

    // Match Linked Drill
    let matchedDrill: Drill | undefined;
    let linkedDrillId: string | undefined;
    let linkedDrillTitle: string | undefined;
    let rawDrillInput: string | undefined;
    let isDrillMatched = false;
    let isDrillUnmatched = false;

    if (rawDrill) {
      rawDrillInput = rawDrill.trim();
      const cleanDrill = rawDrillInput.replace(/^(drill\s*[:\-]\s*)/i, '').trim();
      matchedDrill = matchDrillByName(cleanDrill, drills);

      if (matchedDrill) {
        linkedDrillId = matchedDrill.id;
        linkedDrillTitle = matchedDrill.title;
        isDrillMatched = true;
        isDrillUnmatched = false;
      } else {
        linkedDrillTitle = cleanDrill;
        linkedDrillId = undefined;
        isDrillMatched = false;
        isDrillUnmatched = true;
      }
    }

    // Match Linked Article
    let matchedArticle: GuideArticle | undefined;
    let linkedArticleId: string | undefined;
    let linkedArticleTitle: string | undefined;
    let rawArticleInput: string | undefined;
    let isArticleMatched = false;
    let isArticleUnmatched = false;

    if (rawArticle) {
      rawArticleInput = rawArticle.trim();
      const cleanArticle = rawArticleInput.replace(/^(article\s*[:\-]\s*)/i, '').trim();
      const normArticle = cleanArticle.toLowerCase();
      matchedArticle = articles.find(a => a.id === cleanArticle);
      if (!matchedArticle) {
        matchedArticle = articles.find(a => a.title.trim().toLowerCase() === normArticle);
      }
      if (!matchedArticle) {
        matchedArticle = articles.find(a => 
          a.title.trim().toLowerCase().includes(normArticle) || 
          normArticle.includes(a.title.trim().toLowerCase())
        );
      }
      if (matchedArticle) {
        linkedArticleId = matchedArticle.id;
        linkedArticleTitle = matchedArticle.title;
        isArticleMatched = true;
        isArticleUnmatched = false;
      } else {
        linkedArticleTitle = cleanArticle;
        linkedArticleId = undefined;
        isArticleMatched = false;
        isArticleUnmatched = true;
      }
    }

    // Status check
    const isCompleted = status
      ? ['completed', 'covered', 'done', 'yes', 'true', '1'].includes(status.toLowerCase())
      : false;

    // Check for duplicate in the matched section
    let existingMatch: GuideChecklistItem | undefined;
    if (resolvedSectionId) {
      existingMatch = existingChecklistMap.get(`${resolvedSectionId}_${cleanTitle.toLowerCase()}`);
    } else {
      // Check title match across any existing checklist
      existingMatch = existingChecklists.find(c => c.title.trim().toLowerCase() === cleanTitle.toLowerCase());
    }

    parsedItems.push({
      sectionId: resolvedSectionId,
      sectionName: targetSectionName,
      matchedSection,
      willCreateSection,
      title: cleanTitle,
      category: rawCategory.trim() || 'General',
      description: description.trim(),
      rawDrillInput,
      linkedDrillTitle,
      linkedDrillId,
      matchedDrill,
      isDrillMatched,
      isDrillUnmatched,
      rawArticleInput,
      linkedArticleTitle,
      linkedArticleId,
      matchedArticle,
      isArticleMatched,
      isArticleUnmatched,
      status: isCompleted ? 'Completed' : 'To Cover',
      isCompleted,
      isValid: true,
      isDuplicate: !!existingMatch,
      existingId: existingMatch?.id
    });
  });

  return parsedItems;
}

/**
 * Parses raw CSV string into structured skill checklist items for a specific section (backward compatibility)
 */
export function parseSkillsCSV(
  csvText: string,
  sectionId: string,
  existingChecklists: GuideChecklistItem[] = [],
  drills: Drill[] = [],
  articles: GuideArticle[] = []
): ParsedSkillItem[] {
  return parseAllSkillsCSV(
    csvText,
    [],
    existingChecklists,
    drills,
    articles,
    sectionId
  );
}

export const SAMPLE_SKILLS_CSV = `Section,Category,Skill Title,Description,Linked Drill,Status
Batting,Fundamentals,Load & Coil Balance,Stay anchored on inside of rear foot with hands back at shoulder height.,Top Hand Tee Extension Drill,To Cover
Batting,Swing Path,Palm-Up Palm-Down Contact,Drive top hand with palm facing upward and lead hand palm down through contact.,Top Hand Tee Extension Drill,To Cover
Pitching,Lower Half,Lean & Hip Drift Momentum,Lead hip drifts 3-4 inches toward plate while knee is at peak balance.,Balance Point & Hip Separation Pause,To Cover
Pitching,Extension,Chest Tilt & Towel Snap Follow Through,Upper torso tilts forward over front knee with arm snapping out front.,Towel Extension & Follow-Through Drill,To Cover
Infield,Footwork,Triangle Footwork & Glove Apex Presentation,Feet wide with glove presented out front forming an equilateral triangle.,Infield Triangle Footwork & Funneling,To Cover
Catching,Stances,Primary & Secondary Stance Transitions,Low relaxed squat for solo pitches; raise hips 2 inches with runners on.,Primary & Secondary Stance Transitions,To Cover
Base Running,Sprint,Home to First Sprint & Breakdown,Sprint at 100% through front edge of bag and execute chop-step breakdown.,Home to First Sprint & Breakdown,To Cover
Team Defense,Backups,Full Field Overthrow Backups,Right field backs up 1st base; Left field backs up 3rd base on every play.,Progressive Long Toss & Arm Care,To Cover`;

