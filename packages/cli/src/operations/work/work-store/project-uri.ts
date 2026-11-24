/**
 * W29 R0 P1 grammar of project-resource URIs (PRD 52 R-WORK-URI-1 to
 * R-WORK-URI-4) and project names (PRD 38 R-ID-8).
 *
 * Every project URI names its project in full, by project name or project ID.
 * Nothing here reads the current folder, a target path, or the Store. P4 maps
 * a parsed URI to Store records.
 */

export const WORK_PROJECT_URI_PREFIX = "make-docs://project/";
export const WORK_PROJECT_URI_FAMILIES = ["tasks", "backlog", "factory"] as const;
export type WorkProjectUriFamily = (typeof WORK_PROJECT_URI_FAMILIES)[number];

/** Lower-case letters, digits, and hyphens; starts with a letter; at most 64 characters. */
export const WORK_PROJECT_NAME_PATTERN = /^[a-z](?:[a-z0-9-]{0,62}[a-z0-9])?$/;
/** The project ID form minted by setup (PRD 38 R-ID-1). A name in this form is refused. */
export const WORK_PROJECT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function isValidWorkProjectName(value: string): boolean {
  return WORK_PROJECT_NAME_PATTERN.test(value) && !WORK_PROJECT_ID_PATTERN.test(value);
}

/** Backlog path parts, in order. A task follows its phase directly, because its coordinate names no stage. */
const BACKLOG_PARTS = [
  { letter: "W", zero: false },
  { letter: "R", zero: true },
  { letter: "P", zero: false },
] as const;
const LEAF_LETTERS = ["S", "T"] as const;

/**
 * A factory path (W30 R0 P3 T30, PRD 53 R-FACTORY-66). `unlisted` is any other
 * path under `factory/`: the reader refuses it with `resource-not-found`.
 */
export type WorkFactoryUriPath =
  | { kind: "index" }
  | { kind: "workflow"; workflow: string }
  | { kind: "revisions"; workflow: string }
  | { kind: "revision"; workflow: string; revision: number }
  | { kind: "assignments" }
  | { kind: "unlisted"; part: string };

export type WorkProjectUriTarget =
  | { family: "tasks"; item: null }
  | { family: "tasks"; item: string }
  | { family: "backlog"; coordinate: string | null; isList: boolean }
  | { family: "factory"; path: WorkFactoryUriPath };

const FACTORY_WORKFLOW_NAME = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

/** The approved factory paths. Any other path under `factory/` is `unlisted`. */
function parseFactoryPath(base: string, tail: readonly string[], trailingSlash: boolean): { canonical: string; path: WorkFactoryUriPath } {
  const unlisted = (part: string) => ({ canonical: `${base}${tail.join("/")}${trailingSlash ? "/" : ""}`, path: { kind: "unlisted" as const, part } });
  if (tail.length === 0) return { canonical: base, path: { kind: "index" } };
  if (tail[0] === "assignments" && tail.length === 1) return { canonical: `${base}assignments/`, path: { kind: "assignments" } };
  if (tail[0] !== "workflows" || tail.length < 2) return unlisted(tail[0]!);
  const workflow = tail[1]!;
  if (!FACTORY_WORKFLOW_NAME.test(workflow) || workflow.length > 64) return unlisted(workflow);
  const at = `${base}workflows/${workflow}`;
  if (tail.length === 2) return { canonical: at, path: { kind: "workflow", workflow } };
  if (tail[2] !== "revisions") return unlisted(tail[2]!);
  if (tail.length === 3) return { canonical: `${at}/revisions/`, path: { kind: "revisions", workflow } };
  if (tail.length === 4 && /^[1-9]\d*$/.test(tail[3]!)) return { canonical: `${at}/revisions/${tail[3]}`, path: { kind: "revision", workflow, revision: Number(tail[3]) } };
  return unlisted(tail.slice(3).join("/"));
}

export type WorkProjectUriParse =
  | {
      ok: true;
      /** The canonical URI that a result names (R-WORK-URI-4). */
      canonical: string;
      project: { kind: "name" | "id"; value: string };
      target: WorkProjectUriTarget;
    }
  | { ok: false; reason: string };

