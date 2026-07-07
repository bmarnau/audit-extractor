/**
 * RulesList - Tabellenübersicht aller Regeln
 */

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileCopy as DuplicateIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { ExtractionRule } from '../services/ruleService';

interface RulesListProps {
  rules: ExtractionRule[];
  loading: boolean;
  error: string | null;
  onEdit: (rule: ExtractionRule) => void;
  onDuplicate: (rule: ExtractionRule) => void;
  onDelete: (ruleId: string) => void;
  onView: (rule: ExtractionRule) => void;
}

export const RulesList: React.FC<RulesListProps> = ({
  rules,
  loading,
  error,
  onEdit,
  onDuplicate,
  onDelete,
  onView,
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);

  const handleDeleteClick = (ruleId: string) => {
    setRuleToDelete(ruleId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (ruleToDelete) {
      await onDelete(ruleToDelete);
      setDeleteDialogOpen(false);
      setRuleToDelete(null);
    }
  };

  const getPatternColor = (pattern: string) => {
    const colors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'> = {
      regex: 'primary',
      keyword: 'info',
      date: 'secondary',
      custom: 'warning',
    };
    return colors[pattern] || 'default';
  };

  return (
    <Box sx={{ width: '100%' }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell><strong>Field Name</strong></TableCell>
              <TableCell><strong>Pattern</strong></TableCell>
              <TableCell><strong>Description</strong></TableCell>
              <TableCell align="center"><strong>Required</strong></TableCell>
              <TableCell align="center"><strong>Confidence</strong></TableCell>
              <TableCell align="center"><strong>Version</strong></TableCell>
              <TableCell align="right"><strong>Aktionen</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  <CircularProgress size={30} />
                </TableCell>
              </TableRow>
            ) : rules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  Keine Regeln vorhanden
                </TableCell>
              </TableRow>
            ) : (
              rules.map((rule) => (
                <TableRow key={rule.id} hover>
                  <TableCell>
                    <strong>{rule.fieldName}</strong>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={rule.pattern}
                      size="small"
                      color={getPatternColor(rule.pattern)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {rule.description}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={rule.isRequired ? 'Ja' : 'Nein'}
                      size="small"
                      color={rule.isRequired ? 'error' : 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">{(rule.confidence * 100).toFixed(0)}%</TableCell>
                  <TableCell align="center">{rule.version}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Anzeigen">
                      <IconButton
                        size="small"
                        onClick={() => onView(rule)}
                        color="info"
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Bearbeiten">
                      <IconButton
                        size="small"
                        onClick={() => onEdit(rule)}
                        color="primary"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Duplizieren">
                      <IconButton
                        size="small"
                        onClick={() => onDuplicate(rule)}
                        color="secondary"
                      >
                        <DuplicateIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Löschen">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(rule.id)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Regel löschen</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Sind Sie sicher, dass Sie diese Regel löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Abbrechen</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Löschen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
