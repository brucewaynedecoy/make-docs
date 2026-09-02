---
title: "W19 R1 Phase 3: Lifecycle, Migration, And Data-Safety Authority"
kind: "plan"
status: "draft"
coordinate: "W19 R1 P3"
source:
  type: "design"
  path: "docs/designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md"
---

# Phase 3: Lifecycle, Migration, And Data-Safety Authority

## Purpose

Make future PRD reconciliation decision-complete for initialization, reconfiguration, manifest provenance, target information architecture, compatibility classification, quiescence, backup/rollback, ordered migration, Store evolution, and cross-platform/privacy/security safety.

## Manifest And Ownership Authority

The manifest is the project-local identity and ownership authority for managed resources, routers, selected optional capabilities, and lifecycle receipts. Router ownership is separate from resource-body projection selection and ownership. It must distinguish:

- verified managed ownership;
- project-owned content;
- managed content modified after installation;
- absent provenance;
- incomplete provenance;
- ambiguous provenance; and
- contradictory provenance.

No hash, matching filename, historical convention, or nearby managed file may silently upgrade ambiguous content into managed ownership.

The manifest-provenance state set is:

- `absent`
- `verified`
- `incomplete`
- `ambiguous`
- `contradictory`

Conflict planning is fail-closed. Setup, reconfiguration, update, uninstall, and migration report intended mutations before applying them, preserve user content, and require explicit authority for destructive resolution.

## Target Information Architecture

The target project-local surfaces are:

- an always-local configured-harness router skeleton under `.make-docs/system/{contracts,prompts,references,templates}/`, with optional managed resource bodies in the same typed directories;
- archive material under `.make-docs/archive/` only when the lifecycle/archive authority says it belongs there;
- generated product artifacts under `docs/artifacts/`;
- persona-specific testing packets, executions, outcomes, findings, and evidence under `docs/assets/<persona-slug>/testing/`.

The `.make-docs/system/` typed directories and routers are always installed. Resource bodies and archive/artifact/testing directories are created on demand. Setup does not populate optional resource bodies or on-demand project surfaces merely to advertise capability.

Naive-UAT evidence never lives under `.make-docs/archive/` or `docs/artifacts/`.

## Compatibility Classification

Preserve the top-level source states:

- `clean-v1`
- `clean-v2-full-snapshot`
- `clean-v2-provider-backed`
- `clean-v2-hybrid-pinned-cache`
- `modified-v1`
- `partial-install`
- `malformed-manifest`
- `missing-manifest-recognizable`
- `unknown-shape`

Preserve the dispositions:

- `sync`
- `migrate`
- `migrate-with-review`
- `backup-and-reinstall`
- `manual-review-required`

Add orthogonal facets for resource layout, prompt layout, archive layout, artifact layout, persona assets, Playbook/Protocol assets, path-hygiene scripts, router bootstrap, manifest ownership, Store schema, and optional agentics.

Filesystem facets use:

- `absent`
- `managed-clean`
- `managed-modified`
- `project-owned`
- `mixed`
- `unknown`

Store facets use:

- `absent`
- `supported-current`
- `supported-legacy`
- `newer-unknown`
- `corrupt`
- `unknown`
- `indeterminate`

The safety lattice is monotonic. Any unknown, mixed, managed-modified, incomplete, ambiguous, contradictory, malformed, newer-unknown, corrupt, or contradictory-ownership state blocks unattended mutation for that facet. Confidence in one facet never overrides uncertainty in another.

## Quiescence Gate

Before migration Stage 1:

1. acquire the exclusive project migration lock;
2. activate a durable barrier at every public Playbook and Protocol write and discovery boundary;
3. verify under the lock that no public writer or discovery path bypasses the barrier;
4. keep the barrier active through transformation and validation; and
5. fail closed if bypass is possible.

Quiescence does not delete code or mutate legacy Store data. Traced implementation retirement remains Stage 11.

## Ordered Migration

The accepted order is normative for later PRD and backlog derivation:

