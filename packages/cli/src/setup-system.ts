import { confirm, isCancel, select } from "@clack/prompts";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { FIRST_PARTY_HARNESS_ADAPTERS, listBoundedHarnessCommandRules, requireFirstPartyHarnessAdapter, resolveHarnessMethodSupport, verifyMakeDocsExecutable, type HarnessAccessReceipt, type HarnessCommandRuleAuthority, type HarnessMethodSelection, type HarnessSupportFacts, type VerifiedExecutableIdentity } from "./harness-access/index.js";
import { loadConformanceTupleRegistry, type ConformanceTupleRegistry } from "./conformance/registry.js";
import type { ConformanceSupportTuple } from "./conformance/tuple.js";
import { resolveEffectiveHarnessIntegration, type ProjectHarnessIntegrationRecord } from "./config";
import { listHarnessCommandRules, listOperationAccessFacts, validateRegistryHarnessCommandRules } from "./operations/registry";
import { getStoreDatabasePath, resolveStoreRoot } from "./store/paths";
import { loadGlobalConfig, writeGlobalConfig, type GlobalConfig } from "./store/global-config";
import { readCurrentHarnessIntegrationReceipt, recordHarnessIntegrationReceipt } from "./store/harness-integration-receipts";
import { completeHarnessSystemOperation, prepareHarnessSystemOperation, readPendingHarnessSystemOperation, type PendingHarnessSystemOperation } from "./store/harness-system-operations";
import type { SetupHarnessState } from "./setup-state";
import type { Harness } from "./types";

export const SYSTEM_COMMAND_RULE_AUTHORITY: HarnessCommandRuleAuthority = Object.freeze({
  list: listHarnessCommandRules,
  validate: validateRegistryHarnessCommandRules,
});

export type SystemSetupStatus = "configured" | "skipped-none" | "blocked" | "partial" | "failed" | "recovery" | "unchanged";
export interface SystemSetupResult { schemaVersion: 2; status: SystemSetupStatus; scope: "machine"; selections: Record<Harness, HarnessMethodSelection>; configured: Harness[]; skipped: Harness[]; blocked: Array<{ harness: Harness; reason: string; nextAction: string }>; attemptedWork: string[]; mutationState: "none" | "planned" | "partial" | "verified"; failedCondition: string | null; nextAction: string | null; recoveryAction: string | null; }
export type SystemHarnessState = "current" | "drifted" | "blocked" | "unsupported" | "incomplete" | "pending";
export interface SystemHarnessPlan { harness: Harness; method: string; status: SystemHarnessState; operations: string[]; machineFiles: string[]; changed: boolean; detail: string; apply(): Promise<void>; verify(): Promise<boolean>; pendingOperation?(): boolean; }
export interface RunSystemSetupOptions { dryRun: boolean; yes: boolean; harnesses: Record<Harness, boolean>; methods?: Partial<Record<Harness, HarnessMethodSelection>>; promptForMethods?: boolean; projectHarnessIntegrations?: readonly ProjectHarnessIntegrationRecord[]; targetRoot?: string; storeRoot?: string; machineRoot?: string; executable?: VerifiedExecutableIdentity; appliedVersion?: string; persistIntent?: boolean; registryPath?: string; modelOrProvider?: Partial<Record<Harness, string>>; runtime?: string; harnessVersions?: Partial<Record<Harness, string>>; onReview?: (review: string) => void; afterNativeApplyForTests?: () => void | Promise<void>; }

interface SystemIntentChange {
  harness: Harness;
  before: HarnessMethodSelection;
  after: HarnessMethodSelection;
}

export interface SystemIntentProjection {
  config: GlobalConfig;
  changes: SystemIntentChange[];
}

export interface PreparedSystemSetup {
  options: RunSystemSetupOptions;
  machineRoot: string;
  targetRoot: string;
  storeRoot: string;
  selections: Record<Harness, HarnessMethodSelection>;
  registry: ConformanceTupleRegistry;
  plans: SystemHarnessPlan[];
  intent: SystemIntentProjection;
  review: string;
  changed: boolean;
}

