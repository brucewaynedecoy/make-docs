import { createHash, randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, lstatSync, mkdirSync, readdirSync, renameSync, rmSync, statSync, unlinkSync } from "node:fs";
import path from "node:path";

import { platform, type ProcessLiveness } from "../platform";
import {
  CURRENT_STORE_SCHEMA_VERSION,
  STORE_CLEAN_BACKUP_PATTERN,
  STORE_CLEAN_PARTIAL_BACKUP_PATTERN,
  applyStoreFileMode,
  classifyStoreCheckpoint9State,
  inspectStoreWriteGuard,
  isSqliteContention,
  isVerifiedStoreBackupFile,
  inspectStoreBrokenReferences,
  listUnguardableStoreTables,
  openStoreForReview,
  openStoreSqliteConnection,
  readUserVersion,
  storeLedgerDigest,
  type StoreBrokenReference,
  type StoreDatabase,
  type StoreUnguardableTable,
} from "./database";
import { getStoreDatabasePath } from "./paths";
import { listGitHookRecords } from "../git-hooks";
import {
  DETACHED_EVIDENCE_REASON,
  STORE_BLOCKING_LEFTOVERS,
  STORE_DECISION_ITEMS,
  STORE_FIXED_RULES,
  STORE_MAINTENANCE_SETTINGS,
  STORE_TABLE_CATALOG_ID,
  classifyMigrationRecord,
  storeMaintenanceParametersFor,
  storeMaintenanceSqlParameters,
  storeTableCatalogDigest,
  type StoreBlockingLeftover,
  type StoreDecisionItemId,
  type StoreFixedRule,
  type StoreFixedRuleId,
  type StoreMaintenanceVersions,
  type StoreProofResult,
  type StoreRuleCandidateQuery,
} from "./table-catalog";

/**
 * W32 R0 P4 Store maintenance (PRD 38 R-MAINT-3 to R-MAINT-5 and R-MAINT-7,
 * PRD 39 R-STORE-CMD-3 and R-STORE-CMD-4). `checkStore` reads only and
 * reports what each fixed rule in the table catalog would do. `cleanStore`
 * backs up the Store, then changes only the rows that the active rules prove,
 * each with a compare-and-change statement in one write transaction, and
 * vacuums the file.
 */

type SqlValue = string | number | bigint | null | Uint8Array;
type Row = Record<string, SqlValue>;

export type StoreMaintenanceOutcome = "act" | "keep" | "skip";

/** The checks that the rules use. Production uses {@link defaultStoreMaintenanceEnvironment}; tests inject fixed answers. */
export interface StoreMaintenanceEnvironment {
  now: Date;
  versions: StoreMaintenanceVersions;
  /** platform.processLiveness. */
  liveness(pid: number, hostname: string): ProcessLiveness;
  /** platform.comparisonKey. It may throw for a path that it cannot describe. */
  comparisonKey(input: string): string;
  /** lstat of a checkout folder: `proven` when it is missing (ENOENT). */
  folderMissing(input: string): StoreProofResult;
  /** The full process list of this host, or null when it cannot be read in full. */
  processList(): readonly string[] | null;
  /** Test seam: force rules on or off. Production follows the catalog activation. */
  activeRules?: ReadonlySet<StoreFixedRuleId>;
}

export function defaultStoreMaintenanceEnvironment(versions: StoreMaintenanceVersions, now = new Date()): StoreMaintenanceEnvironment {
  return {
    now,
    versions,
    liveness: (pid, hostname) => platform.processLiveness(pid, hostname),
    comparisonKey: (input) => platform.comparisonKey(input),
    folderMissing: lstatFolderMissing,
    processList: readProcessList,
  };
}

function lstatFolderMissing(input: string): StoreProofResult {
  try {
    lstatSync(input);
    return "refuted";
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "ENOENT" ? "proven" : "unknown";
  }
}

/* ------------------------------------------------------------------------ */
/* Package-manager-idle proof (FOLLOW-UP-P4-PACKAGE-MANAGER-IDLE)           */
/* ------------------------------------------------------------------------ */

export const KNOWN_PACKAGE_MANAGERS = ["npm", "pnpm", "bun", "brew"] as const;

/**
 * Read every process command line on this host, except this process and its
 * parent. POSIX only: `ps -A -ww -o pid=,args=` prints each full command line
 * without truncation. Any doubt gives null: another platform, a failed run, or
 * an empty list.
 */
export function readProcessList(): readonly string[] | null {
  if (platform.kind === "win32") return null;
  try {
    const result = spawnSync("ps", ["-A", "-ww", "-o", "pid=,args="], { encoding: "utf8", timeout: 5000, maxBuffer: 16 * 1024 * 1024 });
    if (result.error || result.status !== 0 || result.signal || typeof result.stdout !== "string") return null;
    const own = new Set([process.pid, process.ppid]);
    const lines: string[] = [];
    for (const raw of result.stdout.split("\n")) {
      const match = /^\s*(\d+)\s+(.*)$/.exec(raw);
      if (!match) {
        if (raw.trim().length > 0) return null;
        continue;
      }
      if (!own.has(Number(match[1]))) lines.push(match[2]!.trim());
    }
    return lines.length > 0 ? lines : null;
  } catch {
    return null;
  }
}

/** Interpreters and shells that can run a package manager under another process name. */
const MANAGER_HOSTS = new Set(["node", "nodejs", "ruby", "bash", "sh", "zsh", "dash", "bun", "deno", "corepack", "npx", "make-docs"]);
const SCRIPT_EXTENSIONS = /\.(c?js|mjs|sh|rb|exe|cmd|bat|ps1)$/;
/** The make-docs package as a word: `make-docs`, `@scope/make-docs`, with an optional `@version`. Never a file path. */
const MAKE_DOCS_PACKAGE_WORD = /^(@[a-z0-9._-]+\/)?make-docs(@\S*)?$/i;

