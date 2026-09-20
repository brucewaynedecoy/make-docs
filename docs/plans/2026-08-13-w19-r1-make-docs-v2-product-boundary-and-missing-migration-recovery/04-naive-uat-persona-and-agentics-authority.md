---
title: "W19 R1 Phase 4: Naive UAT, Persona, And Agentics Authority"
kind: "plan"
status: "draft"
coordinate: "W19 R1 P4"
source:
  type: "design"
  path: "docs/designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md"
---

# Phase 4: Naive UAT, Persona, And Agentics Authority

## Purpose

Make future paired PRD 46/47 reconciliation decision-complete for Naive UAT qualification, installed-product testing, anti-coaching, scenarios, evidence, findings, gates, configured Persona execution, workflow resources, CLI/MCP access, the thin first-party Skill adapter, and optional agentics.

## Paired PRD Authority

PRDs 46 and 47 form one acceptance unit:

- PRD 46 owns Naive-UAT qualification, goals, scenarios, executions, evidence semantics, findings, coverage, and gates.
- PRD 47 owns Persona schema and the boundary between Persona configuration and testing/UAT behavior.
- PRD 46 may require a Persona category but must not fork the Persona schema.
- PRD 47 may define eligible categories and defaults but must not duplicate UAT policy.
- The pair must agree on configured `user` or `maintainer` execution, with `user` as the default when no Persona is supplied.

Neither PRD is accepted independently if the pair would resolve Persona or evidence routing differently.

## Preserved Naive-UAT Semantics

The reconciliation preserves, rather than weakens:

- a qualified tester who did not build the product under test;
- testing of the installed product and documented interface rather than internal shortcuts;
- real-world goals and anti-coaching;
- canonical, versioned `NUAT-###` scenario identity in the PRD owning the primary external user outcome;
- reproducible setup, outcomes, evidence, and findings;
- explicit pass/fail/revise/blocked/waived gate consumption where existing UAT authority requires it;
- coverage-pass mechanics that do not turn Persona identity into a second coverage authority; and
- phase gates that consume unresolved findings rather than treating execution alone as acceptance.

## System Workflow Authority

Naive UAT is exposed as a system workflow composed from first-class resources:

- governing contracts;
- prompts;
- references;
- applicable templates.

Those resources define qualification, facilitator framing, scenario structure, activation, routing, evidence, and gate consumption. They are listable/readable through the installed CLI, exposed as native MCP resources where supported, and their bodies are optionally projected under `.make-docs/system/{contracts,prompts,references,templates}/`. The typed directories and configured-harness routers remain local when the bodies are absent.

The workflow resource set is the reusable authored authority. CLI code and Skills do not contain hidden prompt copies or alternate policy.

## TypeScript Operation Boundary

The TypeScript operation registry owns deterministic behavior where PRD authority requires it:

- canonical scenario identity and version validation;
- Persona resolution and defaulting;
- installed-product target resolution;
- evidence-reference validation;
- lifecycle run/checkpoint operations;
- finding/result receipt validation; and
- consistent typed outcomes across direct CLI, MCP, workflow, and Skill-assisted use.

Direct CLI, native MCP, system workflow, and Skill-assisted execution resolve the same Persona, scenario, operations, and typed results.

## First-Party Naive-UAT Skill

The distributable first-party Skill contains:

- concise discovery and routing instructions;
- capability declarations and supported harness exposure;
- thin shims only for harnesses that cannot directly issue shell commands or use MCP; and
- argument adaptation and receipt-return formatting only.

Every shim delegates to the same typed Make Docs CLI operations.

The Skill must not contain:

- tester qualification policy;
- target selection policy;
- anti-coaching rules;
- scenario definitions or alternate scenario identity;
- evidence semantics or evidence destination policy;
- a run state machine;
- finding or gate business logic;
- prompt/reference/template copies; or
- behavior required for correctness that direct CLI/MCP workflow use lacks.

The Skill is an optional access adapter and supported distributable capability, not a second workflow authority.

## Persona Resolution

Execution uses:

1. an explicitly configured or supplied eligible Persona when present;
2. `user` when no Persona is supplied;
3. typed failure when the supplied Persona is invalid or not eligible.

Eligible execution categories are `user` and `maintainer`. The actual selected Persona slug determines the evidence path. `maintainer` does not imply implementation knowledge may be coached into the scenario; anti-coaching and installed-product rules still apply.

## Scenario And Evidence Authority

- Canonical append-only `NUAT-###` scenarios, identities, and versions remain in the active PRD owning the primary external outcome.
- Persona-specific rendered tester packets, executions, outcomes, findings, and evidence live under `docs/assets/<persona-slug>/testing/`.
- Each rendered/executed artifact binds to the exact canonical scenario version or content digest.
- The testing directory is not a second scenario authority.
- UAT evidence never lives under `.make-docs/archive/` or `docs/artifacts/`.
- The Store may retain project-relative evidence references and run progress, but it does not replace versioned project evidence.
- Migration moves evidence only when Persona mapping and ownership are proven. Ambiguous evidence remains in place with a typed migration finding.

## Optional Agentics

