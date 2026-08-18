# Agent Harness and Model Conformance Lab

## Purpose

Define a maintainer-only conformance lab that can exercise make-docs behavior across agent harnesses and harness-selected models before the project publishes support claims. The lab provides evidence for claims; it does not become part of shipped make-docs installs, templates, npm packages, Rust packages, or provider-backed system asset delivery.

## Context

The v2 roadmap calls for a parallel maintainer conformance track after the accepted Batch 1 packaging, materialization, compatibility, and source-of-truth contracts. Those contracts are stronger authority than the roadmap proposal. The lab must consume them as scenario inputs instead of rediscovering or changing their decisions.

The accepted Batch 1 designs establish these constraints:

- [Package and Deployment Boundaries](2026-06-19-package-and-deployment-boundaries.md) keeps the TypeScript npm package as the current executable source of truth for install, manifest, audit, backup, uninstall, conflict, and skills-selection safety while the future Rust CLI remains a separate distribution that must preserve shared product contracts.
- [System Asset Delivery and Materialization Contract](2026-06-19-system-asset-delivery-and-materialization-contract.md) keeps `full-snapshot` as the safe default, requires local bootstrap files in every materialization mode, and defers provider-backed reliance until manifest provenance and implementation evidence exist.
- [Compatibility, Audit, and Migration Disposition](2026-06-19-compatibility-audit-and-migration-disposition.md) requires state classification before mutation, single-audit `backup-and-reinstall` safety, conservative fallback recognition, and opt-in skills preservation.
- [Template, Package, and Dogfood Source-of-Truth Contract](2026-06-19-template-package-and-dogfood-source-of-truth-contract.md) makes `packages/docs/template/` the first mutation target, root `docs/` dogfood validation, and `packages/cli/template/` package proof rather than an authoring surface.

Earlier related designs also constrain the lab. [Agent Instruction File Ownership Model](../assets/archive/designs/2026-06-18-agent-instruction-file-ownership.md) defines managed instruction blocks and harness parity for `AGENTS.md` and `CLAUDE.md`. [Coverage Pass Contract and Skill Evolution](../assets/archive/designs/2026-05-28-coverage-pass-contract-and-skill-evolution.md) establishes verdict-and-reason discipline for documentation-worthy outcomes, but its coverage-pass vocabulary is not a substitute for conformance verdicts.

Current executable code exposes only `codex` and `claude-code` as product harnesses through `packages/cli/src/types.ts`, `packages/cli/src/wizard.ts`, `packages/cli/src/skill-catalog.ts`, and `packages/cli/src/audit.ts`. OpenCode, Goose, Pi, and later agentic IDEs are future adapter targets for the lab, not current make-docs install harnesses until a later accepted design changes the executable harness model.

This design intentionally starts from `docs/artifacts/v2-proposed-design-and-roadmap.md` and the accepted evidence pass. That is a lifecycle departure at the input step: artifact roadmap material is being used to hydrate this design before the work returns to the normal `design -> plan -> PRD -> work -> implementation` chain described by [Lifecycle Anchor](../../.make-docs/references/system/lifecycle.md). No PRD, risk register, plan, work backlog, package template, guide, source code, or prior design backlink changes are part of this design authoring pass.

## Decision

Create a maintainer-only conformance lab as repository tooling and documentation evidence, not shipped product surface. The lab's authored scenario specs and compact reviewed result records will live under a future `docs/assets/conformance/` tree in this repository only. Raw run artifacts, full transcripts, provider logs, and temporary workspaces will default to generated local storage such as `.make-docs/conformance/` or `.make-docs/runs/conformance/` and should not be committed unless a maintainer deliberately promotes a redacted evidence bundle for a contentious result or stronger public claim.

The lab will be model-agnostic. A scenario defines make-docs behavior and expected evidence without assuming a specific model provider. A run records the selected harness, model name, provider or routing layer when known, model version or immutable identifier when available, make-docs version, runtime distribution, scenario id, scenario version, run date, produced files, relevant diffs, exit status, transcript or log pointer, normalized verdict, reason, caveats, and reviewer status.

