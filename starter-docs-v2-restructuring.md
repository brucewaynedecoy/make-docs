# starter-docs v2 — Monorepo Restructuring Plan

> Temporary working doc. Sister file to `starter-docs-v2-planning.md`. Captures the plan for restructuring this repository into a pseudo-monorepo so the project can dogfood its own `docs/` system while keeping the shippable `docs/` template clean.

## Motivation

- v2 design, planning, and work-tracking should live **in this project** using **this project's own `docs/` conventions**. That's the only way to validate the contracts we ship.
- The current repo root `docs/` is the **deliverable** — it gets published in the NPM package and copied into consumer projects. It must stay pristine: no drafts, no project-specific designs, no meta-work.
- These two needs collide. A pseudo-monorepo resolves the conflict by separating the repo's internal documentation surface from the shippable template surface.

## Current Layout (pre-restructure)

```
starter-docs/
├── src/                     # CLI source (cli.ts, install.ts, renderers.ts, ...)
├── dist/                    # CLI build output
├── tests/                   # CLI tests (vitest)
├── docs/                    # the template (SHIPPED as part of npm package)
├── content/parts/           # content fragments used by renderers
├── skills/                  # agent skills (decompose-codebase/)
├── scripts/                 # check-instruction-routers.sh, smoke-pack.mjs
├── builds/                  # (empty)
├── .backup/                 # (legacy — investigate before moving)
├── package.json             # name: starter-docs, bin: starter-docs
├── tsup.config.ts, tsconfig.json, justfile
├── AGENTS.md, CLAUDE.md, README.md, TODO.md
```

Key constraint: `package.json#files` ships `dist/`, `docs/`, `AGENTS.md`, `CLAUDE.md`, `README.md`. The CLI reads from the shipped `docs/` tree at install time.

## Target Layout (post-restructure)

```
starter-docs/
├── docs/                        # REPO-LEVEL docs — used to dogfood v2 design/plan/work
│   └── (populated using our own docs conventions as v2 evolves)
│
├── packages/
│   ├── docs/                    # the shippable template package
│   │   ├── package.json         # e.g. @starter-docs/template (private or published)
│   │   ├── AGENTS.md, CLAUDE.md, README.md
│   │   └── template/            # the actual template tree (designs/, plans/, prd/, work/, guides/, .references/, .templates/, .prompts/)
│   │
│   ├── cli/                     # the installer CLI
│   │   ├── package.json         # name: starter-docs (keeps public bin name)
│   │   ├── src/
│   │   ├── tests/
│   │   ├── dist/
│   │   ├── tsup.config.ts
│   │   └── tsconfig.json
│   │
│   ├── content/                 # rendered content fragments
│   │   ├── package.json
│   │   └── parts/
│   │
│   └── skills/                  # agent skills catalog
│       ├── package.json
│       └── decompose-codebase/
│
├── scripts/                     # REPO-LEVEL orchestration (validate routers, smoke-pack, release)
├── package.json                 # npm workspaces root
├── tsconfig.base.json           # shared TS config extended by each package
├── justfile                     # orchestrates across packages
├── AGENTS.md, CLAUDE.md, README.md, TODO.md
└── .archive/                    # (v2 feature, lands later per v2-planning.md)
```

Two `docs/` surfaces, clearly separated:

| Surface | Purpose | Published |
|---|---|---|
| `./docs/` (repo root) | Internal v2 planning/design/work for starter-docs itself | No |
| `./packages/docs/template/` | The shippable template that consumers receive | Yes (via CLI package bundling) |

## Package Inventory & Moves

| Current path | New path | Notes |
|---|---|---|
| `src/` | `packages/cli/src/` | CLI sources |
| `tests/` | `packages/cli/tests/` | CLI tests; co-located with code |
| `dist/` | `packages/cli/dist/` | CLI build output (gitignored) |
| `tsup.config.ts` | `packages/cli/tsup.config.ts` | CLI build config |
| `tsconfig.json` | split → `tsconfig.base.json` (root) + `packages/cli/tsconfig.json` | Shared base; per-package overrides |
| `docs/` | `packages/docs/template/` | Renamed inner dir to `template/` to disambiguate from repo-root `docs/` |
| `content/parts/` | `packages/content/parts/` | Content fragments |
| `skills/` | `packages/skills/` | Agent skills |
| `scripts/check-instruction-routers.sh` | `scripts/` (stays at root) | Repo-level validation; updated paths |
| `scripts/smoke-pack.mjs` | `scripts/` (stays at root) | Repo-level; exercises the publishable CLI |
| `builds/` | **delete** | Empty |
| `.backup/` | **investigate** | If legacy, delete or relocate into `.archive/` once v2 archive lands |

## Key Decisions (please confirm)

1. **Workspace manager**: npm workspaces (already using npm; no new tooling). Alternatives: pnpm, yarn. Recommend npm.
2. **Public package name**: keep `starter-docs` on `packages/cli` so `npx starter-docs` keeps working for existing users. Template package may be internal-only (`private: true`) unless we see value in publishing it standalone.
3. **Template bundling**: when `packages/cli` is published, it must include the template tree. Two options:
   - (a) **Copy at build time** via tsup `onSuccess` or a prepublish script that copies `packages/docs/template/` → `packages/cli/template/`. Ship from there.
   - (b) **Workspace path reference + publish script** that resolves the sibling at publish time.
   - Recommend (a) for simplicity. The CLI becomes self-contained once published.
