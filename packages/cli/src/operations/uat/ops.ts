import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { parseDocument } from "yaml";
import { z } from "zod";
import { loadMakeDocsConfig } from "../../config";
import { assertManagedPathHasNoSymlinks } from "../../utils";
import type { OperationDefinition } from "../registry";
import { OperationError } from "../types";
import { loadInstalledSystemResourceProvider } from "../resource/provider";
import * as schema from "./schemas";

export const UAT_WORKFLOW_RESOURCES = [
  "make-docs://system/contract/naive-uat-contract.md",
  "make-docs://system/prompt/naive-uat-facilitator.prompt.md",
  "make-docs://system/prompt/naive-uat-tester.prompt.md",
  "make-docs://system/reference/naive-uat-workflow.md",
  "make-docs://system/template/naive-uat-scenario.md",
] as const;

class UatValidationError extends OperationError {
  constructor(readonly code: string, message: string) { super(message); this.name = "UatValidationError"; }
}
function fail(code: string, message: string): never { throw new UatValidationError(code, message); }
type Evidence = z.infer<typeof schema.evidenceSchema>;
type Persona = ReturnType<typeof resolvePersona>;

function resolvePersona(root: string, selected?: string) {
  const loaded = loadMakeDocsConfig(root);
  if (!loaded.valid) fail("invalid-persona", "Repair the project Persona configuration before validation.");
  const persona = loaded.config.personas.find((entry) => entry.slug === (selected ?? "user"));
  if (!persona || !["user", "maintainer"].includes(persona.primitive)) {
    fail("invalid-persona", "Select one configured user or maintainer Persona.");
  }
  return { slug: persona.slug, primitive: persona.primitive as "user" | "maintainer",
    resolution: selected === undefined ? "default" as const : "explicit" as const,
    evidence_root: `docs/assets/${persona.slug}/testing/` };
}

