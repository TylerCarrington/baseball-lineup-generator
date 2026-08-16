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
import { Game, OperationType } from '../types';
import { handleFirestoreError } from '../lib/utils';

export function useGames(user: User | null, isAuthReady: boolean, selectedGameId: string | null, activeSeasonId?: string) {
  const [allGames, setAllGames] = useState<Game[]>([]);

  useEffect(() => {
    if (!isAuthReady || !user) {
      setAllGames([]);
      return;
    }

    const q = query(
      collection(db, 'games'),
      where('uid', '==', user.uid),
      orderBy('date', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const gamesData: Game[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.scrimmageGroups && typeof data.scrimmageGroups === 'string') {
          try {
            data.scrimmageGroups = JSON.parse(data.scrimmageGroups);
          } catch (e) {
            console.error("Error parsing scrimmageGroups:", e);
          }
        }
        gamesData.push({ id: doc.id, ...data } as Game);
      });
      setAllGames(gamesData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'games');
    });

    return () => unsubscribe();
  }, [isAuthReady, user]);

  const games = useMemo(() => {
    return allGames.filter(g => (g.seasonId || 'legacy') === (activeSeasonId || 'legacy'));
  }, [allGames, activeSeasonId]);

  const gamesMap = useMemo(() => {
    const map: Record<string, Game> = {};
    games.forEach(g => {
      map[g.id] = g;
    });
    return map;
  }, [games]);

  const selectedGame = useMemo(() => {
    return games.find(g => g.id === selectedGameId) || null;
  }, [games, selectedGameId]);

  return {
    games,
    gamesMap,
    selectedGame,
    setGames: setAllGames
  };
}
