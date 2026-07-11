/**
 * Navigation Components Index
 * 
 * Central export point for all new responsive navigation components
 */

// Configuration
export {
  navigationCategories,
  getAllNavItems,
  getCategoryById,
  getNavItemByPath,
  getMobileCategories,
  frequentlyUsedItems,
  type NavItem,
  type NavCategory,
} from '../../config/navigationConfig';

// Hooks
export {
  useResponsiveNavigation,
  useRecentlyUsed,
  useNavKeyboardShortcuts,
  type ResponsiveNavConfig,
} from '../../hooks/useResponsiveNavigation';

// Components
export { NavCategoryGroup } from './NavCategoryGroup';
export { ResponsiveNavigationDrawer } from './ResponsiveNavigationDrawer';
export { MobileBottomNavigation } from './MobileBottomNavigation';
export { BreadcrumbNavigation } from './BreadcrumbNavigation';

// Re-export default App example (for reference only)
export { App as AppIntegrationExample } from './APP_INTEGRATION_EXAMPLE';
