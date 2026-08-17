---
title: "Phase 4: Manifest, Setup, Reconfiguration, and Routers"
kind: "work"
status: "active"
coordinate: "W19 R1 P4"
source:
  type: "prd"
  path: "docs/prd/05-installation-profile-and-manifest-lifecycle.md"
---

# Phase 4: Manifest, Setup, Reconfiguration, and Routers

## Purpose

Implement explicit resource selection, manifest ownership and provenance, dry-run lifecycle planning, evidence-backed routers, optional projection, update/uninstall safety, and typed receipts.

## Overview

Provider resources remain available independently of project projection. Setup and reconfiguration record selection identity, distinguish provider content from managed projection and project-owned content, and stop on ambiguous ownership. Routers advertise only capabilities actually installed or available through the canonical CLI/MCP surface.

## Source PRD Docs

- [PRD 05 — Installation Profile and Manifest Lifecycle](../../prd/05-installation-profile-and-manifest-lifecycle.md)
- [PRD 07 — CLI Command Surface and Lifecycle](../../prd/07-cli-command-surface-and-lifecycle.md)
- [PRD 15 — Agent Instruction Ownership and Managed Blocks](../../prd/15-agent-instruction-ownership-and-managed-blocks.md)
- [PRD 17 — System Asset Materialization and Local Bootstrap](../../prd/17-system-asset-materialization-and-local-bootstrap.md)
- [PRD 18 — Compatibility Classification and Migration Safety](../../prd/18-compatibility-classification-and-migration-safety.md)
- [PRD 21 — Project Tool Directory and Resource Tiers](../../prd/21-project-tool-directory-and-resource-tiers.md)
- [PRD 22 — Project Documentation Asset Model](../../prd/22-project-documentation-asset-model.md)
- [PRD 39 — CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md)
- [PRD 03 — Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md)

## Source Obligations, Scenarios, And Findings

- O-001 remains separate W18 R3 work; O-002 remains superseded.
- Q-019 is relevant only if this phase introduces interactive Persona setup UX; the ordinary setup/resource work must not broaden into that UX by implication.
- No `NUAT-###` identity is invented. Any user-observable setup change must link canonical scenario authority or stop at the Stage 1 gap gate.
- Findings and capability status remain owned by their canonical records.

## Stage 1 - Phase-Entry PRD Question And Risk Gate

### Tasks

- [ ] t1: Verify the exact worktree, branch, HEAD, free disk, dirty-state allowlist, accepted P2/P3 closeouts, and implementation authorization; stop on unexpected user work or unsafe growth.
- [ ] t2: Reread every Source PRD and PRD 03 from the live worktree and record each revision or content digest.
- [ ] t3: Reevaluate at minimum Q-017, Q-018, R-004, R-006, R-014, and R-017; include Q-019 only if interactive Persona setup UX is introduced, preserve Q-017's per-project authority unless separately redesigned, and add newly relevant items.
- [ ] t4: Record the required ID, digest, impact, classification (`blocking`, `impacted-nonblocking`, `unrelated`, `closed-regression-check`, or `new-authority-gap`), disposition, and rationale for every relevant item.
- [ ] t5: Record an explicit no-blocker determination and finite phase correction/review budget before unlocking t8 when no blocker or gap remains.
- [ ] t6: Stop before implementation for any blocker or authority gap and present an owner decision package with source anchors, affected phase and PRDs, bounded options and trade-offs, recommendation, consequences, exact PRD/register/history edits, focused validation, and a decision-only commit boundary; create no standalone decision file.
- [ ] t7: Require canonical PRD/register/history changes, focused validation, a separate decision commit, and its recorded SHA before unlock; do not infer governance closure from work completion.
- [ ] t8: Record the Stage 1 outcome, authority digests, accepted dependency evidence, and implementation unlock or stop result.

### Acceptance criteria

- Live setup, resource, migration, and router questions/risks have explicit current classifications.
- Q-017 and Q-019 are not silently broadened.
- Implementation remains locked until every blocker is resolved in canonical authority and a separate decision commit.

### Dependencies

- Accepted P2 resource core and P3 public operations.
- Current PRD authority and separate P4 implementation authorization.

### Closeout Notes

- Testing-mode decision(s): setup/reconfigure user-observable candidates require canonical scenario routing; no scenario is invented here.
- Phase / capability status: gate result pending.

## Stage 2 - Implement Selection And Manifest Authority

### Tasks

- [ ] t9: Implement explicit projection selection as `none`, one or more of the four resource types, or the full system set without reviving `prompts`, `templatesMode`, or `referencesMode` legacy authority.
- [ ] t10: Record manifest identity, schema version, effective selections, provider/resource provenance, managed destination, source digest, installed digest, ownership class, and operation lineage required by the PRDs.
- [ ] t11: Keep provider availability, local managed projection, explicit project override, project documentation, runtime state, and selected Skill payloads as distinct manifest/audit classes.
- [ ] t12: Fail closed when an existing path lacks trustworthy ownership or when selection/provenance cannot be reconstructed; never treat name or destination alone as ownership proof.

### Acceptance criteria

- Selection semantics are explicit, stable, and limited to current authority.
- Manifest data can distinguish every provider, projection, override, project, runtime, and Skill class needed for safe lifecycle behavior.
- Ambiguous ownership stops before mutation.
- Bare installation does not silently select resources for projection or install Skills.

