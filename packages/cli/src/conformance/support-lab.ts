/** Maintainer-only first-run lab for W19 R6 setup-access evidence. */
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  listBoundedHarnessCommandRules,
  requireFirstPartyHarnessAdapter,
  verifyReviewedMakeDocsPackageExecutable,
  type HarnessAccessReceipt,
  type HarnessConnectionMethod,
} from "../harness-access";
import {
  planProjectHarnessIntegrationWrite,
  type ProjectHarnessIntegrationRecord,
} from "../config";
import { applyInstallPlan, planInstall } from "../install";
import { loadManifest } from "../manifest";
import { deriveHarnessAccessCeiling, SYSTEM_COMMAND_RULE_AUTHORITY } from "../setup-system";
import { loadGlobalConfig, writeGlobalConfig } from "../store/global-config";
import { recordHarnessIntegrationReceipt } from "../store/harness-integration-receipts";
import { OperationError } from "../operations/types";
import {
  CONFORMANCE_TUPLE_REGISTRY_PATH,
  addProvisionalConformanceTuple,
  getConformanceTupleEntry,
  loadConformanceTupleRegistry,
  validateConformanceTupleRegistry,
  type ConformanceTupleRegistry,
} from "./registry";
import { conformanceResultRecordRelativePath } from "./governance";
import {
  recordValidatedConformanceResultOnRegistryEntry,
  validatePackagingConformanceResultRecord,
  type PackagingConformanceResultRecord,
} from "./scenario";
import {
  assertConformanceTupleCombination,
  validateConformanceSupportTuple,
  type ConformanceScenarioFamily,
  type ConformanceSupportTuple,
  type ConformanceTupleHarness,
  type ConformanceTupleConnectionMethod,
} from "./tuple";

export const SETUP_ACCESS_LAB_MANIFEST = "make-docs.setup-access-lab.v2" as const;

export interface BootstrapSetupAccessLabInput {
  scenario: ConformanceScenarioFamily;
  harness: ConformanceTupleHarness;
  connectionMethod: ConformanceTupleConnectionMethod;
  modelOrProvider: string;
  runtime: string;
  harnessVersion: string;
  packedProduct: string;
  sessionRoot: string;
  repoRoot: string;
  runDate?: string;
}

export interface SetupAccessLabManifest {
  schemaVersion: typeof SETUP_ACCESS_LAB_MANIFEST;
  runDate: string;
  harnessVersion: string;
  tuple: ConformanceSupportTuple;
  package: {
    sourceTarball: string;
    copiedTarball: string;
    tarballDigest: string;
    packageRoot: string;
    executablePath: string;
    executableDigest: string;
    behaviorDigest: string;
    makeDocsVersion: string;
    distributionType: "packed-npm";
  };
  registry: {
    source: string;
    sourceDigest: string;
    provisional: string;
    provisionalDigest: string;
    status: "provisional";
  };
  session: {
    root: string;
    home: string;
    project: string;
    store: string;
    evidence: string;
  };
  native: {
    applied: boolean;
    verified: boolean;
    files: string[];
    nativeConfigDigest: string;
    receipt: string | null;
    userContentSeed: {
      path: string;
      evidence: string;
      digest: string;
    };
  };
  promotion: {
    supportStatusChanged: false;
    resultWritten: false;
    nextAction: string;
  };
}

export interface BootstrappedSetupAccessLab {
  manifest: SetupAccessLabManifest;
  manifestPath: string;
  measurementsPath: string;
}

export interface CleanedSetupAccessLab {
  cleanupPath: string;
  nativeEntryRemoved: boolean;
  userContentPreserved: boolean;
}

export interface CleanupSetupAccessLabInput {
  manifestPath: string;
  repoRoot: string;
}

