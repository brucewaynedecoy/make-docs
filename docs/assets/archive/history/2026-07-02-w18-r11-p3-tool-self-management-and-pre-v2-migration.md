---
title: "W18 R11 P3 Tool Self-Management and Pre-v2 Migration"
kind: "history"
status: "completed"
date: "2026-07-02"
client: "Claude Code"
model: "Fable 5"
coordinate: "W18 R11 P3"
repo: "make-docs"
branch: "make-docs-v2"
summary: "Landed machine-footprint uninstall, detect-and-delegate update, and the pre-v2 warning-and-backup-or-cancel flow, completing the no-alias cutover verification."
---

# W18 R11 P3 Tool Self-Management and Pre-v2 Migration

## Changes

Implemented [Phase 3 of the W18 R11 backlog](../../../work/2026-07-01-w18-r11-cli-command-reorganization-and-operation-registry/03-tool-self-management-and-pre-v2-migration.md) per [historical closeout](2026-07-02-w18-r11-p6-verification-and-testing.md) (retired action-PRD: `docs/prd/39-revise-cli-command-reorganization-and-operation-registry.md`) R-SELF-1 through R-SELF-3 and R-MIG-1/R-MIG-2. The new `packages/cli/src/self/` module implements the two machine-level commands the Phase 2 tree reserved. `make-docs uninstall` (`self/uninstall-tool.ts`) removes the machine footprint: it lists exactly what will be removed — the global store path and the detected binary with its owning manager — confirms interactively (or via `--yes`; non-TTY without it refuses and removes nothing), then removes the store through the structurally-safe `removeGlobalStore` seam from W18 R10, completing the PRD 38 R-LIFE-1 remove-or-prompt obligation the register carried; a remote-execution user is told no binary is installed and only the store is removed, ambiguous binary ownership degrades to printing the exact removal command and the affected store path rather than acting (R-SELF-3), `--target` is rejected as a project-removal confusion guard, and repository content is structurally untouchable. `make-docs update` (`self/update-tool.ts`) is the detect-and-delegate wrapper: an unambiguous persistent global install delegates to its manager's update command, ambiguity prints the exact command, remote execution reports nothing persistent to update since the runner fetches the requested version, and every run applies pending global-store schema migration through `bootstrapGlobalStore` (PRD 38 R-DB-2). The install-manager detection matrix (`self/install-manager.ts`, a documented D9 implementer freedom) realpath-matches the running binary against npm/pnpm/bun/Homebrew global roots with npx/pnpm-dlx/bunx cache paths classified as remote execution, requires the package name in a persistent match, treats zero-or-multiple matches as ambiguous, and executes only through an injectable exec seam. Pre-v2 detection (`self/pre-v2.ts`) fingerprints a pre-v2 install purely from `classifyCompatibilityState` evidence — manifest schema version 1, or the classifier's `clean-v1`/`modified-v1` states, with the fingerprint set documented as the D9 freedom — and `setup`, `setup reconfigure`, and `update` now gate on it before any compatibility disposition runs: the R-MIG-2 warning itemizes the five-command cutover, the `setup remove` rename, the store-relocated run-state and evidence, the MCP renames, and the manifest schema change, then offers backing up and installing the latest version (recommended, which runs the project backup before proceeding) or cancelling, which leaves the install byte-untouched; non-interactive runs never upgrade a pre-v2 install silently. The t5 no-alias verification confirmed the parser and help carry no removed spelling, alias, or redirect. All five Phase 3 tasks are checked off; the suite is 683/683 including 17 new self-management tests (temp-store isolation via `MAKE_DOCS_HOME`, refusal-without-confirmation, ambiguous-no-exec, sibling-repo-untouched, nothing-persistent bootstrap, pre-v2 fingerprinting and choice flow) and the two v1-fixture CLI tests rewritten from silent migration to the new warning-and-cancel contract.

Manual-test coverage is deferred to wave completion per the session workflow; within the phase the built CLI was manually checked: `uninstall` without a TTY printed the footprint listing and refused with nothing removed, and the real `~/.make-docs` store was confirmed intact afterward.

Developer- and user-guide coverage was `update-existing`: the [CLI lifecycle user guide](../../library/user/cli-lifecycle-managing-installations.md) gained the two self-management commands in its command model, a "Manage the tool itself" section, and an "Upgrading a pre-v2 installation" section describing the warning-and-choice flow, with its now-shipped Future Coverage bullet replaced by the pending MCP-rename trigger; the [maintainer boundaries developer guide](../../library/developer/maintainer-docs-assets-and-runtime-state-boundaries.md) rewrote its seam-first lifecycle bullets as command documentation now that `uninstall` surfaces `removeGlobalStore` and `update` surfaces `bootstrapGlobalStore`, documented the `detectPreV2Install` gate, and narrowed its Future Coverage bullet to the remaining W18 R7 run-state relocation.

PRD coverage was `risk-register-update` with no change doc: the phase implements PRD 39 requirements as written. [R-024](../../../prd/03-open-questions-and-risk-register.md) advanced in place — the self-management behavior, pre-v2 flow, and t5 verification are recorded, the W18 R10 P4 carried R-LIFE-1 item is resolved, and the remaining exposure narrows to the hand-maintained MCP tool list owned by the derivation phase plus the closing R-TEST checks.

Validation: full CLI suite 683/683 across 42 files, `npx tsc --noEmit` at the pre-existing 67-error baseline, `npm run build` green, built-CLI manual checks above, `python3 .make-docs/scripts/check_path_hygiene.py` errors=0, and `git diff --check` clean.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [../../../work/2026-07-01-w18-r11-cli-command-reorganization-and-operation-registry/03-tool-self-management-and-pre-v2-migration.md](../../../work/2026-07-01-w18-r11-cli-command-reorganization-and-operation-registry/03-tool-self-management-and-pre-v2-migration.md) | Marked Phase 3 tasks t1 through t5 complete. |
| [../../../prd/03-open-questions-and-risk-register.md](../../../prd/03-open-questions-and-risk-register.md) | Advanced R-024 in place: self-management and pre-v2 landed, the carried R-LIFE-1 item resolved, remaining exposure narrowed to the MCP derivation and closing checks. |

### Developer

| Path | Description |
| --- | --- |
| [../../library/developer/maintainer-docs-assets-and-runtime-state-boundaries.md](../../library/developer/maintainer-docs-assets-and-runtime-state-boundaries.md) | Rewrote the store lifecycle bullets as command documentation for `uninstall`/`update` and documented the pre-v2 detection gate. |

### User

| Path | Description |
| --- | --- |
| [../../library/user/cli-lifecycle-managing-installations.md](../../library/user/cli-lifecycle-managing-installations.md) | Added the self-management commands to the command model plus "Manage the tool itself" and "Upgrading a pre-v2 installation" sections. |
