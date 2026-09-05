# P7 Bounded Correction Report

> Historical evidence retained on 2026-09-05. This report describes the work at the time it was written. Its state revisions, approvals, budgets, and pending actions are historical statements, not current instructions. See the [accepted Phase 7 closeout](../../../work/2026-08-14-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/07-naive-uat-workflow-persona-and-evidence.md#accepted-implementation-closeout--2026-09-05) for the final result. See [retention notes](README.md) for the limited text changes.

Entry state revision:204. Authority: approved p7-correction-proposal.yaml. Original baseline remains92195b8f on make-docs-v2. No branch, worktree, stage, commit, push or later phase work occurred.

## Changed Files In This Worker

- packages/cli/src/operations/uat/ops.ts
- packages/cli/tests/p7-ugt.test.ts
- packages/cli/tests/p6-global-store-lifecycle.test.ts
- packages/docs/template/.make-docs/system/references/naive-uat-validation.md

The schema vocabulary did not change. The helper reference remains provider-backed. It has no installed local copy or projection ownership record, so no dogfood provenance was invented or updated. Existing workflow/template copies and their proved manifest hashes did not change in this correction.

## Reviewed Defects

1. Markdown build and environment now compare the complete combined value, with the existing semicolon-space separator. Substrings fail. E1 now rejects truncated build, truncated environment and both together while retaining the complete-value positive case.
2. Disposition authority must contain the exact finding_id, owner and disposition body record. Unrelated isolation notes fail. No free-text spelling is treated as resolved. A clear result with any findings retains its recorded result and findings but returns valid:false, validation_status:unverified and recorded_human_conclusion:false. Accepted closure remains a review question. E3 covers unrelated authority and open, unresolved and accepted-risk text without adding a status vocabulary.
3. Future obligation authority must contain the exact id, owner, trigger, target, exit_criteria and reason. E4 covers an unrelated scenario reference, a matching acceptance record, and each mismatched field separately.
4. Activated decision executor must match run.qualification.executor. Decision scope must match run.support_scope. E4 rejects each mismatch separately.
5. Registry order again starts with scenario then Persona. The P6 checkpoint fixture expects implemented checkpoint10. Baseline TypeScript errors were not edited.

## Checks

- npx vitest run packages/cli/tests/p7-ugt.test.ts -t 'O5|O6|E1|E3|E4' --reporter=dot:5 passed,15 skipped.
- After the coordinator required the unverified disposition output to use valid:false, npx vitest run packages/cli/tests/p7-ugt.test.ts -t 'E3' --reporter=dot:1 passed,19 skipped.
- npx vitest run packages/cli/tests/mcp-derivation.test.ts packages/cli/tests/operation-domains.test.ts packages/cli/tests/p6-global-store-lifecycle.test.ts --reporter=dot:34 passed.
- git diff --check:passed.
- npx tsc --noEmit -p packages/cli/tsconfig.json:the same3 baseline errors remain, plus a new Skill-worker error in consistency.test.ts:258 (content on ResolvedInstallAsset without narrowing). No new type error occurs in this worker's files.

No full suite, build, defaults validation or package smoke was run here. No unique focused case or failure family was added. The original24-case and8-family inventory remains.

## Attempt Count And Stop

This worker used6 extension attempts: four initial semantic corrections, one registry/checkpoint integration group, and one disposition-envelope refinement. The disposition defect used2 attempts. The Skill worker reports2 initial integration groups. Shared extension total:8/8. No attempt remains.

All edits are frozen. The new consistency.test.ts typing error was reported to the coordinator and Skill worker. It was not repaired because another correction needs owner authority. Coordinator owns the full confirmation, package retry and independent follow-up. This report does not claim a clean final candidate or phase completion.
