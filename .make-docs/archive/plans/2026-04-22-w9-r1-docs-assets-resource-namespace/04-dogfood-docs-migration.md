# Phase 4 - Dogfood Docs Migration

## Objective

Apply the new resource namespace to this repository's active `docs/` tree and relocate dogfood CLI state to root `.make-docs/` after the shippable template and CLI paths agree on the final model.

## Depends On

- Phase 1 resource contract and router wording.
- Phase 2 shippable template resource tree.
- Phase 3 CLI managed path and state behavior.

## Files to Move or Modify

| Current Path | New Path |
| ------------ | -------- |
| `docs/.archive/` | `docs/assets/archive/` |
| `docs/.assets/history/` | `docs/assets/history/` |
| `docs/.prompts/` | `docs/assets/prompts/` |
| `docs/.references/` | `docs/assets/references/` |
| `docs/.templates/` | `docs/assets/templates/` |
| `docs/.assets/config/manifest.json` | `.make-docs/manifest.json` |
| `docs/.assets/config/conflicts/` | `.make-docs/conflicts/` |
| `docs/.resources/` | remove if still empty |

## Detailed Changes

### 1. Move dogfood resources after CLI paths are final

Use file moves rather than copy-and-leave-duplicates. This repository should dogfood the same model fresh installs receive:

```text
docs/assets/archive/
docs/assets/history/
docs/assets/prompts/
docs/assets/references/
docs/assets/templates/
```

Move CLI state separately to:

```text
.make-docs/manifest.json
.make-docs/conflicts/
```

Do not create `docs/assets/config/`, `docs/assets/state/`, `docs/assets/manifest.json`, or `docs/assets/conflicts/`.

### 2. Preserve project docs in place

Do not move:

```text
docs/designs/
docs/guides/
docs/plans/
docs/prd/
docs/work/
```

Update links inside those files only when they are active instructions or current source-of-truth docs.

### 3. Update active documentation surfaces

Known active docs to update include:

- `README.md`
- `packages/cli/README.md`
- `packages/docs/README.md`
- `docs/guides/user/getting-started-installing-make-docs.md`
- `docs/guides/developer/cli-development-local-build-and-install.md`
- `docs/guides/**` router instructions
- active `docs/designs`, `docs/plans`, and `docs/work` files that serve as current references for this change

Historical records may keep old paths where they document past work. If a historical file is updated only to preserve a live relative link after a move, keep that edit minimal.

### 4. Update archive skill copies

Update all active archive skill copies:

```text
packages/skills/archive-docs/
.agents/skills/archive-docs/
.claude/skills/archive-docs/
```

They should scan `docs/assets/history/` for history and move approved archived artifacts into `docs/assets/archive/` according to the new archive router.

### 5. Retire hidden resource directories

After moving files and updating links, remove active hidden resource roots if empty:

```text
docs/.archive/
docs/.assets/
docs/.prompts/
docs/.references/
docs/.templates/
docs/.resources/
```

If an old directory cannot be removed because an unmanaged local file remains, document that in the execution history and validation output rather than deleting unknown user content.

## Parallelism

Dogfood file moves and active docs updates can proceed in parallel only after the new path contract is final. A single final link-repair pass should own cross-tree relative-link fixes.

## Acceptance Criteria

- [ ] `docs/assets/` exists and contains archive, history, prompts, references, and templates.
- [ ] `.make-docs/manifest.json` exists when the dogfood install has CLI state.
- [ ] `docs/assets/config/`, `docs/assets/state/`, `docs/assets/manifest.json`, and `docs/assets/conflicts/` do not exist.
- [ ] Empty `docs/.resources/` is removed.
- [ ] No active checked-in resource remains under `docs/.archive`, `docs/.assets`, `docs/.prompts`, `docs/.references`, or `docs/.templates`.
- [ ] Project output directories remain direct children of `docs/`.
- [ ] Active READMEs, guides, routers, and skills use new paths.
- [ ] Relative links from moved files resolve or are repaired.
- [ ] Any retained old-path references are historical, not routing instructions.
