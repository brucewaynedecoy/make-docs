/**
 * Conformance lab-session vocabulary and evidence homes (PRD 44 R-NAME-1..2;
 * register item D-024; W18 R13 P2 t10-t12).
 *
 * The operational envelope of the conformance lab is a LAB SESSION — session
 * id, session workspace, session evidence, session manifest. "Run" survives
 * in exactly two prior meanings that do not change: the registry's
 * `recordedRuns` evidence projection and the `run` CLI command. No new
 * artifact, path, or identifier uses "run" for lab operations (R-NAME-1).
 *
 * Evidence homes (R-NAME-2): the repo-local `.make-docs/conformance/`
 * transcript home is rejected (D-024). Transcripts and evidence scratch live
 * in the disposable session workspace and are discarded with it by default;
 * deliberately redacted-and-promoted evidence lands in the committed result
 * record under `conformance/results/<harness>/`; raw evidence retained
 * beyond a session goes to the machine-level store's lab area at
 * `<store-root>/conformance-lab/sessions/<session-id>/`. The lab area is a
 * NARROWLY NAMED LOCATION derived from the store root via this module — it
 * adds no store schema, no manifest rows, and no migration surface; PRD 38's
 * store ownership is consumed unchanged.
 *
 * Implementer decisions recorded here (W18 R13 P2):
 * - Session ids are deterministic date-target-outcome slugs
 *   ({@link mintConformanceLabSessionId}) so a retained session's store path
 *   is readable and collision-averse without a clock or randomness inside
 *   kit generation (generation stays byte-deterministic for equal inputs).
 * - Transcript-pointer validation ({@link listConformanceTranscriptLogPointerErrors})
 *   accepts exactly two shapes: the literal
 *   {@link CONFORMANCE_TRANSCRIPT_DISCARDED_WITH_SESSION} or a path that
 *   resolves inside a store lab area (`conformance-lab/sessions/<session-id>/`).
 *   Store roots are machine-specific, so validation checks the lab-area path
 *   convention rather than one machine's absolute prefix; anything naming
 *   repo-local `.make-docs/` fails with D-024 named.
 */

import os from "node:os";
import path from "node:path";
import { OperationError } from "../operations/types";

/** Directory name of the store's lab area (`<store-root>/conformance-lab/`). */
export const CONFORMANCE_LAB_AREA_DIR_NAME = "conformance-lab";

/** Subdirectory of the lab area holding retained sessions. */
export const CONFORMANCE_LAB_SESSIONS_DIR_NAME = "sessions";

/**
 * The transcript pointer for a session whose raw transcript was discarded
 * with its disposable lab-session workspace (register item D-024, PRD 44
 * R-NAME-2): the honest default — nothing repo-local, nothing invented.
 */
export const CONFORMANCE_TRANSCRIPT_DISCARDED_WITH_SESSION = "discarded-with-session";

const SESSION_ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

/** The path fragment every retained-session location carries. */
export const CONFORMANCE_LAB_SESSIONS_PATH_FRAGMENT =
  `${CONFORMANCE_LAB_AREA_DIR_NAME}/${CONFORMANCE_LAB_SESSIONS_DIR_NAME}/`;

const LAB_SESSIONS_POINTER_PATTERN = new RegExp(
  `(^|/)${CONFORMANCE_LAB_AREA_DIR_NAME}/${CONFORMANCE_LAB_SESSIONS_DIR_NAME}/[a-z0-9][a-z0-9-]*(/|$)`,
);

/**
 * Mints the deterministic lab-session id: `<date>-<harness>-<outcome>` plus
 * an optional disambiguator for repeated sessions of the same target and
 * outcome on one day.
 */
export function mintConformanceLabSessionId(input: {
  /** ISO date (`YYYY-MM-DD`) supplied by the caller, never read from a clock here. */
  date: string;
  harness: string;
  outcome: string;
  disambiguator?: string;
}): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    throw new OperationError(
      `Lab-session date must be YYYY-MM-DD, got \`${input.date}\` (R-NAME-1).`,
    );
  }
  const parts = [input.date, input.harness, input.outcome, input.disambiguator].filter(
    (part): part is string => part !== undefined,
  );
  const sessionId = parts.join("-");
  return validateConformanceLabSessionId(sessionId);
}

