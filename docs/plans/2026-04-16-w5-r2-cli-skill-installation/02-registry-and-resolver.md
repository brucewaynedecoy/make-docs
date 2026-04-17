# Phase 2 — Registry and Resolver

## Objective

Create the skill registry file (`skill-registry.json`), a typed registry loader (`skill-registry.ts`), and a `local:` protocol resolver (`skill-resolver.ts`). These provide the data layer that later phases consume for skill installation, selective prepack, and wizard display.

> Implemented divergence: the shipped registry is remote-only, contains two skills (`archive-docs` and `decompose-codebase`), and no longer uses `plugin` fields or `local:` sources. See the [updated design](../../designs/2026-04-16-cli-skill-installation-r2.md) and [phase-5 agent guide](../../guides/agent/2026-04-17-w5-r2-p5-cli-skill-installation.md).

## Depends On

- None. The registry is independent of the type-system changes in Phase 1. Phases 1 and 2 can run in parallel.

## Files to Create

| File | Purpose |
| ---- | ------- |
| `packages/cli/skill-registry.json` | Static registry listing all 5 bundled skills with `local:` sources. |
| `packages/cli/src/skill-registry.ts` | Load, parse, and validate the registry. Export typed accessors. |
| `packages/cli/src/skill-resolver.ts` | Resolve a `local:` source URI to an absolute filesystem path. Read entry-point content and asset content. |

## Detailed Changes

### 1. `skill-registry.json` — Static Registry

The registry lists every installable skill. The `installName` field is the filename only (no directory); the CLI computes the full path at runtime based on harness and scope.

Skills that belong to a multi-skill plugin declare a `plugin` field. Shared assets are listed once per plugin skill that references them.

```json
{
  "$schema": "./src/schemas/skill-registry.schema.json",
  "skills": [
    {
      "name": "decompose-codebase",
      "source": "local:packages/skills/decompose-codebase",
      "entryPoint": "SKILL.md",
      "installName": "decompose-codebase.md",
      "required": false,
      "description": "Plan and reverse-engineer repos into structured PRDs.",
      "assets": []
    },
    {
      "name": "archive",
      "source": "local:packages/skills/archive-docs/skills/archive",
      "entryPoint": "SKILL.md",
      "installName": "archive-docs-archive.md",
      "required": false,
      "description": "Relationship-aware archival with 4 modes.",
      "plugin": "archive-docs",
      "assets": [
        {
          "source": "local:packages/skills/archive-docs/references/archive-workflow.md",
          "installPath": "archive-docs/references/archive-workflow.md"
        },
        {
          "source": "local:packages/skills/archive-docs/scripts/trace_relationships.py",
          "installPath": "archive-docs/scripts/trace_relationships.py"
        }
      ]
    },
    {
      "name": "archive-impact",
      "source": "local:packages/skills/archive-docs/skills/archive-impact",
      "entryPoint": "SKILL.md",
      "installName": "archive-docs-archive-impact.md",
      "required": false,
      "description": "Assess downstream impact before archiving.",
      "plugin": "archive-docs",
      "assets": []
    },
    {
      "name": "deprecate",
      "source": "local:packages/skills/archive-docs/skills/deprecate",
      "entryPoint": "SKILL.md",
      "installName": "archive-docs-deprecate.md",
      "required": false,
      "description": "Mark documents as deprecated with forwarding references.",
      "plugin": "archive-docs",
      "assets": []
    },
    {
      "name": "staleness-check",
      "source": "local:packages/skills/archive-docs/skills/staleness-check",
      "entryPoint": "SKILL.md",
      "installName": "archive-docs-staleness-check.md",
      "required": false,
      "description": "Detect stale documents by age, drift, and link health.",
      "plugin": "archive-docs",
      "assets": []
    }
  ]
}
```

### 2. `skill-registry.ts` — Registry Loader

Define types and a loader:

```ts
export interface SkillAssetEntry {
  source: string;        // e.g. "local:packages/skills/archive-docs/references/..."
  installPath: string;   // e.g. "archive-docs/references/archive-workflow.md"
}

export interface SkillRegistryEntry {
  name: string;
  source: string;        // protocol URI, e.g. "local:packages/skills/..."
  entryPoint: string;    // filename inside source dir, e.g. "SKILL.md"
  installName: string;   // filename for install target, e.g. "archive-docs-archive.md"
  required: boolean;
  description: string;
  plugin?: string;       // parent plugin name, for shared-asset grouping
  assets: SkillAssetEntry[];
}

export interface SkillRegistry {
  skills: SkillRegistryEntry[];
}
```

Exported functions:

- **`loadSkillRegistry(packageRoot: string): SkillRegistry`** — reads `skill-registry.json` relative to `packageRoot`, parses JSON, returns typed object. Throws if the file is missing or malformed.
- **`getOptionalSkills(registry: SkillRegistry): SkillRegistryEntry[]`** — returns entries where `required === false`.
- **`getRequiredSkills(registry: SkillRegistry): SkillRegistryEntry[]`** — returns entries where `required === true`.
- **`getSkillsByPlugin(registry: SkillRegistry, plugin: string): SkillRegistryEntry[]`** — returns entries matching a `plugin` value.

The loader performs minimal validation: check that `skills` is an array, each entry has `name`, `source`, `entryPoint`, `installName`, and `assets`. Log a warning and skip entries that fail validation rather than aborting the entire load.

### 3. `skill-resolver.ts` — Source Resolver

Resolve protocol URIs to filesystem content. Initial implementation supports `local:` only.

```ts
export type ResolvedSkill = {
  entryPointContent: string;
  assets: Array<{ installPath: string; content: string | Buffer }>;
};
```

Exported functions:

- **`resolveSkillSource(source: string, entryPoint: string, assets: SkillAssetEntry[], repoRoot: string): ResolvedSkill`** — dispatches on protocol prefix.
  - `local:` — strips prefix, joins with `repoRoot`, reads `entryPoint` from the resulting directory, reads each asset source the same way.
  - Any other prefix — throws `UnsupportedProtocolError` with the protocol name.

- **`resolveLocalPath(localUri: string, repoRoot: string): string`** — strips the `local:` prefix, resolves against `repoRoot`, returns the absolute path. Throws if the resolved path escapes `repoRoot` (path-traversal guard).

Implementation notes:

1. The `local:` path is always relative to the repository root (the directory containing `package.json` at the workspace root), not relative to the CLI package.
2. Asset content uses `Buffer` for binary files (e.g., `.py` scripts that should preserve encoding) and `string` for `.md` files. Use a simple extension check: `.md` files read as UTF-8 strings, everything else as Buffers.
3. The path-traversal guard uses `path.resolve` and checks that the result starts with `repoRoot`. This prevents `local:../../etc/passwd` attacks.

## Parallelism

- `skill-registry.json` can be written independently.
- `skill-registry.ts` and `skill-resolver.ts` have no shared dependencies and can be written in parallel.
- Both modules depend on the JSON file existing for integration testing, but not for compilation.

## Acceptance Criteria

- [ ] `skill-registry.json` lists all 5 skills with correct `source`, `installName`, and `plugin` fields.
- [ ] `loadSkillRegistry` loads and parses the JSON, returning a typed `SkillRegistry`.
- [ ] Invalid entries are skipped with a warning, not a crash.
- [ ] `resolveSkillSource` reads entry-point content and asset content for `local:` URIs.
- [ ] `resolveLocalPath` rejects paths that escape the repo root.
- [ ] Unsupported protocols throw `UnsupportedProtocolError`.
- [ ] `npm run build -w starter-docs` succeeds.
- [ ] `npm test -w starter-docs` passes (unit tests for loader and resolver added in Phase 7).
