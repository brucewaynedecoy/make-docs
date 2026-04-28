# Make Docs Rename

> Filename: `2026-04-21-make-docs-rename.md`. See `docs/.references/design-contract.md` for naming and structural rules.

## Purpose

Prepare the project for the planned repository rename from `make-docs` to `make-docs` before the repository itself is renamed.

This design establishes the desired end state for a comprehensive alpha-phase product rename. The follow-on implementation should update every tracked reference, package name, CLI command, generated instruction, link, filename, and directory segment that still uses the old `make-docs` name so the project consistently presents itself as `make-docs`.

## Context

The rename has not happened at the repository host or local checkout level yet, but the codebase already exposes the old name through many active surfaces:

- npm package identity in the root workspace, CLI package, private template package, skills package, content package, and `package-lock.json`
- CLI binary name, help text, lifecycle output, manifest metadata, user-agent strings, wizard copy, and command examples
- source tests, smoke-pack validation, temp-directory prefixes, and test fixtures
- generated router text in `packages/cli/src/renderers.ts`
- package template resources under `packages/docs/template/`
- repo-root docs, user/developer guides, references, prompts, design docs, plans, work backlogs, and history records
- GitHub examples and skill registry source URLs that currently point at a `make-docs` repository path

The project is still alpha, so there is no requirement to preserve compatibility with existing installs, old package names, old binary names, or old manifest package names. At the same time, the migration needs to be thorough because a partial rename would create confusing public behavior: users could install `make-docs` while docs, manifests, generated instructions, or lifecycle messages still refer to `make-docs`.

The CLI state path created by the Wave 9 config namespace work remains correct:

```text
docs/.assets/config/manifest.json
```

The rename changes the product/package identity recorded in that manifest, not the manifest location.

## Decision

Rename the product and implementation identity globally from `make-docs` to `make-docs`.

Canonical names after the migration:

| Surface | Canonical value |
| --- | --- |
| Display name | `Make Docs` |
| CLI package and public bin | `make-docs` |
| Root workspace package | `make-docs-monorepo` |
| Template workspace package | `@make-docs/template` |
| Skills workspace package | `@make-docs/skills` |
| Content workspace package | `@make-docs/content` |
| TypeScript constants and env-like identifiers | `MAKE_DOCS_*` |
| Repository examples and skill registry URLs | `make-docs` repository path |

The public CLI surface should use only the new command name:

```text
npx make-docs
make-docs reconfigure
make-docs backup
make-docs uninstall
```

Do not keep a `make-docs` binary alias, package alias, compatibility command, compatibility help text, or legacy package-name migration. Fresh manifests should record `packageName: "make-docs"`.

The user install guide should move from:

```text
docs/guides/user/getting-started-installing-make-docs.md
```

to:

```text
docs/guides/user/getting-started-installing-make-docs.md
```

All links to that guide should be updated. Other tracked filenames and directory segments containing `make-docs` should be renamed to the equivalent `make-docs` form.

Historical design docs, plans, work items, and history records should be rewritten as part of this alpha rename instead of preserving the old brand for historical accuracy. The final tracked tree should not contain `make-docs`, `Make-Docs`, `Make Docs`, `make docs`, `MAKE_DOCS`, or `@make-docs` outside intentionally ignored generated/cache directories.

The implementation should update `packages/docs/template/` first for template-owned docs and routers, then run the normal template sync so `packages/cli/template/` matches the shippable docs template.

## Alternatives Considered

### Keep a `make-docs` Compatibility Alias

Rejected. There are no existing non-alpha consumers to preserve, and keeping an alias would force the CLI, tests, docs, and lifecycle messaging to carry two product names. A clean rename is simpler and less error-prone.

### Update Active Surfaces Only

Rejected. Leaving the old name in historical docs would make stale-reference checks ambiguous and would contradict the requested global alpha rename. The migration should rewrite historical records too.

### Defer Workspace Package Scope Renames

Rejected. Keeping `@make-docs/*` while publishing or documenting `make-docs` would leave the monorepo internally inconsistent and make `npm -w` commands, lockfile entries, and package references confusing.

### Rename the Local Checkout as Part of the Migration

Rejected for this design. The implementation can update tracked files and package identity without renaming the developer's local checkout directory. The actual repository rename can happen later at the host and local clone level.

## Consequences

The follow-on implementation will be a broad mechanical migration, not a localized feature change. It must update package manifests and regenerate the lockfile, rename the user guide file, update source constants and tests, refresh docs and package templates, and rerun the template copy step for the CLI bundle.

Because no compatibility path is retained, old commands such as `make-docs`, `npx make-docs`, and `make-docs reconfigure` should disappear from help text, docs, generated instructions, smoke tests, and source tests. Failure guidance for removed subcommands should also use `make-docs`.

The validation bar is a clean package build plus zero stale old-brand strings in tracked files and pathnames, except ignored generated/cache directories:

```text
npm run build -w make-docs
npm test -w make-docs
npm run validate:defaults -w make-docs
node scripts/smoke-pack.mjs
bash scripts/check-instruction-routers.sh
git diff --check
```

Pack and install validation should confirm that the packed package exposes only the `make-docs` bin, smoke installs create a manifest with `packageName: "make-docs"`, and generated routers/user guides contain no old command examples.

## Design Lineage

- Update Mode: `new-doc-related`
- Prior Design Docs: [2026-04-15-monorepo-restructuring.md](../../../designs/2026-04-15-monorepo-restructuring.md), [2026-04-15-cli-publishing.md](../../../designs/2026-04-15-cli-publishing.md), [2026-04-20-cli-command-simplification.md](2026-04-20-cli-command-simplification.md), [2026-04-20-docs-assets-state-and-history.md](2026-04-20-docs-assets-state-and-history.md)
- Reason: This rename changes the public package identity, CLI command surface, docs-template identity, and historical docs vocabulary established by those earlier designs without changing their underlying architecture.

## Intended Follow-On

- Route: `change-plan`
- Next Prompt: [designs-to-plan-change.prompt.md](../.prompts/designs-to-plan-change.prompt.md)
- Why: This design defines a broad rename against the existing CLI, template, docs, and package structure rather than a new baseline docs system.
