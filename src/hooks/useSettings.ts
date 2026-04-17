import { useState, useEffect } from 'react';
import { 
  doc, 
  onSnapshot, 
  updateDoc, 
  setDoc 
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '../firebase';
import { TeamSettings, OperationType } from '../types';
import { handleFirestoreError } from '../lib/utils';

export function useSettings(user: User | null, isAuthReady: boolean) {
  const [settings, setSettings] = useState<TeamSettings | null>(null);

  useEffect(() => {
    if (!isAuthReady || !user) {
      setSettings(null);
      return;
    }

    const settingsDocRef = doc(db, 'settings', user.uid);

    const unsubscribe = onSnapshot(settingsDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        // Migration: Ensure all fields exist
        if (data.allowDesignatedHitter === undefined || data.allowOutfieldTwiceInRow === undefined) {
          updateDoc(settingsDocRef, {
            allowDesignatedHitter: data.allowDesignatedHitter ?? false,
            allowOutfieldTwiceInRow: data.allowOutfieldTwiceInRow ?? false,
            uid: user.uid
          });
        }
        setSettings({ id: snapshot.id, ...data } as TeamSettings);
      } else {
        // Create default settings if not exists
        const createDefault = async () => {
          try {
            await setDoc(settingsDocRef, {
              allowDesignatedHitter: false,
              allowOutfieldTwiceInRow: false,
              uid: user.uid
            });
          } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, `settings/${user.uid}`);
          }
        };
        createDefault();
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `settings/${user.uid}`);
    });

    return () => unsubscribe();
  }, [isAuthReady, user]);

  return {
    settings,
    setSettings
  };
}
