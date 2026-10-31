---
title: "Setup Path-Move Flow"
kind: "plan"
status: "draft"
coordinate: "W22 R1 P2"
---

# Setup Path-Move Flow

## Purpose

Make the normal setup path explain and repair a moved checkout before it starts a fresh install. Use the [ownership rules](01-authority-and-ownership.md).

## Discovery and Review

1. Resolve the explicit target root with the existing platform service.
2. Validate config and read its project ID before path-bound manifest lookup and fresh classification.
3. Read candidate checkout records without changing the Store. A shared project ID finds candidates; it does not prove that a checkout moved.
4. Report a move candidate only when ownership proof, path claims, and operation state support it.
5. Show the project name, old path, current path, record identity, and the exact planned effect.
6. Offer `Move this existing install here`, `Register a separate checkout`, and `Cancel`. Disable an unsafe choice and explain what must change.
7. After a successful move, reread the bound install record and saved selections. Reclassify the project. Only then build any later setup plan.

The display must not call a recognizable moved install fresh. If the old path still exists, do not take its record. `Register a separate checkout` leaves the move flow and starts a separate reviewed managed-install action. It keeps the project ID but receives a new checkout ID and its own install ownership. That action needs its own project-write admission and file adoption review. It must explicitly create a distinct checkout. It must not let the current automatic `bindCheckout` move logic take an absent source record. It cannot run under the move operation's Store-write/project-read ceiling. It must not copy the old checkout's pending work or pretend that its files are already owned.

Several absent records require an explicit selection plus valid proof. Do not guess by name, path spelling, newest timestamp, or first row. A competing target claim blocks the move. An invalid or mismatched project ID needs a precise diagnosis.

## Read and Write Boundaries

Status, preview, dry-run, cancellation, and an unanswered review make no durable binding, record, or project file change. They must report the required next action. Existing short-lived Store access locks may be used for safe reads. Their use must not create a durable move record or alter ownership.

Implement shared preview and apply operations. Adopt the proposed names below in PRD 39 before code changes. These are planned names, not commands available in 2.0.5. Setup must call the same core operations. The direct CLI and MCP surfaces must use the same proof, access checks, and result model. Normal setup must work without requiring the user to discover a direct command.

| Proposed core operation | Proposed CLI | Proposed MCP tool | Access |
| --- | --- | --- | --- |
| `project.checkout-move.preview` | `make-docs project checkout-move preview --source-checkout <id> --target-root <path>` | `checkout_move_preview` | Store read; project read; host config none |
| `project.checkout-move.apply` | `make-docs project checkout-move apply --source-checkout <id> --target-root <path> --review <review-id>` | `checkout_move_apply` | Store write; project read; host config none |

These core IDs keep the registry's existing three-part ID grammar. The apply tool requires `allowWrite=true` and the exact reviewed source and target. Keep the caller's existing access ceiling and allowed roots. Approval cannot grant project-write or host-config access. It cannot widen a connection's target roots, retarget an MCP connection from the old path, or repair host settings. If a caller cannot access the new root, report the needed connection review and stop that operation. Direct CLI setup uses its normal authorization; it does not borrow a broader harness grant.

Use a stateless review ID derived from the evidence format version, selected project and checkout IDs, exact old and target canonical paths and comparison keys, saved ledger/evidence digests, and verified target ownership facts. Preview creates no durable review row. Apply recomputes that input under its write lock and rejects any change, including a different source ID. The review ID proves which facts were reviewed; it is not a general permission token.

Non-interactive apply needs an explicit source checkout, target root, and reviewed decision. Bare `--yes` must not choose among candidates or turn a move into a new install. Dry-run returns a bounded plan and no write. Reject stale plans.

## Safe Apply

- Acquire the required Store and checkout locks in the established order. Recheck the source path, target claim, ownership proof, and pending work under the lock.
- Reject an active writer or pending source operation with its exact recovery route. Handle dead locks only through the existing verified recovery policy.
- Change only the selected checkout binding and the reviewed verification evidence. Keep its project ID, checkout ID, ledger, and history.
- Add a Store-only move path to the shared operation core. Reuse Store access, locking, transactions, and typed results. Do not call the generic `withInstallationOperation` wrapper unchanged: it binds before it inserts its journal row, may create config through `ensureDeclarativeIdentity`, and can replace the ledger through its generic commit path. Those effects exceed this operation's declared access.
- Require an existing supported Store schema and source checkout. Do not bootstrap a project, mint identity, run a legacy Store migration, adopt files, or take a setup fallback within move apply. A required compatibility step is a separate reviewed action with its own access checks.
- Insert the bounded move journal/receipt, compare and update the selected binding, and save the proved evidence version in one SQLite transaction. Record the old and new lookup facts, selected checkout, and evidence version. Preserve all prior operation rows and ledger bytes. Never perform ad hoc SQL in setup.
- Commit the path update and its completed result together. A crash before commit leaves the old binding and no partial move. A retry after commit recognizes completion only when the same checkout is at the reviewed target with the expected evidence. A later or competing change is a conflict, not a successful retry. Do not create a file-recovery operation or require the new target to inherit an old pending operation.
- Treat later setup edits as a separate reviewed action. Failure in later setup must not disguise whether the move completed.
- Do not rewrite project files, machine MCP settings, or user instructions just to record a path move.

Use existing platform comparison and safe-path rules. Do not introduce durable device or inode identity. Recheck case-only paths and symlink behavior on each supported platform.

## Monorepo Behavior

The root project and `kits/make-blueprint` are two explicit targets. Discover and review each target's own project ID and checkout record. Moving the parent directory must not move or adopt every nested project record. The tool must not infer kit ownership from the parent's approval.

## Source Touchpoints

| Area | Expected files | Work |
| --- | --- | --- |
| Setup ordering | `packages/cli/src/cli.ts` | Run move discovery before compatibility and fresh-install planning. |
| Status and binding | `packages/cli/src/store/installation-state.ts` | Shared read-only candidate lookup and guarded apply. |
| Recovery admission | `packages/cli/src/setup-project-recovery.ts` | Surface existing pending work before editable setup prompts. |
| Command and tool contract | `packages/cli/src/operations/registry.ts` and registry-owned projections | Share the operation and access checks. |
| Prompt presentation | Existing wizard renderer and setup result types | Review paths, choices, and distinct complete/blocked/cancelled results. |

## Acceptance

- The installed tool explains the renamed 2.0.5 checkout before showing setup selections.
- Approval keeps its identity and history.
- Cancel and dry-run change nothing.
- Unsafe and ambiguous cases name a safe next action.
- Direct CLI and MCP preview/apply use the same move checks, target-root limits, and existing access ceilings.
- Move apply cannot write config, bootstrap identity, replace the ledger, migrate the Store schema, or register another checkout.
- The move path, its evidence update, and its completed receipt commit together; no project-write helper is needed.
- A second setup run finds the current install and proposes no move.
