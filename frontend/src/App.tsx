/**
 * Main App Component - Phase 14
 * 
 * Automatische Ruleset-Generierung aus Schema + Beispiele
 * 
 * @version 0.14.0
 * @phase 14
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import {
  Box,
  CssBaseline,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ThemeProvider,
  createTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Dashboard as DashboardIcon,
  FolderOpen as DocumentsIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  Backup as BackupIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Build as WorkbenchIcon,
  Edit as EditIcon,
  Assessment as AuditIcon,
  Description as LogIcon,
  School as LearningIcon,
  CloudUpload as CloudUploadIcon,
  Schema as SchemaIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { DocumentExplorer } from './components/DocumentExplorer';
import { ExtractionWorkbench } from './components/ExtractionWorkbench';
import { RuleEditor } from './components/RuleEditor';
import { AuditViewer } from './components/workbench/AuditViewer';
import { LogBrowser } from './components/workbench/LogBrowser';
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
// Error Handling
import ErrorBoundary from './components/ErrorBoundary';

const drawerWidth = 280;

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: <DashboardIcon /> },
  { label: 'Schema Upload', path: '/schema-wizard', icon: <CloudUploadIcon /> },
  { label: 'Schema Management', path: '/schemas', icon: <SchemaIcon /> },
  { label: 'Documents', path: '/documents', icon: <DocumentsIcon /> },
  { label: 'Extraction Workbench', path: '/workbench', icon: <WorkbenchIcon /> },
  { label: 'Rule Editor', path: '/rules', icon: <EditIcon /> },
  { label: 'Learning', path: '/learning', icon: <LearningIcon /> },
  { label: 'Audit Trail', path: '/audit', icon: <AuditIcon /> },
  { label: 'Logs', path: '/logs', icon: <LogIcon /> },
  { label: 'Configuration', path: '/configuration', icon: <SettingsIcon /> },
  { label: 'Backups', path: '/backups', icon: <BackupIcon /> },
  { label: 'Help', path: '/help', icon: <HelpIcon /> },
];

export const App: React.FC = () => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const isMobile = useMediaQuery('(max-width:600px)');

  // Log frontend info on mount
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const logLevel = import.meta.env.VITE_LOG_LEVEL || 'warn';
    
    if (logLevel === 'debug') {
      console.group('🚀 Frontend v0.14.0 - Phase 14: Automatic Ruleset Generation');
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

  const handleDrawerToggle = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  const handleDarkModeToggle = () => {
    setDarkMode(!darkMode);
  };

  /**
   * Drawer-Inhalt
   */
  const drawerContent = (
    <Box sx={{ p: 2 }}>
      <Typography
        variant="h6"
        sx={{
          mb: 3,
          fontWeight: 'bold',
          color: 'primary.main',
        }}
      >
        Audit-Safe Extractor
      </Typography>

      <List>
        {navItems.map((item) => (
          <ListItem
            button
            key={item.path}
            component={Link}
            to={item.path}
            onClick={() => isMobile && setMobileDrawerOpen(false)}
            sx={{
              mb: 1,
              borderRadius: 1,
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <SchemaProvider>
          <Router>
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
          {/* App Bar */}
          <AppBar
            position="fixed"
            sx={{
              zIndex: (theme) => theme.zIndex.drawer + 1,
              width: isMobile ? '100%' : `calc(100% - ${drawerWidth}px)`,
              ml: isMobile ? 0 : `${drawerWidth}px`,
            }}
          >
            <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
              {isMobile && (
                <IconButton
                  color="inherit"
                  onClick={handleDrawerToggle}
                  sx={{ mr: 2 }}
                >
                  {mobileDrawerOpen ? <CloseIcon /> : <MenuIcon />}
                </IconButton>
              )}
              <Typography variant="h6" noWrap>
                Document Extraction System
              </Typography>
              <IconButton color="inherit" onClick={handleDarkModeToggle}>
                {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Toolbar>
          </AppBar>

          {/* Desktop Drawer */}
          {!isMobile && (
            <Drawer
              variant="permanent"
              sx={{
                width: drawerWidth,
                '& .MuiDrawer-paper': {
                  width: drawerWidth,
                  boxSizing: 'border-box',
                  mt: 8,
                },
              }}
            >
              {drawerContent}
            </Drawer>
          )}

          {/* Mobile Drawer */}
          {isMobile && (
            <Drawer
              anchor="left"
              open={mobileDrawerOpen}
              onClose={() => setMobileDrawerOpen(false)}
            >
              {drawerContent}
            </Drawer>
          )}

          {/* Main Content */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              width: '100%',
              mt: 8,
              overflow: 'auto',
            }}
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
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
              <Route path="/logs" element={<LogBrowser />} />
              <Route path="/configuration" element={<ConfigEditor />} />
              <Route path="/backups" element={<BackupManager />} />
              <Route path="/help" element={<HelpBrowser />} />
            </Routes>
          </Box>
        </Box>
        </Router>
        </SchemaProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
};
