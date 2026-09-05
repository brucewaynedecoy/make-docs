# P7 Final Test-Only Correction

> Historical evidence retained on 2026-09-05. This report describes the work at the time it was written. Its state revisions, approvals, budgets, and pending actions are historical statements, not current instructions. See the [accepted Phase 7 closeout](../../../work/2026-08-14-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/07-naive-uat-workflow-persona-and-evidence.md#accepted-implementation-closeout--2026-09-05) for the final result. See [retention notes](README.md) for the limited text changes.

Authority: state revision210 and approved p7-final-test-correction-proposal.yaml.

One attempt used. Candidate is frozen.

## Exact Change

Only packages/cli/tests/consistency.test.ts changed. After the existing defined-asset and shared-source ownership assertions, an explicit guard rejects a missing asset or an asset without content. The byte assertion now reads asset.content after TypeScript narrows the type. Its comparison with readFileSync(sourcePath) remains unchanged. The default-exclusion and payload-source ownership checks remain intact. No runtime or schema changed.

## Checks

- npx vitest run packages/cli/tests/consistency.test.ts -t 'every file in the template is covered by the asset pipeline' --reporter=dot: exit0;1 passed,35 skipped. Run once. Log: [p7-final-test-check.txt](p7-final-test-check.txt).
- npx tsc --noEmit -p packages/cli/tsconfig.json: exit2; only the three proved baseline errors remain in P5 line459 and P6 lines260/271. The new consistency test error is gone. Run once. Log: [p7-final-typecheck.txt](p7-final-typecheck.txt).

No new cases, broad suite, package run, independent review, staging, commit or branch change occurred. All edits stop here. Coordinator owns exact-diff and reviewed-snapshot checks.
