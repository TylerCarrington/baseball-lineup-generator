import { useState, useEffect } from 'react';
import { 
  doc, 
  onSnapshot, 
  query, 
  collection, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Game, Player, TeamSettings } from '../types';

export function useSharedData(ownerId: string | undefined) {
  const [games, setGames] = useState<Game[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [settings, setSettings] = useState<TeamSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ownerId) {
      setError("Invalid share link.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // 1. Fetch Settings to check if publicSchedule is enabled
    const settingsRef = doc(db, 'settings', ownerId);
    const unsubSettings = onSnapshot(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as TeamSettings;
        if (data.publicSchedule) {
          setSettings({ id: snapshot.id, ...data });
        } else {
          setError("This schedule is not public.");
          setLoading(false);
        }
      } else {
        setError("Schedule not found.");
        setLoading(false);
      }
    }, (err) => {
      console.error("Error fetching settings:", err);
      setError("Unable to load schedule. Please check the link.");
      setLoading(false);
    });

    return () => unsubSettings();
  }, [ownerId]);

  useEffect(() => {
    if (!settings || !ownerId) return;

    // 2. Fetch Games
    const gamesQuery = query(
      collection(db, 'games'),
      where('uid', '==', ownerId),
      orderBy('date', 'asc')
    );

    const unsubGames = onSnapshot(gamesQuery, (snapshot) => {
      const gamesData: Game[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if ((data.seasonId || 'legacy') === (settings.activeSeasonId || 'legacy')) {
          if (data.scrimmageGroups && typeof data.scrimmageGroups === 'string') {
            try {
              data.scrimmageGroups = JSON.parse(data.scrimmageGroups);
            } catch (e) {
              console.error("Error parsing scrimmageGroups:", e);
            }
          }
          gamesData.push({ id: doc.id, ...data } as Game);
        }
      });
      setGames(gamesData);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching games:", err);
      setLoading(false);
    });

    // 3. Fetch Players (for names in lineups)
    const playersQuery = query(
      collection(db, 'players'),
      where('uid', '==', ownerId)
    );
    const unsubPlayers = onSnapshot(playersQuery, (snapshot) => {
      const playersData: Player[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as Player;
        if ((data.seasonId || 'legacy') === (settings.activeSeasonId || 'legacy')) {
          playersData.push({ id: doc.id, ...data });
        }
      });
      setPlayers(playersData);
    });

    return () => {
      unsubGames();
      unsubPlayers();
    };
  }, [settings, ownerId]);

  return { games, players, settings, loading, error };
}