Core operation through routers, resources, CLI, and MCP is complete without agentics. Optional Skills, hooks, plugins, or extensions may improve discovery, sequencing, or run capture only when:

- the selection is explicit;
- a traced non-Playbook purpose exists;
- real harness capability evidence exists;
- install and uninstall contracts exist;
- support status is honest; and
- the integration calls the same deterministic operations and returns the same receipts.

Unsupported hook or extension APIs are not simulated. There is no background daemon, hidden mutation, or hidden retry.

The focused trace yields:

| Surface | Disposition |
| --- | --- |
| General Skill registry/catalog and agentic roles | Retain |
| First-party Naive-UAT Skill | Add after PRD reconciliation |
| General operation registry | Retain |
| General Store/project evidence | Retain |
| Plugin substrate with no production importer found | Removal candidate |
| Playbook packaging hooks/extensions/adapters | Removal candidates |
| Packaging-specific conformance claims | Withdraw or narrow |

## Exact PRD Maintenance

| PRD | Owning sections | Required current-authority change |
| --- | --- | --- |
| 08 | Skill Purpose Registry and Manifest Requirements; Explicit Selected-Skill Model; Purpose-Led Skill Selection; Skills Manifest Shape | Add Naive-UAT Skill purpose, explicit selection, CLI-only shim contract, no duplicated policy. |
| 14 | Phase-Close Obligation and UAT Gates | Preserve phase gates and finding consumption while changing execution access. |
| 20 | Harness conformance/support claims | Claim only evidence-backed Skill/MCP/CLI support. |
| 22 | Persona Grouping Boundary and testing assets | Own `docs/assets/<persona-slug>/testing/` as the project evidence namespace. |
| 25 | Runtime ownership and MCP surface | Own deterministic scenario/Persona/evidence/lifecycle operations and projection parity. |
| 28 | Shared Agentics Store; Native Harness Exposure; Plugin Inheritance; No-Default-Skills | Keep core complete without agentics and make Skill installation/exposure optional. |
| 30 | Plugin boundary, metadata, selection, lifecycle, workflow bundles | Retain only traced responsibilities; remove Playbook-derived workflow bundles and hidden policy paths. |
| 38 | Store contents and project-state model | Store run progress and project-relative evidence references, never UAT payloads or second scenario authority. |
| 43 | Conformance scenario model | Retain only scenarios for supported UAT/Skill/resource surfaces. |
| 44 | Conformance coverage/release gates | Require honest coverage claims without making optional Skill installation a correctness prerequisite. |
| 45 | Reporting/finding management | Align finding identity, outcomes, evidence references, and gate consumption. |
| 46 | R-NUAT-SCOPE; R-NUAT-GOAL; R-NUAT-EVIDENCE; R-NUAT-GATE; R-NUAT-SCENARIO; R-NUAT-COVERAGE; R-NUAT-STATE | Preserve UAT semantics; add workflow resources, operation delegation, Persona choice/default, and canonical evidence routing. |
| 47 | Persona Schema; Testing and UAT Boundary | Define `user`/`maintainer` eligibility, default `user`, and the shared evidence-path contract. |

## Requirement-History Needs

After current text is correct, record:

- Playbook-coupled Naive-UAT execution -> system workflow plus typed CLI/MCP operations;
- missing/distributed Persona default -> paired `user`/`maintainer` authority with `user` default;
- any Skill-contained policy assumption -> thin CLI-delegating adapter only;
- ambiguous or legacy evidence locations -> canonical persona testing assets with typed unresolved migration findings.

## Later Build Handoff

After accepted PRDs and separate work authorization:

1. author Naive-UAT contracts/prompts/references/templates upstream;
2. add registry operations for scenario identity, Persona resolution, evidence references, and lifecycle run interaction;
3. expose identical operations through CLI and MCP;
4. add optional local resource projection;
5. create the first-party Skill with thin CLI-delegating shims;
6. route evidence to the actual Persona slug’s testing directory;
7. integrate typed findings, receipts, and lifecycle gates;
8. withdraw Playbook-specific and unsupported agentic surfaces;
9. validate direct CLI, native MCP, workflow, and Skill-assisted parity.

The backlog must keep resource authoring, runtime operations, Skill packaging, evidence routing, and conformance as distinct write scopes.

## Evidence Budget

- One paired PRD 46/47 authoring pass and one materially distinct correction.
- One semantic review covering all R-NUAT requirements and Persona schema together.
- One confirmation review after any correction.
- Later execution uses a finite scenario/Persona/access-path matrix justified by changed behavior; no universal scenario count.
- Reuse unchanged scenario/resource/operation/harness fingerprints.

## Acceptance Gate

This phase is ready for assembly only when:

- PRDs 46/47 agree exactly;
- `user` is the no-input default;
- `maintainer` does not weaken anti-coaching or installed-product rules;
- prompts are first-class system resources;
- CLI/MCP/workflow/Skill paths use identical typed operations;
- Skill shims contain no UAT policy or business logic;
- evidence lives only under `docs/assets/<persona-slug>/testing/`;
- archive/artifact destinations are explicitly prohibited;
- canonical scenarios remain PRD-owned; and
- optional agentics are never required for core correctness.
