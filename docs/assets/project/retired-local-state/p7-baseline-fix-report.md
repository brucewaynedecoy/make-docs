# Baseline Type Error Fix

> Historical evidence retained on 2026-09-05. This report describes the work at the time it was written. Its state revisions, approvals, budgets, and pending actions are historical statements, not current instructions. See the [accepted Phase 7 closeout](../../../work/2026-08-14-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/07-naive-uat-workflow-persona-and-evidence.md#accepted-implementation-closeout--2026-09-05) for the final result. See [retention notes](README.md) for the limited text changes.

Authority: new user-approved scope after P7 commit03a8dfdd; state214. The initial worktree was clean. This scope is separate from the earlier P7 correction budgets.

## Exact Diff

- packages/cli/tests/p5-migration-safety.test.ts: add a three-line discriminant guard in the receipt loop. A receipt-projection-failed result throws before the claims assertion. The existing expected status list, claims values and persisted-receipt assertions remain intact.
- packages/cli/tests/p6-global-store-lifecycle.test.ts: add a three-line discriminant guard after the forced projection-failure assertion. Any status other than receipt-projection-failed throws before receiptId is used in the journal and recovery assertions. Those assertions remain intact.

Two test files changed;6 inserted lines. No casts, any, runtime, schema or behavioral assertion removal.

## Checks

- npx vitest run packages/cli/tests/p5-migration-safety.test.ts packages/cli/tests/p6-global-store-lifecycle.test.ts --reporter=dot: exit0;2 files and34 existing tests passed. Log: [p7-baseline-fix-tests.txt](p7-baseline-fix-tests.txt).
- npx tsc --noEmit -p packages/cli/tsconfig.json: exit0; no errors. Log: [p7-baseline-fix-typecheck.txt](p7-baseline-fix-typecheck.txt) (empty on success).
- git diff --check: exit0.

Candidate frozen for coordinator review. No new tests, full suite, smoke, staging, commit, branch or phase-closeout documents were changed.
