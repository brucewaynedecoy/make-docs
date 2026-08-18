---
title: "W19 R2 Performance Evidence Governance"
kind: "plan"
status: "draft"
coordinate: "W19 R2"
follow_on:
  route: "prd-generation"
  next_prompt: ".make-docs/system/prompts/prd-change-to-work.prompt.md"
  why: "Performance Evidence Governance must become current PRD authority before implementation work can create governance resources, execute profiles, or admit an optional validator."
  coordinate_handoff: "Carry W19 R2 into maintained PRD requirement history, source links, and one downstream W19 R2 delta backlog."
---

# W19 R2 Performance Evidence Governance

## Purpose

Translate the accepted [Performance Testing Guardrails design](../../designs/2026-08-12-performance-testing-guardrails.md) into a decision-complete PRD authority-maintenance and delivery plan. The plan creates one coherent Performance Evidence Governance product authority, reconciles its existing consumers, and sequences documentation-first resources before any separately accepted deterministic validator. It does not authorize PRD edits, backlog generation, benchmark execution, implementation, dogfood projection, or publication.

## Objective

Completion of this plan requires later, separately authorized stages to:

- create `docs/prd/48-performance-evidence-governance.md` as the shared authority for applicability, maturity, target classes, `PERF-###` profiles, measurement comparability, finite budgets, stop rules, outcomes, waivers, expiry, requalification, traceability, compatibility, and automation limits;
- update only the exact existing PRD owners that consume those contracts, preserving their adjacent proof modes and current identities;
- deliver one upstream-first contract, progressive profile template, performance-coverage prompt, governing reference, and thin routers through the accepted system-resource layout;
- keep product-owned hard requirements distinct from phase-owned engineering guardrails and forbid silent authority promotion;
- preserve repository authority while allowing optional machine-local operational evidence capture;
- keep the first delivery documentation-first and admit any TypeScript validator only after a separate owner decision; and
- produce one scoped W19 R2 delta backlog from the maintained PRD set rather than rewriting earlier backlogs.

## Governing Invariant

> `docs/prd/` describes the current authoritative product shape. Plans and work may own bounded engineering guardrails and sequencing, but they cannot become product authority or redefine an accepted product threshold.

Current normative requirements must live inline in their owning PRDs. Material former contracts may appear only in non-normative `## Requirement History`. Implementation agents may execute accepted profiles but may not invent, strengthen, weaken, average away, waive, or silently retire targets.

## Coordinate Decision

- Coordinate: `W19 R2`
- Classification: `revision`
- Evidence: W19 R0 is the unexecuted Playbooks-to-Protocol plan that the accepted sibling recovery design supersedes. The recovery replacement plan owns W19 R1. The performance design was accepted as a sibling within the same Make Docs v2 initiative and consumes the recovery design's resource boundary; it is therefore the next meaningful W19 replanning revision rather than a new initiative. W19 R2 is the next unused revision after the reserved recovery replacement coordinate.
- Handoff: Product PRDs retain numeric identity rather than W/R identity. W19 R2 appears only in plan/work paths, source links, and any required history entries.

## Change Classification

- Route: `change-plan`, as declared by the accepted design.
- Mode: authoritative maintenance of the active PRD namespace followed by a scoped implementation delta.
- Lifecycle: accepted design -> this plan -> PRD maintenance -> delta backlog -> implementation -> verification. This plan stops before PRD maintenance.
- PRD tree shape: keep the current flat numeric tree. PRD 48 is one coherent capability document; no nested PRD folder is warranted.
- Archive gate: none. This is surgical maintenance, not full-set replacement.
- Backlog disposition: one scoped delta backlog at `docs/work/<actual-execution-date>-w19-r2-performance-evidence-governance/` is sufficient. Resolve `<actual-execution-date>` to the date the work bundle is generated; do not reuse the plan date automatically.

## Maintenance Inputs

| Input | Format | Location | Confidence |
| --- | --- | --- | --- |
| Accepted performance design | Design authority | [Performance Testing Guardrails](../../designs/2026-08-12-performance-testing-guardrails.md) | Accepted |
| Accepted sibling boundary | Design authority | [Make Docs v2 Product Boundary and Missing Migration Recovery](../../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md) | Accepted |
| Active product authority | PRD set | `docs/prd/00-index.md` and numeric PRDs 01-47 | Current |
| PRD maintenance rules | System reference | `.make-docs/references/system/prd-change-management.md` | Current |
| Planning and coordinate rules | System references | `.make-docs/references/system/{planning-workflow,wave-model,lifecycle}.md` | Current |