/** Validates a lab-session id: lowercase hyphenated slug, nothing else. */
export function validateConformanceLabSessionId(sessionId: string): string {
  if (!SESSION_ID_PATTERN.test(sessionId)) {
    throw new OperationError(
      `Lab-session id \`${sessionId}\` must be a lowercase hyphenated slug (R-NAME-1).`,
    );
  }
  return sessionId;
}

/** The machine-level store's lab area: `<store-root>/conformance-lab`. */
export function conformanceLabAreaRoot(storeRoot: string): string {
  return path.join(storeRoot, CONFORMANCE_LAB_AREA_DIR_NAME);
}

/** Home of retained sessions: `<store-root>/conformance-lab/sessions`. */
export function conformanceLabSessionsRoot(storeRoot: string): string {
  return path.join(conformanceLabAreaRoot(storeRoot), CONFORMANCE_LAB_SESSIONS_DIR_NAME);
}

/**
 * The retained-evidence home of one session:
 * `<store-root>/conformance-lab/sessions/<session-id>/` (PRD 44 R-NAME-2).
 */
export function retainedConformanceLabSessionPath(input: {
  storeRoot: string;
  sessionId: string;
}): string {
  return path.join(
    conformanceLabSessionsRoot(input.storeRoot),
    validateConformanceLabSessionId(input.sessionId),
  );
}

/**
 * The default disposable session root: under the OS temp root, never under a
 * repository and never under repo-local `.make-docs/` (R-NAME-2). Discarding
 * the directory discards every session artifact.
 */
export function defaultConformanceSessionRoot(input: {
  sessionId: string;
  /** Override for tests; defaults to the OS temp directory. */
  tempRoot?: string;
}): string {
  return path.join(
    input.tempRoot ?? os.tmpdir(),
    "make-docs-conformance-lab",
    validateConformanceLabSessionId(input.sessionId),
  );
}

/**
 * Validates a result record's `transcriptLogPointer` against the D-024
 * evidence-home rule (PRD 44 R-NAME-2): the pointer either states
 * `discarded-with-session` or points into a machine-level store lab area
 * (`.../conformance-lab/sessions/<session-id>/...`). Returns human-readable
 * errors; empty means the pointer is honest.
 */
export function listConformanceTranscriptLogPointerErrors(pointer: string): string[] {
  if (pointer === CONFORMANCE_TRANSCRIPT_DISCARDED_WITH_SESSION) {
    return [];
  }
  const normalized = pointer.split(path.sep).join("/");
  // Order matters: the machine-level store root is itself a `.make-docs`
  // directory (`~/.make-docs/conformance-lab/sessions/...`), so the lab-area
  // convention is checked first and only the REJECTED old home
  // (`.make-docs/conformance/`) gets the D-024-specific refusal.
  if (LAB_SESSIONS_POINTER_PATTERN.test(normalized)) {
    return [];
  }
  if (/(^|\/)\.make-docs\/conformance(\/|$)/.test(normalized)) {
    return [
      `transcript pointer \`${pointer}\` names the rejected repo-local \`.make-docs/conformance/\` home (PRD 44 R-NAME-2, register item D-024) — retain raw evidence in the store's lab area (\`<store-root>/${CONFORMANCE_LAB_SESSIONS_PATH_FRAGMENT}<session-id>/\`) or state \`${CONFORMANCE_TRANSCRIPT_DISCARDED_WITH_SESSION}\``,
    ];
  }
  return [
    `transcript pointer \`${pointer}\` is neither \`${CONFORMANCE_TRANSCRIPT_DISCARDED_WITH_SESSION}\` nor a store lab-area path (\`<store-root>/${CONFORMANCE_LAB_SESSIONS_PATH_FRAGMENT}<session-id>/...\`) (PRD 44 R-NAME-2)`,
  ];
}
