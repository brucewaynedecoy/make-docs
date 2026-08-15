---
title: "Phase 2: Governance Resources and Routing"
kind: "work"
status: "active"
coordinate: "W19 R2 P2"
source:
  type: "prd"
  path: "docs/prd/48-performance-evidence-governance.md"
---

# Phase 2: Governance Resources and Routing

## Purpose

Deliver the minimum documentation-first system-resource set that exposes Performance Evidence Governance through the accepted peer-resource model without duplicating policy across templates, routers, Skills, CLI/MCP help, or optional agentics.

## Overview

Author upstream first in `packages/docs/template/`, validate before projection, use only maintained projection and dogfood paths, and preserve machine-installed resolution when no project-local snapshot exists. The phase uses no real benchmark, supplies no numeric defaults, and permits at most two materially distinct correction attempts and two review cycles.

## Source PRD Docs

- [PRD 03 — Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md)
- [PRD 06 — Template Contracts and Generated Assets](../../prd/06-template-contracts-and-generated-assets.md)
- [PRD 14 — Lifecycle Workflow and Coverage Passes](../../prd/14-lifecycle-workflow-and-coverage-passes.md)
- [PRD 21 — Project Tool Directory and Resource Tiers](../../prd/21-project-tool-directory-and-resource-tiers.md)
- [PRD 48 — Performance Evidence Governance](../../prd/48-performance-evidence-governance.md)

## Source Obligations, Scenarios, And Findings

- `O-###: none` — no deferred obligation is assigned at backlog generation.
- `NUAT-###: none` — no naive-UAT scenario is assigned to this resource phase.
- `Finding: none` — no finding is assigned; task completion cannot close a later finding.

## Stage 1 - Phase-Entry PRD Question And Risk Gate

### Tasks

- [ ] t1: Verify the exact branch, HEAD, worktree, free disk, phase write allowlist, and current dirty state; stop on unexpected user work or unsafe resource pressure.
- [ ] t2: Reread the current normative bodies of PRDs 06, 14, 21, and 48 plus PRD 03, and record each current revision or content digest before implementation.
- [ ] t3: Reevaluate at minimum Q-017 only if this phase would change centralization or replication, Q-021, R-017, and R-029 through R-032; add any newly relevant current item discovered by the live reread.
- [ ] t4: For every relevant `Open`, `Confirming`, `Deferred`, or closed regression item, record its ID, authority revision or digest, impact, classification (`blocking`, `impacted-nonblocking`, `unrelated`, `closed-regression-check`, or `new-authority-gap`), disposition, and rationale.
- [ ] t5: If no blocking item or authority gap remains, record an explicit no-blocker result and the finite phase correction/review budget before unlocking t8.
- [ ] t6: If a blocking item or authority gap exists, stop before implementation writes and present an owner decision package with the source anchor, affected phase/PRDs, bounded options and trade-offs, recommendation, consequences, exact PRD/register/history changes, validation, and decision-only commit boundary; do not create a standalone decision file.
- [ ] t7: After an owner decision, require the canonical PRD/register/history update, focused validation, separate decision-only commit, and recorded decision commit SHA before marking this gate unlocked.

### Acceptance criteria

- The current owning PRDs and PRD 03 were reread from the worktree and their revisions or digests are recorded.
- Candidate mappings were treated as starters and every relevant item has an explicit classification and rationale.
- The gate records either an explicit no-blocker result or a complete owner decision package.
- No implementation file was written before the gate unlocked.
- Any blocking decision is represented in current PRD authority and history, validated, separately committed, and referenced by SHA.
- No task completion is treated as closing a question, risk, finding, waiver, obligation, or capability.

### Dependencies

- Accepted W19 R2 plan and reconciled PRD authority.
- The [W19 R2 P1 work-history closeout](./01-prd-authority-and-target-inventory.md) records the PRD work as completed and validated in the current worktree. Before P2 implementation starts, that PRD authority and closeout must be committed and integrated, or this gate must stop on drift or missing authority.
- W19 R1 peer-resource and upstream-first documentation authority available to the implementation worktree; documentation authority alone is not implementation or landing evidence for later runtime, projection, or dogfood tasks.

### Closeout Notes

- Testing-mode decision(s): focused documentation and representative-fixture checks plus independent review; naive UAT, accessibility review, and visual review are `none` unless the implemented surface materially activates them.
- Phase / capability status: `blocked` until this gate records an unlock; gate completion alone does not complete P2.

## Stage 2 - Author The Canonical Governance Resources Upstream

### Tasks

- [ ] t8: Confirm the exact upstream target paths under `packages/docs/template/.make-docs/system/{contracts,prompts,references,templates}/` and prove no old-path resource would remain a competing current authority.
- [ ] t9: Author the single detailed `performance-evidence-governance.md` contract covering applicability, maturity, target-class ownership, profile lineage, comparability, non-sacrificable constraints, finite budgets, unchanged reuse, affected-only reruns, diminishing-return stops, outcomes, findings, waivers, expiry, singular requalification, proof-mode boundaries, and repository/state authority.
- [ ] t10: Author `performance-coverage.prompt.md` as a bounded candidate inventory that records both the base maintenance action and PRD 48 applicability disposition, rejects unsupported or copied targets, and asks only decision-relevant questions.
- [ ] t11: Author `performance-evidence.md` as a progressive plain-language reference that explains qualification, target classes, `PERF-###` identity, fingerprints, budgets, normalized outcomes, expiry, requalification, and common authority failures without creating policy copies.
- [ ] t12: Author `performance-evidence-profile.md` so non-executable dispositions stop before profile fields and executable candidates expose the full PRD 48 shape without example numbers, universal counts, or statistical recipes.
- [ ] t13: Assign and validate the four stable peer URIs for contract, prompt, reference, and template; verify the prompt is not placed under a reference namespace.

