import { existsSync } from "node:fs";
import path from "node:path";

import { canonicalInstallationPath, getExistingInstallationCheckoutId, readDeclarativeProjectId, withStoreReadOnlyDatabase } from "../../store/installation-state";
import { readProjectRegisterRow } from "../../store/project-register";
import { resolveWorkProject } from "../../store/work-store";
import type { StoreDatabase } from "../../store/database";

/**
 * W30 R0 P3 Stage 5: project scope (PRD 53 R-FACTORY-62 to R-FACTORY-65,
 * factory contract "Project Scope").
 *
 * Each factory operation is machine-level or project-scoped (T25). The two
 * machine operations, `factory tools save` and `factory tools list`, take no
 * project. A project
 * write names its project with `--target-root <path>` or `--project <name>`
 * (MCP `targetRoot` or `project`) and never falls back to the current folder
 * (T26). A project read may use the project of the current folder and says so
 * (T29). A name resolves only through `project_register`. Every refusal
 * changes nothing (T27). Every result names what it acted on (T28).
 *
 * This module reads the Store read only, and only to resolve a project name
 * and its bound checkouts. It never creates or migrates a Store.
 */

export const FACTORY_OPERATION_IDS = [
  "factory.status",
  "factory.tools.save",
  "factory.workflow.save",
  "factory.workflow.show",
  "factory.workflow.list",
  "factory.proof.save",
  "factory.assignment.start",
  "factory.assignment.save",
  "factory.assignment.list",
  "factory.restore",
  // W30 R0 follow-up commands (owner decisions 2026-11-23).
  "factory.tools.list",
  "factory.file-backup.save",
  "factory.grant-use.record",
] as const;
export type FactoryOperationId = (typeof FACTORY_OPERATION_IDS)[number];

export interface FactoryOperationScope {
  scope: "machine" | "project";
  kind: "read" | "write";
  /**
   * The operation reads the project's config file and type file, or writes
   * the copies, so a project name must give exactly one bound checkout
   * (`project-checkout-unclear`). A grant-only `workflow save` needs none.
   */
  needsCheckout: boolean;
}

/** T25: the PRD 53 project scope table, once in code. */
export const FACTORY_OPERATION_SCOPES: Readonly<Record<FactoryOperationId, FactoryOperationScope>> = Object.freeze({
  "factory.tools.save": { scope: "machine", kind: "write", needsCheckout: false },
  "factory.workflow.save": { scope: "project", kind: "write", needsCheckout: true },
  "factory.proof.save": { scope: "project", kind: "write", needsCheckout: true },
  "factory.assignment.start": { scope: "project", kind: "write", needsCheckout: true },
  "factory.assignment.save": { scope: "project", kind: "write", needsCheckout: false },
  "factory.restore": { scope: "project", kind: "write", needsCheckout: true },
  // The backup is a file copy in the one checkout that the assignment runs in.
  "factory.file-backup.save": { scope: "project", kind: "write", needsCheckout: true },
  "factory.grant-use.record": { scope: "project", kind: "write", needsCheckout: false },
  "factory.tools.list": { scope: "machine", kind: "read", needsCheckout: false },
  "factory.workflow.show": { scope: "project", kind: "read", needsCheckout: false },
  "factory.workflow.list": { scope: "project", kind: "read", needsCheckout: false },
  "factory.assignment.list": { scope: "project", kind: "read", needsCheckout: false },
  "factory.status": { scope: "project", kind: "read", needsCheckout: false },
});

/** How the project of a call was chosen. A write is always `named`. */
export type FactoryProjectChoice = "named" | "current-folder";

/** What one factory result acted on (R-FACTORY-64). */
export type FactoryActedOn =
  | { kind: "machine"; text: string }
  | { kind: "project"; projectName: string | null; projectId: string; chosenBy: FactoryProjectChoice; text: string }
  | { kind: "none"; text: string };

export interface FactoryCheckoutRef {
  checkoutId: string;
  root: string;
  /** False when the bound folder is gone from this machine. */
  exists: boolean;
}

