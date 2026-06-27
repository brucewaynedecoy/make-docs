# Shared Agentics Native Harness Exposure Correction

## Purpose

Correct the W17 R2 shared-agentics exposure decision so selected skills remain Make Docs-managed once while appearing as normal, harness-native skill directories to Claude Code, Codex, and future harnesses.

This design supersedes the W17 R2 generated-stub default. The corrected product contract is native harness exposure: prefer symlinked skill directories, fall back to managed copy mirrors when symlinks are unavailable or explicitly disabled, and treat generated stubs as legacy migration inputs or explicit diagnostic fallback only.

## Context

W17 R2 implemented the accepted [Shared Agentics Installation and Harness Redirection](2026-06-20-shared-agentics-installation-and-harness-redirection.md) design. That design chose generated harness stubs over symlink-first exposure because it prioritized one portable default across Windows, macOS, and Linux and kept audit, backup, uninstall, and package validation easier to reason about.

Manual W17 R2 UAT exposed two product problems with that choice.

First, generated stubs create a novel skill-installation model. A maintainer inspecting `.claude/skills/<skill-name>/` or `.agents/skills/<skill-name>/` sees a forwarding `SKILL.md` instead of the real skill directory. That makes Make Docs-installed skills behave differently from native skill installs and from tools such as `skills.sh`, which install a real canonical payload and expose it through native harness directories.

Second, generic stubs weaken skill discovery. Harnesses surface skill frontmatter, especially `name` and `description`, to the model as selection context. A stub description such as "Generated Claude Code entrypoint for the shared Decompose codebase make-docs skill payload" describes Make Docs plumbing rather than the skill's purpose. It repeats the harness and skill name, dilutes the useful description, and can make the model less likely to choose the skill without additional inspection.

The original safety constraints still matter. Windows symlink behavior depends on filesystem, Developer Mode, elevated permissions, and policy. Some environments block symlinks through OS or Git configuration. Audit, backup, uninstall, migration, package smoke tests, and selected-skill sync must not follow links destructively or silently delete user-authored harness skills. The correction therefore cannot become "symlink blindly everywhere."

## Decision

Use native harness exposure as the W17 R3 selected-agentics contract.

Selected skill payloads remain Make Docs-managed canonical content:

- project scope: `.make-docs/agentics/skills/<skill-name>/`
- global scope: the user's home-scoped `.make-docs/agentics/skills/<skill-name>/`

Selected harness roots expose the same skill as a normal harness-native skill directory:

- project Claude Code: `.claude/skills/<skill-name>/`
- project Codex/agents: `.agents/skills/<skill-name>/`
- global/home-scoped equivalents under the home harness roots when `skillScope` is global

The default exposure order is:

1. `symlink`: create a directory symlink from the harness-native skill directory to the canonical shared payload directory.
2. `copy-mirror`: when symlink creation is unavailable, blocked, or explicitly disabled, copy the full canonical skill payload into the harness-native skill directory and track it as a managed mirror of the canonical payload.
3. `generated-stub`: do not use as the default harness-facing skill. Retain only for legacy W17 R2 migration classification, explicit diagnostic fallback, or future review output if a user intentionally requests a stub fallback.

The product rule is "no duplicate authoritative payloads," not "no duplicate bytes." A `copy-mirror` may duplicate files physically for compatibility, but the manifest must record that the canonical payload remains authoritative and the harness copy is a managed mirror. Sync/update may replace a clean copy mirror from canonical content. A modified copy mirror must be preserved for review rather than overwritten silently.

Harness-facing skill metadata must be the real skill metadata. Whether exposure is a symlink or copy mirror, the harness-visible `SKILL.md` must be the canonical skill entrypoint content, including its meaningful frontmatter description and sibling references, scripts, assets, and agent metadata. Make Docs installation mechanics belong in manifest/audit output, not in the harness-visible skill description.

The manifest must distinguish these selected-agentics roles:

- canonical shared payload files
- symlink exposure directories, including link path, link target, harness, scope, and link type
- copy-mirror payload files, including canonical source path, harness, scope, and mirror status
- legacy generated stubs from W17 R2
- legacy duplicated per-harness payloads from pre-W17 R2 installs
- modified or custom harness skills that require review

Audit, backup, uninstall, dry-run, migration, and skills sync must classify symlink exposure and copy mirrors separately. Destructive operations must unlink symlink exposures without following them, remove only reviewed clean copy mirrors, preserve modified mirrors, and never infer ownership over a user-authored harness skill from path shape alone.