1. Classify once and freeze the reviewed evidence snapshot.
2. Back up every path that may be transformed or removed and record preserved or exported user content.
3. Mint or upgrade manifest identity and provenance without claiming ambiguous ownership.
4. Install the manifest and configured-harness routers at the project root, `docs/`, `.make-docs/`, `.make-docs/system/`, and all four typed directories.
5. Establish top-level prompt identity and machine resource list/read operations before changing router fallbacks.
6. Move or install only selected clean resource bodies under `.make-docs/system/`. Treat legacy `.make-docs/<type>/system/` paths as guarded migration inputs and preserve any file without verified managed ownership and matching trusted bytes.
7. Establish on-demand archive, artifact, and persona-asset routing, then transform only clean managed legacy paths.
8. Install TypeScript path-hygiene operations, update references, and remove only a hash-proven managed Python helper.
9. Classify the Store before any setup mutation, then add general Store run tables and an internal checkpoint journal in one SQLite write transaction while leaving `playbook_runs` opaque and untouched.
10. Rehome Naive-UAT system resources, add the thin first-party Skill adapter, reconcile `user` and `maintainer` execution with the `user` default, and establish `docs/assets/<persona-slug>/testing/`.
11. Retire traced Playbook and Protocol runtime, packaging, tests, conformance, and support surfaces while preserving the quiescence barrier through validation.
12. Install only explicitly selected, evidence-backed optional agentics.
13. Validate fresh install, representative legacy migrations, package projection, and dogfood parity before any release recommendation.

No later backlog may reorder these stages silently. A proposed reorder must cite the governing PRD, explain preserved invariants, and receive owner approval.

## Backup, Rollback, Update, And Uninstall

- Backup precedes every transformed or removed path and records preserved/exported user content.
- Rollback restores the pre-migration filesystem backup and manifest receipt.
- Rollback does not downgrade or delete independently advanced machine-local Store data.
- Store migrations are ordered and transactional with their own recovery and compatibility checks. SQLite transaction rollback is the Store rollback boundary. Setup does not replace or restore the whole Store or its database after a Store migration commits.
- Update repeats ownership/provenance classification and never overwrites managed-modified or ambiguous content unattended.
- Uninstall removes only verified managed assets, reports retained project-owned content and Store state, and requires separate explicit authority to prune Store data.

## General Run Capture

Add general Store tables alongside, not by mutating, legacy `playbook_runs`:

### `runs`

- project ID
- run ID
- run type
- lifecycle stage
- status
- current checkpoint
- optimistic version
- start/update/finish timestamps
- bounded metadata

### `run_evidence`

- run ID
- stable evidence ID
- evidence kind
- project-relative or sanitized external reference
- optional digest
- recorded timestamp

The v2 run-type registry is closed to `lifecycle`. Lifecycle stages are limited to `design`, `plan`, `prd`, `work`, `implementation`, `release`, `archive`, and `retrospective`. Wave, phase, operation, UAT, and local labels remain bounded metadata and do not become hidden run types.

Supported statuses are `active`, `paused`, `completed`, `failed`, and `abandoned`. Registry operations cover start, show, list, checkpoint, pause, resume, attach evidence, complete, fail, and abandon.

Every successful mutation returns a typed receipt containing run, operation, schema version, resulting optimistic version, and commit time. The receipt proves only the Store mutation. `run-capture-unavailable` leaves repository authority unchanged, creates no implied queue/retry, and is gate-required only when the gate directly tests Store migration or run capture.

Checkpoint 9 classifies the Store before any setup mutation. Corrupt, unknown, newer, or indeterminate state stops setup without Store replacement or repair. The checkpoint-9 schema DDL, `user_version`, and one internal checkpoint-journal row commit in one SQLite write transaction. The transaction serializes writers and rolls back as one unit before commit. The journal contains checkpoint and receipt-projection metadata only. It contains no Store payload. The project-local checkpoint-9 migration receipt is an idempotent projection of the committed journal row. Setup retries a failed projection once. A second failure returns a typed checkpoint result and stops later setup work. A later setup uses the journal for projection recovery before a new setup mutation. Existing CLI and MCP operation identifiers do not change.

## Cross-Platform, Privacy, And Security

