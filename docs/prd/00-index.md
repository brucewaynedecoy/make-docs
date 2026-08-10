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
4. Read [45 Deferred Obligation Governance](45-deferred-obligation-governance.md) and [46 Naive End-User Acceptance Testing](46-naive-end-user-acceptance-testing.md) for phase-close routing and end-user evidence. Read [47 Persona Model](47-persona-model.md) for documentation-audience metadata; testing/UAT remains non-persona-scoped.
5. Use plans and work backlogs only after the owning current PRDs establish the product contract.

## Document Map

| Slot | Document | Kind | Status | Related authorities | Current focus |
| --- | --- | --- | --- | --- | --- |
| `00` | [PRD Index](00-index.md) | core | Current | All active PRDs | Navigation and ownership for the active authority set. |
| `01` | [Product Overview](01-product-overview.md) | core | Current | 02, 05-10, 45-47 | Product purpose, users, capabilities, boundaries, and limitations. |
| `02` | [Architecture Overview](02-architecture-overview.md) | core | Current | 05-10, 16-25, 28, 30, 34-39 | Runtime zones, modules, data flow, configuration, and authority boundaries. |
| `03` | [Open Questions and Risk Register](03-open-questions-and-risk-register.md) | core | Current | All active PRDs | Confirmed drift, open questions, deferred obligations, and rebuild risks. |
| `04` | [Glossary](04-glossary.md) | reference | Current | All active PRDs | Canonical product and lifecycle terminology. |
| `05` | [Installation, Profile, and Manifest Lifecycle](05-installation-profile-and-manifest-lifecycle.md) | subsystem | Current | 07, 08, 15, 17, 18, 38 | Selection intent, planner/apply behavior, manifest ownership, conflict handling, and lifecycle safety. |
| `06` | [Template Contracts and Generated Assets](06-template-contracts-and-generated-assets.md) | subsystem | Current | 09, 10, 17, 21-24 | Template authority, selected assets, generated files, and system contract surfaces. |
| `07` | [CLI Command Surface and Lifecycle](07-cli-command-surface-and-lifecycle.md) | subsystem | Current | 05, 25, 39 | Public commands, interaction flow, review, backup, uninstall, and lifecycle UX. |
| `08` | [Skills Catalog and Distribution](08-skills-catalog-and-distribution.md) | subsystem | Current | 05, 18, 28, 30, 36 | Purpose-led skill selection, registries, manifests, sources, scope, and distribution. |
| `09` | [Dogfood and Maintainer Operations](09-dogfood-and-maintainer-operations.md) | subsystem | Current | 06, 10, 16, 17 | Upstream-first authoring, dogfood projection, and maintainer validation. |
| `10` | [Packaging, Validation, and Release Reference](10-packaging-validation-and-release-reference.md) | reference | Current | 06, 09, 16-18, 20, 36 | Package allowlist, copy/prepack flow, smoke validation, release evidence, and support gates. |
| `14` | [Lifecycle Workflow and Coverage Passes](14-lifecycle-workflow-and-coverage-passes.md) | capability | Current | 23, 34, 45, 46 | Lifecycle arc, coverage-pass decisions, follow-on routing, and optional adversarial review. |
| `15` | [Agent Instruction Ownership and Managed Blocks](15-agent-instruction-ownership-and-managed-blocks.md) | capability | Current | 05, 06, 18 | Block-scoped instruction ownership, preservation, hashing, and conflict review. |
| `16` | [Package Runtime and Deployment Boundaries](16-package-runtime-and-deployment-boundaries.md) | subsystem | Current | 17, 18, 25, 39 | Package identity, TypeScript runtime ownership, package runners, and deployment boundaries. |
| `17` | [System Asset Materialization and Local Bootstrap](17-system-asset-materialization-and-local-bootstrap.md) | subsystem | Current | 05, 06, 18, 21, 28 | Materialization modes, provenance, cache/provider safety, and local bootstrap. |
| `18` | [Compatibility Classification and Migration Safety](18-compatibility-classification-and-migration-safety.md) | subsystem | Current | 05, 15-17, 21, 28, 38 | Existing-install classification, conservative migration, backup, rollback, and safe failure. |
| `20` | [Agent Harness Conformance and Support Claims](20-agent-harness-conformance-and-support-claims.md) | subsystem | Current | 10, 36, 43, 44 | Harness/model/package conformance evidence, lab boundaries, tuple status, and support claims. |
| `21` | [Project Tool Directory and Resource Tiers](21-project-tool-directory-and-resource-tiers.md) | subsystem | Current | 17, 18, 22, 24, 28, 38 | `.make-docs/**` tool resources, runtime state, system/custom tiers, and project boundaries. |
| `22` | [Project Documentation Asset Model](22-project-documentation-asset-model.md) | subsystem | Current | 06, 14, 21, 23, 34, 47 | Managed archive, artifact, library, and playbook paths plus template/dogfood/package flow. |
| `23` | [Generated Document Metadata and Lifecycle Handoffs](23-generated-document-metadata-and-lifecycle-handoffs.md) | capability | Current | 14, 22, 24, 34, 47 | Generated metadata, source relationships, lifecycle fields, and follow-on handoffs. |
| `24` | [Project Configuration and Convention Overlay](24-project-configuration-and-convention-overlay.md) | capability | Current | 21-23, 30, 35, 47 | Project-owned presentation configuration over stable paths, identifiers, and semantics. |
| `25` | [TypeScript Runtime, CLI, MCP, and Operation Boundaries](25-typescript-runtime-cli-mcp-operation-boundaries.md) | subsystem | Current | 07, 16, 30, 35, 39 | Shared TypeScript operation core, CLI/MCP separation, and no-scripts boundary. |
| `28` | [Shared Agentics Installation and Harness Exposure](28-shared-agentics-installation-and-harness-exposure.md) | subsystem | Current | 08, 17, 18, 30, 36 | Canonical shared payloads, native harness exposure, ownership, and compatibility. |
| `30` | [Plugin Substrate and Workflow Bundles](30-plugin-substrate-and-workflow-bundles.md) | subsystem | Current | 24, 25, 28, 34-36 | Plugin metadata, workflow bundles, package boundaries, and lifecycle participation. |
| `34` | [Playbook Authoring Contract and Model](34-playbook-authoring-contract-and-model.md) | subsystem | Current | 22-24, 30, 35, 36 | Playbook schema, dependencies, heading spine, parser/validator model, and authoring contract. |
| `35` | [Run Playbook State Machine and Portability](35-run-playbook-state-machine-and-portability.md) | subsystem | Current | 24, 25, 34, 36, 38, 39 | Run progression, state, resume, nesting, concurrency, portability, and guardrails. |
| `36` | [Playbook Packaging Compiler and Harness Adapters](36-playbook-packaging-compiler-and-harness-adapters.md) | subsystem | Current | 20, 28, 30, 34, 35, 43 | Deterministic distributable compilation, dependency materialization, and harness adapters. |
| `38` | [Global Store and Project State](38-global-store-and-project-state.md) | subsystem | Current | 05, 18, 21, 24, 35, 45, 46 | Stable project identity, machine-level operational state, mirrors, evidence, and cleanup. |
| `39` | [CLI Command Model and Operation Registry](39-cli-command-model-and-operation-registry.md) | subsystem | Current | 07, 16, 25, 35, 36, 38 | Five-command grammar, operation registry, human rendering, agent invariance, and package grammar. |
| `43` | [Conformance Scenario Model and Execution Kits](43-conformance-scenario-model-and-execution-kits.md) | subsystem | Current | 20, 36, 44 | Harness-agnostic scenarios, target bindings, execution kits, instruments, and ingestion. |
| `44` | [Conformance Lab Sessions and Evidence](44-conformance-lab-sessions-and-evidence.md) | subsystem | Current | 20, 38, 43 | Agent-driven lab execution, operator modes, session isolation, and evidence homes. |
| `45` | [Deferred Obligation Governance](45-deferred-obligation-governance.md) | capability | Current | 03, 14, 38, 46 | Durable obligation identity, routing, triggers, phase-close audit, and anti-orphan governance. |
| `46` | [Naive End-User Acceptance Testing](46-naive-end-user-acceptance-testing.md) | capability | Current | 14, 38, 45, 47 | Qualified naive testers, activation, anti-coaching, scenarios, evidence, gates, and valid `none`. |
| `47` | [Persona Model](47-persona-model.md) | capability | Current | 22-24, 46 | Persona primitives, schema, frontmatter authority, path drift, and non-persona-scoped UAT boundary. |

