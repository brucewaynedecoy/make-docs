# Make Docs PRD Index

## Purpose

This index is the entry point to the current authoritative Make Docs product requirements. The active set is organized by product capability and boundary. Plans, work backlogs, migrations, and editorial maintenance records are supporting evidence, not product authority.

The governing invariant is:

> `docs/prd/` describes the current authoritative shape of the product. It must never describe the editorial operation used to change that authority.

Numbering gaps are intentional. Existing product authorities retain stable numbers when other documents are consolidated or retired.

## Reading Order

1. Start with [01 Product Overview](01-product-overview.md), [02 Architecture Overview](02-architecture-overview.md), [03 Open Questions and Risk Register](03-open-questions-and-risk-register.md), and [04 Glossary](04-glossary.md).
2. Read the baseline product subsystems in order: [05 Installation, Profile, and Manifest Lifecycle](05-installation-profile-and-manifest-lifecycle.md), [06 Template Contracts and Generated Assets](06-template-contracts-and-generated-assets.md), [07 CLI Command Surface and Lifecycle](07-cli-command-surface-and-lifecycle.md), [08 Skills Catalog and Distribution](08-skills-catalog-and-distribution.md), [09 Dogfood and Maintainer Operations](09-dogfood-and-maintainer-operations.md), and [10 Packaging, Validation, and Release Reference](10-packaging-validation-and-release-reference.md).
3. Follow the current capability authorities relevant to the work. Use related-authority links in the document map to cross subsystem boundaries.
4. Read [49 Human Experience Standard and Intent](49-human-experience-standard-and-intent.md) when work creates or materially changes a result that people use, read, operate, maintain, review, recover, or rely on.
5. Read [50 Proportionate Testing and Human-Centered Validation](50-proportionate-testing-and-human-centered-validation.md) whenever work selects, expands, explains, gates, reuses, or asks a person to perform testing. It routes detailed Performance Testing to [PRD 48](48-performance-evidence-governance.md) and conditional Unassisted Goal Testing to [PRD 46](46-naive-end-user-acceptance-testing.md).
6. Read [45 Deferred Obligation Governance](45-deferred-obligation-governance.md) and [47 Persona Model](47-persona-model.md) when testing creates accepted future work or needs intended-audience and evidence-path resolution. Persona selection does not prove tester qualification.
7. Use plans and work backlogs only after the owning current PRDs establish the product contract.

## Document Map

