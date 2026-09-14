import { confirm, isCancel, note, select } from "@clack/prompts";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { stdout as output } from "node:process";
import { FIRST_PARTY_HARNESS_ADAPTERS, listBoundedHarnessCommandRules, requireFirstPartyHarnessAdapter, resolveHarnessMethodSupport, verifyMakeDocsExecutable, type HarnessAccessPlan, type HarnessAccessReceipt, type HarnessCommandRuleAuthority, type HarnessConformanceEvidence, type HarnessMethodSelection, type VerifiedExecutableIdentity } from "./harness-access/index.js";
import { resolveEffectiveHarnessIntegration, type ProjectHarnessIntegrationRecord } from "./config";
import { listHarnessCommandRules, validateRegistryHarnessCommandRules } from "./operations/registry";
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
export interface SystemSetupResult { status: SystemSetupStatus; scope: "machine"; selections: Record<Harness, HarnessMethodSelection>; configured: Harness[]; skipped: Harness[]; blocked: Array<{ harness: Harness; reason: string; nextAction: string }>; recoveryAction: string | null; }
export interface SystemHarnessPlan { harness: Harness; method: string; status: "configured" | "change-required" | "drifted" | "unsupported" | "blocked"; operations: string[]; machineFiles: string[]; changed: boolean; detail: string; apply(): Promise<void>; verify(): Promise<boolean>; pendingOperation?(): boolean; }
export interface SystemHarnessPlanner { harness: Harness; plan(): Promise<SystemHarnessPlan>; }
export interface RunSystemSetupOptions { dryRun: boolean; yes: boolean; harnesses: Record<Harness, boolean>; methods?: Partial<Record<Harness, HarnessMethodSelection>>; promptForMethods?: boolean; conformanceEvidence?: readonly HarnessConformanceEvidence[]; projectHarnessIntegrations?: readonly ProjectHarnessIntegrationRecord[]; targetRoot?: string; storeRoot?: string; machineRoot?: string; executable?: VerifiedExecutableIdentity; appliedVersion?: string; persistIntent?: boolean; planners?: SystemHarnessPlanner[]; reviewedAdapterPlansForTests?: readonly HarnessAccessPlan[]; afterNativeApplyForTests?: () => void | Promise<void>; }

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
  plans: SystemHarnessPlan[];
  intent: SystemIntentProjection;
  review: string;
  changed: boolean;
}

