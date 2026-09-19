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
