/**
 * BuildStage - Enumeration für Pipeline-Phasen
 * 
 * Definiert die verschiedenen Stages der Build Verification Pipeline
 */

export enum BuildStage {
  // Core Stages
  BUILD_STARTED = 'BUILD_STARTED',
  TEST_DISCOVERY = 'TEST_DISCOVERY',
  TEST_EXECUTION = 'TEST_EXECUTION',
  ISSUE_COLLECTION = 'ISSUE_COLLECTION',
  SEVERITY_EVALUATION = 'SEVERITY_EVALUATION',
  RECOMMENDATION_GENERATION = 'RECOMMENDATION_GENERATION',
  BUILD_ASSESSMENT = 'BUILD_ASSESSMENT',
  BUILD_COMPLETED = 'BUILD_COMPLETED',
  
  // Error States
  BUILD_FAILED = 'BUILD_FAILED',
  BUILD_CANCELLED = 'BUILD_CANCELLED'
}

export interface BuildStageDescription {
  stage: BuildStage;
  name: string;
  description: string;
  order: number;
  isCritical: boolean;
}

export const BUILD_STAGE_METADATA: Record<BuildStage, BuildStageDescription> = {
  [BuildStage.BUILD_STARTED]: {
    stage: BuildStage.BUILD_STARTED,
    name: 'Build Started',
    description: 'Initialisierung des Build-Prozesses',
    order: 1,
    isCritical: true
  },
  [BuildStage.TEST_DISCOVERY]: {
    stage: BuildStage.TEST_DISCOVERY,
    name: 'Test Discovery',
    description: 'Entdeckung aller registrierten Tests',
    order: 2,
    isCritical: true
  },
  [BuildStage.TEST_EXECUTION]: {
    stage: BuildStage.TEST_EXECUTION,
    name: 'Test Execution',
    description: 'Ausführung aller entdeckten Tests',
    order: 3,
    isCritical: true
  },
  [BuildStage.ISSUE_COLLECTION]: {
    stage: BuildStage.ISSUE_COLLECTION,
    name: 'Issue Collection',
    description: 'Sammlung von Issues aus Test-Fehlern',
    order: 4,
    isCritical: true
  },
  [BuildStage.SEVERITY_EVALUATION]: {
    stage: BuildStage.SEVERITY_EVALUATION,
    name: 'Severity Evaluation',
    description: 'Bewertung der Severity von gesammelten Issues',
    order: 5,
    isCritical: true
  },
  [BuildStage.RECOMMENDATION_GENERATION]: {
    stage: BuildStage.RECOMMENDATION_GENERATION,
    name: 'Recommendation Generation',
    description: 'Generierung von Empfehlungen basierend auf Findings',
    order: 6,
    isCritical: false
  },
  [BuildStage.BUILD_ASSESSMENT]: {
    stage: BuildStage.BUILD_ASSESSMENT,
    name: 'Build Assessment',
    description: 'Finale Bewertung: Build Pass/Fail',
    order: 7,
    isCritical: true
  },
  [BuildStage.BUILD_COMPLETED]: {
    stage: BuildStage.BUILD_COMPLETED,
    name: 'Build Completed',
    description: 'Build-Prozess abgeschlossen',
    order: 8,
    isCritical: true
  },
  [BuildStage.BUILD_FAILED]: {
    stage: BuildStage.BUILD_FAILED,
    name: 'Build Failed',
    description: 'Build-Prozess fehlgeschlagen',
    order: 9,
    isCritical: true
  },
  [BuildStage.BUILD_CANCELLED]: {
    stage: BuildStage.BUILD_CANCELLED,
    name: 'Build Cancelled',
    description: 'Build-Prozess abgebrochen',
    order: 10,
    isCritical: false
  }
};
