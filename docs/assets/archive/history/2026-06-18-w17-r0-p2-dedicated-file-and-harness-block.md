---
date: 2026-06-18
coordinate: W17 R0 P2
closeout: phase
summary: "Moved root instruction ownership into harness-aware managed blocks and dedicated make-docs instruction files."
---

# Agent Instruction File Ownership - Phase 02 Dedicated File and Harness-Aware Block Closeout

## Changes

Phase 02 moved root instruction rendering to harness-aware managed blocks backed by dedicated `.make-docs/<harness>.md` instruction files. The CLI now includes dedicated Codex and Claude instruction assets in the desired asset catalog, renders root `AGENTS.md` and `CLAUDE.md` through the Phase 01 managed-block primitive, imports `.make-docs/CLAUDE.md` from the Claude block, and keeps essential inline routing in the Codex block because Codex documents `AGENTS.md` discovery but not an import include directive.

| Area | Summary |
| --- | --- |
| CLI source | Updated [`catalog.ts`](../../../packages/cli/src/catalog.ts) and [`renderers.ts`](../../../packages/cli/src/renderers.ts) so selected harnesses include `.make-docs/<harness>.md` and root instruction files render as one managed block. |
| Template source | Added dedicated managed instruction sources under [`packages/docs/template/.make-docs/`](../../../packages/docs/template/.make-docs/) and converted root template instruction files to managed blocks. |
| Tests | Added renderer assertions for one root block, Codex fallback routing, Claude import routing, and dedicated-file asset coverage; updated install/uninstall coverage for the new dedicated instruction paths. |
| Validation | Updated [`check-instruction-routers.sh`](../../../scripts/check-instruction-routers.sh) so parity checks allow harness-aware root blocks when a sibling `.make-docs/` dedicated instruction pair exists. |
| Work backlog | Marked all five tasks complete in [`02-dedicated-file-and-harness-block.md`](../archive/work/2026-06-18-w17-r0-agent-instruction-file-ownership/02-dedicated-file-and-harness-block.md). |
| Managed state | Left `.make-docs/runs/` uncommitted as local wave checkpoint state created by the workflow tooling. |

| Surface | Verdict | Rationale |
| --- | --- | --- |
| Developer guide/playbook | `none` | The phase changes generated instruction ownership internals; durable maintainer guidance should wait until later phases cover manifest hashing, conflict review, and install/reconfigure behavior together. |
| User guide | `none` | The installed instruction file structure changes, but no CLI command or user workflow changes yet; user-facing guidance is better after the full wave behavior is complete. |
| PRD reconciliation | `none` | The work implements the active PRD 15 dedicated-file and managed-root-block requirements without changing the requirement surface. |
| Manual test / UAT | `deferred` | UAT is intentionally skipped until the full W17 R0 wave is complete. Focused automated install, uninstall, renderer, and build checks cover this phase. |
| History | `create` | This record is the Phase 02 breadcrumb for task decisions, harness verification, coverage decisions, validation, and baseline debt. |

No novel gaps were found.

Harness verification:

- Claude Code: official documentation says `CLAUDE.md` is loaded and `@path` imports can split large files into separate imported files; Phase 02 uses `@.make-docs/CLAUDE.md`.
- Codex: official documentation describes `AGENTS.md` discovery and precedence; no import include directive is documented, so Phase 02 keeps essential inline routing plus a pointer to `.make-docs/AGENTS.md`.

Validation for closeout:

- `npm test -w packages/cli -- renderers`
- `npm test -w packages/cli -- install`
- `npm run build -w packages/cli`
- `scripts/check-instruction-routers.sh`
- `git diff --check`
- `python3 .agents/skills/closeout-phase/scripts/closeout_validate.py --probe-json /tmp/make-docs-w17-r0-p2-closeout-probe.json --run` reran the closeout command set; build, router, install/uninstall, skill-catalog, skill-registry, and diff-check coverage passed, while the aggregate consistency command retained the pre-existing unmanaged-template and risk-register expected-heading failures.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [`../../../packages/cli/src/catalog.ts`](../../../packages/cli/src/catalog.ts) | Adds dedicated `.make-docs/<harness>.md` instruction assets for selected harnesses. |
| [`../../../packages/cli/src/renderers.ts`](../../../packages/cli/src/renderers.ts) | Renders root instruction files through the managed-block primitive with harness-aware bodies. |
| [`../../../packages/cli/tests/renderers.test.ts`](../../../packages/cli/tests/renderers.test.ts) | Locks root block shape, Claude import routing, Codex fallback routing, and dedicated-file rendering. |
| [`../../../packages/cli/tests/install.test.ts`](../../../packages/cli/tests/install.test.ts) | Covers dedicated instruction files during harness install selection. |
| [`../../../packages/cli/tests/uninstall.test.ts`](../../../packages/cli/tests/uninstall.test.ts) | Keeps uninstall partial-failure coverage aligned with the new dedicated instruction files. |
| [`../../../scripts/check-instruction-routers.sh`](../../../scripts/check-instruction-routers.sh) | Allows harness-aware root instruction blocks while continuing to enforce ordinary router pair parity. |
| [`../../../packages/docs/template/.make-docs/AGENTS.md`](../../../packages/docs/template/.make-docs/AGENTS.md) | Adds the dedicated Codex make-docs instruction source. |
| [`../../../packages/docs/template/.make-docs/CLAUDE.md`](../../../packages/docs/template/.make-docs/CLAUDE.md) | Adds the dedicated Claude make-docs instruction source. |
| [docs/assets/archive/work/2026-06-18-w17-r0-agent-instruction-file-ownership/02-dedicated-file-and-harness-block.md](../archive/work/2026-06-18-w17-r0-agent-instruction-file-ownership/02-dedicated-file-and-harness-block.md) | Records Phase 02 task completion after evidence review. |

### Developer

No new developer guide was needed.
The phase is an implementation step inside the broader ownership migration; developer-facing guidance should be written only after the manifest, conflict, install, and reconfigure phases settle the complete contract.

### User

No new user guide was needed.
The phase changes generated instruction structure but does not change commands, prompts, or the user-facing install workflow yet.
