---
title: "W19 R8 P1 — Store Access Bootstrap and Remediation"
kind: "plan"
status: "draft"
coordinate: "W19 R8 P1"
source:
  type: "design"
  path: "docs/designs/2026-09-16-store-access-bootstrap-and-remediation.md"
---

# W19 R8 P1 — Store Access Bootstrap and Remediation

## Purpose

Deliver the complete correction in one phase. The phase joins the remaining W19 R7 correction with executable trust, independent setup subplans, graceful Store behavior, mid-task access, generic MCP, upgrade recovery, and exact package proof under one close gate.

## Outcome

One exact packed CLI candidate provides a reachable setup and recovery path. It works with a normal global package-manager launcher. It preserves verified independent setup results. It keeps Store-free work available. It lets an agent add Store access during a task without abandoning that task. It supports a bounded generic MCP client. It passes the full v1-to-current and failure-recovery matrix.

## Remediation Execution Rule

This phase repairs the CLI and Store-access path. Store access, MCP access, harness receipts, Store-backed lifecycle state, and successful setup are test subjects. They are not prerequisites.

The implementation agent must continue when the Store is missing or unreachable. It must use repository authority, direct code and package commands, temporary homes, and temporary Store roots. It must not ask the user to repair Make Docs first. It must not create local fallback state or weaken production safety checks to make a test pass.

## Scope

In scope:

- setup interview, planning, review, apply, verify, repeat, and recovery admission;
- executable launch-path and package-binary verification;
- operation access policy and typed Store access results;
- machine and project harness intent, receipts, and independent subplan outcomes;
- first-party MCP setup, generic MCP profile setup, and on-demand help;
- agent-facing guidance for Store-free continuation and mid-task access refresh;
- the open W19 R7 Skills interview and recovery corrections;
- focused, integration, packed, isolated-upgrade, and Human Experience evidence.

Out of scope:

- a project-local JSON Store, receipt, lock, queue, or recovery journal;
- automatic edits to an unknown MCP client's configuration;
- broad home-directory permissions or caller identity based only on a name or environment value;
- a new general plugin, adapter registry, or external harness discovery service;
- real-project repair before isolated candidate proof and separate approval;
- publication, release, branch creation, commit, push, or deployment without separate authority;
- unrelated W19, W20, or W21 work.

## Ordered Stages

### Stage 1 - Reachable setup and package identity

Fix launch-path verification. Keep exact verifier failures. Move support classification after real prerequisite checks. Split setup into independent machine, project, Skills, and resource subplans. Validate unsupported Skill changes before final review.

Stage 1 closes when a normal global package link verifies, unsafe launchers remain blocked, and a fault in one setup subplan does not erase a verified independent result.

### Stage 2 - Scoped Store state and agent continuation

Add typed `not-configured`, `unavailable`, `unsafe`, and `denied` access results. Prove `store: none` opens no Store. Update agent-facing guidance so one Store-backed failure stops only that operation. Add the explicit W19 R8 remediation rule to the active implementation package and any shipped guidance that can direct agents during setup or Store failure.

Stage 2 closes when Store-free work continues in every absence case and agent transcripts show one exact next action without task abandonment.

### Stage 3 - Mid-task access, generic MCP, and recovery

Add focused access refresh and retry. Add the bounded generic MCP profile and on-demand configuration help. Complete the W19 R7 shared Skills interview, early recovery admission, valid action selection, no-effect rollback, and safe failure detail. Preserve independent completed setup results across interruption and retry.

Stage 3 closes when a configured first-party or generic client can gain reviewed project access during an active task and retry only the affected operation. It also requires the full recovery matrix to pass.

### Stage 4 - Exact packaged candidate and acceptance

Build one tarball after Stages 1 through 3 pass. Install it through a normal package manager in isolated homes with the repository unavailable. Run fresh, v1, early-v2, partial, interrupted, no-Store, configured-Store, first-party MCP, generic MCP, repeat, repair, and removal cases. Record the Human Experience Review.

Stage 4 closes only when the exact candidate passes every required case. A release-blocking failure keeps P1 open and routes a bounded fix inside this phase.

