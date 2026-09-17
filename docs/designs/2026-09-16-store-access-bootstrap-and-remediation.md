---
title: "Store Access Bootstrap and Remediation"
kind: "design"
status: "draft"
coordinate: "W19 R8"
follow_on:
  route: "change-plan"
  next_prompt: "../../.make-docs/system/prompts/designs-to-plan-change.prompt.md"
  why: "Replace the closed setup and Store-access loop with one recoverable setup and agent path."
  coordinate_handoff: "Carry W19 R8 as the next revision of the W19 setup, Store, migration, and harness-access line. It supersedes the unimplemented W19 R7 correction scope."
---

# Store Access Bootstrap and Remediation

## Purpose

Define one correction for the closed loop between Make Docs setup, Store access, upgrade recovery, and agent work. The correction lets a person repair Make Docs without first having working Store access. It also lets an agent continue Store-free work when the Store is not configured or cannot be reached.

## Context

The current public paths can block every available recovery route.

`make-docs setup` can collect machine methods, Skills, and project resources. It can then reject an existing project's changed Skill selection after the interview. The command changes nothing, including the valid machine MCP work that appeared earlier in the same plan.

`make-docs setup system --codex-method mcp --claude-code-method mcp` can show both methods as available and later mark both as blocked. The active executable verifier reads `process.argv[1]`, rejects a symbolic link before it resolves the link, discards the exact error, and renders a generic reinstall instruction. A normal global npm install exposes `make-docs` through a symbolic link. Reinstalling the package creates the same form again.

An agent can also stop an active task when a Store-backed operation is unavailable. It can ask for a harness method that the user already selected. It can then return to a setup path that cannot complete. This changes a scoped Store limit into a task-wide stop.

These faults form one product defect. Setup is the supported path for Store access. Store access is then treated as a prerequisite for work that must repair setup and Store access. The safe-stop rule becomes a permanent stop rule.

W19 R7 correctly owns the duplicate Skills interview and invalid recovery advice. It does not own the executable-link defect, independent setup-plan application, optional Store behavior, mid-task access recovery, generic MCP setup, or the special execution rule required while Make Docs itself is under repair. W19 R8 absorbs the open W19 R7 scope and replaces it with one complete correction.

## Human Experience Intent

Impact: `direct`

Affected humans: People who install or upgrade Make Docs, people who add Store access during an agent task, maintainers who repair Make Docs, and people who use an MCP client without a first-party Make Docs adapter.

Human goal or effect: Complete or recover setup through one valid path, understand the exact failed part, and keep useful agent work moving when Store access is optional or temporarily unavailable.

Experience promises:

- HX-1: A normal package-manager-installed `make-docs` launcher can pass exact package verification. An invalid launcher reports the checked path, the failed rule, and one action that can change the result.
- HX-2: Machine setup, project setup, Skills, and resource placement are separate reviewed subplans. A failure in one subplan does not discard a verified result from another subplan.
- HX-3: Fresh, v1, early-v2, partial, failed, and repeated setup runs are safe to run again. Setup never asks the user to repeat a choice that is already saved and still valid.
- HX-4: A project with no Store or harness access configured remains a valid Make Docs project. Store-free operations and ordinary repository work continue.
- HX-5: A Store-backed operation distinguishes `not-configured`, `unavailable`, `unsafe`, and `denied`. It stops only that operation and gives one exact next action.
- HX-6: An agent can add project Store access during an active task, retry only the affected operation, and continue the task without starting over.
- HX-7: Setup and on-demand help provide a generic MCP configuration path for unsupported clients without guessing or overwriting client-owned configuration.
- HX-8: A remediation agent can repair the CLI and Store-access path without Store, MCP, harness-receipt, or Store-backed lifecycle access.

Complexity kept out of the human path:

- People do not diagnose npm symbolic links, package roots, hashes, Store receipts, pending operation rows, or harness caller identity.
- People do not lose valid machine setup because a Skill or project choice is invalid.
- People do not reinstall the same package repeatedly from a generic instruction.
- People do not restart an agent task because one optional Store operation is unavailable.
- People do not edit unknown MCP client configuration through Make Docs.

Evidence required:

