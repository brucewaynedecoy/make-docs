# Save and Test

Use this reference for setup Step 5 and for a rerun. Every project write names the project with `--target-root <checkout>` or `--project <name>` (MCP `targetRoot` or `project`). Never rely on the current folder for a write (`writes-name-project`).

## 1. Write the Config Entry

Write the workflow's portable choices under `factory.workflows.<workflow>` in the checkout's `.make-docs/config.yaml`. Keep every other key in the file as it is. Use a short workflow name, such as `main`, unless the person asked for another one.

```yaml
factory:
  workflows:
    main:
      type: build-then-review
      typeVersion: 1
      roundLimit: 3
      limits:
        claimSize: phase
      steps:
        preflight: false
      humanChannel: wait-in-session
      roles:
        front-desk:
          job: Talk to the person and pass each request to the foreman.
          capabilities: [read-write-files]
          returns: The unit or quick item, and the person's answers.
        foreman:
          job: Claim the unit, brief, judge, and accept or escalate.
          capabilities: [read-write-files, run-commands, launch-agent, wait-for-agent, read-agent-result]
          returns: Accepted units and escalations.
        builder:
          job: Do one bounded job.
          capabilities: [read-write-files, run-commands]
          returns: The actual result and its evidence.
        reviewer:
          job: Check the result against the requirements.
          capabilities: [read-write-files, run-commands]
          returns: A pass, or a list of defects with evidence.
```

- `typeVersion` is the number on the type file's `Type version: N` line (`type-version`). The CLI refuses another number with `type-version-mismatch`.
- `humanChannel` is the channel kind: one short name for how the factory reaches the person. It is never an account. The CLI has no fixed list of kinds. It refuses a workflow without this field, and it accepts any name of at most 64 characters that starts with a lower-case letter, uses only lower-case letters, digits, and single hyphens, and does not look like a key or a token. The CLI saves the kind in the plan and prints it in the local copy. No other check reads it. Use `wait-in-session` for "wait in session". For a tool, use the kind of the tool that is the channel, such as `messaging-tool` or `agent-harness`. A change of the value after a save gives the drift code `config-changed`.
- Add `integrationOwner: <role>` when parallel workers can change the same files. Add `limits.parallelWorkers`, `gates`, and `escalations` only when the person chose them.
- Leave out `context` for the standard roles, so they keep the contract defaults (`role-context`). A custom role must list its context kinds (`custom-role-context`).
- The block holds portable choices only. Never put a tool ID, a path, an account, a digest, a grant, or a never-log item in it (`grants-not-committed`, `no-secrets`).

## 2. Save the Workflow

Save the bindings and any grants with `factory_workflow_save`, or with the CLI:

```text
make-docs factory workflow save <workflow> --binding-json <file> --grants-json <file> --target-root <checkout>
```

The binding holds `roles` (each role and its tool ID), `worktreeMethod`, `channelRef`, `wakeMethod`, `wakeRef`, and `knownLosses` (each loss that the person accepted). A new workflow needs no `--expected-version`. A saved workflow needs the `binding.version` that `factory workflow show` gives.

Leave out `--grants-json` when the person gave no grant and no grant changes. The grants file has two lists, `add` and `revoke`:

```json
{
  "add": [
    { "action": "merge", "scope": "once", "runId": null, "expiresAt": "2042-07-01T00:00:00.000Z", "grantedBy": "the person" }
  ],
  "revoke": [
    { "grantId": "<grant ID from factory workflow show>", "expectedVersion": 1 }
  ]
}
```

