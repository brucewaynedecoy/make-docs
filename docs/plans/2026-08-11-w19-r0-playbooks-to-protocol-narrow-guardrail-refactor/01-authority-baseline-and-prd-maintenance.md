---
title: "W19 R0 Phase 1: Authority Baseline and PRD Maintenance"
kind: "plan"
status: "draft"
coordinate: "W19 R0"
---

# W19 R0 Phase 1: Authority Baseline and PRD Maintenance

## Purpose

Correct current product authority before any implementation surface changes. The Playbook capability is stated as present-tense product authority in 28 of the 34 product PRDs, at roughly 1,055 occurrences. Until that authority describes the narrowed Protocol boundary, every removal in later phases would be uncitable and the PRD set would describe a product that no longer exists.

This phase makes no code, template, contract, manifest, or conformance change.

## Governing Rules

Follow `.make-docs/references/system/prd-change-management.md` throughout. Three rules bind this phase specifically.

1. **Surgical ownership.** Update the current normative text inline in the PRD that already owns the subject. Do not renumber, do not broadly rewrite, and do not create a PRD whose subject is the rename.
2. **Removals before history.** Express a retirement first as current scope, non-goal, limitation, status, or boundary in the owning PRD body. Only then record the prior contract as a non-normative `## Requirement History` entry.
3. **No editorial language in `docs/prd/`.** Words like "retire", "remove", "migrate", "rename", and "reconcile" describe the operation, not the product. The PRD body states what Protocol *is* and what Make Docs *does not do*. The operation language stays in this plan, the delta backlog, and history records.

## Full-Subject Retirement Disposition

PRDs 35 and 36 are the hard case: their entire subjects are retired. Three dispositions were considered.

| Disposition | Assessment |
| --- | --- |
| Delete the PRD files | Rejected. Deleting breaks inbound links from 12 other PRDs, the index, plans, and history, and destroys the requirement-history chain that makes the reversal auditable. |
| Archive the PRDs into `docs/assets/archive/prds/` | Rejected for this phase. `docs/assets/archive/AGENTS.md` requires explicit instruction to archive, and archiving a subset of an active set is a full-set operation the owner has not requested. Raise it as an open question instead. |
| Restate in place as a retired-capability boundary | **Selected.** The document keeps its number, title identity, and inbound links. Its `## Scope`, `## Requirements`, and `## Component and Capability Map` become present-tense boundary statements describing what Make Docs does not provide, and its `## Requirement History` preserves the retired contract. |

The selected disposition is recorded as a decision in `docs/prd/03-open-questions-and-risk-register.md`, together with the open question of whether the owner later wants PRDs 35 and 36 archived as a deliberate, separately authorized archive operation.

## Per-PRD Section Targets

### Tier 1 — Subject-defining changes

**`docs/prd/34-playbook-authoring-contract-and-model.md`** — the surviving authority.

| Section | Action |
| --- | --- |
| `## Purpose`, `## Scope` | Restate as the Protocol guardrail document: persona-scoped Markdown guidance an agent reads, with shape validation only |
| `## Component and Capability Map` | Reduce to document detection, frontmatter and heading-shape validation, persona-folder matching, and diagnostics |
| `### Playbook Selection Identity and Stack (R-SELECT)` | Keep stable identity (`persona/slug`); drop `stack` if phase-4 confirms no surviving consumer, else keep and state why |
| `### Playbook Document Schema (R-DOC)` | Rename to Protocol document schema; keep required frontmatter and the narrative heading spine; drop the authoritative-region concept for the workflow block |
| `### Workflow Contract and Step Model (R-WF)` | Move to non-goal: Protocol carries no machine-readable workflow, no steps, no modes, no events, no gates |
| `### Dependency Registry (R-DEP)` | Move to non-goal: Protocol declares no dependencies, kinds, or probes |
| `### Playbook Model, Parser, Validator, and Diagnostics (R-MODEL)` | Narrow to a shape validator and a reduced diagnostic set; state that no resolved execution model is produced |
| `### V2 Exclusivity and Compatibility Rejection (R-MIG)` | Restate against the Protocol schema identifier chosen in phase 3 |
| `## Naive-UAT Playbook Boundaries` | Restate against Protocol; no Naive UAT implementation file is touched |
| `### Verification and Testability (R-TEST)` | Narrow to fixtures for shape validation |
| `## Requirement History` | Add the W19 R0 entry for R-WF, R-DEP, and orchestration policy |

**`docs/prd/35-run-playbook-state-machine-and-portability.md`** — full-subject retirement.

Body becomes a boundary statement: Make Docs holds no Protocol run state, has no progression or gate operations, offers no resume, no execution modes, no child-run nesting or concurrency policy, and no run export or import. `## CLI Portability Boundary` states that no portability surface exists. `## Requirement History` preserves the retired state-machine contract with its W18 R7 lineage.

**`docs/prd/36-playbook-packaging-compiler-and-harness-adapters.md`** — full-subject retirement.

Body becomes a boundary statement: Make Docs compiles no Protocol into any distributable, maintains no harness adapter registry, emits no capability descriptors, materializes no dependencies, and operates no marketplace registration seam. `## Package Grammar Boundary` states that no package grammar exists for Protocol. `## Requirement History` preserves the retired compiler and adapter contracts with their W18 R5 and W18 R8 lineage.

### Tier 2 — Consumer PRDs whose scope shrinks

