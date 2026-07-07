/**
 * BackupManager - Phase 13 (Refactored)
 *
 * Verwaltet Backups: Create, List, Restore, Delete, Download.
 * ✅ Nutzt useBackup Hook - Keine Mockdaten mehr
 *
 * Features:
 * - Backup Liste vom Server
 * - Create neue Backups
 * - Restore aus Backups
 * - Delete alte Backups
 * - Download Backup Files
 * - Kompression & Checksums
 *
 * @version 0.13.0
 * @phase 13
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  Paper,
  TextField,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import RestoreIcon from '@mui/icons-material/Restore';
import { useBackup } from '@/hooks/useBackup';
import { BackupMetadata, RestoreRequest } from '@/types/Backup';

/**
 * BackupManager Component
 */
export const BackupManager: React.FC = () => {
  const { backups, loading, error, listBackups, createBackup, restoreBackup, deleteBackup, downloadBackup } = useBackup();
  
  // Local state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupMetadata | null>(null);
  const [backupName, setBackupName] = useState('');
  const [restoreReason, setRestoreReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load backups on mount
  useEffect(() => {
    console.log('[BackupManager] Component mounted, loading backups...');
    handleLoadBackups();
  }, []);

  const handleLoadBackups = async () => {
    try {
      await listBackups();
    } catch (err) {
      console.error('[BackupManager] Failed to load backups:', err);
    }
  };

  const handleCreateBackup = async () => {
    if (!backupName.trim()) return;
    
    setIsProcessing(true);
    try {
      console.log('[BackupManager] Creating backup:', backupName);
      await createBackup(backupName, 'Backup created from UI');
      
      setMessage({ type: 'success', text: 'Backup created successfully' });
      setBackupName('');
      setCreateDialogOpen(false);
      
      // Reload backups
      await handleLoadBackups();
      
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create backup';
      console.error('[BackupManager] Create failed:', err);
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!selectedBackup) return;
    
    setIsProcessing(true);
    try {
      console.log('[BackupManager] Restoring backup:', selectedBackup.backupId);
      const request: RestoreRequest = {
        backupId: selectedBackup.backupId,
        reason: restoreReason || 'Backup restored from UI',
        restoreBy: 'ui-user',
      };
      
      await restoreBackup(request);
      
      setMessage({ type: 'success', text: 'Backup restored successfully' });
      setRestoreDialogOpen(false);
      setRestoreReason('');
      
      // Reload backups
      await handleLoadBackups();
      
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to restore backup';
      console.error('[BackupManager] Restore failed:', err);
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteBackup = async () => {
    if (!selectedBackup) return;
    
    setIsProcessing(true);
    try {
      console.log('[BackupManager] Deleting backup:', selectedBackup.backupId);
      await deleteBackup(selectedBackup.backupId);
      
      setMessage({ type: 'success', text: 'Backup deleted successfully' });
      setDeleteDialogOpen(false);
      
      // Reload backups
      await handleLoadBackups();
      
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete backup';
      console.error('[BackupManager] Delete failed:', err);
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadBackup = (backup: BackupMetadata) => {
    console.log('[BackupManager] Downloading backup:', backup.backupId);
    downloadBackup(backup.backupId);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography>Loading backups...</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">💾 Backup Manager</Typography>
        <Button
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
          variant="contained"
          disabled={isProcessing}
        >
          Create Backup
        </Button>
      </Box>

      {error && <Alert severity="error">❌ Error: {error}</Alert>}
      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }}>
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </Alert>
      )}

      {/* Backups Table */}
      {backups.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
              <TableRow>
                <TableCell>Backup Name</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell align="right">Size (MB)</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Duration (s)</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {backups.map((backup) => (
                <TableRow key={backup.backupId} hover>
                  <TableCell>
                    <Typography variant="subtitle2">{backup.backupName}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(backup.createdAt).toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {(backup.totalSize / 1024 / 1024).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={backup.reason || 'Manual'}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">{backup.retentionDays || '-'} days</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={() => handleDownloadBackup(backup)}
                      disabled={isProcessing}
                      sx={{ mr: 0.5 }}
                    >
                      Download
                    </Button>
                    <Button
                      size="small"
                      startIcon={<RestoreIcon />}
                      onClick={() => {
                        setSelectedBackup(backup);
                        setRestoreDialogOpen(true);
                      }}
                      disabled={isProcessing}
                      sx={{ mr: 0.5 }}
                    >
                      Restore
                    </Button>
                    <Button
                      size="small"
                      startIcon={<DeleteIcon />}
                      onClick={() => {
                        setSelectedBackup(backup);
                        setDeleteDialogOpen(true);
                      }}
                      disabled={isProcessing}
                      color="error"
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1">No backups yet. Create one to get started.</Typography>
        </Box>
      )}

      {/* Create Backup Dialog */}
      <Dialog open={createDialogOpen} onClose={() => !isProcessing && setCreateDialogOpen(false)}>
        <DialogTitle>Create Backup</DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <TextField
            autoFocus
            fullWidth
            label="Backup Name"
            placeholder="e.g., before-config-update"
            value={backupName}
            onChange={(e) => setBackupName(e.target.value)}
            disabled={isProcessing}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleCreateBackup} variant="contained" disabled={isProcessing || !backupName.trim()}>
            {isProcessing ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Restore Backup Dialog */}
      <Dialog open={restoreDialogOpen} onClose={() => !isProcessing && setRestoreDialogOpen(false)}>
        <DialogTitle>Restore Backup</DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Restoring will overwrite all current data. This action cannot be undone.
          </Typography>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Backup: {selectedBackup?.backupName}
          </Typography>
          <Typography variant="caption" sx={{ color: '#666', mb: 2, display: 'block' }}>
            Created: {selectedBackup && new Date(selectedBackup.createdAt).toLocaleString()}
          </Typography>
          <TextField
            fullWidth
            label="Reason for restore"
            placeholder="Why are you restoring this backup?"
            value={restoreReason}
            onChange={(e) => setRestoreReason(e.target.value)}
            disabled={isProcessing}
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialogOpen(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleRestoreBackup} variant="contained" color="warning" disabled={isProcessing}>
            {isProcessing ? 'Restoring...' : 'Confirm Restore'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Backup Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => !isProcessing && setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Backup</DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body2">
            Are you sure you want to delete this backup? This action cannot be undone.
          </Typography>
          <Typography variant="subtitle2" sx={{ mt: 2 }}>
            Backup: {selectedBackup?.backupName}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleDeleteBackup} variant="contained" color="error" disabled={isProcessing}>
            {isProcessing ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
