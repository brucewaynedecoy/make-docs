---
title: "Phase 8: Traced Playbook and Protocol Retirement"
kind: "work"
status: "complete"
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

- [x] t1: Verify the exact worktree, branch, HEAD, free disk, dirty-state allowlist, accepted P1–P7 closeouts, checkpoint-11 readiness, active lock/quiescence, and implementation authorization; stop on unexpected user work or unsafe growth.
- [x] t2: Reread every Source PRD and PRD 03 from the live worktree and record each revision or content digest.
- [x] t3: Reevaluate at minimum Q-012, Q-013, Q-022, R-001, R-002, R-008, R-014, R-017, R-021, and R-022, and refresh the production-consumer trace immediately before removal; add newly relevant live items.
- [x] t4: Record each relevant item's ID or bounded gap/consumer label, digest, impact, classification (`blocking`, `impacted-nonblocking`, `unrelated`, `closed-regression-check`, or `new-authority-gap`), disposition, and rationale.
- [x] t5: Record an explicit no-blocker/no-unknown-consumer determination and finite removal/fixture/correction/review budget before unlocking t8 when no blocker or gap remains.
- [x] t6: Stop before implementation for any blocker, unknown consumer, missing replacement surface, or authority gap and present an owner decision package with source anchors, affected phase and PRDs, bounded options and trade-offs, recommendation, consequences, exact PRD/register/history edits, focused validation, and a decision-only commit boundary; create no standalone decision file.
- [x] t7: Require canonical authority updates, focused validation, a separate decision commit, and its recorded SHA before unlock; task completion or a clean trace never closes governance implicitly.
- [x] t8: Record the Stage 1 result, authority digests, fresh trace digest, replacement-surface evidence, and implementation unlock or stop result.

### Acceptance criteria

- The consumer trace is fresh at the removal boundary and every result has an explicit disposition.
- No unknown consumer or missing replacement surface remains.
- Removal remains locked until all blockers are canonically resolved and separately committed.

### Dependencies

- Accepted P1–P7 replacement surfaces and validation evidence.
- Active P5 lock, frozen snapshot, backup/rollback, and quiescence barrier.
- Current PRD authority and separate P8 implementation authorization.

### Closeout Notes

- The owner approved retirement of the four named legacy packaging scenarios on 2026-09-05. Their source history, results, evidence links, and shared tools remain. The [preflight history](../../../.make-docs/archive/history/2026-09-05-w19-r1-p8-preflight-decision-closeout.md) preserves that document-only span. Its pending implementation statement describes that earlier span.
- The entry branch was `make-docs-v2` at the separate decision commit `9494280b`. The exact initial free-disk number is not retained in this closeout. The current request, “Please implement W19 R1 P8,” supplies implementation authority. The accepted prerequisites are P1 `aa6560b8`, P2 `6bf85e59`, P3 `f2ed36c6`, P4 `2f07b568`, P5 `96582ab4`, P6 `bac3eb2`, and P7 `03a8dfdd`.
- The fresh Stage 1 trace found no blocking authority gap or unknown consumer in the bounded removal set. Q-013 and Q-022 are `closed-regression-check`. Q-012, R-001, R-002, R-008, R-014, R-017, R-021, R-022, and the plugin leg of D-021 are `impacted-nonblocking`. Their remaining current-feature concerns retain their existing owners. The exact labels, digests, impact, and dispositions are in the [finite evidence record](../../../.make-docs/archive/history/2026-09-05-w19-r1-p8-retirement-inventory.json). No new decision package was needed for t6.
- The 17 source PRDs have aggregate SHA-256 `05f9f9a217ad083effca66952e7f66b5887e5e76e582288ff055f4e3d218a3ed`. The risk record digest is `2bb4715b9590c033e2848d0f4f9d194450b51ad10e01bdc78e90e3346e6aecd9`. The source import trace digest is `1cd0542ab75b32dfc012b600eaf23f84d5136a1b099a4463d7268fc600a9f508`. The evidence record states the digest recipe and binds the trace to the verified source backup.
- The bounded budget is 400 removed tracked files and 24 new cases. The tighter index rule controls: at most two materially distinct returned-candidate correction attempts and two independent reviews. Initial implementation test fixes do not count as returned-candidate corrections. The earlier proposed six-attempt upper bound is superseded by this tighter limit.
- Source editing is separate from live project migration. The root legacy barrier remains active at snapshot `3190ef33317c7e63e1a98cbf8648030ddd3c9eb12042b5aca580bccc64ca5882`. The root migration lock is absent. No root migration was run. The isolated migration tests acquire the lock and require the barrier before checkpoint 11 writes. Current resource, lifecycle, Persona, Skill, and Naive-UAT paths have regression proof.
- Stage 1 unlocked the bounded implementation. PRD coverage verdict: `none`; existing accepted requirements were implemented without a requirements change. No new obligation or scenario is added. P9 remains separately gated.


