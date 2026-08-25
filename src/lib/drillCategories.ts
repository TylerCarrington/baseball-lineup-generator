import React from 'react';

export const CATEGORIES: string[] = [
  "Batting & Offense",
  "Pitching & Throwing",
  "Catching",
  "Fielding & Defense",
  "Base Running",
  "Conditioning & Warm-Up",
  "Games & Competitions"
];

export type DrillCategory = typeof CATEGORIES[number];

export interface CategoryTheme {
  name: string;
  badge: string;
  iconBox: string;
  filterActive: string;
  filterInactive: string;
  dot: string;
  cardHover: string;
}

export function normalizeCategory(category?: string | null): string {
  if (!category) return "Uncategorized";
  const trimmed = category.trim();
  if (trimmed === "Hitting & Offense") return "Batting & Offense";
  if (trimmed === "Throwing & Pitching") return "Pitching & Throwing";
  if (trimmed === "Teamwork & Situational") return "Fielding & Defense";
  if (trimmed === "Games") return "Games & Competitions";
  return trimmed;
}

export const CATEGORY_THEMES: Record<string, CategoryTheme> = {
  "Batting & Offense": {
    name: "Batting & Offense",
    badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30",
    iconBox: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    filterActive: "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/25 dark:bg-amber-600 dark:border-amber-500",
    filterInactive: "bg-white text-slate-700 border-slate-200 hover:border-amber-300 hover:text-amber-700 hover:bg-amber-50/50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:border-amber-500/50 dark:hover:text-amber-400 dark:hover:bg-amber-500/5",
    dot: "bg-amber-500",
    cardHover: "hover:border-amber-400 dark:hover:border-amber-500/60"
  },
  "Pitching & Throwing": {
    name: "Pitching & Throwing",
    badge: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/30",
    iconBox: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
    filterActive: "bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-600/25 dark:bg-sky-600 dark:border-sky-500",
    filterInactive: "bg-white text-slate-700 border-slate-200 hover:border-sky-300 hover:text-sky-700 hover:bg-sky-50/50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:border-sky-500/50 dark:hover:text-sky-400 dark:hover:bg-sky-500/5",
    dot: "bg-sky-500",
    cardHover: "hover:border-sky-400 dark:hover:border-sky-500/60"
  },
  "Catching": {
    name: "Catching",
    badge: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30",
    iconBox: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
    filterActive: "bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/25 dark:bg-rose-600 dark:border-rose-500",
    filterInactive: "bg-white text-slate-700 border-slate-200 hover:border-rose-300 hover:text-rose-700 hover:bg-rose-50/50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:border-rose-500/50 dark:hover:text-rose-400 dark:hover:bg-rose-500/5",
    dot: "bg-rose-500",
    cardHover: "hover:border-rose-400 dark:hover:border-rose-500/60"
  },
  "Fielding & Defense": {
    name: "Fielding & Defense",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30",
    iconBox: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    filterActive: "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/25 dark:bg-emerald-600 dark:border-emerald-500",
    filterInactive: "bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50/50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:border-emerald-500/50 dark:hover:text-emerald-400 dark:hover:bg-emerald-500/5",
    dot: "bg-emerald-500",
    cardHover: "hover:border-emerald-400 dark:hover:border-emerald-500/60"
  },
  "Base Running": {
    name: "Base Running",
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/30",
    iconBox: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
    filterActive: "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/25 dark:bg-indigo-600 dark:border-indigo-500",
    filterInactive: "bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50/50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-500/50 dark:hover:text-indigo-400 dark:hover:bg-indigo-500/5",
    dot: "bg-indigo-500",
    cardHover: "hover:border-indigo-400 dark:hover:border-indigo-500/60"
  },
  "Conditioning & Warm-Up": {
    name: "Conditioning & Warm-Up",
    badge: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700/40 dark:text-slate-300 dark:border-slate-600/50",
    iconBox: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    filterActive: "bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/20 dark:bg-white dark:text-slate-900 dark:border-white",
    filterInactive: "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700",
    dot: "bg-slate-400",
    cardHover: "hover:border-slate-400 dark:hover:border-slate-600"
  },
  "Games & Competitions": {
    name: "Games & Competitions",
    badge: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/30",
    iconBox: "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
    filterActive: "bg-orange-600 text-white border-orange-600 shadow-md shadow-orange-600/25 dark:bg-orange-600 dark:border-orange-500",
    filterInactive: "bg-white text-slate-700 border-slate-200 hover:border-orange-300 hover:text-orange-700 hover:bg-orange-50/50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:border-orange-500/50 dark:hover:text-orange-400 dark:hover:bg-orange-500/5",
    dot: "bg-orange-500",
    cardHover: "hover:border-orange-400 dark:hover:border-orange-500/60"
  }
};

const DEFAULT_THEME: CategoryTheme = {
  name: "Uncategorized",
  badge: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700/40 dark:text-slate-300 dark:border-slate-600/50",
  iconBox: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  filterActive: "bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/20 dark:bg-white dark:text-slate-900 dark:border-white",
  filterInactive: "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700",
  dot: "bg-slate-400",
  cardHover: "hover:border-slate-400 dark:hover:border-slate-600"
};

export function getCategoryTheme(category?: string | null): CategoryTheme {
  const norm = normalizeCategory(category);
  if (!norm || !CATEGORY_THEMES[norm]) {
    return DEFAULT_THEME;
  }
  return CATEGORY_THEMES[norm];
}
