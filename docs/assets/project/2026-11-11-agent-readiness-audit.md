# Agent-readiness audit

Date: 2026-11-11. Base commit: `ff0b97dc71e50428d73ba7810c4bdb2bfa093680` on `main`. This audit asks whether an agent can change this repository and leave a pull request that a maintainer can merge without guessing.

## Verdict

The CLI itself is in good shape. On Node.js 24, with no product secrets, `npm ci`, `npm run build`, a non-interactive `setup` against a temporary directory, `npm run validate:defaults` after the pack copy, and `npm run smoke:pack` all succeeded. The merge button is still a poor signal. `main` requires a pull request and requires zero reviews and zero status checks. A clean `npm test` fails until an ignored template copy exists. Package-changing pull requests must match the already pinned 2.0.6 tarball digest. Docs-only and agent-instruction pull requests, including this one, get a green merge gate that did not run those tests.

## How to use this note

Read the verdict, the command table, and the prioritized fixes. The command table is the evidence. The fixes are written so a later agent can apply one without re-discovering the repository. This file does not change the product, the workflows, or the template.

## Where this file lives

Shared analysis belongs in `docs/assets/project/`. [Path and link hygiene](../../../.make-docs/system/references/path-and-link-hygiene.md) names that directory for optional, non-authoritative source and analysis inputs. The same directory already holds dated assessments such as [the 2.0.6 security review](2026-10-31-v2.0.6-security-review.md). This audit is the same kind of input. It is not a design, a plan, a PRD, a work backlog, or a guide.

The default lifecycle arc is design, plan, PRD, then work. This request skips that arc because it asks for one analysis file and forbids product, config, CI, and template edits. The [lifecycle reference](../../../.make-docs/system/references/lifecycle.md) treats `docs/assets/project/` as an input surface, not a stage. A history breadcrumb was not added. History records live under `.make-docs/archive/history/`, and this task allowed one new file under `docs/`.

## Human outcome

Impact: `direct` for the maintainer who decides whether an agent pull request is safe to merge.

The note is meant to show the current verdict, which commands passed, and the first fixes to hand off. It does not claim that merging agent pull requests is already safe. Exact commands and job names stay below so the verdict can be checked.

## 1. Clean-checkout commands

### Starting environment

The checkout had no `node_modules` and no `.cursor/environment.json`. The first `node` on `PATH` was v22.23.4. nvm had only that same v22.23.4 installed. `engine-strict` was `false`. `pnpm` 10.33.4 was on the Node 22 nvm prefix. `bun` was absent. `node:sqlite` loaded on both Node 22 and Node 24. No `NPM_` token, `MAKE_DOCS_HOME`, or other product secret was set. GitHub CLI auth existed for this agent and was not used by the product commands.

Node 24.22.3 was installed with nvm for the runs below and placed first on `PATH`. The stock Node 22 install was still executed once, because that is what a clean agent shell runs first.

### Results

