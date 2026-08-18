# CLI Publishing — First npm Release

> Filename: `2026-04-15-cli-publishing.md`. See the [wave model](../../.make-docs/references/system/wave-model.md) for W/R semantics.

## Purpose

Capture the decision to publish the `make-docs` CLI to the public npm registry and the approach for going from the verified Phase 7 tarball to a real release. The unscoped `make-docs` name was blocked by npm's similarity guard, so the first public release path is the scoped package `@brucewaynedecoy/make-docs` while preserving the installed `make-docs` binary.

## Context

The `make-docs` CLI has never been published. Absent a published package, `npx @brucewaynedecoy/make-docs@next` does not work and the tool is usable only from inside this repository. Publishing is the last missing piece that lets consumers in other projects pick the tool up.

The pseudo-monorepo restructure (Phases 1–6) already produced a publishable tarball, verified in the Phase 7 dry run. The remaining problem is release mechanics rather than packaging correctness.

Prerequisites that must be in place before the first publish call:

- An npm account for the publisher, with `npm login` completed locally (or a scoped auth token in `~/.npmrc` for CI).
- Availability of the package name on the public registry. `npm view make-docs` returned empty, but `npm publish` was blocked by npm's name-similarity rules against `make_docs` and `makedocs`; the release therefore switches to `@brucewaynedecoy/make-docs`.
- A public GitHub repository (or a reachable URL referenced in the README) so the npm package page renders correctly.
- Apache-2.0 license files at repo root and `packages/cli/`.
- Repository metadata (`repository`, `bugs`, `homepage`) in `packages/cli/package.json`.

## Decision

**Scope of the publish.** The published package is the `make-docs` CLI from `packages/cli/` only — `package.json`, built `dist/`, the `template/` directory copied in via `prepack` from `packages/docs/template/`, and `README.md`. Explicitly not published: the monorepo root, `packages/docs/`, `packages/content/`, `packages/skills/`, the repo-root `docs/`, scripts, and the v2 scratchpads.

**Versioning strategy.** `packages/cli/package.json` is currently `1.0.0-rc.1`. The first publish goes out as `1.0.0-rc.1` on the `next` dist-tag. This reserves the scoped name, lets early adopters opt in via `npm install @brucewaynedecoy/make-docs@next`, and keeps `latest` empty until the release is trusted. After a validation window (days to a week), the rc is promoted to `1.0.0` on the `latest` dist-tag. Subsequent releases follow semver: patch for bug fixes, minor for additive capabilities, major for breaking CLI or template changes. Pre-release tags (`-rc`, `-beta`) carry v2 agentics work so the stable line remains usable while that work is in flight.

**Publish sequence (first release).** Each step is reversible up to the actual `npm publish` call. After publish, yanking requires `npm unpublish` within 72 hours or a forward version bump.

1. **Decide name and scope.** Use `@brucewaynedecoy/make-docs` because the public registry blocked unscoped `make-docs` as too similar to existing packages.
2. **Add LICENSE** at `packages/cli/LICENSE` and repo root. Apache-2.0 is the selected license.
3. **Add repository metadata** to `packages/cli/package.json`:
   ```json
   "repository": { "type": "git", "url": "https://github.com/<owner>/make-docs.git" },
   "homepage": "https://github.com/<owner>/make-docs#readme",
   "bugs": "https://github.com/<owner>/make-docs/issues"
   ```
4. **Write a CLI-focused README** at `packages/cli/README.md` (currently a copy of the repo-root README). This is what consumers see on the npm package page. Trim it to install + usage; defer contributing and monorepo details to the repo-root README.
5. **Bump version** to `1.0.0-rc.1` via `npm version --no-git-tag-version 1.0.0-rc.1 -w packages/cli` (git tagging is deferred until after publish).
6. **Run full validation**:
   ```bash
   just test
   just check-instruction-routers
   just smoke-pack
   ```
7. **Authenticate.** Run `npm login` if not already logged in; confirm identity with `npm whoami`.
8. **Dry run once more.** Run `npm pack --dry-run -w packages/cli` and inspect the file list one final time.
9. **Publish the rc**:
   ```bash
   npm publish --access public --tag next -w packages/cli
   ```
   The `--access public` flag is required for scoped packages and harmless for unscoped.
10. **Verify from a clean directory**:
    ```bash
    cd /tmp && mkdir make-docs-verify && cd make-docs-verify
    npx @brucewaynedecoy/make-docs@next --yes
    ls docs/
    cat .make-docs/manifest.json | head
    ```
