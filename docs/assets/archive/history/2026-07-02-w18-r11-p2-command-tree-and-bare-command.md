---
title: "W18 R11 P2 Command Tree and Bare Command"
kind: "history"
status: "completed"
date: "2026-07-02"
client: "Claude Code"
model: "Fable 5"
coordinate: "W18 R11 P2"
repo: "make-docs"
branch: "make-docs-v2"
summary: "Landed the five-command tree with the setup subtree, the registry-derived run command, context-aware bare invocation, and the no-alias hard cutover."
---

# W18 R11 P2 Command Tree and Bare Command

## Changes

Implemented [Phase 2 of the W18 R11 backlog](../../../work/2026-07-01-w18-r11-cli-command-reorganization-and-operation-registry/02-command-tree-and-bare-command.md) per [PRD 39](../../../prd/39-revise-cli-command-reorganization-and-operation-registry.md) R-TOP-1 through R-TOP-3, R-BARE-1, R-REG-2, and R-MIG-1. The root parser in `packages/cli/src/cli.ts` now exposes exactly five top-level commands organized as project, run, serve, and self: `setup` (with `setup reconfigure`, `setup skills`, `setup backup`, and `setup remove` carrying the former install/sync, reconfigure, skills, backup, and project-level uninstall flows with their wizard, review, conflict, permission, and audit-snapshot semantics unchanged), `run`, `mcp`, and the reserved `update` and `uninstall` self-management names, which parse and refuse to act with the self-management phase named — `uninstall`'s refusal explicitly redirects project removal to `setup remove` so the meaning change cannot surprise anyone mid-wave. The old `reconfigure`, `skills`, `backup`, and `operations` top-level spellings fail with their new spelling named and no aliases. The new `run` surface (`packages/cli/src/run/cli.ts`) is derived from the Phase 1 registry: an operation's command path is exactly its identifier segments (`run playbook catalog` → `playbook.catalog`, `run work item resolve` → `work.item.resolve`), help and unknown-path errors are generated from `listOperations()`, per-identifier argv adapters keep the old `operations` flag spellings plus new `--kind`/`--payload-json`/`--store-root` flags for the work domain, and `listRunCliAdapters()` gives tests an adapter/registry parity seam. The old `operations` dispatcher (`packages/cli/src/operations/cli.ts`) shrank to the pruned legacy cluster only, reachable solely from tests until the pruning phase deletes it, with shared argv helpers extracted to `operations/cli-options.ts`. Bare `make-docs` is context-aware per R-BARE-1: with a manifest present it prints an install status summary (package, selections, compatibility classification) plus guidance and never syncs; with none it starts the guided interactive setup, degrades to printed guidance without a TTY, and rejects install/sync flags by naming the `setup` equivalent. Lifecycle UI strings, the maintainer and package READMEs, and the store documentation moved to the new spellings, and a packaging regression the cutover surfaced was fixed at the root: the Phase 1 registry made `zod` an eager import of the CLI entry while tsup left it external, so the packed tarball crashed when run directly with `node dist/index.js`; `zod` is now bundled via `noExternal` and the offline packed smoke passes again. All four Phase 2 tasks are checked off; the full suite is 665/665 with new coverage for the exact five-command top level, the R-BARE-1 status/guided/no-sync behaviors, the no-alias rejections, the reserved self-management errors, and run-tree/registry parity, and `scripts/smoke-pack.mjs` exercises the packed CLI end-to-end on the new spellings.

Manual-test coverage is deferred to wave completion per the session workflow; within this phase the built CLI was manually smoke-checked for `--help`, `run playbook catalog`, the removed-spelling rejection, bare-without-install guidance, and bare-with-install status output, all matching the new contract.

Developer- and user-guide coverage was `update-existing` across eleven guides in `docs/assets/library/`: the six user guides (getting-started, CLI lifecycle, both skills guides, both playbook guides) and five developer guides (runner architecture, packaging and adapters, skills catalog, maintainer boundaries, local build-and-install) now teach the `setup` family, the `run playbook`/`run package` spellings, the retained `run work item resolve` and `run work evidence record|read` operations, and the context-aware bare behavior; guides that taught pruned operations (`checkpoint`, `phase-gate`, `wave-status`) now state honestly that the pruning disposition removed them and the workflows are being rebuilt as Playbooks; the not-yet-shipped tool-level `update`/`uninstall` and MCP tool renames are tracked as `## Future Coverage` bullets rather than documented as available.