Initial executable coverage is Codex and Claude Code because those are the current make-docs harnesses. The lab design must also reserve adapter work for OpenCode, Goose, Pi, and future agentic IDEs. Future adapters must exercise the same scenario protocol when those harnesses are configured with default hosted models, alternate hosted models, or open-weight models routed through providers such as Fireworks, OpenRouter, Together, or similar services. Examples such as Claude Code configured with GLM 5.2 are valid future lab inputs, but the lab must treat the model as captured run metadata rather than embedding that model into scenario logic.

The initial scenario families are tied to accepted Batch 1 contracts:

- install and reconfigure behavior for TypeScript npm package boundaries, executable naming, manifest creation, and no hidden CLI-only state;
- audit, manifest validation, managed-file classification, missing or malformed manifest handling, and conservative fallback recognition;
- `backup-and-reinstall` safety, including one reviewed audit snapshot before backup, removal, and reinstall;
- managed instruction blocks, harness router parity, and root/docs instruction file behavior;
- bare install versus explicit skills installation, including skill root ownership and selected-skill preservation;
- template-first mutation, reviewed dogfood reseeding, package template refresh, smoke-pack proof, and package dry-run evidence;
- materialization-mode readiness, including provider-backed and hybrid pinned cache scenarios only after the provider and manifest provenance designs have executable support;
- lifecycle routing and generation scenarios for design, plan, PRD, and work outputs once later Batch 2 and Batch 3 designs define the canonical v2 behavior;
- plugin and playbook scenarios only after shared agentics install, plugin substrate, and Run Playbook decisions land.

Each scenario must classify its safety mode before execution: read-only, dry-run, temp-fixture apply, destructive temp-fixture apply, or external-provider run. The lab must not run destructive scenarios against a maintainer's working tree. Scenarios that require credentials, network access, provider accounts, unavailable harnesses, or model routing must report `blocked` instead of inventing evidence.

Conformance verdicts are:

- `pass`: the run met the scenario's required checks and produced acceptable evidence for that scenario, harness, and model.
- `pass-with-caveats`: the run met the required checks but the evidence includes documented limitations, manual intervention, degraded output quality, or provider/harness constraints that must be visible in any support claim.
- `inconsistent`: repeated or comparable runs disagree enough that the scenario cannot support a stable claim.
- `unsupported`: the harness, model, provider route, or product surface does not support the required behavior, and the limitation is understood.
- `blocked`: the lab could not run or evaluate the scenario because an environmental precondition, credential, provider, adapter, or product implementation was unavailable.

Public support claims are evidence-gated per scenario, harness, and model. One passing run for a scenario/harness/model tuple is the minimum threshold for nominal public support. Repeated runs with small-sample maintainer review are the stronger threshold for a more confident commendation. A pass for one model in a harness does not imply that every model routed through that harness is supported, and a pass for one scenario does not imply blanket harness support.

The lab will produce two evidence classes. Scenario specs and normalized result records are compact, reviewable, and suitable for source control. Full raw transcripts and provider logs are generated evidence, not default committed state. A maintainer may promote a redacted evidence bundle when the result is surprising, disputed, security-sensitive, or used to justify a stronger support claim. Public compatibility docs and harness matrix updates should cite the compact result records and only link to promoted bundles when the extra detail is needed.

The lab consumes existing validation rather than replacing it. Future implementation may call `npm test -w packages/cli`, `npm run validate:defaults -w packages/cli`, `bash scripts/check-instruction-routers.sh`, `node scripts/smoke-pack.mjs`, package dry-run checks, router parity checks, template/dogfood parity checks, and targeted install/audit/backup/skills/managed-block tests as scenario steps. A green lab run is not a substitute for package validation, and a green package validation run is not a public harness/model support claim without conformance evidence.

The lab must reference open PRD and risk-register items without mutating them in this design pass. Relevant open items include Q-007 remote skill source trust, Q-009 persona schema, Q-012 shared plugin/skill install mapping, Q-013 plugin exposure, D-007 dogfood reseeding freshness, R-003 package/source path drift, R-004 manifest/package safety, R-006 single reviewed audit snapshot safety, R-007 dogfood freshness, and R-014 no-scripts migration risk.

## Alternatives Considered

