/**
 * useResponsiveNavigation Hook
 * 
 * Manages responsive navigation state and breakpoints
 */

import { useState, useCallback, useEffect } from 'react';
import { useMediaQuery, useTheme } from '@mui/material';

export interface ResponsiveNavConfig {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  drawerWidth: number;
  mobileDrawerOpen: boolean;
  setMobileDrawerOpen: (open: boolean) => void;
  toggleMobileDrawer: () => void;
  expandedCategories: Record<string, boolean>;
  toggleCategory: (categoryId: string) => void;
  expandCategory: (categoryId: string) => void;
  collapseCategory: (categoryId: string) => void;
}

/**
 * Hook for responsive navigation management
 */
export const useResponsiveNavigation = (initialCategory?: string): ResponsiveNavConfig => {
  const theme = useTheme();
  
  // Breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // < 600px
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md')); // 600-960px
  const isDesktop = useMediaQuery(theme.breakpoints.up('md')); // > 960px

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    extraction: true,
    documents: true,
    rules: false,
    monitoring: false,
    system: false,
  });

  // Drawer width based on device
  const drawerWidth = isMobile ? 280 : isTablet ? 80 : 280;

  const toggleMobileDrawer = useCallback(() => {
    setMobileDrawerOpen((prev) => !prev);
  }, []);

  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  }, []);

  const expandCategory = useCallback((categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: true,
    }));
  }, []);

  const collapseCategory = useCallback((categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: false,
    }));
  }, []);

  // Close drawer on navigation (mobile)
  const handleNavigation = useCallback(() => {
    if (isMobile) {
      setMobileDrawerOpen(false);
    }
  }, [isMobile]);

  // Collapse non-active categories on mobile
  useEffect(() => {
    if (isMobile && initialCategory) {
      setExpandedCategories((prev) => {
        const updated: Record<string, boolean> = {};
        Object.keys(prev).forEach((key) => {
          updated[key] = key === initialCategory;
        });
        return updated;
      });
    }
  }, [isMobile, initialCategory]);

  return {
    isMobile,
    isTablet,
    isDesktop,
    drawerWidth,
    mobileDrawerOpen,
    setMobileDrawerOpen,
    toggleMobileDrawer,
    expandedCategories,
    toggleCategory,
    expandCategory,
    collapseCategory,
  };
};

/**
 * Hook for tracking recently used navigation items
 */
export const useRecentlyUsed = () => {
  const STORAGE_KEY = 'recently-used-nav';
  const MAX_ITEMS = 5;

  const addRecent = useCallback((path: string, label: string) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const recent = stored ? JSON.parse(stored) : [];
      
      // Remove if already exists
      const filtered = recent.filter((item: any) => item.path !== path);
      
      // Add to front
      const updated = [
        { path, label, timestamp: Date.now() },
        ...filtered,
      ].slice(0, MAX_ITEMS);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save recently used:', error);
    }
  }, []);

  const getRecent = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load recently used:', error);
      return [];
    }
  }, []);

  const clearRecent = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear recently used:', error);
    }
  }, []);

  return { addRecent, getRecent, clearRecent };
};

/**
 * Hook for keyboard navigation shortcuts
 */
export const useNavKeyboardShortcuts = (onNavigate: (path: string) => void) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd/Ctrl + K = Command Palette
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        // TODO: Open command palette
      }

      // Cmd/Ctrl + J = Job Manager
      if ((event.metaKey || event.ctrlKey) && event.key === 'j') {
        event.preventDefault();
        onNavigate('/jobs');
      }

      // Cmd/Ctrl + S = Schema Management
      if ((event.metaKey || event.ctrlKey) && event.key === 's') {
        event.preventDefault();
        onNavigate('/schemas');
      }

      // Cmd/Ctrl + R = Rules
      if ((event.metaKey || event.ctrlKey) && event.key === 'r') {
        event.preventDefault();
        onNavigate('/rules');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNavigate]);
};
