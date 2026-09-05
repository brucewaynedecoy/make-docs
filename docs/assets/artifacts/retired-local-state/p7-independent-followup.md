# P7 independent follow-up

> Historical evidence retained on 2026-09-05. This report describes the work at the time it was written. Its state revisions, approvals, budgets, and pending actions are historical statements, not current instructions. See the [accepted Phase 7 closeout](../../../work/2026-08-14-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/07-naive-uat-workflow-persona-and-evidence.md#accepted-implementation-closeout--2026-09-05) for the final result. See [retention notes](README.md) for the limited text changes.

Result: all four prior semantic findings are corrected. The candidate still has a new TypeScript error. It is not ready for acceptance.

Read state revision 205 and both correction reports. Reviewed the frozen 29-file candidate in `p7-corrected-candidate-files.json`. All 29 SHA-256 values match. HEAD matches `92195b8f0a20f5a1ea51023edc163cb20b045016`. This is the one reserved follow-up review. No code was changed.

## Prior findings

| Finding | Result | Direct proof |
| --- | --- | --- |
| Exact Markdown build and environment | Corrected at `packages/cli/src/operations/uat/ops.ts:102` | The full combined value passes. A truncated build alone fails. A truncated environment alone fails. |
| Clear result with unresolved finding | Corrected at `packages/cli/src/operations/uat/ops.ts:160` and `:208` | Unrelated disposition notes fail. Matching disposition records with `open`, `unresolved`, `accepted-risk`, and `closed` each retain the clear result and finding reference, but return `valid: false`, `validation_status: unverified`, and `recorded_human_conclusion: false`. |
| Future obligation authority | Corrected at `packages/cli/src/operations/uat/ops.ts:174` | An unrelated scenario PRD fails when the decision and run agree. A matching obligation body passes. |
| Decision executor and scope linkage | Corrected at `packages/cli/src/operations/uat/ops.ts:185` | A changed executor alone fails. A changed scope alone fails. Neither input includes a future obligation, so an obligation error cannot mask these checks. |

The disposition behavior is a valid conservative limit of this optional helper. PRD 46 forbids automatic closure and human judgment. The helper no longer infers closure from a free-text label. It preserves the recorded result, advisory gate effect, and finding references. It asks for review rather than declaring product failure or changing the result. Even `closed` text remains unverified. This is a stated automation limit, not a new finding-status policy or mandatory test run. A person still owns accepted disposition under the existing workflow.

## Remaining material issue

**[P2] Narrow the asset union before reading file content.** `packages/cli/tests/consistency.test.ts:258` reads `asset!.content` after checking only that an asset exists. `ResolvedInstallAsset` also admits an asset without `content`. The new test therefore causes TS2339 in the candidate typecheck. The runtime assertion does not narrow the union. Add a type-safe file-asset guard before comparing bytes. This error is new; it is separate from the three recorded baseline errors. No repair was made because the added correction budget is exhausted.

## Other correction checks

- `packages/cli/src/rules.ts` adds the helper reference beside the existing workflow reference in the existing asset rules. It does not add a new delivery model.
- The completeness test resolves local bundled Skill entries through the real Skill pipeline. It checks source identity, payload bytes, default system exclusion, and bare Skill exclusion. It does not hide all agentics paths behind an ignore. Its intent addresses the prior completeness failure; the TypeScript issue above remains.
- Catalog expectations now include the explicitly selected `naive-uat` Skill. Existing bare and explicit subset behavior remains distinct.
- UAT registry order again starts with scenario then Persona. The P6 fixture now expects checkpoint 10 to be implemented.
- The helper reference states the exact comparison, disposition, obligation, and decision-link rules used by the corrected code. Its provider-backed delivery remains available without a local Skill or snapshot.

## Evidence and limits

Independent reproduction: `node --import tsx <temp-dir>/p7-followup-repro.ts` from the repository root. Output: [retained reproduction output](p7-followup-repro-output.txt). The script uses the existing fixture and failure families. It creates and removes disposable data. It adds no permanent case.

The baseline clear result and matching obligation both pass. Negative checks were run separately. This review used current indexed code after refresh, actual correction diffs, and current helper documentation. The earlier documentation reindex failure remains the reason for direct document reads.

The coordinator owns the running full confirmation suite and package checks. No suite, build, smoke, or typecheck was rerun by this reviewer. The new typecheck issue is supported by the coordinator's compiler result and the reviewed union access. Final suite and package outcomes must be read before acceptance; this report does not assume their result.

This review does not prove lived human understanding, executor isolation in a real run, or native Linux/Windows installed behavior. No further review round or correction was used or authorized here.

Supporting compiler output: [correction typecheck](p7-correction-typecheck.txt).
