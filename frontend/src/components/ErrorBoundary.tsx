/**
 * React Error Boundary
 * Catches React component errors and logs them
 */

import React from 'react';
import { Box, Button, Card, CardContent, Typography, Alert } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { handleReactError, Logger } from '@/services/logger';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error Boundary Component
 * Wraps component tree to catch and handle errors
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ errorInfo });
    handleReactError(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3, minHeight: '50vh', display: 'flex', alignItems: 'center' }}>
          <Card sx={{ width: '100%', maxWidth: 600, mx: 'auto' }}>
            <CardContent>
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="h6">
                  Oops! Something went wrong
                </Typography>
              </Alert>

              <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
                An unexpected error occurred. The incident has been logged and our team will look into it.
              </Typography>

              {process.env.REACT_APP_ENV === 'development' && this.state.error && (
                <Card sx={{ backgroundColor: '#f5f5f5', mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Error Details (Development):
                    </Typography>
                    <Typography variant="body2" component="pre" sx={{
                      overflow: 'auto',
                      fontSize: '0.75rem',
                      p: 1,
                      backgroundColor: '#eee',
                      borderRadius: 1,
                    }}>
                      {this.state.error.toString()}
                    </Typography>
                    {this.state.errorInfo && (
                      <Typography variant="body2" component="pre" sx={{
                        overflow: 'auto',
                        fontSize: '0.75rem',
                        p: 1,
                        backgroundColor: '#eee',
                        borderRadius: 1,
                        mt: 1,
                      }}>
                        {this.state.errorInfo.componentStack}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              )}

              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between' }}>
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleReset}
                >
                  Try Again
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    const logs = Logger.exportLogs();
                    console.log('Export logs:', logs);
                    alert('Logs exported to console');
                  }}
                >
                  Export Logs
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
