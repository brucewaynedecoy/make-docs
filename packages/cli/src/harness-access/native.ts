import {
  closeSync,
  constants,
  existsSync,
  fstatSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { assertManagedPathHasNoSymlinks } from "../utils";
import {
  HARNESS_CALLER_IDENTITY_ARG,
  HARNESS_CALLER_IDENTITY_ENV,
  HARNESS_CALLER_REFERENCE_ARG,
  canonicalJson,
  encodeHarnessCallerIdentity,
  encodeHarnessCallerIdentityArgument,
  encodeHarnessCallerReference,
  fingerprintEntry,
  reverifyMakeDocsExecutableIdentity,
  sha256,
  validateHarnessCommandRules,
  type HarnessAccessPlan,
  type HarnessAccessReceipt,
  type HarnessAdapter,
  type HarnessApplyResult,
  type HarnessCommandRule,
  type HarnessCommandRuleAuthority,
  type HarnessCallerIdentity,
  type HarnessConnectionMethod,
  type HarnessDetectionResult,
  type HarnessId,
  type HarnessMethodDefinition,
  type HarnessNativeChange,
  type HarnessNativeFormat,
  type HarnessPlanInput,
  type HarnessReceiptEntry,
  type HarnessRemovalResult,
  type HarnessRemoveInput,
  type HarnessScope,
  type HarnessVerificationResult,
  type HarnessVerifyInput,
  type NativeEntryValue,
  type VerifiedExecutableIdentity,
} from "./contract";

export interface HarnessAdapterDefinition {
  id: string;
  version: number;
  harnessId: HarnessId;
  displayName: string;
  executableNames: readonly string[];
  projectRouterFiles: readonly string[];
  skillRoots: readonly string[];
  methods: readonly HarnessMethodDefinition[];
}

interface DesiredEntry {
  path: string;
  entryId: string;
  value: NativeEntryValue;
}

interface InspectedEntry {
  exists: boolean;
  value: NativeEntryValue | null;
}

interface LocatedManagedBlock {
  start: number;
  end: number;
  content: string;
}

interface HarnessNativeMutationHookContext {
  action: "remove" | "replace";
  absolutePath: string;
  relativePath: string;
}

let harnessNativeMutationHookForTests:
  | ((context: HarnessNativeMutationHookContext) => void)
  | null = null;

/** Test-only seam for a path swap at the final mutation boundary. */
export function __setHarnessNativeMutationHookForTests(
  hook: ((context: HarnessNativeMutationHookContext) => void) | null,
): void {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("The harness native mutation hook is available only to tests.");
  }
  harnessNativeMutationHookForTests = hook;
}

const CODEX_MCP_BEGIN = "# make-docs:begin harness-access codex mcp";
const CODEX_MCP_END = "# make-docs:end harness-access codex mcp";

export function createHarnessAdapter(definition: HarnessAdapterDefinition): HarnessAdapter {
  const adapter: HarnessAdapter = {
    ...definition,
    detect: input => detectHarness(definition, input.scope, input.root, input.path),
    plan: input => planHarnessAccess(adapter, input),
    apply: input =>
      applyHarnessAccessPlan(
        adapter,
        input.plan,
        input.approved,
        input.operationId,
        input.appliedVersion,
        input.verifiedAt,
      ),
    applyRemoval: input => applyHarnessRemovalPlan(adapter, input.plan, input.approved),
    verify: input => verifyHarnessAccess(adapter, input),
    repair: input => planHarnessAccess(adapter, input),
    planRemoval: input => planHarnessAccessRemoval(adapter, input),
  };
  return Object.freeze(adapter);
}

function detectHarness(
  adapter: HarnessAdapterDefinition,
  scope: HarnessScope,
  root: string,
  executablePath?: string,
): HarnessDetectionResult {
  try {
    assertSafeRoot(root);
    const evidence = new Set<string>();
    for (const executableName of adapter.executableNames) {
      if (findExecutableOnPath(executableName, executablePath)) evidence.add(`executable:${executableName}`);
    }
    for (const method of adapter.methods.filter(candidate => candidate.scopes.includes(scope))) {
      const relativePath = method.nativeFile(scope);
      assertNativePath(root, relativePath);
      const absolutePath = path.join(root, relativePath);
      if (existsSync(absolutePath)) evidence.add(relativePath);
      const nativeRoot = relativePath.split(path.sep)[0];
      if (nativeRoot && existsSync(path.join(root, nativeRoot))) evidence.add(nativeRoot);
    }
    return {
      adapterId: adapter.id,
      harnessId: adapter.harnessId,
      scope,
      state: evidence.size > 0 ? "detected" : "not-detected",
      evidence: [...evidence].sort(),
    };
  } catch (error) {
    return {
      adapterId: adapter.id,
      harnessId: adapter.harnessId,
      scope,
      state: "blocked",
      evidence: [],
      reason: toMessage(error),
    };
  }
}

function findExecutableOnPath(executableName: string, executablePath = process.env.PATH ?? ""): string | null {
  const pathEntries = executablePath.split(path.delimiter).filter(Boolean);
  const names = process.platform === "win32"
    ? [executableName, `${executableName}.exe`, `${executableName}.cmd`]
    : [executableName];
  for (const entry of pathEntries) {
    for (const name of names) {
      const candidate = path.join(entry, name);
      try {
        const stat = lstatSync(candidate);
        if (stat.isFile() && (process.platform === "win32" || (stat.mode & 0o111) !== 0)) {
          return candidate;
        }
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") continue;
      }
    }
  }
  return null;
}

function planHarnessAccess(adapter: HarnessAdapter, input: HarnessPlanInput): HarnessAccessPlan {
  const method = requireMethod(adapter, input.method, input.scope);
  validateExecutableIdentity(input.executable);
  assertSafeRoot(input.root);
  const desired = desiredEntry(
    adapter,
    method,
    input.scope,
    input.root,
    input.executable,
    input.commandRules,
    input.commandRuleAuthority,
  );
  assertNativePath(input.root, desired.path);
  const beforeContent = readNativeContent(input.root, desired.path);
  const receiptEntry = receiptEntryFor(adapter, input, desired.path, desired.entryId);

  let change: HarnessNativeChange;
  let state: HarnessAccessPlan["state"];
  if (method.nativeFormat === "claude-permission-json") {
    ({ change, state } = planClaudePermissionChange(desired, beforeContent, receiptEntry));
  } else try {
    const inspected = inspectEntry(method.nativeFormat, beforeContent, desired.value);
    const beforeEntryFingerprint = inspected.exists && inspected.value !== null
      ? fingerprintEntry(inspected.value)
      : null;

    if (inspected.exists && !receiptEntry) {
      change = blockedChange(
        desired,
        beforeContent,
        beforeEntryFingerprint,
        "The matching native entry has no exact Make Docs ownership receipt.",
      );
      state = "blocked";
    } else if (
      inspected.exists &&
      receiptEntry &&
      beforeEntryFingerprint !== receiptEntry.entryFingerprint
    ) {
      change = blockedChange(
        desired,
        beforeContent,
        beforeEntryFingerprint,
        "The native entry changed after the last verified receipt. Preserve it and review the change.",
      );
      state = "drifted";
    } else if (
      inspected.exists &&
      beforeEntryFingerprint === fingerprintEntry(desired.value)
    ) {
      change = {
        path: desired.path,
        entryId: desired.entryId,
        action: "none",
        ownership: "make-docs-owned",
        beforeFileFingerprint: fingerprintFile(beforeContent),
        afterFileFingerprint: fingerprintFile(beforeContent),
        beforeEntryValue: inspected.value,
        beforeEntryFingerprint,
        afterEntryFingerprint: beforeEntryFingerprint,
        afterEntryValue: desired.value,
      };
      state = "current";
    } else {
      const afterContent = applyEntry(method.nativeFormat, beforeContent, desired.value);
      change = {
        path: desired.path,
        entryId: desired.entryId,
        action: beforeContent === null ? "create" : "update",
        ownership: inspected.exists ? "make-docs-owned" : "missing",
        beforeFileFingerprint: fingerprintFile(beforeContent),
        afterFileFingerprint: fingerprintFile(afterContent),
        beforeEntryValue: inspected.value,
        beforeEntryFingerprint,
        afterEntryFingerprint: fingerprintEntry(desired.value),
        afterEntryValue: desired.value,
      };
      state = inspected.exists ? "drifted" : "missing";
    }
  } catch (error) {
    change = blockedChange(desired, beforeContent, null, toMessage(error));
    state = "blocked";
  }

  return sealPlan({
    schemaVersion: 1,
    kind: "apply",
    adapterId: adapter.id,
    adapterVersion: adapter.version,
    harnessId: adapter.harnessId,
    connectionMethod: method.id,
    scope: input.scope,
    root: path.normalize(input.root),
    executable: input.executable,
    state,
    changes: [change],
    reviewFingerprint: "",
    nextAction:
      state === "blocked" || (state === "drifted" && change.action === "none")
        ? change.blockedReason ?? "Review the native entry before any change."
        : change.action === "none"
          ? "No change is needed."
          : "Review and approve this exact native-file change.",
  });
}

