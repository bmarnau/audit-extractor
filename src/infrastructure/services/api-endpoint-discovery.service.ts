/**
 * ApiEndpointDiscoveryService
 * Scannt automatisch Express Routes und Controller um eine API-Inventur zu erzeugen
 * Nutzt Reflection und AST-Analyse für Router-Scanning
 */

import * as fs from 'fs';
import * as path from 'path';

export interface ApiEndpoint {
  route: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD';
  controller: string;
  handler: string;
  requiresAuth: boolean;
  description: string;
  params?: Record<string, string>;
  middleware: string[];
}

export interface ApiInventory {
  timestamp: string;
  version: string;
  totalEndpoints: number;
  endpoints: ApiEndpoint[];
  summary: {
    byMethod: Record<string, number>;
    byPath: Record<string, number>;
    protectedCount: number;
    publicCount: number;
  };
}

export class ApiEndpointDiscoveryService {
  private projectRoot: string;
  private endpoints: ApiEndpoint[] = [];

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  /**
   * Führt komplette API-Entdeckung durch
   */
  async discover(): Promise<ApiInventory> {
    this.endpoints = [];

    // Scanne Route-Dateien
    await this.scanRoutes();

    // Scanne Presentation Layer Routes
    await this.scanPresentationRoutes();

    return this.generateInventory();
  }

  /**
   * Scannt Infrastruktur API Routes
   */
  private async scanRoutes(): Promise<void> {
    const routesDir = path.join(this.projectRoot, 'src/infrastructure/api/routes');

    if (!fs.existsSync(routesDir)) {
      return;
    }

    const files = fs.readdirSync(routesDir).filter((f) => f.endsWith('.ts'));

    for (const file of files) {
      const filePath = path.join(routesDir, file);
      await this.analyzeRouteFile(filePath, file);
    }
  }

  /**
   * Scannt Presentation Layer Routes
   */
  private async scanPresentationRoutes(): Promise<void> {
    const presentationDir = path.join(this.projectRoot, 'src/presentation');

    if (!fs.existsSync(presentationDir)) {
      return;
    }

    const files = fs
      .readdirSync(presentationDir)
      .filter((f) => f.endsWith('Routes.ts'));

    for (const file of files) {
      const filePath = path.join(presentationDir, file);
      await this.analyzeRouteFile(filePath, file);
    }
  }

  /**
   * Analysiert eine Route-Datei mit Regex
   */
  private async analyzeRouteFile(filePath: string, fileName: string): Promise<void> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const controllerName = fileName.replace('.ts', '');

