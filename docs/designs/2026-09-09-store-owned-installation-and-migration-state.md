---
title: "Store-Owned Installation and Migration State"
kind: "design"
status: "active"
coordinate: "W19 R3"
follow_on:
  route: "change-plan"
  next_prompt: "../../.make-docs/system/prompts/designs-to-plan-change.prompt.md"
  why: "Correct existing installation, migration, and Store authority before implementation."
  coordinate_handoff: "Carry W19 R3 as the interrupt revision of W19 R1. Keep W20 R0 paused until this interrupt is complete."
---

# Store-Owned Installation and Migration State

## Purpose

Put all Make Docs installation and operation state in the global Make Docs Store. Stop the CLI from creating project-local state as a second source of truth. Preserve project knowledge, file backups, and safe recovery.

The user reviewed and accepted this design, the plan, PRD updates, and work backlog on 2026-09-09. The user requested a package commit followed by an implementation plan. Implementation has not started. This acceptance record does not authorize a live transfer.

## Context

The September 9 review found 11 migration receipts and `legacy-quiescence.json` under `.make-docs/state/` after the local dogfood update. The CLI writes these paths by design. The installed CLI contains the same writers. Tests require the local files or omit the folder from comparisons.

[PRD 38](../prd/38-global-store-and-project-state.md) gives the Store ownership of tool state but also requires a local migration receipt and makes `.make-docs/manifest.json` the main installation record. [PRD 18](../prd/18-compatibility-classification-and-migration-safety.md) and [PRD 39](../prd/39-cli-command-model-and-operation-registry.md) carry related local-state rules. Removing the deleted Phase skill did not remove those contracts or writers. D-031 in the [risk register](../prd/03-open-questions-and-risk-register.md) remains the tracked defect.

The user has now set the boundary: installation, upgrade, migration, and Make Docs operation state must live in the global Store and must be managed through the CLI. Project history, work backlog status, and other project knowledge may remain local. This corrects the W19 R1 delivery. W19 R3 is an interrupt revision. W20 R0 stays paused until this interrupt is complete. W19 R2 and later unrelated waves keep their scope.

## Human Experience Intent

Impact: `direct`

Affected humans: Make Docs users who install or update a project, and maintainers who inspect changes or recover a failed operation.

Human goal or effect: Update a project without unexplained state files and recover a stopped update from one clear CLI path.

Experience promises:

- HX-1: After a successful transfer, `.make-docs/state/` is absent and stays absent after later supported operations. The CLI explains the removal of the old installation manifest before it applies the reviewed change.
- HX-2: One status command shows the project, checkout, current installation, and whether an operation is complete, blocked, or waiting for recovery. It gives the next safe command when action is needed.
- HX-3: A failed update keeps the user's files and the evidence needed for recovery. Missing or damaged Store data produces a clear stop, not a new local record or an invented claim of ownership.
- HX-4: Project history, work files, settings, and backup file copies remain available. The CLI names the exact legacy records it will transfer or leave in place.

Complexity kept out of the human path:

- Users do not edit SQLite, choose internal lock keys, or compare receipt hashes by hand.
- Users do not repair a failed migration by deleting `.make-docs/state/` or copying a receipt between machines.
- Users do not need to understand internal checkpoint numbers to choose the next safe step.

Evidence required:

- Planned before-and-after file inventories for a legacy transfer and later update, tied to HX-1 and HX-4.
- Planned packaged CLI transcripts for success, a blocked Store, interrupted recovery, and an unregistered clone, tied to HX-2 and HX-3.
- Planned fault and ownership tests proving that recovery preserves changed user files and unrelated Store rows, tied to HX-3.
- Planned Human Experience Review of those real results. Record each promise, evidence, observation, conclusion, reviewer, and limit. Agent inspection cannot certify lived ease or confidence.

## Decision

### D1. One Store owns tool state

The Store owns the current installation ledger, resource provenance, installed versions, applied content hashes, operation progress, migration receipts, pending conflict decisions, locks, writer ownership, and recovery metadata. The installation ledger is the operational data now held in `.make-docs/manifest.json`. It is not a cache that the CLI can silently rebuild from project files.

All CLI, registry, and MCP paths use the same state service. Existing Store tables and transaction helpers are reused where they fit. Add only the typed records and fields needed for installation and migration. Do not build a generic event engine or copy every old JSON file into a new table without a current use.

