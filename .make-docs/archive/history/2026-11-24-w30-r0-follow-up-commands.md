---
title: "W30 R0 Follow-Up Commands"
kind: "history"
status: "draft"
date: "2026-11-24"
client: "T3 Code"
model: "Claude Fable 5.2"
coordinate: "W30 R0 P6"
repo: "make-docs"
branch: "t3/w30-r0-factory-follow-up-commands"
---

# W30 R0 Follow-Up Commands

## Changes

Builds the three follow-ups that the owner approved on 2026-11-23, after the P4 and P5 merge. All of it is new behavior. The tasks are P6 T16 to T18, because P3 is completed and stays closed. The work is not committed.

`make-docs factory tools list` (MCP `factory_tools_list`) reads the saved tools of this machine, with each state, each capability proof, and each record version. It takes no project, changes nothing, and never creates or migrates a Store. The `factory-setup` Skill now reads the saved tools through it, and no longer uses the `tools.md` copy as a hint.

`make-docs factory file-backup save` (MCP `factory_file_backup_save`) saves the backups outside git for an open assignment, through the P2 backup function, with the private claim ID. In a folder with git it reports `not-needed` and changes nothing. A refused call leaves no copy and no record. The run Skill calls it before a worker changes a file outside git, which closes P5 T10. The interim rule to stop and ask the person is removed.

`make-docs factory grant-use record` (MCP `factory_grant_use_record`) records a grant use on the live claim of a unit whose assignments are all final. It uses the same grant checks and refusal codes as `factory assignment save`. Each recorded use, on either path, adds one use row to the Store. Schema v9 is not released, so it changed in place. The run Skill's end-of-scope steps use the command: keep the claim of the unit that the action belongs to, record the use after the person accepts, act, then close the unit.

The owner named the backup command `factory backup save` and gave `factory grant use` as an example. A native command rule refuses the word `backup`, and `use` is not an approved end word, so the build uses the names above. On 2026-11-24 the owner confirmed them (register D-077, option A, closed).

An independent review asked for seven fixes, and all are done: a refused file backup leaves nothing behind and removes only its own copies, its messages are plain words with no raw system error and no absolute path, a symbolic link is refused, a CLI call with no `--file` gets a plain message, the Skill has the builder return the file names instead of a pause, and the tools list prints one period.

On 2026-11-24 the owner chose a full history of grant uses (option B). The new `factory_grant_uses` table of the unreleased schema v9 holds one row for each use, written in the same transaction as the grant check. A revoke keeps the rows, and they stay until the workflow is removed. `factory workflow show` lists them beside the grants. The two last-use columns of `factory_grants` are removed, so a use of a `standing` or a `run` grant no longer changes the grant.

On 2026-11-24 the owner passed the Guided Progress Reviews of P4 and P5 (option A), with no change. The evidence and both phase closeouts record it, and both phase files are `completed`.

Validation: 25 tests in `packages/cli/tests/w30-r0-follow-up-commands.test.ts`, the P2 to P5 factory tests, the type check, the build, the name, registry, and MCP tests, `validate:defaults`, the router check, `check prd`, `project paths validate`, `project doctor check`, the Markdown check of the changed Skill files, and the full suite. The evidence report has the counts.

| Area | Summary |
| --- | --- |
| `packages/cli/src/operations/factory/` | The three operations, their scope tags, and the backup rollback. |
| `packages/cli/src/store/` | The claim-level grant use, the `factory_grant_uses` table, the column register, and the table catalog. |
| `packages/cli/src/operations/` and `packages/cli/src/run/cli.ts` | The registry, the name catalog, the leaf help, the `--file` option, and the CLI adapters. |
| `packages/skills/factory-setup/` | Reads the saved tools with `factory tools list`. |
| `packages/skills/factory/` and `.agents/skills/factory/` | The backup step, and the end-of-scope grant use. |
| `packages/cli/tests/` | The new test file, and the lists and counts that name the factory commands. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [Evidence report](../../../docs/work/2026-11-21-w30-r0-factory/evidence.md) | Adds the Follow-Up Commands section: each command, the names, the design of the grant use on the claim, the Skill changes, the tests, the checks, and the owner items. |
| [P6 work](../../../docs/work/2026-11-21-w30-r0-factory/06-proofs-and-acceptance.md) | Adds Stage 4 with T16 to T18 and A84 to A87, and its Change History. |
| [P5 work](../../../docs/work/2026-11-21-w30-r0-factory/05-factory-run-skill-and-handoffs.md) | Checks T10, records the passed review, sets the status to `completed`, and updates the Change History. |
| [P4 work](../../../docs/work/2026-11-21-w30-r0-factory/04-factory-setup-skill.md) | Records the passed review, sets the status to `completed`, and adds a Change History. |
| [PRD 53](../../../docs/prd/53-factory-setup-and-orchestration.md) | Adds R-FACTORY-69 to R-FACTORY-71, updates the Operations and project scope tables and R-FACTORY-24, -44, -50, and -63, and records it in Requirement History. |
| [PRD 39](../../../docs/prd/39-cli-command-model-and-operation-registry.md) | Lists the three commands in R-RUN-1, with Requirement History. |
| [PRD 25](../../../docs/prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) | Names the new tools in the `factory` profile, with Requirement History. |
| [PRD 38](../../../docs/prd/38-global-store-and-project-state.md) | Adds the factory grant uses R-MIN row, with Requirement History. |
| [Register](../../../docs/prd/03-open-questions-and-risk-register.md) | Adds D-077 about the two command names, closed on 2026-11-24 at option A. |
| [Factory design](../../../docs/designs/2026-11-21-factory.md) | Names the three follow-up commands. |

### Maintainer

| Path | Description |
| --- | --- |
| [Factory contract](../../../packages/docs/template/.make-docs/system/contracts/factory-contract.md) | The template and its identical dogfood copy: the three commands, their scope, the two ways to record a grant use, the backup command, and the Rule Catalog checks. |
| [Factory Skill](../../../packages/skills/factory/SKILL.md) | The run Skill and its references. |
| [Factory setup Skill](../../../packages/skills/factory-setup/SKILL.md) | The setup Skill and its references. |

### User

None this session.
