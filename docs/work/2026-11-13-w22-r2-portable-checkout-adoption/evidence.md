---
title: "W22 R2 Portable Checkout Adoption Evidence"
kind: "work"
status: "active"
coordinate: "W22 R2"
---

# W22 R2 Evidence

## Current 2.0.6 Package Check

An isolated test used the globally installed Make Docs 2.0.6 CLI. Store A installed a project with all four local resource types. The test committed those files and cloned the project. A separate configured Store B had no record for the cloned project. The test used no harness method. It changed one router managed block and one resource body before the commit.

- Store B status returned `ownership-unverified` before and after the failed setup.
- Checkout registration preview returned `blocked` before and after the failed setup.
- Non-interactive dry run returned `planned` with two `skip-conflict` actions among 86 planned files.
- The matching apply returned `blocked` with `ambiguous-ownership` and the same two `skip-conflict` actions.
- Git status of the clone stayed clean.
- A separate exact-file clone completed setup in Store B and stayed clean in git.

This test confirms conflict and dry-run drift. It does not reproduce the owner's later `unregistered` and `bound` pair. It does not test saved MCP method selection. It does not explain the three resource differences on the owner's machine. The temporary fixture and Store were kept outside this repository.

## Remaining Evidence

The candidate package and automated two-Store release check are recorded below. P3 still needs the full negative-case set and the owner's real second-machine check. The cause of the owner's three changed resource bodies remains unknown.

## 2.0.7 Candidate: Plain Setup Choice Gate

The candidate CLI workspace and lock entry now say `2.0.7`. `npm pack --dry-run --json`, with a temporary npm cache, reported `@brucewaynedecoy/make-docs` version `2.0.7` and a 141-file package. A real `npm pack` made `brucewaynedecoy-make-docs-2.0.7.tgz` under a temporary path. Its extracted CLI reported `2.0.7`. This proves package build and version, but does not prove publication.

The two-Store regression in `packages/cli/tests/w22-r2-portable-adoption.test.ts` installs project A with all four resource types, commits it, clones it, and configures a separate Store B. The test removes the new resource-selection field before commit to model a 2.0.6 config. It changes one router block and one resource body. Before adoption, status and checkout preview report `portable-unregistered`.

- Plain setup, `setup --yes`, dry run, and `setup --dry-run --yes` return blocked. Each result names `make-docs setup --adopt --yes`. The Store database digest and checkout row count stay fixed. Git stays clean.
- Interactive dry run offers Adopt this checkout, Continue with normal setup, and Cancel. The selected adopt and normal paths each show a project plan. Cancel makes no checkout change.
- `setup --adopt --yes` completes. Store B has one checkout under Store A's project ID. Changed files stay in git. Repeat setup keeps one checkout and a clean git status.
- Adoption keep dry run returns planned with preserved files. Adoption overwrite dry run blocks because the new Store has no prior managed ownership proof. Plain setup with conflict flags still stops for the path choice.

The focused CLI, install, config, Store state, W22 R1 ownership, W22 R0 P8 reinstall, and W22 R2 adoption set passed 298 tests with one skip before the latest plain-setup gate. The new plain-setup and interactive tests passed after that gate. The stable full CLI package suite passed: 112 test files passed, one file was skipped, 2,000 tests passed, and six tests were skipped. It ran with the source held steady and returned exit code zero. TypeScript and `git diff --check` passed. The PRD authority validator passed 35 PRDs, 644 Markdown files, and 1,232 links with zero diagnostics. The owner's three changed resource bodies and saved MCP method case remain unverified in a real second-machine session.

The extracted 2.0.7 package ran against a fresh clone made by the installed 2.0.6 CLI and a separately configured Store B. Plain setup, `--yes`, and plain dry run each returned blocked with `make-docs setup --adopt --yes` as the next action. Explicit adopt dry run returned planned. `setup --adopt --yes` completed. Store B status became ready, checkout preview became bound, and git status stayed clean. Package dependencies were resolved from this workspace for this temporary proof. No live user Store was changed.

