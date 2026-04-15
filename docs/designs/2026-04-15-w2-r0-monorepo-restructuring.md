# Pseudo-Monorepo Restructuring

> Filename: `2026-04-15-w2-r0-monorepo-restructuring.md`. See [../.references/wave-model.md](../.references/wave-model.md) for W/R semantics.

## Purpose

Capture the decision to restructure the `starter-docs` repository into a pseudo-monorepo so that the project can dogfood its own `docs/` conventions while keeping the shippable docs template pristine.

## Context

`starter-docs` has two documentation surfaces with conflicting needs that share a single directory:

- The repo-root `docs/` tree is the **deliverable**. It is bundled into the published NPM package and copied into consumer projects by the CLI installer. It must stay clean — no drafts, no project-specific designs, no meta-work about `starter-docs` itself.
- v2 design, planning, and work-tracking for `starter-docs` should also live **in this repo**, ideally written using **this project's own `docs/` conventions**. Dogfooding is the only way to validate the contracts we ship.

Pre-restructure, the repo looked roughly like this:

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
├── .backup/                 # legacy — investigate before moving
├── package.json             # name: starter-docs, bin: starter-docs
├── tsup.config.ts, tsconfig.json, justfile
├── AGENTS.md, CLAUDE.md, README.md, TODO.md
```

Key constraint: `package.json#files` ships `dist/`, `docs/`, `AGENTS.md`, `CLAUDE.md`, and `README.md`. The CLI reads from the shipped `docs/` tree at install time, so any relocation of the template must preserve that shipped layout at publish time.

A pseudo-monorepo resolves the conflict by separating the repo's internal documentation surface from the shippable template surface. This design retroactively documents the restructuring decision; as of writing, the early migration phases have landed on `main` (see commit `adba716 feat: Implement pseudo monorepo restructuring for future support.`).

## Decision

Restructure the repo into a pseudo-monorepo with a small number of `packages/` and two clearly separated `docs/` surfaces.

### Target layout

```
starter-docs/
├── docs/                        # REPO-LEVEL docs — used to dogfood v2 design/plan/work
│   └── (populated using our own docs conventions as v2 evolves)
│
├── packages/
│   ├── docs/                    # the shippable template package
│   │   ├── package.json         # e.g. @starter-docs/template (private or published)
│   │   ├── AGENTS.md, CLAUDE.md, README.md
│   │   └── template/            # the actual template tree (designs/, plans/, prd/, work/,
│   │                            #   guides/, .references/, .templates/, .prompts/)
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
└── .archive/                    # (v2 feature, lands later)
```

Two `docs/` surfaces, clearly separated:

| Surface | Purpose | Published |
|---|---|---|
| `./docs/` (repo root) | Internal v2 planning/design/work for `starter-docs` itself | No |
| `./packages/docs/template/` | The shippable template that consumers receive | Yes (via CLI package bundling) |

### Package inventory & moves

| Current path | New path | Notes |
|---|---|---|
| `src/` | `packages/cli/src/` | CLI sources |
| `tests/` | `packages/cli/tests/` | CLI tests; co-located with code |
| `dist/` | `packages/cli/dist/` | CLI build output (gitignored) |
| `tsup.config.ts` | `packages/cli/tsup.config.ts` | CLI build config |
| `tsconfig.json` | split into `tsconfig.base.json` (root) + `packages/cli/tsconfig.json` | Shared base; per-package overrides |
| `docs/` | `packages/docs/template/` | Renamed inner dir to `template/` to disambiguate from repo-root `docs/` |
| `content/parts/` | `packages/content/parts/` | Content fragments |
| `skills/` | `packages/skills/` | Agent skills |
| `scripts/check-instruction-routers.sh` | `scripts/` (stays at root) | Repo-level validation; updated paths |
| `scripts/smoke-pack.mjs` | `scripts/` (stays at root) | Repo-level; exercises the publishable CLI |
| `builds/` | **delete** | Empty |
| `.backup/` | **investigate** | If legacy, delete or relocate into `.archive/` once v2 archive lands |

