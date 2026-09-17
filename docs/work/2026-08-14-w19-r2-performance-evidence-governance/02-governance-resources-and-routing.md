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
- [PRD 10 — Packaging, Validation, and Release Reference](../../prd/10-packaging-validation-and-release-reference.md)
- [PRD 14 — Lifecycle Workflow and Coverage Passes](../../prd/14-lifecycle-workflow-and-coverage-passes.md)
- [PRD 15 — Agent Instruction Ownership and Managed Blocks](../../prd/15-agent-instruction-ownership-and-managed-blocks.md)
- [PRD 21 — Project Tool Directory and Resource Tiers](../../prd/21-project-tool-directory-and-resource-tiers.md)
- [PRD 48 — Performance Evidence Governance](../../prd/48-performance-evidence-governance.md)
- [PRD 49 — Human Experience Standard and Intent](../../prd/49-human-experience-standard-and-intent.md)
- [PRD 50 — Proportionate Testing and Human-Centered Validation](../../prd/50-proportionate-testing-and-human-centered-validation.md)

## Source Obligations, Scenarios, And Findings

- `O-###: none` — no deferred obligation is assigned at backlog generation.
- `NUAT-###: none` — no Unassisted Goal Test is assigned to this resource phase.
- `Finding: none` — no finding is assigned; task completion cannot close a later finding.

## Stage 1 - Phase-Entry PRD Question And Risk Gate

### Tasks

- [x] t1: Verify the exact branch, HEAD, worktree, free disk, phase write allowlist, and current dirty state; stop on unexpected user work or unsafe resource pressure.
- [x] t2: Reread the current normative bodies of PRDs 06, 10, 14, 15, 21, 48, 49, and 50 plus PRD 03, and record each current revision or content digest before implementation.
- [x] t3: Reevaluate at minimum Q-017 only if this phase would change centralization or replication, Q-021, R-017, R-029 through R-032, and R-034; add any newly relevant current item discovered by the live reread.
- [x] t4: For every relevant `Open`, `Confirming`, `Deferred`, or closed regression item, record its ID, authority revision or digest, impact, classification (`blocking`, `impacted-nonblocking`, `unrelated`, `closed-regression-check`, or `new-authority-gap`), disposition, and rationale.
- [x] t5: If no blocking item or authority gap remains, record an explicit no-blocker result and the finite phase correction/review budget before unlocking t8.
- [x] t6: If a blocking item or authority gap exists, stop before implementation writes and present an owner decision package with the source anchor, affected phase/PRDs, bounded options and trade-offs, recommendation, consequences, exact PRD/register/history changes, validation, and decision-only commit boundary; do not create a standalone decision file.
- [x] t7: After an owner decision, require the canonical PRD/register/history update, focused validation, separate decision-only commit, and recorded decision commit SHA before marking this gate unlocked.

### Acceptance criteria

- The current owning PRDs and PRD 03 were reread from the worktree and their revisions or digests are recorded.
- Candidate mappings were treated as starters and every relevant item has an explicit classification and rationale.
- The gate records either an explicit no-blocker result or a complete owner decision package.
- No implementation file was written before the gate unlocked.
- Any blocking decision is represented in current PRD authority and history, validated, separately committed, and referenced by SHA.
- No task completion is treated as closing a question, risk, finding, waiver, obligation, or capability.

### Dependencies

- Accepted W19 R2 plan and reconciled PRD authority.
- The [W19 R2 P1 work-history closeout](./01-prd-authority-and-target-inventory.md) records the original PRD work as completed and committed. The current phase-entry reread controls later authority drift.
- Completed W19 R1 peer-resource and upstream-first documentation authority is available to the implementation worktree. Current W19 R6 static-adapter boundaries and W20 R2 agent-review boundaries also apply.

### Closeout Notes

