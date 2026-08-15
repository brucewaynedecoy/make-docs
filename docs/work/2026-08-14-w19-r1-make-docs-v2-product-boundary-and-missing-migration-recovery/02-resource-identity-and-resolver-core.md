---
title: "Phase 2: Resource Identity and Resolver Core"
kind: "work"
status: "active"
coordinate: "W19 R1 P2"
source:
  type: "prd"
  path: "docs/prd/17-system-asset-materialization-and-local-bootstrap.md"
---

# Phase 2: Resource Identity and Resolver Core

## Purpose

Implement the shared typed core for peer system-resource identity, provider and project resolution, provenance, path safety, and deterministic list/read/ensure behavior.

## Overview

The resolver serves contracts, prompts, references, and templates through one stable URI model independent of installation path. Provider resources remain available without local projection; selected clean projections and explicit project-owned overrides are classified and reported rather than silently treated as provider authority. CLI and MCP projection wait for P3.

## Source PRD Docs

- [PRD 02 — Architecture Overview](../../prd/02-architecture-overview.md)
- [PRD 06 — Template Contracts and Generated Assets](../../prd/06-template-contracts-and-generated-assets.md)
- [PRD 17 — System Asset Materialization and Local Bootstrap](../../prd/17-system-asset-materialization-and-local-bootstrap.md)
- [PRD 18 — Compatibility Classification and Migration Safety](../../prd/18-compatibility-classification-and-migration-safety.md)
- [PRD 21 — Project Tool Directory and Resource Tiers](../../prd/21-project-tool-directory-and-resource-tiers.md)
- [PRD 25 — TypeScript Runtime, CLI, and MCP Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [PRD 39 — CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md)
- [PRD 03 — Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md)

## Source Obligations, Scenarios, And Findings

- O-001 remains separate W18 R3 work; O-002 remains superseded.
- This internal core phase has no canonical `NUAT-###` execution. User-observable CLI/MCP behavior is evaluated when its owning projection phase activates it.
- Findings and capability status remain `none` unless linked canonical records are created by their owning workflow.

## Stage 1 - Phase-Entry PRD Question And Risk Gate

### Tasks

- [ ] t1: Verify the exact worktree, branch, HEAD, free disk, dirty-state allowlist, accepted P1 closeout, and implementation authorization; stop on unexpected user work or unsafe growth.
- [ ] t2: Reread the current normative bodies of every Source PRD plus PRD 03 and record each revision or content digest.
- [ ] t3: Reevaluate at minimum Q-003, Q-017, Q-018, R-004, R-017, and R-021; treat Q-017's current per-project resource model as authority unless separately redesigned and add newly relevant live items.
- [ ] t4: For every relevant `Open`, `Confirming`, `Deferred`, closed regression item, or new gap, record its ID, authority revision or digest, impact, classification (`blocking`, `impacted-nonblocking`, `unrelated`, `closed-regression-check`, or `new-authority-gap`), disposition, and rationale.
- [ ] t5: Record an explicit no-blocker determination and finite correction/review budget before unlocking t8 when no blocker or gap remains.
- [ ] t6: For any blocker or authority gap, stop before implementation and present an owner decision package with source anchors, affected phase and PRDs, bounded options and trade-offs, recommendation, consequences, exact PRD/register/history edits, focused validation, and a decision-only commit boundary; do not create a standalone decision file.
- [ ] t7: Require canonical authority updates, focused validation, a separate decision commit, and its recorded SHA before unlock; never infer closure from task completion.
- [ ] t8: Record the Stage 1 outcome, authority digests, accepted P1 evidence, and implementation unlock or stop result.

### Acceptance criteria

- The live question/risk record is complete and Q-017 is not silently redesigned.
- No implementation task unlocks with a blocker, authority gap, or missing decision commit SHA.
- Prior-phase evidence and current authority digests are traceable.

### Dependencies

- Accepted and validated P1 upstream authority.
- Current PRD authority and separate P2 implementation authorization.

### Closeout Notes

- Testing-mode decision(s): internal deterministic core; naive UAT remains deferred to a user-observable surface.
- Phase / capability status: gate result pending.

## Stage 2 - Implement Stable Resource Identity And Types

### Tasks

- [ ] t9: Define the closed peer type set `contracts`, `prompts`, `references`, and `templates` and the stable `make-docs://system/<type>/<posix-relative-path>` identity independent of provider or projection path.
- [ ] t10: Implement canonical POSIX-relative normalization, case and separator handling, duplicate detection, and typed rejection for traversal, absolute paths, empty segments, encoded escapes, and invalid resource types.
- [ ] t11: Implement provider identity and immutable provider-resource metadata, including source, version or digest, logical URI, and availability without project-local projection.
- [ ] t12: Model selected managed projection, explicit project-owned override, missing resource, conflict, and provider-only states without allowing path location to imply ownership.

### Acceptance criteria

- Every valid resource has one stable logical URI across development, packed, and projected locations.
- All four types share one type-safe identity contract.
- Invalid or ambiguous identities fail closed with typed outcomes.
- Provider availability never depends on `.make-docs/system/**` existing.

### Dependencies

- Stage 1 unlock.
- P1 schemas and catalogs.

### Closeout Notes

- Testing-mode decision(s): deterministic type, URI, normalization, and metadata fixtures.
- Phase / capability status: identity layer complete; resolution remains open.

## Stage 3 - Implement Resolution, Provenance, And Typed Operations

### Tasks

- [ ] t13: Implement the PRD-defined local-first resolution precedence while keeping project-owned overrides, clean managed projections, and provider resources distinguishable in the result.
- [ ] t14: Enforce repository-root and approved provider-root path containment, symlink non-following rules, realpath checks, and cross-platform path safety before reads or writes.
- [ ] t15: Implement deterministic typed list and read operations that return logical identity, resolved source, ownership, provenance, digest where available, and bounded not-found/conflict/error outcomes.
- [ ] t16: Implement on-demand ensure as an explicitly mutating operation that can create only selected clean managed projection content through the lifecycle conflict/review contract; keep ordinary list/read read-only.
- [ ] t17: Return provenance that identifies provider, managed projection, or explicit project override without converting an override into package authority or a projection into required runtime state.

### Acceptance criteria

- Resolution precedence is deterministic and provenance-preserving.
- Read-only operations never materialize files.
- Ensure cannot bypass selection, ownership, conflict review, or path safety.
- Symlink, traversal, and root-escape inputs fail closed.

### Dependencies

- Stage 2 types and identity.
- PRD 18 safety classifications for ambiguous states.

### Closeout Notes

- Testing-mode decision(s): provider, projection, override, conflict, missing, path, and symlink fixtures.
- Phase / capability status: core operations complete; public projections remain P3.

## Stage 4 - Prove Resolver Correctness

### Tasks

- [ ] t18: Add focused fixtures covering all four resource types across provider-only, clean projection, explicit override, conflict, missing, invalid, and cross-platform path cases.
- [ ] t19: Prove that identical inputs and fingerprints produce identical typed results and that unchanged valid evidence is reused rather than rerun.
- [ ] t20: Run focused core tests, type checks, path-hygiene checks, and changed-file whitespace validation without inventing performance thresholds or universal sample counts.
- [ ] t21: Obtain independent review of identity, precedence, mutation boundaries, and provenance; correct only actionable defects within the finite budget.
- [ ] t22: Record the exact typed interfaces, validation evidence, remaining nonblocking items, and P3 handoff.

### Acceptance criteria

- Focused tests cover success, conflict, path escape, symlink, and typed failure behavior for every resource type.
- List/read remain read-only and ensure remains explicitly mutating.
- Independent review finds no unresolved material resolver or provenance defect.
- P3 can project one shared operation core without reimplementing business logic.

### Dependencies

- Stages 2 and 3 complete.
- Finite evidence and correction budget.

### Closeout Notes

- Testing-mode decision(s): deterministic unit and fixture testing plus independent contract review.
- Phase / capability status: P2 may close with evidence; P3 remains separately gated.
