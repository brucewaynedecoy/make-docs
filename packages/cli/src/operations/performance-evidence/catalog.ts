import { createHash } from "node:crypto";

export type PerformanceEvidenceRuleClass = "fact" | "decision";
export type PerformanceEvidenceDeterministicSupport = "full" | "partial" | "agent-only";

export interface PerformanceEvidenceRule {
  id: string;
  title: string;
  ruleClass: PerformanceEvidenceRuleClass;
  deterministicSupport: PerformanceEvidenceDeterministicSupport;
  agentInstructionLocation: string;
  judgmentRequired: boolean;
  diagnosticCode: string;
  focusedTests: string[];
  parityMapping: string;
  oneSidedReason: string | null;
}

export const PERFORMANCE_EVIDENCE_RULE_CATALOG_ID =
  "make-docs.performance-evidence-validation-rules.v1";
export const PERFORMANCE_EVIDENCE_RULE_CATALOG_VERSION = 1;

const CONTRACT_VALIDATION_ANCHOR =
  "make-docs://system/contract/performance-evidence-governance.md#validation-methods";

/**
 * Stable map between the deterministic operation and the canonical agent method.
 * A rule can remain agent-only only when it names why deterministic code cannot
 * make the required judgment.
 */
export const PERFORMANCE_EVIDENCE_RULES: readonly PerformanceEvidenceRule[] = Object.freeze([
  {
    id: "PERF-RULE-001",
    title: "Safe project authority roots",
    ruleClass: "fact",
    deterministicSupport: "full",
    agentInstructionLocation: CONTRACT_VALIDATION_ANCHOR,
    judgmentRequired: false,
    diagnosticCode: "PERF-VAL-001",
    focusedTests: ["missing root", "unreadable root", "symlink or escaping path"],
    parityMapping: "Both methods stop on unreadable, unsafe, or escaping repository authority.",
    oneSidedReason: null,
  },
  {
    id: "PERF-RULE-002",
    title: "Performance candidate inventory",
    ruleClass: "fact",
    deterministicSupport: "full",
    agentInstructionLocation: CONTRACT_VALIDATION_ANCHOR,
    judgmentRequired: false,
    diagnosticCode: "PERF-VAL-002",
    focusedTests: ["numeric units", "relative comparison", "absolute performance language"],
    parityMapping: "Both methods inventory candidate language without deciding applicability.",
    oneSidedReason: null,
  },
  {
    id: "PERF-RULE-003",
    title: "Canonical PERF identity and version",
    ruleClass: "fact",
    deterministicSupport: "full",
    agentInstructionLocation: CONTRACT_VALIDATION_ANCHOR,
    judgmentRequired: false,
    diagnosticCode: "PERF-VAL-003",
    focusedTests: ["invalid identity", "duplicate identity", "invalid version", "source digest"],
    parityMapping: "Both methods verify one append-only PERF identity and its exact version binding.",
    oneSidedReason: null,
  },
  {
    id: "PERF-RULE-004",
    title: "Required profile structure",
    ruleClass: "fact",
    deterministicSupport: "full",
    agentInstructionLocation: CONTRACT_VALIDATION_ANCHOR,
    judgmentRequired: false,
    diagnosticCode: "PERF-VAL-004",
    focusedTests: ["missing field", "unresolved placeholder"],
    parityMapping: "Both methods verify the canonical profile sections and required fields.",
    oneSidedReason: null,
  },
  {
    id: "PERF-RULE-005",
    title: "Target class owner and location",
    ruleClass: "fact",
    deterministicSupport: "full",
    agentInstructionLocation: CONTRACT_VALIDATION_ANCHOR,
    judgmentRequired: false,
    diagnosticCode: "PERF-VAL-005",
    focusedTests: ["each target class", "wrong owner location"],
    parityMapping: "Both methods apply the contract target-class location map.",
    oneSidedReason: null,
  },
  {
    id: "PERF-RULE-006",
    title: "Recorded approval",
    ruleClass: "fact",
    deterministicSupport: "full",
    agentInstructionLocation: CONTRACT_VALIDATION_ANCHOR,
    judgmentRequired: false,
    diagnosticCode: "PERF-VAL-006",
    focusedTests: ["missing approver", "missing hard-target approval"],
    parityMapping: "Both methods verify that required approval evidence is recorded.",
    oneSidedReason: null,
  },
  {
    id: "PERF-RULE-007",
    title: "Expiry and requalification structure",
    ruleClass: "fact",
    deterministicSupport: "full",
    agentInstructionLocation: CONTRACT_VALIDATION_ANCHOR,
    judgmentRequired: false,
    diagnosticCode: "PERF-VAL-007",
    focusedTests: ["expired evidence", "single-event requalification", "prohibited repeat"],
    parityMapping: "Both methods keep expiry visible and require separate, finite requalification authority.",
    oneSidedReason: null,
  },
  {
    id: "PERF-RULE-008",
    title: "Finite evidence budget",
    ruleClass: "fact",
    deterministicSupport: "full",
    agentInstructionLocation: CONTRACT_VALIDATION_ANCHOR,
    judgmentRequired: false,
    diagnosticCode: "PERF-VAL-008",
    focusedTests: ["finite limits", "unlimited budget", "self-renewing budget"],
    parityMapping: "Both methods reject unspecified, unlimited, or self-renewing budgets.",
    oneSidedReason: null,
  },
  {
    id: "PERF-RULE-009",
    title: "Finite stop rules",
    ruleClass: "fact",
    deterministicSupport: "full",
    agentInstructionLocation: CONTRACT_VALIDATION_ANCHOR,
    judgmentRequired: false,
    diagnosticCode: "PERF-VAL-009",
    focusedTests: ["diminishing return", "budget exhaustion disposition"],
    parityMapping: "Both methods verify a stated stop rule and bounded exhaustion disposition.",
    oneSidedReason: null,
  },
  {
    id: "PERF-RULE-010",
    title: "Outcome vocabulary",
    ruleClass: "fact",
    deterministicSupport: "full",
    agentInstructionLocation: CONTRACT_VALIDATION_ANCHOR,
    judgmentRequired: false,
    diagnosticCode: "PERF-VAL-010",
    focusedTests: ["pass", "fail", "revise", "blocked", "waived", "unknown outcome"],
    parityMapping: "Both methods preserve the five contract outcomes without treating proof state as outcome.",
    oneSidedReason: null,
  },
  {
    id: "PERF-RULE-011",
    title: "Authority and record traceability",
    ruleClass: "fact",
    deterministicSupport: "full",
    agentInstructionLocation: CONTRACT_VALIDATION_ANCHOR,
    judgmentRequired: false,
    diagnosticCode: "PERF-VAL-011",
    focusedTests: ["source authority", "plan and work links", "result finding waiver lineage"],
    parityMapping: "Both methods verify that repository records link to their canonical authority and lineage.",
    oneSidedReason: null,
  },
  {
    id: "PERF-RULE-012",
    title: "Evidence reference integrity",
    ruleClass: "fact",
    deterministicSupport: "full",
    agentInstructionLocation: CONTRACT_VALIDATION_ANCHOR,
    judgmentRequired: false,
    diagnosticCode: "PERF-VAL-012",
    focusedTests: ["broken link", "escaping link", "symlinked evidence"],
    parityMapping: "Both methods keep missing or unsafe evidence references visible.",
    oneSidedReason: null,
  },
  {
    id: "PERF-RULE-013",
    title: "Declared fingerprint comparison",
    ruleClass: "fact",
    deterministicSupport: "full",
    agentInstructionLocation: CONTRACT_VALIDATION_ANCHOR,
    judgmentRequired: false,
    diagnosticCode: "PERF-VAL-013",
    focusedTests: ["unchanged", "materially changed", "not comparable"],
    parityMapping: "Both methods report only the declared comparison class and reasons; neither authorizes execution.",
    oneSidedReason: null,
  },
  {
    id: "PERF-RULE-014",
    title: "Work criterion authority trace",
    ruleClass: "fact",
    deterministicSupport: "partial",
    agentInstructionLocation: CONTRACT_VALIDATION_ANCHOR,
    judgmentRequired: true,
    diagnosticCode: "PERF-VAL-014",
    focusedTests: ["numeric work criterion without PERF link", "linked work criterion"],
    parityMapping: "The validator flags an unlinked numeric performance criterion; the agent decides whether it is stricter than authority.",
    oneSidedReason: null,
  },
  {
    id: "PERF-RULE-015",
    title: "Applicability and maturity decision",
    ruleClass: "decision",
    deterministicSupport: "agent-only",
    agentInstructionLocation: CONTRACT_VALIDATION_ANCHOR,
    judgmentRequired: true,
    diagnosticCode: "PERF-AGENT-015",
    focusedTests: ["agent method boundary", "no deterministic applicability decision"],
    parityMapping: "The deterministic result records no applicability verdict; the agent reports the authority question and evidence limit.",
    oneSidedReason: "Applicability and maturity depend on the current product decision, risk, and evidence value.",
  },
  {
    id: "PERF-RULE-016",
    title: "Representative environment and comparability judgment",
    ruleClass: "decision",
    deterministicSupport: "agent-only",
    agentInstructionLocation: CONTRACT_VALIDATION_ANCHOR,
    judgmentRequired: true,
    diagnosticCode: "PERF-AGENT-016",
    focusedTests: ["agent method boundary", "no deterministic comparability judgment"],
    parityMapping: "The validator reports declared facts; the agent reviews whether the evidence can support the current decision.",
    oneSidedReason: "Representative conditions and material equivalence require decision-specific judgment.",
  },
  {
    id: "PERF-RULE-017",
    title: "Impact severity waiver and support judgment",
    ruleClass: "decision",
    deterministicSupport: "agent-only",
    agentInstructionLocation: CONTRACT_VALIDATION_ANCHOR,
    judgmentRequired: true,
    diagnosticCode: "PERF-AGENT-017",
    focusedTests: ["agent method boundary", "no waiver or support promotion"],
    parityMapping: "Both methods preserve the recorded state; only the named owner can change authority.",
    oneSidedReason: "Impact, severity, accepted risk, and supported scope are owner decisions.",
  },
  {
    id: "PERF-RULE-018",
    title: "Proof-state honesty and non-capabilities",
    ruleClass: "fact",
    deterministicSupport: "full",
    agentInstructionLocation: CONTRACT_VALIDATION_ANCHOR,
    judgmentRequired: false,
    diagnosticCode: "PERF-VAL-018",
    focusedTests: ["validator-passed", "no favorable state on failure", "no cross-certification", "no benchmark or write"],
    parityMapping: "Each method reports only its own evidence path and never substitutes for an outcome or adjacent proof.",
    oneSidedReason: null,
  },
] satisfies readonly PerformanceEvidenceRule[]);

export function performanceEvidenceRuleCatalogDigest(): string {
  return createHash("sha256")
    .update(JSON.stringify(PERFORMANCE_EVIDENCE_RULES))
    .digest("hex");
}