export async function runSystemSetupCommand(options: RunSystemSetupOptions): Promise<SystemSetupResult> {
  const resumed = await resumePendingSystemSetupCommand(options);
  if (resumed) return resumed;
  const prepared = await prepareSystemSetupCommand(options);
  options.onReview?.(prepared.review);
  const blockedPlans = prepared.plans.filter(plan => plan.status === "blocked" || plan.status === "unsupported");
  if (blockedPlans.length) {
    const blocked = blockedPlans.map(plan => ({ harness: plan.harness, reason: plan.detail, nextAction: plan.detail }));
    return makeResult("blocked", prepared.selections, [], blocked, blocked[0]?.nextAction ?? null);
  }
  if (options.dryRun) {
    return makeResult(prepared.changed ? "partial" : prepared.plans.length ? "unchanged" : "skipped-none", prepared.selections, [], [], prepared.changed ? "Run `make-docs setup system --yes` to apply the reviewed machine changes." : null);
  }
  if (prepared.changed && !options.yes) {
    const approved = await confirm({ message: "Apply the reviewed This computer changes?", initialValue: false, active: "Yes", inactive: "No", withGuide: true });
    if (isCancel(approved) || !approved) return makeResult("blocked", prepared.selections, [], [], "Run `make-docs setup system` and approve the reviewed machine changes.");
  }
  return applyPreparedSystemSetup(prepared);
}

export async function resumePendingSystemSetupCommand(
  options: RunSystemSetupOptions,
): Promise<SystemSetupResult | null> {
  return resumePendingSystemSetup(
    options,
    options.machineRoot ?? os.homedir(),
    options.targetRoot ?? process.cwd(),
    options.storeRoot ?? resolveStoreRoot(),
  );
}

export async function prepareSystemSetupCommand(options: RunSystemSetupOptions): Promise<PreparedSystemSetup> {
  const machineRoot = options.machineRoot ?? os.homedir();
  const targetRoot = options.targetRoot ?? process.cwd();
  const storeRoot = options.storeRoot ?? resolveStoreRoot();
  const registry = loadConformanceTupleRegistry(options.registryPath ? { registryPath: options.registryPath } : {});
  const executable = options.executable ?? tryVerifyCurrentExecutable();
  const selections = await selectMethods(options, machineRoot, storeRoot, registry, executable);
  validateProjectHarnessIntegrations(options.projectHarnessIntegrations, selections, options.harnesses);
  const plans = buildAdapterPlans(options, selections, machineRoot, targetRoot, storeRoot, registry, executable);
  const intent = buildIntentProjection(storeRoot, selections, options.harnesses, options.persistIntent !== false);
  const detection = inspectSystemHarnesses(machineRoot).filter(state => options.harnesses[state.harness]);
  const review = [
    ...detection.map(state => `${label(state.harness)} detection: ${state.state}${state.detail ? ` (${state.detail})` : ""}${state.nextAction ? ` Next: ${state.nextAction}` : ""}`),
    "Detection is a hint. It does not prove support or limit your choice.",
    "",
    ...renderMethodSupport(options, registry, executable, machineRoot, options.harnesses),
    "",
    renderSystemPlans(plans),
    "",
    renderIntentChanges(storeRoot, intent.changes),
  ].join("\n");
  return {
    options,
    machineRoot,
    targetRoot,
    storeRoot,
    selections,
    registry,
    plans,
    intent,
    review,
    changed: plans.some(plan => plan.changed) || intent.changes.length > 0,
  };
}

/** Run only the method screens. Full project setup uses this between harness selection and shared Skills. */
export async function promptForSystemSetupMethods(
  options: RunSystemSetupOptions,
): Promise<Record<Harness, HarnessMethodSelection>> {
  const machineRoot = options.machineRoot ?? os.homedir();
  const storeRoot = options.storeRoot ?? resolveStoreRoot();
  const registry = loadConformanceTupleRegistry(options.registryPath ? { registryPath: options.registryPath } : {});
  const executable = options.executable ?? tryVerifyCurrentExecutable();
  return selectMethods(
    { ...options, promptForMethods: true, yes: false, dryRun: false },
    machineRoot,
    storeRoot,
    registry,
    executable,
  );
}

