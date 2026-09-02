---
title: "44 Conformance Lab Sessions and Evidence"
kind: "prd"
status: "active"
source:
  type: "plan"
  path: "docs/plans/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/00-overview.md"
---

# 44 Conformance Lab Sessions and Evidence

## Purpose

This document defines the current product contract for conformance lab sessions, operator modes, and authoritative evidence homes. Normative requirements are stated in the sections below; Requirement History is provenance only.
## Scope

This authority owns conformance lab sessions, operator modes, and authoritative evidence homes. Related PRDs own adjacent capabilities and are linked where a cross-boundary contract is required.
## Component and Capability Map

The requirements below define the owned components, behaviors, boundaries, and evidence expectations for this capability.
## Requirements

### R-LAB-TEST Testing Executors and Human Experience

1. Lab sessions must distinguish agent-run Automated Implementation Testing and Performance Testing from human-executed Guided Progress Review and Unassisted Goal Testing.
2. Guided Progress Review uses an owner, maintainer, or developer with agent guidance and is always advisory or informational.
3. Unassisted Goal Testing uses a qualified human and preserves public-path, isolation, and anti-coaching controls.
4. Every testing session records the gate effect and must reject an unsupported blocking verdict.
5. At least one installed-product session must show that the human testing request is shorter, easier to understand, goal-led, and non-duplicative compared with the prior technical walkthrough pattern.

The requirements below are the normative authority. Their stable identifiers preserve traceability to the originating [conformance execution and lab-session design](../designs/2026-07-06-conformance-execution-and-lab-session-redesign.md), which is provenance rather than product authority.

### The Agent Drives, the Instruments Measure (R-EXEC)

- R-EXEC-1 (MUST): self-assessment is never self-attestation. In every execution mode, the target agent (or human operator) performs the discovery, invocation, and judgment-shaped work — but conformance evidence comes exclusively from deterministic instrument outputs: probe marker files, exit codes, listing captures, file inventories, and byte-level before/after uninstall diffs. A target agent's claim ("the skill appeared", "the plugin installed") is narrative context, never evidence; a bar stage with no instrument output is unasserted, full stop.
- R-EXEC-2 (MUST): uninstrumentable stages are recorded caveats, not trust fallbacks. Where a stage genuinely cannot be instrumented for a target, the session records the gap as a caveat on the result record — feeding the existing `pass-with-caveats` rules, which require surfaced caveats to advance a tuple — and never substitutes the agent's or operator's say-so for the missing instrument.
- R-EXEC-3 (MUST): unmet preconditions resolve to an honest `blocked` result record with `supportClaimUse: none` and an all-false evidence bar. [20-agent-harness-conformance-and-support-claims.md](./20-agent-harness-conformance-and-support-claims.md) owns verdict and support-claim governance, while [43-conformance-scenario-model-and-execution-kits.md](./43-conformance-scenario-model-and-execution-kits.md) owns the measured evidence bar; the execution protocol changes who drives, not what counts.
- R-EXEC-4 (MUST): optional Skill or agentics coverage is evaluated only when that exact surface is explicitly selected and admitted. Missing optional installation records `blocked` or uncovered for that tuple and never makes direct routers, system resources, CLI, or MCP incorrect.

### Result Records and Registry Promotion (R-RESULT)

