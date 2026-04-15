# starter-docs v2 — CLI Publishing Plan

> Temporary working doc. Sibling to the other `starter-docs-v2-*.md` scratchpads. Captures the requirement and end-to-end steps for publishing the `starter-docs` CLI to the public npm registry. Delete or archive once the first publish lands and we have a real release process.

## Requirement

The `starter-docs` CLI has never been published. Without a published package, `npx starter-docs` does not work, and the tool is only usable from inside this repo. Publishing is the last missing piece that lets consumers in other projects pick the tool up.

The restructure (Phases 1–6) already produced a publishable tarball (verified in Phase 7 dry run). This plan describes how to go from a verified tarball to a real npm release without surprises.

## What We're Publishing

- **Package**: `starter-docs` (CLI only)
- **Source**: `packages/cli/` — `package.json`, `dist/` (built), `template/` (copied from `packages/docs/template/` via `prepack`), `README.md`
- **Not published**: monorepo root, `packages/docs/`, `packages/content/`, `packages/skills/`, repo-root `docs/`, scripts, v2 scratchpads

## Prerequisites

- [ ] npm account for the publisher (create at npmjs.com if none exists)
- [ ] Local login via `npm login` (or scoped auth token in `~/.npmrc` for CI)
- [ ] Package name `starter-docs` is available on the public registry. Verify with `npm view starter-docs` — if it returns a package, we'll need a different name or a scope (e.g. `@<user>/starter-docs`).
- [ ] GitHub repository is public (or the readme references a reachable URL) so the npm package page renders correctly
- [ ] A LICENSE file exists at `packages/cli/` (or is inherited from repo root). Currently neither has one — npm will warn and the package will be listed without a license.
- [ ] Repository URL is set in `packages/cli/package.json` (`repository`, `bugs`, `homepage` fields). Currently absent — worth adding before first publish.

## Versioning Strategy

- `packages/cli/package.json` is currently `0.1.0`.
- Recommend first publish as `1.0.0-rc.1` on the `next` dist-tag. This reserves the name, lets early adopters opt in via `npm install starter-docs@next`, and keeps `latest` empty until we're confident.
- After a validation window (days to a week), promote the rc to `1.0.0` on the `latest` dist-tag with `npm dist-tag add starter-docs@1.0.0 latest`. Or publish `1.0.0` fresh if we've iterated on `rc.2`, `rc.3`, etc. first.
- Subsequent releases follow semver: patch for bug fixes, minor for additive capabilities, major for breaking template or CLI changes.
- Use pre-release tags (`-rc`, `-beta`) for v2 agentics work so the stable line stays usable while we rebuild.

## Publish Sequence (first release)

Each step is reversible up to the actual `npm publish` call. After that, yanking requires `npm unpublish` within 72 hours or a version bump.

1. **Decide name and scope**. Confirm `starter-docs` (or switch to scoped). Update `packages/cli/package.json#name` if needed.
2. **Add LICENSE** at `packages/cli/LICENSE` (and optionally at repo root). MIT is a safe default for open-source tooling.
3. **Add repository metadata** to `packages/cli/package.json`:
   ```json
   "repository": { "type": "git", "url": "https://github.com/<owner>/starter-docs.git" },
   "homepage": "https://github.com/<owner>/starter-docs#readme",
   "bugs": "https://github.com/<owner>/starter-docs/issues"
   ```
4. **Write a CLI-focused README** at `packages/cli/README.md` (currently a copy of repo-root README). This is what consumers see on the npm package page. Trim it to install + usage; defer contributing/monorepo details to the repo-root README.
5. **Bump version** to `1.0.0-rc.1` via `npm version --no-git-tag-version 1.0.0-rc.1 -w starter-docs` (skip git tagging until we're ready to publish).
6. **Run full validation**:
   ```bash
   just test
   just check-instruction-routers
   just smoke-pack
   ```
7. **Authenticate**: `npm login` if not already logged in. Confirm identity with `npm whoami`.
8. **Dry run once more**: `npm pack --dry-run -w starter-docs`. Inspect the file list one more time.
9. **Publish the rc**:
   ```bash
   npm publish --access public --tag next -w starter-docs
   ```
   The `--access public` flag is required for scoped packages; harmless for unscoped.
10. **Verify from a clean directory**:
    ```bash
    cd /tmp && mkdir starter-docs-verify && cd starter-docs-verify
    npx starter-docs@next init --yes
    ls docs/
    cat docs/.starter-docs/manifest.json | head
    ```
11. **Commit and tag**: once the rc is up and verified, commit the version bump and tag it (`git tag v1.0.0-rc.1 && git push --tags`).

## Promoting to `latest`

After the rc has survived a validation window (recommend at least 3–7 days or one external user install):

- **Option A — promote existing rc**: `npm dist-tag add starter-docs@1.0.0-rc.1 latest`. The same artifact becomes the default install.
- **Option B — publish a fresh `1.0.0`**: bump to `1.0.0`, run the validation chain again, `npm publish --access public -w starter-docs` (no `--tag` defaults to `latest`).

Option B is cleaner for first-time publishers because it keeps `1.0.0` as the canonical first stable release. Option A is more efficient if nothing changes between rc and stable.

## Safety Rails

- **72-hour unpublish window**: `npm unpublish starter-docs@<version>` works within 72 hours of publish. After that, only deprecation (`npm deprecate`) is available.
- **Deprecation**: `npm deprecate starter-docs@<version> "reason"` leaves the version installable but warns users. Useful if a published version turns out to be broken.
- **Never reuse a version number**: even after unpublish, npm blocks re-using the same version for 24 hours. Always bump forward.
- **`.npmignore` or `files` allowlist**: we rely on `package.json#files`, which is a strict allowlist. Verify the dry-run output carefully — anything not in `files` will not be shipped, and anything in `files` that shouldn't be public is a leak.

## Nice-to-Have Automation (not required for first publish)

- **Publish via GitHub Actions** with an `NPM_TOKEN` repo secret. Triggered on `v*` tag push, runs build + tests + smoke-pack, then `npm publish`. Keeps the publishing identity out of individual dev machines.
- **Changesets** (https://github.com/changesets/changesets) for multi-package version coordination if `packages/docs/template/` ever publishes standalone.
- **Provenance attestations**: `npm publish --provenance` records the build commit for supply-chain verification. Requires GitHub Actions with OIDC.

## Decisions the User Needs to Make

1. **Package name**: stick with `starter-docs` or switch to a scoped name (e.g. `@<user>/starter-docs`)?
2. **License**: MIT, Apache-2.0, or something else?
3. **First publish target**: `1.0.0-rc.1` on `next` (recommended), or go straight to `1.0.0` on `latest`?
4. **Publisher identity**: individual npm account or an org?
5. **Automation preference**: manual publish now, automate via GitHub Actions later, or set up Actions first?
6. **Repository URL / owner**: we need a concrete GitHub URL for the repository metadata and the manual copy-command placeholders in the README.

## Out of Scope

- Publishing `@starter-docs/template` standalone (deferred; revisit if a consumer needs it without the CLI).
- Publishing skills as their own packages (deferred to v2 agentics work).
- Any marketing/launch activities (website, blog posts, tweets).
- CI/CD beyond the basic Actions publish pipeline described above.

## Next Steps

1. Answer the six decisions above.
2. Add LICENSE, repository metadata, and a CLI-focused `packages/cli/README.md`.
3. Execute the publish sequence once we're aligned.
