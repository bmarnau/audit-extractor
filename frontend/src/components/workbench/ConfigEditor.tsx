/**
 * ConfigEditor - Phase 13 (Refactored)
 * Bearbeitet Systemkonfiguration mit Versionskontrolle.
 * ✅ Nutzt useConfig Hook - Keine Mockdaten mehr
 * @version 0.13.0
 * @phase 13
 */

import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, TextField, Button, Tabs, Tab, Typography, Alert,
  Grid, CircularProgress, MenuItem,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { useConfig } from '@/hooks/useConfig';
import { AppConfig, ChunkingConfig, ConfidenceConfig, LLMConfig, SystemConfig } from '@/types/Configuration';

export const ConfigEditor: React.FC = () => {
  const { config, loading, error, loadConfig, updateConfig } = useConfig();
  const [activeTab, setActiveTab] = useState(0);
  const [localConfig, setLocalConfig] = useState<AppConfig | null>(null);
  const [saved, setSaved] = useState(false);
  const [reason, setReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[ConfigEditor] Loading config...');
    loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    if (config && !localConfig) {
      setLocalConfig(config);
    }
  }, [config, localConfig]);

  const handleChunkingChange = (key: keyof ChunkingConfig, value: any) => {
    if (!localConfig) return;
    setLocalConfig({
      ...localConfig,
      chunking: { ...localConfig.chunking, [key]: value },
    });
  };

  const handleConfidenceChange = (key: keyof ConfidenceConfig, value: any) => {
    if (!localConfig) return;
    setLocalConfig({
      ...localConfig,
      confidence: { ...localConfig.confidence, [key]: value },
    });
  };

  const handleLLMChange = (key: keyof LLMConfig, value: any) => {
    if (!localConfig) return;
    setLocalConfig({
      ...localConfig,
      llm: { ...localConfig.llm, [key]: value },
    });
  };

  const handleSystemChange = (key: keyof SystemConfig, value: any) => {
    if (!localConfig) return;
    setLocalConfig({
      ...localConfig,
      system: { ...localConfig.system, [key]: value },
    });
  };

  const handleSave = async () => {
    if (!localConfig || !reason.trim()) {
      setUpdateError('Provide a reason');
      return;
    }
    setIsUpdating(true);
    setUpdateError(null);
    try {
      await updateConfig(localConfig, reason);
      setSaved(true);
      setReason('');
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading || !localConfig) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">⚙️ Configuration</Typography>
        <Button startIcon={<SaveIcon />} onClick={handleSave} variant="contained" disabled={isUpdating}>{isUpdating ? 'Saving...' : 'Save'}</Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>❌ {error}</Alert>}
      {updateError && <Alert severity="error" sx={{ mb: 2 }}>❌ {updateError}</Alert>}
      {saved && <Alert severity="success" sx={{ mb: 2 }}>✅ Saved</Alert>}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField fullWidth label="Change Reason" placeholder="Why?" value={reason} onChange={(e) => setReason(e.target.value)} disabled={isUpdating} multiline rows={2} />
        </CardContent>
      </Card>
      <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)} sx={{ mb: 2, borderBottom: 1, borderColor: '#e0e0e0' }}>
        <Tab label="📦 Chunking" /><Tab label="🎯 Confidence" /><Tab label="🤖 LLM" /><Tab label="⚙️ System" />
      </Tabs>
      {activeTab === 0 && (<Card><CardContent><Grid container spacing={2}><Grid item xs={12} sm={6}><TextField fullWidth label="Max Chunk Size" type="number" value={localConfig.chunking.maxChunkSize} onChange={(e) => handleChunkingChange('maxChunkSize', parseInt(e.target.value))} disabled={isUpdating} /></Grid><Grid item xs={12} sm={6}><TextField fullWidth label="Min Chunk Size" type="number" value={localConfig.chunking.minChunkSize} onChange={(e) => handleChunkingChange('minChunkSize', parseInt(e.target.value))} disabled={isUpdating} /></Grid><Grid item xs={12} sm={6}><TextField fullWidth label="Overlap (%)" type="number" value={localConfig.chunking.overlapPercentage} onChange={(e) => handleChunkingChange('overlapPercentage', parseInt(e.target.value))} disabled={isUpdating} /></Grid><Grid item xs={12} sm={6}><TextField fullWidth select label="Strategy" value={localConfig.chunking.strategy} onChange={(e) => handleChunkingChange('strategy', e.target.value as any)} disabled={isUpdating}><MenuItem value="semantic">Semantic</MenuItem><MenuItem value="fixed-size">Fixed Size</MenuItem><MenuItem value="hybrid">Hybrid</MenuItem></TextField></Grid><Grid item xs={12}><TextField fullWidth label="Language" value={localConfig.chunking.language} onChange={(e) => handleChunkingChange('language', e.target.value)} disabled={isUpdating} /></Grid></Grid></CardContent></Card>)}
      {activeTab === 1 && (<Card><CardContent><Grid container spacing={2}><Grid item xs={12} sm={6}><TextField fullWidth label="Minimum Threshold" type="number" value={localConfig.confidence.minimumThreshold} onChange={(e) => handleConfidenceChange('minimumThreshold', parseFloat(e.target.value))} disabled={isUpdating} /></Grid><Grid item xs={12} sm={6}><TextField fullWidth select label="Score Calculation" value={localConfig.confidence.scoreCalculation} onChange={(e) => handleConfidenceChange('scoreCalculation', e.target.value)} disabled={isUpdating}><MenuItem value="weighted">Weighted</MenuItem><MenuItem value="average">Average</MenuItem></TextField></Grid><Grid item xs={12} sm={6}><TextField fullWidth select label="Hallucination Detection" value={localConfig.confidence.hallucinationDetection ? 'yes' : 'no'} onChange={(e) => handleConfidenceChange('hallucinationDetection', e.target.value === 'yes')} disabled={isUpdating}><MenuItem value="yes">Enabled</MenuItem><MenuItem value="no">Disabled</MenuItem></TextField></Grid><Grid item xs={12} sm={6}><TextField fullWidth select label="Source Validation" value={localConfig.confidence.sourceValidation ? 'yes' : 'no'} onChange={(e) => handleConfidenceChange('sourceValidation', e.target.value === 'yes')} disabled={isUpdating}><MenuItem value="yes">Enabled</MenuItem><MenuItem value="no">Disabled</MenuItem></TextField></Grid></Grid></CardContent></Card>)}
      {activeTab === 2 && (<Card><CardContent><Grid container spacing={2}><Grid item xs={12} sm={6}><TextField fullWidth label="Model" value={localConfig.llm.model} onChange={(e) => handleLLMChange('model', e.target.value)} disabled={isUpdating} /></Grid><Grid item xs={12} sm={6}><TextField fullWidth label="Temperature" type="number" value={localConfig.llm.temperature} onChange={(e) => handleLLMChange('temperature', parseFloat(e.target.value))} disabled={isUpdating} /></Grid><Grid item xs={12} sm={6}><TextField fullWidth label="Max Tokens" type="number" value={localConfig.llm.maxTokens} onChange={(e) => handleLLMChange('maxTokens', parseInt(e.target.value))} disabled={isUpdating} /></Grid><Grid item xs={12} sm={6}><TextField fullWidth label="Top P" type="number" value={localConfig.llm.topP} onChange={(e) => handleLLMChange('topP', parseFloat(e.target.value))} disabled={isUpdating} /></Grid><Grid item xs={12} sm={6}><TextField fullWidth label="Timeout (ms)" type="number" value={localConfig.llm.timeout} onChange={(e) => handleLLMChange('timeout', parseInt(e.target.value))} disabled={isUpdating} /></Grid><Grid item xs={12} sm={6}><TextField fullWidth label="Retries" type="number" value={localConfig.llm.retries} onChange={(e) => handleLLMChange('retries', parseInt(e.target.value))} disabled={isUpdating} /></Grid></Grid></CardContent></Card>)}
      {activeTab === 3 && (<Card><CardContent><Grid container spacing={2}><Grid item xs={12} sm={6}><TextField fullWidth select label="Log Level" value={localConfig.system.logLevel} onChange={(e) => handleSystemChange('logLevel', e.target.value)} disabled={isUpdating}><MenuItem value="debug">Debug</MenuItem><MenuItem value="info">Info</MenuItem><MenuItem value="warn">Warning</MenuItem><MenuItem value="error">Error</MenuItem></TextField></Grid><Grid item xs={12} sm={6}><TextField fullWidth select label="Enable Tracing" value={localConfig.system.enableTracing ? 'yes' : 'no'} onChange={(e) => handleSystemChange('enableTracing', e.target.value === 'yes')} disabled={isUpdating}><MenuItem value="yes">Yes</MenuItem><MenuItem value="no">No</MenuItem></TextField></Grid><Grid item xs={12} sm={6}><TextField fullWidth select label="Enable Metrics" value={localConfig.system.enableMetrics ? 'yes' : 'no'} onChange={(e) => handleSystemChange('enableMetrics', e.target.value === 'yes')} disabled={isUpdating}><MenuItem value="yes">Yes</MenuItem><MenuItem value="no">No</MenuItem></TextField></Grid><Grid item xs={12} sm={6}><TextField fullWidth select label="Cache Results" value={localConfig.system.cacheResults ? 'yes' : 'no'} onChange={(e) => handleSystemChange('cacheResults', e.target.value === 'yes')} disabled={isUpdating}><MenuItem value="yes">Yes</MenuItem><MenuItem value="no">No</MenuItem></TextField></Grid><Grid item xs={12}><TextField fullWidth label="Cache TTL (sec)" type="number" value={localConfig.system.cacheTTL} onChange={(e) => handleSystemChange('cacheTTL', parseInt(e.target.value))} disabled={isUpdating} /></Grid></Grid></CardContent></Card>)}
    </Box>
  );
};