## Stage 2 - Freeze The Removal Set

### Tasks

- [x] t9: Bind the P3 frozen legacy baseline and the P5 stop barrier to a fresh P8 production-consumer/importer trace. Include manifest hashes, trusted source hashes, package inventory, registry inventory, test inventory, conformance/support surfaces, and affected paths.
- [x] t10: Classify each candidate as proven current Make Docs-owned removal, retained replacement dependency, ambiguous/user-owned preservation, historical provenance, opaque Store state, or stop-for-decision.
- [x] t11: Create and verify P8 backup and restore coverage for every removal candidate. Remove nothing before the fresh trace and backup are complete. Preserve the quiescence barrier through apply, validation, and rollback.
- [x] t12: Reject removal by filename, namespace, historical wording, generated-looking content, directory membership, or absence from the current product model alone.

### Acceptance criteria

- The removal set is finite, hash/provenance-backed, and bound to the current snapshot.
- Each P3-frozen public surface has an explicit removal record or a stop-for-decision result. A completed P8 cannot preserve a live public route.
- Backup and rollback cover all proven removal targets.
- Ambiguous, user-owned, historical, and opaque state is excluded from automatic removal.

### Dependencies

- Stage 1 unlock.
- P5 snapshot, backup, and quiescence.

### Closeout Notes

- The [finite evidence record](../../../.make-docs/archive/history/2026-09-05-w19-r1-p8-retirement-inventory.json) lists all 127 removed tracked files with their original SHA-256 values and exact dispositions. The removal-list digest is `5abb36942f1b617bcf88dec239c929c7830c4036ea4d7036b1bde91a230d83ca`. The set contains 68 runtime files, 19 retired-only tests, 39 parser fixtures, and one upstream contract.
- All 1,597 tracked source files were backed up before deletion. The backup inventory digest is `9b070a08da9fca69d60ae293bf26e7419dae207c8b84781ef9743fddf7efe0c1`. Every removal matched both its backup bytes and decision-commit blob. The exact relative path and bytes provide the restore recipe.
- Import and symbol traces classified the runner, compiler, adapters, package operations, and unused plugin libraries as retired-only. Shared lab code, authored Skills, lifecycle/resource operations, migration provenance types, old manifest shapes, project content, and opaque Store state remain. The unused plugin leg had no independent production importer. No filename alone established ownership.


## Stage 3 - Remove Proven Retired Surfaces

### Tasks

- [x] t13: Remove the P3-frozen Playbook/Protocol registry entries, implementations, CLI surfaces, and MCP surfaces as one traced set only where current ownership and replacement safety are proven. Remove related runtime models, parsers, resolvers, runners, state-machine handlers, and live documentation claims in the same bounded change. Do not leave a partial public route.
- [x] t14: Remove traced packaging/compiler, adapter-registry, generated payload, default asset, manifest/catalog, and release expectations for Playbooks/Protocols.
- [x] t15: Remove only traced Playbook/Protocol-dependent plugin, hook, extension, workflow-bundle, and harness-adapter surfaces that have no independent accepted authority; preserve generic selected-Skill infrastructure and the thin Naive-UAT Skill.
- [x] t16: Retire `dependency-check-both-directions`, `plugin-marketplace-install`, `skills-bundle-discovery-invocation`, and `uninstall-backup-cleanliness` from current coverage and their current lab/support mappings. Do not retarget these scenarios in P8. Remove other current tests or fixtures only where the fresh trace proves they assert removed behavior. Preserve historical source and result references, shared lab tools that serve current capabilities, and tests for replacement safety, preservation, and absence. Do not count retired results as new support evidence.
- [x] t17: Update lifecycle audit/update/uninstall inventories so removed owned assets are recognized as legacy removal candidates without broad directory pruning or inferred ownership.

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