The first local 2.0.7 tarball and GitHub package-candidate job each produced SHA-256 `3b02f72243b35209dcdf429da19c896feb6d97b78348ffc6f3d8af92a0303433`. The first PR check stopped at the missing digest file after its build and tests passed. Review fixes then changed package bytes. A second local candidate produced `4ce1d6fec14d90d82662620d7c5c7b872692ed197fe10c2b3c8ee03adca5de64`. A further router replacement fix changed package bytes again. Two local packs of the final reviewed candidate produced SHA-256 `f59e536509ff47b42bc5ce87a92e0953b173dffe9482720eea28e30abc44dc73`. The reviewed digest in `.github/release-candidates/v2.0.7.sha256` names that candidate. A new CI run must match it and pass the installed-package gates before merge.

PR review found that a later setup could refresh a router kept as project-owned and that migration could drop a reviewed resource choice while rebuilding project config. Both paths now preserve the reviewed state. A follow-up review found that router preservation also blocked explicit replacement; the planner now permits a reviewed replace and keeps outside text. Focused migration and adoption tests passed 39 tests after these fixes. The user guide now states that the portable checkout result requires a configured Store. The owning PRDs now distinguish ordinary export-and-replace from adoption batch overwrite, and PRD 15 states when adoption reuses a target checkout binding.

## Human Experience Review

Reviewer: implementing agent. The 2.0.7 candidate gives the user a clear path choice before plain setup writes. The interactive test shows the three choices and a plan for each selected setup path. The blocked batch result names a command the user can run. The packaged two-Store run confirms that explicit adoption keeps the project ID and a clean git checkout. This review covers the tested CLI and JSON paths. It does not prove the owner's MCP host flow or explain the three changed resource bodies. The next action is to run the remaining P3 negative cases and confirm the installed-package CI gates before release.

## 2.0.8 Candidate: First Saved-Choice Sync

The 2.0.7 release was published before this follow-up. The owner reported that an Ursa checkout adopted with 2.0.7 kept its project ID and git clean, but a bare dry run then reported 17 modified files and four new router conflicts. The exact Ursa adopt flags and three resource body causes remain unverified. Source review found two causes: compatibility accepted only managed router and resource proof, and the adopt planner omitted existing archive and assets routers until a later sync.

The W22 R2 test now installs with Store A, commits and clones the project, and configures Store B. It uses MCP methods with temporary host homes. It changes 14 valid router blocks and three resource bodies, and adds the four reported archive and assets routers. `setup --adopt --yes` keeps the original project ID and leaves git clean. A bare `setup --dry-run --json` immediately after adoption returns `planned`; every project action is `noop`. The Store manifest marks sampled kept routers and resources `project-owned`. Audit preserves those files. A later edit to one kept resource makes bare dry run return `blocked`. A direct planner test checks all four on-demand routers in both plans.

PR review found that an adopted assets router without managed-block markers could receive an inserted block despite a keep choice. The planner now leaves that file unchanged and omits its managed proof. A regression test applies that plan and checks both the file and Store manifest.

The focused compatibility, audit, install, and adoption run passed 104 tests. The full CLI run passed 112 test files and 2,004 tests; one file and six tests were skipped. TypeScript, `git diff --check`, and PRD authority validation passed. The PRD validator scanned 35 PRDs and returned zero diagnostics. The packed CLI reports `@brucewaynedecoy/make-docs` version `2.0.8`. Two packs of the final candidate produced SHA-256 `dec5486eed14ca13cab81670a21185ba87fbe61834f2cd8b1b63670175d6d084`, recorded in `.github/release-candidates/v2.0.8.sha256`.

An extracted copy of that tarball ran the same two-Store path with temporary MCP host homes. Adoption completed under the saved project ID. The first bare dry run returned `planned` with 90 `noop` actions and no other action. Store B status was `ready`, and git was clean. The extracted CLI reported `2.0.8`. Package dependencies were resolved from the workspace for this temporary proof.

This is local candidate proof. It does not show an installed 2.0.8 run on Ursa, a CI result, or a published package. D-051 stays open until that release check passes.
