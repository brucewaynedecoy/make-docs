---
title: "Phase 3: Tests and Package Proof"
kind: "work"
status: "draft"
coordinate: "W22 R1 P3"
source:
  type: "prd"
  path: "docs/prd/10-packaging-validation-and-release-reference.md"
---

# Phase 3: Tests and Package Proof

## Purpose

Expand the focused P1/P2 cases into integration, negative, and authentic upgrade proof. This is development proof. The final versioned tarball is proved again in P4. See [plan P3](../../plans/2026-10-31-w22-r1-checkout-move-and-block-ownership/03-tests-and-package-proof.md).

## Overview

Use the published 2.0.5 artifact to create the authentic seed. Current-source fixtures can test fault handling, but cannot replace that seed. All future mutations use isolated test roots and disposable Stores through MAKE_DOCS_HOME or existing platform test adapters. Use task-scoped temp-root variables. Do not change HOME, home, or CODEX_HOME. Use temporary plain project copies; do not create branches or worktrees without separate explicit user permission. Do not touch real Store or machine settings.

## Current Testing Decisions

Use the [common decision record](00-index.md#common-testing-decision-record). It supplies the reason, maturity, executor, gate effect, budget, stop condition, retained evidence, and rerun trigger. The phase scope is expanded integration/negative matrix, authentic released seed, and development installed proof.

| Testing type | Current decision | Phase record |
| --- | --- | --- |
| Automated Implementation Testing | Planned; required for exact correctness claims after authorization | expanded integration/negative matrix, authentic released seed, and development installed proof; affected-first tests before broader proof; use the shared finite budget. |
| Performance Testing | not-needed-now | No speed/scale claim; zero runs. Revisit only for a new accepted performance claim or relevant cost risk. |
| Guided Progress Review | Optional and advisory | Offer one disposable moved-project goal in one to five steps after the first meaningful installed increment, once and for at most 15 minutes if accepted. A decline or no response creates no gate or obligation. |
| Unassisted Goal Testing | not-needed-now | The known failure can be answered by automated proof and agent review. Revisit for material discoverability uncertainty those cannot answer, or explicit product/release authority. No scenario or tester is selected. |

Human Experience Review remains required agent work. Inspect the available real result for each promise and record the reviewer, observations, conclusion, evidence, limit, and next action in [evidence.md](evidence.md). It is not a fifth test type. No explicit human acceptance gate is selected.

Performance fields: base action is correctness repair; applicability is not-needed-now; canonical profile is none; budget, packet, outcome, and performance gate are not-applicable. Do not run a benchmark.

## Human Experience Outcome

- Impact and promise: direct; the installed flow preserves text and identity and explains every review state.
- Intended human outcome: the user can repair each renamed target through normal setup.
- Surface: actual installed CLI/MCP output and project files.
- Work: grouped negative cases, authentic seed, development package proof, and agent review.
- Evidence: exact package/seed identities, logical before/after records, byte comparisons, transcripts, and failure records.
- Executor: authorized maintainer or agent; any advisory walkthrough needs a willing participant.
- Obligation route: none. Unrun required proof remains an explicit blocker, not an invented obligation.
- Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Source PRD Docs

- [PRD 10: candidate proof](../../prd/10-packaging-validation-and-release-reference.md).
- [PRD 15: block ownership](../../prd/15-agent-instruction-ownership-and-managed-blocks.md).
- [PRD 18: migration safety](../../prd/18-compatibility-classification-and-migration-safety.md).
- [PRD 38: Store identity and safety](../../prd/38-global-store-and-project-state.md).
- [PRD 25: shared CLI/MCP boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md).
- [PRD 50: proportionate testing](../../prd/50-proportionate-testing-and-human-centered-validation.md).
- [PRD 46: unassisted testing](../../prd/46-naive-end-user-acceptance-testing.md).

## Source Obligations, Scenarios, And Findings

- Accepted obligations and activated NUAT scenarios: none.
- Finding: [D-049](../../prd/03-open-questions-and-risk-register.md#d-049-moved-checkout-setup-bypasses-project-identity-and-managed-block-ownership).
- Dependencies: [P1](01-authority-and-ownership.md) and [P2](02-setup-path-move-flow.md).
- Full required scope: [plan matrix](../../plans/2026-10-31-w22-r1-checkout-move-and-block-ownership/03-tests-and-package-proof.md#required-test-matrix).

## Grouped Matrix

| Group | Required cases and result |
| --- | --- |
| Ownership | Outside edits in both root files succeed unchanged; edited blocks and missing/duplicate/reversed/malformed markers stop; changed owned files still stop. |
| Saved proof | v1 transition requires independently saved proof; absent block proof and unknown evidence version stop; authentic schema-1 keeps exact whole-file adoption rules. |
| Old reader | After the fixed tool saves v2 evidence, move a disposable copy again. Released 2.0.5 must refuse that further relocation without deleting rows/history. This does not promise refusal of ordinary reads or writes at an already-bound path, or downgrade support. |
| Identity/config | Comments/settings survive; wrong/invalid/missing IDs diagnose precisely; same-name different-ID records never cross-bind. |
| Source/target | Live/recreated source, several absent/live records, target claim, source switching after preview, and source/target/config/proof drift reject unsafe selection. |
| Work/locks | Pending install and active writer give a recovery route; dead locks use existing verified recovery policy. |
| No-change paths | Status/preview/dry-run/cancel/no approval/bare --yes leave logical durable state unchanged and release transient leases. |
| Access | Read-only callers cannot apply; MCP target-root denial holds despite Store permission; approval never widens grants or machine config. |
| Scope | Apply cannot bootstrap/write config/replace ledger/migrate unsupported schema/register a separate checkout. The separate action must force a distinct binding. |
| Atomicity | Crash before commit keeps old path; path/evidence/receipt commit together; reply loss/retry creates no duplicate receipt or record. |
| Platform | Case-only paths, collisions, safe/unsafe symlinks follow existing rules without durable inode/device identity. |
| Monorepo/repeat | Root approval leaves kit untouched; kit needs separate target; later setup cancellation preserves clear move state; second run proposes no move. |

## Stage 1 - Expand Regression and Boundary Coverage

### Tasks

- [x] t1: Add grouped cases to the focused w22-r1-checkout-move suite and nearest existing ownership, installation, CLI, wizard, MCP, and W22 platform/legacy/router suites. Keep the matrix explicit without making one task per edge.
- [x] t2: Add Store-only and old-reader guards. Compare logical durable tables, ledger bytes, IDs, and receipt/history identities; permit released transient leases without mistaking support-file checksums for durable mutation.
- [x] t3: Run affected suites after P1/P2. Retain failure details and fix only relevant defects within the common two-cycle repair budget. Stop for an unsafe fixture or exhausted budget.

### Acceptance criteria

- A17: Every grouped matrix row has an executable case or a precise blocked result. Old-reader refusal never becomes an unsupported downgrade claim.
- A18: Unchanged-state assertions compare logical durable rows, identity/history facts, ledger bytes, and project file state as relevant. A raw database checksum alone is insufficient. No case uses the live Store or owner checkout.

### Dependencies

- P1/P2 implementations and focused cases.
- Separate execution authorization and isolated test adapters.

### Closeout Notes

Expanded tests are planned, not run. Store each actual result and its covered group in evidence.md. Required failures block only the affected correctness/release claims.

## Stage 2 - Build the Authentic Seed and Development Proof

### Tasks

- [x] t4: Obtain the published @brucewaynedecoy/make-docs@2.0.5 tarball from the registry or an approved archive. Record source, package/version, published integrity, and local SHA-256. A verified cache may supply the same artifact. If unavailable or unverified, stop authentic proof as blocked; never substitute hand-written rows or current source.
- [x] t5: Use released 2.0.5 to install a disposable buildos root and a separately installed kits/make-blueprint project with another ID. Snapshot the seed project and Store, add prefix/suffix text to both root instruction files, then rename the parent to make-kit.
- [x] t6: Run normal setup with the fixed development candidate. Approve only the root move, prove kit unchanged, then separately move the kit. Record file bytes, selected path bindings, IDs, ledger facts, and history counts/identities. Repeat setup to prove no move/fresh install.
- [ ] t7: Inspect successful, cancelled, ambiguous, unsafe, and later-setup-failure output in the actual installed candidate. Record required agent Human Experience Review against index promises. Offer the bounded advisory Guided Progress Review and record feedback or decline without a release gate.

### Acceptance criteria

- A19: Authentic upgrade proof comes from the verified published 2.0.5 artifact. An unavailable seed is reported blocked without a synthetic substitute.
- A20: Root and kit moves preserve outside bytes, identities, ledger, and history independently. A second run makes no move.
- A21: Human and JSON output agree on subject, paths, effect, current state, and next action. Agent review records evidence and limits; any owner walkthrough remains advisory.

### Dependencies

- Stage 1 and verified released seed.
- Development candidate installed from a recorded artifact. It may still report 2.0.5; label it development proof.

### Closeout Notes

Do not call a development package the final 2.0.6 candidate. D-049 stays open. No human acceptance response, NUAT run, or benchmark is required by these decisions.

## Stage 3 - Complete Development Checks and Hand Off

### Tasks

- [x] t8: Recheck package scripts, then run npm test, npm run validate:defaults, npm run build, and bounded npm run smoke:pack:local for development evidence. Preserve existing required legacy/setup/Store checks.
- [x] t9: Extend the package-proof runner and platform-safety workflow to carry the new case against one downloaded candidate. Keep real-host and final-artifact requirements for P4; source tests alone do not add installed workflow coverage.
- [x] t10: Assemble actual development results and limits in evidence.md. Retain exact artifact/runtime/OS/command facts and the seed snapshot route. Hand off final-version and full-smoke/host proof to P4.

### Acceptance criteria

- A22: Development checks have exact recorded results and finite scope. Required failures are fixed or reported blocked.
- A23: The runner/workflow explicitly includes the renamed-project case without replacing PRD 10's existing fixed legacy matrix, link/no-scripts checks, or CLI/MCP proof.
- A24: The handoff states that final 2.0.6 artifact, complete smoke:pack, and real-host proof are still required after the version bump.

### Dependencies

- Stages 1 and 2.
- Current package scripts and PRD 10. No assumed old waiver closes a new required case.

### Closeout Notes

Record actual four-type decisions, agent review, supported scope, and unrun items. Update evidence.md only with facts. No release, version bump, live repair, or passing final candidate is implied.
