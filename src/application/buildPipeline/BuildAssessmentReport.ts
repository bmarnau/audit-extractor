/**
 * BuildAssessmentReport - Komprehensiver Build-Report
 * 
 * Das zentrale Output-Objekt der Build Verification Pipeline.
 * Enthält alle notwendigen Informationen für CI/CD-Entscheidungen.
 */

import { BuildMetrics } from '../../domain/buildPipeline/BuildMetrics';
import { BuildRisk, RiskData } from '../../domain/buildPipeline/BuildRisk';
import { BuildRecommendation, RecommendationData } from '../../domain/buildPipeline/BuildRecommendation';
import { BuildStage } from '../../domain/buildPipeline/BuildStage';

export interface BuildAssessmentReportData {
  buildId: string;
  startTime: Date;
  endTime: Date;
  totalDuration: number; // milliseconds
  status: 'PASSED' | 'FAILED' | 'CANCELLED';
  
  // Test Metrics
  totalTests: number;
  successfulTests: number;
  failedTests: number;
  skippedTests: number;
  testSuccessRate: number; // 0-1
  
  // Issue Metrics
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  
  // Risk Assessment
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  healthScore: number; // 0-100
  buildBlockingIssues: number;
  flakyTests: number;
  
  // Decision
  canBuildPass: boolean;
  buildRecommendation: string;
  
  // Details (can be either objects or data)
  risks: any[];
  recommendations: any[];
  failedTestNames: string[];
  blockingTestNames: string[];
  flakyTestNames: string[];
  affectedComponents: string[];
  
  // Pipeline Info
  completedStages: BuildStage[];
  failedAt?: BuildStage;
  
  // Metadata
  ci: boolean;
  branch?: string;
  commitHash?: string;
  author?: string;
}

export class BuildAssessmentReport {
  readonly buildId: string;
  readonly startTime: Date;
  readonly endTime: Date;
  readonly totalDuration: number;
  readonly status: 'PASSED' | 'FAILED' | 'CANCELLED';
  
  readonly totalTests: number;
  readonly successfulTests: number;
  readonly failedTests: number;
  readonly skippedTests: number;
  readonly testSuccessRate: number;
  
  readonly totalIssues: number;
  readonly criticalIssues: number;
  readonly highIssues: number;
  readonly mediumIssues: number;
  readonly lowIssues: number;
  
  readonly riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  readonly healthScore: number;
  readonly buildBlockingIssues: number;
  readonly flakyTests: number;
  
  readonly canBuildPass: boolean;
  readonly buildRecommendation: string;
  
  readonly risks: any[];
  readonly recommendations: any[];
  readonly failedTestNames: string[];
  readonly blockingTestNames: string[];
  readonly flakyTestNames: string[];
  readonly affectedComponents: string[];
  
  readonly completedStages: BuildStage[];
  readonly failedAt?: BuildStage;
  
  readonly ci: boolean;
  readonly branch?: string;
  readonly commitHash?: string;
  readonly author?: string;

  constructor(data: BuildAssessmentReportData) {
    this.buildId = data.buildId;
    this.startTime = data.startTime;
    this.endTime = data.endTime;
    this.totalDuration = data.totalDuration;
    this.status = data.status;
    
    this.totalTests = data.totalTests;
    this.successfulTests = data.successfulTests;
    this.failedTests = data.failedTests;
    this.skippedTests = data.skippedTests;
    this.testSuccessRate = data.testSuccessRate;
    
    this.totalIssues = data.totalIssues;
    this.criticalIssues = data.criticalIssues;
    this.highIssues = data.highIssues;
    this.mediumIssues = data.mediumIssues;
    this.lowIssues = data.lowIssues;
    
    this.riskLevel = data.riskLevel;
    this.healthScore = data.healthScore;
    this.buildBlockingIssues = data.buildBlockingIssues;
    this.flakyTests = data.flakyTests;
    
    this.canBuildPass = data.canBuildPass;
    this.buildRecommendation = data.buildRecommendation;
    
    this.risks = data.risks;
    this.recommendations = data.recommendations;
    this.failedTestNames = data.failedTestNames;
    this.blockingTestNames = data.blockingTestNames;
    this.flakyTestNames = data.flakyTestNames;
    this.affectedComponents = data.affectedComponents;
    
    this.completedStages = data.completedStages;
    this.failedAt = data.failedAt;
    
    this.ci = data.ci;
    this.branch = data.branch;
    this.commitHash = data.commitHash;
    this.author = data.author;
  }

  /**
   * Gibt Zusammenfassung aus
   */
  getSummary(): string {
    const status = this.canBuildPass ? '✅ PASS' : '❌ FAIL';
    return `Build ${status} | Tests: ${this.successfulTests}/${this.totalTests} | Issues: ${this.totalIssues} | Risk: ${this.riskLevel}`;
  }