| Slot | Document | Kind | Status | Related authorities | Current focus |
| --- | --- | --- | --- | --- | --- |
| `00` | [Make Docs PRD Index](00-index.md) | core | Current | All active PRDs | Navigation and ownership for the active authority set. |
| `01` | [Product Overview](01-product-overview.md) | core | Current | 02, 05-10, 14, 17, 21, 25, 30, 34-39, 45-50 | Product purpose, users, retained resource, Skill, testing, and Human Experience capabilities, reduced boundaries, and limitations. |
| `02` | [Architecture Overview](02-architecture-overview.md) | core | Current | 05-10, 16-25, 28, 30, 34-39, 43-47 | Runtime zones, resource providers and typed operations, optional project projection, Global Store, configuration, and authority boundaries. |
| `03` | [Open Questions and Risk Register](03-open-questions-and-risk-register.md) | core | Current | All active PRDs | Confirmed drift, open questions, deferred obligations, and rebuild risks. |
| `04` | [Glossary](04-glossary.md) | reference | Current | All active PRDs | Canonical product and lifecycle terminology. |
| `05` | [Installation, Profile, and Manifest Lifecycle](05-installation-profile-and-manifest-lifecycle.md) | subsystem | Current | 06-09, 15, 17, 18, 21, 24, 38 | Selection identity, resource-projection policy, planner/apply behavior, manifest ownership, conflict handling, and lifecycle safety. |
| `06` | [Template Contracts and Generated Assets](06-template-contracts-and-generated-assets.md) | subsystem | Current | 05, 09, 10, 17, 21-25, 48-50 | Upstream template authority, peer contracts/prompts/references/templates, Human Experience and testing resources, selected assets, generated files, and optional project projections. |
| `07` | [CLI Command Surface and Lifecycle](07-cli-command-surface-and-lifecycle.md) | subsystem | Current | 05, 17, 21, 25, 39 | Public resource, project-surface, setup, reconfiguration, update, uninstall, and lifecycle command UX. |
| `08` | [Skills Catalog and Distribution](08-skills-catalog-and-distribution.md) | subsystem | Current | 05, 18, 20, 25, 28, 30, 46 | Purpose-led explicit Skill selection, registries, manifests, trust, distribution, and the thin CLI-delegating Naive-UAT Skill. |
| `09` | [Dogfood and Maintainer Operations](09-dogfood-and-maintainer-operations.md) | subsystem | Current | 06, 10, 16, 17, 21, 25 | Upstream-first resource authoring, package projection, downstream dogfood, and maintainer validation. |
| `10` | [Packaging, Validation, and Release Reference](10-packaging-validation-and-release-reference.md) | reference | Current | 06, 09, 16-18, 20, 25, 28, 30, 36, 43, 44, 48 | Package/provider parity, allowlist and prepack flow, smoke validation, release evidence, and evidence-backed support gates. |
| `14` | [Lifecycle Workflow and Coverage Passes](14-lifecycle-workflow-and-coverage-passes.md) | capability | Current | 23, 25, 38, 45-50 | Lifecycle arc, coverage-pass decisions, four-type testing selection, Human Experience review lens, explicit gate effects, follow-on routing, and optional adversarial review. |
| `15` | [Agent Instruction Ownership and Managed Blocks](15-agent-instruction-ownership-and-managed-blocks.md) | capability | Current | 05, 06, 18, 49, 50 | Block-scoped instruction ownership, preservation, hashing, conflict review, and Human Experience and testing-authority discovery. |
| `16` | [Package Runtime and Deployment Boundaries](16-package-runtime-and-deployment-boundaries.md) | subsystem | Current | 09, 10, 17, 18, 25, 30, 36 | Package identity, TypeScript runtime ownership, provider projection, package runners, and no untraced agentic payload boundary. |
| `17` | [System Asset Materialization and Local Bootstrap](17-system-asset-materialization-and-local-bootstrap.md) | subsystem | Current | 05, 06, 18, 21, 24, 25, 28 | Stable resource identity, provider and provenance resolution, optional project projection, materialization, and bootstrap. |
| `18` | [Compatibility Classification and Migration Safety](18-compatibility-classification-and-migration-safety.md) | subsystem | Current | 05, 15-17, 21, 25, 28, 30, 34-39, 48 | Existing-install classification, quiescence, conservative migration, legacy preservation, backup, rollback, and safe failure. |
| `20` | [Agent Harness Conformance and Support Claims](20-agent-harness-conformance-and-support-claims.md) | subsystem | Current | 10, 25, 28, 30, 36, 43, 44, 48, 50 | Exact evidence-backed harness/model/resource/Skill claims, proportionate testing behavior, lab boundaries, tuple status, and no untraced plugin or package support. |
| `21` | [Project Tool Directory and Resource Tiers](21-project-tool-directory-and-resource-tiers.md) | subsystem | Current | 06, 17, 18, 22, 24, 25, 28, 38, 48 | Peer system resource tiers, optional `.make-docs/system/**` projection, runtime state, and project boundaries. |
| `22` | [Project Documentation Asset Model](22-project-documentation-asset-model.md) | subsystem | Current | 06, 14, 21, 23, 24, 46, 47 | Managed archive, non-authoritative artifacts, Persona-scoped assets and testing evidence, and template/dogfood/package flow. |
| `23` | [Generated Document Metadata and Lifecycle Handoffs](23-generated-document-metadata-and-lifecycle-handoffs.md) | capability | Current | 14, 17, 21, 22, 24, 46, 47, 49, 50 | Current document/resource metadata, source relationships, lifecycle fields, Human Experience and testing body authority, and follow-on handoffs without Playbook or Protocol kinds. |
| `24` | [Project Configuration and Convention Overlay](24-project-configuration-and-convention-overlay.md) | capability | Current | 17, 21-23, 25, 28, 30, 46, 47 | Project-owned resource, router, selection, presentation, and Persona configuration over stable identities and semantics. |
| `25` | [TypeScript Runtime, CLI, MCP, and Operation Boundaries](25-typescript-runtime-cli-mcp-operation-boundaries.md) | subsystem | Current | 07, 16, 17, 21, 24, 28, 30, 38, 39, 46 | Shared typed resource, project-surface, general-run, and UAT operations; CLI/MCP parity; and the no-scripts boundary. |
| `28` | [Shared Agentics Installation and Harness Exposure](28-shared-agentics-installation-and-harness-exposure.md) | subsystem | Current | 08, 17, 18, 20, 25, 30, 36, 46 | Explicitly selected Skills, optional evidence-backed agentics, native harness exposure, ownership, and compatibility. |
| `30` | [Agentic Extensibility Boundary](30-plugin-substrate-and-workflow-bundles.md) | subsystem | Current | 08, 20, 25, 28, 36, 43, 44 | No general plugin or workflow-bundle product; only explicitly selected, traced optional integrations over the typed core. |
| `34` | [Procedural Asset Boundary and Legacy Compatibility](34-playbook-authoring-contract-and-model.md) | subsystem | Current | 18, 22-24, 30, 35, 36 | No Playbook or Protocol authoring capability; current reusable procedure authority lives in peer system resources, with legacy inputs classified conservatively. |
| `35` | [Workflow Execution and Legacy Run Boundary](35-run-playbook-state-machine-and-portability.md) | subsystem | Current | 18, 25, 30, 34, 36, 38, 39 | No Playbook execution state machine; typed general lifecycle runs remain current while legacy Playbook state stays opaque. |
| `36` | [Agentic Packaging and Adapter Boundary](36-playbook-packaging-compiler-and-harness-adapters.md) | subsystem | Current | 10, 20, 25, 28, 30, 34, 35, 43, 44 | No Playbook packaging compiler; optional Skill/package/adapter behavior requires a traced non-Playbook purpose and exact evidence. |
| `38` | [Global Store and Project State](38-global-store-and-project-state.md) | subsystem | Current | 05, 18, 21, 24, 25, 35, 39, 45, 46, 48 | Stable project identity, general `runs` and `run_evidence`, typed receipts, opaque legacy `playbook_runs`, and cleanup. |
| `39` | [CLI Command Model and Operation Registry](39-cli-command-model-and-operation-registry.md) | subsystem | Current | 07, 16, 17, 25, 35, 36, 38, 46 | Command grammar and typed resource, project, general-run, and Naive-UAT operations with invariant human/agent projections. |
| `43` | [Conformance Scenario Model and Execution Kits](43-conformance-scenario-model-and-execution-kits.md) | subsystem | Current | 20, 25, 28, 30, 36, 44, 46, 48, 50 | Harness-agnostic scenarios for supported resource, Skill, testing, and retained agentic surfaces; target bindings, kits, instruments, and failure-revealing ingestion. |
| `44` | [Conformance Lab Sessions and Evidence](44-conformance-lab-sessions-and-evidence.md) | subsystem | Current | 20, 28, 30, 36, 38, 43, 46, 48, 50 | Agent-driven and human-executed lab work, executor isolation, evidence homes, explicit gate effects, and honest support gates. |
| `45` | [Deferred Obligation Governance](45-deferred-obligation-governance.md) | capability | Current | 03, 14, 38, 46-48, 50 | Durable obligation identity, finding routing, triggers, testing deferral boundaries, phase-close consumption, and anti-orphan governance. |
| `46` | [Unassisted Goal Testing](46-naive-end-user-acceptance-testing.md) | capability | Current | 14, 22, 38, 45, 47-50 | Conditional qualified-human attempts, public goals, anti-coaching, Human Experience inputs, stable `NUAT-###` scenarios, diagnostic findings, explicit gate effects, and valid `not-needed-now`. |
| `47` | [Persona Model](47-persona-model.md) | capability | Current | 22-24, 46, 49, 50 | Persona primitives and schema, affected-human linkage, guided-review roles, unassisted audience resolution, evidence-path routing, and the independent tester boundary. |
| `48` | [Performance Evidence Governance](48-performance-evidence-governance.md) | capability | Current | 06, 10, 14, 18, 20, 21, 38, 43-46, 50 | Performance applicability, maturity, target authority, versioned `PERF-###` profiles, comparable bounded evidence, finite budgets, gate effects, expiry, and proof-mode boundaries. |
| `49` | [Human Experience Standard and Intent](49-human-experience-standard-and-intent.md) | capability | Current | 01, 06, 14, 15, 23, 46, 47, 50 | Canonical Human Experience Standard, impact classification, conditional design intent, lifecycle propagation, human and machine surface boundary, evidence-review lens, and prospective adoption. |
| `50` | [Proportionate Testing and Human-Centered Validation](50-proportionate-testing-and-human-centered-validation.md) | capability | Current | 01, 06, 14, 15, 20, 23, 43-49 | Four-type testing taxonomy, current-decision selection, automated-test levels, human testing experience, effort and stop rules, evidence reuse, and explicit gate effects. |

