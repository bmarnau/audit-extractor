/**
 * BuildRecommendation - Value Object für Empfehlungen
 * 
 * Stellt Handlungsempfehlungen basierend auf Build-Analyseergebnissen dar
 */

export enum RecommendationType {
  INVESTIGATE = 'INVESTIGATE',
  FIX_BEFORE_MERGE = 'FIX_BEFORE_MERGE',
  MONITOR = 'MONITOR',
  DOCUMENT = 'DOCUMENT',
  DEPRECATE = 'DEPRECATE',
  OPTIMIZE = 'OPTIMIZE',
  ADD_TESTS = 'ADD_TESTS',
  REFACTOR = 'REFACTOR',
  SKIP_BUILD = 'SKIP_BUILD',
  APPROVE_BUILD = 'APPROVE_BUILD'
}

export interface RecommendationData {
  id: string;
  type: RecommendationType;
  priority: number; // 1-10
  title: string;
  description: string;
  affectedComponent: string;
  actionItems: string[];
  estimatedEffort: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: Date;
}

export class BuildRecommendation {
  readonly id: string;
  readonly type: RecommendationType;
  readonly priority: number;
  readonly title: string;
  readonly description: string;
  readonly affectedComponent: string;
  readonly actionItems: string[];
  readonly estimatedEffort: 'LOW' | 'MEDIUM' | 'HIGH';
  readonly createdAt: Date;

  constructor(data: RecommendationData) {
    if (data.priority < 1 || data.priority > 10) {
      throw new Error('Priority must be between 1 and 10');
    }
    this.id = data.id;
    this.type = data.type;
    this.priority = data.priority;
    this.title = data.title;
    this.description = data.description;
    this.affectedComponent = data.affectedComponent;
    this.actionItems = [...data.actionItems];
    this.estimatedEffort = data.estimatedEffort;
    this.createdAt = data.createdAt;
  }

  /**
   * Bestimmt ob Recommendation blockierend ist
   */
  isBlocking(): boolean {
    return (
      this.type === RecommendationType.FIX_BEFORE_MERGE ||
      this.type === RecommendationType.SKIP_BUILD
    );
  }

  /**
   * Gibt Urgency Score zurück (0-100)
   */
  getUrgencyScore(): number {
    const baseScore = this.priority * 10;
    const typeMultiplier: Record<RecommendationType, number> = {
      [RecommendationType.FIX_BEFORE_MERGE]: 1.5,
      [RecommendationType.SKIP_BUILD]: 1.8,
      [RecommendationType.INVESTIGATE]: 1.0,
      [RecommendationType.MONITOR]: 0.7,
      [RecommendationType.DOCUMENT]: 0.5,
      [RecommendationType.DEPRECATE]: 0.6,
      [RecommendationType.OPTIMIZE]: 0.8,
      [RecommendationType.ADD_TESTS]: 1.1,
      [RecommendationType.REFACTOR]: 0.9,
      [RecommendationType.APPROVE_BUILD]: 0.1
    };

    return Math.min(100, baseScore * typeMultiplier[this.type]);
  }

  /**
   * Serialisierung
   */
  toJSON(): RecommendationData {
    return {
      id: this.id,
      type: this.type,
      priority: this.priority,
      title: this.title,
      description: this.description,
      affectedComponent: this.affectedComponent,
      actionItems: [...this.actionItems],
      estimatedEffort: this.estimatedEffort,
      createdAt: this.createdAt
    };
  }
}