| Command | Runtime | Exit | Duration | Result |
| --- | --- | --- | --- | --- |
| `npm ci` | Node v22.23.4, npm 10.9.9 | 0 | 2.21s | Installed 182 packages. `EBADENGINE` warned that `make-docs-monorepo` and `@brucewaynedecoy/make-docs` require Node `>=24`. npm audit reported 1 low and 1 moderate vulnerability. |
| `npm ci` | Node v24.22.3, npm 11.19.1 | 0 | 1.44s | Installed the same 182 packages with no engine warning. The same two vulnerabilities remained. |
| `npm run build` | Node 24 | 0 | 0.91s | `tsup` reported build success in 391ms. Target is `node24`. |
| `npm run dev` | Node 24 | 0 | 1.10s | Rebuilt the CLI, then ran it with the working directory `packages/cli`. It printed that no install was detected there and exited. It is not a file watcher. |
| `npm test` | Node 24 | 1 | 191.63s | Smoke-harness tests: 19 passed in 207ms. Vitest: 6 failed, 1990 passed, 6 skipped. Files: 2 failed, 109 passed, 1 skipped. Vitest duration 190.84s. |
| `npm run validate:defaults` before the pack copy | Node 24 | 1 | 0.83s | 6 failed, 47 passed. Same missing-template errors. |
| `node scripts/copy-template-to-cli.mjs` | Node 24 | 0 | 0.03s | Copied `packages/docs/template` to `packages/cli/template`. |
| `npm run validate:defaults` after the copy | Node 24 | 0 | 0.73s | 53 passed. |
| `npm test -w packages/cli -- tests/consistency.test.ts tests/template-links.test.ts` after the copy | Node 24 | 0 | 0.57s | 50 passed. The full 191s suite was not repeated. |
| `npm run smoke:pack` with `bun` absent | Node 24, pnpm present | 1 | 1.19s | Preflight stopped before packing. It named `bun (bun x)` and pointed at `npm run smoke:pack:local`. |
| `npm install --global bun` | npm 11.19.1 | 0 | 1.59s | Installed bun 1.4.4. npm warned that bun's install script was not covered by `allowScripts`. `bun --version` still ran. |
| `npm run smoke:pack` after bun was on `PATH` | Node 24, pnpm 10.33.4, bun 1.4.4 | 0 | 30.75s wall, harness 30.6s | Local checks 19.1s. Package runners 8.0s (`npx` 4.4s, `pnpm dlx` 2.3s, `bun x` 1.0s). Registry `https://registry.npmjs.org/`. |

Two extra checks, because CI and the maintainer guide run them and the root scripts do not:

| Command | Exit | Duration | Result |
| --- | --- | --- | --- |
| `bash scripts/check-instruction-routers.sh` | 0 | 0.76s | Instruction router check passed. |
| `npm exec -- tsc --noEmit -p packages/cli/tsconfig.json` | 0 | 6.52s | No type errors. |

Vitest also printed a non-failing warning that the Vite config uses features unsupported by `configLoader: 'native'`. That warning is in `packages/cli/vitest.config.ts`'s ecosystem, and it did not fail the run.

### Why `npm test` failed

The six failures are deterministic. They are not a flaky assertion. Each one is `ENOENT` for a file under `packages/cli/template/`, including `.make-docs/system/templates/design.md`, `.make-docs/system/prompts/coverage-pass-maintainer-guide.prompt.md`, and `.make-docs/system/contracts/commit-message-convention.md`. The failing tests are in [consistency.test.ts](../../../packages/cli/tests/consistency.test.ts) and [template-links.test.ts](../../../packages/cli/tests/template-links.test.ts).

[packages/cli/.gitignore](../../../packages/cli/.gitignore) ignores `template`. A clean checkout therefore has no copy. [scripts/copy-template-to-cli.mjs](../../../scripts/copy-template-to-cli.mjs) creates it, and `packages/cli`'s `prepack` script runs that copy before `npm run build`. CI's full test job runs `npm run prepack -w packages/cli` before `npm test`. The root `test` script and the documented local sequence do not. After the copy, `validate:defaults` and the two previously failing files passed.

The single full `npm test` run did not show a local flake. It did show that an agent who follows the README will see six failures before changing any product code.

### Built CLI against a temporary directory

`node packages/cli/dist/index.js --version` printed `2.0.6`. `--help` listed the seven commands and exited 0.

`setup --dry-run --yes --target <temp-dir>` and `setup --yes --target <temp-dir>` both exited 1 with `Codex is included but has no explicit method. Pass the matching method flag, including none to disable it.`

The same setup with an explicit headless plan exited 0. Dry run status was `planned` with 24 creates. Apply status was `complete`, and the isolated Store mutation was `applied`. The command was:

```bash
node packages/cli/dist/index.js setup --yes --json --target <temp-dir> \
  --codex-method none \
  --claude-code-method none \
  --github-copilot-method none \
  --no-skills \
  --project-resources none
```

