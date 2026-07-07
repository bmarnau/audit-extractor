/**
 * RuleTester - Test-Interface für Regeln
 */

import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Cancel as FailIcon,
} from '@mui/icons-material';
import { ExtractionRule } from '../services/ruleService';

interface RuleTesterProps {
  rule: ExtractionRule;
  onTest: (ruleId: string, testInput: string) => Promise<{
    matched: boolean;
    result: string | null;
    testCasePassed: boolean;
  }>;
  isLoading?: boolean;
  error?: string | null;
}

interface TestResult {
  input: string;
  matched: boolean;
  result: string | null;
  timestamp: Date;
}

export const RuleTester: React.FC<RuleTesterProps> = ({
  rule,
  onTest,
  isLoading = false,
  error = null,
}) => {
  const [testInput, setTestInput] = useState('');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testError, setTestError] = useState<string | null>(null);

  const handleTest = async () => {
    if (!testInput.trim()) {
      setTestError('Bitte Eingabe angeben');
      return;
    }

    try {
      setTestError(null);
      const result = await onTest(rule.id, testInput);
      setTestResults((prev) => [
        {
          input: testInput,
          matched: result.matched,
          result: result.result,
          timestamp: new Date(),
        },
        ...prev,
      ]);
    } catch (err) {
      setTestError(err instanceof Error ? err.message : 'Test fehlgeschlagen');
    }
  };

  const handleClearResults = () => {
    setTestResults([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleTest();
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Regel testen
        </Typography>

        {(error || testError) && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error || testError}
          </Alert>
        )}

        <Grid container spacing={2}>
          {/* Rule Info */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent sx={{ py: 1.5 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Field: <strong>{rule.fieldName}</strong>
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Pattern: <strong>{rule.pattern}</strong>
                    </Typography>
                  </Box>
                  <Divider orientation="vertical" flexItem />
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Expression: <code>{rule.expression}</code>
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Test Input */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Test-Eingabe"
              placeholder="Geben Sie Text ein, um die Regel zu testen..."
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              helperText="Beispiel: 'Rechnung Nr. INV-2024-001'"
            />
          </Grid>

          {/* Test Button */}
          <Grid item xs={12}>
            <Stack direction="row" spacing={1}>
              <Button
                onClick={handleTest}
                variant="contained"
                disabled={isLoading || !testInput.trim()}
                startIcon={isLoading && <CircularProgress size={20} />}
              >
                {isLoading ? 'Testet...' : 'Testen'}
              </Button>
              {testResults.length > 0 && (
                <Button
                  onClick={handleClearResults}
                  variant="outlined"
                  color="secondary"
                >
                  Ergebnisse löschen
                </Button>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Test-Ergebnisse ({testResults.length})
          </Typography>

          <Stack spacing={2}>
            {testResults.map((result, idx) => (
              <Card
                key={idx}
                variant="outlined"
                sx={{
                  borderLeft: `4px solid ${result.matched ? '#4caf50' : '#f44336'}`,
                  backgroundColor: result.matched ? '#f1f8e9' : '#ffebee',
                }}
              >
                <CardContent>
                  <Stack spacing={1.5}>
                    {/* Header */}
                    <Stack direction="row" spacing={1} alignItems="center">
                      {result.matched ? (
                        <SuccessIcon sx={{ color: '#4caf50' }} />
                      ) : (
                        <FailIcon sx={{ color: '#f44336' }} />
                      )}
                      <Chip
                        label={result.matched ? 'Match gefunden' : 'Kein Match'}
                        color={result.matched ? 'success' : 'error'}
                        variant="outlined"
                        size="small"
                      />
                      <Typography variant="caption" color="textSecondary">
                        {result.timestamp.toLocaleTimeString('de-DE')}
                      </Typography>
                    </Stack>

                    {/* Input */}
                    <Box>
                      <Typography variant="caption" color="textSecondary">
                        Eingabe:
                      </Typography>
                      <Box
                        sx={{
                          backgroundColor: 'rgba(0,0,0,0.05)',
                          p: 1,
                          borderRadius: 1,
                          fontFamily: 'monospace',
                          fontSize: '0.875rem',
                          wordBreak: 'break-all',
                        }}
                      >
                        {result.input}
                      </Box>
                    </Box>

                    {/* Result */}
                    {result.matched && result.result && (
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Extrahiert:
                        </Typography>
                        <Box
                          sx={{
                            backgroundColor: '#c8e6c9',
                            p: 1,
                            borderRadius: 1,
                            fontFamily: 'monospace',
                            fontSize: '0.875rem',
                            color: '#1b5e20',
                            fontWeight: 'bold',
                          }}
                        >
                          {result.result}
                        </Box>
                      </Box>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Paper>
      )}
    </Box>
  );
};