function applyHarnessAccessPlan(
  adapter: HarnessAdapter,
  plan: HarnessAccessPlan,
  approved: boolean,
  operationId: string,
  appliedVersion: string,
  verifiedAt = new Date().toISOString(),
): HarnessApplyResult {
  assertPlanForAdapter(adapter, plan, "apply");
  assertReviewFingerprint(plan);
  if (!approved) throw new Error("Harness access apply needs explicit approval.");
  if (!operationId.trim()) throw new Error("Harness access apply needs an operation identifier.");
  if (!appliedVersion.trim()) throw new Error("Harness access apply needs an applied product version.");
  if (!Number.isFinite(Date.parse(verifiedAt))) {
    throw new Error("Harness access apply needs a valid verification time.");
  }
  if (plan.state === "blocked" || plan.state === "unsupported") {
    throw new Error(`Harness access cannot apply while its state is ${plan.state}.`);
  }
  const blocker = plan.changes.find(change => change.blockedReason);
  if (blocker?.blockedReason) throw new Error(blocker.blockedReason);

  const changedPaths: string[] = [];
  for (const change of plan.changes) {
    if (change.action === "none") continue;
    if (change.blockedReason) throw new Error(change.blockedReason);
    const liveContent = readNativeContent(plan.root, change.path);
    if (fingerprintFile(liveContent) === change.afterFileFingerprint) continue;
    if (fingerprintFile(liveContent) !== change.beforeFileFingerprint) {
      throw new Error(`Native configuration changed after review: ${change.path}.`);
    }
    if (change.afterEntryValue === null) {
      throw new Error(`The reviewed plan has no target native entry for ${change.path}.`);
    }
    const method = requireMethod(adapter, plan.connectionMethod, plan.scope);
      const afterContent = applyEntry(
        method.nativeFormat,
        liveContent,
        change.afterEntryValue,
        change.beforeEntryValue,
      );
    if (fingerprintFile(afterContent) !== change.afterFileFingerprint) {
      throw new Error(`The live native file cannot reproduce the reviewed change: ${change.path}.`);
    }
    writeNativeContent(
      plan.root,
      change.path,
      afterContent,
      change.beforeFileFingerprint,
    );
    changedPaths.push(change.path);
  }

  const entries = receiptEntriesFromPlan(plan);
  const receipt: HarnessAccessReceipt = {
    schemaVersion: 1,
    operationId,
    adapterId: adapter.id,
    adapterVersion: adapter.version,
    harnessId: adapter.harnessId,
    connectionMethod: plan.connectionMethod,
    scope: plan.scope,
    executable: plan.executable,
    appliedVersion,
    verifiedAt,
    entries,
    result: "verified",
    verificationResult: "passed",
    driftState: "current",
    recoveryStatus: "complete",
  };
  const verification = verifyAgainstReceipt(adapter, plan.root, receipt);
  if (verification.state !== "current") {
    throw new Error(verification.reason ?? "The native harness change did not verify.");
  }
  return { changedPaths, verification, receipt };
}

function verifyHarnessAccess(
  adapter: HarnessAdapter,
  input: HarnessVerifyInput,
): HarnessVerificationResult {
  const method = requireMethod(adapter, input.method, input.scope);
  validateExecutableIdentity(input.executable);
  assertSafeRoot(input.root);
  const desired = desiredEntry(
    adapter,
    method,
    input.scope,
    input.root,
    input.executable,
    input.commandRules,
    input.commandRuleAuthority,
  );
  const receiptEntry = receiptEntryFor(adapter, input, desired.path, desired.entryId);
  const content = readNativeContent(input.root, desired.path);
  try {
    const inspected = inspectEntry(method.nativeFormat, content, desired.value);
    if (!inspected.exists || inspected.value === null) {
      return verification(adapter, method.id, input.scope, "missing", [], "The native entry is absent.");
    }
    const entryFingerprint = fingerprintEntry(inspected.value);
    if (!receiptEntry) {
      return verification(
        adapter,
        method.id,
        input.scope,
        "blocked",
        [],
        "The native entry exists, but no exact Make Docs ownership receipt proves it.",
      );
    }
    if (entryFingerprint !== receiptEntry.entryFingerprint) {
      return verification(
        adapter,
        method.id,
        input.scope,
        "drifted",
        [],
        "The native entry differs from the verified receipt.",
      );
    }
    if (entryFingerprint !== fingerprintEntry(desired.value)) {
      return verification(
        adapter,
        method.id,
        input.scope,
        "drifted",
        [],
        "The verified native entry does not match the current reviewed intent.",
      );
    }
    return verification(adapter, method.id, input.scope, "current", [
      makeReceiptEntry(desired.path, desired.entryId, inspected.value, content, receiptEntry),
    ]);
  } catch (error) {
    return verification(adapter, method.id, input.scope, "blocked", [], toMessage(error));
  }
}

function planHarnessAccessRemoval(
  adapter: HarnessAdapter,
  input: HarnessRemoveInput,
): HarnessAccessPlan {
  const method = requireMethod(adapter, input.method, input.scope);
  validateExecutableIdentity(input.executable);
  assertSafeRoot(input.root);
  validateReceiptIdentity(adapter, input, input.receipt);
  const receiptEntry = input.receipt.entries[0];
  if (!receiptEntry || input.receipt.entries.length !== 1) {
    throw new Error("This adapter expects one exact native entry receipt.");
  }
  assertNativePath(input.root, receiptEntry.path);
  const beforeContent = readNativeContent(input.root, receiptEntry.path);
  let change: HarnessNativeChange;
  let state: HarnessAccessPlan["state"] = "current";
  try {
    const inspected = inspectEntry(method.nativeFormat, beforeContent, receiptEntry.value);
    if (!inspected.exists || inspected.value === null) {
      change = {
        path: receiptEntry.path,
        entryId: receiptEntry.entryId,
        action: "none",
        ownership: "missing",
        beforeFileFingerprint: fingerprintFile(beforeContent),
        afterFileFingerprint: fingerprintFile(beforeContent),
        beforeEntryValue: null,
        beforeEntryFingerprint: null,
        afterEntryFingerprint: null,
        afterEntryValue: null,
      };
      state = "missing";
    } else if (fingerprintEntry(inspected.value) !== receiptEntry.entryFingerprint) {
      change = blockedChange(
        { path: receiptEntry.path, entryId: receiptEntry.entryId, value: receiptEntry.value },
        beforeContent,
        fingerprintEntry(inspected.value),
        "The native entry changed after the receipt. Preserve it and review removal manually.",
      );
      state = "drifted";
    } else {
      const afterContent = removeEntry(method.nativeFormat, beforeContent, receiptEntry.value);
      change = {
        path: receiptEntry.path,
        entryId: receiptEntry.entryId,
        action: "remove",
        ownership: "make-docs-owned",
        beforeFileFingerprint: fingerprintFile(beforeContent),
        afterFileFingerprint: fingerprintFile(afterContent),
        beforeEntryValue: inspected.value,
        beforeEntryFingerprint: receiptEntry.entryFingerprint,
        afterEntryFingerprint: null,
        afterEntryValue: null,
      };
    }
  } catch (error) {
    change = blockedChange(
      { path: receiptEntry.path, entryId: receiptEntry.entryId, value: receiptEntry.value },
      beforeContent,
      null,
      toMessage(error),
    );
    state = "blocked";
  }

  return sealPlan({
    schemaVersion: 1,
    kind: "remove",
    adapterId: adapter.id,
    adapterVersion: adapter.version,
    harnessId: adapter.harnessId,
    connectionMethod: method.id,
    scope: input.scope,
    root: path.normalize(input.root),
    executable: input.executable,
    state,
    changes: [change],
    reviewFingerprint: "",
    nextAction:
      change.blockedReason ??
      (change.action === "none"
        ? "The exact Make Docs entry is already absent."
        : "Review and approve removal of this exact Make Docs-owned entry."),
  });
}

