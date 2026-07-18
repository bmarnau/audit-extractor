/**
 * Management Overview Type Definitions (Backend)
 * 
 * Diese Types werden von ManagementStatusService und Routes verwendet
 * Müssen mit Frontend Types synchronisiert bleiben
 */

export type StatusValueType = 'success' | 'warning' | 'error' | 'info';
export type MaturityStatusType = 'offen' | 'in_arbeit' | 'weitgehend_erfüllt' | 'erfüllt';
export type ReleaseCriterionStatusType = 'erfüllt' | 'nicht_erfüllt' | 'teilweise';
export type RiskPriorityType = 'critical' | 'high' | 'medium' | 'low';
export type ActionStatusType = 'not_started' | 'in_progress' | 'completed';
export type OverallStatusType = 'Development' | 'Candidate' | 'Production Ready' | 'Deprecated';

export interface StatusValue {
  value: string | number;
  status: StatusValueType;
  details?: string;
  source?: string;
  timestamp?: string;
}

export interface MaturityArea {
  area: string;
  status: MaturityStatusType;
  details?: string;
}

export interface ReleaseCriterion {
  name: string;
  status: ReleaseCriterionStatusType;
  details?: string;
}

export interface ManagementRisk {
  title: string;
  description: string;
  priority: RiskPriorityType;
  impact?: string;
  mitigation?: string;
}

export interface ManagementAction {
  title: string;
  description: string;
  target?: string;
  status?: ActionStatusType;
  dueDate?: string;
}

export interface ManagementLink {
  label: string;
  url: string;
  icon?: string;
}

export interface Benefits {
  business: string[];
  technical?: string[];
}

export interface CompactManagementStatus {
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

  summary: {
    text: string;
    overallStatus: OverallStatusType;
  };

  kpis: {
    version: StatusValue;
    releaseStatus: StatusValue;
    build: StatusValue;
    tests: StatusValue;
    maturity: StatusValue;
    criticalRisks: StatusValue;
  };

  maturity: MaturityArea[];

  releaseReadiness: {
    decision: string;
    criteria: ReleaseCriterion[];
  };

  benefits: Benefits;
  risks: ManagementRisk[];
  nextSteps: ManagementAction[];
  links: ManagementLink[];
}

export interface ManagementStatusResponse {
  success: boolean;
  data?: CompactManagementStatus;
  error?: string;
  timestamp: string;
}

export interface PdfExportRequest {
  status: CompactManagementStatus;
  options?: {
    filename?: string;
    includeTimestamp?: boolean;
    paperSize?: 'a4' | 'letter';
  };
}
