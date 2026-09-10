---
title: W19 R5 Skills and Managed Adoption Phase Plan
kind: plan
status: completed
coordinate: W19 R5 P1
source:
  type: design
  path: ../../designs/2026-09-09-first-party-skills-and-managed-adoption.md
---

# Skills and Managed Adoption

## Outcome and Gate

Deliver the [design](../../designs/2026-09-09-first-party-skills-and-managed-adoption.md) in one implementation phase with three ordered stages. [The overview](00-overview.md) names the current PRD owners and package outputs. The owner accepted the corrected derived backlog on 2026-09-09 and authorized execution after the package commit; the corrected implementation is complete. The owner accepted it and requested closeout and commit on 2026-09-09. The phase is closed; the authorized implementation commit is next. W20 and W21 remain paused.

## Stage 1 — Promotion and Packaging

Inventory each promoted source and its declared support files before changing it. Move authoring authority for `preflight`, `software-factory`, `human-experience`, and `naive-uat` into `packages/skills/<name>/`. Keep the existing `archive-docs`, `cleanup-docs`, and `decompose-codebase` sources there. Preserve the explicit-request-only policies of the first three promoted Skills and UAT's stable name/display and shared CLI delegation.

Make each payload self-contained. Preflight gets its own Store reference rather than a sibling factory dependency. Remove maintainer-specific PRD links and local-manifest prerequisites from portable references. Preserve current Store-only capture behavior and truthful optional failure; no private tracker or policy engine is added.

The CLI build reads registry-declared files directly from `packages/skills/<name>/` and embeds their bytes in generated CLI build output. Packaging consumes that compiled output. No separate replicated Skill source or payload tree may exist under `packages/cli` or `packages/docs`, including ignored, temporary, or generated mirrors; do not create `packages/cli/skills/`. The compiled artifact containing embedded bytes and genuine project/global CLI-installed copies remain allowed. Make packed resolution use embedded bytes; missing or corrupt bundles fail without remote or checkout fallback. Keep alternate/third-party policy separate. Remove the obsolete UAT template author tree and only its now-empty source parents. Do not hand-delete the real local copies. Retire the wrong private install roots only through the reviewed CLI migration.

The stage exits with source and registry agreement, independent per-Skill references, declared package inventory, and a clean extracted-package candidate for the next stage.

## Stage 2 — Installation and Adoption

Wrong-private-layout cutover is forward-resume-only: review must state before apply that rollback would recreate the forbidden private layer and is not offered. Ordinary adoption already using standard locations keeps normal resume/rollback. Older saved operations that would write a retired private root refuse safely; never execute them to restore that layer. This correction adds no new URL-backed installation mode.

Install Skill files in standard agent locations, selected by scope and harness:

| Scope and selected harnesses | Real Skill directory | Other selected access |
| --- | --- | --- |
| Project, Claude only | `.claude/skills/<name>/` | None; do not create `.agents/skills/`. |
| Project, Codex only | `.agents/skills/<name>/` | None; do not create `.claude/skills/`. |
| Project, both | `.agents/skills/<name>/` | `.claude/skills/<name>` links to it, or is a supported managed native copy. |
| Global, any selection | `~/.agents/skills/<name>/` | Selected Codex uses `~/.codex/skills/<name>` (or `CODEX_HOME/skills`); selected Claude uses its configured native Skill root, normally `~/.claude/skills/<name>`. Native access links to the canonical directory or uses a supported copy. Direct access applies only if the configured native path equals the canonical path. |

A harness that uses the real directory reads it directly. Never create a self-link or duplicate ownership entry for that same path. `none` creates no Skill directories. Preserve pre-existing unrelated content; absence checks on fresh fixtures must prove no unselected project Skill root was created.

There is no active `.make-docs/agentics/` installation layer, in the project or home. Skill source stays solely in `packages/skills/<name>/`; compiled CLI output embeds declared bytes. Installation identity, ownership, intent and recovery belong only in the global Make Docs Store. A symbolic link to a Make Docs resource URL is unsupported and is not a feature or deferred task in this correction.

Upgrade the wrong private layout through a reviewed CLI operation. The review names every old source, new standard destination, link/copy change, backup and ownership effect. Recheck exact bytes, links, scope, selected tools and Store ownership before mutation. Verify the complete destination tree and access paths before removing clean owned old files. Preserve changed, unknown or conflicting content and stop for an explicit disposition; never infer ownership from a path. Remove the retired `.make-docs/agentics/skills` tree and its ancestors only when proven empty and managed. Success must leave no active private Skill layer or unexplained legacy content. Historical backup byte copies may remain under declared backup/archive roots; they are not active installation paths. Ordinary standard-path update, removal, scope/tool changes, resume/rollback and repeated normal setup/Skills sync must use the same standard-path rules.

Extend only `setup skills` with `--adopt-existing <csv>` and reviewed apply. Ordinary `setup` gains bundled Skill choices without adoption flags. Each requested name must be a selected first-party entry. Reject unknown/unselected names, `--review` without adoption, and adoption with `--remove`.

Build one review model for interactive and non-interactive use. Dry-run must not write files or Store records. Show scope, selected tools and Skills, full existing/desired inventories, file and link identities, source and package identities, backups, ownership effects, and blockers. Return a digest for those exact facts. Non-interactive apply requires the digest through `--review`; `--yes` alone does not authorize adoption.

