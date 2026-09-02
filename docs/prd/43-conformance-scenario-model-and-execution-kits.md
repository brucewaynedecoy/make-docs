---
title: "43 Conformance Scenario Model and Execution Kits"
kind: "prd"
status: "active"
source:
  type: "plan"
  path: "docs/plans/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/00-overview.md"
---

# 43 Conformance Scenario Model and Execution Kits

## Purpose

This document defines the current product contract for portable conformance scenarios, disposable execution kits, and deterministic installed-product proof. The maintainer lab validates only current evidence-backed Skill, CLI, MCP, system-resource, optional-agentics, and model/provider support surfaces; it has no Playbook, Protocol, plugin, workflow-bundle, package-compiler, or generated-output scenario family.

## Scope

This authority owns harness-agnostic scenario definitions, per-target bindings, execution-kit generation, deterministic instruments, independent discovery prompts, ingestion, and meta-verification. PRD [20](20-agent-harness-conformance-and-support-claims.md) owns public support claims, and PRD [44](44-conformance-lab-sessions-and-evidence.md) owns lab sessions, operator modes, and evidence homes.

## Component and Capability Map

- Scenario definitions: versioned, harness-agnostic outcomes under repo-root `conformance/scenarios/<domain>/`.
- Target bindings: evidence-backed instructions for current supported harnesses without a packaging-adapter registry.
- Execution kits: disposable per-scenario/per-target workspaces outside the repository.
- Instruments: deterministic install, discover, invoke, and uninstall measurements.
- Ingestion: fail-closed result assembly into the existing recording seam.
- Meta-verification: joins validated tuples to eligible instrumented results and prevents maintainer-only assets from shipping.

## Requirements

### R-SCEN-TEST Proportionate Testing Failure Model

Testing scenarios must carry product maturity, the current decision, available authority, expected selected and skipped testing types, executor boundaries, effort budget, stop condition, evidence and reuse state, gate effect, and the failure the scenario must reveal.

The scenario set must include focused automated proof, justified expansion, unsupported release-grade work, an unstable MVP that rejects irrelevant production-grade performance work, a real feasibility cliff, non-gate Guided Progress Review, anti-coached Unassisted Goal Testing, valid `not-needed-now`, Human Experience evidence reuse, false-obligation prevention, and rejection of blocking verdicts without authority.

### Organization: Definitions by Domain, Evidence by Target (R-ORG)

- R-ORG-1 (MUST): scenario definitions are harness-agnostic and live under `conformance/scenarios/<domain>/`. Domains and definitions represent current installed-product outcomes with an owning PRD; no domain or definition represents Playbook/Protocol authoring or execution, plugin or workflow-bundle installation, package compilation, generated outputs, marketplace registration, or packaging adapters.
- R-ORG-2 (MUST): evidence and results organize by execution target at `conformance/results/<harness>/<YYYY-MM-DD>-<outcome-slug>-<seq>.json`. Model/provider, runtime, distribution, scenario version, resource URI, selected Skill, and other applicable dimensions live inside each record; directory layout is storage, not a second query surface.
- R-ORG-3 (MUST): the repo-root tuple registry is the single queryable support index. A scenario domain groups outcome definitions by current product area, and neither domain nor scenario identity encodes an execution target.

### Scenario Schema and Target Bindings (R-SCHEMA)

- R-SCHEMA-1 (MUST): `conformance.scenario.v1` records scenario id and version, domain, installed-product goal, public entry surface, safety mode, workspace policy, evidence-bar assertions, transcript policy, preconditions, fixtures, and a `targets` map keyed by harness id. Target bindings carry harness execution instructions, exact registry tuple ids, and target-specific precondition and interrogation probes; no top-level harness identity is valid.
- R-SCHEMA-2 (MUST): a harness without a `targets` entry is uncovered. Kit generation fails closed naming the missing binding, and the tuple registry reports scenario absence rather than implying coverage.
- R-SCHEMA-3 (MUST): target bindings refer only to current CLI commands, native MCP resources/tools, explicitly selected Skill exposure, or another admitted optional-agentics surface. Archived commands, Playbook/Protocol operations, plugin/package operations, and unsupported APIs cannot project to a runnable kit.

