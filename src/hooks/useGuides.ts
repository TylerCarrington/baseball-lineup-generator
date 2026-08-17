import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { GuideSection, GuideArticle, GuideChecklistItem, GuideProgress, OperationType } from '../types';
import { handleFirestoreError } from '../lib/utils';
import { firebaseService } from '../services/firebaseService';

export function useGuides(user: any, activeSeasonId?: string) {
  const [sections, setSections] = useState<GuideSection[]>([]);
  const [articles, setArticles] = useState<GuideArticle[]>([]);
  const [checklists, setChecklists] = useState<GuideChecklistItem[]>([]);
  const [progress, setProgress] = useState<GuideProgress[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Subscribe to Guide Sections
  useEffect(() => {
    if (!user) {
      setSections([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'guideSections'),
      where('uid', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GuideSection[];
      
      // Sort by order ascending, then by name
      docs.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
      setSections(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'guideSections');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 2. Subscribe to Guide Articles
  useEffect(() => {
    if (!user) {
      setArticles([]);
      return;
    }

    const q = query(
      collection(db, 'guideArticles'),
      where('uid', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GuideArticle[];
      
      docs.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
      setArticles(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'guideArticles');
    });

    return () => unsubscribe();
  }, [user]);

  // 3. Subscribe to Guide Checklists
  useEffect(() => {
    if (!user) {
      setChecklists([]);
      return;
    }

    const q = query(
      collection(db, 'guideChecklists'),
      where('uid', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GuideChecklistItem[];
      
      docs.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
      setChecklists(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'guideChecklists');
    });

    return () => unsubscribe();
  }, [user]);

  // 4. Subscribe to Season-specific Progress
  const currentSeasonId = activeSeasonId || 'legacy';
  useEffect(() => {
    if (!user) {
      setProgress([]);
      return;
    }

    const q = query(
      collection(db, 'guideProgress'),
      where('uid', '==', user.uid),
      where('seasonId', '==', currentSeasonId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GuideProgress[];
      setProgress(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'guideProgress');
    });

    return () => unsubscribe();
  }, [user, currentSeasonId]);

  // Map progress by checklistId for O(1) lookup
  const progressMap = useMemo(() => {
    const map: Record<string, GuideProgress> = {};
    progress.forEach(p => {
      map[p.checklistId] = p;
    });
    return map;
  }, [progress]);

  // Active (non-archived) collections
  const activeSections = useMemo(() => sections.filter(s => !s.isArchived), [sections]);
  const activeArticles = useMemo(() => articles.filter(a => !a.isArchived), [articles]);
  const activeChecklists = useMemo(() => checklists.filter(c => !c.isArchived), [checklists]);

  // Readiness Metrics
  const readinessMetrics = useMemo(() => {
    const totalSkills = activeChecklists.length;
    let completedSkills = 0;

    const perSection: Record<string, { total: number; completed: number; percentage: number }> = {};

    activeSections.forEach(sec => {
      const secChecklists = activeChecklists.filter(c => c.sectionId === sec.id);
      const secCompleted = secChecklists.filter(c => progressMap[c.id]?.isCompleted).length;
      const total = secChecklists.length;
      const percentage = total > 0 ? Math.round((secCompleted / total) * 100) : 0;
      
      perSection[sec.id] = {
        total,
        completed: secCompleted,
        percentage
      };

      completedSkills += secCompleted;
    });

    const overallPercentage = totalSkills > 0 ? Math.round((completedSkills / totalSkills) * 100) : 0;

    return {
      totalSkills,
      completedSkills,
      overallPercentage,
      perSection
    };
  }, [activeSections, activeChecklists, progressMap]);

  // Actions
  const addSection = async (data: { name: string; description?: string; color?: string }) => {
    if (!user) return;
    const nextOrder = sections.length + 1;
    return await firebaseService.addGuideSection({
      uid: user.uid,
      name: data.name.trim(),
      description: data.description?.trim() || '',
      color: data.color || 'emerald',
      order: nextOrder,
      isArchived: false
    });
  };

  const updateSection = async (sectionId: string, data: Partial<GuideSection>) => {
    await firebaseService.updateGuideSection(sectionId, data);
  };

  const archiveSection = async (sectionId: string, isArchived = true) => {
    await firebaseService.updateGuideSection(sectionId, { isArchived });
  };

  const deleteSection = async (sectionId: string) => {
    await firebaseService.deleteGuideSection(sectionId);
  };

  const addArticle = async (data: {
    sectionId: string;
    title: string;
    summary?: string;
    content: string;
    status: 'draft' | 'published';
    youtubeUrls?: string[];
    drillIds?: string[];
    photos?: any[];
  }) => {
    if (!user) return;
    const sectionArticles = articles.filter(a => a.sectionId === data.sectionId);
    return await firebaseService.addGuideArticle({
      uid: user.uid,
      sectionId: data.sectionId,
      title: data.title.trim(),
      summary: data.summary?.trim() || '',
      content: data.content,
      status: data.status || 'published',
      order: sectionArticles.length + 1,
      youtubeUrls: data.youtubeUrls || [],
      drillIds: data.drillIds || [],
      photos: data.photos || [],
      isArchived: false,
      lastEditedBy: {
        uid: user.uid,
        displayName: user.displayName || 'Coach',
        timestamp: new Date().toISOString()
      }
    });
  };

  const updateArticle = async (articleId: string, data: Partial<GuideArticle>) => {
    if (!user) return;
    await firebaseService.updateGuideArticle(articleId, {
      ...data,
      lastEditedBy: {
        uid: user.uid,
        displayName: user.displayName || 'Coach',
        timestamp: new Date().toISOString()
      }
    });
  };

  const archiveArticle = async (articleId: string, isArchived = true) => {
    await firebaseService.updateGuideArticle(articleId, { isArchived });
  };

  const deleteArticle = async (articleId: string) => {
    await firebaseService.deleteGuideArticle(articleId);
  };

  const addChecklistItem = async (data: {
    sectionId: string;
    title: string;
    category?: string;
    description?: string;
    linkedArticleId?: string;
    linkedDrillId?: string;
  }) => {
    if (!user) return;
    const secItems = checklists.filter(c => c.sectionId === data.sectionId);
    return await firebaseService.addGuideChecklist({
      uid: user.uid,
      sectionId: data.sectionId,
      title: data.title.trim(),
      category: data.category?.trim() || 'General',
      description: data.description?.trim() || '',
      linkedArticleId: data.linkedArticleId || null,
      linkedDrillId: data.linkedDrillId || null,
      order: secItems.length + 1,
      isArchived: false
    });
  };

  const updateChecklistItem = async (checklistId: string, data: Partial<GuideChecklistItem>) => {
    await firebaseService.updateGuideChecklist(checklistId, data);
  };

  const deleteChecklistItem = async (checklistId: string) => {
    await firebaseService.deleteGuideChecklist(checklistId);
  };

  const toggleChecklistProgress = async (checklistId: string, sectionId: string, isCompleted: boolean) => {
    if (!user) return;
    await firebaseService.toggleGuideProgress(
      user.uid,
      currentSeasonId,
      checklistId,
      sectionId,
      isCompleted,
      {
        uid: user.uid,
        displayName: user.displayName || 'Coach'
      }
    );
  };

  return {
    sections,
    activeSections,
    articles,
    activeArticles,
    checklists,
    activeChecklists,
    progress,
    progressMap,
    readinessMetrics,
    loading,
    currentSeasonId,
    // Actions
    addSection,
    updateSection,
    archiveSection,
    deleteSection,
    addArticle,
    updateArticle,
    archiveArticle,
    deleteArticle,
    addChecklistItem,
    updateChecklistItem,
    deleteChecklistItem,
    toggleChecklistProgress
  };
}
