/**
 * W30 R0 P2 factory tables (PRD 53 R-FACTORY-15, R-FACTORY-23, R-FACTORY-27,
 * R-FACTORY-56 to R-FACTORY-58; PRD 38 R-DB-7).
 *
 * Schema v9 adds eight tables for the factory. This module holds their SQL
 * and the map from each physical column to its field phrase in the PRD 38
 * R-MIN register. It imports nothing from the Store, so `database.ts` can use
 * the statements in its migration list. The Store service that reads and
 * writes these tables is `factory-store.ts`.
 *
 * Machine tools and capability proofs belong to the machine and are shared by
 * every project on it (R-FACTORY-15), so they carry no project ID. Every other
 * table belongs to one project's workflow and carries the project ID from
 * `project_register`, never a path or a name (owner decision 2026-11-23). No table holds a claim ID, a prompt, a transcript, a
 * file's contents, an environment value, or a credential (R-FACTORY-26,
 * R-FACTORY-50).
 */

/** The Store schema version that creates the factory tables. */
export const FACTORY_STORE_SINCE_SCHEMA = 9;

export const FACTORY_STORE_TABLE_NAMES = [
  "factory_machine_tools",
  "factory_capability_proofs",
  "factory_workflow_plans",
  "factory_workflow_bindings",
  "factory_grants",
  "factory_assignments",
  "factory_proof_results",
  "factory_backups",
] as const;
export type FactoryStoreTableName = (typeof FACTORY_STORE_TABLE_NAMES)[number];

/** The two extra triggers of schema v9. They are not guard triggers: they refuse a change for every connection. */
export const FACTORY_PLAN_IMMUTABLE_TRIGGER = "factory_workflow_plans_never_change";
export const FACTORY_FINAL_ASSIGNMENT_TRIGGER = "factory_assignments_final_status";

const UTC_TIME_GLOB = "[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z";
const utcTime = (column: string) => `${column} GLOB '${UTC_TIME_GLOB}'`;
/** A lower-case kebab-case name of at most `max` characters (a second layer under the service's check). */
const kebab = (column: string, max = 64) =>
  `(length(${column}) BETWEEN 1 AND ${max} AND ${column} GLOB '[a-z]*' AND ${column} NOT GLOB '*[^a-z0-9-]*' AND ${column} NOT GLOB '*--*' AND ${column} NOT GLOB '*-')`;
/** One line of at most `max` characters. */
const oneLine = (column: string, max = 120) =>
  `(length(${column}) BETWEEN 1 AND ${max} AND instr(${column}, char(10)) = 0 AND instr(${column}, char(13)) = 0)`;
const hexDigest = (column: string) => `(length(${column}) = 64 AND ${column} NOT GLOB '*[^0-9a-f]*')`;
const storeId = (column: string, prefix: "fg-" | "fa-") =>
  `(length(${column}) BETWEEN 11 AND 67 AND substr(${column}, 1, 3) = '${prefix}' AND substr(${column}, 4) NOT GLOB '*[^a-z0-9]*')`;
const jsonArray = (column: string, maxItems: number, maxBytes = 16384) =>
  `(length(${column}) <= ${maxBytes} AND json_valid(${column}) AND json_type(${column}) = 'array' AND json_array_length(${column}) <= ${maxItems})`;
const jsonObject = (column: string, maxBytes: number) =>
  `(length(${column}) <= ${maxBytes} AND json_valid(${column}) AND json_type(${column}) = 'object')`;
const projectId = (column: string) => `(length(${column}) BETWEEN 1 AND 160)`;
const absolutePath = (column: string) => `(length(${column}) BETWEEN 2 AND 4096 AND instr(${column}, char(0)) = 0)`;

/**
 * The v9 statements. The foreign keys between a workflow's binding and its
 * plan revisions are deferred, so one transaction can write a binding and its
 * first revision in either order.
 */
