---
title: "W18 R11 P4 Run Surface Pruning and Retained Work Operations"
kind: "history"
status: "completed"
date: "2026-07-02"
client: "Claude Code"
model: "Fable 5"
coordinate: "W18 R11 P4"
repo: "make-docs"
branch: "make-docs-v2"
summary: "Removed the pruned cluster's remaining surfaces — the eight MCP tools and the legacy operations dispatcher — gated on recorded invocation tracing, and closed out the retained-surface stages."
---

# W18 R11 P4 Run Surface Pruning and Retained Work Operations

## Changes

Implemented [Phase 4 of the W18 R11 backlog](../../../work/2026-07-01-w18-r11-cli-command-reorganization-and-operation-registry/04-run-surface-pruning-and-retained-work-operations.md) per [PRD 39](../../../prd/39-revise-cli-command-reorganization-and-operation-registry.md) R-RUN-1, R-RUN-2, and R-SEQ-2. Stages 1 and 2 were landed by the earlier phases of this wave and were verified rather than re-implemented here: the `run playbook` and `run package` subtrees map one-to-one to registry identifiers over the Phase 1 core (with `playbook.validate` deliberately carried per the PRD 34 R-MODEL-6 guard recorded in the risk register, and the five PRD 35 progression verbs surfaced as pending identifiers), and the two retained work-operation slots — the `work.item.resolve` identity resolver and the `work.evidence.record`/`work.evidence.read` pair — record and read against the canonical identity in the W18 R10 global store, never a repository path. Stage 3 landed in this session. The eight pruned MCP tools — closeout-probe, closeout-validate, work-phase-state, wave-resolve, wave-status, phase-plan, scope-guard, and phase-gate — are removed from `packages/cli/src/mcp/tools.ts` (union, descriptors, dispatch, and now-unused helpers), and `make_docs_operation_domains` now derives its payload from the operation registry (domains `playbook`/`package`/`work` with each identifier's summary, mutation classification, and active/pending status) so the MCP surface no longer advertises any pruned operation. The legacy `operations` dispatcher (`packages/cli/src/operations/cli.ts`) is deleted with a dependency-direction test guard keeping it deleted, the legacy per-domain descriptor constants are gone, and the internal domain implementation functions remain in place per the surface-only scope (R-SCOPE-1) as the recovery source for the Playbook rebuild. Per t6's gating, the invocation trace of every removed spelling is recorded in the [migrated-operations inventory](../../artifacts/migrated-operations-inventory.md): the four shipped lifecycle skill packages (`work-on-wave`, `work-on-phase`, `closeout-phase`, `closeout-commit`) still teach the removed `make-docs operations ...` spellings across 8 instruction files and ship the Python originals as no-CLI fallbacks — their retirement is the inventory-tracked Playbook-rebuild follow-up under the PRD 26 removal-safety rules, deliberately not blocking this wave — while the shipped default Playbook references the pruned helpers only as optional Suggested Assists, the upstream template greps clean, and no other MCP consumer or code path invokes the removed names. All six Phase 4 tasks are checked off and the suite is 682/682 with new pins for MCP tool-list absence, registry-derived domains, and the dispatcher deletion guard.

Manual-test coverage is deferred to wave completion per the session workflow; the phase's surface removal is negative space (absence of tools and spellings) pinned by the R-TEST-4-seam assertions.

Developer-guide coverage was `update-existing`: the [CLI/MCP parity guide](../../library/developer/cli-mcp-operation-parity-and-permissions.md) capability map now marks the closeout/work/lifecycle helper row Removed with the Playbook-rebuild disposition, records the registry-derived domains payload, and states the pruned cluster has no command surface with the deletion guard and absence pins named. User-guide coverage was `none`: the guides already teach the retained surfaces and the pruned-operation removal from W18 R11 P2; this phase removed MCP tools no user guide documents (the MCP surface is described to users only in aggregate).

PRD coverage was `risk-register-update` plus an inventory-artifact update, with no change doc: the phase implements PRD 39 requirements as written. [R-024](../../../prd/03-open-questions-and-risk-register.md) advanced in place recording the pruning-absence completion, the registry-derived MCP domains payload, and the skill-package tracing disposition; the [migrated-operations inventory](../../artifacts/migrated-operations-inventory.md) gained the dated "Invocation Tracing at Surface Removal" section as the tracked pruning evidence.

Validation: full CLI suite 682/682 across 42 files, `npx tsc --noEmit` at the pre-existing 67-error baseline, `python3 .make-docs/scripts/check_path_hygiene.py` errors=0, and `git diff --check` clean.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [../../../work/2026-07-01-w18-r11-cli-command-reorganization-and-operation-registry/04-run-surface-pruning-and-retained-work-operations.md](../../../work/2026-07-01-w18-r11-cli-command-reorganization-and-operation-registry/04-run-surface-pruning-and-retained-work-operations.md) | Marked Phase 4 tasks t1 through t6 complete. |
| [../../../prd/03-open-questions-and-risk-register.md](../../../prd/03-open-questions-and-risk-register.md) | Advanced R-024 in place with the pruning-absence completion and skill-tracing disposition. |
| [../../artifacts/migrated-operations-inventory.md](../../artifacts/migrated-operations-inventory.md) | Added the dated invocation-tracing section recording the removal evidence per spelling. |

### Developer

| Path | Description |
| --- | --- |
| [../../library/developer/cli-mcp-operation-parity-and-permissions.md](../../library/developer/cli-mcp-operation-parity-and-permissions.md) | Marked the pruned helper capability Removed, documented the registry-derived domains payload and the dispatcher deletion guard. |

### User

None this session.
