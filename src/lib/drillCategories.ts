import React from 'react';

export const CATEGORIES: string[] = [
  "Hitting & Offense",
  "Fielding & Defense",
  "Throwing & Pitching",
  "Base Running",
  "Conditioning & Warm-Up",
  "Teamwork & Situational",
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

export const CATEGORY_THEMES: Record<string, CategoryTheme> = {
  "Hitting & Offense": {
    name: "Hitting & Offense",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30",
    iconBox: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    filterActive: "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/25 dark:bg-emerald-600 dark:border-emerald-500",
    filterInactive: "bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50/50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:border-emerald-500/50 dark:hover:text-emerald-400 dark:hover:bg-emerald-500/5",
    dot: "bg-emerald-500",
    cardHover: "hover:border-emerald-400 dark:hover:border-emerald-500/60"
  },
  "Fielding & Defense": {
    name: "Fielding & Defense",
    badge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30",
    iconBox: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    filterActive: "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/25 dark:bg-blue-600 dark:border-blue-500",
    filterInactive: "bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50/50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-500/50 dark:hover:text-blue-400 dark:hover:bg-blue-500/5",
    dot: "bg-blue-500",
    cardHover: "hover:border-blue-400 dark:hover:border-blue-500/60"
  },
  "Throwing & Pitching": {
    name: "Throwing & Pitching",
    badge: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/30",
    iconBox: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
    filterActive: "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/25 dark:bg-purple-600 dark:border-purple-500",
    filterInactive: "bg-white text-slate-700 border-slate-200 hover:border-purple-300 hover:text-purple-700 hover:bg-purple-50/50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:border-purple-500/50 dark:hover:text-purple-400 dark:hover:bg-purple-500/5",
    dot: "bg-purple-500",
    cardHover: "hover:border-purple-400 dark:hover:border-purple-500/60"
  },
  "Base Running": {
    name: "Base Running",
    badge: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30",
    iconBox: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    filterActive: "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/25 dark:bg-amber-500 dark:border-amber-400",
    filterInactive: "bg-white text-slate-700 border-slate-200 hover:border-amber-300 hover:text-amber-700 hover:bg-amber-50/50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:border-amber-500/50 dark:hover:text-amber-400 dark:hover:bg-amber-500/5",
    dot: "bg-amber-500",
    cardHover: "hover:border-amber-400 dark:hover:border-amber-500/60"
  },
  "Conditioning & Warm-Up": {
    name: "Conditioning & Warm-Up",
    badge: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30",
    iconBox: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
    filterActive: "bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/25 dark:bg-rose-600 dark:border-rose-500",
    filterInactive: "bg-white text-slate-700 border-slate-200 hover:border-rose-300 hover:text-rose-700 hover:bg-rose-50/50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:border-rose-500/50 dark:hover:text-rose-400 dark:hover:bg-rose-500/5",
    dot: "bg-rose-500",
    cardHover: "hover:border-rose-400 dark:hover:border-rose-500/60"
  },
  "Teamwork & Situational": {
    name: "Teamwork & Situational",
    badge: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/30",
    iconBox: "bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400",
    filterActive: "bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-600/25 dark:bg-teal-600 dark:border-teal-500",
    filterInactive: "bg-white text-slate-700 border-slate-200 hover:border-teal-300 hover:text-teal-700 hover:bg-teal-50/50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:border-teal-500/50 dark:hover:text-teal-400 dark:hover:bg-teal-500/5",
    dot: "bg-teal-500",
    cardHover: "hover:border-teal-400 dark:hover:border-teal-500/60"
  },
  "Games & Competitions": {
    name: "Games & Competitions",
    badge: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/30",
    iconBox: "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
    filterActive: "bg-orange-600 text-white border-orange-600 shadow-md shadow-orange-600/25 dark:bg-orange-600 dark:border-orange-500",
    filterInactive: "bg-white text-slate-700 border-slate-200 hover:border-orange-300 hover:text-orange-700 hover:bg-orange-50/50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:border-orange-500/50 dark:hover:text-orange-400 dark:hover:bg-orange-500/5",
    dot: "bg-orange-500",
    cardHover: "hover:border-orange-400 dark:hover:border-orange-500/60"
  },
  "Games": {
    name: "Games",
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
  if (!category || !CATEGORY_THEMES[category]) {
    return DEFAULT_THEME;
  }
  return CATEGORY_THEMES[category];
}
