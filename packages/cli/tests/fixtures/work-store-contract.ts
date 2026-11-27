import type {
  WorkAddRequest,
  WorkAuthorityMode,
  WorkClaimRecord,
  WorkClaimRefusal,
  WorkClaimRequest,
  WorkClaimResult,
  WorkCloseRequest,
  WorkConflictKind,
  WorkNextQuery,
  WorkReleaseRequest,
  WorkReportRequest,
  WorkSettleRequest,
  WorkStoreState,
  WorkSyncConflictRecord,
  WorkSyncDecision,
  WorkSyncFileState,
  WorkSyncStoreState,
  WorkUnitKind,
  WorkUnitRecord,
  WorkUnitStatus,
  WorkUpdateRefusal,
  WorkWaitReason,
} from "../../src/operations/work/work-store";

/**
 * W29 R0 P1 fixture matrix. Each fixture names the rules it proves and its
 * expected result. P3 and P4 run the real sync and queue code against these
 * fixtures, and the agent form in `work-store.md` must reach the same answers.
 */

export const WORK_STORE_FIXTURE_GROUPS = [
  "current repository backlogs",
  "mixed portfolio",
  "dependency bullets",
  "unresolved dependencies",
  "conflict",
  "quick item",
  "folder without git",
  "no-Store checkout",
  "claims",
  "report and close",
  "tracker and config",
  "checkpoint",
] as const;
export type WorkStoreFixtureGroup = (typeof WORK_STORE_FIXTURE_GROUPS)[number];

export const PROJECT_ID = "aurora-notes-project";
export const CHECKOUT_ID = "aurora-notes-checkout-1";
export const NOW = "2042-06-15T12:00:00.000Z";
const CLAIMED = "2042-06-15T10:00:00.000Z";
const EARLIER = "2042-06-15T11:00:00.000Z";
const LATER = "2042-06-15T12:30:00.000Z";
const WORK_FILE = "docs/work/2042-06-01-w1-r0-aurora/00-index.md";

/** A stable, readable store ID derived from a coordinate. */
export function storeIdFor(coordinate: string): string {
  const compact = coordinate.toLowerCase().replace(/[^a-z0-9]/g, "");
  // Pad with a letter, so W1 R0 P1 and W1 R0 P10 keep different IDs.
  return `wu-${compact.padEnd(8, "x")}`;
}

export function claimIdFor(name: string): string {
  return `wc-${name.toLowerCase().replace(/[^a-z0-9]/g, "").padEnd(8, "0")}`;
}

interface UnitOptions {
  title?: string;
  status?: WorkUnitStatus;
  /** Null for a file unit with no status line. */
  recordedStatus?: string | null;
  parent?: string;
  dependsOn?: string[];
  cancelledDependency?: boolean;
  unresolved?: string[];
  gates?: { text: string; met: boolean }[];
  blockers?: string[];
  sourcePath?: string | null;
}

function defaultParent(kind: WorkUnitKind, coordinate: string): string | null {
  if (kind === "wave" || kind === "quick-item") return null;
  return coordinate.split(" ").slice(0, -1).join(" ");
}

export function unit(kind: WorkUnitKind, coordinate: string, options: UnitOptions = {}): WorkUnitRecord {
  const status = options.status ?? "open";
  const parent = options.parent ?? defaultParent(kind, coordinate);
  const sourcePath =
    options.sourcePath === undefined ? (kind === "quick-item" ? null : WORK_FILE) : options.sourcePath;
  const location = { path: sourcePath ?? WORK_FILE, line: 12 };
  return {
    projectId: PROJECT_ID,
    storeId: storeIdFor(coordinate),
    kind,
    coordinate,
    parentStoreId: parent === null ? null : storeIdFor(parent),
    title: options.title ?? `${coordinate} title`,
    body: null,
    recordedStatus: options.recordedStatus !== undefined ? options.recordedStatus : (status === "closed" ? "completed" : status === "draft" ? "draft" : "active"),
    status,
    closeOutcome: status === "closed" ? "done" : null,
    dependencies: (options.dependsOn ?? []).map((dependency) => ({
      dependsOnStoreId: storeIdFor(dependency),
      sourceText: dependency,
      source: sourcePath === null ? null : location,
    })),
    unresolvedDependencies: (options.unresolved ?? []).map((sourceText) => ({ sourceText, source: location })),
    gates: (options.gates ?? []).map((gate) => ({ sourceText: gate.text, source: location, met: gate.met })),
    blockers: (options.blockers ?? []).map((text) => ({ text, source: null })),
    links: [],
    sourcePath,
    copyState: "kept",
    revision: 1,
  };
}

function cancelled(record: WorkUnitRecord): WorkUnitRecord {
  return { ...record, status: "closed", closeOutcome: "cancelled", recordedStatus: "cancelled" };
}

export function claim(name: string, coordinate: string, claimant: string, expiresAt = LATER): WorkClaimRecord {
  return {
    projectId: PROJECT_ID,
    claimId: claimIdFor(name),
    unitStoreId: storeIdFor(coordinate),
    claimant,
    taskHandle: `${claimant}-task-1`,
    claimedAt: CLAIMED,
    renewedAt: CLAIMED,
    expiresAt,
    takeoverObservation: null,
  };
}

function claimRequest(coordinate: string, claimant: string, extra: Partial<WorkClaimRequest> = {}): WorkClaimRequest {
  return {
    unitStoreId: storeIdFor(coordinate),
    claimant,
    taskHandle: null,
    ttlSeconds: null,
    expectedVersion: 1,
    takeover: null,
    ...extra,
  };
}

function reportRequest(coordinate: string, claimName: string | null, extra: Partial<WorkReportRequest> = {}): WorkReportRequest {
  return {
    unitStoreId: storeIdFor(coordinate),
    claimId: claimName === null ? null : claimIdFor(claimName),
    status: null,
    note: null,
    evidencePath: null,
    clearBlockers: false,
    metGates: [],
    expectedVersion: 1,
    ...extra,
  };
}

interface FixtureBase {
  id: `WSF-${string}`;
  group: WorkStoreFixtureGroup;
  title: string;
  rules: readonly `WORK-RULE-${string}`[];
}

export interface ReadinessFixture extends FixtureBase {
  kind: "readiness";
  input: {
    now: string;
    claimant: string | null;
    query: WorkNextQuery;
    units: WorkUnitRecord[];
    claims: WorkClaimRecord[];
    conflicts: WorkSyncConflictRecord[];
  };
  expected: {
    ready: string[];
    waiting: { coordinate: string; reasons: WorkWaitReason[] }[];
  };
}

export interface SyncFixture extends FixtureBase {
  kind: "sync";
  input: {
    cases: { path: string; file: WorkSyncFileState; store: WorkSyncStoreState; projection: "on" | "off" }[];
    settle?: WorkSettleRequest;
  };
  expected: { decisions: WorkSyncDecision[] };
}

export interface DependencyFixture extends FixtureBase {
  kind: "dependency";
  /** `titles` gives a unit's real title, for the title rule of R-WORK-SYNC-13 (WORK-RULE-049). */
  input: { unitCoordinate: string; bullet: string; existing: string[]; titles?: Record<string, string> };
  expected: { dependencies: string[]; unresolved: string[]; gate: boolean; reference: boolean; none: boolean };
}

export interface AuthorityFixture extends FixtureBase {
  kind: "authority";
  input: { store: WorkStoreState; git: "available" | "not-a-repository"; cli: boolean };
  expected: { mode: WorkAuthorityMode };
}

export interface ClaimFixture extends FixtureBase {
  kind: "claim";
  input: { now: string; units: WorkUnitRecord[]; claims: WorkClaimRecord[]; request: WorkClaimRequest };
  expected: { result: WorkClaimResult; refusal: WorkClaimRefusal | null };
}

