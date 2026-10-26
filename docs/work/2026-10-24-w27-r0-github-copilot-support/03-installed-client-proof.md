---
title: "Phase 3: Installed Client Proof"
kind: "work"
status: "complete"
coordinate: "W27 R0 P3"
source:
  type: "prd"
  path: "docs/prd/28-shared-agentics-installation-and-harness-exposure.md"
---

# Phase 3: Installed Client Proof

## Purpose

Prove each claimed Copilot surface and close the W27 R0 human promises.

## Overview

Use [the P3 plan](../../plans/2026-10-24-w27-r0-github-copilot-support/03-installed-client-proof.md). Run from a built package. Keep tests in a disposable profile. An installed connection needs its own separate reviewed change.

## Human Experience Outcome

A user can select Copilot, inspect one setup change, then use Make Docs in the CLI or app that has direct proof. A blocked result gives one action. The executor is the testing agent. Evidence is a redacted real-client trace. Human Experience Review compares each promise with the observed flow and names limits. Offer a short optional normal-use handoff when complete.

## Current Testing Decisions

- Automated Implementation Testing: `required` for all changed setup and policy code.
- Performance Testing: `not-needed-now`; report startup failure or hang as a functional defect.
- Guided Progress Review: `required` for the support-label matrix and rollback evidence.
- Unassisted Goal Testing: `revisit`; select it only if a real setup flow exposes a question that direct proof cannot settle.
- Human Experience Review: `required` for each direct promise.

## Source PRD Docs

- [PRD 28](../../prd/28-shared-agentics-installation-and-harness-exposure.md).
- [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md).
- [PRD 38](../../prd/38-global-store-and-project-state.md).

## Stage 1 - Real Client Matrix

### Tasks

- [x] t1: Run a real Copilot CLI session from the built package. Record tool discovery, allowed Store read, denied operation, Store-free resource read, and sandbox result.
- [x] t2: Run the same matrix in the GitHub Copilot app. Record its separate native source and result.
- [x] t3: Check trusted and untrusted project entry behavior, same-name precedence, and shared skill discovery.
- [x] t4: Dispose of direct Copilot CLI and app checks on Windows and Linux for the 2.0.5 scope. The owner cannot run them before release and accepted macOS as the only tested client platform. No Windows or Linux Copilot client test passed; CI contract checks do not replace one.

### Acceptance criteria

- Each support label has its own installed-client evidence.
- A denied Store call does not stop a Store-free resource call.
- The current native entry and grants, not a receipt, decide access.

### Dependencies

- P2 packaged build.

## Stage 2 - Recovery And Review

### Tasks

- [x] t5: Prove repeat setup, drift detection, reviewed repair, key rotation, removal, and rollback in a disposable profile.
- [x] t6: Compare the real setup text with the Human Experience promises. Record observation, conclusion, limit, and next action for each.
- [x] t7: Run build, type, focused tests, packaging checks, and link checks. Record exact results.
- [x] t8: Prepare the PR review packet and the 2.0.5 release notes. Separate approval was given for the W27 push and PR; PR #42 was merged. Release publication remains separate.

### Acceptance criteria

- Unrelated servers and user-owned files survive repair and removal.
- The old key stops working after rotation.
- The packet names every blocked claim and required next action.

### Dependencies

- Stage 1.

## Current Evidence and Blockers

The installed Copilot CLI was version `1.0.102` at the first probe and `1.0.103` at the live tests on macOS. The first direct test used an organization-managed Copilot sign-in. Copilot blocked `make-docs` and two other MCP servers by policy before they connected. Its shell and `mcp2cli` fallback did not prove direct MCP access. The owner then reported a new personal Copilot Free sign-in as `doyoucrm`. The CLI event stream did not independently show the account name. GitHub states that [enterprise and organization MCP policies can restrict Copilot CLI servers](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-mcp-servers).

On 2026-10-24, the built W27 package completed setup in a disposable home, project, and Store. It wrote one temporary `mcpServers.make-docs` entry and a matching project grant. The personal CLI session connected to that server and loaded 43 tools. A direct `project_status` call returned `ready` for the granted project. The same tool refused a different disposable project with `store-not-configured`. A changed test key produced `store-denied`. In that same changed-key session, a direct `resource_read` call for the lifecycle reference succeeded. Copilot used MCP tools for these calls. No shell fallback counted as proof.

