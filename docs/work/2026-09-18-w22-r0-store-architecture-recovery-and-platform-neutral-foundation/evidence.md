# W22 R0 Store Architecture Recovery Evidence

The sections through the first Phase Gate record P1 architecture inventory and decision evidence. Later sections record P2 authority work, P3 platform-safety implementation, and P4 harness, setup, and projection evidence.

## Status

- Phase: W22 R0 P1.
- State: Complete. Inventory work, owner decisions, Human Experience Review, and final P1 validation passed on 2026-09-18.
- Implementation authority: The owner authorized P1 on 2026-09-18.
- Change limit: This phase changes only W22 work records.
- Excluded changes: No product code, PRD, Store, installed package, real project, branch, worktree, stage, commit, push, or release changed.
- Store result: `project.state.status` returned `store-not-configured` for this checkout. Only that operation stopped. Store-free inventory work continued.
- Concurrent work: Existing W23 files were not changed.

## Freeze Rule

W22 R0 freezes these additions until P1 decisions and P2 authority are accepted:

- New Store tables or durable fields.
- New durable identity facts.
- New receipt layers.
- New setup state branches.
- New harness trust paths.
- New file-system object facts used as cross-run identity.

A release-blocking containment change is the only exception. It must meet all rules below:

1. It fixes a current release blocker.
2. It does not add a new public capability.
3. It uses an existing authority and state owner.
4. It has a removal or merge path in W22.
5. Its approval and evidence are in this ledger before implementation.

No exception is active.

## Baseline and Evidence Limits

The inventory used branch `make-docs-v2` at `853b85dac46c73a0e8b86a0118b24deaf9afc07f`.

The code index was current at that commit. The documentation index included the dirty worktree. The dirty files belong to W23 and are outside this phase.

The installed package was `@brucewaynedecoy/make-docs` version `2.0.0-rc`. Its managed files and selected Skills were clean. The Store was not configured for this checkout.

This evidence proves the current source and tracked tests. It does not prove behavior on a real Windows, macOS, or Linux host. No tracked workflow under `.github/workflows` was present in the inventory. P4 owns real-platform proof.

## Evidence Sources

The main code sources are:

- `packages/cli/src/store/database.ts`
- `packages/cli/src/store/state-rows.ts`
- `packages/cli/src/store/project-state.ts`
- `packages/cli/src/store/lifecycle-runs.ts`
- `packages/cli/src/store/installation-state.ts`
- `packages/cli/src/store/harness-integration-receipts.ts`
- `packages/cli/src/store/harness-system-operations.ts`
- `packages/cli/src/store/tool-operations.ts`
- `packages/cli/src/store/global-config.ts`
- `packages/cli/src/store/global-manifest.ts`
- `packages/cli/src/store/paths.ts`
- `packages/cli/src/harness-access/contract.ts`
- `packages/cli/src/harness-access/native.ts`
- `packages/cli/src/operations/context.ts`
- `packages/cli/src/operations/harness-policy.ts`
- `packages/cli/src/operations/registry.ts`
- `packages/cli/src/operations/resource/resolver.ts`
- `packages/cli/src/setup-state.ts`
- `packages/cli/src/setup-system.ts`
- `packages/cli/src/project-projection.ts`

The main accepted authority is in PRDs 24, 25, 28, 38, and 39. The W22 design and plan control this phase.

## Store Schema Inventory

The SQLite schema is at version 3. The current migrations create tables. No field-changing `ALTER TABLE` migration was found.

Each row below lists all durable fields for the table. The field list has the same owner, reader, writer, platform, and retention statement unless a row says otherwise.

| Table | Durable fields | Writer and reader | Purpose and authority | Platform, test, migration, retention, and privacy |
| --- | --- | --- | --- | --- |
| `projects` | `project_id`, `root_path`, `package_name`, `package_version`, `registered_at`, `last_seen_at` | `upsertProjectRegistryEntry`; project identity and registry readers | Rebuildable project registry mirror. The project config owns `project_id`. `root_path` is lookup data. | All hosts. Covered by `project-identity.test.ts`, `project-state.test.ts`, and Store tests. Created in v1. Project removal exists. No time limit exists. Paths and package data are local metadata. |
| `playbook_runs` | `project_id`, `run_id`, `record`, `created_at`, `updated_at` | State-row create, update, list, read, and legacy operations | Old opaque run state. The current table-role map calls it relocated canonical state, but Playbook behavior is retired. | All hosts. Covered by Store and compatibility tests. Created in v1. Project deletion exists. No time limit exists. Opaque JSON can contain private paths or content. |
| `work_evidence` | `project_id`, `wave_slug`, `phase_path`, `evidence_kind`, `payload`, `repo_root`, `recorded_at` | Work evidence operations and state-row readers | Work evidence record. Project documents remain product authority. | All hosts. Covered by `project-state.test.ts`, `store-verification.test.ts`, and `operations.test.ts`. Created in v1. Project deletion exists. No time limit exists. Payload and paths can contain private data. |
| `runs` | `project_id`, `run_id`, `run_type`, `lifecycle_stage`, `status`, `checkpoint`, `version`, `metadata`, `started_at`, `updated_at`, `finished_at` | Lifecycle start and transition operations; lifecycle status and list readers | Durable lifecycle run state with optimistic version checks. | All hosts. Covered by lifecycle, registry, operations, and global Store tests. Created in v2. Project deletion exists. No time limit exists. Metadata can contain private data. |
| `run_evidence` | `project_id`, `run_id`, `evidence_id`, `evidence_kind`, `reference_type`, `reference_value`, `digest`, `recorded_at` | Lifecycle attach-evidence operation; lifecycle evidence readers | Durable evidence reference and digest. It does not own project file bytes. | All hosts. Covered with lifecycle tests. Created in v2. Foreign key uses the run. Project deletion exists. External references can be private. |
| `store_checkpoint_journal` | `receipt_id`, `checkpoint`, `project_root_digest`, `snapshot_id`, `committed_at`, `receipt_json` | Checkpoint 9 migration writer and verifier | Compatibility proof for the earlier Store cutover. | All hosts. Covered by migration safety and Store tests. Created in v2. It is a bridge record. No general time limit exists. Receipt JSON can contain local evidence. |
| `installation_checkouts` | `checkout_id`, `project_id`, `root_path`, `root_device`, `root_inode`, `created_at` | Checkout binding and verified move logic; installation and recovery readers | Local checkout binding. Current code also stores device and inode as cross-run facts. | File-system semantics differ by host. Covered by installation, identity, path, and W19 R3 tests. Created in v3. The path is unique. Device and inode use needs rework. Paths are private local data. |
| `installation_ledgers` | `checkout_id`, `manifest_json`, `updated_at` | Installation plan/apply, setup, audit, adoption, projection, and recovery paths | Current installed ownership and manifest state. It mixes needed last-applied facts with rebuildable selection and provenance facts. | All hosts. Covered by install, uninstall, audit, setup, adoption, projection, and migration tests. Created in v3. No time limit exists. Manifest JSON can include paths, hashes, and saved state. |
| `installation_operations` | `operation_id`, `checkout_id`, `operation`, `status`, `before_ledger`, `after_ledger`, `created_at`, `finished_at`, `plan_complete` | Recorded installation mutation and recovery paths | Durable mutation journal. It proves intent before file writes and supports resume or rollback. | All hosts. Covered by installation and recovery tests. Created in v3. No time limit exists. Before and after JSON can hold sensitive path and ownership data. |
| `installation_steps` | `operation_id`, `ordinal`, `relative_path`, `before_json`, `after_json`, `applied` | Recorded installation mutation and recovery paths | Ordered file change plan and progress. | File behavior differs by host. Covered by installation, migration, layout, adoption, and recovery tests. Created in v3. No time limit exists. Before and after JSON can hold file bytes and modes. |
| `installation_locks` | `root_path`, `token`, `pid`, `hostname`, `acquired_at` | Installation lock acquire, verify, release, and stale recovery paths | Short-lived writer guard. It is not project identity. | Process and lock behavior differs by host. Covered by installation, global lock, lease recovery, and harness system tests. Created in v3. Normal release deletes it. Host and path data are private. |
| `installation_migration_records` | `checkout_id`, `kind`, `record_id`, `record_json` | Import, snapshot, backup, quiescence, receipt, atomic-write, and recovery paths | Migration and recovery evidence. Some kinds are temporary. Some kinds are historical. | All hosts with file-system effects. Covered by migration, legacy import, backup, and recovery tests. Created in v3. A direct delete helper exists for one record. No common time limit exists. Records can contain file bytes and paths. |
| `installation_transfers` | `checkout_id`, `source_path`, `source_digest`, `status`, `imported_at` | Legacy installation import path; transfer readers | One-time local-to-Store transfer bridge. | All hosts. Covered by W19 R3 legacy and migration tests. Created in v3. The schema allows `imported` and `removed`. No common removal rule was found. Paths and digests are local evidence. |
| `tool_operations` | `operation_id`, `operation`, `status`, `pid`, `hostname`, `metadata_json`, `started_at`, `finished_at` | Recorded tool operations, harness receipt writes, and Store removal guards | Tool-wide operation journal and process guard. | Process behavior differs by host. Covered by W19 R3 tool-state, harness receipt, Store lifecycle, and removal tests. Created in v3. Completed and failed rows remain. Metadata can contain private data. |
| `store_schema_journal` | `schema_version`, `description`, `committed_at` | Store migration code; schema verifier | Durable migration history. | All hosts. Covered by Store migration tests. Created in v3 and records every schema version. It contains no project content. |

### Store Files and Non-Table State

| Mechanism | Current use | Authority and limit | Proposed disposition |
| --- | --- | --- | --- |
| Global config | Machine preferences and harness approval input | Machine scope only. It must not become project authority. | Keep. Narrow its schema in P2. |
| Global manifest | Global managed asset ownership and package facts | Tool-owned global state. | Rework to the minimum last-applied and ownership facts. |
| Installation bootstrap lock | Store creation and migration guard | Short-lived process guard. | Keep behind the platform layer. |
| Global asset lock | Global asset mutation guard | Short-lived process guard. | Keep behind the platform layer. |
| Lease recovery lock | Stale writer recovery guard | Short-lived process guard. | Keep behind the platform layer. |
| Layout ledger and layout state | Project layout plan and applied facts | Overlaps the installation ledger and operation journal. | Merge into the accepted operation and last-applied model, then remove the duplicate form. |
| Legacy installation import | Reads old project-local state and writes Store transfer evidence | Compatibility input only. | Keep as a bounded bridge, then retire it after the support window. |

### Retention and Recovery Finding

The Store has row deletion helpers, lock release, migration-record deletion, project removal, and full Store removal. It has no one stated time limit for completed operations, old receipts, old host names, old paths, or saved file bytes.

P2 must define retention by record class. It must also define export and deletion behavior. Opaque legacy data must remain preserved until an explicit accepted action handles it.

## Identity and Safety Fact Classification

| Fact | Current use | Class | Finding and disposition |
| --- | --- | --- | --- |
| Project id | Project config, project registry, lifecycle state, and checkout rows | Durable identity | Keep. The repository owns it. Store copies are bindings or mirrors. |
| Checkout id | Installation tables and recovery | Durable local identity | Keep. The Store owns it. A clone or worktree gets a separate id. |
| Normalized root path | Project mirror, checkout lookup, locks, and claims | Live lookup fact | Keep as mutable lookup data. Do not use it as the durable primary key. |
| Device and inode in checkout row | Move detection and checkout assertion | Obsolete durable-identity candidate | Rework. These values are not portable and can be reused. They may be used only during one open or mutation window. |
| Device and inode in resource fingerprint | In-memory digest trust check | Short-lived guard | Keep only for the open/read window. Do not persist it as identity. |
| File size and time fields | Resource fingerprint and drift check | Short-lived guard | Keep inside one verification window. Do not use as ownership proof. |
| Content digest | Managed ownership, provider trust, migration proof, evidence reference | Durable evidence | Keep. State what bytes, algorithm, and authority each digest proves. |
| Package name, version, and digest | Provider, manifest, receipt, and release proof | Durable historical evidence | Keep as provenance. Do not use an old package digest as permanent caller authority. |
| Receipt id and operation id | Receipt, journal, migration, and recovery keys | Durable record identity | Keep. They identify a record, not a person or checkout. |
| Run id and evidence id | Lifecycle record keys | Durable record identity | Keep. They do not own project content. |
| Lock token | Lock ownership check | Short-lived guard | Keep. Delete it on release or accepted stale recovery. |
| PID and host name | Active writer and stale lease checks | Live fact | Keep as a guard. Never use it as durable identity. |
| Executable path | Native launch and command-rule review | Live fact | Rework. Resolve and verify it at call time through the platform layer. |
| Executable fingerprint | Caller and receipt evidence | Short-lived proof plus historical evidence | Rework. Use current proof for access. Keep old proof only for audit. |
| Native entry before and after values | Apply, drift, removal, and restore | Durable historical evidence | Keep. Limit it to entries Make Docs owns or reviewed. |
| Project desired selections | Config, setup intent, and projection intent | Durable project authority | Keep in project config. Store can record applied results only. |
| Installed manifest | Store ledger and old local inputs | Mixed state | Rework into minimum last-applied Store state. Treat local manifests as legacy input only. |

## Duplicate Canonical-Home Findings

| Fact | Current homes | Finding |
| --- | --- | --- |
| Project id | Project config, `projects`, `installation_checkouts`, and manifest JSON | The config is canonical. Other copies must be bindings or mirrors. |
| Root path | `projects`, `installation_checkouts`, locks, operation metadata, and receipts | It is useful lookup and evidence. It is not identity. |
| Desired resource and Skill selection | Project config, setup selection data, projection manifest state, and installation ledger | Project config must be canonical. The Store needs only reviewed applied state. |
| Effective installed ownership | Installation ledger, layout ledger, global manifest, and some receipts | The current homes overlap. P2 must name one last-applied owner for project state and one for global state. |
| Package proof | Project registry mirror, ledgers, provider records, and receipts | Keep package proof as evidence. One old copy must not grant current access. |
| Harness approval and applied state | Machine config, project config, receipts, and native entries | Approval, desired choice, applied result, and live native fact are different facts. The current model needs clearer names and precedence. |
| Migration evidence | Checkpoint journal, migration records, transfers, operation rows, and old local inputs | Compatibility history is spread across layers. P2 must define the bridge and its end state. |

