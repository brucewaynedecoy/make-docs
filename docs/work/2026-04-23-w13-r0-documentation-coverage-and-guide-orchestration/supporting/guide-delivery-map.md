# Guide Delivery Map

> Phase 2 artifact for [W13 R0](../02-coverage-decisions-and-batch-map.md). This map translates the finalized ledger into worker-owned guide changes with fixed audiences, families, targets, priorities, and bundle assignments.

## Purpose

This map is execution-facing. Bundle workers should treat the action, target file, title, priority, and ownership below as locked. Later phases may write guide prose and add evidence-backed details, but they should not rename files, swap bundle ownership, or reopen create-vs-update decisions.

## Outcome Summary

| Outcome | Rows |
| --- | --- |
| `developer` | 4 |
| `user` | 3 |
| `both` | 3 |
| `link-only` | 2 |
| `none` | 0 |

## Bundle A - Onboarding, Concepts, and Workflows

| Capability ID | Outcome | Audience | Action | `path` | Target file | Title | Priority | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `L04` | `user` | user | `update` | `getting-started` | `docs/guides/user/getting-started-installing-make-docs.md` | `Installing Make Docs` | `P1` | Narrow this guide to install prerequisites, first install, initial apply, and capability selection. Hand ongoing lifecycle operations to Bundle B. |
| `L02` | `both` | user | `update` | `concepts` | `docs/guides/user/concepts-wave-revision-phase-coordinates.md` | `Understanding W/R/P Coordinates` | `P1` | Align coordinate terminology and cross-links with the stage-model and route guides. |
| `L02` | `both` | user | `update` | `workflows` | `docs/guides/user/workflows-how-make-docs-stages-fit-together.md` | `How Make Docs Stages Fit Together` | `P1` | Keep the current user mental model of stages and outputs coherent with the active PRD set. |
| `L02` | `both` | developer | `update` | `development/workflows` | `docs/guides/developer/development-workflows-stage-model-and-artifact-relationships.md` | `Understanding the Make Docs Stage Model` | `P1` | Preserve contributor-facing artifact relationships and lifecycle rules. |
| `L03` | `both` | user | `update` | `workflows` | `docs/guides/user/workflows-choosing-the-right-route-for-your-project.md` | `Choosing the Right Route for Your Project` | `P1` | Keep the user decision guide current and prepare a `related` link to the Bundle C decomposition skill guide. |
| `L03` | `both` | developer | `update` | `development/workflows` | `docs/guides/developer/development-workflows-choosing-the-right-route.md` | `Choosing the Right Make Docs Route` | `P1` | Keep maintainer and contributor route rules current and prepare a `related` link to Bundle C skills coverage. |

## Bundle B - CLI Lifecycle

| Capability ID | Outcome | Audience | Action | `path` | Target file | Title | Priority | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `L05` | `user` | user | `create` | `cli/lifecycle` | `docs/guides/user/cli-lifecycle-managing-installations.md` | `Managing Installations with the Make Docs CLI` | `P1` | Own current apply or sync, `reconfigure`, `--dry-run`, help, backup, uninstall, and recovery guidance in one user-facing CLI guide. |

## Bundle C - Skills

| Capability ID | Outcome | Audience | Action | `path` | Target file | Title | Priority | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `L06` | `both` | user | `create` | `skills` | `docs/guides/user/skills-installing-and-managing-skills.md` | `Installing and Managing Skills` | `P1` | Cover skills command usage, project versus global scope, and optional versus required skills. |
| `L06` | `both` | developer | `create` | `skills` | `docs/guides/developer/skills-catalog-and-distribution-model.md` | `Skills Catalog and Distribution Model` | `P1` | Cover registry ownership, harness targets, scope rules, and skills-only planning and apply behavior. |
| `L07` | `link-only` | user | `link-only` | `skills` | `docs/guides/user/skills-installing-and-managing-skills.md` | `Installing and Managing Skills` | `P2` | Add an `archive-docs` section as the default required skill instead of creating a standalone guide. |
| `L07` | `link-only` | developer | `link-only` | `skills` | `docs/guides/developer/skills-catalog-and-distribution-model.md` | `Skills Catalog and Distribution Model` | `P2` | Mention `archive-docs` in the shipped-skill inventory and default profile discussion. |
| `L08` | `user` | user | `create` | `skills` | `docs/guides/user/skills-decomposing-an-existing-codebase.md` | `Decomposing an Existing Codebase` | `P1` | Own the concrete `decompose-codebase` skill entry point, expected outputs, and artifact expectations. |

## Bundle D - Template, Contracts, Maintainer, and Release Operations

