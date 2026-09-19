# P7 optional Skill implementation report

> Historical evidence retained on 2026-09-05. This report describes the work at the time it was written. Its state revisions, approvals, budgets, and pending actions are historical statements, not current instructions. See the [accepted Phase 7 closeout](../../../work/2026-08-14-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/07-naive-uat-workflow-persona-and-evidence.md#accepted-implementation-closeout--2026-09-05) for the final result. See [retention notes](README.md) for the limited text changes.

State read: revision 195. Scope: tasks t18 through t21. Result: implementation candidate.

## Files

- `packages/docs/template/.make-docs/agentics/skills/naive-uat/SKILL.md`: upstream optional payload. It delegates to the shared workflow and six CLI paths. It adds no policy or scripts.
- `packages/cli/skill-registry.json`: canonical naive-uat purpose and explicit optional Skill. No default-purpose selection. Existing entries stay unchanged.
- `packages/cli/src/skill-registry.ts`: accepts only the D-005 naive-uat bundled first-party source. It converts that source to a local file URL through the existing template-root resolver. Other first-party sources retain their prior rule.
- `packages/cli/src/utils.ts`: exports the existing template-root resolver for reuse. Its behavior is unchanged.
- `packages/cli/tests/p7-ugt-skill.test.ts`: exactly four new focused cases.
- `packages/cli/tests/skill-registry.test.ts` and `packages/cli/tests/skill-catalog.test.ts`: existing exact catalog expectations include the new entry. No new cases.

## Evidence

- `npx vitest run tests/p7-ugt-skill.test.ts` in packages/cli: 4 of 4 pass. Final run: 2026-09-04 18:34 America/Chicago, 840 ms total.
- S1 proves bare exclusion, explicit local install, tracked canonical payload, and no fetch.
- S2 proves a prior-release fixture backup and shared-lifecycle update to the bundle. Backup bytes remain intact.
- S3 proves native symlink and forced copy-mirror exposure for Claude Code and Codex on this macOS host.
- S4 proves clean owned removal and preservation of a changed mirror, a mirror with a custom child, and an unrelated custom Skill. The existing lifecycle conservatively preserves the whole native mirror when its ownership proof changes.
- `UV_CACHE_DIR=<temp-dir>/p7-skill-uv uv run --offline --with pyyaml python <user-home>/.codex/skills/.system/skill-creator/scripts/quick_validate.py packages/docs/template/.make-docs/agentics/skills/naive-uat`: passes.
- `git diff --check`: passes.
- `npx tsc --noEmit`: reports three prior errors only, in p5-migration-safety.test.ts:459 and p6-global-store-lifecycle.test.ts:260,271. Coordinator proved these in clean HEAD. No Skill errors were reported.
- Read the registry JSON schema. Its source field accepts a non-empty string. No schema source constraint conflicts with the new entry.

## Budget and limits

Four focused cases. One named failure path: ownership-conflict. One test correction attempt: S4 initially expected removal of an unchanged file inside a mirror that had a custom child. The corrected case respects the existing whole-mirror ownership rule and also proves clean removal. Zero production defect corrections. The focused file ran three times (initial, corrected, final content check). No full suite, build, or smoke run. No paid service. No native Linux or Windows proof; P10 owns that proof.

The current package prepack step copies the upstream template tree and already ships that tree. Packed resolution uses the same existing template-root resolver as development resolution. Coordinator owns packed-path evidence and the full candidate check.

No installed dogfood Skill was added. The project has not selected naive-uat. Its absence preserves explicit selection and bare-install behavior. Upstream payload is the sole new authored authority. Normal selected-Skill install in isolated local test projects supplied the downstream proof.

No phase state, phase item, branch, worktree, stage, commit, push, or P8 change.

## Planned packed fixture integration

Updated `scripts/smoke-pack.mjs` before the coordinator full candidate check. The exact P7 bundled local source marker now stays unchanged when remote registry sources are mapped to local HTTP fixtures. This lets the packed resolver read the bundled payload. Added naive-uat to the existing all-Skill name list and shared/native owned-path lists. Bare-install absence checks and withdrawn-Skill checks are unchanged.

`node --check scripts/smoke-pack.mjs` and `git diff --check -- scripts/smoke-pack.mjs` pass. No smoke run, new case, production behavior change, or further correction attempt. The coordinator owns the smoke run.
