# 04 Glossary

## Purpose

This glossary defines the typed and operational vocabulary used across the active `make-docs` PRD set. The most important terms come directly from the CLI contracts in `packages/cli/src/types.ts`, the profile and manifest logic in `packages/cli/src/profile.ts` and `packages/cli/src/manifest.ts`, the static asset pipeline in `packages/cli/src/rules.ts` and `packages/cli/src/catalog.ts`, and the lifecycle boundary in `packages/cli/src/audit.ts`.

## Terms

| Term | Meaning | Key anchors |
| --- | --- | --- |
| Active PRD set | The current live PRD namespace rooted at `docs/prd/`, with a fixed core of `00` through `04` plus adaptive subsystem/reference docs `05+` as required by `.make-docs/contracts/system/output-contract.md`. | `.make-docs/contracts/system/output-contract.md`, `README.md` |
| Capability | One of `designs`, `plans`, `prd`, or `work`. Capabilities are the top-level docs families the installer can enable or disable. | `Capability` in `packages/cli/src/types.ts` |
| Effective capability | The runtime-enabled form of a capability after prerequisite enforcement. A capability can remain selected but ineffective when its dependencies are disabled. | `CAPABILITY_DEPENDENCIES` and `resolveCapabilityState` in `packages/cli/src/profile.ts` |
| Harness | One of `claude-code` or `codex`. Harness selection controls which root instruction file is active and which skill install roots are used. | `Harness` in `packages/cli/src/types.ts`; `getDesiredSkillAssets` in `packages/cli/src/skill-catalog.ts` |
| Instruction kind | The file-level harness marker, either `AGENTS.md` or `CLAUDE.md`. Active instruction kinds expand across root, docs, and asset routers. | `InstructionKind` and `getActiveInstructionKinds` in `packages/cli/src/types.ts`; `getDesiredAssets` in `packages/cli/src/catalog.ts` |
| Install selections | The raw user intent captured before capability resolution: capabilities, harnesses, skill enablement, skill scope, and explicitly selected skill names. Prompt starters, document templates, and references are invariant managed assets for their owning capabilities and are not selection fields. | [05-installation-profile-and-manifest-lifecycle.md](05-installation-profile-and-manifest-lifecycle.md), [08-skills-catalog-and-distribution.md](08-skills-catalog-and-distribution.md) |
| Install profile | The resolved installation state produced from selections, including `capabilityState`, `effectiveCapabilities`, and a stable `profileId`. | `InstallProfile` in `packages/cli/src/types.ts`; `resolveInstallProfile` in `packages/cli/src/profile.ts` |
| Profile ID | The deterministic hash of the resolved install profile. It lets later syncs compare precise profile state rather than a vague installed/not-installed flag. | `resolveInstallProfile` in `packages/cli/src/profile.ts` |
| Install manifest | The persisted managed-state record written to `.make-docs/manifest.json`, including selections, effective capabilities, managed files, and managed skill files. | `InstallManifest` in `packages/cli/src/types.ts`; `loadManifest` and `writeManifest` in `packages/cli/src/manifest.ts` |
| Resolved asset | The normalized unit of desired installer output. Each asset carries `relativePath`, `assetClass`, `sourceId`, and final `content`. | `ResolvedAsset` in `packages/cli/src/types.ts`; `getDesiredAssets` in `packages/cli/src/catalog.ts` |
| Scoped-static asset | A copied asset that still participates in profile-aware inclusion rules. Most references, templates, and prompts are installed this way. | `getDesiredAssets` in `packages/cli/src/catalog.ts`; `readPackageFile` in `packages/cli/src/utils.ts` |
| Managed instruction block | The delimited make-docs-owned region inside any installed `AGENTS.md` or `CLAUDE.md`; manifest hashes and updates apply to the block body, while text outside the markers is user-owned. | `renderManagedBlock`, `parseManagedBlock`, and `upsertManagedBlock` in `packages/cli/src/managed-block.ts`; manifest records in `packages/cli/src/manifest.ts`; `createInstallPlan` in `packages/cli/src/planner.ts` |
| Planned action | The unit of installer or skills-only work in an `InstallPlan`. Internal action types include `create`, `generate`, `update`, `update-conflict`, `noop`, `remove-managed`, `skip`, and `skip-conflict`; final user-facing plan output renders them as `generate`, `update`, `skip`, or `remove`. `skip` records an explicit preserve decision, while `skip-conflict` is an internal unresolved or preserved-conflict marker rather than a final operation label. | `PlannedAction` and `InstallPlan` in `packages/cli/src/types.ts`; `createInstallPlan` in `packages/cli/src/planner.ts`; `getRenderedActions` in `packages/cli/src/cli.ts`; `getRenderedSkillActions` in `packages/cli/src/skills-ui.ts` |
| Conflict staging | The non-destructive behavior where generated replacements for locally modified managed files are written under `.make-docs/conflicts/<run-id>/...` instead of overwriting the user’s copy. | `applyInstallPlan` in `packages/cli/src/install.ts`; `createRunId` in `packages/cli/src/utils.ts` |
| Skill scope | Whether installed skills live in the target project or in the user’s home directory. Global installs later surface in audit and backup as `_home/...` paths. | `getDesiredSkillAssets` in `packages/cli/src/skill-catalog.ts`; `createAuditPathMetadata` in `packages/cli/src/manifest.ts` |
| Managed skill file | A skill asset tracked separately from ordinary scaffold files inside `manifest.skillFiles`. Skills-only operations depend on that split. | `InstallManifest` in `packages/cli/src/types.ts`; `applySkillsOnlyInstallPlan` in `packages/cli/src/install.ts`; `createSkillsOnlyInstallPlan` in `packages/cli/src/planner.ts` |
| Audit report | The shared lifecycle classification that partitions managed state into `removableFiles`, `prunableDirectories`, `preservedPaths`, and `skippedPaths`. | `AuditReport` in `packages/cli/src/types.ts`; `createAuditReport` in `packages/cli/src/audit.ts` |
| Prunable directory | A directory the audit engine can prove will be empty after approved removals, allowing uninstall to remove it safely. | `classifyPrunableDirectories` in `packages/cli/src/audit.ts` |
| Dogfood surface | The repo-root `docs/` tree used by this project to exercise the same template contracts and workflows it ships to consumers. | `README.md`, `packages/docs/README.md`, `packages/cli/src/utils.ts` |
| Prepack bundle | The packaged CLI state after `prepack` copies `packages/docs/template/` into `packages/cli/template/` and builds the CLI output. | `packages/cli/package.json`, `scripts/copy-template-to-cli.mjs` |
| Smoke-pack | The end-to-end packaged validation script that proves prepack, tarball creation, installer behavior, skills, backup, and uninstall still agree. | `scripts/smoke-pack.mjs` |
| Reserved content package | The future-facing `packages/content/` workspace described in `README.md`, which still lacks a live selector or release contract. | `README.md`, `packages/cli/src/catalog.ts` |
| Deferred obligation | An accepted required outcome that cannot be completed at its current work coordinate and therefore has an owner, trigger, target coordinate, dependencies, exit criteria, status, and durable `O-###` identity. | [PRD 45](45-deferred-obligation-governance.md) |
| Orphan finding | An accepted incomplete outcome that is neither completed nor represented by a valid deferred obligation with a future consumption route. | [R-OBL-AUDIT](45-deferred-obligation-governance.md#r-obl-audit-phase-close-orphan-audit) |
| Orphan audit | The mandatory, non-persona-scoped phase-close classification of accepted incomplete outcomes as completed, obligated, rejected, superseded, or unresolved blockers. | [PRD 45](45-deferred-obligation-governance.md) |
| Phase complete | The current phase passed its gate and has no orphaned accepted outcomes; this says nothing stronger about the whole capability. | [PRD 45](45-deferred-obligation-governance.md) |
| Capability partial | Some accepted capability outcomes are delivered while other accepted outcomes remain represented by active or deferred obligations. | [PRD 45](45-deferred-obligation-governance.md) |
| Capability complete | Every accepted outcome for the capability is fulfilled or intentionally terminated with authoritative rationale. | [PRD 45](45-deferred-obligation-governance.md) |
| Capability status unverified | The available evidence is insufficient to classify the capability as partial or complete. | [PRD 45](45-deferred-obligation-governance.md) |
| Naive tester | A person or isolated agent with no implementation or architecture knowledge, no private agent context, and access only to the installed product plus real user-facing instructions. | [PRD 46](46-naive-end-user-acceptance-testing.md) |
| Naive end-user UAT | Goal-oriented acceptance testing in which a qualified naive tester attempts a real user outcome without coaching, implementation-shaped steps, or hidden knowledge. | [PRD 46](46-naive-end-user-acceptance-testing.md) |
| Installed product | The product surface a real user would actually receive and use, including its supported setup path and user-facing instructions, rather than source code, internal fixtures, or a developer-only shortcut. | [R-NUAT-SCOPE](46-naive-end-user-acceptance-testing.md#r-nuat-scope-qualified-tester-and-installed-product) |
| User-observable slice | A product increment that a real user can meaningfully perceive, attempt, understand, or complete through an installed product workflow. | [PRD 46](46-naive-end-user-acceptance-testing.md) |
| Tester packet | The minimum installed-product access, user-facing instructions, scenario goal, setup, safety boundaries, and evidence-capture directions given to a naive tester. | [PRD 46](46-naive-end-user-acceptance-testing.md) |
| Operator view | Facilitator/developer-only scenario information such as setup, teardown, safety intervention, evidence handling, and requirement traceability that must not leak expected steps or answers to the tester. | [R-NUAT-SCENARIO](46-naive-end-user-acceptance-testing.md#r-nuat-scenario-scenario-identity-and-artifact-contract) |
| Anti-coaching | The rule that a tester packet cannot reveal internal terms, architecture, hidden steps, expected answers, or workaround instructions that compensate for product discoverability failures. | [R-NUAT-GOAL](46-naive-end-user-acceptance-testing.md#r-nuat-goal-real-world-goals-and-anti-coaching) |
| Naive-UAT pass | The qualified tester completed the goal without disqualifying coaching and the evidence supports the scenario's user-facing success criteria. | [R-NUAT-EVIDENCE](46-naive-end-user-acceptance-testing.md#r-nuat-evidence-setup-outcomes-findings-and-reproducibility) |
| Naive-UAT fail | The product prevented, corrupted, or materially defeated the user goal; the finding must be routed by severity and reproducibility. | [R-NUAT-EVIDENCE](46-naive-end-user-acceptance-testing.md#r-nuat-evidence-setup-outcomes-findings-and-reproducibility) |
| Naive-UAT revise | The tester exposed confusion, discoverability, mental-model, instruction, or interaction problems that require product or scenario revision before acceptance. | [R-NUAT-EVIDENCE](46-naive-end-user-acceptance-testing.md#r-nuat-evidence-setup-outcomes-findings-and-reproducibility) |
| Naive-UAT blocked | The run could not produce a valid acceptance verdict because setup, environment, access, safety, or tester-qualification conditions failed. | [R-NUAT-EVIDENCE](46-naive-end-user-acceptance-testing.md#r-nuat-evidence-setup-outcomes-findings-and-reproducibility) |
| Support-scope cell | One specific product-surface and support-context combination—such as platform, interface, input mode, or accessibility basis—that needs its own evidence when Make Docs makes a support claim for it. | [R-NUAT-SCOPE-MATRIX](46-naive-end-user-acceptance-testing.md#r-nuat-scope-matrix-cross-platform-visual-and-accessibility-scope) |
| Project State | The operational project-scoped state surface that may hold execution progress and evidence pointers while repository artifacts retain semantic authority. | [PRD 38](38-global-store-and-project-state.md) |
| Project State evidence reference | A non-authoritative operational pointer, identifier, timestamp, or run record that helps locate execution evidence; repository requirements, scenarios, findings, and terminal rationales remain the product authority. | [R-NUAT-STATE](46-naive-end-user-acceptance-testing.md#r-nuat-state-repository-and-evidence-boundary) |

## Source Anchors

- `docs/prd/45-deferred-obligation-governance.md`
- `docs/prd/46-naive-end-user-acceptance-testing.md`
- `docs/designs/2026-07-27-deferred-obligations-and-anti-orphan-governance.md`
- `docs/designs/2026-07-27-true-naive-end-user-acceptance-testing.md`

- `.make-docs/contracts/system/output-contract.md`
- `README.md`
- `packages/cli/src/types.ts`
- `packages/cli/src/profile.ts`
- `packages/cli/src/manifest.ts`
- `packages/cli/src/catalog.ts`
- `packages/cli/src/planner.ts`
- `packages/cli/src/install.ts`
- `packages/cli/src/skill-catalog.ts`
- `packages/cli/src/audit.ts`
- `packages/cli/package.json`
- `scripts/copy-template-to-cli.mjs`
- `scripts/smoke-pack.mjs`