The CLI must never use `.make-docs/state/`, another project folder, project Git metadata, or a local manifest as an operational fallback. Failure to use the required Store stops the operation before project mutation. Read-only inspection can still explain the failure without creating the Store or writing the project.

If the CLI is not installed or cannot be invoked, ordinary project work can continue. The agent reports that Make Docs state capture was unavailable. It must not claim a successful capture, write directly to the Store, create local fallback state, or queue a later write. Project documents, history breadcrumbs, and optional work backlog updates remain valid project content. They must not become substitutes for Make Docs operational records.

The same rule applies when the CLI is present but optional general lifecycle capture fails. Required state for CLI-executed installs, upgrades, migrations, and other managed changes is different. Those operations already have the CLI available and must save their required Store records. If that fails, stop before further project changes and preserve recovery evidence. Optional capture failure never waives this rule. The Store preparation rules in D4 apply to these managed operations, not to ordinary project edits.

### D2. Local files contain knowledge and payloads

| Local content | Rule |
| --- | --- |
| `.make-docs/config.yaml` | Keep declarative settings and the portable project identifier. Do not store progress, installed versions, last-run results, or applied-file ownership here. |
| Routers, selected resources, scripts, and agent assets | Keep installed content where the product contract places it. Store applied hashes and ownership in the Store. |
| Project designs, PRDs, plans, work status, guides, and history | Keep project knowledge local. History is a human breadcrumb, not an input that drives installation recovery. |
| `.make-docs/backup/**` and reviewed legacy backup copies | Keep file copies local under the existing backup contract. Store the snapshot identity, verified inventory, checksums, recovery scope, and operation link in the Store. A copied legacy metadata file is inert source evidence. It cannot become the active recovery record. |
| Conflict or archive content copies | Keep file payloads only where an existing content contract permits them. Store any live decision, progress, or ownership metadata in the Store. This scope changes metadata ownership; it does not redesign archive or conflict content layout. |
| `.make-docs/manifest.json` and `.make-docs/state/**` | Accept only as legacy transfer inputs. Remove verified obsolete records after Store commit and read-back. Do not replace the manifest with a renamed local operational record. |

The CLI must itemize user-visible removal and format changes in its existing setup or update review. It must not call these changes an invisible cleanup.

### D3. Project identity differs from checkout identity

The project identifier is portable, declarative project knowledge. A clone or linked checkout may share that identifier. The Store assigns a separate checkout binding to each working directory so one clone cannot overwrite another clone's installation or pending operation. Paths locate checkouts; they are not project identity.

Before a project identifier exists, use a Store-resident bootstrap lock keyed by the canonical target path. Validate and lock before writing the identifier. Bind the operation to its project and checkout in the Store before the first managed file mutation. Record the chosen identifier in the pending operation so a crash after config creation can resume without minting a second identity.

For an unchanged directory moved on the same machine, rebind only after identity and file evidence agree and the old binding is inactive. Ambiguous moves stop for an explicit reviewed selection. A clone on another machine has no local installation history. Status reports `unregistered` or `ownership-unverified`. Reviewed setup can establish a fresh installation baseline from verified source and file evidence. It must state which earlier provenance is unavailable. It must not claim to recover history from a project identifier alone or overwrite unverified user content.

### D4. Validate and prepare the Store before any project write

Resolve the Store root through the existing platform/default and explicit override contract. Canonicalize existing path components and symbolic links before use. Reject a Store root inside the target project, its managed directories, or a registered checkout. Apply the same validation to derived database, lock, journal, and Store-owned backup and temporary-state paths. This does not move or prohibit the project backup payloads allowed in D2. Validate again under the lock before mutation. An override must not turn a project directory into a Store.

For a missing Store, create its root and acquire a Store-resident bootstrap lock before schema creation. This lock does not depend on tables that do not yet exist. Classify an existing database before migration. Unknown, newer, damaged, or ambiguous schemas stop without replacement. Supported schema changes use the existing transactional schema journal. Project operation records are distinct from schema migration records; schema checkpoint 9 must not stand in for proof of a project update.

Use a short Store-wide schema lock only for Store preparation. Serialize project file writers by canonical checkout identity, with the bootstrap path key covering pre-identity setup. Persist owner and operation identity in the Store. Revalidate ownership before each file mutation. A timeout alone does not prove a writer is dead. Stale recovery needs proof that the prior local writer is inactive. If that proof is unavailable, stop. Two checkouts can proceed independently when their writes do not conflict.

