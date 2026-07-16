/**
 * Technical Test Findings & Recommendations DTOs
 * Data Transfer Objects for API responses
 * 
 * @version 0.37.0
 * @phase 43
 */

import { z } from 'zod';

// ============================================================================
// FINDINGS DTOs
// ============================================================================

/**
 * Severity levels for findings
 */
export const SeveritySchema = z.enum(['critical', 'high', 'medium', 'low']);
export type Severity = z.infer<typeof SeveritySchema>;

/**
 * Categories of findings
 */
export const CategorySchema = z.enum([
  'Performance',
  'Security',
  'Availability',
  'Configuration',
  'Architecture',
  'Operations',
  'DataManagement',
  'Scalability',
] as const);
export type Category = z.infer<typeof CategorySchema>;

/**
 * Individual Finding DTO
 */
export const FindingDTOSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(5).max(200),
  severity: SeveritySchema,
  category: CategorySchema,
  risk: z.string().min(10).max(500),
  description: z.string().min(20).max(2000),
  recommendation: z.string().min(20).max(2000),
  timestamp: z.string().datetime(),
  impactedComponent: z.string().optional(),
  details: z.record(z.string(), z.unknown()).optional(),
});

export type FindingDTO = z.infer<typeof FindingDTOSchema>;

/**
 * Findings List Response
 */
export const FindingsListResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    findings: z.array(FindingDTOSchema),
    total: z.number().nonnegative(),
    filtered: z.number().nonnegative(),
    severityBreakdown: z.object({
      critical: z.number().nonnegative(),
      high: z.number().nonnegative(),
      medium: z.number().nonnegative(),
      low: z.number().nonnegative(),
    }),
  }),
});

export type FindingsListResponse = z.infer<typeof FindingsListResponseSchema>;

/**
 * Finding Search Query Parameters
 */
export const FindingSearchQuerySchema = z.object({
  q: z.string().optional(),
  severity: z.enum(['critical', 'high', 'medium', 'low'] as const).optional(),
  category: CategorySchema.optional(),
  since: z.string().datetime().optional(),
  until: z.string().datetime().optional(),
  limit: z.number().int().positive().max(100).default(10),
  offset: z.number().int().nonnegative().default(0),
  component: z.string().optional(),
});

export type FindingSearchQuery = z.infer<typeof FindingSearchQuerySchema>;

// ============================================================================
// RECOMMENDATIONS DTOs
// ============================================================================

/**
 * Priority levels for recommendations
 */
export const PrioritySchema = z.enum([
  'Sofort erforderlich',
  'Kurzfristig empfohlen',
  'Mittelfristig empfohlen',
  'Optional',
] as const);
export type Priority = z.infer<typeof PrioritySchema>;

/**
 * Status of a recommendation
 */
export const RecommendationStatusSchema = z.enum(['open', 'in-progress', 'completed'] as const);
export type RecommendationStatus = z.infer<typeof RecommendationStatusSchema>;

/**
 * Individual Recommendation DTO
 */
export const RecommendationDTOSchema = z.object({
  id: z.string().uuid(),
  priority: PrioritySchema,
  title: z.string().min(5).max(200),
  recommendation: z.string().min(20).max(2000),
  cause: z.string().min(10).max(500),
  risk: z.string().min(10).max(500),
  estimatedEffort: z.string().optional(),
  relatedFindingIds: z.array(z.string().uuid()),
  status: RecommendationStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  assignedTo: z.string().email().optional(),
  targetDate: z.string().datetime().optional(),
});

export type RecommendationDTO = z.infer<typeof RecommendationDTOSchema>;

/**
 * Recommendations List Response
 */
export const RecommendationsListResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    recommendations: z.array(RecommendationDTOSchema),
    total: z.number().nonnegative(),
    byPriority: z.object({
      'Sofort erforderlich': z.number().nonnegative(),
      'Kurzfristig empfohlen': z.number().nonnegative(),
      'Mittelfristig empfohlen': z.number().nonnegative(),
      'Optional': z.number().nonnegative(),
    }),
    byStatus: z.object({
      open: z.number().nonnegative(),
      'in-progress': z.number().nonnegative(),
      completed: z.number().nonnegative(),
    }),
  }),
});

export type RecommendationsListResponse = z.infer<typeof RecommendationsListResponseSchema>;

/**
 * Recommendation Search Query Parameters
 */
export const RecommendationSearchQuerySchema = z.object({
  priority: PrioritySchema.optional(),
  status: RecommendationStatusSchema.optional(),
  limit: z.number().int().positive().max(100).default(10),
  offset: z.number().int().nonnegative().default(0),
});

export type RecommendationSearchQuery = z.infer<typeof RecommendationSearchQuerySchema>;

// ============================================================================
// ERROR RESPONSES
// ============================================================================

export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.string().optional(),
  }),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Severity breakdown statistics
 */
export interface SeverityBreakdown {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

/**
 * Recommendation summary
 */
export interface RecommendationSummary {
  open: number;
  inProgress: number;
  completed: number;
  total: number;
  highPriority: number;
}

/**
 * Technical audit report summary
 */
export interface TechnicalAuditSummary {
  version: string;
  generatedAt: string;
  totalFindings: number;
  severityBreakdown: SeverityBreakdown;
  totalRecommendations: number;
  systemHealth: {
    percentHealthy: number;
    status: 'healthy' | 'warning' | 'critical';
  };
}
