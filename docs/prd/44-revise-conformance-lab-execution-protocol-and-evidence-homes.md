---
title: "44 Revise Conformance Lab Execution Protocol and Evidence Homes"
kind: "prd"
status: "active"
coordinate: "W18 R13"
source:
  type: "plan"
  path: "docs/plans/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/00-overview.md"
---

# 44 Revise Conformance Lab Execution Protocol and Evidence Homes

## Purpose

Revise the maintainer conformance lab's execution protocol and raw-evidence homes: agent-driven self-assessment replaces the human-operator runbook as the primary execution mode, governed by the named rule "the agent drives, the instruments measure" — self-assessment is never self-attestation, and conformance evidence comes exclusively from deterministic instrument outputs — with all three operator modes first-class; and the lab's repo-local raw-evidence default (`.make-docs/conformance/` or `.make-docs/runs/conformance/`) is rejected in favor of the disposable lab-session workspace plus the machine-level store's lab area, with "lab session" as the operational vocabulary so "run" is no longer overloaded. The revision closes register item [D-024](03-open-questions-and-risk-register.md) (the mandated transcript home regressed the no-repo-run-residue principle the W18 R7/R10 store architecture established). Source chain: [the W18 R13 design](../designs/2026-07-06-conformance-execution-and-lab-session-redesign.md) and [the W18 R13 plan](../plans/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/00-overview.md); the round is tracked as register item [R-028](03-open-questions-and-risk-register.md).

## Change Type

This doc records a `revision`. It supersedes the raw-artifact default in [20-revise-agent-harness-model-conformance-lab.md](20-revise-agent-harness-model-conformance-lab.md) — "raw run artifacts, transcripts, provider logs, and temporary workspaces default to `.make-docs/conformance/` or `.make-docs/runs/conformance/`" — and, in the same scope, the restatement of that default carried by [42-revise-conformance-asset-home-relocation.md](42-revise-conformance-asset-home-relocation.md)'s Effective Requirement and [37-enhance-playbook-and-package-conformance.md](37-enhance-playbook-and-package-conformance.md)'s Contracts and Data. It additionally revises the lab's execution protocol with the agent-driven rule, the three operator modes, and the lab-session vocabulary; the design's reconciliation inventory describes this side as an enhancement of PRD 20, and it is carried here in the revision doc because the evidence-home clause it rides with supersedes established requirement text (recorded classification judgment, per the change-doc selection rules). Everything else the lab fixes is explicitly unchanged: maintainer-only never-shipped scope, the scenario contract and safety modes, the result contract and its fields, the verdict vocabulary, the two evidence classes (compact committed records; raw evidence promoted only when deliberately redacted), support-claim gating, and the one-run-minimum threshold.

Route: `change-plan`

Coordinate: `W18 R13`

## Baseline Being Revised or Removed

- [20-revise-agent-harness-model-conformance-lab.md](20-revise-agent-harness-model-conformance-lab.md), Effective Requirement, lab scope: the raw-artifact default naming `.make-docs/conformance/` or `.make-docs/runs/conformance/` is superseded by R-NAME-2 below. The rest of the lab scope — maintainer-only, not installed, not shipped, not part of the `.make-docs/**` tool-directory system — is unchanged, as are the scenario contract, result contract, harness and adapter boundary, support-claim gating, and validation relationship in full.
- [20-revise-agent-harness-model-conformance-lab.md](20-revise-agent-harness-model-conformance-lab.md), Effective Requirement, execution protocol: the implicit human-operator-runbook execution model is revised — the lab gains agent-driven self-assessment as the primary mode under R-EXEC-1..3 and the three first-class operator modes under R-MODE-1..2, all producing evidence through the same generated kit and instruments defined by [43-revise-conformance-scenario-model-and-execution-kit.md](43-revise-conformance-scenario-model-and-execution-kit.md).
- [42-revise-conformance-asset-home-relocation.md](42-revise-conformance-asset-home-relocation.md), Effective Requirement: the sentence preserving "raw transcripts local under `.make-docs/conformance/` per PRD 20's evidence classes" is superseded, transcript-home clause only — everything else PRD 42 fixes, above all the repo-root `conformance/` home itself, is explicitly preserved and not revisited.
- `.gitignore` line 90 (`.make-docs/conformance/`), the default transcript pointer in `packages/cli/src/conformance/scenario.ts`, the `.make-docs/conformance/` commentary in `packages/cli/src/conformance/registry.ts`, and the test-fixture transcript pointers: all move off the old path at implementation. The adjacent `.gitignore` entry for `.make-docs/runs/` belongs to the store-migration lineage and is explicitly preserved.

## Rationale