export interface SetupAccessLabMeasurements {
  schemaVersion: "make-docs.setup-access-measurements.v2";
  tuple: ConformanceSupportTuple;
  measured: {
    nativeFiles: boolean | null;
    callerOrLaunchIdentity: boolean | null;
    methodIdentity: boolean | null;
    storeRead: boolean | null;
    storeWrite: boolean | null;
    rejectedAccess: boolean | null;
    storeFreeResourceRead: boolean | null;
    storeSessionOpenedForResourceRead: boolean | null;
    cleanup: boolean | null;
    userContentPreserved: boolean | null;
  };
  evidenceReferences: string[];
  caveats: string[];
  transcriptLogPointer: string;
  transcriptFormat: "json" | "non-tty";
}

export interface IngestedSetupAccessLabResult {
  record: PackagingConformanceResultRecord;
  recordRef: string;
  promotedRegistry: ConformanceTupleRegistry;
}

function digest(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function assertSetupAccessLabBoundary(sessionRoot: string, repoRoot: string): void {
  const root = path.resolve(sessionRoot);
  const repo = path.resolve(repoRoot);
  const home = path.resolve(os.homedir());
  if (root === home) {
    throw new OperationError(`Refusing setup-access work at the real home boundary \`${root}\`.`);
  }
  if (inside(repo, root) || inside(root, repo)) {
    throw new OperationError(`Refusing setup-access work in or above the repository \`${repo}\`.`);
  }
  if (inside(root, home) || inside(home, root)) {
    throw new OperationError(`Refusing setup-access work at the real home boundary \`${root}\`.`);
  }
  if (!root.split(path.sep).includes("make-docs-conformance-lab")) {
    throw new OperationError(
      "A setup-access session root must be under a directory named `make-docs-conformance-lab`.",
    );
  }
}

function inside(parent: string, child: string): boolean {
  const relative = path.relative(parent, child);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

/** Reject a real home, the repository, repository children, and broad targets. */
export function assertDisposableSetupAccessLabRoot(sessionRoot: string, repoRoot: string): void {
  const root = path.resolve(sessionRoot);
  assertSetupAccessLabBoundary(root, repoRoot);
  if (existsSync(root) && readdirSync(root).length > 0) {
    throw new OperationError(`Setup-access session root \`${root}\` must be absent or empty.`);
  }
}

function seedNativeUserContent(
  tuple: ConformanceSupportTuple,
  home: string,
  inputsDir: string,
): SetupAccessLabManifest["native"]["userContentSeed"] {
  let relativePath: string;
  let content: string;
  if (tuple.harness === "codex" && tuple.connectionMethod === "mcp") {
    relativePath = ".codex/config.toml";
    content = '# User-owned lab sentinel.\n[projects."/make-docs-lab-user"]\ntrust_level = "trusted"\n';
  } else if (tuple.harness === "codex") {
    relativePath = ".codex/rules/user-owned-lab.rules";
    content = '# User-owned lab sentinel.\nprefix_rule(pattern = ["echo", "make-docs-lab-user"], decision = "allow")\n';
  } else if (tuple.connectionMethod === "mcp") {
    relativePath = ".claude.json";
    content = `${JSON.stringify({ makeDocsLabUserSetting: "preserve" }, null, 2)}\n`;
  } else if (tuple.connectionMethod === "permission-rules") {
    relativePath = ".claude/settings.json";
    content = `${JSON.stringify({
      makeDocsLabUserSetting: "preserve",
      permissions: { allow: ["Bash(echo make-docs-lab-user:*)"] },
    }, null, 2)}\n`;
  } else {
    relativePath = "make-docs-lab-user-content.txt";
    content = "preserve this user-owned lab content\n";
  }
  const absolutePath = path.join(home, relativePath);
  mkdirSync(path.dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, content);
  const evidence = path.join(inputsDir, "native-user-content-seed.json");
  const seed = { path: relativePath, content, digest: digest(content) };
  writeFileSync(evidence, `${JSON.stringify(seed, null, 2)}\n`);
  return { path: relativePath, evidence, digest: seed.digest };
}

function userContentSeedIsPresent(
  manifest: SetupAccessLabManifest,
  seed: { path: string; content: string; digest: string },
): boolean {
  const target = path.join(manifest.session.home, seed.path);
  if (!existsSync(target)) return false;
  const current = readFileSync(target, "utf8");
  if (manifest.tuple.harness === "claude-code" && seed.path.endsWith(".json")) {
    try {
      const value = JSON.parse(current) as Record<string, unknown>;
      if (value.makeDocsLabUserSetting !== "preserve") return false;
      if (manifest.tuple.connectionMethod === "permission-rules") {
        const permissions = value.permissions as { allow?: unknown } | undefined;
        return Array.isArray(permissions?.allow) && permissions.allow.includes("Bash(echo make-docs-lab-user:*)");
      }
      return true;
    } catch {
      return false;
    }
  }
  return current.includes(seed.content.trim());
}

function runChecked(command: string, args: string[], options: { cwd?: string; env?: NodeJS.ProcessEnv } = {}): string {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    env: options.env ?? process.env,
    encoding: "utf8",
    timeout: 120_000,
  });
  if (result.status !== 0) {
    throw new OperationError(
      `Setup-access bootstrap command failed: ${command} ${args.join(" ")}\n${result.stderr || result.stdout || `exit ${String(result.status)}`}`,
    );
  }
  return `${result.stdout ?? ""}`;
}

