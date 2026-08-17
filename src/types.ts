export enum RSVPStatus {
  YES = 'Yes',
  NO = 'No',
  TENTATIVE = 'Tentative'
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface Season {
  id: string;
  name: string;
  uid: string;
  createdAt: any;
}

export interface Player {
  id: string;
  name: string;
  positions: string[];
  battingOrder?: number;
  jerseyNumber?: string;
  seasonId?: string;
  uid: string;
  createdAt: any;
}

export interface TeamSettings {
  id?: string;
  allowDesignatedHitter: boolean;
  allowOutfieldTwiceInRow: boolean;
  publicSchedule?: boolean;
  activeSeasonId?: string;
  uid: string;
}

export interface PracticeActivity {
  id: string;
  name: string;
  duration: number;
  type: 'team' | 'groups' | 'rotating';
  category?: string;
  drillName?: string;
  drillId?: string;
  drillSetup?: string;
  drillSteps?: string;
  drillYoutubeUrl?: string;
  groupMap?: Record<number, string>; // GroupIndex (0-3) -> Drill Name
  groupCategoryMap?: Record<number, string>; // GroupIndex (0-3) -> Category Name
  startTimeOffset?: number; // Minutes from practice start. If undefined, follows previous activity.
  notes?: string;
}

export interface Drill {
  id: string;
  title: string;
  category?: string;
  summary?: string;
  setup?: string;
  steps?: string;
  notes?: string;
  youtubeUrl?: string;
  createdAt: any;
  updatedAt: any;
}

export interface PracticeNote {
  id: string;
  text: string;
}

export interface PracticeNoteSection {
  id: string;
  title: string;
  notes: PracticeNote[];
}

export interface Game {
  id: string;
  name?: string; // Auto-generated for games, manual or auto for practices
  opponent?: string;
  location?: string;
  date: any;
  time?: string;
  duration?: number; // In minutes
  isHome?: boolean;
  seasonId?: string;
  rsvps: Record<string, RSVPStatus>;
  battingOrder?: string[];
  lineup?: Record<string, Record<string, string>>; // Inning -> Position -> PlayerId
  isLocked?: boolean;
  lockedInnings?: number[];
  lockedPositions?: string[];
  uid: string;
  createdAt: any;
  mode?: 'standard' | 'scrimmage';
  type?: 'game' | 'practice'; // Defaults to 'game'
  seriesId?: string;
  scrimmageGroups?: string[][];
  scrimmageStep?: number;
  practiceAgenda?: PracticeActivity[];
  practiceNotes?: string[];
  practiceNoteSections?: PracticeNoteSection[];
  numGroups?: number; // Configurable (1-4)
  battingOrderChecks?: Record<string, boolean>; // PlayerId -> isChecked
}

/** 
 * Alias for Game to begin transition to Event nomenclature
 */
export type AppEvent = Game;

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export interface EditingCell {
  inning: string;
  position: string;
}

export interface DeleteConfirmation {
  isOpen: boolean;
  type: 'player' | 'game' | 'guideSection' | 'guideArticle' | 'guideChecklist' | null;
  id: string | null;
  title: string;
  message: string;
}

export interface GuideSection {
  id: string;
  name: string;
  description?: string;
  order?: number;
  isArchived?: boolean;
  color?: string;
  uid: string;
  createdAt: any;
  updatedAt?: any;
}

export interface GuidePhoto {
  url: string;
  caption?: string;
}

export interface GuideArticleHistory {
  timestamp: any;
  editorName: string;
  summary: string;
}

export interface GuideArticle {
  id: string;
  sectionId: string;
  title: string;
  summary?: string;
  content: string;
  status: 'draft' | 'published';
  order?: number;
  photos?: GuidePhoto[];
  youtubeUrls?: string[];
  drillIds?: string[];
  isArchived?: boolean;
  lastEditedBy?: {
    uid: string;
    displayName: string;
    timestamp: any;
  };
  history?: GuideArticleHistory[];
  uid: string;
  createdAt: any;
  updatedAt?: any;
}

export interface GuideChecklistItem {
  id: string;
  sectionId: string;
  title: string;
  description?: string;
  category?: string;
  order?: number;
  linkedArticleId?: string;
  linkedDrillId?: string;
  isArchived?: boolean;
  uid: string;
  createdAt: any;
}

export interface GuideProgress {
  id: string; // `${seasonId}_${checklistId}`
  checklistId: string;
  sectionId: string;
  seasonId: string;
  isCompleted: boolean;
  completedAt?: any;
  completedBy?: {
    uid: string;
    displayName: string;
  };
  notes?: string;
  uid: string;
}

export interface PitchCountSession {
  id: string;
  uid: string;
  playerId?: string;
  playerName?: string;
  balls: number;
  strikes: number;
  inPlay: number;
  totalPitches: number;
  strikePercentage: number;
  notes?: string;
  seasonId?: string;
  createdAt: any;
}

