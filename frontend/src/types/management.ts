/**
 * Management Overview Type Definitions
 * 
 * Datenmodell für kompakte Managementübersicht
 * Verwendet von ManagementPage und PDF-Export
 */

/**
 * Simple Status Value with icon and details
 */
export interface StatusValue {
  value: string | number;
  status: 'success' | 'warning' | 'error' | 'info';
  details?: string;
  source?: string;
  timestamp?: string;
}

/**
 * Maturity Area Assessment
 */
export interface MaturityArea {
  area: string;
  status: 'offen' | 'in_arbeit' | 'weitgehend_erfüllt' | 'erfüllt';
  details?: string;
}

/**
 * Release Readiness Criterion
 */
export interface ReleaseCriterion {
  name: string;
  status: 'erfüllt' | 'nicht_erfüllt' | 'teilweise';
  details?: string;
}

/**
 * Management Risk
 */
export interface ManagementRisk {
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  impact?: string;
  mitigation?: string;
}

/**
 * Management Action/Next Step
 */
export interface ManagementAction {
  title: string;
  description: string;
  target?: string;
  status?: 'not_started' | 'in_progress' | 'completed';
  dueDate?: string;
}

/**
 * Management Link
 */
export interface ManagementLink {
  label: string;
  url: string;
  icon?: string;
}

/**
 * Benefits Group
 */
export interface Benefits {
  business: string[];
  technical?: string[];
}

/**
 * Complete Compact Management Status
 * 
 * Single source of truth für Management Overview
 * Wird von Web-UI und PDF-Export verwendet
 */
export interface CompactManagementStatus {
  // Project basics
  project: {
    productName: string;
    shortDescription: string;
    version: string;
    phase: string;
    gitCommit: string;
    gitBranch: string;
    releaseStatus: string;
    updatedAt: string;
  };

  // Auto-generated summary
  summary: {
    text: string;
    overallStatus: 'Development' | 'Candidate' | 'Production Ready' | 'Deprecated';
  };

  // 6 KPI cards
  kpis: {
    version: StatusValue;
    releaseStatus: StatusValue;
    build: StatusValue;
    tests: StatusValue;
    maturity: StatusValue;
    criticalRisks: StatusValue;
  };

  // Maturity areas (max 6)
  maturity: MaturityArea[];

  // Release readiness
  releaseReadiness: {
    decision: string;
    criteria: ReleaseCriterion[];
  };

  // Business value
  benefits: Benefits;

  // Risks (max 3)
  risks: ManagementRisk[];

  // Next steps (max 3)
  nextSteps: ManagementAction[];

  // Links to details
  links: ManagementLink[];
}

/**
 * Management Status Request/Response from API
 */
export interface ManagementStatusResponse {
  success: boolean;
  data?: CompactManagementStatus;
  error?: string;
  timestamp: string;
}

/**
 * PDF Export Options
 */
export interface PdfExportOptions {
  filename?: string;
  includeTimestamp?: boolean;
  paperSize?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
}