export interface UpdateFixture extends FixtureBase {
  kind: "update";
  input: {
    now: string;
    units: WorkUnitRecord[];
    claims: WorkClaimRecord[];
    request: { report: WorkReportRequest } | { close: WorkCloseRequest } | { release: WorkReleaseRequest };
  };
  expected: { accepted: boolean; refusal: WorkUpdateRefusal | null; parentClosed: boolean; readyAfter: string[] };
}

export interface OperationsFixture extends FixtureBase {
  kind: "operations";
  input: { operations: "all" };
  expected: { syncFirst: true };
}

export interface RoundTripFixture extends FixtureBase {
  kind: "round-trip";
  input: { roots: string[] };
  expected: { bytes: "identical"; importWritesFiles: false; minimumRecords: number };
}

export interface AddFixture extends FixtureBase {
  kind: "add";
  input: { units: WorkUnitRecord[]; request: WorkAddRequest };
  expected: { coordinate: string };
}

export interface ProjectUriFixture extends FixtureBase {
  kind: "project-uri";
  input: { uris: string[] };
  /** The canonical URI for each input, or null when the resolver refuses it. */
  expected: { canonical: (string | null)[] };
}

/**
 * W29 R0 P5 T9: one sync scenario on the shared fixture backlog. The P5 test
 * runs each scenario through the real sync code, and the agent form in
 * `work-store.md` states the same answer.
 */
export const WORK_SYNC_SCENARIOS = [
  "same-work-on-both-sides",
  "archive-move",
  "unit-leaves-file",
  "file-closes-claimed-unit",
  "held-path",
  "settle-keep-store",
  "first-sync-of-a-checkout",
  "changed-copy-with-copies-off",
  "read-only-check",
  "export-to-named-folder",
] as const;
export type WorkSyncScenario = (typeof WORK_SYNC_SCENARIOS)[number];

export interface SyncScenarioFixture extends FixtureBase {
  kind: "sync-scenario";
  input: { scenario: WorkSyncScenario };
  expected: {
    /** The sync action for the scenario's file. */
    action: "none" | "imported" | "written" | "removed" | "conflict" | "adopted" | "moved" | "deferred" | "held";
    conflictKind: WorkConflictKind | null;
    /** True when the sync wrote or removed a project file. */
    changedFiles: boolean;
  };
}

/**
 * W29 R0 P5 review item 6: one `work report` scenario on the shared fixture
 * backlog. The P5 test runs each scenario through the real `work report`.
 */
export const WORK_REPORT_SCENARIOS = ["note-too-long", "note-replaces-last", "store-only-edit-named"] as const;
export type WorkReportScenario = (typeof WORK_REPORT_SCENARIOS)[number];

export interface ReportScenarioFixture extends FixtureBase {
  kind: "report-scenario";
  input: { scenario: WorkReportScenario };
  expected: {
    /** False when the report is refused before its sync, so nothing changes. */
    accepted: boolean;
    /** The unit's latest note after the scenario, or null. */
    latestNote: string | null;
    /** The kinds of store-only edits that the last report names. */
    storeOnlyEditKinds: string[];
  };
}

/**
 * W35 R0 P1: one project checkpoint scenario on the shared fixture backlog of
 * the checkpoint tests (one index and two phases, with two ready phases). The
 * W35 R0 P1 surface test runs each scenario through the real checkpoint, and
 * the `Checkpoint` section of `work-store.md` states the same answer.
 */
export const WORK_CHECKPOINT_SCENARIOS = [
  "first-direct-run",
  "repeat-direct-run",
  "direct-run-both-ways",
  "trigger-run-imports-only",
  "trigger-run-nothing-due",
  "branch-change",
  "conflict",
  "claim-ended",
  "read-access-only",
  "no-store",
  "not-a-project",
] as const;
export type WorkCheckpointScenario = (typeof WORK_CHECKPOINT_SCENARIOS)[number];

export interface CheckpointScenarioFixture extends FixtureBase {
  kind: "checkpoint-scenario";
  input: { scenario: WorkCheckpointScenario };
  expected: {
    authority: WorkAuthorityMode | "not-a-project";
    /** False when the sync step did not run. `syncSkipped` says why. */
    syncRan: boolean;
    syncSkipped: "read-access-only" | "branch-change" | "files-authority" | "not-a-project" | null;
    nothingDue: boolean;
    /** True when a trigger run reports nothing. */
    quiet: boolean;
    firstSync: boolean;
    imported: number;
    written: number;
    /** Files that wait for an import, a write, or a removal. */
    waiting: number;
    conflicts: number;
    /** The state of each listed claim, in order. */
    claims: Array<"ended" | "ends-soon">;
    /** The coordinates of the short ready list, in order. */
    next: string[];
    /** True when the run wrote or removed a project file. */
    changedFiles: boolean;
  };
}

export interface ConfigFixture extends FixtureBase {
  kind: "config";
  input: { work: unknown };
  expected: { valid: boolean };
}

/**
 * W35 R0 P2: one read scenario on the shared fixture backlog of the reminder
 * tests (one index and two phases). The W35 R0 P2 test runs each scenario
 * through the real `work next`, `work status`, and project URI read, and the
 * work store reference states the same answer.
 */
export const WORK_READ_WAIT_SCENARIOS = ["nothing-waits", "one-file-changed", "new-file", "first-sync-not-done", "backlog-uri-read"] as const;
export type WorkReadWaitScenario = (typeof WORK_READ_WAIT_SCENARIOS)[number];

export interface ReadWaitScenarioFixture extends FixtureBase {
  kind: "read-wait-scenario";
  input: { scenario: WorkReadWaitScenario };
  expected: {
    /** True when the first line of `work next` and `work status` names the checkpoint. */
    checkpointFirst: boolean;
    /** How many work files wait for import. */
    filesWaiting: number;
    /** The phases that `work next` marks, because their file waits for import. */
    markedPhases: string[];
    /** False when `work next` says that the list is not complete. */
    listComplete: boolean;
    /** True when the read is a `backlog` read by project URI, which carries the fixed sentence. */
    uriSentence: boolean;
    /** True when the read changed a store record or a project file. Always false. */
    changed: boolean;
  };
}

export type WorkStoreContractFixture =
  | ReadWaitScenarioFixture
  | ReadinessFixture
  | SyncFixture
  | DependencyFixture
  | AuthorityFixture
  | ClaimFixture
  | UpdateFixture
  | OperationsFixture
  | RoundTripFixture
  | AddFixture
  | ProjectUriFixture
  | SyncScenarioFixture
  | ReportScenarioFixture
  | CheckpointScenarioFixture
  | ConfigFixture;

const PHASE_QUERY: WorkNextQuery = { level: "phase", includeQuickItems: true };
const TASK_QUERY: WorkNextQuery = { level: "task", includeQuickItems: false };

const portfolioUnits: WorkUnitRecord[] = [
  unit("wave", "W1"),
  unit("revision", "W1 R0"),
  unit("phase", "W1 R0 P1", { status: "closed" }),
  unit("phase", "W1 R0 P2", { dependsOn: ["W1 R0 P1"] }),
  unit("phase", "W1 R0 P3", { dependsOn: ["W1 R0 P2"] }),
  unit("phase", "W1 R0 P4", { status: "blocked", blockers: ["The owner has not chosen a schema format"] }),
  unit("phase", "W1 R0 P5"),
  unit("phase", "W1 R0 P6", { status: "in-progress" }),
  unit("phase", "W1 R0 P7"),
  unit("phase", "W1 R0 P8", { status: "draft" }),
  unit("phase", "W1 R0 P9", { recordedStatus: "parked" }),
  unit("phase", "W1 R0 P10"),
  unit("phase", "W1 R0 P11", { gates: [{ text: "The owner approves this package.", met: false }] }),
  unit("revision", "W1 R1", { status: "closed" }),
  unit("phase", "W1 R1 P1"),
  unit("quick-item", "1", { title: "Compare three report layouts" }),
];