## Source Anchors

- [Product overview](01-product-overview.md)
- [Architecture overview](02-architecture-overview.md)
- [Open questions and risk register](03-open-questions-and-risk-register.md)
- [PRD Authority Maintenance](../../.make-docs/references/system/prd-change-management.md)
- [Output Contract](../../.make-docs/contracts/system/output-contract.md)
- [Lifecycle Anchor](../../.make-docs/references/system/lifecycle.md)
- [Maintainer template/dogfood source-of-truth contract](../designs/2026-06-19-template-package-and-dogfood-source-of-truth-contract.md)

## Audience Paths

### Maintainer or Release Owner

Read 01-10, then 16-18, 20-25, 28, 30, 34-39, and 43-46. Treat package, dogfood, migration, conformance, store cleanup, and deferred obligations as explicit acceptance boundaries.

### New Contributor

Read 01, 02, 04, 05, 06, 07, and 09 first. Then open the capability PRD named by the work backlog before changing code or documentation.

### Product or Technical Lead

Read 01-04, then use the document map to identify the owning capability. Review 14, 45, and 46 whenever phase completion, deferred work, or user-observable acceptance is in scope.

### AI Coding Assistant

Resolve product authority from this active map, not from a historical action-named path. Read every related authority named by the work coordinates, preserve requirement identifiers and stable semantic anchors, and run the PRD authority validator before downstream work consumes PRD changes.

## Intended Follow-On

- Plans and work backlogs must reference these current authority paths and topic-specific anchors.
- Historical editorial records may remain only as non-authoritative provenance outside the active PRD namespace.
- Any future requirement change updates its owning product PRD in place, adds standardized Requirement History when useful, and creates a new PRD only for a coherent ownerless product capability or boundary.
- Before implementation or closeout, run `make-docs run prd authority validate --target-root <project>` and resolve every active authority diagnostic.
