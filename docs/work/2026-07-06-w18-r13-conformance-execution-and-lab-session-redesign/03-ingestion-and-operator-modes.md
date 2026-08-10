---
title: "Phase 3: Ingestion and Operator Modes"
kind: "work"
status: "active"
coordinate: "W18 R13 P3"
source:
  type: "prd"
  path: "docs/prd/44-conformance-lab-sessions-and-evidence.md"
---

# Phase 3: Ingestion and Operator Modes

## Purpose

Close the loop from a lab session to the registry and make the three execution modes operable: fail-closed ingestion assembles `conformance.result.v1` records solely from instrument outputs into the unchanged recording seam, and `conformance/operator-modes.md` documents how a human, a human-plus-agent pair, or an orchestrating agent drives a session. This phase implements PRD 43 anchors R-ING-1..2 and PRD 44 anchors R-EXEC-1..3 and R-MODE-1..2, covering reconciliation-inventory entries 12 (operator-modes routing) and 15.

## Overview

Ingestion is where "the agent drives, the instruments measure" becomes enforceable: bar-stage booleans derive only from instrument outputs validated against the session manifest's expected-evidence table, a missing or failed instrument output yields `false` with no narrative rescue, and everything the driving agent or human contributes — attestations, run metadata, the narrative reason — is recorded as an attestation, distinguishable from measurement. The recording seam does not change: `recordConformanceRunOnRegistryEntry` and the registry's derivation rules do all the gating they do today, and nothing new writes to the registry.

## Source PRD Docs

- [43 Revise Conformance Scenario Model and Execution Kit](../../prd/43-conformance-scenario-model-and-execution-kits.md)
- [44 Revise Conformance Lab Execution Protocol and Evidence Homes](../../prd/44-conformance-lab-sessions-and-evidence.md)
- [37 Enhance Playbook and Package Conformance](../../prd/20-agent-harness-conformance-and-support-claims.md#support-claim-governance) (still-constraining: the result contract, verdict derivation, blocked-honesty, and R-TEST-1 receipts discipline are consumed unchanged)
- [20 Revise Agent Harness Model Conformance Lab](../../prd/20-agent-harness-conformance-and-support-claims.md) (revised baseline: execution protocol; result contract and verdicts unchanged)

## Stage 1 - Fail-Closed Ingestion

### Tasks

- [x] t1: Implement the ingestion step as deterministic kit tooling: assemble a `conformance.result.v1` record from a session by validating each instrument output in `evidence/` against the manifest's expected-evidence table, deriving each asserted bar-stage boolean solely from its instrument output, and yielding `false` for any asserted stage whose instrument output is missing or failed — no narrative rescue (PRD 43 R-ING-1; PRD 44 R-EXEC-1).
- [x] t2: Record operator-contributed material as attestations distinguishable from measurement: the operator attestations (network, model routing), the run metadata (model, provider, runtime), and the narrative `reason` — and record uninstrumentable-stage gaps as caveats on the record, feeding the existing `pass-with-caveats` surfaced-caveats rules, never substituting say-so for a missing instrument (PRD 44 R-EXEC-2).
- [x] t3: Preserve blocked honesty end to end: a session whose preconditions are unmet ingests to an honest `blocked` record (`supportClaimUse: none`, all-false evidence bar) exactly as the W18 R9 machinery enforces (PRD 44 R-EXEC-3).
- [x] t4: Validate the assembled record against the existing result contract before it goes anywhere, write it under `conformance/results/<harness>/<YYYY-MM-DD>-<outcome-slug>-<seq>.json`, and bind it to its registry tuple exclusively through the unchanged `recordConformanceRunOnRegistryEntry` seam, with its existing refusals (unasserted stages, tuple or harness mismatch, simulation-posture mismatch) and the R-TEST-1 receipts discipline (record resolves, validates, projects back byte-equal) applying as-is (PRD 43 R-ING-2).

### Acceptance criteria

- Ingesting a synthetic session with a deliberately missing instrument output yields `false` for that stage; ingesting one with only narrative claims and no instrument outputs yields an all-unasserted record the seam refuses.
- Attestations and measurements are structurally distinguishable in the assembled record, and a caveat-bearing record satisfies the existing surfaced-caveats rules.
- No code path other than `recordConformanceRunOnRegistryEntry` mutates the tuple registry; the registry's derivation and refusal behavior is byte-unchanged.
- Ingestion of a blocked synthetic session produces the honest `blocked` shape.

### Dependencies

- Phase 2 kit, manifest, and instruments.

## Stage 2 - Operator Modes Documentation

### Tasks

- [x] t5: Write `conformance/operator-modes.md` documenting the three first-class modes, all producing evidence through the same kit and instruments: human-only (the manual fallback — generate the kit, perform every step, run the instruments by hand), human plus assisting agent (the agent does kit generation, workspace preparation, and ingestion while the human drives the target harness and prompts its self-assessment), and agent-multiplexed (an orchestrating agent uses a terminal-multiplexer tool — consumed as an environment capability, never built by Make Docs — to launch the target harness, deliver the prompts, monitor the session, and run instruments end to end), each mode restating the R-EXEC-1 rule that only instrument outputs are evidence (PRD 44 R-MODE-1..2).
- [x] t6: Absorb the parked `CONFORMANCE-RUN-codex-plugin.md` walkthrough as raw material for the human-only mode instructions — reading it, never modifying it; it is the user's working file, retired by the user once absorbed, and its boxed defect notes remain D-023's evidence record (inventory entry 15).
- [x] t7: Route the new doc: add `operator-modes.md` to [conformance/README.md](../../../conformance/README.md) and the `conformance/AGENTS.md`/`CLAUDE.md` router stubs (inventory entry 12).

### Acceptance criteria

- `conformance/operator-modes.md` exists as executable protocol content in the maintainer-only directory, covers all three modes against the same kit/instrument/ingestion path, and uses lab-session vocabulary throughout.
- `CONFORMANCE-RUN-codex-plugin.md` is byte-unchanged (`git status` shows it still untracked and unmodified).
- The README and router stubs route the operator-modes doc; the developer conformance-lab guide's summarize-and-link treatment is handed to Phase 4's guide rewrite.

### Dependencies

- Stage 1 (the modes document the real ingestion behavior); Phase 2 prompts and instruments.