- All 18 P3-frozen public operations are absent from the registry, real CLI entry, and MCP tool transport. Each operation has its own removal record in the [finite evidence record](../../../.make-docs/archive/history/2026-09-05-w19-r1-p8-retirement-inventory.json). The retired implementation roots and CLI/MCP examples are removed. Current operations remain active.
- The upstream Playbook contract is removed and the generated package copy is synchronized. The root installed legacy contract remains opaque project input. Known old packaging configuration, document-kind labels, and the old parallel-run capability are ignored without changing user bytes or exposing current capabilities.
- Four old packaging scenarios no longer count as current coverage. Their historical specs and results remain readable through the historical contract. Generic lab tools retain their current consumers. No new scenario replaces an old one. Historical packaging results do not establish current Skill or harness support.
- Checkpoint 11 removes only the exact known contract bytes through the migration path. Ordinary apply refuses that removal before writes. Modified files, project documents, generated user output, and unknown legacy material remain protected.


## Stage 4 - Preserve Project And Legacy Material

### Tasks

- [x] t18: Prove project-owned Playbook/Protocol-shaped documents, modified assets, custom hooks/extensions, historical designs/plans/work/history/evidence, and ambiguous directories remain byte-preserved or explicitly exported under the reviewed P5 plan.
- [x] t19: Prove `playbook_runs` schema and rows remain opaque, untouched, excluded from current run listings, and absent from conversion/inference logic.
- [x] t20: Prove symlinks are unlinked only when owned and never followed, and no parent directory with unmanaged descendants is pruned.
- [x] t21: Preserve stable links and provenance in historical artifacts; do not rewrite archives to present-day terminology or make history normative.

### Acceptance criteria

- All user-owned, modified, ambiguous, custom, and historical material is preserved.
- Legacy Store data is untouched and non-current.
- Link and directory cleanup cannot escape owned targets.
- Historical provenance remains intelligible without reactivating capability authority.

### Dependencies

- Stage 3 removals.
- P5 backup/rollback and P6 legacy-state guarantees.

### Closeout Notes

- The [finite evidence record](../../../.make-docs/archive/history/2026-09-05-w19-r1-p8-retirement-inventory.json) retains byte hashes for 550 unchanged history, result, and scenario files, 32 authored Skill files, and 66 current system-resource files. These explicit categories establish preservation scope without changing prior prose.
- The five new migration cases prove exact removal, modified and project-file preservation, symlink and parent-symlink protection, opaque invalid-JSON `playbook_runs` byte preservation, ordinary-apply refusal, and rollback after a post-unlink manifest failure. The barrier stays active and the lock is released. Checkpoints 12 and 13 remain locked.
- The current runtime keeps legacy manifest provenance as data. A frozen legacy plugin fixture retains cleanup and preservation tests without recreating the removed generator. Known retired configuration blocks remain readable beside current Persona and Skill settings. No root project migration, Store conversion, or history rewrite occurred.


## Stage 5 - Validate Checkpoint 11

### Tasks

- [x] t22: Compare the final registry, implementation, CLI, and MCP inventories with the P3 frozen baseline. Run focused current-code/current-doc/current-package searches proving no affirmative Playbook/Protocol product surface remains while allowing explicit no-capability boundaries and historical provenance.
- [x] t23: Run affected runtime, CLI/MCP, package, lifecycle, Store, UAT, Skill, conformance, support-claim, migration/rollback, path-hygiene, link, and whitespace tests within the finite budget.
- [x] t24: Obtain independent adversarial review of trace freshness, removal scope, replacement preservation, historical/user-content preservation, and legacy Store opacity; correct only actionable defects within budget.
- [x] t25: Record checkpoint-11 evidence, exact removed/preserved inventories, remaining nonblocking items, and the locked checkpoint-12/P9 handoff while keeping quiescence active.

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

