import { acquireStoreAccess, classifyStoreCheckpoint9State, CURRENT_STORE_SCHEMA_VERSION, openStoreSqliteConnection, type StoreDatabase } from "./database";

export type StoreBridgeDisposition =
  | "convert"
  | "retain-history"
  | "rebuild"
  | "quarantine"
  | "unsupported"
  | "removable-after-proof";

export interface StoreBridgeRegisterEntry {
  bridgeId: string;
  oldForm: string;
  targetForm: string;
  firstBridgeVersion: string;
  owner: string;
  oldWritesStoppedProof: string;
  remainingStateCheck: string;
  endCondition: string;
  removalPhaseOrRelease: string;
  requiredTests: readonly string[];
  retentionAndExportRule: string;
  separateDeletionApproval: true;
}

export interface StoreBridgeRecordClassification {
  bridgeId: string;
  disposition: StoreBridgeDisposition;
  count: number;
  reason: string;
}

export interface StoreCompatibilityBridgePreview {
  schemaVersion: 1;
  readOnly: true;
  databasePath: string;
  storeState: ReturnType<typeof classifyStoreCheckpoint9State>["state"];
  sourceSchemaVersion: number | null;
  targetSchemaVersion: number;
  disposition: StoreBridgeDisposition;
  records: StoreBridgeRecordClassification[];
  changes: {
    store: string[];
    project: string[];
    native: string[];
  };
  blockers: string[];
  nextAction: string;
}

/**
 * The bounded W22 P5 bridge register required by PRD 18 R-BRIDGE-4.
 * Entries stay data-only so status and tests can inspect the same contract.
 */