### Evidence Bar (R-BAR)

- R-BAR-1 (MUST): a tuple reaches `conformance-validated` only when the scenario installs or establishes the real installed product in its declared posture, asserts discovery through the target's own public recognition surface, invokes or exercises the claimed capability through that surface, and cleans up/uninstalls while proving user-authored content remains untouched. Each required stage is measured by a deterministic instrument.
- R-BAR-2 (MUST): internal file, schema, unit, and integration tests may establish only `implementation-validated`. A tuple never reaches `conformance-validated` without a recorded eligible verdict and all required R-BAR-1 measurements. Faithful simulation is labeled as simulated and cannot be worded as real-harness evidence.
- R-BAR-3 (MUST): unmet preconditions or unavailable current operations produce `blocked` with all unsupported assertions false. A scenario is never omitted or relaxed to obtain a passing claim.
- R-BAR-4 (MUST): a `PERF-###` profile, performance outcome, or waiver under [48 Performance Evidence Governance](48-performance-evidence-governance.md) cannot establish install, discover, invoke, or uninstall evidence, satisfy R-BAR-1, or advance a tuple to `conformance-validated`. When one physical execution contributes evidence to both performance and conformance, each mode retains its own authority, required fields, instrument outputs, evidence references, and separate verdict; neither verdict substitutes for the other.

### Eligible Current Scenarios (R-SCEN)

- R-SCEN-1 (MUST): the current scenario inventory is limited to support claims for installed Make Docs, typed CLI operations, native MCP resources/tools, explicitly selected Skills including the first-party Naive-UAT Skill, and optional agentics that satisfy PRD 30's admission boundary.
- R-SCEN-2 (MUST): a selected-Skill scenario verifies explicit selection, native discovery, delegation to the current typed operation, receipt/result parity with direct CLI/MCP use, and clean removal. It does not validate duplicated Skill-local business logic because such logic is prohibited.
- R-SCEN-3 (MUST): a Naive-UAT Skill scenario proves routing and operation delegation only. Tester qualification, installed-product targeting, anti-coaching, Persona choice, scenario semantics, evidence destination, findings, and gates remain PRD-owned policy and are not re-authored in the kit.
- R-SCEN-4 (MUST): no required or planned scenario id, fixture, expected-evidence table, registry tuple, or support claim may name a Playbook, Protocol, plugin, workflow bundle, package compiler, generated plugin, generated Skill bundle, marketplace install, or packaging dependency-materialization outcome as current coverage.

### Per-Target Disposable Execution Kits (R-KIT)

- R-KIT-1 (MUST): a kit is generated on demand for one definition/target pair or one target's current suite into a disposable lab-session workspace outside the repository. It contains a prepared installed-product fixture, target prompts, deterministic instrument scripts, and a manifest recording definition id, target, tuple ids, generation inputs, current CLI/runtime identity, precondition attestations, and the expected-evidence table.
- R-KIT-2 (MUST): the workspace layout is `<session-root>/kit/`, `<session-root>/workspace/`, and `<session-root>/evidence/`. The workspace is disposable by default, discarded after ingestion, and never written under the repository or repo-local `.make-docs/`.
- R-KIT-3 (MUST): kit generation derives every emitted command and resource operation from the current registered public surface. It fails before session start when a current definition cannot project to an accepted command or operation sequence. The real session workspace runs setup normally and keeps P5-through-P10 quiescence active. P6 does not require or preserve a successful `package.ship` proof over frozen legacy Playbook package operations. P8 owns removal of the legacy package conformance surfaces or an owner-approved retargeting. A future non-Playbook packaging conformance design requires new owner authority.
- R-KIT-4 (MUST): the target operates the installed product and public interface. Internal modules, private repository shortcuts, fabricated harness behavior, or direct mutation of expected outputs are prohibited evidence paths.

