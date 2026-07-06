---
title: "W18 R13: Conformance Execution and Lab Session Redesign Round"
kind: "history"
status: "completed"
date: "2026-07-06"
client: "Claude Code"
model: "Fable 5"
coordinate: "W18 R13"
repo: "make-docs"
branch: "make-docs-v2"
summary: "Opened the W18 R13 conformance execution redesign round: captured three confirmed-drift items (never-executable first-pass specs, the repo-local transcript home regression, harness-as-scenario-identity) plus the R-028 tracking item in the register, updated R-021/R-022/Q-022 in place, and authored the design doc establishing domain-organized harness-agnostic scenarios, generated per-target self-assessment kits under 'the agent drives, the instruments measure', three first-class operator modes, ingestion into the unchanged recording seam, lab-session naming, and a twenty-entry reconciliation inventory. Design only; no implementation, no commits."
---

# W18 R13: Conformance Execution and Lab Session Redesign Round

## Changes

This session opened the conformance-execution redesign round. The trigger: projecting the committed W18 R9 P2 scenario specs into a hand-runnable operator walkthrough (the user's deliberately untracked `CONFORMANCE-RUN-codex-plugin.md`, read as evidence, never modified) exposed three code-verified defects proving the specs were never executable as written, and the user's review of the execution layer produced five authoritative decisions: definitions by domain with evidence by target and kits generated on demand (permanent direction away from harness-as-identity), agent-driven self-assessment as the primary mode under the named rule "the agent drives, the instruments measure," all three operator modes first-class, ingestion into the existing recording seam with the registry/bar/governance/meta-verification machinery unchanged, and rejection of the `.make-docs/conformance/` transcript home with new "lab session" vocabulary. The session produced the register capture, the design doc, and this record — no implementation, no commits, and the user's two untracked working files (`UAT-W18-R7-R8.md`, `CONFORMANCE-RUN-codex-plugin.md`) untouched.

### Register capture

| Item | Disposition |
| --- | --- |
| [D-023](../../../prd/03-open-questions-and-risk-register.md) (new, Open) | The first-pass scenario specs were never executable as written: the ship steps omit `--support-evidence-ref` (the planner's unconditional `missing-support-evidence` stop aborts `ship` before writing), the non-TTY uninstall step cannot pass confirmation without the `--yes` the specs omit, and the workspace steps never establish the packaging precondition attestations. Recorded as the library-without-wiring pattern recurring at the protocol layer (spec-without-execution), with executable-by-construction kit generation as the close-bar direction. |
| [D-024](../../../prd/03-open-questions-and-risk-register.md) (new, Open) | The PRD 20/37-mandated `.make-docs/conformance/` transcript home contradicts the W18 R7 run-state principle completed by W18 R10 (no run residue in repo-local `.make-docs/`) and overloads "run". User resolution: evidence scratch lives in the disposable lab-session workspace, promoted evidence in committed result records, retained raw evidence in the machine-level store's lab area; the operational envelope is a "lab session". The compiled package's unrelated `.make-docs/conformance.json` record is explicitly preserved. |
| [D-025](../../../prd/03-open-questions-and-risk-register.md) (new, Open) | Harness-named scenario identity (`codex-*` ids plus `futureHarnesses` implying copy-per-harness) bifurcates the eight-dimension tuple model the directory's own Scope paragraph states. User resolution: definitions by domain, evidence by target, `futureHarnesses` retired in favor of explicit target bindings with absence reported (R-SCEN-2 preserved). |
| [R-028](../../../prd/03-open-questions-and-risk-register.md) (new, Open) | The round's tracking item (R-026/R-027 pattern): scope of the redesign, the explicitly-unchanged machinery, and the user's nothing-under-the-rug mandate — the design's reconciliation inventory is the implementation's acceptance checklist, with the inventory greps as completion proof. |
| [R-021](../../../prd/03-open-questions-and-risk-register.md) (updated in place) | The redesign supersedes the committed spec forms but neither the evidence bar nor the close bar; the characterization preamble's intent carries forward intact as the first-run discovery kit whose instrument-recorded ground truth feeds descriptor corrections — the resolution plan for the negative Codex v0.142.4 probe is preserved in the new execution form. |
| [R-022](../../../prd/03-open-questions-and-risk-register.md) (updated in place) | The four codex-* spec forms and the human-runbook mode are superseded with `REQUIRED_FIRST_PASS_SCENARIOS`, the R-TEST-2 check, and `plannedScenarios` reconciled in the same change; blocked-honesty, bar stages, verdict derivation, and the recording seam untouched; the close bar reads onto the redesigned forms. |
| [Q-022](../../../prd/03-open-questions-and-risk-register.md) (updated in place) | Noted the new interaction: the conformance kit is a consumer of the packaging pipeline, making first-pass evidence the pipeline's first end-to-end dogfood; the kit generator's maintainer-only home is the revisit seam if lab surfaces ever become first-party. |
| [D-022](../../../prd/03-open-questions-and-risk-register.md) | No change: the repo-root `conformance/` location stands. |

### Design doc

[The W18 R13 design](../../../designs/2026-07-06-conformance-execution-and-lab-session-redesign.md) covers: the named rule R-EXEC-1..3 (evidence only from deterministic instrument outputs — probe files, exit codes, listing captures, byte-level uninstall diffs; uninstrumentable stages are recorded caveats, not trust fallbacks; blocked-honesty unchanged); `conformance/scenarios/<domain>/` harness-agnostic definitions (`packaging` now, `playbook-runs` later) with domain-qualified ids and `conformance/results/<harness>/` for committed records; the scenario-schema revision (`packagingExtension` survives with `domain` and a per-target `targets` map; `harness`/`futureHarnesses` removed; `characterization` generalizes to `discoveryKit` with the R-021 linkage verbatim); the kit (artifacts shipped through the real packaging pipeline with kit-supplied evidence refs, confirmation flags, and precondition establishment — the structural fix for all three D-023 defects — plus prompts, instruments, and a session manifest, in a disposable `kit/`/`workspace/`/`evidence/` workspace outside the repo); the kit-generation home decision (lab module in `packages/cli/src/conformance/` behind maintainer tooling, deliberately not a registered operation — the W18 R11 parity rule is preserved vacuously and shipping a command whose required assets are excluded from every install would repeat D-022's category error; revisit seam on Q-022); the R-CAP-2 constraint that new harness knowledge is authored into the descriptors' lab-facing interrogation block, never a kit-local table; ingestion assembling `conformance.result.v1` records fail-closed from instrument outputs and feeding the unchanged `recordConformanceRunOnRegistryEntry` seam; the three operator modes with instructions at `conformance/operator-modes.md` and the parked walkthrough as human-only raw material; the lab-session naming decision; a twenty-entry reconciliation inventory built from real greps (PRD 37/PRD 20 change-management revisions, the four spec files' replacement, registry `plannedScenarios`, `scenario.ts`/`meta-verification.ts`/`registry.ts` and the four test suites, the developer guide and the four claim surfaces, the README Scope-paragraph extension and routers, backlog/history reconciliation notes, `.gitignore`, and the explicitly-preserved compiler record, fixtures, PRD 42, and user working files); non-goals; and verification including a new enforcing executability check.

### Validation

Docs-only session: `npm run validate:defaults` green (no consistency-pin extension required — no shipped default changed), `python3 .make-docs/scripts/check_path_hygiene.py` clean, relative links verified against targets on disk, `git diff --check` clean. Nothing committed, per the round's instruction.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/prd/03-open-questions-and-risk-register.md](../../../prd/03-open-questions-and-risk-register.md) | Added D-023, D-024, D-025, and R-028; updated R-021, R-022, and Q-022 in place. |
| [docs/designs/2026-07-06-conformance-execution-and-lab-session-redesign.md](../../../designs/2026-07-06-conformance-execution-and-lab-session-redesign.md) | New W18 R13 design: conformance execution and lab session redesign. |
| [docs/assets/archive/history/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign.md](2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign.md) | This record. |

### Developer

None this session.

### User

None this session.
