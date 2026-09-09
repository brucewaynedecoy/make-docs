# Phase 2 — Shared Audit Engine

## Objective

Define and implement the shared audit substrate consumed by both `make-docs backup` and `make-docs uninstall`. This phase should establish one conservative, manifest-aware audit result that later phases can render, copy, and remove against without re-deciding ownership or path safety.

## Depends On

- [2026-04-18-cli-help-backup-and-uninstall.md](../../designs/2026-04-18-cli-help-backup-and-uninstall.md)
- No upstream execution phase inside `w7-r0`; this phase defines the audit contract that later backup and uninstall phases will consume.

## Files to Create/Modify

| File | Change Summary |
| ---- | -------------- |
| `packages/cli/src/audit.ts` | **New.** Add the shared audit engine that discovers managed candidates, classifies file and directory outcomes, excludes `.backup/`, and returns a deterministic audit result for later backup/uninstall execution. |
| `packages/cli/src/types.ts` | Add audit-domain types for file candidates, prunable directories, preserved paths, audit reasons, and the top-level audit result contract. |
| `packages/cli/src/manifest.ts` | Add manifest-to-audit helpers so the engine can derive managed file sets, skill file sets, and prior selection context without duplicating manifest parsing rules. |
| `packages/cli/tests/audit.test.ts` | **New.** Add focused coverage for manifest-first auditing, manifest-missing fallback, root instruction exact-match handling, `.backup/` exclusion, and leaf-first prune classification. |

## Detailed Changes

### 1. Add a shared audit result contract

Extend `types.ts` with audit-specific types that make later `backup` and `uninstall` phases decision-light.

The shared result should distinguish at least:

- managed files that are eligible for backup and/or removal
- directories that become eligible for pruning only after managed-file removal
- preserved paths that look related to make-docs but must not be touched
- skipped paths that were considered and intentionally excluded

Each item should carry enough context for later phases to render clear summaries without re-inspecting the filesystem, including:

- the original path
- whether the path is project-local or home/global
- the reason it was classified that way
- a backup-relative destination path suitable for the future `backup` phase

The result should also capture whether the audit ran in `manifest-present` or `manifest-missing` mode so later CLI rendering can explain why certain paths were preserved conservatively.

### 2. Build a manifest-first audit engine

Create `audit.ts` with a single public entrypoint such as `createAuditReport({ targetDir, manifest })` that both future commands can call.

Manifest-present behavior:

- treat `manifest.files` as the primary managed file map
- treat `manifest.skillFiles` as additional managed file candidates even when they are not present in `manifest.files`
- derive prior harness/skill selections from the manifest for later root-instruction evaluation
- resolve both project-relative and absolute/home-directory managed paths through the existing path helpers

Manifest-missing fallback behavior:

- do not guess broadly across the repo
- only inspect make-docs-owned locations that the CLI is expected to create, including root instruction files, docs routers, managed `docs/.make-docs/` state, and known harness skill roots
- treat fallback findings as candidates that still need ownership checks before being marked removable
- prefer preservation over removal whenever ownership is ambiguous

This phase should stop at classification. It should not yet copy, delete, or mutate anything.

### 3. Classify files, preserved paths, and prunable directories conservatively

The audit should evaluate leaves first, then compute directory pruning from the resulting removable file set.

File classification rules:

- a manifest-tracked file is removable only when the current on-disk file still matches the CLI-owned version
- a missing managed file should be reported as skipped or already-absent, not as an error
- files already inside `.backup/` are never removal candidates
- unmanaged siblings inside a managed-looking directory do not block removable-file classification, but they must block later directory pruning

Directory classification rules:

- compute candidate parent directories only from removable files
- sort directory prune candidates deepest-first
- prune a directory only if, after subtracting audited removable descendants, no other file or directory remains inside it
- stop ascending as soon as a preserved or unmanaged path exists
- never classify the project `.backup/` root or any ancestor needed to contain it as prunable

The audit output should therefore be executable by a later uninstall phase without that phase needing to rescan the tree to decide whether a directory is safe to remove.

### 4. Add exact-content ownership checks for `AGENTS.md` and `CLAUDE.md`

Root instruction files need stricter rules than ordinary managed paths.

When a manifest is present:

- resolve the prior install profile from `manifest.selections`
- reuse the existing asset-rendering pipeline to regenerate the canonical root `AGENTS.md` and/or `CLAUDE.md` contents for that recorded selection set
- mark a root instruction file removable only when the on-disk content exactly matches the regenerated canonical content

When the manifest is missing:

- use a conservative generated-fingerprint strategy rather than filename-only ownership
- a root instruction file may be removable only when its contents exactly match a known make-docs-generated fingerprint
- if the content differs, preserve it and record the preservation reason explicitly

Do not apply this exact-content requirement to every managed file in the tree. This stricter rule is specific to the root instruction files because they are likely to be user-authored or user-edited.

### 5. Keep backup and uninstall mechanics out of this phase

This phase should define the output contract those later phases need, but it should not implement either command’s side effects.

Out of scope here:

- command parsing
- lifecycle prompt-skipping flag handling
- confirmation prompts and audit rendering UI
- backup directory creation and file copying
- uninstall file removal and actual directory pruning execution

In scope here:

- returning deterministic, sorted audit results that later phases can consume directly
- including future-facing fields such as backup-relative paths and prune ordering so execution phases do not need a second classification pass

### 6. Add focused audit tests

Create `audit.test.ts` coverage for the shared engine itself rather than only testing through future CLI commands.

Cover at least:

- manifest-present installs with both docs files and skill files
- manifest-missing fallback limited to expected make-docs paths
- `.backup/` contents being ignored for both file and directory classification
- modified root `AGENTS.md` / `CLAUDE.md` being preserved
- exact-match generated root instruction files being classified as removable
- directories with unmanaged descendants being preserved while removable leaf files still appear in the audit
- home/global skill paths being included in the audit result with `_home/...` backup-relative destinations

## Parallelism

- `types.ts` and `manifest.ts` audit-contract work can proceed first and in parallel.
- `audit.ts` depends on the final type shape and manifest helper inputs.
- `audit.test.ts` can be written once the public audit entrypoint and result contract are stable.
- Later backup, uninstall, and help-surface phases should treat this phase as a dependency and should not redefine ownership or prune rules independently.

## Acceptance Criteria

- [ ] `packages/cli/src/audit.ts` exists and exports the shared audit entrypoint for later `backup` and `uninstall` phases.
- [ ] The audit result distinguishes removable files, prunable directories, preserved paths, and skipped or already-absent candidates.
- [ ] Audit results are deterministic and sorted for stable rendering and test assertions.
- [ ] When a manifest exists, audit classification is driven primarily by `manifest.files`, `manifest.skillFiles`, and `manifest.selections`.
- [ ] When a manifest is missing, the audit inspects only known make-docs-managed locations and remains conservative in ambiguous cases.
- [ ] Paths under `.backup/` never appear as removable files or prunable directories.
- [ ] Root `AGENTS.md` and `CLAUDE.md` are removable only on exact canonical or fingerprinted content matches.
- [ ] Modified or user-authored root instruction files are preserved with explicit preservation reasons.
- [ ] Directory prune candidates are ordered deepest-first and exclude any directory that still contains unmanaged or preserved content.
- [ ] The audit result includes backup-relative destination paths for both project-local and home/global files.
- [ ] `npm test -w make-docs -- tests/audit.test.ts` passes.
- [ ] `npm test -w make-docs` passes.