### Maintainer Lab Home (R-HOME)

- R-HOME-1 (MUST): kit generation remains maintainer-only code under `packages/cli/src/conformance/`, invoked through maintainer tooling. It is not registered in the shipped operation registry or exposed on the shipped CLI/MCP surface because the repo-root `conformance/` assets are structurally absent from installed projects and packages.
- R-HOME-2 (MUST): verified harness interrogation knowledge has one lab-facing source consumed by kit generation. It may describe how to list current Skills, locate public CLI/MCP results, and observe invocation evidence; it must not become a packaging capability descriptor, plugin adapter registry, or second support-claim authority.

### Deterministic Instruments (R-INST)

- R-INST-1 (MUST): every asserted evidence-bar stage has a deterministic instrument whose machine-verifiable output lands in `evidence/`: install/establish captures exit status and relevant inventory; discover captures the target's own listing or recognition surface; invoke captures a deterministic marker or typed result; uninstall/cleanup captures a byte-level before/after diff proving managed outputs removed, user content untouched, and no orphaned managed directories.
- R-INST-2 (MUST): instruments capture and do not interpret. Ingestion compares their outputs with the manifest's expected-evidence table.
- R-INST-3 (MUST): instruments are deterministic and spend no network or model routing. Operator or target-agent judgment is bracketed by measurements rather than treated as evidence.

### Independent Discovery and Anti-Coaching (R-PROMPT)

- R-PROMPT-1 (MUST): prompts include honesty rules verbatim: `blocked` is valid, failures are evidence, assertions never relax, and the target's narrative claims are not evidence. The target performs its own discovery and assessment before instruments measure the outcome.
- R-PROMPT-2 (MUST): prompts do not disclose expected answers, internal architecture, hidden remediation steps, private paths, or instrument-success shortcuts that coach the target around the installed public interface.
- R-PROMPT-3 (MUST): target-specific rendering uses only verified public harness instructions. Unsupported or unknown behavior remains a blocked precondition, not an invented prompt path.

### Ingestion and Existing Recording Seam (R-ING)

- R-ING-1 (MUST): ingestion assembles a `conformance.result.v1` record from the session. Evidence-bar booleans derive solely from validated instrument outputs; a missing or failed output yields `false`, with no narrative rescue. Human or agent input is limited to distinguishable attestations, run metadata, and the narrative reason.
- R-ING-2 (MUST): a validated record commits under `conformance/results/<harness>/` and binds to its exact six-dimension PRD 20 tuple only through `recordConformanceRunOnRegistryEntry`. Existing refusals for unasserted stages, tuple mismatch, harness mismatch, and simulation-posture mismatch remain authoritative.

### Verification and Meta-Verification (R-TEST)

- R-TEST-1 (MUST): registry verification joins every `conformance-validated` tuple to a committed result for the same tuple and verifies an eligible verdict plus all required measured stages. Missing receipts, tuple mismatch, harness mismatch, simulation-posture mismatch, or an unasserted stage fails closed.
- R-TEST-2 (MUST): every current scenario referenced by the tuple registry exists and passes static kit projection against the current registered command and resource surface. Tests prove fail-closed projection, active quiescence in the real session workspace, migration safety, and byte-identical kit output for equal inputs. P6 does not execute frozen Playbook package operations as conformance proof. Missing operations or preconditions produce `blocked`, never omission or a silent pass.
- R-TEST-3 (MUST): exclusion checks scan the shipped template, packaged copy, npm tarballs, and generated product packages for the root-level `conformance/` family and its distinctive schema/path markers, while also rejecting the retired `docs/assets/conformance/` path. Finding any marker in a shipped surface fails packaging validation.
- R-TEST-4 (MUST): meta-verification rejects any current scenario, tuple, or support record for Playbook/Protocol, plugin, workflow-bundle, compiler, generated-output, marketplace, adapter, or packaging-dependency outcomes.