- R-RESULT-1 (MUST): every compact normalized result records the full support tuple (`scenario`, `harness`, `surface`, `scope`, `modelOrProvider`, `runtime`) plus scenario version, model name, provider or routing layer when known, model version or immutable identifier when available, Make Docs version, runtime distribution, applicable selected-Skill or resource identity, run date, produced files, relevant diffs, exit status, transcript/log pointer, safety and simulation posture, per-stage install/discover/invoke/uninstall assertions and evidence references, normalized verdict, reason, caveats, reviewer status, and `supportClaimUse`.
- R-RESULT-2 (MUST): compact reviewed results commit at `conformance/results/<harness>/<YYYY-MM-DD>-<outcome-slug>-<seq>.json`. The result links to raw evidence by pointer and does not embed unredacted transcripts or provider logs; redacted evidence is promoted deliberately, while retained raw evidence follows R-NAME-2.
- R-RESULT-3 (MUST): a result is admitted to registry derivation only through `recordConformanceRunOnRegistryEntry` after schema validation and exact tuple matching. The seam refuses missing instrument receipts, false or unasserted required stages, tuple or harness mismatch, and simulation-posture mismatch. Narrative claims and operator attestations cannot flip a measured stage.
- R-RESULT-4 (MUST): [20-agent-harness-conformance-and-support-claims.md](20-agent-harness-conformance-and-support-claims.md) owns the status and public-claim rules. This evidence owner supplies the derivation inputs: `pass`, or `pass-with-caveats` with caveats preserved and the full evidence bar asserted, may advance the exact tuple to `conformance-validated`; `inconsistent`, `unsupported`, and `blocked` do not. Registry status remains a derived projection of recorded results, never a field an operator sets directly.

### Operator Modes: Three, All First-Class (R-MODE)

- R-MODE-1 (MUST): the lab documents three execution modes, all producing evidence through the same kit and instruments ([43](43-conformance-scenario-model-and-execution-kits.md) R-KIT, R-INST): human-only — the manual fallback, a human generates the kit, performs every step, and runs the instruments by hand from the generated kit prompts (no hand-maintained per-scenario runbook, which is exactly the drift executable-by-construction prevents); human plus assisting agent — an agent does setup (kit generation, workspace preparation, ingestion) while the human drives the target harness and prompts its self-assessment; and agent-multiplexed — an orchestrating agent uses a terminal-multiplexer tool to launch the target harness, deliver the prompts, monitor the session, and run instruments end to end, with the multiplexer tooling consumed as an environment capability, not built by Make Docs.
- R-MODE-2 (MUST): mode instructions live at `conformance/operator-modes.md` as executable protocol content in the maintainer-only `conformance/` directory owned by PRDs 43 and 44, with the developer conformance-lab guide summarizing and linking rather than duplicating.

### Lab Sessions and Evidence Homes (R-NAME)

- R-NAME-1 (MUST): the operational envelope is a lab session — session id, session workspace, session evidence, session manifest. The term `run` is reserved for the registry's `recordedRuns` evidence projection and the CLI `run` command; no lab-session artifact, path, or identifier uses `run` for its operational envelope.
- R-NAME-2 (MUST): `.make-docs/conformance/` is not a transcript home. Transcripts and evidence scratch live in the disposable session workspace and are discarded with it by default; deliberately redacted-and-promoted evidence lands in the committed result record; raw evidence retained beyond a session (kept transcripts, provider logs) goes to the machine-level store's lab area — `<store-root>/conformance-lab/sessions/<session-id>/`, defined narrowly here without owning store schema — never repo-local `.make-docs/`. Gitignore rules, default transcript pointers, registry commentary, and test fixtures contain no repo-local transcript destination; `transcriptLogPointer` values point into the store's lab area or state `discarded-with-session`.
- R-NAME-3 (MUST): performance evidence under [48 Performance Evidence Governance](48-performance-evidence-governance.md) does not gain a conformance lab-session identity, conformance result home, or registry status merely because it was collected by the same operator or tooling. One physical execution may contribute to both modes only when it separately satisfies the complete performance profile contract and the complete conformance session/evidence contract, with distinct identities, required fields, evidence references, and verdicts preserved for each mode.

Code anchors:

- `packages/cli/src/conformance/scenario.ts`
- `packages/cli/src/conformance/registry.ts`
- `conformance/operator-modes.md`
- `.gitignore`
## Contracts and Data

The named paths, schemas, state records, metadata fields, and evidence shapes in Requirements are normative contracts for this capability.
## Integrations

