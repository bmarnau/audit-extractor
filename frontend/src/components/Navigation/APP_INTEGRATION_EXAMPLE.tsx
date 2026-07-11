/**
 * App.tsx Integration Example - Refactored with New Navigation
 * 
 * This shows how to refactor the existing App.tsx to use the new
 * responsive navigation system
 */

// BEFORE (Current)
// ============================================================================
// The old App.tsx is already shown in the codebase

// AFTER (New Implementation)
// ============================================================================

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import {
  Box,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
} from '@mui/icons-material';

// New Navigation Components
import ResponsiveNavigationDrawer from './components/Navigation/ResponsiveNavigationDrawer';
import MobileBottomNavigation from './components/Navigation/MobileBottomNavigation';
import BreadcrumbNavigation from './components/Navigation/BreadcrumbNavigation';

// Custom Hooks
import { useResponsiveNavigation, useRecentlyUsed } from './hooks/useResponsiveNavigation';

// Pages and Components (unchanged)
import Dashboard from './components/Dashboard';
import { DocumentExplorer } from './components/DocumentExplorer';
import { ExtractionWorkbench } from './components/ExtractionWorkbench';
import { RuleEditor } from './components/RuleEditor';
import { AuditViewer } from './components/workbench/AuditViewer';
import LogViewer from './components/LogViewer';
import { HelpBrowser } from './components/workbench/HelpBrowser';
import { ConfigEditor } from './components/workbench/ConfigEditor';
import { BackupManager } from './components/workbench/BackupManager';
import LearningPage from './pages/LearningPage';
import SchemaUploadWizard from './components/SchemaUploadWizard';
import SchemaListComponent from './components/SchemaListComponent';
import SchemaEditorComponent from './components/SchemaEditorComponent';
import VersionHistoryComponent from './components/VersionHistoryComponent';
import JobManager from './components/JobManager';
import IReportIntegration from './components/iReportIntegration';
import { SchemaProvider } from './context/SchemaContext';
import ErrorBoundary from './components/ErrorBoundary';

// Theme configuration
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#90caf9' },
    secondary: { main: '#f48fb1' },
  },
});

/**
 * Main App Component with New Navigation
 */