- Entry state: branch `make-docs-v2`; base `ca0909a`; entry HEAD `744c3a7b`; 131 GB free disk; dirty files matched the preserved P2 candidate allowlist.
- Authority digests:
  - PRD 03: `575823ba6ef617e5b1b3fc20417c82f30d83ae8630fbf270a7a9abdd83da10e8`
  - PRD 06: `f5a2f7a8ca82e9e3299d454df9a4636e4a3eabd81551da67e3830e6f80163442`
  - PRD 10: `f71d083e58373bd786251e2bd45b449937ddf05cedfd5588c367f18323f7fc37`
  - PRD 14: `114f5b85da76b09951df23dbe279fd8e4c4fb0c765c45e8cad7b96f07dfe3522`
  - PRD 15: `4dc575f63dee7c905a462aa338e1af4ca139da52d4040e85ff60a2ae3b12dc3b`
  - PRD 21: `8a9d303523e02801dbab675800b2e2ad6f9b38a25d14df386cb77e8524f455b7`
  - PRD 48: `8ff466996e1da56714dbdc910e3a4e95933ca1fced29a8af8bad5c52aab32125`
  - PRD 49: `db65bcd107fc26958a97e6af9777a9d1da89622e5194817c90df66766c4d8020`
  - PRD 50: `461262c7b2e04eed560ac85b96ffa1e7ca90f0c0c660b0b3a7d835dd4f1d0bc4`
- Authority change check: PRDs 03 and 10 changed after `ca0909a` for the W19 R8 setup repair. Those changes do not change P2 resource policy, resource scope, or the four approved resource identities.
- Item review:
  - Q-017: `impacted-nonblocking`; P2 keeps one detailed contract and does not expand shared layout.
  - Q-021: `impacted-nonblocking`; the resources use bounded plain language and progressive detail.
  - R-017: `impacted-nonblocking`; one resource identity and one byte source remain authoritative. No Skill or agent copy was added.
  - R-029 through R-032: `impacted-nonblocking`; the contract keeps finite budgets, proof-mode separation, repository authority, and explicit expiry.
  - R-034: `impacted-nonblocking`; validation is proportional and adds no required human burden.
- Gate result: no P2 authority blocker and no new authority gap. Tasks t6 and t7 were evaluated but were not activated.
- Budget: at most two material correction attempts and two review cycles. No material correction attempt was used at entry.
- Testing-mode decision(s): focused Automated Implementation Testing is selected. Performance Testing, Guided Progress Review, and Unassisted Goal Testing are `not-needed-now` for the P2 resource-authoring decision. Agent Human Experience Review applies to the real maintainer-facing resources.
- Phase / capability status: entry gate unlocked. Gate completion alone does not complete P2.

## Stage 2 - Author The Canonical Governance Resources Upstream

### Tasks

- [x] t8: Confirm the exact upstream target paths under `packages/docs/template/.make-docs/system/{contracts,prompts,references,templates}/` and prove no old-path resource would remain a competing current authority.
- [x] t9: Author the single detailed `performance-evidence-governance.md` contract covering applicability, maturity, target-class ownership, profile lineage, comparability, non-sacrificable constraints, finite budgets, unchanged reuse, affected-only reruns, diminishing-return stops, outcomes, findings, waivers, expiry, singular requalification, proof-mode boundaries, and repository/state authority.
- [x] t10: Author `performance-coverage.prompt.md` as a bounded candidate inventory that records both the base maintenance action and PRD 48 applicability disposition, rejects unsupported or copied targets, and asks only decision-relevant questions.
- [x] t11: Author `performance-evidence.md` as a progressive plain-language reference that explains qualification, target classes, `PERF-###` identity, fingerprints, budgets, normalized outcomes, expiry, requalification, and common authority failures without creating policy copies.
- [x] t12: Author `performance-evidence-profile.md` so non-executable dispositions stop before profile fields and executable candidates expose the full PRD 48 shape without example numbers, universal counts, or statistical recipes.
- [x] t13: Assign and validate the four stable peer URIs for contract, prompt, reference, and template; verify the prompt is not placed under a reference namespace.

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
- Phase / capability status: complete. The contract is the only detailed policy source. The prompt, reference, and template are bounded peer resources.

## Stage 3 - Keep Routers And Lifecycle Touchpoints Thin

### Tasks