## Harness Trust Inventory

| Mechanism | Current source and consumer | Authority | Finding and disposition |
| --- | --- | --- | --- |
| Static harness adapter | `harness-access/native.ts` and registry | Source-owned capability map | Keep. It replaced the invalid dynamic conformance model. |
| Machine approval | Global config and setup system plan | User approval for machine changes | Keep separate from project approval. |
| Project approval | Project setup and desired config | User approval for one project | Keep separate from machine approval. |
| Native entry plan | Adapter plan, before value, after value, owned keys | Reviewed file mutation | Keep. Preserve unrelated native bytes. |
| Integration receipt | Stored in migration records through recorded tool operations | Historical apply, verify, drift, remove, and recovery evidence | Rework. A receipt can prove what Make Docs changed. It cannot alone prove the current caller. |
| Executable check | Contract verifier and adapter caller identity | Live launch proof | Keep, but recheck at every Store-backed call. Put OS-specific work in one platform layer. |
| Caller identity | Encoded environment or argument plus optional reference | Operation access input | Rework. Use adapter, method, live executable proof, and current native entry. Do not trust a stale package fingerprint. |
| Operation access | Registry metadata, CLI launch, harness policy, and Store access errors | Per-operation allow list | Keep. Store-free routes stay Store-free. A Store error stops only one operation. |
| Generic MCP caller | Bounded generic identity and setup proof | Limited caller route | Use only operations that the current accepted registry allows for generic MCP callers. That set can expand, contract, or consolidate through approved product work. |
| Windows native launch proof | `native.ts` has explicit unimplemented branches | No complete authority | Rework before Windows support can be claimed. |

The current Windows message is explicit: native rule launch identity is not implemented on Windows. This is a known platform gap. It is not a test-only guess.

## Setup and Public Route Inventory

| Public behavior | Shared code path | Store use | Current proof and disposition |
| --- | --- | --- | --- |
| Unified setup preview and apply | `setup-state.ts`, setup CLI, planner, wizard | Machine and project subplans can use Store | Keep independent subplan results. Rework setup as a thin coordinator over plan, review, apply, verify, and recover. |
| Direct system setup | `setup-system.ts` prepare, resume, apply, and verify functions | Can initialize or repair machine state | Keep. It must not need the Store access route that it repairs. |
| Setup status and support display | Setup state plus adapter status | Read path can report partial state | Keep. Show each subplan result. |
| Project state status | Operation `project.state.status`; CLI `make-docs project state status [--json]` | Read-only Store check | Keep. It creates no Store or lock. The current checkout returned `store-not-configured`. |
| Project state recovery | Operation `project.state.recover`; CLI resume or rollback with dry-run and JSON modes | Store-backed recorded recovery | Keep. It must use the target checkout and reviewed saved plan. |
| Verify and repair | Adapter verify, receipt observation, Store verification, audit, and recovery paths | Varies by operation | Rework into shared verify facts and explicit repair plans. Do not hide repair inside status. |
| Resource list | `resource.list`; CLI and MCP tool; native MCP resource list | Store-free | Keep. It uses one resolver and stable URIs. |
| Resource read | `resource.read`; CLI and MCP tool; native MCP resource read | Store-free | Keep. It uses one resolver and exact bytes. |
| Resource ensure | `resource.ensure`; CLI and MCP tool | Store-backed mutation | Keep. It changes one selected projection through reviewed ownership. |
| Project resource projection | `project-projection.ts`, manifest planning, and installation ledger | Store records applied ownership | Keep project-owned content. Rework Store state to minimum last-applied facts. |
| CLI projection | Operation registry supplies command and JSON behavior | Per operation | Keep. Command adapters must not own business logic. |
| JSON projection | CLI output uses the same operation result and typed errors | Per operation | Keep. It is a representation, not a second behavior model. |
| MCP tool projection | MCP tools project admitted registry operations | Per operation | Keep. MCP tools must use the shared operation. |
| MCP native resources | MCP `resources/list` and `resources/read` | Store-free | Keep. It must match CLI resource identity and bytes. |

## Test and Consumer Inventory

| Area | Tracked tests and consumers | Missing proof |
| --- | --- | --- |
| Store schema and state rows | `store.test.ts`, `project-state.test.ts`, `store-verification.test.ts`, `p6-global-store-lifecycle.test.ts` | Retention, privacy deletion, and schema reduction proof. |
| Installation journal, locks, and recovery | `installation-state.test.ts`, `p5-migration-safety.test.ts`, W19 R3 tests, layout and adoption tests | Real Windows, macOS, and Linux file-system proof. |
| Project and checkout identity | `project-identity.test.ts`, installation tests, path hygiene tests | Move, clone, worktree, inode reuse, case-fold, and network-file-system real-host matrix. |
| Harness access and receipts | W19 R6 access, adapter, setup, and harness system tests; CLI and MCP consumers | Real installed harness proof on all supported hosts. Windows native launch proof is absent. |
| Unified setup and Store repair | `w19-r6-setup.test.ts`, `cli.test.ts`, W19 R8 remediation and installed-upgrade tests | Real normal-use proof across all supported package runners and hosts. |
| Resource identity and projection | Resource identity, provider, resolver, integration, MCP, and P4 projection tests | Real host proof for links, path case, atomic replace, and file-time behavior. |
| Operation registry and public surfaces | Registry contract, operation domains, dependency direction, P3 surfaces, CLI, run CLI, and MCP tests | A W22 conformance check after the target authority changes. |
| Public documents | PRDs 24, 25, 28, 38, and 39; setup and resource command docs | P2 must remove conflicting authority text and describe the smaller target. |
| Prior packages | W19 R3 Store cutover, W19 R6 setup and harness access, W19 R8 Store access repair | Their evidence proves the old accepted behavior. It does not prove the W22 target. |

Current consumers include setup, install, update, audit, backup, uninstall, migration, Skill adoption, project layout, lifecycle operations, resource projection, CLI, JSON output, MCP tools, and native MCP resources.

## Append-Only Symptom Table

Do not edit an old row to change its meaning. Add a new row that supersedes it.

| ID | Observed behavior | Confidence | Platform | Code or authority path | Authority owner | Human promise at risk | Missing proof |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S-001 | Native rule launch identity throws an explicit not-implemented error on Windows. | High | Windows | `harness-access/native.ts` | Harness adapter plus platform layer | Setup and later Store-backed use must work on supported hosts. | Real Windows design and tests. |
| S-002 | Checkout rows store device and inode and use them in verified move logic across runs. | High | All file systems; risk differs | `store/database.ts`, `store/installation-state.ts` | Store identity | A moved or cloned project must not become the wrong checkout. | Target identity rule and real-host matrix. |
| S-003 | Resource digest trust uses device, inode, size, and time fields. The cache is in memory. | High | All file systems; risk differs | `operations/resource/resolver.ts` | Resource resolver | A read must return verified current bytes. | Proof that the facts stay inside one read window on all hosts. |
| S-004 | Store absence returns `store-not-configured` for status and stops only that operation. | High | Current macOS checkout | `project.state.status`, PRDs 25 and 38 | Operation access | Store-free work must continue. | Repeat proof after target changes. |
| S-005 | Earlier unified setup could form a closed recovery loop. W19 R8 added independent subplans and Store-free repair. | High, historical and repaired | Package and harness flows | W19 R8 authority and tests | Setup | A user must be able to set up or repair the access path. | Preserve as a regression case. |
| S-006 | Earlier dynamic harness conformance made valid methods unavailable. W19 R6 P3 replaced it with static adapters. | High, historical and repaired | Harness flows | W19 R6 authority and tests | Harness adapter | Setup must show real supported choices. | Preserve as a regression case. |
| S-007 | Applied ownership, selection, package proof, and migration evidence have several Store homes. | High | All | Installation ledger, layout ledger, global manifest, receipts, and migration records | Store architecture | Status and repair must give one clear answer. | Owner decisions and P2 schema map. |
| S-008 | PRD 24 makes project config the owner of desired settings. Older manifest wording can still imply that selection and ownership share one local manifest authority. | Medium | Documentation | PRDs 02, 24, and 38 | PRD authority | A user must know what travels with a project and what stays local. | P2 line-by-line authority repair. |
| S-009 | The Store has no one stated retention rule for completed operations, receipts, paths, host names, or saved file bytes. | High | All | Store tables and delete helpers | Store architecture | A user must be able to understand and remove local tool data. | Owner retention decision and P2 requirements. |
| S-010 | Setup owns both orchestration and detailed machine mutation state. | Medium | All | `setup-state.ts`, `setup-system.ts`, planner, wizard | Setup | Setup must remain understandable and recoverable. | Accepted composition boundary. |
| S-011 | Supersedes S-002. The cause was durable checkout identity that depended on device and inode values. PRD 38 now limits identity to project and checkout ids plus verified path evidence. Schema 5 archives the exact old strings, removes both active columns, and leaves move decisions to content and config proof. | High | Windows, macOS, and Linux | `store/database.ts`; `store/installation-state.ts`; `installation-state.test.ts`; `w22-r0-p5-compatibility-bridge.test.ts` | Store identity | A safe move must keep the right checkout without trusting unstable file object numbers. | Source conversion, move, repeat, interruption, and rollback proof is complete. P6 owns final installed-package proof. |
| S-012 | A historical receipt could bind current execution to an old package hash. The accepted rule makes the receipt history only and verifies the live package at each call. Schema 2 receipts omit executable proof. Schema 1 receipts remain readable history. | High | Windows, macOS, and Linux | `harness-integration-receipts.ts`; `harness-policy.ts`; `w19-r6-harness-adapters.test.ts`; P5 bridge register | Harness trust | A valid package update must not lose access only because old executable bytes changed. | Source update and compatibility proof is complete. P6 owns installed package-manager proof. |
| S-013 | Supersedes S-001. Windows native launch handling used an explicit not-implemented branch. P3 moved host facts behind one platform contract. P4 limits public harness methods through one reviewed adapter result. The same platform contract passed on Windows, macOS, and Linux. | High | Windows, macOS, and Linux | `platform.ts`; `harness-access/native.ts`; `w22-r0-p3-platform-safety.test.ts`; workflow 35464032778 | Platform and harness adapter | A supported action must have the same meaning and safe stop on each supported host. | Source and real-runner contract proof is complete. P6 owns the final installed route. |
| S-014 | Supersedes S-005. The earlier recovery loop came from making setup depend on the Store or access path that setup had to repair. Setup now previews the Store directly, applies the reviewed bridge through the shared journal, keeps Store-free work available, and returns one next action for blocked state. | High | All | `cli.ts`; `setup-system.ts`; `installation-state.ts`; `w19-r8-store-access-remediation.test.ts`; `w22-r0-p5-compatibility-bridge.test.ts` | Setup and Store recovery | A person must be able to repair setup without a successful prior Store or MCP call. | Source absent, legacy, blocked, repeat, and recovery cases pass. P6 owns final installed output review. |
| S-015 | Supersedes S-007 for resource projection. The cause was projection records that repeated desired selection and provider facts beside applied ownership. P4 target writers keep only URI, target path, digest, algorithm, applied time, lifecycle result, and ownership in the projection record. P5 converts legacy mirrors and saves the exact old ledger in private migration history. | High | All | `manifest.ts`; `project-projection.ts`; `store/database.ts`; `p4-projection-lifecycle.test.ts`; `w22-r0-p5-compatibility-bridge.test.ts` | Resource projection and Store architecture | Status and repair must not choose between duplicate desired and applied facts. | Source conversion and target-writer proof is complete. Separate approval is still required before old history is deleted. |
| S-016 | Supersedes S-008. The cause was authority text that let a local installation manifest appear to own both project intent and machine-applied facts. PRDs 24 and 38 now separate repository intent from Store-applied proof. P5 enforces the physical bridge rules for checkout identity, receipts, transfers, projection mirrors, and pending operations. | High | Documentation and all hosts | PRDs 24 and 38; `store/compatibility-bridge.ts`; `w22-r0-p5-compatibility-bridge.test.ts` | PRD and Store authority | A user must know what travels with the project and what stays local to one checkout. | Normative authority and source bridge proof are complete. P6 owns the final installed explanation. |
| S-017 | Supersedes S-003. Resource identity facts remain inside one verified read window. The final package read installed resources as raw and JSON bytes without creating a Store or project state. | High | Windows, macOS, and Linux | `operations/resource/resolver.ts`; `resource-resolver.test.ts`; `smoke-pack.mjs`; workflow 35483206273 | Resource resolver | A read must return verified current bytes without turning low-level file facts into durable identity. | Closed. The three-host source matrix and exact installed-package resource case passed. |
| S-018 | Supersedes S-004 and completes S-016. The final package read installed resources with an absent Store and wrote no project state. Repository intent and local applied proof remained separate. | High | Windows, macOS, and Linux | `smoke-pack.mjs`; PRDs 24, 25, and 38; workflow 35483206273 | Operation access and PRD authority | Store loss must stop only the operation that needs the Store. | Closed. Every host returned the same `available` and `store-not-opened` result. |
| S-019 | Supersedes S-006 and completes S-013. Static adapter declarations and reviewed native entries replaced dynamic conformance. The selected native Skill lifecycle passed with the exact installed package. | High | Windows, macOS, and Linux | `harness-access/native.ts`; `w19-r6-harness-adapters.test.ts`; `w19-r6-harness-system-operations.test.ts`; workflow 35483206273 | Harness adapter and platform layer | Setup must show real supported choices and preserve the same safe result on every host. | Closed. The three-host source matrix and installed native lifecycle passed without a platform exception. |
| S-020 | Supersedes S-009 and completes S-015. PRD 38 defines live recovery, bounded history, rebuildable cache, bridge state, and deletion authority. The final removal case pruned ownership, retained history, and preserved custom and backup files. | High | Windows, macOS, and Linux | PRD 38; `store/database.ts`; `smoke-pack.mjs`; workflow 35483206273 | Store architecture | A user must be able to understand and remove local tool data without unapproved loss. | Closed. The required migration, retention, rollback, and removal proof passed. Old-history deletion still needs separate approval. |
| S-021 | Supersedes S-010 and completes S-014. Setup now coordinates reviewed subplans while the Store, platform, harness, and resource owners keep their own mutation and recovery rules. | High | Windows, macOS, and Linux | `setup-state.ts`; `setup-system.ts`; `w19-r8-store-access-remediation.test.ts`; `smoke-pack.mjs`; workflow 35483206273 | Setup | Setup must remain understandable and recoverable through one open path. | Closed. Fresh, repeat, old-state, blocked-removal, and recovery cases passed with one public state and next action. |
| S-022 | Completes S-011. The exact installed package converted supported old checkout state, preserved user bytes, and returned the same result on all three hosts. | High | Windows, macOS, and Linux | `store/compatibility-bridge.ts`; `smoke-pack.mjs`; workflow 35483206273 | Store identity | A safe move or conversion must keep the right checkout without durable file-object identity. | Closed. Required move, update, interruption, rollback, and installed bridge evidence passed. |
| S-023 | Completes S-012. Current caller proof remained separate from receipt history. The candidate source passed live MCP and native-route cases on all three hosts. The exact installed package then passed the native lifecycle after package installation. | High | Windows, macOS, and Linux | `harness-policy.ts`; `w19-r6-harness-adapters.test.ts`; `w19-r6-harness-system-operations.test.ts`; workflow 35483206273 | Harness trust | A valid package update must not lose access only because old executable bytes changed. | Closed. Current and stale receipt, route, update, repair, and removal evidence passed. |

