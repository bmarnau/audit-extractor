/**
 * Report Viewer DTOs
 * Data structures for technical audit report display
 * 
 * @version 0.37.0
 * @phase 43C
 */

import { z } from 'zod';

/**
 * Severity color mapping
 */
export const SeverityColorMap = {
  critical: '#d32f2f',  // Red
  high: '#f57c00',      // Orange
  medium: '#fbc02d',    // Yellow
  low: '#388e3c',       // Green
};

/**
 * Priority color mapping
 */
export const PriorityColorMap = {
  'Sofort erforderlich': '#d32f2f',          // Red
  'Kurzfristig empfohlen': '#f57c00',        // Orange
  'Mittelfristig empfohlen': '#fbc02d',      // Yellow
  'Optional': '#388e3c',                     // Green
};

/**
 * Status color mapping
 */
export const StatusColorMap = {
  'open': '#d32f2f',           // Red
  'in-progress': '#f57c00',    // Orange
  'completed': '#388e3c',      // Green
};

/**
 * Report summary for dashboard
 */
export const ReportSummarySchema = z.object({
  generatedAt: z.string().datetime(),
  totalFindings: z.number().nonnegative(),
  totalRecommendations: z.number().nonnegative(),
  criticalFindings: z.number().nonnegative(),
  highFindings: z.number().nonnegative(),
  completedRecommendations: z.number().nonnegative(),
  inProgressRecommendations: z.number().nonnegative(),
  openRecommendations: z.number().nonnegative(),
  healthStatus: z.union([z.literal('critical'), z.literal('warning'), z.literal('healthy')]),
});

export type ReportSummary = z.infer<typeof ReportSummarySchema>;

/**
 * Detailed technical report
 */
export const TechnicalReportSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  generatedAt: z.string().datetime(),
  summary: ReportSummarySchema,
  sections: z.array(z.object({
    id: z.string(),
    title: z.string(),
    category: z.string(),
    findings: z.array(z.record(z.string(), z.unknown())),
    recommendations: z.array(z.record(z.string(), z.unknown())),
  })),
  metadata: z.object({
    version: z.string(),
    phase: z.string(),
    environment: z.string().optional(),
  }),
});

export type TechnicalReport = z.infer<typeof TechnicalReportSchema>;

/**
 * Finding item for report display
 */
export const ReportFindingItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  category: z.string(),
  description: z.string(),
  recommendation: z.string(),
  impactedComponent: z.string().optional(),
  severityColor: z.string().optional(),
});

export type ReportFindingItem = z.infer<typeof ReportFindingItemSchema>;

/**
 * Recommendation item for report display
 */
export const ReportRecommendationItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  priority: z.string(),
  status: z.enum(['open', 'in-progress', 'completed']),
  recommendation: z.string(),
  estimatedEffort: z.string().optional(),
  relatedFindingIds: z.array(z.string().uuid()),
  priorityColor: z.string().optional(),
  statusColor: z.string().optional(),
});

export type ReportRecommendationItem = z.infer<typeof ReportRecommendationItemSchema>;