| PRD | Sections | Update |
| --- | --- | --- |
| `docs/prd/30-plugin-substrate-and-workflow-bundles.md` | Workflow-bundle requirements | Remove the Playbook-sourced bundle path from current scope; preserve substrate responsibilities that stand alone |
| `docs/prd/39-cli-command-model-and-operation-registry.md` | Operation inventory, command tree, derivation | Current inventory lists only the surviving `protocol.*` operations confirmed in phase 4; the `run playbook` subtree is not current surface |
| `docs/prd/25-typescript-runtime-cli-mcp-operation-boundaries.md` | MCP tool inventory, derivation parity | `make_docs_playbook_*` tools are not current surface; the derivation rule itself is preserved |
| `docs/prd/38-global-store-and-project-state.md` | Table inventory, relocation classification | `playbook_runs` is not part of the current schema; the `relocated-canonical` classification entry for it is removed |
| `docs/prd/10-packaging-validation-and-release-reference.md` | Release validation steps | Remove retired packaging validation from current release reference |
| `docs/prd/20-agent-harness-conformance-and-support-claims.md` | Support claims | Claims whose evidence is a retired packaging behavior are withdrawn from current claim authority |
| `docs/prd/43-conformance-scenario-model-and-execution-kits.md` | Scenario inventory | Packaging scenarios bound to retired capabilities are not current scenarios |
| `docs/prd/28-shared-agentics-installation-and-harness-exposure.md` | Exposure inventory | Playbook-generated exposure is not a current exposure source |
| `docs/prd/08-skills-catalog-and-distribution.md` | Distribution sources | Protocol is not a Skill source |

### Tier 3 — Namespace, asset, and terminology alignment

| PRD | Update |
| --- | --- |
| `docs/prd/22-project-documentation-asset-model.md` | `docs/assets/protocols/<persona-slug>/` is the current namespace |
| `docs/prd/06-template-contracts-and-generated-assets.md` | Protocol asset IDs replace playbook asset IDs in the generated-asset inventory |
| `docs/prd/05-installation-profile-and-manifest-lifecycle.md` | Profile default asset paths point at the protocol namespace |
| `docs/prd/23-generated-document-metadata-and-lifecycle-handoffs.md` | Document kind is `protocol` |
| `docs/prd/24-project-configuration-and-convention-overlay.md` | Any playbook-named overlay key becomes protocol-named |
| `docs/prd/14-lifecycle-workflow-and-coverage-passes.md` | The coverage band covers guide and protocol coverage |
| `docs/prd/47-persona-model.md` | Persona-scoped asset references point at protocols |
| `docs/prd/46-naive-end-user-acceptance-testing.md` | Boundary statements name Protocol |
| `docs/prd/21-project-tool-directory-and-resource-tiers.md`, `docs/prd/17-system-asset-materialization-and-local-bootstrap.md`, `docs/prd/09-dogfood-and-maintainer-operations.md`, `docs/prd/02-architecture-overview.md`, `docs/prd/01-product-overview.md` | Incidental terminology and inventory alignment |
| `docs/prd/18-compatibility-classification-and-migration-safety.md` | Record the retirement's compatibility disposition chosen in phase 5 |

### Tier 4 — Shared surfaces

| PRD | Update |
| --- | --- |
| `docs/prd/00-index.md` | Product-oriented kinds and current-authority links for 34, 35, 36; four playbook references corrected |
| `docs/prd/04-glossary.md` | Define **Protocol**; retire **Playbook** and **Run Playbook** as current terms with a pointer to their requirement history; add an explicit disambiguation note that the external Playbooks CLI is a separate product Make Docs does not wrap |
| `docs/prd/03-open-questions-and-risk-register.md` | 130 existing playbook references reconciled, plus the new decisions and risks below |

## Risk And Decision Register Entries

| Kind | Entry |
| --- | --- |
| Decision | Playbook is narrowed to Protocol, a guardrail and guidance mechanism; the workflow-engine boundary is retired rather than renamed. Rationale: duplication with a dedicated external tool, and North Star principles 2 and 3. |
| Decision | PRDs 35 and 36 are restated in place as retired-capability boundaries rather than deleted or archived. |
| Decision | No interoperability contract with the external Playbooks CLI is declared in W19 R0. |
| Risk | Removed logic may prove quietly load-bearing. Mitigation: North Star principle 5 requires traced invocations before every deletion; principle 4 accepts rebuild-as-discovery, and version history keeps promotion cheap. |
| Risk | Downstream consumer projects may have authored Playbooks against the v2 contract. Mitigation: phase 5 migration guidance and a named compatibility disposition. |
| Risk | Withdrawn support claims may reduce advertised harness coverage. Mitigation: PRD 20 governance requires withdrawal rather than unevidenced retention; state the reduced claim honestly. |
| Risk | The dogfood instance and the upstream template can drift during a multi-surface change. Mitigation: phase 3 enforces upstream-first ordering and a projection check. |
| Open question | Should PRDs 35 and 36 later be archived as a deliberate, separately authorized archive operation? |
| Open question | Does `stack` survive on the Protocol frontmatter, or does it retire with the run boundary? Resolved in phase 4 by tracing consumers. |
| Open question | Do any capabilities need registering as deferred obligations under `docs/prd/45-deferred-obligation-governance.md` rather than being removed outright? |

## Acceptance

- Every PRD in the decision matrix carries exactly one applied decision.
- No PRD is renumbered, deleted, or archived in this phase.
- No PRD body contains editorial or operation language.
- Every retired contract appears exactly once as a non-normative `## Requirement History` entry with its W19 R0 coordinate and this plan as source.
- `docs/prd/00-index.md`, `docs/prd/03-open-questions-and-risk-register.md`, and `docs/prd/04-glossary.md` are internally consistent with the maintained set.
- No implementation file changed.

## Handoff

Phases 2, 3, and 4 may begin once this phase is accepted, and may run in parallel across their disjoint write scopes. The delta backlog is generated from the maintained PRD set, not from this plan.