## Mechanism Disposition Ledger

These are P1 recommendations. They are not accepted target authority until the owner decides.

| Mechanism | Disposition | Evidence and reason | Migration effect | Public behavior effect |
| --- | --- | --- | --- | --- |
| Project config for project id and desired settings | Keep | It is portable project knowledge. | Preserve comments and values. Add no applied facts. | Clones keep intent but not local ownership. |
| `projects` table | Rework | It is a useful rebuildable mirror. | Rebuild from bound checkouts and current project reads. | No new command. Status labels it as a mirror. |
| `playbook_runs` active role | Remove | Playbook behavior is retired. Opaque history may still need export. | Preserve and export through a bridge. Do not delete it during schema cutover. | No current public capability is lost. |
| `work_evidence` body storage | Rework | Project documents own human evidence. Some external evidence is not rebuildable. | Keep references and digests for non-rebuildable evidence. Do not duplicate project bodies. | Evidence status stays available with clearer source links. |
| Lifecycle `runs` and `run_evidence` | Keep | They are non-rebuildable operational state and evidence references. | Migrate without meaning changes. | Lifecycle commands keep stable results. |
| Checkpoint 9 journal | Remove after bridge | It proves an old cutover. It is not the target journal. | Export or retain as opaque history until support ends. | No normal-use route depends on it. |
| Checkout id | Keep | It separates one local installation from the portable project id. | Preserve ids when binding is verified. | Move and recovery stay local and safe. |
| Durable device and inode checkout fields | Remove | They are not portable durable identity. | Replace with path lookup plus live verification facts. | Moves may need explicit review when evidence conflicts. |
| In-memory file fingerprint | Rework | It can guard one read but must not become ownership. | Keep it inside the live read window. | Resource reads remain safe. |
| Content hashes | Keep | They prove reviewed bytes and drift. | Name the bytes and algorithm for each use. | Status can explain exact drift. |
| Installation ledger | Rework | It is needed for last-applied ownership but is too broad. | Write a versioned minimal last-applied record. Keep a compatibility reader. | Setup, verify, repair, and remove keep one applied-state answer. |
| Installation operation and step journal | Keep | It supports intent-before-write, resume, and rollback. | Keep stable record ids and migrate field form if needed. | Recovery remains explicit. |
| Installation and tool locks | Keep | They stop concurrent writers. | Move OS facts behind one platform interface. | Busy and stale-writer messages remain typed. |
| Migration records | Rework | Some are live recovery facts. Some are old history. | Split by retention class and remove expired temporary facts safely. | Recovery remains possible. Status becomes smaller. |
| Transfer rows | Remove after bridge | They serve one local-state transfer. | Keep until the compatibility window closes. | Old projects keep an explicit upgrade path. |
| Tool operation journal | Keep | It guards tool-wide mutation and Store removal. | Add a stated retention rule. | Repair and removal stay safe. |
| Schema journal | Keep | It proves ordered migration. | Keep one row per accepted schema version. | Store verification remains clear. |
| Static harness adapters | Keep | They are bounded source-owned capability maps. | Preserve adapter ids and supported methods. | Setup shows only implemented methods. |
| Harness receipts as current access proof | Rework | They prove history, not the current process. | Keep receipt history. Recheck live executable and native entry at call time. | A copied or stale receipt cannot grant access. |
| Separate machine and project approval | Keep | The scopes have different effects. | Preserve separate review and apply records. | Setup shows each scope and result. |
| Unified setup state machine | Rework | It composes valid subplans but can become a second authority. | Keep plan results. Move detailed behavior to shared operations. | Setup remains one guided flow with independent results. |
| Store-free resource list and read | Keep | They are repository and package reads. | No migration. | Store absence does not block reading guidance. |
| Store-backed resource ensure | Keep | It changes managed project bytes and ownership. | Use the accepted minimal last-applied record. | One reviewed resource can be projected. |
| Project resource projection | Rework | Project content is portable. Applied ownership is local. | Keep content in the repo. Keep only applied facts in Store. | A clone has content and intent but needs local apply review. |
| Platform-specific path, lock, process, and atomic-write code | Rework | These rules are spread across Store, harness, and resource code. | Introduce one small platform layer before removing old calls. | Supported hosts get the same typed result with host-specific proof. |

## Proposed Minimal State Map

| Owner | Owns | Does not own |
| --- | --- | --- |
| Repository | Stable project id, desired selections, selected project resources, project content, designs, PRDs, work, and product authority | Applied package version, checkout id, locks, receipts, writer state, or recovery progress |
| Store | Checkout id and binding, non-rebuildable run and migration evidence, machine preferences, in-flight journals, receipts as history, and the minimum last-applied ownership state | Project content, desired project settings, document authority, or permanent file-system object identity |
| Live platform check | Normalized current path, executable proof, process liveness, file facts, and short-lived file mutation guards | Durable project or checkout identity |
| Installed package | Shipped provider content, static adapter definitions, command grammar projection, and migration readers | Project decisions or local applied ownership |

## Proposed Platform Boundary

One small platform layer should own:

- User data and config roots.
- Path normalization and path comparison.
- Case behavior and volume boundaries.
- Safe real-path checks.
- Atomic replace and directory sync rules.
- File locks and stale-lock checks.
- Process liveness checks.
- Short-lived file identity guards.
- Executable resolution and call-time verification.

Store, harness, setup, and resource code should consume typed results from this layer. They should not copy OS rules.

## PRD Conflict Map for P2

| Conflict | Current authority | P2 input |
| --- | --- | --- |
| Project config owns desired settings, while older manifest text can imply local manifest authority for selection and ownership. | PRDs 02, 24, and 38 | Make project config the only desired-setting authority. Make the Store the only local applied-state authority. |
| PRD 38 allows device and inode in checkout binding, while the W22 target rejects file-system object numbers as permanent identity. | PRD 38 identity and platform rules | Keep checkout id. Limit device and inode to a live guard. |
| Harness receipts contain exact package and executable facts that can be read as current caller proof. | PRDs 25, 28, and 38 | Define receipts as history. Require live executable and native-entry proof for current access. |
| Store authority includes broad installation, migration, receipt, and registry state without a clear minimum last-applied schema. | PRD 38 | Add a field-level state ownership and retention table. |
| Setup requirements can read as a second state machine beside shared operations. | PRDs 28, 38, and 39 | Make setup a thin plan, review, apply, verify, and recover coordinator. |
| Resource projection state mixes project-selected content with local applied ownership. | PRDs 17, 24, 38, and 39 | Keep selected content and intent in the repo. Keep applied ownership in the Store. |
| Cross-platform support is stated more broadly than current Windows native launch proof. | PRDs 10, 28, and 38 | Define support per capability and require real-host proof before a support claim. |
| Retention and privacy have no field-level expiry and deletion rule. | PRD 38 | Add record classes, time limits, export, deletion, and opaque-history rules. |

## P2 Input Matrix

| Decision | Recommendation | P2 change after acceptance | State |
| --- | --- | --- | --- |
| D1 Repository authority | Repository owns project id, desired settings, selected content, and product documents. | Repair PRDs 02, 24, and 38. | Accepted by the owner on 2026-09-18. |
| D2 Store authority | Store owns only non-rebuildable local operational state and minimum last-applied ownership. | Add field-level Store owner and retention rules. | Accepted by the owner on 2026-09-18. |
| D3 Checkout identity | Keep checkout id. Remove device and inode as durable identity. | Replace move and conflict rules. | Accepted with required update and stop invariants on 2026-09-18. |
| D4 Harness trust | Receipts are history. Current access needs live executable, method, native entry, and operation proof. | Repair PRDs 25, 28, and 38. | Accepted with the clarified generic MCP rule on 2026-09-18. |
| D5 Setup composition | Setup is a thin coordinator over shared operations and independent subplans. | Repair setup and command requirements. | Accepted by the owner on 2026-09-18. |
| D6 Resource projection | Repo owns content and intent. Store owns only applied ownership. | Repair PRDs 17, 24, 38, and 39. | Accepted by the owner on 2026-09-18. |
| D7 Platform support | One platform layer owns OS rules. Full core parity is required across Windows, macOS, and Linux. | Add platform capability, proof, parity-gap, and exception rules. | Accepted with the stronger parity requirement on 2026-09-18. |
| D8 Compatibility | Use versioned readers and bounded bridges with required exit contracts before field or table removal. | Add migration order, rollback, retention, bridge ownership, proof, and end conditions. | Accepted with the required exit contract on 2026-09-18. |

## Decision Ledger

### D1 Repository Authority

State: Accepted by the owner on 2026-09-18.

Recommendation:

- The repository owns the stable project id.
- The repository owns desired selections and selected project content.
- The repository owns designs, PRDs, work records, and product authority.
- The Store can bind or mirror these facts. It cannot override them.
- Local applied ownership remains Store state.

Why:

- This keeps a project portable and reviewable.
- A clone can keep intent without inheriting local installation ownership.
- It removes dual authority between config, manifests, ledgers, and receipts.

Alternatives:

1. Make the Store own desired settings. This weakens portability and hides project intent on one machine.
2. Keep dual authority. This preserves the current conflict and makes repair results unclear.

Owner disposition: Approved as recommended.

P2 effect: Make project config the source of truth for project id and desired settings. Treat Store copies as bindings, applied state, or rebuildable mirrors.

### D2 Store Authority

State: Accepted by the owner on 2026-09-18.

Recommendation:

- The Store owns each local checkout id and its verified project binding.
- The Store owns in-flight operation journals, ordered steps, locks, and recovery state.
- The Store owns non-rebuildable lifecycle and migration evidence.
- The Store owns machine preferences and machine approval records.
- The Store owns receipts as history.
- The Store owns the minimum last-applied package and file ownership facts needed for verify, repair, remove, and recovery.
- Rebuildable indexes can live in the Store, but they are not authority.
- The Store does not own desired project settings, project content, or product documents.
- The Store does not use device or inode values as permanent identity.

Why:

- This keeps the safety facts that cannot be rebuilt after a failed write.
- It removes duplicate desired-state and document authority.
- It keeps verify, repair, remove, and recovery possible after a process restart.
- It gives P2 a clear test for every Store field: non-rebuildable safety fact, minimum last-applied fact, or rebuildable cache.

Proposed table effect:

- Keep lifecycle runs, run evidence, operation journals, ordered steps, locks, tool operations, and the schema journal.
- Rework the project mirror, work evidence, installation ledger, migration records, and receipt storage.
- Retire active Playbook run use, the checkpoint 9 bridge, and transfer rows after their accepted compatibility windows.
- Preserve opaque legacy data until an explicit accepted export or removal action exists.

Alternatives:

1. Keep broad Store authority. This needs less migration work, but it keeps duplicate state and unclear repair answers.
2. Keep only journals in the Store. This is smaller, but it leaves too little applied ownership data for safe verify, remove, and recovery.

Owner disposition: Approved as recommended.

P2 effect: Define each Store field as a non-rebuildable safety fact, minimum last-applied fact, or rebuildable cache. Add clear retention and deletion rules for each class.

### D3 Checkout Identity

State: Accepted by the owner on 2026-09-18 with required update and stop invariants.

Recommendation:

- Keep the project id as portable repository identity.
- Keep a separate Store-owned checkout id for each local clone or worktree.
- Use the normalized current root path as mutable lookup data. Do not use it as a permanent key.
- Bind a checkout with its checkout id, project id, current path, and last verified managed-content facts.
- Do not store device or inode values as permanent identity.
- Device, inode, size, and file-time values can guard one open or mutation window. Discard them after that window.
- A verified move can update the path only when the old path is absent, the project id matches, managed-content facts match, no competing checkout claim exists, and no operation is pending.
- A clone or worktree gets a new checkout id even when it shares the same project id and content.
- An unclear move, clone, path collision, or identity conflict stops mutation and shows a review action.
- Platform-specific path comparison belongs to the D7 platform layer.

Required invariants:

- A path update can change only current path lookup data and its verification time or evidence.
- A path update cannot change the project id, checkout id, local ownership, or the one-checkout-per-clone and worktree rule.
- Device, inode, path, content match, receipt, or package evidence cannot by itself authorize an identity update.
- A stop can block only the affected mutation and show review facts.
- A stop cannot rewrite identity, merge checkouts, transfer ownership, delete Store state, or choose a repair.
- Any repair that changes identity or ownership needs its own explicit reviewed action.

