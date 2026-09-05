import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { applyInstallPlan, planInstall } from "../src/install";
import { classifyCompatibilityState } from "../src/compatibility";
import { createAuditReport } from "../src/audit";
import { defaultSelections } from "../src/profile";
import * as manifestApi from "../src/manifest";
import { RETIRED_PLAYBOOK_CONTRACT_PATH as contractPath, RETIRED_PLAYBOOK_CONTRACT_HASH as contractHash, writeManifest } from "../src/manifest";
import { executeInstallPlanMigration, MIGRATION_CHECKPOINTS } from "../src/migration";
import { bootstrapGlobalStore, loadSqliteDriver, openStoreDatabase } from "../src/store";

const roots: string[] = [];
const originalStore = process.env.MAKE_DOCS_HOME;
const contract = readFileSync(new URL("./fixtures/retired-playbook-contract.md", import.meta.url));
afterEach(() => {
  vi.restoreAllMocks();
  if (originalStore === undefined) delete process.env.MAKE_DOCS_HOME;
  else process.env.MAKE_DOCS_HOME = originalStore;
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});
async function fixture() {
  const root = mkdtempSync(path.join(os.tmpdir(), "make-docs-p8-"));
  roots.push(root);
  const storeRoot = path.join(root, ".test-store");
  process.env.MAKE_DOCS_HOME = storeRoot;
  const selections = defaultSelections();
  selections.resourceProjection = [];
  const fresh = await planInstall({ targetDir: root, selections, existingManifest: null });
  const { manifest } = applyInstallPlan({ targetDir: root, plan: fresh, existingManifest: null });
  mkdirSync(path.dirname(path.join(root, contractPath)), { recursive: true });
  writeFileSync(path.join(root, contractPath), contract);
  manifest.files[contractPath] = { sourceId: `file:${contractPath}`, hash: contractHash };
  writeManifest(root, manifest);
  return { root, storeRoot, selections, manifest };
}
async function reviewed(f: Awaited<ReturnType<typeof fixture>>) {
  const plan = await planInstall({ targetDir: f.root, selections: f.selections, existingManifest: f.manifest, operation: "setup.sync" });
  const compatibility = await classifyCompatibilityState({ targetDir: f.root });
  return { plan, compatibility };
}
function run(f: Awaited<ReturnType<typeof fixture>>, review: Awaited<ReturnType<typeof reviewed>>) {
  return executeInstallPlanMigration({ projectRoot: f.root, storeRoot: f.storeRoot, compatibility: review.compatibility,
    installPlan: review.plan, existingManifest: f.manifest, backupId: "retirement" });
}
function receipts(root: string) {
  const directory = path.join(root, ".make-docs/state/migration-receipts");
  return readdirSync(directory).map((name) => JSON.parse(readFileSync(path.join(directory, name), "utf8")));
}