- Focused runtime checks passed 108/108 across 13 test files. Conformance checks passed 113/113. Defaults and Naive-UAT checks passed 66/66. The migration worker passed the P5/P6/P7 regression set and all five new P8 cases. These sets overlap and must not be added into a full-suite total. The new-case count is 14: five runtime, four conformance, and five migration.
- The full CLI suite passed 881/881 across 58 files. TypeScript, build, and `git diff --check` passed. `npm run smoke:pack` passed with network access. Package dry-run reported 121 files, 971,712 packed bytes, and 4,968,716 unpacked bytes; the retired contract and lab assets were absent. The package run started after the final source edits. The corrected CLI/MCP set passed 109/109 and the restored shared lab safety set passed 10/10. These are functional checks, not performance qualification. Final documentation checks passed for all relative links, the 25 stable task IDs, inventory counts, current authority hashes, preserved-category hashes, reproducible aggregate digests, and whitespace. Independent review 2 passed with no remaining defect. Managed path hygiene passed on 83 files with zero findings and zero I/O errors. PRD authority validation passed on 39 PRDs, 1,056 Markdown files, 168 structured files, and 889 links with no diagnostics. The reviewer also checked the live backup inventory hash. Tasks t24 and t25 are complete for the reviewed candidate.
- The required automated testing is `needed-now` to decide removal safety. Scope is the 18 frozen routes, current replacements, lifecycle ownership, opaque state, rollback, package output, and historical coverage exclusion. The coding agents execute it. Failure blocks the candidate. The budget is the finite 14 new cases plus affected existing checks. Stop when the affected checks and required package checks pass. Retain source tests and this evidence record. Rerun only after a related change or failure.
- Conformance review is `needed-now` to decide whether historical packaging results can still advance current support. Scope is the four retired scenarios and shared current lab tools. The coding agents execute the existing suite plus four new cases. Failure blocks the candidate. Stop after the affected suite passes. Retain the conformance tests and historical registry snapshot. Rerun after scenario, registry, or support-claim changes.
- Independent architecture and preservation review is `needed-now` for this removal candidate. A separate agent reviews the diff and tests. Unresolved material findings block readiness. Use at most two review cycles and two returned-candidate correction attempts. Review 1 found one material issue: four shared lab safety tests had been removed. Correction attempt 1 restored those tests, and the 10-case safety set passed. Review 2 passed after inspection of the final code, tests, inventory, backup, and phase state. It requested an explicit digest recipe and findable backup recipe; those evidence details were added and independently verified. No runtime defect remained. The work used one returned-candidate correction attempt and two reviews. The final review result is retained here and in the implementation history. Rerun only for a material correction.
- User goal testing is `not-needed-now`. The current uncertainty is structural and behavioral, covered by direct CLI/MCP and preservation checks. P8 adds no new human workflow or support claim. No NUAT identity or human-experience claim is created. Owner acceptance remains separate from agent review.
- Performance, accessibility, and visual testing are each `not-needed-now`. This slice creates no new performance target, visual surface, or accessibility interaction. The executor and effort budget for these modes are none. Existing owner requirements remain in force. Reconsider only if a later change adds one of those surfaces. Guided progress review is `not-needed-now`; the accepted finite scope is implemented and the owner has accepted the tested result.
- Current status: complete and owner-accepted on 2026-09-05. The owner stated that review was complete, approved P8, and authorized the implementation commit. All 25 tasks are complete. Code, package, documentation, and independent review checks passed. This acceptance records the owner's decision without adding manual-test or human-experience claims. The implementation commit is authorized but not yet recorded here.
- The root manifest and installed legacy contract remain byte-identical; the final baseline comparison found zero unexpected changes. The root barrier remains active and no root migration ran. P9 remains unstarted and unapproved and must perform its own phase-entry gate. Checkpoints 12 and 13 remain locked.
