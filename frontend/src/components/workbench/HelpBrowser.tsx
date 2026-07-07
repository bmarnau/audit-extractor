/**
 * HelpBrowser - Phase 13 (Refactored)
 *
 * Durchsucht Glossar, Dokumentation und Release Notes.
 * ✅ Nutzt useHelp Hook - Keine Mockdaten mehr
 *
 * Features:
 * - Volltext-Suche via API
 * - Glossar-Browsing
 * - Dokumentation
 * - Release Notes
 * - Suchtreffer-Highlighting
 *
 * @version 0.13.0
 * @phase 13
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Paper,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useHelp, GlossaryEntry, DocItem } from '@/hooks/useHelp';

/**
 * HelpBrowser Component
 */
export const HelpBrowser: React.FC = () => {
  const { glossary, documentation, releaseNotes, manual, loading, error, fetchHelp, fetchManual, searchGlossary, searchDocumentation, searchReleaseNotes } = useHelp();
  
  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [filteredGlossary, setFilteredGlossary] = useState<GlossaryEntry[]>([]);
  const [filteredDocs, setFilteredDocs] = useState<DocItem[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<DocItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<GlossaryEntry | DocItem | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  // Load help data on mount
  useEffect(() => {
    console.log('[HelpBrowser] Component mounted, loading help data...');
    handleLoadHelp();
  }, []);

  // Update filtered results when glossary/docs change
  useEffect(() => {
    setFilteredGlossary(glossary);
    setFilteredDocs(documentation);
    setFilteredNotes(releaseNotes);
  }, [glossary, documentation, releaseNotes]);

  const handleLoadHelp = async () => {
    setIsFetching(true);
    try {
      await fetchHelp();
      await fetchManual();
    } catch (err) {
      console.error('[HelpBrowser] Error loading help:', err);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredGlossary(glossary);
      setFilteredDocs(documentation);
      setFilteredNotes(releaseNotes);
      return;
    }

    setFilteredGlossary(searchGlossary(query));
    setFilteredDocs(searchDocumentation(query));
    setFilteredNotes(searchReleaseNotes(query));
  };

  const isGlossaryEntry = (item: any): item is GlossaryEntry => {
    return item && 'definition' in item;
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, idx) =>
      regex.test(part) ? <mark key={idx} style={{ backgroundColor: 'yellow' }}>{part}</mark> : part
    );
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography>Loading help data...</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">❓ Help Center</Typography>
        <Button variant="outlined" size="small" onClick={handleLoadHelp} disabled={isFetching}>
          {isFetching ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>

      {error && <Alert severity="error">❌ Error: {error}</Alert>}

      {/* Search Box */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            label="Search Help"
            placeholder="Search glossary, docs, or release notes..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(_e, v) => setActiveTab(v)} sx={{ mb: 2, borderBottom: '1px solid #eee' }}>
        <Tab label={`Glossary (${filteredGlossary.length})`} />
        <Tab label={`Documentation (${filteredDocs.length})`} />
        <Tab label={`Manual (${manual?.chapters.length || 0})`} />
        <Tab label={`Release Notes (${filteredNotes.length})`} />
      </Tabs>

      {/* Glossary Tab */}
      {activeTab === 0 && (
        <Paper>
          {filteredGlossary.length > 0 ? (
            <List>
              {filteredGlossary.map((entry) => (
                <ListItem
                  key={entry.term}
                  button
                  onClick={() => {
                    setSelectedItem(entry);
                    setDetailsOpen(true);
                  }}
                >
                  <ListItemText
                    primary={highlightMatch(entry.term, searchQuery)}
                    secondary={highlightMatch(entry.definition.substring(0, 100), searchQuery) + '...'}
                  />
                  <Chip label={entry.category} size="small" variant="outlined" />
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography>No glossary entries found.</Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* Documentation Tab */}
      {activeTab === 1 && (
        <Paper>
          {filteredDocs.length > 0 ? (
            <List>
              {filteredDocs.map((doc) => (
                <ListItem
                  key={doc.id}
                  button
                  onClick={() => {
                    setSelectedItem(doc);
                    setDetailsOpen(true);
                  }}
                >
                  <ListItemText
                    primary={highlightMatch(doc.title, searchQuery)}
                    secondary={highlightMatch(doc.content.substring(0, 100), searchQuery) + '...'}
                  />
                  <Chip label={doc.category} size="small" variant="outlined" sx={{ ml: 1 }} />
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography>No documentation found.</Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* Manual Tab */}
      {activeTab === 2 && manual && (
        <Paper>
          <Box sx={{ p: 2 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6">{manual.title}</Typography>
              <Typography variant="caption" color="textSecondary">
                Version {manual.version} • Last updated: {new Date(manual.lastUpdated).toLocaleDateString('de-DE')}
              </Typography>
            </Box>
            
            {manual.chapters.map((chapter) => (
              <Accordion key={chapter.id}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {chapter.title}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ bgcolor: '#fafafa' }}>
                  {chapter.sections.map((section, idx) => (
                    <Box key={idx} sx={{ mb: 2 }}>
                      <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600, mt: 1, mb: 0.5 }}>
                        {section.heading}
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                        {section.content}
                      </Typography>
                    </Box>
                  ))}
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </Paper>
      )}

      {/* Release Notes Tab */}
      {activeTab === 3 && (
        <Paper>
          {filteredNotes.length > 0 ? (
            <List>
              {filteredNotes.map((note) => (
                <ListItem
                  key={note.id}
                  button
                  onClick={() => {
                    setSelectedItem(note);
                    setDetailsOpen(true);
                  }}
                >
                  <ListItemText
                    primary={highlightMatch(note.title, searchQuery)}
                    secondary={highlightMatch(note.content.substring(0, 100), searchQuery) + '...'}
                  />
                  <Chip label={note.category} size="small" variant="outlined" sx={{ ml: 1 }} />
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography>No release notes found.</Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {isGlossaryEntry(selectedItem) ? selectedItem?.term : selectedItem?.title}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {isGlossaryEntry(selectedItem) && (
            <>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Definition
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                {selectedItem.definition}
              </Typography>

              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Explanation
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {selectedItem.explanation}
              </Typography>

              {selectedItem.category && (
                <>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Category
                  </Typography>
                  <Chip label={selectedItem.category} size="small" sx={{ mb: 2 }} />
                </>
              )}

              {selectedItem.examples && selectedItem.examples.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Examples
                  </Typography>
                  {selectedItem.examples.map((example, idx) => (
                    <Typography key={idx} variant="body2" sx={{ mb: 1, fontFamily: 'monospace', bgcolor: '#f5f5f5', p: 1 }}>
                      {example}
                    </Typography>
                  ))}
                </>
              )}

              {selectedItem.seeAlso && selectedItem.seeAlso.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    See Also
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selectedItem.seeAlso.map((related, idx) => (
                      <Chip key={idx} label={related} variant="outlined" />
                    ))}
                  </Box>
                </>
              )}
            </>
          )}

          {!isGlossaryEntry(selectedItem) && (
            <>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Content
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {selectedItem?.content}
              </Typography>

              {selectedItem?.category && (
                <>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Category
                  </Typography>
                  <Chip label={selectedItem.category} size="small" sx={{ mb: 2 }} />
                </>
              )}

              {selectedItem?.source && (
                <>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Source
                  </Typography>
                  <Typography variant="body2">{selectedItem.source}</Typography>
                </>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
