/**
 * Main App Component - Phase 25 (Responsive Navigation)
 * 
 * Responsive Navigation mit kategorisiertem Menu
 * Mobile (Hamburger + Bottom Nav), Tablet (Icon-only), Desktop (Full Sidebar)
 * 
 * @version 0.25.0
 * @phase 25
 */

import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import {
  Box,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  ThemeProvider,
  createTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
} from '@mui/icons-material';
import { DocumentExplorer } from './components/DocumentExplorer';
import { ExtractionWorkbench } from './components/ExtractionWorkbench';
import { RuleEditor } from './components/RuleEditor';
import { AuditViewer } from './components/workbench/AuditViewer';
import LogViewer from './components/LogViewer';
import { HelpBrowser } from './components/workbench/HelpBrowser';
import { ConfigEditor } from './components/workbench/ConfigEditor';
import { BackupManager } from './components/workbench/BackupManager';
import LearningPage from './pages/LearningPage';
import Dashboard from './components/Dashboard';
import SchemaUploadWizard from './components/SchemaUploadWizard';
// Phase 16 Components
import SchemaListComponent from './components/SchemaListComponent';
import SchemaEditorComponent from './components/SchemaEditorComponent';
import VersionHistoryComponent from './components/VersionHistoryComponent';
// Phase 17: Context
import { SchemaProvider } from './context/SchemaContext';
// Phase 24: Job Manager & iReport
import JobManager from './components/JobManager';
import IReportIntegration from './components/iReportIntegration';
// Error Handling
import ErrorBoundary from './components/ErrorBoundary';
// Phase 25: New Responsive Navigation
import {
  ResponsiveNavigationDrawer,
  MobileBottomNavigation,
  BreadcrumbNavigation,
  useResponsiveNavigation,
  useRecentlyUsed,
} from './components/Navigation';

export const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const location = useLocation();
  
  // Use responsive navigation hook
  const {
    isMobile,
    isTablet,
    isDesktop,
    drawerOpen,
    setDrawerOpen,
    toggleDrawer,
  } = useResponsiveNavigation();
  
  const { addRecent } = useRecentlyUsed();

  // Log frontend info on mount
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const logLevel = import.meta.env.VITE_LOG_LEVEL || 'warn';
    
    if (logLevel === 'debug') {
      console.group('🚀 Frontend v0.25.0 - Phase 25: Responsive Navigation');
      console.log(`API URL: ${apiUrl}`);
      console.log(`Environment: ${import.meta.env.MODE}`);
      console.log(`Tracing: ${import.meta.env.VITE_ENABLE_TRACING === 'true'}`);
      console.groupEnd();
    }
  }, []);

  // Theme-Konfiguration
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h4: {
        fontWeight: 600,
      },
    },
  });

  const handleDarkModeToggle = () => {
    setDarkMode(!darkMode);
  };

  const handleNavigation = useCallback((path: string) => {
    addRecent(path);
    if (isMobile) {
      setDrawerOpen(false);
    }
  }, [isMobile, setDrawerOpen, addRecent]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <SchemaProvider>
          <Router>
            <Box sx={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
              {/* App Bar */}
              <AppBar
                position="fixed"
                sx={{
                  zIndex: (theme) => theme.zIndex.drawer + 1,
                  width: '100%',
                }}
              >
                <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  {isMobile && (
                    <IconButton
                      color="inherit"
                      onClick={() => setDrawerOpen(!drawerOpen)}
                      sx={{ mr: 2 }}
                      aria-label="toggle navigation"
                    >
                      ☰
                    </IconButton>
                  )}
                  <Typography variant="h6" noWrap sx={{ flex: 1 }}>
                    Audit-Safe Extractor
                  </Typography>
                  <IconButton 
                    color="inherit" 
                    onClick={handleDarkModeToggle}
                    aria-label="toggle dark mode"
                  >
                    {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
                  </IconButton>
                </Toolbar>
              </AppBar>

              {/* Responsive Navigation Drawer */}
              {!isMobile && (
                <ResponsiveNavigationDrawer
                  isOpen={drawerOpen}
                  onClose={() => setDrawerOpen(false)}
                  onNavigate={handleNavigation}
                  activeItemPath={location.pathname}
                />
              )}

              {/* Mobile Drawer (Hamburger) */}
              {isMobile && drawerOpen && (
                <Box
                  sx={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: (theme) => theme.zIndex.drawer,
                    display: 'flex',
                  }}
                >
                  <ResponsiveNavigationDrawer
                    isOpen={drawerOpen}
                    onClose={() => setDrawerOpen(false)}
                    onNavigate={handleNavigation}
                    activeItemPath={location.pathname}
                  />
                  <Box
                    onClick={() => setDrawerOpen(false)}
                    sx={{
                      flex: 1,
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    }}
                  />
                </Box>
              )}

              {/* Main Content */}
              <Box
                component="main"
                sx={{
                  flexGrow: 1,
                  width: '100%',
                  mt: 8,
                  overflow: 'auto',
                  mb: isMobile ? 7 : 0, // Space for bottom navigation on mobile
                }}
              >
                {/* Breadcrumb Navigation */}
                {!isMobile && (
                  <Box sx={{ px: 3, py: 2 }}>
                    <BreadcrumbNavigation />
                  </Box>
                )}

                {/* Page Routes */}
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  {/* Phase 24: Job Manager */}
                  <Route path="/jobs" element={<JobManager />} />
                  {/* Phase 24: iReport Integration */}
                  <Route path="/ireport" element={<IReportIntegration />} />
                  <Route path="/schema-wizard" element={<SchemaUploadWizard />} />
                  {/* Phase 16: Schema Management Routes */}
                  <Route path="/schemas" element={<SchemaListComponent />} />
                  <Route path="/schema/:id/edit" element={<SchemaEditorComponent />} />
                  <Route path="/schema/:id/history" element={<VersionHistoryComponent />} />
                  {/* Phase 14 & Earlier Routes */}
                  <Route path="/documents" element={<DocumentExplorer />} />
                  <Route path="/workbench" element={<ExtractionWorkbench />} />
                  <Route path="/rules" element={<RuleEditor />} />
                  <Route path="/learning" element={<LearningPage />} />
                  <Route path="/audit" element={<AuditViewer />} />
                  <Route path="/logs" element={<LogViewer />} />
                  <Route path="/configuration" element={<ConfigEditor />} />
                  <Route path="/backups" element={<BackupManager />} />
                  <Route path="/help" element={<HelpBrowser />} />
                </Routes>
              </Box>

              {/* Mobile Bottom Navigation */}
              {isMobile && (
                <MobileBottomNavigation
                  onNavigate={handleNavigation}
                  activeItemPath={location.pathname}
                />
              )}
            </Box>
          </Router>
        </SchemaProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
};