function applyHarnessRemovalPlan(
  adapter: HarnessAdapter,
  plan: HarnessAccessPlan,
  approved: boolean,
): HarnessRemovalResult {
  assertPlanForAdapter(adapter, plan, "remove");
  assertReviewFingerprint(plan);
  if (!approved) throw new Error("Harness access removal needs explicit approval.");
  if (plan.state === "blocked" || plan.state === "drifted" || plan.state === "unsupported") {
    throw new Error(`Harness access cannot be removed while its state is ${plan.state}.`);
  }
  const changedPaths: string[] = [];
  for (const change of plan.changes) {
    if (change.action === "none") continue;
    const liveContent = readNativeContent(plan.root, change.path);
    if (fingerprintFile(liveContent) === change.afterFileFingerprint) continue;
    if (fingerprintFile(liveContent) !== change.beforeFileFingerprint) {
      throw new Error(`Native configuration changed after removal review: ${change.path}.`);
    }
    if (change.beforeEntryValue === null) {
      throw new Error(`The reviewed removal has no exact native entry for ${change.path}.`);
    }
    const method = requireMethod(adapter, plan.connectionMethod, plan.scope);
    const afterContent = removeEntry(method.nativeFormat, liveContent, change.beforeEntryValue);
    if (fingerprintFile(afterContent) !== change.afterFileFingerprint) {
      throw new Error(`The live native file cannot reproduce the reviewed removal: ${change.path}.`);
    }
    writeNativeContent(
      plan.root,
      change.path,
      afterContent,
      change.beforeFileFingerprint,
    );
    changedPaths.push(change.path);
  }
  const removalVerification = verifyRemovalPlan(adapter, plan);
  if (removalVerification.state !== "missing") {
    throw new Error(removalVerification.reason ?? "The native harness removal did not verify.");
  }
  return { changedPaths, verification: removalVerification };
}

function verifyRemovalPlan(
  adapter: HarnessAdapter,
  plan: HarnessAccessPlan,
): HarnessVerificationResult {
  const method = requireMethod(adapter, plan.connectionMethod, plan.scope);
  try {
    for (const change of plan.changes) {
      if (change.beforeEntryValue === null) continue;
      const content = readNativeContent(plan.root, change.path);
      const inspected = inspectEntry(method.nativeFormat, content, change.beforeEntryValue);
      if (inspected.exists) {
        return verification(
          adapter,
          plan.connectionMethod,
          plan.scope,
          "drifted",
          [],
          `The exact Make Docs-owned native entry remains after removal: ${change.path}.`,
        );
      }
    }
    return verification(
      adapter,
      plan.connectionMethod,
      plan.scope,
      "missing",
      [],
      "The exact Make Docs-owned native entry is absent.",
    );
  } catch (error) {
    return verification(adapter, plan.connectionMethod, plan.scope, "blocked", [], toMessage(error));
  }
}

function desiredEntry(
  adapter: HarnessAdapter,
  method: HarnessMethodDefinition,
  scope: HarnessScope,
  root: string,
  executable: VerifiedExecutableIdentity,
  commandRules: readonly HarnessCommandRule[] | undefined,
  commandRuleAuthority: HarnessCommandRuleAuthority | undefined,
): DesiredEntry {
  const nativePath = method.nativeFile(scope);
  const callerIdentity = makeHarnessCallerIdentity(adapter, method.id, root, executable);
  const encodedCallerIdentity = encodeHarnessCallerIdentity(callerIdentity);
  switch (method.nativeFormat) {
    case "codex-mcp-toml": {
      const command = tomlString(executable.path);
      const value = [
        CODEX_MCP_BEGIN,
        "[mcp_servers.make_docs]",
        `command = ${command}`,
        `args = [${tomlString("mcp")}]`,
        "[mcp_servers.make_docs.env]",
        `${HARNESS_CALLER_IDENTITY_ENV} = ${tomlString(encodedCallerIdentity)}`,
        CODEX_MCP_END,
      ].join("\n");
      return { path: nativePath, entryId: "mcp_servers.make_docs", value };
    }
    case "claude-mcp-json":
      return {
        path: nativePath,
        entryId: "mcpServers.make-docs",
        value: {
          command: executable.path,
          args: ["mcp"],
          env: { [HARNESS_CALLER_IDENTITY_ENV]: encodedCallerIdentity },
        },
      };
    case "codex-command-rules": {
      if (/\s/.test(executable.path)) {
        throw new Error("Codex command rules need an executable path with no whitespace.");
      }
      const rules = validateHarnessCommandRules(commandRules, commandRuleAuthority);
      const launchPrefix = codexRuleLaunchPrefix(
        encodeHarnessCallerIdentityArgument(callerIdentity),
        executable.path,
      );
      const lines = [
        "# Managed by Make Docs. Review through make-docs setup.",
        ...[...rules]
          .sort((left, right) => left.id.localeCompare(right.id))
          .map(rule =>
            `prefix_rule(pattern = [${[...launchPrefix, ...rule.commandPrefix]
              .map(word => JSON.stringify(word))
              .join(", ")}], decision = "allow")`,
          ),
        "",
      ];
      return { path: nativePath, entryId: "make-docs.command-rules", value: lines.join("\n") };
    }
    case "claude-permission-json": {
      if (/\s/.test(executable.path)) {
        throw new Error("Claude Code permission rules need an executable path with no whitespace.");
      }
      const rules = validateHarnessCommandRules(commandRules, commandRuleAuthority);
      const launchPrefix = claudePermissionRuleLaunchPrefix(
        encodeHarnessCallerReference(callerIdentity),
        executable.path,
      );
      const values = [...rules]
        .sort((left, right) => left.id.localeCompare(right.id))
        .map(rule => `Bash(${[...launchPrefix, ...rule.commandPrefix].join(" ")}:*)`)
        .sort();
      return { path: nativePath, entryId: "permissions.allow.make-docs", value: values };
    }
  }
}

function codexRuleLaunchPrefix(
  encodedCallerIdentity: string,
  executablePath: string,
): readonly string[] {
  if (process.platform === "win32") {
    throw new Error("Native rule launch identity is not implemented on Windows.");
  }
  return Object.freeze([
    executablePath,
    HARNESS_CALLER_IDENTITY_ARG,
    encodedCallerIdentity,
  ]);
}

function claudePermissionRuleLaunchPrefix(
  callerReference: string,
  executablePath: string,
): readonly string[] {
  if (process.platform === "win32") {
    throw new Error("Native rule launch identity is not implemented on Windows.");
  }
  return Object.freeze([
    executablePath,
    HARNESS_CALLER_REFERENCE_ARG,
    callerReference,
  ]);
}

function makeHarnessCallerIdentity(
  adapter: HarnessAdapter,
  connectionMethod: HarnessConnectionMethod,
  root: string,
  executable: VerifiedExecutableIdentity,
): HarnessCallerIdentity {
  return {
    schemaVersion: 1,
    kind: "make-docs-harness-caller",
    adapterId: adapter.id,
    adapterVersion: adapter.version,
    harnessId: adapter.harnessId,
    connectionMethod,
    scope: "machine",
    root: realpathSync(root),
    executable: { ...executable },
  };
}

