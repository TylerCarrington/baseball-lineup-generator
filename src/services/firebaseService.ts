import { doc, updateDoc, deleteDoc, addDoc, collection } from "firebase/firestore";
import { db } from "../firebase";
import { OperationType } from "../types";
import { handleFirestoreError } from "../lib/utils";

export const firebaseService = {
  async updateGame(gameId: string, data: any) {
    try {
      await updateDoc(doc(db, 'games', gameId), data);
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
      return await addDoc(collection(db, 'games'), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'games');
    }
  },

  async updatePlayer(playerId: string, data: any) {
    try {
      await updateDoc(doc(db, 'players', playerId), data);
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
      return await addDoc(collection(db, 'players'), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'players');
    }
  },

  async updateSettings(userId: string, data: any) {
    try {
      await updateDoc(doc(db, 'settings', userId), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `settings/${userId}`);
    }
  }
};
