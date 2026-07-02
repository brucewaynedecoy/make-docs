---
title: "W18 R11 P1 Operation Registry and Shared Core"
kind: "history"
status: "completed"
date: "2026-07-02"
client: "Claude Code"
model: "Fable 5"
coordinate: "W18 R11 P1"
repo: "make-docs"
branch: "make-docs-v2"
summary: "Landed the append-only operation registry, the injected execution context, and per-operation core modules, and routed both existing surfaces through registry dispatch."
---

# W18 R11 P1 Operation Registry and Shared Core

## Changes

Implemented [Phase 1 of the W18 R11 backlog](../../../work/2026-07-01-w18-r11-cli-command-reorganization-and-operation-registry/01-operation-registry-and-shared-core.md) per [PRD 39](../../../prd/39-revise-cli-command-reorganization-and-operation-registry.md) R-REG-1, R-CORE-1, R-CORE-2, and R-SEQ-1. The operation registry at `packages/cli/src/operations/registry.ts` is now the single declarative source of truth for which deterministic operations exist: each `OperationDefinition` carries a stable identifier, a one-line summary, a `read`/`write` mutation classification, an `active`/`pending` status, a zod input schema, and a handler taking the typed input plus an injected `OperationExecutionContext` (`packages/cli/src/operations/context.ts`). Registry assembly enforces the lowercase dot-separated `domain.verb`/`domain.object.verb` convention with hyphenated multiword segments and rejects duplicates at module init, and `invokeOperation` enforces write-permission, named-approval, and pending-identifier gating uniformly from the context — replacing per-surface gating such as the MCP `allowWrite` check, whose argument now only populates the context.