## Planning Preflight Results

### PRD number

The active index ends at PRD 47 and contains no PRD 48. The next unassigned numeric slot is therefore `48`, used for the coherent subject `Performance Evidence Governance`.

### Existing target inventory

The bounded active-PRD scan found no numeric performance target with a latency, throughput, rate, percentile, regression percentage, duration, bundle-size, memory, compute, or resource unit. It found three adjacent or qualitative candidates that must be dispositioned rather than silently treated as performance authority:

| Current text | Performance disposition | PRD decision | Reason |
| --- | --- | --- | --- |
| PRD 38 R-MIR-1 says the registry supports cross-project queries and "quick access" | `not-needed` | `update-existing` | The phrase is descriptive and does not support a benchmark; narrow it to product behavior without an unowned speed promise. |
| PRD 20 R-GOV-2 requires one passing conformance result for nominal support | `not-needed` | `none` | This is a conformance sufficiency rule, not a performance sample count; preserve it and add only the cross-mode boundary. |
| PRD 46 R-NUAT-EVIDENCE-6 requires one valid independent naive run per support-scope cell | `not-needed` | `none` | This is a UAT sufficiency rule; it must not become a benchmark recipe or be weakened by performance governance. |

Execution repeats this focused inventory immediately before PRD edits to catch intervening active-authority changes. Newly discovered candidates receive both a performance disposition and one PRD maintenance decision before any target or profile is created.

### Accepted resource layout

The sibling accepted design makes `contract`, `prompt`, `reference`, and `template` peer resource types with stable `make-docs://system/<type>/<path>` identifiers. The W19 R2 resources use these identifiers and optional project-local projections:

| Logical resource | Stable URI | Optional project-local projection |
| --- | --- | --- |
| Governing contract | `make-docs://system/contract/performance-evidence-governance.md` | `.make-docs/system/contracts/performance-evidence-governance.md` |
| Performance coverage starter | `make-docs://system/prompt/performance-coverage.prompt.md` | `.make-docs/system/prompts/performance-coverage.prompt.md` |
| Governing reference | `make-docs://system/reference/performance-evidence.md` | `.make-docs/system/references/performance-evidence.md` |
| Progressive profile template | `make-docs://system/template/performance-evidence-profile.md` | `.make-docs/system/templates/performance-evidence-profile.md` |

Their first mutation target is the corresponding `packages/docs/template/.make-docs/system/{contracts,prompts,references,templates}/` path after W19 R1 has reconciled the system-resource model. W19 R2 must not create duplicate old-path and target-path authorities.

## Active Authority Baseline

- Active `docs/prd/` status: current flat set, PRDs 01-47 plus shared 00, 03, and 04 surfaces.
- Current index: `docs/prd/00-index.md`.
- Discovery pass required: yes, bounded to active PRDs and changed consumer anchors immediately before maintenance.
- Known legacy condition: active authority has no shared performance-evidence subject, no `PERF-###` schema, and no explicit unchanged-fingerprint requalification rule.
- Supersession dependency: W19 R1 must reconcile the sibling recovery boundary, especially PRDs 06, 21, 38, 39, 46, and 47, before W19 R2 edits those shared consumers.

## Candidate Decision Matrix

Every candidate has exactly one PRD maintenance decision.

