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

export interface Game {
  id: string;
  name: string;
  date: any;
  time?: string;
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
  scrimmageGroups?: string[][];
  scrimmageStep?: number;
}

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
