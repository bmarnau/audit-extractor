/**
 * Color & Status Mapping Utilities
 * Extracted from multiple components to eliminate duplication
 * Used by: DiffViewer.tsx, RunHistoryViewer.tsx
 */

import React from 'react';
import {
  Add,
  Delete,
  Edit,
  CheckCircle,
  Warning,
  Error,
} from '@mui/icons-material';

/**
 * Change Type Colors (for Diff Viewer)
 * Maps field change types to background colors
 */
export const CHANGE_TYPE_COLORS: Record<string, string> = {
  added: '#c8e6c9',      // Light green
  removed: '#ffcdd2',    // Light red
  changed: '#fff9c4',    // Light yellow
};

export const getChangeColor = (changeType: string): string => {
  return CHANGE_TYPE_COLORS[changeType] || 'white';
};

/**
 * Change Type Icons (for Diff Viewer)
 * Maps field change types to icon components with colors
 */
export const getChangeIcon = (changeType: string): React.ReactNode => {
  switch (changeType) {
    case 'added':
      return React.createElement(Add, { sx: { color: 'green' } });
    case 'removed':
      return React.createElement(Delete, { sx: { color: 'red' } });
    case 'changed':
      return React.createElement(Edit, { sx: { color: 'orange' } });
    default:
      return null;
  }
};

/**
 * Status Type Colors (for Run History Viewer)
 * Maps extraction status to MUI color variants
 */
export const getStatusColor = (status: string): 'success' | 'warning' | 'error' => {
  switch (status) {
    case 'success':
      return 'success';
    case 'partial':
      return 'warning';
    case 'failed':
      return 'error';
    default:
      return 'success';
  }
};

/**
 * Status Type Icons (for Run History Viewer)
 * Maps extraction status to icon components with colors
 */
export const getStatusIcon = (status: string): React.ReactNode => {
  switch (status) {
    case 'success':
      return React.createElement(CheckCircle, { sx: { color: 'green' } });
    case 'partial':
      return React.createElement(Warning, { sx: { color: 'orange' } });
    case 'failed':
      return React.createElement(Error, { sx: { color: 'red' } });
    default:
      return null;
  }
};
