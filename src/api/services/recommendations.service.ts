/**
 * Recommendations Service
 * Manages loading, filtering, and serving technical audit recommendations
 * 
 * @version 0.37.0
 * @phase 43B
 */

import fs from 'fs';
import path from 'path';
import { RecommendationDTO, RecommendationSearchQuery } from '../dtos/technical-audit.dto.js';

export class RecommendationsService {
  private recommendationsFile: string;
  private recommendations: RecommendationDTO[] = [];
  private lastLoaded: Date | null = null;

  constructor() {
    const possiblePaths = [
      path.join(process.cwd(), 'data', 'recommendations.json'),
      path.join(process.cwd(), 'recommendations.json'),
      path.join(process.cwd(), '../recommendations.json'),
    ];
    this.recommendationsFile = possiblePaths[0];
    this.loadRecommendations();
  }

  private loadRecommendations(): void {
    try {
      let filePath = this.recommendationsFile;
      if (!fs.existsSync(filePath)) {
        const altPaths = [
          path.join(process.cwd(), 'recommendations.json'),
          path.join(process.cwd(), '../recommendations.json'),
          path.join(process.cwd(), 'data', 'recommendations.json'),
        ];
        const found = altPaths.find(p => fs.existsSync(p));
        if (!found) {
          console.warn('⚠️  recommendations.json not found, using empty recommendations array');
          this.recommendations = [];
          return;
        }
        filePath = found;
      }

      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      this.recommendations = data.recommendations || [];
      this.lastLoaded = new Date();
      console.log(`✅ Loaded ${this.recommendations.length} recommendations from ${filePath}`);
    } catch (error) {
      console.error('❌ Error loading recommendations:', error);
      this.recommendations = [];
    }
  }

  async getRecommendations(query: RecommendationSearchQuery): Promise<{
    recommendations: RecommendationDTO[];
    total: number;
    byPriority: Record<string, number>;
    byStatus: Record<string, number>;
  }> {
    if (!this.lastLoaded || Date.now() - this.lastLoaded.getTime() > 5 * 60 * 1000) {
      this.loadRecommendations();
    }

    let filtered = [...this.recommendations];

    if (query.priority) {
      filtered = filtered.filter(r => r.priority === query.priority);
    }

    if (query.status) {
      filtered = filtered.filter(r => r.status === query.status);
    }

    filtered.sort((a, b) => {
      const priorityOrder = { 'Sofort erforderlich': 0, 'Kurzfristig empfohlen': 1, 'Mittelfristig empfohlen': 2, 'Optional': 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const total = filtered.length;
    const paginated = filtered.slice(query.offset, query.offset + query.limit);

    const byPriority = {
      'Sofort erforderlich': filtered.filter(r => r.priority === 'Sofort erforderlich').length,
      'Kurzfristig empfohlen': filtered.filter(r => r.priority === 'Kurzfristig empfohlen').length,
      'Mittelfristig empfohlen': filtered.filter(r => r.priority === 'Mittelfristig empfohlen').length,
      'Optional': filtered.filter(r => r.priority === 'Optional').length,
    };

    const byStatus = {
      'open': filtered.filter(r => r.status === 'open').length,
      'in-progress': filtered.filter(r => r.status === 'in-progress').length,
      'completed': filtered.filter(r => r.status === 'completed').length,
    };

    return { recommendations: paginated, total, byPriority, byStatus };
  }

  async getByPriority(priority: string, limit = 10): Promise<RecommendationDTO[]> {
    if (!this.lastLoaded || Date.now() - this.lastLoaded.getTime() > 5 * 60 * 1000) {
      this.loadRecommendations();
    }

    return this.recommendations
      .filter(r => r.priority === priority)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async getByStatus(status: string, limit = 10): Promise<RecommendationDTO[]> {
    if (!this.lastLoaded || Date.now() - this.lastLoaded.getTime() > 5 * 60 * 1000) {
      this.loadRecommendations();
    }

    return this.recommendations
      .filter(r => r.status === status)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async getRecommendationById(id: string): Promise<RecommendationDTO | null> {
    if (!this.lastLoaded || Date.now() - this.lastLoaded.getTime() > 5 * 60 * 1000) {
      this.loadRecommendations();
    }

    return this.recommendations.find(r => r.id === id) || null;
  }

  async getStatistics(): Promise<{
    total: number;
    byPriority: Record<string, number>;
    byStatus: Record<string, number>;
  }> {
    if (!this.lastLoaded || Date.now() - this.lastLoaded.getTime() > 5 * 60 * 1000) {
      this.loadRecommendations();
    }

    return {
      total: this.recommendations.length,
      byPriority: {
        'Sofort erforderlich': this.recommendations.filter(r => r.priority === 'Sofort erforderlich').length,
        'Kurzfristig empfohlen': this.recommendations.filter(r => r.priority === 'Kurzfristig empfohlen').length,
        'Mittelfristig empfohlen': this.recommendations.filter(r => r.priority === 'Mittelfristig empfohlen').length,
        'Optional': this.recommendations.filter(r => r.priority === 'Optional').length,
      },
      byStatus: {
        'open': this.recommendations.filter(r => r.status === 'open').length,
        'in-progress': this.recommendations.filter(r => r.status === 'in-progress').length,
        'completed': this.recommendations.filter(r => r.status === 'completed').length,
      },
    };
  }
}

export const recommendationsService = new RecommendationsService();