- A grant to add holds `action`, `scope`, `runId` (`null` at setup), `expiresAt` (an ISO-8601 time or `null`), and `grantedBy`.
- A grant to revoke holds the `grantId` and the `expectedVersion` (the grant's `version`) of one row in the `grants` list that `factory workflow show` gives.
- Leave out a list that has no entry.
- On a rerun, read the `grants` list first. Revoke each grant that the person no longer wants, or that the new choices replace, and add each new grant. A grant changes only through `add` and `revoke`.
- To change only grants, leave out `--binding-json`. That grant-only save writes and revokes grants. It resolves no plan, saves no plan revision, and does not change readiness, so it needs no new test task.

The CLI makes the resolved plan from the config entry, the saved binding, the machine tool rows, and the type file (`plan-generated`). It saves a new plan revision only when no kept revision has the same plan. The result gives the plan revision number, its plan digest, and the readiness: `wired` when each role has a tool with each needed capability proved, and `draft` when one does not.

When the save is refused, nothing changed. Fix what the refusal names and save again:

| Reason code | What it means | What to do |
| --- | --- | --- |
| `unknown-capability` | A capability ID is not in the catalog. | Use an ID from the contract's catalog. |
| `type-version-mismatch` | The config names another type version. | Set `typeVersion` to the type file's number. |
| `never-log-field` | A field looks like a credential or an environment setting. | Remove that value. The refusal names the field. |
| `project-missing` | The call named no project. | Add `--target-root <checkout>` or `--project <name>`. |
| `project-not-found` | The Store does not know that project name. | Use the checkout path, or a name from `make-docs project list`. |
| `project-mismatch` | The path and the name give two projects. | Name one project. |
| `project-checkout-unclear` | The name gives no single checkout. | Name the checkout with `--target-root`. |
| `invalid-record` | A role, a binding, or a field is not valid. | Fix the field that the refusal names. |
| `version-conflict` | The workflow changed since you read it. | Read it again with `factory workflow show`, then save with its version. |

## 3. Tell the Person the Plan

Before the test task, tell the person in plain words what was saved, for example: "Make Docs saved plan revision 1 of workflow `main` for project `<project>`. Its digest (a short fingerprint of the exact saved plan, so any change gives a new one) starts with `aed0828d14c8`. The test task runs under this exact plan." Keep the full digest for the proof save.

## 4. Run the Test Task

Run one small test task from intake to return, through the real workflow and the bound tools:

1. The front desk takes a tiny request through the human channel, for example "Write the code word in a new scratch file".
2. The front desk passes it to the foreman.
3. The foreman starts a fresh builder with a bounded brief, waits for it, and reads its result.
4. The foreman starts a fresh reviewer, which did not build the work. The reviewer checks the result against the request.
5. The foreman judges the reviewer's evidence and the actual result.
6. The front desk returns the result to the person through the human channel.
7. Remove the scratch file and any test working copy.

Do not change the config entry, the binding, or the tools between the save and the proof save. The test task does not add a work unit or an assignment record, because those need a `ready` workflow.

## 5. Save the Proof

Save the result with `factory_proof_save`, or with the CLI. Use the same plan digest that the save gave:

```text
make-docs factory proof save <workflow> --outcome passed --test-task <text> --plan-digest <digest> --path <step> --path <step> --manual-step <text> --target-root <checkout>
```

- `--test-task` is the test task as one short line, never its brief.
- `--path` is one short line for each step that the test task exercised, such as "reviewer: a fresh agent of tool A checked the result". Repeat it for each step.
- `--manual-step` is one short line for each open manual step. Repeat it for each step.
- `--expected-version` is needed only when the workflow already has a saved result with the same outcome, for example on a rerun. Use the `proofs.passed.version` or `proofs.failed.version` that `factory workflow show` gives. Leave it out for the first result.

A passed proof makes that revision the `ready` revision. The workflow is `ready` and takes new work (`ready-needs-proof`). When the test task failed, save it with `--outcome failed`, tell the person what failed, fix it, save the workflow again, and run a new test task.

| Reason code | What it means | What to do |
| --- | --- | --- |
| `plan-digest-mismatch` | Something changed after the save, so the digest is not the current plan's digest. | Run `factory workflow show`, find what changed, save again, and run a new test task. |
| `not-ready` | A role is not bound to an available tool with each capability proved. | Bind and prove that role, save again, and run a new test task. |

Then run `factory_status`, or `make-docs factory status --target-root <checkout>`, to check that the workflow is `ready` and to see its open manual steps. A Store receipt is never product acceptance (`receipt-not-acceptance`).

## Rerun

A rerun updates the same workflow and keeps its name (`rerun-same-workflow`).

1. Read the saved workflow with `factory_workflow_show`, or `make-docs factory workflow show <workflow> --target-root <checkout>`. Note its `binding`, its `binding.version`, its readiness, and each drift entry.
2. Find and read the tools again. Reuse each tool and proof that is still current.
3. Run the interview only for what the person wants to change, and for each new known loss.
4. Show the person what changed, before you save. List each change as old and new: each role's tool, the wake method, the human channel, the working-copy method, the known losses, the config choices, and the grants. Explain each drift reason code in plain words:

| Drift code | Plain words |
| --- | --- |
| `config-changed` | The workflow's entry in the config file changed without a save. |
| `binding-changed` | The saved tool facts for the workflow changed. |
| `type-changed` | The workflow type file changed. |
| `type-name-clash` | A project type uses a shipped type's name. |
| `tool-missing` | A bound tool is gone. |
| `tool-version-changed` | A bound tool reports a new version, so its proofs no longer hold. |
| `proof-contradicted` | A proof that a role needs now fails. |
| `permission-lost` | A bound tool lost a permission that it needs. |

5. Prove again each capability and binding that changed. A new tool for a role: prove each capability that the role needs on that tool. A new tool version: prove each capability of that tool again. A new human channel: prove `message-person` and `receive-answer`. A new wake method: prove that wake. Keep the proofs of what did not change.
6. Save the tools, then save the workflow with its `--expected-version`. A changed plan gets a new revision, and the workflow is `wired` until a new test task passes. When the save gives back the exact plan of the `ready` revision, the workflow is `ready` again with no new test task.
7. Run the test task under the new revision. Save the proof with the new digest and with `--expected-version` set to the `proofs.passed.version` that `factory workflow show` gives. Close with the summary. The summary lists what changed.