function readReference(root: string, ref: Evidence, prefix: string, code = "prohibited-evidence-path") {
  // Use portable relative paths. Reject links even when they currently point inside the root.
  if (!ref.path.startsWith(prefix) || ref.path.includes("\\") || ref.path.split("/").some((part) => !part || part === "." || part === "..") || /[:\x00-\x1f]/.test(ref.path)) {
    fail(code, `Use a project-relative file under ${prefix}.`);
  }
  try {
    assertManagedPathHasNoSymlinks(root, ref.path);
    const file = path.join(root, ref.path);
    if (!statSync(file).isFile()) fail(code, "The evidence reference must name a file.");
    const bytes = readFileSync(file);
    if (createHash("sha256").update(bytes).digest("hex") !== ref.sha256) fail(code, "The reference digest does not match the current file.");
    return bytes.toString("utf8");
  } catch (error) {
    if (error instanceof UatValidationError) throw error;
    fail(code, `The referenced file cannot be verified: ${ref.path}.`);
  }
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([k,v]) => `${JSON.stringify(k)}:${stable(v)}`).join(",")}}`;
  return JSON.stringify(value);
}

/** Typed helpers consume body JSON without requiring or changing frontmatter. */
function assertRecorded(body: string, value: unknown, code: string) {
  const candidates = [...body.matchAll(/```json\s*\n([\s\S]*?)\n```/g)].map((match) => match[1]!);
  candidates.push(body);
  if (!candidates.some((candidate) => { try { return stable(JSON.parse(candidate)) === stable(value); } catch { return false; } })) {
    fail(code, "The supplied record does not match a JSON body record in the current repository source.");
  }
}

function tableFields(body: string): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const line of body.split("\n")) {
    const cells = line.trim().split("|");
    if (cells.length >= 4 && cells[0] === "") fields[fieldKey(cells[1]!)] = cells.slice(2, -1).join("|").trim().replace(/`/g, "");
    const bullet = /^- ([^:]+): (.+)$/.exec(line);
    if (bullet) fields[fieldKey(bullet[1]!)] = bullet[2]!.trim();
  }
  return fields;
}
function fieldKey(value: string) { return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""); }
function displayed(value: unknown): string { return Array.isArray(value) ? value.join("; ") : String(value); }
function scenarioSection(body: string, id: string) {
  const lines = body.split("\n");
  const start = lines.findIndex((line) => new RegExp("^#{1,6} +" + id + "(?: |$)").test(line));
  if (start < 0) return "";
  const level = lines[start]!.match(/^#+/)![0].length;
  const end = lines.findIndex((line, index) => index > start && new RegExp("^#{1," + level + "} +").test(line));
  return lines.slice(start, end < 0 ? undefined : end).join("\n");
}
function assertScenarioRecorded(body: string, value: z.infer<typeof schema.scenarioSchema>) {
  try { assertRecorded(body, value, "invalid-scenario"); return; } catch { /* Current Markdown tables remain a supported source. */ }
  const section = scenarioSection(body, value.scenario_id);
  const fields = tableFields(section);
  const aliases: Record<string,string[]> = { build_identity: ["build_identity", "product_build"], environment: ["environment"],
    current_uncertainty: ["current_uncertainty"], selected_persona: ["selected_persona"] };
  const compoundBuild = fields.product_build_and_environment;
  for (const [key,item] of Object.entries(value)) {
    if (["decision", "tester_packet", "packet_review"].includes(key)) continue;
    if ((key === "build_identity" || key === "environment") && compoundBuild === value.build_identity + "; " + value.environment) continue;
    const actual = (aliases[key] ?? [key]).map((name) => fields[name]).find((item) => item !== undefined);
    if (actual !== displayed(item)) fail("invalid-scenario", "Canonical scenario field differs or is missing: " + key + ".");
  }
  const decision = tableFields(body.split(/^#{1,6} +NUAT-/m)[0]!);
  for (const [key,item] of Object.entries(value.decision)) if (decision[key] !== displayed(item)) fail("invalid-scenario", "Canonical testing decision differs: " + key + ".");
  const packetNames: Record<string,string> = { situation: "situation", goal: "goal", starting_state: "visible_starting_state", public_resources: "allowed_public_resources",
    safety_limits: "genuine_constraints_and_safety_notes", consent_notice: "consent_and_capture_notice", tester_teardown: "tester_owned_teardown_steps" };
  for (const [key,item] of Object.entries(value.tester_packet)) if (fields[packetNames[key]!] !== displayed(item)) fail("invalid-scenario", "Canonical tester packet differs: " + key + ".");
}

function checkPersonaFrontmatter(body: string, persona: Persona) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(body);
  if (!match) return;
  const document = parseDocument(match[1]!);
  if (document.errors.length) fail("invalid-persona", "Repair invalid artifact frontmatter.");
  const value = document.toJSON() as Record<string, unknown> | null;
  if (value && "persona" in value && value.persona !== persona.slug) {
    fail("invalid-persona", "Artifact Persona frontmatter differs from the selected configured Persona.");
  }
}

function evidence(root: string, persona: Persona, ref: Evidence) {
  const body = readReference(root, ref, persona.evidence_root);
  checkPersonaFrontmatter(body, persona);
  return body;
}

function qualification(root: string, persona: Persona, value: z.infer<typeof schema.qualificationSchema>) {
  if (value.assessed_by === value.executor) fail("unqualified-executor", "Qualification needs a separate assessor and supporting evidence.");
  for (const ref of value.isolation_evidence) {
    const body = evidence(root, persona, ref);
    if (!body.trim()) fail("unqualified-executor", "Isolation evidence is empty.");
  }
  // This verifies an assessed record and its evidence. It does not make the human judgment.
}

function scenario(root: string, persona: Persona, input: z.infer<typeof schema.scenarioInput>) {
  const body = readReference(root, input.source, "docs/prd/", "invalid-scenario");
  const value = input.scenario;
  if (value.selected_persona !== persona.slug) fail("invalid-persona", "Scenario Persona differs from current selection.");
  assertScenarioRecorded(body, value);
  if (!body.includes(value.scenario_id)) fail("invalid-scenario", "The owning active PRD must contain the scenario identity.");
  if (value.tester_packet.goal !== value.user_goal || value.tester_packet.starting_state !== value.starting_state || stable(value.tester_packet.public_resources) !== stable(value.public_resources)) {
    fail("invalid-scenario", "The tester packet must use the scenario's public goal, starting state, and resources.");
  }
  const packet = stable(value.tester_packet);
  if (value.operator_success_outcomes.some((outcome) => packet.includes(outcome)) || /(?:R-NUAT-|NUAT-\d|docs\/prd\/)/.test(packet)) {
    fail("invalid-scenario", "The tester packet exposes operator-only evaluation or internal authority.");
  }
  evidence(root, persona, value.packet_review.evidence);
  return { scenario_id: value.scenario_id, scenario_version: value.scenario_version,
    source: input.source, build_identity: value.build_identity, supported_scope: value.supported_scope,
    tester_packet: value.tester_packet };
}

function finding(root: string, persona: Persona, value: z.infer<typeof schema.findingSchema>) {
  value.evidence.forEach((ref) => evidence(root, persona, ref));
  const dispositionBody = evidence(root, persona, value.disposition_authority);
  assertRecorded(dispositionBody, { finding_id: value.finding_id, owner: value.owner, disposition: value.disposition }, "invalid-finding");
}

function validateResult(root: string, persona: Persona, input: z.infer<typeof schema.resultInput>) {
  const body = evidence(root, persona, input.record);
  const { targetRoot: _root, persona: _persona, record: _record, ...recorded } = input;
  assertRecorded(body, recorded, "invalid-input");
  const effect = input.decision.gate_effect;
  if (effect.startsWith("blocking-")) {
    const authority = input.gate_authority;
    if (!authority || authority.result !== input.result || authority.gate_effect !== effect || authority.outcome !== input.decision.decision_informed) fail("unauthorized-blocking-gate", "Blocking needs current authority for this exact result and outcome.");
    const authorityBody = readReference(root, authority, "docs/prd/", "unauthorized-blocking-gate");
    assertRecorded(authorityBody, { result: authority.result, outcome: authority.outcome, gate_effect: authority.gate_effect }, "unauthorized-blocking-gate");
  }
  if (input.future_obligation) {
    const { accepted_authority, ...obligation } = input.future_obligation;
    const acceptanceBody = readReference(root, accepted_authority, "docs/prd/", "invalid-input");
    assertRecorded(acceptanceBody, obligation, "invalid-input");
  }
  if (input.result === "not-needed-now") {
    if (input.run || input.decision.executor !== "none") fail("invalid-input", "Not-needed-now records no run and executor none.");
    return { result: input.result, gate_effect: effect, recorded_human_conclusion: false, independently_verified: false, run_occurred: false };
  }
  if (!input.run) fail("invalid-input", "An activated result requires its run record.");
  const run = input.run;
  if (input.decision.executor !== run.qualification.executor || input.decision.scope !== run.support_scope) {
    fail("invalid-input", "Testing decision executor or scope differs from the activated run.");
  }
  if (run.selected_persona !== persona.slug || run.persona_primitive !== persona.primitive || run.persona_resolution !== persona.resolution) fail("invalid-persona", "Run Persona identity or resolution differs from current selection.");
  const source = readReference(root, run.scenario_ref, "docs/prd/", "invalid-scenario");
  const sourceRecords = [...source.matchAll(/```json\s*\n([\s\S]*?)\n```/g)].flatMap((match) => { try { return [JSON.parse(match[1]!)]; } catch { return []; } });
  if (run.scenario) sourceRecords.push(run.scenario);
  const canonical = sourceRecords.map((item) => schema.scenarioSchema.safeParse(item)).find((item) => item.success && item.data.scenario_id === run.scenario_ref.scenario_id);
  if (!canonical?.success || canonical.data.scenario_version !== run.scenario_ref.scenario_version || canonical.data.build_identity !== run.product_build || canonical.data.environment !== run.environment || canonical.data.supported_scope !== run.support_scope || canonical.data.target_user !== run.target_user) fail("invalid-scenario", "Run identity, version, build, audience, environment, or scope differs from its canonical scenario.");
  scenario(root, persona, { source: run.scenario_ref, scenario: canonical.data });
  qualification(root, persona, run.qualification);
  const missingEvidence = run.validity.lost_evidence;
  run.evidence_refs.forEach((ref) => evidence(root, persona, ref));
  const invalid = missingEvidence || Object.entries(run.validity).some(([key,value]) => key !== "assessed_by" && value === true) || run.interventions.some((item) => item.material_coaching);
  if (invalid && input.result !== "invalid-run") fail("invalid-input", "A validity failure requires recorded invalid-run; this validator cannot rewrite the result.");
  for (const item of run.findings) {
    finding(root, persona, item);
    if (item.run_id !== run.run_id || item.scenario_id !== run.scenario_ref.scenario_id || item.scenario_version !== run.scenario_ref.scenario_version || item.supported_scope !== run.support_scope) fail("invalid-finding", "Finding linkage differs from its run.");
  }
  // Free-text disposition is not a machine closure status. Preserve every finding.
  // A clear run cannot establish closure or erase findings without a separate review.
  const findingsRequireReview = input.result === "clear" && run.findings.length > 0;
  return { valid: !findingsRequireReview, validation_status: findingsRequireReview ? "unverified" : "verified-record", ...(findingsRequireReview ? { reason: "The linked disposition text does not prove accepted closure. Review the retained findings before using this clear result as a conclusion." } : {}), result: input.result, gate_effect: effect, recorded_human_conclusion: ["clear", "friction"].includes(input.result) && !findingsRequireReview, findings_require_review: findingsRequireReview, retained_findings: run.findings.map((item) => ({ finding_id: item.finding_id, disposition: item.disposition, disposition_authority: item.disposition_authority })), independently_verified: false, run_occurred: true,
    verified_evidence: !missingEvidence, scope: run.support_scope };
}

function operation<T extends { targetRoot?: string; persona?: string }>(id: string, inputSchema: z.ZodType<T>, handler: (root: string, persona: Persona, input: T) => unknown): OperationDefinition<T, unknown> {
  return { id, summary: "Validate Unassisted Goal Testing records against repository evidence. Human judgments remain with the recorded assessor.", mutates: "read", status: "active", inputSchema,
    handler(input, context) {
      const provider = loadInstalledSystemResourceProvider();
      if (!provider.ok || UAT_WORKFLOW_RESOURCES.some((uri) => !provider.value.resources.some((resource) => resource.identity.uri === uri))) fail("invalid-input", "Restore the governing Unassisted Goal Testing provider resources.");
      const root = path.resolve(context.cwd, input.targetRoot ?? ".");
      const persona = resolvePersona(root, input.persona);
      return { valid: true, validation_scope: "record-structure-and-current-references", qualification_verified: false, persona, authority: UAT_WORKFLOW_RESOURCES, assessment: "record-and-reference-validation-only", ...handler(root, persona, input) as object };
    } };
}

export const uatOperations: OperationDefinition[] = [
  operation("uat.scenario.validate", schema.scenarioInput, scenario),
  operation("uat.persona.resolve", schema.personaInput, (root, persona, input) => { if (input.artifact) evidence(root, persona, input.artifact); return {}; }),
  operation("uat.target.validate", schema.targetInput, (root, persona, input) => {
    qualification(root, persona, input.target.qualification);
    evidence(root, persona, input.target.audience_consumption_evidence);
    return { build_identity: input.target.build_identity, supported_scope: input.target.supported_scope };
  }),
  operation("uat.evidence-reference.validate", schema.evidenceInput, (root, persona, input) => { evidence(root, persona, input.evidence); return { evidence: input.evidence }; }),
  operation("uat.finding.validate", schema.findingInput, (root, persona, input) => { assertRecorded(evidence(root, persona, input.record), input.finding, "invalid-finding"); finding(root, persona, input.finding); return { finding_id: input.finding.finding_id }; }),
  operation("uat.result.validate", schema.resultInput, validateResult),
];

/** Checkpoint 10 proves available helpers, provider policy and the configured default without creating UAT evidence. */
export function validateUatCheckpoint10(root: string) {
  const provider = loadInstalledSystemResourceProvider();
  if (!provider.ok || UAT_WORKFLOW_RESOURCES.some((uri) => !provider.value.resources.some((entry) => entry.identity.uri === uri))) fail("invalid-input", "Checkpoint 10 requires the complete workflow provider.");
  if (uatOperations.length !== 6 || uatOperations.some((item) => item.status !== "active" || !item.handler || item.mutates !== "read")) fail("invalid-input", "Checkpoint 10 requires all six read-only UAT handlers.");
  return { checkpoint: 10, persona: resolvePersona(root), operations: uatOperations.map((item) => item.id), quiescence: "preserved", next_checkpoint: 11, next_checkpoint_state: "locked" };
}