The one-session Copilot sandbox first denied the built server path inside the W27 worktree. A copy of the same built runtime inside the disposable project started. The sandbox then denied the sibling test Store. With `--add-dir` for that disposable Store, the sandboxed direct `project_status` call returned `ready`. This proves the bounded sandbox path. It does not prove that every installed executable and Store path works with the default sandbox policy. The temporary runtime, Store, connection keys, and raw CLI event files stayed outside Git and were removed after this record was updated.

The installed GitHub Copilot app was version `1.1.30` at the first macOS check and version `1.1.32` at the direct test. Its Installed list showed one Railway MCP server and no Make Docs server. The Railway entry had its own sign-in error. No installed MCP entry was changed.

On 2026-10-24, the owner switched the app's default account to `doyoucrm`. The disposable folder initially kept `brucewaynedecoy` as its selected account, so the test changed that folder alone to `doyoucrm`. A folder-local `.mcp.json` named `make-docs-w27-app-test` pointed to a copy of the built W27 runtime. Folder trust was approved for this test. The first start failed because the copy lacked `@modelcontextprotocol/sdk`. After the installed package's dependency tree was copied into the disposable folder, the app reported the folder server as Connected. In a sandboxed local session with network and Git credentials blocked, Copilot called `project.state.status` and received `store-not-configured` for the ungranted folder. It also called `resource.read` for a short template and reported the first heading, `# 04 Glossary`, with `store: none`. The lifecycle resource call also succeeded, but the app saved its 28.9 KB result to a temporary file and the model did not read the heading. These calls prove direct app MCP access and Store-free resource access through the disposable folder entry. They do not prove CLI user-entry reuse or a Store grant in the app.

The owner approved read and write access to the sibling disposable Store for this test. The built W27 setup created a temporary Copilot CLI entry and project grant. Its key was copied only to the folder-local app entry. The app showed that entry as Connected and marked its source as Folder. The folder used the `doyoucrm` account. Its new-session sandbox allowed only the project and sibling Store, with internet, local network, Git credentials, and GitHub CLI credentials blocked. In a fresh app session, a direct `project.state.status` call returned `ready` for the granted project. A direct call for another path returned `store-not-configured`. A direct `resource.read` call then returned `# 04 Glossary` with `store: none`. This completes the app Store read, wrong-target refusal, and Store-free resource checks on macOS. It does not prove reuse of the CLI user entry, same-name source precedence, or app Skill discovery.

After the test, the added Store path was removed from the app sandbox settings. The disposable folder and its sessions were removed from the app. Its saved trust path, runtime, Store, and key were removed from the host. No real Copilot CLI entry or installed app MCP entry changed.

In a second disposable test on 2026-10-24, the owner approved a temporary change to the installed Copilot CLI MCP file. Its starting file held only the Railway entry. The test saved the exact original bytes and mode, then added one `make-docs` CLI user entry with a disposable key. The app's Installed list showed Make Docs as Connected. With no folder MCP file, a direct app `project.state.status` call returned `ready` for the granted project. This proves that the app used the CLI user entry on this macOS host.

The test then added a same-name project `.mcp.json` entry with the same connection ID and a different disposable key. While the folder was untrusted, a fresh app session still returned `ready` through the CLI user entry. After the folder was trusted, the app showed the folder entry as Connected. A fresh direct call returned `store-denied`. The changed key makes that result distinct from the CLI user entry's `ready` result. This proves project entry precedence after trust for this app version. It does not test a same-name entry added through the app's Customize path.

The disposable project also held a copy of the shipped `preflight` Skill under `.agents/skills`. The app's folder settings listed it as enabled. A trusted app session showed `Loaded skill preflight` and returned its first section heading, `Start with the request`. This proves shared project Skill discovery in the app on macOS.

The test removed the added Store path and the folder with its sessions. It restored the installed CLI MCP file byte for byte, including its original mode. Its SHA-256 returned to `6daf5822aa319785eaf5768c0c1fa5c1a547b87f35823ed3cef82f296d2b9b23`. The app's Installed list again showed only Railway. The saved folder trust, runtime, Store, keys, Skill copy, and backup were removed. No app-added MCP entry changed.

The built Make Docs server also passed a local MCP SDK check with tool discovery, a Store-free resource call, an allowed project status call, and a denied wrong-target call. `copilot skill list --json` found a disposable project Skill in `.agents/skills`. The CLI and app tests now agree on untrusted project behavior. No Windows or Linux claim has direct evidence.

The owner approved the named data transfer for the direct CLI check. The personal Copilot CLI and the app now have direct-call evidence on macOS. The organization-managed CLI seat remains policy-blocked. App-added entry conflicts and other host platforms remain unproved.

## Human Experience Review