- Focused tests for executable links, exact package identity, unsafe links, wrappers, hashes, and retained failure detail.
- Setup-plan tests that inject one blocked subplan and prove valid independent subplans apply and remain current.
- Store-state tests for unconfigured, unavailable, unsafe, denied, and configured access.
- Agent-path transcripts that prove Store-free continuation, one exact setup hint, and a scoped retry after mid-task access is granted.
- Generic MCP setup tests that prove bounded client identity, reviewed access limits, client-owned configuration preservation, and repeat setup.
- One exact tarball installed through a normal package manager in isolated homes with the repository unavailable.
- Upgrade and recovery cases for v1, early v2, partial install, interrupted setup, invalid prior choice, and repeat setup.
- An agent Human Experience Review that records each promise, evidence, observation, conclusion, limits, and next action. Human feedback is optional and is not a close gate.

## Decision

### Make remediation independent from the broken surface

W19 R8 implementation is remediation of the Make Docs CLI and Store-access path. Store access, MCP access, a harness receipt, a Store-backed lifecycle run, or successful `make-docs setup` is not an implementation prerequisite.

A missing or unreachable Store is expected evidence during this work. It must not block source inspection, edits, tests, package construction, isolated-home setup, evidence capture, or closeout preparation. The implementation agent uses repository authority, direct source and package commands, temporary homes, temporary Store roots, and ordinary Git evidence.

The agent can stop only for a real safety risk, missing change authority, missing required source material, a required user product choice, or an environment fault that also prevents an isolated test. It must not ask the user to repair the broken setup before the agent repairs it. It must not create project-local operational state or a second recovery engine.

### Verify the resolved package binary

Treat the launch path and the verified package binary as separate facts.

The verifier can accept a package-manager symbolic link only after it resolves the link and proves that the final file is the exact `make-docs` bin declared by the active package manifest. The resolved file must remain inside the real package root, be a regular executable file, match the expected fingerprint when one is supplied, and not resolve to a shell or package runner. Unsafe, broken, escaping, or mismatched links remain blocked.

The result keeps both the launch path and resolved path. Verification failures keep a stable code and safe detail. Setup shows a method as available only after all prerequisites used by its plan pass. A blocked method never appears as available in the same review.

### Apply setup as independent reviewed subplans

Setup uses one ordered group with separate machine, project, Skills, and resource subplans.

The machine subplan applies and verifies first. A later project, Skill, or resource failure does not roll back or hide a valid machine result. A Skill change that belongs to `setup skills` is identified before the final review. Setup can keep the unchanged saved Skill selection and continue other valid work, or route the user to the focused command without discarding independent setup.

Every subplan has its own status, blocker, changed condition, and next action. Repeat setup reads prior valid results and asks only for missing or changed choices. A failed or interrupted apply resumes from recorded proof and never restarts verified work.

### Treat no Store configuration as a valid state

Make Docs remains usable without Store or harness access configured for a project.

The absence of project Store intent means `not-configured`. It does not mean broken, unsafe, or denied. The operation runner does not open the Store for `access.store: none`. Ordinary repository work, resource list/read, and other Store-free behavior continue.

A Store-backed operation returns one typed access result:

- `store-not-configured`: no project access intent exists;
- `store-unavailable`: configured access exists but the Store cannot be reached;
- `store-unsafe`: the Store exists but cannot be used safely;
- `store-denied`: machine, project, method, or receipt policy does not permit the operation.

The result stops only the requested Store-backed operation. It never claims that the whole agent task must stop. It includes one exact setup or recovery action when an action exists.

### Support mid-task access recovery

When an agent needs a Store-backed operation during an active task, it first checks the typed access state.

For `store-not-configured`, the agent explains that Make Docs can continue without the Store. It gives the exact focused setup command for the detected harness or the generic MCP path. It continues every independent Store-free part of the task. After the user completes setup, the agent refreshes access state and retries only the affected operation.

For `store-unavailable`, `store-unsafe`, or `store-denied`, the agent reports the exact scope and safe action. It still continues independent work unless the requested task outcome itself requires the blocked Store operation.

Agent-facing Make Docs guidance must state this rule directly. It must also state the W19 R8 remediation exception so the implementation agent cannot interpret Store failure as a reason to abandon the correction.

### Add a bounded generic MCP profile

Setup offers `Generic MCP client` in the machine setup interview and through a focused non-interactive input. The user supplies a stable local client label. Make Docs does not claim to detect or edit that client's native configuration.