export interface FactoryProjectResolution {
  projectId: string;
  projectName: string | null;
  chosenBy: FactoryProjectChoice;
  /** Every bound checkout of the project, by folder. */
  checkouts: FactoryCheckoutRef[];
  /** The one checkout whose files the call reads or writes. A name that gives no single checkout is refused, so it is never null for a name. */
  checkout: FactoryCheckoutRef | null;
  /** The folder whose harness grant admits the call: the project's own checkout (PRD 25 R-ACCESS-6, register D-075). */
  harnessRoot: string;
}

/** The project refusal codes (T27). Each one changes nothing. */
export type FactoryProjectRefusalCode =
  | "project-missing"
  | "project-not-found"
  | "project-mismatch"
  | "project-checkout-unclear"
  | "project-not-identified"
  | "project-not-registered"
  | "checkout-not-bound";

export interface FactoryProjectRefusal {
  refusal: FactoryProjectRefusalCode;
  reason: string;
  nextAction: string;
  actedOn: FactoryActedOn;
}

export const FACTORY_MACHINE_ACTED_ON: FactoryActedOn = Object.freeze({ kind: "machine", text: "this machine" }) as FactoryActedOn;
export const FACTORY_NO_PROJECT_ACTED_ON: FactoryActedOn = Object.freeze({ kind: "none", text: "no project was named" }) as FactoryActedOn;

/** `project aurora (0f1e...)`, or the ID alone for a project with no name. */
export function factoryProjectWords(project: { projectName: string | null; projectId: string }): string {
  return project.projectName ? `project ${project.projectName} (${project.projectId})` : `project ${project.projectId}`;
}

export function factoryProjectActedOn(project: Pick<FactoryProjectResolution, "projectId" | "projectName" | "chosenBy">): FactoryActedOn {
  return { kind: "project", projectName: project.projectName, projectId: project.projectId, chosenBy: project.chosenBy, text: factoryProjectWords(project) };
}

/** The read line that names the project and how it was chosen (T29). */
export function factoryProjectChoiceLine(project: Pick<FactoryProjectResolution, "projectId" | "projectName" | "chosenBy">): string {
  const words = factoryProjectWords(project);
  return project.chosenBy === "named"
    ? `Project: ${words}, as named.`
    : `Project: ${words}, taken from the current folder. Name another with --project <name> or --target-root <path>.`;
}

const NAME_BOTH_WAYS = "Name the project with --target-root <path> or --project <name>. In MCP, use the targetRoot or project input.";

function projectRefusal(refusal: FactoryProjectRefusalCode, reason: string, nextAction: string, actedOn: FactoryActedOn = FACTORY_NO_PROJECT_ACTED_ON): FactoryProjectRefusal {
  return { refusal, reason, nextAction, actedOn };
}

interface CheckoutRow {
  checkout_id: string;
  root_path: string;
}

function projectCheckouts(db: StoreDatabase, projectId: string): FactoryCheckoutRef[] {
  return (db.prepare("SELECT checkout_id, root_path FROM installation_checkouts WHERE project_id = ? ORDER BY root_path, checkout_id").all(projectId) as unknown as CheckoutRow[])
    .map((row) => ({ checkoutId: row.checkout_id, root: row.root_path, exists: existsSync(path.join(row.root_path, ".make-docs", "config.yaml")) }));
}


/**
 * Resolve the project of one factory call (T26, T27, T29). It returns the
 * project, its checkouts, the one checkout that the call needs, and the folder
 * whose grant admits the call, or a typed refusal that changes nothing.
 */