function planClaudePermissionChange(
  desired: DesiredEntry,
  content: string | null,
  receiptEntry: HarnessReceiptEntry | undefined,
): { change: HarnessNativeChange; state: HarnessAccessPlan["state"] } {
  try {
    const desiredInspected = inspectEntry("claude-permission-json", content, desired.value);
    const desiredFingerprint = fingerprintEntry(desired.value);
    const receiptValues = receiptEntry
      ? requireClaudePermissionRuleArray(receiptEntry.value, "receipt")
      : [];
    if (receiptValues.some(value => !isMakeDocsClaudePermissionRule(value))) {
      throw new Error("The receipt contains a permission rule that Make Docs cannot prove it owns.");
    }
    const receiptSet = new Set(receiptValues);
    const unowned = listMakeDocsClaudePermissionRules(content)
      .filter(value => !receiptSet.has(value));
    if (unowned.length > 0) {
      return {
        change: blockedChange(
          desired,
          content,
          desiredInspected.value === null ? null : fingerprintEntry(desiredInspected.value),
          "A Make Docs-shaped Claude permission rule has no exact ownership receipt.",
        ),
        state: "blocked",
      };
    }

    const desiredIsComplete = desiredInspected.exists &&
      desiredInspected.value !== null &&
      fingerprintEntry(desiredInspected.value) === desiredFingerprint;
    if (desiredIsComplete) {
      if (!receiptEntry) {
        return {
          change: blockedChange(
            desired,
            content,
            desiredFingerprint,
            "The matching native entry has no exact Make Docs ownership receipt.",
          ),
          state: "blocked",
        };
      }
      if (receiptEntry.entryFingerprint !== desiredFingerprint) {
        return {
          change: blockedChange(
            desired,
            content,
            desiredFingerprint,
            "The Claude permission rules do not match the exact rules in the ownership receipt.",
          ),
          state: "drifted",
        };
      }
      return {
        change: {
          path: desired.path,
          entryId: desired.entryId,
          action: "none",
          ownership: "make-docs-owned",
          beforeFileFingerprint: fingerprintFile(content),
          afterFileFingerprint: fingerprintFile(content),
          beforeEntryValue: desiredInspected.value,
          beforeEntryFingerprint: desiredFingerprint,
          afterEntryFingerprint: desiredFingerprint,
          afterEntryValue: desired.value,
        },
        state: "current",
      };
    }

    if (receiptEntry) {
      const ownedInspected = inspectEntry("claude-permission-json", content, receiptEntry.value);
      const ownedFingerprint = ownedInspected.value === null
        ? null
        : fingerprintEntry(ownedInspected.value);
      if (!ownedInspected.exists || ownedFingerprint !== receiptEntry.entryFingerprint) {
        return {
          change: blockedChange(
            desired,
            content,
            ownedFingerprint,
            "The receipt-owned Claude permission rules are missing, changed, or incomplete.",
          ),
          state: "drifted",
        };
      }
      const afterContent = applyEntry(
        "claude-permission-json",
        content,
        desired.value,
        receiptEntry.value,
      );
      return {
        change: {
          path: desired.path,
          entryId: desired.entryId,
          action: "update",
          ownership: "make-docs-owned",
          beforeFileFingerprint: fingerprintFile(content),
          afterFileFingerprint: fingerprintFile(afterContent),
          beforeEntryValue: ownedInspected.value,
          beforeEntryFingerprint: ownedFingerprint,
          afterEntryFingerprint: desiredFingerprint,
          afterEntryValue: desired.value,
        },
        state: "drifted",
      };
    }

    if (desiredInspected.exists) {
      return {
        change: blockedChange(
          desired,
          content,
          desiredInspected.value === null ? null : fingerprintEntry(desiredInspected.value),
          "The partial Make Docs Claude permission entry has no exact ownership receipt.",
        ),
        state: "blocked",
      };
    }
    const afterContent = applyEntry("claude-permission-json", content, desired.value);
    return {
      change: {
        path: desired.path,
        entryId: desired.entryId,
        action: content === null ? "create" : "update",
        ownership: "missing",
        beforeFileFingerprint: fingerprintFile(content),
        afterFileFingerprint: fingerprintFile(afterContent),
        beforeEntryValue: null,
        beforeEntryFingerprint: null,
        afterEntryFingerprint: desiredFingerprint,
        afterEntryValue: desired.value,
      },
      state: "missing",
    };
  } catch (error) {
    return {
      change: blockedChange(desired, content, null, toMessage(error)),
      state: "blocked",
    };
  }
}

function requireClaudePermissionRuleArray(
  value: NativeEntryValue,
  source: "receipt" | "reviewed",
): string[] {
  if (!Array.isArray(value) || value.some(entry => typeof entry !== "string")) {
    throw new Error(`The ${source} Claude permission entry is malformed.`);
  }
  return value as string[];
}

function listMakeDocsClaudePermissionRules(content: string | null): string[] {
  if (content === null) return [];
  const root = parseJsonObject(content);
  if (root.permissions === undefined) return [];
  if (!isRecord(root.permissions)) throw new Error("The native permissions value is not an object.");
  const allow = root.permissions.allow;
  if (allow === undefined) return [];
  if (!Array.isArray(allow) || allow.some(value => typeof value !== "string")) {
    throw new Error("The native permissions.allow value is not a string array.");
  }
  return (allow as string[]).filter(isMakeDocsClaudePermissionRule);
}

function isMakeDocsClaudePermissionRule(value: string): boolean {
  return value.startsWith(`Bash(/usr/bin/env ${HARNESS_CALLER_IDENTITY_ENV}=`) ||
    value.includes(` ${HARNESS_CALLER_REFERENCE_ARG} `);
}

function inspectEntry(
  format: HarnessNativeFormat,
  content: string | null,
  expectedValue: NativeEntryValue,
): InspectedEntry {
  if (content === null) return { exists: false, value: null };
  switch (format) {
    case "codex-mcp-toml": {
      const block = locateCodexMcpBlock(content);
      if (!block && /\[\s*mcp_servers\.make_docs\s*\]/.test(content)) {
        throw new Error("A user-owned Codex MCP entry already uses mcp_servers.make_docs.");
      }
      return block ? { exists: true, value: block.content } : { exists: false, value: null };
    }
    case "codex-command-rules":
      return { exists: content.length > 0, value: content.length > 0 ? content : null };
    case "claude-mcp-json": {
      const root = parseJsonObject(content);
      const servers = root.mcpServers;
      if (servers === undefined) return { exists: false, value: null };
      if (!isRecord(servers)) throw new Error("The native mcpServers value is not an object.");
      return Object.hasOwn(servers, "make-docs")
        ? { exists: true, value: asNativeValue(servers["make-docs"]) }
        : { exists: false, value: null };
    }
    case "claude-permission-json": {
      const root = parseJsonObject(content);
      const permissions = root.permissions;
      if (permissions === undefined) return { exists: false, value: null };
      if (!isRecord(permissions)) throw new Error("The native permissions value is not an object.");
      const allow = permissions.allow;
      if (allow === undefined) return { exists: false, value: null };
      if (!Array.isArray(allow) || allow.some(value => typeof value !== "string")) {
        throw new Error("The native permissions.allow value is not a string array.");
      }
      if (!Array.isArray(expectedValue) || expectedValue.some(value => typeof value !== "string")) {
        throw new Error("The reviewed Make Docs permission entry is malformed.");
      }
      const expected = new Set(expectedValue as string[]);
      const present = (allow as string[]).filter(value => expected.has(value)).sort();
      return present.length > 0 ? { exists: true, value: present } : { exists: false, value: null };
    }
  }
}

function applyEntry(
  format: HarnessNativeFormat,
  content: string | null,
  value: NativeEntryValue,
  priorOwnedValue?: NativeEntryValue | null,
): string {
  switch (format) {
    case "codex-mcp-toml": {
      if (typeof value !== "string") throw new Error("The Codex MCP entry is malformed.");
      const source = content ?? "";
      const block = locateCodexMcpBlock(source);
      if (block) return source.slice(0, block.start) + value + source.slice(block.end);
      return source.trimEnd() ? `${source.trimEnd()}\n\n${value}\n` : `${value}\n`;
    }
    case "codex-command-rules":
      if (typeof value !== "string") throw new Error("The Codex command-rule entry is malformed.");
      return value;
    case "claude-mcp-json": {
      const root = content === null ? {} : parseJsonObject(content);
      const servers = root.mcpServers === undefined ? {} : root.mcpServers;
      if (!isRecord(servers)) throw new Error("The native mcpServers value is not an object.");
      root.mcpServers = { ...servers, "make-docs": value };
      return `${JSON.stringify(root, null, 2)}\n`;
    }
    case "claude-permission-json": {
      const desired = requireClaudePermissionRuleArray(value, "reviewed");
      const root = content === null ? {} : parseJsonObject(content);
      const permissions = root.permissions === undefined ? {} : root.permissions;
      if (!isRecord(permissions)) throw new Error("The native permissions value is not an object.");
      const allow = permissions.allow === undefined ? [] : permissions.allow;
      if (!Array.isArray(allow) || allow.some(entry => typeof entry !== "string")) {
        throw new Error("The native permissions.allow value is not a string array.");
      }
      const remove = priorOwnedValue === undefined || priorOwnedValue === null
        ? new Set<string>()
        : new Set(requireClaudePermissionRuleArray(priorOwnedValue, "receipt"));
      const preserved = (allow as string[]).filter(entry => !remove.has(entry));
      const merged = [...new Set([...preserved, ...desired])];
      root.permissions = { ...permissions, allow: merged };
      return `${JSON.stringify(root, null, 2)}\n`;
    }
  }
}

function removeEntry(
  format: HarnessNativeFormat,
  content: string | null,
  receiptValue: NativeEntryValue,
): string | null {
  if (content === null) return null;
  switch (format) {
    case "codex-mcp-toml": {
      const block = locateCodexMcpBlock(content);
      if (!block) return content;
      const remaining = `${content.slice(0, block.start)}${content.slice(block.end)}`
        .replace(/\n{3,}/g, "\n\n")
        .trim();
      return remaining ? `${remaining}\n` : null;
    }
    case "codex-command-rules":
      return null;
    case "claude-mcp-json": {
      const root = parseJsonObject(content);
      if (!isRecord(root.mcpServers)) throw new Error("The native mcpServers value is not an object.");
      const servers = { ...root.mcpServers };
      delete servers["make-docs"];
      root.mcpServers = servers;
      return `${JSON.stringify(root, null, 2)}\n`;
    }
    case "claude-permission-json": {
      if (!Array.isArray(receiptValue) || receiptValue.some(entry => typeof entry !== "string")) {
        throw new Error("The receipt permission entry is malformed.");
      }
      const root = parseJsonObject(content);
      if (!isRecord(root.permissions)) throw new Error("The native permissions value is not an object.");
      const permissions = { ...root.permissions };
      if (!Array.isArray(permissions.allow) || permissions.allow.some(entry => typeof entry !== "string")) {
        throw new Error("The native permissions.allow value is not a string array.");
      }
      const remove = new Set(receiptValue as string[]);
      permissions.allow = (permissions.allow as string[]).filter(entry => !remove.has(entry));
      root.permissions = permissions;
      return `${JSON.stringify(root, null, 2)}\n`;
    }
  }
}