## Source Anchors

- [Human Experience Standard and Intent design](../designs/2026-08-28-human-experience-standard-and-intent.md)
- [W20 R0 Human Experience Standard and Intent plan](../plans/2026-08-28-w20-r0-human-experience-standard-and-intent/00-overview.md)
- [Human Experience Standard and Intent](49-human-experience-standard-and-intent.md)
- [Product overview](01-product-overview.md)
- [Architecture overview](02-architecture-overview.md)
- [Open questions and risk register](03-open-questions-and-risk-register.md)
- [PRD Authority Maintenance](../../.make-docs/references/system/prd-change-management.md)
- [Output Contract](../../.make-docs/contracts/system/output-contract.md)
- [Lifecycle Anchor](../../.make-docs/references/system/lifecycle.md)
- [Maintainer template/dogfood source-of-truth contract](../designs/2026-06-19-template-package-and-dogfood-source-of-truth-contract.md)
- [Accepted W19 R1 product-boundary and migration-recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md)
- [Accepted W19 R1 PRD reconciliation plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)
- [Accepted W19 R2 performance-testing guardrails design](../designs/2026-08-12-performance-testing-guardrails.md)
- [Accepted W19 R2 Performance Evidence Governance reconciliation plan](../plans/2026-08-13-w19-r2-performance-evidence-governance/00-overview.md)