function installPackedProduct(tarball: string, productRoot: string): string {
  runChecked("npm", [
    "install",
    "--ignore-scripts",
    "--no-audit",
    "--no-fund",
    "--prefix",
    productRoot,
    tarball,
  ]);
  return path.join(
    productRoot,
    "node_modules",
    "@brucewaynedecoy",
    "make-docs",
  );
}

function establishDisposableProject(input: {
  executablePath: string;
  home: string;
  store: string;
  project: string;
}): void {
  mkdirSync(input.project, { recursive: true });
  runChecked(
    process.execPath,
    [
      input.executablePath,
      "setup",
      "--yes",
      "--no-codex",
      "--no-claude-code",
      "--target",
      input.project,
    ],
    {
      cwd: input.project,
      env: {
        ...process.env,
        HOME: input.home,
        MAKE_DOCS_HOME: input.store,
      },
    },
  );
}

async function applyLabNativeEntry(input: {
  tuple: ConformanceSupportTuple;
  home: string;
  project: string;
  store: string;
  packageRoot: string;
  executablePath: string;
  executableDigest: string;
  runDate: string;
}): Promise<{ receipt: HarnessAccessReceipt | null; files: string[]; nativeConfigDigest: string }> {
  if (input.tuple.connectionMethod === "direct-cli") {
    return { receipt: null, files: [], nativeConfigDigest: digest("direct-cli:no-native-config") };
  }
  const method = input.tuple.connectionMethod as HarnessConnectionMethod;
  const adapter = requireFirstPartyHarnessAdapter(input.tuple.harness);
  const executable = verifyReviewedMakeDocsPackageExecutable({
    packageRoot: input.packageRoot,
    executablePath: input.executablePath,
    expectedSha256: input.executableDigest,
  });
  const commandRules = method === "command-rules" || method === "permission-rules"
    ? listBoundedHarnessCommandRules(SYSTEM_COMMAND_RULE_AUTHORITY)
    : undefined;
  const plan = adapter.plan({
    method,
    scope: "machine",
    root: input.home,
    executable,
    ...(commandRules
      ? { commandRules, commandRuleAuthority: SYSTEM_COMMAND_RULE_AUTHORITY }
      : {}),
  });
  const operationId = `setup-access-lab-${digest(JSON.stringify({ tuple: input.tuple, runDate: input.runDate })).slice(0, 24)}`;
  const applied = adapter.apply({
    plan,
    approved: true,
    operationId,
    appliedVersion: executable.packageVersion,
    verifiedAt: new Date().toISOString(),
  });
  const verification = adapter.verify({
    method,
    scope: "machine",
    root: input.home,
    executable,
    ...(commandRules
      ? { commandRules, commandRuleAuthority: SYSTEM_COMMAND_RULE_AUTHORITY }
      : {}),
    receipt: applied.receipt,
  });
  if (verification.state !== "current") {
    throw new OperationError(
      `The setup-access lab native entry did not verify: ${verification.reason ?? verification.state}.`,
    );
  }

  const ceiling = deriveHarnessAccessCeiling(method);
  const global = loadGlobalConfig(input.store).config;
  global.settings.harnesses[input.tuple.harness] = {
    ...(global.settings.harnesses[input.tuple.harness] ?? {}),
    selected: true,
    maximumMethod: method,
    accessCeiling: ceiling,
  };
  writeGlobalConfig(input.store, global);

  const reviewed: ProjectHarnessIntegrationRecord[] = [
    { harness: input.tuple.harness, mode: "narrow", method, accessCeiling: ceiling },
  ];
  const projectConfig = planProjectHarnessIntegrationWrite({
    targetDir: input.project,
    reviewed,
    contentWhenMissing: "{}\n",
  });
  const previousStoreRoot = process.env.MAKE_DOCS_HOME;
  process.env.MAKE_DOCS_HOME = input.store;
  try {
    const existingManifest = loadManifest(input.project);
    if (!existingManifest) {
      throw new OperationError("The packed setup did not create a disposable project installation ledger.");
    }
    const installPlan = await planInstall({
      targetDir: input.project,
      selections: existingManifest.selections,
      existingManifest,
      packageMeta: {
        name: executable.packageName,
        version: executable.packageVersion,
      },
      operation: "setup.reconfigure",
    });
    applyInstallPlan({
      targetDir: input.project,
      plan: installPlan,
      existingManifest,
      projectHarnessConfig: projectConfig,
    });
  } finally {
    if (previousStoreRoot === undefined) delete process.env.MAKE_DOCS_HOME;
    else process.env.MAKE_DOCS_HOME = previousStoreRoot;
  }
  recordHarnessIntegrationReceipt(input.project, input.store, applied.receipt);

  return {
    receipt: applied.receipt,
    files: applied.receipt.entries.map(entry => entry.path),
    nativeConfigDigest: digest(
      JSON.stringify(applied.receipt.entries.map(entry => [entry.path, entry.fileFingerprint])),
    ),
  };
}

