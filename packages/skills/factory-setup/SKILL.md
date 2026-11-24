---
name: factory-setup
description: Set up, prove, and save a Make Docs factory workflow with the person's own agent tools. Use only when the user explicitly requests $factory-setup or this factory setup skill.
---

# Factory Setup

Set up the Make Docs factory for one project with the tools that the person already has. Setup runs six steps: find, read, interview, wire, prove, and save. It ends with a plain summary. The factory stays off until a person asks for this setup (`opt-in`).

Read the factory contract first: a valid local `.make-docs/system/contracts/factory-contract.md`, or `make-docs://system/contract/factory-contract.md` with `make-docs resource read`. The contract owns the rules. This Skill is the agent form of the setup rules, and it uses the same rule IDs, capability IDs, and reason codes as the CLI. Read the workflow type that the person picks from `make-docs://system/reference/factory/workflows/<type>.md`, or from `docs/assets/project/factory/workflows/<type>.md` for a project-owned type.

## Rules That Always Hold

- Describe every tool by what it can do, never by its name (`tool-agnostic`). In examples, say "tool A" and use tool IDs such as `tool-a`. Records name the tools that were actually used.
- Ask the person only for preferences and permissions. Never ask for a fact that you can find in the tools, the project, or the Store.
- Never install, sign in, pay, or change authentication for the person. When a tool needs one of these, list it as a manual step for the person to do.
- Name the project in every project write, with `--target-root <checkout>` or `--project <name>` (MCP `targetRoot` or `project`). Never rely on the current folder for a write (`writes-name-project`). `make-docs factory tools save` and `make-docs factory tools list` act on this machine and take no project (`machine-commands-no-project`).
- Never write an item on the never-log list into a record, a config entry, a known loss, a manual step, or a test task line: file contents, prompts or briefs, environment values, transcripts, or credentials such as keys, tokens, or passwords (`never-log`). Use IDs, short labels, times, digests, and reason codes instead.
- Follow a repository or user rule that forbids worktrees (`worktree-policy`).
- Never save a grant in the config file or a local copy (`grants-not-committed`).

## How to Call Make Docs

Use the MCP tool when your session has it. Otherwise use the CLI command. Each result names the project it acted on, or says that it acted on this machine (`results-name-project`).

| Step | MCP tool | CLI command | Scope |
| --- | --- | --- | --- |
| Read the project's workflows | `factory_workflow_list` | `make-docs factory workflow list` | Project read |
| Read one workflow, its plan, and its drift | `factory_workflow_show` | `make-docs factory workflow show` | Project read |
| Read the machine's saved tools and proofs | `factory_tools_list` | `make-docs factory tools list` | Machine read |
| Save the machine's tools and proofs | `factory_tools_save` | `make-docs factory tools save` | Machine write |
| Save the workflow's choices, bindings, and grants | `factory_workflow_save` | `make-docs factory workflow save` | Project write |
| Save the test task result | `factory_proof_save` | `make-docs factory proof save` | Project write |
| Write the local copies again | `factory_restore` | `make-docs factory restore` | Project write |
| Show the live state | `factory_status` | `make-docs factory status` | Project read |

Manual path: none for a factory save. Setup needs the CLI and a usable Store (`needs-cli-and-store`). Without them, setup stops. It never writes the Store, the `.make-docs/factory/` copies, or a stand-in record by hand.

## Step 0: Check the CLI, the Store, and the Project

1. Check for the factory MCP tools, or for the `make-docs` command (`make-docs --version`).
2. Find the project checkout: the folder whose `.make-docs/config.yaml` holds the project ID. Use its absolute path as `--target-root` in every later call.
3. Run `factory_workflow_list`, or `make-docs factory workflow list --target-root <checkout>`.

Stop at the first problem. Name what is missing and the setup step that fixes it. Save nothing.