## Contracts and Data

The named paths, scenario schema, tuple bindings, result records, instrument outputs, evidence-bar assertions, and recording seam in Requirements are normative contracts for this capability.

## Integrations

PRD 20 owns tuple status and public wording; PRD 44 owns sessions, operator modes, and evidence homes; PRDs 08 and 28 own current Skills selection and exposure; PRD 30 owns optional integration admission; PRD 46 owns Naive-UAT semantics; and PRDs 34–36 own the adjacent no-capability and legacy boundaries.

## Rebuild Notes

A rebuild must preserve harness-agnostic definitions, exact tuple binding, blocked outcomes, public-interface execution, independent discovery, deterministic instruments, fail-closed ingestion, and maintainer-only exclusion. It must not recreate package-specific scenarios from historical fixtures or names.

## Canonical Conformance Asset Home

Repo-root `conformance/` is the versioned, authoritative maintainer-infrastructure home and contains `tuple-registry.json`, `scenarios/`, `fixtures/`, `README.md`, and `results/` once recorded results exist. It is outside `docs/assets/` because it is machine-validated data and executable protocol, outside `packages/` because it is never shipped product, and is edited in place rather than authored in `packages/docs/template/`.

Current requirements, loaders, tests, and claim surfaces resolve only this repo-root family. References to `docs/assets/conformance/` in dated designs, plans, completed work, and history records describe historical states; they do not define a current alternate home. Machine-local transcripts and session evidence follow PRD 44 and never turn the repository or repo-local `.make-docs/` into run-residue storage.

## Requirement History

### 2026-08-08 — Not assigned

- Affected requirement or section: `Consolidated capability ownership`
- Previous contract: Current requirements were also represented by standalone editorial PRDs 37, 42.
- Replacement contract: The applicable current requirements are inline in this authority and its linked product owners; the standalone editorial records are retired from the active set.
- Rationale: Active PRDs own product subjects and do not preserve editorial operations as product authority.
- Source: [PRD Authority Maintenance](../../.make-docs/system/references/prd-change-management.md)

### 2026-08-08 — W18 R13

- Affected requirement or section: `Document identity and current authority`
- Previous contract: The capability was represented as a standalone editorial change record whose title and structure described how the PRD set was modified.
- Replacement contract: This document stated portable conformance scenarios, execution kits, deterministic verification, and a required four-scenario package-output first pass as current authority.
- Rationale: Active PRDs describe the current product shape; editorial operations belong in plans, work, and history.
- Source: [Conformance execution redesign](../designs/2026-07-06-conformance-execution-and-lab-session-redesign.md)

### 2026-08-14 — W19 R1

- Affected requirement or section: `Purpose; Eligible Current Scenarios; Independent Discovery and Anti-Coaching; Verification and Meta-Verification`
- Previous contract: The scenario catalog and first-pass suite were centered Playbook-generated plugins, Skill bundles, marketplace installation, packaging dependency checks, packaging adapters, and generated-output support tuples.
- Replacement contract: The maintainer lab retains installed-product, Skill, CLI, MCP, system-resource, optional-agentics, and model/provider conformance only; Playbook/Protocol, plugin, workflow-bundle, compiler, adapter, marketplace, and generated-package scenarios are absent, while independent discovery and deterministic proof remain mandatory.
- Rationale: Conformance must verify current supported surfaces without preserving removed product capabilities or weakening honest, instrumented evidence.
- Source: [W19 R1 recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md) and [accepted W19 R1 plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)

### 2026-08-28 — W21 R0

