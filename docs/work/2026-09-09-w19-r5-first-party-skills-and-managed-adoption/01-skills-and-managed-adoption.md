---
title: "Phase 1: Skills and Managed Adoption"
kind: "work"
status: "active"
coordinate: "W19 R5 P1"
source:
  type: "prd"
  path: "docs/prd/08-skills-catalog-and-distribution.md"
---

# Phase 1: Skills and Managed Adoption

## Purpose

Make the first-party Skill selection work from an installed CLI without a network or maintainer checkout. Give an owner a clear review before existing Skill files become managed files.

## Overview

This is one phase with three ordered stages, from the [phase plan](../../plans/2026-09-09-w19-r5-first-party-skills-and-managed-adoption/01-skills-and-managed-adoption.md). All tasks are pending. The owner accepted the corrected backlog on 2026-09-09 and authorized implementation after the package commit. Keep W20 and W21 paused.

The seven names are `archive-docs`, `cleanup-docs`, `decompose-codebase`, `preflight`, `software-factory`, `human-experience`, and `naive-uat`. Keep `packages/skills` as the source workspace. Keep installed shared payload paths and native harness exposure. This work adds no plugin product, Skill-local state engine, or automatic workflow gate.

## Source PRD Docs

- [PRD 06: source ownership](../../prd/06-template-contracts-and-generated-assets.md) — R-SKILL-SOURCE-1–3.
- [PRD 08: bundled catalog](../../prd/08-skills-catalog-and-distribution.md#bundled-first-party-skill-catalog) — R-SKILL-BUNDLE-1–4.
- [PRD 09: maintainer proof](../../prd/09-dogfood-and-maintainer-operations.md) — R-SKILL-DOGFOOD-1–3.
- [PRD 10: package proof](../../prd/10-packaging-validation-and-release-reference.md) — R-SKILL-PACK-1–4.
- [PRD 16: deployment boundary](../../prd/16-package-runtime-and-deployment-boundaries.md#requirements) — R-PACK-SKILLS-1–3.
- [PRD 25: runtime boundary](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md#first-party-skill-runtime-boundary) — R-SKILL-RUNTIME-1–5.
- [PRD 28: adoption](../../prd/28-shared-agentics-installation-and-harness-exposure.md#reviewed-existing-skill-adoption) — R-SKILL-ADOPT-1–6.
- [PRD 38: Store operation state](../../prd/38-global-store-and-project-state.md#skill-adoption-state-r-skill-state) — R-SKILL-STATE-1–3 and R-TEST-8.
- [PRD 39: command contract](../../prd/39-cli-command-model-and-operation-registry.md) — R-SKILL-ADOPT-CMD-1–6.
- [PRD 46: testing boundary](../../prd/46-naive-end-user-acceptance-testing.md) — R-NUAT-SKILL-1–2.

## Source Obligations, Scenarios, And Findings

- [D-005](../../prd/03-open-questions-and-risk-register.md#d-005-skills-delivery-diverges-from-earlier-bundled-payload-expectations): open until actual bundled delivery, upgrade, adoption, and recovery proof.
- Q-001: first-party bundled delivery decided; this does not claim implementation completion. Q-007 concerns explicit alternate or future remote sources, with no first-party fallback.
- Deferred obligations: `not-needed-now`; no new O ID. Formal Unassisted Goal Testing: `not-needed-now` at drafting; no activated NUAT ID or finding. Reassess against the installed candidate under current testing authority.
- [Experience promises P1–P4](evidence.md#experience-promises) preserve the design's user goals and evidence limits.

## Stage 1 - Promotion and Packaging

### Tasks

- [ ] t1: Record the exact four source trees and their declared dependencies before promotion. Promote `preflight`, `software-factory`, and `human-experience` from `.agents/skills/`, and `naive-uat` from `packages/docs/template/.make-docs/agentics/skills/`, into `packages/skills/`. Preserve each declared file and binary byte hash. Do not delete the real local copies that later need reviewed adoption. Remove only the obsolete upstream UAT tree and parents proven empty after promotion. (A1, A12)
- [ ] t2: Make each Skill self-contained. Give preflight its own required Store reference; remove sibling-Skill dependencies, maintainer-only PRD links, local-manifest prerequisites, and repo-only evidence claims from portable instructions. Preserve explicit invocation for preflight, software-factory, and human-experience. Keep `naive-uat` as the thin shared-CLI adapter with display name Unassisted Goal Testing. Check references, examples, and harness metadata as part of each standalone payload. (A1)
- [ ] t3: Declare all seven first-party payloads in the effective registry. Read their allowlisted files directly from the sole `packages/skills/<name>/` sources and embed bytes in generated CLI build output. Package compiled output; create no separate replicated Skill tree under `packages/cli` or `packages/docs`, including ignored, temporary, or generated mirrors or `packages/cli/skills/`. Exclude caches, Finder files, test files, and authoring-only files. Embed declared binary assets without text decoding. Fail clearly on a missing or corrupt first-party bundle; never fetch or read the maintainer checkout as fallback. Preserve explicit alternate-source trust policy. Make `all` follow the effective registry; `none` and bare setup select no Skills. (A2, A3)
- [ ] t4: Compare declared source byte/hash inventories with the embedded build, package archive, extracted CLI artifact, and isolated installed output. Inspect the actual disk under `packages`, not only Git-tracked paths: reject duplicate Skill source/payload trees, including ignored, temporary, or generated mirrors, and obsolete empty mirror directories. The compiled artifact is allowed; replicated Skill directories are not. Install each Skill alone from the extracted package with network and maintainer checkout unavailable. Run `all`, `none`, and missing/corrupt-bundle cases. Add focused tests for payload membership, byte hashes, standalone references, and retired UAT source absence. (A1–A3, A12)

### Acceptance criteria

- A1: Four promotions retain their declared content; each of seven Skills works without siblings. Portable instructions preserve explicit-only behavior and UAT's shared workflow boundary. [Evidence](evidence.md#a1-source-and-standalone-intent).
- A2: Compiled and packed CLI artifacts embed the declared source allowlist byte-for-byte, including binary assets. No separate replicated Skill tree exists under `packages/cli` or `packages/docs`. No cache, Finder, test, or authoring-only files leak. [Evidence](evidence.md#a2-payload-membership-and-bytes).
- A3: All seven individual offline installs succeed without a checkout; `all`, `none`, bare selection, and missing/corrupt-bundle refusal match the contract without first-party fetch. [Evidence](evidence.md#a3-offline-selection).
- A12: Actual-disk checks under `packages` include ignored, temporary, and generated paths and empty folders; duplicate Skill trees and obsolete empty mirror roots are absent. Compare source and embedded build/archive/extracted inventories with genuine installed outputs. No obsolete UAT source or unexplained empty source parents remain. [Evidence](evidence.md#a12-complete-directory-proof).

### Dependencies

- Owner acceptance of this backlog (recorded 2026-09-09); current design, plan, and PRD authority.

### Closeout Notes

- Testing: automated payload and package tests plus standalone instruction review are required. Formal UAT, visual, and accessibility checks are `not-needed-now` unless a concrete surface need emerges.
- Evidence: [A1–A3 and A12](evidence.md#acceptance-results) are planned, not run. Stage 1 must pass before real maintainer adoption.
- Phase / capability status: implementation not started; Stage 1 pending.

## Stage 2 - Installation and Adoption

### Tasks

- [ ] t5: Add `--adopt-existing <csv>` and digest-bound `--review <digest>` only to `setup skills`. Adoption names must be a subset of selected first-party registry names. Reject review without adoption, adoption with removal, and invalid or unselected names. Keep target, scope, tool, and output conventions of the current command. Present exact file effects, backups, ownership changes, blockers, and digest in dry-run and interactive review. Dry-run creates no Store intent, backup, directory, or marker. Noninteractive adoption requires the matching review digest; `--yes` alone is insufficient. (A5, A6)
- [ ] t6: Build the complete adoption inventory and bind its review digest to target/scope, selected tools and Skills, registry and package/source identities, source and destination hashes, link states, and current ownership. Allow reviewed known-file differences and missing declared files. Block unknown extras, unsafe links, conflicting native copies, and another recorded owner. Do not infer ownership from names. Recheck all facts under the existing operation lock before any mutation. (A5, A7, A8)
- [ ] t7: Use the existing global Store operation, journal, backup references, and recovery boundary for adoption. Record intent before file or ownership writes. Back up existing changed bytes before replacement. Record ownership even when all file bytes already match; do not take a file-no-op shortcut. Required Store failure stops managed writes. Keep pending operations recoverable and block competing writes; no local plan, receipt, queue, lock, or fallback state. (A5, A9, A10)
- [ ] t8: Preserve project/global shared payload placement and Codex/Claude symlink and managed-copy exposure. Upgrade proven first-party legacy source records to bundled sources without fetch. Keep edited managed content as conflicts and third-party same-name content outside automatic first-party ownership. Make adopted payload update, isolated removal, and repeat use the normal lifecycle. (A4, A11)
- [ ] t9: Add focused adoption tests for every refusal and digest dimension, ownership-only registration, Store errors, concurrent mutation, pending operation interruption, resume, rollback, and recovery drift. Verify preserved bytes, backups, final ownership, and no false completion, not just exit codes. (A5–A10)

### Acceptance criteria

- A4: Project and isolated-global installs support Codex and Claude, selected separately and together, with symlink and copy-mirror paths. Shared paths and user content remain safe. [Evidence](evidence.md#a4-scope-and-harness-exposure).
- A5: Reviewed differences and missing declared files can be adopted with exact effects and verified retained backups; dry-run is wholly read-only. [Evidence](evidence.md#a5-reviewed-adoption).
- A6: Invalid flag combinations, unselected names, and generic noninteractive yes refuse before mutation; a matching explicit review works. [Evidence](evidence.md#a6-command-edges).
- A7: Extra files, unsafe links, conflicting copies, and other ownership block without modifying content or claiming ownership. [Evidence](evidence.md#a7-unsafe-or-ambiguous-input).
- A8: Changes to inventory, bytes, links, ownership, scope, tool selection, Skill selection, source, registry, or package invalidate the review under lock. [Evidence](evidence.md#a8-stale-review).
- A9: Byte-identical adoption still registers ownership through a Store operation; the later repeat reports a true no-op. [Evidence](evidence.md#a9-ownership-only-and-repeat).
- A10: Required Store errors and concurrency stop safely; interrupted adoption stays pending until verified resume or rollback. Changed recovery inputs cannot produce false success or overwrite user content. [Evidence](evidence.md#a10-store-and-recovery).
- A11: Proven old first-party source records upgrade offline; edited content stays conflicted. Adopted updates and isolated removals affect only owned files and preserve unrelated data. [Evidence](evidence.md#a11-upgrade-update-and-removal).

### Dependencies

- Stage 1 payload and offline package evidence; existing Store lifecycle and ownership rules.

### Closeout Notes

- Testing: automated lifecycle/fault cases and independent code review are required. Real removals use isolated fixtures only. CLI-free ordinary work remains allowed, with no false state capture claim.
- Evidence: [A4–A11](evidence.md#acceptance-results) are planned, not run. Keep Store operation payloads in the Store; retain only bounded review evidence here.
- Phase / capability status: implementation not started; Stage 2 pending.

## Stage 3 - Tests and Maintainer Proof

### Tasks

Complete t13 content and help changes before the final t10 candidate checks, t11 review, and t12 real adoption. If later edits change that candidate, rerun affected checks and bind review/adoption evidence to the final package. The task IDs are stable tracking IDs, not permission to test stale output.

- [ ] t10: Run the complete finite A1–A12 matrix against the final source and installed package. Add regression coverage for old source records, single-Skill installation, isolated global scope, edited-content preservation, adoption/update/removal/repeat, and file/empty-directory inventories. Run appropriate type, runtime, package, defaults, and authority checks after integration. Retain build identity and actual results; rerun only checks affected by later fixes. (A1–A12)
- [ ] t11: Obtain an independent material code review of adoption, ownership, recovery, and payload delivery. Obtain a fresh-context agent review using installed public CLI output and standalone Skill payloads, without maintainer checkout or prior task memory. Retain prompt, actions, outputs, findings, corrections, reviewer identity, and actual tool limits. Check clear review effects and explicit-only behavior; do not call scripted review lived human evidence. (A13; P1–P4)
- [ ] t12: After isolated package proof passes, run the normal `just install-cli-pack` recipe. Use the public installed CLI to review the three real local maintainer copies and then adopt the exact reviewed selection. Preserve local edits with the declared review/backups. Verify payload bytes, native exposures, Store ownership, no pending recovery, and repeat no-op. Do not hand-copy or hand-delete local copies, or test removal against real installations. (A14)
- [ ] t13: Update affected current Skill/system guidance, help, package/release guidance, and project guides from their correct upstream or project owners. Add concise source-rule guidance to package authoring instructions and package README/release text: only `packages/skills/<name>/` is source; the build embeds declared bytes directly; no separate Skill mirrors under `packages/cli` or `packages/docs`, even ignored or temporary ones. This instruction update is an implementation task, not part of package drafting. Use installed CLI setup to refresh dogfood system assets. Record coverage verdicts `create`, `update-existing`, `link-only`, or `none` and effective Persona targets. Check that no active text adds local state, a first-party remote fallback, sibling dependence, or automatic explicit-only Skill activation. (A1, A6, A13, A14)
- [ ] t14: Complete the central acceptance and experience report with the actual A1–A14 results and P1–P4 conclusions, including failures, fixes, build identity, retained evidence, and reviewer limits. Resolve D-005 only when delivery and lifecycle evidence supports closure. Present the phase for owner acceptance; record any remaining scope or review limits. Keep phase closeout, commit, publication, and W20/W21 resumption gated by explicit authority. (A1–A14)

### Acceptance criteria

- A13: Independent code and fresh-context reviews find no unresolved material defect. The report names the actual commands/tools, tested build, human goals, observations, and limits. [Evidence](evidence.md#a13-independent-and-fresh-context-review).
- A14: The rebuilt installed CLI performs the real maintainer review and adoption. Read-back proves payloads, exposures, Store ownership and ready status; repeat is a true no-op. [Evidence](evidence.md#a14-real-maintainer-adoption).
- All A1–A14 cases have actual evidence or an owner-reviewed, bounded disposition. No unrun case is marked passed.
- P1–P4 have clear observations and limits. Owner phase acceptance remains separate from automated success and reviewer completion.

### Dependencies

- Stages 1 and 2 complete; isolated safety and package proof before real adoption.

### Closeout Notes

- Testing modes: automated tests, package/offline integration, independent code review, and fresh-context CLI/Skill review are required. Formal UAT remains `not-needed-now` unless current authority identifies a material uncertainty in the candidate. No NUAT result is implied. Visual/accessibility checks remain `not-needed-now` absent a specific need.
- Coverage decisions: system and affected existing guide updates are expected (`update-existing`); confirm exact targets during t13. New guides are not presumed necessary. Test and experience coverage require actual observations in [the central report](evidence.md).
- Phase / capability status: accepted backlog; implementation authorized, tasks not started. All stage evidence, owner phase acceptance, closeout, and implementation commit remain pending.