### Frozen decisions

Confirmed 2026-04-15:

1. **Workspace manager**: npm workspaces.
2. **CLI package name**: `starter-docs` lives at `packages/cli`. The package has not been publicly released, so there is no backward-compat UX constraint, but the public-facing name is preserved.
3. **Template bundling**: prepublish copy from `packages/docs/template/` into `packages/cli/template/` so the CLI is self-contained once published.
4. **Template package path**: inner `template/` directory inside `packages/docs/`, keeping package metadata separate from the shipped tree.
5. **Repo-root `docs/` seeding**: the current root `docs/` is copied into `packages/docs/template/`. Afterwards the root `docs/` becomes the dogfood surface for `starter-docs`' own designs, plans, and work.
6. **Versioning**: CLI bumps to `1.0.0` on v2 publish; template package versioned independently if ever published standalone.
7. **Scripts location**: stays at repo root for cross-package validation and release orchestration.

### Migration sequence (phased)

Each phase leaves the repo in a working, testable state. Tests must pass at the end of every phase.

- **Phase 0 — Prep.** Freeze decisions, create the v2 branch. No moves yet.
- **Phase 1 — Workspace scaffolding.** Add npm workspaces config to root `package.json`; create empty `packages/cli/`, `packages/docs/`, `packages/content/`, `packages/skills/` with minimal `package.json`; extract `tsconfig.base.json`.
- **Phase 2 — Move CLI.** `git mv` `src/`, `tests/`, and `tsup.config.ts` under `packages/cli/`; move build-related config into `packages/cli/package.json`; update imports and test paths; verify `npm run build`, `npm test`, and `smoke-pack` all pass from the new location.
- **Phase 3 — Move template.** `git mv docs/ packages/docs/template/`; update CLI references (`src/install.ts`, `src/renderers.ts`, etc.) for both dev-time and publish-time paths; add the prepublish copy step; verify the CLI runs end-to-end against a test target directory.
- **Phase 4 — Move content + skills.** `git mv content/ packages/content/` and `git mv skills/ packages/skills/`; update CLI references; update `package.json#files` on the CLI if content is bundled.
- **Phase 5 — Seed repo-root `docs/`.** Copy `packages/docs/template/*` into a fresh repo-root `docs/`. Commit as the dogfood starting point; from here on, v2 design/plan/work artifacts land in the repo-root `docs/`.
- **Phase 6 — Cleanup.** Delete `builds/`; investigate `.backup/`; update repo-root `README.md`, `AGENTS.md`, `CLAUDE.md` to describe the monorepo and point at per-package docs; update `justfile` for cross-package orchestration; extend `scripts/check-instruction-routers.sh` to validate both `docs/` and `packages/docs/template/`.
- **Phase 7 — Publish dry run.** `npm pack` on `packages/cli`; inspect the tarball for `dist/`, the bundled template, and the trio of `AGENTS.md` / `CLAUDE.md` / `README.md`; run `smoke-pack` end-to-end; bump to `1.0.0-rc.1` and publish to the `next` dist-tag before promoting to `latest`.

## Alternatives Considered