function locateCodexMcpBlock(content: string): LocatedManagedBlock | null {
  if (content.includes("\0")) throw new Error("The Codex configuration contains a null byte.");
  if (/^(<{7}|={7}|>{7})/m.test(content)) {
    throw new Error("The Codex configuration contains unresolved conflict markers.");
  }
  validateCodexTomlContainer(content);
  const begins = indexesOf(content, CODEX_MCP_BEGIN);
  const ends = indexesOf(content, CODEX_MCP_END);
  if (begins.length !== ends.length || begins.length > 1) {
    throw new Error("The Codex Make Docs managed block markers are malformed.");
  }
  if (begins.length === 0) return null;
  if (ends[0] < begins[0]) throw new Error("The Codex Make Docs managed block markers are reversed.");
  const lineEnd = content.indexOf("\n", ends[0] + CODEX_MCP_END.length);
  const end = lineEnd === -1 ? content.length : lineEnd + 1;
  return { start: begins[0], end, content: content.slice(begins[0], ends[0] + CODEX_MCP_END.length) };
}

function validateCodexTomlContainer(content: string): void {
  if (content.includes('"""') || content.includes("'''")) {
    throw new Error("The Codex configuration contains multiline TOML that this bounded writer cannot validate.");
  }
  const values = new Set<string>();
  const tables = new Set<string>();
  let tablePath: readonly string[] = [];
  for (const statement of splitTomlStatements(content)) {
    if (statement.startsWith("[")) {
      const arrayTable = statement.startsWith("[[");
      const openLength = arrayTable ? 2 : 1;
      const close = arrayTable ? "]]" : "]";
      if (!statement.endsWith(close)) {
        throw new Error("The Codex configuration has a malformed table header.");
      }
      const key = statement.slice(openLength, -openLength).trim();
      tablePath = parseTomlKeyPath(key, "table header");
      const canonical = canonicalTomlPath(tablePath);
      if (tables.has(canonical) || hasOverlappingTomlPath(values, tablePath)) {
        throw new Error("The Codex configuration has a duplicate or conflicting table header.");
      }
      tables.add(canonical);
      continue;
    }

    const equals = findTopLevelTomlEquals(statement);
    if (equals < 0) {
      throw new Error("The Codex configuration has a malformed assignment.");
    }
    const keyPath = parseTomlKeyPath(statement.slice(0, equals).trim(), "assignment key");
    const valueSource = statement.slice(equals + 1).trim();
    if (!valueSource) throw new Error("The Codex configuration has an empty assignment value.");
    new TomlValueSyntaxParser(valueSource).parse();

    const fullPath = [...tablePath, ...keyPath];
    const canonical = canonicalTomlPath(fullPath);
    if (
      values.has(canonical) ||
      tables.has(canonical) ||
      hasOverlappingTomlPath(values, fullPath) ||
      hasDescendantTomlPath(tables, fullPath)
    ) {
      throw new Error("The Codex configuration has a duplicate or conflicting assignment.");
    }
    values.add(canonical);
  }
}

function splitTomlStatements(content: string): string[] {
  const statements: string[] = [];
  let pending = "";
  let collectionStack: string[] = [];
  for (const sourceLine of content.split(/\r?\n/)) {
    const line = stripTomlComment(sourceLine);
    if (!line.trim() && !pending) continue;
    pending += `${pending ? "\n" : ""}${line}`;
    collectionStack = scanTomlCollections(line, collectionStack);
    if (collectionStack.includes("}")) {
      throw new Error("The Codex configuration has a multiline inline table.");
    }
    if (collectionStack.length === 0) {
      if (pending.trim()) statements.push(pending.trim());
      pending = "";
    }
  }
  if (collectionStack.length !== 0) {
    throw new Error("The Codex configuration has an unfinished collection value.");
  }
  if (pending.trim()) statements.push(pending.trim());
  return statements;
}

function stripTomlComment(line: string): string {
  let quote: "'" | '"' | null = null;
  let escaped = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (quote === '"' && character === "\\") {
        escaped = true;
        continue;
      }
      if (character === quote) quote = null;
      if (character === "\n" || character === "\r") {
        throw new Error("The Codex configuration has an unfinished string value.");
      }
      continue;
    }
    if (character === "#") return line.slice(0, index);
    if (character === "'" || character === '"') {
      quote = character;
    }
  }
  if (quote) throw new Error("The Codex configuration has an unfinished string value.");
  return line;
}

function scanTomlCollections(line: string, initial: readonly string[]): string[] {
  const stack = [...initial];
  let quote: "'" | '"' | null = null;
  let escaped = false;
  for (const character of line) {
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (quote === '"' && character === "\\") {
        escaped = true;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }
    if (character === "'" || character === '"') {
      quote = character;
      continue;
    }
    if (character === "[" || character === "{") {
      stack.push(character === "[" ? "]" : "}");
    } else if (character === "]" || character === "}") {
      if (stack.pop() !== character) {
        throw new Error("The Codex configuration has unbalanced collection delimiters.");
      }
    }
  }
  return stack;
}

function findTopLevelTomlEquals(source: string): number {
  let quote: "'" | '"' | null = null;
  let escaped = false;
  let depth = 0;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (quote === '"' && character === "\\") escaped = true;
      else if (character === quote) quote = null;
      continue;
    }
    if (character === "'" || character === '"') quote = character;
    else if (character === "[" || character === "{") depth += 1;
    else if (character === "]" || character === "}") depth -= 1;
    else if (character === "=" && depth === 0) return index;
  }
  return -1;
}

function parseTomlKeyPath(source: string, location: string): string[] {
  const parser = new TomlKeySyntaxParser(source);
  const pathParts = parser.parse();
  if (pathParts.length === 0) {
    throw new Error(`The Codex configuration has an empty ${location}.`);
  }
  return pathParts;
}

function canonicalTomlPath(parts: readonly string[]): string {
  return JSON.stringify(parts);
}

function hasOverlappingTomlPath(paths: ReadonlySet<string>, candidate: readonly string[]): boolean {
  for (const serialized of paths) {
    const existing = JSON.parse(serialized) as string[];
    if (isTomlPathPrefix(existing, candidate) || isTomlPathPrefix(candidate, existing)) return true;
  }
  return false;
}

function hasDescendantTomlPath(paths: ReadonlySet<string>, candidate: readonly string[]): boolean {
  for (const serialized of paths) {
    const existing = JSON.parse(serialized) as string[];
    if (existing.length > candidate.length && isTomlPathPrefix(candidate, existing)) return true;
  }
  return false;
}

function isTomlPathPrefix(prefix: readonly string[], value: readonly string[]): boolean {
  return prefix.length <= value.length && prefix.every((part, index) => part === value[index]);
}

class TomlKeySyntaxParser {
  private index = 0;

  constructor(private readonly source: string) {}

  parse(): string[] {
    const parts: string[] = [];
    while (true) {
      this.skipWhitespace();
      parts.push(this.parsePart());
      this.skipWhitespace();
      if (this.index === this.source.length) return parts;
      if (this.source[this.index] !== ".") {
        throw new Error("The Codex configuration has a malformed key.");
      }
      this.index += 1;
      this.skipWhitespace();
      if (this.index === this.source.length) {
        throw new Error("The Codex configuration has an unfinished dotted key.");
      }
    }
  }

  private parsePart(): string {
    const quote = this.source[this.index];
    if (quote === "'" || quote === '"') {
      const start = this.index;
      this.index = consumeTomlString(this.source, this.index);
      const quoted = this.source.slice(start, this.index);
      return quote === "'" ? quoted.slice(1, -1) : JSON.parse(quoted) as string;
    }
    const start = this.index;
    while (/[A-Za-z0-9_-]/.test(this.source[this.index] ?? "")) this.index += 1;
    if (start === this.index) throw new Error("The Codex configuration has a malformed key.");
    return this.source.slice(start, this.index);
  }

  private skipWhitespace(): void {
    while (this.source[this.index] === " " || this.source[this.index] === "\t") this.index += 1;
  }
}

class TomlValueSyntaxParser {
  private index = 0;

  constructor(private readonly source: string) {}

