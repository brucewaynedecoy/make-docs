---
title: "Phase 3: Operation Registry, CLI, and MCP"
kind: "work"
status: "active"
coordinate: "W19 R1 P3"
source:
  type: "prd"
  path: "docs/prd/39-cli-command-model-and-operation-registry.md"
---

# Phase 3: Operation Registry, CLI, and MCP

## Purpose

Register retained resource, general lifecycle-run, and Naive-UAT operations once and project them consistently through CLI commands, native MCP resources, and MCP tools.

## Overview

This phase keeps all deterministic policy and state-transition logic in the shared TypeScript operation core. CLI and MCP surfaces parse, authorize, invoke, and render; they do not create competing resource, run, UAT, Playbook, Protocol, plugin, or workflow models.

## Source PRD Docs

- [PRD 07 — CLI Command Surface and Lifecycle](../../prd/07-cli-command-surface-and-lifecycle.md)
- [PRD 17 — System Asset Materialization and Local Bootstrap](../../prd/17-system-asset-materialization-and-local-bootstrap.md)
- [PRD 21 — Project Tool Directory and Resource Tiers](../../prd/21-project-tool-directory-and-resource-tiers.md)
- [PRD 25 — TypeScript Runtime, CLI, and MCP Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [PRD 38 — Global Store and Project State](../../prd/38-global-store-and-project-state.md)
- [PRD 39 — CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md)
- [PRD 46 — Naive End-User Acceptance Testing](../../prd/46-naive-end-user-acceptance-testing.md)
- [PRD 03 — Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md)

## Source Obligations, Scenarios, And Findings

- O-001 remains separate W18 R3 work; O-002 remains superseded.
- Q-012 and Q-013 enter this phase only if agentic or plugin scope appears; ordinary CLI/MCP parity does not activate them.
- No `NUAT-###` identifier is invented. P3 supplies access paths; P7 owns activated scenario execution and evidence.
- Findings and capability status remain owned by their canonical repository records.

## Stage 1 - Phase-Entry PRD Question And Risk Gate

### Tasks

- [ ] t1: Verify the exact worktree, branch, HEAD, free disk, dirty-state allowlist, accepted P2 closeout, and implementation authorization; stop on unexpected user work or unsafe growth.
- [ ] t2: Reread all Source PRDs and PRD 03 from the active worktree and record each revision or content digest.
- [ ] t3: Reevaluate at minimum Q-001, Q-007, R-005, R-017, R-021, and R-025; include Q-012 and Q-013 only if live work introduces agentic or plugin scope, and add newly relevant items from the live reread.
- [ ] t4: Record the required ID, digest, impact, classification (`blocking`, `impacted-nonblocking`, `unrelated`, `closed-regression-check`, or `new-authority-gap`), disposition, and rationale for every relevant item.
- [ ] t5: Record an explicit no-blocker determination and finite correction/review budget before unlocking t8 when no blocker or gap remains.
- [ ] t6: Stop before implementation for each blocker or authority gap and present an owner decision package with source anchors, affected phase and PRDs, bounded options and trade-offs, recommendation, consequences, exact PRD/register/history edits, focused validation, and a decision-only commit boundary; create no standalone decision file.
- [ ] t7: Require canonical authority changes, focused validation, a separate decision commit, and its recorded SHA before unlock; task completion cannot close governed records implicitly.
- [ ] t8: Record the Stage 1 result, authority digests, P2 dependency evidence, and implementation unlock or stop result.

### Acceptance criteria

- Every relevant register item has a current classification record.
- Agentic/plugin questions are included only when that scope actually appears.
- Implementation remains locked until all blockers have a validated canonical decision commit.

### Dependencies

- Accepted P2 resolver core and typed interfaces.
- Current PRD authority and separate P3 implementation authorization.

### Closeout Notes

- Testing-mode decision(s): public-surface parity candidates are identified; scenario execution remains P7.
- Phase / capability status: gate result pending.

## Stage 2 - Register Retained Operations

### Tasks

- [ ] t9: Add resource list, read, and ensure operations to the canonical registry with stable identifiers, input/output schemas, mutation classification, provenance behavior, and typed errors sourced from P2.
- [ ] t10: Add the PRD-defined general lifecycle-run and Naive-UAT operation families as typed registry contracts, using P6 and P7 implementations when available rather than embedding state or UAT policy in registry metadata.
- [ ] t11: Do not introduce or reintroduce a Playbook/Protocol registry entry, unapproved plugin/workflow-bundle operation namespace, or affirmative legacy product claim, and fail closed on unknown operation identifiers; preserve every pre-existing Playbook/Protocol registry entry, implementation, and public surface unchanged as a frozen retirement candidate until P5 establishes lock/quiescence and P8 completes a fresh production-consumer trace, backup, and traced retirement.
- [ ] t12: Prove each P3-added retained or replacement registry entry resolves to one shared-core handler and that registry metadata cannot create a second lifecycle transition, resource type, Persona rule, or support claim; do not alter a frozen legacy entry to satisfy this proof.

### Acceptance criteria

- Every P3-added retained or replacement operation has one registry identity and one shared-core handler contract.
- Mutation classification and typed outcomes are explicit.
- P3 introduces no new or reintroduced Playbook/Protocol registry entry, unapproved plugin/workflow operation, or affirmative legacy product claim; every pre-existing Playbook/Protocol registry, implementation, and public surface remains unchanged and is not treated as current product authority.
- Registry metadata does not duplicate business logic.

### Dependencies

- Stage 1 unlock.
- P2 typed resource core; P6/P7 may supply later handler implementations behind the registered contracts.
- Mutation or removal of a frozen Playbook/Protocol retirement candidate depends on P5 lock/quiescence and P8 fresh production-consumer trace, backup, and traced retirement; P3 may inventory and preserve those surfaces but cannot retire them.

### Closeout Notes

- Testing-mode decision(s): registry completeness, uniqueness, handler resolution, and unknown-operation failure tests.
- Phase / capability status: registry contract complete; projections remain open.

## Stage 3 - Project The CLI Surface

### Tasks

- [ ] t13: Implement the PRD-defined CLI grammar for resource, lifecycle-run, and Naive-UAT operations as thin parsing and rendering adapters over the registry.
- [ ] t14: Preserve read-only versus mutating distinctions in help, dry-run/review flow, exit status, human output, and stable machine-readable output.
- [ ] t15: Render provenance, ownership, conflict, unavailable, blocked, and typed receipt outcomes without upgrading a receipt into proof of repository mutation or acceptance.
- [ ] t16: Verify CLI handlers contain no resolver precedence, Store transition, Persona selection, anti-coaching, finding, or gate business logic.

### Acceptance criteria

- CLI behavior derives from registered typed operations.
- Read-only commands cannot write and mutating commands preserve review/authorization boundaries.
- Human and machine-readable output preserve the same semantic outcome.
- CLI code contains no duplicated core or UAT policy.

### Dependencies

- Stage 2 registry contracts.
- Existing CLI lifecycle conventions in PRD 07.

### Closeout Notes

- Testing-mode decision(s): parser, rendering, exit-status, dry-run, and machine-output tests.
- Phase / capability status: CLI projection complete; MCP parity remains open.

## Stage 4 - Project Native MCP Resources And Tools

### Tasks

- [ ] t17: Expose system-resource inventory and reads through native MCP resources using the same stable URI, resolver, provenance, and typed not-found/conflict semantics as the CLI.
- [ ] t18: Expose explicitly mutating resource ensure, lifecycle-run, and Naive-UAT behavior through MCP tools that delegate to the same registry handlers and authorization checks.
- [ ] t19: Keep MCP native-resource reads side-effect free and prevent MCP transport code from defining alternative resource identity, Store transitions, Persona defaulting, UAT policy, or evidence routing.
- [ ] t20: Normalize CLI/MCP error and receipt projections so transport-specific envelopes do not change operation meaning; preserve every pre-existing Playbook/Protocol transport and public surface unchanged without adding a new legacy route or affirmative product claim.

### Acceptance criteria

- Native MCP resource and CLI reads resolve identical logical identities and provenance.
- MCP tools and CLI mutations invoke the same handlers and yield semantically identical typed outcomes.
- MCP transport contains no product business logic.
- P3 exposes no new Playbook or Protocol surface or affirmative product claim; any pre-existing public surface remains unchanged as a frozen P8 retirement candidate rather than being required absent during this phase.

### Dependencies

- Stages 2 and 3.
- MCP transport contracts in PRDs 25 and 39.
- P5 owns lock/quiescence and P8 owns freshly traced retirement; neither legacy-surface mutation nor removal is part of P3 projection.

### Closeout Notes

- Testing-mode decision(s): cross-surface parity, side-effect, schema, and error/receipt conformance tests.
- Phase / capability status: public projections complete; confirmation remains open.

## Stage 5 - Validate Surface Parity

### Tasks

- [ ] t21: Add focused conformance tests that inject registry, resolver, authorization, and transport failures and prove CLI/MCP semantic parity without shared test fixtures masking divergence.
- [ ] t22: Verify native MCP resource discovery/read behavior for all four types and typed-tool behavior for each mutating operation family.
- [ ] t23: Run focused CLI, MCP, registry, type, link/path, and whitespace checks; reuse unchanged valid evidence and do not invent performance targets.
- [ ] t24: Obtain independent review of registry ownership, public grammar, MCP resource/tool selection, policy duplication, new legacy exposure, and premature legacy-surface mutation or removal; correct only actionable defects within budget.
- [ ] t25: Record exact operation inventories, the frozen pre-existing Playbook/Protocol surface baseline, validation evidence, nonblocking items, the P4/P6/P7 handler handoffs, and the locked P5/P8 quiescence-and-retirement handoff.

### Acceptance criteria

- Focused parity and failure-injection tests pass.
- Every P3-added public surface maps to one registered operation or native read contract; the separately baselined legacy surfaces remain unchanged pending P5/P8.
- Independent review finds no unresolved duplicated logic, missing parity, newly introduced legacy exposure or claim, or premature mutation/removal of a pre-existing Playbook/Protocol surface.
- Downstream lifecycle, Store, and UAT phases can implement handlers without redefining transports.

### Dependencies

- Stages 2 through 4 complete.
- Finite correction/review budget.
- Preserved legacy surfaces remain locked for P5 quiescence and P8 fresh production-consumer trace, backup, and traced retirement.

### Closeout Notes

- Testing-mode decision(s): deterministic CLI/MCP conformance and independent surface review.
- Phase / capability status: P3 may close with evidence; P4 remains separately gated.
