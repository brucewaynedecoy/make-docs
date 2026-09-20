---
title: "Phase 10: Package Projection, Dogfood, and Installed-Project Validation"
kind: "work"
status: "completed"
coordinate: "W19 R1 P10"
source:
  type: "prd"
  path: "docs/prd/10-packaging-validation-and-release-reference.md"
---

# Phase 10: Package Projection, Dogfood, and Installed-Project Validation

## Purpose

Project validated upstream authority into the package, dogfood it downstream in the maintainer repository, validate fresh and representative legacy installed projects, and produce a release recommendation without publishing or releasing.

## Overview

This phase implements migration checkpoint 13 and is the first phase allowed to prove the complete upstream → package → dogfood → installed-project sequence. It does not make the root dogfood tree or generated package copy an authoring source. Package, dogfood, integration, publication, release, and deployment remain distinct evidence and authority boundaries.

## Source PRD Docs

- [PRD 06 — Template Contracts and Generated Assets](../../prd/06-template-contracts-and-generated-assets.md)
- [PRD 09 — Dogfood and Maintainer Operations](../../prd/09-dogfood-and-maintainer-operations.md)
- [PRD 10 — Packaging, Validation, and Release Reference](../../prd/10-packaging-validation-and-release-reference.md)
- [PRD 16 — Package Runtime and Deployment Boundaries](../../prd/16-package-runtime-and-deployment-boundaries.md)
- [PRD 17 — System Asset Materialization and Local Bootstrap](../../prd/17-system-asset-materialization-and-local-bootstrap.md)
- [PRD 18 — Compatibility Classification and Migration Safety](../../prd/18-compatibility-classification-and-migration-safety.md)
- [PRD 25 — TypeScript Runtime, CLI, and MCP Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [PRD 46 — Naive End-User Acceptance Testing](../../prd/46-naive-end-user-acceptance-testing.md)
- [PRD 50 — Proportionate Testing and Human-Centered Validation](../../prd/50-proportionate-testing-and-human-centered-validation.md)
- [PRD 03 — Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md)

## Source Obligations, Scenarios, And Findings

- O-001 remains separate W18 R3 work and O-002 remains superseded.
- Existing canonical testing/UAT scenarios, findings, direct installed-product results, and support claims are consumed by exact scope; no placeholder ID is created.
- Closed R-003 is a packed/dev parity regression check, not permission to skip installed-package proof.
- Release recommendation cannot close a finding, obligation, waiver, scenario, question, risk, support claim, or capability by implication.

## Stage 1 - Phase-Entry PRD Question And Risk Gate

### Tasks

- [x] t1: Verify the exact worktree, branch, HEAD, free disk, dirty-state allowlist, accepted P1–P9 closeouts/dispositions, checkpoint-13 readiness, active quiescence, and implementation authorization; stop on unexpected user work or unsafe growth.
- [x] t2: Reread every Source PRD and PRD 03 from the live worktree and record each revision or content digest.
- [x] t3: Reevaluate at minimum Q-001, Q-007, Q-017, Q-018, R-001, R-002, R-006, R-014, R-017, R-021, R-022, and R-025 plus closed R-003 packed/dev parity as a regression check; preserve Q-017's per-project authority and add newly relevant items.
- [x] t4: Record each relevant item's ID or bounded gap label, digest, impact, classification (`blocking`, `impacted-nonblocking`, `unrelated`, `closed-regression-check`, or `new-authority-gap`), disposition, and rationale.
- [x] t5: Record an explicit no-blocker determination and finite package/fixture/platform/migration/correction/review budget before unlocking t8 when no blocker or gap remains.
- [x] t6: Stop before package projection, dogfood, or installed-project mutation for any blocker, missing scenario/claim authority, unsafe resource budget, or authority gap and present an owner decision package with source anchors, affected phase and PRDs, bounded options and trade-offs, recommendation, consequences, exact PRD/register/history edits, focused validation, and a decision-only commit boundary; create no standalone decision file.
- [x] t7: Require canonical authority updates, focused validation, a separate decision commit, and its recorded SHA before unlock; never infer closure from a green build, migration, or release recommendation.
- [x] t8: Record the Stage 1 result, authority digests, all prior checkpoint evidence, exact fixture/platform budgets, and implementation unlock or stop result.

### Acceptance criteria

- Every live package, dogfood, migration, parity, UAT, conformance, and support item has an explicit current classification.
- Closed R-003 remains an active regression check for packed/dev parity.
- Resource budgets are finite and stop on unsafe growth or pressure.
- Checkpoint 13 remains locked until all blockers are canonically resolved.

### Dependencies

- Accepted P1–P9 closeouts or explicit not-applicable dispositions.
- Current PRD authority and separate P10 implementation authorization.

### Closeout Notes

- Testing-mode decision(s): exact automated, direct installed-product, UAT, migration, and package parity candidates are recorded separately.
- Phase / capability status: gate result pending.

## Stage 2 - Project Upstream Authority Into The Package

### Tasks

- [x] t9: Run the repository-authoritative template-to-CLI package projection only after verifying the P1 upstream tree and official projection command; do not hand-edit generated package copies.
- [x] t10: Verify byte/metadata/catalog parity for contracts, prompts, references, templates, workflow resources, selected Skill assets, and removed Playbook/Protocol expectations across upstream and packaged provider trees.
- [x] t11: Build and inspect the package artifact to prove provider discovery, stable URI identity, required contents, permissions, path layout, entry points, and absence of unapproved or stale retired assets.
- [x] t12: Record the upstream and package fingerprints so unchanged evidence can be reused and any drift forces affected-only reprojection and validation.

### Acceptance criteria

- The package projection is generated exclusively from upstream authority.
- Packaged provider resources match upstream identity and expected bytes/metadata.
- The package contains no stale Playbook/Protocol/default asset or missing first-class prompt/workflow resource.
- Packed and development provider behavior share the same logical contract.

### Dependencies

- Stage 1 unlock.
- P1 upstream authority and all runtime/lifecycle handlers complete.

### Closeout Notes

- Testing-mode decision(s): projection parity, package inventory, packed/dev identity, and retired-asset absence checks.
- Phase / capability status: package projection validated; dogfood remains open.

## Stage 3 - Dogfood Downstream From The Package Source

### Tasks

- [x] t13: Apply the repository-authoritative dogfood workflow only after package projection passes, using dry-run/review, backup, conflict, ownership, and rollback safeguards from P4/P5.
- [x] t14: Verify root `.make-docs/` and `docs/` managed outputs match the packaged source where parity is required while project-authored designs, plans, PRDs, work, guides, history, archives, evidence, configuration, and custom content remain project-owned.
- [x] t15: Exercise root CLI/MCP resource list/read, optional projection, lifecycle receipts, general run capture, Naive-UAT system workflow, Persona routing, and exact selected optional integrations through dogfood without treating the root as upstream authority.
- [x] t16: Review the dogfood diff and rollback evidence before accepting it; stop on unexpected project-document changes, ownership ambiguity, stale generated copies, or retired capability claims.

### Acceptance criteria

- Dogfood occurs only after upstream and package validation.
- Managed parity and project-owned divergence are distinguished explicitly.
- Root behavior exercises the packed provider and current operations without becoming source authority.
- Unexpected changes or ambiguity stop before acceptance.

### Dependencies

- Stage 2 package proof.
- P4/P5 lifecycle safety and backup/rollback.

### Closeout Notes

- Testing-mode decision(s): dogfood dry-run/apply/rollback, parity, resource, lifecycle, UAT, and exact optional-integration checks.
- Phase / capability status: maintainer dogfood validated; installed-project proof remains open.

## Stage 4 - Validate Fresh And Representative Legacy Projects

### Tasks

- [x] t17: Install the packed artifact into a clean external fixture and prove provider-only resource availability, explicit projection selections, routers, manifest provenance, update/uninstall, typed receipts, and bare-install Skill-free behavior.
- [x] t18: Run the P5 migration coordinator against a finite representative matrix of clean managed, modified, ambiguous, pre-v2, resource-projection, legacy asset, path/symlink, Store, Persona-testing, and optional-agentics facets.
- [x] t19: Prove the full thirteen-step order, rollback at material failure points, opaque `playbook_runs`, preserved project content, checkpoint dispositions, and no Playbook/Protocol reactivation across those fixtures.
- [x] t20: Exercise CLI/native-MCP/system-workflow/selected-Skill access parity, canonical `user` default, explicit `maintainer`, installed-product qualification boundaries, evidence paths, findings/gates, and honest support status for the exact tested package.
- [x] t21: Run the bounded cross-platform/security/privacy cases required by current claims; unsupported environments remain explicit rather than guessed or expanded by a green local result.

### Acceptance criteria

- Fresh installation proves the ordinary consumer path from the packed artifact.
- Representative legacy migrations preserve ownership, content, state, order, and rollback guarantees.
- UAT and optional integrations are validated only for their exact qualified scopes.
- Platform/support claims do not exceed evidence.

### Dependencies

- Stage 3 dogfood evidence.
- Canonical fixtures and testing/conformance/UAT authority.

### Closeout Notes

- Testing-mode decision(s): fresh install, migration, rollback, CLI/MCP, true naive UAT, conformance, support, cross-platform, security, and privacy modes remain separate.
- Phase / capability status: installed-project evidence complete; final review remains open.

## Stage 5 - Close Checkpoint 13 And Prepare A Recommendation

### Tasks

- [x] t22: Run the repository-authoritative focused and proportional package/build/test suites, path-hygiene validation, PRD authority regression, work-contract validation, relative-link/anchor checks, scope audit, whitespace, and diff hygiene within the finite budget.
- [x] t23: Verify unchanged fingerprints reuse prior valid evidence, corrections rerun only affected checks, and budget exhaustion produces `blocked` or owner decision rather than repeated unchanged execution.
- [x] t24: Obtain independent end-to-end review of upstream/package/dogfood/installed-project parity, migrations, removals, UAT, support claims, scope, and evidence sufficiency; correct only actionable defects within budget.
- [x] t25: Record checkpoint-13 evidence, exact package/build identities, fixture/platform matrix, scenario/finding/obligation/support dispositions, unresolved nonblocking items, and rollback state.
- [x] t26: Prepare a bounded owner implementation-acceptance and release-readiness recommendation that explicitly does not stage, commit, integrate, push, publish, release, deploy, or deactivate preservation barriers without separate authorization.

### Acceptance criteria

- Repository-authoritative focused validation and independent review pass with no unresolved material issue.
- Evidence is finite, fingerprinted, proportional, and exact-scope.
- All thirteen migration checkpoints have explicit validated dispositions.
- The output is a recommendation only; commit, integration, publication, release, deployment, and barrier removal remain separately authorized.

### Dependencies

- Stages 2 through 4 complete.
- Finite package/fixture/platform/migration/correction/review budget.

### Closeout Notes

- Testing-mode decision(s): every required mode records its own outcome and exact evidence scope. Direct installed-product evidence replaces the retired dynamic conformance system.
- Authority reconciliation (2026-09-15): PRD 20 is retired. PRDs 10, 16, 18, 25, and 50 now own package, migration, runtime, and direct installed-product proof. This phase does not restore a tuple registry, scenario kit, lab session, or Playbook/Protocol runtime.
- Prior-checkpoint trace: P1 was committed at `aa6560b`; P2 through P8 keep their recorded accepted evidence; P9 closes checkpoint 12 as `not applicable`; W19 R3 through R6 supply the later Store, layout, Skill, setup, static-adapter, installed-package, and direct harness evidence that this final checkpoint consumes.
- Package and installed proof: W19 R6 P3 records a packed candidate, installed package smoke, Store-free resources, the setup matrix, Codex MCP and narrow-rule reads and writes, Claude Code MCP reads and writes, honest blocking of an unsafe method, and absence of retired conformance assets. W19 R5 records extracted-package, offline Skill, standard-path, adoption, preservation, recovery, and repeat proof.
- Migration proof: the current CLI suite covers the fixed checkpoint order, fail-closed classification, backup, rollback, recovery, opaque legacy `playbook_runs`, path and symlink rejection, and Windows/macOS/Linux path fixtures. No real project was changed by this closeout.
- Current verification: the CLI suite passed 80 files and 1,264 tests. The build passed. Local packed-package smoke passed with upstream, packed, and installed dogfood router parity. Default-resource checks passed 53 tests. PRD authority validation passed over 36 PRDs, 567 Markdown files, 196 structured files, and 1,089 links with no diagnostic. Focused path hygiene passed all seven changed files. Instruction-router, wave-numbering, and diff checks passed.
- Human Experience Review: the agent review in W19 R6 records `satisfied` for all applicable setup and harness promises and states its limits. This is not a claim about a lived human reaction.
- Checkpoint 13: complete for the current candidate and exact tested scope. Publication, release, deployment, and real-project recovery remain separate actions. The release recommendation is to keep those actions gated until their normal release authority and any explicit owner evidence-review gate are satisfied.
- Phase / capability status: complete. All later lifecycle actions remain separately gated.