### Dependencies

- Stage 1 unlock.
- P2 identity/provenance types and P3 operation contracts.

### Closeout Notes

- Testing-mode decision(s): selection resolution, manifest round-trip, provenance, legacy-field rejection, and ambiguous-ownership fixtures.
- Phase / capability status: selection and manifest authority complete; lifecycle planning remains open.

## Stage 3 - Implement Dry-Run Lifecycle Plans And Routers

### Tasks

- [ ] t13: Implement setup and reconfigure dry-run plans that enumerate intended creates, updates, preserves, conflicts, skips, removals, and stops before apply. Activate the P3-pending `project.surface.ensure` handler for `make-docs project surface ensure <archive|artifacts|assets>` and its MCP tool. Create only the selected on-demand directory and configured routers through the reviewed plan.
- [ ] t14: Route managed-file conflicts through explicit review using canonical source and installed digests; never append-merge or overwrite as a substitute for ownership evidence.
- [ ] t15: Generate or update bounded `AGENTS.md` and `CLAUDE.md` managed blocks only from evidence-backed installed capabilities and canonical CLI/MCP access paths.
- [ ] t16: Ensure routers identify top-level prompt/system-workflow access without embedding resource bodies, UAT policy, hidden implementation guidance, Playbook/Protocol claims, or optional integration claims that were not selected.
- [ ] t17: Preserve unmanaged router content byte-for-byte outside the owned block and fail closed on malformed, duplicated, or ambiguous managed blocks.

### Acceptance criteria

- Every planned mutation has an explicit disposition before apply.
- Router claims match installed/provider capability evidence and remain thin.
- User-authored router content is preserved.
- Setup/reconfigure planning cannot silently overwrite, append-merge, select a Skill, or activate removed capabilities.
- P4 clears the `W19 R1 P4` pending state only after the `project.surface.ensure` handler, CLI projection, MCP tool, and focused tests pass.

### Dependencies

- Stage 2 manifest model.
- P3 CLI/MCP availability contracts.

### Closeout Notes

- Testing-mode decision(s): dry-run snapshots, conflict injection, managed-block idempotency, malformed-block, and capability-claim fixtures.
- Phase / capability status: planning and routers complete; mutation lifecycle remains open.

## Stage 4 - Implement Projection, Update, Uninstall, And Receipts

### Tasks

- [ ] t18: Materialize only explicitly selected clean managed resources under `.make-docs/system/{contracts,prompts,references,templates}/` through the reviewed plan and shared ensure operation.
- [ ] t19: Implement update so unchanged managed files advance deterministically, modified or ambiguous files enter review, project-owned overrides remain project-owned, and provider availability remains independent of projection.
- [ ] t20: Implement uninstall so only proven owned matching bytes are removed, symlinks are unlinked without following targets, and parent directories with unmanaged descendants are preserved.
- [ ] t21: Return typed lifecycle receipts that identify operation, project/manifest identity, selections, outcomes, conflicts, backup references where applicable, and commit time without claiming validation, acceptance, publication, or release.
- [ ] t22: Preserve the accepted distinction between a dry-run/review result, repository mutation, Store receipt, validation evidence, and release recommendation.

### Acceptance criteria

- Projection is optional, selected, provenance-aware, and conflict-safe.
- Update and uninstall preserve modified, ambiguous, user-owned, and unmanaged content.
- Receipts are typed and bounded to the mutation they prove.
- No lifecycle action follows symlink targets or removes an unmanaged parent.

### Dependencies

- Stages 2 and 3.
- P5 backup/rollback primitives must gate destructive migration dispositions; ordinary safe update/uninstall may proceed only within current PRD authority.

### Closeout Notes

- Testing-mode decision(s): projection, update, uninstall, symlink, unmanaged-descendant, and receipt fixtures.
- Phase / capability status: lifecycle behavior complete; confirmation remains open.

## Stage 5 - Validate Lifecycle Safety

### Tasks

- [ ] t23: Run focused setup, reconfigure, projection, router, update, uninstall, receipt, type, path-hygiene, and whitespace tests across clean, modified, ambiguous, missing, and legacy fixtures.
- [ ] t24: Prove idempotent unchanged reruns reuse valid evidence, affected-only failures are retried within budget, and conflict or ambiguity never degrades to overwrite.
- [ ] t25: Obtain independent review of selection, manifest provenance, router claims, conflict planning, removal safety, and receipts; correct only actionable defects within the finite budget.
- [ ] t26: Record exact changed-file scope, validation evidence, nonblocking items, and P5 handoff without running migration, package projection, dogfood, release, or publication.

### Acceptance criteria

- Focused lifecycle and failure-injection tests pass.
- Independent review finds no unresolved ownership, router, conflict, or removal defect.
- Only accepted affected checks are rerun after correction.
- P5 receives explicit manifest, lock/backup prerequisites, and typed plan/receipt interfaces.

### Dependencies

- Stages 2 through 4 complete.
- Finite correction and review budget.

### Closeout Notes

- Testing-mode decision(s): deterministic lifecycle fixtures plus independent safety review.
- Phase / capability status: P4 may close with evidence; P5 remains separately gated.