Confirmed by the user on 2026-07-06 ([D-024](03-open-questions-and-risk-register.md)): the W18 R7 run-state principle, completed by W18 R10 (PRD 35/PRD 38), removed run residue from repo-local `.make-docs/` — run state and work-execution evidence are canonical in the machine-level store with no in-repo copy — while the lab's mandated transcript home is a second, ad-hoc, gitignored-but-repo-local `.make-docs/` run-residue family that nothing manages or migrates. It also hardens a fourfold overload of "run" (the registry's recorded-run noun, the `run` CLI command, Playbook runs, and the lab's operational sessions) into paths, exactly where the lab's honesty vocabulary needs precision: a recorded run that advances a tuple is not the same thing as an operational session that may end blocked. On the protocol side, the human-operator runbook was the only execution mode and was never actually driven; when projected (D-023), it failed. Making agent-driven self-assessment primary makes the cheapest honest path real — while the named rule keeps the failure mode the lab exists to prevent (files-written-equals-works, re-imported as agent-says-equals-works) out of the evidence layer: trusting the target agent's structured self-report was rejected absolutely.

Code anchors:

- `.gitignore`
- `packages/cli/src/conformance/scenario.ts`
- `packages/cli/src/conformance/registry.ts`
- `packages/cli/tests/conformance-governance.test.ts`
- `packages/cli/tests/conformance-scenarios.test.ts`

## Effective Requirement

The requirement set carries the design's requirement IDs so traceability holds; [../designs/2026-07-06-conformance-execution-and-lab-session-redesign.md](../designs/2026-07-06-conformance-execution-and-lab-session-redesign.md) is the normative statement of each.

### The Agent Drives, the Instruments Measure (R-EXEC)

- R-EXEC-1 (MUST): self-assessment is never self-attestation. In every execution mode, the target agent (or human operator) performs the discovery, invocation, and judgment-shaped work — but conformance evidence comes exclusively from deterministic instrument outputs: probe marker files, exit codes, listing captures, file inventories, and byte-level before/after uninstall diffs. A target agent's claim ("the skill appeared", "the plugin installed") is narrative context, never evidence; a bar stage with no instrument output is unasserted, full stop.
- R-EXEC-2 (MUST): uninstrumentable stages are recorded caveats, not trust fallbacks. Where a stage genuinely cannot be instrumented for a target, the session records the gap as a caveat on the result record — feeding the existing `pass-with-caveats` rules, which require surfaced caveats to advance a tuple — and never substitutes the agent's or operator's say-so for the missing instrument.
- R-EXEC-3 (MUST): blocked-honesty semantics are preserved unchanged: unmet preconditions resolve to an honest `blocked` result record (`supportClaimUse: none`, all-false evidence bar) exactly as PRD 37 and the W18 R9 machinery already enforce. The redesign changes who drives, not what counts.

### Operator Modes: Three, All First-Class (R-MODE)

