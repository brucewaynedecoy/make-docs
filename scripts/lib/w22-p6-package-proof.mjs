import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

export const P6_REQUIRED_PLATFORMS = ["ubuntu-latest", "macos-latest", "windows-latest"];

export const P6_INSTALLED_SMOKE_CONTRACT = [
  {
    case: "fresh-setup",
    publicState: "ready",
    safetyResult: "applied",
    nextAction: null,
    files: "managed-files-created",
    store: "schema-5-verified",
    nativeEntries: "none-selected",
  },
  {
    case: "current-repeat",
    publicState: "ready",
    safetyResult: "unchanged",
    nextAction: null,
    files: "managed-files-unchanged",
    store: "applied-ledger-verified",
    nativeEntries: "unchanged",
  },
  {
    case: "supported-old-state-bridge",
    publicState: "ready",
    safetyResult: "converted-and-preserved",
    nextAction: null,
    files: "user-bytes-preserved",
    store: "legacy-ledger-transferred",
    nativeEntries: "unchanged",
  },
  {
    case: "store-free-resource-read",
    publicState: "available",
    safetyResult: "store-not-opened",
    nextAction: null,
    files: "no-project-state-written",
    store: "absent",
    nativeEntries: "unchanged",
  },
  {
    case: "selected-native-skill-lifecycle",
    publicState: "ready",
    safetyResult: "applied-and-reviewed-removal",
    nextAction: null,
    files: "owned-skill-files-managed",
    store: "ownership-verified",
    nativeEntries: "codex-and-claude-code",
  },
  {
    case: "project-removal",
    publicState: "unregistered",
    safetyResult: "managed-removed-unmanaged-preserved",
    nextAction: null,
    files: "custom-and-backup-files-preserved",
    store: "ownership-pruned-history-retained",
    nativeEntries: "owned-entries-removed",
  },
  {
    case: "ambiguous-tool-removal",
    publicState: "blocked",
    safetyResult: "safe-stop",
    nextAction: "use-the-owning-install-manager",
    files: "project-files-preserved",
    store: "preserved",
    nativeEntries: "preserved",
  },
];

export function sha256File(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

export function createCandidateRecord(options) {
  const packageJson = JSON.parse(readFileSync(options.packageJsonPath, "utf8"));
  return {
    schemaVersion: 1,
    kind: "w22-r0-p6-package-candidate",
    sourceRevision: options.sourceRevision,
    package: {
      name: packageJson.name,
      version: packageJson.version,
      filename: path.basename(options.tarballPath),
      sha256: sha256File(options.tarballPath),
      sizeBytes: statSync(options.tarballPath).size,
    },
  };
}

export function verifyCandidateRecord(candidate, tarballPath) {
  if (candidate?.schemaVersion !== 1 || candidate?.kind !== "w22-r0-p6-package-candidate") {
    throw new Error("P6 candidate record has an unsupported shape.");
  }
  if (!candidate.sourceRevision || !candidate.package?.name || !candidate.package?.version) {
    throw new Error("P6 candidate record is incomplete.");
  }
  if (path.basename(tarballPath) !== candidate.package.filename) {
    throw new Error("P6 candidate filename does not match the recorded package.");
  }
  const digest = sha256File(tarballPath);
  if (digest !== candidate.package.sha256) {
    throw new Error(`P6 candidate digest mismatch: expected ${candidate.package.sha256}, got ${digest}.`);
  }
  if (statSync(tarballPath).size !== candidate.package.sizeBytes) {
    throw new Error("P6 candidate size does not match the recorded package.");
  }
  return candidate;
}

export function createPlatformEvidence(options) {
  return {
    schemaVersion: 1,
    kind: "w22-r0-p6-installed-package-evidence",
    platform: options.platform,
    status: options.status,
    candidate: options.candidate,
    runtime: {
      os: process.platform,
      architecture: process.arch,
      node: process.version,
      release: os.release(),
    },
    checks: {
      productSourceCheckoutExecution: false,
      packageInstalled: options.packageInstalled === true,
      productExecutionOrigin: "isolated-installed-package",
      requiredSourceMatrix: options.sourceMatrixPassed === true,
      isolatedHome: true,
      isolatedStore: true,
      installedSmoke: options.status === "passed",
    },
    installedSmokeContract: options.status === "passed"
      ? structuredClone(P6_INSTALLED_SMOKE_CONTRACT)
      : null,
    error: options.error ?? null,
  };
}

export function comparePlatformEvidence(records) {
  const byPlatform = new Map();
  for (const record of records) {
    if (record?.kind !== "w22-r0-p6-installed-package-evidence") {
      throw new Error("P6 platform evidence has an unsupported shape.");
    }
    if (!P6_REQUIRED_PLATFORMS.includes(record.platform)) {
      throw new Error(`P6 platform evidence names unsupported platform ${record.platform}.`);
    }
    if (byPlatform.has(record.platform)) {
      throw new Error(`P6 platform evidence repeats ${record.platform}.`);
    }
    byPlatform.set(record.platform, record);
  }
  for (const platform of P6_REQUIRED_PLATFORMS) {
    if (!byPlatform.has(platform)) throw new Error(`P6 platform evidence is missing ${platform}.`);
  }
  const required = P6_REQUIRED_PLATFORMS.map((platform) => byPlatform.get(platform));
  const first = required[0];
  for (const record of required) {
    if (record.status !== "passed" || record.checks?.installedSmoke !== true) {
      throw new Error(`P6 installed package proof failed on ${record.platform}.`);
    }
    if (JSON.stringify(record.candidate) !== JSON.stringify(first.candidate)) {
      throw new Error(`P6 ${record.platform} did not use the same package candidate.`);
    }
    if (record.checks.productSourceCheckoutExecution !== false) {
      throw new Error(`P6 ${record.platform} used source checkout execution as package proof.`);
    }
    if (
      record.checks.packageInstalled !== true ||
      record.checks.productExecutionOrigin !== "isolated-installed-package"
    ) {
      throw new Error(`P6 ${record.platform} did not execute an isolated installed package.`);
    }
    if (record.checks.requiredSourceMatrix !== true) {
      throw new Error(`P6 ${record.platform} did not pass the required source safety matrix.`);
    }
    if (JSON.stringify(record.installedSmokeContract) !== JSON.stringify(P6_INSTALLED_SMOKE_CONTRACT)) {
      throw new Error(`P6 ${record.platform} did not produce the required installed public contract.`);
    }
    if (JSON.stringify(record.installedSmokeContract) !== JSON.stringify(first.installedSmokeContract)) {
      throw new Error(`P6 ${record.platform} returned a different installed public contract.`);
    }
  }
  return {
    schemaVersion: 1,
    kind: "w22-r0-p6-platform-comparison",
    status: "passed",
    candidate: first.candidate,
    installedSmokeContract: first.installedSmokeContract,
    platforms: required.map((record) => ({
      platform: record.platform,
      runtime: record.runtime,
      checks: record.checks,
    })),
  };
}

export function readJsonFiles(root) {
  const files = [];
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const candidate = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(candidate);
      else if (entry.isFile() && entry.name.endsWith(".json")) files.push(candidate);
    }
  };
  visit(root);
  return files.sort().map((file) => JSON.parse(readFileSync(file, "utf8")));
}

export function writeJson(filePath, value) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}