export async function applyPreparedSystemSetup(prepared: PreparedSystemSetup): Promise<SystemSetupResult> {
  const { options, plans, selections, targetRoot, storeRoot } = prepared;
  const blockedPlans = plans.filter(plan => plan.status === "blocked" || plan.status === "unsupported");
  if (blockedPlans.length) {
    const blocked = blockedPlans.map(plan => ({ harness: plan.harness, reason: plan.detail, nextAction: plan.detail }));
    return makeResult("blocked", selections, [], blocked, blocked[0]?.nextAction ?? null);
  }
  const changed = plans.filter(plan => plan.changed);
  const configured: Harness[] = [];
  for (const plan of changed) {
    try {
      await plan.apply();
      if (!(await plan.verify())) {
        const recovery = `Run \`make-docs setup system\` to review and resume the ${label(plan.harness)} machine change.`;
        return makeResult("recovery", selections, configured, [{ harness: plan.harness, reason: "The applied native entry did not verify.", nextAction: recovery }], recovery);
      }
      configured.push(plan.harness);
    } catch (error) {
      const recovery = `Run \`make-docs setup system\` to review and resume the ${label(plan.harness)} machine change.`;
      return makeResult(plan.pendingOperation?.() ? "recovery" : configured.length ? "partial" : "failed", selections, configured, [{ harness: plan.harness, reason: error instanceof Error ? error.message : String(error), nextAction: recovery }], recovery);
    }
  }
  if (options.persistIntent !== false && prepared.intent.changes.length > 0) {
    writeGlobalConfig(storeRoot, prepared.intent.config);
  }
  if (!changed.length) {
    if (prepared.intent.changes.length > 0) {
      if ((Object.keys(options.harnesses) as Harness[]).some(harness => options.harnesses[harness] && selections[harness] !== "none")) {
        return makeResult("configured", selections, [], [], null);
      }
      return makeResult("skipped-none", selections, [], [], null);
    }
    if (plans.length) {
      return makeResult("unchanged", selections, plans.map(plan => plan.harness), [], null);
    }
    return makeResult("skipped-none", selections, [], [], null);
  }
  return makeResult("configured", selections, configured, [], null);
}

async function selectMethods(
  options: RunSystemSetupOptions,
  root: string,
  storeRoot: string,
  registry: ConformanceTupleRegistry,
  executable: VerifiedExecutableIdentity | undefined,
): Promise<Record<Harness, HarnessMethodSelection>> {
  const chosen: Record<Harness, HarnessMethodSelection> = { codex: "none", "claude-code": "none" };
  const existing = loadGlobalConfig(storeRoot).config.settings.harnesses;
  for (const adapter of FIRST_PARTY_HARNESS_ADAPTERS) {
    const saved = existing[adapter.harnessId];
    const savedMethod = saved?.selected && adapter.methods.some(method => method.id === saved.maximumMethod)
      ? saved.maximumMethod as HarnessMethodSelection
      : "none";
    chosen[adapter.harnessId] = savedMethod;
    if (!options.harnesses[adapter.harnessId]) continue;
    const supplied = options.methods?.[adapter.harnessId];
    if (supplied) { chosen[adapter.harnessId] = supplied; continue; }
    if (!options.promptForMethods || options.yes || options.dryRun) {
      throw new Error(
        `${adapter.displayName} is included but has no explicit method. Pass the matching method flag, including \`none\` to disable it.`,
      );
    }
    const answer = await select<HarnessMethodSelection>({ message: `${adapter.displayName} connection method`, options: [
      { value: "none", label: "None", hint: "No native file changes. Resource reads still need no Store access." },
      ...adapter.methods.map(method => { const support = resolveHarnessMethodSupport(adapter, method.id, supportFacts(options, registry, executable, adapter.harnessId, method.id)); return { value: method.id, label: `${method.id} (${support.selectable ? "available" : "unavailable"})`, hint: `${path.resolve(root, method.nativeFile("machine"))}. ${support.reason}${support.nextAction ? ` Next: ${support.nextAction}` : ""}` }; }),
    ], initialValue: savedMethod });
    if (isCancel(answer) || typeof answer !== "string") continue;
    const method = answer as HarnessMethodSelection;
    if (method === "none") { chosen[adapter.harnessId] = "none"; continue; }
    chosen[adapter.harnessId] = method;
  }
  return chosen;
}