- **Keep a single flat layout, no workspaces.** Keeps the repo simple but leaves the core conflict unresolved: the shipped `docs/` tree and the project's own design/plan/work artifacts keep colliding in one directory. Rejected — dogfooding is only credible if we actually use our own conventions in a separate, non-published surface.
- **Single `docs/` surface with a convention to exclude internal files at publish time.** Would rely on filename/prefix conventions plus `.npmignore`-style filtering to keep meta-work out of the tarball. Rejected because it continues to leak internal artifacts into the tree consumers see in the repo (including via GitHub) and creates fragile publish-time filtering.
- **Use a heavier monorepo tool (Turborepo or Nx) from the start.** Provides task graphs and caching, but adds tooling surface area that is probably overkill at the current package count. Deferred — npm workspaces is sufficient today; revisit if the number of packages grows.
- **Publish the template as a standalone package (`@starter-docs/template`) immediately.** Allows third parties to consume the template without the CLI. Deferred until we have a real consumer asking for it; for now the template package can stay `private: true` and be bundled into the CLI via the prepublish copy step.
- **Nest `content/` and `skills/` inside the CLI package instead of making them siblings.** Simpler layout but makes the ownership and consumption boundary harder to evolve later. Left open: the final home for `packages/content/` and `packages/skills/` is explicitly deferred to Phase 4, once we understand their consumers.
- **Generate the template tree from a single source of truth** (for example, the CLI's own catalog) rather than maintaining it as hand-edited files. Interesting but large scope; out of scope for this restructuring.

The scratchpad did not explore alternative bundling strategies beyond the prepublish copy step in depth; the copy step was chosen because it keeps the CLI self-contained on publish without requiring workspace-aware install flows at consumer install time.

## Consequences

**Benefits**

- Internal and shipped documentation surfaces are fully separated; meta-work on `starter-docs` can no longer leak into the published template.
- The repo can genuinely dogfood its own design/plan/work conventions in the repo-root `docs/`, surfacing contract issues early.
- Each package (`cli`, `docs`, `content`, `skills`) has an independent `package.json`, opening the door to independent versioning and, if warranted later, independent publishing.
- Public CLI UX (`npx starter-docs`) is preserved because the CLI package keeps the `starter-docs` name.

**Trade-offs**

- Consumers and contributors now face two `docs/` surfaces, which requires clear orientation in the repo-root routers and per-package READMEs.
- Publish-time correctness depends on the prepublish copy step; if that step breaks, the published CLI will ship without its template. `smoke-pack` and a Phase 7 publish dry run are explicit mitigations.
- `tsconfig` is now split between a shared base and per-package overrides; future TS config changes touch two places.

**Risks and open items**

- **Path references inside CLI code.** `src/install.ts`, `src/renderers.ts`, and `scripts/check-instruction-routers.sh` likely hardcode `docs/`. Every occurrence needs a sweep — low individual risk, high count.
- **Tests referencing fixture paths.** `tests/install.test.ts` and `tests/consistency.test.ts` may probe template structure; these need auditing during Phase 2–3.
- **`content/parts/` semantics.** Whether `packages/content/` stays its own package or nests under `packages/cli/content/` is deferred to Phase 4, once we understand its consumers.
- **`packages/skills/` bundling.** If skills install alongside `docs/`, they need bundling logic analogous to the template's prepublish copy. Deferred to Phase 4.
- **`.archive/` interplay.** The v2 archive feature needs to exist both at repo root (`./docs/.archive/`) and inside the shipped template (`packages/docs/template/.archive/`). The archive directory and its `AGENTS.md` ship as part of the template deliverable.
- **Template publishing stance.** Whether `@starter-docs/template` is ever published standalone or kept `private: true` forever is deliberately left open.
- **Backward compatibility.** External tooling or CI that paths into the repo-root `docs/` will break when that directory becomes the dogfood surface. An inventory of such consumers is needed before Phase 3.
- **Consumer-facing CLI name stability.** Keeping `starter-docs` on `packages/cli` preserves `npx starter-docs`. Intent confirmed.

**Implementation status (as of 2026-04-15)**

Several early phases of the migration have already been implemented on `main` under the commit "feat: Implement pseudo monorepo restructuring for future support." Exact per-phase completion (particularly Phase 7 publish dry run and `.archive/` interplay) should be verified against the working tree before further planning.

## Intended Follow-On

- Route: `baseline-plan`
- Next Prompt: [designs-to-plan.prompt.md](../.prompts/designs-to-plan.prompt.md)
- Why: Early phases have already landed, but the remaining work — publish dry run, `.archive/` interplay, and finishing the path-reference sweep — can be picked up cleanly by a baseline plan if one is needed.
