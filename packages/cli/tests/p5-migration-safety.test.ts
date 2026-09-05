import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  acquireProjectMigrationLock,
  assertProjectMigrationLockActive,
  assertReviewedMigrationSnapshotCurrent,
  classifyMigrationCompatibility,
  createReviewedMigrationSnapshot,
  createVerifiedMigrationBackup,
  enterLegacyCompatibilityOperation,
  executeInstallPlanMigration,
  ImmutableMigrationCoordinator,
  MIGRATION_CHECKPOINTS,
  MigrationSafetyError,
  releaseProjectMigrationLock,
  removeTrustedPythonPathHelper,
  restoreMigrationBackup,
  verifyMigrationBackup,
} from "../src/migration";
import { planInstall } from "../src/install";
import type { CompatibilityClassification } from "../src/compatibility";
import { createExecutionContext } from "../src/operations/context";
import {
  invokeOperation,
  listLegacyCompatibilityOperations,
  operationCliCommand,
} from "../src/operations/registry";
import { callMakeDocsMcpTool, deriveMcpToolName } from "../src/mcp/tools";
import { runCli } from "../src/cli";
import { defaultSelections } from "../src/profile";
import {
  failingPathHygieneFindings,
  fixRepositoryRootPaths,
  scanPathHygieneText,
  validateProjectPathHygiene,
} from "../src/path-hygiene";

const roots: string[] = [];
const originalStoreRoot = process.env.MAKE_DOCS_HOME;
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