## Audience Paths

### Testing Planner, Implementer, or Reviewer

Read [50 Proportionate Testing and Human-Centered Validation](50-proportionate-testing-and-human-centered-validation.md) first. Then read [14 Lifecycle Workflow and Coverage Passes](14-lifecycle-workflow-and-coverage-passes.md), [48 Performance Evidence Governance](48-performance-evidence-governance.md), [46 Unassisted Goal Testing](46-naive-end-user-acceptance-testing.md), and [49 Human Experience Standard and Intent](49-human-experience-standard-and-intent.md) as the selected work requires.

### Maintainer or Release Owner

Read 01-10, then 16-18, 20-25, 28, 30, 34-39, and 43-47. Treat package, dogfood, migration, conformance, Store cleanup, paired UAT/Persona behavior, and deferred obligations as explicit acceptance boundaries.

### New Contributor

Read 01, 02, 04, 05, 06, 07, and 09 first. Then open the capability PRD named by the work backlog before changing code or documentation.

### Product or Technical Lead

Read 01-04, then use the document map to identify the owning capability. Review 14 and 45-47 whenever phase completion, deferred work, Persona selection, or user-observable acceptance is in scope.

### AI Coding Assistant

Resolve product authority from this active map, not from a historical action-named path. Read every related authority named by the work coordinates, preserve requirement identifiers and stable semantic anchors, and run the PRD authority validator before downstream work consumes PRD changes.

## Intended Follow-On

- Plans and work backlogs must reference these current authority paths and topic-specific anchors.
- Historical editorial records may remain only as non-authoritative provenance outside the active PRD namespace.
- Any future requirement change updates its owning product PRD in place, adds standardized Requirement History when useful, and creates a new PRD only for a coherent ownerless product capability or boundary.
- Before implementation or closeout, run `make-docs run prd authority validate --target-root <project>` and resolve every active authority diagnostic.
