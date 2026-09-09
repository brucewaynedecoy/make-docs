---
title: First-Party Skills and Managed Adoption
kind: design
status: active
coordinate: W19 R5
follow_on:
  route: change-plan
  next_prompt: make-docs://system/prompt/designs-to-plan-change.prompt.md
  why: Put the settled bundled-skill and reviewed-adoption choices into existing product authority before a one-phase backlog.
  coordinate_handoff: Carry W19 R5 after W19 R4; W20 and W21 remain paused.
---

# First-Party Skills and Managed Adoption

## Purpose

Make all first-party Skills available from the installed CLI package, and let an owner bring existing local copies under Make Docs management through a reviewed CLI operation. Keep each Skill optional, portable, and usable on its own.

## Context

Three useful Skills currently live only in this repository's `.agents/skills/`: `preflight`, `software-factory`, and `human-experience`. The optional `naive-uat` adapter lives in the docs template's `.make-docs/agentics/skills/` tree. The other three first-party Skills have sources in `packages/skills/`, but their delivery still includes remote-source assumptions. This split makes packaging, offline use, upgrades, and ownership unclear.

The owner has settled the delivery choice: bundle all seven first-party Skills in the CLI. This resolves D-005's product choice; implementation evidence and drift closure remain outstanding. R3 established Store-only operational authority. R4 established current project asset and Persona paths. This revision reuses those boundaries.

The owner accepted this corrected package and backlog on 2026-09-09 and authorized implementation. The package followed design → plan → existing PRD maintenance → work backlog. All 14 implementation tasks remain pending at package commit. W20 and W21 remain paused. This package commit contains documentation only.

## Human Experience Intent

Impact: `direct`

Affected humans: People who select Skills, maintain an existing project, review local changes, or recover an interrupted install.

Human goal or effect: Install a selected Skill without a hidden download, and see exactly what adopting an existing copy will change before giving Make Docs ownership.

Experience promises:

- P1: Each of the seven Skills can be installed alone from an extracted CLI package without this repository or a network connection. Selecting none creates no Skill payload or exposure.
- P2: Adoption review names the Skill, scope, existing files, planned replacements, backups, and ownership changes. A generic yes cannot silently authorize an unreviewed adoption.
- P3: Edited or ambiguous content stays protected. Changed inputs invalidate the review, and interrupted work reports a safe recovery action instead of false success.
- P4: The three newly promoted Skills keep their explicit-request-only behavior. Installing one does not activate another or add a lifecycle gate.

Complexity kept out of the human path:

- Owners use the existing setup and setup-skills flows. They do not manage Store rows, hand-copy payloads into shared roots, rename the package workspace, or infer ownership from directory names.
- The normal review explains effects in plain text. Digests and exact file records remain available for automation and verification.

Evidence required:

- Offline extracted-package checks for each Skill, all seven, and none; both scopes and supported native exposure methods.
- Real CLI review and apply evidence for known-file differences, missing files, blockers, stale reviews, ownership-only adoption, and interrupted recovery.
- Independent code review and a fresh-context review of the actual selection, adoption, and recovery outputs. Record the goal, observation, conclusion, reviewer, and limits for each promise.

## Decision

### One first-party source and delivery model

Keep `packages/skills/` as the source workspace. Do not rename it to `agentics`. Promote these four sources there during implementation:

| Skill | Current authoring source | Canonical source |
| --- | --- | --- |
| `preflight` | `.agents/skills/preflight/` | `packages/skills/preflight/` |
| `software-factory` | `.agents/skills/software-factory/` | `packages/skills/software-factory/` |
| `human-experience` | `.agents/skills/human-experience/` | `packages/skills/human-experience/` |
| `naive-uat` | `packages/docs/template/.make-docs/agentics/skills/naive-uat/` | `packages/skills/naive-uat/` |

Together with `archive-docs`, `cleanup-docs`, and `decompose-codebase`, these form the seven first-party entries. Read each Skill's required references, examples, and harness metadata from its registry declaration. The CLI build reads registry-declared files directly from `packages/skills/<name>/` and embeds their bytes in generated CLI build output. Packaging consumes that compiled output. No separate replicated Skill source or payload tree may exist under `packages/cli` or `packages/docs`, including ignored, temporary, or generated mirrors; do not create `packages/cli/skills/`. The compiled artifact containing embedded bytes and genuine project/global CLI-installed copies remain allowed. Reject missing or unsafe source entries. Missing or corrupt embedded bundles fail clearly. First-party resolution in a packed CLI must use embedded bytes and must not fall back to a network fetch or the maintainer checkout. Existing third-party and alternate-manifest trust rules remain separate.

The owner clarified this source rule after the first package draft. It replaces the earlier copied bundled-directory proposal; it does not change installed shared payload paths. Implementation must add concise source-rule guidance to package authoring instructions and align package README/release text with this model. Validate the actual disk under `packages`, including ignored paths and empty directories, to reject duplicate Skill trees and obsolete empty mirror roots. Compare source, embedded build/archive/extracted, and installed byte/hash inventories.

Keep explicit selection: `all` selects the effective registry's entries; `none` and bare defaults select no Skills. Each entry must work without a sibling Skill installation. Give preflight its own Store reference. Remove maintainer-specific PRD links, local-manifest prerequisites, and repository-only proof claims from promoted portable instructions. Follow the existing CLI and Store guidance; ordinary review does not require optional capture.