export const STORE_COMPATIBILITY_BRIDGE_REGISTER: readonly StoreBridgeRegisterEntry[] = Object.freeze([
  {
    bridgeId: "w22-p5-store-schema-v1-v4",
    oldForm: "Store schemas 1 through 4",
    targetForm: "Store schema 5",
    firstBridgeVersion: "2.0.0-rc",
    owner: "Store compatibility owner",
    oldWritesStoppedProof: "openStoreDatabase rejects schemas below 5 outside the reviewed migration path.",
    remainingStateCheck: "PRAGMA user_version is below 5.",
    endCondition: "No supported installation remains below schema 5.",
    removalPhaseOrRelease: "A later owner-approved release after P6 installed-package proof",
    requiredTests: ["schemas 1-4", "repeat", "interruption", "newer", "corrupt"],
    retentionAndExportRule: "Keep the verified pre-conversion Store backup until separate cleanup approval.",
    separateDeletionApproval: true,
  },
  {
    bridgeId: "w22-p5-checkout-object-numbers",
    oldForm: "installation_checkouts.root_device and root_inode",
    targetForm: "checkout id, platform path key, and bounded live verification evidence",
    firstBridgeVersion: "2.0.0-rc",
    owner: "Store identity owner",
    oldWritesStoppedProof: "The schema-5 checkout writer omits both fields and schema 5 has no such columns.",
    remainingStateCheck: "Schema below 5 has either legacy column.",
    endCondition: "All supported Stores are schema 5 and archived values remain history only.",
    removalPhaseOrRelease: "W22 P5 field retirement; history cleanup needs later approval",
    requiredTests: ["moved checkout", "clone", "repeat", "rollback", "all core platforms"],
    retentionAndExportRule: "Archive exact strings as legacy-import evidence. Do not use them as identity.",
    separateDeletionApproval: true,
  },
  {
    bridgeId: "w22-p5-checkpoint-receipts",
    oldForm: "store_checkpoint_journal rows",
    targetForm: "store_migration_receipts history",
    firstBridgeVersion: "2.0.0-rc",
    owner: "Store migration owner",
    oldWritesStoppedProof: "Checkpoint 9 writes store_migration_receipts after schema-5 cutover.",
    remainingStateCheck: "Count rows present only in store_checkpoint_journal.",
    endCondition: "Every old receipt has a byte-equivalent target history row.",
    removalPhaseOrRelease: "Later compatibility cleanup after export and owner approval",
    requiredTests: ["receipt copy", "readback", "projection retry", "repeat"],
    retentionAndExportRule: "Preserve old rows as private local history until separately approved export or deletion.",
    separateDeletionApproval: true,
  },
  {
    bridgeId: "w22-p5-installation-transfers",
    oldForm: "installation_transfers rows",
    targetForm: "legacy-import migration record source evidence",
    firstBridgeVersion: "2.0.0-rc",
    owner: "Installation migration owner",
    oldWritesStoppedProof: "Legacy import writes source evidence only to installation_migration_records.",
    remainingStateCheck: "Count installation_transfers rows.",
    endCondition: "Supported local-state transfer is complete and retained source evidence is readable.",
    removalPhaseOrRelease: "Later transfer-bridge cleanup after owner approval",
    requiredTests: ["legacy import", "repeat", "interruption", "source readback"],
    retentionAndExportRule: "Retain existing transfer rows as private history. Do not delete source evidence in P5.",
    separateDeletionApproval: true,
  },
  {
    bridgeId: "w22-p5-installation-ledger",
    oldForm: "installation ledger records with legacy projection mirrors",
    targetForm: "versioned installation ledger with minimum applied projection ownership",
    firstBridgeVersion: "2.0.0-rc",
    owner: "Installation state owner",
    oldWritesStoppedProof: "P4 target writers omit projection selection and provider mirrors.",
    remainingStateCheck: "Parse ledgers and count legacy resourceProjection.selectedTypes, provider, or legacy resource fields.",
    endCondition: "Every active ledger has the target projection form or is retained as opaque history.",
    removalPhaseOrRelease: "P5 conversion; broad-history cleanup needs later approval",
    requiredTests: ["legacy ledger", "current ledger", "malformed ledger", "repeat"],
    retentionAndExportRule: "Preserve the source Store backup and never delete project content during conversion.",
    separateDeletionApproval: true,
  },
  {
    bridgeId: "w22-p5-harness-receipt-v1",
    oldForm: "Harness receipt schema 1 executable proof",
    targetForm: "Schema 2 receipt history plus call-time executable verification",
    firstBridgeVersion: "2.0.0-rc",
    owner: "Harness trust owner",
    oldWritesStoppedProof: "P4 receipt writers emit schema 2 and omit executable proof.",
    remainingStateCheck: "Count schemaVersion 1 receipt JSON in migration records and tool-operation history.",
    endCondition: "All active receipt writes are schema 2 and schema 1 remains history only.",
    removalPhaseOrRelease: "Later receipt-history cleanup after export and owner approval",
    requiredTests: ["schema 1 read", "schema 2 write", "package update", "moved launch"],
    retentionAndExportRule: "Retain valid schema 1 receipts as private history. Never use them for current access.",
    separateDeletionApproval: true,
  },
  {
    bridgeId: "w22-p5-pending-operations",
    oldForm: "Supported pending installation operation and step rows",
    targetForm: "The same shared operation journal with target checkout and ledger readers",
    firstBridgeVersion: "2.0.0-rc",
    owner: "Installation recovery owner",
    oldWritesStoppedProof: "No second recovery table or project-local marker is introduced.",
    remainingStateCheck: "Count installation_operations with status pending and inspect plan_complete plus saved steps.",
    endCondition: "Each pending operation reaches completed or rolled-back through the shared journal.",
    removalPhaseOrRelease: "Normal operation retention, not bridge deletion",
    requiredTests: ["complete plan resume", "incomplete rollback", "conflict stop", "restart"],
    retentionAndExportRule: "Keep exact recovery evidence until the operation reaches a verified terminal state.",
    separateDeletionApproval: true,
  },
]);

