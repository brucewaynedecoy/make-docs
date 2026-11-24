# Wire and Prove

Use this reference for setup Step 4. Give each role a tool because of what it proved it can do, not because of its name (`match-by-capability`).

## Which Capabilities Each Role Needs

Take each role and its capability IDs from the workflow type's `## Roles` table, and add any capability that the person's choices need:

- the front desk needs `message-person` and `receive-answer` for a messaging channel, or only `read-write-files` for "wait in session";
- the wake tool needs `wake-on-schedule` or `wake-on-event`, for that wake method;
- a builder for software work needs `edit-code`;
- a separate working copy for each worker needs `isolate-working-copy`.

Then give each role a tool that proved every capability that the role needs. One tool can fill more than one role. A reviewer is never the session that built the work, so a reviewer is a fresh agent even when its tool also builds.

## The Smallest Setup

The smallest setup is one agent tool that proves `read-write-files`, `run-commands`, `launch-agent`, `wait-for-agent`, and `read-agent-result` (`smallest-setup`). That one tool is the front desk and the foreman. Builders and reviewers are fresh subagents that it starts. The human channel is "wait in session", and the wake method is `person`.

Bind each role to that tool:

```json
{
  "roles": { "front-desk": "tool-a", "foreman": "tool-a", "builder": "tool-a", "reviewer": "tool-a" },
  "worktreeMethod": "none",
  "channelRef": null,
  "wakeMethod": "person",
  "wakeRef": null,
  "knownLosses": ["No tool can wake on its own, so the factory runs only while a session is open."]
}
```

## A Multi-Tool Setup

When more tools are present, setup uses them. Give each role the tool that proved what the role needs. The roles stay the same whatever the tools are called. For example, tool C is the front desk because it proved `message-person` and `receive-answer`, tool D is the foreman because it proved the five foreman capabilities, tool E is the builder because it also proved `edit-code`, tool F is the reviewer, and tool G wakes the foreman because it proved `wake-on-schedule`.

The human channel account and the wake binding are references that hold no secret, such as a channel name. They go in `channelRef` and `wakeRef`. Never put a key, a token, an address with a secret in it, or any other never-log item there.

## How to Prove Each Capability

Prove each capability of each tool that you bind to a role. Use the method in the contract's capability catalog. Use a scratch file with a new name that no other file uses, and remove it at the end. Never change or remove a file that was already there.

| Capability | Proof |
| --- | --- |
| `read-write-files` | Write a small scratch file with known text, read it back, compare the text, and delete the file. |
| `run-commands` | Run a harmless command with a known output. Check the output and the exit status. |
| `launch-agent` | Start one fresh agent with a tiny brief. Record that a task handle came back. |
| `wait-for-agent` | Wait on that handle until the agent says that it is done, with no help from the person. |
| `read-agent-result` | Read the result through the handle. Check that it holds the code word that the brief asked for. |
| `wake-on-schedule` | Set one wake a short time ahead. Check that the woken session started and wrote one line to a scratch file. Remove the test wake. |
| `wake-on-event` | Cause one test event. Check that the woken session started and wrote one line to a scratch file. |
| `message-person` | Send one test message through the channel. Ask the person whether they got it. |
| `receive-answer` | Ask the person to answer the test message with a code word. Check that the exact code word came back. |
| `isolate-working-copy` | Make a working copy, change a file in it, show that the main copy did not change, and remove the working copy. |
| `edit-code` | Make one given small change. Show that the diff holds only that change and that the project's checks ran. |

A code word is a short made-up word for this proof only. Never record it, a brief, or a result's text in a proof.

## Record Each Proof

Record one proof for each capability of each bound tool (`proof-record`). Each proof holds:

- `capabilityId`: the capability;
- `method`: how setup proved it, as one short line;
- `toolVersion`: the version that the tool reported when the proof ran, or `null`;
- `provedAt`: the proof time, as an ISO-8601 time;
- `result`: `proved` when the proof passed, `unproved` when the docs claim it but setup could not run the proof, or `contradicted` when setup ran the proof and the tool failed it;
- `notCovered`: each part that the proof did not test, one short line each, for example "waits longer than one session".

Be honest in the "does not cover" list. Each line on it becomes a known loss that the person must accept. A role never depends on an `unproved` or `contradicted` capability (`unproved-stays-visible`). When a needed capability is `unproved` or `contradicted`, pick another tool, or tell the person what the workflow cannot do.

Save the tools and their proofs on this machine with `factory_tools_save`, or with the CLI. This command takes no project:

```text
make-docs factory tools save --tools-json <file>
```

The file holds a list of tools. Each tool has `toolId`, `kind`, `label`, `state` (`available`, `missing`, or `blocked`), `reportedVersion`, `capabilities`, `proofs`, and `expectedVersion`. Use `null` as the `expectedVersion` of a new tool. For a tool that the Store already holds, use the record version (`version`) that `factory tools list` shows for it, or that the last save result gives for it. Never take it from the `.make-docs/factory/tools.md` copy. When the save is refused with `version-conflict`, use the version that the refusal names (`details.currentVersion`), and retry with the full list of proofs that you ran in this setup. A free-text value is one line of at most 120 characters. The CLI refuses a value that looks like a credential or an environment setting with `never-log-field`, and names the field, never the value.

## A New Tool Version

A proof holds only for the tool version that it names (`reprove-on-version-change`). When a bound tool reports a new version, the workflow is `drifted` with the reason code `tool-version-changed`, and it takes no new work. To make it `ready` again:

1. Run each proof of that tool again under the new version, and save the proofs with `factory tools save`.
2. Save the workflow with `factory workflow save`. This makes a new plan revision.
3. Run a new test task under that revision, and save it with `factory proof save`.

If the old version comes back first, the plan matches the `ready` revision again. The workflow is `ready` with no new step.

## Other Changes to a Tool

- When a bound tool is gone, save it as `missing`. The workflow drifts with `tool-missing`.
- When a bound tool lost a permission that it needs, such as an app permission or a sign-in, save it as `blocked`. The workflow drifts with `permission-lost`. Getting the permission back is a manual step for the person.
- When a proof that passed now fails, save it as `contradicted`. The workflow drifts with `proof-contradicted`.

Never fix a sign-in, a permission, a payment, or an install yourself.
