import { z } from "zod";

const text = z.string().trim().min(1);
const texts = z.array(text);
export const evidenceSchema = z.object({ path: text, sha256: z.string().regex(/^[a-f0-9]{64}$/) }).strict();
export const gateSchema = z.enum(["advisory", "informational", "not-applicable", "blocking-current-work", "blocking-claim-only"]);
export const resultSchema = z.enum(["clear", "friction", "blocked", "invalid-run", "not-needed-now"]);
export const decisionSchema = z.object({
  testing_type: z.literal("Unassisted Goal Testing"), decision_informed: text, reason_now: text,
  product_maturity: text, scope: text, executor: text, gate_effect: gateSchema.default("advisory"),
  effort_budget: text, stop_condition: text, evidence_retained: texts, rerun_trigger: text,
}).strict();
export const authoritySchema = evidenceSchema.extend({
  result: resultSchema, outcome: text, gate_effect: gateSchema,
}).strict();
export const qualificationSchema = z.object({
  executor: text, kind: z.enum(["human", "agent"]), separate_context: text,
  no_private_knowledge: z.literal(true), no_repository_access: z.literal(true),
  no_private_memory: z.literal(true), no_implementation_conversation: z.literal(true),
  no_coaching: z.literal(true), public_information_only: z.literal(true),
  assessed_by: text, assessment: text,
  isolation_evidence: z.array(evidenceSchema).min(1),
}).strict();
export const targetSchema = z.object({
  build_identity: text, environment: text, supported_scope: text, target_user: text,
  normally_consumable_form: text, audience_consumption_evidence: evidenceSchema,
  qualification: qualificationSchema, consent: text, capture: text, readiness: text,
}).strict();
export const scenarioSchema = z.object({
  scenario_id: z.string().regex(/^NUAT-\d{3,}$/), scenario_version: z.number().int().positive(),
  selected_persona: text, title: text, user_goal: text, source_requirements: z.array(text).min(1), target_user: text,
  current_uncertainty: text, supported_scope: text, build_identity: text, environment: text,
  starting_state: text, public_resources: texts, prohibited_context: z.array(text).min(1),
  tester_prompt: text, operator_success_outcomes: z.array(text).min(1),
  setup: text, teardown: text, evidence_requirements: z.array(text).min(1), severity_rules: text,
  finding_route: text, decision: decisionSchema,
  tester_packet: z.object({ situation: text, goal: text, starting_state: text, public_resources: texts,
    safety_limits: text, consent_notice: text, tester_teardown: text }).strict(),
  packet_review: z.object({ reviewer: text, evidence: evidenceSchema, no_hidden_guidance: z.literal(true) }).strict(),
}).strict();
export const findingSchema = z.object({
  finding_id: text, run_id: text, scenario_id: text, scenario_version: z.number().int().positive(),
  observed_behavior: text, expected_human_outcome: text,
  severity: z.enum(["critical", "major", "moderate", "minor"]), reproducibility: text,
  supported_scope: text, source_requirement: text, owner: text, disposition: text,
  disposition_authority: evidenceSchema, evidence: z.array(evidenceSchema).min(1),
}).strict();
export const runSchema = z.object({
  scenario: scenarioSchema.optional(), run_id: text, scenario_ref: evidenceSchema.extend({ scenario_id: text, scenario_version: z.number().int().positive() }).strict(),
  selected_persona: text, persona_primitive: z.enum(["user", "maintainer"]),
  persona_resolution: z.enum(["explicit", "default"]), work_coordinate: text,
  product_build: text, environment: text, support_scope: text, target_user: text,
  qualification: qualificationSchema, public_resources_used: texts,
  interventions: z.array(z.object({ description: text, material_coaching: z.boolean(), assessed_by: text }).strict()),
  observations: texts, reproduction: text, evidence_refs: z.array(evidenceSchema).min(1),
  findings: z.array(findingSchema), cleanup_state: text, review: text,
  validity: z.object({ private_knowledge: z.boolean(), broken_setup: z.boolean(), lost_evidence: z.boolean(), assessed_by: text }).strict(),
}).strict();
export const baseInput = { targetRoot: text.optional(), persona: text.optional() };
export const personaInput = z.object({ ...baseInput, artifact: evidenceSchema.optional() }).strict();
export const scenarioInput = z.object({ ...baseInput, source: evidenceSchema, scenario: scenarioSchema }).strict();
export const targetInput = z.object({ ...baseInput, target: targetSchema }).strict();
export const evidenceInput = z.object({ ...baseInput, evidence: evidenceSchema }).strict();
export const findingInput = z.object({ ...baseInput, record: evidenceSchema, finding: findingSchema }).strict();
export const resultInput = z.object({ ...baseInput, record: evidenceSchema, decision: decisionSchema,
  result: resultSchema, run: runSchema.optional(), gate_authority: authoritySchema.optional(),
  future_obligation: z.object({ id: z.string().regex(/^O-\d{3,}$/), owner: text, trigger: text,
    target: text, exit_criteria: text, reason: text, accepted_authority: evidenceSchema }).strict().optional(),
}).strict();
