---
title: "Phase 1: Upstream Documentation Authority"
kind: "work"
status: "active"
coordinate: "W19 R1 P1"
source:
  type: "prd"
  path: "docs/prd/06-template-contracts-and-generated-assets.md"
---

# Phase 1: Upstream Documentation Authority

## Purpose

Establish the shipped documentation authority for the reduced Make Docs v2 product boundary and the four peer system-resource types before runtime, package projection, dogfood, or removal work begins.

## Overview

This phase authors reusable system contracts, prompts, references, templates, metadata, and catalogs only in `packages/docs/template/`. It makes prompts a first-class peer of contracts, references, and templates, supplies the system-workflow authority later consumed by Naive UAT, and removes current upstream claims that Playbooks or Protocols are Make Docs product capabilities. Historical provenance and project-owned artifacts remain untouched.

## Source PRD Docs

- [PRD 01 — Product Overview](../../prd/01-product-overview.md)
- [PRD 02 — Architecture Overview](../../prd/02-architecture-overview.md)
- [PRD 04 — Glossary](../../prd/04-glossary.md)
- [PRD 06 — Template Contracts and Generated Assets](../../prd/06-template-contracts-and-generated-assets.md)
- [PRD 08 — Skills Catalog and Distribution](../../prd/08-skills-catalog-and-distribution.md)
- [PRD 09 — Dogfood and Maintainer Operations](../../prd/09-dogfood-and-maintainer-operations.md)
- [PRD 10 — Packaging, Validation, and Release Reference](../../prd/10-packaging-validation-and-release-reference.md)
- [PRD 16 — Package Runtime and Deployment Boundaries](../../prd/16-package-runtime-and-deployment-boundaries.md)
- [PRD 17 — System Asset Materialization and Local Bootstrap](../../prd/17-system-asset-materialization-and-local-bootstrap.md)
- [PRD 21 — Project Tool Directory and Resource Tiers](../../prd/21-project-tool-directory-and-resource-tiers.md)
- [PRD 34 — Playbook Authoring Contract and Model](../../prd/34-playbook-authoring-contract-and-model.md)
- [PRD 35 — Run Playbook State Machine and Portability](../../prd/35-run-playbook-state-machine-and-portability.md)
- [PRD 36 — Playbook Packaging Compiler and Harness Adapters](../../prd/36-playbook-packaging-compiler-and-harness-adapters.md)
- [PRD 03 — Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md)

## Source Obligations, Scenarios, And Findings

- O-001 remains separate W18 R3 adversarial-review work and is not closed or absorbed here.
- O-002 is superseded; this phase must not recreate Playbook or Protocol exposure work.
- No `NUAT-###` scenario is minted by this internal authority phase. If a user-observable slice is activated, canonical scenario authority must already exist or be established through the phase-entry decision gate.
- Findings and capability status remain `none` unless a canonical authority-backed record is created during execution.

## Stage 1 - Phase-Entry PRD Question And Risk Gate

### Tasks

- [ ] t1: Verify the exact worktree, branch, HEAD, free disk, dirty-state allowlist, and implementation authorization; confirm no prior-phase dependency and stop on unexpected user work or unsafe growth.
- [ ] t2: Reread the current normative bodies of every Source PRD plus PRD 03 and record each revision or content digest in the phase-entry record.
- [ ] t3: Reevaluate at minimum Q-021 and R-009, R-010, R-017, and R-025; add any newly relevant item found by the live authority read.
- [ ] t4: For every relevant `Open`, `Confirming`, `Deferred`, closed regression item, or new gap, record its ID, authority revision or digest, impact, classification (`blocking`, `impacted-nonblocking`, `unrelated`, `closed-regression-check`, or `new-authority-gap`), disposition, and rationale.
- [ ] t5: If no blocking item or authority gap remains, record an explicit no-blocker determination and the finite phase correction/review budget before unlocking t8.
- [ ] t6: If a blocker or authority gap exists, stop before implementation writes and present an owner decision package with source anchors, affected phase and PRDs, bounded options and trade-offs, recommendation, consequences, exact PRD/register/history edits, focused validation, and a decision-only commit boundary; do not create a standalone decision file.
- [ ] t7: After an owner decision, require the canonical PRD/register/history update, focused validation, separate decision commit, and recorded SHA for that decision commit before implementation unlocks; a work task cannot close a question, risk, finding, obligation, scenario, waiver, or capability by implication.
- [ ] t8: Record the Stage 1 outcome, applicable authority digests, dependency state, and implementation unlock or stop result.