Preserve the three Skills' explicit invocation policy and their limits on automatic cross-activation. Keep `naive-uat` as the stable Skill name with Unassisted Goal Testing as its display language. It remains a thin adapter to the shared workflow resources and typed CLI operations, not another UAT policy implementation.

### Keep installed paths and add reviewed adoption

Keep the canonical installed shared payload at `.make-docs/agentics/skills/<name>/` for project scope and the existing corresponding global location. Keep Codex and Claude native exposure, including the supported symlink and copy paths. Existing setup and setup-skills selection, scope, update, backup, and removal behavior remain the entry points.

Add `--adopt-existing <csv>` only to `setup skills`. Ordinary `setup` gains the bundled Skill choices but no adoption flags. Every name must identify a selected first-party Skill in the effective registry. The flag authorizes a review path, not an overwrite by name. `--review` without adoption and adoption combined with `--remove` are invalid.

A dry run is read-only. It reports exact existing and desired files, source and destination identities, the complete file inventory, selected tools, native exposure changes, preservation backups, ownership changes, blockers, and a review digest. It creates no Store intent, backup, directory, or local marker. Non-interactive apply requires `--review <digest>` for that exact plan; `--yes` alone is insufficient. Interactive review and confirmation bind to the same facts and checks.

Adoption may reconcile reviewed differences or missing files within the known declared file set. Preserve existing bytes before replacing them. Unknown extra files, unsafe links, conflicting copies, or another recorded owner block adoption. Name the blocker and the next safe action; do not discard content or infer that a matching folder name proves ownership.

Under the existing operation lock, recheck the reviewed target and scope, file and link identities, effective registry, selected tools and selection, package identity, and Store ownership. Any relevant change invalidates the review before mutation. Record adoption even when all desired file bytes already match: a change of ownership is a real operation, not a file no-op.

### Reuse Store state and managed lifecycle

Use the existing global Store installation and operation services for required intent, backups' references, pending state, ownership changes, checkpoints, verification, and recovery. Do not add a Skill-specific state engine or project-local receipt, lock, queue, or fallback. A required Store failure stops the managed change safely. Ordinary content work may continue without the CLI or optional capture, with a truthful unavailable result.

Clean managed upgrades resolve first-party payloads from the new package even when older ownership records name remote sources. Prove the first-party identity rather than treating any same-named third-party entry as first-party. Edited managed files retain conflict protection. Update, removal, repetition, and recovery use the same ownership rules after adoption.

Remove the obsolete UAT authoring tree from the docs template and prune its empty source parents only after its complete declared payload is available from `packages/skills/`. Do not remove valid installed shared payloads. The existing three local `.agents/skills/` copies are brought under management by the later reviewed public CLI adoption; promotion itself is not permission to delete them.

### One implementation phase

Use three ordered stages in one W19 R5 phase: promotion and packaging; installation and adoption; tests and maintainer proof. Implement only after the owner accepts the backlog. Build and verify the package before `just install-cli-pack`, then use the installed public CLI to review and adopt the real three local Skills. Keep removal tests isolated. No publication or broader wave resume is implied.

## Alternatives Considered

| Alternative | Disposition |
| --- | --- |
| Keep first-party payloads remote or add a network fallback | Rejected. The owner selected complete bundled delivery and offline package proof. |
| Bundle only the four promoted Skills | Rejected. It would preserve two first-party delivery rules. All seven are in scope. |
| Copy local Skills manually and add ownership later | Rejected. It separates mutation from required Store intent and review. |
| Allow adoption by `--yes` or matching names | Rejected. Neither binds approval to the existing bytes and ownership facts. |
| Rename the workspace or installed payload roots | Rejected. The current source and installed boundaries already serve the chosen outcome. |
| Split the work into several implementation phases | Rejected. One phase with ordered internal stages keeps the interrupt small without dropping proof. |

## Consequences

The CLI package grows by the declared first-party payloads, and releases must test those bytes rather than assume remote availability. Adoption needs a review bound to the exact candidate, including a Store transition for ownership-only changes. Unknown or conflicting material can require an owner decision before adoption; it must not be hidden by a broad overwrite option.

Portable Skill references need careful source cleanup. The new package must preserve the Skills' current intent without making optional guidance a new required workflow. D-005 can close only after registry, package, resolver, installed lifecycle, and evidence agree with this decision.

## Design Lineage

- Update Mode: `new-doc-related`
- Prior Design Docs: [Store-Owned Installation and Migration State](2026-09-09-store-owned-installation-and-migration-state.md), [Project Assets and Persona Discovery](2026-09-09-project-assets-and-persona-discovery.md), and [Shared Agentics Installation and Harness Redirection](2026-06-20-shared-agentics-installation-and-harness-redirection.md).
- Reason: This design settles the retained Skill delivery choice and adds a reviewed adoption path while preserving the accepted Store and installed-layout boundaries.

## Intended Follow-On

- Route: `change-plan`
- Next Prompt: [designs-to-plan-change.prompt.md](../../.make-docs/system/prompts/designs-to-plan-change.prompt.md). Read `make-docs://system/prompt/designs-to-plan-change.prompt.md` with `make-docs resource read`.
- Why: Maintain existing product owners, then derive a one-phase backlog for review. No new product PRD is needed.
- Coordinate Handoff: W19 R5 follows completed W19 R4. W20 and W21 remain paused. The owner must accept the R5 backlog before implementation.
