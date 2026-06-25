# W17 R1 Skill Purpose Registry Alternate Skills Manifest Work Backlog

## W9 R4 Prerequisite

Before executing this backlog, apply [W9 R4 v2 Documentation Asset IA Hard Move](../2026-06-25-w9-r4-v2-documentation-asset-ia-hard-move/00-index.md). W17 R1 must resolve skill registry, manifest, and template paths against `.make-docs/**` system resources and the W9 R4 project-asset families rather than pre-pivot docs-assets tool-resource paths.

## Purpose

Implement the requirements captured in [27-revise-skill-purpose-registry-alternate-skills-manifest.md](../../prd/27-revise-skill-purpose-registry-alternate-skills-manifest.md) and planned in [W17 R1 Skill Purpose Registry Alternate Skills Manifest Plan](../../plans/2026-06-23-w17-r1-skill-purpose-registry-alternate-skills-manifest/00-overview.md).

## Source Inputs

- [Skill Purpose Registry and Alternate Skills Manifest](../../designs/2026-06-20-skill-purpose-registry-and-alternate-skills-manifest.md)
- [W17 R1 plan overview](../../plans/2026-06-23-w17-r1-skill-purpose-registry-alternate-skills-manifest/00-overview.md)
- [PRD 27](../../prd/27-revise-skill-purpose-registry-alternate-skills-manifest.md)
- [Risk register](../../prd/03-open-questions-and-risk-register.md)

## Phase Map

| Phase | File | Focus |
| --- | --- | --- |
| P1 | [01 Requirements and Register Reconciliation](01-requirements-and-register-reconciliation.md) | Keep PRD/risk updates aligned with the accepted purpose-manifest contract. |
| P2 | [02 Manifest Schema and Registry Validation](02-manifest-schema-and-registry-validation.md) | Evolve the built-in registry into the effective manifest shape. |
| P3 | [03 Selection Source Policy and Provenance](03-selection-source-policy-and-provenance.md) | Implement purpose-led selection, alternate manifest input, source policy, and provenance. |
| P4 | [04 Lifecycle Package Validation and Closeout](04-lifecycle-package-validation-and-closeout.md) | Prove lifecycle safety, package validation, and no-default-skills behavior. |

## Acceptance Gate

Do not close W17 R1 while a bare default install can write skill files, while `selectedSkills` no longer names resolved skills, or while unpinned remote manifests can install skill payloads.
