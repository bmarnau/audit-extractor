/**
 * Severity Enum für Issue Kategorisierung
 * Definiert die Prioritätsstufen von Issues in absteigender Kritikalität
 */
export enum Severity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  INFO = 'INFO'
}

/**
 * Severity Gewichtung für Priorisierung
 */
export const SeverityWeights: Record<Severity, number> = {
  [Severity.CRITICAL]: 5,
  [Severity.HIGH]: 4,
  [Severity.MEDIUM]: 3,
  [Severity.LOW]: 2,
  [Severity.INFO]: 1
};

/**
 * Severity Beschreibungen
 */
export const SeverityDescriptions: Record<Severity, string> = {
  [Severity.CRITICAL]: 'Kritisches Problem - Sofortiges Handeln erforderlich',
  [Severity.HIGH]: 'Hohes Priorität - Behebung erforderlich vor Release',
  [Severity.MEDIUM]: 'Mittlere Priorität - Sollte in naher Zukunft behoben werden',
  [Severity.LOW]: 'Niedrige Priorität - Kann später behoben werden',
  [Severity.INFO]: 'Informativ - Dokumentation oder Verbesserungsvorschlag'
};
