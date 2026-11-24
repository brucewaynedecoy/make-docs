import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parseDocument } from "yaml";

import { loadMakeDocsConfig } from "../../config";
import type { StoreDatabase } from "../../store/database";
import {
  listFactoryMachineTools,
  listFactoryPlanRevisions,
  readFactoryProofResult,
  readFactoryWorkflowBinding,
  type FactoryMachineToolRecord,
  type FactoryPlanRevisionRecord,
  type FactoryWorkflowBindingRecord,
} from "../../store/factory-store";
import { loadInstalledSystemResourceProvider } from "../resource/provider";
import { readSystemResource } from "../resource/resolver";
import { parseFactoryConfigBlock, type FactoryWorkflowDefinition } from "./config-block";
import { factoryCanonicalJson, factoryDigest, resolveFactoryPlan, type FactoryJsonValue, type FactoryResolvedPlan, type FactoryToolFacts, type FactoryTypeFacts } from "./plan";
import { FACTORY_DRIFT_CODES, FACTORY_STANDARD_ROLES, type FactoryReadiness, type FactoryReadinessCode } from "./records";

/**
 * W30 R0 P3 T9, T18, and T21: the current plan from the three live sources
 * (PRD 53 R-FACTORY-12, R-FACTORY-54, R-FACTORY-58; factory contract "How the
 * CLI Finds the State").
 *
 * The current plan joins the workflow's entry in the checkout's config file,
 * the workflow type file, and the machine tool rows in the Store. The saved
 * binding gives only the choices that setup saved. The plan digest is then
 * compared with the saved revisions: the `ready` revision's digest gives
 * `ready`, another kept revision gives `wired` or `draft`, and no match gives
 * `drifted` with each drift reason code in plain words. Nothing here writes,
 * and nothing contacts a tool.
 *
 * A shipped type (`build-then-review`, `lead-and-specialists`,
 * `staged-backlog`) is read from the installed Make Docs package, so its file
 * is the same in every checkout on this machine. A project-owned type is read
 * from `docs/assets/project/factory/workflows/<type>.md` in the checkout.
 */

export type FactoryDriftCode = (typeof FACTORY_DRIFT_CODES)[number];

/** The shipped type names. A project type with one of these names is a clash. */
export const FACTORY_SHIPPED_TYPES = ["build-then-review", "lead-and-specialists", "staged-backlog"] as const;

export const FACTORY_PROJECT_TYPE_FOLDER = "docs/assets/project/factory/workflows";

/** Each drift code in plain words, once in code (T23). */
export const FACTORY_DRIFT_WORDS: Readonly<Record<FactoryDriftCode, string>> = Object.freeze({
  "config-changed": "The workflow's entry in the factory block of .make-docs/config.yaml changed since the last save.",
  "binding-changed": "The saved choices or the proved tool facts changed since the last save.",
  "type-changed": "The workflow type file changed since the last save.",
  "type-name-clash": "A project-owned workflow type uses the name of a shipped type.",
  "tool-missing": "A bound tool is missing on this machine.",
  "tool-version-changed": "A bound tool reports a version that its proof did not cover.",
  "proof-contradicted": "A capability proof of a bound tool was contradicted.",
  "permission-lost": "A bound tool is blocked: it lost a permission that it needs.",
});

export interface FactoryDriftEntry {
  code: FactoryDriftCode;
  /** The role and tool, when the code belongs to one binding. */
  role: string | null;
  toolId: string | null;
  text: string;
  /** The smallest step that fixes it (R-FACTORY-33). */
  nextStep: string;
}

export interface FactoryTypeRead {
  ok: true;
  facts: FactoryTypeFacts;
  source: "shipped" | "project";
  /** The role names that the type's `## Roles` table lists, in lower-case kebab-case. */
  roles: string[];
}

export type FactoryTypeProblem =
  | { ok: false; code: "type-name-clash"; reason: string }
  | { ok: false; code: "type-not-found"; reason: string }
  | { ok: false; code: "type-version-missing"; reason: string };

/** The `Type version: N` line of a type file, or null when it has none. */
export function factoryTypeVersion(text: string): number | null {
  const match = /^Type version: ([1-9]\d*)\.?\s*$/m.exec(text);
  return match ? Number(match[1]) : null;
}

