---
title: "W22 R0 P7 Setup Bridge Order and Recovery Loop Repair"
kind: "plan"
status: "active"
coordinate: "W22 R0 P7"
source:
  type: "design"
  path: "docs/designs/2026-09-18-store-architecture-recovery-and-platform-neutral-foundation.md"
---

# W22 R0 P7 Setup Bridge Order and Recovery Loop Repair

## Purpose

Repair the setup path that sends a person from `make-docs setup` to `make-docs setup system` and then back to `make-docs setup` when a supported legacy Store and a machine configuration change exist together.

## Trigger Evidence

The owner reproduced the loop with a current local CLI installed from the `make-docs-v2` branch. The installed binary matched the repository build. Full setup reviewed a schema 3 to schema 6 compatibility bridge, attempted machine setup before that bridge, and stopped with a direction to run system setup. System setup could not use the reviewed bridge and directed the owner back to full setup.

The Store remained on schema 3. The managed Codex entry remained drifted. No project migration completed and no pending operation remained. Global harness intent changed before the owned machine change succeeded. This evidence reopens [D-038](../../prd/03-open-questions-and-risk-register.md#d-038-setup-and-store-access-form-a-closed-recovery-loop).

## Authority Disposition

| Candidate | Decision | Reason |
| --- | --- | --- |
| D-038 setup and Store recovery state | `update-existing` | The existing finding owns this repeated closed-loop behavior and must reopen. |
| Setup, migration, Store, and command requirements | `none` | PRDs 07, 18, 38, and 39 already require independent reviewed subplans, direct machine repair without the Store or MCP path being repaired, safe legacy migration, and one action that changes the failed condition. |
| New capability or PRD | `none` | P7 repairs a failure to meet accepted behavior. It adds no product capability or authority owner. |
| PRD index | `none` | Product ownership and navigation do not change. |

## Outcome

One reviewed setup can move from a supported legacy Store and drifted machine configuration to the current Store, verified machine configuration, and approved project result without reciprocal commands, hidden partial intent, manual database edits, or a second setup state engine.

Direct system setup remains a machine-level operation. It does not take ownership of project Store migration. It can create or repair the selected machine route without depending on the Store or MCP route that it creates or repairs.

## Repair Contract

- Keep preview read-only. Show the Store bridge, machine subplans, project subplan, dependencies, and exact approval boundaries before writes.
- Treat the reviewed Store bridge as a named prerequisite for any Store-backed machine step in full setup. Apply and verify that prerequisite before the dependent machine step.
- Keep direct system setup callable without a current Store or working MCP route. Do not make it a second owner of project migration.
- Persist new harness intent only after its required prerequisite and owned machine change can complete. A failure must preserve the prior intent or return an explicit, recorded, and resumable partial result.
- Derive each recovery action from the failed condition and the operation that can change it. Never direct two commands back to each other when neither changes the prerequisite.
- Preserve separate machine and project approvals. Do not let the order repair widen a selection, method, permission, capability, ownership claim, or project write.
- Preserve Store backup, journal, rollback, opaque-data, user-file, and changed-native-entry rules. Do not edit SQLite by hand or add project-local operational state.
- Preserve Windows, macOS, and Linux as the same core product target. Do not narrow support because one host or harness is harder to prove.

## Scope Limits

- Do not remove a compatibility reader or old record through this phase.
- Do not redesign setup, the Store schema, harness adapters, or the operation registry beyond the exact dependencies that cause the loop.
- Do not change W23 work or use its concurrent edits as part of this repair.
- Do not test the first repair against the owner's real Store. Use isolated homes, Store roots, projects, and native configuration fixtures until source and installed-package gates pass.
- Do not push, publish, release, or apply the repaired candidate to the owner's live setup without separate authority.

## Verification And Close Gate

Automated Implementation Testing is required and blocking. The regression must start from a supported schema 3 Store, a drifted managed Codex MCP entry, a newly selected Claude Code MCP method, and reviewed project work. It must cover human and JSON results, full setup, direct system setup, apply failure, interruption, repeat, and no-op behavior.

Performance Testing is `not-needed-now`. No accepted performance target or current decision depends on timing. Guided Progress Review is required before implementation starts because the owner requested a discussion of the repair approach. It is also useful for the final installed output. Unassisted Goal Testing is `not-needed-now` because deterministic state and installed workflow evidence can answer the recovery question.

P7 can close only after one exact candidate passes the focused and full source gates and the same installed regression contract on Windows, macOS, and Linux. The comparison must reject a missing host, repeated host, different candidate, source-checkout execution, extract-only proof, or different public result. Human Experience Review must record the visible state, next action, recovery path, observations, conclusions, and limits. No explicit human acceptance gate applies unless the owner later creates one.