Bare `node packages/cli/dist/index.js --target <temp-dir>` then reported the install, package `@brucewaynedecoy/make-docs@2.0.6`, capabilities `designs, plans, prd, work`, and the sentence that bare `make-docs` never syncs an existing install. `project state status --target-root <temp-dir> --json` returned `"status": "ready"` and `"nextAction": "No recovery is required."` `resource read make-docs://system/contract/commit-message-convention.md --target <temp-dir>` returned the commit convention. `MAKE_DOCS_HOME` and `HOME` pointed at the sandbox. `<user-home>/.make-docs` was still absent afterward.

`npm run smoke:pack` is the stronger end-to-end proof. It packed the CLI, ran the local install, backup, and uninstall checks, and ran `npx`, `pnpm dlx`, and `bun x` against that tarball. The packed candidate SHA-256 was `9e1520c49167eb731e4bac506d8ee2cdb968382815888ddd5eb1b270058a5674`, which matches [.github/release-candidates/v2.0.6.sha256](../../../.github/release-candidates/v2.0.6.sha256). The smoke also fetched the released 2.0.5 tarball from the npm registry because `MAKE_DOCS_RELEASED_205_TARBALL` was unset. The pnpm runner's own footer reported pnpm v12.18.0 while `pnpm --version` on `PATH` before the run was 10.33.4. Those runner steps still passed.

## 2. Environment and setup that an agent must know

Documented requirements:

- Node.js `>=24.0.0` in the root [package.json](../../../package.json) and in [packages/cli/package.json](../../../packages/cli/package.json). The README and [the local build guide](../maintainer/cli-development-local-build-and-install.md) say the same thing, and the README still says "Make Docs 2.0.4" in both quick-start sections while the package version is 2.0.6.
- npm, from the repository root. The README and the local build guide say `npm install`. CI uses `npm ci`. Both installs work. `npm ci` is the reproducible one.
- For `npm run smoke:pack` and `npm run smoke:pack:runners`: `npm`, `npx`, `pnpm`, `bun`, and a reachable npm registry. [The packaging guide](../maintainer/release-packaging-validation-and-release-reference.md) says this. A blocked registry should fail in seconds and point at `npm run smoke:pack:local`.
- The 2.0.5 checkout-move seed inside full smoke can use `MAKE_DOCS_RELEASED_205_TARBALL` for an offline tarball. Without it, smoke downloads `@brucewaynedecoy/make-docs` 2.0.5 from the registry.
- `MAKE_DOCS_HOME` overrides the global Store at `<user-home>/.make-docs`. Tests and smoke set their own sandboxes. Ordinary `npm test` does not need a pre-existing Store.

Undocumented or easy to miss:

- There is no `.nvmrc`, `.node-version`, or cloud-agent environment file. This VM did not put Node 24 first on `PATH`.
- `engine-strict` is false, so Node 22 installs the repository and only warns.
- `packages/cli/template` must exist before `npm test` and `npm run validate:defaults`. `prepack` creates it. The root test script does not.
- Root `npm run dev` is `npm run dev -w packages/cli`, and that script is `npm run build && node dist/index.js`. npm runs the workspace script in `packages/cli`, so a bare dev run does not see the repository-root install and does not accept a useful target unless the workspace script is invoked with `--target`.
- Headless `setup --yes` requires harness method flags. `--no-skills` and `--project-resources none` keep the temporary install small.
- `bash scripts/check-instruction-routers.sh` and `npm exec -- tsc --noEmit -p packages/cli/tsconfig.json` are real gates. The first is in the README and the maintainer guide. The second is in CI. Neither is a root `package.json` script, and neither is named in `AGENTS.md`.
- npm 11 may skip bun's install script unless the agent passes `--allow-scripts=bun`. In this run the binary still executed.
- Changing packed bytes requires editing `.github/release-candidates/v2.0.6.sha256` or the package-candidate job fails. That requirement is in the workflow and in [RELEASING.md](../../../RELEASING.md). It is not in the agent routers.