### Stage 5 - Codex TOML array-table correction

Reopen P1 for the valid repeated-array-table case found by live W19 R2 use. Keep the first package as replaced evidence. Replace the flat TOML table and value sets with an internal container tree. Resolve assignments and nested normal tables against the current array element. Preserve all current safety blocks.

Add a sanitized 21-element `[[skills.config]]` fixture. Prove dry-run preservation, apply, repeat, repair, and exact removal. Add negative cases for duplicate keys in one element, duplicate normal tables, normal-table and array-table conflicts, malformed input, and an array table below an invalid parent. Build one replacement package and run the full setup option shape in a temporary home. Then run the real W19 R2 command as a dry run only.

Stage 5 closes only when the replacement package passes Codex MCP planning against the real configuration shape. A later project projection conflict remains separate W19 R2 work. Store or MCP access is not an admission gate for this correction.

## Verification Set

- V1 — Package launcher: verify the normal npm link, resolved package bin, real package root, executable mode, and fingerprint. Reject broken, escaping, wrapper, runner, and mismatched cases with exact detail.
- V2 — Method state: prove a method is never labeled available when the same plan will block it on a known prerequisite.
- V3 — Subplan independence: inject machine, project, Skill, and resource failures one at a time. Prove valid independent results remain applied, verified, visible, and safe on repeat.
- V4 — Skills parity: compare full setup and `setup skills` frames, keys, cancellation, selected result, and review from the same state.
- V5 — Store-free operation: prove `access.store: none` does not open or create a Store and ordinary agent work continues.
- V6 — Typed Store states: prove `store-not-configured`, `store-unavailable`, `store-unsafe`, and `store-denied` remain distinct in human, JSON, MCP, and agent results.
- V7 — Mid-task access: start without project access, reach one Store-backed operation, show one exact setup action, preserve independent task progress, grant access, refresh state, retry only that operation, and continue.
- V8 — Generic MCP: prove client label validation, bounded identity proof, machine and project ceilings, standard config output, no unknown client-file writes, repeat, rotation, repair, and removal.
- V9 — Recovery: prove incomplete plans never offer resume, zero-step rollback changes no project or installation ledger, complete partial plans remain recoverable, changed evidence blocks mutation, and safe failure detail survives restart.
- V10 — Upgrade: prove fresh, v1, early-v2, partial, invalid-option, interrupted, and repeated setup each has a valid next action and never requires manual Store edits.
- V11 — Package identity: record one tarball name and digest, install it in isolated homes with the repository unavailable, and run V1 through V10 through the installed executable.
- V12 — Human Experience Review: record evidence, observations, conclusions, reviewer, limits, and next actions for HX-1 through HX-8. Offer a short optional human handoff. Do not make a response a gate.
- V13 — Codex TOML arrays: preserve 21 sanitized repeated array-table elements byte for byte, allow the same keys and nested normal-table paths in separate elements, reject conflicts inside one container, and pass the exact real W19 R2 dry-run planning step.

## Exit Criteria

- D-034, D-035, and D-038 have evidence that meets their close rules. They remain open until the accepted implementation record closes them.
- All focused and full CLI tests pass.
- Default validation and complete package smoke proof pass.
- PRD authority, link, path, formatting, and diff checks pass.
- The packed candidate, installed package, and tested executable identities match.
- The isolated upgrade and recovery matrix passes with no repository available.
- No affected real project or Store changes during candidate proof.
- No Store or MCP dependency blocked the remediation work.
- No project-local operational state, false success, broad permission, or task-wide Store failure appears.
- HX-1 through HX-8 have agent-reviewed evidence and conclusions.
- The replacement package passes V13. The first package remains recorded as replaced evidence.

## Failure and Scope Rules

Keep P1 open when a required case fails. Fix the bounded defect in this phase. Bring a new product or security choice to the owner.

Do not split a failed stage into a new phase. Do not publish a partial candidate. Do not run the old W19 R7 backlog separately. Do not use the affected real project to bypass isolated proof. Do not report Store absence as a remediation blocker.