  parse(): void {
    this.skipWhitespaceAndNewlines();
    this.parseValue();
    this.skipWhitespaceAndNewlines();
    if (this.index !== this.source.length) {
      throw new Error("The Codex configuration has trailing text after a value.");
    }
  }

  private parseValue(): void {
    const character = this.source[this.index];
    if (character === "'" || character === '"') {
      this.index = consumeTomlString(this.source, this.index);
      return;
    }
    if (character === "[") return this.parseArray();
    if (character === "{") return this.parseInlineTable();
    const start = this.index;
    while (this.index < this.source.length && !/[\s,\]}]/.test(this.source[this.index])) {
      this.index += 1;
    }
    const token = this.source.slice(start, this.index);
    if (!isValidTomlBareValue(token)) {
      throw new Error(`The Codex configuration has an invalid TOML value: ${token || "<empty>"}.`);
    }
  }

  private parseArray(): void {
    this.index += 1;
    this.skipWhitespaceAndNewlines();
    if (this.source[this.index] === "]") {
      this.index += 1;
      return;
    }
    while (true) {
      this.parseValue();
      this.skipWhitespaceAndNewlines();
      if (this.source[this.index] === "]") {
        this.index += 1;
        return;
      }
      if (this.source[this.index] !== ",") {
        throw new Error("The Codex configuration has a malformed TOML array.");
      }
      this.index += 1;
      this.skipWhitespaceAndNewlines();
      if (this.source[this.index] === "]") {
        this.index += 1;
        return;
      }
    }
  }

  private parseInlineTable(): void {
    this.index += 1;
    this.skipInlineWhitespace();
    if (this.source[this.index] === "}") {
      this.index += 1;
      return;
    }
    while (true) {
      const keyStart = this.index;
      const equals = this.findInlineEquals();
      parseTomlKeyPath(this.source.slice(keyStart, equals).trim(), "inline-table key");
      this.index = equals + 1;
      this.skipInlineWhitespace();
      this.parseValue();
      this.skipInlineWhitespace();
      if (this.source[this.index] === "}") {
        this.index += 1;
        return;
      }
      if (this.source[this.index] !== ",") {
        throw new Error("The Codex configuration has a malformed TOML inline table.");
      }
      this.index += 1;
      this.skipInlineWhitespace();
      if (this.source[this.index] === "}") {
        throw new Error("The Codex configuration has a trailing inline-table comma.");
      }
    }
  }

  private findInlineEquals(): number {
    let quote: "'" | '"' | null = null;
    let escaped = false;
    for (let index = this.index; index < this.source.length; index += 1) {
      const character = this.source[index];
      if (quote) {
        if (escaped) escaped = false;
        else if (quote === '"' && character === "\\") escaped = true;
        else if (character === quote) quote = null;
        continue;
      }
      if (character === "'" || character === '"') quote = character;
      else if (character === "=") return index;
      else if (character === "," || character === "}" || character === "\n") break;
    }
    throw new Error("The Codex configuration has a malformed TOML inline table.");
  }

  private skipWhitespaceAndNewlines(): void {
    while (/\s/.test(this.source[this.index] ?? "")) this.index += 1;
  }

  private skipInlineWhitespace(): void {
    while (this.source[this.index] === " " || this.source[this.index] === "\t") this.index += 1;
    if (this.source[this.index] === "\n" || this.source[this.index] === "\r") {
      throw new Error("The Codex configuration has a multiline TOML inline table.");
    }
  }
}