| Candidate | Decision | Owning PRD or new subject | Reason |
| --- | --- | --- | --- |
| Applicability dispositions and qualification record | `create` | PRD 48 | New coherent capability with no current owner. |
| Maturity proportionality and target classes | `create` | PRD 48 | Shared performance semantics, including the product/engineering authority split. |
| Versioned `PERF-###` schema and canonical ownership by target class | `create` | PRD 48 | One project-wide identity and profile contract must have one owner. |
| Measurement comparability and non-sacrificable constraints | `create` | PRD 48 | Shared decision rules must not be duplicated across subsystem PRDs. |
| Finite budgets, diminishing returns, unchanged checks, and expiry requalification | `create` | PRD 48 | Shared bounded-execution contract, including one qualification execution per newly authorized event. |
| Outcomes, severity, reproducibility, findings, waivers, and escalation | `create` | PRD 48 | Coherent shared result and disposition model. |
| Template, prompt, contract, reference, router, and upstream-first delivery ownership | `update-existing` | PRD 06 | PRD 06 owns shipped template resources and mutation order. |
| Package/dogfood proof without claim promotion | `update-existing` | PRD 10 | PRD 10 owns packaging, validation, and release proof. |
| Performance coverage surface and phase-gate consumption | `update-existing` | PRD 14 | PRD 14 owns lifecycle and coverage mechanics, not substantive profile policy. |
| Conservative adoption of existing targets and evidence | `update-existing` | PRD 18 | PRD 18 owns compatibility, conflict-stop, and migration safety. |
| Performance evidence cannot promote support claims | `update-existing` | PRD 20 | PRD 20 owns conformance and support-claim authority. |
| Optional operational run/evidence capture remains non-authoritative | `update-existing` | PRD 38 | PRD 38 owns Global Store and Project State boundaries. |
| Conformance scenarios/evidence remain independent from performance profiles/results | `update-existing` | PRDs 43 and 44 | These PRDs own the conformance evidence bar and lab evidence homes. |
| Deferred performance outcomes and waiver remediation use `O-###` | `update-existing` | PRD 45 | PRD 45 owns durable future-outcome routing. |
| Naive UAT may report slowness but cannot certify performance | `update-existing` | PRD 46 | PRD 46 owns UAT modes, evidence, findings, and gates. |
| Resource identity/layout changes | `link-only` | PRDs 21 and 06 as maintained by W19 R1 | W19 R2 consumes the accepted layout and links its resources; it must not reopen the sibling boundary. |
| Optional deterministic validator operation and CLI/MCP exposure | `none` for current operation authority | PRD 48 now; PRDs 25 and 39 only after a later owner gate | Documentation-first delivery accepts validator constraints, not validator implementation or operation admission. |
| Existing numeric conformance and UAT sufficiency minima | `none` | PRDs 20 and 46 | They belong to separate proof modes and remain unchanged. |
| Universal performance target, host, sample count, variance limit, or benchmark runner | `none` | Not created | Explicit design non-goal. |

## Existing PRDs To Update

All updates are surgical and occur only after plan approval and separate PRD-maintenance authorization.

| Existing PRD | Owning sections | Planned current normative update | Preserved authority |
| --- | --- | --- | --- |
| `00-index.md` | `Document Map` | Add PRD 48 as a `capability`; update related-authority links for direct consumers. | Existing slots, kinds, statuses, and unrelated relationships. |
| `03-open-questions-and-risk-register.md` | `Rebuild Risks` and any exact existing matching item | Track invented targets, unbounded reruns, and second-authority risk without duplicating existing risks. | Stable D/Q/R/O identities and canonical sections. |
| `06-template-contracts-and-generated-assets.md` | `Template Ownership and Mutation Order`; `Contracts and Data` | Add the four governance resources, peer prompt type, concise routers, and upstream-first target layout. | General template mutation order and project-owned content boundary. |
| `10-packaging-validation-and-release-reference.md` | `Packaging Surface`; `Validation Matrix`; `Package Projection Proof` | Require packaged-resource and dogfood proof while excluding results and benchmark evidence from release/support authority. | Existing release procedure and conformance gates. |
| `14-lifecycle-workflow-and-coverage-passes.md` | `Pass Skeleton`; `Candidate Record and Verdicts`; `Phase-Close Obligation and UAT Gates` | Add non-persona performance qualification, dispositions, expired-evidence and unchanged-check coverage, and exact gate consumption. | Existing base decisions, UAT/obligation gates, and optional adversarial review. |
| `18-compatibility-classification-and-migration-safety.md` | `Existing-Project Adoption Boundaries` | Adopt at the first qualifying lifecycle event; do not retroactively fail, relabel, rerun, or certify existing assets. | Conflict-stop, backup, rollback, and ambiguity handling. |
| `20-agent-harness-conformance-and-support-claims.md` | `Support Claim Governance` | State that performance pass, characterization, and waiver do not promote a support tuple. | Existing conformance evidence minimum and tuple model. |
| `38-global-store-and-project-state.md` | `Mirror Versus Relocated (R-MIR)`; `Obligation and UAT State Boundaries` | Add optional performance run/evidence projection and narrow R-MIR-1's "quick access" without creating a metric. | Repository authority, rebuildability, and no-schema-change posture. |
| `43-conformance-scenario-model-and-execution-kits.md` | `The Evidence Bar (R-BAR)` | Preserve conformance as independent proof; a performance profile/result cannot satisfy R-BAR. | Install/discover/invoke/uninstall bar and simulation language. |
| `44-conformance-lab-sessions-and-evidence.md` | `Lab Sessions and Evidence Homes (R-NAME)` | Keep performance evidence out of the conformance-lab identity unless a separately qualified cross-mode run preserves both contracts. | Session naming, store evidence home, and result rules. |
| `45-deferred-obligation-governance.md` | `R-OBL-AUTH`; `R-OBL-FLOW` | Route `defer-required` and owed waiver remediation through stable `O-###` authority. | Existing obligation lifecycle and non-fulfillment-by-task rule. |
| `46-naive-end-user-acceptance-testing.md` | `R-NUAT-MODES`; `R-NUAT-EVIDENCE`; `R-NUAT-GATE` | Add performance as a separate mode; route perceived slowness as a finding without benchmark certification. | Anti-coaching, installed-product, scenario, evidence, finding, and gate semantics. |

