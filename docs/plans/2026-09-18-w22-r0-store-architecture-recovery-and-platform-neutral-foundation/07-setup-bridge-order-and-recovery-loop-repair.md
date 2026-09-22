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

Repair the full upgrade path for supported older installations. One plain `make-docs setup` flow must assess prerequisites, show one final plan, pass every safety check, apply the approved result, and provide a normal resume or restore path without sending the person through deep recovery commands.

## Trigger Evidence

The owner reproduced the loop with a current local CLI installed from the `make-docs-v2` branch. The installed binary matched the repository build. Full setup reviewed a schema 3 to schema 6 compatibility bridge, attempted machine setup before that bridge, and stopped with a direction to run system setup. System setup could not use the reviewed bridge and directed the owner back to full setup.

The Store remained on schema 3. The managed Codex entry remained drifted. No project migration completed and no pending operation remained. Global harness intent changed before the owned machine change succeeded. This evidence reopens [D-038](../../prd/03-open-questions-and-risk-register.md#d-038-setup-and-store-access-form-a-closed-recovery-loop).

A later installed run disproved the first P7 Stage 1 repair. After rollback, `project state status` reported a ready schema 6 installation with no recovery needed. Plain `make-docs setup` then classified the project as `partial-install`, offered `migrate-with-review`, showed one planned skip after 108 file checks, and received project approval. Migration checkpoint 3 then rejected the reviewed work as `ambiguous-ownership` and created pending operation `9b687b36-5394-4bae-879e-416937eaa33d`. The planner, classifier, and executor did not agree on whether the reviewed project result was safe. The failure was predictable before operation creation, but setup created recoverable state and sent the person to `project state status` and deep recovery commands.

This installed trace withdrew the first Stage 1 completion claim. The corrective review then found approval-order, migration backup preflight, one-recovery guard, post-import recovery routing, JSON mutation-state, and retired-resource gaps. Stage 1 fixed those gaps. The failed installed trace and interim review remain historical evidence for the defect and repair boundary.

## Authority Disposition

| Candidate | Decision | Reason |
| --- | --- | --- |
| D-038 setup and Store recovery state | `update-existing` | The existing finding owns this repeated closed-loop behavior and must reopen. |
| Setup, migration, Store, and command requirements | `none` | PRDs 07, 18, 38, and 39 already require independent reviewed subplans, direct machine repair without the Store or MCP path being repaired, safe legacy migration, and one action that changes the failed condition. |
| New capability or PRD | `none` | P7 repairs a failure to meet accepted behavior. It adds no product capability or authority owner. |
| Project reset or forced reinstall capability | `none` | A safe reset may be useful, but it is a separate product choice. P7 does not add it without separate owner approval. |
| PRD index | `none` | Product ownership and navigation do not change. |

## Outcome

One reviewed setup can move from any supported older installation to the current Store, verified machine configuration, and approved project result without reciprocal commands, hidden partial intent, manual database edits, or a second setup state engine.

Setup computes one final project plan from the predicted state after every approved prerequisite. The plan shown for approval is the plan that the classifier and executor accept. All safety checks pass before setup creates an operation or changes durable state.

If setup finds an interrupted operation, plain `make-docs setup` offers the valid resume or restore action. `make-docs project state recover` remains available for support and automation, but it is not part of the normal upgrade path.

Direct system setup remains a machine-level operation. It does not take ownership of project Store migration. It can create or repair the selected machine route without depending on the Store or MCP route that it creates or repairs.

## Repair Contract

- Keep preview read-only. Show the Store bridge, machine subplans, project subplan, dependencies, and exact approval boundaries before writes.
- Treat the reviewed Store bridge as a named prerequisite for any Store-backed machine step in full setup. Apply and verify that prerequisite before the dependent machine step.
- Predict the verified state after each approved prerequisite. Build one final project plan from that predicted state. If an applied prerequisite changes the prediction, refresh the state and rebuild the plan before approval or mutation.
- Run ownership classification, migration admission, native safety, approval, stale-state, and operation checks against the same final plan. Complete every check before operation creation or the first durable write.
- Validate the migration backup destination before operation creation. A regular file at `.make-docs/backup` must block the plan without creating a pending operation.
- Require the planner, compatibility classifier, migration coordinator, and executor to agree on one reviewed action and result for every managed path. Setup must not offer approval for work that a later checkpoint is designed to reject.
- Keep direct system setup callable without a current Store or working MCP route. Do not make it a second owner of project migration.
- Persist new harness intent only after its required prerequisite and owned machine change can complete. A failure must preserve the prior intent or return an explicit, recorded, and resumable partial result.
- Derive each recovery action from the failed condition and the operation that can change it. Never direct two commands back to each other when neither changes the prerequisite.
- Make plain setup the normal recovery entry point. When an operation can resume or restore, show those choices in setup. Keep deep project-state recovery commands as support and automation controls.
- Preserve separate machine and project approvals. Do not let the order repair widen a selection, method, permission, capability, ownership claim, or project write.
- Preserve Store backup, journal, rollback, opaque-data, user-file, and changed-native-entry rules. Do not edit SQLite by hand or add project-local operational state.
- Preserve Windows, macOS, and Linux as the same core product target. Do not narrow support because one host or harness is harder to prove.

## Scope Limits

- Do not remove a compatibility reader or old record through this phase.
- Do not redesign the Store schema, harness adapters, or operation registry beyond the changes required for one end-to-end setup plan, preflight, apply, verify, resume, and restore flow.
- Do not add a reset, detach, quarantine-and-reinstall, or forced reinstall capability without a separate owner decision and implementation authority.
- Do not change W23 work or use its concurrent edits as part of this repair.
- Do not test the first repair against the owner's real Store. Use isolated homes, Store roots, projects, and native configuration fixtures until source and installed-package gates pass.
- Do not push, publish, release, or apply the repaired candidate to the owner's live setup without separate authority.

## Verification And Close Gate

Automated Implementation Testing remains required and blocking for P7. Stage 1 replaced the test that treated the checkpoint-3 dead end as correct. The regression reproduces the installed `partial-install` and `ambiguous-ownership` result, including approval followed by a predictable rejection and pending-operation creation, then proves the repaired result. Another regression proves that a regular file at `.make-docs/backup` blocks before operation creation and leaves no pending operation. A fail-closed regression also proves that a retired Store resource cannot be silently reintroduced; the corrected planner skips it without weakening migration safety.

The Stage 1 matrix uses authentic installations made from the historical Make Docs 0.1.0 archive, the exact published `@brucewaynedecoy/make-docs@1.0.0-rc.1` archive, and a historical schema-3 source package from commit `f5fd5579849debf87f5a700dd8b8a656c4f01e87`. The schema-3 fixture reproduced the original checkpoint-3 failure before repair. After repair, it preserves the six changed managed files and archived playbook bytes, adopts the six files as project-owned with current digests, leaves no pending operation, and does not repeat conflict review on the immediate second setup. Stage 1 passes its focused tests, default validation, package build, TypeScript check, full CLI suite, and independent read-only audit. The evidence record holds the exact results and package provenance.

Performance Testing is `not-needed-now`. No accepted performance target or current decision depends on timing. The Guided Progress Review found and closed the Stage 1 gaps. It remains useful for the final installed output. Unassisted Goal Testing is `not-needed-now` because deterministic state and installed workflow evidence can answer the recovery question.

P7 can close only after one exact candidate passes the focused and full source gates and the same authentic legacy-package regression contract on Windows, macOS, and Linux. The comparison must reject a missing host, repeated host, different candidate, source-checkout execution, extract-only proof, different public result, deep-command requirement in a normal upgrade, or an operation created before a predictable safety failure. Human Experience Review must record the visible state, next action, recovery path, observations, conclusions, and limits. No explicit human acceptance gate applies unless the owner later creates one.

Stage 1 tasks t1 through t8 and A45 through A49 are complete. P7 and D-038 remain open for Stage 2 tasks t9 through t15 and A50 through A52. The next gate records one exact candidate identity and runs installed proof on Windows, macOS, and Linux. Local CLI installation and the live plain-setup retry remain separate later actions.
