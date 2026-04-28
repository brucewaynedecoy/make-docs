# 10 Packaging, Validation, and Release Reference

## Purpose

This reference doc captures the current publishable surface for `make-docs`, the validation commands that guard it, and the maintainer release procedure encoded in the repository today. It stays separate from subsystem narrative docs because the package allowlist in `packages/cli/package.json:9-25`, the prepack copy step in `scripts/copy-template-to-cli.mjs:24-32`, and the smoke-pack assertions in `scripts/smoke-pack.mjs:60-246` are operational facts rather than product-behavior descriptions.

## Reference

### Packaging Surface

| Topic | Current behavior | Primary anchors |
| --- | --- | --- |
| Publishable npm package | The only publishable workspace is `make-docs` under `packages/cli/`; the monorepo root is `private: true` and only delegates scripts to that workspace. | `package.json:2-19`, `packages/cli/package.json:2-25` |
| CLI allowlist | The current shipped file allowlist is `dist`, `template`, `skill-registry.json`, `skill-registry.schema.json`, and `README.md`. Root `docs/`, root `AGENTS.md`, and root `CLAUDE.md` are not in the allowlist. | `packages/cli/package.json:9-15` |
| Template packaging | `prepack` runs `node ../../scripts/copy-template-to-cli.mjs && npm run build`, and that script replaces `packages/cli/template` with `packages/docs/template` before pack/publish. | `packages/cli/package.json:19-25`, `scripts/copy-template-to-cli.mjs:24-32` |
| Dev vs packed template resolution | Local development reads `packages/docs/template/` first through `resolveTemplateRoot`, then falls back to the bundled `packages/cli/template/` in packed contexts. | `packages/cli/src/utils.ts:33-55`, `packages/docs/README.md:31-37` |
| Docs/template workspace status | `packages/docs` is `private` and exists to hold the source-of-truth template consumed by the CLI at build/publish time. It is not independently published today. | `packages/docs/package.json:2-5`, `packages/docs/README.md:123-125` |
| Skills workspace status | `packages/skills` is also `private`; current packaged distribution exposes registry metadata rather than publishing the workspace itself as an npm package. | `packages/skills/package.json:2-5`, `packages/cli/package.json:9-15`, `scripts/copy-template-to-cli.mjs:29-32` |

Current package mechanics therefore split into two modes: local development works from `packages/docs/template/` (`packages/cli/src/utils.ts:33-55`), while packed artifacts work from `packages/cli/template` after `prepack` (`scripts/copy-template-to-cli.mjs:24-32`). Any release checklist that ignores that distinction will miss a class of template drift bugs.

### Prepack and Smoke-Pack Flow

| Step | What happens | Primary anchors |
| --- | --- | --- |
| Prepack entry | `npm run prepack` runs inside `packages/cli`, copies the template, validates `packages/cli/skill-registry.json`, then builds `dist/index.js`. | `packages/cli/package.json:19-25`, `scripts/copy-template-to-cli.mjs:24-47` |
| Tarball creation | The smoke script executes `npm pack --json --ignore-scripts` only after running `prepack`, so the tarball reflects the already-bundled template and built output. | `scripts/smoke-pack.mjs:60-76` |
| Bin validation | After unpacking, the script reads the packed `package.json` and asserts the package exposes only the `make-docs` bin before invoking it. | `scripts/smoke-pack.mjs:81-90`, `scripts/smoke-pack.mjs:255-260` |
| Skills validation | Smoke-pack rewrites the packed skill registry to a repo-backed fixture server, runs `make-docs skills --dry-run`, installs the base package, verifies project skill directories, and asserts legacy skill artifacts are absent. | `scripts/smoke-pack.mjs:98-213` |
| Installer validation | The same smoke run verifies `.make-docs/manifest.json`, `docs/AGENTS.md`, a second idempotent `--yes` run with no staged conflicts, and later backup/uninstall behavior. | `scripts/smoke-pack.mjs:122-245` |
| Backup and uninstall validation | Smoke-pack creates an unmanaged file, runs `backup`, then `uninstall`, and confirms the manifest is removed while the unmanaged file and `.backup` tree survive. | `scripts/smoke-pack.mjs:215-246` |

The smoke script is therefore more than a tarball smoke test. It is the encoded proof that prepack bundling, packaged installation, skill distribution, backup, and uninstall still agree on the same release surface (`scripts/smoke-pack.mjs:60-246`).

### Validation Matrix

