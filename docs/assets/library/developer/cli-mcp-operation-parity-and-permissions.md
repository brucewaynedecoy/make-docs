---
title: CLI/MCP Operation Parity and Permissions
path: cli/mcp
persona: developer
status: draft
order: 30
tags:
  - cli
  - mcp
  - parity
  - permissions
applies-to:
  - cli
  - mcp
related:
  - ./cli-development-local-build-and-install.md
  - ./playbooks-development-runner-architecture.md
  - ./release-packaging-validation-and-release-reference.md
  - ./conformance-lab-scenario-and-result-contracts.md
  - ../../../prd/18-compatibility-classification-and-migration-safety.md
  - ../../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md
  - ../../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md
  - ../../../prd/28-shared-agentics-installation-and-harness-exposure.md
  - ../../../prd/35-run-playbook-state-machine-and-portability.md
  - ../../../prd/30-plugin-substrate-and-workflow-bundles.md
  - ../../../prd/39-cli-command-model-and-operation-registry.md
  - ../../../prd/39-cli-command-model-and-operation-registry.md
  - ../../../plans/2026-06-26-w10-r8-typescript-cli-operation-domains-and-mcp-runtime/00-overview.md
  - ../../../work/2026-06-26-w10-r8-typescript-cli-operation-domains-and-mcp-runtime/00-index.md
  - ../../../work/2026-07-01-w18-r11-cli-command-reorganization-and-operation-registry/00-index.md
---

# CLI/MCP Operation Parity and Permissions

## Overview

This guide is the maintainer contract for TypeScript CLI/MCP operation work. W10 R8 ships the first read-first MCP stdio surface through `make-docs mcp`; this guide defines how shipped and future MCP tools map back to existing TypeScript operation domains before maintainers document, package, or claim broader support for them.

The current implementation authority is the TypeScript package CLI. Rust is shelved indefinitely and is not a v2 prerequisite, package-validation target, MCP owner, or command-runtime peer. Future CLI, MCP, skill, plugin, and playbook surfaces must preserve the same manifest, config, asset, audit, compatibility, conflict, dry-run, backup, uninstall, and permission contracts.

## Current Boundary

Do not add MCP tools as independent behavior.

Deterministic behavior belongs in modular TypeScript operation domains under `packages/cli/src/operations/<domain>/`. Public CLI dispatch and MCP tool handlers should parse transport-specific input, call the shared domain function, and render the result. They should not own domain logic.

Since W18 R11 Phase 1, the operation registry at `packages/cli/src/operations/registry.ts` is the single source of truth for which deterministic operations exist per [PRD 39](../../../prd/39-cli-command-model-and-operation-registry.md) R-REG-1. Each operation is registered once with a stable, append-only `domain.verb` or `domain.object.verb` identifier, a zod input schema, a `read`/`write` mutation classification, and a handler taking the typed input plus an injected execution context. Per-operation definition modules live under `packages/cli/src/operations/<domain>/ops/<verb>.ts` and delegate to the domain implementation; the definition module owns the identifier and contract, never the logic. Surfaces adapt transport input into the operation's typed input, call `invokeOperation`, and render the result; dry-run, write-permission, and named-approval gating are enforced uniformly by the registry dispatch from the context's `writesAllowed`, `dryRun`, and `approvals` fields, so a surface must not add its own write checks (the MCP `allowWrite` argument now only populates the context). Dependency direction is one-way and mechanically pinned by `packages/cli/tests/operation-dependency-direction.test.ts`: surfaces import the core, the core never imports a surface, and no surface imports another surface (R-CORE-2). As of W18 R11 P5 the MCP operation tools are DERIVED from the registry (R-REG-2, R-MIG-3): each identifier maps to `make_docs_` plus the identifier with dots and hyphens as underscores (`playbook.status` becomes `make_docs_playbook_status`, `package.surface-resolve` becomes `make_docs_package_surface_resolve`), descriptors and input schemas are built at module load from the operation definitions with uniform `allowWrite`/`dryRun`/`approvals` context arguments, one generic dispatch path routes every derived tool through `invokeOperation`, and `verifyDerivedMcpToolParity()` plus `tests/mcp-derivation.test.ts` pin bidirectional tool/registry parity — never hand-add an operation tool.