/** Read and classify the full Store bridge without creating or changing state. */
export function previewStoreCompatibilityBridge(storeRoot: string): StoreCompatibilityBridgePreview {
  const classification = classifyStoreCheckpoint9State(storeRoot);
  const base = {
    schemaVersion: 1 as const,
    readOnly: true as const,
    databasePath: classification.databasePath,
    storeState: classification.state,
    sourceSchemaVersion: classification.schemaVersion,
    targetSchemaVersion: CURRENT_STORE_SCHEMA_VERSION,
  };
  if (classification.state === "absent") {
    return {
      ...base,
      disposition: "rebuild",
      records: [],
      changes: {
        store: [`Create a fresh schema-${CURRENT_STORE_SCHEMA_VERSION} Store.`],
        project: [],
        native: [],
      },
      blockers: [],
      nextAction: "Review setup. Setup can create the Store without a compatibility conversion.",
    };
  }
  if (classification.state === "newer-unknown") {
    return unsafePreview(base, "unsupported", classification.reason, "Update Make Docs to a version that supports this Store.");
  }
  if (classification.state === "corrupt" || classification.state === "unknown" || classification.state === "indeterminate") {
    return unsafePreview(base, "quarantine", classification.reason, "Repair or restore this preserved Store before Store-backed work.");
  }

  const release = acquireStoreAccess(storeRoot);
  let db: StoreDatabase | null = null;
  try {
    db = openStoreSqliteConnection(classification.databasePath, { readOnly: true }, "preview Store compatibility bridge");
    const version = classification.schemaVersion;
    const tables = new Set((db.prepare("SELECT name FROM sqlite_schema WHERE type='table'").all() as Array<{ name: string }>).map((row) => row.name));
    const records: StoreBridgeRecordClassification[] = [];
    const changes: string[] = [];
    const blockers: string[] = [];

    if (version < 5) {
      records.push(record("w22-p5-store-schema-v1-v4", "convert", 1, `Schema ${version} has a supported conversion to schema ${CURRENT_STORE_SCHEMA_VERSION}.`));
    }
    if (version < 6) {
      records.push(record(
        "w23-r0-p5-backlog-review-cache",
        "convert",
        1,
        `Schema ${version} can add the optional rebuildable backlog review cache.`,
      ));
    }
    if (version < CURRENT_STORE_SCHEMA_VERSION) {
      changes.push(`Create and verify one Store backup before converting schema ${version} to schema ${CURRENT_STORE_SCHEMA_VERSION}.`);
    }
    if (version >= 3 && tables.has("installation_checkouts")) {
      const bridgeCollisions = Number((db.prepare("SELECT COUNT(*) AS count FROM installation_migration_records WHERE kind='legacy-import' AND record_id IN ('w22-p5:checkout-object-numbers:v4','w22-p5:installation-ledger-projection:v4')").get() as { count: number | bigint }).count);
      if (version < 5 && bridgeCollisions) blockers.push(`${bridgeCollisions} reserved P5 bridge record(s) already exist in an older schema.`);
      const activeLocks = Number((db.prepare("SELECT COUNT(*) AS count FROM installation_locks").get() as { count: number | bigint }).count);
      if (activeLocks) blockers.push(`${activeLocks} active installation lock(s) must finish before conversion.`);
      const pendingToolOperations = Number((db.prepare("SELECT COUNT(*) AS count FROM tool_operations WHERE status='pending'").get() as { count: number | bigint }).count);
      if (pendingToolOperations) blockers.push(`${pendingToolOperations} pending tool operation(s) require recovery before conversion.`);
      const columns = new Set((db.prepare("PRAGMA table_info(installation_checkouts)").all() as Array<{ name: string }>).map((row) => row.name));
      if (columns.has("root_device") || columns.has("root_inode")) {
        const count = countRows(db, "installation_checkouts");
        records.push(record("w22-p5-checkout-object-numbers", "convert", count, "Archive legacy values as evidence, then remove the active identity columns."));
        changes.push(`Archive device and inode strings for ${count} checkout row(s), then remove both active columns.`);
      } else {
        const count = countRecordId(db, "w22-p5:checkout-object-numbers:v4");
        records.push(record("w22-p5-checkout-object-numbers", "retain-history", count, "Object numbers are no longer active fields."));
      }

      const ledgerRows = db.prepare("SELECT checkout_id, manifest_json FROM installation_ledgers ORDER BY checkout_id").all() as Array<{ checkout_id: string; manifest_json: string }>;
      let legacyLedgers = 0;
      for (const row of ledgerRows) {
        const value = parseObject(row.manifest_json);
        if (!value) {
          blockers.push(`Installation ledger ${row.checkout_id} is malformed or unsupported.`);
          continue;
        }
        if (hasLegacyProjection(value)) legacyLedgers++;
      }
      records.push(record("w22-p5-installation-ledger", legacyLedgers ? "convert" : "retain-history", ledgerRows.length, legacyLedgers ? `${legacyLedgers} ledger(s) use legacy projection mirrors.` : "All readable ledgers use the accepted projection form."));
      if (legacyLedgers) changes.push(`Convert legacy projection mirrors in ${legacyLedgers} installation ledger(s) through the versioned reader and target writer.`);

      const transfers = countRows(db, "installation_transfers");
      records.push(record("w22-p5-installation-transfers", transfers ? "retain-history" : "removable-after-proof", transfers, transfers ? "Existing rows remain private history. New imports use migration records." : "No legacy transfer rows remain."));

      const pending = Number((db.prepare("SELECT COUNT(*) AS count FROM installation_operations WHERE status='pending'").get() as { count: number | bigint }).count);
      records.push(record("w22-p5-pending-operations", "retain-history", pending, pending ? "Pending work remains in the shared recovery journal." : "No pending installation operation exists."));

      const receiptVersions = countHarnessReceiptVersions(db);
      records.push(record("w22-p5-harness-receipt-v1", "retain-history", receiptVersions.legacy, `${receiptVersions.legacy} schema-1 receipt(s) remain readable history; ${receiptVersions.current} schema-2 receipt(s) use current form.`));
    }

    if (tables.has("store_checkpoint_journal")) {
      const oldReceipts = countRows(db, "store_checkpoint_journal");
      const targetReceipts = tables.has("store_migration_receipts") ? countRows(db, "store_migration_receipts") : 0;
      records.push(record("w22-p5-checkpoint-receipts", version < CURRENT_STORE_SCHEMA_VERSION && oldReceipts ? "convert" : "retain-history", oldReceipts, `${targetReceipts} target receipt(s) and ${oldReceipts} retained checkpoint receipt(s) are present.`));
      if (version < CURRENT_STORE_SCHEMA_VERSION && oldReceipts) changes.push(`Copy ${oldReceipts} checkpoint receipt row(s) to target receipt history and verify readback.`);
    }

    const disposition: StoreBridgeDisposition = blockers.length
      ? "quarantine"
      : version < CURRENT_STORE_SCHEMA_VERSION || records.some((entry) => entry.disposition === "convert")
        ? "convert"
        : "retain-history";
    return {
      ...base,
      disposition,
      records,
      changes: { store: changes, project: [], native: [] },
      blockers,
      nextAction: blockers.length
        ? "Keep the Store unchanged. Repair the listed record, then preview setup again."
        : disposition === "convert"
          ? "Review this exact Store plan, then run setup to apply it."
          : "No compatibility conversion is required.",
    };
  } finally {
    db?.close();
    release();
  }
}

