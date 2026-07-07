/**
 * Schema Upload Wizard - Phase 15c + 15e
 * 
 * 5-Schritt Wizard für:
 * 1. Schema hochladen
 * 2. Beispiele hochladen
 * 3. Vorschau
 * 4. Aggressiveness einstellen
 * 5. Regeln generieren
 * 
 * + Phase 15e: Revision History & Comparison
 */

import React, { useState, useRef } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Slider,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemText,
  Tabs,
  Tab,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  History as HistoryIcon,
  Compare as CompareIcon,
} from '@mui/icons-material';
import RunHistoryViewer from './RunHistoryViewer';
import DiffViewer from './DiffViewer';

interface SchemaData {
  schema: any | null;
  fileName: string;
}

interface ExampleFile {
  name: string;
  data: any;
}

interface GeneratedRule {
  id: string;
  fieldName: string;
  confidence: number;
  derivedFrom: 'schema' | 'examples' | 'hybrid';
  searchKeywords: string[];
}

interface GenerationStats {
  totalFieldsProcessed: number;
  rulesGenerated: number;
  averageConfidence: number;
  schemaOnlyRules: number;
  dataInformedRules: number;
  lowConfidenceRules: number;
}

interface ExtractedRun {
  runId: string;
  timestamp: Date | string;
  documentId: string;
  ruleSetId: string;
  extractedFields: Record<string, any>;
  coverage: number;
  averageConfidence: number;
  fieldCount: number;
  successfulFields: number;
  status: 'success' | 'partial' | 'failed';
}

const STEPS = [
  'Schema hochladen',
  'Beispiele hochladen',
  'Vorschau',
  'Einstellungen',
  'Regeln generieren',
];