Eighteen identifiers are registered through per-operation modules grouped by domain under `packages/cli/src/operations/<domain>/ops/` (R-CORE-1's never-a-monolith rule): `playbook.validate`, `playbook.catalog`, `playbook.resolve`, `playbook.capabilities`, `playbook.start`, `playbook.invoke`, and `playbook.status` active over the existing W18 R4/R6 implementations; `playbook.next`, `playbook.advance`, `playbook.gate`, `playbook.resume`, and `playbook.close` registered as `pending` identifiers that refuse invocation naming the W18 R7 lineage, since the [PRD 35](../../../prd/35-revise-run-playbook-state-machine.md) progression engine has not landed yet and identifiers must be fixed append-only ahead of it; `package.plan`, `package.surface-resolve`, and `package.write` over the W18 R5 packaging implementations, with `package.write`'s write/reviewed-overwrite/backup-snapshot-reviewed flags moved onto the context's dry-run and approvals fields; and the two retained work-operation slots from the [migrated-operations inventory disposition](../../artifacts/migrated-operations-inventory.md) — `work.item.resolve`, a tight identity resolver (new `resolveWorkItemIdentity` in `packages/cli/src/operations/work/index.ts`) that maps a coordinate or path to repo root, wave slug, and repo-relative phase path without the re-derivable next-incomplete-phase selection, and the `work.evidence.record`/`work.evidence.read` pair keyed to the canonical identity and stored through the W18 R10 global-store project-state model per [PRD 38](../../../prd/38-revise-global-store-and-project-state.md). Both existing surfaces now route every retained operation through `invokeOperation`: the legacy `operations` CLI dispatch (`packages/cli/src/operations/cli.ts`) and the MCP tools (`packages/cli/src/mcp/tools.ts`) are argv/args-to-input adapters with no operation logic and no per-surface write checks, satisfying the R-SEQ-1 no-hand-wired-retained-operations bar; the pruned wave/phase/closeout cluster deliberately remains hand-wired on the legacy surface until the Phase 4 pruning removes it and never enters the registry. One-way dependency direction is mechanically pinned by `packages/cli/tests/operation-dependency-direction.test.ts` (core never imports a surface, MCP and the CLI adapter never import each other; `src/cli.ts`/`src/index.ts` are the exempt composition root), which also motivated moving the `runOperationsCommand` re-export out of the `src/operations.ts` core barrel. The registry contract — exact identifier set, convention conformance, handler and classification presence, pruned-identifier absence, no lifecycle domains, uniform write refusal, and pending-lineage naming — is pinned by `packages/cli/tests/registry-contract.test.ts`, with per-domain behavior tests in `registry-playbook-ops.test.ts`, `registry-package-ops.test.ts`, and `registry-work-ops.test.ts` including a store round-trip for the evidence pair and proof that the identity resolver does not select the next incomplete phase. All seven Phase 1 tasks are checked off in the backlog file. Internal modularization of the large domain implementation files (notably `operations/playbook/index.ts`) is the R-SEQ-2 tracked follow-up: the per-operation definition modules delegate to those implementations rather than blocking on splitting them.

Manual-test coverage for this phase is deferred to wave completion per the session workflow (UAT runs once the whole W18 R11 wave lands); the phase is also core-infrastructure with no changed user-visible spellings — CLI and MCP outputs are byte-compatible, which the unchanged 610 pre-existing tests plus the existing MCP allowWrite expectations pin.

Developer-guide coverage was `update-existing`: the [CLI/MCP operation parity and permissions guide](../../library/developer/cli-mcp-operation-parity-and-permissions.md) now presents the registry as the parity mechanism — registration rules, the per-operation module layout, uniform context gating, the mechanically checked dependency direction, the registered identifier table with the pending W18 R7 five, and the pruned legacy cluster's status — and its change checklist starts from registering the operation. User-guide coverage was `none`: this phase changes no user-facing command, output, configuration, or troubleshooting path; the retained work operations gain their user-facing surface in Phase 4 and the reorganized tree in Phase 2, which is where user-guide updates belong.

PRD coverage was `risk-register-update` with no change doc: the phase implements PRD 39 requirements as written. [R-016](../../../prd/03-open-questions-and-risk-register.md) advanced in place recording the deliberate sequencing inversion — the five progression identifiers are registered `pending` ahead of the W18 R7 engine so they cannot drift — and [R-024](../../../prd/03-open-questions-and-risk-register.md) advanced in place recording that the first half of the R-SEQ-1 gate is met (no retained operation remains hand-wired) plus a follow-up guard: `playbook.validate` is mandated by PRD 34 R-MODEL-6 and registered, but PRD 39 R-RUN-1's `run playbook` verb enumeration omits it, so the Phase 4 surface must carry it deliberately.

Validation: full CLI suite 641/641 tests across 40 files (610 pre-existing plus 31 new registry/dependency tests), `npx tsc --noEmit` back to the pre-existing 67-error baseline (two new errors introduced during the phase were fixed; the baseline debt predates this wave), `npm run build -w packages/cli` green, and a built-CLI smoke of `operations playbook-catalog` through the registry path returned the expected catalog. `git diff --check` clean and touched-doc links verified.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [../../../work/2026-07-01-w18-r11-cli-command-reorganization-and-operation-registry/01-operation-registry-and-shared-core.md](../../../work/2026-07-01-w18-r11-cli-command-reorganization-and-operation-registry/01-operation-registry-and-shared-core.md) | Marked Phase 1 tasks t1 through t7 complete. |
| [../../../prd/03-open-questions-and-risk-register.md](../../../prd/03-open-questions-and-risk-register.md) | Advanced R-016 (pending progression identifiers ahead of the W18 R7 engine) and R-024 (registry/core landed, no hand-wired retained operations, `playbook.validate` surface guard) in place. |

### Developer

| Path | Description |
| --- | --- |
| [../../library/developer/cli-mcp-operation-parity-and-permissions.md](../../library/developer/cli-mcp-operation-parity-and-permissions.md) | Reframed the parity contract around the operation registry: registration rules, per-operation modules, uniform context gating, mechanical dependency-direction checks, and the registered identifier table. |

### User

None this session.