/**
 * Build one disposable first-run session. This is the only provisional
 * bootstrap exception. It uses production adapter planning, native writing,
 * verification, project config planning, and Store receipt recording.
 */
export async function bootstrapSetupAccessLabSession(
  raw: BootstrapSetupAccessLabInput,
): Promise<BootstrappedSetupAccessLab> {
  const sessionRoot = path.resolve(raw.sessionRoot);
  const repoRoot = path.resolve(raw.repoRoot);
  assertDisposableSetupAccessLabRoot(sessionRoot, repoRoot);
  const tuple = validateConformanceSupportTuple({
    scenario: raw.scenario,
    harness: raw.harness,
    connectionMethod: raw.connectionMethod,
    surface:
      raw.connectionMethod === "mcp"
        ? "mcp"
        : raw.connectionMethod === "command-rules"
          ? "cli-command-rules"
          : raw.connectionMethod === "permission-rules"
            ? "cli-permission-rules"
            : "cli-resource",
    scope: "machine",
    modelOrProvider: raw.modelOrProvider,
    runtime: raw.runtime,
  });
  assertConformanceTupleCombination(tuple);
  const packedProduct = path.resolve(raw.packedProduct);
  if (!existsSync(packedProduct) || !statSync(packedProduct).isFile() || !packedProduct.endsWith(".tgz")) {
    throw new OperationError("`--packed-product` must name an existing npm `.tgz` package.");
  }

  const inputsDir = path.join(sessionRoot, "inputs");
  const productRoot = path.join(sessionRoot, "product");
  const home = path.join(sessionRoot, "home");
  const project = path.join(sessionRoot, "project");
  const store = path.join(sessionRoot, "store");
  const evidence = path.join(sessionRoot, "evidence");
  for (const directory of [inputsDir, productRoot, home, project, store, evidence]) {
    mkdirSync(directory, { recursive: true });
  }

  const copiedTarball = path.join(inputsDir, "make-docs-packed.tgz");
  copyFileSync(packedProduct, copiedTarball);
  const packageRoot = installPackedProduct(copiedTarball, productRoot);
  const executablePath = path.join(packageRoot, "dist", "index.js");
  const executableDigest = digest(readFileSync(executablePath));
  const executable = verifyReviewedMakeDocsPackageExecutable({
    packageRoot,
    executablePath,
    expectedSha256: executableDigest,
  });
  establishDisposableProject({ executablePath, home, store, project });
  const userContentSeed = seedNativeUserContent(tuple, home, inputsDir);

  const sourceRegistryPath = path.join(repoRoot, CONFORMANCE_TUPLE_REGISTRY_PATH);
  const sourceRegistry = loadConformanceTupleRegistry({ registryPath: sourceRegistryPath });
  const provisionalRegistry = addProvisionalConformanceTuple(sourceRegistry, {
    id: `lab-${tuple.harness}-${tuple.connectionMethod}-${digest(JSON.stringify(tuple)).slice(0, 10)}`,
    tuple,
    plannedScenario: tuple.scenario,
  });
  const provisionalRegistryPath = path.join(inputsDir, "tuple-registry.provisional.json");
  const provisionalBytes = `${JSON.stringify(provisionalRegistry, null, 2)}\n`;
  writeFileSync(provisionalRegistryPath, provisionalBytes);

  const runDate = raw.runDate ?? new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(runDate)) {
    throw new OperationError("Setup-access run date must use YYYY-MM-DD.");
  }
  const native = await applyLabNativeEntry({
    tuple,
    home,
    project,
    store,
    packageRoot,
    executablePath,
    executableDigest,
    runDate,
  });
  const receiptPath = native.receipt ? path.join(inputsDir, "native-receipt.json") : null;
  if (receiptPath && native.receipt) {
    writeFileSync(receiptPath, `${JSON.stringify(native.receipt, null, 2)}\n`);
  }

  const measurementsPath = path.join(evidence, "measurements.json");
  writeFileSync(
    measurementsPath,
    `${JSON.stringify(
      {
        schemaVersion: "make-docs.setup-access-measurements.v2",
        tuple,
        measured: {
          nativeFiles: null,
          callerOrLaunchIdentity: null,
          methodIdentity: null,
          storeRead: null,
          storeWrite: null,
          rejectedAccess: null,
          storeFreeResourceRead: null,
          storeSessionOpenedForResourceRead: null,
          cleanup: null,
          userContentPreserved: null,
        },
        evidenceReferences: [],
        caveats: [],
        transcriptLogPointer: "discarded-with-session",
        transcriptFormat: "non-tty",
      },
      null,
      2,
    )}\n`,
  );

  const manifest: SetupAccessLabManifest = {
    schemaVersion: SETUP_ACCESS_LAB_MANIFEST,
    runDate,
    harnessVersion: raw.harnessVersion,
    tuple,
    package: {
      sourceTarball: packedProduct,
      copiedTarball,
      tarballDigest: digest(readFileSync(copiedTarball)),
      packageRoot,
      executablePath,
      executableDigest,
      behaviorDigest: executableDigest,
      makeDocsVersion: executable.packageVersion,
      distributionType: "packed-npm",
    },
    registry: {
      source: sourceRegistryPath,
      sourceDigest: digest(readFileSync(sourceRegistryPath)),
      provisional: provisionalRegistryPath,
      provisionalDigest: digest(provisionalBytes),
      status: "provisional",
    },
    session: { root: sessionRoot, home, project, store, evidence },
    native: {
      applied: tuple.connectionMethod !== "direct-cli",
      verified: true,
      files: native.files,
      nativeConfigDigest: native.nativeConfigDigest,
      receipt: receiptPath,
      userContentSeed,
    },
    promotion: {
      supportStatusChanged: false,
      resultWritten: false,
      nextAction:
        "Run the real harness in this disposable home. Then measure the result and use the normal ingestion and registry recording seam.",
    },
  };
  const manifestPath = path.join(sessionRoot, "manifest.json");
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return { manifest, manifestPath, measurementsPath };
}

