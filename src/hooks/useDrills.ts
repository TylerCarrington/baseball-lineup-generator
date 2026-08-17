import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Drill, OperationType } from '../types';
import { handleFirestoreError } from '../lib/utils';
import { firebaseService } from '../services/firebaseService';

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
      const drillsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Drill[];
      setDrills(drillsData);
      setLoading(false);
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