## Genuinely New Product PRD

| New PRD | Kind | Coherent subject | Why existing owners are insufficient |
| --- | --- | --- | --- |
| `docs/prd/48-performance-evidence-governance.md` | `capability` | Performance applicability, authority, profile, evidence, budget, outcome, expiry, and automation governance | PRD 14 owns lifecycle mechanics; no current PRD owns the substantive performance qualification and evidence domain. |

PRD 48 receives no document-level W/R coordinate. It links to the accepted design and this plan through source/provenance fields and, when materially replacing existing product authority, standardized history entries.

## Requirement History Entries

- No history entry is required for purely additive cross-mode links or the new PRD 48.
- PRD 38 records a W19 R2 history entry only if narrowing "quick access" materially changes a product promise rather than removing an unsupported adjective.
- Any active hard performance target discovered in the execution-time inventory is updated inline in its actual subsystem owner and receives a W19 R2 history entry only when its material contract is replaced, removed, or reclassified.
- Performance-plan and work profiles remain operational lineage; they are never copied into Requirement History as current authority.

## Affected Links, Risks, Plans, And Work

| Surface | Artifact | Required maintenance | Authority role |
| --- | --- | --- | --- |
| Index | `docs/prd/00-index.md` | Add PRD 48 and direct relationships. | Navigation only. |
| Risks | `docs/prd/03-open-questions-and-risk-register.md` | Add or update bounded risks for unsupported targets, rerun loops, authority duplication, and stale evidence. | Living risk/decision register. |
| Plan | This directory | Preserve sequencing, ownership, and owner gates. | Non-product execution authority. |
| Prior plan | `docs/plans/2026-08-11-w19-r0-playbooks-to-protocol-narrow-guardrail-refactor/` | No edits; supersession is owned by W19 R1. | Historical/unexecuted lineage. |
| Work | `docs/work/<actual-execution-date>-w19-r2-performance-evidence-governance/` | Resolve the date when work generation executes, then generate one delta backlog only after PRD maintenance passes authority validation. | Future implementation queue. |
| History | `docs/assets/archive/history/` | Add one idempotent phase breadcrumb only after a material phase actually completes. | Execution provenance. |

## Repo Summary And Execution Mode

- Repository: Make Docs maintainer monorepo and dogfood instance.
- Upstream shipped-resource authority: `packages/docs/template/`; bundled `packages/cli/template/` is generated by copy/prepack.
- Product authority: active `docs/prd/` after authorized maintenance.
- Execution mode: delegated, coordinator-supervised, disjoint write scopes. The coordinator owns no output-writing task while delegation is available.
- Initial delivery: documentation resources and representative fixtures only. It does not build a benchmark platform or execute product benchmarks.
- Later validator delivery: optional, deterministic, TypeScript-owned, and separately gated.

## Output Contract

