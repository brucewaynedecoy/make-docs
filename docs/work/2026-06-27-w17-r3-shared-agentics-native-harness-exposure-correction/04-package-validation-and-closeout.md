# P4 Package Validation and Closeout

## Goal

Prove the corrected behavior through package validation and close the W17 R3 wave.

## Source PRD Docs

- [PRD 28](../../prd/28-revise-shared-agentics-installation-harness-redirection.md)
- [PRD 10](../../prd/10-packaging-validation-and-release-reference.md)
- [PRD 20](../../prd/20-revise-agent-harness-model-conformance-lab.md)
- [PRD 30](../../prd/30-revise-harness-plugin-substrate-workflow-bundles.md)
- [PRD 03](../../prd/03-open-questions-and-risk-register.md)

## Tasks

- [ ] t1: Update package smoke expectations so packed CLI validation proves native harness exposure instead of generated stubs.
- [ ] t2: Run CLI unit tests that cover default installs, project-scope selected skills, global-scope selected skills, symlink exposure, copy-mirror fallback, migration, backup, uninstall, audit, and skills UI output.
- [ ] t3: Run package validation commands: `npm test -w packages/cli -- --reporter=dot`, `npm run validate:defaults -w packages/cli`, `npm run build -w packages/cli`, and `npm run smoke:pack`.
- [ ] t4: Run documentation and package hygiene checks: `git diff --check`, changed-file Markdown link checks, `python3 .make-docs/scripts/check_path_hygiene.py --repo-root .`, `bash scripts/check-wave-numbering.sh`, and `bash scripts/check-instruction-routers.sh`.
- [ ] t5: Record any known baseline validation failures separately from W17 R3 regressions.
- [ ] t6: Complete final manual UAT for selected-skill installs in Claude Code and Codex harness roots.
- [ ] t7: Reconcile PRD/risk closeout and write W17 R3 history records under `docs/assets/archive/history/`.

## Acceptance Criteria

- Fresh default install contains no selected-skill payloads or harness exposures.
- Explicit selected-skill install contains one canonical shared payload per scope plus native harness exposure.
- Harness roots contain real skill trees with useful skill frontmatter, not generic forwarding stubs.
- Packed CLI smoke validation proves native exposure and fallback behavior.
- W17 R3 closeout records make W17 R2 evidence status and W17 R3 correction status explicit.

## Manual UAT Notes

Manual UAT is worthwhile after implementation because the corrected behavior is harness-observable. Test with a temp project and isolated home, select at least one bundled skill for both Codex and Claude Code harnesses, inspect `.agents/skills/<skill-name>/SKILL.md` and `.claude/skills/<skill-name>/SKILL.md`, and confirm the files show the real skill metadata and usable description.
