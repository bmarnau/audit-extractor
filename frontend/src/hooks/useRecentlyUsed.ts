/**
 * useRecentlyUsed Hook
 * 
 * Manages recently used navigation items
 */

import { useState, useCallback } from 'react';

export interface RecentItem {
  path: string;
  label?: string;
  timestamp: number;
}

export const useRecentlyUsed = () => {
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);

  const addRecent = useCallback((item: string | RecentItem) => {
    const newItem: RecentItem = typeof item === 'string'
      ? { path: item, timestamp: Date.now() }
      : { ...item, timestamp: Date.now() };

    setRecentItems((prev) => {
      // Remove duplicates and add new item to front
      const filtered = prev.filter(i => i.path !== newItem.path);
      return [newItem, ...filtered].slice(0, 10); // Keep last 10 items
    });
  }, []);

  const clearRecent = useCallback(() => {
    setRecentItems([]);
  }, []);

  const getRecent = useCallback(() => {
    return recentItems;
  }, [recentItems]);

  return {
    recentItems,
    addRecent,
    clearRecent,
    getRecent,
  };
};