- R-MODE-1 (MUST): the lab documents three execution modes, all producing evidence through the same kit and instruments ([43](43-revise-conformance-scenario-model-and-execution-kit.md) R-KIT, R-INST): human-only — the manual fallback, a human generates the kit, performs every step, and runs the instruments by hand, with the parked `CONFORMANCE-RUN-codex-plugin.md` walkthrough as raw material for these instructions (its content is absorbed; the file itself is the user's working file, never modified by agents, retired by the user when absorbed); human plus assisting agent — an agent does setup (kit generation, workspace preparation, ingestion) while the human drives the target harness and prompts its self-assessment; and agent-multiplexed — an orchestrating agent uses a terminal-multiplexer tool to launch the target harness, deliver the prompts, monitor the session, and run instruments end to end, with the multiplexer tooling consumed as an environment capability, not built by Make Docs.
- R-MODE-2 (MUST): mode instructions live at `conformance/operator-modes.md` — executable protocol content in the maintainer-only `conformance/` directory per D-022 — with the developer conformance-lab guide summarizing and linking rather than duplicating.

### Lab Sessions and Evidence Homes (R-NAME)

- R-NAME-1 (MUST): the operational envelope is a lab session — session id, session workspace, session evidence, session manifest. "Run" survives in exactly two prior meanings that do not change: the registry's `recordedRuns` projection (the evidence-layer noun, per the unchanged contracts) and the `run` CLI command. No new artifact, path, or identifier uses "run" for lab operations.
- R-NAME-2 (MUST): the `.make-docs/conformance/` transcript home is rejected (D-024). Transcripts and evidence scratch live in the disposable session workspace and are discarded with it by default; deliberately redacted-and-promoted evidence lands in the committed result record; raw evidence retained beyond a session (kept transcripts, provider logs) goes to the machine-level store's lab area — `<store-root>/conformance-lab/sessions/<session-id>/`, defined narrowly here without owning store schema — never repo-local `.make-docs/`. The `.gitignore` entry, the `scenario.ts` default transcript pointer, the `registry.ts` commentary, and the test-fixture pointers all move off the old path at implementation; `transcriptLogPointer` values in result records point into the store's lab area or state `discarded-with-session`.

Code anchors:

- `packages/cli/src/conformance/scenario.ts`
- `packages/cli/src/conformance/registry.ts`
- `conformance/operator-modes.md`
- `.gitignore`

## Impacted Docs and Dependencies

- [20-revise-agent-harness-model-conformance-lab.md](20-revise-agent-harness-model-conformance-lab.md): the revised baseline — evidence-home default and execution protocol; its verdicts, safety modes, evidence classes, result contract, storage boundaries otherwise, and one-run threshold are unchanged.
- [43-revise-conformance-scenario-model-and-execution-kit.md](43-revise-conformance-scenario-model-and-execution-kit.md): the sibling W18 R13 change doc — it owns the kit, instruments, prompts, discovery kit, and ingestion machinery these protocol rules govern, and its R-ING ingestion is the only path from a lab session to the recording seam.
- [42-revise-conformance-asset-home-relocation.md](42-revise-conformance-asset-home-relocation.md): superseded in its raw-transcripts sentence only; its repo-root `conformance/` home and everything else it fixes are explicitly preserved.
- [37-enhance-playbook-and-package-conformance.md](37-enhance-playbook-and-package-conformance.md): its Contracts and Data raw-evidence default is superseded here (annotated jointly with [43](43-revise-conformance-scenario-model-and-execution-kit.md)); its registry, bar, statuses, layers, and governance are untouched.
- [35-revise-run-playbook-state-machine.md](35-revise-run-playbook-state-machine.md) and [38-revise-global-store-and-project-state.md](38-revise-global-store-and-project-state.md): consumed unchanged — this revision restores their no-repo-run-residue principle to the lab; the store's lab area is a narrowly named location, and any store-schema implications follow PRD 38's ownership; no annotation required.
- The compiled package's embedded `.make-docs/conformance.json` conformance record (PRD 36) is an unrelated generated file inside distributables and does not move — the near-collision is noted in D-024 and explicitly preserved.
- Dated docs naming the old transcript home (the 2026-06-19 lab design, the W10 R5 plan and work phases, the 2026-06-25/2026-07-03 history records) are historical evidence and stay as-is; the completed W18 R9 backlog index receives a reconciliation note, never a rewrite.
- [00-index.md](00-index.md) carries the catalog update; [03-open-questions-and-risk-register.md](03-open-questions-and-risk-register.md) already records D-024 with its close bar and R-028 as the tracking item, closing on this round's implementation.

Code anchors:

- `packages/cli/src/operations/playbook-packaging/compiler.ts`
- `packages/cli/tests/conformance-governance.test.ts`

## Required Baseline Annotations

- [20-revise-agent-harness-model-conformance-lab.md](20-revise-agent-harness-model-conformance-lab.md): `Superseded by` appended newest-last to the existing `### Change Notes` under Effective Requirement, scoped to the raw-artifact default and the execution protocol (lab-session vocabulary, three operator modes, agent-driven rule), with the lab core explicitly unchanged.
- [42-revise-conformance-asset-home-relocation.md](42-revise-conformance-asset-home-relocation.md): `Superseded by` as a new `### Change Notes` under Effective Requirement, scoped to the raw-transcripts sentence only; the repo-root `conformance/` home is explicitly preserved.
- [37-enhance-playbook-and-package-conformance.md](37-enhance-playbook-and-package-conformance.md): the joint Contracts and Data annotation is carried in [43](43-revise-conformance-scenario-model-and-execution-kit.md)'s annotation plan and links both docs.
- [00-index.md](00-index.md): add this doc to the reading order, document map, source anchors, audience paths, and intended follow-on.

## Source Anchors

- [../designs/2026-07-06-conformance-execution-and-lab-session-redesign.md](../designs/2026-07-06-conformance-execution-and-lab-session-redesign.md)
- [../plans/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/00-overview.md](../plans/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/00-overview.md)
- [../work/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/00-index.md](../work/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/00-index.md)
- [03-open-questions-and-risk-register.md](03-open-questions-and-risk-register.md) (D-024, R-028)
- [20 Revise Agent Harness Model Conformance Lab](20-revise-agent-harness-model-conformance-lab.md)
- [42 Revise Conformance Asset Home Relocation](42-revise-conformance-asset-home-relocation.md)
- [43 Revise Conformance Scenario Model and Execution Kit](43-revise-conformance-scenario-model-and-execution-kit.md)
- `packages/cli/src/conformance/scenario.ts`
- `.gitignore`
