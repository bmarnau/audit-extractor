/**
 * Navigation Configuration
 * Centralized navigation structure for all pages
 */

import {
  Settings as SettingsIcon,
  Backup as BackupIcon,
  Cloud as ApiIcon,
  Rule as RuleIcon,
  CheckCircle as HealthyIcon,
  Schema as SchemaIcon,
  Description as FileTextIcon,
  BarChart as BarChartIcon,
  Work as WorkIcon,
} from '@mui/icons-material';

export interface NavItem {
  id: string;
  path: string;
  label: string;
  icon?: React.ElementType;
  badge?: string;
  description?: string;
}

export interface NavCategory {
  id: string;
  label: string;
  icon: React.ElementType;
  description?: string;
  color?: string;
  order?: number;
  items: NavItem[];
}

export const navigationCategories: NavCategory[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: BarChartIcon,
    description: 'System overview and statistics',
    order: 1,
    color: 'primary',
    items: [
      {
        id: 'home',
        path: '/',
        label: 'Home',
        description: 'Dashboard overview',
      },
    ],
  },
  {
    id: 'schemas',
    label: 'Schemas',
    icon: SchemaIcon,
    description: 'Manage extraction schemas',
    order: 2,
    color: 'info',
    items: [
      {
        id: 'schemas-list',
        path: '/schemas',
        label: 'Schemas',
        description: 'View and manage schemas',
      },
      {
        id: 'schemas-create',
        path: '/schemas/create',
        label: 'Create Schema',
        description: 'Create new schema',
      },
    ],
  },
  {
    id: 'jobs',
    label: 'Jobs',
    icon: WorkIcon,
    description: 'Monitor extraction jobs',
    order: 3,
    color: 'success',
    items: [
      {
        id: 'jobs-list',
        path: '/jobs',
        label: 'Jobs',
        description: 'View job history',
      },
    ],
  },
  {
    id: 'rules',
    label: 'Rules',
    icon: RuleIcon,
    description: 'Configure extraction rules',
    order: 4,
    color: 'warning',
    items: [
      {
        id: 'rules-list',
        path: '/rules',
        label: 'Rules',
        description: 'View and manage rules',
      },
    ],
  },
  {
    id: 'logs',
    label: 'Logs',
    icon: FileTextIcon,
    description: 'View system logs',
    order: 5,
    color: 'info',
    items: [
      {
        id: 'logs-viewer',
        path: '/logs',
        label: 'Logs',
        description: 'System activity logs',
      },
    ],
  },
  {
    id: 'backup',
    label: 'Backup',
    icon: BackupIcon,
    description: 'Backup and restore data',
    order: 6,
    color: 'secondary',
    items: [
      {
        id: 'backup-list',
        path: '/backup',
        label: 'Backups',
        description: 'Backup management',
      },
    ],
  },
  {
    id: 'health',
    label: 'Health',
    icon: HealthyIcon,
    description: 'System health status',
    order: 7,
    color: 'success',
    items: [
      {
        id: 'health-check',
        path: '/health',
        label: 'Health',
        description: 'System health check',
      },
    ],
  },
  {
    id: 'api',
    label: 'API',
    icon: ApiIcon,
    description: 'API documentation',
    order: 8,
    color: 'info',
    items: [
      {
        id: 'api-docs',
        path: '/api/docs',
        label: 'API Docs',
        description: 'API documentation',
      },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: SettingsIcon,
    description: 'System settings',
    order: 9,
    color: 'action',
    items: [
      {
        id: 'settings-config',
        path: '/settings',
        label: 'Settings',
        description: 'Configuration settings',
      },
    ],
  },
];

/**
 * Get flat list of all navigation items
 */
export const getAllNavigationItems = (): NavItem[] => {
  return navigationCategories.reduce((items, category) => {
    return [...items, ...category.items];
  }, [] as NavItem[]);
};

/**
 * Find category by ID
 */
export const getCategoryById = (id: string): NavCategory | undefined => {
  return navigationCategories.find(cat => cat.id === id);
};

/**
 * Find item by path
 */
export const getItemByPath = (path: string): NavItem | undefined => {
  const allItems = getAllNavigationItems();
  return allItems.find(item => item.path === path);
};

/**
 * Find category containing a path
 */
export const getCategoryByPath = (path: string): NavCategory | undefined => {
  return navigationCategories.find(category =>
    category.items.some(item => item.path === path)
  );
};