Why:

- A checkout id remains stable without depending on one file system.
- Project id and checkout id keep portable intent separate from local ownership.
- Content facts can support a reviewed move without claiming that a file-system object number is permanent.
- The conflict rules fail closed when two local paths or checkouts could own the same applied state.

Proposed Store effect:

- Keep `checkout_id`, `project_id`, `root_path`, and `created_at`.
- Replace durable `root_device` and `root_inode` fields with versioned last-verified facts that name the managed content and verification time.
- Keep path uniqueness only as a current Store lookup rule. Do not treat it as cross-machine identity.
- Preserve existing checkout ids through a verified migration. Use D8 compatibility rules for old rows.

Alternatives:

1. Keep device and inode as durable identity. This helps some local move checks, but it is not portable and object numbers can be reused.
2. Make the root path the primary identity. This is simple, but it breaks moves, path-case changes, clones, and worktrees.

Owner disposition: Approved as recommended with the required invariants above.

P2 effect: Define path update and conflict-stop rules as enforcement of project id, checkout id, clone and worktree separation, mutable path lookup, and the ban on durable device or inode identity. No lower-level fact can override those rules.

### D4 Harness Trust

State: Accepted by the owner on 2026-09-18 with the clarified generic MCP rule.

Recommendation:

- Treat every harness receipt as historical evidence. A receipt is not a current access token.
- Admit an operation only when the static adapter allows that operation for the selected connection method.
- Require the applicable machine approval and project approval as separate facts.
- Resolve and verify the executable at call time for a native executable route.
- Verify that the current owned native entry still matches the reviewed method and command boundary.
- Bind caller identity to the current execution, adapter, method, executable proof, and operation.
- Keep package name, version, and digest as provenance and audit evidence. An old package digest cannot grant current access.
- Generic MCP callers can use only operations that the current accepted operation registry explicitly allows. The allowed operation set can expand, contract, or consolidate through approved product work.
- An operation does not grant generic MCP access only because it appears on the MCP server.
- Keep Store-free operations free of harness and receipt requirements.
- A drift, missing approval, caller mismatch, executable mismatch, or native-entry mismatch stops only the affected operation and shows a recovery action.
- Verification cannot make an automatic repair. Repair needs its own reviewed operation.

Why:

- A copied or stale receipt cannot grant access.
- Current executable and native-entry checks prove the launch path that is in use now.
- Separate approvals preserve the difference between a machine change and a project change.
- Per-operation failure preserves Store-free work and unrelated operations.

Proposed Store effect:

- Keep receipt history with before, after, method, operation, result, and verification facts.
- Mark later observations as history. Do not rewrite an old receipt into current authority.
- Keep machine approval in machine state and project approval in project intent or its reviewed applied record.
- Store only the minimum current applied harness state needed for verify, remove, and recovery.

Alternatives:

1. Use a valid receipt as current access authority. This is simple, but a stale or copied receipt can outlive the executable, native entry, approval, or package it described.
2. Run full setup before every Store-backed call. This rechecks more state, but it is too disruptive and still mixes setup with operation access.

Owner disposition: Approved as recommended with the corrected generic MCP wording above.

P2 effect: Define harness trust per caller, method, operation, live executable, current native entry, and separate approvals. Define generic MCP admission as changeable operation-registry policy, not as a fixed feature list or broad identity grant.

### D5 Setup Composition

State: Accepted by the owner on 2026-09-18.

Recommendation:

- Setup is one guided coordinator. It is not a second source of product or Store authority.
- Setup discovers current facts without changing state.
- Setup builds machine and project subplans through the same shared operations used by direct commands and MCP tools.
- Setup shows one combined review with separate machine and project effects, approvals, dependencies, and expected results.
- Machine and project approval remain separate. Approval for one does not approve the other.
- Independent approved subplans can proceed when another subplan is blocked.
- A dependent subplan waits until its named dependency applies and verifies successfully.
- Apply records intent before each write. It then applies, verifies, and records the result through shared operations.
- Status is read-only. It cannot repair, adopt, migrate, or broaden selection.
- Repair is an explicit reviewed plan. Resume and rollback use the accepted operation journal.
- Direct machine setup and repair cannot depend on the Store or MCP access path that they are trying to create or repair.
- A repeated setup with no requested or detected change is a content and state no-op.
- Setup cannot add a capability, Skill, resource selection, harness method, or command permission that was not shown in the review.

Why:

- One guided flow remains simple for the user.
- Shared operations prevent setup, CLI, JSON, and MCP from having different behavior.
- Separate subplans prevent one blocked area from hiding a valid independent result.
- Explicit dependencies stop a project write when its machine requirement did not verify.
- Read-only status and explicit repair keep observation separate from mutation.

Proposed state effect:

- Keep a short-lived setup plan in memory until review.
- Store only approved operation intent, progress, results, and recovery facts through the shared journals.
- Do not create a separate durable setup session state when the operation journals already hold the required facts.
- Keep exact subplan result and blocker data in the final setup result.

Alternatives:

1. Use one all-or-nothing setup transaction. This is simple to describe, but one blocked part prevents safe independent work and recreates the earlier recovery loop.
2. Use only separate setup commands. This keeps operations small, but it removes the useful guided review and makes the user assemble dependencies.

Owner disposition: Approved as recommended.

P2 effect: Define setup as a guided view and coordinator over shared operations. Preserve separate approvals, independent results, explicit dependencies, read-only status, explicit repair, and no hidden selection expansion.

### D6 Resource Projection

State: Accepted by the owner on 2026-09-18.

Recommendation:

- The repository owns desired resource selection and all selected local resource content.
- The installed package owns the immutable shipped provider content and its catalog.
- The Store owns only the last-applied ownership facts needed to verify, refresh, remove, and recover a managed projection.
- A last-applied resource record names the stable resource URI, target path, applied content digest, provider identity, provider version or immutable reference, apply time, and required recovery reference.
- Resource list and read remain deterministic and Store-free.
- Resource ensure changes one named resource only. It cannot broaden the saved selection.
- An existing local edit is project content. Ensure or refresh cannot overwrite it without a specific reviewed replacement or adoption action.
- Removal can delete only a path that still matches the Store's last-applied owned digest. A changed path is preserved and reported.
- A clone or worktree receives repository content and desired selection. It does not inherit another checkout's applied Store ownership.
- File device, inode, size, and time facts can guard one read or write window. They do not become projection ownership.
- Store absence stops only Store-backed ensure, refresh, remove, or recovery. It does not stop list, read, or independent repository work.
- CLI, JSON, MCP tools, and native MCP resources use the same resolver, stable URI, bytes, origin rules, and typed errors.
- The operation registry can add, remove, or consolidate resource operations through approved product work. D4 generic MCP admission rules still apply per operation.

Why:

- Selected resource content stays portable and reviewable with the project.
- The Store keeps enough local proof to avoid overwriting or deleting user changes.
- Store-free discovery and reads remain useful before setup and during repair.
- One resolver prevents different content or error behavior across public routes.

Proposed resolution order:

1. Use an explicit project override when one exists.
2. Use a verified selected local projection when no override exists.
3. Use the verified installed provider when no selected local content exists.

Proposed state effect:

- Keep desired projection selection in project config.
- Keep selected resource bytes in the repository.
- Replace broad projection manifest state with minimum last-applied Store records.
- Preserve current managed records through the D8 compatibility bridge.

Alternatives:

1. Let the Store own projected resource content. This hides project behavior on one machine and weakens portability.
2. Keep repository content without applied Store ownership. This is portable, but refresh and removal cannot distinguish managed bytes from user changes safely.

Owner disposition: Approved as recommended.

P2 effect: Keep resource selection and selected bytes in the repository. Keep only minimum last-applied ownership in the Store. Preserve Store-free list and read, one-resource ensure, user edits, and one shared resolver across public routes.

### D7 Platform Support

State: Accepted by the owner on 2026-09-18 with the stronger parity requirement.

Recommendation:

- One small platform layer owns all operating-system rules used by Store, setup, harness, resource, and file-mutation code.
- The platform layer owns user data and config roots, path normalization, path comparison, path-case behavior, safe real-path checks, link handling, locks, process liveness, atomic replace, directory sync, executable resolution, and short-lived file guards.
- Project and checkout identity stay outside the platform layer and follow D1 and D3.
- Internal path keys use the platform comparison rule. User output preserves a useful native display path.
- Device, inode, file time, and similar host facts never become durable identity.
- Support is declared by capability and host. One passing capability does not imply that all Make Docs behavior is supported on that host.
- Full Windows, macOS, and Linux parity is the required target for core Store, identity, setup, recovery, resource, CLI, JSON, and MCP capabilities.
- The support matrix reports current proof. It cannot reduce target scope.
- A missing core platform capability is a defect. Typed unsupported behavior is temporary containment, not completion.
- A parity gap requires an explicit, owner-approved, time-bounded exception.
- Each exception names the host, capability, user effect, reason, owner, repair phase, and end condition.
- An agent cannot mark a host or core capability not applicable because support is difficult or evidence is missing.
- A harness method can be host-specific only when the external harness does not support that host. This requires evidence and owner acceptance.
- W22 cannot close with an unapproved core parity gap.
- The target proof matrix covers Windows, macOS, and Linux for Store bootstrap and migration, checkout binding and move, locks and stale recovery, atomic mutation and recovery, setup and repair, resource operations, CLI and JSON, MCP, and each admitted harness method.
- Unit tests and simulated platform tests are required, but they are not real-host proof.
- A support claim needs an installed package candidate tested on the real host with the source repository unavailable.
- An unsupported capability fails before mutation with a typed result and a safe next action.
- One unsupported capability stops only that capability. Store-free and otherwise independent work continues.
- Public support documentation and release checks use the same capability matrix.
- The current Windows native launch gap is an open defect until its real implementation and installed-host proof pass. It is not an accepted target state.

Why:

- Central operating-system rules remove conflicting path and file assumptions.
- Capability-level support states exactly what works without hiding a known gap.
- Real-host installed-package proof finds behavior that unit tests and host simulation cannot prove.
- Typed early failure prevents partial writes on an unsupported path.

Required proof classes:

| Proof class | Requirement |
| --- | --- |
| Shared contract | The same typed input and result apply on Windows, macOS, and Linux. |
| Unit and simulation | Edge cases cover path case, separators, links, object-number reuse, process state, lock state, atomic replace, and interruption. |
| Real host | The exact package candidate runs on each claimed host with the source repository unavailable. |
| Recovery | An interrupted write resumes or rolls back without using durable file-system object identity. |
| Public route parity | CLI, JSON, MCP, and direct shared-operation results agree for the claimed capability. |
| Release statement | Public support text matches the passing matrix and names any unsupported capability. |

Alternatives:

1. Keep operating-system checks inside each feature. This needs less initial change, but it keeps duplicated rules and hidden platform drift.
2. Treat the current support matrix as the target scope. This would make missing proof or difficult work a reason to abandon parity.

Owner disposition: Approved as recommended with the stronger parity requirement above.

P2 effect: Make full core parity the required outcome. Use the capability matrix only as proof. Treat gaps as defects, require owner-approved time-bounded exceptions, and allow host-specific harness methods only when the external harness creates the limit.

### D8 Compatibility and Removal

State: Accepted by the owner on 2026-09-18 with the required exit contract.

Recommendation:

- Use a versioned reader and a bounded compatibility bridge before changing or removing any current Store field, table, receipt, or manifest form.
- Before migration, verify the source schema, exact package, checkout binding, active locks, pending operations, and available backup space.
- Create and verify a recoverable Store backup before the first destructive schema action.
- Record migration intent before writes. Apply database changes transactionally when one database transaction can contain them.
- Use the accepted operation journal when database and file changes must cross one transaction boundary.
- Preserve verified checkout ids. Never mint a replacement id only because the schema changed.
- Read old device and inode values as legacy evidence only. Never use them as current identity authority.
- Convert broad manifest and ledger data into the accepted minimum last-applied form. Preserve unknown or opaque data outside the new authority model.
- Mark retired Playbook rows, checkpoint 9 records, transfer rows, and other old forms read-only before any later removal.
- Do not dual-write old and new authority forms after the cutover. A versioned reader can support old input, but only the accepted target form receives new writes.
- Do not drop a legacy field or table until its support window, export rule, retention rule, recovery test, and end condition have owner approval.
- Never delete project content or opaque legacy data as an automatic side effect of a Store schema migration.
- A newer unknown, corrupt, or unclear schema fails closed for Store-backed mutation. Store-free work continues.
- A failure before project mutation restores the verified Store backup. A failure after project mutation uses the recorded resume or rollback path.
- Older packages fail closed when they see a newer schema. They do not rewrite it.
- Candidate proof uses the exact package archive in isolated homes with the source repository unavailable.
- The compatibility matrix covers clean current state, old schema state, interrupted operations, legacy local inputs, clones, worktrees, moves, user-edited files, repeat migration, rollback, and removal.
- No compatibility bridge can be introduced without an accepted exit contract.

Why:

- The bridge protects current users while authority moves to the smaller target.
- One target writer prevents old and new state from drifting apart.
- Verified backup and journal rules give each failure point a recovery path.
- Explicit support and end conditions prevent temporary compatibility code from becoming permanent authority.

Required removal gate:

1. The target reader, writer, verifier, repair path, and recovery path pass.
2. Every old fact is migrated, exported, preserved as opaque history, or approved for deletion.
3. The exact installed package passes the compatibility matrix on Windows, macOS, and Linux when the affected capability is core.
4. Public upgrade and recovery guidance names the old state and safe next action.
5. The owner approves the support end condition and the separate removal action.

Required exit contract for each bridge:

- A stable bridge id.
- The old form and accepted target form.
- The first version that uses the bridge.
- The bridge owner.
- Proof that new writes to the old form have stopped.
- A deterministic count or check for remaining old state.
- The last supported old version or another measurable end condition.
- The phase or release that owns removal.
- The tests required before removal.
- The separate approval required to delete old data or code.