function buildAdapterPlans(options: RunSystemSetupOptions, selections: Record<Harness, HarnessMethodSelection>, root: string, targetRoot: string, storeRoot: string, registry: ConformanceTupleRegistry, verifiedExecutable: VerifiedExecutableIdentity | undefined): SystemHarnessPlan[] {
  const rules = listBoundedHarnessCommandRules(SYSTEM_COMMAND_RULE_AUTHORITY);
  const plans: SystemHarnessPlan[] = [];
  for (const adapter of FIRST_PARTY_HARNESS_ADAPTERS) {
    const method = selections[adapter.harnessId];
    if (!options.harnesses[adapter.harnessId] || method === "none") continue;
    const support = resolveHarnessMethodSupport(adapter, method, supportFacts(options, registry, verifiedExecutable, adapter.harnessId, method));
    const definition = adapter.methods.find(item => item.id === method)!;
    const nativeFile = path.resolve(root, definition.nativeFile("machine"));
    const currentReceipt: HarnessAccessReceipt | null = existsSync(getStoreDatabasePath(storeRoot))
      ? readCurrentHarnessIntegrationReceipt(targetRoot, storeRoot, "machine", adapter.harnessId, method)
      : null;
    if (!support.selectable) { plans.push(blockedPlan(adapter.harnessId, method, `${support.reason}${support.nextAction ? ` Next: ${support.nextAction}` : ""}`, nativeFile)); continue; }
    if (!verifiedExecutable) { plans.push(blockedPlan(adapter.harnessId, method, "The active packaged Make Docs executable could not be verified. Reinstall the package and review setup again.", nativeFile)); continue; }
    let executable: VerifiedExecutableIdentity;
    try {
      executable = verifiedExecutable;
    } catch (error) {
      plans.push(blockedPlan(adapter.harnessId, method, error instanceof Error ? error.message : String(error), nativeFile));
      continue;
    }
    const commandRules = definition.requiresCommandRules ? rules : undefined;
    const adapterPlan = adapter.plan({ method, scope: "machine", root, executable, ...(commandRules ? { commandRules, commandRuleAuthority: SYSTEM_COMMAND_RULE_AUTHORITY } : {}), ...(currentReceipt ? { receipt: currentReceipt } : {}) });
    let receipt: HarnessAccessReceipt | undefined;
    let pending: PendingHarnessSystemOperation | undefined;
    plans.push({ harness: adapter.harnessId, method, status: adapterPlan.state === "current" ? "current" : adapterPlan.state === "missing" ? "incomplete" : adapterPlan.state, operations: commandRules ? commandRules.flatMap(rule => [...rule.operationIds]) : ["MCP resource and operation discovery"], machineFiles: adapterPlan.changes.map(change => change.path), changed: adapterPlan.changes.some(change => change.action !== "none"), detail: adapterPlan.nextAction,
      async apply() { pending = prepareHarnessSystemOperation({ targetRoot, storeRoot, adapterId: adapter.id, harnessId: adapter.harnessId, plan: adapterPlan, appliedVersion: options.appliedVersion ?? executable.packageVersion, verifiedAt: new Date().toISOString() }); receipt = adapter.apply({ plan: adapterPlan, approved: true, operationId: pending.operationId, appliedVersion: pending.appliedVersion, verifiedAt: pending.verifiedAt }).receipt; await options.afterNativeApplyForTests?.(); },
      async verify() { const exactReceipt = receipt ?? currentReceipt; const verification = adapter.verify({ method, scope: "machine", root, executable, ...(commandRules ? { commandRules, commandRuleAuthority: SYSTEM_COMMAND_RULE_AUTHORITY } : {}), ...(exactReceipt ? { receipt: exactReceipt } : {}) }); if (verification.state !== "current" || !exactReceipt) return false; if (receipt) recordHarnessIntegrationReceipt(targetRoot, storeRoot, receipt); if (pending) completeHarnessSystemOperation(targetRoot, storeRoot, pending, exactReceipt); return true; },
      pendingOperation() { return pending !== undefined; },
    });
  }
  return plans;
}

