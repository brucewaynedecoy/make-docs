---
title: Setting Up Projects and Harness Access
kind: guide
path: cli/setup
persona: user
status: draft
order: 15
tags:
  - setup
  - harnesses
  - access
  - recovery
applies-to:
  - cli
  - docs
  - skills
related:
  - "getting-started-installing-make-docs.md"
  - "cli-lifecycle-managing-installations.md"
  - "skills-installing-and-managing-skills.md"
  - "../maintainer/cli-maintaining-setup-and-harness-access.md"
  - "../../designs/2026-09-12-unified-setup-and-harness-access.md"
  - "../../work/2026-09-12-w19-r6-unified-setup-and-harness-access/00-index.md"
---

# Setting Up Projects and Harness Access

## Overview

Make Docs setup can change two scopes.

- **This computer** covers Make Docs intent and native harness files in your home directory.
- **This project** covers project routers, Skills, project config, resource copies, and document folders.

The final review shows both groups together when both groups have planned changes. Each group has its own approval. Project approval never approves a computer change.

Make Docs applies and verifies the computer plan first. It then applies the project plan. If project setup fails, a valid computer setup stays in place.

## Setup Commands

Use the command that matches your goal.

| Command | Use |
| --- | --- |
| `make-docs setup` | Set up a project and review any needed computer support in one flow. |
| `make-docs setup system` | Review computer support only. It does not set up project files. |
| `make-docs setup reconfigure` | Review the current project choices. Use this path to approve an expansion of a partial project. |
| `make-docs setup skills` | Change optional Skills through the focused Skill flow. |

`make-docs setup backup` and `make-docs setup remove` stay separate. They are not wizard steps.

Use `--target <project-root>` when the target is not the current directory.

## Fresh and Existing Projects

A fresh project gets the full Make Docs surface. This surface includes Designs, Plans, PRD, and Work. Setup does not ask you to select document types.

A partial project stays partial during a normal repeat of `make-docs setup`. Make Docs shows the current surface. It does not add missing document areas without review.

Use `make-docs setup reconfigure` when you want to review an expansion to the full surface. The project review must list the new paths before you approve them.

## Harness Choices

Harness detection is a useful hint. It is not proof that a harness can use Make Docs. Setup can show a harness as detected, configured, drifted, blocked, or unsupported.

The current build supports no Store-backed harness connection method. Exact real-harness conformance evidence is still missing. Codex and Claude Code methods stay unavailable or experimental until that evidence exists. You can always select `none`.

Choosing `none` makes no native harness change. You can still use project routers, optional Skills, and Store-free resource commands.

Pi is not supported. Make Docs does not show a Pi method until a first-party extension and exact real Pi evidence exist.

## Resources and Store Access

These commands do not need Store access:

```bash
make-docs resource list
make-docs resource read <resource-uri>
```

You do not need MCP, command rules, permission rules, or an extension to run these read commands.

Resource placement stays in the project part of setup. You can use installed Make Docs resources or copy selected resource types into the project. A local copy can reduce CLI use for later reads. It does not grant Store access.

## Review and Apply

Normal project setup gives you one final grouped review. Review all computer and project effects before either scope changes.

1. Review one final plan that shows both **This computer** and **This project**.
2. In **This computer**, check each intent file, native harness file, selected method, and effect.
3. In **This project**, check each project file, Skill, resource copy, and document area.
4. Approve or skip the computer group.
5. Approve or skip the project group.
6. Make Docs applies and verifies approved computer changes first. It then applies approved project changes.

`make-docs setup system` shows only the computer group.

Skipping one harness leaves its saved intent unchanged. Setup does not turn an excluded harness off.

## Machine Trust and Project Limits

Machine intent in `~/.make-docs/config.json` sets the highest approved access for a harness. The live native harness file remains the active harness setting.

Project settings in `.make-docs/config.yaml` can inherit that machine choice. They can also narrow it or disable it for the project. A project cannot grant a method or access level that the machine setting did not approve.

## Receipts and Safe Recovery

The global Make Docs Store records exact receipts for Make Docs-owned native entries. A path or matching name alone does not prove ownership.

Before a native file changes, Make Docs records a pending computer operation in the Store. If setup stops after the native write, run the same setup command again. Make Docs reads the pending operation, checks the executable and native entry again, writes the exact receipt, and completes the operation.

Make Docs can repair drift only when the receipt proves that Make Docs owns the exact entry. A user-owned, unknown, malformed, changed, or symbolic-link entry stays blocked. Follow the exact action in the result. Do not replace the file only to clear the block.

If computer setup succeeds and project setup fails, run:

```bash
make-docs setup --target <project-root>
```

The repeat keeps the valid computer state. It resumes the incomplete project scope. It does not repeat a completed project change.

## Troubleshooting

| Result | Meaning | Next action |
| --- | --- | --- |
| `skipped` or `none` | No Store-backed connection was selected. | Continue with project routers, Skills, and Store-free resource reads. |
| `blocked` | Make Docs cannot prove that it may change the exact native entry. | Use the exact recovery action shown by setup. Preserve the file until you know who owns it. |
| `drifted` | A receipt-owned entry differs from the reviewed value. | Review the repair. Apply it only if the shown old and new values are correct. |
| `recovery` | A prior computer or project operation did not finish. | Run the same setup command again. Keep the same target project. |
| project failure after computer success | The computer state is valid. The project state is incomplete. | Run `make-docs setup --target <project-root>` again. |

## Current Support Limit

No Codex or Claude Code connection method has the exact real-harness evidence that Make Docs requires for a support claim. This limit blocks the method label. It does not block project setup, Skills, or Store-free resource reads.

Use [Maintaining Setup and Harness Access](../maintainer/cli-maintaining-setup-and-harness-access.md) for the evidence and release gates that can change this limit.
