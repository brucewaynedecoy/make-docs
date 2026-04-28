# Asset Pipeline Completeness — Unmanaged Template Files

> Filename: `2026-04-16-asset-pipeline-completeness.md`. See `docs/.references/wave-model.md` for W/R semantics.

## Purpose

Close a gap in the CLI's managed asset pipeline where 11 files that exist in the shipped template (`packages/docs/template/`) are not tracked by the asset resolution system in `packages/cli/src/rules.ts` and `packages/cli/src/catalog.ts`. These files are installed correctly when a consumer runs the full-default profile (all capabilities, all templates, all references, both instruction kinds), because `isFullDefaultProfile()` short-circuits to reading static template files. However, reduced profiles — where any capability is deselected or `templatesMode`/`referencesMode` is set to `required` — may silently omit these files.

Four of the 11 files (`docs/guides/` and `docs/guides/agent/` routers) are already addressed by the [guide structure contract plan](../plans/2026-04-16-w2-r0-guide-structure-contract/00-overview.md). This design covers the remaining seven.

## Context

The CLI's asset pipeline works as follows:

1. `getDesiredAssets(profile)` in `catalog.ts` builds the complete list of files to install by collecting paths from three sources:
   - **References** — `getReferencePaths(profile)` in `rules.ts`, which returns capability-gated paths from `REQUIRED_REFERENCE_PATHS` plus `harness-capability-matrix.md` when `referencesMode === "all"`.
   - **Templates** — `getTemplatePaths(profile)` in `rules.ts`, which returns capability-gated paths from `PLAN_TEMPLATE_PATHS`, `PRD_TEMPLATE_PATHS`, `WORK_TEMPLATE_PATHS`, and `design.md`.
   - **Prompts** — `getPromptPaths(profile)` in `rules.ts`, which returns capability-gated paths from `PROMPT_RULES`.
   - **Instruction files** — `addInstructionAssets(profile, instructionKind, relativePaths)` in `catalog.ts`, which adds `AGENTS.md`/`CLAUDE.md` to directories whose content is selected.

2. Each collected path is turned into a `ResolvedAsset` via `buildAsset`, which reads the file content from the template (either dynamically rendered for buildable paths, or statically copied for scoped-static paths).

3. Files NOT in the collected path set are NOT installed — there is no fallback filesystem walk of the template directory.

This means any template file that isn't explicitly listed in the rules or added by `addInstructionAssets` will be silently omitted for non-full-default profiles.

### Audit results

A full comparison of the 60 files in `packages/docs/template/` against the asset pipeline's explicit path lists identified 11 unmanaged files. The guide-structure-contract plan addresses 4, leaving 7:

| Unmanaged file | Type | Why it should always be installed |
| --- | --- | --- |
| `docs/.references/wave-model.md` | Reference | Foundational authority for W/R/P encoding. Referenced by `design-contract.md`, `agent-guide-contract.md`, and every router that mentions W/R naming. Without it, those files contain broken references. |
| `docs/.references/agent-guide-contract.md` | Reference | Authority for agent session guides. Agent guides are not capability-gated — any consumer can write them. |
| `docs/.templates/agent-guide.md` | Template | Structural template for agent session guides. Paired with `agent-guide-contract.md`. |
| `docs/.templates/plan-overview.md` | Template | Entry-point template for `00-overview.md` inside plan directories. The planning workflow references it, and plans are always directories, yet this template is missing from `PLAN_TEMPLATE_PATHS`. |
| `docs/.prompts/session-to-agent-guide.prompt.md` | Prompt | Kickoff prompt for writing agent session summaries. Not in `PROMPT_RULES` and not gated behind any capability. |
| `docs/.archive/AGENTS.md` | Instruction router | Router for the consolidated archive directory. Archive rules apply to all capabilities; the archive directory is always present in the template. |
| `docs/.archive/CLAUDE.md` | Instruction router | Mirror of the above. |

### Impact of the gap

- **Full-default profile**: No impact. `isFullDefaultProfile()` returns true, and buildable assets short-circuit to `readPackageFile()`. Scoped-static assets are also read from the template. All 60 files are installed.
- **Any reduced profile**: The 7 files above are silently omitted. This means:
  - A consumer who installs with `--no-work` (a reasonable choice) would get `design-contract.md` referencing `wave-model.md`, but `wave-model.md` itself would not be installed — a broken reference.
  - The `docs/.archive/` directory and its routers would not be created, so the archive rules that other routers defer to would be missing.
  - Agent guide infrastructure (`agent-guide-contract.md`, `agent-guide.md`, `session-to-agent-guide.prompt.md`) would be absent even though agent guides are not gated behind any capability.
  - `plan-overview.md` would be missing even when plans are installed, despite being the canonical template for `00-overview.md`.

## Decision

### 1. Introduce "always-installed" categories in `rules.ts`

Add two new constants:

```
ALWAYS_REFERENCE_PATHS = [
  "docs/.references/wave-model.md",
  "docs/.references/agent-guide-contract.md",
]

ALWAYS_TEMPLATE_PATHS = [
  "docs/.templates/agent-guide.md",
]
```