| Capability ID | Outcome | Audience | Action | `path` | Target file | Title | Priority | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `L01` | `developer` | developer | `create` | `template/contracts` | `docs/guides/developer/template-contracts-guide-authoring.md` | `Guide Contracts and Authoring for make-docs` | `P2` | Explain guide taxonomy, frontmatter rules, slug conventions, and publication-path expectations. |
| `L09` | `developer` | developer | `create` | `template/assets` | `docs/guides/developer/template-assets-and-generated-routers.md` | `Template Assets and Generated Routers` | `P1` | Explain template-owned docs, managed assets, router generation, and reduced-profile rendering boundaries. |
| `L10` | `developer` | developer | `create` | `maintainer` | `docs/guides/developer/maintainer-docs-assets-and-runtime-state-boundaries.md` | `Docs Assets and Runtime State Boundaries` | `P1` | Preserve the explicit `docs/assets/**` versus `.make-docs/**` boundary and the historical mismatch note. |
| `L12` | `developer` | developer | `update` | `cli/development` | `docs/guides/developer/cli-development-local-build-and-install.md` | `Building and Installing the CLI Locally` | `P1` | Narrow this guide to local build, test, instruction-router validation, and smoke-pack entry paths; link outward for maintainer and release operations. |
| `L12` | `developer` | developer | `create` | `maintainer` | `docs/guides/developer/maintainer-dogfood-and-maintainer-operations.md` | `Dogfood and Maintainer Operations` | `P1` | Cover dogfood reseeding, maintainer workflows, and the template/package relationship without reusing roadmap prose. |
| `L12` | `developer` | developer | `create` | `release` | `docs/guides/developer/release-packaging-validation-and-release-reference.md` | `Packaging, Validation, and Release Reference` | `P1` | Cover packaging flow, validation expectations, smoke-pack context, and release procedure. |
| `L11` | `link-only` | developer | `link-only` | `release` | `docs/guides/developer/release-packaging-validation-and-release-reference.md` | `Packaging, Validation, and Release Reference` | `P3` | Add the false-positive link-filtering behavior to the validation section instead of creating a standalone guide. |

## Assembly Dependencies

| Dependency | Owner | Blocked by | Notes |
| --- | --- | --- | --- |
| `README.md` guide discovery refresh | Phase 6 | Bundles A-D complete | The root navigation update must happen after the guide set exists so discovery reflects final filenames and families. |
| Cross-bundle `related` normalization between onboarding and CLI lifecycle guides | Phase 6 | Bundles A and B | Normalize `related` links between `getting-started-installing-make-docs.md` and `cli-lifecycle-managing-installations.md`. |
| Cross-bundle `related` normalization between route guides and the decomposition skill guide | Phase 6 | Bundles A and C | Resolve the workflow-versus-skill split without duplicating ownership. |
| Cross-bundle `related` normalization between CLI lifecycle and maintainer or release guides | Phase 6 | Bundles B and D | Align troubleshooting, runtime-state, backup, uninstall, and validation surfaces after both bundles land. |
| Cross-bundle `related` normalization between skills guides and maintainer or release docs | Phase 6 | Bundles C and D | Connect skill distribution and shipped-skill coverage back to the maintainer and release surfaces without spreading shared-file edits across bundles. |

## Bundle Write Scope

| Owner | Allowed write scope | Prohibited shared files or paths |
| --- | --- | --- |
| Bundle A | `docs/guides/user/getting-started-*.md`, `docs/guides/user/concepts-*.md`, `docs/guides/user/workflows-*.md`, `docs/guides/developer/development-workflows-*.md` | `README.md`, all `cli-*`, all `skills-*`, all `template-*`, all `maintainer-*`, all `release-*`, and `docs/guides/developer/cli-development-local-build-and-install.md` |
| Bundle B | `docs/guides/user/cli-*.md` | `README.md`, all Bundle A paths, all `skills-*`, all `template-*`, all `maintainer-*`, all `release-*`, and `docs/guides/developer/cli-development-local-build-and-install.md` |
| Bundle C | `docs/guides/user/skills-*.md`, `docs/guides/developer/skills-*.md` | `README.md`, all Bundle A paths, all `cli-*`, all `template-*`, all `maintainer-*`, all `release-*`, and `docs/guides/developer/cli-development-local-build-and-install.md` |
| Bundle D | `docs/guides/developer/template-*.md`, `docs/guides/developer/maintainer-*.md`, `docs/guides/developer/release-*.md`, `docs/guides/developer/cli-development-local-build-and-install.md` | `README.md`, all Bundle A paths, all user `cli-*`, and all `skills-*` |
| Phase 6 assembly | `README.md` and final cross-bundle `related` or navigation normalization across the landed guide set | Bundle-owned guide body rewrites beyond scoped fixups needed for link normalization, traceability, or validation |

## Worker Handoff Payload

Every later worker handoff must include:

- files changed
- ledger rows satisfied
- evidence used
- unresolved questions
- links added or deferred to Phase 6