export const FACTORY_STORE_V9_STATEMENTS: readonly string[] = Object.freeze([
  // One row for each tool on this machine, shared by every project (R-FACTORY-15).
  `CREATE TABLE factory_machine_tools (
    tool_id TEXT PRIMARY KEY CHECK ${kebab("tool_id")},
    tool_kind TEXT NOT NULL CHECK (tool_kind IN ('agent-harness','model-provider','terminal-multiplexer','mcp-server','scheduler','messaging-tool','other')),
    tool_label TEXT NOT NULL CHECK ${oneLine("tool_label")},
    state TEXT NOT NULL CHECK (state IN ('available','missing','blocked')),
    reported_version TEXT CHECK (reported_version IS NULL OR ${oneLine("reported_version", 64)}),
    capabilities_json TEXT NOT NULL CHECK ${jsonArray("capabilities_json", 64)},
    reported_at TEXT NOT NULL CHECK (${utcTime("reported_at")}),
    entry_version INTEGER NOT NULL CHECK (entry_version >= 1)
  )`,
  // One proof for each capability of each tool (R-FACTORY-10).
  `CREATE TABLE factory_capability_proofs (
    tool_id TEXT NOT NULL REFERENCES factory_machine_tools (tool_id) ON DELETE CASCADE,
    capability_id TEXT NOT NULL CHECK ${kebab("capability_id")},
    method TEXT NOT NULL CHECK ${oneLine("method")},
    tool_version TEXT CHECK (tool_version IS NULL OR ${oneLine("tool_version", 64)}),
    proved_at TEXT NOT NULL CHECK (${utcTime("proved_at")}),
    result TEXT NOT NULL CHECK (result IN ('proved','unproved','contradicted')),
    not_covered_json TEXT NOT NULL CHECK ${jsonArray("not_covered_json", 16)},
    PRIMARY KEY (tool_id, capability_id)
  )`,
  // Immutable resolved plan revisions (R-FACTORY-56, R-FACTORY-57). The unique
  // digest key means a save adds a revision only when no kept one has its digest.
  `CREATE TABLE factory_workflow_plans (
    project_id TEXT NOT NULL CHECK ${projectId("project_id")},
    workflow_name TEXT NOT NULL CHECK ${kebab("workflow_name")},
    revision INTEGER NOT NULL CHECK (revision >= 1),
    plan_digest TEXT NOT NULL CHECK ${hexDigest("plan_digest")},
    plan_json TEXT NOT NULL CHECK ${jsonObject("plan_json", 262144)},
    config_digest TEXT NOT NULL CHECK ${hexDigest("config_digest")},
    binding_digest TEXT NOT NULL CHECK ${hexDigest("binding_digest")},
    created_at TEXT NOT NULL CHECK (${utcTime("created_at")}),
    PRIMARY KEY (project_id, workflow_name, revision),
    UNIQUE (project_id, workflow_name, plan_digest),
    FOREIGN KEY (project_id, workflow_name) REFERENCES factory_workflow_bindings (project_id, workflow_name) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED
  )`,
  `CREATE TRIGGER ${FACTORY_PLAN_IMMUTABLE_TRIGGER} BEFORE UPDATE ON factory_workflow_plans BEGIN SELECT RAISE(ABORT, 'A saved factory plan revision never changes.'); END`,
  // The saved choices of one project workflow, with its human channel and wake bindings.
  `CREATE TABLE factory_workflow_bindings (
    project_id TEXT NOT NULL CHECK ${projectId("project_id")},
    workflow_name TEXT NOT NULL CHECK ${kebab("workflow_name")},
    roles_json TEXT NOT NULL CHECK ${jsonObject("roles_json", 16384)},
    worktree_method TEXT NOT NULL CHECK ${kebab("worktree_method")},
    channel_ref TEXT CHECK (channel_ref IS NULL OR ${oneLine("channel_ref")}),
    wake_method TEXT NOT NULL CHECK (wake_method IN ('schedule','event','person')),
    wake_ref TEXT CHECK (wake_ref IS NULL OR ${oneLine("wake_ref")}),
    known_losses_json TEXT NOT NULL CHECK ${jsonArray("known_losses_json", 32)},
    ready_revision INTEGER CHECK (ready_revision IS NULL OR ready_revision >= 1),
    readiness TEXT NOT NULL CHECK (readiness IN ('draft','wired','ready','drifted')),
    entry_version INTEGER NOT NULL CHECK (entry_version >= 1),
    PRIMARY KEY (project_id, workflow_name),
    FOREIGN KEY (project_id, workflow_name, ready_revision) REFERENCES factory_workflow_plans (project_id, workflow_name, revision) DEFERRABLE INITIALLY DEFERRED,
    CHECK (readiness <> 'ready' OR ready_revision IS NOT NULL)
  )`,
  // A person's permission for one action outside the default authority (R-FACTORY-24).
  `CREATE TABLE factory_grants (
    grant_id TEXT PRIMARY KEY CHECK ${storeId("grant_id", "fg-")},
    project_id TEXT NOT NULL,
    workflow_name TEXT NOT NULL,
    action TEXT NOT NULL CHECK ${kebab("action")},
    scope TEXT NOT NULL CHECK (scope IN ('once','run','standing')),
    run_id TEXT CHECK (run_id IS NULL OR length(run_id) BETWEEN 1 AND 160),
    expires_at TEXT CHECK (expires_at IS NULL OR ${utcTime("expires_at")}),
    spent_at TEXT CHECK (spent_at IS NULL OR ${utcTime("spent_at")}),
    granted_by TEXT NOT NULL CHECK ${oneLine("granted_by")},
    granted_at TEXT NOT NULL CHECK (${utcTime("granted_at")}),
    entry_version INTEGER NOT NULL CHECK (entry_version >= 1),
    FOREIGN KEY (project_id, workflow_name) REFERENCES factory_workflow_bindings (project_id, workflow_name) ON DELETE CASCADE,
    CHECK ((scope = 'run') = (run_id IS NOT NULL)),
    CHECK (spent_at IS NULL OR scope = 'once'),
    CHECK (expires_at IS NULL OR expires_at > granted_at)
  )`,
  `CREATE INDEX idx_factory_grants_workflow ON factory_grants (project_id, workflow_name, action)`,
  // One job (unit, role, part label) run by one tool (R-FACTORY-27, R-FACTORY-28).
  `CREATE TABLE factory_assignments (
    assignment_id TEXT PRIMARY KEY CHECK ${storeId("assignment_id", "fa-")},
    project_id TEXT NOT NULL,
    workflow_name TEXT NOT NULL,
    -- The checkout the assignment runs in (owner decision 2026-11-23). No foreign key: removing a checkout never
    -- removes an assignment by cascade, and the service checks the checkout at start.
    checkout_id TEXT NOT NULL CHECK (length(checkout_id) BETWEEN 1 AND 160),
    unit_store_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK ${kebab("role")},
    part_label TEXT NOT NULL CHECK ${kebab("part_label", 40)},
    tool_id TEXT NOT NULL CHECK ${kebab("tool_id")},
    task_handle TEXT CHECK (task_handle IS NULL OR ${oneLine("task_handle", 1024)}),
    run_id TEXT NOT NULL CHECK (length(run_id) BETWEEN 1 AND 160),
    status TEXT NOT NULL CHECK (status IN ('offered','running','returned','in-review','needs-correction','accepted','failed','cancelled','unknown')),
    checked_at TEXT NOT NULL CHECK (${utcTime("checked_at")}),
    round_count INTEGER NOT NULL CHECK (round_count >= 0),
    plan_revision INTEGER NOT NULL CHECK (plan_revision >= 1),
    plan_digest TEXT NOT NULL CHECK ${hexDigest("plan_digest")},
    history_json TEXT NOT NULL CHECK (${jsonArray("history_json", 20)} AND json_array_length(history_json) >= 1),
    entry_version INTEGER NOT NULL CHECK (entry_version >= 1),
    -- No foreign key to work_units: a final assignment outlives its unit until an explicit scoped
    -- cleanup (PRD 38), and nothing deletes an assignment by cascade. Sync and deleteWorkUnit refuse
    -- to delete a unit with an open assignment, and the scoped project cleanup deletes assignments itself.
    FOREIGN KEY (project_id, workflow_name) REFERENCES factory_workflow_bindings (project_id, workflow_name)
  )`,
  // Only one assignment for each job is open at a time (R-FACTORY-41, assignment-open).
  `CREATE UNIQUE INDEX idx_factory_assignments_open_job ON factory_assignments (unit_store_id, role, part_label) WHERE status NOT IN ('accepted','failed','cancelled')`,
  `CREATE INDEX idx_factory_assignments_workflow ON factory_assignments (project_id, workflow_name, status)`,
  // A final status never changes (final-status).
  `CREATE TRIGGER ${FACTORY_FINAL_ASSIGNMENT_TRIGGER} BEFORE UPDATE ON factory_assignments WHEN OLD.status IN ('accepted','failed','cancelled') BEGIN SELECT RAISE(ABORT, 'A final factory assignment never changes.'); END`,
  // The latest passing and the latest failing test task of each workflow (R-FACTORY-12).
  `CREATE TABLE factory_proof_results (
    project_id TEXT NOT NULL,
    workflow_name TEXT NOT NULL,
    outcome TEXT NOT NULL CHECK (outcome IN ('passed','failed')),
    test_task TEXT NOT NULL CHECK ${oneLine("test_task")},
    plan_digest TEXT NOT NULL CHECK ${hexDigest("plan_digest")},
    path_json TEXT NOT NULL CHECK (${jsonArray("path_json", 32)} AND json_array_length(path_json) >= 1),
    manual_steps_json TEXT NOT NULL CHECK ${jsonArray("manual_steps_json", 16)},
    recorded_at TEXT NOT NULL CHECK (${utcTime("recorded_at")}),
    entry_version INTEGER NOT NULL CHECK (entry_version >= 1),
    PRIMARY KEY (project_id, workflow_name, outcome),
    FOREIGN KEY (project_id, workflow_name) REFERENCES factory_workflow_bindings (project_id, workflow_name) ON DELETE CASCADE
  )`,
  // A file backup outside git (R-FACTORY-44). The bytes stay in the project's
  // .make-docs/backup/factory/ folder; the row holds paths, the digest, and the assignment.
  `CREATE TABLE factory_backups (
    project_id TEXT NOT NULL CHECK ${projectId("project_id")},
    -- No cascade: an assignment cannot go while a backup record names it.
    assignment_id TEXT NOT NULL REFERENCES factory_assignments (assignment_id),
    original_path TEXT NOT NULL CHECK ${absolutePath("original_path")},
    backup_path TEXT NOT NULL UNIQUE CHECK ${absolutePath("backup_path")},
    content_digest TEXT NOT NULL CHECK ${hexDigest("content_digest")},
    backed_up_at TEXT NOT NULL CHECK (${utcTime("backed_up_at")}),
    PRIMARY KEY (assignment_id, original_path)
  )`,
  `CREATE INDEX idx_factory_backups_time ON factory_backups (backed_up_at)`,
]);

