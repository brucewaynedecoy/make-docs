import { existsSync, lstatSync, readFileSync } from "node:fs";
import path from "node:path";
import { parseDocument } from "yaml";
import { OperationError } from "../operations/types";
import { assertManagedPathHasNoSymlinks } from "../utils";
import type { StoreDatabase } from "./database";

/**
 * The project register (W32 R0 P3; PRD 38 R-REGISTER-1 to R-REGISTER-4,
 * R-ID-8).
 *
 * `project_register` holds one row for each project that the Store knows:
 * project ID, project name, first seen time, and last seen time. Each Store
 * write for a project calls {@link recordProjectInRegister} in the same
 * transaction as its own rows. The legacy `projects` table is a read-only
 * legacy input and is never read here.
 */

export const PROJECT_NAME_MAX_LENGTH = 64;
const PROJECT_NAME_PATTERN = /^[a-z][a-z0-9-]*$/;
/** The form of a minted project ID. A name in this form is refused (R-ID-8). */
const PROJECT_ID_FORM = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CONFIG_RELATIVE_PATH = ".make-docs/config.yaml";

/** Why a `projectName` value breaks the R-ID-8 form, or null when it is valid. */
export function projectNameProblem(value: unknown): string | null {
  if (typeof value !== "string") return "projectName must be text.";
  if (value.length < 1 || value.length > PROJECT_NAME_MAX_LENGTH) {
    return `projectName must have 1 to ${PROJECT_NAME_MAX_LENGTH} characters.`;
  }
  if (!PROJECT_NAME_PATTERN.test(value)) {
    return "projectName must use lower-case letters, digits, and hyphens, and start with a letter.";
  }
  if (PROJECT_ID_FORM.test(value)) return "projectName must not look like a project ID.";
  return null;
}

/** Typed refusal: the config `projectName` cannot be recorded. */
export class ProjectNameInvalidError extends OperationError {
  readonly code = "project-name-invalid";
  readonly reason: string;
  readonly nextAction: string;
  readonly details: { projectName: string | null; configPath: string };

  constructor(configPath: string, projectName: string | null, reason: string) {
    const nextAction = "Correct projectName in .make-docs/config.yaml, then run the command again.";
    super(`${reason} Make Docs refused this Store write. ${nextAction}`);
    this.name = "ProjectNameInvalidError";
    this.reason = reason;
    this.nextAction = nextAction;
    this.details = { projectName, configPath };
  }
}

/** Typed refusal: another project in this Store holds the name (R-ID-8). */
export class ProjectNameTakenError extends OperationError {
  readonly code = "project-name-taken";
  readonly reason: string;
  readonly nextAction: string;
  readonly details: {
    projectName: string;
    projectId: string;
    holderProjectId: string;
    holderCheckouts: string[];
  };

  constructor(projectName: string, projectId: string, holderProjectId: string, holderCheckouts: string[]) {
    const where = holderCheckouts.length ? ` Its checkout: ${holderCheckouts.join(", ")}.` : "";
    const reason = `The project name "${projectName}" belongs to another project in this Store: project ${holderProjectId}.${where}`;
    const nextAction = "Choose another projectName in .make-docs/config.yaml, then run the command again.";
    super(`${reason} Make Docs refused this Store write. ${nextAction}`);
    this.name = "ProjectNameTakenError";
    this.reason = reason;
    this.nextAction = nextAction;
    this.details = { projectName, projectId, holderProjectId, holderCheckouts };
  }
}

/**
 * What the project config says about `projectName`.
 * - `no-config`: there is no config file, so the name is unknown and the
 *   Store keeps the name that it has.
 * - `unnamed`: the config has no `projectName`, so the Store clears the name.
 * - `named`: the config names the project.
 */
export type DeclaredProjectName =
  | { state: "no-config" }
  | { state: "unnamed" }
  | { state: "named"; name: string };

