# P4 Package Validation and Closeout

## Goal

Prove the corrected behavior through package validation and close the W17 R3 wave.

## Source PRD Docs

- [PRD 28](../../prd/28-shared-agentics-installation-and-harness-exposure.md)
- [PRD 10](../../prd/10-packaging-validation-and-release-reference.md)
- [PRD 20](../../prd/20-agent-harness-conformance-and-support-claims.md)
- [PRD 30](../../prd/30-plugin-substrate-and-workflow-bundles.md)
- [PRD 03](../../prd/03-open-questions-and-risk-register.md)

## Tasks

- [x] t1: Update package smoke expectations so packed CLI validation proves native harness exposure instead of generated stubs.
- [x] t2: Run CLI unit tests that cover default installs, project-scope selected skills, global-scope selected skills, symlink exposure, copy-mirror fallback, migration, backup, uninstall, audit, and skills UI output.
- [x] t3: Run package validation commands: `npm test -w packages/cli -- --reporter=dot`, `npm run validate:defaults -w packages/cli`, `npm run build -w packages/cli`, and `npm run smoke:pack`.
- [x] t4: Run documentation and package hygiene checks: `git diff --check`, changed-file Markdown link checks, `python3 .make-docs/scripts/check_path_hygiene.py --repo-root .`, `bash scripts/check-wave-numbering.sh`, and `bash scripts/check-instruction-routers.sh`.
- [x] t5: Record any known baseline validation failures separately from W17 R3 regressions.
- [x] t6: Complete final manual UAT for selected-skill installs in Claude Code and Codex harness roots.
- [x] t7: Reconcile PRD/risk closeout and write W17 R3 history records under `docs/assets/archive/history/`.

## Acceptance Criteria

- Fresh default install contains no selected-skill payloads or harness exposures.
- Explicit selected-skill install contains one canonical shared payload per scope plus native harness exposure.
- Harness roots contain real skill trees with useful skill frontmatter, not generic forwarding stubs.
- Packed CLI smoke validation proves native exposure and fallback behavior.
- W17 R3 closeout records make W17 R2 evidence status and W17 R3 correction status explicit.

## Manual UAT Notes

Manual UAT completed with a temp project and isolated home:

- Ran the built CLI against an isolated temp project.
- Installed `archive-docs` for both Claude Code and Codex harnesses.
- Confirmed `.claude/skills/archive-docs` and `.agents/skills/archive-docs` were symlink exposures.
- Confirmed both harness-visible `SKILL.md` files matched `.make-docs/agentics/skills/archive-docs/SKILL.md`.
- Confirmed both harness-visible files contained the real `archive-docs` frontmatter description, not a generic generated Make Docs forwarding stub.

Final validation completed:

- `npm test -w packages/cli -- --reporter=dot`
- `npm run validate:defaults -w packages/cli`
- `npm run build -w packages/cli`
- `npm run smoke:pack`
- `git diff --check`
- changed-file Markdown link checks
- `python3 .make-docs/scripts/check_path_hygiene.py --repo-root .`
- `bash scripts/check-wave-numbering.sh`
- `bash scripts/check-instruction-routers.sh`

Known baseline:

- `bash scripts/check-instruction-routers.sh` still reports the pre-existing root-router baseline: `./AGENTS.md` and `./CLAUDE.md` differ, and `./CLAUDE.md` has 16 lines against the 12-line budget. No W17 R3 edited root router files.