No product secret is required to install, build, test, validate, pack, or smoke-test.

## 3. CI in `.github`

Two workflows live in the repository.

[Platform safety](../../../.github/workflows/platform-safety.yml) runs on `pull_request` and `workflow_dispatch`. Permissions are `contents: read`. Node 24 and `npm ci` are used in every job that builds.

The `changes` job sets `package=true` for a manual run. On a pull request it runs `git diff --quiet HEAD^1 HEAD` for `packages/cli`, `packages/docs/template`, `packages/skills`, `scripts`, `package.json`, `package-lock.json`, `.github/workflows`, and `.github/release-candidates`. Any other diff, including `docs/`, `.make-docs/`, `AGENTS.md`, `CLAUDE.md`, and `README.md`, sets `package=false`.

When `package=true`, three more layers run:

- `platform-contract` on `ubuntu-latest`, `macos-latest`, and `windows-latest`. It typechecks `packages/cli`, builds the CLI, and runs a named subset of Vitest files. Windows adds `--no-file-parallelism --maxWorkers=1`. The subset includes installation, Store, harness, and ownership tests. It does not include `consistency.test.ts` or `template-links.test.ts`.
- `package-candidate` on Ubuntu. It runs `prepack`, the smoke-harness tests, the full CLI Vitest suite, and `validate:defaults`. It then packs with `npm pack --ignore-scripts` and requires the tarball SHA-256 to equal `.github/release-candidates/v<package version>.sha256`. The current version is 2.0.6, so every package-path pull request is compared with the current release pin. The job uploads artifact `w22-p6-package-candidate`.
- `installed-package` on the three operating systems, then `compare-installed-package`. They upload `w22-p6-evidence-<platform>` and `w22-p6-platform-comparison`.

`pr-merge-gate` always runs. If `package=true`, every layer above must succeed. If `package=false`, the gate succeeds when change detection succeeded. A docs-only pull request therefore gets a green "PR merge gate" that did not build or test.

[Publish npm package](../../../.github/workflows/publish-npm.yml) runs only on `release: published`. It checks that the tag is on `main` and matches `packages/cli/package.json`, rebuilds and tests, packs, and requires the same digest file for the tag. It stages the package with npm OIDC and provenance. It does not use an npm token. A maintainer still approves the staged package with two-factor authentication. This workflow is not a pull-request check.

GitHub also lists dynamic workflows `Dependabot Updates` and `CodeQL`. CodeQL is not a file in `.github/workflows`.

What CI covers well: a package-path change is built on three operating systems, fully tested on Ubuntu after `prepack`, packed, and installed from that exact tarball on three operating systems.

What CI misses:

- Docs, dogfood `.make-docs/`, root agent instructions, and the README.
- The instruction-router script.
- A typecheck inside the job that runs the full suite. Typecheck exists only on the platform-contract matrix.
- Any signal that distinguishes a release-pin mismatch from a test failure. Both fail the same candidate job.
- Pull-request coverage for CodeQL. On the eight open Dependabot pull requests the CodeQL check was `NEUTRAL` or skipped.

Rulesets, read on 2026-11-11:

| Ruleset | Target | Effect |
| --- | --- | --- |
| [Protect main](https://github.com/brucewaynedecoy/make-docs/rules/23997513) | `refs/heads/main` | Blocks deletion and non-fast-forward pushes. No bypass actors. |
| [Require PR on main](https://github.com/brucewaynedecoy/make-docs/rules/24027685) | `refs/heads/main` | Requires a pull request. `required_approving_review_count` is 0. Code-owner review is off. Stale-review dismissal is off. No required status checks. |
| [Keep release tags fixed](https://github.com/brucewaynedecoy/make-docs/rules/23998132) | `refs/tags/v*` | Blocks tag deletion and non-fast-forward tag updates. |
| [Owner creates release tags](https://github.com/brucewaynedecoy/make-docs/rules/23998136) | `refs/tags/v*` | A `creation` rule. The API returned `bypass_actors: null`. Confirm who can still create a `v*` tag before relying on this name. |

The classic branch-protection endpoint returned HTTP 403 for this token. [RELEASING.md](../../../RELEASING.md) already says GitHub does not require an approval or a passing check to merge. The ruleset above matches that sentence. [CODEOWNERS](../../../.github/CODEOWNERS) is `* @brucewaynedecoy @maybebyte @danbednarski` and is not enforced.

## 4. Previews and other verifiable artifacts

There is no pull-request preview environment, no GitHub Pages workflow, and no rendered docs site. Docs are Markdown in the repository.

When package paths change, Actions stores three useful artifacts: the packed tarball plus `candidate.json`, per-platform installed-package JSON, and the comparison JSON. They are run artifacts. They are not posted on the pull request. The full Vitest log is only the job log. There is no JUnit or HTML test report.

The cheapest addition is not a docs site. Extend the existing workflow so every pull request runs the router check and `make-docs project path-hygiene validate`, and write the short Vitest summary into the job summary. Keep uploading the tarball for package-path pulls. A rendered site would cost a new publishing pipeline for a repository whose docs are already the review surface.

## 5. Review bots and dependency automation

[dependabot.yml](../../../.github/dependabot.yml) updates npm at `/` weekly, on Monday at 09:00 `America/Chicago`, with `open-pull-requests-limit: 5`. There are no groups, reviewers, or ignore rules. Security updates do not share that limit of 5, which is why eight pull requests can be open together.

No human review is recorded on those eight pulls (`reviewDecision` empty). CodeRabbit is installed. On Dependabot it reports that a bot user is not eligible for review, and the check is either `SUCCESS` with that skip or `SKIPPED`. CodeQL does not fail the pull request. This audit did not see Cursor Bugbot or another required review app in the check rollup. The code-scanning and Dependabot alert APIs returned HTTP 403, so the open-alert counts from [the 2.0.6 security review](2026-10-31-v2.0.6-security-review.md) were not refreshed. That review recorded its snapshot at `4a77c26c` and counted 36 open CodeQL alerts. It described the same moderate Hono and low esbuild issues that `npm audit` still reports.

Fresh `npm audit` on this checkout: 0 critical, 0 high, 1 moderate, 1 low.

- Moderate: `@hono/node-server` `1.19.10 - 2.1.2`, `serveStatic` decodes the request path a second time. The locked tree is still in that range. Pull request 57 bumps it to 2.1.5.
- Low: `esbuild` `0.27.3 - 0.28.0`, development-server file read on Windows. Pull request 53 bumps esbuild together with tsup and tsx.

The 2.0.6 security review judged that the shipped CLI does not start those servers. That judgment can stay true while the green security pulls stay unmerged. This audit did not repeat the hostile-input review.

## 6. The eight open Dependabot pull requests

Observed 2026-11-11. "Gate" is the latest `PR merge gate` conclusion. None of these pulls has a human approving review.

| Pull | Update | Opened | Mergeable | Gate | What an agent should notice |
| --- | --- | --- | --- | --- | --- |
| [#57](https://github.com/brucewaynedecoy/make-docs/pull/57) | `@hono/node-server` 1.19.17 to 2.1.5 | 2026-11-01 | yes | pass | This is the moderate advisory bump. CI is green. It is unmerged. |
| [#53](https://github.com/brucewaynedecoy/make-docs/pull/53) | esbuild, tsup, and tsx | 2026-10-26 | yes | pass | Covers the low esbuild advisory. Dev-tool bump, green, unmerged. |
| [#47](https://github.com/brucewaynedecoy/make-docs/pull/47) | `fast-uri` 3.1.8 to 3.1.9 | 2026-10-25 | yes | pass | Dependabot marks it as a security release. Green, unmerged. |
| [#44](https://github.com/brucewaynedecoy/make-docs/pull/44) | `body-parser` 2.3.0 to 2.4.0 | 2026-10-25 | yes | pass | Release notes cite CVE-2026-111181. Green, unmerged. |
| [#36](https://github.com/brucewaynedecoy/make-docs/pull/36) | `source-map-js` 1.2.1 to 1.2.2 | 2026-10-18 | yes | fail | Windows installed-package failed after about 20 minutes with Vitest `Timeout calling "onTaskUpdate"`. Ubuntu and macOS installed-package passed. |
| [#35](https://github.com/brucewaynedecoy/make-docs/pull/35) | `proxy-addr` 2.0.7 to 2.0.8 | 2026-10-17 | yes | fail | macOS platform-contract failed one test. Ubuntu and Windows platform-contract passed, so the installed-package matrix was skipped. |
| [#33](https://github.com/brucewaynedecoy/make-docs/pull/33) | `@types/node` 24.12.0 to 26.6.4 | 2026-10-05 | yes | pass | Types move to Node 26 while `engines` stays Node 24. Green CI is not a reason to merge a types major by itself. |
| [#19](https://github.com/brucewaynedecoy/make-docs/pull/19) | TypeScript 5.9.3 to 7.0.2 | 2026-09-25 | conflicting | pass on an older run | Major compiler bump. It conflicts with current `main`. |

The macOS failure on [#35](https://github.com/brucewaynedecoy/make-docs/pull/35) is `tests/installation-state.test.ts` > `Store-owned installation safety` > `keeps shared Store sessions safe under 20 processes and five checkouts`. The assertion was `InstallationStateError: Checkout writer 6336 stopped. Inspect project state status before recovery. No project files changed.` That test is about Store writers, not about `proxy-addr`. The Windows failure on [#36](https://github.com/brucewaynedecoy/make-docs/pull/36) is a worker timeout, and that job already uses the Windows one-worker flags. This audit did not rerun those GitHub jobs. Treat them as unresolved red signals, not as proof that those two dependency bumps are unsafe, and not as proof that the tests always fail.

Current handling is: Dependabot opens the pull request, CI usually runs the full package proof, and nobody merges it. Green security bumps and red unrelated-looking jobs sit in the same queue.

## 7. Gaps in AGENTS.md and CLAUDE.md

The managed blocks in [AGENTS.md](../../../AGENTS.md) and [CLAUDE.md](../../../CLAUDE.md) match, which is why the router check passes. Both files then carry the maintainer dogfood rule and the pointer to [developing-deterministic-agentic-twins.md](developing-deterministic-agentic-twins.md). Those parts are accurate and useful. They do not tell an agent how to prove a change.

Missing from both routers:

- Use Node 24 as the `node` on `PATH` before `npm ci`. A Node 22 install succeeds with a warning.
- Run `npm ci` from the root, then `npm run build`, then `npm test`. Before `npm test`, run `node scripts/copy-template-to-cli.mjs` or `npm run prepack -w packages/cli`, until the test script does that itself.
- Run `npm run validate:defaults` and `bash scripts/check-instruction-routers.sh` for docs, template, and router edits. Run `npm exec -- tsc --noEmit -p packages/cli/tsconfig.json` for CLI TypeScript. Run `npm run smoke:pack` only when packaging or install behavior changes, and only with pnpm, bun, and registry access.
- Root `npm run dev` rebuilds and executes inside `packages/cli`. Exercise the built CLI with `node packages/cli/dist/index.js` and an explicit `--target`.
- Headless setup needs `--codex-method`, `--claude-code-method`, and `--github-copilot-method`. `none` is a valid method.
- A package-path pull request is compared with `.github/release-candidates/v2.0.6.sha256`. Update that file only when the package version changes. Do not refresh it to silence the job on an ordinary code change.
- A green `PR merge gate` on a docs-only pull request means change detection ran. It does not mean tests ran.
- Commit messages need a subject, one blank line, and one body paragraph. The contract is [.make-docs/system/contracts/commit-message-convention.md](../../../.make-docs/system/contracts/commit-message-convention.md). Do not invent a wave coordinate.

`CLAUDE.md` adds a section that tells the agent to use the jcodemunch and jdocmunch MCP servers and to reindex before falling back to file reads. Those servers are not configured in this repository, and they were not available in this run. An agent that obeys that section can stall on a missing index. `AGENTS.md` does not mention them, so the two harness files disagree outside the managed block.

The README's local command list omits the template copy, still says `npm install`, and still says version 2.0.4. The local build guide's `npm test -w packages/cli` has the same missing-copy gap. An agent that trusts those docs will reproduce the six `ENOENT` failures and may "fix" a template that was never supposed to be present until pack time.

## 8. Prioritized fixes

Effort is the size of the change, not a calendar estimate. Apply them in the order below. The ruleset change is last on purpose.

### P0. Make a clean `npm test` pass

Why: the first command an agent runs after build currently fails for a reason that is not the agent's diff. That trains the agent to edit tests or to ignore red output.

Change [packages/cli/package.json](../../../packages/cli/package.json) so the `test` script runs `node ../../scripts/copy-template-to-cli.mjs` before `vitest run`. Leave `packages/cli/.gitignore` as it is. `template` is already ignored. Update the command lists in [README.md](../../../README.md) and [the local build guide](../maintainer/cli-development-local-build-and-install.md) so they describe that `npm test` prepares the copy. Do not start committing `packages/cli/template`.

Verify: delete `packages/cli/template` if it exists, run `npm test` from the root on Node 24, and expect the six former `ENOENT` tests to pass with the rest of the suite. On this machine the suite took about 191 seconds before those six failed.

### P0. Separate the release digest from ordinary pull-request proof

Why: [platform-safety.yml](../../../.github/workflows/platform-safety.yml) fails `package-candidate` when the packed SHA-256 differs from `.github/release-candidates/v<version>.sha256`. Today's main matches `v2.0.6`. The next real CLI change will not. An agent will either fight the red job or overwrite the release pin in the same pull request, which makes the pin a hash of the unreleased pull request.

Change the candidate job so pack, full tests, and artifact upload still run for every package-path pull request. Run the digest comparison only when the pull request changes the `version` in `packages/cli/package.json` or changes `.github/release-candidates/`. Say that rule in the root `AGENTS.md` and `CLAUDE.md` maintainer sections.

Verify: a comment-only edit under `packages/cli/src` should be allowed to pass the candidate job when tests pass, even though the tarball hash changes. A version bump that does not add the matching digest file should still fail.

### P0. Test docs and instructions on every pull request, then require the gate

Why: this audit's own pull request is the example. Its diff is under `docs/`, so today's merge gate can be green without running a test. Independently, [Require PR on main](https://github.com/brucewaynedecoy/make-docs/rules/24027685) allows a merge with failing checks and with zero reviews. [CODEOWNERS](../../../.github/CODEOWNERS) does not change that.

First, add a `docs-contract` job to [platform-safety.yml](../../../.github/workflows/platform-safety.yml) that runs on every pull request. Use Node 24 and `npm ci`. Run `bash scripts/check-instruction-routers.sh`. Build or `prepack` the CLI, then run `node packages/cli/dist/index.js project path-hygiene validate`. Make `pr-merge-gate` require this job when `package=false` and when `package=true`. Do not require the three-operating-system package proof for a docs-only diff.

After that job is visible on a docs pull request, edit ruleset `24027685` so `required_approving_review_count` is 1 and the required status check is `PR merge gate`. Leave code-owner review off unless the three CODEOWNERS handles should be the only approvers. Do not flip the ruleset first. Today's gate would become a required check that still skips docs.

Verify: this class of docs pull request shows `docs-contract` in the checks. A pull request that breaks a managed-block pair fails the router script. A package pull request still runs the existing matrix.

### P1. Pin the toolchain the agent actually runs

Why: this environment installed the repository on Node 22, warned, and would have built the wrong target if the shell had not been corrected. `smoke:pack` failed in 1.19 seconds because bun was missing. pnpm was installed only under the Node 22 prefix.

Add a root `.nvmrc` containing `24`. Add an `.npmrc` with `engine-strict=true` so `npm ci` fails on Node 22 instead of warning. Add a cloud-agent environment install that puts Node 24 first on `PATH` and installs pnpm and bun. On npm 11, install bun with `npm install --global --allow-scripts=bun`. Put those prerequisites in both root agent files, outside the managed block, with the same wording. The router check compares only the managed block, so a fact that lives in `CLAUDE.md` alone will not reach every harness. Remove or narrow the jcodemunch and jdocmunch paragraph so a missing MCP server does not block reading the repository. Keep it only as an optional accelerator when those servers are actually configured.

Verify: a new shell whose `node -v` is 22 fails `npm ci` immediately. A shell that honors `.nvmrc` can run `npm test` and, with bun and pnpm present, `npm run smoke:pack`.

### P1. Resolve the macOS and Windows reds before treating them as dependency failures

Why: [#35](https://github.com/brucewaynedecoy/make-docs/pull/35) and [#36](https://github.com/brucewaynedecoy/make-docs/pull/36) are red for reasons that do not mention the bumped packages. If the merge gate becomes required, a flaky red check teaches people to merge through it.

Re-run the failed jobs, or check out each branch and run `tests/installation-state.test.ts` on macOS and the installed-package proof on Windows. The test name to start from is `keeps shared Store sessions safe under 20 processes and five checkouts` in [installation-state.test.ts](../../../packages/cli/tests/installation-state.test.ts). The Windows log's error is Vitest `Timeout calling "onTaskUpdate"` even with `--no-file-parallelism --maxWorkers=1`. If a rerun passes, add a bounded retry or shrink the 20-process case and record why. If a rerun fails the same way, fix the Store writer behavior. Do not delete the test to clear Dependabot.

### P2. Decide what happens to the eight Dependabot pulls

Why: the weekly limit of 5 is not the queue you have. Four green security-related bumps (#57, #53, #47, #44) are waiting. Two majors (#33, #19) are a different decision. Two reds (#36, #35) are mixed with possible test flakes.

In [dependabot.yml](../../../.github/dependabot.yml), set a reviewer, group patch and minor lockfile updates, and leave major updates such as TypeScript and `@types/node` ungrouped. Add a short paragraph to [the packaging guide](../maintainer/release-packaging-validation-and-release-reference.md): merge a green lockfile-only security bump after reading the advisory, and do not merge a compiler or `@types/node` major on a green gate alone. Turn on auto-merge only after the P0 ruleset requires one human review and the corrected gate. Until then, auto-merge would publish dependency changes with no reviewer.

### P2. Correct the README version and the dev entry

In [README.md](../../../README.md), change the two "Make Docs 2.0.4" quick-start sentences to 2.0.6. The template tree has no matching README sentence, so this is dogfood text at the repository root.

For `dev`, either document the current behavior in the agent files or change the root script so `npm run dev -- --help` runs `node packages/cli/dist/index.js` from the repository root. Today the root script delegates to the workspace, and the workspace script does not forward a target unless it is invoked as the maintainer guide shows.

### P2. Stop counting neutral bots as review

CodeQL's neutral or skipped check is not a scan result. CodeRabbit's success line on a Dependabot pull request is a skipped bot review. Until CodeQL is configured to fail on new findings, say in the agent files that those two checks are informational. Re-read code-scanning alerts with a token that can see them before closing the 36-alert count from the 2.0.6 security review.

## Limits

Commands ran once, on Linux, in this agent VM. The full Vitest suite was not repeated after the template copy. The six failing tests and `validate:defaults` were repeated and passed. macOS and Windows were not rerun locally. The failed Dependabot jobs were read from their logs and not re-executed. Classic branch protection and the alert APIs returned 403. Ruleset JSON was readable. `smoke:pack` passed only after bun was installed. The earlier 1.19s failure is the clean-VM result.