/** The PRD 38 R-MIN rows that govern the factory tables, by their row label start. */
export const FACTORY_STORE_RMIN_ROWS = Object.freeze({
  tools: "Factory machine tools",
  bindings: "Factory workflow bindings",
  grants: "Factory grants",
  assignments: "Factory assignments",
  plans: "Factory workflow plans",
  proofs: "Factory proof results",
  backups: "Factory backup records",
} as const);
export type FactoryStoreRMinRowKey = keyof typeof FACTORY_STORE_RMIN_ROWS;

export interface FactoryStoreColumnRegisterEntry {
  row: FactoryStoreRMinRowKey;
  /** The field phrase of that row that the column holds, as {@link factoryRMinRowFieldPhrases} reads it from PRD 38. */
  phrase: string;
}

/**
 * Every physical column of every factory table, in schema order, with the
 * R-MIN field it holds (W30 R0 P2 T6). The parity test reads the physical
 * schema and PRD 38, and fails when a column, a field, or a phrase is on one
 * side only.
 */
export const FACTORY_STORE_COLUMN_REGISTER: Readonly<Record<FactoryStoreTableName, Readonly<Record<string, FactoryStoreColumnRegisterEntry>>>> = Object.freeze({
  factory_machine_tools: {
    tool_id: { row: "tools", phrase: "tool identity" },
    tool_kind: { row: "tools", phrase: "tool identity" },
    tool_label: { row: "tools", phrase: "tool identity" },
    state: { row: "tools", phrase: "tool state" },
    reported_version: { row: "tools", phrase: "the tool version the agent reported" },
    capabilities_json: { row: "tools", phrase: "discovered capabilities" },
    reported_at: { row: "tools", phrase: "tool state" },
    entry_version: { row: "tools", phrase: "record version" },
  },
  factory_capability_proofs: {
    tool_id: { row: "tools", phrase: "tool identity" },
    capability_id: { row: "tools", phrase: "one proof for each capability with how it was proved" },
    method: { row: "tools", phrase: "one proof for each capability with how it was proved" },
    tool_version: { row: "tools", phrase: "the tool version the agent reported" },
    proved_at: { row: "tools", phrase: "the proof time" },
    result: { row: "tools", phrase: "the result" },
    not_covered_json: { row: "tools", phrase: "a bounded \"does not cover\" list of one-line labels" },
  },
  factory_workflow_plans: {
    project_id: { row: "plans", phrase: "project ID" },
    workflow_name: { row: "plans", phrase: "workflow name" },
    revision: { row: "plans", phrase: "revision number" },
    plan_digest: { row: "plans", phrase: "plan digest" },
    plan_json: { row: "plans", phrase: "canonical plan JSON" },
    config_digest: { row: "plans", phrase: "config digest" },
    binding_digest: { row: "plans", phrase: "binding digest" },
    created_at: { row: "plans", phrase: "created time" },
  },
  factory_workflow_bindings: {
    project_id: { row: "bindings", phrase: "project ID" },
    workflow_name: { row: "bindings", phrase: "workflow name" },
    roles_json: { row: "bindings", phrase: "role to tool" },
    worktree_method: { row: "bindings", phrase: "worktree method" },
    channel_ref: { row: "bindings", phrase: "channel and wake method references" },
    wake_method: { row: "bindings", phrase: "channel and wake method references" },
    wake_ref: { row: "bindings", phrase: "channel and wake method references" },
    known_losses_json: { row: "bindings", phrase: "accepted known losses" },
    ready_revision: { row: "bindings", phrase: "the `ready` plan revision" },
    readiness: { row: "bindings", phrase: "readiness state" },
    entry_version: { row: "bindings", phrase: "record version" },
  },
  factory_grants: {
    grant_id: { row: "grants", phrase: "grant ID" },
    project_id: { row: "grants", phrase: "project ID" },
    workflow_name: { row: "grants", phrase: "workflow name" },
    action: { row: "grants", phrase: "action" },
    scope: { row: "grants", phrase: "scope" },
    run_id: { row: "grants", phrase: "the lifecycle run for a `run` grant" },
    expires_at: { row: "grants", phrase: "optional expiry time" },
    spent_at: { row: "grants", phrase: "the time a `once` grant was spent" },
    granted_by: { row: "grants", phrase: "granting person" },
    granted_at: { row: "grants", phrase: "grant time" },
    entry_version: { row: "grants", phrase: "record version" },
  },
  factory_assignments: {
    assignment_id: { row: "assignments", phrase: "assignment ID" },
    project_id: { row: "assignments", phrase: "project ID" },
    workflow_name: { row: "assignments", phrase: "workflow name" },
    checkout_id: { row: "assignments", phrase: "checkout ID" },
    unit_store_id: { row: "assignments", phrase: "work unit" },
    role: { row: "assignments", phrase: "role" },
    part_label: { row: "assignments", phrase: "part label" },
    tool_id: { row: "assignments", phrase: "tool" },
    task_handle: { row: "assignments", phrase: "task handle" },
    run_id: { row: "assignments", phrase: "lifecycle run ID" },
    status: { row: "assignments", phrase: "status" },
    checked_at: { row: "assignments", phrase: "last check time" },
    round_count: { row: "assignments", phrase: "correction round count" },
    plan_revision: { row: "assignments", phrase: "plan revision number and plan digest" },
    plan_digest: { row: "assignments", phrase: "plan revision number and plan digest" },
    history_json: { row: "assignments", phrase: "a status history of the 20 newest changes" },
    entry_version: { row: "assignments", phrase: "record version" },
  },
  factory_proof_results: {
    project_id: { row: "proofs", phrase: "project ID" },
    workflow_name: { row: "proofs", phrase: "workflow" },
    outcome: { row: "proofs", phrase: "outcome" },
    test_task: { row: "proofs", phrase: "test task" },
    plan_digest: { row: "proofs", phrase: "plan revision digest tested" },
    path_json: { row: "proofs", phrase: "path exercised" },
    manual_steps_json: { row: "proofs", phrase: "manual steps still open" },
    recorded_at: { row: "proofs", phrase: "time" },
    entry_version: { row: "proofs", phrase: "record version" },
  },
  factory_backups: {
    project_id: { row: "backups", phrase: "project ID" },
    assignment_id: { row: "backups", phrase: "assignment" },
    original_path: { row: "backups", phrase: "original path" },
    backup_path: { row: "backups", phrase: "backup path" },
    content_digest: { row: "backups", phrase: "content digest" },
    backed_up_at: { row: "backups", phrase: "backup time" },
  },
});