/** Read `projectName` from `.make-docs/config.yaml` without changing anything. */
export function readDeclaredProjectName(projectRoot: string): DeclaredProjectName {
  const file = path.join(projectRoot, CONFIG_RELATIVE_PATH);
  if (!existsSync(file)) return { state: "no-config" };
  assertManagedPathHasNoSymlinks(projectRoot, CONFIG_RELATIVE_PATH);
  const doc = parseDocument(readFileSync(file, "utf8"), { uniqueKeys: true });
  if (doc.errors.length) {
    throw new ProjectNameInvalidError(file, null, "The project config is not valid YAML, so Make Docs cannot read projectName.");
  }
  if (doc.contents === null) return { state: "unnamed" };
  const value = doc.get("projectName");
  if (value === undefined) return { state: "unnamed" };
  const problem = projectNameProblem(value);
  if (problem) {
    throw new ProjectNameInvalidError(file, typeof value === "string" ? value : null, `The project config has an invalid projectName. ${problem}`);
  }
  return { state: "named", name: value as string };
}

export interface ProjectRegisterRow {
  projectId: string;
  projectName: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
}

/** A name problem that a commit or a recovery recorded without refusing (see {@link recordProjectInRegister}). */
export interface ProjectNameConflict {
  code: "project-name-taken" | "project-name-invalid" | "project-id-is-other-name";
  reason: string;
  /** The name that stays in the register: the name that was stored before. */
  keptName: string | null;
  nextAction: string;
}

export interface ProjectRegisterRecord extends ProjectRegisterRow {
  /** Set only in `keep` mode, when the config name could not be recorded. */
  nameConflict: ProjectNameConflict | null;
}

/** Typed refusal: this project's ID is the name of another project (R-ID-8). */
export class ProjectIdIsOtherNameError extends OperationError {
  readonly code = "project-id-is-other-name";
  readonly reason: string;
  readonly nextAction: string;
  readonly details: { projectId: string; holderProjectId: string; holderCheckouts: string[] };

  constructor(projectId: string, holderProjectId: string, holderCheckouts: string[]) {
    const where = holderCheckouts.length ? ` Its checkout: ${holderCheckouts.join(", ")}.` : "";
    const reason = `This project's ID "${projectId}" is the project name of another project in this Store: project ${holderProjectId}.${where}`;
    const nextAction = "Change projectName in the other project's .make-docs/config.yaml, then run the command again.";
    super(`${reason} Make Docs refused this Store write. ${nextAction}`);
    this.name = "ProjectIdIsOtherNameError";
    this.reason = reason;
    this.nextAction = nextAction;
    this.details = { projectId, holderProjectId, holderCheckouts };
  }
}

/**
 * Create or update the project's `project_register` row (R-REGISTER-1).
 * Run it in the same transaction as the write it belongs to.
 *
 * - `refuse` (the default) is for the start of a write. It refuses a name in
 *   the wrong form, a name that another project holds, a name that is another
 *   project's ID, and a project ID that is another project's name. The refusal
 *   throws before the write's own rows, so the transaction leaves no row.
 * - `keep` is for the end of work that already started: an operation commit
 *   and a recovery. It never refuses. On a name problem it keeps the stored
 *   name, records the row, and returns the problem as `nameConflict`, so a
 *   rollback or a resume can always finish.
 */
