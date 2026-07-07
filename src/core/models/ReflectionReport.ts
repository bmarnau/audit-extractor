/**
 * ReflectionReport Model
 *
 * Speichert Reflektionen und Patterns von erfolgreichen Extraktionen.
 * Nur für Lernzwecke - KEINE neuen Daten!
 *
 * @example
 * const reflection: ReflectionReport = {
 *   id: "reflection-001",
 *   pattern: "invoice-header-pattern",
 *   frequency: 47,
 *   successRate: 0.94,
 *   lastObserved: new Date()
 * };
 */

/**
 * Pattern aus erfolgreichen Extraktionen.
 * Wird nur für Optimierungsempfehlungen verwendet - NICHT für Datengenerierung!
 */
export interface ReflectionReport {
  /** Eindeutige Report-ID */
  id: string;

  /** Pattern-Name (z.B. "invoice-header-pattern", "date-format-dd.mm.yyyy") */
  pattern: string;

  /** Beschreibung des Patterns */
  description?: string;

  /** Wie oft wurde das Pattern beobachtet? */
  frequency: number;

  /** Erfolgsrate (0-1) */
  successRate: number;

  /** Durchschnittliches Vertrauens-Level */
  averageConfidence: number;

  /** Wann wurde das Pattern zuletzt beobachtet? */
  lastObserved: Date;

  /** Wann wurde das Pattern zuerst beobachtet? */
  firstObserved: Date;

  /** Beispiele von erfolgreichen Dokumenten, die das Pattern zeigen */
  sourceDocuments: string[];

  /** Optionale Tags */
  tags?: string[];

  /** Empfehlung basierend auf dem Pattern */
  recommendation?: string;

  /** Ist das Pattern noch aktiv oder veraltet? */
  isActive: boolean;

  /** Optionale Notizen */
  notes?: string;
}

/**
 * Sammlung von Reflektionsberichten.
 */
export interface ReflectionReports {
  /** Reports gruppiert nach Pattern-Name */
  reports: Map<string, ReflectionReport>;

  /** Zeitstempel der Sammlung */
  createdAt: Date;

  /** Insgesamt beobachtete Patterns */
  totalPatterns: number;

  /** Durchschnittliche Erfolgsrate aller Patterns */
  averageSuccessRate: number;

  /** Patterns, die Aufmerksamkeit benötigen (< 70% success rate) */
  patternsNeedingAttention: ReflectionReport[];

  /** Top Patterns (nach Häufigkeit) */
  topPatterns: ReflectionReport[];
}