function unsafePreview(
  base: Pick<StoreCompatibilityBridgePreview, "schemaVersion" | "readOnly" | "databasePath" | "storeState" | "sourceSchemaVersion" | "targetSchemaVersion">,
  disposition: "quarantine" | "unsupported",
  reason: string,
  nextAction: string,
): StoreCompatibilityBridgePreview {
  return { ...base, disposition, records: [], changes: { store: [], project: [], native: [] }, blockers: [reason], nextAction };
}

function record(bridgeId: string, disposition: StoreBridgeDisposition, count: number, reason: string): StoreBridgeRecordClassification {
  return { bridgeId, disposition, count, reason };
}

function countRows(db: StoreDatabase, table: "installation_checkouts" | "installation_transfers" | "store_checkpoint_journal" | "store_migration_receipts"): number {
  return Number((db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get() as { count: number | bigint }).count);
}

function countRecordId(db: StoreDatabase, recordId: string): number {
  return Number((db.prepare("SELECT COUNT(*) AS count FROM installation_migration_records WHERE record_id=?").get(recordId) as { count: number | bigint }).count);
}

function parseObject(value: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function hasLegacyProjection(manifest: Record<string, unknown>): boolean {
  const projection = manifest.resourceProjection;
  if (!projection || typeof projection !== "object" || Array.isArray(projection)) return false;
  const value = projection as Record<string, unknown>;
  if ("selectedTypes" in value || "provider" in value) return true;
  const resources = value.resources;
  if (!resources || typeof resources !== "object" || Array.isArray(resources)) return false;
  const legacy = new Set(["type", "resourcePath", "provenanceState", "providerPackage", "providerVersion", "providerImmutableRef", "materializationMode", "sourceDigest", "adoptionReceipt", "selectionTrigger", "operationLineage", "provenanceEvidence", "competingClaims"]);
  return Object.values(resources as Record<string, unknown>).some((entry) => entry && typeof entry === "object" && !Array.isArray(entry) && Object.keys(entry as Record<string, unknown>).some((key) => legacy.has(key)));
}

function countHarnessReceiptVersions(db: StoreDatabase): { legacy: number; current: number } {
  let legacy = 0;
  let current = 0;
  const values: string[] = [];
  values.push(...(db.prepare("SELECT record_json FROM installation_migration_records WHERE kind='receipt'").all() as Array<{ record_json: string }>).map((row) => row.record_json));
  values.push(...(db.prepare("SELECT metadata_json FROM tool_operations WHERE operation LIKE 'setup.system.receipt%'").all() as Array<{ metadata_json: string }>).map((row) => row.metadata_json));
  for (const value of values) {
    const parsed = parseObject(value);
    if (parsed?.schemaVersion === 1) legacy++;
    if (parsed?.schemaVersion === 2) current++;
  }
  return { legacy, current };
}
