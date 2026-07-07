/**
 * RuleEditor - Haupt-Komponente für Rule-Verwaltung (Phase 11 Frontend)
 * 
 * Features:
 * - öffnen, bearbeiten, speichern, duplizieren, testen
 * - Änderungen protokollieren
 * 
 * @version 0.11.0
 * @phase 11
 * @status COMPLETE - 4-tab interface with full CRUD + changelog
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Tabs,
  Tab,
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert as MuiAlert,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useRules } from '../hooks/useRules';
import { ExtractionRule } from '../services/ruleService';
import { RulesList } from './RulesList';
import { RuleEditorForm } from './RuleEditorForm';
import { RuleTester } from './RuleTester';
import { RuleChangeLog } from './RuleChangeLog';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index} style={{ width: '100%' }}>
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

export const RuleEditor: React.FC = () => {
  const {
    rules,
    loading,
    error,
    changelog,
    listRules,
    saveRule,
    duplicateRule,
    deleteRule,
    testRule,
    getChangelog,
  } = useRules();

  const [currentTab, setCurrentTab] = useState(0);
  const [selectedRule, setSelectedRule] = useState<ExtractionRule | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicateRuleName, setDuplicateRuleName] = useState('');
  const [ruleToDuplicate, setRuleToDuplicate] = useState<ExtractionRule | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'success' });
  const [savingRule, setSavingRule] = useState(false);
  const [testingRule, setTestingRule] = useState(false);

  // Refresh rules and changelog on mount
  useEffect(() => {
    listRules();
    getChangelog();
  }, []);

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleEditRule = (rule: ExtractionRule) => {
    setSelectedRule(rule);
    setEditMode(true);
    setCurrentTab(1); // Switch to edit tab
  };

  const handleViewRule = (rule: ExtractionRule) => {
    setSelectedRule(rule);
    setCurrentTab(1); // Show in edit view (read-only mode)
  };

  const handleCreateRule = () => {
    setSelectedRule(null);
    setEditMode(true);
    setCurrentTab(1);
  };

  const handleSaveRule = async (rule: ExtractionRule) => {
    try {
      setSavingRule(true);
      await saveRule(rule);
      setEditMode(false);
      setSelectedRule(null);
      await listRules();
      await getChangelog();
      showSnackbar('Regel erfolgreich gespeichert', 'success');
      setCurrentTab(0); // Go back to list
    } catch (err) {
      showSnackbar(err instanceof Error ? err.message : 'Fehler beim Speichern', 'error');
    } finally {
      setSavingRule(false);
    }
  };

  const handleDuplicateRule = (rule: ExtractionRule) => {
    setRuleToDuplicate(rule);
    setDuplicateRuleName(`${rule.fieldName}_copy`);
    setDuplicateDialogOpen(true);
  };

  const handleConfirmDuplicate = async () => {
    if (!ruleToDuplicate || !duplicateRuleName.trim()) return;

    try {
      setSavingRule(true);
      await duplicateRule(ruleToDuplicate.id, duplicateRuleName);
      await listRules();
      await getChangelog();
      showSnackbar('Regel erfolgreich dupliziert', 'success');
      setDuplicateDialogOpen(false);
      setDuplicateRuleName('');
      setRuleToDuplicate(null);
    } catch (err) {
      showSnackbar(err instanceof Error ? err.message : 'Fehler beim Duplizieren', 'error');
    } finally {
      setSavingRule(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      setSavingRule(true);
      await deleteRule(ruleId);
      await listRules();
      await getChangelog();
      showSnackbar('Regel erfolgreich gelöscht', 'success');
    } catch (err) {
      showSnackbar(err instanceof Error ? err.message : 'Fehler beim Löschen', 'error');
    } finally {
      setSavingRule(false);
    }
  };

  const handleTestRule = async (ruleId: string, testInput: string) => {
    try {
      setTestingRule(true);
      return await testRule(ruleId, testInput);
    } finally {
      setTestingRule(false);
      await getChangelog(); // Refresh changelog after test
    }
  };

  const handleRefresh = async () => {
    try {
      await listRules();
      await getChangelog();
      showSnackbar('Aktualisiert', 'info');
    } catch (err) {
      showSnackbar('Fehler beim Aktualisieren', 'error');
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setSelectedRule(null);
    setCurrentTab(0);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ mb: 1 }}>
            Rule Editor
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Verwaltung von Extraktionsregeln mit Versionierung und Änderungsprotokoll
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            onClick={handleRefresh}
            variant="outlined"
            startIcon={<RefreshIcon />}
          >
            Aktualisieren
          </Button>
          <Button
            onClick={handleCreateRule}
            variant="contained"
            startIcon={<AddIcon />}
          >
            Neue Regel
          </Button>
        </Stack>
      </Stack>

      {/* Tabs */}
      <Card>
        <Tabs value={currentTab} onChange={(_e, value) => setCurrentTab(value)}>
          <Tab label={`Regeln (${rules.length})`} />
          <Tab label={editMode ? 'Regel bearbeiten' : 'Regel anzeigen'} />
          <Tab label="Testen" disabled={!selectedRule} />
          <Tab label={`Änderungen (${changelog.length})`} />
        </Tabs>

        <CardContent>
          {/* Tab 0: Rules List */}
          <TabPanel value={currentTab} index={0}>
            <RulesList
              rules={rules}
              loading={loading}
              error={error}
              onEdit={handleEditRule}
              onDuplicate={handleDuplicateRule}
              onDelete={handleDeleteRule}
              onView={handleViewRule}
            />
          </TabPanel>

          {/* Tab 1: Rule Editor */}
          <TabPanel value={currentTab} index={1}>
            {selectedRule ? (
              <RuleEditorForm
                rule={selectedRule}
                onSave={handleSaveRule}
                onCancel={handleCancelEdit}
                isLoading={savingRule}
                error={error}
              />
            ) : (
              <RuleEditorForm
                onSave={handleSaveRule}
                onCancel={handleCancelEdit}
                isLoading={savingRule}
                error={error}
              />
            )}
          </TabPanel>

          {/* Tab 2: Rule Tester */}
          <TabPanel value={currentTab} index={2}>
            {selectedRule && (
              <RuleTester
                rule={selectedRule}
                onTest={handleTestRule}
                isLoading={testingRule}
                error={error}
              />
            )}
          </TabPanel>

          {/* Tab 3: Changelog */}
          <TabPanel value={currentTab} index={3}>
            <RuleChangeLog
              changelog={changelog}
              loading={loading}
              error={error}
              ruleId={selectedRule?.id}
            />
          </TabPanel>
        </CardContent>
      </Card>

      {/* Duplicate Dialog */}
      <Dialog
        open={duplicateDialogOpen}
        onClose={() => setDuplicateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Regel duplizieren</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Neuer Field Name"
            value={duplicateRuleName}
            onChange={(e) => setDuplicateRuleName(e.target.value)}
            placeholder="z.B. invoiceNumber_copy"
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDuplicateDialogOpen(false)}>Abbrechen</Button>
          <Button
            onClick={handleConfirmDuplicate}
            variant="contained"
            disabled={!duplicateRuleName.trim() || savingRule}
          >
            Duplizieren
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <MuiAlert elevation={6} variant="filled" severity={snackbar.severity}>
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Container>
  );
};