PRD coverage was `risk-register-update` with no change doc: the phase implements PRD 39 requirements as written. [R-024](../../../prd/03-open-questions-and-risk-register.md) advanced in place recording the landed five-command tree, registry-derived `run` surface, context-aware bare behavior, no-alias rejections, and reserved self-management names, and [D-002](../../../prd/03-open-questions-and-risk-register.md) advanced in place recording that public command guidance (package README, maintainer README, lifecycle strings, dogfood library guides) moved onto the new taxonomy, that `packages/docs/template/` greps clean of old spellings, and that the remaining bar is the pre-v2 warning language, root README, and MCP tool descriptions owned by later phases. One implementation note for the self-management phase: the reserved `update`/`uninstall` parsers currently honor only `--help` and ignore other flags before refusing; the real flag grammar lands with their behavior.

Validation: full CLI suite 665/665 across 41 files, `npx tsc --noEmit` at the pre-existing 67-error baseline, `npm run build` green, `node scripts/smoke-pack.mjs` exit 0 (offline direct-node preserved), `python3 .make-docs/scripts/check_path_hygiene.py` errors=0, `git diff --check` clean, and relative links across the eleven edited guides verified.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [../../../work/2026-07-01-w18-r11-cli-command-reorganization-and-operation-registry/02-command-tree-and-bare-command.md](../../../work/2026-07-01-w18-r11-cli-command-reorganization-and-operation-registry/02-command-tree-and-bare-command.md) | Marked Phase 2 tasks t1 through t4 complete. |
| [../../../prd/03-open-questions-and-risk-register.md](../../../prd/03-open-questions-and-risk-register.md) | Advanced R-024 (five-command tree landed) and D-002 (public command guidance moved to the new taxonomy) in place. |

### Developer

| Path | Description |
| --- | --- |
| [../../library/developer/playbooks-development-runner-architecture.md](../../library/developer/playbooks-development-runner-architecture.md) | Respelled the runner operation surface to `run playbook ...` and added the MCP-rename Future Coverage bullet. |
| [../../library/developer/playbooks-development-packaging-and-harness-adapters.md](../../library/developer/playbooks-development-packaging-and-harness-adapters.md) | Respelled the packaging surface to `run package plan|surface-resolve|write`. |
| [../../library/developer/skills-catalog-and-distribution-model.md](../../library/developer/skills-catalog-and-distribution-model.md) | Moved skills command mentions to `setup skills`. |
| [../../library/developer/maintainer-docs-assets-and-runtime-state-boundaries.md](../../library/developer/maintainer-docs-assets-and-runtime-state-boundaries.md) | Rewrote the work-lifecycle bullet around the retained `run work` operations and the pruned cluster's Playbook-rebuild disposition. |
| [../../library/developer/cli-development-local-build-and-install.md](../../library/developer/cli-development-local-build-and-install.md) | Moved local build/run instructions to `setup` invocations. |

### User

| Path | Description |
| --- | --- |
| [../../library/user/getting-started-installing-make-docs.md](../../library/user/getting-started-installing-make-docs.md) | Moved install commands to `setup` and documented the context-aware bare behavior. |
| [../../library/user/cli-lifecycle-managing-installations.md](../../library/user/cli-lifecycle-managing-installations.md) | Reworked the command model around the `setup` subtree, renamed uninstall to removal, and updated troubleshooting for the never-syncs bare command. |
| [../../library/user/skills-installing-and-managing-skills.md](../../library/user/skills-installing-and-managing-skills.md) | Moved skills management to `setup skills`. |
| [../../library/user/skills-decomposing-an-existing-codebase.md](../../library/user/skills-decomposing-an-existing-codebase.md) | Moved skill install commands to `setup skills`. |
| [../../library/user/playbooks-running-make-docs-workflows.md](../../library/user/playbooks-running-make-docs-workflows.md) | Moved playbook commands to `run playbook ...` and resolved the rename trigger in Future Coverage. |
| [../../library/user/playbooks-packaging-shareable-agent-workflows.md](../../library/user/playbooks-packaging-shareable-agent-workflows.md) | Moved packaging commands to `run package ...`. |
