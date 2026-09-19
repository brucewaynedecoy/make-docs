import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

/**
 * Suite-enforced repository-boundary guard for Playbook run state (PRD 35
 * R-TEST-5, W18 R7 P5 t10): no test may leave run state under
 * `.make-docs/runs/` — or any other repository path — in any temp fixture
 * root. The mechanism has two legs sharing this module:
 *
 * 1. `helpers.createTempDir` registers every fixture root it mints, and
 *    `helpers.cleanupTempDir` calls `assertNoRepoRunState` before removing a
 *    root, so the normal per-test cleanup path fails the owning test when a
 *    `.make-docs/runs/` directory appears anywhere inside the fixture.
 * 2. `tests/setup.ts` registers a global `afterEach` that sweeps every
 *    still-existing tracked root, so roots a test leaks without cleanup are
 *    checked too (vitest's default "stack" hook order runs this sweep after
 *    each test file's own cleanup hooks).
 *
 * The generic guard targets the named `.make-docs/runs/` location; the
 * "any repository path" half of R-TEST-5 is additionally proven by the
 * explicit byte-identical repository snapshots (`collectFiles` before/after)
 * in the progression, three-tier, and portability tests, which catch run
 * state written to arbitrary repo paths. The one legitimate writer of
 * `.make-docs/runs/**` — the legacy pre-W18-R10 work-checkpoint migration
 * fixture in `tests/operations.test.ts` — removes the file within its own
 * test body, so the guard holds unconditionally at cleanup time.
 */

const TEMP_ROOTS_KEY = "__makeDocsTestTempRoots__" as const;

type TrackedGlobal = typeof globalThis & { [TEMP_ROOTS_KEY]?: Set<string> };

function trackedRoots(): Set<string> {
  const holder = globalThis as TrackedGlobal;
  holder[TEMP_ROOTS_KEY] ??= new Set<string>();
  return holder[TEMP_ROOTS_KEY];
}

/** Registers a temp fixture root for the suite-wide R-TEST-5 sweep. */
export function trackTempDir(rootDir: string): void {
  trackedRoots().add(rootDir);
}

/** Unregisters a root after it has been checked and removed. */
export function untrackTempDir(rootDir: string): void {
  trackedRoots().delete(rootDir);
}

/**
 * Fails when any `.make-docs/runs/` directory exists under the given root
 * (R-TEST-5). Walks directories only, skipping `.git` and `node_modules`.
 */
export function assertNoRepoRunState(rootDir: string): void {
  if (!existsSync(rootDir)) {
    return;
  }
  const offending = findRepoRunStateDir(rootDir);
  if (offending) {
    throw new Error(
      `Playbook run state boundary violated (R-TEST-5): \`${offending}\` exists inside the ` +
        `test fixture root \`${rootDir}\`. Run state belongs in the global store, never under ` +
        "`.make-docs/runs/` or any repository path.",
    );
  }
}

/**
 * Global teardown leg: checks every tracked, still-existing fixture root.
 * Registered as an `afterEach` in `tests/setup.ts`.
 */
export function sweepTrackedTempDirs(): void {
  for (const rootDir of trackedRoots()) {
    if (!existsSync(rootDir)) {
      trackedRoots().delete(rootDir);
      continue;
    }
    assertNoRepoRunState(rootDir);
  }
}

function findRepoRunStateDir(currentDir: string): string | null {
  let entries;
  try {
    entries = readdirSync(currentDir, { withFileTypes: true });
  } catch {
    return null;
  }
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === ".git" || entry.name === "node_modules") {
      continue;
    }
    const absolutePath = path.join(currentDir, entry.name);
    if (entry.name === ".make-docs" && existsSync(path.join(absolutePath, "runs"))) {
      return path.join(absolutePath, "runs");
    }
    const nested = findRepoRunStateDir(absolutePath);
    if (nested) {
      return nested;
    }
  }
  return null;
}
