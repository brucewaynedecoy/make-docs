# Phase 1 — CLI Source Changes

## Objective

Update `packages/cli/src/rules.ts` and `packages/cli/src/catalog.ts` to include all 7 unmanaged template files in the asset pipeline. After this phase, every install profile produces a complete doc tree with no missing references, templates, prompts, or archive routers.

## Files to Modify

| File | Change Summary |
| ---- | -------------- |
| `packages/cli/src/rules.ts` | Extend `ALWAYS_REFERENCE_PATHS` (2 entries); add `agent-guide.md` to always-installed templates; add `plan-overview.md` to `PLAN_TEMPLATE_PATHS`; add `session-to-agent-guide.prompt.md` to `PROMPT_RULES`. |
| `packages/cli/src/catalog.ts` | Add `docs/.archive/${instructionKind}` to `addInstructionAssets`. |

## Detailed Changes

### 1. `rules.ts` — Extend `ALWAYS_REFERENCE_PATHS`

The constant currently contains one entry (`guide-contract.md`). Add two more:

```ts
const ALWAYS_REFERENCE_PATHS = [
  "docs/.references/guide-contract.md",
  "docs/.references/wave-model.md",
  "docs/.references/agent-guide-contract.md",
];
```

No changes needed to `getReferencePaths` — it already loops over `ALWAYS_REFERENCE_PATHS`.

### 2. `rules.ts` — Add `agent-guide.md` to always-installed templates

Two options:
- **Option A**: Rename `GUIDE_TEMPLATE_PATHS` to `ALWAYS_TEMPLATE_PATHS` and add `agent-guide.md` alongside the guide templates. This consolidates all always-installed templates in one constant.
- **Option B**: Create a separate `ALWAYS_TEMPLATE_PATHS` array with just `agent-guide.md` and add a second unconditional loop in `getTemplatePaths`.

**Recommend Option A** — rename `GUIDE_TEMPLATE_PATHS` to `ALWAYS_TEMPLATE_PATHS` and add the entry:

```ts
const ALWAYS_TEMPLATE_PATHS = [
  "docs/.templates/guide-developer.md",
  "docs/.templates/guide-user.md",
  "docs/.templates/agent-guide.md",
];
```

Update the loop in `getTemplatePaths` to reference `ALWAYS_TEMPLATE_PATHS` instead of `GUIDE_TEMPLATE_PATHS`.

### 3. `rules.ts` — Add `plan-overview.md` to `PLAN_TEMPLATE_PATHS`

Add one entry to the existing array:

```ts
const PLAN_TEMPLATE_PATHS = [
  "docs/.templates/plan-overview.md",
  "docs/.templates/plan-prd.md",
  "docs/.templates/plan-prd-decompose.md",
  "docs/.templates/plan-prd-change.md",
];
```

This is capability-gated (installed when plans is selected) — no change to gating logic needed.

### 4. `rules.ts` — Add `session-to-agent-guide.prompt.md` to `PROMPT_RULES`

Add a new entry at the end of the `PROMPT_RULES` array:

```ts
{
  relativePath: "docs/.prompts/session-to-agent-guide.prompt.md",
  requires: [],
},
```

The empty `requires` array means this prompt is installed whenever prompts are enabled, regardless of which capabilities are selected. `getPromptPaths` already handles the `requires` filter correctly.

### 5. `catalog.ts` — Add archive instruction assets

In `addInstructionAssets`, add one line after the `docs/guides/agent/` entry and before the capability-gated blocks:

```ts
relativePaths.add(`docs/.archive/${instructionKind}`);
```

This is not capability-gated — the archive directory serves all capabilities. It IS gated on the instruction kind being selected (via the existing early return).

## Parallelism

Changes to `rules.ts` and `catalog.ts` are independent files and can be edited in parallel. Within `rules.ts`, all four changes are to different constants/arrays and can be made in any order.

## Acceptance Criteria

- [ ] `ALWAYS_REFERENCE_PATHS` contains `guide-contract.md`, `wave-model.md`, and `agent-guide-contract.md`.
- [ ] `ALWAYS_TEMPLATE_PATHS` (renamed from `GUIDE_TEMPLATE_PATHS`) contains `guide-developer.md`, `guide-user.md`, and `agent-guide.md`.
- [ ] `PLAN_TEMPLATE_PATHS` contains `plan-overview.md` alongside the existing plan templates.
- [ ] `PROMPT_RULES` contains `session-to-agent-guide.prompt.md` with `requires: []`.
- [ ] `addInstructionAssets` adds `docs/.archive/AGENTS.md` and `docs/.archive/CLAUDE.md` for selected instruction kinds.
- [ ] `npm run build -w starter-docs` succeeds.
- [ ] `npm test -w starter-docs` passes with no regressions.
