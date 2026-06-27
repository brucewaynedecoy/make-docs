---
client: "Codex Desktop"
date: "2026-06-27"
coordinate: "W17 R2 P4"
repo: "make-docs"
branch: "make-docs-v2"
status: "completed"
summary: "Completed package validation and closeout for the shared selected-agentics install model."
---

# W17 R2 P4 Package Validation and Closeout

## Changes

Phase 4 completed package validation and closeout for W17 R2, proving that the shared selected-agentics install model works through local tests and the packed CLI smoke flow without requiring symlinks or duplicating authoritative payloads per harness.

- Validated the complete package CLI test suite for shared payloads, generated harness stubs, default installs, project and global selected-skill installs, clean duplicated-payload migration, modified/custom preservation, audit, backup, uninstall, lifecycle, and skills UI behavior.
- Validated default install consistency so blank installs do not create selected-agentic payloads or harness stubs until a skill is selected.
- Validated the TypeScript build and packed CLI smoke flow after the shared selected-agentics changes.
- Reconciled PRD 28 with the final selected-skill implementation evidence.
- Updated Q-012, R-001, R-002, and R-006 with W17 R2 evidence while keeping broader plugin, config-label, MCP, richer manifest-schema, and lifecycle-rebuild concerns open.
- Closed the Phase 4 backlog with validation notes and deferred manual UAT until requested after the completed wave.

Validation run:

- `npm test -w packages/cli -- --reporter=dot`
- `npm run validate:defaults -w packages/cli`
- `npm run build -w packages/cli`
- `npm run smoke:pack`
- `git diff --check`
- changed-file Markdown link check
- `python3 .make-docs/scripts/check_path_hygiene.py --repo-root .`
- `bash scripts/check-wave-numbering.sh`

Validation caveat:

- `bash scripts/check-instruction-routers.sh` still reports the pre-existing root-router baseline: `./AGENTS.md` and `./CLAUDE.md` differ, and `./CLAUDE.md` exceeds the 12-line budget. The root router files were not changed in W17 R2 P4.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/work/2026-06-23-w17-r2-shared-agentics-installation-harness-redirection/04-package-validation-and-closeout.md](../../../work/2026-06-23-w17-r2-shared-agentics-installation-harness-redirection/04-package-validation-and-closeout.md) | Marked Phase 4 complete and recorded validation evidence. |
| [docs/prd/28-revise-shared-agentics-installation-harness-redirection.md](../../../prd/28-revise-shared-agentics-installation-harness-redirection.md) | Added Phase 4 selected-skill validation evidence and downstream non-requirement boundaries. |
| [docs/prd/03-open-questions-and-risk-register.md](../../../prd/03-open-questions-and-risk-register.md) | Added W17 R2 evidence for shared selected skills while keeping broader unresolved risks and questions open. |
| [docs/assets/archive/history/2026-06-27-w17-r2-p4-package-validation-and-closeout.md](2026-06-27-w17-r2-p4-package-validation-and-closeout.md) | Added this phase closeout breadcrumb. |

### Developer

| Path | Description |
| --- | --- |
| [packages/cli/src/agentic-skill-roles.ts](../../../../packages/cli/src/agentic-skill-roles.ts) | Phase 4 package validation exercised shared-payload, generated-stub, and legacy duplicated-payload role classification. |
| [packages/cli/src/planner.ts](../../../../packages/cli/src/planner.ts) | Phase 4 package validation exercised shared selected-skill planning across install and skills sync behavior. |
| [packages/cli/src/audit.ts](../../../../packages/cli/src/audit.ts) | Phase 4 package validation exercised the shared audit snapshot used by backup and uninstall. |