const portfolioClaims: WorkClaimRecord[] = [
  claim("p5", "W1 R0 P5", "builder-a"),
  claim("p7", "W1 R0 P7", "builder-b", EARLIER),
];

const stagedUnits: WorkUnitRecord[] = [
  unit("wave", "W1"),
  unit("revision", "W1 R0"),
  unit("phase", "W1 R0 P2"),
  unit("stage", "W1 R0 P2 S1"),
  unit("stage", "W1 R0 P2 S2", { dependsOn: ["W1 R0 P2 S1"] }),
  unit("task", "W1 R0 P2 T1", { parent: "W1 R0 P2 S1" }),
  unit("task", "W1 R0 P2 T2", { parent: "W1 R0 P2 S2" }),
];

const CONFLICT_PATH = "docs/work/2042-06-01-w1-r0-aurora/02-import.md";

export const WORK_STORE_CONTRACT_FIXTURES: readonly WorkStoreContractFixture[] = [
  {
    id: "WSF-001",
    group: "current repository backlogs",
    title: "Every current and archived backlog in this repository round-trips with no file change",
    rules: ["WORK-RULE-003", "WORK-RULE-004", "WORK-RULE-006", "WORK-RULE-012", "WORK-RULE-015", "WORK-RULE-017"],
    kind: "round-trip",
    input: { roots: ["docs/work", ".make-docs/archive/work"] },
    expected: { bytes: "identical", importWritesFiles: false, minimumRecords: 10 },
  },
  {
    id: "WSF-002",
    group: "mixed portfolio",
    title: "Phase-level next lists ready phases in order and says why the others wait",
    rules: ["WORK-RULE-018", "WORK-RULE-020", "WORK-RULE-021", "WORK-RULE-027", "WORK-RULE-033"],
    kind: "readiness",
    input: { now: NOW, claimant: null, query: PHASE_QUERY, units: portfolioUnits, claims: portfolioClaims, conflicts: [] },
    expected: {
      ready: ["W1 R0 P2", "W1 R0 P6", "W1 R0 P10", "1"],
      waiting: [
        { coordinate: "W1 R0 P3", reasons: ["dependency-open"] },
        { coordinate: "W1 R0 P4", reasons: ["blocked"] },
        { coordinate: "W1 R0 P5", reasons: ["claimed"] },
        { coordinate: "W1 R0 P7", reasons: ["claim-expired"] },
        { coordinate: "W1 R0 P8", reasons: ["draft"] },
        { coordinate: "W1 R0 P9", reasons: ["status-unknown"] },
        { coordinate: "W1 R0 P11", reasons: ["gate-open"] },
        { coordinate: "W1 R1 P1", reasons: ["ancestor-closed"] },
      ],
    },
  },
  {
    id: "WSF-003",
    group: "unresolved dependencies",
    title: "A coordinate that matches no unit keeps its unit waiting",
    rules: ["WORK-RULE-016", "WORK-RULE-020", "WORK-RULE-021"],
    kind: "readiness",
    input: {
      now: NOW,
      claimant: null,
      query: PHASE_QUERY,
      units: [
        unit("wave", "W1"),
        unit("revision", "W1 R0"),
        unit("phase", "W1 R0 P1", { unresolved: ["P9 is complete."] }),
        unit("phase", "W1 R0 P2"),
      ],
      claims: [],
      conflicts: [],
    },
    expected: { ready: ["W1 R0 P2"], waiting: [{ coordinate: "W1 R0 P1", reasons: ["dependency-unresolved"] }] },
  },
  {
    id: "WSF-004",
    group: "conflict",
    title: "A conflict blocks only the units in its own file",
    rules: ["WORK-RULE-010", "WORK-RULE-020"],
    kind: "readiness",
    input: {
      now: NOW,
      claimant: null,
      query: PHASE_QUERY,
      units: [
        unit("wave", "W1"),
        unit("revision", "W1 R0"),
        unit("phase", "W1 R0 P1", { sourcePath: "docs/work/2042-06-01-w1-r0-aurora/01-model.md" }),
        unit("phase", "W1 R0 P2", { sourcePath: CONFLICT_PATH }),
      ],
      claims: [],
      conflicts: [
        {
          checkoutId: CHECKOUT_ID,
          targetPath: CONFLICT_PATH,
          kind: "both-changed",
          fileDigest: "a".repeat(64),
          ledgerDigest: "b".repeat(64),
          storeRevision: 3,
          affectedUnitStoreIds: [storeIdFor("W1 R0 P2")],
          detectedAt: NOW,
        },
      ],
    },
    expected: { ready: ["W1 R0 P1"], waiting: [{ coordinate: "W1 R0 P2", reasons: ["sync-conflict"] }] },
  },
  {
    id: "WSF-005",
    group: "conflict",
    title: "The sync table on both sides of a change, with copies on and off",
    rules: ["WORK-RULE-005", "WORK-RULE-007", "WORK-RULE-009", "WORK-RULE-010", "WORK-RULE-011", "WORK-RULE-014", "WORK-RULE-035"],
    kind: "sync",
    input: {
      cases: [
        { path: "docs/work/a/01.md", file: "changed", store: "unchanged", projection: "on" },
        { path: "docs/work/a/02.md", file: "unchanged", store: "changed", projection: "on" },
        { path: "docs/work/a/03.md", file: "changed", store: "changed", projection: "on" },
        { path: "docs/work/a/04.md", file: "unreadable", store: "changed", projection: "on" },
        { path: "docs/work/a/05.md", file: "missing", store: "unchanged", projection: "on" },
        { path: "docs/work/a/06.md", file: "unchanged", store: "unchanged", projection: "off" },
        { path: "docs/work/a/07.md", file: "new", store: "none", projection: "on" },
        { path: "docs/work/a/08.md", file: "absent", store: "new", projection: "on" },
        { path: "docs/work/a/09.md", file: "unchanged", store: "unchanged", projection: "on" },
        { path: "docs/work/a/10.md", file: "unchanged", store: "none", projection: "on" },
        { path: "docs/work/a/11.md", file: "changed", store: "none", projection: "on" },
        { path: "docs/work/a/12.md", file: "missing", store: "new", projection: "on" },
      ],
    },
    expected: {
      decisions: ["import", "write", "conflict", "report-unreadable", "conflict", "remove-copy", "import", "write", "none", "conflict", "conflict", "conflict"],
    },
  },
  {
    id: "WSF-006",
    group: "conflict",
    title: "An accepted deletion stays settled in this checkout and in every other checkout",
    rules: ["WORK-RULE-036"],
    kind: "sync",
    input: {
      settle: { targetPath: "docs/work/a/05.md", choice: "accept-deletion", expectedStoreRevision: 4 },
      cases: [
        { path: "docs/work/a/05.md", file: "missing", store: "removed", projection: "on" },
        { path: "docs/work/a/05.md", file: "absent", store: "removed", projection: "on" },
        { path: "docs/work/a/05.md", file: "unchanged", store: "removed", projection: "on" },
        { path: "docs/work/a/05.md", file: "changed", store: "removed", projection: "on" },
      ],
    },
    expected: { decisions: ["none", "none", "remove-copy", "conflict"] },
  },
  {
    id: "WSF-007",
    group: "quick item",
    title: "A quick item needs no design, plan, PRD, or work file",
    rules: ["WORK-RULE-019", "WORK-RULE-020"],
    kind: "readiness",
    input: {
      now: NOW,
      claimant: null,
      query: { level: "task", includeQuickItems: true },
      units: [unit("quick-item", "1", { title: "Compare three flights" }), unit("quick-item", "2", { status: "closed" })],
      claims: [],
      conflicts: [],
    },
    expected: { ready: ["1"], waiting: [] },
  },
  {
    id: "WSF-008",
    group: "folder without git",
    title: "A folder without git still uses the work store when the Store is usable",
    rules: ["WORK-RULE-001", "WORK-RULE-002", "WORK-RULE-037"],
    kind: "authority",
    input: { store: "usable", git: "not-a-repository", cli: true },
    expected: { mode: "store" },
  },
  {
    id: "WSF-009",
    group: "no-Store checkout",
    title: "No Store configured keeps the files as the authority",
    rules: ["WORK-RULE-001", "WORK-RULE-002", "WORK-RULE-053"],
    kind: "authority",
    input: { store: "not-configured", git: "available", cli: true },
    expected: { mode: "files" },
  },
  {
    id: "WSF-010",
    group: "no-Store checkout",
    title: "An unavailable Store keeps the files as the authority",
    rules: ["WORK-RULE-001"],
    kind: "authority",
    input: { store: "unavailable", git: "available", cli: true },
    expected: { mode: "files" },
  },
  {
    id: "WSF-011",
    group: "no-Store checkout",
    title: "An unsafe Store keeps the files as the authority",
    rules: ["WORK-RULE-001"],
    kind: "authority",
    input: { store: "unsafe", git: "available", cli: true },
    expected: { mode: "files" },
  },
  {
    id: "WSF-012",
    group: "no-Store checkout",
    title: "A denied Store keeps the files as the authority",
    rules: ["WORK-RULE-001"],
    kind: "authority",
    input: { store: "denied", git: "available", cli: true },
    expected: { mode: "files" },
  },
  {
    id: "WSF-013",
    group: "no-Store checkout",
    title: "Without the CLI, an agent uses the files with the same rules",
    rules: ["WORK-RULE-001", "WORK-RULE-027", "WORK-RULE-053"],
    kind: "authority",
    input: { store: "usable", git: "available", cli: false },
    expected: { mode: "files" },
  },
  {
    id: "WSF-014",
    group: "claims",
    title: "A free, ready unit can be claimed",
    rules: ["WORK-RULE-022", "WORK-RULE-034"],
    kind: "claim",
    input: { now: NOW, units: portfolioUnits, claims: [], request: claimRequest("W1 R0 P2", "foreman-a") },
    expected: { result: "claimed", refusal: null },
  },
  {
    id: "WSF-015",
    group: "claims",
    title: "A unit that is not ready cannot be claimed",
    rules: ["WORK-RULE-034"],
    kind: "claim",
    input: { now: NOW, units: portfolioUnits, claims: [], request: claimRequest("W1 R0 P3", "foreman-a") },
    expected: { result: "refused", refusal: "not-ready" },
  },
  {
    id: "WSF-016",
    group: "claims",
    title: "A live claim refuses a second claimant",
    rules: ["WORK-RULE-022"],
    kind: "claim",
    input: { now: NOW, units: portfolioUnits, claims: portfolioClaims, request: claimRequest("W1 R0 P5", "foreman-b") },
    expected: { result: "refused", refusal: "already-claimed" },
  },
  {
    id: "WSF-017",
    group: "claims",
    title: "The holder renews its own claim",
    rules: ["WORK-RULE-023"],
    kind: "claim",
    input: {
      now: NOW,
      units: portfolioUnits,
      claims: portfolioClaims,
      // W29 R0 P4 T13: a renewal names the claim ID.
      request: claimRequest("W1 R0 P5", "builder-a", { taskHandle: "builder-a-task-1", claimId: claimIdFor("p5") }),
    },
    expected: { result: "renewed", refusal: null },
  },
  {
    id: "WSF-018",
    group: "claims",
    title: "An expired claim needs a handle check before takeover",
    rules: ["WORK-RULE-023"],
    kind: "claim",
    input: { now: NOW, units: portfolioUnits, claims: portfolioClaims, request: claimRequest("W1 R0 P7", "foreman-b") },
    expected: { result: "refused", refusal: "takeover-needs-handle-check" },
  },
  {
    id: "WSF-019",
    group: "claims",
    title: "A takeover waits while the old task still runs",
    rules: ["WORK-RULE-023"],
    kind: "claim",
    input: {
      now: NOW,
      units: portfolioUnits,
      claims: portfolioClaims,
      request: claimRequest("W1 R0 P7", "foreman-b", {
        takeover: { previousClaimId: claimIdFor("p7"), handleObservation: "running" },
      }),
    },
    expected: { result: "refused", refusal: "previous-holder-still-working" },
  },
  {
    id: "WSF-020",
    group: "claims",
    title: "An expired claim can be taken over after the handle shows the old task stopped",
    rules: ["WORK-RULE-023"],
    kind: "claim",
    input: {
      now: NOW,
      units: portfolioUnits,
      claims: portfolioClaims,
      request: claimRequest("W1 R0 P7", "foreman-b", {
        takeover: { previousClaimId: claimIdFor("p7"), handleObservation: "stopped" },
      }),
    },
    expected: { result: "claimed", refusal: null },
  },
  {
    id: "WSF-021",
    group: "claims",
    title: "A claim on a phase refuses another claimant's claim on its parent",
    rules: ["WORK-RULE-022"],
    kind: "claim",
    input: { now: NOW, units: portfolioUnits, claims: portfolioClaims, request: claimRequest("W1 R0", "foreman-b") },
    expected: { result: "refused", refusal: "descendant-claimed" },
  },
  {
    id: "WSF-022",
    group: "claims",
    title: "Tasks in a claimed phase wait for other claimants",
    rules: ["WORK-RULE-020", "WORK-RULE-022"],
    kind: "readiness",
    input: {
      now: NOW,
      claimant: "foreman-b",
      query: TASK_QUERY,
      units: [unit("wave", "W1"), unit("revision", "W1 R0"), unit("phase", "W1 R0 P5"), unit("task", "W1 R0 P5 T1")],
      claims: [claim("p5", "W1 R0 P5", "builder-a")],
      conflicts: [],
    },
    expected: { ready: [], waiting: [{ coordinate: "W1 R0 P5 T1", reasons: ["ancestor-claimed"] }] },
  },
  {
    id: "WSF-023",
    group: "claims",
    title: "Tasks in a claimed phase are ready for the claimant that holds it",
    rules: ["WORK-RULE-020", "WORK-RULE-022"],
    kind: "readiness",
    input: {
      now: NOW,
      claimant: "builder-a",
      query: TASK_QUERY,
      units: [unit("wave", "W1"), unit("revision", "W1 R0"), unit("phase", "W1 R0 P5"), unit("task", "W1 R0 P5 T1")],
      claims: [claim("p5", "W1 R0 P5", "builder-a")],
      conflicts: [],
    },
    expected: { ready: ["W1 R0 P5 T1"], waiting: [] },
  },
  {
    id: "WSF-024",
    group: "mixed portfolio",
    title: "A task in Stage 2 waits while Stage 2 waits for Stage 1",
    rules: ["WORK-RULE-032", "WORK-RULE-020"],
    kind: "readiness",
    input: { now: NOW, claimant: null, query: TASK_QUERY, units: stagedUnits, claims: [], conflicts: [] },
    expected: { ready: ["W1 R0 P2 T1"], waiting: [{ coordinate: "W1 R0 P2 T2", reasons: ["ancestor-waiting"] }] },
  },
  {
    id: "WSF-025",
    group: "mixed portfolio",
    title: "A dependency closed as cancelled keeps the unit waiting",
    rules: ["WORK-RULE-020"],
    kind: "readiness",
    input: {
      now: NOW,
      claimant: null,
      query: PHASE_QUERY,
      units: [
        unit("wave", "W1"),
        unit("revision", "W1 R0"),
        cancelled(unit("phase", "W1 R0 P1")),
        unit("phase", "W1 R0 P2", { dependsOn: ["W1 R0 P1"] }),
      ],
      claims: [],
      conflicts: [],
    },
    expected: { ready: [], waiting: [{ coordinate: "W1 R0 P2", reasons: ["dependency-cancelled"] }] },
  },
  {
    id: "WSF-026",
    group: "dependency bullets",
    title: "A phase and stage in another phase of the same revision",
    rules: ["WORK-RULE-031"],
    kind: "dependency",
    input: { unitCoordinate: "W28 R0 P3", bullet: "P2 Stage 3 is complete.", existing: ["W28 R0 P2 S3"] },
    expected: { dependencies: ["W28 R0 P2 S3"], unresolved: [], gate: false, reference: false, none: false },
  },
  {
    id: "WSF-027",
    group: "dependency bullets",
    title: "A range and a list of phases",
    rules: ["WORK-RULE-031"],
    kind: "dependency",
    input: {
      unitCoordinate: "W28 R0 P4",
      bullet: "P1 to P3 and P5 are complete.",
      existing: ["W28 R0 P1", "W28 R0 P2", "W28 R0 P3", "W28 R0 P5"],
    },
    expected: { dependencies: ["W28 R0 P1", "W28 R0 P2", "W28 R0 P3", "W28 R0 P5"], unresolved: [], gate: false, reference: false, none: false },
  },
  {
    id: "WSF-028",
    group: "dependency bullets",
    title: "Stage ranges with through and a dash resolve in the same phase",
    rules: ["WORK-RULE-031"],
    kind: "dependency",
    input: {
      unitCoordinate: "W23 R0 P5 S4",
      bullet: "Stages 1–3.",
      existing: ["W23 R0 P5 S1", "W23 R0 P5 S2", "W23 R0 P5 S3"],
    },
    expected: { dependencies: ["W23 R0 P5 S1", "W23 R0 P5 S2", "W23 R0 P5 S3"], unresolved: [], gate: false, reference: false, none: false },
  },
  {
    id: "WSF-029",
    group: "dependency bullets",
    title: "A bare task in the older lower-case form resolves in the same phase",
    rules: ["WORK-RULE-031"],
    kind: "dependency",
    input: { unitCoordinate: "W22 R0 P9 T3", bullet: "t2", existing: ["W22 R0 P9 T2"] },
    expected: { dependencies: ["W22 R0 P9 T2"], unresolved: [], gate: false, reference: false, none: false },
  },
  {
    id: "WSF-030",
    group: "dependency bullets",
    title: "An owner approval is a gate",
    rules: ["WORK-RULE-031"],
    kind: "dependency",
    input: { unitCoordinate: "W23 R0 P2", bullet: "The owner approves this package.", existing: [] },
    expected: { dependencies: [], unresolved: [], gate: true, reference: false, none: false },
  },
  {
    id: "WSF-031",
    group: "dependency bullets",
    title: "A file path is a reference, not a dependency or a gate",
    rules: ["WORK-RULE-031"],
    kind: "dependency",
    input: { unitCoordinate: "W22 R0 P9", bullet: "`packages/cli/src/cli.ts`", existing: [] },
    expected: { dependencies: [], unresolved: [], gate: false, reference: true, none: false },
  },
  {
    id: "WSF-032",
    group: "unresolved dependencies",
    title: "A phase that does not exist is unresolved",
    rules: ["WORK-RULE-016", "WORK-RULE-031"],
    kind: "dependency",
    input: { unitCoordinate: "W1 R0 P1", bullet: "P9 is complete.", existing: ["W1 R0 P2"] },
    expected: { dependencies: [], unresolved: ["W1 R0 P9"], gate: false, reference: false, none: false },
  },
  {
    id: "WSF-033",
    group: "report and close",
    title: "A claimant that lost its claim cannot report",
    rules: ["WORK-RULE-024"],
    kind: "update",
    input: {
      now: NOW,
      units: portfolioUnits,
      claims: [claim("p5-new", "W1 R0 P5", "foreman-b")],
      request: { report: reportRequest("W1 R0 P5", "p5", { status: "in-progress" }) },
    },
    expected: { accepted: false, refusal: "not-claim-holder", parentClosed: false, readyAfter: [] },
  },
  {
    id: "WSF-034",
    group: "report and close",
    title: "Closing the last task does not close its phase",
    rules: ["WORK-RULE-025"],
    kind: "update",
    input: {
      now: NOW,
      units: [
        unit("wave", "W1"),
        unit("revision", "W1 R0"),
        unit("phase", "W1 R0 P2"),
        unit("task", "W1 R0 P2 T1", { status: "closed" }),
        unit("task", "W1 R0 P2 T2"),
      ],
      claims: [claim("t2", "W1 R0 P2 T2", "builder-a")],
      request: { close: { unitStoreId: storeIdFor("W1 R0 P2 T2"), claimId: claimIdFor("t2"), outcome: "done", expectedVersion: 1 } },
    },
    expected: { accepted: true, refusal: null, parentClosed: false, readyAfter: [] },
  },
  {
    id: "WSF-035",
    group: "report and close",
    title: "A stale version is refused",
    rules: ["WORK-RULE-024"],
    kind: "update",
    input: {
      now: NOW,
      units: portfolioUnits,
      claims: portfolioClaims,
      request: { report: reportRequest("W1 R0 P5", "p5", { note: "Halfway", expectedVersion: 7 }) },
    },
    expected: { accepted: false, refusal: "version-conflict", parentClosed: false, readyAfter: [] },
  },
  {
    id: "WSF-036",
    group: "report and close",
    title: "A person records a met gate without a claim, and the unit becomes ready",
    rules: ["WORK-RULE-024", "WORK-RULE-031"],
    kind: "update",
    input: {
      now: NOW,
      units: portfolioUnits,
      claims: [],
      request: { report: reportRequest("W1 R0 P11", null, { metGates: ["The owner approves this package."] }) },
    },
    expected: { accepted: true, refusal: null, parentClosed: false, readyAfter: ["W1 R0 P11"] },
  },
  {
    id: "WSF-037",
    group: "claims",
    title: "Releasing a claim makes its unit ready again",
    rules: ["WORK-RULE-026"],
    kind: "update",
    input: {
      now: NOW,
      units: portfolioUnits,
      claims: portfolioClaims,
      request: { release: { unitStoreId: storeIdFor("W1 R0 P5"), claimId: claimIdFor("p5"), expectedVersion: 1 } },
    },
    expected: { accepted: true, refusal: null, parentClosed: false, readyAfter: ["W1 R0 P5"] },
  },
  {
    id: "WSF-038",
    group: "current repository backlogs",
    title: "Every work operation syncs first",
    rules: ["WORK-RULE-013"],
    kind: "operations",
    input: { operations: "all" },
    expected: { syncFirst: true },
  },
  {
    id: "WSF-039",
    group: "tracker and config",
    title: "The default work block turns copies on and uses the local store",
    rules: ["WORK-RULE-005", "WORK-RULE-028", "WORK-RULE-030"],
    kind: "config",
    input: { work: {} },
    expected: { valid: true },
  },
  {
    id: "WSF-040",
    group: "tracker and config",
    title: "Copies off is a valid setting",
    rules: ["WORK-RULE-008"],
    kind: "config",
    input: { work: { projection: "off" } },
    expected: { valid: true },
  },
  {
    id: "WSF-041",
    group: "tracker and config",
    title: "State fields are refused in the work block",
    rules: ["WORK-RULE-029"],
    kind: "config",
    input: { work: { projection: "on", lastAppliedDigest: "c".repeat(64) } },
    expected: { valid: false },
  },
  {
    id: "WSF-042",
    group: "tracker and config",
    title: "A field map value must be a field name",
    rules: ["WORK-RULE-029"],
    kind: "config",
    input: { work: { tracker: { connection: "local", fieldMap: { unit: "api_key=abc" } } } },
    expected: { valid: false },
  },
  {
    id: "WSF-043",
    group: "tracker and config",
    title: "Only the local connection is accepted today",
    rules: ["WORK-RULE-030"],
    kind: "config",
    input: { work: { tracker: { connection: "other-tracker" } } },
    expected: { valid: false },
  },
  {
    id: "WSF-044",
    group: "claims",
    title: "An expired claim with no task handle needs a person to release it",
    rules: ["WORK-RULE-023"],
    kind: "claim",
    input: {
      now: NOW,
      units: portfolioUnits,
      claims: [{ ...claim("p7", "W1 R0 P7", "builder-b", EARLIER), taskHandle: null }],
      request: claimRequest("W1 R0 P7", "foreman-b", {
        takeover: { previousClaimId: claimIdFor("p7"), handleObservation: "no-handle" },
      }),
    },
    expected: { result: "refused", refusal: "no-handle-to-check" },
  },
  {
    id: "WSF-045",
    group: "report and close",
    title: "A person closes an unclaimed unit whose dependency was cancelled",
    rules: ["WORK-RULE-024", "WORK-RULE-025"],
    kind: "update",
    input: {
      now: NOW,
      units: [
        unit("wave", "W1"),
        unit("revision", "W1 R0"),
        cancelled(unit("phase", "W1 R0 P1")),
        unit("phase", "W1 R0 P2", { dependsOn: ["W1 R0 P1"] }),
      ],
      claims: [],
      request: { close: { unitStoreId: storeIdFor("W1 R0 P2"), claimId: null, outcome: "superseded", expectedVersion: 1 } },
    },
    expected: { accepted: true, refusal: null, parentClosed: false, readyAfter: [] },
  },
  {
    id: "WSF-046",
    group: "report and close",
    title: "A caller without the claim cannot close a claimed unit",
    rules: ["WORK-RULE-024", "WORK-RULE-025"],
    kind: "update",
    input: {
      now: NOW,
      units: portfolioUnits,
      claims: portfolioClaims,
      request: { close: { unitStoreId: storeIdFor("W1 R0 P5"), claimId: null, outcome: "done", expectedVersion: 1 } },
    },
    expected: { accepted: false, refusal: "not-claim-holder", parentClosed: false, readyAfter: [] },
  },
  {
    id: "WSF-047",
    group: "report and close",
    title: "Clearing the last blocker reopens the unit",
    rules: ["WORK-RULE-024"],
    kind: "update",
    input: {
      now: NOW,
      units: portfolioUnits,
      claims: [],
      request: { report: reportRequest("W1 R0 P4", null, { clearBlockers: true }) },
    },
    expected: { accepted: true, refusal: null, parentClosed: false, readyAfter: ["W1 R0 P4"] },
  },
  {
    id: "WSF-048",
    group: "dependency bullets",
    title: "None holds nothing",
    rules: ["WORK-RULE-031"],
    kind: "dependency",
    input: { unitCoordinate: "W23 R0 P1", bullet: "None.", existing: [] },
    expected: { dependencies: [], unresolved: [], gate: false, reference: false, none: true },
  },
  {
    id: "WSF-049",
    group: "dependency bullets",
    title: "Parallel with a stage holds nothing",
    rules: ["WORK-RULE-031"],
    kind: "dependency",
    input: { unitCoordinate: "W23 R0 P5 S2", bullet: "None (parallel with Stage 1).", existing: ["W23 R0 P5 S1"] },
    expected: { dependencies: [], unresolved: [], gate: false, reference: false, none: true },
  },
  {
    id: "WSF-050",
    group: "dependency bullets",
    title: "Phase words and a hyphen range",
    rules: ["WORK-RULE-031"],
    kind: "dependency",
    input: {
      unitCoordinate: "W19 R0 P5",
      bullet: "Phases 1 through 4.",
      existing: ["W19 R0 P1", "W19 R0 P2", "W19 R0 P3", "W19 R0 P4"],
    },
    expected: { dependencies: ["W19 R0 P1", "W19 R0 P2", "W19 R0 P3", "W19 R0 P4"], unresolved: [], gate: false, reference: false, none: false },
  },
  {
    id: "WSF-051",
    group: "dependency bullets",
    title: "Stages with a hyphen range",
    rules: ["WORK-RULE-031"],
    kind: "dependency",
    input: { unitCoordinate: "W19 R0 P5 S4", bullet: "Stages 1-3.", existing: ["W19 R0 P5 S1", "W19 R0 P5 S2", "W19 R0 P5 S3"] },
    expected: { dependencies: ["W19 R0 P5 S1", "W19 R0 P5 S2", "W19 R0 P5 S3"], unresolved: [], gate: false, reference: false, none: false },
  },
  {
    id: "WSF-052",
    group: "dependency bullets",
    title: "A coordinate with a further condition is a gate",
    rules: ["WORK-RULE-031"],
    kind: "dependency",
    input: { unitCoordinate: "W22 R0 P9", bullet: "The owner approved P8 Stage 1 for release.", existing: ["W22 R0 P8 S1"] },
    expected: { dependencies: [], unresolved: [], gate: true, reference: false, none: false },
  },
  {
    id: "WSF-053",
    group: "quick item",
    title: "A new quick item gets the next number, after closed and cancelled ones",
    rules: ["WORK-RULE-019"],
    kind: "add",
    input: {
      units: [
        unit("quick-item", "1", { status: "closed" }),
        cancelled(unit("quick-item", "2")),
        unit("quick-item", "10", { title: "Book the venue" }),
        unit("phase", "W1 R0 P2"),
      ],
      request: { title: "Compare two printers", body: null, links: [] },
    },
    expected: { coordinate: "11" },
  },
  {
    id: "WSF-054",
    group: "quick item",
    title: "Quick item URIs name the project, use plain numbers, and accept any letter case",
    rules: ["WORK-RULE-038"],
    kind: "project-uri",
    input: {
      uris: [
        "make-docs://project/make-docs/tasks/",
        "make-docs://project/make-docs/tasks",
        "make-docs://project/Make-Docs/TASKS/7",
        "make-docs://project/831ddb50-b97a-47e2-9f2c-f491b27b8759/tasks/10",
        "make-docs://project/make-docs/tasks/07",
        "make-docs://project/make-docs/tasks/0",
        "make-docs://project/make-docs/tasks/7?x=1",
        "make-docs://project/make-docs/tasks/7#top",
        "make-docs://project/make-docs/tasks/7/notes",
        "make-docs://project/make-docs/tasks/Q7",
        "make-docs://project/tasks/7",
        "make-docs://project/quick/7",
        "make-docs://project/2fast/tasks/",
        "make-docs://system/make-docs/tasks/7",
      ],
    },
    expected: {
      canonical: [
        "make-docs://project/make-docs/tasks/",
        "make-docs://project/make-docs/tasks/",
        "make-docs://project/make-docs/tasks/7",
        "make-docs://project/831ddb50-b97a-47e2-9f2c-f491b27b8759/tasks/10",
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
      ],
    },
  },
  {
    id: "WSF-055",
    group: "current repository backlogs",
    title: "Backlog URIs walk the coordinate one part at a time",
    rules: ["WORK-RULE-039"],
    kind: "project-uri",
    input: {
      uris: [
        "make-docs://project/make-docs/backlog",
        "make-docs://project/make-docs/backlog/w29",
        "make-docs://project/make-docs/backlog/W29/R0",
        "make-docs://project/make-docs/backlog/W29/R0/P1",
        "make-docs://project/make-docs/backlog/w29/r0/p1/s2/",
        "make-docs://project/make-docs/backlog/W29/R0/P1/t3",
        "make-docs://project/make-docs/backlog/W29/R0/P1/S2/T3",
        "make-docs://project/make-docs/backlog/W29/P1",
        "make-docs://project/make-docs/backlog/W029/R0",
        "make-docs://project/make-docs/backlog/W0",
        "make-docs://project/make-docs/backlog/W29/R0/P0",
        "make-docs://project/make-docs/backlog/W29/R0/P1/Q3",
      ],
    },
    expected: {
      canonical: [
        "make-docs://project/make-docs/backlog/",
        "make-docs://project/make-docs/backlog/W29/",
        "make-docs://project/make-docs/backlog/W29/R0/",
        "make-docs://project/make-docs/backlog/W29/R0/P1/",
        "make-docs://project/make-docs/backlog/W29/R0/P1/S2",
        "make-docs://project/make-docs/backlog/W29/R0/P1/T3",
        null,
        null,
        null,
        null,
        null,
        null,
      ],
    },
  },
  {
    id: "WSF-057",
    group: "current repository backlogs",
    title: "A phase with no status line and every task checked counts as done; a status line decides when present",
    rules: ["WORK-RULE-040", "WORK-RULE-020"],
    kind: "readiness",
    input: {
      now: NOW,
      claimant: null,
      query: PHASE_QUERY,
      units: [
        unit("wave", "W1"),
        unit("revision", "W1 R0"),
        unit("phase", "W1 R0 P1", { recordedStatus: null }),
        unit("task", "W1 R0 P1 T1", { status: "closed" }),
        unit("task", "W1 R0 P1 T2", { status: "closed" }),
        unit("phase", "W1 R0 P2", { dependsOn: ["W1 R0 P1"] }),
        unit("phase", "W1 R0 P3", { recordedStatus: null }),
        unit("task", "W1 R0 P3 T1", { status: "closed" }),
        unit("task", "W1 R0 P3 T2"),
        unit("phase", "W1 R0 P4", { recordedStatus: null }),
        unit("phase", "W1 R0 P5"),
        unit("task", "W1 R0 P5 T1", { status: "closed" }),
      ],
      claims: [],
      conflicts: [],
    },
    expected: { ready: ["W1 R0 P2", "W1 R0 P3", "W1 R0 P4", "W1 R0 P5"], waiting: [] },
  },
  {
    id: "WSF-056",
    group: "claims",
    title: "The claimant name alone neither renews a claim nor shows its claim ID",
    rules: ["WORK-RULE-022", "WORK-RULE-023", "WORK-RULE-050"],
    kind: "claim",
    input: { now: NOW, units: portfolioUnits, claims: portfolioClaims, request: claimRequest("W1 R0 P5", "builder-a") },
    expected: { result: "refused", refusal: "already-claimed" },
  },

  /* W29 R0 P5 T9: parity fixtures for the sync rules that W29 R0 P3 and P4 added. */
  {
    id: "WSF-058",
    group: "conflict",
    title: "Both sides changed to the same work, so there is no conflict",
    rules: ["WORK-RULE-041"],
    kind: "sync-scenario",
    input: { scenario: "same-work-on-both-sides" },
    expected: { action: "adopted", conflictKind: null, changedFiles: false },
  },
  {
    id: "WSF-059",
    group: "current repository backlogs",
    title: "A backlog moved to the archive keeps its units",
    rules: ["WORK-RULE-042"],
    kind: "sync-scenario",
    input: { scenario: "archive-move" },
    expected: { action: "moved", conflictKind: null, changedFiles: false },
  },
  {
    id: "WSF-060",
    group: "current repository backlogs",
    title: "A task that a person removed from its file is deleted and named",
    rules: ["WORK-RULE-043"],
    kind: "sync-scenario",
    input: { scenario: "unit-leaves-file" },
    expected: { action: "imported", conflictKind: null, changedFiles: false },
  },
  {
    id: "WSF-061",
    group: "conflict",
    title: "A file edit that checks a claimed task stops as a claimed conflict",
    rules: ["WORK-RULE-044", "WORK-RULE-050"],
    kind: "sync-scenario",
    input: { scenario: "file-closes-claimed-unit" },
    expected: { action: "conflict", conflictKind: "claimed", changedFiles: false },
  },
  {
    id: "WSF-062",
    group: "conflict",
    title: "A held file is read and never written",
    rules: ["WORK-RULE-045"],
    kind: "sync-scenario",
    input: { scenario: "held-path" },
    expected: { action: "held", conflictKind: null, changedFiles: false },
  },
  {
    id: "WSF-063",
    group: "conflict",
    title: "Keep the store rewrites the file of a both-changed conflict",
    rules: ["WORK-RULE-046"],
    kind: "sync-scenario",
    input: { scenario: "settle-keep-store" },
    expected: { action: "written", conflictKind: null, changedFiles: true },
  },
  {
    id: "WSF-064",
    group: "folder without git",
    title: "The first sync of a second checkout writes nothing and names the next writes",
    rules: ["WORK-RULE-047", "WORK-RULE-015"],
    kind: "sync-scenario",
    input: { scenario: "first-sync-of-a-checkout" },
    expected: { action: "deferred", conflictKind: null, changedFiles: false },
  },
  {
    id: "WSF-065",
    group: "tracker and config",
    title: "With copies off, a changed copy is imported and kept, and the next sync removes it",
    rules: ["WORK-RULE-048"],
    kind: "sync-scenario",
    input: { scenario: "changed-copy-with-copies-off" },
    expected: { action: "imported", conflictKind: null, changedFiles: true },
  },
  {
    id: "WSF-066",
    group: "current repository backlogs",
    title: "Work next names a pending import and changes nothing",
    rules: ["WORK-RULE-052"],
    kind: "sync-scenario",
    input: { scenario: "read-only-check" },
    expected: { action: "none", conflictKind: null, changedFiles: false },
  },
  {
    id: "WSF-067",
    group: "dependency bullets",
    title: "A bullet that adds only the phase's own title is a dependency",
    rules: ["WORK-RULE-049", "WORK-RULE-031"],
    kind: "dependency",
    input: {
      unitCoordinate: "W10 R1 P2",
      bullet: "Phase 1 trace and scope.",
      existing: ["W10 R1 P1"],
      titles: { "W10 R1 P1": "Phase 1: Trace and Scope" },
    },
    expected: { dependencies: ["W10 R1 P1"], unresolved: [], gate: false, reference: false, none: false },
  },
  {
    id: "WSF-068",
    group: "report and close",
    title: "The holder records a short progress note",
    rules: ["WORK-RULE-051", "WORK-RULE-024"],
    kind: "update",
    input: {
      now: NOW,
      units: portfolioUnits,
      claims: portfolioClaims,
      request: { report: reportRequest("W1 R0 P5", "p5", { note: "The parser reads every front matter field." }) },
    },
    expected: { accepted: true, refusal: null, parentClosed: false, readyAfter: [] },
  },
  {
    id: "WSF-069",
    group: "tracker and config",
    title: "Export refuses the work folder and writes only to a new folder that the caller names",
    rules: ["WORK-RULE-054"],
    kind: "sync-scenario",
    input: { scenario: "export-to-named-folder" },
    expected: { action: "none", conflictKind: null, changedFiles: false },
  },
  {
    id: "WSF-070",
    group: "report and close",
    title: "A note of 257 characters is refused before sync, and nothing changes",
    rules: ["WORK-RULE-051"],
    kind: "report-scenario",
    input: { scenario: "note-too-long" },
    expected: { accepted: false, latestNote: null, storeOnlyEditKinds: [] },
  },
  {
    id: "WSF-071",
    group: "report and close",
    title: "A new note replaces the last one",
    rules: ["WORK-RULE-051"],
    kind: "report-scenario",
    input: { scenario: "note-replaces-last" },
    expected: { accepted: true, latestNote: "Second note.", storeOnlyEditKinds: [] },
  },
  {
    id: "WSF-072",
    group: "report and close",
    title: "A status that the file cannot show stays in the store, and the report names it",
    rules: ["WORK-RULE-051"],
    kind: "report-scenario",
    input: { scenario: "store-only-edit-named" },
    expected: { accepted: true, latestNote: null, storeOnlyEditKinds: ["status"] },
  },
  {
    id: "WSF-073",
    group: "checkpoint",
    title: "The first direct run of a checkout imports every work file, writes none, and says that it was the first sync",
    rules: ["WORK-RULE-055", "WORK-RULE-056", "WORK-RULE-065"],
    kind: "checkpoint-scenario",
    input: { scenario: "first-direct-run" },
    expected: { authority: "store", syncRan: true, syncSkipped: null, nothingDue: false, quiet: false, firstSync: true, imported: 3, written: 0, waiting: 0, conflicts: 0, claims: [], next: ["W1 R0 P1", "W1 R0 P2"], changedFiles: false },
  },
  {
    id: "WSF-074",
    group: "checkpoint",
    title: "A second direct run right after the first changes nothing and says that nothing is due",
    rules: ["WORK-RULE-055", "WORK-RULE-056", "WORK-RULE-059", "WORK-RULE-062"],
    kind: "checkpoint-scenario",
    input: { scenario: "repeat-direct-run" },
    expected: { authority: "store", syncRan: true, syncSkipped: null, nothingDue: true, quiet: false, firstSync: false, imported: 0, written: 0, waiting: 0, conflicts: 0, claims: [], next: ["W1 R0 P1", "W1 R0 P2"], changedFiles: false },
  },
  {
    id: "WSF-075",
    group: "checkpoint",
    title: "A direct run imports a changed file and writes a store change, as work sync does",
    rules: ["WORK-RULE-056"],
    kind: "checkpoint-scenario",
    input: { scenario: "direct-run-both-ways" },
    expected: { authority: "store", syncRan: true, syncSkipped: null, nothingDue: false, quiet: false, firstSync: false, imported: 1, written: 1, waiting: 0, conflicts: 0, claims: [], next: ["W1 R0 P1", "W1 R0 P2"], changedFiles: true },
  },
  {
    id: "WSF-076",
    group: "checkpoint",
    title: "A trigger run imports a changed file, writes no file, and names the file that waits for a direct run",
    rules: ["WORK-RULE-057"],
    kind: "checkpoint-scenario",
    input: { scenario: "trigger-run-imports-only" },
    expected: { authority: "store", syncRan: true, syncSkipped: null, nothingDue: false, quiet: false, firstSync: false, imported: 1, written: 0, waiting: 1, conflicts: 0, claims: [], next: ["W1 R0 P1", "W1 R0 P2"], changedFiles: false },
  },
  {
    id: "WSF-077",
    group: "checkpoint",
    title: "A trigger run with nothing due is quiet, also with ready work",
    rules: ["WORK-RULE-059"],
    kind: "checkpoint-scenario",
    input: { scenario: "trigger-run-nothing-due" },
    expected: { authority: "store", syncRan: true, syncSkipped: null, nothingDue: true, quiet: true, firstSync: false, imported: 0, written: 0, waiting: 0, conflicts: 0, claims: [], next: ["W1 R0 P1", "W1 R0 P2"], changedFiles: false },
  },
  {
    id: "WSF-078",
    group: "checkpoint",
    title: "A trigger run after a branch change imports nothing and says how many files wait",
    rules: ["WORK-RULE-058"],
    kind: "checkpoint-scenario",
    input: { scenario: "branch-change" },
    expected: { authority: "store", syncRan: false, syncSkipped: "branch-change", nothingDue: false, quiet: false, firstSync: false, imported: 0, written: 0, waiting: 1, conflicts: 0, claims: [], next: ["W1 R0 P1", "W1 R0 P2"], changedFiles: false },
  },
  {
    id: "WSF-079",
    group: "checkpoint",
    title: "The checkpoint names a conflict with its settle commands and does not settle it",
    rules: ["WORK-RULE-060"],
    kind: "checkpoint-scenario",
    input: { scenario: "conflict" },
    expected: { authority: "store", syncRan: true, syncSkipped: null, nothingDue: false, quiet: false, firstSync: false, imported: 0, written: 0, waiting: 0, conflicts: 1, claims: [], next: ["W1 R0 P1"], changedFiles: false },
  },
  {
    id: "WSF-080",
    group: "checkpoint",
    title: "A claim that ended is listed with no claim ID, and it is not due",
    rules: ["WORK-RULE-061", "WORK-RULE-059"],
    kind: "checkpoint-scenario",
    input: { scenario: "claim-ended" },
    expected: { authority: "store", syncRan: true, syncSkipped: null, nothingDue: true, quiet: false, firstSync: false, imported: 0, written: 0, waiting: 0, conflicts: 0, claims: ["ended"], next: ["W1 R0 P1", "W1 R0 P2"], changedFiles: false },
  },
  {
    id: "WSF-081",
    group: "checkpoint",
    title: "A caller with read access only gets the read steps, and the sync does not run",
    rules: ["WORK-RULE-063"],
    kind: "checkpoint-scenario",
    input: { scenario: "read-access-only" },
    expected: { authority: "store", syncRan: false, syncSkipped: "read-access-only", nothingDue: false, quiet: false, firstSync: false, imported: 0, written: 0, waiting: 1, conflicts: 0, claims: [], next: ["W1 R0 P1", "W1 R0 P2"], changedFiles: false },
  },
  {
    id: "WSF-082",
    group: "checkpoint",
    title: "Without a Store the files are the authority, and the checkpoint syncs nothing",
    rules: ["WORK-RULE-064"],
    kind: "checkpoint-scenario",
    input: { scenario: "no-store" },
    expected: { authority: "files", syncRan: false, syncSkipped: "files-authority", nothingDue: true, quiet: false, firstSync: false, imported: 0, written: 0, waiting: 0, conflicts: 0, claims: [], next: [], changedFiles: false },
  },
  {
    id: "WSF-083",
    group: "checkpoint",
    title: "In a folder that is not a Make Docs project the checkpoint does nothing",
    rules: ["WORK-RULE-064"],
    kind: "checkpoint-scenario",
    input: { scenario: "not-a-project" },
    expected: { authority: "not-a-project", syncRan: false, syncSkipped: "not-a-project", nothingDue: true, quiet: false, firstSync: false, imported: 0, written: 0, waiting: 0, conflicts: 0, claims: [], next: [], changedFiles: false },
  },
  {
    id: "WSF-084",
    group: "checkpoint",
    title: "When nothing waits for import, the read commands name no checkpoint and mark no unit",
    rules: ["WORK-RULE-066", "WORK-RULE-067", "WORK-RULE-068"],
    kind: "read-wait-scenario",
    input: { scenario: "nothing-waits" },
    expected: { checkpointFirst: false, filesWaiting: 0, markedPhases: [], listComplete: true, uriSentence: false, changed: false },
  },
  {
    id: "WSF-085",
    group: "checkpoint",
    title: "With one changed work file, the read commands name the checkpoint first, and work next marks the units of that file",
    rules: ["WORK-RULE-066", "WORK-RULE-067"],
    kind: "read-wait-scenario",
    input: { scenario: "one-file-changed" },
    expected: { checkpointFirst: true, filesWaiting: 1, markedPhases: ["W1 R0 P1"], listComplete: true, uriSentence: false, changed: false },
  },
  {
    id: "WSF-086",
    group: "checkpoint",
    title: "With a new work file that the store does not hold, work next says that the list is not complete",
    rules: ["WORK-RULE-068"],
    kind: "read-wait-scenario",
    input: { scenario: "new-file" },
    expected: { checkpointFirst: true, filesWaiting: 1, markedPhases: [], listComplete: false, uriSentence: false, changed: false },
  },
  {
    id: "WSF-087",
    group: "checkpoint",
    title: "In a checkout whose first sync is not done, work next says that the list is not complete",
    rules: ["WORK-RULE-068"],
    kind: "read-wait-scenario",
    input: { scenario: "first-sync-not-done" },
    expected: { checkpointFirst: true, filesWaiting: 3, markedPhases: [], listComplete: false, uriSentence: false, changed: false },
  },
  {
    id: "WSF-088",
    group: "checkpoint",
    title: "A backlog read by project URI runs no sync check and carries the fixed sentence",
    rules: ["WORK-RULE-069"],
    kind: "read-wait-scenario",
    input: { scenario: "backlog-uri-read" },
    expected: { checkpointFirst: false, filesWaiting: 1, markedPhases: [], listComplete: true, uriSentence: true, changed: false },
  },
];
