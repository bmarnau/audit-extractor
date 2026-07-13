/**
 * Component Scanner - AST-basierte Komponentenerkennung
 *
 * Scannt das gesamte Codebase und identifiziert testbare Komponenten:
 * - API Endpoints (Express/Fastify routes)
 * - Controller Classes
 * - Services
 * - Repositories
 * - React Pages/Components
 */

import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

export interface ComponentMetadata {
  componentId: string;
  componentType: 'endpoint' | 'controller' | 'service' | 'repository' | 'page' | 'component';
  location: {
    filePath: string;
    lineNumber: number;
    columnNumber: number;
  };
  name: string;
  description?: string;
  dependencies: string[];
  testCoverageStatus: 'uncovered' | 'partial' | 'covered';
  methods?: string[];
  props?: string[]; // for React components
}

export interface ComponentInventory {
  generatedAt: Date;
  totalComponents: number;
  byType: Record<string, number>;
  components: ComponentMetadata[];
}

export class ComponentScanner {
  private sourceRoot: string;
  private components: ComponentMetadata[] = [];
  private sourceFiles: Map<string, string> = new Map();
  private idCounter: number = 0;

  constructor(sourceRoot: string = './src') {
    this.sourceRoot = sourceRoot;
  }

  /**
   * Scane das gesamte Verzeichnis für Komponenten
   */
  async scanAll(): Promise<ComponentInventory> {
    console.log(`🔍 Scanning source code at: ${this.sourceRoot}`);

    // Phase 1: Load all source files
    this.loadSourceFiles();

    // Phase 2: Parse TypeScript files
    console.log(`📄 Found ${this.sourceFiles.size} source files`);

    for (const [filePath, sourceCode] of this.sourceFiles) {
      this.scanFile(filePath, sourceCode);
    }

    // Phase 3: Generate component inventory
    const inventory = this.generateInventory();

    console.log(`✅ Discovery complete: ${inventory.totalComponents} components found`);

    return inventory;
  }

