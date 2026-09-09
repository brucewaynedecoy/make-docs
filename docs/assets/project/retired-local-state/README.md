# Retained Phase 7 Evidence

This folder holds static evidence cited by the accepted Phase 7 closeout. It was retained on 2026-09-05 when the owner removed the old project-local Phase skill. It is not a run tracker, an approval source, or a place for new operational state.

The [coordinator checks](coordinator-checks.md) give the final sequence and its limits. The [Phase 7 closeout](../../../work/2026-08-14-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/07-naive-uat-workflow-persona-and-evidence.md#accepted-implementation-closeout--2026-09-05) remains the accepted account. None of the historical product tests were rerun for this cleanup.

## Retained Reports

- [p7-implementation-report.md](p7-implementation-report.md)
- [p7-skill-report.md](p7-skill-report.md)
- [p7-correction-report.md](p7-correction-report.md)
- [p7-skill-correction-report.md](p7-skill-correction-report.md)
- [p7-independent-followup.md](p7-independent-followup.md)
- [p7-final-test-correction-report.md](p7-final-test-correction-report.md)
- [p7-baseline-fix-report.md](p7-baseline-fix-report.md)

## Supporting Output

- [p7-correction-full-tests.txt](p7-correction-full-tests.txt)
- [p7-correction-smoke-pack.txt](p7-correction-smoke-pack.txt)
- [p7-correction-typecheck.txt](p7-correction-typecheck.txt)
- [p7-final-test-check.txt](p7-final-test-check.txt)
- [p7-final-typecheck.txt](p7-final-typecheck.txt)
- [p7-baseline-fix-tests.txt](p7-baseline-fix-tests.txt)
- [p7-baseline-fix-typecheck.txt](p7-baseline-fix-typecheck.txt)
- [p7-followup-repro-output.txt](p7-followup-repro-output.txt)

The baseline typecheck output is empty. The baseline fix report records its zero exit status. An empty file alone does not prove that a command passed. The package output also contains expected negative-case messages; the coordinator recorded the overall successful smoke retry.

## Text Changes for Retention

Each report has a historical-only notice. Links now point to retained reports and outputs. Log files use `.txt` names so the repository can track them. Extra blank lines at the end of `p7-baseline-fix-tests.txt`, `p7-correction-full-tests.txt`, and `p7-final-test-check.txt` were removed. Each file keeps its final newline. Report claims, test counts, failure messages, and original limits remain as recorded.

Terminal color and cursor escape sequences were removed. The checkout root was replaced with `.`. User-home paths were replaced with `<user-home>`. Temporary directory prefixes were replaced with `<temp-dir>`, including truncated prefixes in wrapped terminal output. These substitutions remove machine-specific locations. The retained files are not byte-identical copies. The compiler output added as a link to the independent follow-up is supporting evidence from the same correction run.

Historical references to discarded proposals, file snapshots, and state revisions remain plain text inside the reports. Those control files are not retained or used to resume work. The original reproduction script is not retained; its recorded output is retained.

## Local Files Selected for Removal

The following exact files were selected for removal from `.make-docs/state/` after the retained copies and links were checked. This is a static cleanup list, not a reusable deletion rule.

- `p7-affected-confirmation.log`
- `p7-baseline-fix-report.md`
- `p7-baseline-fix-tests.log`
- `p7-baseline-fix-typecheck.log`
- `p7-baseline-typecheck.txt`
- `p7-candidate-files-before-timestamp-fix.json`
- `p7-candidate-files.json`
- `p7-candidate-typecheck.log`
- `p7-corrected-candidate-files.json`
- `p7-correction-full-tests.log`
- `p7-correction-proposal.yaml`
- `p7-correction-report.md`
- `p7-correction-smoke-pack.log`
- `p7-correction-typecheck.log`
- `p7-final-candidate-files.json`
- `p7-final-test-check.log`
- `p7-final-test-correction-proposal.yaml`
- `p7-final-test-correction-report.md`
- `p7-final-typecheck.log`
- `p7-followup-repro-output.txt`
- `p7-followup-repro.ts`
- `p7-full-tests.log`
- `p7-implementation-authorization.yaml`
- `p7-implementation-report.md`
- `p7-independent-followup.md`
- `p7-independent-review.md`
- `p7-review-repro-output.txt`
- `p7-review-repro.ts`
- `p7-skill-correction-report.md`
- `p7-skill-report.md`
- `p7-smoke-pack.log`
- `phase-authorization.yaml`
- `phase-state.yaml`

The nine deleted files under `.agents/skills/phase/` are committed with this cleanup. The three new skills remain unchanged. Migration receipts, the legacy quiescence marker, and the legacy writer directory remain outside this cleanup. Their [separate storage conflict](../../../prd/03-open-questions-and-risk-register.md#d-031-migration-state-remains-in-the-project-despite-the-store-boundary) does not authorize new Store tables or a Store upgrade. Existing backups, `.make-docs/runs/`, the ignore rule, and the live Store are unchanged.