/** The role names of a type file's `## Roles` table. */
export function factoryTypeRoles(text: string): string[] {
  const start = text.indexOf("\n## Roles");
  if (start < 0) return [];
  const rest = text.slice(start + 1);
  const end = rest.indexOf("\n## ", 3);
  const section = end < 0 ? rest : rest.slice(0, end);
  const roles: string[] = [];
  for (const line of section.split("\n")) {
    if (!line.startsWith("| ") || line.startsWith("| ---")) continue;
    const cell = line.split("|")[1]!.trim();
    if (cell.toLowerCase() === "role") continue;
    roles.push(cell.toLowerCase().replace(/\s+/g, "-"));
  }
  return roles;
}

/**
 * The roles that a workflow type needs in the config: each row of its
 * `## Roles` table that names a standard role (front desk, foreman, builder,
 * or reviewer). A row with another name, such as "Specialist" or "Unit roles",
 * describes roles that the project or the unit's own type chooses, so it names
 * no required role (W30 R0 P3 review item 2).
 */
export function factoryTypeRequiredRoles(roles: readonly string[]): string[] {
  return roles.filter((role) => (FACTORY_STANDARD_ROLES as readonly string[]).includes(role));
}

function shippedTypeBytes(root: string, typeName: string): Uint8Array | null {
  const provider = loadInstalledSystemResourceProvider();
  if (!provider.ok) return null;
  const read = readSystemResource(`make-docs://system/reference/factory/workflows/${typeName}.md`, provider.value, { projectRoot: root, evidence: [], providerOnly: true }, "installed");
  return read.ok ? read.value.resource.content : null;
}

/** Read the workflow type that a config entry names, from the checkout at `root`. */
export function readFactoryType(root: string, typeName: string): FactoryTypeRead | FactoryTypeProblem {
  const projectFile = path.join(root, ...FACTORY_PROJECT_TYPE_FOLDER.split("/"), `${typeName}.md`);
  const shipped = (FACTORY_SHIPPED_TYPES as readonly string[]).includes(typeName);
  if (shipped && existsSync(projectFile)) {
    return {
      ok: false,
      code: "type-name-clash",
      reason: `The project type ${FACTORY_PROJECT_TYPE_FOLDER}/${typeName}.md uses the name of the shipped type make-docs://system/reference/factory/workflows/${typeName}.md.`,
    };
  }
  let bytes: Uint8Array | null = null;
  if (shipped) bytes = shippedTypeBytes(root, typeName);
  else if (existsSync(projectFile)) bytes = readFileSync(projectFile);
  if (bytes === null) {
    return { ok: false, code: "type-not-found", reason: `No workflow type named ${typeName} exists: neither a shipped type nor ${FACTORY_PROJECT_TYPE_FOLDER}/${typeName}.md.` };
  }
  const text = Buffer.from(bytes).toString("utf8");
  const version = factoryTypeVersion(text);
  if (version === null) return { ok: false, code: "type-version-missing", reason: `The workflow type ${typeName} has no "Type version: N" line.` };
  return {
    ok: true,
    source: shipped ? "shipped" : "project",
    facts: { name: typeName, version, fileDigest: factoryDigest(text) },
    roles: factoryTypeRoles(text),
  };
}

export type FactoryCheckoutConfig =
  | { ok: true; workflows: Record<string, FactoryWorkflowDefinition> }
  | { ok: false; reason: string };

/**
 * Read the `factory:` block of one checkout's config. A config that is not
 * valid gives its key paths only, never a value.
 */
export function readFactoryCheckoutConfig(root: string): FactoryCheckoutConfig {
  const file = path.join(root, ".make-docs", "config.yaml");
  if (!existsSync(file)) return { ok: false, reason: "The checkout has no .make-docs/config.yaml." };
  let loaded: ReturnType<typeof loadMakeDocsConfig>;
  try {
    loaded = loadMakeDocsConfig(root);
  } catch {
    return { ok: false, reason: "The checkout's .make-docs/config.yaml cannot be read." };
  }
  if (!loaded.valid) {
    const keys = [...new Set(loaded.diagnostics.map((diagnostic) => diagnostic.keyPath ?? "<root>"))].slice(0, 5);
    return { ok: false, reason: `The checkout's .make-docs/config.yaml is not valid at ${keys.join(", ")}. Fix those keys there.` };
  }
  try {
    const document = parseDocument(readFileSync(file, "utf8"), { uniqueKeys: true });
    const config = document.toJS() as Record<string, unknown> | null;
    const block = parseFactoryConfigBlock(config && typeof config === "object" ? config.factory : undefined);
    return { ok: true, workflows: block.workflows };
  } catch {
    return { ok: false, reason: "The factory block of the checkout's .make-docs/config.yaml is not valid." };
  }
}

