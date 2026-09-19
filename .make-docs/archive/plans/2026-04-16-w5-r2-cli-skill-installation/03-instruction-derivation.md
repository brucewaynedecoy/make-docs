# Phase 3 — Instruction Derivation from Harness Selection

## Objective

Replace all direct reads of `instructionKinds` in the asset pipeline and CLI flags with a derivation layer that maps harness selection to instruction kinds. After this phase, `addInstructionAssets` and the renderers no longer reference `instructionKinds` directly; they call a shared helper that derives the active set from `harnesses`. CLI flags `--no-agents` and `--no-claude` become backward-compat aliases for the new `--no-codex` and `--no-claude-code` flags.

## Depends On

- Phase 1 (needs `Harness` type, `HARNESSES` const, and `harnesses: Record<Harness, boolean>` on `InstallSelections`)

## Files to Modify

| File | Change Summary |
| ---- | -------------- |
| `packages/cli/src/types.ts` | Add `getActiveInstructionKinds` helper function. |
| `packages/cli/src/catalog.ts` | Replace `instructionKinds` loop with `getActiveInstructionKinds` derivation. |
| `packages/cli/src/renderers.ts` | Update `isBuildablePath` and `renderBuildableAsset` to use derived instruction kinds. |
| `packages/cli/src/wizard.ts` | Remove `instructionKinds` references from `WizardSelections`, `normalizeWizardSelections`, confirmation summary. |
| `packages/cli/src/cli.ts` | Replace `--no-agents`/`--no-claude` with `--no-codex`/`--no-claude-code`; add backward-compat aliases; update `resolveSelections` and `hasSelectionOverrides`. |
| `packages/cli/src/profile.ts` | Update `resolveInstallProfile` and `isFullProfile` to use `harnesses` instead of `instructionKinds`. |

## Detailed Changes

### 1. `types.ts` — Add `getActiveInstructionKinds`

Add a helper that derives the instruction-kind set from harness selection. This is the single source of truth for the mapping and is consumed by every call site that previously read `instructionKinds` directly.

```ts
const HARNESS_TO_INSTRUCTION: Record<Harness, InstructionKind> = {
  "claude-code": "CLAUDE.md",
  codex: "AGENTS.md",
};

export function getActiveInstructionKinds(
  selections: Pick<InstallSelections, "harnesses">,
): Set<InstructionKind> {
  const active = new Set<InstructionKind>();
  for (const harness of HARNESSES) {
    if (selections.harnesses[harness]) {
      active.add(HARNESS_TO_INSTRUCTION[harness]);
    }
  }
  return active;
}
```

Export `HARNESS_TO_INSTRUCTION` as well — tests and the wizard summary will use it.

### 2. `catalog.ts` — Replace instructionKinds loop

Replace the current loop:

```ts
// Before
for (const instructionKind of INSTRUCTION_KINDS) {
  addInstructionAssets(profile, instructionKind, relativePaths);
}
```

With derivation:

```ts
// After
const activeKinds = getActiveInstructionKinds(profile.selections);
for (const instructionKind of activeKinds) {
  addInstructionAssets(profile, instructionKind, relativePaths);
}
```

The `addInstructionAssets` function signature drops the `instructionKinds` guard at line 28 (`if (!profile.selections.instructionKinds[instructionKind])`) because the caller has already filtered. The function body stays the same — it still adds the per-directory instruction-kind paths.

### 3. `renderers.ts` — Update buildable path checks

`isBuildablePath` currently checks hardcoded sets (`ROOT_INSTRUCTIONS`, `DOCS_ROUTER_INSTRUCTIONS`). These sets reference `"CLAUDE.md"` and `"AGENTS.md"` as string literals. No structural change needed here — the sets are path-matching constants, not selection-dependent. However, `renderBuildableAsset` must use `getActiveInstructionKinds` instead of `profile.selections.instructionKinds` when deciding whether to render a given instruction file path. Update any guard that reads `instructionKinds[kind]` to instead check membership in `getActiveInstructionKinds(profile.selections)`.

