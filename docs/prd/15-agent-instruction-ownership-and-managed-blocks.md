# 15 Agent Instruction Ownership and Managed Blocks

## Purpose

This document defines the current product contract for agent-instruction ownership, managed blocks, and conflict-safe preservation. Normative requirements are stated in the sections below; Requirement History is provenance only.
## Scope

This authority owns agent-instruction ownership, managed blocks, and conflict-safe preservation. Related PRDs own adjacent capabilities and are linked where a cross-boundary contract is required.
## Component and Capability Map

The requirements below define the owned components, behaviors, boundaries, and evidence expectations for this capability.
## Requirements

make-docs must own its instruction content through a deterministically delimited
managed block, not the whole shared file:

- make-docs maintains only the text between explicit markers in any installed
  instruction file; content outside the markers is owned by the project or user
  and is never modified.
- The substance of make-docs's root routing lives directly in the managed block.
  The installed root `AGENTS.md` and `CLAUDE.md` blocks mirror each other unless
  a future route-specific requirement explicitly needs different behavior.
- The managed block must not load, point to, or depend on dedicated
  `.make-docs/AGENTS.md` or `.make-docs/CLAUDE.md` instruction files.
- Reconciliation is block-scoped: the manifest tracks the block hash; editing
  content outside the block never conflicts; an edited block is re-asserted or
  surfaced as a block-scoped decision, not a whole-file conflict.
- Static template content remains authoritative: instruction file bodies come
  from `packages/docs/template/`; the CLI selects paths and reconciles blocks,
  but does not dynamically assemble alternate router content.
- Existing installs migrate non-destructively; project-specific content (for
  make-docs's own repo, the template-first maintainer rules) lives outside the
  block and persists across reconfigure. Clean W17 dedicated instruction files
  are removed when their manifest hashes still match.
- Non-instruction managed files keep the existing whole-file overwrite/skip
  conflict behavior for non-instruction managed files.

Code anchors:

- `packages/cli/src/managed-block.ts`
- `packages/cli/src/catalog.ts`
- `packages/cli/src/planner.ts`
- `packages/cli/src/manifest.ts`
- `packages/cli/src/audit.ts`
- `packages/cli/src/cli.ts`
## Tester Instruction and Coverage Boundaries

Managed agent instructions must route deferred-obligation and naive-UAT work to the authoritative contracts without embedding project-specific conventions. [R-NUAT-GOAL](46-naive-end-user-acceptance-testing.md#r-nuat-goal-real-world-goals-and-anti-coaching) requires tester isolation and anti-coaching: no internal terminology, hidden steps, expected answers, architecture knowledge, or compensating instructions that conceal a discoverability defect.

The instructions may distinguish the facilitator or developer role from the tester role, but [R-NUAT-COVERAGE](46-naive-end-user-acceptance-testing.md#r-nuat-coverage-coverage-pass-mechanics) forbids turning testing/UAT coverage into a persona-scoped pass.
## Contracts and Data

The named paths, schemas, state records, metadata fields, and evidence shapes in Requirements are normative contracts for this capability.
## Integrations

This capability integrates with the adjacent current authorities linked from Requirements and Source Anchors; those authorities remain owners of their own boundaries.
## Rebuild Notes

A rebuild must preserve the requirement identifiers, stable semantic anchors, ownership boundaries, and failure-safe behavior stated here. Implementation evidence does not silently weaken this authority.
## Managed Instruction Conflict Semantics

### Managed-Block Conflict Resolution

Managed instruction files are compared and resolved at the managed-block boundary. User-authored text outside the block is preserved; a divergent managed block requires explicit overwrite or preservation, and non-interactive execution must not guess. Whole-file hashing or replacement is not valid for a file that Make Docs owns only by managed block.

## Requirement History

### 2026-08-08 — W17 R0

- Affected requirement or section: `Document identity and current authority`
- Previous contract: The capability was represented as a standalone editorial change record whose title and structure described how the PRD set was modified.
- Replacement contract: This document now states the current agent-instruction ownership, managed blocks, and conflict-safe preservation requirements inline as product authority.
- Rationale: Active PRDs describe the current product shape; editorial operations belong in plans, work, and history.
- Source: [Agent instruction ownership design](../assets/archive/designs/2026-06-18-agent-instruction-file-ownership.md)
## Source Anchors

- `docs/assets/archive/designs/2026-06-18-agent-instruction-file-ownership.md`
- `docs/assets/archive/plans/2026-06-18-w17-r0-agent-instruction-file-ownership/00-overview.md`
- `packages/cli/src/managed-block.ts`
- `packages/cli/src/catalog.ts`
- `packages/cli/src/planner.ts`
- `.make-docs/manifest.json`