| What you find | Say what is missing | The fix that the person runs |
| --- | --- | --- |
| No MCP tool and no `make-docs` command | The Make Docs CLI | Install the Make Docs CLI, then ask for factory setup again. |
| `store-unavailable` | A usable Make Docs Store | Run `make-docs setup` in the project. |
| `store-denied` | Store write access for this agent in this project | Run `make-docs setup --target <checkout>` and grant Store write to this agent. |
| `store-unsafe` | A safe Store | Run `make-docs setup store check` and follow its next step. |
| `project-missing`, `project-not-identified`, or `project-not-found` | A Make Docs project in this folder | Run `make-docs setup` in the project folder. |
| `project-checkout-unclear` | One checkout of the project | Name the checkout with `--target-root`. |

When the list shows a saved workflow, this is a rerun. Go to [Rerun](#rerun) after Step 2.

## Step 1: Find the Tools

Find the agent tools on this machine and in the project by capability. Read the machine's saved tool list with `factory tools list`, and reuse it when it is current (`machine-records-shared`). Read [find and read](references/find-and-read.md) for where to look and when the saved list is current.

## Step 2: Read Each Tool

Read each tool's help, its docs, its MCP tool list, and its Skills. Record what each tool says it can do, as capability IDs from the contract's catalog. A claim is not a proof. See [find and read](references/find-and-read.md).

## Step 3: Interview the Person

Ask one decision at a time, with your recommendation first and its main reason. Show at most two options: the recommendation and the one best other choice. When more choices exist, say so and name where the person can see them. Use a choice control when your session has one. Accept a clear "yes" as the recommendation. Ask only what the tools and the project cannot answer. Read [interview](references/interview.md) for the questions, the defaults, and what never to ask.

The interview covers: the workflow type, the human channel, the wake method, the limits, the optional steps such as preflight, the grants and their scopes, the working-copy method, and the acceptance of each known loss.

## Step 4: Wire and Prove

Give each role a tool because of its proved capabilities (`match-by-capability`). Prove each capability that a role needs, and record each proof with the tool version, the time, the result (`proved`, `unproved`, or `contradicted`), and a "does not cover" list (`proof-record`). A role never depends on an `unproved` or `contradicted` capability (`unproved-stays-visible`). Save the proofs with `factory tools save`. Read [wire and prove](references/wire-and-prove.md), which also covers the smallest setup (`smallest-setup`) and a multi-tool setup.

## Step 5: Save, Test, and Make It Ready

Write the workflow's portable choices in the `factory:` block of the config file. Save the bindings and the grants with `factory workflow save`. The CLI makes the resolved plan (`plan-generated`). Tell the person the plan revision and its digest in plain words. Run one small test task from intake to return under that plan revision. Save its result with `factory proof save` and the same digest. Only a passed test task makes the workflow `ready` (`ready-needs-proof`). Read [save and test](references/save-and-test.md).

## Step 6: Close With the Summary

End with the plain summary (`setup-summary`): the tool, its version, and its proof result for each role; how the workflow wakes; how the factory reaches the person; what the test task proved and each capability that stays unproved; each accepted known loss (`known-losses-listed`); each grant with its scope; and each open manual step (`manual-steps-listed`). When no tool can wake on its own, say so (`no-wake-said`). Read [summary](references/summary.md) for its shape and two samples.

## Rerun

A rerun updates the same workflow (`rerun-same-workflow`). Read the saved workflow with `factory workflow show`. Find and read the tools again, and reuse each proof that still holds. Show the person what changed, old and new, and each drift reason code in plain words. Prove again each capability and binding that changed, save, run a new test task, and close with the summary. See the Rerun section of [save and test](references/save-and-test.md).

## Finish

Finish with one plain outcome: the workflow is `ready`; or it is saved but not `ready`, with the named step that is still needed; or setup stopped, with what is missing and its fix. A setup request ends at the summary. Do not start a factory run. The person starts one with the `factory` Skill.
