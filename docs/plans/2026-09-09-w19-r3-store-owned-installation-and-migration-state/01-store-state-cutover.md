---
title: "W19 R3 P1 — Store State Cutover"
kind: "plan"
status: "active"
coordinate: "W19 R3 P1"
source:
  type: "design"
  path: "docs/designs/2026-09-09-store-owned-installation-and-migration-state.md"
---

# W19 R3 P1 — Store State Cutover

## Objective

Deliver the complete Store-owned installation and migration boundary in one implementation phase. The user sees a reviewed transfer, no recreated local state, and one safe CLI path for status and recovery. This plan supplies the phase shape; the resulting [work backlog](../../work/2026-09-09-w19-r3-store-owned-installation-and-migration-state/01-store-state-cutover.md) supplies executable tasks after current PRD maintenance.

## Entry Gate

The user accepted the W19 R3 package and work backlog on 2026-09-09. The backlog review gate is satisfied. The current request is a package commit followed by an implementation plan. Implementation has not started. This acceptance record does not authorize a live transfer. Before implementation begins, record current branch, HEAD, dirty paths, installed CLI identity, Store location and health, and the intended file scope. Do not switch branch or worktree without explicit user permission. Preserve all existing user work.

## Source Authority

The accepted [design decisions D1-D9](../../designs/2026-09-09-store-owned-installation-and-migration-state.md#decision) and [overview owner matrix](00-overview.md#candidate-decision-matrix) define the scope. Runtime work must cite the maintained PRDs: [38](../../prd/38-global-store-and-project-state.md), [05](../../prd/05-installation-profile-and-manifest-lifecycle.md), [18](../../prd/18-compatibility-classification-and-migration-safety.md), [39](../../prd/39-cli-command-model-and-operation-registry.md), [24](../../prd/24-project-configuration-and-convention-overlay.md), and the bounded topology/router/resource owners. Old local-state instructions are historical evidence only.

## Scope

Include all supported installation, update, migration, resource, conflict, removal, and recovery paths that read or write operational installation state. Include Store schema/operation separation, project and checkout identity, root validation, safe bootstrap, writer locks, operational manifest removal, verified legacy transfer, compatibility, and shipped guidance. Reuse Store infrastructure and operation registry patterns.

Do not add a generic event service, distributed sync, Phase runner, new backup content layout, new archive system, or a second PRD namespace. Keep project knowledge and file-copy backups under their current content rules. Do not make personal memory editing a release dependency.

## Stage 1 — Store Foundation

Map every live state reader and writer, including manifest consumers, migration helpers, update/setup/remove, resource projections, conflicts, and registry/MCP callers. Classify each field as declarative project knowledge, file content, or operational state. Give each retained operational record one Store owner.

Implement the smallest Store schema change for the installation ledger, checkout bindings, pending operations, and transfer provenance. Keep Store schema migrations in their existing transactional journal. Prepare the Store before the first project write. Use an external Store bootstrap lock that works before tables or project identity exist. Validate roots and derived paths through canonical path/symlink checks. Define writer ownership and conservative stale-lock recovery.

Define missing Store, moved directory, clone, duplicate identity, unavailable Store, and unknown schema results. A missing Store plus existing installed files is not proof of a fresh installation. Require reviewed baseline establishment or valid recovery evidence.

Stage exit: Tests prove Store preparation precedes all project mutation, and no Store path resolves inside a target/registered checkout. No project-local lock or progress file is needed.

## Stage 2 — Writer and Manifest Cutover

Route all mapped callers through the Store service. Move applied-file ownership, versions, hashes, migration state, live conflict decisions, and recovery metadata out of the project. Keep only declarative project ID/settings in configuration. Remove local receipt projection and checkpoint-9-only bootstrap assumptions. Do not silently reconstruct an authoritative ledger from visible files.

Implement the pending-operation protocol across Store commits and file changes. Save intent and verified backup inventory before destructive changes. Recheck file expectations before each write. Commit final ledger and receipt together. Resume and rollback must retain unknown user changes and unrelated project Store rows.

Add the registered public surface from D8: `make-docs project state status [--json]` and `make-docs project state recover <operation-id> --resume|--rollback [--dry-run] [--json]`. Status is read-only. Recovery modes are exclusive. Dry-run shows scope without mutation. Apply checks current checkout ownership and revalidates scope under locks. CLI and MCP use the same core and typed results. Existing setup preview/apply remains the transfer entry point.

Stage exit: Supported operations use Store authority; failures stop without local fallback; status and recovery work against controlled interrupted fixtures.

## Stage 3 — Legacy Transfer and Compatible Writers

Recognize supported local manifest and migration record shapes only. Inventory and verify source hashes, project identity, operation/snapshot links, and live writer state. Import useful completed records without replaying operations. Preserve incomplete recovery evidence. Commit and read back before allowlisted deletion. Remove `.make-docs/state/` only when empty. Retry after commit/deletion interruption without duplicate effects.

Unknown, altered, invalid, symlinked, or actively written records block their cleanup. Keep them in place with a typed explanation. Local snapshot payloads remain file copies; their active recovery scope and integrity metadata are Store-owned. No importer consumes the deleted Phase runner's arbitrary state as current product state.

Retire the local legacy stop marker. Enforce compatible writer rules through Store checks. Use declarative configuration-format rejection only where the actual prior parser proves rejection before writing. The corrected CLI becomes the minimum supported writer after transfer. Probe the actual prior packaged CLI against an isolated transitioned fixture and document its limits. Known active old writers block transfer. Do not retain local markers, dual writes, or claim backward writer support for obsolete binaries.

Stage exit: Verified legacy records transfer safely once, corrected writers enforce their minimum version and known active old writers block transfer, and unknown data remains intact.

## Stage 4 — Verification, Shipped Guidance, and Dogfood

Replace tests that require or omit local operational state. Inspect full fixture trees. Correct shipped rules upstream in `packages/docs/template/`, including runtime-state, manifest, path-hygiene, routing, recovery, and package expectation text. Add bounded supersession links to active historical entry points. Do not rewrite completed evidence. Repair the existing risk-list test so it validates the live register rather than a fixed D-030 ceiling.

Make the optional capture rule explicit in shipped agent guidance. If the CLI is unavailable, ordinary project work continues with a clear capture-unavailable notice. The same applies when optional capture fails with the CLI present. Neither case permits direct Store writes, local fallback state, queued writes, or a false success claim. Project documents, history, and optional work backlog updates remain valid. Required Store recording for CLI-managed changes remains mandatory under PRD 38 R-PS-8 and R-TEST-7.

Build the CLI and verify the actual package contents. Use isolated fixture projects and Store roots for destructive/failure tests. After package proof passes and the accepted implementation scope permits the concrete reviewed transfer, run the corrected CLI against the dogfood instance. Save its preview, exact applied scope, read-back, and later-update evidence. Do not use source tests as proof of the installed binary. Do not manually delete receipts to simulate successful migration.

### Verification Set

| ID | Required evidence | Pass condition |
| --- | --- | --- |
| V1 — Storage boundary | Fresh setup, update, repeat setup, resource, conflict, removal and retry full-tree inventories | No project-local operational state or manifest is created. Local knowledge/content remains as contracted. |
| V2 — Store failure and roots | Missing, read-only, damaged, unknown/newer schema; override/symlink/project-root fixtures | Typed stop before project mutation where required; no local fallback or silent schema replacement. |
| V3 — Identity and writers | Pre-identity setup race, concurrent same-checkout writers, separate checkouts, move, clone, ambiguous binding, stale writer | No cross-checkout overwrite; no silent provenance reconstruction; live or unproven writer blocks mutation. |
| V4 — Crash recovery | Faults before/after backup, file replacement, per-step journal update, final commit, transfer commit and source deletion | Resume/rollback is bounded and repeatable; unknown user changes and unrelated Store rows survive. |
| V5 — Legacy and compatibility | Completed/incomplete/invalid/unknown records, snapshots, active old writer, prior supported package | Useful records import once; unknown files survive; cleanup follows read-back; corrected writers reject incompatible Store state; prior-package limits are documented; known active old writers block transfer. |
| V6 — Public experience | Packaged CLI plain/JSON status and dry-run/apply recovery transcripts | States and next action are distinct; no SQL or hidden repair required; modes and checkout ownership enforced. |
| V7 — Guidance and package | Upstream search, generated defaults, package smoke, relevant documentation and runtime suites; missing CLI and failed optional capture cases paired with required Store failure | Active instructions and shipped output match Store ownership; no test ignores prohibited state. Ordinary work continues with an accurate unavailable notice when optional capture is unavailable; no direct Store write, local fallback, queued write, or false success. Required Store failure still stops managed changes safely. Baseline defects are explicitly resolved or reported. |
| V8 — Dogfood and Human Experience Review | Reviewed transfer, file inventory, Store read-back, repeat update; HX-1 through HX-4 review | Local state stays absent, retained content is intact, and each promise has evidence, observation, conclusion, reviewer and limits. |

Use focused automated tests for safety and recovery. Broaden only for affected shared callers or unresolved failures. Functional pass, system-resource coverage, manual-test selection, and Unassisted Goal Testing selection remain separate decisions. Reuse suitable evidence in Human Experience Review.

Stage exit: V1-V8 pass, or a material finding holds the phase open. A passing test count alone is not the exit.

## Stage 5 — Acceptance and Closeout

Reconcile PRD status, D-031, guides/system coverage, history, links, and the work summary against actual evidence. Record what changed, what users see, tested limits, and pending actions. Do not close D-031 from documentation alone. Complete the applicable coverage-pass work. Report any unresolved compatibility or recovery case as a blocker with owner and next step.

Keep implementation acceptance, commit, publication, and W20 resumption explicit under their applicable user authority. Drafting has authorized none of those actions. Once the interrupt is accepted complete, record that W20 may resume from its existing next gate. Do not start W20 work as a side effect of this phase.

## Acceptance Criteria

- All retained tool-state categories have one Store owner and no local live copy.
- Store preparation, locks, identity, and recovery work before and after project identity exists.
- The local operational manifest is safely retired with useful provenance retained.
- Supported legacy records transfer with verified read-back and narrow deletion.
- Normal and failure paths do not recreate `.make-docs/state/` or another operational substitute.
- Ordinary project work continues when the CLI is unavailable or optional capture fails. Required Store recording for CLI-managed changes remains mandatory.
- Public status/recovery and compatible writer behavior match current PRDs.
- Upstream instructions, tests, packaged CLI, and the dogfood result agree.
- HX-1 through HX-4 have real reviewed evidence and stated reviewer limits.
- D-031 closes only after its runtime exit evidence is accepted.
- W20 R0 remains paused until accepted interrupt completion; its prior progress and next gate remain intact.

## Failure and Scope Rules

Keep P1 open when a required check fails. Repair the bounded defect within the accepted scope. If a new product choice is needed, bring that concrete choice to the user. Do not solve it by restoring local operational state, adding an unreviewed phase, or weakening absence checks. No deferred obligation may conceal an incomplete global-only state boundary.
