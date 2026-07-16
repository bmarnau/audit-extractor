/**
 * Navigation Categories Configuration
 * 
 * Zentrale Quelle für Navigation Struktur
 */

import React from 'react';
import {
  Dashboard as DashboardIcon,
  FolderOpen as DocumentsIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  Backup as BackupIcon,
  Build as WorkbenchIcon,
  Edit as EditIcon,
  Assessment as AuditIcon,
  Description as LogIcon,
  School as LearningIcon,
  CloudUpload as CloudUploadIcon,
  Schema as SchemaIcon,
  AssignmentTurnedIn as JobIcon,
  InsertDriveFile as ReportIcon,
  Analytics as AnalyticsIcon,
  TrendingUp as ProcessIcon,
  Cloud as CloudIcon,
} from '@mui/icons-material';

/**
 * Navigation Item Type
 */
export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ElementType;
  badge?: number;
  description?: string;
  shortcut?: string;
}

/**
 * Navigation Category Type
 */
export interface NavCategory {
  id: string;
  label: string;
  icon: React.ElementType;
  color?: string;
  items: NavItem[];
  collapsible?: boolean;
  order: number;
}

/**
 * Navigation Categories Definition
 * 
 * Kategorisiert die 14 Navigation Items in 5 logische Gruppen
 */
export const navigationCategories: NavCategory[] = [
  {
    id: 'extraction',
    label: 'Extraction',
    icon: ProcessIcon,
    color: '#2196f3',
    order: 1,
    collapsible: true,
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        path: '/',
        icon: DashboardIcon,
        description: 'System Overview',
      },
      {
        id: 'job-manager',
        label: 'Job Manager',
        path: '/jobs',
        icon: JobIcon,
        badge: 0,
        description: 'Document Extraction Jobs',
        shortcut: 'Cmd+J',
      },
      {
        id: 'workbench',
        label: 'Extraction Workbench',
        path: '/workbench',
        icon: WorkbenchIcon,
        description: 'Manual Extraction & Testing',
      },
    ],
  },
  
  {
    id: 'documents',
    label: 'Documents & Schema',
    icon: DocumentsIcon,
    color: '#4caf50',
    order: 2,
    collapsible: true,
    items: [
      {
        id: 'documents',
        label: 'Documents',
        path: '/documents',
        icon: DocumentsIcon,
        description: 'Browse Uploaded Documents',
      },
      {
        id: 'schema-management',
        label: 'Schema Management',
        path: '/schemas',
        icon: SchemaIcon,
        description: 'View & Edit Extraction Schemas',
        shortcut: 'Cmd+S',
      },
      {
        id: 'schema-upload',
        label: 'Schema Upload',
        path: '/schema-wizard',
        icon: CloudUploadIcon,
        description: 'Upload New Schemas',
      },
      {
        id: 'ireport',
        label: 'iReport Integration',
        path: '/ireport',
        icon: ReportIcon,
        description: 'Document Format Conversion',
      },
    ],
  },

  {
    id: 'rules',
    label: 'Rules & Learning',
    icon: EditIcon,
    color: '#ff9800',
    order: 3,
    collapsible: true,
    items: [
      {
        id: 'rule-editor',
        label: 'Rule Editor',
        path: '/rules',
        icon: EditIcon,
        description: 'Create & Manage Extraction Rules',
        shortcut: 'Cmd+R',
      },
      {
        id: 'learning',
        label: 'Learning Center',
        path: '/learning',
        icon: LearningIcon,
        description: 'ML Model Training & Management',
      },
      {
        id: 'history',
        label: 'Version History',
        path: '/schema/:id/history',
        icon: AnalyticsIcon,
        description: 'Track Schema Changes',
      },
    ],
  },

  {
    id: 'monitoring',
    label: 'Monitoring & Audit',
    icon: AuditIcon,
    color: '#f44336',
    order: 4,
    collapsible: true,
    items: [
      {
        id: 'audit-trail',
        label: 'Audit Trail',
        path: '/audit',
        icon: AuditIcon,
        description: 'System & User Activity Logs',
      },
      {
        id: 'logs',
        label: 'Logs',
        path: '/logs',
        icon: LogIcon,
        description: 'Application Logs & Diagnostics',
        badge: 0,
      },
      {
        id: 'services',
        label: 'Services',
        path: '/services',
        icon: CloudIcon,
        description: 'System Services & Health Monitoring',
      },
      {
        id: 'technical-audit',
        label: 'Technical Audit',
        path: '/technical-audit',
        icon: AuditIcon,
        description: 'Comprehensive System Audit & Status Report',
      },
      {
        id: 'technical-tests',
        label: 'Quality Dashboard',
        path: '/technical-tests',
        icon: AnalyticsIcon,
        description: 'Technical Quality & Report Dashboard',
      },
      {
        id: 'backups',
        label: 'Backups',
        path: '/backups',
        icon: BackupIcon,
        description: 'System Backups & Recovery',
      },
    ],
  },

  {
    id: 'system',
    label: 'System',
    icon: SettingsIcon,
    color: '#9c27b0',
    order: 5,
    collapsible: true,
    items: [
      {
        id: 'configuration',
        label: 'Configuration',
        path: '/configuration',
        icon: SettingsIcon,
        description: 'System Settings & Preferences',
      },
      {
        id: 'help',
        label: 'Help Center',
        path: '/help',
        icon: HelpIcon,
        description: 'Documentation & Support',
      },
    ],
  },
];

/**
 * Flatten all items for search/command palette
 */
export const getAllNavItems = (): NavItem[] => {
  return navigationCategories
    .sort((a, b) => a.order - b.order)
    .flatMap((category) => category.items);
};

/**
 * Alias for compatibility with older code
 */
export const getAllNavigationItems = getAllNavItems;

/**
 * Get category by ID
 */
export const getCategoryById = (id: string): NavCategory | undefined => {
  return navigationCategories.find((cat) => cat.id === id);
};

/**
 * Get item by path
 */
export const getNavItemByPath = (path: string): NavItem | undefined => {
  return getAllNavItems().find((item) => item.path === path);
};

/**
 * Alias for compatibility with older code
 */
export const getItemByPath = getNavItemByPath;

/**
 * Get category by path (find category containing item with path)
 */
export const getCategoryByPath = (path: string): NavCategory | undefined => {
  return navigationCategories.find((cat) =>
    cat.items.some((item) => item.path === path)
  );
};

/**
 * Mobile-optimierte Top 5 Kategorien für Bottom Navigation
 */
export const getMobileCategories = (): NavCategory[] => {
  return navigationCategories
    .sort((a, b) => a.order - b.order)
    .slice(0, 5);
};

/**
 * Frequently used items (für Recently Used / Favorites)
 */
export const frequentlyUsedItems: NavItem[] = [
  // Diese können dynamisch aus localStorage aktualisiert werden
  navigationCategories[0].items[0], // Dashboard
  navigationCategories[0].items[1], // Job Manager
  navigationCategories[1].items[1], // Schema Management
];
