---
date: "2026-04-16"
coordinate: "W5 R2 P2"
---

# Phase 2: CLI Skill Installation R2 — Registry and Resolver

## Changes

Built the data layer that all later phases consume: a static `skill-registry.json` listing the 5 bundled skills with `local:` sources, a typed loader with validation and filter helpers, and a `local:`-protocol resolver with a path-traversal guard.

| Area | Summary |
| --- | --- |
| `packages/cli/skill-registry.json` | New. Lists 5 skill entries (`decompose-codebase`, `archive`, `archive-impact`, `deprecate`, `staleness-check`). Four archive-docs entries carry `"plugin": "archive-docs"`; `archive` declares 2 shared assets (`archive-workflow.md`, `trace_relationships.py`). `$schema` points to the not-yet-written schema file. |
| `packages/cli/src/skill-registry.ts` | New. Exports `SkillAssetEntry`, `SkillRegistryEntry`, `SkillRegistry` interfaces and `loadSkillRegistry`, `getOptionalSkills`, `getRequiredSkills`, `getSkillsByPlugin`. Missing or malformed JSON throws with `cause`-chaining; per-entry validation logs a warning and skips rather than aborting. |
| `packages/cli/src/skill-resolver.ts` | New. Exports `ResolvedSkill`, `ResolvedSkillAsset`, `UnsupportedProtocolError`, `resolveLocalPath`, `resolveSkillSource`. `resolveLocalPath` strips the `local:` prefix, resolves against `repoRoot`, and rejects traversal via prefix check with `path.sep`. `resolveSkillSource` dispatches through `resolveLocalPath` (single protocol chokepoint), reads `.md` content as UTF-8 strings and everything else as `Buffer`. |
| Simplify pass | Swapped direct `readFileSync(..., "utf8")` for `readTextFile` from `utils.ts`; removed a redundant outer protocol check in `resolveSkillSource`; extracted a `readRequiredString` helper in the registry loader to eliminate `as string` casts. |
| Validation | `tsc --noEmit` clean, `npm run build -w make-docs` succeeds (tsup bundles to `dist/index.js`; new modules will be pulled into the bundle when Phase 3+ imports them), all 44 existing tests pass. Unit tests for the loader and resolver are scheduled for Phase 7. |

Files created:

```text
packages/cli/
├── skill-registry.json             (new — 5-skill registry)
└── src/
    ├── skill-registry.ts           (new — typed loader + filter helpers)
    └── skill-resolver.ts           (new — local: protocol resolver)
```

Naming note: the resolver's asset type is `ResolvedSkillAsset` (not `ResolvedAsset`) to avoid a collision with the existing `types.ts::ResolvedAsset` used by the main asset pipeline.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/assets/archive/work/2026-04-16-w5-r2-cli-skill-installation/02-registry-and-resolver.md](../archive/work/2026-04-16-w5-r2-cli-skill-installation/02-registry-and-resolver.md) | Work backlog phase — all four stages closed, acceptance criteria met. |
| [docs/assets/archive/plans/2026-04-16-w5-r2-cli-skill-installation/02-registry-and-resolver.md](../archive/plans/2026-04-16-w5-r2-cli-skill-installation/02-registry-and-resolver.md) | Source plan — file-by-file specifications for the registry, loader, and resolver. |

### Developer

None this session.

### User

None this session.