function readJson(filePath: string): unknown {
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new OperationError(`Setup-access evidence at \`${filePath}\` is not valid JSON: ${String(error)}`);
  }
}

/** Remove the exact lab-owned native entry after the real harness run. */
export function cleanupSetupAccessLabSession(
  input: CleanupSetupAccessLabInput,
): CleanedSetupAccessLab {
  const manifestPath = path.resolve(input.manifestPath);
  const manifest = readJson(manifestPath) as SetupAccessLabManifest;
  if (manifest.schemaVersion !== SETUP_ACCESS_LAB_MANIFEST || !manifest.session?.root) {
    throw new OperationError("Setup-access cleanup needs a version 2 lab manifest.");
  }
  const sessionRoot = path.resolve(manifest.session.root);
  assertSetupAccessLabBoundary(sessionRoot, input.repoRoot);
  if (!inside(sessionRoot, manifestPath)) {
    throw new OperationError("The setup-access manifest must be inside its disposable session root.");
  }
  const seed = readJson(manifest.native.userContentSeed.evidence) as {
    path?: unknown;
    content?: unknown;
    digest?: unknown;
  };
  if (
    typeof seed.path !== "string" ||
    typeof seed.content !== "string" ||
    typeof seed.digest !== "string" ||
    seed.path !== manifest.native.userContentSeed.path ||
    digest(seed.content) !== seed.digest ||
    seed.digest !== manifest.native.userContentSeed.digest
  ) {
    throw new OperationError("The setup-access user-content seed evidence is invalid.");
  }

  let nativeEntryRemoved = true;
  if (manifest.tuple.connectionMethod !== "direct-cli") {
    if (!manifest.native.receipt) {
      throw new OperationError("Setup-access native cleanup needs the exact apply receipt.");
    }
    const executable = verifyReviewedMakeDocsPackageExecutable({
      packageRoot: manifest.package.packageRoot,
      executablePath: manifest.package.executablePath,
      expectedSha256: manifest.package.executableDigest,
    });
    const receipt = readJson(manifest.native.receipt) as HarnessAccessReceipt;
    const adapter = requireFirstPartyHarnessAdapter(manifest.tuple.harness);
    const plan = adapter.planRemoval({
      method: manifest.tuple.connectionMethod as HarnessConnectionMethod,
      scope: "machine",
      root: manifest.session.home,
      executable,
      receipt,
    });
    const result = adapter.applyRemoval({ plan, approved: true });
    nativeEntryRemoved = result.verification.state === "missing";
  }
  const userContentPreserved = userContentSeedIsPresent(
    manifest,
    seed as { path: string; content: string; digest: string },
  );
  const cleanupPath = path.join(manifest.session.evidence, "cleanup.json");
  writeFileSync(
    cleanupPath,
    `${JSON.stringify({
      schemaVersion: "make-docs.setup-access-cleanup.v2",
      nativeEntryRemoved,
      userContentPreserved,
      nativeFiles: manifest.native.files,
    }, null, 2)}\n`,
  );
  if (!nativeEntryRemoved || !userContentPreserved) {
    throw new OperationError(
      "Setup-access cleanup did not remove the exact managed entry and preserve the user-owned sentinel.",
    );
  }
  return { cleanupPath, nativeEntryRemoved, userContentPreserved };
}

