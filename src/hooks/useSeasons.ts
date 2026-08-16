import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '../firebase';
import { Season, OperationType } from '../types';
import { handleFirestoreError } from '../lib/utils';

export function useSeasons(user: User | null, isAuthReady: boolean) {
  const [seasons, setSeasons] = useState<Season[]>([]);

  useEffect(() => {
    if (!isAuthReady || !user) {
      setSeasons([]);
      return;
    }

    const q = query(
      collection(db, 'seasons'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const seasonsData: Season[] = [];
      snapshot.forEach((doc) => {
        seasonsData.push({ id: doc.id, ...doc.data() } as Season);
      });
      setSeasons(seasonsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'seasons');
    });

    return () => unsubscribe();
  }, [isAuthReady, user]);

  return {
    seasons,
    setSeasons
  };
}