The registered domains and identifiers, pinned append-only by `packages/cli/tests/registry-contract.test.ts`:

| Domain | Identifiers |
| --- | --- |
| `playbook` | `validate`, `catalog`, `resolve`, `capabilities`, `start`, `invoke`, `status`, `next`, `advance`, `gate`, `resume`, `close` (all active since the W18 R7 state-machine engine landed), plus the W18 R7 Phase 4 portability pair `run.export` and `run.import` |
| `package` | `plan`, `surface-resolve`, `write`, and — since W18 R12 — the `ship` composite, registered per the no-CLI-only-composites rule below |
| `work` | `item.resolve`, `evidence.record`, `evidence.read` — the retained work-operation slots keyed to the W18 R10 global-store project-state model |

Since W18 R12 Phase 3, the CLI `run` surface additionally carries two presentation-layer constructs that never reach MCP, governed by the PRD 39 agent-invariance rule (R-INV-1): operation result objects, MCP tool output, and the machine-readable CLI output remain byte-identical to their prior shapes except for additive fields and flags.

- **The render layer** (`packages/cli/src/run/render.ts`): on a TTY the `run` dispatcher renders per-operation human text; `--json` and a non-TTY stdout emit the full operation result byte-identical to before, so scripts and agents observe no change without passing any flag. MCP output derives from the operation result exactly as before — the render layer is CLI-only (R-RENDER-3) and lives in the surface presentation responsibility R-CORE-1 assigns. `packages/cli/tests/run-cli-experience.test.ts` pins the byte-identity of both machine channels, and the MCP derivation parity tests pass unchanged.
- **Declared CLI spellings** (`RUN_CLI_SPELLINGS` in `packages/cli/src/run/cli.ts`): an intent-named CLI path mapped to an existing registry identifier plus a fixed execution-context overlay — `run package preview` is `package.write` under the dry-run context. A spelling mints no registry identifier and derives no MCP tool; `listRunCliSpellings` is the conformance seam pinning each spelling to its registry identifier. The complement rule stays the W18 R11 parity rule: anything that composes or mutates behavior must be a real registered operation — `package.ship` is the model, registered with a `write` classification and derived to MCP as `make_docs_package_ship` — and a spelling must never be more than declared presentation routing. Never add an MCP tool, registry identifier, or write gate for a spelling, and never let text rendering alter what the machine channels emit.

Two deliberate off-registry surfaces exist, both maintainer lab tooling: the conformance kit generator (`packages/cli/src/conformance/kit.ts`, invoked through the maintainer-only `npm run conformance:kit` script) since W18 R13 Phase 2, and the conformance ingestion step (`packages/cli/src/conformance/ingestion.ts`, invoked through `npm run conformance:ingest`) since W18 R13 Phase 3. Each registers no operation and derives no CLI or MCP surface per [PRD 43](../../../prd/43-conformance-scenario-model-and-execution-kits.md) R-HOME-1 — shipping either would advertise a maintainer-lab capability whose required assets are structurally excluded from every install. The parity rule is preserved vacuously, asserted in the standard suite by `listConformanceLabShippedSurfaceViolations`, which fails if any registry identifier or `run` CLI adapter names a conformance-lab surface; the revisit seam for both generators is recorded on register item [Q-022](../../../prd/03-open-questions-and-risk-register.md).