  /**
   * Formatiert Report als Markdown
   */
  toMarkdown(): string {
    const lines: string[] = [];
    
    lines.push(`# Build Assessment Report`);
    lines.push(``);
    lines.push(`**Status**: ${this.status === 'PASSED' ? '✅ PASSED' : '❌ FAILED'}`);
    lines.push(`**Build ID**: \`${this.buildId}\``);
    lines.push(`**Duration**: ${this.totalDuration}ms`);
    lines.push(``);
    
    if (this.ci) {
      lines.push(`## CI/CD Context`);
      if (this.branch) lines.push(`- Branch: \`${this.branch}\``);
      if (this.commitHash) lines.push(`- Commit: \`${this.commitHash}\``);
      if (this.author) lines.push(`- Author: ${this.author}`);
      lines.push(``);
    }
    
    lines.push(`## Test Metrics`);
    lines.push(`| Metric | Count | % |`);
    lines.push(`|--------|-------|---|`);
    lines.push(`| Successful | ${this.successfulTests} | ${(this.testSuccessRate * 100).toFixed(1)}% |`);
    lines.push(`| Failed | ${this.failedTests} | ${((1 - this.testSuccessRate) * 100).toFixed(1)}% |`);
    lines.push(`| Skipped | ${this.skippedTests} | - |`);
    lines.push(`| **Total** | **${this.totalTests}** | - |`);
    lines.push(``);
    
    lines.push(`## Issue Summary`);
    lines.push(`| Severity | Count |`);
    lines.push(`|----------|-------|`);
    lines.push(`| Critical | ${this.criticalIssues} |`);
    lines.push(`| High | ${this.highIssues} |`);
    lines.push(`| Medium | ${this.mediumIssues} |`);
    lines.push(`| Low | ${this.lowIssues} |`);
    lines.push(`| **Total** | **${this.totalIssues}** |`);
    lines.push(``);
    
    lines.push(`## Build Assessment`);
    lines.push(`- **Health Score**: ${this.healthScore}/100`);
    lines.push(`- **Risk Level**: ${this.riskLevel}`);
    lines.push(`- **Build-Blocking Issues**: ${this.buildBlockingIssues}`);
    lines.push(`- **Flaky Tests**: ${this.flakyTests}`);
    lines.push(`- **Can Pass**: ${this.canBuildPass ? 'Yes ✅' : 'No ❌'}`);
    lines.push(``);
    
    lines.push(`## Recommendation`);
    lines.push(`${this.buildRecommendation}`);
    lines.push(``);
    
    if (this.risks.length > 0) {
      lines.push(`## Identified Risks (${this.risks.length})`);
      for (const risk of this.risks.slice(0, 10)) {
        lines.push(`- **${risk.category}** (${risk.severity}): ${risk.description}`);
      }
      if (this.risks.length > 10) {
        lines.push(`- ... and ${this.risks.length - 10} more risks`);
      }
      lines.push(``);
    }
    
    if (this.recommendations.length > 0) {
      lines.push(`## Recommendations (${this.recommendations.length})`);
      const sorted = [...this.recommendations].sort((a, b) => b.priority - a.priority);
      for (const rec of sorted.slice(0, 5)) {
        lines.push(`- **[P${rec.priority}]** ${rec.title}`);
        lines.push(`  - ${rec.description}`);
      }
      if (this.recommendations.length > 5) {
        lines.push(`- ... and ${this.recommendations.length - 5} more recommendations`);
      }
      lines.push(``);
    }
    
    lines.push(`## Affected Components`);
    if (this.affectedComponents.length > 0) {
      lines.push(this.affectedComponents.map(c => `- ${c}`).join('\n'));
    } else {
      lines.push(`None`);
    }
    lines.push(``);
    
    lines.push(`## Pipeline Progress`);
    lines.push(`Completed: ${this.completedStages.join(' → ')}`);
    if (this.failedAt) {
      lines.push(`Failed at: ${this.failedAt}`);
    }
    
    return lines.join('\n');
  }

  /**
   * Serialisierung als JSON
   */
  toJSON(): BuildAssessmentReportData {
    return {
      buildId: this.buildId,
      startTime: this.startTime,
      endTime: this.endTime,
      totalDuration: this.totalDuration,
      status: this.status,
      totalTests: this.totalTests,
      successfulTests: this.successfulTests,
      failedTests: this.failedTests,
      skippedTests: this.skippedTests,
      testSuccessRate: this.testSuccessRate,
      totalIssues: this.totalIssues,
      criticalIssues: this.criticalIssues,
      highIssues: this.highIssues,
      mediumIssues: this.mediumIssues,
      lowIssues: this.lowIssues,
      riskLevel: this.riskLevel,
      healthScore: this.healthScore,
      buildBlockingIssues: this.buildBlockingIssues,
      flakyTests: this.flakyTests,
      canBuildPass: this.canBuildPass,
      buildRecommendation: this.buildRecommendation,
      risks: this.risks,
      recommendations: this.recommendations,
      failedTestNames: this.failedTestNames,
      blockingTestNames: this.blockingTestNames,
      flakyTestNames: this.flakyTestNames,
      affectedComponents: this.affectedComponents,
      completedStages: this.completedStages,
      failedAt: this.failedAt,
      ci: this.ci,
      branch: this.branch,
      commitHash: this.commitHash,
      author: this.author
    };
  }
}