- Affected requirement or section: requirements, scenario model, execution kits, and ingestion.
- Previous contract: Conformance scenarios covered retained resource, Skill, UAT, and performance surfaces without one shared failure model for proportionality and human testing experience.
- Replacement contract: Scenarios must reveal both missing justified proof and excess, early, duplicate, unauthorized, or needlessly difficult testing under PRD 50.
- Rationale: A model that only proves successful execution cannot detect the testing behavior that made Make Docs costly and frustrating.
- Source: [W21 R0 Proportionate Testing and Human-Centered Validation plan](../plans/2026-08-28-w21-r0-proportionate-testing-and-human-centered-validation/00-overview.md)

### 2026-08-30 — W19 R1 P6

- Affected requirement or section: `R-KIT-3; R-TEST-2`
- Previous contract: The end-to-end `package.ship` preview proof used the real session workspace after setup had activated the P5-through-P10 migration-quiescence barrier.
- Replacement contract: The exact projected command and byte-identical argument vector run through the real plan, preview, and write-with-no-writes path in a required deterministic copy of the freshly materialized session fixture. The copy omits only `.make-docs/state/migration.lock.json`, `.make-docs/state/legacy-quiescence.json`, `.make-docs/state/legacy-writers/`, and `.make-docs/state/migration-receipts/`; byte-level checks reject any other difference and prove that the session fixture stays unchanged. Root binding uses only execution context or current working directory. The proof has no setup, uses a proof-local Store, leaves no proof residue, does not change the operator Store, and never becomes session evidence. The real session workspace keeps setup and active quiescence.
- Rationale: The executable-by-construction proof and the migration safety barrier must both remain effective.
- Source: [W19 R1 P6 work authority](../work/2026-08-14-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/06-global-store-evolution.md)

### 2026-08-30 — W19 R1 P6 retirement reconciliation

- Affected requirement or section: `R-KIT-3; R-TEST-2`
- Previous contract: P6 tried to preserve the historical `package.ship` proof in a deterministic proof-only copy while the real session kept migration quiescence.
- Replacement contract: P6 proves static projection, active quiescence, and migration safety only. It does not require a successful proof over frozen Playbook package operations. P8 owns removal of those legacy conformance surfaces or an owner-approved retargeting. A future non-Playbook packaging conformance design requires new owner authority.
- Rationale: P6 must not weaken the P5-through-P10 legacy-writer barrier to preserve a conformance proof for product surfaces that W19 removed from current coverage.
- Source: [W19 R1 P6 work authority](../work/2026-08-14-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/06-global-store-evolution.md)

## Source Anchors

- [Performance Testing Guardrails design](../designs/2026-08-12-performance-testing-guardrails.md)
- [W19 R2 performance evidence plan](../plans/2026-08-13-w19-r2-performance-evidence-governance/00-overview.md)
- [48 Performance Evidence Governance](48-performance-evidence-governance.md)
- [W19 R1 recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md)
- [W19 R1 plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)
- [../designs/2026-07-06-conformance-execution-and-lab-session-redesign.md](../designs/2026-07-06-conformance-execution-and-lab-session-redesign.md)
- [../plans/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/00-overview.md](../plans/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/00-overview.md)
- [../work/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/00-index.md](../work/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/00-index.md)
- [03-open-questions-and-risk-register.md](03-open-questions-and-risk-register.md) (D-023, D-025, R-028, R-021, Q-022)
- [20 Agent Harness Conformance and Support Claims](20-agent-harness-conformance-and-support-claims.md)
- [36 Agentic Packaging and Adapter Boundary](36-playbook-packaging-compiler-and-harness-adapters.md)
- [44 Conformance Lab Sessions and Evidence](44-conformance-lab-sessions-and-evidence.md)
- `packages/cli/src/conformance/kit.ts`
- `packages/cli/src/conformance/scenario.ts`
- `packages/cli/src/conformance/meta-verification.ts`
- `packages/cli/src/conformance/registry.ts`
- `conformance/README.md`
