# P7 Skill correction report

> Historical evidence retained on 2026-09-05. This report describes the work at the time it was written. Its state revisions, approvals, budgets, and pending actions are historical statements, not current instructions. See the [accepted Phase 7 closeout](../../../work/2026-08-14-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/07-naive-uat-workflow-persona-and-evidence.md#accepted-implementation-closeout--2026-09-05) for the final result. See [retention notes](README.md) for the limited text changes.

Approved scope: `.make-docs/state/p7-correction-proposal.yaml`, state revision 204.
Result: assigned edits are complete and frozen for coordinator confirmation.

## Correction groups

1. Catalog expectations. Updated the existing all-Skill and unknown-Skill expectations in `packages/cli/tests/cli.test.ts`. Updated the displayed catalog expectations in `packages/cli/tests/skills-ui.test.ts` and `packages/cli/tests/wizard.test.ts`. Existing explicit subset and bare selections remain unchanged. One attempt. No further correction needed.
2. Asset classification. Added the validation helper to `ALWAYS_REFERENCE_PATHS` in `packages/cli/src/rules.ts`, beside the existing UGT workflow. This is the same system-reference path used by the existing materialization filters. Updated the existing completeness test in `packages/cli/tests/consistency.test.ts` to resolve bundled local Skill registry entries through `getDesiredSkillAssets`. It proves the shared Skill source ID, exact payload bytes, default system-asset exclusion, and bare Skill exclusion. It counts only proved source files. It does not skip an agentics directory or ignore either new file. One attempt. No further correction needed.

The helper remains a provider-backed system reference. The Skill remains a separate, optional selected payload. No new delivery model or ownership model.

## Checks

Command in packages/cli:

`npx vitest run tests/cli.test.ts tests/skills-ui.test.ts tests/wizard.test.ts tests/consistency.test.ts tests/p7-ugt-skill.test.ts`

Result: five files pass, 171 existing cases pass. Time: 2026-09-04 19:13:47 America/Chicago. Duration: 6.59 seconds. This includes the same four P7 Skill cases, with no new cases.

`git diff --check` passes.

## Budget and limits

Two correction group attempts used from the approved extension. Zero failed affected checks. Zero new cases or failure families. No full suite, build, or smoke run. Baseline TypeScript errors remain untouched. No state, phase item, branch, worktree, stage, commit, push, or P8 edits. Coordinator owns full confirmation and package retry. The main worker owns helper content and its dogfood copy.