This capability integrates with the adjacent current authorities linked from Requirements and Source Anchors; those authorities remain owners of their own boundaries.
## Rebuild Notes

A rebuild must preserve the requirement identifiers, stable semantic anchors, ownership boundaries, and failure-safe behavior stated here. Implementation evidence does not silently weaken this authority.
## Requirement History

### 2026-08-08 — Not assigned

- Affected requirement or section: `Consolidated capability ownership`
- Previous contract: Current requirements were also represented by standalone editorial PRDs 37.
- Replacement contract: The applicable current requirements are inline in this authority and its linked product owners; the standalone editorial records are retired from the active set.
- Rationale: Active PRDs own product subjects and do not preserve editorial operations as product authority.
- Source: [PRD Authority Maintenance](../../.make-docs/system/references/prd-change-management.md)


### 2026-08-08 — W18 R13

- Affected requirement or section: `Document identity and current authority`
- Previous contract: The capability was represented as a standalone editorial change record whose title and structure described how the PRD set was modified.
- Replacement contract: This document now states the current conformance lab sessions, operator modes, and authoritative evidence homes requirements inline as product authority.
- Rationale: Active PRDs describe the current product shape; editorial operations belong in plans, work, and history.
- Source: [Conformance execution redesign](../designs/2026-07-06-conformance-execution-and-lab-session-redesign.md)

### 2026-08-14 — W19 R1

- Affected requirement or section: `The Agent Drives, the Instruments Measure; Result Records and Registry Promotion`
- Previous contract: Result records required generated-output and output-kind tuple dimensions, and the lab contract did not state how optional Skill absence relates to core product correctness.
- Replacement contract: Results bind to the current six-dimension installed-product support tuple with applicable Skill/resource provenance, while an unselected optional Skill is blocked or uncovered only for its own tuple and does not invalidate direct routers, resources, CLI, or MCP.
- Rationale: Lab evidence must remain honest and exact after package-specific scenarios leave the current product boundary, without turning optional agentics into a correctness prerequisite.
- Source: [W19 R1 recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md) and [accepted W19 R1 plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)

### 2026-08-28 — W21 R0

- Affected requirement or section: requirements, operator modes, evidence, and support gates.
- Previous contract: Lab sessions separated conformance and naive-UAT evidence but did not own the Guided Progress Review executor or a human testing experience proof.
- Replacement contract: Lab sessions preserve all four PRD 50 executor and gate boundaries and include installed-product evidence of a shorter, more meaningful human test.
- Rationale: The quality of the testing activity is part of Make Docs product quality.
- Source: [W21 R0 Proportionate Testing and Human-Centered Validation plan](../plans/2026-08-28-w21-r0-proportionate-testing-and-human-centered-validation/00-overview.md)

## Source Anchors

- [Performance Testing Guardrails design](../designs/2026-08-12-performance-testing-guardrails.md)
- [W19 R2 performance evidence plan](../plans/2026-08-13-w19-r2-performance-evidence-governance/00-overview.md)
- [48 Performance Evidence Governance](48-performance-evidence-governance.md)
- [W19 R1 recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md)
- [W19 R1 plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)

- [../designs/2026-07-06-conformance-execution-and-lab-session-redesign.md](../designs/2026-07-06-conformance-execution-and-lab-session-redesign.md)
- [../plans/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/00-overview.md](../plans/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/00-overview.md)
- [../work/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/00-index.md](../work/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/00-index.md)
- [03-open-questions-and-risk-register.md](03-open-questions-and-risk-register.md) (D-024, R-028)
- [20 Agent Harness Model Conformance Lab](20-agent-harness-conformance-and-support-claims.md)
- [43 Conformance Scenario Model and Execution Kits](43-conformance-scenario-model-and-execution-kits.md)
- [43 Conformance Scenario Model and Execution Kit](43-conformance-scenario-model-and-execution-kits.md)
- `packages/cli/src/conformance/scenario.ts`
- `.gitignore`
