/**
 * RuleChangeLog - Änderungshistorie für Regeln
 */

import React from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileCopy as DuplicateIcon,
  Science as TestIcon,
} from '@mui/icons-material';
import { ChangeLogEntry } from '../services/ruleService';

interface RuleChangeLogProps {
  changelog: ChangeLogEntry[];
  loading: boolean;
  error: string | null;
  ruleId?: string;
}

const ACTION_CONFIG: Record<string, { icon: JSX.Element; label: string; color: 'primary' | 'success' | 'warning' | 'error' | 'info' }> = {
  created: { icon: <AddIcon fontSize="small" />, label: 'Erstellt', color: 'success' },
  updated: { icon: <EditIcon fontSize="small" />, label: 'Bearbeitet', color: 'primary' },
  deleted: { icon: <DeleteIcon fontSize="small" />, label: 'Gelöscht', color: 'error' },
  duplicated: { icon: <DuplicateIcon fontSize="small" />, label: 'Dupliziert', color: 'warning' },
  tested: { icon: <TestIcon fontSize="small" />, label: 'Getestet', color: 'info' },
};

export const RuleChangeLog: React.FC<RuleChangeLogProps> = ({
  changelog,
  loading,
  error,
  ruleId,
}) => {
  const displayData = ruleId ? changelog.filter((entry) => entry.ruleId === ruleId) : changelog;

  return (
    <Box sx={{ width: '100%' }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell><strong>Zeitstempel</strong></TableCell>
              <TableCell><strong>Aktion</strong></TableCell>
              <TableCell><strong>Beschreibung</strong></TableCell>
              <TableCell><strong>Benutzer</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                  <CircularProgress size={30} />
                </TableCell>
              </TableRow>
            ) : displayData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  {ruleId ? 'Keine Änderungen für diese Regel' : 'Keine Einträge vorhanden'}
                </TableCell>
              </TableRow>
            ) : (
              displayData.map((entry) => {
                const config = ACTION_CONFIG[entry.action] || { icon: null, label: entry.action, color: 'default' as const };
                return (
                  <TableRow key={entry.id} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Typography variant="caption">
                        {entry.timestamp.toLocaleString('de-DE')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={config.icon}
                        label={config.label}
                        size="small"
                        color={config.color}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{entry.description}</Typography>
                      {entry.changes && Object.keys(entry.changes).length > 0 && (
                        <Typography
                          variant="caption"
                          color="textSecondary"
                          component="div"
                          sx={{ mt: 0.5, fontFamily: 'monospace' }}
                        >
                          {Object.entries(entry.changes)
                            .slice(0, 2)
                            .map(([key, value]) => `${key}: ${String(value).substring(0, 30)}${String(value).length > 30 ? '...' : ''}`)
                            .join(' | ')}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="textSecondary">
                        {entry.userId || '—'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
