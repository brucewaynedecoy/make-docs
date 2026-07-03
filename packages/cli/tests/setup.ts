import { mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach } from "vitest";
import { sweepTrackedTempDirs, trackTempDir } from "./run-state-boundary";

// The global-store bootstrap resolves its root from MAKE_DOCS_HOME before
// falling back to ~/.make-docs. Point it at a per-worker temp directory so no
// test — including CLI apply flows that trigger the store bootstrap — ever
// writes to the real home directory. Tests that exercise the store directly
// pass their own explicit storeRoot instead.
process.env.MAKE_DOCS_HOME = mkdtempSync(
  path.join(os.tmpdir(), "make-docs-store-test-"),
);

// The redirected global store may hold run state in `store.db` (that is its
// job), but never a repository-shaped `.make-docs/runs/` tree — include it in
// the R-TEST-5 sweep alongside every fixture root helpers.createTempDir mints.
trackTempDir(process.env.MAKE_DOCS_HOME);

// Suite-enforced R-TEST-5 boundary (W18 R7 P5 t10): after every test, any
// tracked fixture root that still exists is checked for `.make-docs/runs/`.
// Roots cleaned through helpers.cleanupTempDir are checked at cleanup time
// instead; vitest's default "stack" hook order runs this sweep after each
// test file's own afterEach cleanup, so leaked roots are still caught here.
afterEach(() => {
  sweepTrackedTempDirs();
});