### D5. Recover across file and database changes

SQLite and the project filesystem cannot commit together. Use a bounded pending-operation record, not a claim of one atomic commit across both systems.

1. Under the writer lock, verify the reviewed plan and save the intended writes, expected prior hashes, snapshot reference, and recovery limits in the Store.
2. Create and verify required backup file copies before destructive writes. Record their verified inventory in the Store.
3. Before each file mutation, compare the current file with the reviewed expectation. Stop on drift. Apply the bounded write through atomic file replacement where supported. Record its result in the Store.
4. After all outputs match, commit the installation ledger and final operation receipt in one Store transaction. Do not mark the operation complete before that commit.
5. On a crash or failed Store write, the next mutation stops at the pending operation. Recovery compares intended, prior, and current file hashes. It resumes a known step, or restores only verified files in that operation's scope. Unknown content blocks recovery and stays intact.

Do not restore a whole shared Store after a project operation or a committed schema change. Rollback may restore reviewed project files and adjust only the affected operation's Store records. If rollback cannot prove safety, report the blocked paths and retain evidence. Do not delete the journal to force a fresh attempt.

### D6. Transfer legacy records once and narrowly

Existing setup review/apply performs the transfer. There is no separate broad cleanup command. Inventory only supported legacy installation and migration shapes. Read their contents as data. Verify schema, project scope, operation/snapshot links, and file hashes before making them trusted inputs. Import only records needed for current status, provenance, compatibility, or recovery. Retain evidence of the source identity and content hash in the Store so repeats are idempotent.

For completed operations, save the useful receipt and provenance without replaying their file changes. For incomplete operations, keep the required recovery evidence and stop for recovery before new setup work. Detect active legacy writers before import. Unknown files, invalid records, unresolved links, symbolic links, or changed source bytes block their transfer and cleanup. Do not infer completion from a filename or directory timestamp.

Commit and read back imported records before deleting any local source. Recheck each source hash before removal. Delete only the explicit imported allowlist. Remove the state directory only when empty. A crash between commit and deletion resumes the same cleanup from its Store record. User edits and unknown files survive. If the Store is unavailable, keep all legacy inputs and stop.

### D7. Retire old writers without a local marker

The corrected CLI is the minimum supported writer after transfer. The reviewed setup output states this version boundary before apply. Known active old writers block transfer. Detect them through scoped existing writer/process evidence for this checkout. Do not scan unrelated processes or install software automatically.

The new CLI does not write `legacy-quiescence.json`. Corrected writers check Store schema and compatibility requirements before any project mutation. The Store holds the minimum compatible writer contract. Use the existing declarative configuration-format rejection path only where the actual prior parser proves it rejects before writing. A format version describes project format; it must not encode operation progress.

Run the actual prior packaged CLI against an isolated transitioned fixture and record the result. This probe defines the documented limit; it does not promise backward writer compatibility. Unmodified obsolete executables that ignore the Store and format boundary cannot be controlled by the corrected CLI. They are unsupported after transfer. Do not retain local markers, dual writes, or a second release solely to simulate control over those binaries. The setup review and help must clearly name the minimum supported writer and the risk of running an obsolete one.

### D8. Give users one status and recovery path

Add these registered operations under the existing `project` command group. Resolve the target from the current checkout through the normal CLI context rules.

```text
make-docs project state status [--json]
make-docs project state recover <operation-id> --resume [--dry-run] [--json]
make-docs project state recover <operation-id> --rollback [--dry-run] [--json]
```

Status is read-only. It reports project name and identity, checkout binding, installation version or unverified state, Store availability, pending operation, and permitted next action. Plain text leads with the human result. JSON uses typed fields and stable result codes. It must distinguish `ready`, `unregistered`, `ownership-unverified`, `recovery-required`, `writer-active`, and `store-unavailable`. Inspection of a missing or damaged Store must not bootstrap or repair it.

Recovery requires exactly one mode. `--dry-run` shows the bounded file and Store changes without taking a write lock or mutating either surface. Apply reacquires locks and rechecks that same scope. Resume completes only provable pending steps. Rollback restores only the verified snapshot scope. Operation IDs must belong to the current checkout binding. A normal new mutation that encounters a pending operation stops and prints the exact recovery command. Ambiguous recovery prints no destructive command as safe.