async function resumePendingSystemSetup(
  options: RunSystemSetupOptions,
  machineRoot: string,
  targetRoot: string,
  storeRoot: string,
): Promise<SystemSetupResult | null> {
  const pending = readPendingHarnessSystemOperation(targetRoot, storeRoot);
  if (!pending) return null;
  const selections: Record<Harness, HarnessMethodSelection> = { codex: "none", "claude-code": "none" };
  selections[pending.harnessId] = pending.connectionMethod;
  const recoveryAction = `Run \`make-docs setup system --target ${JSON.stringify(targetRoot)}\` again to resume machine setup ${pending.operationId}.`;
  if (options.dryRun) {
    return makeResult("recovery", selections, [], [{ harness: pending.harnessId, reason: `Machine setup ${pending.operationId} is pending.`, nextAction: recoveryAction }], recoveryAction);
  }
  try {
    const adapter = requireFirstPartyHarnessAdapter(pending.harnessId);
    if (adapter.id !== pending.adapterId) throw new Error("The pending adapter identity does not match this build.");
    if (path.resolve(pending.plan.root) !== path.resolve(machineRoot)) {
      throw new Error(`The pending machine root ${pending.plan.root} does not match ${machineRoot}.`);
    }
    const executable = verifyMakeDocsExecutable({
      executablePath: pending.plan.executable.path,
      expectedSha256: pending.plan.executable.sha256,
    });
    if (JSON.stringify(executable) !== JSON.stringify(pending.plan.executable)) {
      throw new Error("The pending executable identity does not match this installed Make Docs binary.");
    }
    const definition = adapter.methods.find(method => method.id === pending.connectionMethod);
    if (!definition) throw new Error(`The pending ${pending.connectionMethod} method is not implemented by this adapter.`);
    const commandRules = definition.requiresCommandRules
      ? listBoundedHarnessCommandRules(SYSTEM_COMMAND_RULE_AUTHORITY)
      : undefined;
    const applied = adapter.apply({
      plan: pending.plan,
      approved: true,
      operationId: pending.operationId,
      appliedVersion: pending.appliedVersion,
      verifiedAt: pending.verifiedAt,
    });
    const verification = adapter.verify({
      method: pending.connectionMethod,
      scope: "machine",
      root: machineRoot,
      executable,
      ...(commandRules ? { commandRules, commandRuleAuthority: SYSTEM_COMMAND_RULE_AUTHORITY } : {}),
      receipt: applied.receipt,
    });
    if (verification.state !== "current") {
      throw new Error(`Pending machine setup did not verify: ${verification.reason ?? verification.state}`);
    }
    recordHarnessIntegrationReceipt(targetRoot, storeRoot, applied.receipt);
    completeHarnessSystemOperation(targetRoot, storeRoot, pending, applied.receipt);
    return makeResult("configured", selections, [pending.harnessId], [], null);
  } catch (error) {
    return makeResult("recovery", selections, [], [{ harness: pending.harnessId, reason: error instanceof Error ? error.message : String(error), nextAction: recoveryAction }], recoveryAction);
  }
}

function buildIntentProjection(
  storeRoot: string,
  selections: Record<Harness, HarnessMethodSelection>,
  included: Record<Harness, boolean>,
  enabled: boolean,
): SystemIntentProjection {
  const loaded = loadGlobalConfig(storeRoot);
  const changes: SystemIntentChange[] = [];
  if (!enabled) return { config: loaded.config, changes };
  for (const harness of Object.keys(selections) as Harness[]) {
    if (!included[harness]) continue;
    const method = selections[harness];
    const previous = loaded.config.settings.harnesses[harness];
    const sameMethod = previous?.selected === (method !== "none") &&
      previous.maximumMethod === (method === "none" ? null : method);
    const intent = {
      selected: method !== "none",
      maximumMethod: method === "none" ? null : method,
      accessCeiling: sameMethod && previous
        ? previous.accessCeiling
        : deriveHarnessAccessCeiling(method),
    };
    resolveEffectiveHarnessIntegration(undefined, intent, harness);
    const next = { ...(previous ?? {}), ...intent };
    if (JSON.stringify(previous ?? null) !== JSON.stringify(next)) {
      changes.push({
        harness,
        before: previous?.selected && previous.maximumMethod
          ? previous.maximumMethod as HarnessMethodSelection
          : "none",
        after: method,
      });
    }
    loaded.config.settings.harnesses[harness] = next;
  }
  return { config: loaded.config, changes };
}

