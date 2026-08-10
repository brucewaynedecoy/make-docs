---
title: "Phase 2: Execution Kit, Instruments, and Lab Sessions"
kind: "work"
status: "active"
coordinate: "W18 R13 P2"
source:
  type: "prd"
  path: "docs/prd/43-conformance-scenario-model-and-execution-kits.md"
---

# Phase 2: Execution Kit, Instruments, and Lab Sessions

## Purpose

Build the executable projection: the per-target conformance kit generated on demand from Phase 1's definitions and the harness capability descriptors, the deterministic instrument scripts that measure each bar stage, the discovery-kit variant, the prompt set, and the disposable lab-session workspace with its evidence homes — retiring the repo-local `.make-docs/conformance/` default. This phase implements PRD 43 anchors R-KIT-1..3, R-HOME-1..2, R-INST-1..2, R-PROMPT-1, and R-DISC-1 (generation half), and PRD 44 anchors R-NAME-1..2, closing the structural side of register items [D-023](../../prd/03-open-questions-and-risk-register.md) and [D-024](../../prd/03-open-questions-and-risk-register.md) and covering reconciliation-inventory entries 6 (transcript pointer), 8, 16, and 17.

## Overview

The kit is where executability becomes a generated property: every command it emits — packaging invocations through the real plan/preview/write pipeline, `setup remove --yes` forms, precondition establishment — derives from the registered operation surface and the capability descriptors, so a definition that cannot project to an accepted command sequence fails at generation time, before any session starts, and the three D-023 defect classes (missing evidence refs, missing confirmation flags, unestablished preconditions) are impossible in generated output because the kit's session configuration supplies them. The kit generator is maintainer lab tooling, never a shipped operation; harness knowledge it needs concentrates into the descriptors' new lab-facing interrogation block, never a kit-local table.

## Source PRD Docs

