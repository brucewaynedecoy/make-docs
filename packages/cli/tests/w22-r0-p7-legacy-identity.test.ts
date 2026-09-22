import { randomUUID } from "node:crypto";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { defaultSelections } from "../src/profile";
import { resolveInstallProfile } from "../src/profile";
import { createEmptySystemAssetManifestState } from "../src/system-assets";
import {
  importInstallationState,
  recordMigrationState,
  withInstallationDatabase,
} from "../src/store/installation-state";
import type { InstallManifest } from "../src/types";

const roots: string[] = [];

function fixture(): { root: string; store: string } {
  const parent = realpathSync(mkdtempSync(path.join(os.tmpdir(), "make-docs-p7-identity-")));
  roots.push(parent);
  const root = path.join(parent, "project");
  mkdirSync(root);
  return { root, store: path.join(parent, "store") };
}

function manifest(projectId: string): InstallManifest {
  const profile = resolveInstallProfile(defaultSelections());
  return {
    schemaVersion: 2,
    projectId,
    packageName: "@brucewaynedecoy/make-docs",
    packageVersion: "1.0.0-rc.1",
    updatedAt: "2026-09-01T00:00:00.000Z",
    profileId: profile.profileId,
    selections: profile.selections,
    effectiveCapabilities: profile.effectiveCapabilities,
    systemAssetMaterialization: createEmptySystemAssetManifestState(),
    files: {},
    skillFiles: [],
  };
}

function seedSetupBridge(
  root: string,
  store: string,
  projectId: string,
): { checkoutId: string; temporaryProjectId: string } {
  recordMigrationState(root, "quiescence", "legacy", {
    schemaVersion: 1,
    status: "active",
    lockTokenDigest: "a".repeat(64),
    snapshotId: `sha256:${"b".repeat(64)}`,
    activatedAt: "2026-09-01T00:00:00.000Z",
    legacyOperations: [],
  }, store);
  return withInstallationDatabase(root, (db) => {
    const checkout = db.prepare(
      "SELECT checkout_id,project_id FROM installation_checkouts",
    ).get() as { checkout_id: string; project_id: string };
    const legacyPath = root.replace(/^\/private\/var\//, "/var/");
    db.prepare(
      "INSERT INTO projects (project_id,root_path,package_name,package_version,registered_at,last_seen_at) VALUES (?,?,?,?,?,?)",
    ).run(
      projectId,
      legacyPath,
      "@brucewaynedecoy/make-docs",
      "1.0.0-rc.1",
      "2026-09-01T00:00:00.000Z",
      "2026-09-01T00:00:00.000Z",
    );
    return {
      checkoutId: checkout.checkout_id,
      temporaryProjectId: checkout.project_id,
    };
  }, { storeRoot: store });
}

function importLegacy(root: string, store: string, projectId: string): void {
  importInstallationState(root, {
    manifest: manifest(projectId),
    records: [],
    importId: `sha256:${"c".repeat(64)}`,
    sources: [],
    recoveryRequired: false,
  }, store);
}

function checkoutProjectId(root: string, store: string, checkoutId: string): string {
  return withInstallationDatabase(root, (db) => {
    const row = db.prepare(
      "SELECT project_id FROM installation_checkouts WHERE checkout_id=?",
    ).get(checkoutId) as { project_id: string };
    return row.project_id;
  }, { storeRoot: store, readOnly: true });
}

function installationLockCount(root: string, store: string): number {
  return withInstallationDatabase(root, (db) => {
    const row = db.prepare("SELECT COUNT(*) AS count FROM installation_locks").get() as {
      count: number;
    };
    return row.count;
  }, { storeRoot: store, readOnly: true });
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("W22 R0 P7 legacy Store identity adoption", () => {
  it("preserves the legacy project id across a canonical path alias", () => {
    const { root, store } = fixture();
    const projectId = randomUUID();
    const seeded = seedSetupBridge(root, store, projectId);

    importLegacy(root, store, projectId);

    expect(seeded.temporaryProjectId).not.toBe(projectId);
    expect(checkoutProjectId(root, store, seeded.checkoutId)).toBe(projectId);
  });

  it.each([
    {
      name: "an existing ledger",
      mutate(root: string, store: string, checkoutId: string) {
        withInstallationDatabase(root, (db) => {
          db.prepare("INSERT INTO installation_ledgers VALUES (?,?,?)")
            .run(checkoutId, "{}", "2026-09-01T00:00:00.000Z");
        }, { storeRoot: store });
      },
      message: "already has an installation ledger",
    },
    {
      name: "a conflicting declarative id",
      mutate(root: string) {
        mkdirSync(path.join(root, ".make-docs"), { recursive: true });
        writeFileSync(path.join(root, ".make-docs/config.yaml"), `projectId: ${randomUUID()}\n`);
      },
      message: "legacy project identity conflicts with the checkout config",
    },
    {
      name: "a non-bridge migration record",
      mutate(root: string, store: string, checkoutId: string) {
        withInstallationDatabase(root, (db) => {
          db.prepare("INSERT INTO installation_migration_records VALUES (?,?,?,?)")
            .run(checkoutId, "snapshot", "unreviewed", "{}");
        }, { storeRoot: store });
      },
      message: "non-bridge migration state",
    },
    {
      name: "pending project work",
      mutate(root: string, store: string, checkoutId: string) {
        withInstallationDatabase(root, (db) => {
          db.prepare(
            "INSERT INTO installation_operations (operation_id,checkout_id,operation,status,before_ledger,after_ledger,created_at,finished_at,plan_complete) VALUES (?,?,?,'pending',NULL,NULL,?,NULL,0)",
          ).run(randomUUID(), checkoutId, "setup.migration", "2026-09-01T00:00:00.000Z");
        }, { storeRoot: store });
      },
      message: "requires recovery",
    },
    {
      name: "a competing checkout",
      mutate(root: string, store: string, _checkoutId: string, projectId: string) {
        const competingRoot = path.join(path.dirname(root), "competing");
        mkdirSync(competingRoot);
        withInstallationDatabase(root, (db) => {
          db.prepare(
            "INSERT INTO installation_checkouts (checkout_id,project_id,root_path,created_at,root_path_key,verified_at,verification_json) VALUES (?,?,?,?,?,NULL,NULL)",
          ).run(randomUUID(), projectId, competingRoot, "2026-09-01T00:00:00.000Z", competingRoot);
        }, { storeRoot: store });
      },
      message: "already owns the legacy project identity",
    },
  ])("blocks identity adoption when the checkout has $name", ({ mutate, message }) => {
    const { root, store } = fixture();
    const projectId = randomUUID();
    const seeded = seedSetupBridge(root, store, projectId);
    mutate(root, store, seeded.checkoutId, projectId);

    expect(() => importLegacy(root, store, projectId)).toThrow(message);
    expect(checkoutProjectId(root, store, seeded.checkoutId)).toBe(seeded.temporaryProjectId);
    expect(installationLockCount(root, store)).toBe(0);
  });
});
