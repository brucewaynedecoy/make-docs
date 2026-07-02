/**
 * Layered Playbook validator (W18 R6 Phase 3): structural, registry,
 * workflow, orchestration policy shape, cross-reference integrity, and
 * consistency layers over the parsed Playbook model, sharing the diagnostic
 * catalog with the parser (R-MODEL-4..R-MODEL-6).
 */

export { validatePlaybook, parseAndValidatePlaybook } from "./validate-playbook";
export { validateStructuralLayer } from "./structural";
export { validateRegistryLayer } from "./registry";
export { validateWorkflowLayer } from "./workflow";
export { validateOrchestrationPolicyLayer } from "./orchestration-policy";
export { validateCrossReferenceLayer } from "./cross-reference";
export { validateConsistencyLayer } from "./consistency";
