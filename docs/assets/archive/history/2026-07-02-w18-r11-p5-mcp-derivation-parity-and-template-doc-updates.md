---
title: "W18 R11 P5 MCP Derivation Parity and Template Doc Updates"
kind: "history"
status: "completed"
date: "2026-07-02"
client: "Claude Code"
model: "Fable 5"
coordinate: "W18 R11 P5"
repo: "make-docs"
branch: "make-docs-v2"
summary: "Derived the MCP tool list and names from the operation registry, ending the hand-maintained CLI/MCP mirror, and verified the template tree needs no command-spelling updates."
---

# W18 R11 P5 MCP Derivation Parity and Template Doc Updates

## Changes

Implemented [Phase 5 of the W18 R11 backlog](../../../work/2026-07-01-w18-r11-cli-command-reorganization-and-operation-registry/05-mcp-derivation-parity-and-template-doc-updates.md) per [historical closeout](2026-07-02-w18-r11-p6-verification-and-testing.md) (retired action-PRD: `docs/prd/39-revise-cli-command-reorganization-and-operation-registry.md`) R-REG-2, R-MIG-3, R-CORE-1, and R-KEEP-1. The MCP operation tool list in `packages/cli/src/mcp/tools.ts` is now generated from the Phase 1 registry at module load: every one of the eighteen identifiers gets exactly one derived tool whose name is `make_docs_` plus the identifier with dots and hyphens mapped to underscores (`playbook.status` → `make_docs_playbook_status`, `package.surface-resolve` → `make_docs_package_surface_resolve`, `work.item.resolve` → `make_docs_work_item_resolve`), whose description carries the operation summary with pending operations marking their owning W18 R7 lineage, and whose input schema is the operation's own zod schema shape plus the uniform context arguments — `allowWrite` on write-classified tools, `dryRun` and `approvals` on all — which one generic dispatch path strips into `createExecutionContext` before calling `invokeOperation`, so MCP write gating flows entirely through the shared execution context with no per-tool `allowWrite` conditional remaining (the delegation contract from PRD 25 — same reads, config interpretation, provenance, audit, dry-run, and write permissions as the CLI operation — is preserved by construction, since both surfaces call the identical core seam). The derivation renames three tools with no aliases: `make_docs_playbook_run_start` → `make_docs_playbook_start`, `make_docs_playbook_run_invoke` → `make_docs_playbook_invoke`, and `make_docs_playbook_run_read` → `make_docs_playbook_status`; a derivation side effect renames the MCP `stack` argument to the operation input's `requestedStack`. The seven hand-defined playbook tool descriptors, their dispatch cases, and the per-tool adapter helpers were deleted; the six non-operation inspection tools (operation domains, installed state, manifest, config, compatibility, install plan) remain hand-defined lifecycle reads per R-SURF-1. `verifyDerivedMcpToolParity()` and `listDerivedMcpOperationTools()` provide the R-TEST-1 conformance seam, and the new `packages/cli/tests/mcp-derivation.test.ts` pins bidirectional tool/registry parity with injected-mismatch failure modes, the exact derived spellings including the renames, core-enforced write denial with a grep-assert that no per-tool allowWrite check survives, the five pending refusals, approval and dry-run context flow, and descriptor markers. The Stage 2 template inventory (t4/t5) resolved as a verified no-op: `packages/docs/template/` contains no file naming an old command spelling, bare-sync description, or removed top-level command — the template tree is documentation machinery, not CLI usage docs — so nothing needed upstream authoring or dogfooding, and the template/dogfood parity spot-check confirmed the installed contracts are byte-identical with the root `AGENTS.md` differing only by the intentional maintainer-dogfooding addendum. The shipping README surfaces did need the cutover and got it: the root `README.md` quick-start examples moved to `setup` spellings with the context-aware bare behavior described, completing the package-README work from Phase 2. All five Phase 5 tasks are checked off; the suite is 690/690 across 43 files.

Manual-test coverage is deferred to wave completion per the session workflow; the derivation is pinned by the new conformance suite, and tool behavior is asserted to be byte-compatible with the operation core through the shared dispatch.

Developer- and user-guide coverage was `update-existing`: the [CLI/MCP parity guide](../../library/developer/cli-mcp-operation-parity-and-permissions.md) now documents the derivation rule, the never-hand-add-an-operation-tool rule, and the parity seam; the [runner architecture guide](../../library/developer/playbooks-development-runner-architecture.md) and [running-playbooks user guide](../../library/user/playbooks-running-make-docs-workflows.md) moved their quoted tool names to the derived spellings and resolved their MCP-rename Future Coverage triggers; the [CLI lifecycle guide](../../library/user/cli-lifecycle-managing-installations.md) cleared its resolved trigger.

PRD coverage was `risk-register-update` with no change doc: the phase implements PRD 39 requirements as written. [R-024](../../../prd/03-open-questions-and-risk-register.md) advanced in place — the last hand-maintained mirror is closed, the template consequence resolved as a verified no-op, and the remaining close conditions narrow to the Phase 6 R-TEST suite and packaged smoke coverage.

Validation: full CLI suite 690/690 across 43 files, `npx tsc --noEmit` at the 67-error pre-existing baseline (the derivation removed eight baseline errors the old per-tool adapters carried), `python3 .make-docs/scripts/check_path_hygiene.py` errors=0, and `git diff --check` clean.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [../../../work/2026-07-01-w18-r11-cli-command-reorganization-and-operation-registry/05-mcp-derivation-parity-and-template-doc-updates.md](../../../work/2026-07-01-w18-r11-cli-command-reorganization-and-operation-registry/05-mcp-derivation-parity-and-template-doc-updates.md) | Marked Phase 5 tasks t1 through t5 complete. |
| [../../../prd/03-open-questions-and-risk-register.md](../../../prd/03-open-questions-and-risk-register.md) | Advanced R-024 in place: MCP derivation landed, template consequence a verified no-op, close conditions narrowed to Phase 6. |
| [../../../README.md](../../../README.md) | Moved the root quick-start examples to the `setup` spellings and described the context-aware bare command. |

### Developer

| Path | Description |
| --- | --- |
| [../../library/developer/cli-mcp-operation-parity-and-permissions.md](../../library/developer/cli-mcp-operation-parity-and-permissions.md) | Documented the MCP tool derivation rule, parity seam, and never-hand-add rule. |
| [../../library/developer/playbooks-development-runner-architecture.md](../../library/developer/playbooks-development-runner-architecture.md) | Moved quoted MCP tool names to the derived spellings and resolved the rename trigger. |

### User

| Path | Description |
| --- | --- |
| [../../library/user/playbooks-running-make-docs-workflows.md](../../library/user/playbooks-running-make-docs-workflows.md) | Moved quoted MCP tool names to the derived spellings and resolved the rename trigger. |
| [../../library/user/cli-lifecycle-managing-installations.md](../../library/user/cli-lifecycle-managing-installations.md) | Cleared the resolved MCP-rename Future Coverage trigger. |