Migration must handle existing W17 R2 installs:

- clean manifest-owned generated stubs are removed and replaced by symlink exposure when possible or copy mirrors when needed
- modified generated stubs are preserved and routed to review
- clean manifest-owned duplicated payloads may migrate to canonical shared payload plus native harness exposure
- custom harness skill directories, wrong-target symlinks, malformed manifests, or missing-manifest ambiguous state route to review or manual resolution before mutation

Windows support follows the same product shape as other platforms but allows fallback. The CLI should attempt the configured preferred link strategy, report why link creation failed when it fails, and use `copy-mirror` only as an intentional compatibility fallback. Non-interactive runs must not silently downgrade to generated stubs.

Plugin exposure inherits the corrected primitive. PRD 30 may still define plugin-specific adapters and bundle metadata, but the default shared-agentics exposure contract becomes native harness exposure with symlink preferred and copy-mirror fallback, not generated-stub default.

## Alternatives Considered

### Keep W17 R2 Generated Stubs as the Default

Rejected. This keeps cross-platform behavior simple, but it creates a Make Docs-specific skill-installation paradigm and weakens harness skill discovery by replacing meaningful skill descriptions with generic forwarding descriptions.

### Use Symlinks Only

Rejected. Symlink-only behavior would match the desired native harness model on systems where links work, but it would fail or require elevated setup in common Windows and restricted environments. The product needs a deterministic fallback that still exposes a real skill directory.

### Use Copy Mirrors Everywhere

Rejected as the default. Copy mirrors preserve native harness behavior, but they duplicate bytes and require careful update/removal logic. They are the right fallback when links are unavailable, not the preferred path where symlinks work.

### Keep Stubs as an Automatic Fallback

Rejected for default behavior. Automatic stub fallback reintroduces the same discovery and maintainer-friction problems that caused this correction. Stubs may remain only as a legacy migration input, explicit diagnostic fallback, or intentionally requested compatibility mode.

## Consequences

W17 R3 must revise W17 R2 docs, PRDs, plans, backlogs, implementation tests, and package smoke expectations. Existing W17 R2 work remains historical evidence of the shared payload and lifecycle-classification first pass, but future implementation must not consume its generated-stub default as the target state.

The implementation is broader than changing one file writer. It must update selected-skill asset planning, install/apply behavior, manifest ownership, role classification, audit, backup, uninstall, migration, dry-run output, skills UI summaries, package validation, and tests.

The manifest schema should grow structured selected-agentics exposure records. If implementation temporarily extends `skillFiles`, it must still preserve exposure mode and role distinctions in user-visible output and lifecycle decisions.

Package validation must prove both symlink and copy-mirror behavior. On platforms or CI environments where symlinks are unavailable, tests must exercise the copy-mirror fallback without weakening the default target contract. Windows behavior must be explicit rather than hidden behind stub generation.

Downstream plugin substrate work must inherit this correction. Generated plugin exposure language in W18 R2 remains historical until reconciled; future plugin exposure should be planned against native harness exposure unless a later accepted plugin-specific design supersedes this correction.

## Design Lineage

Update Mode: `new-doc-related`

Prior Design Docs: [Shared Agentics Installation and Harness Redirection](2026-06-20-shared-agentics-installation-and-harness-redirection.md), [Harness Plugin Substrate and Workflow Bundles](2026-06-20-harness-plugin-substrate-and-workflow-bundles.md), [Skill Purpose Registry and Alternate Skills Manifest](2026-06-20-skill-purpose-registry-and-alternate-skills-manifest.md)

Reason: This design materially supersedes the W17 R2 generated-stub default after manual UAT showed that stubs undermine native harness skill semantics and useful skill-description discovery. It preserves W17 R2's shared canonical payload and lifecycle-safety goals while replacing the exposure primitive with symlink-preferred native harness directories and managed copy mirrors.

## Intended Follow-On

Route: `change-plan`

Next Prompt: [designs-to-plan-change.prompt.md](../../.make-docs/references/system/prompts/designs-to-plan-change.prompt.md)

Why: This correction revises an active v2 implementation decision and must reconcile PRDs, plans, work backlogs, package validation, and migration requirements rather than creating a new baseline.

Coordinate Handoff: Prior completed coordinate is W17 R2 for shared selected-agentics payloads, generated stubs, and lifecycle classification. Use W17 R3 for the corrective change plan and matching work backlog because the correction preserves W17 shared-agentics scope while superseding its harness exposure mode.
