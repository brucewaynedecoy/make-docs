---
title: "Project Assets and Persona Discovery: Phase 1"
kind: "plan"
status: "draft"
coordinate: "W19 R4 P1"
source:
  type: "design"
  path: "docs/designs/2026-09-09-project-assets-and-persona-discovery.md"
---

# Phase 1: Assets and Persona Cutover

## Purpose

Deliver the [design](../../designs/2026-09-09-project-assets-and-persona-discovery.md) as one phase after backlog acceptance and implementation authorization. Ordered stages keep one completion boundary for configuration, discovery, migration, and the real directory tree.

## Overview

This is a scoped correction to W19 recovery. It retains R3's Store state service and existing shared operation registry. It introduces no replacement migration engine, local state fallback, general Persona framework, or UAT scenario framework.

## Stage 1 - Effective Audiences and On-Demand Discovery

Implement the two fixed built-in audience mappings and four-field schema. Merge local config by slug without overwriting it. Keep defaults for absent/empty configuration and reject invalid or reserved mappings. Add the read-only `project.persona.list` operation with no Store dependency.

Change the upstream bootstrap/routing contract so `docs/assets/` is on demand. Always-present documentation routers expose defaults, config location, shared/audience destinations, and an explicit `Asset router files:` declaration projected from the reviewed harness choices. No-CLI authors create exactly those short root instruction files; absent/invalid declarations need an explicit project choice and never actor-based inference. Keep assets routers short and move detailed testing rules into system resources. Retain the artifacts compatibility selector as an assets-root ensure plus a reported, uncreated shared-content destination; it must not create an empty project child or the old artifacts path. Preserve configured harnesses and create no empty child families.

The no-CLI case starts with an initialized or cloned project's bootstrap routers, no assets directory, no optional local resource bodies, and no task-history memory. Ordinary content creation must work from these public instructions. It must not create a local machine plan/receipt or claim managed ownership for manually created paths.

## Stage 2 - Reviewed Layout Operations

Implement the four `project.layout.*` operations and exact grammar in the [overview](00-overview.md#shared-command-and-result-contract). Preview reads only. Preparation saves the complete reviewed map and source/target/link expectations in the Store and releases its process lock. Pending intent blocks conflicting managed writes.

Apply uses verified journaled changes. Manual users act only after reviewed inventory and Store preparation. Verification reads the saved expectations and the real source/target/link state before recording completion. Use existing status/recovery operations. Fail safely on changed source bytes, conflicting targets, unproved aliases, missing payloads, new leftovers, or unavailable required Store state.

Use the design's disposition table. Preserve the full archived structure and every retained record. Map the old default `developer` audience only when its shipped lineage is proved. Never infer `agent` as `maintainer`. Retired Playbooks remain historical under `.make-docs/archive/legacy-playbooks/`. Record mechanical link repairs; do not rewrite historical outcomes.

## Stage 3 - Delivery, Dogfood, and Completion Proof

Update upstream template source and the build copier before generating package output. Inspect packed tar entries and actual filesystem directories, including empty directories that Git omits. Refresh the installed CLI, then use the normal `make-docs` setup/layout commands for dogfood. Do not substitute development entry points for the routine installed CLI recipe.

Use the exact refreshed dogfood inventory and approved map. No unexplained leftovers may remain in the affected active source/package/install/dogfood trees. Named historical or backup byte copies are allowed only as non-active provenance. A retained exception cannot preserve an active old asset family and still claim the move complete.

## Acceptance Matrix

| Case | Required proof | Promise |
| --- | --- | --- |
| A1 Defaults and config merge | Absent/empty/comment-only config, absent/empty Persona list, changed built-in labels/descriptions, and added custom audiences yield the exact effective set without config writes. | EP1, EP5 |
| A2 Invalid config | Explicit null, wrong-type or malformed config/personas, duplicate/unsafe/reserved slugs, unsupported primitives, and changed built-in mappings give clear errors; bytes stay unchanged. Include reviewed legacy custom-name conflicts. | EP1, EP4 |
| A3 Store-independent query | Installed CLI returns effective Personas with the Store unavailable; no Store/project write or directory creation. | EP1, EP5 |
| A4 Fresh-context discovery | A fresh agent with only public project routers/config, absent CLI, absent assets, and absent optional projections finds defaults and the declared harness router filenames, then authors the first shared and Persona assets and short root routers without local machine state. No claim is made for never-initialized projects. | EP1, EP5 |
| A5 Full delivery tree | Upstream/build-copier output, tar entries, extracted package, fresh configured-harness installs, upgrade, repeat, and dogfood match the on-demand tree; include empty-directory inventory. | EP2 |
| A6 Surface creation | CLI ensure creates root/configured routers only, preserves outside managed-block bytes, adds no empty children, and repeats without change. Check the short filename declaration after fresh setup, reconfigure, dogfood, and in the no-CLI case. | EP2, EP4 |
| A7 Preview and preparation | Preview has no writes. Preparation verifies the review digest, records full source/destination/link expectations in Store, releases its process lock, and leaves a blocking pending operation. | EP3, EP4 |
| A8 CLI migration | Every finite cohort has its exact reviewed disposition; collisions and custom audiences are explicit; source/destination bytes and repaired links prove completion. | EP3, EP4 |
| A9 Manual migration | Preparation precedes human/agent file moves. Verification rejects target-name-only, wrong-byte, missing-link, new-source and leftover evidence; correct read-back alone permits Store completion. | EP3, EP4 |
| A10 Interruption and drift | Inject one failure before project mutation, one mid-file sequence, and one before completion. Prove pending visibility and safe resume/rollback under R3; changed content is preserved. | EP4 |
| A11 Retention and repeat | Historical records retain substantive bytes; link-only repairs have a map; retired Playbooks are non-active; second preview/ensure/apply cannot recreate old directories or repeat completed moves. | EP2, EP4 |
| A12 Dogfood review | After installed CLI refresh, execute the reviewed dogfood map through public commands and account for every active source and directory. Record visible findings and reviewer limits for EP1–EP5. | EP1–EP5 |

This is the finite required matrix. Use existing targeted tests and the package/build checks needed to cover it. Run the full required suite once after targeted corrections. Repeat a check only after a relevant change, failure, or unresolved concern. Separate automated proof, guided owner review, and fresh-context agent discovery. The agent discovery check does not certify qualified human UAT; record formal Unassisted Goal Testing as `not-needed-now` for this bounded agent discovery check because no separate qualified-human scenario is activated here. Any new material audience uncertainty follows the existing PRD 46 decision path; it does not create a new testing framework.

## Dependencies

- Accepted current PRD updates and the later reviewed work backlog.
- R3 Store journal, verified checkout identity, operation lock and safe recovery.
- Upstream-first package flow and a refreshed installed CLI before dogfood.
- Exact inventory and review digest before any legacy file mutation.

## Completion Boundary

The phase is complete only after all applicable matrix rows have evidence, EP1–EP5 have per-promise review results, and there are no unexplained active leftovers. Record outstanding issues as blockers or explicit owner-approved obligations. Do not replace incomplete migration with a successful package build or prose claim. This plan is not an implementation approval.