Allow explicit review of differences and missing files inside the known file set, because portability fixes can change the existing three copies. Preserve replaced bytes in recoverable backups. Block unknown extras, unsafe links, conflicting copies, or another owner. Recheck all relevant inputs and Store ownership under the existing lock before required intent and mutation. A reviewed ownership change must be recorded even when no file bytes need changing.

Use the existing Store operation and installation services for intent, checkpoints, backup references, pending state, completion, and recovery. Apply the scope/harness standard-location matrix in the design; never create a private Make Docs Skill layer or an unselected project Skill root. Clean managed upgrades must use bundled first-party bytes even when old records contain remote-source provenance. Edited managed files remain conflicts. Repeat and remove operations must use the resulting ownership, not filename assumptions.

The stage exits with coherent CLI review, apply, and recovery paths; an interrupted or stale candidate cannot claim completion.

## Stage 3 — Tests and Maintainer Proof

During implementation, add concise source-rule guidance to package authoring instructions and align package README/release wording. Complete that content before final candidate checks. Run the finite matrix below against the actual candidate. Fix findings before final evidence. Use an independent reviewer for material code and a fresh-context reviewer for the public Skill/adoption path. Keep reviewers' scope and limits explicit.

After offline package and isolated lifecycle proof, use `just install-cli-pack` to refresh the installed CLI. Then use its public CLI to preview and review adoption of the real `preflight`, `software-factory`, and `human-experience` copies. Bind that review to the candidate package and current local bytes. Apply only under the accepted implementation scope. Verify native exposure, Store ownership, preserved backups, and no pending operation. Do not test removal on the real project or global user installation; use isolated targets.

## Verification and Human Review

The work author must assign stable `A<number>` acceptance IDs across the backlog. Map these proof groups to those IDs without adding phases.

| Proof group | Required cases | Promise and owner |
| --- | --- | --- |
| Package independence | Seven individual installs, all, and none from an extracted package with network denied and repository unavailable; exact source/embedded build/archive/extracted/installed byte and hash inventories; actual disk under `packages` checked for duplicate Skill trees even when ignored and for obsolete empty mirror directories; no hidden sibling dependency or first-party fetch; missing/corrupt bundle refusal. | P1; PRDs 08, 16, 10. |
| Skill intent | Explicit invocation only for the three new guidance Skills; no cross-activation; self-contained preflight Store reference; UAT stable name and CLI-only delegation. | P4; PRDs 08, 25, 46. |
| Exposure and scope | Project Claude-only direct `.claude/skills`, Codex-only direct `.agents/skills`, both canonical `.agents/skills` plus Claude link/copy; global canonical `~/.agents/skills` plus selected access. No unselected project Skill root or private `.make-docs/agentics` tree; none remains empty. | P1/P2; PRD 28. |
| Review and refusal | Known-file diffs and missing files with backup plan; invalid flags; unknown extras, unsafe links, conflicting copies, another owner; dry-run has no writes; `--yes` alone fails. | P2/P3; PRDs 28, 39. |
| Review freshness | Change scope, tools, source/input bytes, complete inventory, selections, package, or ownership after review; each invalidates stale approval before writes. | P2/P3; PRDs 28, 38, 39. |
| Lifecycle and recovery | Ownership-only adoption, repeat, managed update, edited-file conflict, removal, old remote-source and private-layout upgrade without fetch; exact old-tree absence, preserved conflicts, scope/tool transitions, interruption at mutation boundaries, unavailable Store, resume/verify through existing recovery. | P3; PRDs 08, 28, 38. |
| Real maintainer path | Recipe-built installed CLI, reviewed adoption of the actual three copies, independent code review, fresh-context public review, final identity/byte/Store checks. | P1–P4; PRDs 09, 10. |

Automated tests establish file, ownership, refusal, and recovery behavior. Human Experience Review uses the actual outputs to assess P1–P4 separately as satisfied, material gap, or insufficient evidence. Record what the reviewer observed; do not call an agent review lived human acceptance.

Formal Unassisted Goal Testing is `not-needed-now` during drafting: no implementation candidate exists and this change preserves UAT policy. The planned fresh-context review examines the actual delivery/adoption surface. At implementation, activate a separate UAT case only if the normal testing authority identifies a material remaining uncertainty. Visual and accessibility testing are `not-needed-now` for this command/text change unless the implemented surface introduces a specific need. These decisions do not waive command-output review or acceptance proof.

## Evidence and Closeout

When retaining acceptance evidence, create the backlog's central `evidence.md`. Record the claim, tested package/revision, environment, check, observation, conclusion, reviewer, limits, and links for each acceptance case. Use `evidence/a<number>/` only for needed captures. Link the report from the index and relevant phase records; any report created during package drafting must clearly separate planned checks from actual package validation and leave implementation results pending.

Close D-005 only when the registry, resolver, packaged inventory, installed lifecycle, and retained evidence prove the settled bundled delivery contract. Finish normal coverage and owner review within authorized scope. Do not infer permission to commit, publish, resume W20/W21, or expand the Skill product from technical checks.
