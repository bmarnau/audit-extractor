/**
 * API Discovery Service
 * 
 * Automatically discovers and analyzes API endpoints from Express application
 * Extracts routes, controllers, methods, parameters, and metadata
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  ApiEndpoint,
  ApiEndpointGroup,
  ApiInventory,
  HttpMethod,
  IApiDiscoveryService,
} from '../api-discovery.types';

/**
 * API Discovery Service
 */
export class ApiDiscoveryService implements IApiDiscoveryService {
  private endpoints: ApiEndpoint[] = [];
  private discoveredAt = new Date().toISOString();

  constructor(
    private projectRoot: string = process.cwd(),
    private projectName: string = 'API Project'
  ) {}

  /**
   * Discover all endpoints from Express application
   */
  async discoverEndpoints(): Promise<ApiEndpoint[]> {
    this.endpoints = [];

    // Get Express app
    const app = this.getExpressApp();
    if (!app) {
      return this.getStaticAnalysisEndpoints();
    }

    // Extract from Express app stack
    const discovered = this.extractFromExpressApp(app);
    this.endpoints.push(...discovered);

    return this.endpoints;
  }

  /**
   * Discover controllers
   */
  async discoverControllers(): Promise<ApiEndpointGroup[]> {
    if (this.endpoints.length === 0) {
      await this.discoverEndpoints();
    }

    const groups = new Map<string, ApiEndpointGroup>();

    for (const endpoint of this.endpoints) {
      const controller = endpoint.controller || 'General';

      if (!groups.has(controller)) {
        groups.set(controller, {
          controller,
          endpoints: [],
        });
      }

      groups.get(controller)!.endpoints.push(endpoint);
    }

    return Array.from(groups.values());
  }

  /**
   * Generate complete API inventory
   */
  async generateInventory(): Promise<ApiInventory> {
    const endpoints = await this.discoverEndpoints();
    const groups = await this.discoverControllers();

    const methodCounts: Record<HttpMethod, number> = {
      GET: 0,
      POST: 0,
      PUT: 0,
      PATCH: 0,
      DELETE: 0,
      HEAD: 0,
      OPTIONS: 0,
    };

    let protectedCount = 0;
    let deprecatedCount = 0;
    let untestedCount = 0;

    for (const endpoint of endpoints) {
      methodCounts[endpoint.method]++;
      if (endpoint.requiresAuth) protectedCount++;
      if (endpoint.deprecated) deprecatedCount++;
      if (!endpoint.hasTests) untestedCount++;
    }

    const inventory: ApiInventory = {
      inventoryId: `API-INV-${Date.now()}`,
      generatedAt: this.discoveredAt,
      projectName: this.projectName,
      totalEndpoints: endpoints.length,
      totalControllers: groups.length,
      methodCounts,
      groups,
      endpoints,
      protectedEndpoints: protectedCount,
      publicEndpoints: endpoints.length - protectedCount,
      deprecatedEndpoints: deprecatedCount,
      untestedEndpoints: untestedCount,
    };

    return inventory;
  }