- Plan directory: `docs/plans/2026-08-13-w19-r2-performance-evidence-governance/`
  - entry point: `00-overview.md`
  - phases: `01-prd-authority-and-target-inventory.md`, `02-governance-resources-and-routing.md`, `03-lifecycle-evidence-compatibility-and-state.md`, `04-optional-validator-operation.md`, `05-packaging-validation-and-delta-handoff.md`
- Existing PRD updates: 00, 03, 06, 10, 14, 18, 20, 38, 43, 44, 45, and 46.
- New PRD: `docs/prd/48-performance-evidence-governance.md`.
- Conditional future PRD updates: 25 and 39 only if the owner later admits the optional validator operation.
- Resource identifiers: the four stable URIs in `Planning Preflight Results`.
- Delta backlog: `docs/work/<actual-execution-date>-w19-r2-performance-evidence-governance/`; resolve the date at work-generation time while preserving `W19 R2`.

## Phase Map

| Phase | File | Scope |
| --- | --- | --- |
| 1 | [01-prd-authority-and-target-inventory.md](01-prd-authority-and-target-inventory.md) | Repeat the bounded inventory, create PRD 48, reconcile exact consumer PRDs, and validate current authority. |
| 2 | [02-governance-resources-and-routing.md](02-governance-resources-and-routing.md) | Author the contract, prompt, reference, progressive profile template, and thin routers upstream-first. |
| 3 | [03-lifecycle-evidence-compatibility-and-state.md](03-lifecycle-evidence-compatibility-and-state.md) | Integrate coverage, gates, execution packets, outcomes, traceability, state, cross-mode boundaries, and conservative adoption. |
| 4 | [04-optional-validator-operation.md](04-optional-validator-operation.md) | Separately gated deterministic TypeScript validator, shared result schema, and optional CLI/MCP parity. |
| 5 | [05-packaging-validation-and-delta-handoff.md](05-packaging-validation-and-delta-handoff.md) | Package/dogfood proof, focused validation, finite closeout, and delta-backlog handoff. |

Phase 1 precedes all delivery. Phases 2 and 3 may proceed in parallel only after W19 R1 has stabilized shared resource and PRD boundaries. Phase 4 is optional and cannot begin without a new owner gate. Phase 5 consumes whichever of phases 2-4 are authorized and completed.

## Worker Ownership

| Worker role | Scope | Write scope | Dependencies | Deliverable |
| --- | --- | --- | --- | --- |
| Capability-authority worker | New product authority | `docs/prd/48-performance-evidence-governance.md` | Approved plan and PRD-maintenance authorization | Complete shared capability contract. |
| Existing-owner workers | Surgical consumer updates, split into disjoint PRD groups | Named PRDs only | Capability draft plus W19 R1 reconciliation | Updated consumers and conditional history. |
| Shared-surface worker | Index and risk/register assembly | `docs/prd/00-index.md`, `docs/prd/03-open-questions-and-risk-register.md` | All subject PRDs | Coherent navigation and risks. |
| Governance-resource worker | Contract/prompt/reference/template and routers | `packages/docs/template/.make-docs/system/**` only | Maintained PRDs and W19 R1 layout | Upstream resource set. |
| Lifecycle-integration worker | Coverage, phase-gate, work-linkage, compatibility, and state docs/templates | Disjoint upstream template/reference surfaces | Phases 1-2 | Integrated documentation-first flow. |
| Optional-validator worker | Shared TypeScript operation and focused tests | Exact operation/registry/test modules assigned by the future backlog | Separate validator gate | Deterministic validation only. |
| Projection/validation worker | Generated package projection, selected dogfood copy, and focused checks | Generated/owned copies named by the backlog | Authorized delivery phases | Parity and packaging evidence. |
| Backlog/assembly worker | One W19 R2 delta backlog and final link assembly | `docs/work/<actual-execution-date>-w19-r2-performance-evidence-governance/`, with the date resolved when work generation executes | Maintained PRDs and approved work-generation stage | Delegation-ready implementation queue. |

Every worker receives an exact allowlist. No worker may rewrite sibling plans, accepted designs, unrelated PRDs, existing benchmark assets, or historical plans/work.

## MCP Strategy