A bridge without an owner and measurable exit is not temporary and cannot be introduced.

Alternatives:

1. Rewrite and drop old state in one migration. This is smaller, but it removes the safe review, export, and rollback window.
2. Dual-write old and new forms for an open-ended period. This looks compatible, but it restores two authorities and creates drift.

Owner disposition: Approved as recommended with the required exit contract above.

P2 effect: Define a bridge register and one exit contract per old Store or manifest form. Prevent old writes after cutover. Require a measurable remaining-state check, named removal owner, owned phase or release, end condition, tests, and separate removal approval.

## Human Experience Review

D1 through D8 are accepted. They support portable project intent and resource content, a smaller Store boundary, platform-neutral checkout identity, current-operation harness trust, shared setup operations, required core platform parity, and bounded compatibility bridges. Implementation and installed-package proof remain pending in later phases. Therefore, P1 makes no claim that the future runtime behavior already exists.

| Promise | Accepted target support | Observation | Conclusion for P1 | Limit and next action |
| --- | --- | --- | --- | --- |
| HX-1: The same supported action has the same meaning, safety result, and recovery path on Windows, macOS, and Linux. | D7 requires full core parity, one platform layer, one shared contract, and real-host proof. | The target does not permit a proof matrix to reduce parity scope. | Target supported. | Runtime evidence is insufficient. P4 must pass the exact installed package on all three hosts. |
| HX-2: A person can identify the project, state, blocked action, and next safe action before internal ids. | D3, D4, and D5 require scoped stops, read-only status, review facts, and safe next actions. | The accepted target separates identity, status, repair, and internal evidence. | Target supported. | Installed human and JSON output does not yet exist for the target. P3 and P4 must inspect complete, partial, blocked, and failed results. |
| HX-3: Store loss or denial stops only the operation that needs the Store. | D2, D4, D5, and D6 preserve Store-free work and per-operation failure. | Current `project.state.status` returned `store-not-configured` and independent P1 work continued. | Satisfied for the P1 decision scope. | P4 must repeat the result across the final CLI, JSON, MCP, and installed-host paths. |
| HX-4: A move or package update does not fail only because device, inode, or package hash changed. | D3 removes durable file-system object identity. D4 makes package hashes audit evidence. D8 preserves verified checkout ids. | The accepted target bars lower-level facts from overriding project and checkout identity. | Target supported. | Migration, move, clone, worktree, and package-update proof is pending in P3 and P4. |
| HX-5: Setup and repair do not form a closed dependency loop. | D5 keeps direct repair independent from the access path under repair and preserves independent subplans. | The accepted target makes setup a coordinator, not a second state machine. | Target supported. | P3 and P4 must prove missing Store, denied Store, partial setup, repair, resume, and repeat setup. |
| HX-6: A maintainer can explain every retained state field and safety mechanism. | D1 through D8 assign owners, classes, dispositions, public effects, migration effects, and proof rules. | The schema inventory and mechanism ledger cover every current Store table and mechanism group in scope. | Satisfied for the P1 decision scope. | P2 must make the accepted rules normative in the PRDs and field-level target schema. |

The proposed target can be checked against HX-1 through HX-6 only after each decision has an owner disposition. Current open limits are:

- Status can still report overlapping state homes.
- Windows native launch proof is incomplete.
- Retention and deletion rules are incomplete.
- Real Windows, macOS, and Linux proof is pending.
- Compatibility bridge limits and end dates are pending.

## Testing Decisions

- Automated inventory check: Passed for all 15 Store tables, all eight decisions, all six human-experience promises, the P2 input matrix, task state, and Markdown table structure.
- Performance Testing: `not-needed-now`. P1 changes no runtime path.
- Guided Progress Review: Complete. The owner accepted D1 through D8. D3, D4, D7, and D8 include the owner's required clarifications.
- Unassisted Goal Testing: `not-needed-now`. P1 is an owner decision phase, not a discoverability test.

## Phase Gate

P1 is complete as of 2026-09-18.

Tasks t1 through t12 are complete.

D1 through D8 have an owner disposition. P2 is unblocked by P1 authority, but P2 has not been authorized or started. Product implementation remains unauthorized.

## P2 Product Authority and Minimal State Model

### Status

P2 document implementation is complete. The owner accepted the current product contract on 2026-09-19. P2 is closed.

No product code, Store state, installed package, template, branch, worktree, staging area, commit, push, publication, or release was changed by P2.

P3 and later product implementation remain unauthorized. This acceptance closes only P2 current-authority work.

The `project.state.status` preflight returned `store-not-configured`. Only that operation stopped. P2 continued as Store-free repository work.

### Authority Maintenance Decision

| Candidate | Decision | Result and reason |
| --- | --- | --- |
| Architecture, state ownership, identity, operations, setup, resources, platforms, harness trust, and compatibility | `update-existing` | PRDs 02, 06, 07, 10, 16, 18, 24, 25, 28, 38, and 39 already own the affected product subjects. |
| Confirmed drift and rebuild risk | `update-existing` | PRD 03 remains the one living register. Six stable W22 items were added without renumbering old items. |
| New product authority | `none` | P1 found no ownerless capability or boundary. |
| PRD 00 navigation | `none` | No document was created, renamed, retired, or given a new navigation relationship. The concurrent W23 edit remained untouched. |

### Current Authority Coverage

| P1 decision | Current owning requirements | Result |
| --- | --- | --- |
| D1 Repository authority | PRD 02 `R-ARCH-STATE-1`; PRD 24 `R-CONFIG-STATE-*` and `R-CONFIG-RESOURCE-*`; PRD 38 `R-BND-*`, `R-MIN-*`, and `R-KEEP-*` | Repository owns portable project identity, desired settings, selected content, and product records. |
| D2 Store authority | PRD 38 `R-MIN-*` field register | Every current durable Store field group and non-table state form has one class, owner, writer, reader set, retention, privacy, and recovery use. |
| D3 Checkout identity | PRD 38 `R-ID-*` and `R-CHECKOUT-*`; PRD 39 `R-CHECKOUT-*` | Checkout id remains local durable identity. Path is mutable lookup. Device and inode are not durable identity. Update and stop rules cannot rewrite identity or ownership. |
| D4 Harness trust | PRD 25 `R-ACCESS-12` through `R-ACCESS-16`; PRD 28 `R-HARNESS-16` through `R-HARNESS-20`; PRD 38 `R-HARNESS-STATE-*` | Receipts are history. Current access is per caller, route, approval, and operation. Generic MCP admission is current registry policy, not a feature freeze. |
| D5 Setup composition | PRD 07 `R-CLI-SETUP-*`; PRD 39 `R-SETUP-COMP-*` | Setup is a thin coordinator over shared operations with separate subplans, read-only status, and explicit repair. |
| D6 Resource projection | PRD 06 `R-PROJECTION-*`; PRD 24 `R-CONFIG-RESOURCE-*`; PRD 39 `R-REG-EVOLVE-2`; PRD 38 target last-applied field row | Repository owns intent and selected bytes. Store owns only minimum local applied ownership. List and read remain Store-free. |
| D7 Platform support | PRD 10 `R-PLATFORM-PROOF-*`; PRD 16 `R-PLATFORM-*`; PRD 38 `R-PLATFORM-*` | One platform service owns host rules. Full core parity remains required on Windows, macOS, and Linux. Evidence cannot reduce scope. |
| D8 Compatibility and removal | PRD 18 `R-BRIDGE-*`; PRD 38 legacy and obsolete field rows | Versioned readers, one target writer, no old-form writes after cutover, one bridge exit contract, and separate removal approval are required. |

### Field-Level State Result

PRD 38 classifies the 15 current Store tables and the current non-table forms. It also classifies repository config, global config, target project and global last-applied ownership, receipt history, layout state, live locks, and legacy forms.

The accepted class set is:

- repository-canonical and portable;
- Store-canonical and non-rebuildable;
- Store-cached and rebuildable;
- live-machine fact verified at use time;
- short-lived mutation guard;
- historical evidence; or
- obsolete and removable after migration.

The register preserves opaque legacy data. It stops old-form writes after cutover. It removes data only after its bridge exit and separate approval.

### Risk and History Result

PRD 03 adds:

- `D-039` for durable file identity and broad Store state;
- `D-040` for receipt history and current harness proof;
- `D-041` for the current core platform parity gap;
- `R-036` for permanent compatibility bridges;
- `R-037` for loss of recovery or opaque evidence during Store reduction; and
- `R-038` for misuse of an evidence matrix to reduce platform scope.

W22 adds no open product question. D1 through D8 settled the P2 choices. A new material choice must return to P1 instead of becoming an inferred P2 rule.

Eleven materially changed product PRDs contain a `2026-09-18 — W22 R0` Requirement History entry. PRD 03 uses its stable item history and receives no Requirement History section.

### Human Experience Review

Reviewer: Codex agent.

Review surface: the current normative PRD text changed by P2. No installed runtime surface exists for the target yet.

| Promise | Observation | Conclusion | Limit and next action |
| --- | --- | --- | --- |
| HX-1: the same supported action has the same meaning, safety result, and recovery path on Windows, macOS, and Linux | PRDs 10, 16, and 38 make full core parity the target, use one typed platform service, and prohibit evidence from reducing scope. | Satisfied for P2 authority. | P3 must implement the service. P6 must pass one exact installed package on all three real hosts. |
| HX-2: a person can identify the project, state, blocked action, and next safe action before internal ids | PRDs 02, 07, and 39 require human output to name the project, state, affected action, and one safe next action before internal identifiers. | Satisfied for P2 authority. | P4 and P6 must inspect complete, partial, blocked, and failed installed output. |
| HX-3: Store loss or denial stops only the operation that needs the Store | PRDs 02, 06, 07, 16, 25, 38, and 39 preserve Store-free work and scoped refusal. The P2 preflight returned `store-not-configured`; only that status operation stopped and P2 continued. | Satisfied for P2 authority and this Store-free document task. | P4 and P6 must repeat all four Store states across final human, machine-readable, MCP, and installed-host routes. |
| HX-4: a move or package update does not fail only because device, inode, or package hash changed | PRDs 38 and 39 prohibit those facts from authorizing identity change. PRD 25 treats package proof as provenance. | Satisfied for P2 authority. | P3 and P5 must prove move, clone, worktree, remount, path-case, and package-update cases. |
| HX-5: setup and repair do not form a closed dependency loop | PRDs 07 and 39 keep setup thin and direct machine repair independent from the access path under repair. | Satisfied for P2 authority. | P4 and P5 must prove partial setup, explicit repair, resume, rollback, and repeat behavior. |
| HX-6: a maintainer can explain every retained field and safety mechanism | PRD 38 gives every current durable field group and non-table form a class, owner, writer, readers, retention, privacy, and recovery use. PRD 18 gives each bridge an exit contract. | Satisfied for P2 authority. | P5 must prove the physical schema and every bridge conform to the register. |

This review supports the document-authority result only. It does not claim that the future installed behavior exists or that a person has accepted its lived use.

### Validation Evidence

| Check | Result |
| --- | --- |
| PRD authority validation | Passed. It scanned 37 PRD files, 606 Markdown files, 196 structured files, and 1,217 authority links with no diagnostics. |
| Path hygiene | Passed. It checked 830 local content files with no finding or I/O error. This is content hygiene, not installation evidence. |
| P2 metadata form | Passed. All 12 changed PRDs keep a numbered H1. The two PRDs with frontmatter retain valid title, `prd` kind, and `active` status. Ten older PRDs keep their valid no-frontmatter form. No top-level coordinate was added. |
| P2 links | Passed. Every relative link added by P2 resolves. The PRD authority link scan also passed. |
| Cross-owner consistency | Passed. Deterministic checks found D1 through D8 in their assigned current owners. |
| Requirement history | Passed. All 11 materially changed product PRDs contain the W22 entry. |
| Risk records | Passed. `D-039` through `D-041` and `R-036` through `R-038` are present. |
| Diff whitespace | Passed with `git diff --check`. |

The corpus-wide documentation index reports 247 older broken-link findings. None comes from a P2-added section. The findings span prior historical plans, work evidence, retired PRD links, and recorded temporary paths. P2 did not change or hide that existing debt. It does not block the P2 current-authority result because all P2-added links and the active PRD authority scan pass.

### Testing Decisions

| Testing type | Result |
| --- | --- |
| Automated Implementation Testing | Passed for documentation authority through the checks above. |
| Performance Testing | `not-needed-now`; P2 sets no performance target. |
| Guided Progress Review | Passed. The owner accepted the current product contract on 2026-09-19. |
| Unassisted Goal Testing | `not-needed-now`; this is informed product-authority review, not a normal-use discoverability test. |

### P2 Gate

Tasks t1 through t12 are complete.

The owner accepted this current product contract on 2026-09-19. P2 is closed. No implementation blocker or unsettled product choice remains in P2.

P3 and later code work still need separate explicit implementation approval.

## P3 Platform-Neutral Filesystem and Checkout Safety

### Status

P3 implementation and required platform proof are complete. The owner authorized implementation, the commits needed for remote proof, the pull request, the repair commits, and final closeout. P3 is closed on 2026-09-19.

The P3 implementation is in commits `46b65816`, `907d1401`, `bc0575f3`, and `aa0dd742`. The closeout commit changes only this evidence record and the P3 work record. Concurrent W23 files remain outside the P3 change set.

P4 and later implementation remain unauthorized. This closeout grants no later-phase authority.

### Implementation Result

- One typed platform service owns path normalization and comparison, user data roots, executable discovery, process liveness, short-lived file guards, locking, and atomic replacement.
- Store schema 4 keeps project ID, checkout ID, normalized current path, and accepted verification facts. Device and inode values are no longer durable checkout identity.
- A verified checkout move preserves project association. Changed content, a collision, or an unsafe link blocks mutation and preserves prior accepted bytes and Store evidence.
- Atomic replacement and lock behavior use platform-owned rules. Failure results preserve accepted state and return stable error meaning.