/** The live facts of every machine tool row, by tool ID. */
export function factoryToolFacts(tools: readonly FactoryMachineToolRecord[]): Record<string, FactoryToolFacts> {
  return Object.fromEntries(tools.map((tool) => [tool.toolId, {
    toolId: tool.toolId,
    state: tool.state,
    reportedVersion: tool.reportedVersion,
    proofs: Object.fromEntries(tool.proofs.map((proof) => [proof.capabilityId, { result: proof.result, toolVersion: proof.toolVersion, notCovered: proof.notCovered }])),
  }]));
}

interface RoleToolPlan {
  toolId: string;
  state: string;
  reportedVersion: string | null;
  capabilities: Record<string, { result: string; toolVersion: string | null; notCovered: string[] }>;
}

function roleToolsOf(plan: Record<string, FactoryJsonValue> | null): Record<string, RoleToolPlan | null> {
  return ((plan?.roleTools ?? {}) as unknown) as Record<string, RoleToolPlan | null>;
}

/**
 * True when each role of the plan has a tool that is `available` and each
 * capability that the role needs is `proved` for the version the tool reports
 * (factory contract, Readiness: `wired`).
 */
export function factoryPlanIsWired(plan: Record<string, FactoryJsonValue>): boolean {
  for (const tool of Object.values(roleToolsOf(plan))) {
    if (!tool || tool.state !== "available") return false;
    for (const proof of Object.values(tool.capabilities)) {
      if (proof.result !== "proved") return false;
      if (tool.reportedVersion !== null && proof.toolVersion !== null && proof.toolVersion !== tool.reportedVersion) return false;
    }
  }
  return true;
}

/** Why one role's live tool does not match a proof, as drift entries (T15). */
/** "the builder role", or "the builder and foreman roles". */
function rolePhrase(roles: readonly string[]): string {
  return roles.length === 1 ? `the ${roles[0]} role` : `the ${roles.slice(0, -1).join(", ")} and ${roles.at(-1)} roles`;
}

/**
 * Why one tool's live facts do not match its proofs, as drift entries (T15).
 * `roles` are the roles that the tool fills, and `tool` holds the capabilities
 * of all of them, so one entry names every role and every capability.
 */
function liveToolDrift(roles: readonly string[], tool: RoleToolPlan | null): FactoryDriftEntry[] {
  if (!tool || roles.length === 0) return [];
  const entries: FactoryDriftEntry[] = [];
  const role = roles.join(", ");
  const phrase = rolePhrase(roles);
  if (tool.state === "missing") {
    entries.push({
      code: "tool-missing",
      role,
      toolId: tool.toolId,
      text: `Tool ${tool.toolId} for ${phrase} is missing on this machine.`,
      nextStep: `Bring ${tool.toolId} back and report it with make-docs factory tools save, or bind another tool to ${phrase} with make-docs factory workflow save.`,
    });
  }
  if (tool.state === "blocked") {
    entries.push({
      code: "permission-lost",
      role,
      toolId: tool.toolId,
      text: `Tool ${tool.toolId} for ${phrase} is blocked: it lost a permission that it needs.`,
      nextStep: `Restore the permission of ${tool.toolId}, then report it as available with make-docs factory tools save.`,
    });
  }
  const proved = [...new Set(Object.values(tool.capabilities).map((proof) => proof.toolVersion).filter((version): version is string => version !== null))].sort();
  if (tool.reportedVersion !== null && proved.some((version) => version !== tool.reportedVersion)) {
    entries.push({
      code: "tool-version-changed",
      role,
      toolId: tool.toolId,
      text: `Tool ${tool.toolId} for ${phrase} reports version ${tool.reportedVersion}, but its proof is for version ${proved.join(", ")}.`,
      nextStep: `Prove ${tool.toolId} again and save it with make-docs factory tools save, save the workflow, and pass a new test task. If version ${proved.join(", ")} comes back, the workflow is ready again with no new step.`,
    });
  }
  const contradicted = Object.entries(tool.capabilities).filter(([, proof]) => proof.result === "contradicted").map(([id]) => id).sort();
  if (contradicted.length > 0) {
    entries.push({
      code: "proof-contradicted",
      role,
      toolId: tool.toolId,
      text: `A proof of ${contradicted.join(", ")} for tool ${tool.toolId} (${phrase.slice("the ".length)}) was contradicted.`,
      nextStep: `Bind a tool to ${phrase} that has ${contradicted.join(", ")} proved, or prove it again with make-docs factory tools save, then save the workflow.`,
    });
  }
  return entries;
}