- Project docs: use jdocmunch for authority, headings, anchors, and backlinks; refresh the local index once when genuinely stale.
- Code and signatures: use jcodemunch for the future TypeScript validator and registry admission; refresh once when stale.
- Fallback: after one failed refresh, use focused `rg`, `rg --files`, and bounded direct reads. Do not run concurrent repository-wide indexes.
- Validation uses the repository-authoritative operations and scripts named by current PRDs; absence or failure is reported, not bypassed by inventing alternate authority.

## Dependencies

The dependency and merge order is:

1. Owner approves this plan; that approval saves plan authority only.
2. Owner separately authorizes PRD maintenance.
3. W19 R1 shared-boundary PRD reconciliation completes and passes validation.
4. PRD 48 and consumer PRDs are drafted in disjoint scopes, then shared index/risk assembly runs.
5. The maintained PRD set passes the PRD-authority validator and focused link/contract checks.
6. Owner separately authorizes work generation; one W19 R2 delta backlog is generated from current PRDs.
7. Documentation-first phases execute in backlog order.
8. The optional validator requires an additional explicit owner decision before PRDs 25/39, code, CLI, or MCP change.
9. Projection/package validation and owner acceptance close only the authorized implementation scope.

## Validation

The later execution stages must validate:

- one decision and reason for every candidate;
- one coherent PRD 48 with no document-level coordinate and no arbitrary numeric target;
- exact current normative requirements in owning PRDs, with material former contracts only in standardized history;
- target-class ownership and absence of duplicated PRD/plan/work authority;
- the expiry rule: one unchanged-fingerprint qualification execution only inside an explicitly authorized, newly budgeted event, then reuse until a later trigger and authorization;
- correctness and non-sacrificable constraints as preconditions to performance pass;
- relative links, anchors, YAML frontmatter, path hygiene, whitespace, and changed-file allowlists;
- `make-docs run prd authority validate --target-root <project>` as a regression check after PRD maintenance;
- focused resource, router, package-copy, and representative fixture validation after documentation delivery; and
- no full benchmark matrix, universal sample count, theoretical proof, or materially unchanged rerun.

Full implementation/package suites are proportional to the later changed surfaces. This plan stage runs documentation-only validation.

## Unresolved Questions

No shared product-behavior question remains unresolved. The following are intentionally later, profile- or gate-level decisions rather than gaps in this plan:

- individual target values, statistics, sample approaches, environments, approvers, budgets, and expiry triggers;
- whether a specific project candidate is `required-now`, `characterize-now`, `defer-required`, `not-needed`, or `reject-unsupported`; and
- whether the optional deterministic validator is ever admitted. Documentation-first delivery does not depend on that choice.

## Approval State

The originating design is accepted. This plan remains `draft` until the owner approves it. Approval of this plan does not authorize PRD maintenance, work generation, resource authoring, implementation, benchmark execution, setup, projection, staging, commit, integration, push, publication, release, or deployment.

- Exact Owner Plan-Acceptance Statement: `I approve the W19 R2 Performance Evidence Governance plan as accepted plan authority. This approval authorizes plan acceptance only; it does not authorize PRD reconciliation, work-backlog generation, implementation, or any later lifecycle stage.`
- Exact Owner PRD-Reconciliation Authorization Statement: `I authorize W19 R2 Performance Evidence Governance PRD reconciliation from the accepted plan. This authorization covers only W19 R2 PRD creation and surgical maintenance; it does not authorize work-backlog generation, implementation, or any later lifecycle stage.`

These are separate gates. Plan acceptance does not imply PRD-reconciliation authorization, and PRD-reconciliation authorization does not imply work generation or later execution.

## Intended Follow-On

This handoff is advisory-default-but-overridable and is not an execution gate by itself.

- Route: `prd-generation`
- Next step: After explicit owner authorization, create PRD 48 and surgically reconcile the existing PRD consumers described in [Phase 1](01-prd-authority-and-target-inventory.md); then stop for PRD authority review before work generation.
- Why: Downstream work must cite the current product contract. This plan's sequencing and engineering guardrails cannot substitute for PRD authority.
- Coordinate Handoff: Carry `W19 R2` into source links, any material requirement-history entries, and one later delta backlog at `docs/work/<actual-execution-date>-w19-r2-performance-evidence-governance/`; resolve the date when the separately authorized work-generation stage executes.
