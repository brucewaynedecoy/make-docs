---
title: "Phase 1: Skills and Managed Adoption"
kind: "work"
status: "completed"
coordinate: "W19 R5 P1"
source:
  type: "prd"
  path: "docs/prd/08-skills-catalog-and-distribution.md"
---

# Phase 1: Skills and Managed Adoption

## Purpose

Make the first-party Skill selection work from an installed CLI without a network or maintainer checkout. Give an owner a clear review before existing Skill files become managed files.

## Overview

This is one phase with three ordered stages. Implementation and the standard-location correction are complete. The final full suite passed 1235/1235 tests. The installed CLI completed the real cutover and an unchanged repeat. See [the central evidence](evidence.md). The owner accepted the completed phase and requested closeout and commit on 2026-09-09. The phase is closed; the authorized implementation commit is next. Keep W20 and W21 paused.

The seven names are `archive-docs`, `cleanup-docs`, `decompose-codebase`, `preflight`, `software-factory`, `human-experience`, and `naive-uat`. Keep `packages/skills` as the source workspace. Use the scope/harness standard-location matrix below; there is no private Make Docs Skill layer. This work adds no plugin product, Skill-local state engine, or automatic workflow gate.

## Standard-Layout Correction

Wrong-private-layout cutover is forward-resume-only: review must state before apply that rollback would recreate the forbidden private layer and is not offered. Ordinary adoption already using standard locations keeps normal resume/rollback. Older saved operations that would write a retired private root refuse safely; never execute them to restore that layer. This correction adds no new URL-backed installation mode.

The coordinator retained a private `.make-docs/agentics/skills/` installation layer from earlier authority. That was our error, not an owner clarification of an approved outcome. The owner reported that a prior Skill installation had already been removed for this same mistake. The correction stays within W19 R5: one phase, three stages, existing task and acceptance IDs. Earlier private-layout test results are superseded for installation acceptance. They do not prove the standard layout.

Install Skill files in standard agent locations, selected by scope and harness:

| Scope and selected harnesses | Real Skill directory | Other selected access |
| --- | --- | --- |
| Project, Claude only | `.claude/skills/<name>/` | None; do not create `.agents/skills/`. |
| Project, Codex only | `.agents/skills/<name>/` | None; do not create `.claude/skills/`. |
| Project, both | `.agents/skills/<name>/` | `.claude/skills/<name>` links to it, or is a supported managed native copy. |
| Global, any selection | `~/.agents/skills/<name>/` | Selected Codex uses `~/.codex/skills/<name>` (or `CODEX_HOME/skills`); selected Claude uses its configured native Skill root, normally `~/.claude/skills/<name>`. Native access links to the canonical directory or uses a supported copy. Direct access applies only if the configured native path equals the canonical path. |

A harness that uses the real directory reads it directly. Never create a self-link or duplicate ownership entry for that same path. `none` creates no Skill directories. Preserve pre-existing unrelated content; absence checks on fresh fixtures must prove no unselected project Skill root was created.

There is no active `.make-docs/agentics/` installation layer, in the project or home. Skill source stays solely in `packages/skills/<name>/`; compiled CLI output embeds declared bytes. Installation identity, ownership, intent and recovery belong only in the global Make Docs Store. A symbolic link to a Make Docs resource URL is unsupported and is not a feature or deferred task in this correction.

Upgrade the wrong private layout through a reviewed CLI operation. The review names every old source, new standard destination, link/copy change, backup and ownership effect. Recheck exact bytes, links, scope, selected tools and Store ownership before mutation. Verify the complete destination tree and access paths before removing clean owned old files. Preserve changed, unknown or conflicting content and stop for an explicit disposition; never infer ownership from a path. Remove the retired `.make-docs/agentics/skills` tree and its ancestors only when proven empty and managed. Success must leave no active private Skill layer or unexplained legacy content. Historical backup byte copies may remain under declared backup/archive roots; they are not active installation paths. Ordinary standard-path update, removal, scope/tool changes, resume/rollback and repeated normal setup/Skills sync must use the same standard-path rules.

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