| Command | Scope | What it proves | Primary anchors |
| --- | --- | --- | --- |
| `npm test` or `npm test -w make-docs` | Full CLI Vitest suite | Covers profile logic, CLI flows, installer integration, skills behavior, and lifecycle commands. | `package.json:16`, `packages/cli/package.json:22`, `packages/cli/src/README.md:152-177` |
| `npm run validate:defaults` | Default-asset consistency | Runs `packages/cli/tests/consistency.test.ts`, which checks that the buildable asset set matches the default profile and that every template file is covered by the asset pipeline. | `package.json:17`, `packages/cli/package.json:23`, `packages/cli/tests/consistency.test.ts:33-77` |
| `bash scripts/check-instruction-routers.sh` | Router integrity | Enforces `AGENTS.md`/`CLAUDE.md` pairing, byte identity, per-directory line budgets, and banned headings. | `scripts/check-instruction-routers.sh:1-58`, `packages/cli/src/README.md:165-176` |
| `bash scripts/check-wave-numbering.sh` | Docs/work namespace hygiene | Warns on duplicate `wN-rN` coordinates across both repo-root docs and `packages/docs/template/docs`. | `scripts/check-wave-numbering.sh:15-58`, `docs/assets/archive/work/2026-04-16-w5-r2-cli-skill-installation/07-tests-and-validation.md` |
| `node scripts/smoke-pack.mjs` | Packaged end-to-end validation | Exercises prepack, tarball creation, packaged CLI install, skills, backup, and uninstall in temp directories. | `package.json:18`, `scripts/smoke-pack.mjs:60-246` |
| `npm exec --yes --package "./$TARBALL" -- make-docs --target "$TEST_DIR"` | Manual packaged run | Provides one real npm launcher pass beyond the automated smoke script before publish. | `packages/cli/src/README.md:135-148` |

### Maintainer Release Procedure

The current maintainer runbook is spread across `packages/cli/src/README.md:179-204`, the repo-root workspace scripts in `package.json:13-18`, and the first-publish design in `docs/designs/2026-04-15-cli-publishing.md`. The current procedural baseline is:

1. Run the validation chain from the repo root: `npm test`, `npm run validate:defaults`, `npm run build`, `node scripts/smoke-pack.mjs`, and the router/wave checks when docs assets or W/R folders changed (`package.json:13-18`, `packages/cli/src/README.md:165-176`, `scripts/check-instruction-routers.sh:1-58`, `scripts/check-wave-numbering.sh:48-58`).
2. Create and inspect a tarball with `npm pack --json` or `npm pack --dry-run -w make-docs` before publish (`packages/cli/src/README.md:183-201`, `designs/2026-04-15-cli-publishing.md`).
3. Run one manual packaged install with `npm exec --yes --package "./$TARBALL" -- make-docs --target "$TEST_DIR"` if the change was packaging-sensitive (`packages/cli/src/README.md:135-148`).
4. Publish from the CLI workspace, not from `packages/docs` or `packages/skills`, because those workspaces remain `private` (`packages/cli/package.json:2-25`, `packages/docs/package.json:2-5`, `packages/skills/package.json:2-5`).

For a true first public release, the design record adds prerequisites that are still not encoded in the package metadata: registry-name verification, repository metadata, a license file, and a consciously chosen first-release version/tag strategy (`docs/designs/2026-04-15-cli-publishing.md`, `packages/cli/package.json:2-25`). Those are still reference-level decisions rather than finished repo state.

### Current Drift and Risk-Register Candidates

| Item | Evidence | Why it matters |
| --- | --- | --- |
| Maintainer README package-surface drift | `packages/cli/src/README.md:181-204` says the published package includes `dist`, `docs`, root instruction files, and the root consumer README, but the actual allowlist in `packages/cli/package.json:9-15` ships `dist`, `template`, registry files, and `README.md`. | Contributors following the maintainer README can reason about the wrong tarball contents. Candidate item for `03-open-questions-and-risk-register.md`. |
| Packaged README copy-command drift | `packages/cli/README.md:91-120` still tells users to copy tarball-root `docs/`, `AGENTS.md`, and `CLAUDE.md`, but those paths are not part of the current package allowlist in `packages/cli/package.json:9-15`. | The README shipped with the npm package can instruct consumers to use files that are not actually present. Candidate risk-register item. |
| First-publish prerequisites remain incomplete | `packages/cli/package.json:2-25` still lacks `repository`, `homepage`, and `bugs`; `packages/cli/LICENSE` and repo-root `LICENSE` are absent; version remains `0.1.0`. | The release design in `docs/designs/2026-04-15-cli-publishing.md` treats these as prerequisites, so public release readiness is still ambiguous. Candidate risk-register item. |
| Reserved future package with no release contract | `README.md:10-17` describes `packages/content/` as reserved for CLI-rendered fragments, but current package metadata and release scripts do not define how or whether it will ship. | This is a future-facing gap that can complicate later packaging and dogfood expectations. Candidate risk-register item. |

## Source Anchors

- `package.json`
- `README.md`
- `packages/cli/package.json`
- `packages/cli/README.md`
- `packages/cli/src/README.md`
- `packages/cli/src/utils.ts`
- `packages/docs/package.json`
- `packages/docs/README.md`
- `packages/skills/package.json`
- `packages/cli/tests/consistency.test.ts`
- `scripts/check-instruction-routers.sh`
- `scripts/check-wave-numbering.sh`
- `scripts/copy-template-to-cli.mjs`
- `scripts/smoke-pack.mjs`
- `docs/designs/2026-04-15-cli-publishing.md`
- `docs/assets/archive/work/2026-04-16-w5-r2-cli-skill-installation/07-tests-and-validation.md`
