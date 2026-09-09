---
title: "Project Assets and Persona Discovery: Phase 1"
kind: "work"
status: "completed"
coordinate: "W19 R4 P1"
source:
  type: "prd"
  path: "docs/prd/22-project-documentation-asset-model.md"
---

# Phase 1: Assets and Persona Cutover

## Purpose

Make shared and audience assets easy to find, keep fresh directories small, and move the reviewed legacy content through one verified Store-backed workflow. Preserve all substantive project content and historical evidence.

## Overview

This is one implementation phase with three ordered stages and twelve acceptance cases. It depends on R3 commit `dabd0b36`. Implementation started after owner acceptance of package `532b29cf`. The owner then found missed current Persona names after the first verification pass. The affected audit, source, test and package tasks were reopened. Their correction and verification are now complete. The owner accepted the corrected phase on 2026-09-09 and authorized closeout and commit.

Shared project material belongs in `docs/assets/project/**`. Audience assets belong in `docs/assets/<persona-slug>/**`. Adopted archive/provenance and retired Playbooks belong under `.make-docs/archive/**`. Config is local declarative knowledge; installation and migration intent, locks, receipts, and completion state belong only in the global Store.

## Source PRD Docs

- [22 Project Documentation Asset Model](../../prd/22-project-documentation-asset-model.md#shared-project-inputs-and-persona-assets): shared/audience paths and [reviewed migration](../../prd/22-project-documentation-asset-model.md#reviewed-layout-migration).
- [47 Persona Model](../../prd/47-persona-model.md#persona-schema): two fixed primitives/defaults, custom entries, and audience versus actor boundaries.
- [24 Project Configuration](../../prd/24-project-configuration-and-convention-overlay.md#effective-persona-discovery): effective defaults, config merge and discovery without Store access.
- [39 Command Model](../../prd/39-cli-command-model-and-operation-registry.md#persona-and-layout-commands-r-layout): R-LAYOUT-1 through R-LAYOUT-7 and exact command grammar.
- [25 Runtime Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md#asset-and-config-boundaries): shared TypeScript/CLI/MCP behavior.
- [18 Migration Safety](../../prd/18-compatibility-classification-and-migration-safety.md#reviewed-project-layout-recovery): R-ASSET-MIG-1 through R-ASSET-MIG-6.
- [38 Global Store](../../prd/38-global-store-and-project-state.md#transfer-and-recovery-r-xfer): R3 journal, identity, required state capture, pending work and recovery.
- [15 Agent Instructions](../../prd/15-agent-instruction-ownership-and-managed-blocks.md#discovery-without-the-cli): R-ASSET-ROUTER-1 through R-ASSET-ROUTER-3 and configured filename declaration.
- [17 Materialization](../../prd/17-system-asset-materialization-and-local-bootstrap.md#cli-free-asset-discovery) and [21 Tool Directory](../../prd/21-project-tool-directory-and-resource-tiers.md#project-asset-discovery-and-recovery): on-demand creation and retained compatibility selector.
- [06 Template Assets](../../prd/06-template-contracts-and-generated-assets.md#asset-layout-delivery-proof), [09 Dogfood](../../prd/09-dogfood-and-maintainer-operations.md#asset-recovery-and-dogfood-proof), and [10 Package Acceptance](../../prd/10-packaging-validation-and-release-reference.md#asset-layout-package-acceptance): source/build/tar/filesystem and public installed CLI proof.
- [23 Metadata](../../prd/23-generated-document-metadata-and-lifecycle-handoffs.md#persona-metadata-and-reviewed-moves): explicit metadata and mechanical link repair.
- [46 Unassisted Goal Testing](../../prd/46-naive-end-user-acceptance-testing.md#r-nuat-scope-qualified-tester-and-installed-product) and [49 Human Experience](../../prd/49-human-experience-standard-and-intent.md): separate audience, actor, qualified tester and human-effect review.
- The related current-owner summaries in PRDs 01, 02, 05, 07, 14, 16 and 45 also constrain path, routing, packaging and history consistency. Their exact maintenance scope is in the [plan owner table](../../plans/2026-09-09-w19-r4-project-assets-and-persona-discovery/00-overview.md#existing-prds-to-update).

## Source Obligations, Scenarios, And Findings

- Finding: D-032 in the [living risk register](../../prd/03-open-questions-and-risk-register.md).
- Applicable new `O-###`: none. Do not invent an obligation for completed scope or a `not-needed-now` test decision.
- Activated `NUAT-###`: none. Use the existing qualification and scenario process if later owner-approved testing requires one.
- Experience promises: EP1–EP5 in the [design intent](../../designs/2026-09-09-project-assets-and-persona-discovery.md#human-experience-intent). Every promise has named cases and closing evidence below.

## Stage 1 - Effective Audiences and Discoverable Asset Paths

### Tasks

- [x] t1: Read the final current owners and capture the implementation baseline. Inventory all active path/default claims across PRDs, system resource bodies, template routers, router generation, CLI/core helpers, maintainer build-copy scripts, package declarations, and pipeline tests. Separate active instructions from explicitly historical/archive/backup byte copies. Record exact affected paths and close each active contradiction within this phase.
- [x] t2: Implement one effective Persona resolver. Keep built-in `user -> user` and `maintainer -> maintainer` mappings fixed; merge config by slug; inherit omitted built-in display fields; require all four fields for custom entries. Keep absent, empty, and comment-only config defaults. Reject wrong-type/null values, duplicate/unsafe/reserved slugs, unsupported primitives, and changed fixed mappings without rewriting config. Add `project.persona.list` through the current registry, with `--target-root`/`--json`, no Store dependency, and no identity/directory writes.
- [x] t3: Author short discovery rules upstream. Always-present documentation routers name shared and audience paths, both defaults, config override location, and only the selected filenames in `Asset router files:`. Use reviewed harness selection, never agent identity or raw Store state. Keep the assets root router short; move detailed testing/migration policy into its system resources. Repair obsolete active target guidance in all t1 surfaces, not just the assets router.
- [x] t4: Make the assets root on demand across catalog/planner/setup/reconfigure/surface ensure and build-copy behavior. Create configured root routers only, with no empty child families. Preserve the artifacts compatibility selector as an assets-root ensure plus a reported `docs/assets/project/` destination that is not yet created. Make help/results distinguish those facts. Preserve current required `.make-docs/system/` router directories and project content.

### Acceptance criteria

- A1–A4 and A6 prove effective defaults, invalid-input behavior, Store-independent discovery, and exact selected router filenames.
- A no-CLI agent can use an initialized/cloned project's public bootstrap routers and config to author its first shared/Persona assets and short root instructions. Missing/invalid filename declarations require an explicit project choice before router creation. No local migration state is created.
- Built-in labels/descriptions describe people or agents using or maintaining the consumer project. Tester qualification and affected-human meaning stay separate.
- Fresh/general surface creation creates no empty `project`, Persona, testing, archive, Library, artifact or Playbook children. The artifacts alias creates no old path and makes no false created-destination claim.
- All changed product defaults originate upstream. No installed dogfood source is hand-edited to define shipped policy.

### Dependencies

- Backlog acceptance and implementation authorization.
- Current PRDs 22, 24, 47, 15, 17, 21, 25 and 39.
- R3 Store and project identity boundary remains intact.

### Closeout Notes

- Evidence: A1–A4/A6 implementation and A4 fresh-context output are recorded in [the evidence report](./evidence.md#a4-first-asset-work-without-the-cli).
- Testing decisions: targeted automated tests and fresh-context agent discovery are required. Formal Unassisted Goal Testing is `not-needed-now` for this bounded agent check; no qualified-human test is claimed.
- Phase/capability status: implemented and observed; the Persona-name correction and final current-guide audit passed; renewed owner phase acceptance is recorded on 2026-09-09.

## Stage 2 - Reviewed Layout Preview, Application, and Manual Read-Back

### Tasks

- [x] t5: Implement `project.layout.preview` with a complete file and empty-directory inventory, source provenance/byte identities, exact destination/action map, planned mechanical link repairs, explicit blockers and a review digest. Support repeated bounded `--map <source>=<destination>` choices. Bind relevant config-derived audience mappings into the digest. Prove preview makes no Store or project writes.
- [x] t6: Implement `project.layout.prepare --review <digest> --mode cli|manual`. Recompute and match the reviewed facts before saving full intent and recovery references in the R3 Store. Return the operation ID and exact next action. Release the live process lock before exit; keep the pending operation as the conflicting-write barrier. Required Store failures stop before project mutation, with no local plan/receipt fallback.
- [x] t7: Implement `project.layout.apply <operation-id>` for prepared CLI mode. Use the existing journal, checkout binding and locking for all moves, source removals and link repairs. Verify destination bytes before removing exact sources. Distinguish complete, pending, blocked and already-complete results without false success.
- [x] t8: Implement `project.layout.verify <operation-id>` for prepared manual mode. Give human/agent movers exact instructions only after Store preparation. Read back the recorded source/destination/link expectations, including newly added sources and leftovers, before recording completion. Reject wrong bytes, missing links, unexpected entries and target-name-only claims. Reuse `project state status` and `project state recover`; add no second state engine.
- [x] t9: Cover every finite legacy cohort with a reviewed disposition: empty old system directories/parents; supported old system bodies; empty obsolete template asset families; both artifact paths into `docs/assets/project/`; adopted archive facets into `.make-docs/archive/`; verified Library audiences into configured paths; and retired Playbooks into `.make-docs/archive/legacy-playbooks/` as inactive history. Map former default `developer` to `maintainer` only with proof. Require explicit decisions for custom/default conflicts and any `agent` audience. Never delete content to resolve an audience ambiguity.
- [x] t10: Apply one shared safety and completion contract to CLI and manual paths. Preserve substantive historical facts and project ownership; record only exact mechanical old/new link repairs. Recheck empty directories before pruning, reject escapes and conflicting destinations, and distinguish verified identical targets from unknown copies. Permit only named non-active archive/backup exclusions; active legacy directories cannot hide behind a retained exception.
- [x] t11: Wire CLI/MCP registry parity, human help and JSON output for all five operations. Check normal permission boundaries and pending implementation metadata. Add finite failure tests for stale review digests, unavailable Store, live/concurrent writers, interrupted files, changed targets, invalid map paths, ambiguous audiences and manual false-completion attempts.

### Acceptance criteria

- A7–A11 cover all operation modes and safety paths. Preparation is visibly distinct from read-only preview and does not hold a stale live process lock after it exits.
- CLI and MCP consume the same handlers and result semantics. Both mutation paths use recorded source/target/link expectations and the same R3 Store recovery path.
- User-owned or modified content can move only through its explicit reviewed map; moving it does not change its ownership to Make Docs.
- No unexplained active source file or directory remains in a completed map. No destination name, successful shell exit, missing source alone, or historical path string proves provenance or completion.
- All CLI-owned migration state is in Store. Ordinary asset authoring without the CLI continues to work, while unreviewed legacy cleanup remains prohibited.

### Dependencies

- Stage 1 audience/config resolution and canonical paths.
- Current PRDs 18, 22, 23, 25, 38 and 39.
- Exact reviewed source inventory and explicit resolution of material new destination choices before mutation.

### Closeout Notes

- Evidence: reviewed Store preparation, CLI/manual failure checks and real dogfood read-back are summarized in [the evidence report](./evidence.md#real-dogfood-migration). The complete operational record remains in Store.
- Testing decisions: automated integration and failure tests are required. These prove contract behavior, not the owner's lived review experience.
- Phase/capability status: implemented; the real migration completed with 1,418 independent path checks and no errors. Owner phase acceptance is recorded on 2026-09-09.

## Stage 3 - Package, Installed CLI, Dogfood, and Final Review

### Tasks

- [x] t12: Finish the complete finite A1–A12 matrix below. Use focused unit/integration tests for shared Persona and migration behavior, then run the required full suite once after corrections. Repeat checks only for relevant changes, failures or unresolved concerns. Keep check output tied to the actual tested build. Repair the known defaults baseline failure at `tests/consistency.test.ts:669`: it expects exactly D-001 through D-031 and rejects the valid new D-032 entry. Make that check append-safe while preserving existing-record, duplicate-ID and link checks; do not merely raise its numeric ceiling.
- [x] t13: Build/package from upstream source and inspect the build copier output, packed tar entries and extracted filesystem. Run fresh installs for the supported configured harness sets, upgrade fixtures and unchanged repeats. Compare real directory inventories, including empty directories. Check all active PRD/system/template/CLI/build/pipeline references against the accepted target map and account for exclusions.
- [x] t14: Refresh the installed CLI with the documented maintainer recipe before dogfood. Use public `make-docs` persona/layout/setup commands for the exact refreshed dogfood inventory. Review the map within the accepted scope, resolve material new choices, prepare in Store, then apply or use prepared manual moves and CLI verification. Do not replace this path with `node dist` commands or a one-off cleanup script.
- [x] t15: Complete the dogfood source/destination/link and full-directory checks. Account for all real archive, Library and Playbook files; use the refreshed inventory rather than assuming the earlier 540/24/3 counts. Confirm old empty system/template/asset trees are gone from active targets, actual payloads are preserved at reviewed destinations, the aliases do not recreate old paths, and repeat operations make no further changes.
- [x] t16: Review EP1–EP5 against named observations and evidence. Report `satisfied`, `material gap`, or `insufficient evidence` per promise, with reviewer limits. Record the exact release/build and CLI recipe, update D-032 only within the evidence, and preserve R3 closure/W20-W21 pause. Prepare the phase acceptance handoff with no unexplained active leftovers; do not claim completion from package drafting or green tests alone. Completing this task records the implementation review and handoff, not the owner's acceptance of the phase.

### Acceptance criteria

- Every applicable A1–A12 row has linked evidence and a clear result. Each failure has been fixed or remains an explicit blocker; an unexplained legacy leftover prevents completion.
- The actual source template, build copy, tar, fresh install, upgrade, repeat and dogfood directory trees agree. Empty directories are checked independently from Git status and file lists.
- The fresh-context agent check starts without task memory, assets directory, CLI or optional projected bodies, but with Make Docs bootstrap routers. It finds default/configured audiences and selected filenames from the project itself.
- The installed CLI is refreshed before the dogfood run. User-facing instructions use the public CLI and distinguish ensured roots, uncreated destinations, preview, preparation, pending work and completion.
- Historical content and declared non-active archive/backup copies are preserved. Mechanical link changes have an exact record. No active obsolete path/default guidance remains without an explicit current compatibility role.
- Human Experience Review reports per-promise evidence and limits. Phase acceptance remains separate from implementation completion and publication.

### Dependencies

- Stages 1 and 2 with focused tests passing.
- Upstream package build and current installed CLI.
- Reviewable refreshed dogfood map, Store availability, and preserved recovery evidence.

### Closeout Notes

- Evidence: [the evidence report](./evidence.md) records A4 outputs, full-tree observations, the exact seven-map dogfood disposition, verified repeats and EP1–EP5 observations. Corrected package/check reconciliation passed: 71 test files and 1,087 tests; final defaults passed 50/50; the corrected tar hash, smoke proof and eight-guide audit are in the report.
- Testing decisions: automated checks and fresh-context agent discovery required; guided owner review of the visible tree/results required for acceptance. Separate accessibility/visual testing is `not-needed-now` because this scope changes text/file/CLI surfaces without a new visual interface; reassess if implementation adds one. Formal Unassisted Goal Testing remains a separate PRD 46 decision.
- Phase/capability status: dogfood migration and final checks completed; owner phase acceptance is recorded on 2026-09-09. No implementation commit or publication is claimed here.

## Package Draft Validation

The 2026-09-09 package checks passed: 39 current PRDs with no authority diagnostics; 145 new or changed relative links across 32 documents with no errors; five valid package metadata/source/follow-on records; and one phase with three stages, 16 unchecked tasks, 12 acceptance cases and five experience promises. The whitespace check passed. These checks validate the draft package, not implementation.

The defaults baseline returned exit code 1 with 48 of 49 tests passing. Its sole failure is the exact D-001 through D-031 list at `tests/consistency.test.ts:669`, which excludes the valid new D-032 entry. Task t12 owns the append-safe repair. This known test maintenance item remains open; no runtime or test files changed during package drafting.

## Acceptance Cases and Evidence Map

| Case | Required result | Task owners | Evidence that closes the case |
| --- | --- | --- | --- |
| A1 Defaults/merge | Both fixed defaults survive absent/empty/comment-only config; display overrides and valid custom entries merge by slug without file writes. | t2, t12 | Resolver/CLI fixtures and before/after config equality. |
| A2 Invalid config | Null/wrong types, duplicate/unsafe/reserved slugs, invalid primitives and fixed-mapping changes fail clearly without data loss. | t2, t9, t12 | Finite error cases, unchanged config/content proof and explicit legacy custom-name disposition. |
| A3 Store-independent query | Effective Persona discovery works with the Store unavailable and before assets exist. | t2, t11, t12 | CLI/MCP output parity and no Store/project write observation. |
| A4 Fresh-context discovery | Agent with only public bootstrap routers/config can create first shared/audience assets and declared root instructions without CLI, optional bodies or memory. | t3, t12, t16 | Retained prompt/context boundary, action transcript, resulting file tree and reviewer limits. |
| A5 Full delivery tree | Source/build copier/tar/extraction/fresh/upgrade/repeat/dogfood omit obsolete empty families and retain required system routers. | t1, t4, t13, t15 | File and directory inventories, including empty dirs, tied to exact package. |
| A6 Surface/alias behavior | Ensure creates root/selected routers only, preserves content, repeats unchanged; artifacts alias reports but does not create project child. | t4, t11, t13 | Fresh/reconfigure/dogfood/no-CLI declaration checks plus honest help/JSON result tests. |
| A7 Preview/prepare | Preview has no writes; prepare rechecks digest, stores full intent, releases live lock, and leaves pending write barrier. | t5, t6, t11 | Before/after Store/project snapshots, prepared operation read-back, second-process exclusion. |
| A8 CLI migration | All finite cohorts use exact maps; ambiguous audiences/collisions block; bytes/links prove completion. | t7, t9, t10, t11 | Cohort fixtures, source/destination hashes, exact link map and blocked cases. |
| A9 Manual migration | Inventory/preparation precede moves; actual recorded expectations, not path names, govern completion. | t6, t8, t10, t11 | Correct manual move and wrong-byte/missing-link/new-source/leftover verification cases. |
| A10 Interruption/drift | Fail before mutation, mid-files and before completion; pending work remains visible and safe recovery preserves changed content. | t6–t8, t11 | Three injected failure points, concurrency/Store refusal, status and resume/rollback results. |
| A11 Retention/repeat | Historical substance and provenance survive; only recorded link repairs differ; retired Playbooks stay inactive and repeated operations do not recreate old paths. | t9, t10, t15 | Historical byte checks, non-active exclusion list, repeat inventories and operation results. |
| A12 Dogfood review | Public refreshed CLI completes the exact real map with every active source/directory accounted for and EP1–EP5 reviewed. | t14–t16 | Installed version, reviewed/prepared map, verification result, full tree/link checks and per-promise review. |

## Completion Gate

The owner accepted this backlog and authorized implementation after package commit `532b29cf`. That initial gate is satisfied.

Checked implementation tasks record completed work and evidence. They do not record owner phase acceptance. The [actual case results and experience review](./evidence.md#a1a12-actual-results) support the final handoff. The prior build passed 70 test files and 1,077 tests with no runner errors. Owner review then found missed current Persona names in guide resources and related contracts. Tasks t1, t3, t12, t13, t14 and t16 were reopened. The correction, regressions, package and installed refreshes, and review now pass. The corrected build passed 1,087 tests in 71 files. The final audit covers all 19 current audience guides, with eight corrected. Defaults pass 50/50 and final authority, path and layout checks pass. The prior results remain evidence for the earlier build only. All technical tasks are complete. The owner explicitly accepted the corrected implementation and requested closeout and commit on 2026-09-09.

The owner accepted the corrected phase and authorized closeout and commit on 2026-09-09. This record closes W19 R4 P1. The commit remains a separate authorized action; no commit hash is invented here. W20 R0 and W21 R0 remain paused until separate resume instructions. A successful test or command alone did not advance acceptance.

Closeout: [W19 R4 P1 history](../../../.make-docs/archive/history/2026-09-09-w19-r4-p1-project-assets-and-persona-discovery.md). The package remains in place; no archive move was requested.
