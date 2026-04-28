# Phase 2 - Template Resource Tree

## Objective

Move the shippable docs template from multiple hidden top-level resource directories to a single visible `packages/docs/template/docs/assets/` tree.

## Depends On

- Phase 1 resource contract and router wording.
- Current template files under `packages/docs/template/docs/.archive/`, `.assets/`, `.prompts/`, `.references/`, and `.templates/`.
- `packages/docs/template/docs/AGENTS.md` and `CLAUDE.md`.

## Files to Move or Modify

| Current Path | New Path |
| ------------ | -------- |
| `packages/docs/template/docs/.archive/` | `packages/docs/template/docs/assets/archive/` |
| `packages/docs/template/docs/.assets/history/` | `packages/docs/template/docs/assets/history/` |
| `packages/docs/template/docs/.prompts/` | `packages/docs/template/docs/assets/prompts/` |
| `packages/docs/template/docs/.references/` | `packages/docs/template/docs/assets/references/` |
| `packages/docs/template/docs/.templates/` | `packages/docs/template/docs/assets/templates/` |
| `packages/docs/template/docs/.assets/AGENTS.md` | `packages/docs/template/docs/assets/AGENTS.md` |
| `packages/docs/template/docs/.assets/CLAUDE.md` | `packages/docs/template/docs/assets/CLAUDE.md` |
| `packages/docs/template/docs/.assets/config/AGENTS.md` and `CLAUDE.md` | remove; no replacement config directory |

## Detailed Changes

### 1. Create the new template resource root

Create:

```text
packages/docs/template/docs/assets/
```

Move the active resource families under it:

```text
assets/archive/
assets/history/
assets/prompts/
assets/references/
assets/templates/
```

### 2. Remove retired template resource roots

After the new tree is populated and links are updated, remove the retired template roots:

```text
packages/docs/template/docs/.archive/
packages/docs/template/docs/.assets/
packages/docs/template/docs/.prompts/
packages/docs/template/docs/.references/
packages/docs/template/docs/.templates/
```

Do not leave duplicate active template copies under both old and new paths.

### 3. Align template routers

The template root router should route support resources through `docs/assets/`.

The new `assets/AGENTS.md` and `assets/CLAUDE.md` should route to:

- `docs/assets/archive/`
- `docs/assets/history/`
- `docs/assets/prompts/`
- `docs/assets/references/`
- `docs/assets/templates/`

The old config router should not survive because make-docs state now lives in root `.make-docs/`, outside the docs template.

### 4. Preserve capability subdirectory routers

Project output routers remain under:

```text
packages/docs/template/docs/designs/
packages/docs/template/docs/guides/
packages/docs/template/docs/plans/
packages/docs/template/docs/prd/
packages/docs/template/docs/work/
```

Update their references to the new support-resource paths, but do not move those directories.

### 5. Keep template files byte-aligned with generated renderers

This phase prepares the checked-in source tree. Phase 3 must update renderer output to match. If Phase 2 and Phase 3 land together, compare generated buildable router content against the moved template files before final validation.

## Parallelism

Template file moves and link updates can be split by resource family. A final assembly pass should normalize all references after the moves so no template file points at a retired hidden resource path.

## Acceptance Criteria

- [ ] `packages/docs/template/docs/assets/` exists and contains archive, history, prompts, references, and templates children.
- [ ] No manifest, conflicts, state, or config directory is checked in under `packages/docs/template/docs/assets/`.
- [ ] Retired template resource roots are removed.
- [ ] Template routers use `docs/assets/` paths.
- [ ] Capability routers still live under direct project-doc directories.
- [ ] A path inventory shows no active template files under `packages/docs/template/docs/.archive`, `.assets`, `.prompts`, `.references`, or `.templates`.