### Acceptance criteria

- Every live-relevant question, risk, closed regression item, and authority gap has the required classification record.
- Implementation remains locked until either an explicit no-blocker determination exists or a validated decision-only commit SHA resolves every blocker.
- O-001, superseded O-002, scenario identity, findings, and capability status retain their owning authority.

### Dependencies

- Accepted W19 R1 design and plan.
- Reconciled current PRD authority.
- Separate implementation authorization before any Stage 2 task begins.

### Closeout Notes

- Testing-mode decision(s): record documentation-contract checks only; naive UAT remains `none` unless a real user-observable slice is activated.
- Phase / capability status: gate result pending.

## Stage 2 - Author The Upstream Resource Authority

### Tasks

- [ ] t9: Inventory the current `packages/docs/template/` resource roots, schemas, metadata, catalogs, routers, and active product claims without treating the root dogfood copy or packaged projection as authoring authority.
- [ ] t10: Author one coherent upstream inventory in which contracts, prompts, references, and templates are peer system-resource types with the stable identities and required metadata defined by the PRDs.
- [ ] t11: Make prompts first-class across resource catalogs, schemas, authoring guidance, and system-workflow composition without reviving legacy selection fields or requiring local projection.
- [ ] t12: Author the Naive-UAT system-workflow resources as a composition of governing contracts, prompts, references, and applicable templates; keep reusable UAT policy out of any future Skill shim.
- [ ] t13: Withdraw affirmative current claims that Playbooks or Protocols are Make Docs product capabilities and replace their current resource-authority expectations with the four peer system-resource types; preserve every existing Playbook/Protocol default asset, catalog entry, payload, and other removal candidate intact for P8's fresh production-consumer trace, backup, lock/quiescence checks, and retirement work.

### Acceptance criteria

- The upstream tree has one authoritative inventory for all four peer resource types.
- Prompts have the same identity, metadata, catalog, and validation standing as contracts, references, and templates.
- System-workflow resources are complete without a Skill, plugin, Playbook, or Protocol runtime.
- Current upstream authority contains no affirmative Playbook or Protocol product claim, while existing default assets, catalogs, payloads, and other removal candidates remain intact for the freshly traced and quiesced P8 retirement.

### Dependencies

- Stage 1 implementation unlock.
- Current PRD 06, 17, and 21 resource contracts.

### Closeout Notes

- Testing-mode decision(s): schema, metadata, catalog, content-boundary, link, and path validation.
- Phase / capability status: upstream authority authored; confirmation remains open.

## Stage 3 - Validate Documentation Authority

### Tasks

- [ ] t14: Run focused frontmatter, schema, catalog, relative-link, anchor, and repository path-hygiene checks over the changed upstream documentation resources.
- [ ] t15: Prove that current reusable authority has no duplicate resource identity, no legacy mode-field authority, no active Playbook/Protocol capability claim, and no copied UAT business logic in a Skill surface.
- [ ] t16: Obtain an independent review of the upstream resource contract and correct only actionable defects within the finite two-attempt/two-cycle budget.
- [ ] t17: Record changed-file scope, validation evidence, remaining nonblocking items, and the exact P1 dependency handoff to P2 without projecting, dogfooding, publishing, or releasing.

### Acceptance criteria

- Focused documentation, link, anchor, schema, path, and whitespace checks pass.
- Independent review finds no unresolved material authority conflict.
- Only upstream documentation authority changed, and P2 receives stable resource definitions without package or dogfood mutation.

### Dependencies

- Stage 2 completion.
- Finite correction and review budget.

### Closeout Notes

- Testing-mode decision(s): documentation authority and static resource-contract validation only.
- Phase / capability status: P1 may close only with explicit validation evidence; P2 remains separately gated.