### Real-Platform Contract Results

Workflow: [Platform safety run 35464032778](https://github.com/brucewaynedecoy/make-docs/actions/runs/35464032778)

| Host | Result | Evidence |
| --- | --- | --- |
| Ubuntu | Passed in 25 seconds | [Job 105952859027](https://github.com/brucewaynedecoy/make-docs/actions/runs/35464032778/job/105952859027) |
| macOS | Passed in 42 seconds | [Job 105952858899](https://github.com/brucewaynedecoy/make-docs/actions/runs/35464032778/job/105952858899) |
| Windows | Passed in 1 minute 5 seconds | [Job 105952858980](https://github.com/brucewaynedecoy/make-docs/actions/runs/35464032778/job/105952858980) |

Each job used the same TypeScript check, build, and exact platform contract suite. The suite passed 127 tests on each host.

### Public Contract Comparison

| Contract area | Cross-platform result |
| --- | --- |
| Path identity | Each host applies its own drive, UNC, separator, link, and case rules through the same platform interface. Business rules do not guess from another host's syntax. |
| Checkout move | Accepted project identity and content proof preserve the checkout association after a path move. Low-level file object numbers do not decide durable identity. |
| Blocked mutation | Changed content, a collision, an unsafe link or reparse point, or ambiguous identity blocks the write and preserves prior accepted bytes and evidence. |
| Atomic replacement | Success leaves accepted new bytes. Failure returns the stable `atomic-replace-failed` class and does not leave an untracked partial result. |
| Lock ownership | One live writer owns the lock. Token checks protect release. A stale or dead owner can be reviewed without deleting unrelated work. |
| Process and executable checks | Each host uses native process and executable rules. Unknown remote-host state remains unknown instead of becoming a guessed success or failure. |

No product-level difference was found in public state, preservation, error meaning, or next safe action. Host-specific syntax remains an internal platform concern. No support limit was accepted or required.

### Human Experience Review

Reviewer: Codex agent.

Review surface: focused P3 results, local Store and checkout results, and the same contract suite on real Windows, macOS, and Linux runners. P3 does not yet provide the final installed public surface.

| Promise | Observation | Conclusion | Limit and next action |
| --- | --- | --- | --- |
| HX-1: the same supported action has the same meaning, safety result, and recovery path on Windows, macOS, and Linux | The same 127-test contract suite passed on all three hosts. The comparison found no difference in public error meaning, preservation result, or next safe action. | Satisfied for the P3 platform and Store boundary. | This is runner and agent evidence. P6 must inspect the final installed package and public output on all three hosts. |
| HX-4: a move or package update does not fail only because device, inode, or package hash changed | Schema 4 removes device and inode from durable checkout identity. Focused tests show that verified moves keep association and changed content blocks mutation without data loss. | Satisfied for the P3 checkout-identity scope. | Clone, worktree, remount, package-update, and final installed-route proof remain owned by P5 and P6. |

The review supports only these P3 technical claims. It does not claim a person's lived ease, confidence, or acceptance.

### Validation Evidence

| Check | Result |
| --- | --- |
| TypeScript | Passed with `npm exec -w packages/cli tsc -- --noEmit`. |
| CLI build | Passed with `npm run build -w packages/cli`. |
| Exact P3 platform suite | Passed 127 of 127 tests locally and on Windows, macOS, and Linux. |
| Full CLI set | Passed 1,334 tests and skipped 5. One separate risk-list fixture failed because it expects R-001 through R-035 while the active register also contains R-036 through R-038. |
| Default validation | Reached the same separate risk-list fixture failure. This result does not support a fully green default-validation claim. |
| Diff check | Passed with `git diff --check` before closeout. |
| Pull request checks | All required Windows, macOS, and Linux platform contract jobs passed. |

The risk-list fixture does not exercise P3 platform behavior. It remains a visible validation limit. P3 closure does not mark that separate fixture as fixed.

### Testing Decisions

- Automated Implementation Testing: complete and blocking proof passed for the P3 scope.
- Performance Testing: `not-needed-now`. No performance target is open in P3.
- Guided Progress Review: `not-needed-now`. P6 owns the installed public behavior review.
- Unassisted Goal Testing: `not-needed-now`. Automated file, Store, and real-platform proof answer the P3 decision.

### P3 Gate

Tasks t1 through t12 are complete. Acceptance criteria A13 through A19 are satisfied within the recorded evidence and limits.

The durable schema no longer depends on low-level file identity. The real-platform contract cases agree on public meaning. The owner authorized closeout on 2026-09-19. P3 is closed.

P4 and later implementation still need separate explicit approval.

## P4 Harness Trust, Setup, and Resource Simplification

### Status

P4 implementation, review, and source-level validation are complete. The owner authorized implementation and final closeout. P4 is closed on 2026-09-19.

The implementation and closeout changes remain unstaged and uncommitted. Concurrent W23 files remain outside the P4 change set.

P5 and later implementation remain unauthorized. This closeout grants no later-phase authority.

### Implementation Result

- Schema 2 harness receipts prove managed native entry history. They do not serve as permanent proof of the current executable. Schema 1 receipts remain readable for compatibility.
- Each Store-backed call verifies the current executable and caller proof. One policy service keeps machine approval, project approval, caller identity, and operation access as separate decisions.
- A valid package update or moved launch path can keep a valid managed entry. A changed or unowned entry still blocks mutation and remains intact.
- Setup uses bounded prepare, review, apply, verify, and recover services. Pending state is read before editable questions. Human, JSON, and MCP routes reuse operation services and canonical facts.
- New projection state keeps desired selections in project config, source identity in the installed provider, live bytes in project files, and minimum applied ownership in the Store or installation ledger. Old projection records remain readable, but new writes omit duplicate provider and selection facts.
- Agent routes do not gain host-configuration authority. They cannot widen machine or project approval, change caller identity, or bypass operation policy. Update and stop behavior remains subject to these trust rules.

### Platform Boundary

P4 adds no operating-system-specific business branch and no narrower platform route. Harness, setup, receipt, and projection logic use the P3 platform boundary. The local P4 gate includes the platform contract tests. P3 already proved the shared platform contract on real Windows, macOS, and Linux runners in [workflow 35464032778](https://github.com/brucewaynedecoy/make-docs/actions/runs/35464032778).

This supports A23 for the P4 source boundary. P6 still owns final installed-package proof on all three real hosts.

### Human Experience Review

Reviewer: Codex agent.

Review surface: the built local CLI, focused P4 results, setup help and dry-run output, a Store-unavailable project-state call, and a Store-free resource-list call. This is not a final installed package.

| Promise | Observation | Conclusion | Limit and next action |
| --- | --- | --- | --- |
| HX-2: a person sees the project state and one valid next action | A fresh setup dry run returned `planned`, listed each planned file action, and named the apply command. A Store-unavailable status result named `project.state.status`, said that no project files changed, kept `taskCanContinue: true`, and gave one retry action. | Satisfied for the P4 source and command-result boundary. | The output is agent-reviewed local source-build evidence. P6 must inspect the final installed human and machine-readable results. |
| HX-3: independent work continues without Store access | In the same restricted environment, `project state status` stopped with `store-unavailable`, while `resource list` succeeded and returned all 20 installed prompt resources. The failure stated that independent Store-free work could continue. | Satisfied for the tested Store-unavailable route and the shared Store-free resource service. | Automated cases cover absent, denied, unsafe, and unavailable Store states. P6 must repeat them against the installed package. |
| HX-5: setup and repair use one open recovery path | Setup help names direct system setup and explicit recovery controls. Focused state-transition tests show pending work is checked first. Resume, repair, repeat, and removal use the saved operation state and return a compatible next action. | Satisfied for the P4 setup and recovery service boundary. | No lived-human response is claimed. P5 owns compatibility-bridge recovery. P6 owns the final installed path. |

The review supports only these P4 source-level claims. It does not claim a person's lived ease, confidence, or acceptance.

### Validation Evidence

| Check | Result |
| --- | --- |
| CLI build | Passed with `npm run build -w packages/cli`. |
| Focused P4 gate | Passed 129 of 129 tests across harness receipts, caller policy, system setup, Store remediation, projection lifecycle, CLI/JSON/MCP operation surfaces, platform safety, Human Experience resources, and provider integration. |
| Full CLI set | The full run passed 1,336 tests and skipped 5 before two failures. The P4 failure was an old expected error string. It was corrected, and its 15-test file plus the final 129-test P4 gate passed. The only remaining failure is the separate W23 risk-list fixture that expects R-001 through R-035 while the active register also contains R-036 through R-038. |
| Store-unavailable surface | `project state status` stopped only that operation, reported that no project files changed, kept independent work available, and gave one retry action. |
| Store-free surface | `resource list --type prompt` succeeded in the same environment and returned 20 provider resources. |
| Projection compatibility | New manifests contain minimum applied ownership proof. Legacy schema-4 projection mirrors remain readable. Repeat and removal cases pass. |
| Receipt compatibility | New schema 2 receipts omit executable proof. Legacy schema 1 receipts remain readable. Current execution is verified at each Store-backed call. |
| Diff check | Passed with `git diff --check` before closeout. |

The W23 fixture does not exercise P4 harness, setup, Store-access, recovery, resource, or projection behavior. It remains a visible validation limit. P4 closure does not mark it as fixed.

### Testing Decisions

- Automated Implementation Testing: complete. The blocking P4 source-level gate passed.
- Performance Testing: `not-needed-now`. P4 has no accepted performance target.
- Guided Progress Review: deferred by current authority until the installed P6 candidate exists.
- Unassisted Goal Testing: `not-needed-now`. Automated and maintainer review answer the current architecture and safety decision.

### P4 Gate

Tasks t1 through t13 are complete. Acceptance criteria A20 through A27 are satisfied within the recorded evidence and limits.

Harness receipt history is separate from current caller proof. Setup and recovery use the accepted service boundary. Store-free work remains available. New projection writes have one owner for each fact. The owner authorized closeout on 2026-09-19. P4 is closed.

P5 and later implementation still need separate explicit approval.

## P5 Compatibility Bridge and Symptom Closure

### Status

P5 implementation and closeout are complete. The owner authorized closeout, staging, and commit on 2026-09-19. P5 is closed.

Concurrent W23 files remain outside the P5 change set.

### Implementation Result

- Store schema 5 is the current target. Ordinary Store writers reject schemas 1 through 4 and direct the user to reviewed setup. Only the reviewed setup and update migration paths can apply the bridge.
- `previewStoreCompatibilityBridge` reads without writes. It classifies absent, supported old, current, malformed, corrupt, unclear, and newer Store state. It reports Store, project, and native changes, blockers, and one next action.
- The bridge register records the old form, target form, first bridge version, owner, old-write stop proof, remaining-state check, exit condition, removal phase, required tests, retention rule, and separate deletion approval for seven bridge classes.
- Conversion creates and verifies one private SQLite backup before the first schema write. One shared `tool_operations` record covers the conversion. The schema change and final operation state use one transaction.
- Schema 5 removes active checkout device and inode columns after it archives the exact old strings. It copies checkpoint receipts to target receipt history. It removes legacy projection selection and provider mirrors from active ledger JSON. It keeps old checkpoint and transfer rows as private history because deletion still needs separate approval.
- Setup applies the Store bridge before legacy import or project mutation. A completed JSON result reads the Store again, so it reports the post-conversion state instead of a stale pending plan.
- A failed conversion rolls the database transaction back. The verified backup remains available. Malformed, conflicting, corrupt, unclear, or newer state stays unchanged and receives a safe stop result.
- The append-only symptom table now records the final source result for checkout object numbers, package updates, Windows parity, setup recovery, projection mirrors, and authority separation.

### Human Experience Review

Reviewer: Codex agent.

Review surface: the built local CLI and focused P5 fixtures for preview, conversion, repeat use, interruption, quarantine, unsupported state, rollback, and recovery. This is not the final installed package.

| Promise | Observation | Conclusion | Limit and next action |
| --- | --- | --- | --- |
| HX-1: the same supported action keeps the same meaning, safety result, and recovery path on Windows, macOS, and Linux | P5 uses the P3 platform service for file-space and Store-path work. It adds no host-specific identity or recovery path. | Preserved for the P5 source boundary. | P6 must run the final installed package on Windows, macOS, and Linux. |
| HX-2: a person can identify state, effects, blockers, and one safe next action | The preview reports Store, project, and native changes. Malformed and newer state report a clear block and one safe next action without changing the database. | Satisfied for the P5 source and command-result boundary. | P6 must inspect the final installed human and machine-readable output. |
| HX-3: Store loss or denial stops only the operation that needs the Store | Preview is read-only. Unsupported and unsafe Store state stops conversion without project or native changes. P5 adds no Store dependency to independent repository reads. | Preserved for the P5 bridge boundary. | P6 must repeat Store-free and Store-blocked cases with the installed package. |
| HX-4: an existing installation can convert without losing project files, native entries, or useful operation evidence | Supported fixtures preserve user bytes, stable identifiers, pending recovery, receipt history, and retained transfer history. Conversion archives old identity values before it removes active columns. | Satisfied for supported P5 source fixtures. | P6 must prove the same result with the final installed package. |
| HX-5: setup and recovery do not form a closed dependency loop | Reviewed setup can start the bridge. Ordinary writers refuse old schemas. A failed conversion rolls back to the old schema, keeps the verified backup, and leaves one valid retry path. Repeated conversion creates no second backup or operation. | Satisfied for the P5 source setup and recovery boundary. | P6 must inspect normal installed setup, failure, retry, and recovery paths. |

This agent review shows that the source behavior, results, and recorded evidence agree. It does not claim a person's lived ease, confidence, or acceptance. P6 still owns the final installed-package review.

### Validation Evidence

| Check | Result |
| --- | --- |
| CLI build | Passed with `npm run build -w packages/cli`. |
| Focused P5 and regression gate | Passed 188 of 188 tests across the P5 bridge, migration safety, global Store lifecycle, installation state, and the complete CLI test file. |
| Full CLI set | Passed 1,346 tests and skipped 5. One separate W23 risk-list fixture failed because it expects R-001 through R-035 while the active register also contains R-036 through R-038. |
| Default validation | Passed 52 tests. The same separate W23 risk-list fixture was the only failure. |
| Package smoke preparation | Passed 13 of 13 smoke-harness tests. |
| Read-only preview | Schemas 1 through 4 kept identical database bytes during preview. |
| Conversion and repeat | The schema-4 fixture preserved user bytes, stable ids, pending recovery, receipt history, and retained transfer history. A repeat made no second backup or conversion. |
| Interruption and rollback | An injected schema conversion failure restored schema version 4 and every checked old row and column. The verified before backup remained present. |
| Unsafe state | Malformed state was quarantined. Newer state was unsupported. Both database files remained byte-identical. |
| Diff check | Passed with `git diff --check` during implementation. |

The W23 fixture does not exercise the P5 bridge, migration, setup, Store, or recovery paths. It remains a visible validation limit. P5 implementation does not mark it as fixed.

### Testing Decisions

- Automated Implementation Testing: complete. The blocking P5 source gate passed.
- Performance Testing: `not-needed-now`. P5 has no accepted duration target.
- Guided Progress Review: `not-needed-now` for source implementation. P6 owns the installed result.
- Unassisted Goal Testing: `not-needed-now`. The accepted automated fixtures answer the P5 source safety decision.

### P5 Gate

Tasks t1 through t16 are complete. Acceptance criteria A28 through A35 have source-level evidence within the recorded P6 and W23 limits.

The owner authorized closeout on 2026-09-19. P5 is closed. P6 needs separate explicit authority.

## P6 Real-Platform Package Proof and Closeout

### Status

P6 implementation and closeout are complete. The owner authorized closeout, staging, and commit on 2026-09-19. P6 and W22 R0 are closed.

Pull request [#12](https://github.com/brucewaynedecoy/make-docs/pull/12) merged the proved implementation into `main` as `b0840efaea1368c32526ae2d2a15b4a94ef49c4d`. Concurrent W23 files remain outside the P6 closeout change set.

### Installed-Package Proof Route

- The Platform safety workflow builds one package only after the source suite, proof-harness tests, and default validation pass.
- The candidate record binds the source revision, package name, version, file name, SHA-256 digest, and byte size.
- Each real-platform job downloads the same artifact and verifies its digest and size before use.
- Each job installs the package into an isolated npm prefix. It runs the installed package entry with isolated home and Store roots.
- Each platform record includes the installed case name, public state, safety result, next action, file result, Store result, and native-entry result.
- The comparison job requires one passing result from Windows, macOS, and Linux. It rejects a missing platform, a repeated platform, a different candidate, source-checkout product execution, or an extract-only package check.
- The comparison job also rejects a missing source safety matrix or a different installed public contract.
- The workflow keeps the P3 platform contract. The installed-package route adds package-manager and packaged-output proof. It does not reduce the core parity target.

### Local Implementation Evidence

| Check | Result |
| --- | --- |
| Proof-harness tests | Passed: 15 of 15. |
| Focused safety matrix | Passed: 224 of 224 on macOS. The workflow runs this same matrix on Windows, macOS, and Linux. |
| Exact package install and smoke on macOS | Passed from an isolated `npm install`: `@brucewaynedecoy/make-docs@2.0.0-rc`, SHA-256 `b4f491a01e81dac6b3746cbe44a749dced3c90333c9fadf51380b85ce3333940`, 1,535,435 bytes. |
| Full CLI suite | 1,346 passed and 5 skipped. One consistency test failed because the separate W23 draft adds R-036 through R-038 while its test update is not in this P6 change. |
| Default validation | 52 passed. The same separate W23 risk-list test failed. |
| Diff whitespace check | Passed. |

The local package uses the P5 commit as its recorded source revision. It is only a harness check. It is not the final P6 candidate because the P6 workflow changes are not committed.

### Final Package and Workflow Evidence

Workflow [35483206273](https://github.com/brucewaynedecoy/make-docs/actions/runs/35483206273) completed successfully for pull request #12.

| Fact | Result |
| --- | --- |
| PR head revision | `6222f1f409ccd2ac84a1b106654b13149a56b072` |
| GitHub Actions tested revision | `ce8052f719d5d85f25e10dc5d866de3e7646c490`, the pull-request test merge revision recorded by the candidate |
| Package | `@brucewaynedecoy/make-docs@2.0.0-rc` |
| File | `brucewaynedecoy-make-docs-2.0.0-rc.tgz` |
| Package SHA-256 | `d45eab81fe825206a62e997d10a5a47331f49741ebfb62adc00fd172c9d25d15` |
| Package size | 1,538,348 bytes |
| Build and source gate | Passed the full CLI suite, proof-harness tests, and default validation before packaging. |
| Real-platform source gate | Passed the same required 13-file safety matrix on `ubuntu-latest`, `macos-latest`, and `windows-latest`. |
| Installed-package gate | Passed from an isolated package installation, home, and Store root on all three hosts. Product execution did not use the source checkout. |
| Comparison gate | Passed. It found one result per required host, one candidate identity, one installed public contract, and no source-checkout or extract-only substitute. |

The installed contract matched on every host:

| Case | Public state | Safety result | Preservation or next action |
| --- | --- | --- | --- |
| Fresh setup | `ready` | `applied` | Managed files created; Store schema 5 verified. |
| Current repeat | `ready` | `unchanged` | Managed files and native entries unchanged. |
| Supported old-state bridge | `ready` | `converted-and-preserved` | User bytes preserved; legacy ledger transferred. |
| Store-free resource read | `available` | `store-not-opened` | No project state written. |
| Selected native Skill lifecycle | `ready` | `applied-and-reviewed-removal` | Owned Skill files and Codex and Claude Code entries managed. |
| Project removal | `unregistered` | `managed-removed-unmanaged-preserved` | Custom and backup files preserved; ownership pruned and history retained. |
| Ambiguous tool removal | `blocked` | `safe-stop` | Project files, Store state, and native entries preserved; use the owning install manager. |

### Authority, Risk, and Symptom Reconciliation

- PRDs 10, 16, 24, 25, 28, 38, and 39 keep the accepted platform, authority, Store, setup, resource, output, and recovery rules. No P6 result reduced core parity or changed the approved MCP operation boundary.
- D-039 through D-041 and R-036 through R-038 now record exact close evidence in PRD 03. No other risk item changed.
- S-017 through S-023 append the final P6 results without rewriting the earlier symptom evidence.
- Every P1 `keep`, `rework`, or `remove` decision has an implemented owner, proof path, and rebuild or retention rule through P2 through P5. No accepted W22 obligation remains open.
- Compatibility readers remain only where retained old history still has an accepted purpose and exit rule. They are not writable authority. Old-history deletion still needs separate approval.
- The proved package is not published or released by this closeout. Publication and release still need separate authority.

### P6 Human Experience Review

Reviewer: Codex agent.

Review surface: the exact candidate record, the three installed-package result files, the final comparison record, and the passing source and installed workflow jobs. The review inspected the actual recorded CLI states, safety results, preservation results, and next actions. It did not use source-checkout product execution as installed proof.

| Promise | Observation | Conclusion | Limit and next action |
| --- | --- | --- | --- |
| HX-1: equal action meaning and recovery on Windows, macOS, and Linux | Ubuntu, macOS, and Windows used the same package and returned the same installed contract. The required source matrix also passed on every host. | Satisfied for the proved candidate. | Rerun the gate for each later candidate. A missing host remains a defect unless the owner approves a time-bounded exception. |
| HX-2: clear state and one next safe action | Success, unchanged, converted, unavailable-Store, removed, and blocked results use distinct public states and safety results. The blocked removal case gives one action and preserves all state. | Satisfied for the reviewed CLI and machine-readable results. | This is an agent evidence review. It does not claim a person's lived ease or confidence. |
| HX-3: independent work continues without Store access | Each installed host read shipped resources with an absent Store, created no Store, and wrote no project state. The source access matrix also passed. | Satisfied for the proved Store-free and scoped-stop boundary. | Keep Store-free resource and independent-work cases in the matrix. |
| HX-4: checkout moves and valid package updates do not fail only because low-level identity changed | The source matrix passed move, update, path, identity, conversion, interruption, and rollback cases on each host. The installed old-state bridge preserved user bytes and transferred the ledger. | Satisfied for the approved source-plus-installed proof model. | Detailed adversarial cases run from the same tested source on each host. The installed contract uses the seven named end-to-end cases rather than repeating every source fixture through the package entry. |
| HX-5: setup and repair use one open recovery path | Fresh setup, repeat, bridge, blocked removal, and removal passed through the installed package. Source failure and recovery cases passed on every host. | Satisfied for the proved setup and recovery contract. | Keep failure injection in source tests and normal installed outcomes in the package gate. |
| HX-6: every retained mechanism has a clear purpose and authority class | The mechanism ledger, PRD field authority, bridge register, final risk closures, and final symptom rows agree. Retained compatibility readers have exit rules and no old-form writer remains. | Satisfied for W22 R0. | Deleting retained old history remains a separate approval. Later architecture changes must update the owning PRD and proof. |

This review supports only the stated observable conclusions. No lived-human feedback was requested or recorded. Current authority makes that feedback optional and non-blocking.

### Testing Decisions

- Automated Implementation Testing: complete and passed. The blocking source, package, real-platform, and comparison gates passed.
- Performance Testing: `not-needed-now`. No accepted P6 performance target exists.
- Guided Progress Review: optional and non-blocking. No owner feedback was recorded.
- Unassisted Goal Testing: `not-needed-now`. The current decision concerned architecture parity, safety, and preservation, which the accepted automated and agent review evidence answers.

The workflow emitted maintenance warnings about older action runtimes. Those warnings did not change the package, platform, or comparison results. CodeRabbit skipped its review because the pull request exceeded its file limit. CodeRabbit review was not a P6 acceptance gate.

### Optional Experience Handoff

If the owner wants later feedback, use a disposable project:

1. Run setup or status. Notice the public state and next safe action before technical detail.
2. Move the checkout and run status again. Notice that the checkout remains valid without durable device or inode identity.
3. Apply a valid package update and repeat status or repair. Notice that current proof, not an old executable hash, controls access.

This handoff is optional. Silence or no feedback does not reopen P6.

### P6 Gate

Tasks t1 through t13 are complete. Acceptance criteria A36 through A44 are satisfied within the recorded evidence and limits.

One exact package passed the required source and installed-package gates on Windows, macOS, and Linux. The final comparison passed. The six W22 PRD risk records and all known W22 symptom chains have exact close evidence. No W22 deferred obligation or platform exception remains open.

The owner authorized closeout on 2026-09-19. P6 and W22 R0 are closed. Publication, release, old-history deletion, and any push of this closeout commit remain separate actions.

## P7 Setup Bridge Order and Recovery Loop Repair

### Status

P7 Stage 1 source repair, three authentic older-package fixtures, focused validation, and corrective review are complete as of 2026-09-22. Tasks t1 through t8 and A45 through A49 pass. Stage 2 exact-candidate and three-platform installed-package proof remain open. P7 and D-038 remain open.

The final Stage 1 source result includes the checkpoint-3 regression, three exact authentic older-package fixtures, isolated plain-setup upgrade proof, focused and full validation, package build, TypeScript checks, and an independent read-only audit with no material defects. Stage 1 made no live CLI installation or live Store change. It did not stage, commit, push, publish, release, or start an external workflow.

### Prior Source Implementation Result - Invalidated For Acceptance

The following result remains as historical source evidence. It proved the first reported command loop, but it did not prove end-to-end upgrade convergence. The later installed counterevidence invalidates it for A45 through A49 and Stage 1 closeout.

- [The full setup coordinator](../../../packages/cli/src/cli.ts) now treats the reviewed Store bridge as a This-computer prerequisite. It applies and verifies that bridge before a Store-backed machine step.
- The Store prerequisite has the This-computer approval boundary. Project approval remains separate.
- [Direct system setup](../../../packages/cli/src/setup-system.ts) stays machine-level. A supported legacy Store points to full setup for the bridge. Direct system setup does not own project migration.
- New harness intent is saved only after the native machine state verifies. An interrupted machine change keeps one pending operation and does not claim unfulfilled new intent.
- Human and JSON failure results name the failed condition, the mutation state, and one action that can change the condition.
- Full setup preserves Store backup and journal behavior, user-owned native content, project approval, Store-free work, and the existing platform support boundary.

### Prior Regression Fixture - Incomplete

[The exact CLI regression](../../../packages/cli/tests/cli.test.ts) uses a schema 3 Store, a drifted managed Codex MCP entry, a newly selected Claude Code MCP method, user-owned Codex and Claude content, and reviewed project work. The earlier captured terminal evidence records the pre-fix reciprocal directions. The fixture reconstructs those preconditions without the owner's live Store.

The fixed results are:

1. Full dry-run reports the schema 3 bridge, Codex drift, Claude incompleteness, and no mutation.
2. Direct system setup names schema 3 and points to full setup. It does not point back to system setup. It changes no Store, project, or native file.
3. Full setup converts the Store to schema 6 before machine apply. It repairs Codex, adds Claude, preserves the user-owned Codex model and Claude theme, and applies project work only after its separate approval.
4. New Codex and Claude intent exists only after native verification.
5. Repeat full setup is a no-op for the Store, both machine routes, and project files.

[The interruption regression](../../../packages/cli/tests/w19-r6-setup.test.ts) proves that an interrupted native apply leaves one resumable pending operation and no new global intent. A retry resumes the recorded operation, verifies the native state, clears the pending operation, and then saves intent.

Injected Store prerequisite failure proves that project mutation stays `none`, machine apply does not start, the Store reports `partial` or its observed state, and the next action addresses the Store access failure. A Store-only bridge also requires This-computer approval.

This fixture did not use an authentic supported older package to create the full installation. It did not model the later `partial-install` state with modified managed files and old managed ownership. It did not test agreement between the displayed plan, frozen classification, migration coordinator, and executor. It also did not require every predictable safety check to pass before operation creation. These gaps make the earlier fixture incomplete for P7 acceptance.

### Installed Counterevidence That Reopened Stage 1

The owner ran the current installed CLI against the Make Docs project after the prior repair.

1. `make-docs project state recover 6a20948a-d104-42bc-af61-e895cbb51bec --rollback --target-root <project>` restored the prior state.
2. `make-docs project state status` reported installation state `ready`, installed version `2.0.0-rc`, and no recovery need.
3. Plain `make-docs setup` classified the project as `partial-install` with disposition `migrate-with-review`.
4. Setup reported 108 evaluated files, 107 current files, and one planned skip for `.make-docs/archive/legacy-playbooks/agent/make-docs-lifecycle.playbook.md`.
5. Setup listed six modified managed files and requested project approval.
6. The owner approved the project work.
7. Migration checkpoint 3 rejected the reviewed work because the frozen classification did not permit `ambiguous-ownership` mutation.
8. Setup created pending operation `9b687b36-5394-4bae-879e-416937eaa33d` and directed the owner to project-state status and recovery commands.

The displayed planner result and the checkpoint-3 classifier result conflict. The executor started an operation before the predictable rejection. Plain setup did not provide the normal resume or restore choice. This trace disproves A45 through A49 and the prior Stage 1 Human Experience Review.

### Prior Stage 1 Validation Evidence - Incomplete

| Check | Result |
| --- | --- |
| Focused setup, Store remediation, and exact loop tests | Passed: 145 of 145 in `cli.test.ts`, `w19-r6-setup.test.ts`, and `w19-r8-store-access-remediation.test.ts`. |
| Full CLI suite | Passed: 90 test files; 1,442 tests passed and 5 skipped. One test file was skipped by its existing contract. |
| Package proof-harness tests | Passed: 19 of 19. |
| Default validation | Passed: 53 of 53. |
| TypeScript package build | Passed. |
| Diff whitespace check | Passed. |

The local results remain valid for the exact cases that passed. They are incomplete for P7 acceptance. They did not cover the installed `partial-install` and `ambiguous-ownership` path, authentic older-package installation state, final-plan agreement, all safety checks before operation creation, or plain-setup resume and restore.

### Prior P7 Human Experience Review - Stage 1 Claim Withdrawn

Reviewer: Codex agent.

Review surface: isolated human output, canonical JSON output, the exact regression fixture, failure injection, interruption and resume results, approval rejection, and repeat no-op results.

| Promise | Observation | Conclusion | Limit and next action |
| --- | --- | --- | --- |
| HX-2: clear state and one next safe action | The source cases gave one action for the first loop. The installed project later received an approved plan, a conflicting checkpoint-3 rejection, and a deep recovery direction. | Not satisfied for Stage 1. The earlier claim is withdrawn. | Prove that the approved plan and executable plan agree, and that predictable failures stop before operation creation. |
| HX-5: setup and repair use one open recovery path | The source cases resumed one native operation. The installed project later required deep project-state commands after plain setup created a pending operation. | Not satisfied for Stage 1. The earlier claim is withdrawn. | Plain setup must offer the valid resume or restore action for interrupted project work. |
| HX-1, HX-3, HX-4, and HX-6 preserved boundaries | The earlier source suite did not show a boundary regression, but the current end-to-end repair is incomplete. | Not yet accepted for the reopened Stage 1 result. | Repeat the source checks and the authentic installed matrix after the repair. |

This review no longer supports Stage 1 closeout. The installed counterevidence is the stronger observation for the affected human path. A new Human Experience Review waits for the repaired source and installed results.

### Interim Stage 1 Source Result And Corrective Review

- Authentic old-package flows reached current plain setup and avoided the earlier checkpoint-3 dead end.
- The interim tests supported ownership classification, migration admission, native safety, stale-state checks, and operation timing for the cases that ran.
- Corrective review found that approval could occur in the wrong order.
- Corrective review found that migration backup preflight did not reject a regular file at `.make-docs/backup` before operation creation.
- Corrective review found that the one-recovery guard was incomplete.
- Corrective review found that recovery routing after import was incomplete.
- Corrective review found that JSON output did not fully report mutation state.
- A later fail-closed regression found that a retired Store resource could be silently reintroduced.
- The final Stage 1 repair closed each finding. This interim result remains as the reason for the corrective work.

### Authentic Older-Package Fixture Evidence

| Fixture | Exact identity | Digest and provenance | Result |
| --- | --- | --- | --- |
| `packages/cli/tests/fixtures/legacy-packages/make-docs-0.1.0.tgz` | Historical Make Docs 0.1.0 archive. It was not published under either current npm name. Its source bodies match Git commit `55b0cbec5526f5a1cd32c8ba284e4c00498e84c6`. | SHA-256 `aa9c10e20a49dfeb5afbcd3e26fd9873d4362311fe277145be5a4332a80d6acb`; size `229393` bytes. | The authentic old installation upgrades through current plain setup. |
| `packages/cli/tests/fixtures/legacy-packages/brucewaynedecoy-make-docs-1.0.0-rc.1.tgz` | Exact published npm archive for `@brucewaynedecoy/make-docs@1.0.0-rc.1`. | SHA-256 `dfad170ceffc6e74c2afd397b390be5c900bd2e74e63491598c394382e209d71`; size `231478` bytes; npm SHA-1 `684a0791879e1218ddb7148d46c0adad55c7405b`; npm integrity `sha512-lF8MH7lRxAclI5ewIK4johoerXhD9EpJlGbXpDKOjtHGdl8kCPXb8xtNSeAivHoYgYtBsSTF3x4wxfTwSrhzyg==`. | The authentic old installation upgrades through current plain setup. |
| `packages/cli/tests/fixtures/legacy-packages/brucewaynedecoy-make-docs-2.0.0-rc-f5fd5579.tgz` | Historical schema-3 source package from commit `f5fd5579849debf87f5a700dd8b8a656c4f01e87`. Its 109 source-map source bodies byte-match that commit. Path-independent archive reproducibility is not claimed. | SHA-256 `6008ee431f8e42d3714da8df512a934aa5e3f5d930a7a0c8104a17768a0fb878`; size `1508366` bytes. | Before repair, the fixture reproduces the checkpoint-3 failure. After repair, plain setup preserves the six exact changed managed files and archived playbook bytes, adopts the six files as project-owned with current digests, leaves no pending operation, and does not repeat conflict review on the immediate second setup. |

The fixture provenance is recorded in `packages/cli/tests/fixtures/legacy-packages/README.md`. The published rc.1 package uses the old bare install command and writes manifest schema 1. The fixture preserves those facts instead of rewriting them into the current install form. All three exact archive paths are durable test fixtures and are no longer excluded by `.gitignore`, so a clean checkout can run the same cases after the files enter the repository. This evidence does not claim that the current working-tree archives are already committed.

### Interim Stage 1 Validation Evidence

| Check | Result |
| --- | --- |
| Focused seven-file P7 run | Passed: 191 of 191 tests. |
| Authentic 0.1.0 plain-setup upgrade | Passed. |
| Exact published 1.0.0-rc.1 plain-setup upgrade | Passed. |
| Default validation | Passed: 53 of 53. |
| Full CLI suite | Passed: 92 test files; 1 test file skipped; 1,458 tests passed and 5 skipped. |
| TypeScript check | Passed. |
| Package build | Passed. |
| Diff whitespace check | Passed. |

These results proved that the first two authentic older-package fixtures could upgrade through current plain setup. They were provisional because the corrective review gaps remained open. They did not identify or prove the final repaired package candidate on Windows, macOS, and Linux.

### Interim P7 Human Experience Review - Stage 1

Reviewer: Codex agent.

Review surface: the repaired human and JSON setup results, checkpoint-3 regression, interruption, resume, restore, repeat, no-op, and both authentic older-package plain-setup upgrades.

| Promise | Observation | Conclusion | Limit and next action |
| --- | --- | --- | --- |
| HX-2: clear state and one next safe action | Both authentic old installations upgrade through plain setup, but final review found approval-order, migration backup preflight, and JSON mutation-state gaps. | Not yet satisfied for Stage 1. | Correct the three gaps and repeat the focused blocked, human, and JSON review. |
| HX-5: setup and repair use one open recovery path | Both authentic old installations upgrade through plain setup, but final review found one-recovery guard and post-import recovery routing gaps. | Not yet satisfied for Stage 1. | Correct the two gaps and repeat interruption, resume, restore, and post-import cases. |
| HX-1, HX-3, HX-4, and HX-6 preserved boundaries | The focused and full suites did not show a boundary regression in the cases that ran. | Provisional until corrected Stage 1 validation passes. | Repeat the required source checks after the five fixes. |

This review does not support Stage 1 closeout. It does not claim real-platform installed parity, live owner-Store repair, or a lived-human reaction.

### Final Stage 1 Source Result

- Setup now derives one final project plan from verified post-prerequisite state. Approval and execution use the same managed-path actions.
- Ownership, migration admission, migration backup destination, native safety, approval, stale-state, and operation checks finish before operation creation or the first durable write.
- A regular file at `.make-docs/backup` fails before operation creation and leaves no pending operation.
- Plain setup provides the valid resume or restore route. Deep project-state recovery remains a support and automation control.
- Human and JSON output report the same mutation state and one action that can change the failed condition.
- The one-recovery guard and post-import recovery route pass their focused cases.
- The retired-resource regression first failed closed. The repair keeps the retired resource retired without weakening the fail-closed migration rule.
- The schema-3 fixture reproduced the original checkpoint-3 failure before repair. After repair, it preserves these six exact changed managed files:
  - `.make-docs/system/contracts/output-contract.md`
  - `.make-docs/system/references/execution-workflow.md`
  - `.make-docs/system/contracts/human-experience-contract.md`
  - `.make-docs/system/references/human-experience.md`
  - `.make-docs/system/contracts/performance-evidence-governance.md`
  - `.make-docs/system/references/performance-evidence.md`
- The schema-3 repair also preserves the exact bytes of `.make-docs/archive/legacy-playbooks/agent/make-docs-lifecycle.playbook.md`.
- The six changed managed files become project-owned with their current digests. Setup leaves no pending operation. An immediate second setup does not repeat conflict review.

### Final Stage 1 Validation Evidence

| Check | Result |
| --- | --- |
| Focused P7 source suite | Passed: 6 test files; 182 tests passed. |
| Three authentic package fixtures | Passed: 0.1.0, published 1.0.0-rc.1, and historical schema-3 source package. |
| Default validation | Passed: 53 of 53. |
| TypeScript check | Passed. |
| Package build | Passed. |
| Independent read-only audit | Passed with no material defects. |
| First full-suite attempt and corrective checks | Failed: one backup test exceeded its 15-second test limit, and two retired-resource tests exposed a fail-closed regression. The backup case passed alone: 1 of 1. The retired-resource repair passed its focused checks. |
| Final full CLI suite | Passed with the standard npm test command and an isolated `MAKE_DOCS_HOME`: 92 test files passed and 1 test file skipped; 1,468 tests passed and 5 installed-platform tests skipped; 1,473 tests total. The backup case passed in this run in 11.855 seconds. |

These source results satisfy t1 through t8 and A45 through A49. They do not identify or prove the exact Stage 2 candidate on Windows, macOS, and Linux.

### P7 Human Experience Review - Final Stage 1 Result

Reviewer: Codex agent.

Review surface: repaired human and JSON setup results, checkpoint-3 regression, migration backup block, interruption, resume, restore, post-import recovery, repeat, no-op, retired-resource safety, and all three authentic older-package plain-setup upgrades.

| Promise | Observation | Conclusion | Limit and next action |
| --- | --- | --- | --- |
| HX-2: clear state and one next safe action | Approval and execution now use one plan. Predictable failures block before operation creation. Human and JSON results show the same mutation state and one condition-changing action. | Satisfied for the Stage 1 isolated source boundary. | Repeat the result with one exact installed candidate on all three required operating systems. |
| HX-5: setup and repair use one open recovery path | Plain setup now offers the valid resume or restore route. The one-recovery guard and post-import routing pass. The immediate second schema-3 setup does not repeat conflict review. | Satisfied for the Stage 1 isolated source boundary. | Repeat failure, interruption, resume, restore, and repeat with the Stage 2 candidate. |
| HX-1, HX-3, HX-4, and HX-6 preserved boundaries | The focused and full source suites, authentic fixtures, and independent audit found no material boundary defect. | Preserved for the Stage 1 isolated source boundary. | Real-platform installed parity remains a Stage 2 gate. |

This review supports Stage 1 closeout only. It does not claim real-platform installed parity, live owner-Store repair, or a lived-human reaction.

### Testing Decisions

- Automated Implementation Testing: Stage 1 passed. Stage 2 exact-candidate and three-platform installed proof remain required and blocking.
- Performance Testing: `not-needed-now`. No accepted performance target depends on setup duration.
- Guided Progress Review: The Stage 1 corrective review passed. Review remains useful for the final installed output.
- Unassisted Goal Testing: `not-needed-now`. Deterministic source and installed-package evidence can answer the current recovery question.

### P7 Gate

Tasks t1 through t8 are complete. Acceptance criteria A45 through A49 are satisfied by the final Stage 1 source result. The earlier failure evidence and interim review gaps remain part of the record.

Tasks t9 through t15 remain open. Acceptance criteria A50 through A52 remain open. No exact repaired P7 candidate identity, three-platform installed run, final comparison, installed Human Experience Review, or corrective closeout exists yet.

The next gate is Stage 2. Build one exact repaired candidate with recorded package and install identity. Then run comparable installed proof on Windows, macOS, and Linux. Local `just install-cli` and the live plain-setup retry remain separate later owner actions.

P7 and D-038 remain open. A reset, detach, quarantine-and-reinstall, or forced reinstall capability remains outside P7 without separate owner approval. Staging, commit, push, external workflow execution, live owner-Store verification, and closeout each require their applicable next authority.