### 4. `wizard.ts` — Remove instructionKinds from wizard types

Phase 6 handles the full wizard rewrite (harness step replaces instruction-kind multiselect). This phase does the minimal type surgery so the wizard compiles after the `InstallSelections` change:

- `WizardSelections` interface: replace `instructionKinds: InstructionKind[]` with `harnesses: Harness[]`.
- `normalizeWizardSelections`: map `harnesses` array → `Record<Harness, boolean>` on the output `InstallSelections`.
- `applyWizardSelections`: set `next.harnesses[harness]` instead of `next.instructionKinds[instructionKind]`.
- Confirmation summary: derive `instructionKinds` via `getActiveInstructionKinds` for display, or switch to showing harness names directly (e.g. "claude-code, codex" instead of "CLAUDE.md, AGENTS.md").
- Instruction-kind multiselect prompt (lines 588-607): temporarily adapt to select harnesses instead of instruction kinds. Phase 6 will redesign this step fully.

### 5. `cli.ts` — New flags with backward-compat aliases

#### `ParsedArgs`

Replace:

```ts
noAgents: boolean;
noClaude: boolean;
```

With:

```ts
noCodex: boolean;
noClaudeCode: boolean;
```

#### `parseArgs`

Add new flags and aliases:

```ts
case "--no-codex":
  parsed.noCodex = true;
  break;
case "--no-claude-code":
  parsed.noClaudeCode = true;
  break;
// Backward-compat aliases
case "--no-agents":
  parsed.noCodex = true;
  break;
case "--no-claude":
  parsed.noClaudeCode = true;
  break;
```

#### `resolveSelections`

Replace:

```ts
if (parsed.noAgents) {
  selections.instructionKinds["AGENTS.md"] = false;
}
if (parsed.noClaude) {
  selections.instructionKinds["CLAUDE.md"] = false;
}
```

With:

```ts
if (parsed.noCodex) {
  selections.harnesses["codex"] = false;
}
if (parsed.noClaudeCode) {
  selections.harnesses["claude-code"] = false;
}
```

#### `hasSelectionOverrides`

Replace `parsed.noAgents || parsed.noClaude` with `parsed.noCodex || parsed.noClaudeCode`.

### 6. `profile.ts` — Update profile helpers

#### `resolveInstallProfile`

Replace `instructionKinds: selections.instructionKinds` with `harnesses: selections.harnesses` in the profile snapshot.

#### `isFullProfile`

Replace:

```ts
profile.selections.instructionKinds["AGENTS.md"] &&
profile.selections.instructionKinds["CLAUDE.md"]
```

With:

```ts
profile.selections.harnesses["codex"] &&
profile.selections.harnesses["claude-code"]
```

## Parallelism

- `types.ts` must be done first (introduces `getActiveInstructionKinds`).
- After `types.ts`, all other files can be modified in parallel — they only import the new helper.
- `cli.ts` flag changes have no dependencies on other file changes beyond the type import.

## Acceptance Criteria

- [ ] `getActiveInstructionKinds` returns `{"CLAUDE.md"}` when only `claude-code` is selected.
- [ ] `getActiveInstructionKinds` returns `{"AGENTS.md"}` when only `codex` is selected.
- [ ] `getActiveInstructionKinds` returns both when both harnesses are selected.
- [ ] `addInstructionAssets` no longer reads `instructionKinds` directly from `profile.selections`.
- [ ] `renderBuildableAsset` uses `getActiveInstructionKinds` for instruction-file gating.
- [ ] `--no-codex` disables `codex` harness (and therefore `AGENTS.md`).
- [ ] `--no-claude-code` disables `claude-code` harness (and therefore `CLAUDE.md`).
- [ ] `--no-agents` still works as a backward-compat alias for `--no-codex`.
- [ ] `--no-claude` still works as a backward-compat alias for `--no-claude-code`.
- [ ] `isFullProfile` checks `harnesses` instead of `instructionKinds`.
- [ ] `npm run build -w make-docs` succeeds.
- [ ] `npm test -w make-docs` passes with no regressions.