export function recordProjectInRegister(
  db: StoreDatabase,
  input: { projectId: string; projectRoot?: string; declared?: DeclaredProjectName; now?: string; onNameConflict?: "refuse" | "keep" },
): ProjectRegisterRecord {
  const keep = input.onNameConflict === "keep";
  const existing = db.prepare(
    "SELECT project_name FROM project_register WHERE project_id=?",
  ).get(input.projectId) as { project_name: string | null } | undefined;
  const storedName = existing?.project_name ?? null;
  let problem: ProjectNameTakenError | ProjectNameInvalidError | ProjectIdIsOtherNameError | null = null;
  let declared: DeclaredProjectName;
  try {
    declared = input.declared ?? (input.projectRoot ? readDeclaredProjectName(input.projectRoot) : { state: "no-config" });
  } catch (error) {
    if (!keep || !(error instanceof ProjectNameInvalidError)) throw error;
    problem = error;
    declared = { state: "no-config" };
  }
  let name = declared.state === "named" ? declared.name : declared.state === "unnamed" ? null : storedName;
  const idOwner = db.prepare(
    "SELECT project_id FROM project_register WHERE project_name=? AND project_id<>?",
  ).get(input.projectId, input.projectId) as { project_id: string } | undefined;
  if (idOwner) problem ??= new ProjectIdIsOtherNameError(input.projectId, idOwner.project_id, checkoutPaths(db, idOwner.project_id));
  if (name !== null) {
    const holder = db.prepare(
      "SELECT project_id FROM project_register WHERE project_name=? AND project_id<>?",
    ).get(name, input.projectId) as { project_id: string } | undefined;
    const idHolder = holder ? undefined : db.prepare(
      `SELECT project_id FROM project_register WHERE project_id=? AND project_id<>?
       UNION SELECT project_id FROM installation_checkouts WHERE project_id=? AND project_id<>?
       LIMIT 1`,
    ).get(name, input.projectId, name, input.projectId) as { project_id: string } | undefined;
    const nameProblem = holder
      ? new ProjectNameTakenError(name, input.projectId, holder.project_id, checkoutPaths(db, holder.project_id))
      : idHolder
        ? new ProjectNameInvalidError(
            input.projectRoot ? path.join(input.projectRoot, CONFIG_RELATIVE_PATH) : CONFIG_RELATIVE_PATH,
            name,
            `The project name "${name}" is the project ID of another project in this Store, so it cannot name this project.`,
          )
        : null;
    if (nameProblem) {
      problem ??= nameProblem;
      // The config name cannot be recorded. Keep the stored name.
      name = storedName;
    }
  }
  if (problem && !keep) throw problem;
  const now = input.now ?? new Date().toISOString();
  db.prepare(
    `INSERT INTO project_register (project_id, project_name, first_seen_at, last_seen_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT (project_id) DO UPDATE SET
       project_name = excluded.project_name,
       last_seen_at = excluded.last_seen_at`,
  ).run(input.projectId, name, now, now);
  return {
    ...readProjectRegisterRow(db, input.projectId)!,
    nameConflict: problem ? { code: problem.code, reason: problem.reason, keptName: name, nextAction: problem.nextAction } : null,
  };
}

export function readProjectRegisterRow(db: StoreDatabase, projectId: string): ProjectRegisterRow | null {
  const row = db.prepare(
    "SELECT project_id, project_name, first_seen_at, last_seen_at FROM project_register WHERE project_id=?",
  ).get(projectId) as Record<string, unknown> | undefined;
  return row ? toRow(row) : null;
}

/** The number of projects in `project_register`, optionally without one project (R-REGISTER-4). */
export function countRegisteredProjects(db: StoreDatabase, exceptProjectId?: string): number {
  const row = (exceptProjectId === undefined
    ? db.prepare("SELECT COUNT(*) AS count FROM project_register").get()
    : db.prepare("SELECT COUNT(*) AS count FROM project_register WHERE project_id<>?").get(exceptProjectId)) as { count: number | bigint };
  return Number(row.count);
}

function checkoutPaths(db: StoreDatabase, projectId: string): string[] {
  return (db.prepare(
    "SELECT root_path FROM installation_checkouts WHERE project_id=? ORDER BY root_path",
  ).all(projectId) as Array<{ root_path: string }>).map((row) => row.root_path);
}

function toRow(row: Record<string, unknown>): ProjectRegisterRow {
  return {
    projectId: String(row.project_id),
    projectName: row.project_name === null ? null : String(row.project_name),
    firstSeenAt: String(row.first_seen_at),
    lastSeenAt: String(row.last_seen_at),
  };
}

