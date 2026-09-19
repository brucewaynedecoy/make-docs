# TypeScript CLI and MCP Runtime Pivot

## Purpose

Capture the Make Docs v2 runtime correction that shelves the Rust CLI requirement, makes the TypeScript package/CLI the v2 runtime authority, and makes the MCP server a required TypeScript-owned shipping surface.

This design supersedes future-facing Rust ownership, same-command npm/Rust runtime, and PATH-order runtime-selection assumptions without reopening completed W10 R1, W10 R6, or W16 R3 work as historical implementation evidence.

## Context

The accepted v2 package and CLI designs previously described a TypeScript npm installer-maintainer CLI plus a future Rust agent-facing CLI/MCP runtime. Those documents were interpreted consistently by agents, but the product intent was miscommunicated: Rust was not intended to be a post-v2 prerequisite, same-name npm/Rust runtime selection was not the desired product model, and the TypeScript CLI should not be treated as a temporary deterministic-operation bridge.

W16 R3 moved lifecycle-critical deterministic behavior into the packaged TypeScript CLI through `make-docs operations`. That work remains useful evidence: selected first-party skills can call a package-owned deterministic boundary, and retired helper scripts can be classified safely. The current implementation shape, especially the consolidated `packages/cli/src/operations.ts`, is not the final development contract.

The correction must happen before more v2 work builds against the wrong runtime boundary. Future-facing designs, plans, PRDs, work backlogs, guide language, validation expectations, and support-claim wording must treat TypeScript as the v2 runtime authority and MCP as required.

## Decision

Use W10 R7 as the blocking corrective authority for Make Docs v2 runtime ownership.

The TypeScript package/CLI is the v2 runtime authority for:

- remote package execution through `npx`, `pnpm dlx`, and `bunx` / `bun x`;
- install, sync, reconfigure, selected-skill maintenance, backup, uninstall, audit review, compatibility classification, package/template validation, and migration flows;
- deterministic operation contracts currently exposed through `make-docs operations`;
- the required MCP server surface for v2.

Rust is shelved indefinitely and is not a v2 prerequisite, provider target, MCP owner, command-runtime peer, or package-validation target. Historical references to prior Rust planning may remain when they describe completed past work, but no future-facing v2 contract should require Rust parity, same-command npm/Rust coexistence, or PATH-order runtime selection.

Remote execution is the primary user posture. The package may expose an installed `make-docs` binary because package managers require a binary entry point, but documentation and validation should prefer remote execution through npm, pnpm, and Bun package-runner surfaces. Persistent local CLI installation is not the primary product posture.

MCP must ship as part of v2. MCP tools are TypeScript-owned and must delegate to the same modular operation domains used by CLI commands. MCP must not create a second behavior model for manifest reads, config interpretation, asset provenance, compatibility classification, conflict handling, dry-run output, write permissions, or package validation.

The TypeScript development contract is:

- deterministic make-docs logic lives in modular TypeScript operation domains, not skill-local scripts and not monolithic catch-all files;
- operation modules mirror CLI and MCP command domains as closely as practical;
- public CLI and MCP dispatchers stay thin and route into domain modules;
- domain logic is testable without invoking the full CLI parser or MCP transport;
- new deterministic behavior requires focused operation tests plus CLI/MCP parity expectations.

W16 R3 remains the first operation-boundary proof. It does not define the final module structure. Follow-on implementation must modularize the current operations surface while preserving the existing `make-docs operations ...` behavior.

## Alternatives Considered

### Keep Rust as the Long-Term Runtime Target

Rejected. The earlier documents created a misleading direction for v2 and encouraged implementers to treat TypeScript deterministic work as transitional. V2 should ship a hardened TypeScript runtime and MCP surface before any unrelated runtime exploration.

### Keep MCP Optional or Deferred Beyond V2

Rejected. MCP is part of the v2 product surface and must ship. Deferring it indefinitely would keep CLI/MCP parity abstract and leave plugin, playbook, and agentic surfaces without a concrete typed operation endpoint.

### Keep `operations.ts` as the Shared Core

Rejected as final architecture. The file is useful implementation evidence, but a monolithic operations module is not maintainable enough for humans or agents. The shared core must become modular operation domains with thin CLI and MCP dispatch.

### Rename or Split the Public CLI Immediately

Rejected for this correction. The immediate goal is to correct runtime ownership and development standards, not to introduce a public command rename or package split. Remote package execution remains the primary user posture through package-manager runners.

## Consequences

Active PRDs must be reconciled in place because the affected features are future-forward. Primary updates belong in PRD 16, PRD 25, and PRD 26; supporting updates belong in the architecture, package validation, materialization, compatibility, conformance, tool-directory, configuration, selected-agentics, plugin, adversarial-review, PRD index, and risk-register docs.

Active plans and work backlogs that still name Rust ownership, PATH-order runtime selection, same-name npm/Rust behavior, or optional/deferred MCP as future v2 targets must receive W10 R7 supersession notes. Historical references may remain only when clearly describing completed past work.

The follow-on implementation backlog should be W10 R8. It must modularize the TypeScript operation boundary, add the required TypeScript MCP server surface, add remote-execution validation for npm, pnpm, and Bun package runners, and keep W16 R3 behavior stable while refactoring.

No code modularization or MCP server implementation is part of W10 R7. W10 R7 creates the durable authority, PRD reconciliation, guardrails, and follow-on backlog needed before implementation resumes.

## Design Lineage

Update Mode: `new-doc-related`

Prior Design Docs: [Package and Deployment Boundaries](2026-06-19-package-and-deployment-boundaries.md), [CLI Separation and MCP Boundary](2026-06-20-cli-separation-and-mcp-boundary.md), [No-Scripts Migration and Skill Refactor](2026-06-20-no-scripts-migration-and-skill-refactor.md), [Shared Agentics Installation and Harness Redirection](2026-06-20-shared-agentics-installation-and-harness-redirection.md), [Harness Plugin Substrate and Workflow Bundles](2026-06-20-harness-plugin-substrate-and-workflow-bundles.md)

Reason: This design corrects the v2 runtime boundary established across W10 R1, W10 R6, W16 R3, W17, and W18 planning while preserving completed implementation evidence.

## Intended Follow-On

Route: `change-plan`

Next Prompt: [designs-to-plan-change.prompt.md](../../.make-docs/system/prompts/designs-to-plan-change.prompt.md)

Why: This design revises active package, CLI, MCP, deterministic-operation, package-validation, and work-backlog authority rather than establishing a new baseline.

Coordinate Handoff: Prior completed coordinates are W10 R1 for package boundaries, W10 R6 for CLI/MCP separation, and W16 R3 for the first no-scripts operation-boundary implementation. Use W10 R7 for the downstream corrective change plan and W10 R8 for the follow-on TypeScript operation-domain and MCP implementation backlog.