- [x] t14: Update only the relevant paired `AGENTS.md`/`CLAUDE.md` managed blocks to point to the canonical contract and load the prompt/template only when a performance candidate exists.
- [x] t15: Add only applicability, canonical-profile link, finite-budget/stop reference, and outcome/evidence handoff fields to lifecycle-facing templates or prompts authorized by the phase scope; do not duplicate detailed policy or live targets.
- [x] t16: Preserve direct CLI and native MCP system-resource list/read resolution through one resource identity and byte source, including machine-installed fallback when no optional local projection exists.
- [x] t17: Prove Skills, optional agentics, CLI/MCP help, routers, and templates contain no duplicated performance business policy and cannot become correctness prerequisites or second authorities.

### Acceptance criteria

- Routers are concise, paired where required, and progressively disclose the canonical resources.
- Lifecycle touchpoints link rather than copy targets or policy.
- Direct CLI and native MCP resolve the same resource identities and content.
- No Skill, optional agentic output, router, help text, or template owns duplicated Unassisted Goal Testing, performance, static-adapter, installed-product, release, or support business logic.

### Dependencies

- Stage 2 accepted.
- R-017 remains explicitly guarded rather than implicitly closed.
- Before t16, reuse the completed W19 R1 resource and resolver evidence plus current validation of shared CLI and native-MCP list/read resolution. Stop only if the current evidence is stale or the changed surface invalidates it.

### Closeout Notes

- Testing-mode decision(s): router pairing, managed-block, line-budget, resource-resolution, and policy-duplication checks.
- Phase / capability status: complete. All eight routers are paired and conditional. The lifecycle surfaces contain only the four approved fields.

## Stage 4 - Project, Dogfood, Validate, And Close P2

### Tasks

- [x] t18: Validate upstream resource identifiers, frontmatter, paths, relative links, anchors, managed-block pairing, and representative documentation fixtures before projection.
- [x] t19: Run the maintained package projection path so `packages/cli/template/` is generated from `packages/docs/template/`; do not hand-edit generated copies.
- [x] t20: Deliberately dogfood only the authorized resource/router selection after review and prove required byte parity and optional-local versus machine-installed resolution.
- [x] t21: Run focused resource, router, path-hygiene, link, fixture, package-projection, and affected tests; retry only failed affected checks after a material correction and reuse unchanged results.
- [x] t22: Independently review the exact P2 diff for policy duplication, target-authority drift, hidden defaults, centralization creep, and arbitrary performance requirements.
- [x] t23: Record exact changed files, validations, remaining questions, risks, findings, consumed correction and review budget, phase-versus-capability status, and agent Human Experience Review of the real resources; do not close PRD 03 items by task completion.

### Acceptance criteria

- Upstream, generated package projection, and selected dogfood copies follow the accepted source-of-truth order.
- Optional local projection and machine-installed fallback both resolve without requiring a full local snapshot.
- Focused validation passes with no arbitrary universal target, benchmark execution, or unexpected file.
- Review confirms the four resources and thin routers preserve current PRD authority and all finite-work semantics.
- P2 closeout distinguishes completed tasks from still-open risks, findings, obligations, and overall capability status.

### Dependencies

- Stages 2 and 3 accepted.
- Maintained projection and dogfood operations separately authorized at phase execution time.
- Before t18 through t21, reuse the completed W19 R1 P10 package-projection evidence and rerun the affected current package, dogfood, resolution, and byte-parity checks. Do not require a separate historical acceptance gate.

### Closeout Notes

- Testing-mode decision(s): focused Automated Implementation Testing and agent Human Experience Review are required for closeout. Performance Testing, Guided Progress Review, and Unassisted Goal Testing remain `not-needed-now` unless current evidence changes the decision. `O-###`, `NUAT-###`, and finding remain `none` unless real execution creates an authority-backed reference.
- Exact tracked candidate files:
  - Code and checks: `packages/cli/src/rules.ts`, `packages/cli/tests/resource-provider-integration.test.ts`, `packages/cli/tests/performance-evidence-resources.test.ts`, `packages/cli/tests/template-links.test.ts`, and `scripts/smoke-pack.mjs`.
  - The following exact projection paths changed under both `packages/docs/template/` and the project root: `.make-docs/system-resources.catalog.json`, `.make-docs/system/contracts/performance-evidence-governance.md`, `.make-docs/system/prompts/coverage-pass-testing-uat.prompt.md`, `.make-docs/system/prompts/performance-coverage.prompt.md`, `.make-docs/system/references/performance-evidence.md`, `.make-docs/system/templates/performance-evidence-profile.md`, `.make-docs/system/templates/work-phase.md`, `docs/designs/AGENTS.md`, `docs/designs/CLAUDE.md`, `docs/plans/AGENTS.md`, `docs/plans/CLAUDE.md`, `docs/prd/AGENTS.md`, `docs/prd/CLAUDE.md`, `docs/work/AGENTS.md`, and `docs/work/CLAUDE.md`.
  - `packages/cli/template/` was rebuilt from upstream. It is ignored generated output and was not hand-edited.
