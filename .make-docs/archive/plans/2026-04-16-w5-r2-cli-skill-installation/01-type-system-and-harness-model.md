# Phase 1 — Type System and Harness Model

## Objective

Replace the `instructionKinds: Record<InstructionKind, boolean>` selection model with `harnesses: Record<Harness, boolean>` and add `skillScope: "project" | "global"` to `InstallSelections`. Update all profile functions and manifest loading to support the new shape with backward compatibility for existing manifests.

## Files to Modify

| File | Change Summary |
| ---- | -------------- |
| `packages/cli/src/types.ts` | Add `Harness` type, `HARNESSES` const. Replace `instructionKinds` with `harnesses` in `InstallSelections`. Add `skillScope`. |
| `packages/cli/src/profile.ts` | Update `defaultSelections`, `isFullDefaultProfile`, `profileId` hash. |
| `packages/cli/src/manifest.ts` | Backward-compat migration when loading old manifests with `instructionKinds`. |

## Detailed Changes

### 1. `types.ts` — Add Harness type and const

Add the new type and const alongside the existing `InstructionKind` (which remains for backward compat in manifest loading):

```ts
export type Harness = "claude-code" | "codex";

export const HARNESSES: readonly Harness[] = ["claude-code", "codex"] as const;
```

### 2. `types.ts` — Replace instructionKinds with harnesses in InstallSelections

Remove `instructionKinds` and add `harnesses` and `skillScope`:

```ts
export interface InstallSelections {
  capabilities: Record<Capability, boolean>;
  prompts: boolean;
  templatesMode: TemplatesMode;
  referencesMode: ReferencesMode;
  harnesses: Record<Harness, boolean>;
  skills: boolean;
  skillScope: "project" | "global";
}
```

### 3. `profile.ts` — defaultSelections

Return both harnesses as true and skillScope as "project":

```ts
export function defaultSelections(): InstallSelections {
  return {
    // ...existing fields...
    harnesses: { "claude-code": true, "codex": true },
    skills: true,
    skillScope: "project",
  };
}
```

### 4. `profile.ts` — cloneSelections

Already uses `structuredClone` — no change needed. The new fields are plain objects/primitives and clone correctly.

### 5. `profile.ts` — isFullDefaultProfile

Replace the `instructionKinds` checks with `harnesses` checks and add `skillScope`:

```ts
export function isFullDefaultProfile(profile: InstallProfile): boolean {
  return (
    // ...existing capability/prompt/template/reference checks...
    profile.selections.harnesses["claude-code"] &&
    profile.selections.harnesses["codex"] &&
    profile.selections.skills &&
    profile.selections.skillScope === "project"
  );
}
```

### 6. `profile.ts` — profileId hash

Replace the `instructionKinds` segment in the hash input with `harnesses` and `skillScope`:

```ts
// Before:
// ...`ik:${Object.entries(s.instructionKinds).sort().map(...)}`...

// After:
const harnessStr = Object.entries(s.harnesses)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([k, v]) => `${k}=${v}`)
  .join(",");
// Include in hash: `h:${harnessStr}|scope:${s.skillScope}`
```

### 7. `manifest.ts` — Backward-compat migration

When loading an existing manifest whose `selections` has `instructionKinds` but no `harnesses`, derive the new fields:

```ts
function migrateSelections(selections: any): InstallSelections {
  if ("instructionKinds" in selections && !("harnesses" in selections)) {
    const ik = selections.instructionKinds as Record<string, boolean>;
    return {
      ...selections,
      harnesses: {
        "claude-code": ik["CLAUDE.md"] ?? false,
        "codex": ik["AGENTS.md"] ?? false,
      },
      skillScope: selections.skillScope ?? "project",
    };
  }
  return selections;
}
```

Call `migrateSelections` in the manifest-loading path before returning the parsed manifest. Remove the `instructionKinds` key from the migrated object so downstream code never sees it.

### 8. Build and fix compile errors

After the type change, any file importing `instructionKinds` or `InstructionKind` for selection purposes will fail to compile. Grep for `instructionKinds` across the codebase and update each reference to use `harnesses`. Keep `InstructionKind` type available for the migration path in manifest.ts.

## Parallelism

- This phase has no dependencies and can start immediately.
- Phase 2 (registry) can run in parallel with this phase (no file overlap).
- Phases 3, 4, and 6 depend on this phase (they consume `Harness` types and `harnesses` selections).

## Acceptance Criteria

- [ ] `Harness` type and `HARNESSES` const exist in `types.ts`.
- [ ] `InstallSelections` uses `harnesses: Record<Harness, boolean>` (no `instructionKinds`).
- [ ] `InstallSelections` has `skillScope: "project" | "global"`.
- [ ] `defaultSelections()` returns both harnesses true and skillScope "project".
- [ ] `cloneSelections()` correctly clones the new fields (verified by existing structuredClone behavior).
- [ ] `isFullDefaultProfile()` checks both harnesses, skills, and skillScope.
- [ ] `profileId` hash includes harnesses and skillScope instead of instructionKinds.
- [ ] Loading an old manifest with `instructionKinds` produces correct `harnesses` values (`"CLAUDE.md" -> "claude-code"`, `"AGENTS.md" -> "codex"`).
- [ ] `npm run build -w make-docs` succeeds with zero type errors.
- [ ] `npm test -w make-docs` passes.
