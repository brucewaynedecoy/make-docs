# Phase 2 — CLI Types and Profile

## Objective

Add a `skills` boolean to `InstallSelections` and update all downstream consumers: `defaultSelections`, `cloneSelections`, `resolveInstallProfile`, `isFullDefaultProfile`, and the manifest schema.

## Files to Modify

| File | Change Summary |
| ---- | -------------- |
| `packages/cli/src/types.ts` | Add `skills: boolean` to `InstallSelections`. Add `skillFiles` to `InstallManifest`. |
| `packages/cli/src/profile.ts` | Update `defaultSelections` (skills: true), `cloneSelections`, `isFullDefaultProfile` (add skills check). |

## Detailed Changes

### 1. `types.ts` — InstallSelections

Add `skills: boolean` to the interface:

```ts
export interface InstallSelections {
  capabilities: Record<Capability, boolean>;
  prompts: boolean;
  templatesMode: TemplatesMode;
  referencesMode: ReferencesMode;
  instructionKinds: Record<InstructionKind, boolean>;
  skills: boolean;
}
```

### 2. `types.ts` — InstallManifest

Add `skillFiles` to track installed skill files separately from docs-template files:

```ts
export interface InstallManifest {
  schemaVersion: number;
  packageName: string;
  packageVersion: string;
  updatedAt: string;
  profileId: string;
  selections: InstallSelections;
  effectiveCapabilities: Capability[];
  files: Record<string, ManifestFileEntry>;
  skillFiles?: Record<string, ManifestFileEntry>;
}
```

The `?` optional makes it backward-compatible with existing manifests.

### 3. `profile.ts` — defaultSelections

Add `skills: true` to the returned object.

### 4. `profile.ts` — cloneSelections

Add `skills: selections.skills` to the clone.

### 5. `profile.ts` — isFullDefaultProfile

Add `profile.selections.skills &&` to the return expression.

## Parallelism

- Can run in parallel with Phase 1 (no file overlap).
- All changes within this phase are sequential (types first, then profile consumers).

## Acceptance Criteria

- [ ] `InstallSelections` has a `skills: boolean` field.
- [ ] `InstallManifest` has an optional `skillFiles` field.
- [ ] `defaultSelections()` returns `skills: true`.
- [ ] `cloneSelections()` copies the `skills` field.
- [ ] `isFullDefaultProfile()` includes a `skills` check.
- [ ] `npm run build -w make-docs` succeeds.
- [ ] `npm test -w make-docs` passes (existing tests may need minor updates to include `skills` in their selections).