function renderIntentChanges(storeRoot: string, changes: readonly SystemIntentChange[]): string {
  const configPath = path.join(storeRoot, "config.json");
  if (changes.length === 0) {
    return `Global intent file: ${configPath}\n- Effect: no global harness intent change.`;
  }
  return [
    `Global intent file: ${configPath}`,
    ...changes.map(change => `- ${label(change.harness)} intent: ${change.before} -> ${change.after}`),
    "- Effect: saves the reviewed machine access ceiling before any native harness change.",
  ].join("\n");
}

function validateProjectHarnessIntegrations(records: readonly ProjectHarnessIntegrationRecord[] | undefined, selections: Record<Harness, HarnessMethodSelection>, included: Record<Harness, boolean>): void {
  for (const harness of Object.keys(selections) as Harness[]) {
    if (!included[harness]) continue;
    const method = selections[harness];
    resolveEffectiveHarnessIntegration(
      records?.find(record => record.harness === harness),
      {
        selected: method !== "none",
        maximumMethod: method === "none" ? null : method,
        accessCeiling: deriveHarnessAccessCeiling(method),
      },
      harness,
    );
  }
}
export function deriveHarnessAccessCeiling(method: HarnessMethodSelection): { store: "none" | "read" | "write"; project: "none" | "read" | "write"; hostConfig: "none" } {
  if (method === "none") return { store: "none", project: "none", hostConfig: "none" };
  const facts = listOperationAccessFacts().filter(fact => fact.status === "active" && (method === "mcp" || fact.commandRuleCandidate));
  const maximum = (values: Array<"none" | "read" | "write">): "none" | "read" | "write" =>
    values.includes("write") ? "write" : values.includes("read") ? "read" : "none";
  return {
    store: maximum(facts.map(fact => fact.access.store)),
    project: maximum(facts.map(fact => fact.access.project)),
    hostConfig: "none",
  };
}
function verifyCurrentExecutable(): VerifiedExecutableIdentity { const executablePath = path.resolve(process.argv[1] ?? ""); const bytes = readFileSync(executablePath); return verifyMakeDocsExecutable({ executablePath, expectedSha256: createHash("sha256").update(bytes).digest("hex") }); }
function tryVerifyCurrentExecutable(): VerifiedExecutableIdentity | undefined { try { return verifyCurrentExecutable(); } catch { return undefined; } }
function supportFacts(
  options: RunSystemSetupOptions,
  registry: ConformanceTupleRegistry,
  executable: VerifiedExecutableIdentity | undefined,
  harness: Harness,
  method: Exclude<HarnessMethodSelection, "none">,
): HarnessSupportFacts | undefined {
  const envKey = harness === "codex"
    ? "MAKE_DOCS_CODEX_MODEL_OR_PROVIDER"
    : "MAKE_DOCS_CLAUDE_CODE_MODEL_OR_PROVIDER";
  const versionEnvKey = harness === "codex"
    ? "MAKE_DOCS_CODEX_HARNESS_VERSION"
    : "MAKE_DOCS_CLAUDE_CODE_HARNESS_VERSION";
  const modelOrProvider = options.modelOrProvider?.[harness] ?? process.env[envKey];
  const harnessVersion = options.harnessVersions?.[harness] ?? process.env[versionEnvKey] ?? detectHarnessVersion(harness);
  if (!executable || !modelOrProvider?.trim() || !harnessVersion?.trim()) return undefined;
  const scenarioByMethod = {
    mcp: "setup-access/mcp-store-operations",
    "command-rules": "setup-access/bounded-rule-store-operations",
    "permission-rules": "setup-access/permission-rule-store-operations",
  } as const;
  const surfaceByMethod = {
    mcp: "mcp",
    "command-rules": "cli-command-rules",
    "permission-rules": "cli-permission-rules",
  } as const;
  const tuple: ConformanceSupportTuple = {
    scenario: scenarioByMethod[method],
    harness,
    connectionMethod: method,
    surface: surfaceByMethod[method],
    scope: "machine",
    modelOrProvider: modelOrProvider.trim(),
    runtime: options.runtime ?? `${process.release.name}@${process.version}-${process.platform}-${process.arch}`,
  };
  return {
    registry,
    tuple,
    makeDocsVersion: executable.packageVersion,
    executableDigest: executable.sha256,
    behaviorDigest: executable.sha256,
    harnessVersion: harnessVersion.trim(),
  };
}
function detectHarnessVersion(harness: Harness): string | null {
  const command = harness === "codex" ? "codex" : "claude";
  const result = spawnSync(command, ["--version"], { encoding: "utf8", timeout: 5_000 });
  if (result.status !== 0) return null;
  const value = `${result.stdout ?? ""}`.trim();
  return value || null;
}
function blockedPlan(harness: Harness, method: string, detail: string, file: string): SystemHarnessPlan { return { harness, method, status: "blocked", operations: [], machineFiles: [file], changed: false, detail, async apply() {}, async verify() { return false; } }; }
function makeResult(status: SystemSetupStatus, selections: Record<Harness, HarnessMethodSelection>, configured: Harness[], blocked: SystemSetupResult["blocked"], recoveryAction: string | null): SystemSetupResult { const mutationState: SystemSetupResult["mutationState"] = status === "configured" ? "verified" : status === "partial" || status === "recovery" ? "partial" : "none"; return { schemaVersion: 2, status, scope: "machine", selections, configured, skipped: (Object.keys(selections) as Harness[]).filter(h => selections[h] === "none"), blocked, attemptedWork: [...configured.map(harness => `verified ${harness}`), ...blocked.map(item => `checked ${item.harness}`)], mutationState, failedCondition: blocked[0]?.reason ?? null, nextAction: recoveryAction ?? blocked[0]?.nextAction ?? null, recoveryAction }; }
function label(harness: Harness): string { return harness === "claude-code" ? "Claude Code" : "Codex"; }

