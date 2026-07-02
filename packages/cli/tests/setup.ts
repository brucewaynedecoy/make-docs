import { mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";

// The global-store bootstrap resolves its root from MAKE_DOCS_HOME before
// falling back to ~/.make-docs. Point it at a per-worker temp directory so no
// test — including CLI apply flows that trigger the store bootstrap — ever
// writes to the real home directory. Tests that exercise the store directly
// pass their own explicit storeRoot instead.
process.env.MAKE_DOCS_HOME = mkdtempSync(
  path.join(os.tmpdir(), "make-docs-store-test-"),
);