- Store and installation locations use platform APIs, not hard-coded home paths.
- Project paths use normalized repository-relative POSIX notation.
- Resolution rejects traversal and symlink escape and compares platform-canonical paths.
- Fixtures cover only changed path behavior across Windows drive/UNC, macOS case, Linux permission, and justified path-length cases.
- Atomic writes use same-filesystem temporary files, flush/rename where supported, and retain typed recovery receipts.
- Project migration uses an explicit lock; Store writes use transactions, bounded busy retries, and typed failure.
- Resource reads treat content as data and do not evaluate it, follow links, or run scripts.
- The Store contains no prompt/document/evidence bodies, secrets, or payloads by default.
- Export is explicit, redacts or relativizes machine paths by default, and never uploads.

## Exact PRD Maintenance

| PRD | Owning sections | Required current-authority change |
| --- | --- | --- |
| 05 | Selection and Manifest Invariants; Managed-File Conflict Planning | Add selection identity, provenance states, fail-closed conflict planning, update/uninstall rules. |
| 07 | Lifecycle commands | Make setup/reconfigure/update/uninstall and mutation visibility consistent with manifest authority. |
| 09 | Maintainer/dogfood lifecycle | Keep dogfood downstream and prohibit recovery shortcuts. |
| 10 | Package/release reference | Block release recommendation until Stage 13 validation. |
| 15 | Initialization and adoption | Define existing-project classification, minimal installation, locks, and adoption disposition. |
| 17 | Materialization/bootstrap requirements | Own the always-local router skeleton, selected resource bodies, and Stage 5-7 resource ordering. |
| 18 | Compatibility and migration safety | Own source states, dispositions, facets, safety lattice, quiescence, backup, rollback, and migration order. |
| 21 | Resource tiers | Own the always-local `.make-docs/system` router skeleton and optional resource-body projection. |
| 22 | Asset model and Persona Grouping Boundary | Own archive/artifact/testing destinations and prevent evidence misplacement. |
| 25 | Runtime ownership, operation-first migration, managed removal | Own TypeScript path hygiene, typed migration operations, locking, and CLI/MCP safety. |
| 38 | R-ID; R-STORE; R-PS | Own project identity, `runs`, `run_evidence`, typed receipts, privacy, and opaque `playbook_runs`. |
| 39 | R-RUN; R-RUNID; R-FLAG and registry sections | Own general run operations and typed results. |

## Requirement-History Needs

Record material replacements for:

- incomplete or permissive manifest ownership -> verified/fail-closed provenance;
- mutation before quiescence/classification -> locked snapshot-first migration;
- Playbook-specific run authority -> minimal lifecycle run capture plus opaque legacy preservation;
- eager directory population -> optional/on-demand target IA;
- hard-coded or unbounded path/locking behavior -> platform-aware bounded safety.

Current normative requirements are updated first.

## Later Build Handoff

After accepted PRDs and separate work authorization:

1. implement classification/provenance and dry-run planning;
2. implement lock/quiescence and backup/rollback receipts;
3. implement manifest identity and minimal routers;
4. implement resource provider/list/read before fallback changes;
5. implement selected projection and target IA;
6. replace path hygiene with typed TypeScript operations;
7. migrate Store schema transactionally while preserving `playbook_runs`;
8. integrate Phase 4 UAT/Persona changes;
9. retire traced Playbook/Protocol surfaces;
10. install selected agentics;
11. run Stage 13 package/dogfood/legacy validation.

This sequence constrains later backlog dependencies but is not itself a backlog.

## Evidence Budget

- One classification snapshot per migration fixture.
- No rerun with unchanged authority/code/fixture/config/environment fingerprint.
- One normal implementation pass and one materially distinct correction per reversible layer.
- Irreversible migration and Store changes receive a separately declared finite fixture/platform budget in the backlog.
- No unattended retry, indefinite SQLite polling, theoretical completeness, or invented performance target.

## Acceptance Gate

This phase is ready for assembly when proposed PRD authority contains the complete state/facet vocabulary, fail-closed lattice, pre-Stage-1 quiescence, exact 13-stage order, backup/rollback/uninstall rules, minimal Store model, opaque legacy preservation, and cross-platform/privacy/security constraints without authorizing migration.