Ship the conformance lab inside installed make-docs templates, npm packages, or future Rust packages. This was rejected because the roadmap requires maintainer-only evidence infrastructure. Consumers need local bootstrap readability and installed docs, not the machinery maintainers use to evaluate harness/model claims.

Treat the conformance lab as the source of truth for template, package, and dogfood ownership. This was rejected by the accepted template/package/dogfood design. The lab verifies that contract; it does not decide or own template mutation order.

Require repeated maintainer-reviewed runs before any public claim. This is the gold standard, but it is too heavy as the minimum threshold. One passing run per scenario/harness/model is enough for nominal support when the evidence is recorded and caveats are visible. Repeated runs and review earn stronger confidence.

Commit all raw transcripts and logs by default. This would maximize auditability but would also increase review burden, create privacy and credential risks, and make routine evidence noisy. Compact normalized records are the default. Raw evidence is promoted only when it materially supports a disputed, surprising, or higher-confidence claim.

Write separate scenario protocols for each harness. This was rejected because the important claim is make-docs behavior under a harness-selected model. Harness adapters should translate execution mechanics; scenario specs should stay product-behavior and model-agnostic.

## Consequences

Public support claims remain conservative until conformance records exist. Batch 2 design drafting can continue, but public harness/model support wording, harness matrix confidence, provider-backed claims, plugin claims, and model-specific endorsements must cite lab evidence or stay withheld.

Future implementation needs a change plan that creates the conformance scenario schema, adapter interface, result record schema, local raw-artifact storage, reviewed-result workflow, and support-claim gating rules. That plan must keep conformance assets out of `packages/docs/template/`, `packages/cli/template/`, npm tarballs, and future Rust packages unless a later accepted design deliberately promotes a subset.

The first scenario set should be narrow and Batch 1 anchored. It should prove existing package, audit, backup, managed-block, skills, and template/package/dogfood contracts before expanding into Batch 2 information architecture, Batch 3 CLI/MCP and no-scripts behavior, or Batch 4 plugin/playbook behavior.

Model-specific results must be explicit. A run against Codex with one model, Claude Code with another model, or OpenCode/Goose/Pi through a provider-routed open-weight model produces evidence only for that tuple. Support language must avoid collapsing harness, provider, and model into a single broad claim.

Maintainers gain a lightweight evidence trail without committing every raw log. The tradeoff is that stronger claims require reviewer judgment about which raw evidence to preserve, redact, and promote.

No PRD or risk-register state changes are made by this design. The follow-on plan should decide whether any open questions or risks move when implementation details are concrete enough.

## Design Lineage

Update Mode: `new-doc-related`

Prior Design Docs:

- [Package and Deployment Boundaries](2026-06-19-package-and-deployment-boundaries.md)
- [System Asset Delivery and Materialization Contract](2026-06-19-system-asset-delivery-and-materialization-contract.md)
- [Compatibility, Audit, and Migration Disposition](2026-06-19-compatibility-audit-and-migration-disposition.md)
- [Template, Package, and Dogfood Source-of-Truth Contract](2026-06-19-template-package-and-dogfood-source-of-truth-contract.md)
- [Agent Instruction File Ownership Model](../assets/archive/designs/2026-06-18-agent-instruction-file-ownership.md)
- [Coverage Pass Contract and Skill Evolution](../assets/archive/designs/2026-05-28-coverage-pass-contract-and-skill-evolution.md)

Reason: This is a distinct maintainer infrastructure decision, but it is closely related to prior design intent because it converts accepted package, materialization, audit, migration, template, dogfood, harness, and coverage contracts into repeatable evidence scenarios. It extends those decisions without superseding or mutating them.

## Intended Follow-On

Route: `change-plan`

Next Prompt: [designs-to-plan-change.prompt.md](../../.make-docs/system/prompts/designs-to-plan-change.prompt.md)

Why: This design adds maintainer-only evidence infrastructure around existing make-docs package, template, audit, backup, skills, harness, and support-claim surfaces. It should feed a change plan that introduces the lab while preserving accepted Batch 1 contracts and avoiding shipped-template/package scope creep.

Coordinate Handoff: unresolved; planner must resolve before writing.