function refuse(reason: string): WorkProjectUriParse {
  return { ok: false, reason };
}

/** Parses one coordinate part such as `p1` or `R0`. Returns the canonical part, or null. */
function parsePart(raw: string, letter: string, zeroAllowed: boolean): string | null {
  const match = /^([A-Za-z])(\d+)$/.exec(raw);
  if (!match || match[1]!.toUpperCase() !== letter) return null;
  const digits = match[2]!;
  if (digits.length > 1 && digits.startsWith("0")) return null;
  if (digits === "0" && !zeroAllowed) return null;
  return `${letter}${digits}`;
}

export function parseWorkProjectUri(uri: unknown): WorkProjectUriParse {
  if (typeof uri !== "string") return refuse("The URI must be a string.");
  if (uri.slice(0, WORK_PROJECT_URI_PREFIX.length).toLowerCase() !== WORK_PROJECT_URI_PREFIX) {
    return refuse("A project URI starts with make-docs://project/.");
  }
  if (uri.includes("?") || uri.includes("#")) return refuse("A project URI has no query or fragment.");

  const rest = uri.slice(WORK_PROJECT_URI_PREFIX.length);
  const trailingSlash = rest.endsWith("/");
  const parts = (trailingSlash ? rest.slice(0, -1) : rest).split("/");
  if (parts.some((part) => part.length === 0)) return refuse("A project URI has no empty path part.");
  if (parts.length < 2) return refuse("A project URI names a project and a family.");

  const rawProject = parts[0]!.toLowerCase();
  let project: { kind: "name" | "id"; value: string };
  if (WORK_PROJECT_ID_PATTERN.test(rawProject)) project = { kind: "id", value: rawProject };
  else if (isValidWorkProjectName(rawProject)) project = { kind: "name", value: rawProject };
  else return refuse("The project part is not a project name or a project ID.");

  const family = parts[1]!.toLowerCase();
  const tail = parts.slice(2);
  const base = `${WORK_PROJECT_URI_PREFIX}${project.value}/${family}/`;

  if (family === "tasks") {
    if (tail.length === 0) return { ok: true, canonical: base, project, target: { family, item: null } };
    if (tail.length > 1) return refuse("Nothing follows a quick item.");
    const raw = tail[0]!;
    const item = /^[1-9]\d*$/.test(raw) ? raw : null;
    if (item === null) return refuse("A quick item is a plain number without a leading zero, such as 7.");
    return { ok: true, canonical: `${base}${item}`, project, target: { family, item } };
  }

  if (family === "backlog") {
    const coordinate: string[] = [];
    for (const [index, raw] of tail.entries()) {
      if (index < BACKLOG_PARTS.length) {
        const spec = BACKLOG_PARTS[index]!;
        const part = parsePart(raw, spec.letter, spec.zero);
        if (part === null) return refuse(`Part ${index + 1} of the coordinate must be ${spec.letter} and a number without a leading zero.`);
        coordinate.push(part);
        continue;
      }
      if (index === BACKLOG_PARTS.length) {
        const leaf = LEAF_LETTERS.map((letter) => parsePart(raw, letter, false)).find((part) => part !== null);
        if (!leaf) return refuse("After a phase comes a stage (S and a number) or a task (T and a number).");
        coordinate.push(leaf);
        continue;
      }
      return refuse("Nothing follows a stage or a task.");
    }
    const isList = coordinate.length < BACKLOG_PARTS.length + 1;
    const path = coordinate.join("/");
    const canonical = coordinate.length === 0 ? base : `${base}${path}${isList ? "/" : ""}`;
    return {
      ok: true,
      canonical,
      project,
      target: { family, coordinate: coordinate.length === 0 ? null : coordinate.join(" "), isList },
    };
  }

  if (family === "factory") {
    const factory = parseFactoryPath(base, tail, trailingSlash);
    return { ok: true, canonical: factory.canonical, project, target: { family, path: factory.path } };
  }

  return refuse(`The family must be one of: ${WORK_PROJECT_URI_FAMILIES.join(", ")}.`);
}