/**
 * The field phrases of one R-MIN row label. The list after the first ": " is
 * split at the commas that are outside parentheses and code spans. A leading
 * "and" and every parenthetical part are dropped, so "tool state
 * (`available`, `missing`, or `blocked`, as an agent reports it)" reads as
 * "tool state".
 */
export function factoryRMinRowFieldPhrases(label: string): string[] {
  const colon = label.indexOf(": ");
  if (colon < 0) return [];
  const body = label.slice(colon + 2);
  const parts: string[] = [];
  let depth = 0;
  let code = false;
  let current = "";
  for (const character of body) {
    if (character === "`") code = !code;
    else if (!code && character === "(") depth++;
    else if (!code && character === ")") depth = Math.max(0, depth - 1);
    if (character === "," && depth === 0 && !code) {
      parts.push(current);
      current = "";
      continue;
    }
    current += character;
  }
  parts.push(current);
  return parts
    .map((part) => part.replace(/\([^()]*\)/g, " ").replace(/\s+/g, " ").trim().replace(/^and /, "").trim())
    .filter((part) => part.length > 0);
}

/**
 * Compare the factory tables, the column register, and the PRD 38 R-MIN rows
 * (T6, A10). Returns one plain sentence for each drift; an empty list means
 * the register and the physical schema match.
 */
