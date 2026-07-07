/**
 * Core Rules Module
 *
 * Exports:
 * - Rule & RuleSet (Rule-Modelle)
 * - Schema & FieldGroup (Schema-Modelle)
 * - RuleLoader (Datenlader)
 */

export type { Rule, RuleSet } from './Rule';
export { FieldType } from './Rule';
export type { FieldConstraint } from './Rule';

export type { Schema, FieldGroup } from './Schema';

export { RuleLoader, RuleLoadError } from './RuleLoader';