Use the existing review contract for apply. Do not add a second approval system, SQL interface, generic operation browser, or automatic background repair. Registry identifiers are `project.state.status` and `project.state.recover`. Registry, CLI, and MCP projections share the same core and typed results.

### D9. Correct active guidance and prove absence

Update the owning PRDs now through this drafting pass. During accepted implementation, change shipped instructions upstream in `packages/docs/template/`, then install them into the dogfood instance through the corrected CLI. Audit writers, readers, generated defaults, router text, tests, and package output for local operational-state assumptions. Keep old history as history with explicit supersession links. Do not rewrite evidence of what earlier phases did.

Tests must inspect the full project tree for prohibited operational files. They must not omit `.make-docs/state/` to obtain a passing comparison. A fresh setup, update, repeat setup, resource operation, conflict flow, removal, failure, and retry must not create local operational records. Legacy-input fixtures may contain them before transfer only. Store failure must not create a substitute.

Personal agent memory is not product authority. No memory edits are authorized by this drafting task. A separately authorized memory update can point to the accepted rule, but it is not a dependency for making the CLI correct.

Shipped agent guidance must explain the missing CLI case in D1. Verify ordinary project work with the CLI unavailable, optional capture failure with the CLI present, and required Store failure during a CLI-managed change. The first two cases allow work to continue with an accurate notice and no fallback state. The last case must stop safely. This clarification stays within the existing W19 R3 phase.

## Alternatives Considered

| Option | Reason not selected |
| --- | --- |
| Delete `.make-docs/state/` now | Loses records and leaves the writers, contracts, and tests in place. |
| Move only migration receipts | Leaves the local operational manifest and other live metadata as a second authority. |
| Keep local copies as a Store projection | Recreates the folder and failure modes that the user explicitly rejected. |
| Put every project file and backup in the Store | Expands the scope and removes useful project knowledge and file-copy access. |
| Build a general distributed state engine | Adds machinery that this local CLI repair does not need. A typed installation ledger and pending-operation journal are enough. |
| Split foundation, migration, and proof into separate phases | Allows an interim accepted state with mixed storage rules. One phase can keep dependency order through stages and require complete proof at its exit. |

## Consequences

The reviewed transfer removes `.make-docs/state/` and the local operational manifest after verified import. The project retains declarative identity/settings, content, history, and backup file copies. A fresh clone cannot carry private machine history through Git. Missing Store data can therefore require restore from a valid Store backup or a reviewed fresh baseline. That limit is explicit.

This changes installation persistence and recovery. It requires coordinated edits to current authorities, runtime call sites, tests, and shipped guidance. The implementation is one phase with ordered stages. A failed safety or compatibility check blocks that phase; it does not justify an extra local state path or false completion.

No runtime code, installed output, Store row, legacy receipt, backup, branch, or worktree is changed by this design. No release, publication, archive, or W20 restart is authorized by drafting it.

## Design Lineage

Update Mode: `new-doc-related`

Prior Design Docs: [Global Store and Project State](2026-07-01-global-store-and-project-state.md).

Reason: This is a substantial correction of the local installation-manifest and migration-state split. A new design preserves the earlier decision as lineage while giving the interrupt one clear review target. Current owning PRDs take precedence over superseded local-state text in prior designs and phase history.

## Intended Follow-On

- Route: `change-plan`
- Next Prompt: [designs-to-plan-change.prompt.md](../../.make-docs/system/prompts/designs-to-plan-change.prompt.md).
- Why: Correct existing installation, migration, and Store authority before implementation.
- Coordinate Handoff: Carry W19 R3 as the interrupt revision of W19 R1. Keep W20 R0 paused until this interrupt is complete.

W19 R2 is already used. The user accepted the full package through the [work backlog](../work/2026-09-09-w19-r3-store-owned-installation-and-migration-state/00-index.md) on 2026-09-09. The requested next action after the package commit is an implementation plan. Implementation has not started. The [plan](../plans/2026-09-09-w19-r3-store-owned-installation-and-migration-state/00-overview.md) contains one implementation phase. The prompt's stable identity is `make-docs://system/prompt/designs-to-plan-change.prompt.md`.
