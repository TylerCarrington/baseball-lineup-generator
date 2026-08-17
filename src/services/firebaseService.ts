import { doc, updateDoc, deleteDoc, addDoc, collection, getDocs, query, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { OperationType } from "../types";
import { handleFirestoreError } from "../lib/utils";

/**
 * Removes undefined values from an object recursively to prevent Firestore errors.
 * Safely ignores Date objects and Firestore internal types.
 */
function stripUndefined(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  
  // Preserving Date objects
  if (obj instanceof Date) return obj;

  // Preserving Firestore FieldValues and other specialized objects
  // (Detecting by checking if it's not a plain object or array)
  if (obj.constructor && obj.constructor.name !== 'Object' && obj.constructor.name !== 'Array') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(stripUndefined);
  }
  
  const newObj: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (obj[key] !== undefined) {
        newObj[key] = stripUndefined(obj[key]);
      }
    }
  }
  return newObj;
}

export const firebaseService = {
  // Drills
  async getDrills() {
    try {
      const snapshot = await getDocs(query(collection(db, 'drills')));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'drills');
      return [];
    }
  },
  
  async addDrill(data: any) {
    try {
      return await addDoc(collection(db, 'drills'), stripUndefined({
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'drills');
    }
  },

  async updateDrill(drillId: string, data: any) {
    try {
      await updateDoc(doc(db, 'drills', drillId), stripUndefined({
        ...data,
        updatedAt: serverTimestamp()
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `drills/${drillId}`);
    }
  },

  async deleteDrill(drillId: string) {
    try {
      await deleteDoc(doc(db, 'drills', drillId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `drills/${drillId}`);
    }
  },

  async updateGame(gameId: string, data: any) {
    try {
      await updateDoc(doc(db, 'games', gameId), stripUndefined(data));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `games/${gameId}`);
    }
  },

  async deleteGame(gameId: string) {
    try {
      await deleteDoc(doc(db, 'games', gameId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `games/${gameId}`);
    }
  },

  async addGame(data: any) {
    try {
      return await addDoc(collection(db, 'games'), stripUndefined(data));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'games');
    }
  },

  async updateSeason(seasonId: string, data: any) {
    try {
      await updateDoc(doc(db, 'seasons', seasonId), stripUndefined(data));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `seasons/${seasonId}`);
    }
  },

  async deleteSeason(seasonId: string) {
    try {
      await deleteDoc(doc(db, 'seasons', seasonId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `seasons/${seasonId}`);
    }
  },

  async addSeason(data: any) {
    try {
      return await addDoc(collection(db, 'seasons'), stripUndefined(data));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'seasons');
    }
  },

  async updatePlayer(playerId: string, data: any) {
    try {
      await updateDoc(doc(db, 'players', playerId), stripUndefined(data));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `players/${playerId}`);
    }
  },

  async deletePlayer(playerId: string) {
    try {
      await deleteDoc(doc(db, 'players', playerId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `players/${playerId}`);
    }
  },

  async addPlayer(data: any) {
    try {
      return await addDoc(collection(db, 'players'), stripUndefined(data));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'players');
    }
  },

  async updateSettings(userId: string, data: any) {
    try {
      await updateDoc(doc(db, 'settings', userId), stripUndefined(data));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `settings/${userId}`);
    }
  }
};