afterEach(() => {
  if (originalStoreRoot === undefined) delete process.env.MAKE_DOCS_HOME;
  else process.env.MAKE_DOCS_HOME = originalStoreRoot;
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function fixtureRoot(): string {
  const root = mkdtempSync(path.join(os.tmpdir(), "make-docs-p5-"));
  roots.push(root);
  mkdirSync(path.join(root, ".make-docs"), { recursive: true });
  writeFileSync(
    path.join(root, ".make-docs/manifest.json"),
    `${JSON.stringify({ schemaVersion: 3, projectId: "project-p5", files: {}, skillFiles: [] }, null, 2)}\n`,
  );
  return root;
}

function safeClassification() {
  return classifyMigrationCompatibility({
    state: "clean-v1",
    disposition: "migrate",
    facets: {
      resource: "managed-clean",
      filesystem: "managed-clean",
      manifestProvenance: "verified",
      store: "supported-legacy",
      legacyAssets: "project-owned",
      pathSafety: "safe",
      optionalAgentics: "absent",
    },
  });
}

function reviewedCompatibility(root: string): CompatibilityClassification {
  process.env.MAKE_DOCS_HOME = path.join(root, "machine-store");
  return {
    state: "clean-v1",
    disposition: "migrate",
    targetDir: root,
    manifestPath: path.join(root, ".make-docs/manifest.json"),
    auditReport: {
      mode: "manifest-present",
      targetDir: root,
      manifestPath: path.join(root, ".make-docs/manifest.json"),
      removableFiles: [],
      prunableDirectories: [],
      preservedPaths: [],
      skippedPaths: [],
    },
    evidence: {
      manifestTrust: {
        present: true,
        parseable: true,
        schemaVersion: 1,
        packageIdentityTrusted: true,
        selectionsTrusted: true,
        managedFileRecordsTrusted: true,
        skillRecordsTrusted: true,
        materializationProvenanceTrusted: true,
        reasons: [],
      },
      filesystemTrust: {
        managedFilesMatch: true,
        managedBlocksValid: true,
        recognizableManagedPaths: [],
        modifiedPaths: [],
        missingPaths: [],
        ambiguousFallbackPaths: [],
        nonMakeDocsPathCollisions: [],
        reasons: [],
      },
      bootstrapTrust: {
        requiredLocalBootstrapPresent: true,
        missingBootstrapPaths: [],
        reasons: [],
      },
      skillTrust: {
        selectedSkillsTrusted: true,
        missingSkillOutputs: [],
        modifiedSkillOutputs: [],
        reasons: [],
      },
      providerCacheTrust: {
        mode: "full-snapshot",
        trusted: true,
        providerAvailable: true,
        cacheUsable: true,
        staleHashes: [],
        reasons: [],
      },
    },
    printableEvidence: [],
  };
}

function reviewedFixture(relativePath = "managed.txt") {
  const root = fixtureRoot();
  writeFileSync(path.join(root, relativePath), "before\n", "utf8");
  const lock = acquireProjectMigrationLock({ projectRoot: root });
  const snapshot = createReviewedMigrationSnapshot({
    lock,
    classification: safeClassification(),
    affectedPaths: [
      {
        relativePath,
        ownership: "managed-clean",
        disposition: "overwrite-managed-clean",
        reason: "P5 fixture",
      },
    ],
  });
  const backup = createVerifiedMigrationBackup({ lock, snapshot, backupId: "fixture" });
  return { root, lock, snapshot, backup };
}

async function fixedProductFixture() {
  const root = mkdtempSync(path.join(os.tmpdir(), "make-docs-p5-product-"));
  roots.push(root);
  const selections = defaultSelections();
  selections.resourceProjection = [];
  const plan = await planInstall({
    targetDir: root,
    selections,
    existingManifest: null,
    operation: "setup",
  });
  return { root, plan };
}

describe("W19 R1 P5 migration and safety fixtures", () => {
  it("fixture 1: classifies the full facet set and fails closed by default", () => {
    expect(safeClassification()).toMatchObject({
      blockers: [],
      unattendedSafe: true,
      reviewedMigrationAllowed: true,
    });
    const blocked = classifyMigrationCompatibility({
      state: "partial-install",
      disposition: "migrate-with-review",
    });
    expect(blocked.reviewedMigrationAllowed).toBe(false);
    expect(blocked.blockers).toContain("ambiguous-ownership");
  });

  it("fixture 2: rejects ambiguous ownership before freezing a destructive plan", () => {
    const root = fixtureRoot();
    writeFileSync(path.join(root, "mixed.txt"), "user bytes\n");
    const lock = acquireProjectMigrationLock({ projectRoot: root });
    expect(() => createReviewedMigrationSnapshot({
      lock,
      classification: safeClassification(),
      affectedPaths: [{
        relativePath: "mixed.txt",
        ownership: "mixed",
        disposition: "overwrite-managed-clean",
        reason: "unsafe",
      }],
    })).toThrowError(MigrationSafetyError);
  });

  it("fixture 3: rejects path escape, Windows path forms, and case collisions", () => {
    const root = fixtureRoot();
    const lock = acquireProjectMigrationLock({ projectRoot: root });
    for (const relativePath of ["../escape", "C:\\repo\\file", "//server/share"]) {
      expect(() => createReviewedMigrationSnapshot({
        lock,
        classification: safeClassification(),
        affectedPaths: [{ relativePath, ownership: "unknown", disposition: "stop", reason: "unsafe" }],
      })).toThrowError(MigrationSafetyError);
    }
    expect(() => createReviewedMigrationSnapshot({
      lock,
      classification: safeClassification(),
      affectedPaths: [
        { relativePath: "A.txt", ownership: "project-owned", disposition: "preserve-project-owned", reason: "one" },
        { relativePath: "a.txt", ownership: "project-owned", disposition: "preserve-project-owned", reason: "two" },
      ],
    })).toThrow("Case-folding collision");
  });

  it("fixture 4: rejects an active writer and blocks new frozen legacy operations", async () => {
    const root = fixtureRoot();
    const leave = enterLegacyCompatibilityOperation({
      projectRoot: root,
      operationId: "playbook.start",
      mutates: true,
    });
    expect(() => acquireProjectMigrationLock({ projectRoot: root })).toThrow("legacy writers are active");
    leave();
    const lock = acquireProjectMigrationLock({ projectRoot: root });
    expect(listLegacyCompatibilityOperations()).toHaveLength(18);
    await expect(invokeOperation(
      "playbook.catalog",
      { repoRoot: root },
      createExecutionContext({ cwd: root }),
    )).rejects.toMatchObject({ code: "legacy-quiesced" });
    expect(existsSync(lock.lockPath)).toBe(true);
    releaseProjectMigrationLock(lock);
    expect(() => enterLegacyCompatibilityOperation({
      projectRoot: root,
      operationId: "package.write",
      mutates: true,
    })).toThrow("quiesced for migration");
  });

  it("fixture 5: rejects lock loss and changed lock identity", () => {
    const root = fixtureRoot();
    const lock = acquireProjectMigrationLock({ projectRoot: root });
    const record = JSON.parse(readFileSync(lock.lockPath, "utf8"));
    writeFileSync(lock.lockPath, `${JSON.stringify({ ...record, token: "changed-token" })}\n`);
    expect(() => assertProjectMigrationLockActive(lock)).toThrow("token changed");
  });

  it("fixture 6: keeps the frozen snapshot binding after checkpoint 2", () => {
    const { root, lock, snapshot, backup } = reviewedFixture();
    const coordinator = new ImmutableMigrationCoordinator(lock, snapshot, backup);
    expect(coordinator.advance(1).status).toBe("completed");
    expect(coordinator.advance(2).status).toBe("completed");
    writeFileSync(path.join(root, "managed.txt"), "changed\n");
    expect(coordinator.advance(3)).toMatchObject({
      status: "failed",
      code: "snapshot-drift",
      rollback: { attempted: true, completed: true },
    });
    expect(readFileSync(path.join(root, "managed.txt"), "utf8")).toBe("before\n");
  });

  it("fixture 7: rejects an incomplete or changed backup", () => {
    const { lock, snapshot, backup } = reviewedFixture();
    const copied = backup.entries.find((entry) => entry.relativePath === "managed.txt")!;
    rmSync(path.join(backup.backupRoot, copied.backupPath!));
    expect(() => verifyMigrationBackup(lock, snapshot, backup)).toThrow("restore entry changed");
  });

  it("fixture 8: reports real permission and fixed platform behavior failures", () => {
    const permission = classifyMigrationCompatibility({
      state: "clean-v1",
      disposition: "migrate",
      facets: { ...safeClassification().facets, pathSafety: "permission-denied" },
    });
    const platform = classifyMigrationCompatibility({
      state: "clean-v1",
      disposition: "migrate",
      facets: { ...safeClassification().facets, pathSafety: "cross-platform-mismatch" },
    });
    expect(permission.blockers).toContain("permission-denied");
    expect(platform.blockers).toContain("cross-platform-mismatch");
    const root = fixtureRoot();
    mkdirSync(path.join(root, "restricted"));
    writeFileSync(path.join(root, "restricted/managed.txt"), "bytes\n");
    const lock = acquireProjectMigrationLock({ projectRoot: root });
    chmodSync(path.join(root, "restricted"), 0o000);
    try {
      expect(() => createReviewedMigrationSnapshot({
        lock,
        classification: safeClassification(),
        affectedPaths: [{
          relativePath: "restricted/managed.txt",
          ownership: "managed-clean",
          disposition: "overwrite-managed-clean",
          reason: "permission fixture",
        }],
      })).toThrowError(MigrationSafetyError);
    } finally {
      chmodSync(path.join(root, "restricted"), 0o700);
    }
    symlinkSync("/tmp", path.join(root, "external-link"));
    const linkSnapshot = createReviewedMigrationSnapshot({
      lock,
      classification: safeClassification(),
      affectedPaths: [{
        relativePath: "external-link",
        ownership: "unknown",
        disposition: "stop",
        reason: "external link fixture",
      }],
    });
    expect(linkSnapshot.paths.find((entry) => entry.relativePath === "external-link")).toMatchObject({
      entryType: "symlink",
      linkTarget: "external",
    });
  });

  it("fixture 9: runs fixed checkpoints through 10, stays monotonic, and locks 11 through 13", async () => {
    const product = await fixedProductFixture();
    const result = executeInstallPlanMigration({
      projectRoot: product.root,
      storeRoot: path.join(product.root, ".test-store"),
      compatibility: reviewedCompatibility(product.root),
      installPlan: product.plan,
      existingManifest: null,
      backupId: "fixed-product",
    });
    expect(result.migrationReceipts.map((receipt) => [receipt.checkpoint, receipt.status])).toEqual([
      [1, "completed"], [2, "completed"], [3, "completed"], [4, "completed"],
      [5, "completed"], [6, "completed"], [7, "completed"], [8, "completed"],
      [9, "completed"], [10, "completed"],
    ]);
    expect(existsSync(path.join(product.root, ".make-docs/manifest.json"))).toBe(true);
    expect(existsSync(path.join(product.root, ".make-docs/archive"))).toBe(false);
    expect(existsSync(path.join(product.root, "docs/artifacts"))).toBe(false);
    expect(existsSync(path.join(product.root, "docs/assets"))).toBe(true);
    expect(existsSync(path.join(product.root, "docs/assets/developer"))).toBe(false);
    const directHygiene = await invokeOperation(
      "project.path-hygiene.validate",
      { targetRoot: product.root },
      createExecutionContext({ surface: "test", cwd: product.root }),
    );
    const mcpHygiene = await callMakeDocsMcpTool(
      deriveMcpToolName("project.path-hygiene.validate"),
      { targetRoot: product.root },
    );
    expect(mcpHygiene.result).toEqual(directHygiene.value);
    expect(operationCliCommand("project.path-hygiene.validate")).toBe(
      "make-docs project path-hygiene validate",
    );
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await runCli(["project", "path-hygiene", "validate", "--target", product.root]);
    expect(JSON.parse(stdout.mock.calls.map(([chunk]) => String(chunk)).join(""))).toEqual(
      directHygiene.value,
    );
    stdout.mockRestore();

    const { lock, snapshot, backup } = reviewedFixture();
    const coordinator = new ImmutableMigrationCoordinator(lock, snapshot, backup);
    expect(coordinator.advance(2)).toMatchObject({ status: "blocked", code: "out-of-order-checkpoint" });
    expect(coordinator.advance(1)).toMatchObject({ status: "completed" });
    expect(coordinator.advance(2)).toMatchObject({ status: "completed" });
    expect(coordinator.advance(3)).toMatchObject({
      status: "failed",
      code: "product-operation-unavailable",
    });
    expect(coordinator.advance(11)).toMatchObject({ status: "blocked", code: "downstream-checkpoint-locked" });
    expect(MIGRATION_CHECKPOINTS.slice(8).map((item) => item.state)).toEqual([
      "implemented", "implemented", "locked", "locked", "locked",
    ]);
  });

  it("fixture 10: restores managed bytes and removes originally absent paths after failure", async () => {
    const { root, plan } = await fixedProductFixture();
    writeFileSync(path.join(root, "managed.txt"), "before\n");
    const contentHash = createHash("sha256").update("created\n").digest("hex");
    plan.desiredFiles["managed.txt"] = { hash: contentHash, sourceId: "legacy:managed" };
    plan.desiredFiles["created-during-migration.txt"] = { hash: contentHash, sourceId: "legacy:create" };
    plan.desiredFiles["fail-after-create.txt"] = { hash: contentHash, sourceId: "legacy:fail" };
    plan.actions.push(
      { type: "update", relativePath: "managed.txt", sourceId: "legacy:managed", content: "mutated\n" },
      { type: "create", relativePath: "created-during-migration.txt", sourceId: "legacy:create", content: "created\n" },
      { type: "create", relativePath: "fail-after-create.txt", sourceId: "legacy:fail" },
    );
    expect(() => executeInstallPlanMigration({
      projectRoot: root,
      storeRoot: path.join(root, ".test-store"),
      compatibility: reviewedCompatibility(root),
      installPlan: plan,
      existingManifest: null,
      backupId: "rollback-absent",
    })).toThrow("Migration checkpoint 7 ended with status failed");
    expect(readFileSync(path.join(root, "managed.txt"), "utf8")).toBe("before\n");
    expect(existsSync(path.join(root, "created-during-migration.txt"))).toBe(false);
    expect(existsSync(path.join(root, "fail-after-create.txt"))).toBe(false);
    expect(existsSync(path.join(root, ".make-docs/manifest.json"))).toBe(false);

    const preserveRoot = fixtureRoot();
    const lock = acquireProjectMigrationLock({ projectRoot: preserveRoot });
    const snapshot = createReviewedMigrationSnapshot({
      lock,
      classification: safeClassification(),
      affectedPaths: [{
        relativePath: "created-during-failed-checkpoint",
        ownership: "managed-clean",
        disposition: "overwrite-managed-clean",
        reason: "absent before the reviewed checkpoint",
      }],
    });
    const backup = createVerifiedMigrationBackup({ lock, snapshot, backupId: "preserve-new" });
    mkdirSync(path.join(preserveRoot, "created-during-failed-checkpoint"));
    writeFileSync(
      path.join(preserveRoot, "created-during-failed-checkpoint/unmanaged.txt"),
      "keep\n",
    );
    expect(restoreMigrationBackup({ lock, snapshot, backup })).toEqual({
      restoredPaths: [".make-docs/manifest.json"],
      unrestoredPaths: ["created-during-failed-checkpoint"],
    });
    expect(readFileSync(
      path.join(preserveRoot, "created-during-failed-checkpoint/unmanaged.txt"),
      "utf8",
    )).toBe("keep\n");
  });

  it("fixture 11: persists every fixed checkpoint failure and all typed receipt shapes", async () => {
    const { root, lock, snapshot, backup } = reviewedFixture();
    const coordinator = new ImmutableMigrationCoordinator(lock, snapshot, backup);
    const receipts = [
      coordinator.pause("paused"),
      coordinator.block("classification-blocked", "blocked"),
      coordinator.advance(1),
    ];
    expect(receipts.map((receipt) => receipt.status)).toEqual(["paused", "blocked", "completed"]);
    for (const receipt of receipts) {
      if (receipt.status === "receipt-projection-failed") {
        throw new Error("Expected a persisted checkpoint receipt, not a projection failure.");
      }
      expect(receipt.claims).toEqual({
        validated: false,
        accepted: false,
        downstreamAuthorized: false,
        released: false,
      });
      expect(existsSync(path.join(
        root,
        ".make-docs/state/migration-receipts",
        `${receipt.receiptId.slice(7)}.json`,
      ))).toBe(true);
    }
    const rollbackFixture = reviewedFixture("rollback-required.txt");
    const rollbackCoordinator = new ImmutableMigrationCoordinator(
      rollbackFixture.lock,
      rollbackFixture.snapshot,
      rollbackFixture.backup,
    );
    expect(rollbackCoordinator.advance(1).status).toBe("completed");
    expect(rollbackCoordinator.advance(2).status).toBe("completed");
    const copied = rollbackFixture.backup.entries.find(
      (entry) => entry.relativePath === "rollback-required.txt",
    )!;
    rmSync(path.join(rollbackFixture.backup.backupRoot, copied.backupPath!));
    expect(rollbackCoordinator.advance(3)).toMatchObject({
      status: "rollback-required",
      checkpoint: 3,
      rollback: {
        attempted: true,
        completed: false,
        unrestoredPaths: expect.arrayContaining(["rollback-required.txt"]),
      },
    });

    const checkpointOne = reviewedFixture("checkpoint-one.txt");
    writeFileSync(path.join(checkpointOne.root, "checkpoint-one.txt"), "drift\n");
    expect(new ImmutableMigrationCoordinator(
      checkpointOne.lock,
      checkpointOne.snapshot,
      checkpointOne.backup,
    ).advance(1)).toMatchObject({ status: "failed", checkpoint: 1, code: "snapshot-drift" });

    const checkpointTwo = reviewedFixture("checkpoint-two.txt");
    const checkpointTwoCoordinator = new ImmutableMigrationCoordinator(
      checkpointTwo.lock,
      checkpointTwo.snapshot,
      checkpointTwo.backup,
    );
    expect(checkpointTwoCoordinator.advance(1).status).toBe("completed");
    const checkpointTwoCopy = checkpointTwo.backup.entries.find(
      (entry) => entry.relativePath === "checkpoint-two.txt",
    )!;
    rmSync(path.join(checkpointTwo.backup.backupRoot, checkpointTwoCopy.backupPath!));
    expect(checkpointTwoCoordinator.advance(2)).toMatchObject({
      status: "failed",
      checkpoint: 2,
      code: "backup-incomplete",
    });

    for (const checkpoint of [4, 5, 6, 7, 8] as const) {
      const product = await fixedProductFixture();
      const relativePath = checkpoint === 4
        ? "router-failure.md"
        : checkpoint === 5
          ? ".make-docs/system/prompts/AGENTS.md"
          : checkpoint === 6
            ? ".make-docs/system/references/resource-failure.md"
            : checkpoint === 7
              ? "legacy-failure.md"
              : "path-hygiene-failure.md";
      const content = checkpoint === 8 ? `${product.root}/private/path\n` : undefined;
      const sourceId = checkpoint === 4
        ? "router:failure"
        : checkpoint === 6
          ? "resource:reference:failure"
          : `legacy:checkpoint-${checkpoint}`;
      product.plan.desiredFiles[relativePath] = {
        hash: createHash("sha256").update(content ?? "missing-content").digest("hex"),
        sourceId,
      };
      product.plan.actions.push({
        type: "create",
        relativePath,
        sourceId,
        ...(content !== undefined ? { content } : {}),
      });
      expect(() => executeInstallPlanMigration({
        projectRoot: product.root,
        storeRoot: path.join(product.root, ".test-store"),
        compatibility: reviewedCompatibility(product.root),
        installPlan: product.plan,
        existingManifest: null,
        backupId: `checkpoint-${checkpoint}`,
      })).toThrow(`Migration checkpoint ${checkpoint} ended with status failed`);
      const receiptDir = path.join(product.root, ".make-docs/state/migration-receipts");
      const checkpointReceipt = readdirSync(receiptDir)
        .map((name) => JSON.parse(readFileSync(path.join(receiptDir, name), "utf8")))
        .find((receipt) => receipt.checkpoint === checkpoint && receipt.status !== "completed");
      expect(checkpointReceipt).toMatchObject({
        checkpoint,
        status: "failed",
        rollback: { attempted: true, completed: true, unrestoredPaths: [] },
      });
    }
  });

  it("fixture 12: removes the Python helper only with parity, replaced consumers, and a trusted hash", () => {
    const root = fixtureRoot();
    const relativePath = ".make-docs/scripts/check_path_hygiene.py";
    mkdirSync(path.dirname(path.join(root, relativePath)), { recursive: true });
    writeFileSync(path.join(root, relativePath), "print('managed')\n");
    const trustedHash = createHash("sha256").update("print('managed')\n").digest("hex");
    expect(() => removeTrustedPythonPathHelper({
      projectRoot: root,
      relativePath,
      trustedHashes: [trustedHash],
      replacementParityProved: false,
      consumers: [],
    })).toThrow("has not proved parity");
    expect(() => removeTrustedPythonPathHelper({
      projectRoot: root,
      relativePath,
      trustedHashes: [trustedHash],
      replacementParityProved: true,
      consumers: [{ name: "installer", replaced: false }],
    })).toThrow("active consumers");
    expect(removeTrustedPythonPathHelper({
      projectRoot: root,
      relativePath,
      trustedHashes: [trustedHash],
      replacementParityProved: true,
      consumers: [{ name: "installer", replaced: true }],
    })).toEqual({ removed: true, digest: trustedHash });
  });

  it("fixture 13: matches Python Path.resolve behavior on the same platform fixture", () => {
    const root = fixtureRoot();
    const realRoot = realpathSync(root);
    const relativePath = "docs/fixture.md";
    mkdirSync(path.join(root, "docs"), { recursive: true });
    const text = [
      `${realRoot}/docs/guide.md`,
      "/home/alice/project/file.md",
      "C:\\Users\\alice\\project\\file.md",
      "/mnt/c/Users/alice/project/file.md",
      "/private/var/folders/aa/temp/file.md",
      `[bad](${realRoot}/docs/guide.md)`,
      "[absolute](/docs/prd/00-index.md)",
      "<home>/safe.md",
    ].join("\n");
    writeFileSync(path.join(root, relativePath), text, "utf8");
    writeFileSync(
      path.join(root, ".make-docs/manifest.json"),
      `${JSON.stringify({
        schemaVersion: 3,
        projectId: "project-p5",
        files: { [relativePath]: { hash: "unused", sourceId: `file:${relativePath}` } },
        skillFiles: [],
      }, null, 2)}\n`,
      "utf8",
    );

    const typescript = validateProjectPathHygiene({ projectRoot: root });
    const python = spawnSync(
      "python3",
      [
        path.join(REPO_ROOT, ".make-docs/scripts/check_path_hygiene.py"),
        "--repo-root",
        root,
        "--format",
        "json",
      ],
      { encoding: "utf8" },
    );
    expect(python.error).toBeUndefined();
    expect(python.status).toBe(1);
    const pythonResult = JSON.parse(python.stdout);
    const normalizeTypeScriptFinding = (finding: (typeof typescript.findings)[number]) => ({
      file: finding.file,
      line: finding.line,
      column: finding.column,
      kind: finding.kind,
      match: finding.match,
      suggestion: finding.suggestion,
      autoFixable: finding.autoFixable,
      allowed: finding.allowed,
      reason: finding.reason,
    });
    const normalizePythonFinding = (finding: Record<string, unknown>) => ({
      file: finding.file,
      line: finding.line,
      column: finding.column,
      kind: finding.kind,
      match: finding.match,
      suggestion: finding.suggestion,
      autoFixable: finding.auto_fixable,
      allowed: finding.allowed,
      reason: finding.reason,
    });
    expect(typescript.targetRoot).toBe(realRoot);
    if (root.startsWith("/var/")) {
      expect(realRoot).toMatch(/^\/private\/var\//);
    }
    expect(typescript.findings).toContainEqual(
      expect.objectContaining({
        kind: "repo_root_absolute_path",
        match: `${realRoot}/docs/guide.md`,
      }),
    );
    expect({
      checkedFiles: typescript.checkedFiles,
      changedFiles: typescript.changedFiles,
      findings: typescript.findings.map(normalizeTypeScriptFinding),
      ioErrors: typescript.ioErrors,
      errors: typescript.failingFindings,
    }).toEqual({
      checkedFiles: pythonResult.checked_files,
      changedFiles: pythonResult.changed_files,
      findings: pythonResult.findings.map(normalizePythonFinding),
      ioErrors: pythonResult.io_errors ?? [],
      errors: pythonResult.summary.errors,
    });
    expect(new Set(typescript.findings.map((finding) => finding.kind))).toEqual(new Set([
      "repo_root_absolute_path",
      "posix_user_home_path",
      "windows_user_home_path",
      "wsl_user_home_path",
      "macos_temp_path",
      "absolute_markdown_link_destination",
    ]));
  });

  it("fixture 14: preserves explicit allow comments and fixes only repository-root paths", () => {
    const root = "/Users/example/work/repo";
    const text = [
      "<!-- make-docs-path-hygiene: allow: needed evidence -->",
      "/Users/alice/private.txt",
      `${root}/docs/guide.md`,
    ].join("\n");
    const findings = scanPathHygieneText({ file: "fixture.md", text, repoRoot: root });
    expect(findings.find((finding) => finding.match.includes("private.txt"))?.allowed).toBe(true);
    expect(fixRepositoryRootPaths(text, root)).toContain("docs/guide.md");
    expect(fixRepositoryRootPaths(text, root)).toContain("/Users/alice/private.txt");
  });
});