- Validation:
  - 30 of 30 upstream-to-generated and upstream-to-dogfood byte comparisons passed.
  - Installed-origin CLI reads for all four resource URIs matched upstream bytes.
  - The focused resource, router, projection, offline-resolution, and fixture suite passed 29 of 29 tests.
  - Default validation passed 53 of 53 tests.
  - PRD authority validation passed with 36 PRDs, 573 Markdown files, 196 structured files, 1,115 links, and no diagnostic.
  - Scoped path hygiene passed for 29 changed content files with no finding or I/O error.
  - The instruction-router check and `git diff --check` passed.
  - The local packed-package smoke check with dogfood verification passed in 7.8 seconds.
  - No performance benchmark ran.
- Independent review: task `01a0a8ce-410b-7863-a653-24f150191721` reviewed the full upstream and code candidate. It found no P0, P1, P2, or P3 issue. Those inputs did not change. This result was reused.
- Limited confirmation review: the dogfood copies match upstream bytes. The packaged fallback exposes all four URIs. The exact Codex method remains `mcp`. Claude Code remains `none`.
- Machine setup result:
  - The global Make Docs config now records Codex intent `mcp` and Claude Code intent `none`.
  - The stale operation `dcd4fb60-7c5f-4526-8c51-d7d301ae0ba1` belonged to the external `north-atlantic-buildos` checkout. The declarative project ID and inode matched the Store. Only the mounted device number changed.
  - A verified Store backup was created. One exact checkout identity row was repaired. The normal recovery command then rolled back the incomplete migration with no project-file change and no conflict.
  - The external checkout now reports `ready`. No Store operation or lock remains pending. Store integrity passes.
  - The Codex native config contains one owned `mcp_servers.make_docs` block. All 21 existing skill tables remain present.
  - Repeat verification reports machine status `unchanged`, Codex method `mcp`, Claude Code method `none`, no mutation, and no failed condition.
- Human Experience Review:
  - Affected human goal: a maintainer can decide whether performance evidence applies, find the one policy source, create the correct bounded record, and stop or escalate without guessing.
  - Public surface: the four system resources, eight routers, work-phase template, coverage prompt, and resource list/read output.
  - Evidence: full resource review, paired-router review, 30 byte comparisons, 29 focused tests, 53 default tests, four installed resource reads, and the packed-package smoke check.
  - Observation: the contract starts with purpose and applicability. The template stops non-executable cases before full fields. Routers add one conditional pointer. The contract gives clear finite budgets, outcomes, expiry, recovery, and owner-control rules.
  - Conclusion: `satisfied` within agent-review limits for orientation, authority clarity, progressive disclosure, next action, stop behavior, recovery, and control.
  - Limit: this was an agent review. It did not measure lived human ease, owner acceptance, or benchmark performance. This task verified the installed Codex MCP configuration but did not reload its own tool inventory.
  - Next action: stop at the separate P2 staging and commit gate. Optional maintainer feedback can follow the agent review.
- Budget consumed: zero material correction attempts; two review cycles, consisting of the reused independent review and this limited confirmation review.
- Remaining questions, risks, findings, and obligations: no new P2 question, product finding, or obligation. Q-017, Q-021, R-017, R-029 through R-032, and R-034 keep the dispositions recorded at the entry gate. The unrelated Store operation is resolved and did not become a P2 product requirement.
- Phase / capability status: P2 is complete within the recorded evidence limits. W19 R2 remains open through P3 and P5. Stop at the separate P2 staging and commit gate.
