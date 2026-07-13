/**
 * Risk Analysis Types für TestGovernanceFramework
 * Dokumentiert Risiken auf Basis von Testdaten
 */

import { SeverityLevel } from './severity.types';

export interface RiskFactor {
  name: string;
  description: string;
  currentValue: number; // 0-100
  threshold: number;
  trend: 'IMPROVING' | 'STABLE' | 'DEGRADING';
  historicalData?: number[]; // letzte 10 Messwerte
}

export interface RiskMatrix {
  probability: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
  };
  impact: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    CRITICAL: number;
  };
  cells: Array<{
    probabilityLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    impactLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    riskScore: number;
    risks: string[];
  }>;
}

export interface RiskMitigation {
  riskId: string;
  mitigation: string;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  owner: string;
  dueDate: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ACCEPTED';
  evidence?: string[];
}

export interface RiskRegister {
  timestamp: string;
  totalRisks: number;
  openRisks: number;
  riskFactors: RiskFactor[];
  matrix: RiskMatrix;
  mitigations: RiskMitigation[];
  overallRiskLevel: SeverityLevel;
}