The legacy `closeout`, `work`, and `lifecycle` inspection cluster — wave-status, work-phase-state, phase-plan, phase-gate, scope-guard, checkpoint, and the closeout probe/validate/history operations — is pruned by the [migrated-operations inventory disposition](../../artifacts/migrated-operations-inventory.md) and, as of W18 R11 P4, has no command surface: the legacy `operations` dispatcher is deleted and the eight pruned MCP tools are removed, with a dependency-direction guard keeping the dispatcher deleted. The internal domain functions remain in place as the recovery source for the Playbook rebuild (their retirement is the inventory's tracked follow-up), and no pruned name may ever be added to the registry — pinned by `registry-contract.test.ts` and the MCP tool-list absence test.

Every MCP capability needs:

| Requirement | Meaning |
| --- | --- |
| Operation owner | The CLI command or shared-core operation that owns the behavior. |
| Read shape | The exact read-only fields the MCP tool may report. |
| Plan shape | The dry-run or review plan emitted before any mutation. |
| Permission mode | The explicit permission gate required before a write. |
| Parity fixture | A test fixture proving the MCP path and CLI/shared-core path agree. |

Until those fields exist, the MCP capability remains a planning label, not a tool name or public API.

## MCP Capability Map

Use this table when extending the first MCP server. Capabilities marked shipped are available through `make-docs mcp`; planned capabilities remain requirements, not public tool ids.

| MCP capability | CLI/shared-core owner | Earliest safe mode | Status | Required proof |
| --- | --- | --- | --- | --- |
| Inspect operation domains | operation registry | read-only | Shipped | The domains payload is derived from `listOperations()` — domains `playbook`/`package`/`work` with each identifier's summary, mutation classification, and active/pending status. |
| Inspect installed state | manifest loader, config loader, package metadata reader, compatibility classifier, operation-domain registry | read-only | Shipped | Manifest, selections, harnesses, skills, materialization mode, package version, config rendering labels, operation domains, and compatibility classification match CLI/shared-core output. |
| Read manifest | manifest loader | read-only | Shipped | Manifest presence and parsed manifest fields match CLI/shared-core reads. |
| Read config | config loader | read-only | Shipped | Config labels and diagnostics match CLI/shared-core reads. |
| Classify compatibility | compatibility classifier | read-only | Shipped | Compatibility state, disposition, evidence, and audit behavior match CLI/shared-core classification. |
| Plan install or sync | no-command apply planner | dry-run plan | Shipped | Planned file actions are summarized without file content or writes, and conflict review data comes from the CLI planner. |
| Run closeout/work/lifecycle helpers | pruned by the inventory disposition | n/a | Removed (W18 R11 P4) | The eight pruned MCP tools and the legacy `operations` dispatcher are gone; the workflows are rebuilt as Playbooks, with only `run work item resolve` and `run work evidence record\|read` retaining deterministic slots. |
| Inspect selected agentics | selected-agentics manifest records and generated-stub resolver | read-only | Planned | Shared payload and generated harness exposure records match CLI install/audit classification. |
| Resolve system asset | accepted asset materialization resolver | read-only | Planned | Provider, immutable ref, hash set, offline expectation, and recovery guidance are visible without hidden provider state. |
| Validate project state | existing validators after they move behind CLI/shared-core operations | read-only or temp-fixture only | Planned | Validator results match CLI/shared-core output and do not mutate the target tree. |
| Plan reconfigure | reconfigure planner | dry-run plan | Planned | Selection-source and dependency behavior match CLI reconfigure dry-run semantics. |
| Plan skills sync or removal | skills command planner | dry-run plan | Planned | Selected-skill, skill-scope, and generated harness-stub behavior match CLI skills dry-run semantics. |
| Plan backup | backup audit and destination planner | read-first plan | Planned | Audit output and backup destination planning match CLI lifecycle review without copying files. |
| Plan uninstall | uninstall audit and review planner | read-first plan | Planned | Removable, preserved, skipped, and prunable path classifications match CLI lifecycle review without deleting files. |
| Run no-scripts replacement operation | future CLI/shared-core operation introduced by no-scripts migration | dry-run first | Planned | The migrated operation exists in the CLI package before MCP exposes it. |
| Inspect playbooks | playbook operation domain | read-only | Shipped | Playbook metadata, persona, stack, authority order, and runnable status match the accepted playbook contract. |
| Invoke Run Playbook model | playbook operation domain | write-gated plan/state | Shipped | The registry-derived `make_docs_playbook_start`/`make_docs_playbook_invoke` tools require `allowWrite=true`, which populates the execution context whose write gate the operation core enforces uniformly; they create the same Make Docs run state as the CLI/shared-core operation and mark support claims provisional until validation exists. |
| Inspect plugin or workflow bundle | plugin substrate and bundle metadata resolver | read-only | Planned | Plugin id, bundle id, selected payload, generated exposure, and support-claim status match plugin metadata contracts. |

If a future MCP capability does not fit the table, add the CLI/shared-core owner first. Do not let a new MCP-only behavior become the source of truth.

## Read-First Output Contract

The first MCP surface should be inspectable before it is writable. Read-only output may include:

| Output family | Required fields |
| --- | --- |
| Installed project | target path, manifest path, manifest presence, installed package version, current package/runtime version, and compatibility classification. |
| Manifest provenance | schema version, package name, package version, template/source mode, managed file hash algorithm, and hash records when available. |
| Harnesses | selected harness ids, generated instruction-router paths, and selected-agentics exposure paths when they exist. |
| Skills | selected skill ids, skill scope, shared payload records, generated harness stubs, and source-policy class when available. |
| Materialization mode | full-snapshot, provider-backed, hybrid-pinned-cache, or current bootstrap mode only after that mode is accepted by the materialization contract. |
| Config overlay | configured labels and persona text only after canonical paths, manifest keys, ids, skill names, contract names, and harness names are resolved. |
| Compatibility | classification id, disposition, evidence summary, and blocked-write reason when the state is not clean. |

MCP output must remain useful when provider-backed or cached assets are unavailable. Local bootstrap and manifest evidence must be enough for an agent to understand what is installed and what cannot safely be changed.

## Dry-Run Planning Contract

MCP plan tools must use the same plan vocabulary as the CLI surface they represent.

For install, sync, reconfigure, and skills planning, the plan must group actions by:

| Label | Meaning |
| --- | --- |
| `generate` | A selected managed file would be created. |
| `update` | A selected managed file is safe to replace or has an approved overwrite decision. |
| `skip` | A selected file would be preserved. |
| `remove` | A previously managed file or selected generated exposure would be removed. |

For backup and uninstall planning, the plan must group audit results by:

| Label | Meaning |
| --- | --- |
| `copyable` | A managed file or materialized directory can be copied into backup output. |
| `removable` | A managed file can be removed after review. |
| `preserved` | A candidate path is not safe to change automatically. |
| `skipped` | A candidate path is intentionally ignored, such as backup-root descendants. |
| `prunable` | A directory can be removed only after audited descendants are removed. |

No MCP plan may imply that a mutation has already been approved. A noninteractive MCP invocation that encounters unresolved conflicts, ambiguous ownership, or unsafe source state must stop with a reviewed-plan requirement rather than writing.

## Permission Requirements

MCP writes remain out of scope until a later implementation plan defines the permission model. That plan must choose explicit behavior for:

| Permission area | Required decision |
| --- | --- |
| Target scope | Which project root, home directory, cache directory, and generated artifact directories the server may inspect or write. |
| User approval | How the user approves a concrete plan, not just a general tool permission. |
| Noninteractive mode | Whether writes are forbidden, fail-before-write, or limited to temp fixtures. |
| Conflict handling | How reviewable managed-file diffs, modified managed files, unknown source state, and fallback paths stop or route to review. |
| Backup and uninstall | How one reviewed audit snapshot is preserved between backup and delete phases. |
| Provider/cache failure | Whether the tool falls back to local bootstrap, stops, or requires manual recovery. |
| Result evidence | Whether the run creates conformance evidence before public support wording changes. |

Until those decisions are accepted, MCP tools may inspect, validate in temp fixtures, and produce dry-run plans only.

## Parity Fixtures

Add fixture coverage before exposing or documenting an MCP capability as supported.

Required fixture families:

| Fixture family | Required assertion |
| --- | --- |
| Manifest reads | MCP and CLI/shared-core reads agree on schema version, package metadata, selected capabilities, selected harnesses, selected skills, and managed-file provenance. |
| Config interpretation | Config labels affect presentation only after canonical ids and paths are resolved. |
| Asset provenance | Provider-backed and cache-backed records expose provider, immutable ref, hash algorithm, hash set, offline expectation, and recovery guidance. |
| Compatibility classification | MCP write planning uses the same clean, modified, partial, malformed, and manual-review disposition as the CLI classifier. |
| Conflict handling | Managed-file diffs, unknown ownership, and unsafe paths stop or route to review exactly like CLI dry-run/apply behavior. |
| Dry-run output | MCP plans use the same action labels, selection-source wording, and no-write guarantees as CLI dry-run or lifecycle review. |
| Write permissions | Write attempts fail before mutation unless the later permission model authorizes the exact operation and target. |
| Runtime identity | TypeScript package invocations expose package/runtime version clearly enough for support triage. |
| Conformance evidence | Support claims cite reviewed scenario/harness/model/provider/runtime evidence when the claim involves agents or harnesses. |

Package smoke tests prove package behavior; they do not prove MCP support by themselves. Conformance records prove only the exact tuple they record.

## Change Checklist

Before implementing an MCP tool or CLI operation:

1. Identify the CLI/shared-core owner operation, and register it: add a per-operation definition module under `packages/cli/src/operations/<domain>/ops/` with a convention-conforming identifier, input schema, mutation classification, and handler, then extend the identifier pin in `packages/cli/tests/registry-contract.test.ts`. Identifiers are append-only; never rename or remove one.
2. Define read output and dry-run plan shape.
3. Add parity fixtures at the operation boundary.
4. Route every surface through `invokeOperation` with an execution context; never add per-surface write gating.
5. Keep writes blocked until the permission model exists.
6. Update package validation only when shipped package files change.
7. Add conformance scenarios before changing public support language.
8. Keep docs explicit about which MCP surfaces are shipped and which remain planned.

## Related Resources

- [Building and Installing the CLI Locally](./cli-development-local-build-and-install.md)
- [Run Playbook Runner Architecture](./playbooks-development-runner-architecture.md)
- [Packaging, Validation, and Release Reference](./release-packaging-validation-and-release-reference.md)
- [Conformance Lab Scenario and Result Contracts](./conformance-lab-scenario-and-result-contracts.md)
- [25 Revise CLI Separation and MCP Boundary](../../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [18 Revise Compatibility Audit and Migration Disposition](../../../prd/18-compatibility-classification-and-migration-safety.md)
- [25 TypeScript Runtime, CLI, MCP, and Operation Boundaries](../../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md#no-scripts-migration-dependency)
- [28 Revise Shared Agentics Installation Harness Redirection](../../../prd/28-shared-agentics-installation-and-harness-exposure.md)
- [35 Run Playbook State Machine and Portability](../../../prd/35-run-playbook-state-machine-and-portability.md#requirements)
- [30 Revise Harness Plugin Substrate Workflow Bundles](../../../prd/30-plugin-substrate-and-workflow-bundles.md)
- [39 Revise CLI Command Reorganization and Operation Registry](../../../prd/39-cli-command-model-and-operation-registry.md)
- [39 CLI Command Model and Operation Registry](../../../prd/39-cli-command-model-and-operation-registry.md#human-experience-and-package-grammar)
- [W18 R11 CLI Command Reorganization and Operation Registry Work](../../../work/2026-07-01-w18-r11-cli-command-reorganization-and-operation-registry/00-index.md)