- [D-005](../../prd/03-open-questions-and-risk-register.md#d-005-skills-delivery-diverges-from-earlier-bundled-payload-expectations): resolved by the final standard-layout delivery and real upgrade proof in the central evidence.
- Q-001: first-party bundled delivery decided; this does not claim implementation completion. Q-007 concerns explicit alternate or future remote sources, with no first-party fallback.
- Deferred obligations: `not-needed-now`; no new O ID. Formal Unassisted Goal Testing: `not-needed-now` at drafting; no activated NUAT ID or finding. Reassess against the installed candidate under current testing authority.
- [Experience promises P1–P4](evidence.md#experience-promises) preserve the design's user goals and evidence limits.

## Stage 1 - Promotion and Packaging

### Tasks

- [x] t1: Record the exact four source trees and their declared dependencies before promotion. Promote `preflight`, `software-factory`, and `human-experience` from `.agents/skills/`, and `naive-uat` from `packages/docs/template/.make-docs/agentics/skills/`, into `packages/skills/`. Preserve each declared file and binary byte hash. Do not delete the real local copies that later need reviewed adoption. Remove only the obsolete upstream UAT tree and parents proven empty after promotion. (A1, A12)
- [x] t2: Make each Skill self-contained. Give preflight its own required Store reference; remove sibling-Skill dependencies, maintainer-only PRD links, local-manifest prerequisites, and repo-only evidence claims from portable instructions. Preserve explicit invocation for preflight, software-factory, and human-experience. Keep `naive-uat` as the thin shared-CLI adapter with display name Unassisted Goal Testing. Check references, examples, and harness metadata as part of each standalone payload. (A1)
- [x] t3: Declare all seven first-party payloads in the effective registry. Read their allowlisted files directly from the sole `packages/skills/<name>/` sources and embed bytes in generated CLI build output. Package compiled output; create no separate replicated Skill tree under `packages/cli` or `packages/docs`, including ignored, temporary, or generated mirrors or `packages/cli/skills/`. Exclude caches, Finder files, test files, and authoring-only files. Embed declared binary assets without text decoding. Fail clearly on a missing or corrupt first-party bundle; never fetch or read the maintainer checkout as fallback. Preserve explicit alternate-source trust policy. Make `all` follow the effective registry; `none` and bare setup select no Skills. (A2, A3)
- [x] t4: Compare declared source byte/hash inventories with the embedded build, package archive, extracted CLI artifact, and isolated installed output. Inspect the actual disk under `packages`, not only Git-tracked paths: reject duplicate Skill source/payload trees, including ignored, temporary, or generated mirrors, and obsolete empty mirror directories. The compiled artifact is allowed; replicated Skill directories are not. Install each Skill alone from the extracted package with network and maintainer checkout unavailable. Run `all`, `none`, and missing/corrupt-bundle cases. Add focused tests for payload membership, byte hashes, standalone references, and retired UAT source absence. (A1–A3, A12)

### Acceptance criteria

- A1: Four promotions retain their declared content; each of seven Skills works without siblings. Portable instructions preserve explicit-only behavior and UAT's shared workflow boundary. [Evidence](evidence.md#a1-source-and-standalone-intent).
- A2: Compiled and packed CLI artifacts embed the declared source allowlist byte-for-byte, including binary assets. No separate replicated Skill tree exists under `packages/cli` or `packages/docs`. No cache, Finder, test, or authoring-only files leak. [Evidence](evidence.md#a2-payload-membership-and-bytes).
- A3: All seven individual offline installs succeed without a checkout; `all`, `none`, bare selection, and missing/corrupt-bundle refusal match the contract without first-party fetch. [Evidence](evidence.md#a3-offline-selection).
- A12: Actual-disk checks under `packages` include ignored, temporary, and generated paths and empty folders; duplicate Skill trees and obsolete empty mirror roots are absent. Compare source and embedded build/archive/extracted inventories with genuine installed outputs. No obsolete UAT source or unexplained empty source parents remain. Fresh, upgrade, reconfigure, repeat and removal checks enumerate actual files, links and empty directories in both scopes. No active `.make-docs/agentics` layer or newly created unselected project Skill root remains after success. [Evidence](evidence.md#a12-complete-directory-proof).

### Dependencies

- Owner acceptance of this backlog (recorded 2026-09-09); current design, plan, and PRD authority.

### Closeout Notes

- Testing: automated payload and package tests plus standalone instruction review are required. Formal UAT, visual, and accessibility checks are `not-needed-now` unless a concrete surface need emerges.
- Evidence: [A1–A3 and A12](evidence.md#acceptance-results) retain source, offline and final package proof with each tested identity and limit.
- Phase / capability status: source promotion, final package parity and standard-layout proof are complete and owner-accepted.

## Stage 2 - Installation and Adoption

### Tasks

- [x] t5: Add `--adopt-existing <csv>` and digest-bound `--review <digest>` only to `setup skills`. Adoption names must be a subset of selected first-party registry names. Reject review without adoption, adoption with removal, and invalid or unselected names. Keep target, scope, tool, and output conventions of the current command. Present exact file effects, backups, ownership changes, blockers, and digest in dry-run and interactive review. Dry-run creates no Store intent, backup, directory, or marker. Noninteractive adoption requires the matching review digest; `--yes` alone is insufficient. (A5, A6)
- [x] t6: Build the complete adoption inventory and bind its review digest to target/scope, selected tools and Skills, registry and package/source identities, source and destination hashes, link states, and current ownership. Allow reviewed known-file differences and missing declared files. Block unknown extras, unsafe links, conflicting native copies, and another recorded owner. Do not infer ownership from names. Recheck all facts under the existing operation lock before any mutation. (A5, A7, A8)
- [x] t7: Use the existing global Store operation, journal, backup references, and recovery boundary for adoption. Record intent before file or ownership writes. Back up existing changed bytes before replacement. Record ownership even when all file bytes already match; do not take a file-no-op shortcut. Required Store failure stops managed writes. Keep pending operations recoverable and block competing writes; no local plan, receipt, queue, lock, or fallback state. (A5, A9, A10)
- [x] t8: Implement the exact project/global and selected-harness matrix above. Project Claude-only uses direct `.claude/skills` with no new `.agents/skills`; Codex-only uses direct `.agents/skills` with no new `.claude/skills`; both use `.agents/skills` plus Claude link/copy. Global uses `~/.agents/skills` plus selected native access. Never make a self-link. Migrate proved old private-layout ownership through reviewed CLI intent, byte-preserving backups, final-tree verification and safe empty-parent removal. Block changed/unknown old content; do not report success with unexplained active legacy paths. Upgrade proven first-party legacy source records to bundled sources without fetch. Keep edited managed content as conflicts and third-party same-name content outside automatic first-party ownership. Make adopted payload update, isolated removal, and repeat use the normal lifecycle. (A4, A11)
- [x] t9: Add focused adoption tests for every refusal and digest dimension, ownership-only registration, Store errors, concurrent mutation, pending operation interruption, resume, rollback, and recovery drift. Verify preserved bytes, backups, final ownership, and no false completion, not just exit codes. (A5–A10)

### Acceptance criteria

- A4: Project and isolated-global installs support Codex and Claude, selected separately and together, with symlink and copy-mirror paths. The standard scope/harness paths above are exact; canonical native paths are direct directories. User content remains safe and unselected project Skill roots are not created. [Evidence](evidence.md#a4-scope-and-harness-exposure).
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
- Evidence: [A4–A11](evidence.md#acceptance-results) record actual isolated and live results. A10 now passes five fresh CLI/MCP cases in extracted and installed forms. Keep Store operation payloads in the Store; retain only bounded review evidence here.
- Phase / capability status: Standard-layout implementation and migration/recovery proof are complete. Prior private-layout success is superseded.

## Stage 3 - Tests and Maintainer Proof

### Tasks

Complete t13 content and help changes before the final t10 candidate checks, t11 review, and t12 real adoption. If later edits change that candidate, rerun affected checks and bind review/adoption evidence to the final package. The task IDs are stable tracking IDs, not permission to test stale output.

- [x] t10: Run the complete finite A1–A12 matrix against the final source and installed package. Add regression coverage for old source records and wrong-private-layout upgrades, project single-harness direct locations, tool/scope transitions, single-Skill installation, isolated global scope, edited-content preservation, adoption/update/removal/repeat, and file/empty-directory inventories. Run appropriate type, runtime, package, defaults, and authority checks after integration. Retain build identity and actual results; rerun only checks affected by later fixes. (A1–A12)
- [x] t11: Obtain an independent material code review of adoption, ownership, recovery, and payload delivery. Obtain a fresh-context agent review using installed public CLI output and standalone Skill payloads, without maintainer checkout or prior task memory. Retain prompt, actions, outputs, findings, corrections, reviewer identity, and actual tool limits. Check clear review effects and explicit-only behavior; do not call scripted review lived human evidence. (A13; P1–P4)
- [x] t12: After isolated package proof passes, run the normal `just install-cli` recipe. Use the public installed CLI to review the current real installation, including the wrong private layer, and migrate/adopt the exact reviewed selection into the standard locations. Verify absence of active legacy trees and no unselected project Skill roots before declaring completion. Preserve local edits with the declared review/backups. Verify payload bytes, native exposures, Store ownership, no pending recovery, and repeat no-op. Do not hand-copy or hand-delete local copies, or test removal against real installations. (A14)
- [x] t13: Update affected current Skill/system guidance, help, package/release guidance, and project guides from their correct upstream or project owners. Add concise source-rule guidance to package authoring instructions and package README/release text: only `packages/skills/<name>/` is source; the build embeds declared bytes directly; no separate Skill mirrors under `packages/cli` or `packages/docs`, even ignored or temporary ones. This instruction update is an implementation task, not part of package drafting. Use installed CLI setup to refresh dogfood system assets. Record coverage verdicts `create`, `update-existing`, `link-only`, or `none` and effective Persona targets. Check that no active text adds local state, a first-party remote fallback, sibling dependence, or automatic explicit-only Skill activation. (A1, A6, A13, A14)
- [x] t14: Complete the central acceptance and experience report with the actual A1–A14 results and P1–P4 conclusions, including failures, fixes, build identity, retained evidence, and reviewer limits. Resolve D-005 only when delivery and lifecycle evidence supports closure. Present the phase for owner acceptance; record any remaining scope or review limits. Keep phase closeout, commit, publication, and W20/W21 resumption gated by explicit authority. (A1–A14)

### Acceptance criteria

- A13: Independent code and fresh-context reviews find no unresolved material defect. The report names the actual commands/tools, tested build, human goals, observations, and limits. [Evidence](evidence.md#a13-independent-and-fresh-context-review).
- A14: The rebuilt installed CLI performs the real maintainer review and adoption. Read-back proves payloads, exposures, Store ownership and ready status; repeat is a true no-op. [Evidence](evidence.md#a14-real-maintainer-adoption).
- All A1–A14 cases have actual evidence or an owner-reviewed, bounded disposition. No unrun case is marked passed.
- P1–P4 have clear observations and limits. Owner phase acceptance remains separate from automated success and reviewer completion.

### Dependencies

- Stages 1 and 2 complete; isolated safety and package proof before real adoption.

### Closeout Notes

- Testing modes: automated tests, package/offline integration, independent code review, and fresh-context CLI/Skill review are required. Formal UAT remains `not-needed-now` unless current authority identifies a material uncertainty in the candidate. No NUAT result is implied. Visual/accessibility checks remain `not-needed-now` absent a specific need.
- Coverage decisions: system and affected existing guide updates are complete (`update-existing`); exact targets and CLI projection proof are in the central report. No new guide was needed. Test and experience coverage require actual observations in [the central report](evidence.md).
- Phase / capability status: implementation complete; final standard-layout proof is recorded in the central evidence. The owner accepted the phase on 2026-09-09. Closeout is complete; the requested implementation commit is next. W20/W21 remain paused.