- [43 Revise Conformance Scenario Model and Execution Kit](../../prd/43-conformance-scenario-model-and-execution-kits.md)
- [44 Revise Conformance Lab Execution Protocol and Evidence Homes](../../prd/44-conformance-lab-sessions-and-evidence.md)
- [36 Revise Playbook Packaging Compiler and Harness Adapters](../../prd/36-playbook-packaging-compiler-and-harness-adapters.md) (enhanced baseline: the descriptor interrogation block; compiler and adapters consumed unchanged)
- [39 Revise CLI Command Reorganization and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md) (still-constraining: parity preserved vacuously — nothing registered, nothing on the CLI tree or MCP)
- [38 Revise Global Store and Project State](../../prd/38-global-store-and-project-state.md) (still-constraining: the store's lab area is a named location, not new store schema)

## Stage 1 - Kit Generator and Descriptor Interrogation Block

### Tasks

- [x] t1: Add the lab-facing interrogation block to the harness capability descriptor type — how to list installed plugins and skills, where the harness logs or evidences invocation, and the listing-capture forms the discover instrument renders from — verification-marked like every other descriptor claim, authored for Codex to the extent its contract is verified and left honestly absent or provisional for Claude Code and Pi (PRD 36 R-CAP-2 as enhanced; PRD 43 R-HOME-2).
- [x] t2: Implement `packages/cli/src/conformance/kit.ts`: generation for one (definition, target) pair or one target's full first-pass suite, producing the fixed `<session-root>/kit/` (prompts, instruments, manifest), `<session-root>/workspace/` (materialized fixture project), and `<session-root>/evidence/` layout in a disposable session root outside the repository, with the distributables shipped through the real packaging pipeline (plan/preview/write via the shipped compiler and descriptors) and evidence refs plus precondition attestations supplied by the kit's session configuration (PRD 43 R-KIT-1..2).
- [x] t3: Enforce executable-by-construction: derive every emitted command from the registered operation surface and the descriptors, fail generation closed — naming the definition, target, and unprojectable element — when a definition cannot project to a command sequence the current CLI accepts, including the uncovered-target case where the harness has no `targets` entry (PRD 43 R-KIT-3, R-SCHEMA-2).
- [x] t4: Expose generation through maintainer tooling only — an npm script/`scripts/` entry in this repo — registering nothing in the operation registry and adding nothing to the CLI command tree or MCP surface, with a consistency assertion that the operation registry gained no entry from this round (PRD 43 R-HOME-1; register item Q-022 carries the revisit seam).
- [x] t5: Emit the session manifest per kit: definition id, target, tuple ids, generation inputs (descriptor digest, CLI version), and the expected-evidence table ingestion validates against (PRD 43 R-KIT-1).

### Acceptance criteria

- Generating the Codex first-pass suite from the four packaging definitions succeeds into a temp session root; nothing is written under the repository at any point.
- Generation for a target absent from a definition's `targets` map fails closed naming the gap; generation for a deliberately unprojectable fixture definition fails closed before any session artifact is produced.
- Generated command sequences contain the support-evidence ref, the `--yes` uninstall form, and the precondition establishment steps — asserted by tests over generated kits, proving the three D-023 defect classes impossible in generated output.
- No kit-local harness-fact table exists; every harness-specific string in kit output traces to a descriptor field.

### Dependencies

- Phase 1 definitions and schema.

## Stage 2 - Instruments and Prompts

### Tasks

- [x] t6: Implement the per-stage instrument scripts the kit emits, each landing machine-verifiable output in `evidence/`: install — exit codes of the install commands plus a file inventory of the harness-visible placement roots; discover — a capture of the harness's own listing surface (command output, directory listing, or manifest read, per the descriptor's interrogation block); invoke — the fixture skill's deterministic invocation marker from the existing `conformance-skill-probe` captured as a probe file; uninstall — a byte-level before/after diff of the placement roots and the workspace proving managed outputs removed, user content untouched, no orphaned managed directories (PRD 43 R-INST-1).
- [x] t7: Keep instruments deterministic and offline — no network, no model routing, no interpretation (interpretation happens only at Phase 3 ingestion against the manifest's expected-evidence table) — and pin `--json` on any CLI output an instrument consumes (PRD 43 R-INST-1..2; PRD 41 agent invariance).
- [x] t8: Implement the prompt set: the target-agnostic core carrying the session narrative, the honesty rules verbatim (blocked is a valid result; failures are evidence; assertions never relax), the instruction to perform its own discovery and assessment, when to run each instrument, and the explicit statement that the target agent's claims are not evidence and only instrument outputs count — rendered per target with names, paths, and invocation phrasing drawn from the descriptors, never asking the agent to certify (PRD 43 R-PROMPT-1; PRD 44 R-EXEC-1).
- [x] t9: Implement the discovery-kit variant as the characterization plan's new form: a session that precedes bar assertion and records ground truth — pin the harness version, hand-author a minimal plugin from the harness's own docs independent of Make Docs, vary marketplace source shapes until one is accepted, capture the accepted shape, diff the generated shapes against it — with findings routed to descriptor corrections (re-triggering contract-digest re-verification), never bar relaxations; the plugin definition's Codex target binding carries it with `resolvesProbe` linking register item R-021 (PRD 43 R-DISC-1).

### Acceptance criteria

- Each asserted bar stage of each generated kit has exactly one instrument script whose output lands under `evidence/` in a form the expected-evidence table names.
- Instrument runs over a synthetic workspace fixture produce byte-stable outputs across repeated runs; no instrument opens a network connection or invokes model routing.
- The rendered prompts for the Codex targets contain the honesty core verbatim and no certification request; prompt snapshots are pinned by tests.
- The generated Codex discovery kit reproduces the committed characterization intent, and R-021's linkage is intact.

### Dependencies

- Stage 1 kit generator.

## Stage 3 - Lab-Session Vocabulary and Evidence Homes

### Tasks

- [x] t10: Adopt the lab-session vocabulary across all new code, paths, and identifiers — session id, session workspace, session evidence, session manifest — with "run" surviving only as the registry's `recordedRuns` evidence noun and the `run` CLI command; no new artifact, path, or identifier uses "run" for lab operations (PRD 44 R-NAME-1).
- [x] t11: Define the session-root placement: OS temp root by default, or the machine-level store's lab area `<store-root>/conformance-lab/sessions/<session-id>/` for retained sessions — a narrowly named location that does not add store schema (PRD 44 R-NAME-2; PRD 38 consumed unchanged).
- [x] t12: Retire the repo-local transcript home everywhere live: remove the `.make-docs/conformance/` entry at `.gitignore:90` (explicitly preserving the adjacent `.make-docs/runs/` entry, which belongs to the store-migration lineage — inventory entry 16), move the default transcript pointer in `packages/cli/src/conformance/scenario.ts` off `.make-docs/conformance/` to the session-workspace/store-lab-area model with `transcriptLogPointer` values pointing into the store's lab area or stating `discarded-with-session`, and update the `.make-docs/conformance/` commentary in `packages/cli/src/conformance/registry.ts` (inventory entries 6 and 8), leaving the compiled package's embedded `.make-docs/conformance.json` record untouched (inventory entry 17).

### Acceptance criteria

- `grep -r '\.make-docs/conformance'` over `.gitignore`, `packages/cli/src/`, and `packages/cli/tests/` returns no hits; `.make-docs/runs/` remains in `.gitignore`; `packages/cli/src/operations/playbook-packaging/compiler.ts` still writes the unrelated `.make-docs/conformance.json` package record.
- Discarding a session root removes every session artifact; nothing from a session persists under the repository or repo-local `.make-docs/`.
- A retained-session path resolves under `<store-root>/conformance-lab/sessions/<session-id>/` and result-record `transcriptLogPointer` validation accepts only the store lab area or `discarded-with-session`.

### Dependencies

- Stages 1–2; Phase 1 test-fixture migration (the suites assert the new pointer forms).