const SchemaUploadWizard: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [schemaData, setSchemaData] = useState<SchemaData>({ schema: null, fileName: '' });
  const [examples, setExamples] = useState<ExampleFile[]>([]);
  const [aggressiveness, setAggressiveness] = useState(0.6);
  const [customKeywords, setCustomKeywords] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [generatedRules, setGeneratedRules] = useState<GeneratedRule[]>([]);
  const [generationStats, setGenerationStats] = useState<GenerationStats | null>(null);
  const [ruleSetId, setRuleSetId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const exampleInputRef = useRef<HTMLInputElement>(null);

  // Phase 15e: Revision System State
  const [documentId, setDocumentId] = useState<string>('');
  const [selectedRuns, setSelectedRuns] = useState<[ExtractedRun, ExtractedRun] | null>(null);
  const [revisionTabIndex, setRevisionTabIndex] = useState(0);
  const [showRevisionPanel, setShowRevisionPanel] = useState(false);

  const handleSchemaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setSchemaData({ schema: json, fileName: file.name });
        setError(null);
      } catch (err) {
        setError('Ungültiges JSON-Schema');
      }
    };
    reader.readAsText(file);
  };

  const handleExamplesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newExamples: ExampleFile[] = [];
    let filesProcessed = 0;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          newExamples.push({ name: file.name, data: json });
          filesProcessed++;

          if (filesProcessed === files.length) {
            setExamples([...examples, ...newExamples]);
            setError(null);
          }
        } catch (err) {
          setError(`Fehler beim Laden von ${file.name}`);
        }
      };
      reader.readAsText(file);
    });
  };

  const handleNext = () => {
    if (activeStep === 0 && !schemaData.schema) {
      setError('Bitte laden Sie zuerst ein Schema hoch');
      return;
    }
    if (activeStep === 1 && examples.length === 0) {
      setError('Bitte laden Sie mindestens ein Beispiel hoch');
      return;
    }
    setError(null);
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleGenerateRules = async () => {
    if (!schemaData.schema || examples.length === 0) {
      setError('Schema und Beispiele sind erforderlich');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/schema/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schema: schemaData.schema,
          examples: examples.map((e) => e.data),
          name: schemaData.fileName.replace('.json', ''),
        }),
      });

      if (!response.ok) throw new Error('Fehler beim Hochladen des Schemas');

      const uploadResult = await response.json();
      setRuleSetId(uploadResult.schemaId);

      // Generate rules with aggressiveness
      const rulesResponse = await fetch(
        `/api/schema/${uploadResult.schemaId}/generate-rules`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            schema: schemaData.schema,
            examples: examples.map((e) => e.data),
            aggressiveness,
            customKeywords: customKeywords
              .split(',')
              .map((k) => k.trim())
              .filter((k) => k),
          }),
        }
      );

      if (!rulesResponse.ok) throw new Error('Fehler beim Generieren von Regeln');

      const rulesData = await rulesResponse.json();
      setGeneratedRules(rulesData.rules);
      setGenerationStats(rulesData.stats);
      setSuccess(true);

      // Phase 15e: Save extraction run
      const extractedFields: Record<string, any> = {};
      examples.forEach((ex, idx) => {
        extractedFields[`example_${idx + 1}`] = ex.data;
      });
      await saveExtractionRun(extractedFields);

      setActiveStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  };

  const removeExample = (index: number) => {
    setExamples(examples.filter((_, i) => i !== index));
  };

  // Phase 15e: Save run to revision system
  const saveExtractionRun = async (extractedData: Record<string, any>) => {
    if (!ruleSetId || !schemaData.fileName) {
      console.warn('Missing ruleSetId or fileName for saving run');
      return;
    }

    try {
      const docId = schemaData.fileName.replace(/\.json$/i, '').replace(/\s+/g, '_');
      setDocumentId(docId);

      const response = await fetch('/api/revision/save-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: docId,
          documentName: schemaData.fileName,
          ruleSetId,
          extractedFields: extractedData,
          coverage: Object.keys(extractedData).length / (schemaData.schema?.properties ? Object.keys(schemaData.schema.properties).length : 1),
          isValid: true,
          validationErrors: [],
          warnings: [],
          averageConfidence: generatedRules.length > 0 ? 
            generatedRules.reduce((sum, r) => sum + r.confidence, 0) / generatedRules.length : 0,
          fieldCount: schemaData.schema?.properties ? Object.keys(schemaData.schema.properties).length : 0,
          successfulFields: Object.keys(extractedData).length,
          failedFields: [],
          executionTimeMs: 0,
          ruleVersion: '1.0.0',
          aggressiveness,
          status: 'success',
        }),
      });

      if (!response.ok) {
        throw new Error('Fehler beim Speichern des Laufs');
      }

      await response.json();
      setDocumentId(docId);
      setShowRevisionPanel(true);
    } catch (err) {
      console.error('Error saving run:', err);
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', py: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        📋 Schema-Driven Extraction Wizard
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          ✅ Regeln erfolgreich generiert!
        </Alert>
      )}

      <Card sx={{ mb: 4 }}>
        <CardContent>
          {/* Step 1: Schema Upload */}
          {activeStep === 0 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Schritt 1: JSON-Schema hochladen
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                Laden Sie ein JSON Schema im Draft-07 Format hoch. Dieses definiert die
                Struktur der Daten, die Sie extrahieren möchten.
              </Typography>

              <Box
                sx={{
                  border: '2px dashed #ccc',
                  borderRadius: 2,
                  p: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                <Typography variant="body1" sx={{ mb: 1 }}>
                  Schema-Datei auswählen
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  oder hierher ziehen (JSON)
                </Typography>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleSchemaUpload}
                  hidden
                />
              </Box>

              {schemaData.schema && (
                <Box sx={{ mt: 3 }}>
                  <Chip
                    icon={<CheckCircleIcon />}
                    label={schemaData.fileName}
                    color="success"
                    variant="outlined"
                  />
                  <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                    {Object.keys(schemaData.schema.properties || {}).length} Felder
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Step 2: Examples Upload */}
          {activeStep === 1 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Schritt 2: Beispieldokumente hochladen
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                Laden Sie 1-10 JSON-Beispiele hoch. Diese werden verwendet, um Muster zu
                erkennen und die Extraktionsregeln zu verfeinern.
              </Typography>

              <Box
                sx={{
                  border: '2px dashed #ccc',
                  borderRadius: 2,
                  p: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
                }}
                onClick={() => exampleInputRef.current?.click()}
              >
                <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                <Typography variant="body1" sx={{ mb: 1 }}>
                  Beispieldateien auswählen
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Mehrere JSON-Dateien auswählen (1-10 Dateien)
                </Typography>
                <input
                  ref={exampleInputRef}
                  type="file"
                  accept=".json"
                  multiple
                  onChange={handleExamplesUpload}
                  hidden
                />
              </Box>

              {examples.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    ✅ {examples.length} Beispiele hochgeladen:
                  </Typography>
                  <List>
                    {examples.map((ex, idx) => (
                      <ListItem
                        key={idx}
                        secondaryAction={
                          <Button
                            size="small"
                            onClick={() => removeExample(idx)}
                            color="error"
                          >
                            Entfernen
                          </Button>
                        }
                      >
                        <ListItemText
                          primary={ex.name}
                          secondary={`${Object.keys(ex.data || {}).length} Felder`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          )}

          {/* Step 3: Preview */}
          {activeStep === 2 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Schritt 3: Vorschau
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                    📄 Schema-Struktur
                  </Typography>
                  <Paper
                    sx={{
                      p: 2,
                      bgcolor: 'grey.50',
                      maxHeight: 300,
                      overflow: 'auto',
                      fontFamily: 'monospace',
                      fontSize: '0.85rem',
                    }}
                  >
                    {schemaData.schema?.properties && (
                      <List>
                        {Object.entries(schemaData.schema.properties).map(
                          ([key, prop]: [string, any]) => (
                            <ListItem key={key} dense>
                              <ListItemText
                                primary={`${key}`}
                                secondary={`${prop.type}${prop.required ? ' (erforderlich)' : ''}`}
                              />
                            </ListItem>
                          )
                        )}
                      </List>
                    )}
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                    📊 Beispielstatistiken
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <List>
                      <ListItem dense>
                        <ListItemText
                          primary="Beispiele"
                          secondary={`${examples.length} Dateien`}
                        />
                      </ListItem>
                      <ListItem dense>
                        <ListItemText
                          primary="Schema-Felder"
                          secondary={`${Object.keys(schemaData.schema?.properties || {}).length} insgesamt`}
                        />
                      </ListItem>
                      <ListItem dense>
                        <ListItemText
                          primary="Erforderlich"
                          secondary={`${schemaData.schema?.required?.length || 0} Felder`}
                        />
                      </ListItem>
                    </List>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Step 4: Settings */}
          {activeStep === 3 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Schritt 4: Extraktionseinstellungen
              </Typography>

              <Alert severity="info" sx={{ mb: 3 }}>
                <InfoIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Passen Sie die Aggressiveness an, um zu steuern, wie streng oder
                nachsichtig die Regelgenerierung sein soll.
              </Alert>

              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                  🎯 Aggressiveness-Level
                </Typography>
                <Box sx={{ px: 2 }}>
                  <Slider
                    value={aggressiveness}
                    onChange={(_e, newValue) =>
                      setAggressiveness(Array.isArray(newValue) ? newValue[0] : newValue)
                    }
                    min={0.1}
                    max={0.9}
                    step={0.1}
                    marks={[
                      { value: 0.1, label: 'Konservativ' },
                      { value: 0.5, label: 'Ausgewogen' },
                      { value: 0.9, label: 'Aggressiv' },
                    ]}
                    valueLabelDisplay="on"
                  />
                </Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', mt: 2 }}>
                  {aggressiveness < 0.4
                    ? '🛡️ Konservativ: Nur hochsichere Regeln'
                    : aggressiveness < 0.7
                      ? '⚖️ Ausgewogen: Gute Balance'
                      : '🎯 Aggressiv: Mehr Regeln, niedrigere Schwellenwerte'}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                  🔑 Benutzerdefinierte Schlüsselwörter (optional)
                </Typography>
                <TextField
                  multiline
                  rows={3}
                  fullWidth
                  placeholder="Komma-getrennte Schlüsselwörter pro Feld&#10;z.B.: amount,total,sum"
                  value={customKeywords}
                  onChange={(e) => setCustomKeywords(e.target.value)}
                  variant="outlined"
                />
                <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1 }}>
                  Diese Schlüsselwörter werden bei der Regelgenerierung bevorzugt.
                </Typography>
              </Box>
            </Box>
          )}

          {/* Step 5: Results */}
          {activeStep === 4 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Schritt 5: Generierte Regeln
              </Typography>

              {generationStats && (
                <Grid container spacing={2} sx={{ mb: 4 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light' }}>
                      <Typography variant="h4" sx={{ color: 'primary.main' }}>
                        {generationStats.rulesGenerated}
                      </Typography>
                      <Typography variant="caption">Regeln generiert</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light' }}>
                      <Typography
                        variant="h4"
                        sx={{ color: 'success.main' }}
                      >
                        {(generationStats.averageConfidence * 100).toFixed(0)}%
                      </Typography>
                      <Typography variant="caption">Durchschn. Konfidenz</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light' }}>
                      <Typography variant="h4" sx={{ color: 'info.main' }}>
                        {generationStats.dataInformedRules}
                      </Typography>
                      <Typography variant="caption">Daten-informiert</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light' }}>
                      <Typography variant="h4" sx={{ color: 'warning.main' }}>
                        {generationStats.lowConfidenceRules}
                      </Typography>
                      <Typography variant="caption">Niedrige Konfidenz</Typography>
                    </Paper>
                  </Grid>
                </Grid>
              )}

              {generatedRules.length > 0 && (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.100' }}>
                        <TableCell>Feldname</TableCell>
                        <TableCell align="right">Konfidenz</TableCell>
                        <TableCell>Hergeleitet von</TableCell>
                        <TableCell>Schlüsselwörter</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {generatedRules.slice(0, 10).map((rule) => (
                        <TableRow key={rule.id}>
                          <TableCell>{rule.fieldName}</TableCell>
                          <TableCell align="right">
                            <Chip
                              label={`${(rule.confidence * 100).toFixed(0)}%`}
                              size="small"
                              color={
                                rule.confidence > 0.7 ? 'success' : 'warning'
                              }
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={rule.derivedFrom}
                              size="small"
                              variant="filled"
                            />
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.8rem' }}>
                            {rule.searchKeywords.slice(0, 2).join(', ')}
                            {rule.searchKeywords.length > 2 ? '...' : ''}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
        >
          Zurück
        </Button>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {activeStep === 4 && (
            <Button
              variant="contained"
              color="success"
              onClick={() => {
                alert(`✅ RuleSet ID: ${ruleSetId}\n\nJetzt können Sie diesen RuleSet zur Extraktion verwenden!`);
              }}
            >
              ✅ Speichern & Abschließen
            </Button>
          )}
          {activeStep < 4 && (
            <>
              {activeStep === 3 ? (
                <Button
                  variant="contained"
                  onClick={handleGenerateRules}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Generiere...
                    </>
                  ) : (
                    '🚀 Regeln generieren'
                  )}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                >
                  Weiter
                </Button>
              )}
            </>
          )}
        </Box>
      </Box>

      <Typography variant="caption" sx={{ display: 'block', mt: 3, color: 'text.secondary' }}>
        Phase 15c • Schema-Driven Extraction • {activeStep + 1}/{STEPS.length}
      </Typography>

      {/* Phase 15e: Revision System Panel */}
      {showRevisionPanel && documentId && (
        <Box sx={{ mt: 6 }}>
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                <HistoryIcon />
                <Typography variant="h6">
                  📊 Revisions-System (Phase 15e)
                </Typography>
              </Box>

              <Tabs
                value={revisionTabIndex}
                onChange={(_e, newValue) => setRevisionTabIndex(newValue)}
                sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
              >
                <Tab icon={<HistoryIcon />} label="Lauf-Historie" />
                <Tab icon={<CompareIcon />} label="Vergleich" />
              </Tabs>

              {revisionTabIndex === 0 && (
                <Box>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Zeigt alle Extraktions-Läufe für dieses Dokument. Wählen Sie zwei Läufe
                    aus, um diese zu vergleichen.
                  </Alert>
                  <RunHistoryViewer
                    documentId={documentId}
                    onSelectRuns={(run1, run2) => {
                      setSelectedRuns([run1, run2]);
                      setRevisionTabIndex(1);
                    }}
                  />
                </Box>
              )}

              {revisionTabIndex === 1 && selectedRuns && (
                <Box>
                  <DiffViewer
                    run1={selectedRuns[0]}
                    run2={selectedRuns[1]}
                  />
                </Box>
              )}

              {revisionTabIndex === 1 && !selectedRuns && (
                <Alert severity="info">
                  Wählen Sie zwei Läufe in der Historie aus, um diese zu vergleichen.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default SchemaUploadWizard;
