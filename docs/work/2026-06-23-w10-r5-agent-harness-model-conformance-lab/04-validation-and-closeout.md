# Validation and Closeout

## Purpose

Validate and close conformance-lab implementation with evidence that lab assets remain maintainer-only.

## Source PRD Docs

- `docs/prd/20-agent-harness-conformance-and-support-claims.md`
- `docs/prd/10-packaging-validation-and-release-reference.md`

## Stage 1 - Validation

### Tasks

- [x] t1: Run relevant CLI tests for touched install, audit, backup, skills, managed-block, or validation surfaces.
- [x] t2: Run `npm run validate:defaults -w packages/cli` when template or router evidence is touched.
- [x] t3: Run `npm run smoke:pack` when package proof surfaces are touched.
- [x] t4: Verify lab assets are absent from shipped template and package copies unless a later accepted design explicitly promotes them.
- [x] t5: Update support-claim docs and risk entries only with reviewed result evidence.

### Acceptance Criteria

- Lab scenario/result records are reviewable.
- Raw artifacts remain generated local state by default.
- Shipped install/package/template surfaces do not include the lab by accident.

### Dependencies

- Phase 3 adapters and support claims.

## Implementation Notes

| Task | Evidence |
| --- | --- |
| t1 | `npm test -w packages/cli -- --reporter=dot` passed with 17 test files and 280 tests. |
| t2 | `npm run validate:defaults -w packages/cli` passed with 24 consistency tests. |
| t3 | `npm run smoke:pack` passed, including first install, sync, skill sync, and uninstall package-smoke coverage. |
| t4 | `find packages/docs/template packages/cli/template -path '*conformance*' -print`, `rg -n "conformance|conformance-lab" packages/docs/template packages/cli/template packages/cli/dist packages/cli/package.json`, and `npm pack --dry-run --json --ignore-scripts -w packages/cli` proved zero conformance-lab matches in shipped template, copied template, CLI dist/package metadata, and the 100-file dry-run tarball. |
| t5 | No support-claim docs or risk-register entries were updated because no reviewed tuple-specific result evidence exists yet; [Conformance Lab Scenario and Result Contracts](../../assets/library/developer/conformance-lab-scenario-and-result-contracts.md) keeps support wording gated on reviewed result records. |

## Additional Hygiene

- `bash scripts/check-wave-numbering.sh` passed.
- `bash scripts/check-instruction-routers.sh` still reports the known root router baseline: `./AGENTS.md` and `./CLAUDE.md` differ, and `./CLAUDE.md` exceeds the 12-line budget.
- `python3 packages/skills/closeout-phase/scripts/guide_coverage_probe.py --repo-root . --changed-files-json /tmp/w10-r5-p4-closeout-probe.json` still reports the known older-guide persona-frontmatter baseline; the W10 R5 conformance guide has no persona validation errors.

## Coverage Decisions

- PRD coverage: no PRD files changed. [PRD 20](../../prd/20-agent-harness-conformance-and-support-claims.md) already owns the maintainer-only lab boundary, scenario/result record requirements, raw-artifact locality, and support-claim gate.
- Developer-guide coverage: no additional guide changes were needed in Phase 4. The Phase 2 and Phase 3 guide updates already captured the durable maintainer workflow.
- User-guide coverage: no user guide was needed. The wave does not change user-facing install, package, or harness behavior.
- UAT: no separate hand-run UAT was worthwhile for this closeout. The only shipped behavior to guard is package/template absence, which `npm run smoke:pack`, `npm pack --dry-run`, and direct package/template scans validated with human-readable output.
