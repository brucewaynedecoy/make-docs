import { platform } from "../src/platform";
import { loadSqliteDriver } from "../src/store/database";
import { canonicalInstallationPath } from "../src/store/installation-state";
import { getStoreDatabasePath, resolveStoreRoot } from "../src/store/paths";

/** Deliberate old/corrupt ledger fixture. Production writers must never use this. */
export function writeRawStoreLedger(projectRoot: string, manifest: unknown): void {
  const driver = loadSqliteDriver();
  if (!driver.available) throw new Error(driver.reason);
  const db = new driver.sqlite.DatabaseSync(getStoreDatabasePath(resolveStoreRoot()));
  try {
    const rootPathKey = platform.comparisonKey(canonicalInstallationPath(projectRoot));
    const result = db.prepare("UPDATE installation_ledgers SET manifest_json=? WHERE checkout_id=(SELECT checkout_id FROM installation_checkouts WHERE root_path_key=?)")
      .run(JSON.stringify(manifest), rootPathKey);
    if (Number(result.changes) !== 1) throw new Error("Fixture requires an existing Store installation.");
  } finally { db.close(); }
}

export function readRawStoreLedger(projectRoot: string): string {
  const driver = loadSqliteDriver();
  if (!driver.available) throw new Error(driver.reason);
  const db = new driver.sqlite.DatabaseSync(getStoreDatabasePath(resolveStoreRoot()), { readOnly: true });
  try {
    const rootPathKey = platform.comparisonKey(canonicalInstallationPath(projectRoot));
    const row = db.prepare("SELECT manifest_json FROM installation_ledgers WHERE checkout_id=(SELECT checkout_id FROM installation_checkouts WHERE root_path_key=?)")
      .get(rootPathKey) as { manifest_json: string } | undefined;
    if (!row) throw new Error("Fixture requires an existing Store installation.");
    return row.manifest_json;
  } finally { db.close(); }
}