export function renderSystemPlans(plans: SystemHarnessPlan[]): string { if (!plans.length) return ["No native harness method is selected.", "Choosing none makes no native file changes.", "Resource reads need no Store access."].join("\n"); return plans.flatMap(plan => { const ceiling = deriveHarnessAccessCeiling(plan.method as HarnessMethodSelection); return [`${label(plan.harness)} — ${plan.method}`, `- State: ${plan.status}`, `- Enabled operations: ${plan.operations.join(", ") || "none"}`, `- Access ceiling: Store ${ceiling.store}; project ${ceiling.project}; host config ${ceiling.hostConfig}`, `- Native files: ${plan.machineFiles.join(", ") || "none"}`, `- Effect: ${plan.detail}`, "- None effect: no native file changes; Store-backed agent operations stay unavailable; resource reads still need no Store access."]; }).join("\n"); }
export function inspectSystemHarnesses(root = os.homedir()): SetupHarnessState[] { return FIRST_PARTY_HARNESS_ADAPTERS.map(adapter => { const detection = adapter.detect({ scope: "machine", root }); return { harness: adapter.harnessId, state: detection.state, detail: detection.reason ?? (detection.evidence.length ? detection.evidence.join(", ") : "No native entry found"), ...(detection.state === "blocked" ? { nextAction: `Resolve access to the ${adapter.displayName} native files, then run \`make-docs setup system\` again.` } : {}) }; }); }
function renderMethodSupport(options: RunSystemSetupOptions, registry: ConformanceTupleRegistry, executable: VerifiedExecutableIdentity | undefined, root: string, selected: Record<Harness, boolean>): string[] { const rules = listBoundedHarnessCommandRules(SYSTEM_COMMAND_RULE_AUTHORITY); return FIRST_PARTY_HARNESS_ADAPTERS.filter(adapter => selected[adapter.harnessId]).flatMap(adapter => adapter.methods.map(method => { const support = resolveHarnessMethodSupport(adapter, method.id, supportFacts(options, registry, executable, adapter.harnessId, method.id)); const operations = method.requiresCommandRules ? rules.flatMap(rule => [...rule.operationIds]).join(", ") : "MCP resource and operation discovery"; return `${adapter.displayName} ${method.id}: ${support.state}; ${support.reason}${support.nextAction ? ` Next: ${support.nextAction}` : ""}; native file ${path.resolve(root, method.nativeFile("machine"))}; enabled operations ${operations}${support.caveats.length ? `; caveats ${support.caveats.join("; ")}` : ""}.`; })); }
