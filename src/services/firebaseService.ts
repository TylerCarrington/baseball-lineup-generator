import { doc, updateDoc, deleteDoc, addDoc, setDoc, collection, getDocs, query, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { OperationType } from "../types";
import { handleFirestoreError } from "../lib/utils";
import { STARTER_GUIDE_SECTIONS } from "../lib/starterGuides";

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
  },

  // ==========================================
  // Coaching Guides Methods
  // ==========================================

  // Guide Sections
  async addGuideSection(data: any) {
    try {
      return await addDoc(collection(db, 'guideSections'), stripUndefined({
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'guideSections');
    }
  },

  async updateGuideSection(sectionId: string, data: any) {
    try {
      await updateDoc(doc(db, 'guideSections', sectionId), stripUndefined({
        ...data,
        updatedAt: serverTimestamp()
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `guideSections/${sectionId}`);
    }
  },

  async deleteGuideSection(sectionId: string) {
    try {
      await deleteDoc(doc(db, 'guideSections', sectionId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `guideSections/${sectionId}`);
    }
  },

  // Guide Articles
  async addGuideArticle(data: any) {
    try {
      return await addDoc(collection(db, 'guideArticles'), stripUndefined({
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'guideArticles');
    }
  },

  async updateGuideArticle(articleId: string, data: any) {
    try {
      await updateDoc(doc(db, 'guideArticles', articleId), stripUndefined({
        ...data,
        updatedAt: serverTimestamp()
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `guideArticles/${articleId}`);
    }
  },

  async deleteGuideArticle(articleId: string) {
    try {
      await deleteDoc(doc(db, 'guideArticles', articleId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `guideArticles/${articleId}`);
    }
  },

  // Guide Checklists
  async addGuideChecklist(data: any) {
    try {
      return await addDoc(collection(db, 'guideChecklists'), stripUndefined({
        ...data,
        createdAt: serverTimestamp()
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'guideChecklists');
    }
  },

  async updateGuideChecklist(checklistId: string, data: any) {
    try {
      await updateDoc(doc(db, 'guideChecklists', checklistId), stripUndefined(data));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `guideChecklists/${checklistId}`);
    }
  },

  async deleteGuideChecklist(checklistId: string) {
    try {
      await deleteDoc(doc(db, 'guideChecklists', checklistId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `guideChecklists/${checklistId}`);
    }
  },

  // Guide Progress (Season-specific checkmarks)
  async toggleGuideProgress(
    uid: string,
    seasonId: string,
    checklistId: string,
    sectionId: string,
    isCompleted: boolean,
    completedBy?: { uid: string; displayName: string }
  ) {
    const progressDocId = `${seasonId}_${checklistId}`;
    try {
      await setDoc(doc(db, 'guideProgress', progressDocId), stripUndefined({
        uid,
        seasonId,
        checklistId,
        sectionId,
        isCompleted,
        completedAt: isCompleted ? serverTimestamp() : null,
        completedBy: isCompleted ? (completedBy || null) : null
      }), { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `guideProgress/${progressDocId}`);
    }
  },

  // Seed default starter guides (Phase 4 content)
  async seedStarterGuides(uid: string) {
    try {
      for (const sectionData of STARTER_GUIDE_SECTIONS) {
        // 1. Create section
        const sectionDocRef = await addDoc(collection(db, 'guideSections'), stripUndefined({
          uid,
          name: sectionData.name,
          description: sectionData.description,
          color: sectionData.color,
          order: sectionData.order,
          isArchived: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }));

        const sectionDocId = sectionDocRef.id;
        const articleIdMap: Record<string, string> = {};

        // 2. Create articles for this section
        for (const articleData of sectionData.articles) {
          const articleDocRef = await addDoc(collection(db, 'guideArticles'), stripUndefined({
            uid,
            sectionId: sectionDocId,
            title: articleData.title,
            summary: articleData.summary,
            content: articleData.content,
            status: articleData.status,
            order: articleData.order,
            youtubeUrls: articleData.youtubeUrls || [],
            drillIds: [],
            isArchived: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }));
          articleIdMap[articleData.id] = articleDocRef.id;
        }

        // 3. Create checklist items
        for (const checklistData of sectionData.checklists) {
          const linkedArticleDocId = checklistData.linkedArticleId
            ? (articleIdMap[checklistData.linkedArticleId] || null)
            : null;

          await addDoc(collection(db, 'guideChecklists'), stripUndefined({
            uid,
            sectionId: sectionDocId,
            title: checklistData.title,
            category: checklistData.category || null,
            order: checklistData.order,
            linkedArticleId: linkedArticleDocId,
            isArchived: false,
            createdAt: serverTimestamp()
          }));
        }
      }
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'guideSections');
      return false;
    }
  }
};