    // Regex Patterns für verschiedene Route-Definitionen
    const patterns = [
      // router.get('/path', handler)
      /router\.(get|post|put|delete|patch|head)\s*\(\s*['"]([^'"]+)['"]\s*,.*?\)/g,
      // app.get('/path', handler)
      /app\.(get|post|put|delete|patch|head)\s*\(\s*['"]([^'"]+)['"]\s*,.*?\)/g,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const method = match[1].toUpperCase() as ApiEndpoint['method'];
        let route = match[2];

        // Bestimme den Mount Path basierend auf der Datei
        const basePath = this.getBasePath(fileName);
        route = basePath + route;

        // Prüfe auf Auth Middleware
        const requiresAuth = this.checkAuthRequirement(content, match[0]);

        // Prüfe auf verwendete Middleware
        const middleware = this.extractMiddleware(content, match[0]);

        this.endpoints.push({
          route,
          method,
          controller: controllerName,
          handler: this.extractHandlerName(match[0]),
          requiresAuth,
          description: this.extractDescription(content, match[0]),
          middleware,
        });
      }
    }
  }

  /**
   * Bestimmt den Base Path basierend auf Dateiname
   */
  private getBasePath(fileName: string): string {
    const pathMap: Record<string, string> = {
      'config.ts': '/api/config',
      'audit.ts': '/api/audit',
      'help.ts': '/api/help',
      'logs.ts': '/api/logs',
      'backup.ts': '/api/backup',
      'extract-phase14.ts': '/api/extract',
      'jobs.ts': '/api/jobs',
      'job-structure.ts': '/api/job-structure',
      'RevisionRoutes.ts': '/api/revision',
      'SchemaExtractionRoutes.ts': '/api/schema',
    };

    return pathMap[fileName] || '/api';
  }

  /**
   * Prüft ob Auth erforderlich ist
   */
  private checkAuthRequirement(content: string, routeDefinition: string): boolean {
    const authPatterns = [
      /requireAuth/,
      /authenticate/,
      /middleware.*auth/i,
      /verifyToken/,
      /passport/,
    ];

    // Finde die nächsten 200 Zeichen nach der Route
    const index = content.indexOf(routeDefinition);
    const context = content.substring(index, index + 500);

    return authPatterns.some((p) => p.test(context));
  }

  /**
   * Extrahiert Middleware Namen
   */
  private extractMiddleware(_content: string, routeDefinition: string): string[] {
    const middleware: string[] = [];
    const middlewarePattern = /(?:,\s*)?([a-zA-Z]+)(?:\s*,|\s*\))/g;

    let match;
    while ((match = middlewarePattern.exec(routeDefinition)) !== null) {
      const name = match[1];
      if (
        name !== 'req' &&
        name !== 'res' &&
        name !== 'next' &&
        name !== 'error'
      ) {
        middleware.push(name);
      }
    }

    return [...new Set(middleware)]; // Deduplizierung
  }

  /**
   * Extrahiert Handler Namen
   */
  private extractHandlerName(routeDefinition: string): string {
    const match = routeDefinition.match(
      /router\.\w+\([^,]+,\s*([a-zA-Z_$][a-zA-Z0-9_$]*)/
    );
    return match ? match[1] : 'anonymous';
  }

  /**
   * Extrahiert Beschreibung aus JSDoc oder Kommentaren
   */
  private extractDescription(
    content: string,
    routeDefinition: string
  ): string {
    const index = content.indexOf(routeDefinition);
    const before = content.substring(Math.max(0, index - 300), index);

    // Suche nach JSDoc
    const docMatch = before.match(/\/\*\*([^*]|\*(?!\/))*\*\//s);
    if (docMatch) {
      return docMatch[0]
        .replace(/\/\*\*|\*\//g, '')
        .replace(/\*/g, '')
        .trim()
        .substring(0, 100);
    }

    // Suche nach Inline Comment
    const commentMatch = before.match(/\/\/(.+?)$/m);
    if (commentMatch) {
      return commentMatch[1].trim().substring(0, 100);
    }

    return 'No description';
  }

  /**
   * Generiert API Inventur
   */
  private generateInventory(): ApiInventory {
    const byMethod: Record<string, number> = {};
    const byPath: Record<string, number> = {};
    let protectedCount = 0;
    let publicCount = 0;

    for (const endpoint of this.endpoints) {
      // Count by method
      byMethod[endpoint.method] = (byMethod[endpoint.method] || 0) + 1;

      // Count by path
      const basePath = endpoint.route.split('/').slice(0, 3).join('/');
      byPath[basePath] = (byPath[basePath] || 0) + 1;

      // Count auth
      if (endpoint.requiresAuth) {
        protectedCount++;
      } else {
        publicCount++;
      }
    }

    return {
      timestamp: new Date().toISOString(),
      version: this.getPackageVersion(),
      totalEndpoints: this.endpoints.length,
      endpoints: this.endpoints.sort((a, b) => a.route.localeCompare(b.route)),
      summary: {
        byMethod,
        byPath,
        protectedCount,
        publicCount,
      },
    };
  }

  /**
   * Liest Package Version
   */
  private getPackageVersion(): string {
    try {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(this.projectRoot, 'package.json'), 'utf-8')
      );
      return packageJson.version || '0.0.0';
    } catch {
      return '0.0.0';
    }
  }

  /**
   * Exportiert Inventur als JSON
   */
  async exportToJson(outputPath: string): Promise<void> {
    const inventory = await this.discover();
    const dir = path.dirname(outputPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(inventory, null, 2));
    console.log(`✅ API Inventur exportiert: ${outputPath}`);
  }
}