/** One tool's plan for several roles: the same tool facts, with the capabilities of every role. */
function mergedRoleTool(tools: Readonly<Record<string, RoleToolPlan | null>>, roles: readonly string[]): RoleToolPlan | null {
  const first = tools[roles[0]!] ?? null;
  if (!first) return null;
  const capabilities: RoleToolPlan["capabilities"] = {};
  for (const role of roles) Object.assign(capabilities, tools[role]?.capabilities ?? {});
  return { ...first, capabilities };
}

/** Compare two plan parts as canonical JSON, so key order never counts. */
function sameJson(left: unknown, right: unknown): boolean {
  return factoryCanonicalJson(left ?? null) === factoryCanonicalJson(right ?? null);
}

/** True when the tool facts of one role differ: its tool, state, or version, or a proof of a capability that both plans need. */
function toolFactsChanged(was: RoleToolPlan, now: RoleToolPlan): boolean {
  if (was.toolId !== now.toolId || was.state !== now.state || was.reportedVersion !== now.reportedVersion) return true;
  return Object.keys(now.capabilities).some((id) => Object.hasOwn(was.capabilities, id) && !sameJson(was.capabilities[id], now.capabilities[id]));
}

/**
 * The drift reason codes of a current plan that matches no saved revision,
 * against the latest saved revision: drift is a change without a save, and
 * every save makes the latest revision.
 */
export function factoryDriftEntries(current: FactoryResolvedPlan, reference: FactoryPlanRevisionRecord | null): FactoryDriftEntry[] {
  const before = reference ? (JSON.parse(reference.planJson) as Record<string, FactoryJsonValue>) : null;
  const entries: FactoryDriftEntry[] = [];
  const save = "Undo the change to restore the saved plan, or save the workflow with make-docs factory workflow save and pass a new test task.";
  if (before && reference && reference.configDigest !== current.configDigest) {
    entries.push({ code: "config-changed", role: null, toolId: null, text: FACTORY_DRIFT_WORDS["config-changed"], nextStep: save });
  }
  if (before && !sameJson(before.type, current.plan.type)) {
    entries.push({ code: "type-changed", role: null, toolId: null, text: FACTORY_DRIFT_WORDS["type-changed"], nextStep: "Save the workflow with make-docs factory workflow save and pass a new test task under the new type." });
  }
  if (before && reference && reference.bindingDigest !== current.bindingDigest) {
    entries.push({ code: "binding-changed", role: null, toolId: null, text: FACTORY_DRIFT_WORDS["binding-changed"], nextStep: save });
  }
  const beforeTools = roleToolsOf(before);
  const toolEntries: FactoryDriftEntry[] = [];
  const toolRoles = new Map<string, string[]>();
  for (const [role, tool] of Object.entries(roleToolsOf(current.plan))) {
    const live = liveToolDrift([role], tool);
    const was = beforeTools[role] ?? null;
    // Only the tool facts count here. A config edit that adds or removes a role or a capability is `config-changed`
    // already, so a role that is new, and a capability that is in one plan only, are not compared (review item 3).
    const changed = was !== null && tool !== null && toolFactsChanged(was, tool);
    // A live problem that the reference plan already had is not new drift, except a lost tool, which always drifts.
    const fresh = live.filter((entry) => !was || entry.code === "tool-missing" || changed);
    for (const entry of fresh) {
      const key = `${entry.code}\0${entry.toolId}`;
      if (!toolRoles.has(key)) toolEntries.push(entry);
      toolRoles.set(key, [...(toolRoles.get(key) ?? []), role]);
    }
    if (!fresh.length && changed && !entries.some((entry) => entry.code === "binding-changed")) {
      entries.push({ code: "binding-changed", role, toolId: tool?.toolId ?? null, text: `The proved facts of the tool for the ${role} role changed since the last save.`, nextStep: save });
    }
  }
  // One tool that fills several roles gives one entry for each code, naming every role.
  const tools = roleToolsOf(current.plan);
  for (const entry of toolEntries) {
    const roles = toolRoles.get(`${entry.code}\0${entry.toolId}`)!;
    if (roles.length === 1) {
      entries.push(entry);
      continue;
    }
    // The capability and version lists come from every merged role, not from the first one.
    entries.push(liveToolDrift(roles, mergedRoleTool(tools, roles)).find((candidate) => candidate.code === entry.code)!);
  }
  if (entries.length === 0) entries.push({ code: "binding-changed", role: null, toolId: null, text: FACTORY_DRIFT_WORDS["binding-changed"], nextStep: save });
  return entries;
}