function validateMeasurements(value: unknown): SetupAccessLabMeasurements {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new OperationError("Setup-access measurements must be a JSON object.");
  }
  const record = value as Partial<SetupAccessLabMeasurements>;
  if (record.schemaVersion !== "make-docs.setup-access-measurements.v2") {
    throw new OperationError("Setup-access measurements must use version 2.");
  }
  const tuple = validateConformanceSupportTuple(record.tuple);
  if (!record.measured || typeof record.measured !== "object") {
    throw new OperationError("Setup-access measurements need a measured object.");
  }
  const keys = [
    "nativeFiles",
    "callerOrLaunchIdentity",
    "methodIdentity",
    "storeRead",
    "storeWrite",
    "rejectedAccess",
    "storeFreeResourceRead",
    "storeSessionOpenedForResourceRead",
    "cleanup",
    "userContentPreserved",
  ] as const;
  for (const key of keys) {
    const measured = record.measured[key];
    if (measured !== null && typeof measured !== "boolean") {
      throw new OperationError(`Setup-access measurement \`${key}\` must be true, false, or null.`);
    }
  }
  if (!Array.isArray(record.evidenceReferences) || record.evidenceReferences.length === 0 ||
      record.evidenceReferences.some(item => typeof item !== "string" || !item.trim())) {
    throw new OperationError("Setup-access measurements need at least one exact evidence reference.");
  }
  if (!Array.isArray(record.caveats) || record.caveats.some(item => typeof item !== "string" || !item.trim())) {
    throw new OperationError("Setup-access caveats must be non-empty strings.");
  }
  if (typeof record.transcriptLogPointer !== "string" || !record.transcriptLogPointer.trim()) {
    throw new OperationError("Setup-access measurements need a transcript pointer.");
  }
  if (record.transcriptFormat !== "json" && record.transcriptFormat !== "non-tty") {
    throw new OperationError("Setup-access transcript format must be json or non-tty.");
  }
  return {
    schemaVersion: record.schemaVersion,
    tuple,
    measured: record.measured as SetupAccessLabMeasurements["measured"],
    evidenceReferences: [...record.evidenceReferences],
    caveats: [...record.caveats],
    transcriptLogPointer: record.transcriptLogPointer,
    transcriptFormat: record.transcriptFormat,
  };
}