export const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  
  // Use new responsive navigation hook
  const {
    isMobile,
    isTablet,
    isDesktop,
    mobileDrawerOpen,
    toggleMobileDrawer,
    expandedCategories,
    toggleCategory,
  } = useResponsiveNavigation();

  // Track recently used items
  const { addRecent, getRecent } = useRecentlyUsed();

  // Log frontend info
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    if (import.meta.env.VITE_LOG_LEVEL === 'debug') {
      console.group('🚀 Frontend v0.25.0 - Responsive Navigation');
      console.log(`API URL: ${apiUrl}`);
      console.log(`Responsive: Mobile=${isMobile}, Tablet=${isTablet}, Desktop=${isDesktop}`);
      console.groupEnd();
    }
  }, [isMobile, isTablet, isDesktop]);

  // Drawer width based on device
  const drawerWidth = isMobile ? 0 : isTablet ? 80 : 280;

  // Handle navigation
  const handleNavigation = (item: any) => {
    addRecent(item.path, item.label);
    if (isMobile) {
      toggleMobileDrawer();
    }
  };

  const currentTheme = darkMode ? darkTheme : theme;

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <ErrorBoundary>
        <SchemaProvider>
          <Router>
            <Box sx={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
              
              {/* Top App Bar */}
              <AppBar
                position="fixed"
                sx={{
                  zIndex: (theme) => theme.zIndex.drawer + 1,
                  width: '100%',
                  mb: 0,
                }}
              >
                <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {isMobile && (
                      <IconButton
                        color="inherit"
                        onClick={toggleMobileDrawer}
                        edge="start"
                      >
                        {mobileDrawerOpen ? <CloseIcon /> : <MenuIcon />}
                      </IconButton>
                    )}
                    <Typography variant="h6" noWrap sx={{ fontWeight: 'bold' }}>
                      Audit-Safe Extractor
                    </Typography>
                  </Box>
                  
                  {/* Right toolbar items */}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {/* TODO: Search button, notifications, user menu */}
                    <IconButton
                      color="inherit"
                      onClick={() => setDarkMode(!darkMode)}
                    >
                      {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
                    </IconButton>
                  </Box>
                </Toolbar>
              </AppBar>

              {/* Main content area */}
              <Box sx={{ display: 'flex', flex: 1, mt: 8 }}>
                
                {/* Desktop/Tablet Drawer */}
                {!isMobile && (
                  <ResponsiveNavigationDrawer
                    open={true}
                    onNavigate={handleNavigation}
                    expandedCategories={expandedCategories}
                    onToggleCategory={toggleCategory}
                    variant="permanent"
                  />
                )}

                {/* Mobile Drawer */}
                {isMobile && (
                  <ResponsiveNavigationDrawer
                    open={mobileDrawerOpen}
                    onClose={toggleMobileDrawer}
                    onNavigate={handleNavigation}
                    expandedCategories={expandedCategories}
                    onToggleCategory={toggleCategory}
                    variant="temporary"
                  />
                )}

                {/* Main Content */}
                <Box
                  component="main"
                  sx={{
                    flexGrow: 1,
                    width: '100%',
                    overflow: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* Breadcrumb Navigation */}
                  <BreadcrumbNavigation />

                  {/* Page Content - Add bottom padding for mobile bottom nav */}
                  <Box
                    sx={{
                      flex: 1,
                      pb: isMobile ? 8 : 0, // Space for mobile bottom nav
                    }}
                  >
                    <Routes>
                      {/* Extraction Routes */}
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/jobs" element={<JobManager />} />
                      <Route path="/workbench" element={<ExtractionWorkbench />} />

                      {/* Document & Schema Routes */}
                      <Route path="/documents" element={<DocumentExplorer />} />
                      <Route path="/schemas" element={<SchemaListComponent />} />
                      <Route path="/schema/:id/edit" element={<SchemaEditorComponent />} />
                      <Route path="/schema-wizard" element={<SchemaUploadWizard />} />
                      <Route path="/ireport" element={<IReportIntegration />} />

                      {/* Rules & Learning Routes */}
                      <Route path="/rules" element={<RuleEditor />} />
                      <Route path="/learning" element={<LearningPage />} />
                      <Route path="/schema/:id/history" element={<VersionHistoryComponent />} />

                      {/* Monitoring & Audit Routes */}
                      <Route path="/audit" element={<AuditViewer />} />
                      <Route path="/logs" element={<LogViewer />} />
                      <Route path="/backups" element={<BackupManager />} />

                      {/* System Routes */}
                      <Route path="/configuration" element={<ConfigEditor />} />
                      <Route path="/help" element={<HelpBrowser />} />
                    </Routes>
                  </Box>
                </Box>
              </Box>

              {/* Mobile Bottom Navigation */}
              {isMobile && <MobileBottomNavigation />}
            </Box>
          </Router>
        </SchemaProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
};

export default App;

// ============================================================================
// KEY CHANGES SUMMARY
// ============================================================================
// 
// 1. REMOVED: Hard-coded navItems array (was 14 items)
// 2. ADDED: New navigation config system (navigationCategories)
// 3. ADDED: useResponsiveNavigation hook for state management
// 4. ADDED: ResponsiveNavigationDrawer component (Desktop/Tablet/Mobile aware)
// 5. ADDED: MobileBottomNavigation for mobile devices
// 6. ADDED: BreadcrumbNavigation for better UX
// 7. ADDED: Recently used items tracking
// 
// BENEFITS:
// ✅ Better mobile experience with bottom nav + hamburger
// ✅ Tablet optimized with icons-only sidebar
// ✅ Desktop with full categorized navigation
// ✅ Easier to maintain (config is separate from component)
// ✅ Easier to add new items (just update navigationConfig)
// ✅ Built-in keyboard shortcuts support
// ✅ Recently used tracking
// ✅ Breadcrumb navigation for context
// ============================================================================