function consumeTomlString(source: string, start: number): number {
  const quote = source[start];
  let escaped = false;
  for (let index = start + 1; index < source.length; index += 1) {
    const character = source[index];
    if (character === "\n" || character === "\r") {
      throw new Error("The Codex configuration has an unfinished string value.");
    }
    if (quote === '"' && escaped) {
      if (!/[btnfr"\\]/.test(character) && character !== "u" && character !== "U") {
        throw new Error("The Codex configuration has an invalid TOML string escape.");
      }
      if (character === "u" || character === "U") {
        const length = character === "u" ? 4 : 8;
        const hex = source.slice(index + 1, index + 1 + length);
        if (!new RegExp(`^[0-9A-Fa-f]{${length}}$`).test(hex)) {
          throw new Error("The Codex configuration has an invalid TOML Unicode escape.");
        }
        const codePoint = Number.parseInt(hex, 16);
        if (
          codePoint <= 0x08 ||
          (codePoint >= 0x0b && codePoint <= 0x1f) ||
          codePoint === 0x7f ||
          codePoint > 0x10ffff ||
          (codePoint >= 0xd800 && codePoint <= 0xdfff)
        ) {
          throw new Error("The Codex configuration has an invalid TOML Unicode code point.");
        }
        index += length;
      }
      escaped = false;
      continue;
    }
    if (quote === '"' && character === "\\") {
      escaped = true;
      continue;
    }
    if (character === quote) return index + 1;
    const codePoint = character.codePointAt(0) ?? 0;
    if (codePoint <= 0x08 || (codePoint >= 0x0b && codePoint <= 0x1f) || codePoint === 0x7f) {
      throw new Error("The Codex configuration has a control character in a string.");
    }
  }
  throw new Error("The Codex configuration has an unfinished string value.");
}

function isValidTomlBareValue(value: string): boolean {
  if (value === "true" || value === "false" || value === "inf" || value === "+inf" || value === "-inf") {
    return true;
  }
  if (value === "nan" || value === "+nan" || value === "-nan") return true;
  if (/^0x[0-9A-Fa-f](?:_?[0-9A-Fa-f])*$/.test(value)) return true;
  if (/^0o[0-7](?:_?[0-7])*$/.test(value)) return true;
  if (/^0b[01](?:_?[01])*$/.test(value)) return true;
  if (/^[+-]?(?:0|[1-9](?:_?\d)*)$/.test(value)) return true;
  if (/^[+-]?(?:(?:0|[1-9](?:_?\d)*)\.\d(?:_?\d)*(?:[eE][+-]?\d(?:_?\d)*)?|(?:0|[1-9](?:_?\d)*)[eE][+-]?\d(?:_?\d)*)$/.test(value)) {
    return true;
  }
  return isValidTomlDateOrTime(value);
}

function isValidTomlDateOrTime(value: string): boolean {
  const dateTime = /^(\d{4})-(\d{2})-(\d{2})[Tt ](\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:[Zz]|([+-])(\d{2}):(\d{2}))?$/.exec(value);
  if (dateTime) {
    const [, year, month, day, hour, minute, second, , offsetHour, offsetMinute] = dateTime;
    return isValidTomlDate(year, month, day) && isValidTomlTime(hour, minute, second) &&
      (!offsetHour || (Number(offsetHour) <= 23 && Number(offsetMinute) <= 59));
  }
  const date = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (date) return isValidTomlDate(date[1], date[2], date[3]);
  const time = /^(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?$/.exec(value);
  return Boolean(time && isValidTomlTime(time[1], time[2], time[3]));
}

function isValidTomlDate(year: string, month: string, day: string): boolean {
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return Number(month) >= 1 && Number(month) <= 12 && Number(day) >= 1 &&
    date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() === Number(month) - 1 &&
    date.getUTCDate() === Number(day);
}

function isValidTomlTime(hour: string, minute: string, second: string): boolean {
  return Number(hour) <= 23 && Number(minute) <= 59 && Number(second) <= 59;
}

function receiptEntryFor(
  adapter: HarnessAdapter,
  input: HarnessPlanInput,
  nativePath: string,
  entryId: string,
): HarnessReceiptEntry | undefined {
  if (!input.receipt) return undefined;
  validateReceiptIdentity(adapter, input, input.receipt);
  if (input.receipt.entries.length !== 1) {
    throw new Error("This adapter expects one exact native entry receipt.");
  }
  const entry = input.receipt.entries[0];
  if (entry.path !== nativePath || entry.entryId !== entryId) {
    throw new Error("The harness receipt does not identify this exact native entry.");
  }
  return entry;
}

function validateReceiptIdentity(
  adapter: HarnessAdapter,
  input: Pick<HarnessPlanInput, "method" | "scope" | "executable">,
  receipt: HarnessAccessReceipt,
): void {
  if (
    receipt.schemaVersion !== 1 ||
    receipt.adapterId !== adapter.id ||
    receipt.adapterVersion !== adapter.version ||
    receipt.harnessId !== adapter.harnessId ||
    receipt.connectionMethod !== input.method ||
    receipt.scope !== input.scope ||
    receipt.executable.path !== input.executable.path ||
    receipt.executable.sha256 !== input.executable.sha256 ||
    receipt.executable.productMarker !== input.executable.productMarker ||
    receipt.executable.packageName !== input.executable.packageName ||
    receipt.executable.packageVersion !== input.executable.packageVersion ||
    receipt.executable.packageRoot !== input.executable.packageRoot ||
    receipt.executable.binRelativePath !== input.executable.binRelativePath ||
    receipt.result !== "verified" ||
    receipt.verificationResult !== "passed" ||
    receipt.driftState !== "current" ||
    receipt.recoveryStatus !== "complete" ||
    !receipt.appliedVersion.trim() ||
    !Number.isFinite(Date.parse(receipt.verifiedAt)) ||
    receipt.entries.some(
      entry =>
        entry.ownership !== "make-docs" ||
        fingerprintEntry(entry.value) !== entry.entryFingerprint ||
        !/^[0-9a-f]{64}$/.test(entry.fileFingerprint),
    )
  ) {
    throw new Error("The harness receipt does not match this exact adapter, method, scope, and executable.");
  }
}

function receiptEntriesFromPlan(plan: HarnessAccessPlan): HarnessReceiptEntry[] {
  return plan.changes.map(change => {
    if (
      change.afterEntryValue === null ||
      !change.afterEntryFingerprint ||
      !change.afterFileFingerprint
    ) {
      throw new Error(`The reviewed plan has no verifiable result for ${change.path}.`);
    }
    const live = readNativeContent(plan.root, change.path);
    if (fingerprintFile(live) !== change.afterFileFingerprint) {
      throw new Error(`The applied native file does not match the reviewed result: ${change.path}.`);
    }
    return makeReceiptEntry(change.path, change.entryId, change.afterEntryValue, live, {
      beforeEntryFingerprint: change.beforeEntryFingerprint,
      beforeFileFingerprint: change.beforeFileFingerprint,
      beforeValue: change.beforeEntryValue,
    });
  });
}

function verifyAgainstReceipt(
  adapter: HarnessAdapter,
  root: string,
  receipt: HarnessAccessReceipt,
): HarnessVerificationResult {
  const method = requireMethod(adapter, receipt.connectionMethod, receipt.scope);
  const verifiedEntries: HarnessReceiptEntry[] = [];
  try {
    for (const entry of receipt.entries) {
      const content = readNativeContent(root, entry.path);
      const inspected = inspectEntry(method.nativeFormat, content, entry.value);
      if (!inspected.exists || inspected.value === null) {
        return verification(adapter, method.id, receipt.scope, "missing", [], "The applied native entry is absent.");
      }
      if (fingerprintEntry(inspected.value) !== entry.entryFingerprint) {
        return verification(adapter, method.id, receipt.scope, "drifted", [], "The applied native entry differs from its receipt.");
      }
      verifiedEntries.push(makeReceiptEntry(entry.path, entry.entryId, inspected.value, content, entry));
    }
    return verification(adapter, method.id, receipt.scope, "current", verifiedEntries);
  } catch (error) {
    return verification(adapter, method.id, receipt.scope, "blocked", [], toMessage(error));
  }
}

function makeReceiptEntry(
  nativePath: string,
  entryId: string,
  value: NativeEntryValue,
  content: string | null,
  previous?: Pick<
    HarnessReceiptEntry,
    "beforeEntryFingerprint" | "beforeFileFingerprint" | "beforeValue"
  >,
): HarnessReceiptEntry {
  if (content === null) throw new Error(`Cannot record an absent native file: ${nativePath}.`);
  return {
    path: nativePath,
    entryId,
    ownership: "make-docs",
    beforeEntryFingerprint: previous?.beforeEntryFingerprint ?? null,
    beforeFileFingerprint: previous?.beforeFileFingerprint ?? null,
    beforeValue: previous?.beforeValue ?? null,
    entryFingerprint: fingerprintEntry(value),
    fileFingerprint: sha256(content),
    value,
  };
}

function requireMethod(
  adapter: HarnessAdapter,
  methodId: HarnessConnectionMethod,
  scope: HarnessScope,
): HarnessMethodDefinition {
  const method = adapter.methods.find(candidate => candidate.id === methodId);
  if (!method || !method.scopes.includes(scope)) {
    throw new Error(`${adapter.displayName} does not implement ${methodId} for ${scope} scope.`);
  }
  return method;
}

function assertSafeRoot(root: string): void {
  if (!path.isAbsolute(root)) throw new Error("A harness native-configuration root must be absolute.");
  const stat = lstatSync(root);
  if (stat.isSymbolicLink()) throw new Error("A harness native-configuration root must not be a symbolic link.");
  if (!stat.isDirectory()) throw new Error("A harness native-configuration root must be a directory.");
}

function assertNativePath(root: string, relativePath: string): void {
  if (!relativePath || path.isAbsolute(relativePath)) {
    throw new Error(`Harness native path must be relative: ${relativePath}.`);
  }
  assertManagedPathHasNoSymlinks(root, relativePath);
}

function readNativeContent(root: string, relativePath: string): string | null {
  assertNativePath(root, relativePath);
  const absolutePath = path.join(root, relativePath);
  const noFollow = typeof constants.O_NOFOLLOW === "number" ? constants.O_NOFOLLOW : 0;
  let fd: number;
  try {
    fd = openSync(absolutePath, constants.O_RDONLY | noFollow);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    if ((error as NodeJS.ErrnoException).code === "ELOOP") {
      throw new Error(`Harness native file is a symbolic link: ${relativePath}.`);
    }
    throw error;
  }
  let bytes: Buffer;
  try {
    const stat = fstatSync(fd);
    if (!stat.isFile()) {
      throw new Error(`Harness native path is not a regular file: ${relativePath}.`);
    }
    bytes = readFileSync(fd);
  } finally {
    closeSync(fd);
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error(`Harness native file is not valid UTF-8: ${relativePath}.`);
  }
}

function writeNativeContent(
  root: string,
  relativePath: string,
  content: string | null,
  expectedBeforeFingerprint: string | null,
): void {
  assertNativePath(root, relativePath);
  const absolutePath = path.join(root, relativePath);
  if (content !== null) ensureNativeParent(root, relativePath);
  const parent = path.dirname(absolutePath);
  const guard = openParentGuard(parent);
  try {
    assertParentGuard(root, relativePath, guard);
    const liveBefore = readNativeContent(root, relativePath);
    if (fingerprintFile(liveBefore) !== expectedBeforeFingerprint) {
      throw new Error(`Native configuration changed immediately before replacement: ${relativePath}.`);
    }
    if (content === null) {
      if (liveBefore === null) return;
      const targetGuard = openTargetGuard(absolutePath, relativePath);
      try {
        harnessNativeMutationHookForTests?.({
          action: "remove",
          absolutePath,
          relativePath,
        });
        assertNativeMutationBoundary(root, relativePath, guard, targetGuard);
        unlinkSync(absolutePath);
        assertParentGuard(root, relativePath, guard);
        if (readNativeContent(root, relativePath) !== null) {
          throw new Error(`Harness native file still exists after removal: ${relativePath}.`);
        }
      } finally {
        closeTargetGuard(targetGuard);
      }
      return;
    }
    const temporary = path.join(
      parent,
      `.${path.basename(relativePath)}.${randomUUID()}.tmp`,
    );
    writeFileSync(temporary, content, { encoding: "utf8", flag: "wx", mode: 0o600 });
    try {
      assertParentGuard(root, relativePath, guard);
      const finalBefore = readNativeContent(root, relativePath);
      if (fingerprintFile(finalBefore) !== expectedBeforeFingerprint) {
        throw new Error(
          `Native configuration changed immediately before replacement: ${relativePath}.`,
        );
      }
      const targetGuard = openTargetGuard(absolutePath, relativePath);
      try {
        harnessNativeMutationHookForTests?.({
          action: "replace",
          absolutePath,
          relativePath,
        });
        assertNativeMutationBoundary(root, relativePath, guard, targetGuard);
        renameSync(temporary, absolutePath);
        assertParentGuard(root, relativePath, guard);
        if (fingerprintFile(readNativeContent(root, relativePath)) !== fingerprintFile(content)) {
          throw new Error(`Harness native file does not match the reviewed content: ${relativePath}.`);
        }
      } finally {
        closeTargetGuard(targetGuard);
      }
    } catch (error) {
      try {
        assertParentGuard(root, relativePath, guard);
        if (existsSync(temporary)) unlinkSync(temporary);
      } catch {
        // A replaced parent is unsafe to traverse for cleanup. The temporary
        // file stays in the original reviewed directory for manual recovery.
      }
      throw error;
    }
  } finally {
    closeSync(guard.fd);
  }
}

interface ParentGuard {
  fd: number;
  path: string;
  dev: number;
  ino: number;
}

type TargetGuard =
  | { exists: false }
  | { exists: true; fd: number; dev: number; ino: number };

function ensureNativeParent(root: string, relativePath: string): void {
  const parentRelative = path.dirname(relativePath);
  if (parentRelative === ".") return;
  let current = root;
  for (const segment of parentRelative.split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    try {
      mkdirSync(current, { mode: 0o700 });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    }
    assertManagedPathHasNoSymlinks(root, path.relative(root, current));
    const stat = lstatSync(current);
    if (!stat.isDirectory()) {
      throw new Error(`Harness native parent is not a directory: ${path.relative(root, current)}.`);
    }
  }
}

function openParentGuard(parent: string): ParentGuard {
  const noFollow = typeof constants.O_NOFOLLOW === "number" ? constants.O_NOFOLLOW : 0;
  const directory = typeof constants.O_DIRECTORY === "number" ? constants.O_DIRECTORY : 0;
  const fd = openSync(parent, constants.O_RDONLY | noFollow | directory);
  const stat = fstatSync(fd);
  if (!stat.isDirectory()) {
    closeSync(fd);
    throw new Error("Harness native parent is not a directory.");
  }
  return { fd, path: parent, dev: stat.dev, ino: stat.ino };
}

function assertParentGuard(root: string, relativePath: string, guard: ParentGuard): void {
  assertNativePath(root, relativePath);
  const descriptor = fstatSync(guard.fd);
  const live = lstatSync(guard.path);
  if (
    live.isSymbolicLink() ||
    !live.isDirectory() ||
    live.dev !== guard.dev ||
    live.ino !== guard.ino ||
    descriptor.dev !== guard.dev ||
    descriptor.ino !== guard.ino
  ) {
    throw new Error(`Harness native parent changed after review: ${relativePath}.`);
  }
}

function openTargetGuard(absolutePath: string, relativePath: string): TargetGuard {
  const noFollow = typeof constants.O_NOFOLLOW === "number" ? constants.O_NOFOLLOW : 0;
  let fd: number;
  try {
    fd = openSync(absolutePath, constants.O_RDONLY | noFollow);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { exists: false };
    if ((error as NodeJS.ErrnoException).code === "ELOOP") {
      throw new Error(`Harness native file is a symbolic link: ${relativePath}.`);
    }
    throw error;
  }
  try {
    const descriptor = fstatSync(fd);
    const live = lstatSync(absolutePath);
    if (
      !descriptor.isFile() ||
      live.isSymbolicLink() ||
      !live.isFile() ||
      live.dev !== descriptor.dev ||
      live.ino !== descriptor.ino
    ) {
      throw new Error(`Harness native target changed after review: ${relativePath}.`);
    }
    return { exists: true, fd, dev: descriptor.dev, ino: descriptor.ino };
  } catch (error) {
    closeSync(fd);
    throw error;
  }
}

function closeTargetGuard(guard: TargetGuard): void {
  if (guard.exists) closeSync(guard.fd);
}

function assertNativeMutationBoundary(
  root: string,
  relativePath: string,
  parentGuard: ParentGuard,
  targetGuard: TargetGuard,
): void {
  // Keep this check next to rename/unlink. Node does not expose renameat or
  // unlinkat, so the open descriptors prove that both reviewed path objects
  // still name the same directory and target at the last available boundary.
  assertParentGuard(root, relativePath, parentGuard);
  const absolutePath = path.join(root, relativePath);
  if (!targetGuard.exists) {
    try {
      lstatSync(absolutePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
      throw error;
    }
    throw new Error(`Harness native target changed after review: ${relativePath}.`);
  }
  const descriptor = fstatSync(targetGuard.fd);
  let live: ReturnType<typeof lstatSync>;
  try {
    live = lstatSync(absolutePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(`Harness native target changed after review: ${relativePath}.`);
    }
    throw error;
  }
  if (
    !descriptor.isFile() ||
    descriptor.dev !== targetGuard.dev ||
    descriptor.ino !== targetGuard.ino ||
    live.isSymbolicLink() ||
    !live.isFile() ||
    live.dev !== targetGuard.dev ||
    live.ino !== targetGuard.ino
  ) {
    throw new Error(`Harness native target changed after review: ${relativePath}.`);
  }
}

function blockedChange(
  desired: DesiredEntry,
  beforeContent: string | null,
  beforeEntryFingerprint: string | null,
  reason: string,
): HarnessNativeChange {
  return {
    path: desired.path,
    entryId: desired.entryId,
    action: "none",
    ownership: "unverified",
    beforeFileFingerprint: fingerprintFile(beforeContent),
    afterFileFingerprint: fingerprintFile(beforeContent),
    beforeEntryValue: null,
    beforeEntryFingerprint,
    afterEntryFingerprint: null,
    afterEntryValue: null,
    blockedReason: reason,
  };
}

function verification(
  adapter: HarnessAdapter,
  connectionMethod: HarnessConnectionMethod,
  scope: HarnessScope,
  state: HarnessVerificationResult["state"],
  entries: readonly HarnessReceiptEntry[],
  reason?: string,
): HarnessVerificationResult {
  return {
    adapterId: adapter.id,
    adapterVersion: adapter.version,
    harnessId: adapter.harnessId,
    connectionMethod,
    scope,
    state,
    entries,
    ...(reason ? { reason } : {}),
  };
}

function sealPlan(plan: HarnessAccessPlan): HarnessAccessPlan {
  const reviewFingerprint = planFingerprint(plan);
  return { ...plan, reviewFingerprint };
}

function planFingerprint(plan: HarnessAccessPlan): string {
  const { reviewFingerprint: _ignored, ...reviewed } = plan;
  return sha256(JSON.stringify(reviewed));
}

function assertReviewFingerprint(plan: HarnessAccessPlan): void {
  if (plan.reviewFingerprint !== planFingerprint(plan)) {
    throw new Error("The harness access plan changed after review.");
  }
}

function assertPlanForAdapter(
  adapter: HarnessAdapter,
  plan: HarnessAccessPlan,
  kind: HarnessAccessPlan["kind"],
): void {
  if (
    plan.schemaVersion !== 1 ||
    plan.kind !== kind ||
    plan.adapterId !== adapter.id ||
    plan.adapterVersion !== adapter.version ||
    plan.harnessId !== adapter.harnessId
  ) {
    throw new Error("The harness access plan does not belong to this adapter and action.");
  }
  assertSafeRoot(plan.root);
}

function validateExecutableIdentity(executable: VerifiedExecutableIdentity): void {
  if (
    executable.kind !== "make-docs" ||
    !path.isAbsolute(executable.path) ||
    !/^[0-9a-f]{64}$/.test(executable.sha256) ||
    !Number.isSafeInteger(executable.size) ||
    executable.size < 1 ||
    executable.productMarker !== "@brucewaynedecoy/make-docs:package-bin" ||
    executable.packageName !== "@brucewaynedecoy/make-docs" ||
    !executable.packageVersion.trim() ||
    !path.isAbsolute(executable.packageRoot) ||
    !executable.binRelativePath
  ) {
    throw new Error("The adapter needs a verified Make Docs executable identity.");
  }
  const stat = lstatSync(executable.path);
  if (stat.isSymbolicLink() || !stat.isFile()) {
    throw new Error("The verified Make Docs executable is no longer a regular file.");
  }
  const bytes = readFileSync(executable.path);
  if (bytes.byteLength !== executable.size || sha256(bytes) !== executable.sha256) {
    throw new Error("The verified Make Docs executable changed after verification.");
  }
  const verified = reverifyMakeDocsExecutableIdentity(executable);
  if (
    verified.productMarker !== executable.productMarker ||
    verified.packageName !== executable.packageName ||
    verified.packageVersion !== executable.packageVersion ||
    verified.packageRoot !== executable.packageRoot ||
    verified.binRelativePath !== executable.binRelativePath
  ) {
    throw new Error("The verified Make Docs package identity changed after verification.");
  }
}

function parseJsonObject(content: string): Record<string, unknown> {
  let value: unknown;
  try {
    value = JSON.parse(content);
  } catch (error) {
    throw new Error(`The native JSON file is malformed: ${toMessage(error)}`);
  }
  if (!isRecord(value)) throw new Error("The native JSON root is not an object.");
  return value;
}

function asNativeValue(value: unknown): NativeEntryValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) return value;
  if (Array.isArray(value)) return value.map(asNativeValue);
  if (isRecord(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, asNativeValue(child)]));
  }
  throw new Error("The native entry contains a value that JSON cannot preserve.");
}

function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function fingerprintFile(content: string | null): string | null {
  return content === null ? null : sha256(content);
}

function indexesOf(content: string, token: string): number[] {
  const indexes: number[] = [];
  let offset = 0;
  while (offset < content.length) {
    const index = content.indexOf(token, offset);
    if (index === -1) break;
    indexes.push(index);
    offset = index + token.length;
  }
  return indexes;
}

function tomlString(value: string): string {
  return JSON.stringify(value);
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
