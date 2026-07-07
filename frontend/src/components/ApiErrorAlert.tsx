/**
 * ApiErrorAlert - Komponente zur Fehleranzeige
 */

import React from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Collapse,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import { Close as CloseIcon, Info as InfoIcon } from '@mui/icons-material';
import { ApiError } from '../api/client';

interface ApiErrorAlertProps {
  error: ApiError | null;
  onClose?: () => void;
  severity?: 'error' | 'warning' | 'info';
  showDetails?: boolean;
}

export const ApiErrorAlert: React.FC<ApiErrorAlertProps> = ({
  error,
  onClose,
  severity = 'error',
  showDetails = true,
}) => {
  if (!error) return null;

  const hasDetails = showDetails && Object.keys(error.details || {}).length > 0;

  return (
    <Collapse in={true} sx={{ mb: 2 }}>
      <Alert
        severity={severity}
        onClose={onClose}
        action={
          onClose && (
            <IconButton
              color="inherit"
              size="small"
              onClick={onClose}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          )
        }
      >
        <AlertTitle>
          <strong>{error.code}</strong>
        </AlertTitle>
        <Typography variant="body2" sx={{ mb: 1 }}>
          {error.message}
        </Typography>
        {error.statusCode > 0 && (
          <Typography variant="caption" color="inherit">
            HTTP {error.statusCode}
          </Typography>
        )}
        {hasDetails && (
          <Box sx={{ mt: 1, p: 1, backgroundColor: 'rgba(0, 0, 0, 0.1)', borderRadius: 1 }}>
            <Stack spacing={0.5}>
              {Object.entries(error.details || {}).map(([key, value]) => (
                <Stack direction="row" spacing={1} key={key} alignItems="flex-start">
                  <InfoIcon fontSize="small" sx={{ mt: 0.25 }} />
                  <Typography variant="caption">
                    <strong>{key}:</strong> {String(value)}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        )}
      </Alert>
    </Collapse>
  );
};
