---
title: "Phase 2: Evidence Bar and First-Pass Scenarios"
kind: "work"
status: "active"
coordinate: "W18 R9 P2"
source:
  type: "prd"
  path: "docs/prd/37-enhance-playbook-and-package-conformance.md"
---

# Phase 2: Evidence Bar and First-Pass Scenarios

## Purpose

Make `conformance-validated` earnable: implement the install-discover-invoke-uninstall evidence bar and author the required Codex-first first-pass scenario specs that prove the user-visible outcomes the current tests do not. This phase depends on the Phase 1 registry as the place verdicts and statuses are recorded.

## Overview

The bar is the four-assertion sequence a real-harness scenario must meet before a tuple may advance: install the generated distributable into the real or a faithfully simulated harness, assert discovery in the harness's listing, assert invocation of a bundled skill or driving of the workflow, and assert clean uninstall. The first pass targets the current product harnesses, Codex first, with the four R-SCEN-1 scenarios; Pi and additional harnesses are future scenarios whose absence is reported, never implied as covered. Scenarios follow the lab's protocol unchanged — model-agnostic, safety-moded, verdict-normalized, `blocked` on missing preconditions — and workflow-driving scenarios execute via the W18 R7 runner against distributables compiled per W18 R8 from the Playbook model as revised by the W18 R12 v2 authoring contract ([PRD 40](../../prd/40-revise-playbook-authoring-contract-v2.md)). Per the W18 R12 reconciliation (register item R-026): scenario source Playbooks are authored in v2 form, scenario scripts use the `plan`/`preview`/`write`/`ship` grammar from [PRD 41](../../prd/41-revise-cli-human-experience-and-package-grammar.md), and any scenario transcript consumed as evidence pins `--json` (or runs non-TTY) so the render layer never enters evidence.

## Source PRD Docs

- [37 Enhance Playbook and Package Conformance](../../prd/37-enhance-playbook-and-package-conformance.md)
- [20 Revise Agent Harness Model Conformance Lab](../../prd/20-revise-agent-harness-model-conformance-lab.md)
- [36 Revise Playbook Packaging Compiler and Harness Adapters](../../prd/36-revise-playbook-packaging-compiler-and-harness-adapters.md)
- [35 Revise Run Playbook State Machine](../../prd/35-revise-run-playbook-state-machine.md)
- [34 Revise Playbook Contract and Model](../../prd/34-revise-playbook-contract-and-model.md)
- [40 Revise Playbook Authoring Contract v2](../../prd/40-revise-playbook-authoring-contract-v2.md)
- [41 Revise CLI Human Experience and Package Grammar](../../prd/41-revise-cli-human-experience-and-package-grammar.md)

## Stage 1 - Evidence Bar

### Tasks

- [ ] t1: Implement the install-discover-invoke-uninstall bar as the scenario shape for packaging conformance: install the generated distributable into the real or a faithfully simulated harness, assert discovery via the harness's listing, assert invocation of a bundled skill or driving of the workflow, and assert clean uninstall without orphaned managed directories or deleted user-authored files (R-BAR-1).
- [ ] t2: Bind bar outcomes to the Phase 1 registry: a qualifying `pass`, or `pass-with-caveats` with surfaced caveats, advances the tuple to `conformance-validated`; `implementation-validated` requires only internal file and structure tests and no harness (R-BAR-2, R-REG-3).
- [ ] t3: Document any faithful-simulation mechanics used where a real harness cannot run in the lab, as a reviewed implementer choice per D8, and record which scenarios used simulation in their result records.

### Acceptance criteria

- The bar is exactly install, discover, invoke, and uninstall; a scenario missing any assertion cannot advance a tuple to `conformance-validated` (R-BAR-1).
- A tuple never skips from `provisional` to `conformance-validated` without meeting the bar, and internal tests alone never advance a tuple past `implementation-validated` (R-BAR-2).
- Uninstall assertions prove managed generated outputs are removed without orphaning empty managed directories or deleting user-authored files, covering the PRD 36 R-PROV-2 cleanliness scenario this lineage owns.

### Dependencies

- Phase 1 tuple registry; W18 R8 compiler outputs as the distributables under test.

## Stage 2 - Codex-First First-Pass Scenario Specs

### Tasks

- [ ] t4: Author the skills-bundle scenario spec: a generated skills bundle appears as a skill in the target harness and can be invoked (R-SCEN-1).
- [ ] t5: Author the plugin scenario spec: a generated plugin appears through a marketplace, installs, exposes its bundled skills, and is usable in a new thread (R-SCEN-1).
- [ ] t6: Author the dependency-check scenario spec: generated dependency checks surface missing tools and pass when the dependencies are present, with expectations bound to the v2 probe-based checks — each generated `cli`/`package-manager` check probes the dependency's resolved `probe` (the declared value or the `id` default), never `source` prose, and the scenario's fixture set includes at least one entry whose `source` prose does not begin with the binary name (R-SCEN-1; PRD 40 R-DEP-3, R-FIX-1).
- [ ] t7: Author the uninstall-and-backup scenario spec: uninstall and backup remove managed generated outputs without orphaning empty managed directories or deleting user-authored files (R-SCEN-1).
- [ ] t8: Declare per-scenario safety modes and preconditions per the lab protocol, so scenarios requiring credentials, network access, an unavailable harness, or model routing report `blocked` instead of inventing evidence (R-KEEP-1).
- [ ] t9: Record Pi and additional harnesses as future scenarios with their absence explicitly reported in the registry, not implied as covered (R-SCEN-2).

### Acceptance criteria

- All four R-SCEN-1 scenario specs exist under `docs/assets/conformance/`, target the current product harnesses Codex first, and are runnable or honestly `blocked`.
- Blocked scenarios report `blocked`; no unavailable scenario is marked passing or covered, and future-harness tuples show their unrun status in the registry (R-SCEN-2, R-KEEP-1).
- Scenarios stay model-agnostic with model, provider, and runtime captured as run metadata, and no destructive scenario runs against a maintainer's working tree (R-KEEP-1).
- Compact normalized result records are the committed evidence class; raw transcripts stay local unless deliberately redacted and promoted (R-KEEP-1).
- Scenario scripts use the remediated packaging grammar (`plan`/`preview`/`write`/`ship`; `--write` is retired), scenario source Playbooks are v2-form documents, and every transcript consumed as evidence pins `--json` or runs non-TTY — rendered TTY text never enters evidence (PRD 41 R-SEQ-2; register item R-026).

### Dependencies

- Stage 1 evidence bar; the W18 R7 progression operations for workflow-driving scenarios; the Playbook model (the W18 R6 lineage as revised by the W18 R12 v2 contract, PRD 40) consumed unchanged.
