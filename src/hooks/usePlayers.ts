import { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '../firebase';
import { Player, OperationType } from '../types';
import { handleFirestoreError } from '../lib/utils';

export function usePlayers(user: User | null, isAuthReady: boolean) {
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    if (!isAuthReady || !user) {
      setPlayers([]);
      return;
    }

    const q = query(
      collection(db, 'players'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const playersData: Player[] = [];
      snapshot.forEach((doc) => {
        playersData.push({ id: doc.id, ...doc.data() } as Player);
      });
      setPlayers(playersData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'players');
    });

    return () => unsubscribe();
  }, [isAuthReady, user]);

  const playersMap = useMemo(() => {
    const map: Record<string, Player> = {};
    players.forEach(p => {
      map[p.id] = p;
    });
    return map;
  }, [players]);

  return {
    players,
    playersMap,
    setPlayers
  };
}
