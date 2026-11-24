# Find and Read the Tools

Use this reference for setup Steps 1 and 2. Describe each tool by what it can do. Never assume that a particular app, harness, model provider, terminal multiplexer, scheduler, or messaging tool is present (`tool-agnostic`).

## Reuse the Saved Tool List

The machine's tool list and its capability proofs are saved once for each machine. Every project on the machine uses them (`machine-records-shared`).

1. Read the saved tools from the Store. Run `factory_tools_list`, or `make-docs factory tools list`. This command acts on this machine and takes no project. It shows each saved tool with its state, its reported version, and its record version (`version`). It shows each capability proof with its tool version, its time, its result, and its "does not cover" list. These facts come from the Store, so you can decide from them. The read changes nothing.
2. When this project already has a workflow, read which tool each role uses. `factory_workflow_show` (or `make-docs factory workflow show <workflow> --target-root <checkout>`) shows the bound tools, the readiness, and each drift reason code.
3. A saved tool is current when all of these are true:
   - you find that the tool is still on the machine, and its saved state is `available`;
   - the tool reports the same version that its saved proofs name;
   - each capability that a role needs has a `proved` proof for that version.
4. Reuse a current tool and its proofs. Do not prove it again. Prove every other tool before you save it.
5. A save holds the full list of a tool's proofs. When you save a tool again, send every proof that still holds, as the read shows it, with each new proof. Use the record version that the read shows as the `expectedVersion`.
6. Never use the `.make-docs/factory/tools.md` copy as a source. It can be out of date, and it does not show a record version. Never decide from the copy, never copy a proof from it into a save, and never take an `expectedVersion` from it.

When no tool is saved, the read says so. Then find and prove each tool. When the read gives a Store outcome such as `store-unavailable`, stop as in Step 0 of the Skill.

When a saved tool is gone, report it as `missing`. When it lost a permission that it needs, such as an app permission or a sign-in, report it as `blocked`. When it reports a new version, prove it again. See [wire and prove](wire-and-prove.md#a-new-tool-version).

## Where to Look

Look for each kind of tool. The tool kinds are `agent-harness`, `model-provider`, `terminal-multiplexer`, `mcp-server`, `scheduler`, `messaging-tool`, and `other`. Look in these places only:

- your own session: the tools that you can use now, such as tools that read and write files, run commands, start agents, wait for them, read their results, set a timer, or send a message;
- the MCP servers that your session lists, and the tools that each one lists;
- the Skills that your session has;
- the project's own instruction files and agent settings, and the commands that they name;
- the commands that the person's own instruction files name, and the commands that a found tool's docs name as its parts.

For each command that you find, check that it is present with its own help or version option. Do not scan the whole disk. Do not open credential files, environment values, or another project's private files. Do not start a paid service or contact an outside service only to find a tool.

Look for these capabilities: run agents, launch agents, wait for an agent, read an agent's result, wake on a schedule or an event, message the person, receive the person's answer, isolate a working copy, and edit code.

## Read Each Tool

For each tool that you found, read what it makes available:

- its help output;
- the docs that it ships or names;
- its MCP tool list, when it is an MCP server;
- its Skills, when it has them.

Record what each tool says it can do, as capability IDs from the contract's catalog: `read-write-files`, `run-commands`, `launch-agent`, `wait-for-agent`, `read-agent-result`, `wake-on-schedule`, `wake-on-event`, `message-person`, `receive-answer`, `isolate-working-copy`, and `edit-code`. Never use an ID that is not in the catalog. The CLI refuses it with `unknown-capability`.

Record the version that the tool reports, from its own version option or from what its session reports. When a tool reports no version, record `null`. Then the factory cannot see when the tool changes, so name that as a known loss.

A claim in a tool's docs is not a proof. A capability that the docs claim, but that setup cannot run a proof for, is `unproved`.

## Give Each Tool an ID

Give each tool a short tool ID: lower-case letters, digits, and single hyphens, such as `tool-a`. Give it a short label for people, one line of at most 120 characters. The ID and the label never hold a path, an account, a key, or any other item on the never-log list. Keep the same ID for the same tool on later runs, so its saved record and proofs stay linked to it.

## What Not to Ask

Do not ask the person which tools they have, what a tool can do, its version, its path, or how to call it. Find these facts. Ask the person only when a fact is hidden from you and only the person can give it, for example whether they got a test message.