/**
 * The next step of a saved workflow whose config entry is gone (review item 6).
 * `factory workflow clean` removes the saved workflow (owner decision 2026-11-24).
 */
export const FACTORY_REMOVED_WORKFLOW_NEXT_STEP =
  "To use it again, put its entry back in .make-docs/config.yaml. To remove its saved records, review the removal with make-docs factory workflow clean <workflow> and name the project. Until then it is drifted: it takes no new work and changes nothing else.";

export type FactoryLiveReadiness = FactoryReadiness | "unknown";

export interface FactoryWorkflowLiveState {
  workflowName: string;
  readiness: FactoryLiveReadiness;
  /** Why the readiness is unknown, or why the workflow is not set up. */
  reason: string | null;
  /** The readiness code of a saved, unchanged plan that is not `ready`: `test-failed`, or null. */
  readinessCode: FactoryReadinessCode | null;
  currentPlanDigest: string | null;
  /** The saved revision whose digest the current plan has, or null. */
  matchedRevision: number | null;
  readyRevision: number | null;
  latestRevision: number | null;
  drift: FactoryDriftEntry[];
  /** The plan that the live sources resolve, or null when it cannot be resolved. */
  plan: FactoryResolvedPlan | null;
  typeVersion: number | null;
  /** The next step in plain words. */
  nextStep: string | null;
}

/** The binding that a plan resolves with. */
export function bindingForPlan(binding: Pick<FactoryWorkflowBindingRecord, "roles" | "wakeMethod" | "channelRef" | "worktreeMethod" | "knownLosses">) {
  return { roles: binding.roles, wakeMethod: binding.wakeMethod, channelRef: binding.channelRef, worktreeMethod: binding.worktreeMethod, knownLosses: binding.knownLosses };
}

/**
 * The live state of one workflow in one checkout (T21). `config` is that
 * checkout's config; the type file comes from the same checkout.
 */
