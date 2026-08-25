import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Drill, OperationType } from '../types';
import { handleFirestoreError } from '../lib/utils';
import { firebaseService } from '../services/firebaseService';
import { normalizeCategory } from '../lib/drillCategories';

let hasMigrated = false;

async function performMigrationAndSeeding(user: any, loadedDrills: Drill[]) {
  if (hasMigrated || !user) return;
  hasMigrated = true;

  try {
    // 1. Check for legacy drills to update
    for (const drill of loadedDrills) {
      // Check for 'Situational scrimmage' -> rename to 'Scrimmage' & change category
      if (drill.title === 'Situational scrimmage') {
        console.log(`Migrating drill ${drill.id}: Situational scrimmage -> Scrimmage`);
        await firebaseService.updateDrill(drill.id, {
          title: 'Scrimmage',
          category: 'Games & Competitions'
        });
      }
      // Check for other 'Teamwork & Situational' drills
      else if (drill.category === 'Teamwork & Situational') {
        console.log(`Migrating drill ${drill.id} category from Teamwork & Situational to Fielding & Defense`);
        await firebaseService.updateDrill(drill.id, {
          category: 'Fielding & Defense'
        });
      }
    }

    // 2. Check and seed the 3 Catching drills
    const hasSoftHands = loadedDrills.some(d => d.title === 'Soft Hands Framing');
    const hasDropBlock = loadedDrills.some(d => d.title === 'Drop & Block Dirt Balls');
    const hasEarToEar = loadedDrills.some(d => d.title === 'Ear-to-Ear Steal Defense');

    if (!hasSoftHands) {
      console.log('Seeding Catcher drill: Soft Hands Framing');
      await firebaseService.addDrill({
        title: 'Soft Hands Framing',
        category: 'Catching',
        summary: 'Clean receiving techniques for pitches on the outer borders of the strike zone.',
        setup: 'Catcher in primary stance, pitcher/coach at 15–20 feet with tennis balls or light baseballs.',
        steps: 'Coach throws soft pitches to outer borders of the strike zone. Catcher receives ball cleanly, gently rotating wrist slightly back to the center of the zone to "present" a solid strike.',
        notes: 'Avoid snapping or jerking. Maintain a quiet, stable body frame and let the glove work from the outside-in.',
        uid: user.uid
      });
    }

    if (!hasDropBlock) {
      console.log('Seeding Catcher drill: Drop & Block Dirt Balls');
      await firebaseService.addDrill({
        title: 'Drop & Block Dirt Balls',
        category: 'Catching',
        summary: 'Effective knee-driving and chest-positioning mechanics for absorbing bounces.',
        setup: 'Catcher in secondary stance, coach at 30 feet with standard baseballs.',
        steps: 'Coach bounces balls in the dirt left, right, and center. Catcher drives knees straight down, places glove in the "5-hole" (between knees), rounds shoulders, and slants chest protector forward.',
        notes: 'Keep eyes tracked down on the ball. The goal is to absorb energy so the ball rebounds softly right in front of the plate.',
        uid: user.uid
      });
    }

    if (!hasEarToEar) {
      console.log('Seeding Catcher drill: Ear-to-Ear Steal Defense');
      await firebaseService.addDrill({
        title: 'Ear-to-Ear Steal Defense',
        category: 'Catching',
        summary: 'Quick hand-to-glove transfer and flat-line throw mechanics for base stealers.',
        setup: 'Catcher in secondary stance, pitcher on the mound. Coach triggers simulated runner.',
        steps: 'On pitch arrival, catcher pops up with a quick jump-turn, brings ball to the right ear, and makes a flat-line throw to 2nd base bag.',
        notes: 'Minimize windup. Hand-to-glove transfer must happen right in front of the chest, pushing the ball directly back past the ear.',
        uid: user.uid
      });
    }

  } catch (error) {
    console.error('Error during drills migration and seeding:', error);
  }
}

export function useDrills(user: any) {
  const [drills, setDrills] = useState<Drill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setDrills([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'drills'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const drillsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          category: normalizeCategory(data.category)
        };
      }) as Drill[];
      setDrills(drillsData);
      setLoading(false);
      
      // Run background migration & seeding if not already executed
      performMigrationAndSeeding(user, drillsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'drills');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addDrill = async (data: Omit<Drill, 'id' | 'createdAt' | 'updatedAt'>) => {
    return await firebaseService.addDrill({
      ...data,
      uid: user?.uid
    });
  };

  const updateDrill = async (drillId: string, data: Partial<Drill>) => {
    await firebaseService.updateDrill(drillId, data);
  };

  const deleteDrill = async (drillId: string) => {
    await firebaseService.deleteDrill(drillId);
  };


  return { drills, loading, addDrill, updateDrill, deleteDrill };
}
