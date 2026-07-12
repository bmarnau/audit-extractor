/**
 * Environment Validation Report Generator
 * Generiert detaillierte Reports über Validierungsergebnisse
 */

import * as fs from 'fs';
import * as path from 'path';
import { ValidationLogger, LogEntry } from '../logger/validation-logger';

export interface ValidationReport {
  timestamp: string;
  environment: {
    nodeVersion: string;
    platform: string;
    arch: string;
    cwd: string;
  };
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
    success: boolean;
  };
  details: {
    errors: LogEntry[];
    warnings: LogEntry[];
    successes: LogEntry[];
    infos: LogEntry[];
  };
  recommendations: string[];
}

export class ReportGenerator {
  /**
   * Generiert einen Validation Report
   */
  static generateReport(logger: ValidationLogger): ValidationReport {
    const logs = logger.getAllLogs();
    const summary = logger.getSummary();

    const errors = logger.getErrors();
    const warnings = logger.getWarnings();
    const successes = logs.filter((log) => log.level === 'success');
    const infos = logs.filter((log) => log.level === 'info');

    const recommendations = this.generateRecommendations(errors, warnings);

    return {
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        cwd: process.cwd(),
      },
      summary: {
        total: summary.total,
        passed: summary.successes,
        failed: summary.errors,
        warnings: summary.warnings,
        success: !logger.hasErrors(),
      },
      details: {
        errors,
        warnings,
        successes,
        infos,
      },
      recommendations,
    };
  }

  /**
   * Generiert Empfehlungen basierend auf Fehlern und Warnungen
   */
  private static generateRecommendations(errors: LogEntry[], warnings: LogEntry[]): string[] {
    const recommendations: string[] = [];

    for (const error of errors) {
      if (error.component === 'Node.js') {
        recommendations.push(
          'Upgrade Node.js auf die erforderliche Mindestversion: nvm install 18 && nvm use 18'
        );
      }

      if (error.component === 'npm') {
        recommendations.push('Upgrade npm: npm install -g npm@latest');
      }

      if (error.component === 'Docker') {
        recommendations.push('Installiere Docker und Docker Compose von https://docs.docker.com/get-docker/');
      }

      if (error.component === 'Database') {
        recommendations.push(
          'Stelle sicher dass PostgreSQL läuft und die Datenbankverbindung korrekt konfiguriert ist'
        );
        recommendations.push('Starte Docker Services mit: docker-compose up -d');
      }

      if (error.component === 'Configuration') {
        recommendations.push(
          'Erstelle fehlende Konfigurationsdateien oder prüfe die Dateistruktur'
        );
      }

      if (error.component === 'Environment') {
        recommendations.push('Setze erforderliche Umgebungsvariablen in .env.local');
      }
    }

    for (const warning of warnings) {
      if (warning.component === 'Configuration') {
        recommendations.push('Einige Konfigurationsdateien fehlen - diese könnten optional sein');
      }

      if (warning.component === 'Environment') {
        recommendations.push('Einige optionale Umgebungsvariablen sind nicht gesetzt');
      }
    }

    // Deduplizierung
    return [...new Set(recommendations)];
  }

  /**
   * Exportiert Report als JSON
   */
  static exportJSON(report: ValidationReport, outputPath: string): void {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`✅ Report exportiert nach: ${outputPath}`);
  }

  /**
   * Exportiert Report als HTML
   */
  static exportHTML(report: ValidationReport, outputPath: string): void {
    const html = this.generateHTMLReport(report);
    const dir = path.dirname(outputPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, html);
    console.log(`✅ HTML Report exportiert nach: ${outputPath}`);
  }

  /**
   * Generiert HTML Report
   */
  private static generateHTMLReport(report: ValidationReport): string {
    const statusColor = report.summary.success ? '#28a745' : '#dc3545';
    const statusText = report.summary.success ? 'BESTANDEN' : 'FEHLGESCHLAGEN';

    const errorsHTML = report.details.errors
      .map(
        (error) => `
      <tr class="table-danger">
        <td>${error.component}</td>
        <td>${error.message}</td>
        <td class="text-danger">❌ Error</td>
      </tr>
    `
      )
      .join('');

    const warningsHTML = report.details.warnings
      .map(
        (warning) => `
      <tr class="table-warning">
        <td>${warning.component}</td>
        <td>${warning.message}</td>
        <td class="text-warning">⚠️ Warning</td>
      </tr>
    `
      )
      .join('');

    const successesHTML = report.details.successes
      .map(
        (success) => `
      <tr class="table-success">
        <td>${success.component}</td>
        <td>${success.message}</td>
        <td class="text-success">✅ Success</td>
      </tr>
    `
      )
      .join('');

    const recommendationsHTML = report.recommendations
      .map((rec) => `<li>${rec}</li>`)
      .join('');

    return `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Environment Validation Report</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; }
        .header { background: ${statusColor}; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .status-badge { font-size: 2em; font-weight: bold; }
        .metric-box { background: #f8f9fa; border-left: 4px solid ${statusColor}; padding: 15px; margin: 10px 0; }
        .recommendation-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; }
        table { font-size: 0.9em; }
        .component-badge { font-weight: bold; padding: 5px 10px; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container-lg">
        <div class="header">
            <div class="status-badge">${statusText}</div>
            <h1>Environment Validation Report</h1>
            <p class="mb-0">Generiert: ${new Date(report.timestamp).toLocaleString('de-DE')}</p>
        </div>

        <div class="row">
            <div class="col-md-6">
                <div class="metric-box">
                    <h5>📊 Übersicht</h5>
                    <p><strong>Gesamt Checks:</strong> ${report.summary.total}</p>
                    <p><strong>Bestanden:</strong> <span class="badge bg-success">${report.summary.passed}</span></p>
                    <p><strong>Fehler:</strong> <span class="badge bg-danger">${report.summary.failed}</span></p>
                    <p><strong>Warnungen:</strong> <span class="badge bg-warning">${report.summary.warnings}</span></p>
                </div>
            </div>
            <div class="col-md-6">
                <div class="metric-box">
                    <h5>🖥️ System Information</h5>
                    <p><strong>Node Version:</strong> ${report.environment.nodeVersion}</p>
                    <p><strong>Platform:</strong> ${report.environment.platform}</p>
                    <p><strong>Architecture:</strong> ${report.environment.arch}</p>
                    <p><strong>Working Directory:</strong> ${report.environment.cwd}</p>
                </div>
            </div>
        </div>

        <h2 class="mt-4">📋 Validierungs-Details</h2>
        <table class="table table-striped table-hover">
            <thead class="table-dark">
                <tr>
                    <th>Komponente</th>
                    <th>Nachricht</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${errorsHTML}
                ${warningsHTML}
                ${successesHTML}
            </tbody>
        </table>

        ${
          report.recommendations.length > 0
            ? `
        <div class="recommendation-box">
            <h4>💡 Empfehlungen</h4>
            <ul>
                ${recommendationsHTML}
            </ul>
        </div>
        `
            : ''
        }

        <hr>
        <footer class="text-muted text-center mt-4">
            <p>Environment Validation Report v1.0</p>
        </footer>
    </div>
</body>
</html>
    `;
  }

  /**
   * Exportiert Report als Markdown
   */
  static exportMarkdown(report: ValidationReport, outputPath: string): void {
    const markdown = this.generateMarkdownReport(report);
    const dir = path.dirname(outputPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, markdown);
    console.log(`✅ Markdown Report exportiert nach: ${outputPath}`);
  }

  /**
   * Generiert Markdown Report
   */
  private static generateMarkdownReport(report: ValidationReport): string {
    const status = report.summary.success ? '✅ BESTANDEN' : '❌ FEHLGESCHLAGEN';

    let markdown = `# Environment Validation Report\n\n`;
    markdown += `**Status**: ${status}\n`;
    markdown += `**Datum**: ${new Date(report.timestamp).toLocaleString('de-DE')}\n\n`;

    markdown += `## Übersicht\n\n`;
    markdown += `| Metrik | Wert |\n`;
    markdown += `|--------|------|\n`;
    markdown += `| Gesamt Checks | ${report.summary.total} |\n`;
    markdown += `| Bestanden | ${report.summary.passed} |\n`;
    markdown += `| Fehler | ${report.summary.failed} |\n`;
    markdown += `| Warnungen | ${report.summary.warnings} |\n\n`;

    markdown += `## System Information\n\n`;
    markdown += `- **Node Version**: ${report.environment.nodeVersion}\n`;
    markdown += `- **Platform**: ${report.environment.platform}\n`;
    markdown += `- **Architecture**: ${report.environment.arch}\n`;
    markdown += `- **Working Directory**: ${report.environment.cwd}\n\n`;

    if (report.details.errors.length > 0) {
      markdown += `## ❌ Fehler\n\n`;
      report.details.errors.forEach((error) => {
        markdown += `- **${error.component}**: ${error.message}\n`;
        if (error.details) {
          markdown += `  - Details: ${JSON.stringify(error.details)}\n`;
        }
      });
      markdown += `\n`;
    }

    if (report.details.warnings.length > 0) {
      markdown += `## ⚠️ Warnungen\n\n`;
      report.details.warnings.forEach((warning) => {
        markdown += `- **${warning.component}**: ${warning.message}\n`;
        if (warning.details) {
          markdown += `  - Details: ${JSON.stringify(warning.details)}\n`;
        }
      });
      markdown += `\n`;
    }

    if (report.details.successes.length > 0) {
      markdown += `## ✅ Erfolgreich\n\n`;
      report.details.successes.forEach((success) => {
        markdown += `- **${success.component}**: ${success.message}\n`;
      });
      markdown += `\n`;
    }

    if (report.recommendations.length > 0) {
      markdown += `## 💡 Empfehlungen\n\n`;
      report.recommendations.forEach((rec) => {
        markdown += `- ${rec}\n`;
      });
    }

    return markdown;
  }
}