/**
 * Convert measured session evidence into a version 2 result and run it
 * through the common exact-tuple recording seam. This function does not write
 * either the result or the registry.
 */
export function ingestSetupAccessLabSession(input: {
  sessionRoot: string;
  sequence?: number;
  reviewerStatus?: "unreviewed" | "reviewed" | "needs-follow-up" | "rejected";
  reason?: string;
}): IngestedSetupAccessLabResult {
  const sessionRoot = path.resolve(input.sessionRoot);
  const manifestValue = readJson(path.join(sessionRoot, "manifest.json"));
  if (!manifestValue || typeof manifestValue !== "object" || Array.isArray(manifestValue) ||
      (manifestValue as Partial<SetupAccessLabManifest>).schemaVersion !== SETUP_ACCESS_LAB_MANIFEST) {
    throw new OperationError("The session does not contain a setup-access version 2 manifest.");
  }
  const manifest = manifestValue as SetupAccessLabManifest;
  const tuple = validateConformanceSupportTuple(manifest.tuple);
  const measurements = validateMeasurements(readJson(path.join(sessionRoot, "evidence", "measurements.json")));
  if (JSON.stringify(tuple) !== JSON.stringify(measurements.tuple)) {
    throw new OperationError("The measured tuple does not match the bootstrapped session tuple.");
  }

  const m = measurements.measured;
  const direct = tuple.connectionMethod === "direct-cli";
  const measuredEvidenceBar = direct
    ? {
        install: manifest.package.executableDigest.length === 64,
        discover: m.methodIdentity === true,
        invoke: m.storeFreeResourceRead === true && m.storeSessionOpenedForResourceRead === false,
        uninstall: m.cleanup === true && m.userContentPreserved === true,
      }
    : {
        install: m.nativeFiles === true && m.callerOrLaunchIdentity === true,
        discover: m.methodIdentity === true,
        invoke: m.storeRead === true && m.storeWrite === true && m.rejectedAccess === true,
        uninstall: m.cleanup === true && m.userContentPreserved === true,
      };
  const relevantValues = direct
    ? [m.methodIdentity, m.storeFreeResourceRead, m.storeSessionOpenedForResourceRead, m.cleanup, m.userContentPreserved]
    : [m.nativeFiles, m.callerOrLaunchIdentity, m.methodIdentity, m.storeRead, m.storeWrite, m.rejectedAccess, m.cleanup, m.userContentPreserved];
  const incomplete = relevantValues.some(value => value === null);
  const allPassed = Object.values(measuredEvidenceBar).every(Boolean);
  const evidenceBar = incomplete
    ? { install: false, discover: false, invoke: false, uninstall: false }
    : measuredEvidenceBar;
  const verdict = incomplete
    ? "blocked"
    : allPassed
      ? measurements.caveats.length > 0 ? "pass-with-caveats" : "pass"
      : "unsupported";
  const sequence = input.sequence ?? 1;
  const recordRef = conformanceResultRecordRelativePath({
    harness: tuple.harness,
    runDate: manifest.runDate,
    scenarioId: tuple.scenario,
    sequence,
  });
  const reviewerStatus = input.reviewerStatus ?? "unreviewed";
  const record = validatePackagingConformanceResultRecord({
    schemaVersion: "conformance.result.v2",
    resultId: `${manifest.runDate}-${tuple.harness}-${tuple.connectionMethod}-${String(sequence).padStart(3, "0")}`,
    scenarioVersion: "2.0.0",
    tuple,
    runDate: manifest.runDate,
    makeDocsVersion: manifest.package.makeDocsVersion,
    executablePath: manifest.package.executablePath,
    executableDigest: manifest.package.executableDigest,
    behaviorDigest: manifest.package.behaviorDigest,
    registryDigest: manifest.registry.sourceDigest,
    distributionType: manifest.package.distributionType,
    harnessVersion: manifest.harnessVersion,
    nativeConfigDigest: manifest.native.nativeConfigDigest,
    producedFiles: [...manifest.native.files],
    relevantDiffs: [...measurements.evidenceReferences],
    exitStatus: incomplete ? null : allPassed ? 0 : 1,
    transcriptLogPointer: measurements.transcriptLogPointer,
    verdict,
    reason: input.reason ?? (incomplete
      ? "The measured session is incomplete."
      : allPassed
        ? "The real harness met every setup-access evidence condition."
        : "The real harness did not meet every setup-access evidence condition."),
    caveats: [...measurements.caveats],
    reviewerStatus,
    supportClaimUse: allPassed && reviewerStatus === "reviewed" ? "nominal-tuple" : "none",
    caveatsSurfaced: measurements.caveats.length > 0,
    evidenceBar,
    simulated: false,
    simulationMechanicsRef: null,
    transcriptFormat: measurements.transcriptFormat,
    evidenceReferences: [...measurements.evidenceReferences],
  });

  const provisionalRegistry = loadConformanceTupleRegistry({
    registryPath: manifest.registry.provisional,
  });
  const entry = getConformanceTupleEntry(provisionalRegistry, tuple);
  if (!entry) {
    throw new OperationError("The provisional lab registry lost its exact tuple.");
  }
  const promotedEntry = recordValidatedConformanceResultOnRegistryEntry({ entry, record, recordRef });
  const promotedRegistry = validateConformanceTupleRegistry({
    ...provisionalRegistry,
    tuples: provisionalRegistry.tuples.map(candidate => candidate.id === entry.id ? promotedEntry : candidate),
  });
  return { record, recordRef, promotedRegistry };
}