### Acceptance criteria

- Exactly one detailed reusable policy contract exists.
- Four peer resource types have stable URIs, canonical upstream paths, and no competing old-path authority.
- Target authority is unambiguous by class: PRDs alone own hard product requirements; approved plan/work profiles remain bounded non-product authority.
- Characterization cannot become a threshold without explicit promotion lineage and owner-approved canonical authority.
- The template activates profile fields only for executable candidates and contains no arbitrary target, sample count, environment matrix, or benchmark framework.
- Finite budgets, unchanged reuse, affected-only reruns, diminishing returns, normalized outcomes, and singular requalification are represented coherently.

### Dependencies

- Stage 1 unlocked.
- Current PRDs 06, 14, 21, and 48.

### Closeout Notes

- Testing-mode decision(s): structural resource/schema/link review; no benchmark execution.
- Phase / capability status: resources authored, but routing, projection, and phase validation remain open.

## Stage 3 - Keep Routers And Lifecycle Touchpoints Thin

### Tasks

- [ ] t14: Update only the relevant paired `AGENTS.md`/`CLAUDE.md` managed blocks to point to the canonical contract and load the prompt/template only when a performance candidate exists.
- [ ] t15: Add only applicability, canonical-profile link, finite-budget/stop reference, and outcome/evidence handoff fields to lifecycle-facing templates or prompts authorized by the phase scope; do not duplicate detailed policy or live targets.
- [ ] t16: Preserve direct CLI and native MCP system-resource list/read resolution through one resource identity and byte source, including machine-installed fallback when no optional local projection exists.
- [ ] t17: Prove Skills, optional agentics, CLI/MCP help, routers, and templates contain no duplicated performance business policy and cannot become correctness prerequisites or second authorities.

### Acceptance criteria

- Routers are concise, paired where required, and progressively disclose the canonical resources.
- Lifecycle touchpoints link rather than copy targets or policy.
- Direct CLI and native MCP resolve the same resource identities and content.
- No Skill, optional agentic output, router, help text, or template owns duplicated UAT, performance, conformance, release, or support business logic.

### Dependencies

- Stage 2 accepted.
- R-017 remains explicitly guarded rather than implicitly closed.
- Before t16, recorded successful W19 R1 P1, P2, and P3 closeouts plus current implementation validation evidence must prove the four-type system-resource layout and shared CLI/native-MCP list/read resolution that t16 consumes; otherwise defer t16 and its acceptance claim.

### Closeout Notes

- Testing-mode decision(s): router pairing, managed-block, line-budget, resource-resolution, and policy-duplication checks.
- Phase / capability status: routing complete; generated projection and closeout proof remain open.

## Stage 4 - Project, Dogfood, Validate, And Close P2

### Tasks

- [ ] t18: Validate upstream resource identifiers, frontmatter, paths, relative links, anchors, managed-block pairing, and representative documentation fixtures before projection.
- [ ] t19: Run the maintained package projection path so `packages/cli/template/` is generated from `packages/docs/template/`; do not hand-edit generated copies.
- [ ] t20: Deliberately dogfood only the authorized resource/router selection after review and prove required byte parity and optional-local versus machine-installed resolution.
- [ ] t21: Run focused resource, router, path-hygiene, link, fixture, package-projection, and affected tests; retry only failed affected checks after a material correction and reuse unchanged results.
- [ ] t22: Independently review the exact P2 diff for policy duplication, target-authority drift, hidden defaults, centralization creep, and arbitrary performance requirements.
- [ ] t23: Record exact changed files, validations, remaining questions/risks/findings, consumed correction/review budget, and phase-versus-capability status; do not close PRD 03 items by task completion.

### Acceptance criteria

- Upstream, generated package projection, and selected dogfood copies follow the accepted source-of-truth order.
- Optional local projection and machine-installed fallback both resolve without requiring a full local snapshot.
- Focused validation passes with no arbitrary universal target, benchmark execution, or unexpected file.
- Review confirms the four resources and thin routers preserve current PRD authority and all finite-work semantics.
- P2 closeout distinguishes completed tasks from still-open risks, findings, obligations, and overall capability status.

### Dependencies

- Stages 2 and 3 accepted.
- Maintained projection and dogfood operations separately authorized at phase execution time.
- Before t18 through t21, recorded successful W19 R1 P10 closeout plus current package-projection and maintainer-dogfood validation evidence must prove the consumed system-resource layout, CLI/native-MCP resolution, and required byte parity; otherwise defer those tasks.

### Closeout Notes

- Testing-mode decision(s): focused automated checks and independent review complete; `O-###`, `NUAT-###`, and finding remain `none` unless real execution created an authority-backed reference.
- Phase / capability status: P2 may close when all acceptance criteria pass; W19 R2 capability remains open through P3 and P5.