describe("W19 R1 P8 exact legacy retirement", () => {
  it("retires the trusted contract at checkpoint 11 and keeps user assets and the barrier", async () => {
    const f = await fixture();
    expect(createHash("sha256").update(contract).digest("hex")).toBe(contractHash);
    const kept = ["docs/assets/playbooks/project.playbook.md", "docs/history/playbook-run.md", ".make-docs/contracts/system/user.txt", ".make-docs/agentics/plugins/local/output.txt"];
    for (const relative of kept) {
      mkdirSync(path.dirname(path.join(f.root, relative)), { recursive: true });
      writeFileSync(path.join(f.root, relative), `opaque ${relative}\n`);
    }
    const review = await reviewed(f);
    expect(review.plan.actions.find((action) => action.relativePath === contractPath)?.type).toBe("remove-managed");
    const result = run(f, review);
    expect(result.migrationReceipts.map((item) => item.checkpoint)).toEqual([1,2,3,4,5,6,7,8,9,10,11]);
    expect(existsSync(path.join(f.root, contractPath))).toBe(false);
    expect(result.manifest.files[contractPath]).toBeUndefined();
    for (const relative of kept) expect(readFileSync(path.join(f.root, relative), "utf8")).toBe(`opaque ${relative}\n`);
    expect(JSON.parse(readFileSync(path.join(f.root, ".make-docs/state/legacy-quiescence.json"), "utf8")).status).toBe("active");
    expect(existsSync(path.join(f.root, ".make-docs/state/migration.lock"))).toBe(false);
    expect(MIGRATION_CHECKPOINTS.slice(11).map((item) => item.state)).toEqual(["locked", "locked"]);
  });

  it("preserves changed bytes, false ownership, and symlinks despite a legacy path", async () => {
    for (const variant of ["modified", "source", "project", "link", "parent-link"] as const) {
      const f = await fixture();
      const absolute = path.join(f.root, contractPath);
      if (variant === "modified") writeFileSync(absolute, "project edit\n");
      if (variant === "source") f.manifest.files[contractPath].sourceId = "project:history";
      if (variant === "project") f.manifest.files[contractPath].ownershipClass = "project-owned";
      if (variant === "link") { rmSync(absolute); writeFileSync(path.join(f.root, "user.md"), contract); symlinkSync(path.join(f.root, "user.md"), absolute); }
      if (variant === "parent-link") {
        rmSync(path.dirname(absolute), { recursive: true });
        mkdirSync(path.join(f.root, "user-contracts"));
        writeFileSync(path.join(f.root, "user-contracts/playbook-contract.md"), contract);
        symlinkSync(path.join(f.root, "user-contracts"), path.dirname(absolute));
      }
      const plan = await planInstall({ targetDir: f.root, selections: f.selections, existingManifest: f.manifest, operation: "setup.sync" });
      expect(plan.actions.find((action) => action.relativePath === contractPath)?.type, variant).toBe("skip");
      const audit = await createAuditReport({ targetDir: f.root, manifest: f.manifest });
      expect(audit.removableFiles.some((item) => item.path === contractPath), variant).toBe(false);
      expect(readFileSync(absolute), variant).toEqual(variant === "modified" ? Buffer.from("project edit\n") : contract);
    }
  });

  it.skipIf(!loadSqliteDriver().available)("keeps opaque legacy Store rows through checkpoint 11", async () => {
    const f = await fixture();
    expect(bootstrapGlobalStore({ storeRoot: f.storeRoot }).databaseStatus).toBe("created");
    const opened = openStoreDatabase(f.storeRoot);
    const opaque = "  not JSON \u0000 legacy record  ";
    try {
      opened.db.prepare("INSERT INTO projects (project_id, root_path, registered_at, last_seen_at) VALUES (?, ?, ?, ?)")
        .run("history-project", "opaque-root", "then", "then");
      opened.db.prepare("INSERT INTO playbook_runs (project_id, run_id, record, created_at, updated_at) VALUES (?, ?, ?, ?, ?)")
        .run("history-project", "opaque-run", opaque, "then", "then");
    } finally { opened.db.close(); }
    const result = run(f, await reviewed(f));
    expect(result.migrationReceipts.at(-1)?.checkpoint).toBe(11);
    const after = openStoreDatabase(f.storeRoot);
    try {
      expect(after.db.prepare("SELECT hex(record) AS bytes FROM playbook_runs WHERE run_id = ?").get("opaque-run"))
        .toEqual({ bytes: Buffer.from(opaque).toString("hex").toUpperCase() });
    } finally { after.db.close(); }
  });

  it("rejects direct apply before it can bypass the migration lock and backup", async () => {
    const f = await fixture();
    const review = await reviewed(f);
    const manifestBefore = readFileSync(path.join(f.root, ".make-docs/manifest.json"));
    expect(() => applyInstallPlan({ targetDir: f.root, plan: review.plan, existingManifest: f.manifest }))
      .toThrow("requires reviewed migration checkpoint 11");
    expect(readFileSync(path.join(f.root, contractPath))).toEqual(contract);
    expect(readFileSync(path.join(f.root, ".make-docs/manifest.json"))).toEqual(manifestBefore);
  });

  it("rolls back exact bytes when checkpoint 11 cannot persist the retired manifest", async () => {
    const f = await fixture();
    const review = await reviewed(f);
    const beforeManifest = readFileSync(path.join(f.root, ".make-docs/manifest.json"));
    const originalWrite = manifestApi.writeManifest;
    vi.spyOn(manifestApi, "writeManifest").mockImplementation((root, manifest) => {
      if (!manifest.files[contractPath]) throw new Error("retirement disk failure");
      return originalWrite(root, manifest);
    });
    expect(() => run(f, review)).toThrow("Migration checkpoint 11 ended with status failed");
    expect(readFileSync(path.join(f.root, contractPath))).toEqual(contract);
    expect(readFileSync(path.join(f.root, ".make-docs/manifest.json"))).toEqual(beforeManifest);
    expect(receipts(f.root)).toContainEqual(expect.objectContaining({ checkpoint: 11, status: "failed", rollback: expect.objectContaining({ attempted: true, completed: true, unrestoredPaths: [] }) }));
  });
});
