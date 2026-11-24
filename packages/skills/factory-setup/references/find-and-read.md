# Find and Read the Tools

Use this reference for setup Steps 1 and 2. Describe each tool by what it can do. Never assume that a particular app, harness, model provider, terminal multiplexer, scheduler, or messaging tool is present (`tool-agnostic`).

## Reuse the Saved Tool List

The machine's tool list and its capability proofs are saved once for each machine. Every project on the machine uses them (`machine-records-shared`).

1. Read the bound tools from the Store. When this project already has a workflow, `factory_workflow_show` (or `make-docs factory workflow show <workflow> --target-root <checkout>`) shows each bound tool in its plan, with its state, its version, and each proof result. These facts come from the Store, so you can decide from them.
2. Get a hint for the other tools. First run `factory_restore`, or `make-docs factory restore --target-root <checkout>`. It writes the `.make-docs/factory/` copies again from the Store. Then read `.make-docs/factory/tools.md`. It lists the tools that are saved on this machine. Use the copy as a hint only, about what to check first. It can be out of date, and it does not show a record version. Never decide from the copy, never copy a proof from it into a save, and never take an `expectedVersion` from it.
3. A bound tool is current when all of these are true in `factory workflow show`:
   - the tool is still on the machine, and its state is still `available`;
   - the tool reports the same version that its proofs name;
   - each capability that a role needs has a `proved` proof for that version.
4. Reuse a current bound tool and its proofs. Do not prove it again. Prove every other tool before you save it, also when the copy lists it, because a save holds the full list of its proofs.

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
