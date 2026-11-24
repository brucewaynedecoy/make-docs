---
title: "W30 R0 P3 Factory Operations Closeout"
kind: "history"
status: "draft"
date: "2026-11-23"
client: "T3 Code"
model: "Claude Opus 5.5"
coordinate: "W30 R0 P3"
repo: "make-docs"
branch: "docs/w29-w30-work-store-and-factory"
---

# W30 R0 P3 Factory Operations Closeout

## Changes

Adds the ten `factory` commands with leaf help, JSON and text output, and MCP tools `factory_status` to `factory_restore` in the new `factory` MCP profile and `all`: `status`, `tools save`, `workflow save`, `workflow show`, `workflow list`, `proof save`, `assignment start`, `assignment save`, `assignment list`, and `restore`. One operation core serves the CLI and MCP, so their results match. The commands check and record only. None launches, schedules, messages, or contacts a tool, and none starts a process or opens a network connection.

`tools save` acts on this machine and takes no project. Every other command acts on one project. A write names it with `--target-root` or `--project` and never uses the current folder; a write that names none is refused with `project-missing` and changes nothing, and `project-not-found`, `project-mismatch`, and `project-checkout-unclear` refuse the other cases. A grant belongs to one checkout, so a name that gives no single checkout is `project-checkout-unclear` and names `--target-root`. A read may use the current folder's project and says so. Every result names the project, with its name and ID, or this machine, in plain words first. A factory MCP tool that names a project needs that project's own grant, else it is `store-denied` with the project named and the step that grants it.

The current plan comes from the checkout's config file, the workflow type file, and the machine tool rows. Its digest gives `ready`, `wired`, `draft`, or `drifted`, and drift names each reason code in plain words with one fix, compared with the latest saved revision. `workflow save` checks the type version, the standard roles of the type, and the capability catalog, saves a revision only when the plan changed, and never makes one `ready`; a grant-only save writes or revokes grants and changes no plan or readiness. `proof save` takes only the current plan's digest, and only a passed test task under a `wired` plan makes it `ready`. `assignment start` needs a `ready` workflow, a role and the bound tool of the `ready` plan, a lifecycle run of the project that has not ended, and the private claim ID; it records the `ready` revision and the checkout that the call named, and refuses a second open assignment for one job. `assignment save` follows the status move table, counts correction rounds against the assignment's own plan revision, records checks, and records grant uses. No result or record shows a claim ID. `status` shows one project, grouped by checkout and then by lifecycle run, with each checkout's own readiness, and `--run` shows one run. The factory URIs show saved records only, never a grant, a claim ID, or a prompt, and end with a note to run `factory status`.

An independent review found seven problems, all fixed and tested: the assignment's role and tool were not checked against the `ready` plan, `workflow save` did not check the type's roles, a config-only change also gave `binding-changed`, any run ID was accepted, a removed workflow pointed at a step that could not remove it, a `--project` call with two checkouts used the first one's grant, and the contract's rule catalog still called built checks planned. Workflow removal is recorded as a P3 follow-up (T34), and the rule catalog column as P6 T14.

The command that moves an assignment was first planned with the end word `update`. The harness access contract refuses that word in any native command rule, and setup failed for every project. On 2026-11-23 the owner chose to rename it `factory assignment save` (register D-076, option C), so it is a native command rule again and the harness access contract did not change. Shared changes: the registry can resolve a call's target before the access check, a machine write can open its own Store session, the option parser can take a value for one command's flag, and the project URI parser has the `factory` family. The factory contract no longer calls the shipped commands planned, and the factory contract and its workflow types are also in the `factory` profile.

Validation: 36 new tests, the type check, the build, `validate:defaults`, the router check, `check prd`, paths, the doctor check, and the full suite with only the known failures. The owner's Guided Progress Review of status output (T11) passed on 2026-11-23.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [P3 work](../../../docs/work/2026-11-21-w30-r0-factory/03-factory-operations.md) | Checks T1 to T33, with T11 passed by the owner, sets the phase to `completed`, and keeps T34, workflow removal, as a follow-up. |
| [P6 work](../../../docs/work/2026-11-21-w30-r0-factory/06-proofs-and-acceptance.md) | Adds T14 for the rule catalog Check column. |
| [Evidence report](../../../docs/work/2026-11-21-w30-r0-factory/evidence.md) | Records the commands, the owner decisions as built, the choices made, the status samples, the review fixes, the rename, the checks, and the follow-ups. |
| [PRD 53](../../../docs/prd/53-factory-setup-and-orchestration.md), [PRD 39](../../../docs/prd/39-cli-command-model-and-operation-registry.md), and [PRD 38](../../../docs/prd/38-global-store-and-project-state.md) | Name `factory assignment save`; PRD 39 R-RUN-1 lists the ten factory commands as active. |
| [Register](../../../docs/prd/03-open-questions-and-risk-register.md) | Adds and closes D-076, the assignment command name. |
| [Factory design](../../../docs/designs/2026-11-21-factory.md) | Names `factory assignment save`. |

### Maintainer

| Path | Description |
| --- | --- |
| [Factory contract](../../system/contracts/factory-contract.md) | Names `factory assignment save`, no longer calls the shipped commands planned, says what the role check does, and notes that the P3 rows of the rule catalog are built. |

### User

None this session.