/** Folder state of one checkout path. `unknown` means the path could not be checked. */
export type CheckoutFolderState = "present" | "missing" | "unknown";

export function checkoutFolderState(rootPath: string): CheckoutFolderState {
  try {
    return lstatSync(rootPath, { throwIfNoEntry: false }) ? "present" : "missing";
  } catch {
    return "unknown";
  }
}

export interface ProjectListCheckout {
  checkoutId: string;
  rootPath: string;
  folder: CheckoutFolderState;
  /** Plain words about the folder, for a person. */
  folderNote: string;
}

export interface ProjectListEntry {
  name: string | null;
  projectId: string;
  /** False when a checkout names the project but no Store write has recorded it in the register yet. */
  registered: boolean;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
  checkouts: ProjectListCheckout[];
  missingCheckouts: string[];
}

export interface ProjectListResult {
  schemaVersion: 1;
  projects: ProjectListEntry[];
  counts: { projects: number; checkouts: number; missingCheckouts: number; unregistered: number };
  summary: string;
}

/**
 * Read every project that the Store knows from `project_register` and
 * `installation_checkouts` (R-REGISTER-2, R-REGISTER-3). Reads only.
 */
export function listRegisteredProjects(
  db: StoreDatabase,
  folderState: (rootPath: string) => CheckoutFolderState = checkoutFolderState,
): ProjectListResult {
  const registered = (db.prepare(
    "SELECT project_id, project_name, first_seen_at, last_seen_at FROM project_register",
  ).all() as Array<Record<string, unknown>>).map(toRow);
  const checkouts = db.prepare(
    "SELECT checkout_id, project_id, root_path FROM installation_checkouts ORDER BY root_path, checkout_id",
  ).all() as Array<{ checkout_id: string; project_id: string; root_path: string }>;
  const byProject = new Map<string, ProjectListEntry>();
  for (const row of registered) {
    byProject.set(row.projectId, {
      name: row.projectName,
      projectId: row.projectId,
      registered: true,
      firstSeenAt: row.firstSeenAt,
      lastSeenAt: row.lastSeenAt,
      checkouts: [],
      missingCheckouts: [],
    });
  }
  for (const row of checkouts) {
    let entry = byProject.get(row.project_id);
    if (!entry) {
      entry = { name: null, projectId: row.project_id, registered: false, firstSeenAt: null, lastSeenAt: null, checkouts: [], missingCheckouts: [] };
      byProject.set(row.project_id, entry);
    }
    const folder = folderState(row.root_path);
    entry.checkouts.push({
      checkoutId: row.checkout_id,
      rootPath: row.root_path,
      folder,
      folderNote: folder === "present"
        ? "The folder is here."
        : folder === "missing"
          ? "The folder is missing. It was moved or deleted."
          : "Make Docs could not check this folder.",
    });
    if (folder === "missing") entry.missingCheckouts.push(row.root_path);
  }
  const projects = [...byProject.values()].sort((left, right) =>
    left.name !== null && right.name !== null
      ? left.name.localeCompare(right.name)
      : left.name !== null
        ? -1
        : right.name !== null
          ? 1
          : left.projectId.localeCompare(right.projectId),
  );
  const counts = {
    projects: projects.length,
    checkouts: checkouts.length,
    missingCheckouts: projects.reduce((total, entry) => total + entry.missingCheckouts.length, 0),
    unregistered: projects.filter((entry) => !entry.registered).length,
  };
  const summary = counts.projects === 0
    ? "The Store knows no projects yet."
    : `The Store knows ${counts.projects} ${counts.projects === 1 ? "project" : "projects"} with ${counts.checkouts} ${counts.checkouts === 1 ? "checkout" : "checkouts"}.` +
      (counts.missingCheckouts ? ` ${counts.missingCheckouts} checkout ${counts.missingCheckouts === 1 ? "folder is" : "folders are"} missing.` : "");
  return { schemaVersion: 1, projects, counts, summary };
}
