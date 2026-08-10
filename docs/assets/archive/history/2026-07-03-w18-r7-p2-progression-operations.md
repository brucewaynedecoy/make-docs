---
title: "W18 R7 P2 Progression Operations"
kind: "history"
status: "completed"
date: "2026-07-03"
client: "Claude Code"
model: "Fable 5"
coordinate: "W18 R7 P2"
repo: "make-docs"
branch: "make-docs-v2"
summary: "Landed the Run Playbook progression engine behind the five pending registry identifiers with an exact read-versus-mutate classification and a recorded evidence format, documented the engine and the full CLI/MCP run lifecycle, and advanced R-016 in place."
---

# W18 R7 P2 Progression Operations

## Changes

Implemented [Phase 2 of the W18 R7 backlog](../../../work/2026-07-01-w18-r7-run-playbook-state-machine/02-progression-operations.md) per [historical closeout](2026-07-03-w18-r7-p5-tests-and-verification.md) (retired action-PRD: `docs/prd/35-revise-run-playbook-state-machine.md`) R-OP-1 through R-OP-3 and R-SCOPE-1. The new progression engine at `packages/cli/src/operations/playbook/progression.ts` is pure position computation over (run state, parsed Playbook model, reported input), layered on the Phase 1 storage seam with every write flowing through `transitionPlaybookRunState`; it exports `computePlaybookRunNext`, `advancePlaybookRun`, `recordPlaybookRunGate`, `resumePlaybookRun`, and `closePlaybookRun`. The five W18 R11 registry identifiers pending since R11 P1 flipped to active handlers with zod input contracts and unchanged names: `playbook.next` is the side-effect-free read, and `playbook.advance`, `playbook.gate`, `playbook.resume`, and `playbook.close` register `mutates: "write"` so registry dispatch applies the uniform operation-core safety gating. The R-OP-3 classification is exact — only `start` creates run state, only `advance`/`gate`/`close` (and `resume`'s reopen) transition it, `next` never writes. `run-state.ts` gained the pieces the engine needed: `loadPlaybookRunModel` is the single-model loader keeping every dependency, gate, and routing read on the parsed W18 R6 model with no re-parsing in the engine (R-SCOPE-1); `createPlaybookRunState` now seeds the initial cursor to the first sequentially activated workflow step (R-OP-2); and the run record gained `evidenceLog`, whose `PlaybookRunEvidenceRecord` shape is the recorded D9 evidence-format decision — each mutating operation appends `{scope: step|gate|close|resume, subjectId, outcome, recordedAt, refs[], note}` while the flat `evidenceRefs` stays the deduplicated R-STATE-1 roll-up and gate decisions also land in `gateDecisions`. Progression semantics: `next` reads the stored cursor and reports position (`step`/`gate`/`blocked`/`closeable`/`closed`), effective mode with the `delegated` default, the invocation by registry identifier (never a command string), required-dependency availability (unavailable blocks, unknown yields probe guidance), and gate semantics; graph routing honors `on_success`/`on_failure`/`stop` while linear routing takes the next pending sequential step; event-bound steps are never cursor-eligible; a failed step without a failure route and a rejected gate block the run; end-of-workflow drops the cursor and holds `waiting-for-user`, and only `close` stamps `terminalStatus`. `resume` is deliberately the model-free Phase 2 reopen shell recomputing status from the cursor and recording resume evidence: the module carries an explicit `PHASE 3 SEAM (R-RESUME-1)` marker where the digest check lands, and a test pins that Phase 2 does not digest-block. The CLI gained `run playbook next|advance|gate|resume|close` subcommands (`--run-id`, `--outcome`, `--decision`, `--terminal-status`, `--step`, `--gate`, repeatable `--evidence-ref`/`--output-ref`/`--resume-hint`, `--note`, and `--store-root`), MCP tools derive automatically from the registry with parity verified in tests, and coverage grew by seventeen tests (fifteen in the new `packages/cli/tests/playbook-progression.test.ts` plus updates across the registry, run-CLI, MCP-derivation, and playbook-operations suites) with the full suite at 744/744 and the build green. All twelve Phase 2 tasks (t1 through t12) are checked off.

Developer-guide coverage was `update-existing` on [Run Playbook Runner Architecture](../../library/developer/playbooks-development-runner-architecture.md), which owned the topic and carried a Future Coverage bullet blocked on exactly this phase: the guide gained a Progression Engine section documenting the engine module, the exact R-OP-3 classification, the single-model rule, the `next` report, the cursor/routing semantics, the D9 evidence model, and the Phase 3 resume seam; the Entry Points section gained the five subcommands with their flags and derived MCP tools; the Run State record description and its transition paragraph now point at the engine instead of deferring to an unbuilt Phase 2; the Catalog Contract Validation section records that the engine consumes the parsed model exclusively through `loadPlaybookRunModel`; and the resolved Future Coverage bullet was replaced with a Phase 3/4 bullet scoped to digest-aware resume, mode execution, and guardrails. No new guide was warranted because the runner-architecture guide owns the whole runner story. User-guide coverage was `update-existing` on [Running Make Docs Playbooks](../../library/user/playbooks-running-make-docs-workflows.md): a new task-oriented Driving a Run from Start to Close section walks the lifecycle — start, `next` as the non-mutating position report, `advance` with outcomes and evidence, `gate` decisions, `resume` as a same-position reopen, and explicit `close` with the three terminal statuses — including the MCP tool names and `allowWrite` posture, and the run-state paragraph now says the lifecycle is drivable end to end; the digest-aware resume and run-time guardrails were deliberately not claimed because they are Phase 3/4. The user guide's own Future Coverage bullet (a reader-facing Playbook-contract projection) stays unresolved because its trigger is the broader W18 R7 runner migration, which still has Phases 3 through 5 open. PRD coverage was `risk-register-update` with no change doc, because the phase implemented existing PRD 35 requirements without changing the requirement surface: [R-016](../../../prd/03-open-questions-and-risk-register.md) advanced in place — the Decision records the engine, the exact classification, the single-model consumption, the CLI/MCP parity evidence, and the deliberate Phase 2 resume shell, and the Follow-Up replaces the now-satisfied "flip the five pending identifiers" instruction with the remaining close inputs (P3 digest-aware resume and mode execution, P4 guardrails, plugin-surface parity) — staying Open because its close bar still requires the proven resume flow and plugin parity. No other register item touches the progression operations: R-019 closed at P1 and remains accurate. `docs/prd/00-index.md` needed no change: PRD 35 remains Current and its row already describes the progression engine at requirement level.

Validation: full CLI suite 744/744 across 45 files, `npm run validate:defaults` exit 0, relative links in the touched docs verified to resolve, and no guide promoted past `draft` or given unresolved placeholders. `git diff --check` is clean for every doc this session touched and reports no whitespace findings in the implementation's uncommitted code files.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [../../../work/2026-07-01-w18-r7-run-playbook-state-machine/02-progression-operations.md](../../../work/2026-07-01-w18-r7-run-playbook-state-machine/02-progression-operations.md) | Marked Phase 2 tasks t1 through t12 complete. |
| [../../../prd/03-open-questions-and-risk-register.md](../../../prd/03-open-questions-and-risk-register.md) | Advanced R-016 in place with the W18 R7 P2 progression engine and re-scoped its Follow-Up to the remaining close inputs. |

### Developer

| Path | Description |
| --- | --- |
| [../../library/developer/playbooks-development-runner-architecture.md](../../library/developer/playbooks-development-runner-architecture.md) | Added the Progression Engine section (classification, single-model rule, cursor/routing semantics, D9 evidence model, Phase 3 resume seam), the five new subcommands under Entry Points, and requeued Future Coverage on the Phase 3/4 work. |

### User

| Path | Description |
| --- | --- |
| [../../library/user/playbooks-running-make-docs-workflows.md](../../library/user/playbooks-running-make-docs-workflows.md) | Added the task-oriented Driving a Run from Start to Close section covering the full CLI and MCP run lifecycle without claiming the Phase 3/4 digest-aware resume or guardrails. |