export async function runSystemSetupCommand(options: RunSystemSetupOptions): Promise<SystemSetupResult> {
  if (options.reviewedAdapterPlansForTests && process.env.NODE_ENV !== "test") {
    throw new Error("Reviewed adapter plan injection is only available to tests.");
  }
  const resumed = await resumePendingSystemSetupCommand(options);
  if (resumed) return resumed;
  const prepared = await prepareSystemSetupCommand(options);
  note(prepared.review, "This computer");
  const blockedPlans = prepared.plans.filter(plan => plan.status === "blocked" || plan.status === "unsupported");
  if (blockedPlans.length) {
    const nextAction = "Review the blocked harness details, then run `make-docs setup system` again.";
    output.write(`No machine changes were made. ${nextAction}\n`);
    return makeResult("blocked", prepared.selections, [], blockedPlans.map(plan => ({ harness: plan.harness, reason: plan.detail, nextAction })), nextAction);
  }
  if (options.dryRun) {
    output.write("Dry run complete. No machine files were changed.\n");
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
  if (options.reviewedAdapterPlansForTests && process.env.NODE_ENV !== "test") {
    throw new Error("Reviewed adapter plan injection is only available to tests.");
  }
  const machineRoot = options.machineRoot ?? os.homedir();
  const targetRoot = options.targetRoot ?? process.cwd();
  const storeRoot = options.storeRoot ?? resolveStoreRoot();
  const selections = await selectMethods(options, machineRoot, storeRoot);
  validateProjectHarnessIntegrations(options.projectHarnessIntegrations, selections, options.harnesses);
  const plans = options.planners
    ? await Promise.all(options.planners.filter(p => options.harnesses[p.harness]).map(p => p.plan()))
    : buildAdapterPlans(options, selections, machineRoot, targetRoot, storeRoot);
  const intent = buildIntentProjection(storeRoot, selections, options.harnesses, options.persistIntent !== false);
  const detection = inspectSystemHarnesses(machineRoot).filter(state => options.harnesses[state.harness]);
  const review = [
    ...detection.map(state => `${label(state.harness)} detection: ${state.state}${state.detail ? ` (${state.detail})` : ""}${state.nextAction ? ` Next: ${state.nextAction}` : ""}`),
    "Detection is a hint. It does not prove support or limit your choice.",
    "",
    ...renderMethodSupport(options.conformanceEvidence, machineRoot, options.harnesses),
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
    plans,
    intent,
    review,
    changed: plans.some(plan => plan.changed) || intent.changes.length > 0,
  };
}

export async function applyPreparedSystemSetup(prepared: PreparedSystemSetup): Promise<SystemSetupResult> {
  const { options, plans, selections, targetRoot, storeRoot } = prepared;
  const blockedPlans = plans.filter(plan => plan.status === "blocked" || plan.status === "unsupported");
  if (blockedPlans.length) {
    const nextAction = "Review the blocked harness details, then run `make-docs setup system` again.";
    return makeResult("blocked", selections, [], blockedPlans.map(plan => ({ harness: plan.harness, reason: plan.detail, nextAction })), nextAction);
  }
  if (options.persistIntent !== false && prepared.intent.changes.length > 0) {
    writeGlobalConfig(storeRoot, prepared.intent.config);
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
  if (!changed.length) {
    if (prepared.intent.changes.length > 0) {
      if ((Object.keys(options.harnesses) as Harness[]).some(harness => options.harnesses[harness] && selections[harness] !== "none")) {
        output.write("This computer intent is saved. No native files changed.\n");
        return makeResult("configured", selections, [], [], null);
      }
      output.write("No machine method was selected. The reviewed machine intent is saved. Resource reads still need no Store access.\n");
      return makeResult("skipped-none", selections, [], [], null);
    }
    if (plans.length) {
      output.write("This computer is already configured. No machine writes are planned.\n");
      return makeResult("unchanged", selections, plans.map(plan => plan.harness), [], null);
    }
    output.write("No machine method was selected. Resource reads still need no Store access.\n");
    return makeResult("skipped-none", selections, [], [], null);
  }
  output.write("This computer is configured and verified.\n");
  return makeResult("configured", selections, configured, [], null);
}

async function selectMethods(options: RunSystemSetupOptions, root: string, storeRoot: string): Promise<Record<Harness, HarnessMethodSelection>> {
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
    if (!options.promptForMethods || options.yes || options.dryRun) continue;
    const answer = await select<HarnessMethodSelection>({ message: `${adapter.displayName} connection method`, options: [
      { value: "none", label: "None", hint: "No native file changes. Resource reads still need no Store access." },
      ...adapter.methods.map(method => { const support = resolveHarnessMethodSupport(adapter, method.id, evidenceFor(options, adapter.id, method.id)); return { value: method.id, label: `${method.id} (${support.selectable ? "available" : "unavailable"})`, hint: `${path.resolve(root, method.nativeFile("machine"))}. ${support.reason}` }; }),
    ], initialValue: savedMethod });
    if (isCancel(answer) || typeof answer !== "string") continue;
    const method = answer as HarnessMethodSelection;
    if (method === "none") { chosen[adapter.harnessId] = "none"; continue; }
    chosen[adapter.harnessId] = method;
  }
  return chosen;
}

function buildAdapterPlans(options: RunSystemSetupOptions, selections: Record<Harness, HarnessMethodSelection>, root: string, targetRoot: string, storeRoot: string): SystemHarnessPlan[] {
  const rules = listBoundedHarnessCommandRules(SYSTEM_COMMAND_RULE_AUTHORITY);
  const plans: SystemHarnessPlan[] = [];
  for (const adapter of FIRST_PARTY_HARNESS_ADAPTERS) {
    const method = selections[adapter.harnessId];
    if (!options.harnesses[adapter.harnessId] || method === "none") continue;
    const support = resolveHarnessMethodSupport(adapter, method, evidenceFor(options, adapter.id, method));
    const definition = adapter.methods.find(item => item.id === method)!;
    const nativeFile = path.resolve(root, definition.nativeFile("machine"));
    const reviewedTestPlan = options.reviewedAdapterPlansForTests?.find(plan =>
      plan.harnessId === adapter.harnessId && plan.connectionMethod === method && plan.scope === "machine"
    );
    const currentReceipt: HarnessAccessReceipt | null = existsSync(getStoreDatabasePath(storeRoot))
      ? readCurrentHarnessIntegrationReceipt(targetRoot, storeRoot, "machine", adapter.harnessId, method)
      : null;
    if (!support.selectable && !reviewedTestPlan) { plans.push(blockedPlan(adapter.harnessId, method, support.reason, nativeFile)); continue; }
    let executable: VerifiedExecutableIdentity;
    try {
      executable = reviewedTestPlan?.executable ?? options.executable ?? verifyCurrentExecutable();
    } catch (error) {
      plans.push(blockedPlan(adapter.harnessId, method, error instanceof Error ? error.message : String(error), nativeFile));
      continue;
    }
    const commandRules = definition.requiresCommandRules ? rules : undefined;
    const adapterPlan = reviewedTestPlan ?? adapter.plan({ method, scope: "machine", root, executable, ...(commandRules ? { commandRules, commandRuleAuthority: SYSTEM_COMMAND_RULE_AUTHORITY } : {}), ...(currentReceipt ? { receipt: currentReceipt } : {}) });
    let receipt: HarnessAccessReceipt | undefined;
    let pending: PendingHarnessSystemOperation | undefined;
    plans.push({ harness: adapter.harnessId, method, status: adapterPlan.state === "current" ? "configured" : adapterPlan.state === "missing" ? "change-required" : adapterPlan.state, operations: commandRules ? commandRules.flatMap(rule => [...rule.operationIds]) : ["MCP resource and operation discovery"], machineFiles: adapterPlan.changes.map(change => change.path), changed: adapterPlan.changes.some(change => change.action !== "none"), detail: adapterPlan.nextAction,
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
    output.write(`Resumed and verified pending machine setup ${pending.operationId}.\n`);
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
        : method === "none"
          ? { store: "none" as const, project: "none" as const, hostConfig: "none" as const }
          : { store: "write" as const, project: "write" as const, hostConfig: "none" as const },
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
        accessCeiling: method === "none"
          ? { store: "none", project: "none", hostConfig: "none" }
          : { store: "write", project: "write", hostConfig: "none" },
      },
      harness,
    );
  }
}
function verifyCurrentExecutable(): VerifiedExecutableIdentity { const executablePath = path.resolve(process.argv[1] ?? ""); const bytes = readFileSync(executablePath); return verifyMakeDocsExecutable({ executablePath, expectedSha256: createHash("sha256").update(bytes).digest("hex") }); }
function evidenceFor(options: RunSystemSetupOptions, adapterId: string, method: string): HarnessConformanceEvidence | undefined { return options.conformanceEvidence?.find(item => item.adapterId === adapterId && item.connectionMethod === method); }
function blockedPlan(harness: Harness, method: string, detail: string, file: string): SystemHarnessPlan { return { harness, method, status: "blocked", operations: [], machineFiles: [file], changed: false, detail, async apply() {}, async verify() { return false; } }; }
function makeResult(status: SystemSetupStatus, selections: Record<Harness, HarnessMethodSelection>, configured: Harness[], blocked: SystemSetupResult["blocked"], recoveryAction: string | null): SystemSetupResult { return { status, scope: "machine", selections, configured, skipped: (Object.keys(selections) as Harness[]).filter(h => selections[h] === "none"), blocked, recoveryAction }; }
function label(harness: Harness): string { return harness === "claude-code" ? "Claude Code" : "Codex"; }

export function renderSystemPlans(plans: SystemHarnessPlan[]): string { if (!plans.length) return ["No native harness method is selected.", "Choosing none makes no native file changes.", "Resource reads need no Store access."].join("\n"); return plans.flatMap(plan => [`${label(plan.harness)} — ${plan.method}`, `- State: ${plan.status}`, `- Enabled operations: ${plan.operations.join(", ") || "none"}`, `- Native files: ${plan.machineFiles.join(", ") || "none"}`, `- Effect: ${plan.detail}`, "- None effect: no native file changes; Store-backed agent operations stay unavailable; resource reads still need no Store access."]).join("\n"); }
export function inspectSystemHarnesses(root = os.homedir()): SetupHarnessState[] { return FIRST_PARTY_HARNESS_ADAPTERS.map(adapter => { const detection = adapter.detect({ scope: "machine", root }); return { harness: adapter.harnessId, state: detection.state, detail: detection.reason ?? (detection.evidence.length ? detection.evidence.join(", ") : "No native entry found"), ...(detection.state === "blocked" ? { nextAction: `Resolve access to the ${adapter.displayName} native files, then run \`make-docs setup system\` again.` } : {}) }; }); }
function renderMethodSupport(evidence: readonly HarnessConformanceEvidence[] | undefined, root: string, selected: Record<Harness, boolean>): string[] { const rules = listBoundedHarnessCommandRules(SYSTEM_COMMAND_RULE_AUTHORITY); return FIRST_PARTY_HARNESS_ADAPTERS.filter(adapter => selected[adapter.harnessId]).flatMap(adapter => adapter.methods.map(method => { const support = resolveHarnessMethodSupport(adapter, method.id, evidence?.find(item => item.adapterId === adapter.id && item.connectionMethod === method.id)); const operations = method.requiresCommandRules ? rules.flatMap(rule => [...rule.operationIds]).join(", ") : "MCP resource and operation discovery"; return `${adapter.displayName} ${method.id}: ${support.state}; ${support.reason}; native file ${path.resolve(root, method.nativeFile("machine"))}; enabled operations ${operations}.`; })); }