export function factoryWorkflowLiveState(
  db: StoreDatabase,
  input: { projectId: string; workflowName: string; root: string; config: FactoryCheckoutConfig; tools?: readonly FactoryMachineToolRecord[] },
): FactoryWorkflowLiveState {
  const binding = readFactoryWorkflowBinding(db, input.projectId, input.workflowName);
  const revisions = listFactoryPlanRevisions(db, input.projectId, input.workflowName);
  const latest = revisions.at(-1) ?? null;
  const ready = binding?.readyRevision === null || binding?.readyRevision === undefined ? null : revisions.find((revision) => revision.revision === binding.readyRevision) ?? null;
  const base = {
    workflowName: input.workflowName,
    readyRevision: binding?.readyRevision ?? null,
    latestRevision: latest?.revision ?? null,
    matchedRevision: null as number | null,
    readinessCode: null as FactoryReadinessCode | null,
    currentPlanDigest: null as string | null,
    drift: [] as FactoryDriftEntry[],
    plan: null as FactoryResolvedPlan | null,
    typeVersion: null as number | null,
  };
  if (!input.config.ok) {
    return { ...base, readiness: "unknown", reason: input.config.reason, nextStep: "Fix the checkout's config file, then check again." };
  }
  const definition = input.config.workflows[input.workflowName];
  if (!definition) {
    if (!binding) return { ...base, readiness: "unknown", reason: `The config has no factory workflow named ${input.workflowName}.`, nextStep: "Add the workflow with factory setup." };
    return {
      ...base,
      readiness: "drifted",
      reason: null,
      drift: [{ code: "config-changed", role: null, toolId: null, text: `The config of this checkout has no entry for workflow ${input.workflowName}.`, nextStep: FACTORY_REMOVED_WORKFLOW_NEXT_STEP }],
      nextStep: FACTORY_REMOVED_WORKFLOW_NEXT_STEP,
    };
  }
  const type = readFactoryType(input.root, definition.type);
  if (!type.ok) {
    if (type.code === "type-name-clash") {
      const entry: FactoryDriftEntry = { code: "type-name-clash", role: null, toolId: null, text: type.reason, nextStep: `Rename ${FACTORY_PROJECT_TYPE_FOLDER}/${definition.type}.md to a new name, and name that type in the config.` };
      return { ...base, readiness: binding ? "drifted" : "draft", reason: binding ? null : type.reason, drift: binding ? [entry] : [], nextStep: entry.nextStep };
    }
    return { ...base, readiness: "unknown", reason: type.reason, nextStep: "Fix the workflow type, then check again." };
  }
  if (!binding) {
    return { ...base, typeVersion: type.facts.version, readiness: "draft", reason: "The workflow is in the config, but setup has not saved it.", nextStep: "Run factory setup, which binds each role and saves the workflow with make-docs factory workflow save." };
  }
  const tools = input.tools ?? listFactoryMachineTools(db);
  const plan = resolveFactoryPlan({ workflowName: input.workflowName, definition, type: type.facts, binding: bindingForPlan(binding), tools: factoryToolFacts(tools) });
  const matched = revisions.find((revision) => revision.planDigest === plan.planDigest) ?? null;
  const live = { ...base, plan, currentPlanDigest: plan.planDigest, typeVersion: type.facts.version, matchedRevision: matched?.revision ?? null };
  if (ready && matched && matched.revision === ready.revision) {
    return { ...live, readiness: "ready", reason: null, nextStep: null };
  }
  if (matched) {
    const wired = factoryPlanIsWired(plan.plan);
    // The latest test result for a plan decides (owner decision 2026-11-24).
    const failed = readFactoryProofResult(db, input.projectId, input.workflowName, "failed");
    const passed = readFactoryProofResult(db, input.projectId, input.workflowName, "passed");
    const testFailed = failed !== null && failed.planDigest === plan.planDigest && !(passed !== null && passed.planDigest === plan.planDigest && passed.recordedAt >= failed.recordedAt);
    if (wired && testFailed) {
      return {
        ...live,
        readiness: "wired",
        readinessCode: "test-failed",
        // The readiness words already say that the latest test task failed, so the reason adds only the time and the code.
        reason: `It failed at ${failed.recordedAt}, so the workflow takes no new work. Reason code: test-failed.`,
        nextStep: `Fix what the test task found. Then run the test task again under plan revision ${matched.revision} and record a pass with make-docs factory proof save.`,
      };
    }
    return {
      ...live,
      readiness: wired ? "wired" : "draft",
      reason: null,
      nextStep: wired
        ? `Run the test task under plan revision ${matched.revision} and record it with make-docs factory proof save.`
        : "Bind a tool to each role and prove each capability it needs, then save the workflow again.",
    };
  }
  if (revisions.length === 0) {
    return { ...live, readiness: "draft", reason: "No plan revision is saved yet.", nextStep: "Save the workflow with make-docs factory workflow save." };
  }
  const drift = factoryDriftEntries(plan, latest);
  return { ...live, readiness: "drifted", reason: null, drift, nextStep: drift[0]!.nextStep };
}

/** The readiness word for people. With the code `test-failed`, a `wired` plan may have an older pass, so the words name the failed test. */
export function factoryReadinessWords(state: FactoryLiveReadiness, code: FactoryReadinessCode | null = null): string {
  switch (state) {
    case "ready":
      return "ready: it takes new work";
    case "wired":
      if (code === "test-failed") return "wired: saved and proved, but the latest test task under this plan failed";
      return "wired: saved and proved, but no test task has passed under this plan";
    case "draft":
      return "draft: not every role is bound and proved";
    case "drifted":
      return "drifted: something changed without a save, so it takes no new work";
    default:
      return "unknown";
  }
}
