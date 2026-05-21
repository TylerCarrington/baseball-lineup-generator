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

export interface Player {
  id: string;
  name: string;
  positions: string[];
  battingOrder?: number;
  jerseyNumber?: string;
  uid: string;
  createdAt: any;
}

export interface TeamSettings {
  id?: string;
  allowDesignatedHitter: boolean;
  allowOutfieldTwiceInRow: boolean;
  publicSchedule?: boolean;
  uid: string;
}

export interface PracticeActivity {
  id: string;
  name: string;
  duration: number;
  type: 'team' | 'groups' | 'rotating';
  category?: string;
  drillName?: string;
  groupMap?: Record<number, string>; // GroupIndex (0-3) -> Drill Name
  groupCategoryMap?: Record<number, string>; // GroupIndex (0-3) -> Category Name
  startTimeOffset?: number; // Minutes from practice start. If undefined, follows previous activity.
  notes?: string;
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
  type: 'player' | 'game' | null;
  id: string | null;
  title: string;
  message: string;
}
