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

export function usePlayers(user: User | null, isAuthReady: boolean, activeSeasonId?: string) {
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);

  useEffect(() => {
    if (!isAuthReady || !user) {
      setAllPlayers([]);
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
      setAllPlayers(playersData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'players');
    });

    return () => unsubscribe();
  }, [isAuthReady, user]);

  const players = useMemo(() => {
    return allPlayers.filter(p => (p.seasonId || 'legacy') === (activeSeasonId || 'legacy'));
  }, [allPlayers, activeSeasonId]);

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
    setPlayers: setAllPlayers
  };
}
