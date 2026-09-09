import { realpathSync } from "node:fs";
import { loadSqliteDriver } from "../src/store/database";
import { getStoreDatabasePath, resolveStoreRoot } from "../src/store/paths";

/** Deliberate old/corrupt ledger fixture. Production writers must never use this. */
export function writeRawStoreLedger(projectRoot: string, manifest: unknown): void {
  const driver = loadSqliteDriver();
  if (!driver.available) throw new Error(driver.reason);
  const db = new driver.sqlite.DatabaseSync(getStoreDatabasePath(resolveStoreRoot()));
  try {
    const result = db.prepare("UPDATE installation_ledgers SET manifest_json=? WHERE checkout_id=(SELECT checkout_id FROM installation_checkouts WHERE root_path=?)")
      .run(JSON.stringify(manifest), realpathSync(projectRoot));
    if (Number(result.changes) !== 1) throw new Error("Fixture requires an existing Store installation.");
  } finally { db.close(); }
}

export function readRawStoreLedger(projectRoot: string): string {
  const driver = loadSqliteDriver();
  if (!driver.available) throw new Error(driver.reason);
  const db = new driver.sqlite.DatabaseSync(getStoreDatabasePath(resolveStoreRoot()), { readOnly: true });
  try {
    const row = db.prepare("SELECT manifest_json FROM installation_ledgers WHERE checkout_id=(SELECT checkout_id FROM installation_checkouts WHERE root_path=?)")
      .get(realpathSync(projectRoot)) as { manifest_json: string } | undefined;
    if (!row) throw new Error("Fixture requires an existing Store installation.");
    return row.manifest_json;
  } finally { db.close(); }
}