function normalizeWord(word: string): string {
  let base = word.replace(/^["']+|["']+$/g, "").toLowerCase();
  while (SCRIPT_EXTENSIONS.test(base)) base = base.replace(SCRIPT_EXTENSIONS, "");
  return base;
}

/**
 * How one process line relates to the recorded manager. Every word counts:
 * the bare word, each path segment, and the file name without a script
 * extension (`npm-cli.js`, `pnpm.cjs`, `brew.rb`, `brew.sh`).
 */
function classifyProcessLine(line: string, manager: string): "running" | "doubt" | "other" {
  const trimmed = line.trim();
  // A command line that the system cannot show, such as `(node)`, `[npm]`, or a defunct process.
  const hidden = /^[[(](.*)[\])]$/.exec(trimmed) ?? /^(.*)\s*<defunct>$/.exec(trimmed);
  if (hidden) {
    const name = normalizeWord(hidden[1]!.trim().split(/[\\/]/).pop() ?? "");
    return name === manager || name === `${manager}-cli` || MANAGER_HOSTS.has(name) ? "doubt" : "other";
  }
  for (const word of trimmed.split(/\s+/)) {
    const clean = word.replace(/^["']+|["']+$/g, "");
    if (!/[\\/]/.test(clean.replace(/^@[^/]+\//, "")) && MAKE_DOCS_PACKAGE_WORD.test(clean)) return "running";
    const segments = clean.split(/[\\/]/).filter((segment) => segment.length > 0).map(normalizeWord);
    if (segments.some((segment) => segment === manager || segment === `${manager}-cli`)) return "running";
  }
  return "other";
}

/**
 * The package-manager-idle proof (table-catalog.ts STORE_MAINTENANCE_PROOFS).
 * It uses only the recorded `manager` and `command`. `binaryPath` is the Make
 * Docs CLI path, so it is never read. A manager can change its process title,
 * so any process that names the manager or the make-docs package counts as a
 * run, whatever its arguments.
 */
export function packageManagerIdleProof(metadataJson: SqlValue, processes: readonly string[] | null): { result: StoreProofResult; reason: string } {
  let metadata: { manager?: unknown; command?: unknown };
  try {
    metadata = JSON.parse(String(metadataJson)) as typeof metadata;
  } catch {
    return { result: "unknown", reason: "The tool operation metadata is not valid JSON." };
  }
  if (!metadata || typeof metadata !== "object") return { result: "unknown", reason: "The tool operation metadata is not an object." };
  const manager = metadata.manager;
  if (typeof manager !== "string" || !(KNOWN_PACKAGE_MANAGERS as readonly string[]).includes(manager)) {
    return { result: "unknown", reason: "The metadata names no known package manager." };
  }
  const command = metadata.command;
  if (typeof command !== "string" || !command.startsWith(`${manager} `) || command.slice(manager.length + 1).trim().length === 0) {
    return { result: "unknown", reason: `The metadata has no ${manager} command.` };
  }
  if (!processes || processes.length === 0) return { result: "unknown", reason: "The process list of this computer cannot be read in full." };
  let doubt = false;
  for (const line of processes) {
    const kind = classifyProcessLine(line, manager);
    if (kind === "running") return { result: "refuted", reason: `A process that names ${manager} or the make-docs package is still running.` };
    if (kind === "doubt") doubt = true;
  }
  return doubt
    ? { result: "unknown", reason: `A process whose command line cannot be read could be ${manager}.` }
    : { result: "proven", reason: `No process names ${manager} or the make-docs package.` };
}

/* ------------------------------------------------------------------------ */
/* Evaluation                                                               */
/* ------------------------------------------------------------------------ */

export interface StoreMaintenanceRowResult {
  rule: StoreFixedRuleId;
  query: number;
  /** Key column values joined with `|`. */
  key: string;
  keyValues: Record<string, SqlValue>;
  /** The outcome that this clean gives. An inactive rule always gives `skip`. */
  outcome: StoreMaintenanceOutcome;
  /** The outcome that the rule gives once it is active. */
  ruleOutcome: StoreMaintenanceOutcome;
  /** Plain reason for a keep or skip. */
  reason: string | null;
  /** Store bytes that the change removes: the row's data for a delete, the removed text for a trim. */
  bytes: number;
  /** True when the row acts only because STORE-RULE-005 removes its plan earlier in the same clean. */
  afterRule005: boolean;
  /** The checked row, for the compare-and-change write. */
  row: Row;
}

export interface StoreMaintenanceRuleEvaluation {
  rule: StoreFixedRule;
  active: boolean;
  rows: StoreMaintenanceRowResult[];
}

export interface StoreMaintenanceDecision {
  id: StoreDecisionItemId;
  title: string;
  key: string;
  reason: string;
  nextAction: string;
}

export interface StoreMaintenanceLeftover {
  id: StoreBlockingLeftover["id"];
  title: string;
  key: string;
  blocks: string;
  /** True when this clean clears it. */
  clearedByClean: boolean;
  why: string;
  nextAction: string;
}

/** The order in which a clean applies the rules. STORE-RULE-005 runs before 003 and 004 (catalog effect). */
export const STORE_RULE_APPLY_ORDER: readonly StoreFixedRuleId[] = [
  "STORE-RULE-001",
  "STORE-RULE-002",
  "STORE-RULE-005",
  "STORE-RULE-003",
  "STORE-RULE-004",
  "STORE-RULE-006",
  "STORE-RULE-007",
  "STORE-RULE-008",
  "STORE-RULE-009",
];

const ruleById = new Map(STORE_FIXED_RULES.map((rule) => [rule.id, rule]));
const RECOVERABLE = ["pending", "failed"];

function isRuleActive(rule: StoreFixedRule, env: StoreMaintenanceEnvironment): boolean {
  return env.activeRules ? env.activeRules.has(rule.id) : rule.activation.state === "active";
}

function text(value: SqlValue | undefined): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Uint8Array) return Buffer.from(value).toString("utf8");
  return String(value);
}

function byteLength(value: SqlValue | undefined): number {
  if (value === null || value === undefined) return 0;
  if (value instanceof Uint8Array) return value.byteLength;
  if (typeof value === "number" || typeof value === "bigint") return 8;
  return Buffer.byteLength(value, "utf8");
}

function keyOf(query: StoreRuleCandidateQuery, row: Row): string {
  return query.key.map((column) => text(row[column])).join("|");
}

function keyValuesOf(query: StoreRuleCandidateQuery, row: Row): Record<string, SqlValue> {
  return Object.fromEntries(query.key.map((column) => [column, row[column] ?? null]));
}

/** The bytes of every column of one row, found by its key. */
function rowBytes(db: StoreDatabase, table: string, keyValues: Record<string, SqlValue>): number {
  const columns = Object.keys(keyValues);
  const row = db.prepare(`SELECT * FROM ${table} WHERE ${columns.map((column) => `${column} IS ?`).join(" AND ")}`)
    .get(...columns.map((column) => keyValues[column]!)) as Row | undefined;
  return row ? Object.values(row).reduce<number>((sum, value) => sum + byteLength(value), 0) : 0;
}

function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function ownerProof(env: StoreMaintenanceEnvironment, pid: SqlValue, hostname: SqlValue): { result: StoreProofResult; reason: string } {
  const state = env.liveness(Number(pid), text(hostname));
  if (state === "dead") return { result: "proven", reason: "Its owner process has stopped." };
  if (state === "alive") return { result: "refuted", reason: "Its owner process is still running." };
  return { result: "unknown", reason: `Its owner (process ${text(pid)} on ${text(hostname)}) cannot be checked from this computer.` };
}

/** True when a pending or failed installation operation belongs to a checkout at this lock path. */
function lockGuardsOperation(db: StoreDatabase, rootPath: string, key: string): boolean {
  return Boolean(db.prepare(
    `SELECT 1 FROM installation_operations o JOIN installation_checkouts c ON c.checkout_id = o.checkout_id
      WHERE o.status IN ('pending','failed')
        AND (c.root_path = ? OR c.root_path_key = ? OR c.root_path_key = ? OR c.root_path_key = lower(?)) LIMIT 1`,
  ).get(rootPath, rootPath, key, rootPath));
}

function stripSavedBytes(value: SqlValue): string {
  const raw = text(value);
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) || !("contentBase64" in parsed)) return raw;
    const { contentBase64: _removed, ...rest } = parsed as Record<string, unknown>;
    return JSON.stringify(rest);
  } catch {
    return raw;
  }
}

const fullLedger = (value: SqlValue) => value !== null && value !== undefined && text(value) !== "null";

/** Detached plan and atomic intent rows of an operation, as `checkout_id|kind|record_id` keys. */
function detachedEvidenceKeys(db: StoreDatabase, operationId: string): string[] {
  const rows = db.prepare(
    `SELECT r.checkout_id, r.kind, r.record_id FROM installation_migration_records r
       JOIN installation_operations o ON o.checkout_id = r.checkout_id AND o.operation_id = ?
      WHERE (r.kind = 'snapshot' AND (r.record_id = 'detached:' || o.operation_id OR r.record_id = 'detached-original:' || o.operation_id))
         OR (r.kind = 'backup' AND substr(r.record_id, 1, length('atomic:' || o.operation_id || ':')) = 'atomic:' || o.operation_id || ':')`,
  ).all(operationId) as Row[];
  return rows.map((row) => `${text(row.checkout_id)}|${text(row.kind)}|${text(row.record_id)}`);
}

interface EvaluationContext {
  db: StoreDatabase;
  env: StoreMaintenanceEnvironment;
  parameters: Record<string, string | number>;
  /** When set, STORE-RULE-003 and 004 treat these rule 005 rows as gone (check only). */
  rule005Removals: Set<string> | null;
  processes: readonly string[] | null | undefined;
}

function evaluateRow(rule: StoreFixedRule, query: StoreRuleCandidateQuery, queryIndex: number, row: Row, ctx: EvaluationContext): StoreMaintenanceRowResult {
  const { db, env } = ctx;
  let outcome: StoreMaintenanceOutcome = "act";
  let reason: string | null = null;
  let bytes = 0;
  let afterRule005 = false;
  const skipReason = row.skip_reason === null || row.skip_reason === undefined ? null : text(row.skip_reason);
  const skip = (why: string) => { outcome = "skip"; reason = why; };
  const keep = (why: string) => { outcome = "keep"; reason = why; };
  const proof = (result: { result: StoreProofResult; reason: string }) => {
    if (result.result === "refuted") keep(result.reason);
    else if (result.result === "unknown") skip(result.reason);
  };
  const cascades = (operationId: string) => {
    if (skipReason !== DETACHED_EVIDENCE_REASON || !ctx.rule005Removals) return false;
    const keys = detachedEvidenceKeys(db, operationId);
    return keys.length > 0 && keys.every((key) => ctx.rule005Removals!.has(key));
  };

  switch (rule.id) {
    case "STORE-RULE-001": {
      const rootPath = text(row.root_path);
      let key: string | null = null;
      try {
        key = env.comparisonKey(rootPath);
      } catch {
        skip("This computer cannot describe the lock path, so the lock stays.");
      }
      if (key !== null) {
        if (lockGuardsOperation(db, rootPath, key)) keep("It guards an unfinished change on its checkout.");
        else proof(ownerProof(env, row.pid, row.hostname));
      }
      bytes = rowBytes(db, "installation_locks", { root_path: row.root_path ?? null });
      break;
    }
    case "STORE-RULE-002": {
      proof(ownerProof(env, row.pid, row.hostname));
      if (outcome === "act") {
        if (ctx.processes === undefined) ctx.processes = env.processList();
        proof(packageManagerIdleProof(row.metadata_json ?? null, ctx.processes));
      }
      bytes = 0;
      break;
    }
    case "STORE-RULE-003": {
      if (skipReason && !(afterRule005 = cascades(text(row.operation_id)))) skip(skipReason);
      bytes = byteLength(row.before_json) + byteLength(row.after_json)
        - Buffer.byteLength(stripSavedBytes(row.before_json ?? null)) - Buffer.byteLength(stripSavedBytes(row.after_json ?? null));
      break;
    }
    case "STORE-RULE-004": {
      if (skipReason && !(afterRule005 = cascades(text(row.operation_id)))) skip(skipReason);
      else {
        for (const side of ["before", "after"] as const) {
          const ledger = row[`${side}_ledger`] ?? null;
          if (fullLedger(ledger) && storeLedgerDigest(text(ledger)) !== text(row[`${side}_ledger_digest`])) {
            skip(`The ${side}_ledger_digest receipt column does not match the ${side} ledger, so the ledger stays.`);
          }
        }
      }
      bytes = (fullLedger(row.before_ledger ?? null) ? byteLength(row.before_ledger) : 0) + (fullLedger(row.after_ledger ?? null) ? byteLength(row.after_ledger) : 0);
      break;
    }
    case "STORE-RULE-005": {
      if (skipReason) skip(skipReason);
      bytes = rowBytes(db, "installation_migration_records", { checkout_id: row.checkout_id ?? null, kind: row.kind ?? null, record_id: row.record_id ?? null });
      break;
    }
    case "STORE-RULE-006": {
      if (skipReason) skip(skipReason);
      else proof(lockTokenAbsentProof(db, row.record_json ?? null));
      bytes = rowBytes(db, "installation_migration_records", { checkout_id: row.checkout_id ?? null, kind: row.kind ?? null, record_id: row.record_id ?? null });
      break;
    }
    case "STORE-RULE-007":
      bytes = rowBytes(db, "store_checkpoint_journal", keyValuesOf(query, row));
      break;
    case "STORE-RULE-008":
      bytes = rowBytes(db, "backlog_review_cache", keyValuesOf(query, row));
      break;
    case "STORE-RULE-009":
      if (skipReason) skip(skipReason);
      bytes = rowBytes(db, query.table, keyValuesOf(query, row));
      break;
  }
  const active = isRuleActive(rule, env);
  const ruleOutcome: StoreMaintenanceOutcome = outcome;
  if (!active) {
    const activation = rule.activation.state === "inactive" ? rule.activation.reason : "The rule is off in this run.";
    reason = `This rule is not on yet. ${activation}${ruleOutcome === "act" ? " Once on, it would act on this row." : reason ? ` Once on, it would still ${ruleOutcome} this row: ${reason}` : ""}`;
    outcome = "skip";
    afterRule005 = false;
  }
  return { rule: rule.id, query: queryIndex, key: keyOf(query, row), keyValues: keyValuesOf(query, row), outcome, ruleOutcome, reason, bytes: Math.max(0, bytes), afterRule005, row };
}

function lockTokenAbsentProof(db: StoreDatabase, recordJson: SqlValue): { result: StoreProofResult; reason: string } {
  let digest: unknown;
  try {
    digest = (JSON.parse(text(recordJson)) as { lockTokenDigest?: unknown }).lockTokenDigest;
  } catch {
    return { result: "unknown", reason: "The barrier record is not valid JSON." };
  }
  if (typeof digest !== "string" || !/^[0-9a-f]{64}$/.test(digest)) return { result: "unknown", reason: "The barrier record names no lock token digest." };
  const tokens = db.prepare("SELECT token FROM installation_locks").all() as Row[];
  return tokens.some((lock) => sha256Hex(text(lock.token)) === digest)
    ? { result: "refuted", reason: "The lock that the barrier names still exists." }
    : { result: "proven", reason: "The lock that the barrier names is gone." };
}

function evaluateRule(rule: StoreFixedRule, ctx: EvaluationContext): StoreMaintenanceRuleEvaluation {
  const rows: StoreMaintenanceRowResult[] = [];
  rule.candidates.forEach((query, index) => {
    // A fixed rule acts on the SQL row itself. A derive step is for decision items only (storeCatalogDrift reports one here).
    if (query.derive) throw new Error(`Store fixed rule ${rule.id} candidate ${index} has a derive step, which only a decision item may have.`);
    const candidates = ctx.db.prepare(query.sql).all(storeMaintenanceParametersFor(query.sql, ctx.parameters)) as Row[];
    for (const row of candidates) rows.push(evaluateRow(rule, query, index, row, ctx));
  });
  return { rule, active: isRuleActive(rule, ctx.env), rows };
}

/**
 * Evaluate every fixed rule on one connection. With `simulateRule005`, a
 * STORE-RULE-003 or 004 row that waits only for plans that STORE-RULE-005
 * removes in the same clean acts too, as it does in a clean.
 */
export function evaluateStoreRules(db: StoreDatabase, env: StoreMaintenanceEnvironment, options: { simulateRule005: boolean }): StoreMaintenanceRuleEvaluation[] {
  const ctx: EvaluationContext = {
    db,
    env,
    parameters: storeMaintenanceSqlParameters(env.now, env.versions),
    rule005Removals: null,
    processes: undefined,
  };
  const results = new Map<StoreFixedRuleId, StoreMaintenanceRuleEvaluation>();
  for (const id of STORE_RULE_APPLY_ORDER) {
    const evaluation = evaluateRule(ruleById.get(id)!, ctx);
    results.set(id, evaluation);
    if (id === "STORE-RULE-005" && options.simulateRule005) {
      ctx.rule005Removals = new Set(evaluation.rows.filter((row) => row.outcome === "act").map((row) => row.key));
    }
  }
  return STORE_FIXED_RULES.map((rule) => results.get(rule.id)!);
}

/** Rules whose rows wait for the terminal operation retention window. */
const RETENTION_RULES: ReadonlySet<StoreFixedRuleId> = new Set(["STORE-RULE-003", "STORE-RULE-004", "STORE-RULE-005"]);
const DAY_MS = 24 * 60 * 60 * 1000;

/** Rows that a retention rule would act on once their operation leaves the retention window. */
export interface StoreRetentionWaiting {
  rows: number;
  retentionDays: number;
  /** The first day (UTC, `YYYY-MM-DD`) on which one of these rows can go. */
  firstDate: string;
}

/**
 * Find the rows of STORE-RULE-003, 004, and 005 that wait only for the
 * retention window: the same rules and proofs, with every finished operation
 * treated as old enough, minus the rows that already act now. Reads only.
 */
function findRetentionWaiting(db: StoreDatabase, env: StoreMaintenanceEnvironment, current: readonly StoreMaintenanceRuleEvaluation[]): StoreRetentionWaiting | null {
  const retentionDays = STORE_MAINTENANCE_SETTINGS.terminalOperationRetentionDays.value;
  const acting = new Set(current.flatMap((evaluation) => evaluation.rows.filter((row) => row.outcome === "act").map((row) => `${row.rule}\u0000${row.key}`)));
  const later = new Date(env.now.getTime() + 36_500 * DAY_MS);
  const ctx: EvaluationContext = { db, env: { ...env, now: later }, parameters: storeMaintenanceSqlParameters(later, env.versions), rule005Removals: null, processes: undefined };
  let rows = 0;
  let first = Number.POSITIVE_INFINITY;
  for (const id of STORE_RULE_APPLY_ORDER) {
    if (!RETENTION_RULES.has(id)) continue;
    const evaluation = evaluateRule(ruleById.get(id)!, ctx);
    if (id === "STORE-RULE-005") ctx.rule005Removals = new Set(evaluation.rows.filter((row) => row.outcome === "act").map((row) => row.key));
    for (const row of evaluation.rows) {
      if (row.outcome !== "act" || acting.has(`${row.rule}\u0000${row.key}`)) continue;
      const finished = Date.parse(text(row.row.finished_at ?? row.row.operation_finished_at));
      if (!Number.isFinite(finished)) continue;
      rows += 1;
      first = Math.min(first, finished + retentionDays * DAY_MS);
    }
  }
  if (rows === 0) return null;
  // The UTC day on which the first row's window ends; the row can go later that day.
  return { rows, retentionDays, firstDate: new Date(Math.max(first, env.now.getTime())).toISOString().slice(0, 10) };
}

/** One plain sentence about the rows that wait for the retention window. */
export function describeRetentionWaiting(waiting: StoreRetentionWaiting, more: boolean): string {
  return `${plural(waiting.rows, `${more ? "more " : ""}row`)} ${waiting.rows === 1 ? "waits" : "wait"} for the ${waiting.retentionDays}-day window; the first can go on ${waiting.firstDate}.`;
}

function fillReason(template: string, row: Row): string {
  return template.replace(/\{([a-z_]+)\}/g, (_match, column: string) => text(row[column]));
}

export function evaluateStoreDecisions(db: StoreDatabase, env: StoreMaintenanceEnvironment): StoreMaintenanceDecision[] {
  const parameters = storeMaintenanceSqlParameters(env.now, env.versions);
  const decisions: StoreMaintenanceDecision[] = [];
  for (const item of STORE_DECISION_ITEMS) {
    for (const query of item.candidates) {
      for (const raw of db.prepare(query.sql).all(storeMaintenanceParametersFor(query.sql, parameters)) as Row[]) {
        const row = query.derive ? (query.derive(raw) as Row | null) : raw;
        if (row === null) continue;
        let reason = fillReason(item.reasonText, row);
        if (item.proofs.includes("checkout-folder-missing")) {
          const missing = env.folderMissing(text(row.root_path));
          if (missing === "refuted") continue;
          // Only the checkout item names the folder. A backup record's reason already covers a folder that cannot be checked, with no absolute path.
          if (missing === "unknown" && item.id === "STORE-DECISION-001") reason = `The folder ${text(row.root_path)} for project ${text(row.project_id)} cannot be checked from this computer, for example a drive that is not connected. Make Docs keeps its Store rows.`;
        }
        decisions.push({ id: item.id, title: item.title, key: keyOf(query, row), reason, nextAction: item.nextAction });
      }
    }
  }
  return decisions;
}

const leftoverById = new Map(STORE_BLOCKING_LEFTOVERS.map((leftover) => [leftover.id, leftover]));

function shellQuote(value: string): string {
  return /^[A-Za-z0-9_./:=@%+-]+$/.test(value) ? value : `'${value.replaceAll("'", "'\\''")}'`;
}

/**
 * The crash leftovers that block this computer now (table-catalog.ts
 * STORE_BLOCKING_LEFTOVERS), each with why it blocks and what clears it.
 * A lock or tool operation whose owner still runs is current work, not a
 * leftover.
 */
export function findStoreBlockingLeftovers(db: StoreDatabase, env: StoreMaintenanceEnvironment, rules: readonly StoreMaintenanceRuleEvaluation[]): StoreMaintenanceLeftover[] {
  const leftovers: StoreMaintenanceLeftover[] = [];
  const add = (id: StoreBlockingLeftover["id"], key: string, clearedByClean: boolean, why: string, nextAction: string) => {
    const entry = leftoverById.get(id)!;
    leftovers.push({ id, title: entry.title, key, blocks: entry.blocks, clearedByClean, why, nextAction });
  };
  const rule001 = new Map(rules.find((evaluation) => evaluation.rule.id === "STORE-RULE-001")!.rows.map((row) => [row.key, row]));
  const rule002 = new Map(rules.find((evaluation) => evaluation.rule.id === "STORE-RULE-002")!.rows.map((row) => [row.key, row]));
  const locks = db.prepare("SELECT root_path, token, pid, hostname FROM installation_locks ORDER BY root_path").all() as Row[];
  const liveLockPaths = new Set<string>();
  const lockPaths = new Set<string>();
  for (const lock of locks) {
    const rootPath = text(lock.root_path);
    lockPaths.add(rootPath);
    let key = rootPath;
    try { key = env.comparisonKey(rootPath); } catch { /* the raw path still names it */ }
    lockPaths.add(key);
    const owner = ownerProof(env, lock.pid, lock.hostname);
    if (owner.result === "refuted") { liveLockPaths.add(rootPath); liveLockPaths.add(key); continue; }
    if (lockGuardsOperation(db, rootPath, key)) {
      add("STORE-LEFTOVER-005", rootPath, false, `${owner.reason} It guards an unfinished change, so no fixed rule removes it.`, "Run make-docs project state status in that checkout and use its recovery action (make-docs project state recover).");
      continue;
    }
    const evaluated = rule001.get(rootPath);
    const cleared = evaluated?.outcome === "act";
    add("STORE-LEFTOVER-001", rootPath, cleared, cleared ? owner.reason : evaluated?.reason ?? owner.reason, cleared ? "Run make-docs setup store clean to remove it." : "Check the owner on its own computer. Make Docs keeps the lock while its owner cannot be proven stopped.");
  }
  const tools = db.prepare("SELECT operation_id, operation, pid, hostname FROM tool_operations WHERE status = 'pending' ORDER BY started_at, operation_id").all() as Row[];
  for (const tool of tools) {
    const owner = ownerProof(env, tool.pid, tool.hostname);
    if (owner.result === "refuted") continue;
    const id = text(tool.operation_id);
    if (text(tool.operation) === "setup.system.harness") {
      add("STORE-LEFTOVER-006", id, false, `${owner.reason} This machine setup never finished.`, "Run make-docs setup system to finish or repair it.");
    } else if (text(tool.operation) === "tool.update" || text(tool.operation) === "tool.uninstall") {
      const evaluated = rule002.get(id);
      const cleared = evaluated?.outcome === "act";
      add("STORE-LEFTOVER-002", id, cleared, `${owner.reason} ${evaluated?.reason ?? ""}`.trim(), cleared
        ? "Run make-docs setup store clean to mark it failed."
        : "Check the installed make-docs version and the package manager result yourself. Make Docs does not guess whether the package manager changed anything.");
    }
  }
  const operations = db.prepare(
    `SELECT o.operation_id, o.operation, o.status, c.root_path, c.root_path_key
       FROM installation_operations o JOIN installation_checkouts c ON c.checkout_id = o.checkout_id
      WHERE o.status IN ('pending','failed') ORDER BY o.created_at, o.operation_id`,
  ).all() as Row[];
  for (const operation of operations) {
    const id = text(operation.operation_id);
    const rootPath = text(operation.root_path);
    if (text(operation.operation) === "legacy.recovery" && text(operation.status) === "pending") {
      add("STORE-LEFTOVER-003", id, false, `The import of an old install in ${rootPath} never finished its recovery.`, STORE_DECISION_ITEMS.find((item) => item.id === "STORE-DECISION-003")!.nextAction);
      continue;
    }
    if (env.folderMissing(rootPath) === "proven") {
      add("STORE-LEFTOVER-004", id, false, `The ${text(operation.status)} operation ${text(operation.operation)} belongs to ${rootPath}, and that folder is gone, so it cannot resume.`, STORE_DECISION_ITEMS.find((item) => item.id === "STORE-DECISION-001")!.nextAction);
      continue;
    }
    const keyed = [rootPath, text(operation.root_path_key)];
    if (keyed.some((value) => lockPaths.has(value))) continue;
    const detached = Boolean(db.prepare("SELECT 1 FROM installation_migration_records WHERE kind = 'snapshot' AND record_id = ?").get(`detached:${id}`));
    add("STORE-LEFTOVER-007", id, false,
      `The ${text(operation.status)} operation ${text(operation.operation)} in ${rootPath} has no lock and no running owner. No fixed rule applies.`,
      detached && text(operation.operation).startsWith("project.layout")
        ? `Run make-docs project layout verify ${shellQuote(id)} --target-root ${shellQuote(rootPath)}.`
        : `Run make-docs project state status --target-root ${shellQuote(rootPath)} and use its recovery action.`);
  }
  return leftovers;
}

/* ------------------------------------------------------------------------ */
/* Reports                                                                  */
/* ------------------------------------------------------------------------ */

const LIST_LIMIT = 50;

export interface StoreMaintenanceRowEntry {
  key: string;
  bytes: number;
  reason: string | null;
}

export interface StoreMaintenanceRuleReport {
  id: StoreFixedRuleId;
  title: string;
  state: "active" | "inactive";
  meaning: string;
  /** Rows the rule removes or trims in a clean. */
  act: { rows: number; bytes: number; entries: StoreMaintenanceRowEntry[]; more: number };
  kept: number;
  skipped: { rows: number; entries: StoreMaintenanceRowEntry[]; more: number };
}

export interface StoreStateReport {
  databasePath: string;
  schemaVersion: number;
  /** Bytes of store.db and its write-ahead log. */
  sizeBytes: number;
  /** True when every table has its guard triggers (R-WRITE-GUARD-4). */
  guardIntact: boolean;
  guardProblems: string[];
  unguardableTables: StoreUnguardableTable[];
  brokenReferences: StoreBrokenReference[];
  unclassifiedRecords: number;
}

export interface StoreCheckReport {
  schemaVersion: 1;
  kind: "store-check";
  catalog: { id: string; digest: string };
  checkedAt: string;
  changedNothing: true;
  summary: string;
  store: StoreStateReport;
  totals: { actRows: number; actBytes: number; skippedRows: number; decisions: number; leftovers: number };
  /** Rows of STORE-RULE-003, 004, and 005 that wait for the retention window, or null. */
  waiting: StoreRetentionWaiting | null;
  rules: StoreMaintenanceRuleReport[];
  decisions: StoreMaintenanceDecision[];
  leftovers: StoreMaintenanceLeftover[];
  /**
   * W35 R0 P5 (PRD 38 R-HOOK-STATE-6): each git hook record of the Store. A record is kept, and no fixed rule
   * removes it. `setup remove` in the last bound checkout of the clone removes it with its blocks.
   */
  gitHookRecords: StoreGitHookRecordReport[];
  notes: string[];
  nextAction: string;
}

export interface StoreGitHookRecordReport {
  /** The row ID in `tool_operations`. */
  key: string;
  /** The shared git folder of the clone that owns the blocks. */
  gitCommonDir: string;
  hooks: string[];
  /** How many checkouts selected the hooks. */
  checkouts: number;
  /** False when the git folder of the record is gone, so the record is left behind. */
  gitFolderExists: boolean;
  nextAction: string;
}

function gitHookRecordReports(db: StoreDatabase): StoreGitHookRecordReport[] {
  return listGitHookRecords(db).map(({ key, record }) => {
    const gitFolderExists = existsSync(record.gitCommonDir);
    return {
      key,
      gitCommonDir: record.gitCommonDir,
      hooks: Object.keys(record.hooks).sort(),
      checkouts: record.checkouts.length,
      gitFolderExists,
      nextAction: gitFolderExists
        ? "To remove the blocks and this record, run make-docs setup remove in each checkout of that clone that selected the hooks."
        : "The git folder of this record is not there now. When the clone moved, run make-docs setup --git-hooks in the clone at its new path: with that input setup moves this record there. When the folder comes back, the record is its record again. When the clone was deleted, the record is left behind and blocks nothing.",
    };
  });
}

function entry(row: StoreMaintenanceRowResult): StoreMaintenanceRowEntry {
  return { key: row.key, bytes: row.bytes, reason: row.afterRule005 ? "After STORE-RULE-005 removes this operation's plan and write intents in the same clean." : row.reason };
}

export function ruleReports(evaluations: readonly StoreMaintenanceRuleEvaluation[]): StoreMaintenanceRuleReport[] {
  return evaluations.map((evaluation) => {
    const act = evaluation.rows.filter((row) => row.outcome === "act");
    const skipped = evaluation.rows.filter((row) => row.outcome === "skip");
    return {
      id: evaluation.rule.id,
      title: evaluation.rule.title,
      state: evaluation.active ? "active" : "inactive",
      meaning: evaluation.rule.humanMeaning,
      act: { rows: act.length, bytes: act.reduce((sum, row) => sum + row.bytes, 0), entries: act.slice(0, LIST_LIMIT).map(entry), more: Math.max(0, act.length - LIST_LIMIT) },
      kept: evaluation.rows.filter((row) => row.outcome === "keep").length,
      skipped: { rows: skipped.length, entries: skipped.slice(0, LIST_LIMIT).map(entry), more: Math.max(0, skipped.length - LIST_LIMIT) },
    };
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}

function fileSize(file: string): number {
  try {
    return statSync(file).size;
  } catch {
    return 0;
  }
}

function storeFileBytes(databasePath: string): number {
  return fileSize(databasePath) + fileSize(`${databasePath}-wal`);
}

function countUnclassifiedRecords(db: StoreDatabase): number {
  const rows = db.prepare("SELECT kind, record_id, record_json FROM installation_migration_records").all() as Row[];
  return rows.filter((row) => classifyMigrationRecord(text(row.kind), text(row.record_id), text(row.record_json)) === null).length;
}

function readStoreState(db: StoreDatabase, databasePath: string, guardProblems: string[]): StoreStateReport {
  return {
    databasePath,
    schemaVersion: readUserVersion(db),
    sizeBytes: storeFileBytes(databasePath),
    guardIntact: guardProblems.length === 0,
    guardProblems,
    unguardableTables: listUnguardableStoreTables(db),
    brokenReferences: inspectStoreBrokenReferences(db),
    unclassifiedRecords: countUnclassifiedRecords(db),
  };
}

export class StoreMaintenanceStateError extends Error {
  constructor(
    readonly code: "store-absent" | "store-legacy" | "store-unsafe" | "store-changed-outside" | "store-changing" | "store-busy" | "confirmation-required",
    message: string,
    readonly nextAction: string,
    readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "StoreMaintenanceStateError";
  }
}

/** Classify the Store for maintenance. A Store changed outside Make Docs is allowed only for `check`. */
function assertMaintainableStore(storeRoot: string, mode: "check" | "clean"): { changedOutside: string | null } {
  const classification = classifyStoreCheckpoint9State(storeRoot);
  const databasePath = getStoreDatabasePath(storeRoot);
  if (classification.state === "supported-current") return { changedOutside: null };
  if (classification.state === "absent") {
    throw new StoreMaintenanceStateError("store-absent", `The Store at ${databasePath} does not exist. Nothing was ${mode === "check" ? "checked" : "changed"}.`, "Run make-docs setup first.");
  }
  if (classification.state === "supported-legacy") {
    throw new StoreMaintenanceStateError("store-legacy", `The Store at ${databasePath} uses schema ${classification.schemaVersion}. Store maintenance needs schema ${CURRENT_STORE_SCHEMA_VERSION}. Nothing was changed.`, "Run make-docs setup to convert the Store, then run this command again.", { schemaVersion: classification.schemaVersion });
  }
  if (classification.state === "unknown" && classification.issue?.code === "changed-outside") {
    if (mode === "check") return { changedOutside: classification.reason };
    throw new StoreMaintenanceStateError("store-changed-outside", `The Store at ${databasePath} was changed outside Make Docs: ${classification.reason} Clean changed nothing.`, "Run make-docs setup store check to review it, and restore the newest Store backup or repair the Store before you clean it.");
  }
  throw new StoreMaintenanceStateError("store-unsafe", `The Store at ${databasePath} cannot be used safely: ${classification.reason} Nothing was changed.`, "Run make-docs project state status and review the Store state.", { state: classification.state });
}

function checkNotes(state: StoreStateReport): string[] {
  const notes: string[] = [];
  if (!state.guardIntact) notes.push(`The Store was changed outside Make Docs: ${state.guardProblems.join(" ")} Check read it without writing. Clean refuses until the Store is restored from a backup or repaired.`);
  if (state.unguardableTables.length > 0) notes.push(`SQLite cannot guard ${state.unguardableTables.map((table) => `${table.kind} table ${table.table}`).join(", ")}. No Make Docs data lives there. Maintenance never changes it.`);
  if (state.brokenReferences.length > 0) notes.push(`${state.brokenReferences.map((reference) => `${plural(reference.count, "row")} in ${reference.table} point to a missing ${reference.parent} row`).join("; ")}. These rows were broken before this check. Make Docs keeps them, and no fixed rule removes them. Do not delete Store rows by hand. Restore the newest Store backup if you need the missing rows.`);
  if (state.unclassifiedRecords > 0) notes.push(`${plural(state.unclassifiedRecords, "migration record")} match no record family in the table catalog. Maintenance keeps them.`);
  return notes;
}

function buildCheckReport(db: StoreDatabase, databasePath: string, guardProblems: string[], env: StoreMaintenanceEnvironment): { report: StoreCheckReport; evaluations: StoreMaintenanceRuleEvaluation[] } {
  const evaluations = evaluateStoreRules(db, env, { simulateRule005: true });
  const rules = ruleReports(evaluations);
  const decisions = evaluateStoreDecisions(db, env);
  const leftovers = findStoreBlockingLeftovers(db, env, evaluations);
  const store = readStoreState(db, databasePath, guardProblems);
  const actRows = rules.reduce((sum, rule) => sum + rule.act.rows, 0);
  const actBytes = rules.reduce((sum, rule) => sum + rule.act.bytes, 0);
  const skippedRows = rules.reduce((sum, rule) => sum + rule.skipped.rows, 0);
  const actingRules = rules.filter((rule) => rule.act.rows > 0).length;
  const waiting = findRetentionWaiting(db, env, evaluations);
  const summary = [
    actRows > 0
      ? `Clean would remove or trim ${plural(actRows, "row")} (about ${formatBytes(actBytes)}) under ${plural(actingRules, "rule")}.`
      : "Clean would remove nothing.",
    waiting ? describeRetentionWaiting(waiting, actRows > 0) : null,
    skippedRows > 0 ? `${plural(skippedRows, "row")} ${skippedRows === 1 ? "is" : "are"} skipped, each with its reason.` : null,
    decisions.length > 0 ? `${plural(decisions.length, "item")} ${decisions.length === 1 ? "needs" : "need"} your decision.` : "Nothing needs your decision.",
    leftovers.length > 0 ? `${plural(leftovers.length, "crash leftover")} ${leftovers.length === 1 ? "blocks" : "block"} this computer.` : "No crash leftover blocks this computer.",
    store.guardIntact ? null : "The Store was changed outside Make Docs.",
    "Nothing was changed.",
  ].filter(Boolean).join(" ");
  const nextAction = !store.guardIntact
    ? "Do not write the Store. Restore the newest Store backup or repair the Store, then run make-docs setup store check again."
    : actRows > 0
      ? "Run make-docs setup store clean to back up the Store and remove these rows."
      : leftovers.length > 0 || decisions.length > 0
        ? "Review each item above and use its next step."
        : waiting
          ? `Run make-docs setup store check again on or after ${waiting.firstDate}.`
          : "Nothing to do.";
  const report: StoreCheckReport = {
    schemaVersion: 1,
    kind: "store-check",
    catalog: { id: STORE_TABLE_CATALOG_ID, digest: storeTableCatalogDigest() },
    checkedAt: env.now.toISOString(),
    changedNothing: true,
    summary,
    store,
    totals: { actRows, actBytes, skippedRows, decisions: decisions.length, leftovers: leftovers.length },
    waiting,
    rules,
    decisions,
    leftovers,
    gitHookRecords: gitHookRecordReports(db),
    notes: checkNotes(store),
    nextAction,
  };
  return { report, evaluations };
}

/**
 * `setup store check`: read only. It opens the Store on a read-only
 * connection with the guard check off, so a Store that was changed outside
 * Make Docs can still be reported (R-WRITE-GUARD-4).
 */
export function checkStore(storeRoot: string, env: StoreMaintenanceEnvironment): StoreCheckReport {
  assertMaintainableStore(storeRoot, "check");
  const databasePath = getStoreDatabasePath(storeRoot);
  const { db, guardProblems } = openStoreForReview(databasePath, "check Store");
  try {
    return buildCheckReport(db, databasePath, guardProblems, env).report;
  } finally {
    db.close();
  }
}

/* ------------------------------------------------------------------------ */
/* Backups                                                                  */
/* ------------------------------------------------------------------------ */

export const STORE_CLEAN_BACKUP_DIRECTORY = "backup";
const PARTIAL_BACKUP_PATTERN = STORE_CLEAN_PARTIAL_BACKUP_PATTERN;
const PARTIAL_BACKUP_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** The Store backup folder, `<store>/backup/` (`~/.make-docs/backup/` by default). */
export function storeCleanBackupDirectory(storeRoot: string): string {
  return path.join(path.resolve(storeRoot), STORE_CLEAN_BACKUP_DIRECTORY);
}

/**
 * Verified clean backups, newest first. A file counts only when its name is a
 * finished clean backup (`store-clean-*.db`) and it verifies as a Store, so a
 * partial, empty, or stray file never takes a kept slot. Other files in the
 * folder are never listed or removed.
 */
export function listStoreCleanBackups(storeRoot: string): string[] {
  const directory = storeCleanBackupDirectory(storeRoot);
  let names: string[];
  try {
    names = readdirSync(directory);
  } catch {
    return [];
  }
  return names
    .filter((name) => STORE_CLEAN_BACKUP_PATTERN.test(name) && isVerifiedStoreBackupFile(path.join(directory, name)))
    .sort((left, right) => right.localeCompare(left))
    .map((name) => path.join(directory, name));
}

/** Remove partial backups that a crashed clean left more than a day ago. A running clean's partial file is younger. */
function sweepPartialBackups(directory: string, now: number): void {
  let names: string[];
  try { names = readdirSync(directory); } catch { return; }
  for (const name of names) {
    if (!PARTIAL_BACKUP_PATTERN.test(name)) continue;
    const file = path.join(directory, name);
    try {
      const stat = lstatSync(file);
      if (stat.isFile() && now - stat.mtimeMs > PARTIAL_BACKUP_MAX_AGE_MS) unlinkSync(file);
    } catch {
      // A partial file that cannot be read or removed is never a backup. It stays for review.
    }
  }
}

function backupName(now: Date): string {
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(".", "");
  return `store-clean-${stamp}-${randomBytes(4).toString("hex")}.db`;
}

function verifyBackup(backupPath: string, schemaVersion: number): void {
  const { db, guardProblems } = openStoreForReview(backupPath, "verify Store backup");
  try {
    const check = db.prepare("PRAGMA quick_check").get() as { quick_check?: string } | undefined;
    if (check?.quick_check !== "ok" || readUserVersion(db) !== schemaVersion || guardProblems.length > 0) {
      throw new Error(`The Store backup ${backupPath} did not verify.`);
    }
  } finally {
    db.close();
  }
}

function dataVersion(db: StoreDatabase): number {
  return Number((db.prepare("PRAGMA data_version").get() as { data_version: number | bigint }).data_version);
}

/** Keep the three newest clean backups (R-MAINT-5). Returns the removed paths. */
export function rotateStoreCleanBackups(storeRoot: string, keep = STORE_MAINTENANCE_SETTINGS.storeBackupKeptCount.value): string[] {
  const removed: string[] = [];
  for (const file of listStoreCleanBackups(storeRoot).slice(keep)) {
    try {
      unlinkSync(file);
      removed.push(file);
    } catch {
      // A backup that cannot be removed stays. The next clean tries again.
    }
  }
  return removed;
}

export function storeRestoreSteps(databasePath: string, backupPath: string): string[] {
  return [
    "Stop every Make Docs command and MCP server on this computer.",
    `Copy ${backupPath} over ${databasePath}.`,
    `Delete ${databasePath}-wal and ${databasePath}-shm if they exist.`,
    "Run make-docs project state status in a project to check the Store.",
  ];
}

/* ------------------------------------------------------------------------ */
/* Clean                                                                    */
/* ------------------------------------------------------------------------ */

export interface StoreCleanRuleResult {
  id: StoreFixedRuleId;
  title: string;
  state: "active" | "inactive";
  /** Rows removed, or trimmed for STORE-RULE-003 and 004, or marked failed for 002. */
  changed: number;
  bytes: number;
  /** Rows that a rule skipped with a reason, including rows that changed after the check. */
  skipped: { rows: number; entries: StoreMaintenanceRowEntry[]; more: number };
}

export interface StoreCleanReport {
  schemaVersion: 1;
  kind: "store-clean";
  catalog: { id: string; digest: string };
  cleanedAt: string;
  dryRun: boolean;
  summary: string;
  databasePath: string;
  rules: StoreCleanRuleResult[];
  totals: { changedRows: number; rowBytes: number; skippedRows: number };
  space: { beforeBytes: number; afterBytes: number; freedBytes: number; vacuumed: boolean; vacuumError: string | null };
  backup: { path: string; removedOldBackups: string[]; kept: string[] } | null;
  restore: string[];
  /** The check of the same Store before the clean. */
  check: StoreCheckReport;
  nextAction: string;
}

/** The compare-and-change statement of one rule (STORE_RULE_WRITE_CONTRACT). Returns the rows it changed. */
function applyRow(db: StoreDatabase, env: StoreMaintenanceEnvironment, row: StoreMaintenanceRowResult): number {
  const r = row.row;
  const v = (column: string) => r[column] ?? null;
  switch (row.rule) {
    case "STORE-RULE-001": {
      const rootPath = text(v("root_path"));
      const key = env.comparisonKey(rootPath);
      return Number(db.prepare(
        `DELETE FROM installation_locks
          WHERE root_path = ? AND token = ? AND pid IS ? AND hostname IS ?
            AND NOT EXISTS (SELECT 1 FROM installation_operations o JOIN installation_checkouts c ON c.checkout_id = o.checkout_id
                             WHERE o.status IN ('pending','failed')
                               AND (c.root_path = ? OR c.root_path_key = ? OR c.root_path_key = ? OR c.root_path_key = lower(?)))`,
      ).run(rootPath, v("token"), v("pid"), v("hostname"), rootPath, rootPath, key, rootPath).changes);
    }
    case "STORE-RULE-002": {
      let metadata: Record<string, unknown> = {};
      try { metadata = JSON.parse(text(v("metadata_json"))) as Record<string, unknown>; } catch { return 0; }
      const merged = JSON.stringify({ ...metadata, outcome: "abandoned", reason: "abandoned", changeOutcome: "unknown" });
      return Number(db.prepare(
        `UPDATE tool_operations SET status = 'failed', finished_at = ?, metadata_json = ?
          WHERE operation_id = ? AND operation = ? AND status = 'pending' AND pid IS ? AND hostname IS ? AND metadata_json IS ?`,
      ).run(env.now.toISOString(), merged, v("operation_id"), v("operation"), v("pid"), v("hostname"), v("metadata_json")).changes);
    }
    case "STORE-RULE-003":
      return Number(db.prepare(
        `UPDATE installation_steps SET before_json = ?, after_json = ?
          WHERE operation_id = ? AND ordinal = ? AND before_json IS ? AND after_json IS ?
            AND EXISTS (SELECT 1 FROM installation_operations o WHERE o.operation_id = ? AND o.status = ? AND o.finished_at IS ?)`,
      ).run(stripSavedBytes(v("before_json")), stripSavedBytes(v("after_json")), v("operation_id"), v("ordinal"), v("before_json"), v("after_json"), v("operation_id"), v("operation_status"), v("operation_finished_at")).changes);
    case "STORE-RULE-004": {
      const before = fullLedger(v("before_ledger")) ? null : v("before_ledger");
      const after = fullLedger(v("after_ledger")) ? null : v("after_ledger");
      return Number(db.prepare(
        `UPDATE installation_operations SET before_ledger = ?, after_ledger = ?
          WHERE operation_id = ? AND status = ? AND finished_at IS ? AND before_ledger IS ? AND after_ledger IS ?
            AND before_ledger_digest IS ? AND after_ledger_digest IS ? AND step_count IS NOT NULL AND applied_step_count IS NOT NULL`,
      ).run(before, after, v("operation_id"), v("status"), v("finished_at"), v("before_ledger"), v("after_ledger"), v("before_ledger_digest"), v("after_ledger_digest")).changes);
    }
    case "STORE-RULE-005":
      return Number(db.prepare(
        `DELETE FROM installation_migration_records
          WHERE checkout_id = ? AND kind = ? AND record_id = ?
            AND EXISTS (SELECT 1 FROM installation_operations o WHERE o.operation_id = ? AND o.checkout_id = ? AND o.status = ? AND o.finished_at IS ?)`,
      ).run(v("checkout_id"), v("kind"), v("record_id"), v("operation_id"), v("checkout_id"), v("operation_status"), v("operation_finished_at")).changes);
    case "STORE-RULE-006":
      return Number(db.prepare(
        `DELETE FROM installation_migration_records
          WHERE checkout_id = ? AND kind = 'quiescence' AND record_id = ? AND record_json IS ?
            AND NOT EXISTS (SELECT 1 FROM installation_operations o WHERE o.checkout_id = ? AND o.status IN ('pending','failed'))
            AND NOT EXISTS (SELECT 1 FROM installation_migration_records i WHERE i.checkout_id = ? AND i.kind = 'legacy-import')`,
      ).run(v("checkout_id"), v("record_id"), v("record_json"), v("checkout_id"), v("checkout_id")).changes);
    case "STORE-RULE-007":
      return Number(db.prepare(
        "DELETE FROM store_checkpoint_journal WHERE receipt_id = ? AND EXISTS (SELECT 1 FROM store_migration_receipts m WHERE m.receipt_id = ?)",
      ).run(v("receipt_id"), v("receipt_id")).changes);
    case "STORE-RULE-008":
      return Number(db.prepare(
        `DELETE FROM backlog_review_cache
          WHERE checkout_id = ? AND record_path = ? AND record_digest = ? AND snapshot_schema_version = ? AND rule_catalog_version = ? AND skill_version = ?`,
      ).run(v("checkout_id"), v("record_path"), v("record_digest"), v("snapshot_schema_version"), v("rule_catalog_version"), v("skill_version")).changes);
    case "STORE-RULE-009":
      if (row.query === 0) {
        return Number(db.prepare(
          `DELETE FROM tool_operations
            WHERE operation_id = ? AND metadata_json IS ? AND status = 'completed'
              AND operation IN ('setup.system.receipt', 'setup.system.receipt-observation')
              AND (CASE WHEN json_valid(metadata_json) THEN json_extract(metadata_json, '$.operationId') END) IS ?
              AND NOT EXISTS (SELECT 1 FROM tool_operations c WHERE c.status = 'completed' AND c.operation = 'setup.system.receipt-current'
                               AND (CASE WHEN json_valid(c.metadata_json) THEN json_extract(c.metadata_json, '$.operationId') END) = ?)
              AND NOT EXISTS (SELECT 1 FROM tool_operations p WHERE p.status = 'pending' AND p.operation = 'setup.system.harness'
                               AND (NOT json_valid(p.metadata_json) OR (CASE WHEN json_valid(p.metadata_json) THEN json_extract(p.metadata_json, '$.ownershipReceipt.operationId') END) = ?))`,
        ).run(v("operation_id"), v("metadata_json"), v("receipt_operation_id"), v("receipt_operation_id"), v("receipt_operation_id")).changes);
      }
      return Number(db.prepare(
        `DELETE FROM installation_migration_records
          WHERE checkout_id = ? AND kind = ? AND record_id = ? AND record_json IS ?
            AND (CASE WHEN json_valid(record_json) THEN json_extract(record_json, '$.operationId') END) IS ?
            AND NOT EXISTS (SELECT 1 FROM installation_migration_records c WHERE c.checkout_id = ? AND c.kind = 'receipt'
                             AND substr(c.record_id, 1, 24) = 'harness-receipt-current:'
                             AND (CASE WHEN json_valid(c.record_json) THEN json_extract(c.record_json, '$.operationId') END) = ?)`,
      ).run(v("checkout_id"), v("kind"), v("record_id"), v("record_json"), v("receipt_operation_id"), v("checkout_id"), v("receipt_operation_id")).changes);
  }
}

/** The recheck columns of a row, as one comparable string. */
function recheckSignature(row: StoreMaintenanceRowResult): string {
  const rule = ruleById.get(row.rule)!;
  const columns = rule.recheck.columnsByQuery[row.query] ?? [];
  return JSON.stringify(columns.map((column) => {
    const value = row.row[column];
    return value instanceof Uint8Array ? Buffer.from(value).toString("base64") : typeof value === "bigint" ? value.toString() : value ?? null;
  }));
}

interface CleanRuleProgress {
  changed: number;
  bytes: number;
  skipped: StoreMaintenanceRowResult[];
}

/**
 * Apply every active rule inside one BEGIN IMMEDIATE transaction
 * (STORE_RULE_WRITE_CONTRACT). For each rule, its candidate query and proofs
 * run again; a planned row is changed only when its recheck values and its
 * outcome are the same as in the check, by a statement whose WHERE clause
 * names them. Anything else is skipped as changed after the check.
 */
function applyRulesInTransaction(db: StoreDatabase, env: StoreMaintenanceEnvironment, plan: readonly StoreMaintenanceRuleEvaluation[]): Map<StoreFixedRuleId, CleanRuleProgress> {
  const progress = new Map<StoreFixedRuleId, CleanRuleProgress>();
  const planned = new Map(plan.map((evaluation) => [evaluation.rule.id, evaluation]));
  const ctx: EvaluationContext = { db, env, parameters: storeMaintenanceSqlParameters(env.now, env.versions), rule005Removals: null, processes: undefined };
  for (const id of STORE_RULE_APPLY_ORDER) {
    const evaluation = planned.get(id)!;
    const result: CleanRuleProgress = { changed: 0, bytes: 0, skipped: evaluation.rows.filter((row) => row.outcome === "skip") };
    progress.set(id, result);
    const acting = evaluation.rows.filter((row) => row.outcome === "act");
    if (!evaluation.active || acting.length === 0) continue;
    const recheck = new Map(evaluateRule(evaluation.rule, ctx).rows.map((row) => [`${row.query}\u0000${row.key}`, row]));
    for (const row of acting) {
      const now = recheck.get(`${row.query}\u0000${row.key}`);
      const changedAfterCheck = (why: string) => result.skipped.push({ ...row, outcome: "skip", reason: `It changed after the check: ${why} The row stays. Run make-docs setup store check again.` });
      if (!now) { changedAfterCheck("the rule no longer finds it."); continue; }
      if (now.outcome !== "act") { changedAfterCheck(now.reason ?? "its proof no longer passes."); continue; }
      if (recheckSignature(now) !== recheckSignature(row)) { changedAfterCheck("its checked values differ."); continue; }
      let changes = 0;
      try {
        changes = applyRow(db, env, now);
      } catch (error) {
        changedAfterCheck(`the change failed (${error instanceof Error ? error.message : String(error)}).`);
        continue;
      }
      if (changes !== 1) { changedAfterCheck("the compare-and-change statement matched no row."); continue; }
      result.changed++;
      result.bytes += now.bytes;
    }
  }
  return progress;
}

const MAX_BACKUP_ATTEMPTS = 3;

/**
 * `setup store clean`: back up the Store, change only what the active rules
 * prove in one transaction, rotate backups, vacuum, and report.
 * With `dryRun`, it reports the plan and writes nothing.
 */
export interface StoreCleanTestHooks {
  /** Runs on the clean connection after the check and before the backup. */
  afterPlan?(db: StoreDatabase): void;
  /** Runs after `VACUUM INTO` wrote the partial backup and before it is verified. */
  afterVacuumInto?(partialPath: string): void;
  /** Runs after each verified backup and before the write lock. */
  afterBackup?(attempt: number): void;
  /** Runs on the clean connection inside the write transaction, before its schema check. */
  afterLock?(db: StoreDatabase): void;
  /** Replaces the busy timeout of the clean connection, in milliseconds. */
  busyTimeoutMs?: number;
}

export function cleanStore(storeRoot: string, env: StoreMaintenanceEnvironment, options: { dryRun?: boolean; testHooks?: StoreCleanTestHooks } = {}): StoreCleanReport {
  assertMaintainableStore(storeRoot, "clean");
  const databasePath = getStoreDatabasePath(storeRoot);
  const db = openStoreSqliteConnection(databasePath, {}, "clean Store");
  try {
    const { report: check, evaluations: plan } = buildCheckReport(db, databasePath, [], env);
    const planned = plan.reduce((sum, evaluation) => sum + evaluation.rows.filter((row) => row.outcome === "act").length, 0);
    const beforeBytes = storeFileBytes(databasePath);
    const base = {
      schemaVersion: 1 as const,
      kind: "store-clean" as const,
      catalog: check.catalog,
      cleanedAt: env.now.toISOString(),
      databasePath,
      check,
    };
    const planOnly = (summary: string, nextAction: string): StoreCleanReport => ({
      ...base,
      dryRun: Boolean(options.dryRun),
      summary,
      rules: plan.map((evaluation) => {
        const report = ruleReports([evaluation])[0]!;
        return { id: report.id, title: report.title, state: report.state, changed: 0, bytes: 0, skipped: report.skipped };
      }),
      totals: { changedRows: 0, rowBytes: 0, skippedRows: check.totals.skippedRows },
      space: { beforeBytes, afterBytes: beforeBytes, freedBytes: 0, vacuumed: false, vacuumError: null },
      backup: null,
      restore: [],
      nextAction,
    });
    if (options.dryRun) {
      return planOnly(`Dry run. ${check.summary}`, planned > 0 ? "Run make-docs setup store clean without --dry-run to back up the Store and remove these rows." : check.nextAction);
    }
    if (planned === 0) {
      return planOnly(`Clean removed nothing: no fixed rule proves a row now.${check.waiting ? ` ${describeRetentionWaiting(check.waiting, false)}` : ""} No backup was made, and the Store did not change.`, check.nextAction);
    }

    options.testHooks?.afterPlan?.(db);
    const schemaVersion = readUserVersion(db);
    const directory = storeCleanBackupDirectory(storeRoot);
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    const required = BigInt(Math.max(beforeBytes * 2, 1_048_576));
    const available = platform.availableBytes(directory);
    if (available < required) {
      throw new StoreMaintenanceStateError("store-unsafe", `Clean needs at least ${required} free bytes for a verified Store backup in ${directory}, but only ${available} are free. Nothing was changed.`, "Free disk space, then run make-docs setup store clean again.");
    }
    sweepPartialBackups(directory, Date.now());
    if (options.testHooks?.busyTimeoutMs !== undefined) db.exec(`PRAGMA busy_timeout = ${Math.max(0, Math.floor(options.testHooks.busyTimeoutMs))}`);
    // The backup is written and checked under a partial name. It gets its
    // `store-clean-*.db` name only after it verified and the clean committed,
    // and it is deleted on every failure, so a failed clean never takes a kept slot.
    let partialPath: string | null = null;
    let backupPath: string | null = null;
    let progress: Map<StoreFixedRuleId, CleanRuleProgress> | null = null;
    const discardPartial = () => {
      if (partialPath) rmSync(partialPath, { force: true });
      partialPath = null;
    };
    try {
      for (let attempt = 0; attempt < MAX_BACKUP_ATTEMPTS && !progress; attempt++) {
        const versionBefore = dataVersion(db);
        const name = backupName(env.now);
        partialPath = path.join(directory, `.${name}.partial`);
        db.exec(`VACUUM INTO '${partialPath.replaceAll("'", "''")}'`);
        applyStoreFileMode(partialPath);
        options.testHooks?.afterVacuumInto?.(partialPath);
        verifyBackup(partialPath, schemaVersion);
        options.testHooks?.afterBackup?.(attempt);
        try {
          db.exec("BEGIN IMMEDIATE");
        } catch (error) {
          if (!isSqliteContention(error)) throw error;
          throw new StoreMaintenanceStateError(
            "store-busy",
            "Another Make Docs command is writing the Store, so clean waited and then stopped. Clean changed nothing.",
            "Wait for the other Make Docs command to finish, then run make-docs setup store clean again.",
            { retryable: true },
          );
        }
        if (dataVersion(db) !== versionBefore) {
          // Another Make Docs command committed between the backup and the lock. Take the backup again so it is the exact start state.
          db.exec("ROLLBACK");
          discardPartial();
          continue;
        }
        try {
          options.testHooks?.afterLock?.(db);
          const version = readUserVersion(db);
          if (version !== CURRENT_STORE_SCHEMA_VERSION) {
            throw new StoreMaintenanceStateError("store-unsafe", `The Store schema is ${version} inside the clean transaction, not ${CURRENT_STORE_SCHEMA_VERSION}. Clean changed nothing.`, "Run make-docs project state status and review the Store state.", { schemaVersion: version });
          }
          const guardProblems = inspectStoreWriteGuard(db);
          if (guardProblems.length > 0) {
            throw new StoreMaintenanceStateError("store-changed-outside", `The Store was changed outside Make Docs during the clean: ${guardProblems.join(" ")} Clean changed nothing.`, "Run make-docs setup store check to review it, and restore the newest Store backup or repair the Store before you clean it.");
          }
          progress = applyRulesInTransaction(db, env, plan);
          db.exec("COMMIT");
        } catch (error) {
          try { db.exec("ROLLBACK"); } catch { /* the transaction already ended */ }
          throw error;
        }
        const finalPath = path.join(directory, name);
        const verified = partialPath;
        partialPath = null;
        try {
          renameSync(verified, finalPath);
        } catch (error) {
          // The rows already changed. Keep the verified backup under its partial name and say where it is.
          throw new StoreMaintenanceStateError("store-unsafe", `Clean changed the Store, but it could not name its verified backup (${error instanceof Error ? error.message : String(error)}). The backup is ${verified}.`, `Rename ${verified} to ${finalPath} before you run another clean.`, { backupPath: verified });
        }
        backupPath = finalPath;
      }
    } catch (error) {
      discardPartial();
      throw error;
    }
    if (!progress || !backupPath) {
      discardPartial();
      throw new StoreMaintenanceStateError("store-changing", "Other Make Docs commands kept changing the Store during the backup. Clean changed nothing.", "Wait for other Make Docs commands to finish, then run make-docs setup store clean again.", { retryable: true });
    }
    const removedOldBackups = rotateStoreCleanBackups(storeRoot);
    let vacuumed = false;
    let vacuumError: string | null = null;
    try {
      db.exec("VACUUM");
      db.exec("PRAGMA wal_checkpoint(TRUNCATE)");
      vacuumed = true;
    } catch (error) {
      vacuumError = error instanceof Error ? error.message : String(error);
    }
    const afterBytes = storeFileBytes(databasePath);
    const rules: StoreCleanRuleResult[] = STORE_FIXED_RULES.map((rule) => {
      const done = progress!.get(rule.id)!;
      return {
        id: rule.id,
        title: rule.title,
        state: isRuleActive(rule, env) ? "active" : "inactive",
        changed: done.changed,
        bytes: done.bytes,
        skipped: { rows: done.skipped.length, entries: done.skipped.slice(0, LIST_LIMIT).map(entry), more: Math.max(0, done.skipped.length - LIST_LIMIT) },
      };
    });
    const changedRows = rules.reduce((sum, rule) => sum + rule.changed, 0);
    const rowBytes = rules.reduce((sum, rule) => sum + rule.bytes, 0);
    const skippedRows = rules.reduce((sum, rule) => sum + rule.skipped.rows, 0);
    const freedBytes = Math.max(0, beforeBytes - afterBytes);
    return {
      ...base,
      dryRun: false,
      summary: [
        `Clean removed or trimmed ${plural(changedRows, "row")} (about ${formatBytes(rowBytes)} of row data) under ${plural(rules.filter((rule) => rule.changed > 0).length, "rule")}.`,
        vacuumed ? `The Store file shrank by ${formatBytes(freedBytes)}.` : `The vacuum did not run, so the file did not shrink yet: ${vacuumError}`,
        skippedRows > 0 ? `${plural(skippedRows, "row")} ${skippedRows === 1 ? "was" : "were"} skipped, each with its reason.` : null,
        `The backup is ${backupPath}.`,
      ].filter(Boolean).join(" "),
      rules,
      totals: { changedRows, rowBytes, skippedRows },
      space: { beforeBytes, afterBytes, freedBytes, vacuumed, vacuumError },
      backup: { path: backupPath, removedOldBackups, kept: listStoreCleanBackups(storeRoot) },
      restore: storeRestoreSteps(databasePath, backupPath),
      nextAction: check.decisions.length > 0 || check.leftovers.some((leftover) => !leftover.clearedByClean)
        ? "Run make-docs setup store check to review the items that need your decision."
        : "Nothing else to do.",
    };
  } finally {
    db.close();
  }
}