export function resolveFactoryProject(
  input: { targetRoot?: string; project?: string },
  options: { operation: FactoryOperationId; cwd: string; storeRoot: string; needsCheckout?: boolean },
): FactoryProjectResolution | FactoryProjectRefusal {
  const scope = FACTORY_OPERATION_SCOPES[options.operation];
  const needsCheckout = options.needsCheckout ?? scope.needsCheckout;
  const named = input.targetRoot !== undefined || input.project !== undefined;
  if (!named && scope.kind === "write") {
    return projectRefusal("project-missing", "This factory write names no project, so nothing changed. A factory write never uses the current folder.", NAME_BOTH_WAYS);
  }
  const chosenBy: FactoryProjectChoice = named ? "named" : "current-folder";
  if (input.targetRoot !== undefined || !named) {
    const root = canonicalInstallationPath(path.resolve(input.targetRoot ?? options.cwd));
    if (!named && !existsSync(path.join(root, ".make-docs", "config.yaml"))) {
      return projectRefusal("project-missing", "This folder is not a Make Docs project, and the call names no project.", `${NAME_BOTH_WAYS} Or run the command in a checkout of the project.`);
    }
    const projectId = readDeclarativeProjectId(root);
    if (!projectId) {
      return projectRefusal("project-not-identified", "The folder has no projectId in .make-docs/config.yaml, so the Store cannot find its project. Nothing changed.", "Run make-docs setup in this project first.");
    }
    const checkoutId = getExistingInstallationCheckoutId(root, options.storeRoot);
    if (!checkoutId) {
      return projectRefusal("checkout-not-bound", "The folder is not a bound checkout of a project that the Store knows. Nothing changed.", "Run make-docs setup in this folder, or name a bound checkout with --target-root.");
    }
    return withStoreReadOnlyDatabase(options.storeRoot, (db) => {
      const row = readProjectRegisterRow(db, projectId);
      if (!row) {
        return projectRefusal("project-not-registered", "The project register does not hold the project of this folder. Nothing changed.", "Run make-docs setup in this project first.");
      }
      const resolved: FactoryProjectResolution = {
        projectId,
        projectName: row.projectName,
        chosenBy,
        checkouts: projectCheckouts(db, projectId),
        checkout: { checkoutId, root, exists: true },
        harnessRoot: root,
      };
      if (input.project !== undefined) {
        const other = resolveWorkProject(db, input.project);
        if (!other) {
          return projectRefusal("project-not-found", `The Store knows no project named ${input.project}. Nothing changed.`, "Run make-docs project list to see the projects that the Store knows.");
        }
        if (other.projectId !== projectId) {
          return projectRefusal(
            "project-mismatch",
            `--target-root names ${factoryProjectWords(resolved)}, but --project names ${factoryProjectWords(other)}. Nothing changed.`,
            "Name one project: give only --target-root, or only --project, or two that match.",
          );
        }
      }
      return resolved;
    });
  }
  const name = input.project!;
  return withStoreReadOnlyDatabase(options.storeRoot, (db) => {
    const found = resolveWorkProject(db, name);
    if (!found) {
      return projectRefusal("project-not-found", `The Store knows no project named ${name}. Nothing changed.`, "Run make-docs project list to see the projects that the Store knows.");
    }
    const checkouts = projectCheckouts(db, found.projectId);
    const present = checkouts.filter((checkout) => checkout.exists);
    const base = { projectId: found.projectId, projectName: found.projectName, chosenBy };
    const actedOn = factoryProjectActedOn(base);
    const one = checkouts.length === 1 && present.length === 1 ? present[0]! : null;
    if (needsCheckout && !one) {
      const why = checkouts.length === 0
        ? "it has no bound checkout on this machine"
        : checkouts.length > 1
          ? `it has ${checkouts.length} bound checkouts`
          : "its bound checkout folder is gone";
      return projectRefusal(
        "project-checkout-unclear",
        `This call reads or writes project files, but ${factoryProjectWords(found)} gives no single checkout: ${why}. Nothing changed.`,
        "Name the checkout with --target-root <path> (MCP targetRoot).",
        actedOn,
      );
    }
    // A harness grant belongs to one checkout: its config file and its Store record (PRD 25 R-ACCESS-6). With no single
    // checkout, no grant decides the call, so the call names one with --target-root (review item 7).
    if (!one) {
      const why = checkouts.length === 0
        ? "it has no bound checkout on this machine"
        : checkouts.length > 1
          ? `it has ${checkouts.length} bound checkouts`
          : "its bound checkout folder is gone";
      return projectRefusal(
        "project-checkout-unclear",
        `The grant that admits this call belongs to one checkout, and ${factoryProjectWords(found)} gives no single checkout: ${why}. Nothing changed.`,
        "Name the checkout with --target-root <path> (MCP targetRoot). A call with --target-root still reads or acts on the whole project.",
        actedOn,
      );
    }
    return { ...base, checkouts, checkout: one, harnessRoot: one.root };
  });
}

export function isFactoryProjectRefusal(value: FactoryProjectResolution | FactoryProjectRefusal): value is FactoryProjectRefusal {
  return "refusal" in value;
}