The result prints a standard MCP server configuration object and on-demand help. The object uses the verified package binary and a receipt-bound generic client identity. Store-backed access remains limited by separate machine intent and project intent. The generic identity must not depend only on a caller-controlled name or environment value. Secret proof, if required, is stored only as a one-way value in Make Docs-owned state and is never shown by normal status output.

Repeat setup can review, rotate, repair, or remove the generic profile. Unknown client files remain untouched. If the current Store schema cannot hold the required bounded proof, implementation must surface that fact before a schema change. It must not weaken caller verification to avoid the decision.

### Keep upgrade and recovery reachable

Upgrade and recovery admission occurs before editable setup questions. The CLI derives the permitted action from saved plan, steps, ledgers, locks, current bytes, and retained failure detail.

The W19 R7 recovery rules remain required. An incomplete plan never offers resume. A proved zero-step operation can use no-effect rollback. A complete partial plan can offer verified resume or rollback. Changed, unknown, conflicting, or active-writer evidence blocks mutation and states the exact reason.

All upgrade and setup entries must be safe to run again after invalid input, a blocked subplan, interruption, or process restart. A completed independent subplan remains completed.

### Use one implementation phase

The correction uses one implementation phase. Ordered stages exist inside that phase. No stage is a release point. The phase closes only after the exact packaged candidate passes the full matrix.

## Alternatives Considered

### Require working Store access before remediation

Rejected. This is the closed loop that prevents repair.

### Treat every Store failure as a task blocker

Rejected. Store access is optional for many Make Docs and repository operations. Only the affected Store-backed operation can stop.

### Keep setup as one all-or-nothing transaction

Rejected. Machine, project, Skills, and resources have different owners, approvals, and recovery facts. One invalid choice must not erase an independent verified result.

### Allow every symbolic link

Rejected. Only a link whose resolved file proves exact package identity is safe. Wrappers, runners, escaping links, and mismatched files remain blocked.

### Add a project-local JSON fallback Store

Rejected. It would restore split operational authority and conflict with the Store-owned state boundary. The correction uses typed absence and isolated test state instead.

### Let a generic client self-assert its identity

Rejected. A caller-controlled label or environment value alone cannot grant Store access. Generic MCP needs reviewed, bounded proof.

### Split the work into several phases

Rejected. The faults form one release-blocking setup and access path. A single phase with ordered stages keeps the correction fast and prevents partial release claims.

## Consequences

- W19 R8 supersedes the unimplemented W19 R7 plan and backlog as the active correction path.
- D-034 and D-035 remain open and move to the W19 R8 close gate.
- One new confirmed-drift item records the full setup and Store-access deadlock.
- PRDs 07, 08, 10, 18, 25, 28, 38, and 39 receive surgical current-requirement updates and W19 R8 history.
- Setup needs structured subplan results instead of one late global rejection.
- Executable verification keeps strict package identity while supporting normal npm installation.
- Agents gain an explicit scoped-degradation rule. This rule does not turn a required Store write into success.
- Generic MCP adds bounded identity and help work. It does not add automatic edits for unknown clients.
- No project-local operational fallback, broad home-directory permission, branch, release, or real-project repair is authorized by this design.

## Design Lineage

- Update Mode: `new-doc-related`
- Prior Design Docs: [Setup Interview and Recovery Correction](2026-09-15-setup-interview-and-recovery-correction.md), [Unified Setup and Harness Access](2026-09-12-unified-setup-and-harness-access.md), [Static Harness Adapters and Conformance Retirement](2026-09-14-static-harness-adapters-and-conformance-retirement.md), [Store-Owned Installation and Migration State](2026-09-09-store-owned-installation-and-migration-state.md)
- Reason: The new evidence proves one wider bootstrapping defect. Updating W19 R7 alone would hide the executable, subplan, graceful-degradation, mid-task, generic-client, and remediation-agent requirements.

## Intended Follow-On

- Route: `change-plan`
- Next Prompt: [designs-to-plan-change.prompt.md](../../.make-docs/system/prompts/designs-to-plan-change.prompt.md). Read `make-docs://system/prompt/designs-to-plan-change.prompt.md` with `make-docs resource read`.
- Why: Existing PRD owners need surgical updates before implementation uses this correction as product authority.
- Coordinate Handoff: W19 R8 supersedes the unimplemented W19 R7 correction scope. Carry W19 R8 into the PRD requirement-history entries and one-phase delta backlog.
