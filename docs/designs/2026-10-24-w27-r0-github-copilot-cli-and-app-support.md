---
title: "W27 R0 GitHub Copilot CLI and App Support"
kind: "design"
status: "draft"
coordinate: "W27 R0"
follow_on:
  route: "change-plan"
  next_prompt: "../../.make-docs/system/prompts/designs-to-plan-change.prompt.md"
  why: "PRD 28 owns harness setup. This proposal extends that contract to Copilot CLI and the Copilot app."
  coordinate_handoff: "W26 R0 and R1 are merged on main. Use the new W27 R0 wave for Copilot support."
source:
  type: "manual-request"
---

# W27 R0 GitHub Copilot CLI and App Support

## Purpose

Add a reviewed Make Docs setup path for GitHub Copilot CLI and the GitHub Copilot app. This is a proposal for owner review. It does not grant implementation or installation authority.

## Context

The current first-party static adapters cover Codex and Claude Code. The generic MCP profile can serve a named client, but it does not manage that client's native setup. [PRD 28](../prd/28-shared-agentics-installation-and-harness-exposure.md) owns harness methods and grants. [PRD 38](../prd/38-global-store-and-project-state.md) owns Store records and current access checks. [The user guide](../assets/user/cli-setting-up-projects-and-harness-access.md) states the current support limit.

GitHub documents the standalone `copilot` CLI and the GitHub Copilot app as distinct user surfaces. The app uses MCP servers set up for Copilot CLI or the repository. The CLI stores user MCP entries in `~/.copilot/mcp-config.json` by default and also reads project MCP files. Project files take precedence and require folder trust. These facts support one Copilot MCP method with two real client checks. They do not prove that both clients present a Make Docs caller identity or can reach the Store. See [CLI MCP setup](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-mcp-servers), [CLI command reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference), and [app customization](https://docs.github.com/en/copilot/how-tos/github-copilot-app/customize-github-copilot-app).

GitHub also lists `.agents/skills` as a project skill path for the CLI. The app uses CLI and repository skills. Make Docs already writes shared project skills to that path. This package calls for live skill discovery proof before it claims skill support. See [CLI skills](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-skills).

## Human Experience Intent

Impact: `direct`

Affected humans: People who use Make Docs through GitHub Copilot CLI or the GitHub Copilot app.

Human goal or effect: Select Copilot in Make Docs setup, review the exact access, then use Make Docs tools in either client without a second manual setup path.

Experience promises:

- Setup names the CLI and app, their shared configuration, the requested Store scope, and the action that changes native files.
- A user can tell whether each client is current, missing, drifted, blocked, or unsupported.
- A failed Store call names one recovery action. Store-free resource work remains available.

Complexity kept out of the human path:

- The user does not need to copy a secret into a repo file or edit two identical MCP entries.
- The user does not need to infer access from a process count, a detected app, or a prior receipt.

Evidence required:

- A redacted setup preview and reviewed apply receipt for a disposable Copilot configuration.
- Direct CLI and app sessions that list the Make Docs tools and exercise a Store read and a denied operation.
- A changed-config, removed-entry, rollback, and repeat-setup check for each applicable client.

## Performance Evidence Candidates

No new time or capacity target is proposed. A direct startup and tool-list check will catch a setup that fails or hangs. It is functional proof, not a performance claim.

## Decision

Propose one source-owned `github-copilot` static adapter with an MCP method. The adapter treats Copilot CLI as the configuration owner and the GitHub Copilot app as a second consumer of that configuration. It must not write a second app MCP entry merely because the app exists. It must distinguish a user-owned entry from a Make Docs-owned entry and preserve unknown fields and other servers.

The adapter should offer a reviewed user-level entry only after the installed CLI's active configuration home and file shape are verified. A custom `COPILOT_HOME`, existing project entry, duplicate name, organization policy, or app-specific setting can block that path. The user can then use the existing generic MCP profile and client-owned setup instructions. Do not silently replace or shadow an existing entry.

Bind current access to the active connection key, machine and project grants, target, profile, and operation under the W26 Store rule. The client name in a JSON file is not identity proof. Apply, repair, rotation, and removal require an exact preview and fresh native-state check. A receipt records history but never grants access by itself.

Keep shared `.agents/skills` delivery. Do not create a Copilot plugin, a `.github/github-app.yml` file, or a separate desktop skill copy in this wave. The app's repository configuration is a different feature with its own trust review; MCP support does not require it. See [app repository configuration](https://docs.github.com/en/copilot/reference/github-copilot-app-reference/repository-configuration).

Scope is local Copilot CLI and app sessions. Copilot cloud agent, code review, GitHub Desktop, IDE plugins, and remote MCP hosting are separate products or routes. The legacy `gh copilot` extension is not the target.

## Alternatives Considered

- Generic MCP only: safe for manual setup, but it leaves the first-party setup and status flow incomplete.
- Separate CLI and app entries: GitHub says the app uses CLI and repository MCP servers. Duplicate entries would add drift and unclear ownership.
- Repository `.github/mcp.json`: useful for shared project settings, but it can carry machine-specific commands or keys into Git and has folder trust rules. It is not the default managed target.

## Consequences

The source-owned adapter and setup UI gain one method and two client proof rows. Existing Codex and Claude methods stay within their current grants. Support labels stay blocked until real installed-client proof exists for the exact release package and platform. If the app differs from the CLI in caller identity, tool use, or sandbox access, the app row stays blocked while the proved CLI row may proceed.

The design uses the existing [R-021 adapter risk](../prd/03-open-questions-and-risk-register.md) as the path and proof guard. The plan must update PRD 28 and any affected Store or CLI owner before code changes. No PRD text changes in this review draft.

## Intended Follow-On

- Route: `change-plan`.
- Next Prompt: [designs-to-plan-change.prompt.md](../../.make-docs/system/prompts/designs-to-plan-change.prompt.md). Read `make-docs://system/prompt/designs-to-plan-change.prompt.md` with `make-docs resource read` when planning resumes.
- Why: This adds a supported harness to the current product contract.
- Coordinate Handoff: W26 R0 and R1 are complete on `main`; W27 R0 owns Copilot setup and proof.
- Review next: [W27 R0 plan](../plans/2026-10-24-w27-r0-github-copilot-support/00-overview.md) and [work queue](../work/2026-10-24-w27-r0-github-copilot-support/00-index.md).
