---
title: "Phase 8: Traced Playbook and Protocol Retirement"
kind: "work"
status: "active"
coordinate: "W19 R1 P8"
source:
  type: "prd"
  path: "docs/prd/34-playbook-authoring-contract-and-model.md"
---

# Phase 8: Traced Playbook and Protocol Retirement

## Purpose

Retire only freshly traced Make Docs-owned Playbook and Protocol runtime, packaging, test, conformance, support, and unnecessary agentic surfaces while preserving all ambiguous, user-owned, historical, and opaque legacy content.

## Overview

This phase implements migration checkpoint 11 under the still-active P5 lock and quiescence barrier. Removal is evidence-driven and fail-closed: a matching name, old plan, archive entry, path, or inferred intent never proves ownership. Replacement resource, lifecycle-run, and Naive-UAT surfaces must already be complete.

## Source PRD Docs

- [PRD 01 — Product Overview](../../prd/01-product-overview.md)
- [PRD 02 — Architecture Overview](../../prd/02-architecture-overview.md)
- [PRD 04 — Glossary](../../prd/04-glossary.md)
- [PRD 08 — Skills Catalog and Distribution](../../prd/08-skills-catalog-and-distribution.md)
- [PRD 18 — Compatibility Classification and Migration Safety](../../prd/18-compatibility-classification-and-migration-safety.md)
- [PRD 20 — Agent Harness Conformance and Support Claims](../../prd/20-agent-harness-conformance-and-support-claims.md)
- [PRD 25 — TypeScript Runtime, CLI, and MCP Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [PRD 28 — Shared Agentics Installation and Harness Exposure](../../prd/28-shared-agentics-installation-and-harness-exposure.md)
- [PRD 30 — Agentic Extensibility Boundary](../../prd/30-plugin-substrate-and-workflow-bundles.md)
- [PRD 34 — Playbook Authoring Contract and Model](../../prd/34-playbook-authoring-contract-and-model.md)
- [PRD 35 — Run Playbook State Machine and Portability](../../prd/35-run-playbook-state-machine-and-portability.md)
- [PRD 36 — Playbook Packaging Compiler and Harness Adapters](../../prd/36-playbook-packaging-compiler-and-harness-adapters.md)
- [PRD 38 — Global Store and Project State](../../prd/38-global-store-and-project-state.md)
- [PRD 39 — CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md)
- [PRD 43 — Conformance Scenario Model and Execution Kits](../../prd/43-conformance-scenario-model-and-execution-kits.md)
- [PRD 44 — Conformance Lab Sessions and Evidence](../../prd/44-conformance-lab-sessions-and-evidence.md)
- [PRD 03 — Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md)

## Source Obligations, Scenarios, And Findings

- O-001 remains separate W18 R3 work; O-002 is superseded and must not be reopened as replacement exposure work.
- Existing `NUAT-###`, conformance, finding, evidence, archive, history, and work identifiers remain stable provenance even when their old text mentions Playbooks or Protocols.
- A current trace may identify a blocker or removal candidate; it cannot close a risk, question, support claim, finding, or capability by itself.
- The owner-approved P8 scope retires `dependency-check-both-directions`, `plugin-marketplace-install`, `skills-bundle-discovery-invocation`, and `uninstall-backup-cleanliness` from current coverage. Their prior results and stable references remain historical evidence. Shared lab tools that serve current capabilities remain in scope for preservation.

## Stage 1 - Phase-Entry PRD Question And Risk Gate

### Tasks

- [ ] t1: Verify the exact worktree, branch, HEAD, free disk, dirty-state allowlist, accepted P1–P7 closeouts, checkpoint-11 readiness, active lock/quiescence, and implementation authorization; stop on unexpected user work or unsafe growth.
- [ ] t2: Reread every Source PRD and PRD 03 from the live worktree and record each revision or content digest.
- [ ] t3: Reevaluate at minimum Q-012, Q-013, Q-022, R-001, R-002, R-008, R-014, R-017, R-021, and R-022, and refresh the production-consumer trace immediately before removal; add newly relevant live items.
- [ ] t4: Record each relevant item's ID or bounded gap/consumer label, digest, impact, classification (`blocking`, `impacted-nonblocking`, `unrelated`, `closed-regression-check`, or `new-authority-gap`), disposition, and rationale.
- [ ] t5: Record an explicit no-blocker/no-unknown-consumer determination and finite removal/fixture/correction/review budget before unlocking t8 when no blocker or gap remains.
- [ ] t6: Stop before implementation for any blocker, unknown consumer, missing replacement surface, or authority gap and present an owner decision package with source anchors, affected phase and PRDs, bounded options and trade-offs, recommendation, consequences, exact PRD/register/history edits, focused validation, and a decision-only commit boundary; create no standalone decision file.
- [ ] t7: Require canonical authority updates, focused validation, a separate decision commit, and its recorded SHA before unlock; task completion or a clean trace never closes governance implicitly.
- [ ] t8: Record the Stage 1 result, authority digests, fresh trace digest, replacement-surface evidence, and implementation unlock or stop result.

### Acceptance criteria

- The consumer trace is fresh at the removal boundary and every result has an explicit disposition.
- No unknown consumer or missing replacement surface remains.
- Removal remains locked until all blockers are canonically resolved and separately committed.

### Dependencies

- Accepted P1–P7 replacement surfaces and validation evidence.
- Active P5 lock, frozen snapshot, backup/rollback, and quiescence barrier.
- Current PRD authority and separate P8 implementation authorization.

### Closeout Notes

- Owner decision, 2026-09-05: retire the four named legacy packaging scenarios from current coverage. Do not retarget them during P8. Preserve their source history, results, evidence links, and shared lab tools that serve current product capabilities. Retired results do not prove current Skill, lifecycle, or harness support.
- Combined effect: current coverage loses the four compiler-dependent cases and their current lab/support mappings. Their old records remain readable. This decision does not remove generic selected-Skill support, the first-party Naive-UAT Skill, current lifecycle behavior, or shared lab tools with an accepted current consumer.
- Authority result: [PRD 03](../../prd/03-open-questions-and-risk-register.md) and [PRD 43](../../prd/43-conformance-scenario-model-and-execution-kits.md) record the accepted scope. The P7 work and history closeout is recorded separately. See the [P8 preflight history](../../../.make-docs/archive/history/2026-09-05-w19-r1-p8-preflight-decision-closeout.md) for this document-only closeout.
- Testing-mode decision(s): use focused document authority, task structure, path, link, and whitespace checks for this update. P8 implementation still requires removal, absence, preservation, rollback, and affected current-feature checks. P9 and P10 keep their existing planned checks; this decision adds no duty to replace the four retired cases. No new support claim or Naive-UAT run is created by this decision.
- Removal approach: bind the finite candidate list to fresh manifest, source, package, public-route, test, and consumer evidence. Give each candidate one explicit removal, retention, historical, opaque-state, or stop result. Record the fixture, correction, and review budget before Stage 1 unlock. This document update does not supply or approve that budget.
- Preflight status: product choices are settled and document reconciliation passed focused validation. This document-only preflight is ready for closeout. The separate decision commit required by t7 remains outstanding. No commit SHA is recorded because no commit was authorized or made.
- Phase / capability status: P8 implementation is not authorized and has not started. Stage 1 unlock remains pending. Fresh removal-boundary trace, authority digests, replacement proof, backup/restore coverage, lock/quiescence checks, finite budget, and the explicit no-blocker/no-unknown-consumer result must be recorded before removal. All task checkboxes remain open because this review does not complete those combined gates or implementation tasks.

## Stage 2 - Freeze The Removal Set

### Tasks

- [ ] t9: Bind the P3 frozen legacy baseline and the P5 stop barrier to a fresh P8 production-consumer/importer trace. Include manifest hashes, trusted source hashes, package inventory, registry inventory, test inventory, conformance/support surfaces, and affected paths.
- [ ] t10: Classify each candidate as proven current Make Docs-owned removal, retained replacement dependency, ambiguous/user-owned preservation, historical provenance, opaque Store state, or stop-for-decision.
- [ ] t11: Create and verify P8 backup and restore coverage for every removal candidate. Remove nothing before the fresh trace and backup are complete. Preserve the quiescence barrier through apply, validation, and rollback.
- [ ] t12: Reject removal by filename, namespace, historical wording, generated-looking content, directory membership, or absence from the current product model alone.

### Acceptance criteria

- The removal set is finite, hash/provenance-backed, and bound to the current snapshot.
- Each P3-frozen public surface has an explicit removal record or a stop-for-decision result. A completed P8 cannot preserve a live public route.
- Backup and rollback cover all proven removal targets.
- Ambiguous, user-owned, historical, and opaque state is excluded from automatic removal.

### Dependencies

- Stage 1 unlock.
- P5 snapshot, backup, and quiescence.

### Closeout Notes

- Testing-mode decision(s): trace freshness, ownership, hash, package/registry inventory, and preservation classification checks.
- Phase / capability status: removal set and backup proof remain pending. No removal is authorized by the preflight document closeout.

## Stage 3 - Remove Proven Retired Surfaces

### Tasks

- [ ] t13: Remove the P3-frozen Playbook/Protocol registry entries, implementations, CLI surfaces, and MCP surfaces as one traced set only where current ownership and replacement safety are proven. Remove related runtime models, parsers, resolvers, runners, state-machine handlers, and live documentation claims in the same bounded change. Do not leave a partial public route.
- [ ] t14: Remove traced packaging/compiler, adapter-registry, generated payload, default asset, manifest/catalog, and release expectations for Playbooks/Protocols.
- [ ] t15: Remove only traced Playbook/Protocol-dependent plugin, hook, extension, workflow-bundle, and harness-adapter surfaces that have no independent accepted authority; preserve generic selected-Skill infrastructure and the thin Naive-UAT Skill.
- [ ] t16: Retire `dependency-check-both-directions`, `plugin-marketplace-install`, `skills-bundle-discovery-invocation`, and `uninstall-backup-cleanliness` from current coverage and their current lab/support mappings. Do not retarget these scenarios in P8. Remove other current tests or fixtures only where the fresh trace proves they assert removed behavior. Preserve historical source and result references, shared lab tools that serve current capabilities, and tests for replacement safety, preservation, and absence. Do not count retired results as new support evidence.
- [ ] t17: Update lifecycle audit/update/uninstall inventories so removed owned assets are recognized as legacy removal candidates without broad directory pruning or inferred ownership.

### Acceptance criteria

- No current public Playbook or Protocol runtime, operation, package, default asset, or affirmative support claim remains.
- Each P3-frozen public registry entry, implementation, CLI surface, and MCP surface has an explicit removal record. A stop-for-decision result blocks P8 completion.
- Independently authorized resource, run, UAT, Skill, and lifecycle behavior remains intact.
- Only proven owned bytes/surfaces are removed.
- Audit/update/uninstall can disposition old managed assets without touching ambiguous or user content.
- The four approved legacy packaging scenarios no longer count as current coverage. Their history and results remain available. P9 and P10 keep their existing test scope.

### Dependencies

- Stage 2 frozen removal set.
- Replacement surface tests from P2–P7.

### Closeout Notes

- Testing-mode decision(s): targeted removal, replacement regression, lifecycle disposition, and rollback checks.
- Phase / capability status: removal has not started. Removal and preservation proof remain pending.

## Stage 4 - Preserve Project And Legacy Material

### Tasks

- [ ] t18: Prove project-owned Playbook/Protocol-shaped documents, modified assets, custom hooks/extensions, historical designs/plans/work/history/evidence, and ambiguous directories remain byte-preserved or explicitly exported under the reviewed P5 plan.
- [ ] t19: Prove `playbook_runs` schema and rows remain opaque, untouched, excluded from current run listings, and absent from conversion/inference logic.
- [ ] t20: Prove symlinks are unlinked only when owned and never followed, and no parent directory with unmanaged descendants is pruned.
- [ ] t21: Preserve stable links and provenance in historical artifacts; do not rewrite archives to present-day terminology or make history normative.

### Acceptance criteria

- All user-owned, modified, ambiguous, custom, and historical material is preserved.
- Legacy Store data is untouched and non-current.
- Link and directory cleanup cannot escape owned targets.
- Historical provenance remains intelligible without reactivating capability authority.

### Dependencies

- Stage 3 removals.
- P5 backup/rollback and P6 legacy-state guarantees.

### Closeout Notes

- Testing-mode decision(s): before/after byte inventories, symlink/unmanaged-descendant fixtures, legacy Store comparison, and archive-link checks.
- Phase / capability status: preservation proof and final confirmation remain pending.

## Stage 5 - Validate Checkpoint 11

### Tasks

- [ ] t22: Compare the final registry, implementation, CLI, and MCP inventories with the P3 frozen baseline. Run focused current-code/current-doc/current-package searches proving no affirmative Playbook/Protocol product surface remains while allowing explicit no-capability boundaries and historical provenance.
- [ ] t23: Run affected runtime, CLI/MCP, package, lifecycle, Store, UAT, Skill, conformance, support-claim, migration/rollback, path-hygiene, link, and whitespace tests within the finite budget.
- [ ] t24: Obtain independent adversarial review of trace freshness, removal scope, replacement preservation, historical/user-content preservation, and legacy Store opacity; correct only actionable defects within budget.
- [ ] t25: Record checkpoint-11 evidence, exact removed/preserved inventories, remaining nonblocking items, and the locked checkpoint-12/P9 handoff while keeping quiescence active.

### Acceptance criteria

- Current product/package surfaces contain no affirmative Playbook or Protocol capability.
- No P3-frozen public Playbook or Protocol registry entry, implementation, CLI surface, or MCP surface remains.
- Historical and user-owned content is outside the P3 public-surface baseline and remains preserved.
- Focused affected tests and preservation comparisons pass.
- Independent review finds no unresolved material missed-removal or over-removal defect.
- Checkpoint 12 remains separately gated and quiescence remains active.

### Dependencies

- Stages 2 through 4 complete.
- Finite removal/fixture/correction/review budget.

### Closeout Notes

- Testing-mode decision(s): targeted absence, preservation, rollback, and independent adversarial review.
- Phase / capability status: P8/checkpoint 11 may close with evidence; P9/checkpoint 12 remains separately gated.