11. **Commit and tag.** Once the rc is up and verified, commit the version bump and tag it (`git tag v1.0.0-rc.1 && git push --tags`).

**Promotion path.** After the rc survives a validation window (at least 3–7 days or one external user install), promote by one of:

- **Option A — promote the existing rc.** Run `npm dist-tag add @brucewaynedecoy/make-docs@1.0.0-rc.1 latest`. The same artifact becomes the default install.
- **Option B — publish a fresh `1.0.0`.** Bump to `1.0.0`, re-run the validation chain, then `npm publish --access public -w packages/cli` (omitting `--tag` defaults to `latest`).

Option B is cleaner for a first-time publisher because it keeps `1.0.0` as the canonical first stable release. Option A is more efficient when nothing changes between rc and stable.

**Safety rails.**

- **72-hour unpublish window.** `npm unpublish @brucewaynedecoy/make-docs@<version>` works only within 72 hours of publish. After that, only deprecation is available.
- **Deprecation.** `npm deprecate @brucewaynedecoy/make-docs@<version> "reason"` leaves the version installable but warns users. Used if a published version turns out to be broken.
- **No version-number reuse.** Even after unpublish, npm blocks re-using the same version for 24 hours. Always bump forward.
- **Strict `package.json#files` allowlist.** Publishing relies on `package.json#files` rather than `.npmignore`. The dry-run output is inspected carefully — anything not listed will not ship, and anything listed that should not be public is a leak.

## Alternatives Considered

- **Unscoped `make-docs` vs scoped `@brucewaynedecoy/make-docs`.** Unscoped was preferred for discoverability and for a clean `npx make-docs` invocation, but npm blocked the name as too similar to existing packages. Scoped `@brucewaynedecoy/make-docs` is the selected first-release path, with the `make-docs` binary preserved after install.
- **First-publish target: `1.0.0-rc.1` on `next` vs straight to `1.0.0` on `latest`.** Going straight to `latest` is simpler, but a broken first release would immediately affect every default installer. The rc-on-`next` route keeps `latest` empty until the release is trusted, which is the chosen path.
- **Promotion via dist-tag (Option A) vs fresh stable publish (Option B).** Option A reuses the exact rc artifact with a single dist-tag move. Option B re-runs the validation chain and produces a clean `1.0.0` history. Both remain on the table; the choice is made at promotion time based on how much changed across the rc cycle.
- **Manual publish vs GitHub Actions automation up front.** Manual publish keeps the first release small and debuggable. Actions-based automation (with `NPM_TOKEN`, tag-triggered pipelines, and optional `--provenance`) is deferred until after the first manual release lands.
- **Individual npm account vs npm org as publisher identity.** An individual account is simpler for the first publish; an org improves continuity and shared ownership. The identity decision is still open.
- **License choice: MIT vs Apache-2.0 vs other.** Apache-2.0 is selected for the first public release.

## Consequences

**What becomes possible.** Consumers in other projects install the tool with `npx @brucewaynedecoy/make-docs@next` (and, after promotion, `npx @brucewaynedecoy/make-docs`). The Phase 7 tarball stops being a laboratory artifact and becomes a shipped release.

**Risks.**

- Files outside the intended allowlist leak into the published tarball via `package.json#files`.
- Consumers may expect the unscoped `npx make-docs` form even though the first public package must be scoped.
- A broken first release is discovered after the 72-hour unpublish window, leaving only deprecation and a forward version bump.

**Deferred items.**

- Provenance attestations (`npm publish --provenance`) via GitHub Actions + OIDC.
- Changesets for multi-package version coordination if `packages/docs/template/` ever publishes standalone.
- GitHub Actions publish automation with an `NPM_TOKEN` repo secret, tag-triggered.
- Standalone publishing of `@make-docs/template` (revisit only if a consumer needs it without the CLI).

**Explicit out of scope.**

- Publishing `@make-docs/template` standalone.
- Publishing skills as their own packages (deferred to v2 agentics work).
- Any marketing or launch activities (website, blog posts, announcements).
- CI/CD beyond the basic Actions publish pipeline described above.

**Outstanding decisions.** The package name, license, first publish target, repository metadata, and individual publisher path are now resolved for the first rc. The remaining non-blocking decision is release automation timing:

1. **Automation preference** — manual publish now and automation later; manual only; or GitHub Actions before a later stable promotion.

## Intended Follow-On

- Route: `baseline-plan`
- Next Prompt: [designs-to-plan.prompt.md](../../.make-docs/system/prompts/designs-to-plan.prompt.md)
- Why: The publish sequence is concrete enough to drive a baseline plan for future release automation after the first scoped rc lands.
