/**
 * Date Formatting Utilities
 * Extracted from multiple components to eliminate duplication
 * Used by: DiffViewer, RunHistoryViewer, SchemaListComponent, VersionHistoryComponent
 */

/**
 * Format date with full datetime (German locale)
 * Used by: DiffViewer.tsx, RunHistoryViewer.tsx
 */
export const formatDateFull = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

/**
 * Format date only (German locale, no time)
 * Used by: SchemaListComponent.tsx
 */
export const formatDateOnly = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('de-DE');
};

/**
 * Format date with time (browser locale)
 * Used by: VersionHistoryComponent.tsx
 */
export const formatDateWithTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};
