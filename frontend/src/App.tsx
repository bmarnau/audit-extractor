/**
 * Main App Component - Phase 26 (Layout Improvements)
 * 
 * Responsive Navigation mit kategorisiertem Menu
 * Mobile (Hamburger + Bottom Nav), Tablet (Icon-only), Desktop (Full Sidebar)
 * Flex-basierte Layout-Architektur für bessere Content-Lesbarkeit
 * 
 * @version 0.26.0
 * @phase 26
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
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
import HealthPage from './pages/HealthPage';
import SchemaUploadWizard from './components/SchemaUploadWizard';
// Phase 16 Components
import SchemaListComponent from './components/SchemaListComponent';
import SchemaEditorComponent from './components/SchemaEditorComponent';
import VersionHistoryComponent from './components/VersionHistoryComponent';
// Phase 17: Context
import { SchemaProvider } from './context/SchemaContext';
import { API_CONFIG } from './constants/environment';
// Phase 24: Job Manager & iReport
import JobManager from './components/JobManager';
import IReportIntegration from './components/iReportIntegration';
// Phase 38C: Services Page
import ServicesPage from './pages/ServicesPage';
// Phase 40: Technical Audit Center
import TechnicalAuditPage from './pages/TechnicalAuditPage';
// Phase 41: API Docs & Settings Pages
import ApiDocsPage from './pages/ApiDocsPage';
import SettingsPage from './pages/SettingsPage';
// Phase 43: Technical Quality Dashboard
import TechnicalQualityDashboard from './pages/TechnicalQualityDashboard';
// Error Handling
import ErrorBoundary from './components/ErrorBoundary';
// Phase 25: New Responsive Navigation
import {
  ResponsiveNavigationDrawer,
  MobileBottomNavigation,
  BreadcrumbNavigation,
  useResponsiveNavigation,
} from './components/Navigation';

const AppContent: React.FC<{
  darkMode: boolean;
  handleDarkModeToggle: () => void;
  theme: any;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
}> = ({ darkMode, handleDarkModeToggle, theme, drawerOpen, setDrawerOpen }) => {
  const location = useLocation();
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'extraction': true,
    'documents': true,
    'rules': true,
    'monitoring': true,  // 👈 Monitoring & Audit jetzt offen!
    'system': true,
  });
  
  // Use responsive navigation hook
  const nav = useResponsiveNavigation('dashboard');
  const {
    isMobile,
    isTablet,
    isDesktop,
  } = nav;

  const handleNavigation = useCallback((item: any) => {
    // Track recent navigation
    const recentPath = item.path || item;
    console.log('Navigated to:', recentPath);
    if (isMobile) {
      setDrawerOpen(false);
    }
  }, [isMobile, setDrawerOpen]);

  const handleToggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* App Bar - Fixed at top */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          width: '100%',
          top: 0,
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

      {/* Main Container - Flex layout for Sidebar + Content */}
      <Box
        sx={{
          display: 'flex',
          flex: 1,
          mt: 8, // Height of AppBar (64px)
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Responsive Navigation Drawer - Desktop/Tablet */}
        {!isMobile && (
          <ResponsiveNavigationDrawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            onNavigate={handleNavigation}
            onToggleCategory={handleToggleCategory}
            expandedCategories={expandedCategories}
          />
        )}

        {/* Mobile Drawer Overlay */}
        {isMobile && drawerOpen && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: (theme) => theme.zIndex.drawer,
              display: 'flex',
            }}
          >
            <ResponsiveNavigationDrawer
              open={drawerOpen}
              onClose={() => setDrawerOpen(false)}
              onNavigate={handleNavigation}
              onToggleCategory={handleToggleCategory}
              expandedCategories={expandedCategories}
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

        {/* Main Content Area - Scrollable */}
        <Box
          component="main"
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
            pb: isMobile ? 7 : 0, // Space for bottom navigation on mobile
          }}
        >
          {/* Breadcrumb Navigation */}
          {!isMobile && (
            <Box sx={{ px: 3, py: 2, borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>
              <BreadcrumbNavigation />
            </Box>
          )}

          {/* Page Content */}
          <Box sx={{ flex: 1, p: 3 }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              {/* Phase 24: Job Manager */}
              <Route path="/jobs" element={<JobManager />} />
              {/* Phase 24: iReport Integration */}
              <Route path="/ireport" element={<IReportIntegration />} />
              <Route path="/schema-wizard" element={<SchemaUploadWizard />} />
              {/* Phase 16: Schema Management Routes */}
              <Route path="/schemas" element={<SchemaListComponent />} />
              <Route path="/schemas/create" element={<SchemaUploadWizard />} />
              <Route path="/schema/:id/edit" element={<SchemaEditorComponent />} />
              <Route path="/schema/:id/history" element={<VersionHistoryComponent />} />
              {/* Phase 14 & Earlier Routes */}
              <Route path="/documents" element={<DocumentExplorer />} />
              <Route path="/workbench" element={<ExtractionWorkbench />} />
              <Route path="/rules" element={<RuleEditor />} />
              <Route path="/learning" element={<LearningPage />} />
              <Route path="/audit" element={<AuditViewer />} />
              <Route path="/logs" element={<LogViewer />} />
              {/* Phase 38C: Services Management */}
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/health" element={<HealthPage />} />
              <Route path="/configuration" element={<ConfigEditor />} />
              <Route path="/backups" element={<BackupManager />} />
              {/* Phase 40: Technical Audit Center */}
              <Route path="/technical-audit" element={<TechnicalAuditPage />} />
              <Route path="/services/audit" element={<TechnicalAuditPage />} />
              {/* Phase 43: Technical Quality Dashboard */}
              <Route path="/technical-tests" element={<TechnicalQualityDashboard />} />
              {/* Phase 41: API Docs & Settings */}
              <Route path="/api/docs" element={<ApiDocsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/help" element={<HelpBrowser />} />
            </Routes>
          </Box>
        </Box>
      </Box>

      {/* Mobile Bottom Navigation - Fixed at bottom */}
      {isMobile && (
        <MobileBottomNavigation
          onNavigate={handleNavigation}
          activeItemPath={location.pathname}
        />
      )}
    </Box>
  );
};

export const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Log frontend info on mount
  useEffect(() => {
    const apiUrl = API_CONFIG.BASE_URL;
    const logLevel = import.meta.env.VITE_LOG_LEVEL || 'warn';
    
    if (logLevel === 'debug') {
      console.group('🚀 Frontend v0.26.0 - Phase 26: Layout Improvements');
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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <SchemaProvider>
          <AppContent 
            darkMode={darkMode}
            handleDarkModeToggle={handleDarkModeToggle}
            theme={theme}
            drawerOpen={drawerOpen}
            setDrawerOpen={setDrawerOpen}
          />
        </SchemaProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
};
