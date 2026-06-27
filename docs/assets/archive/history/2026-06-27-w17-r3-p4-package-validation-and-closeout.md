---
client: "Codex Desktop"
date: "2026-06-27"
coordinate: "W17 R3 P4"
repo: "make-docs"
branch: "make-docs-v2"
status: "completed"
summary: "Validated and closed W17 R3 native harness exposure correction."
---

# W17 R3 P4 Package Validation and Closeout

## Changes

Phase 4 validated and closed the W17 R3 native harness exposure correction. The packed CLI now proves selected-skill installs create canonical shared payloads plus native harness exposure, skills-only manifests retain enough metadata for backup and uninstall to remove clean shared payloads and harness exposures, smoke validation rejects stale generated-stub behavior, and manual UAT confirmed Claude Code and Codex harness roots expose the real skill frontmatter instead of generic forwarding stubs.

- Extended skills-only manifest retention so selected skill payloads and native exposure directories keep source/hash/exposure metadata for lifecycle audit.
- Added audit regression coverage proving skills-only native exposure and shared payload records are removable when clean.
- Strengthened smoke-pack uninstall assertions so packed validation fails if managed selected-skill artifacts remain after uninstall.
- Reconciled the PRD index and risk register so W17 R3 is recorded as completed implementation evidence rather than future required evidence.
- Completed final manual UAT with an isolated temp project/home and verified `.claude/skills/archive-docs/SKILL.md` and `.agents/skills/archive-docs/SKILL.md` both match the canonical shared payload and contain the real `archive-docs` description.

Validation run:

- `npm test -w packages/cli -- --reporter=dot`
- `npm run validate:defaults -w packages/cli`
- `npm run build -w packages/cli`
- `npm run smoke:pack`
- `git diff --check`
- changed-file Markdown link checks
- `python3 .make-docs/scripts/check_path_hygiene.py --repo-root .`
- `bash scripts/check-wave-numbering.sh`
- `bash scripts/check-instruction-routers.sh`

Validation result:

- CLI test suite passed with 22 files and 345 tests.
- Default validation passed with 28 consistency tests.
- CLI build passed.
- Smoke-pack passed after verifying native exposure, selected-skill backup/uninstall, and absence of managed selected-skill artifacts after uninstall.
- Manual UAT passed for selected-skill native exposure in Claude Code and Codex harness roots.

Known baseline:

- `bash scripts/check-instruction-routers.sh` still reports the pre-existing root-router baseline: root `AGENTS.md` and `CLAUDE.md` differ, and root `CLAUDE.md` has 16 lines against the 12-line budget. W17 R3 did not edit those root router files.

Coverage decisions:

- Developer guide: no new guide warranted. The behavior is captured in PRD 28, the W17 R3 work backlog, package tests, and smoke validation; no distinct maintainer guide workflow was introduced.
- User guide: no new guide warranted in this phase because the public selected-skill behavior is still represented by CLI output and package validation rather than a published v2 user guide surface.
- PRD reconciliation: updated `docs/prd/00-index.md` and `docs/prd/03-open-questions-and-risk-register.md`; no new PRD change doc was needed because W17 R3 implemented the accepted PRD 28 requirement surface.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/prd/00-index.md](../../../prd/00-index.md) | Updated the W17 R3 guardrail line to preserve completed correction evidence. |
| [docs/prd/03-open-questions-and-risk-register.md](../../../prd/03-open-questions-and-risk-register.md) | Updated risk-register W17 R3 references from future required evidence to completed implementation evidence. |
| [docs/work/2026-06-27-w17-r3-shared-agentics-native-harness-exposure-correction/04-package-validation-and-closeout.md](../../../work/2026-06-27-w17-r3-shared-agentics-native-harness-exposure-correction/04-package-validation-and-closeout.md) | Marked Phase 4 complete and recorded final validation, manual UAT, and known baseline. |
| [docs/assets/archive/history/2026-06-27-w17-r3-p4-package-validation-and-closeout.md](2026-06-27-w17-r3-p4-package-validation-and-closeout.md) | Added this phase closeout breadcrumb. |

### Developer

None this session.

### User

None this session.
