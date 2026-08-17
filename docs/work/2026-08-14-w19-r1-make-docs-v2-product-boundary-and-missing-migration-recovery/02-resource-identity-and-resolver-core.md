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

- [x] t1: Verify the exact worktree, branch, HEAD, free disk, dirty-state allowlist, accepted P1 closeout, and implementation authorization; stop on unexpected user work or unsafe growth.
- [x] t2: Reread the current normative bodies of every Source PRD plus PRD 03 and record each revision or content digest.
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
- Phase / capability status: Stage 1 remains open. P2 implementation is not authorized and remains locked.

#### 2026-08-17 read-only baseline

- Worktree: repository root (`.`).
- Branch: `make-docs-v2`.
- HEAD: `aa6560b8ab89166a0a150838d749fb4fadcb29c6`.
- Starting worktree state: clean.
- Dirty-state allowlist: none.
- Available disk: `95,600,000 KiB`.
- Accepted P1 evidence: The [P1 work record](./01-upstream-documentation-authority.md) is accepted at the same `aa6560b8ab89166a0a150838d749fb4fadcb29c6` SHA.
- Authorization: The owner authorized Decision Package 1 documentation correction only. P2 implementation is not authorized and remains locked.

##### Safety recheck

- During validation, free disk fell from the baseline `95,600,000 KiB` to `78,400,000 KiB`. It later recovered.
- Read-only inspection found `41,682.44 MiB` of swap use and 310 Munch MCP processes across active apps.
- The owner could not restart Codex because another task was running.
- The owner approved Option B. Work continues without a restart.
- The current recheck has `88,000,000 KiB` free, `26,580.56 MiB` of `27,648 MiB` swap in use, and 126 Munch MCP processes.
- Safety disposition: Continue only through the separate documentation gate.
- Before any P2 implementation, recheck disk, swap, process count, exact worktree, branch, HEAD, and the dirty-state allowlist.
- P2 implementation remains locked.

#### Source authority digests

| Source | Revision | SHA-256 digest |
| --- | --- | --- |
| PRD 02 | `02002ba` | `9138f2332bc7a93a3f7dcc0d7376ecc7213cce1e37c4e04ed9018dca9612f645` |
| PRD 06 | `834aef` | `c9191e278fb07707db357995f42dd1f5270d5d75fae9a0a13bbd5c7851c1159d` |
| PRD 17 | `02002ba` | `4c640f9c8560005e759a3f0314e750df893f9dd923b9cc3020d8bf8211830374` |
| PRD 18 | `02002ba` | `180a3a89032f8577a7cef7f03fdb6cce9885c90e3f9cf959d4f42e868bd8a4ae` |
| PRD 21 | `02002ba` | `b044071a6829b7812cad23fc6ade12ab8d703cfb7af2c224f0aae1d928442cf3` |
| PRD 25 | `02002ba` | `7ae999e5221c09b5e3f40a9f60431f65784f537f602334031a1fd7ddd3e69b90` |
| PRD 39 | `02002ba` | `9e6267e35bb0e09e2cead9f169f558407ed5cc12c4436ecd8973ee6fabe3a155` |
| PRD 03 | `834aef` plus the Decision Package 1 working change | Pre-decision digest `35d772d3d0ba08705482f27b8a114ec0e3a7762ac5d05900ff3c0bce9ade8222`; post-correction digest `fe620aed0e149cb2297da3de308eb73877f0dbc3f9ea647ef2da0c960aa296d5` |

#### Decision Package 1 - Q-010 prompt resource root

- Gate classification before correction: Q-010 was a `blocking` `closed-regression-check` because its closed text placed prompts under the reference namespace. This conflicted with the [accepted design](../../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md) and the accepted [P1 work record](./01-upstream-documentation-authority.md).
- Owner disposition: On 2026-08-17, the owner approved Option A. Q-010 stays `Closed`. Prompts are first-class peer system resources at `.make-docs/prompts/system/`, authored upstream at `packages/docs/template/.make-docs/prompts/system/`, supplied by the installed provider without required local projection, and projected when selected to `.make-docs/system/prompts/`. Prompts do not live under references or `docs/assets/**`.
- Commit record: The separate decision-only commit is `72ee9b214967346a2e6b1b16531e214d6e2b7b72`. It was pushed to `origin/make-docs-v2`.
- Gate state: Stage 1 is not complete. Tasks t3 through t8 remain open. P2 implementation is not authorized and remains locked.

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