  /**
   * Load all source files from directory
   */
  private loadSourceFiles(): void {
    const walk = (dir: string) => {
      const files = fs.readdirSync(dir);

      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          // Skip node_modules, dist, coverage
          if (!['node_modules', 'dist', 'coverage', '.git'].includes(file)) {
            walk(filePath);
          }
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
          const sourceCode = fs.readFileSync(filePath, 'utf-8');
          this.sourceFiles.set(filePath, sourceCode);
        }
      });
    };

    walk(this.sourceRoot);
  }

  /**
   * Scan individual file for components
   */
  private scanFile(filePath: string, sourceCode: string): void {
    try {
      const sourceFile = ts.createSourceFile(
        filePath,
        sourceCode,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TS
      );

      this.visitNode(sourceFile, filePath, sourceCode);
    } catch (error) {
      console.warn(`⚠️  Error scanning ${filePath}:`, (error as Error).message);
    }
  }

  /**
   * Recursively visit AST nodes
   */
  private visitNode(node: ts.Node, filePath: string, sourceCode: string): void {
    // Check for class declarations
    if (ts.isClassDeclaration(node)) {
      this.processClassDeclaration(node, filePath, sourceCode);
    }

    // Check for interface declarations (for React props)
    if (ts.isInterfaceDeclaration(node)) {
      this.processInterfaceDeclaration(node, filePath, sourceCode);
    }

    // Check for function declarations (React components, route handlers)
    if (ts.isFunctionDeclaration(node)) {
      this.processFunctionDeclaration(node, filePath, sourceCode);
    }

    // Check for variable declarations (React components, route definitions)
    if (ts.isVariableDeclaration(node)) {
      this.processVariableDeclaration(node, filePath, sourceCode);
    }

    // Recurse
    ts.forEachChild(node, child => this.visitNode(child, filePath, sourceCode));
  }

  /**
   * Process class declarations (Controllers, Services, Repositories)
   */
  private processClassDeclaration(node: ts.ClassDeclaration, filePath: string, sourceCode: string): void {
    const className = node.name?.getText() || 'Unknown';
    const lineNumber = ts.getLineAndCharacterOfPosition(ts.createSourceFile(filePath, sourceCode, ts.ScriptTarget.Latest, true), node.getStart()).line + 1;

    // Determine component type from class name
    let componentType: ComponentMetadata['componentType'] = 'service';

    if (className.endsWith('Controller')) {
      componentType = 'controller';
    } else if (className.endsWith('Repository')) {
      componentType = 'repository';
    } else if (className.endsWith('Service')) {
      componentType = 'service';
    }

    // Extract methods
    const methods: string[] = [];
    node.members.forEach(member => {
      if (ts.isMethodDeclaration(member)) {
        methods.push(member.name?.getText() || 'unknown');
      }
    });

    // Extract dependencies (constructor parameters)
    const dependencies: string[] = [];
    node.members.forEach(member => {
      if (ts.isConstructorDeclaration(member)) {
        member.parameters.forEach(param => {
          dependencies.push(param.type?.getText() || param.name?.getText() || 'unknown');
        });
      }
    });

    const component: ComponentMetadata = {
      componentId: `${componentType}_${this.idCounter++}`,
      componentType,
      location: {
        filePath: this.normalizeFilePath(filePath),
        lineNumber,
        columnNumber: 0,
      },
      name: className,
      dependencies,
      testCoverageStatus: 'uncovered',
      methods,
    };

    this.components.push(component);
    console.log(`  📦 Found ${componentType}: ${className}`);
  }

  /**
   * Process interface declarations (React props)
   */
  private processInterfaceDeclaration(node: ts.InterfaceDeclaration, _filePath: string, _sourceCode: string): void {
    const interfaceName = node.name.getText() || 'Unknown';

    // Skip if not a Props interface
    if (!interfaceName.includes('Props')) {
      return;
    }

    // Extract props
    const props: string[] = [];
    node.members.forEach(member => {
      if (ts.isPropertySignature(member)) {
        props.push(member.name?.getText() || 'unknown');
      }
    });

    // This will be linked later during component discovery
    // Props: ${props.join(', ')} 
    // Note: Interface detection for future enhancement
  }

  /**
   * Process function declarations (React components, route handlers)
   */
  private processFunctionDeclaration(node: ts.FunctionDeclaration, filePath: string, sourceCode: string): void {
    const functionName = node.name?.getText() || 'Unknown';
    const lineNumber = ts.getLineAndCharacterOfPosition(ts.createSourceFile(filePath, sourceCode, ts.ScriptTarget.Latest, true), node.getStart()).line + 1;

    // Detect React component (PascalCase and returns JSX)
    const isReactComponent = /^[A-Z]/.test(functionName) && this.hasJSXReturn(node);

    if (isReactComponent) {
      // Determine if it's a page or component
      const isPage = filePath.includes('/pages/') || filePath.includes('/pages\\');
      const componentType: ComponentMetadata['componentType'] = isPage ? 'page' : 'component';

      const component: ComponentMetadata = {
        componentId: `${componentType}_${this.idCounter++}`,
        componentType,
        location: {
          filePath: this.normalizeFilePath(filePath),
          lineNumber,
          columnNumber: 0,
        },
        name: functionName,
        dependencies: [],
        testCoverageStatus: 'uncovered',
      };

      this.components.push(component);
      console.log(`  ⚛️  Found ${componentType}: ${functionName}`);
    }
  }

  /**
   * Process variable declarations (React components as const, route definitions)
   */
  private processVariableDeclaration(node: ts.VariableDeclaration, filePath: string, sourceCode: string): void {
    const varName = node.name.getText() || 'Unknown';

    // Check if it's a React component (assigned an arrow function with JSX)
    if (node.initializer && ts.isArrowFunction(node.initializer)) {
      const arrowFunc = node.initializer as ts.ArrowFunction;
      const isReactComponent = /^[A-Z]/.test(varName) && this.hasJSXReturn(arrowFunc);

      if (isReactComponent) {
        const lineNumber = ts.getLineAndCharacterOfPosition(ts.createSourceFile(filePath, sourceCode, ts.ScriptTarget.Latest, true), node.getStart()).line + 1;
        const isPage = filePath.includes('/pages/') || filePath.includes('/pages\\');
        const componentType: ComponentMetadata['componentType'] = isPage ? 'page' : 'component';

        const component: ComponentMetadata = {
          componentId: `${componentType}_${this.idCounter++}`,
          componentType,
          location: {
            filePath: this.normalizeFilePath(filePath),
            lineNumber,
            columnNumber: 0,
          },
          name: varName,
          dependencies: [],
          testCoverageStatus: 'uncovered',
        };

        this.components.push(component);
        console.log(`  ⚛️  Found ${componentType}: ${varName}`);
      }
    }

    // Check if it's an API route definition (express/fastify)
    if (node.initializer && ts.isCallExpression(node.initializer)) {
      const callExpr = node.initializer as ts.CallExpression;
      const callText = callExpr.expression.getText();

      if (callText.includes('router.') || callText.includes('app.')) {
        const routeType = this.extractRouteType(callText); // 'get', 'post', etc.

        if (routeType) {
          const lineNumber = ts.getLineAndCharacterOfPosition(ts.createSourceFile(filePath, sourceCode, ts.ScriptTarget.Latest, true), node.getStart()).line + 1;

          // Extract route path
          const routePath = this.extractRoutePath(callExpr);

          const component: ComponentMetadata = {
            componentId: `endpoint_${this.idCounter++}`,
            componentType: 'endpoint',
            location: {
              filePath: this.normalizeFilePath(filePath),
              lineNumber,
              columnNumber: 0,
            },
            name: `${routeType.toUpperCase()} ${routePath}`,
            dependencies: [],
            testCoverageStatus: 'uncovered',
          };

          this.components.push(component);
          console.log(`  🔌 Found endpoint: ${component.name}`);
        }
      }
    }
  }

  /**
   * Check if function/arrow function has JSX return
   */
  private hasJSXReturn(node: ts.FunctionDeclaration | ts.ArrowFunction): boolean {
    const sourceText = node.getText();
    return sourceText.includes('<') && sourceText.includes('/>');
  }

  /**
   * Extract HTTP method from route call
   */
  private extractRouteType(callText: string): string | null {
    const match = callText.match(/\.(get|post|put|delete|patch|options|head)\(/i);
    return match ? match[1].toLowerCase() : null;
  }

  /**
   * Extract route path from route definition
   */
  private extractRoutePath(callExpr: ts.CallExpression): string {
    const args = callExpr.arguments;
    if (args.length > 0 && ts.isStringLiteral(args[0])) {
      return args[0].text;
    }
    return '/unknown';
  }

  /**
   * Normalize file path for consistency
   */
  private normalizeFilePath(filePath: string): string {
    return filePath.replace(this.sourceRoot, '').replace(/\\/g, '/').replace(/^\//, '');
  }

  /**
   * Generate final inventory
   */
  private generateInventory(): ComponentInventory {
    const byType: Record<string, number> = {
      endpoint: 0,
      controller: 0,
      service: 0,
      repository: 0,
      page: 0,
      component: 0,
    };

    this.components.forEach(comp => {
      byType[comp.componentType]++;
    });

    return {
      generatedAt: new Date(),
      totalComponents: this.components.length,
      byType,
      components: this.components.sort((a, b) => a.name.localeCompare(b.name)),
    };
  }
}

/**
 * Discover components and export inventory
 */
export async function discoverComponents(sourceRoot: string = './src', outputPath: string = './component-inventory.json'): Promise<void> {
  const scanner = new ComponentScanner(sourceRoot);
  const inventory = await scanner.scanAll();

  // Write inventory file
  fs.writeFileSync(outputPath, JSON.stringify(inventory, null, 2));

  console.log(`\n✅ Component inventory exported to: ${outputPath}`);
  console.log(`\n📊 Summary:`);
  console.log(`  Total Components: ${inventory.totalComponents}`);
  console.log(`  Endpoints: ${inventory.byType.endpoint}`);
  console.log(`  Controllers: ${inventory.byType.controller}`);
  console.log(`  Services: ${inventory.byType.service}`);
  console.log(`  Repositories: ${inventory.byType.repository}`);
  console.log(`  Pages: ${inventory.byType.page}`);
  console.log(`  Components: ${inventory.byType.component}`);
}

// Export for CLI usage
if (require.main === module) {
  discoverComponents().catch(err => {
    console.error('❌ Discovery failed:', err);
    process.exit(1);
  });
}