4. **Template package path**: `packages/docs/template/` (inner `template/` dir) vs `packages/docs/` (contents directly inside). Recommend the inner `template/` dir — it keeps package metadata (`package.json`, `README.md`, `AGENTS.md`) separate from the shipped tree.
5. **Repo-root `docs/` starting content**: on day one, copy `packages/docs/template/*` as the seed — we immediately gain our own design/plans/work directories under v1 conventions. The two trees then diverge: the repo-root `docs/` evolves as we implement v2; the template tree is only updated when a v2 change is stable and ready to ship.
6. **Versioning**: the CLI hits `1.0.0` on v2 publish (currently `0.1.0`). Template package can be independently versioned if published.
7. **Scripts stay at repo root**: validation and release orchestration live at root, not inside any package, since they span packages.

## Migration Sequence (phased)

Each phase leaves the repo in a working, testable state. Tests must pass at the end of every phase.

**Phase 0 — Prep (no moves yet)**
- Add `starter-docs-v2-planning.md` decisions (this doc + sibling).
- Confirm open decisions above with user.
- Create a v2 branch.

**Phase 1 — Workspace scaffolding**
- Add root-level npm workspaces config to `package.json`.
- Create empty `packages/cli/`, `packages/docs/`, `packages/content/`, `packages/skills/` with minimal `package.json` files.
- Extract `tsconfig.base.json` at root.
- Commit; nothing moved yet.

**Phase 2 — Move CLI**
- `git mv src/ packages/cli/src/`
- `git mv tests/ packages/cli/tests/`
- `git mv tsup.config.ts packages/cli/`
- Move build-related config to `packages/cli/package.json`.
- Update all imports and test paths.
- Verify `npm run build`, `npm test`, `smoke-pack` all pass from the new location.

**Phase 3 — Move template**
- `git mv docs/ packages/docs/template/`
- Update all references in CLI code (likely `src/install.ts`, `src/renderers.ts`, etc.) from `docs/` → `packages/docs/template/` (dev-time) and the bundled path (publish-time).
- Add prepublish copy step so the published CLI still ships the template.
- Verify `npx --yes ./packages/cli` runs end-to-end against a test target directory.

**Phase 4 — Move content + skills**
- `git mv content/ packages/content/`
- `git mv skills/ packages/skills/`
- Update CLI references.
- Update `package.json#files` on CLI if content is bundled with CLI.

**Phase 5 — Seed repo-root `docs/`**
- `cp -R packages/docs/template/* docs/` at repo root (fresh seed).
- Commit this as the dogfood starting point.
- From here on, v2 design/plan/work artifacts are written into the repo-root `docs/`.

**Phase 6 — Cleanup**
- Delete empty `builds/`.
- Investigate `.backup/`; delete or archive.
- Update repo-root `README.md`, `AGENTS.md`, `CLAUDE.md` to describe the monorepo structure and point at `packages/cli/README.md`, `packages/docs/README.md`, etc.
- Update `justfile` to orchestrate across packages (`just build`, `just test`, `just smoke`).
- Update `scripts/check-instruction-routers.sh` to validate both `docs/` and `packages/docs/template/`.
- Update CI if any.

**Phase 7 — Publish dry run**
- Run `npm pack` on `packages/cli`.
- Inspect the tarball contents: must include `dist/`, the bundled template, `AGENTS.md`, `CLAUDE.md`, `README.md`.
- Run `smoke-pack` end-to-end against a scratch directory.
- Bump version to `1.0.0-rc.1` and publish to a dist-tag (`next`) for validation before `latest`.

## Risks & Open Questions

- **Consumer-facing CLI name stability**: keeping `starter-docs` on `packages/cli` preserves `npx starter-docs` UX. Confirmed intent.
- **Path references inside CLI code**: `src/install.ts`, `src/renderers.ts`, and `scripts/check-instruction-routers.sh` likely hardcode `docs/` — every occurrence needs a sweep. Low risk but high count.
- **Tests referencing fixture paths**: `tests/install.test.ts` and `tests/consistency.test.ts` may probe template structure. Need auditing.
- **`content/parts/` semantics**: is this part of what the CLI renders, or separate? If it's CLI-internal, consider nesting under `packages/cli/content/` instead of a standalone package. Recommend deciding in Phase 4.
- **Template package publishing**: do we gate on keeping it `private: true` forever, or eventually publish as `@starter-docs/template` so third parties can consume it without the CLI?
- **The `.archive/` v2 feature and monorepo interplay**: archive should exist at the repo root (`./docs/.archive/`) AND inside the shipped template (`packages/docs/template/.archive/`). The archive directory and its AGENTS.md ship as part of the template deliverable.
- **Agent skills consumption**: how does the CLI surface skills? If skills are installed alongside `docs/`, `packages/skills/` needs bundling logic similar to the template.
- **Backward compatibility**: one-off scripts or external tooling that path into `docs/` at repo root (CI, other projects referencing this repo) — any such consumers will break. Need an inventory before Phase 3.

## Open Ideas to Defer

- Eventually adopting Turborepo or Nx for caching/task graphs. Probably overkill at this size; revisit if the package count grows.
- Changelogs per package (via changesets) if template and CLI start versioning independently.
- Generating the template package tree from a single source (e.g., the CLI's own catalog) rather than maintaining it as hand-edited files. Interesting but large scope.

## Next Steps

1. User review + sign-off on open decisions (workspace manager, package naming, inner `template/` dir, phasing).
2. Freeze decisions in the Decision Log section of `starter-docs-v2-planning.md`.
3. Create the v2 branch and execute Phase 0–1.
4. Once Phase 5 is complete, move all subsequent v2 planning artifacts into the new repo-root `docs/` — we'll stop using these two scratch `.md` files and start writing proper design docs, plans, and work backlogs using the project's own conventions.

## Decision Log

_(Append decisions here as they're made, each as: date, decision, rationale.)_