The implementation agent reviewed the built CLI output and the observed client screens on 2026-10-24. This review is agent work. It is not owner acceptance.

| Promise | Observation and conclusion | Limit and next action |
| --- | --- | --- |
| One reviewed setup with clear scope | The plan names the CLI user file, owned entry, Store effects, and key change. The built package wrote that entry in a disposable profile. A temporary installed entry was added with owner approval and then removed. Local result: pass. | Ask the owner before any further installed connection change. |
| Truthful CLI and app state | The plan gives separate CLI and app rows. The organization-managed CLI seat reported a policy block. The personal CLI connected and made direct MCP calls. The app used the CLI user entry and a trusted folder entry in separate macOS sessions. Local result: pass for those client calls. | App-added entry conflicts and other host platforms remain unproved. |
| Store denial leaves resource work available | The personal CLI returned `store-denied` for a changed key and then read a Store-free lifecycle resource. The app refused a wrong project with `store-not-configured` and then read a Store-free template resource in the same session. A trusted app folder entry with a changed key returned `store-denied`. Local result: pass for these direct calls. | A Store-free resource read after the changed-key app denial was not repeated. |
| Shared Skill access | The app listed the shipped `preflight` Skill from `.agents/skills`, loaded it, and returned its first section heading. Local result: pass on macOS. | Other host platforms remain unproved. |

## Review Packet

The candidate changes the static Copilot adapter, CLI setup and status, shared router and Skill selection, tests, PRD 28, W27 records, and the two setup guides. It owns one `mcpServers.make-docs` entry in the CLI user file. The live test added and removed a temporary installed CLI entry with owner approval. It did not edit an app-added entry.

The CLI build and TypeScript check passed. The W27 test file passed all eight tests. The W19 R6 setup and adapter files passed 60 tests. A prior wider run passed 1,659 tests, failed 11, and skipped five. Six failures came from a missing generated template copy. Five came from old two-harness expectations. The six affected files passed all 99 tests after those fixes and the template copy. The package dry run passed. PRD authority validation scanned 35 PRDs and 1,139 links with no finding. `git diff --check` passed.

The personal Copilot CLI on macOS connected to the built W27 server. Direct calls proved tool loading, an allowed Store read, wrong-project refusal, changed-key refusal, and a Store-free resource read after refusal. A sandboxed call returned `ready` after the same built runtime was placed inside the disposable project and the disposable Store was added to that one session. The organization-managed seat still blocks MCP by policy.

The personal Copilot app on macOS connected through a trusted disposable folder entry. Direct calls proved an allowed Store read, wrong-project refusal, and a Store-free resource read after refusal. The fresh session used the folder's configured sandbox, which allowed only the project and sibling Store. The test folder, Store, key, app sessions, and trust were removed after the test.

With an approved temporary CLI user entry installed, the app listed Make Docs as Connected and returned `ready` through it. A same-name project entry stayed inactive while the folder was untrusted. After trust, the project entry took precedence and its changed key caused `store-denied`. The app also loaded the shipped `preflight` Skill from `.agents/skills`. Cleanup restored the exact original CLI MCP file, removed the saved folder trust and test files, and left Railway as the only installed MCP entry.

Proof limits retained after bounded closeout: a same-name app-added entry and direct Copilot client runs beyond macOS. Windows and Linux CI contract checks do not replace those client runs. No tested cross-platform Copilot client claim is ready. On 2026-10-26, the owner accepted macOS as the tested client scope and discharged P3 t4 without a Windows or Linux test pass. The W27 PR was reviewed and merged as PR #42. Version 2.0.5 still needs its separate release review and publication decision. The [draft release notes](../../assets/project/2026-10-24-v2.0.5-release-notes.md) and [security review](../../assets/project/2026-10-24-v2.0.5-security-review.md) retain that limit.

### Future direct platform test if the support claim expands

If a later release claims tested Windows or Linux Copilot clients, use a real host for each named platform with an account that permits MCP. Check app availability for each host before planning an app claim. Install the identified Make Docs package on each host. Use a disposable project and Store. Run setup for the Copilot CLI, then check the MCP handshake, tool list, allowed Store call, wrong-key and wrong-project refusal, Store-free resource after refusal, Backlog Review text, and Skill discovery. On a host with the Copilot app available, check CLI-entry reuse, folder trust, direct app call, and Skill loading separately. Record client versions, package hash, redacted entry source, results, and cleanup. Run the same case names on both hosts. A platform that has no usable app should be recorded as unsupported or untested, not passed from CLI or CI proof. These direct client tests were not run for the bounded W27 closeout.