In `getReferencePaths()`, unconditionally add all `ALWAYS_REFERENCE_PATHS` to the paths set before the capability-gated loop. In `getTemplatePaths()`, unconditionally add all `ALWAYS_TEMPLATE_PATHS`.

### 2. Add `plan-overview.md` to `PLAN_TEMPLATE_PATHS`

This is a capability-gated fix, not an always-installed one. `plan-overview.md` belongs alongside `plan-prd.md`, `plan-prd-decompose.md`, and `plan-prd-change.md` in the `PLAN_TEMPLATE_PATHS` array. It was likely omitted by oversight when the v2 contract changes added it to the template.

### 3. Add `session-to-agent-guide.prompt.md` to `PROMPT_RULES`

Add a new entry to `PROMPT_RULES` with `requires: []` (empty — no capability prerequisite). `getPromptPaths()` already filters by `profile.selections.prompts`, so this prompt will be installed whenever the user has prompts enabled, regardless of which capabilities are selected.

### 4. Add archive directory instruction assets to `addInstructionAssets()`

In `catalog.ts`, add `docs/.archive/${instructionKind}` to the instruction assets. This should be added unconditionally (after the early return for disabled instruction kinds, but not gated behind any capability), since the archive directory serves all capabilities.

### 5. Verify `isFullDefaultProfile()` fast path is preserved

The `isFullDefaultProfile()` check in `renderBuildableAsset()` ensures that full-default installs read the static template files without running renderers. This optimization must continue to work correctly. The changes above add new scoped-static (non-buildable) files to the asset list, which don't interact with the renderer dispatch — they always read from the template via `readPackageFile()`. The archive routers (`docs/.archive/AGENTS.md`, `docs/.archive/CLAUDE.md`) are also scoped-static, not buildable. No renderer changes are needed for any of the 7 files in this design.

## Alternatives Considered

**Filesystem walk of the template directory.** Instead of explicitly listing every file, `getDesiredAssets()` could walk `packages/docs/template/` and include all files, using rules only to exclude files for reduced profiles. This would eliminate the possibility of omission. Rejected because: it inverts the current allow-list model to a deny-list model, making it harder to reason about what gets installed and risking accidental inclusion of development-only files. The explicit model is safer; the gap was a completeness issue, not an architectural flaw.

**Add all 7 files to every capability's path list.** Simpler than creating an "always" category — just add `wave-model.md` etc. to every entry in `REQUIRED_REFERENCE_PATHS`. Rejected because: it obscures the intent (these aren't capability-specific requirements) and creates maintenance burden (every new capability must remember to include them). The "always" category is self-documenting.

**Ship the archive routers as buildable (dynamically rendered) assets.** The archive routers could be dynamically rendered based on which capabilities are installed. Rejected because: the archive content doesn't vary by profile — it's always the same "never archive unless asked" message. Scoped-static is the correct asset class.

## Consequences

**What improves:**
- Every install profile — full or reduced — produces a complete, internally consistent documentation tree with no broken references.
- The "always-installed" pattern established here (`ALWAYS_REFERENCE_PATHS`, `ALWAYS_TEMPLATE_PATHS`) provides a clean place to add future capability-independent files (e.g., `guide-contract.md` from the guide structure contract plan).
- `plan-overview.md` ships with plans, closing a likely user-facing gap where the plan entry-point template was missing.

**What shifts:**
- `rules.ts` gains two new constants and two new code paths (unconditional adds in `getReferencePaths` and `getTemplatePaths`).
- `catalog.ts` gains two lines in `addInstructionAssets` for the archive routers.
- `PROMPT_RULES` gains one entry for `session-to-agent-guide.prompt.md`.
- `PLAN_TEMPLATE_PATHS` gains one entry for `plan-overview.md`.
- Tests must be updated: `consistency.test.ts` and `install.test.ts` should verify the new files are present in reduced-profile installs.

**Risks:**
- If future template files are added without updating the corresponding rules, the same gap will recur. Mitigation: add a test that compares the template directory contents against `getDesiredAssets(fullDefaultProfile)` to catch any future omissions — a template-completeness test.

## Intended Follow-On

- Route: `baseline-plan`
- Next Prompt: [designs-to-plan.prompt.md](../.prompts/designs-to-plan.prompt.md)
- Why: The changes are small and well-scoped (4 files in `packages/cli/src/`, plus test updates), but should be planned and validated against the full test suite before execution. This work can be sequenced alongside or after the guide-structure-contract plan, since both introduce the "always-installed" pattern — implementing them together avoids duplicate work in `rules.ts`.

## Design Lineage

- Update Mode: `new-doc-related`
- Prior Design Docs: [2026-04-16-w2-r0-guide-structure-contract.md](2026-04-16-guide-structure-contract.md)
- Reason: The asset pipeline gap was discovered during planning for the guide structure contract. That plan addresses 4 of 11 unmanaged files (the guide routers); this design covers the remaining 7 and establishes the "always-installed" pattern that both designs share.