export function factoryStoreSchemaDrift(
  physicalTables: Readonly<Record<string, readonly string[]>>,
  rMinRows: readonly { label: string }[],
  register: Readonly<Record<string, Readonly<Record<string, FactoryStoreColumnRegisterEntry>>>> = FACTORY_STORE_COLUMN_REGISTER,
): string[] {
  const drift: string[] = [];
  for (const table of FACTORY_STORE_TABLE_NAMES) {
    const physical = physicalTables[table];
    const mapped = register[table] ?? {};
    if (!physical) {
      drift.push(`Table ${table} is not in the physical schema.`);
      continue;
    }
    for (const column of physical) {
      if (!mapped[column]) drift.push(`Column ${table}.${column} has no R-MIN field in the factory register.`);
    }
    for (const column of Object.keys(mapped)) {
      if (!physical.includes(column)) drift.push(`Column ${table}.${column} is in the factory register but not in the physical schema.`);
    }
  }
  for (const [key, labelStart] of Object.entries(FACTORY_STORE_RMIN_ROWS) as Array<[FactoryStoreRMinRowKey, string]>) {
    const rows = rMinRows.filter((row) => row.label.startsWith(labelStart));
    if (rows.length !== 1) {
      drift.push(`R-MIN row "${labelStart}" matches ${rows.length} PRD 38 rows.`);
      continue;
    }
    const phrases = factoryRMinRowFieldPhrases(rows[0]!.label);
    const held = new Set(
      Object.entries(register).flatMap(([table, columns]) =>
        Object.entries(columns)
          .filter(([column, entry]) => entry.row === key && (physicalTables[table] ?? []).includes(column))
          .map(([, entry]) => entry.phrase),
      ),
    );
    for (const phrase of phrases) {
      if (!held.has(phrase)) drift.push(`R-MIN field "${phrase}" of "${labelStart}" has no physical column.`);
    }
    for (const phrase of held) {
      if (!phrases.includes(phrase)) drift.push(`Physical columns hold "${phrase}", but the R-MIN row "${labelStart}" does not name it.`);
    }
  }
  return drift;
}