  /**
   * Export inventory to JSON
   */
  async exportInventory(inventory: ApiInventory, filePath: string): Promise<void> {
    const json = JSON.stringify(inventory, null, 2);
    const dir = path.dirname(filePath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    await fs.promises.writeFile(filePath, json, 'utf-8');
  }

  /**
   * Helper: Get Express app
   */
  private getExpressApp(): any {
    try {
      // Try to require the main app file
      const appPath = path.join(this.projectRoot, 'src', 'app.ts');
      if (fs.existsSync(appPath)) {
        // Note: In real implementation, would use dynamic require
        return null;
      }
    } catch {}

    return null;
  }

  /**
   * Helper: Extract endpoints from Express app
   */
  private extractFromExpressApp(app: any): ApiEndpoint[] {
    const endpoints: ApiEndpoint[] = [];

    if (!app || !app._router) {
      return endpoints;
    }

    const stack = app._router.stack || [];

    for (const layer of stack) {
      if (layer.route) {
        // Direct route
        const path = layer.route.path;
        const methods = Object.keys(layer.route.methods);

        for (const method of methods) {
          endpoints.push(
            this.createEndpoint(
              path,
              method.toUpperCase() as HttpMethod,
              layer.route.stack[0]?.name || 'handler'
            )
          );
        }
      } else if (layer.name === 'router' && layer.handle.stack) {
        // Router middleware
        const prefix = layer.regexp
          .toString()
          .match(/\\\/[^\\]*/)?.[0]
          .replace(/\\\//g, '/');

        for (const sublayer of layer.handle.stack) {
          if (sublayer.route) {
            const path = (prefix || '') + sublayer.route.path;
            const methods = Object.keys(sublayer.route.methods);

            for (const method of methods) {
              endpoints.push(
                this.createEndpoint(
                  path,
                  method.toUpperCase() as HttpMethod,
                  sublayer.route.stack[0]?.name || 'handler'
                )
              );
            }
          }
        }
      }
    }

    return endpoints;
  }

  /**
   * Helper: Get static analysis endpoints from source code
   */
  private getStaticAnalysisEndpoints(): ApiEndpoint[] {
    const endpoints: ApiEndpoint[] = [];

    // Look for route files in multiple locations
    const routesDirs = [
      path.join(this.projectRoot, 'src', 'routes'),
      path.join(this.projectRoot, 'src', 'infrastructure', 'http', 'controllers'),
      path.join(this.projectRoot, 'src', 'infrastructure', 'api', 'routes'),
    ];
    const controllersDir = path.join(this.projectRoot, 'src', 'infrastructure', 'http', 'controllers');

    for (const routesDir of routesDirs) {
      if (fs.existsSync(routesDir)) {
        endpoints.push(...this.extractFromRouteFiles(routesDir));
      }
    }

    if (fs.existsSync(controllersDir)) {
      endpoints.push(...this.extractFromControllerFiles(controllersDir));
    }

    // Remove duplicates
    const seen = new Set<string>();
    return endpoints.filter(endpoint => {
      const key = `${endpoint.method}:${endpoint.path}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Helper: Extract from route files
   */
  private extractFromRouteFiles(routesDir: string): ApiEndpoint[] {
    const endpoints: ApiEndpoint[] = [];

    try {
      const files = fs.readdirSync(routesDir);

      for (const file of files) {
        if (!file.endsWith('.ts') && !file.endsWith('.js')) continue;

        const filePath = path.join(routesDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        // Extract routes using regex patterns
        const patterns = [
          /router\.(get|post|put|patch|delete|head|options)\s*\(\s*['"](.*?)['"],/gi,
          /app\.(get|post|put|patch|delete|head|options)\s*\(\s*['"](.*?)['"],/gi,
        ];

        for (const pattern of patterns) {
          let match;
          while ((match = pattern.exec(content)) !== null) {
            const method = match[1].toUpperCase() as HttpMethod;
            const path = match[2];

            if (path && method) {
              endpoints.push(
                this.createEndpoint(
                  path,
                  method,
                  file.replace(/\.(ts|js)$/, '')
                )
              );
            }
          }
        }
      }
    } catch {}

    return endpoints;
  }

  /**
   * Helper: Extract from controller files
   */
  private extractFromControllerFiles(controllersDir: string): ApiEndpoint[] {
    const endpoints: ApiEndpoint[] = [];

    try {
      const files = fs.readdirSync(controllersDir);

      for (const file of files) {
        if (!file.endsWith('.ts') && !file.endsWith('.js')) continue;

        const filePath = path.join(controllersDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        // Extract decorators @Get(), @Post(), etc.
        const decoratorPattern = /@(Get|Post|Put|Patch|Delete|Head|Options)\s*\(\s*['"](.*?)['"],?\s*\)/gi;

        let match;
        while ((match = decoratorPattern.exec(content)) !== null) {
          const method = match[1].toUpperCase() as HttpMethod;
          const path = match[2];

          if (path && method) {
            // Extract next method name
            const methodPattern = /async\s+(\w+)\s*\(/i;
            const methodMatch = content.substring(match.index).match(methodPattern);

            endpoints.push(
              this.createEndpoint(
                path,
                method,
                file.replace(/Controller\.(ts|js)$/, ''),
                methodMatch?.[1] || 'handler'
              )
            );
          }
        }
      }
    } catch {}

    return endpoints;
  }

  /**
   * Helper: Create endpoint object
   */
  private createEndpoint(
    path: string,
    method: HttpMethod,
    controller: string,
    handler?: string
  ): ApiEndpoint {
    // Extract path parameters
    const pathParams = (path.match(/:[a-zA-Z_]\w*/g) || []).map((p) => p.substring(1));

    // Detect authentication from path
    const requiresAuth =
      !path.includes('/public') &&
      !path.includes('/auth/login') &&
      !path.includes('/auth/register') &&
      !path.includes('/health');

    return {
      endpointId: `EP-${method}-${path}-${Date.now()}`,
      path,
      method,
      name: `${method} ${path}`,
      controller,
      handler: handler || 'handler',
      pathParams,
      queryParams: [],
      requiresAuth,
      isImplemented: true,
      discoveredAt: this.discoveredAt,
    };
  }
}
