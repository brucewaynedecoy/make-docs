// PERF-005 harness (W32 R0 P5). Runs the shipped cleanStore once on a Store duplicate with a set clock.
// Never point it at a real Store: pass a duplicate folder and set MAKE_DOCS_HOME and HOME to temporary folders.
// Usage, from packages/cli: npx tsx <this file> <storeRoot> <isoNow> <outJson>
import { createRequire } from "node:module";
import { statSync, writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { checkStore, cleanStore, defaultStoreMaintenanceEnvironment } from "../../../../../../packages/cli/src/store/maintenance.ts";
import { CLI_STORE_MAINTENANCE_VERSIONS } from "../../../../../../packages/cli/src/operations/setup/store-ops.ts";

const [storeRoot, isoNow, outJson] = process.argv.slice(2);
if (!storeRoot || !isoNow || !outJson) throw new Error("usage: perf-005-harness.mjs <storeRoot> <isoNow> <outJson>");

// Observer: time the statements that clean runs through DatabaseSync.exec.
const { DatabaseSync } = createRequire(import.meta.url)("node:sqlite");
const timings = [];
const exec = DatabaseSync.prototype.exec;
DatabaseSync.prototype.exec = function (sql) {
  const head = sql.trim().slice(0, 40);
  const timed = /^(VACUUM|BEGIN IMMEDIATE|COMMIT|PRAGMA wal_checkpoint)/i.test(head);
  const start = performance.now();
  try {
    return exec.call(this, sql);
  } finally {
    if (timed) timings.push({ sql: head.startsWith("VACUUM INTO") ? "VACUUM INTO <backup>" : head, ms: performance.now() - start });
  }
};

const env = defaultStoreMaintenanceEnvironment(CLI_STORE_MAINTENANCE_VERSIONS, new Date(isoNow));
const checkStart = performance.now();
const check = checkStore(storeRoot, env);
const checkMs = performance.now() - checkStart;
const cleanStart = performance.now();
const clean = cleanStore(storeRoot, env);
const cleanMs = performance.now() - cleanStart;
const backupBytes = clean.backup ? statSync(clean.backup.path).size : null;
writeFileSync(outJson, JSON.stringify({ isoNow, checkMs, cleanMs, timings, backupBytes, check, clean }, null, 1));
console.log(JSON.stringify({ checkMs: Math.round(checkMs), cleanMs: Math.round(cleanMs), space: clean.space, backupBytes }));
