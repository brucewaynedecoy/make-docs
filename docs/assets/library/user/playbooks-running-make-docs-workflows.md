---
title: "Running Make Docs Playbooks"
kind: "guide"
path: "playbooks"
persona: "user"
status: "draft"
order: 100
tags:
  - playbooks
  - workflows
  - run-playbook
applies-to:
  - playbooks
  - workflows
related:
  - ../developer/playbooks-development-runner-architecture.md
  - ./workflows-how-make-docs-stages-fit-together.md
  - ../developer/development-workflows-stage-model-and-artifact-relationships.md
  - ../../../prd/29-revise-playbook-contract-run-playbook.md
  - ../../../prd/30-revise-harness-plugin-substrate-workflow-bundles.md
  - ../../../prd/33-enhance-playbook-packaging-and-harness-adapter-registry.md
  - ../../../prd/34-revise-playbook-contract-and-model.md
  - ../../../prd/35-revise-run-playbook-state-machine.md
  - ../../../prd/40-revise-playbook-authoring-contract-v2.md
  - ../../../prd/41-revise-cli-human-experience-and-package-grammar.md
  - ../../../../.make-docs/contracts/system/playbook-contract.md
  - ../../../designs/2026-06-27-run-playbook-orchestration-and-harness-capabilities.md
  - ../../../designs/2026-06-29-playbook-packaging-and-harness-adapter-registry.md
---

# Running Make Docs Playbooks

This guide describes Playbooks in Make Docs v2. The run lifecycle it documents — validating, cataloging, starting, advancing, gating, resuming, moving between machines, and closing a run — is implemented, and every behavior in those sections is verified by the runner's automated test suite. The plugin and packaging sections toward the end still describe accepted direction for surfaces that are landing in later waves.

## What a Playbook Is

A Playbook is a reusable workflow document that Make Docs can validate, select, and run with an agent. It is still readable Markdown, but it has enough structure for Make Docs to know what the workflow is for, what authority it depends on, what inputs it needs, where it may write outputs, and when a human decision is required.

Playbooks live under `docs/assets/playbooks/<persona>/<slug>.playbook.md`. The stable identity is `persona/slug`. An older plain `<slug>.md` file with `kind: playbook` frontmatter is still recognized, but it is a deprecated form: validation flags it with a warning that asks for a rename to `<slug>.playbook.md`. A Playbook also declares a required `stack` value so Make Docs can distinguish between build workflows and run workflows.

The normative document schema — the filename form, frontmatter, required section order, workflow contract block, and dependency registry — is [the Playbook contract](../../../../.make-docs/contracts/system/playbook-contract.md). This guide covers what users do with Playbooks; the contract is the authority for what a Playbook file must contain.

Since the W18 R12 revision that contract is schema v2, written for the human author. The frontmatter declares the short version keys `schema: make-docs.playbook.v2` and `workflowSchema: make-docs.workflow.v1`; the required headings use plain words — `## Inputs`, `## Workflow`, `## Gates`, `## Outputs`, alongside the unchanged `## Purpose`, `## When To Use`, `## Dependencies`, `## Step Guidance`, `## Validation`, and `## Packaging Notes` — and dependencies are declared as a small fenced YAML block (info string `playbook`, top-level key `dependencies:`) instead of a positional table. Each dependency entry names an `id`, `kind`, and `requirement`, may declare a `probe` — the actual binary or reference an availability check should verify, defaulting to the `id` — and carries free-text `source` and `fallback` prose that Make Docs never parses for machine meaning, so provenance notes like `system install of git` are safe to write naturally. The break from the earlier v1 shape is clean: an old-form document does not validate, and each old form fails with an error naming the exact v2 replacement — a `## Dependencies` table is pointed at the fenced `dependencies` block, the old `schemaVersion`/`workflowSchemaVersion` keys at `schema`/`workflowSchema`, and an old heading spelling at the v2 heading for its slot — so migrating an old draft is a matter of following the messages. The contract's worked example shows the full v2 shape, and the installed default Playbook below is a complete conformant document to copy from.

## Installed Default Playbook

A default Make Docs install includes the Make Docs lifecycle Playbook at:

```text
docs/assets/playbooks/agent/make-docs-lifecycle.playbook.md
```

This Playbook is a readable workflow for the `agent` persona. It describes how an agent should move through the Make Docs lifecycle from source evidence to design, plan, PRD, work backlog, implementation, validation, closeout, and history.

Users can inspect available Playbooks with:

```sh
make-docs run playbook catalog --repo-root .
```

The catalog lists each Playbook by its canonical reference — `agent/make-docs-lifecycle` for the default — with its title, summary, stack, status, file form, whether it is currently runnable, and its error and warning counts.

They can validate one Playbook, several, or every installed Playbook with:

```sh
make-docs run playbook validate agent/make-docs-lifecycle --repo-root .
```

References may be canonical `persona/slug` values or explicit `.md` paths; with no references, every detected Playbook is validated. Each finding carries a stable code such as `PB-FM-002`, a severity of `error` or `warning`, the section and source location where it was found, a message, and a fix hint. A Playbook with zero errors is runnable; warnings do not block it. The most common warning during migration is `PB-FILE-007`, which asks for a rename from the deprecated plain `<slug>.md` name to `<slug>.playbook.md`.

MCP-capable agent harnesses reach the same behavior through the `make_docs_playbook_validate` and `make_docs_playbook_catalog` tools.

They can start the current operation-level invocation model with:

```sh
make-docs run playbook invoke agent/make-docs-lifecycle --repo-root . --harness codex --stack build
```

The command validates the Playbook and creates Make Docs run state. It does not bypass review gates or turn the Playbook into a plugin.

Run state lives in the machine-level global store at `~/.make-docs/`, not in your repository. Starting or invoking a run writes nothing under the project — there is no `.make-docs/runs/` clutter to commit or ignore — and the run is keyed to the stable project identity Make Docs minted at setup plus a run identifier, so it survives moving or renaming the repository directory. This also means Playbook runs need a set-up project: in a repository without Make Docs installed, or with an older install that predates the project identifier, `run playbook start` and `run playbook invoke` stop with guidance to run `make-docs setup` (or run `make-docs` once to mint the identifier) instead of writing state anywhere. `make-docs run playbook status --run-id <id>` reads the same stored record back for resume or audit.

A started run is no longer read-only: the full lifecycle from start to a terminal status can be driven from the CLI or MCP. See Driving a Run from Start to Close below.

## What Users Can Do With Playbooks

Users will be able to use Playbooks as repeatable workflows instead of rebuilding Make Docs procedure knowledge from scratch each time.

A maintainer might run a build-stack Playbook to move from an idea to a design, from a design to a plan, from a plan to PRD updates, or from a work backlog to closeout. These Playbooks operate on Make Docs-managed artifacts and are expected to respect the documentation lifecycle.

A project user might run a run-stack Playbook to use an installed workflow against their own project. That might mean capturing a change request, running a guided project workflow, or using a shipped workflow bundle without needing to understand Make Docs internals.

A team can also install Playbooks as shared project assets. The Playbook remains a readable document, while Make Docs provides the runner, resolver, validation, state, and harness mediation needed to execute it safely.

## How a Run Starts

A Playbook run can start from different surfaces:

- A person can ask an agent to run a Playbook by name, by `persona/slug`, or by an explicit path.
- `make-docs run playbook invoke <ref> --harness <id>` can resolve and validate the Playbook, create Make Docs-owned run state in the global store, and return the next gated step without requiring a plugin.
- `make_docs_playbook_invoke` exposes the same write-gated behavior to MCP-capable agent harnesses when the caller passes `allowWrite=true`.
- A plugin or workflow bundle can present a guided entry point that invokes the same Run Playbook behavior underneath.

The current operation command is a deterministic Make Docs operation surface, not a polished product shortcut. The important contract is that these entry points all use the same resolver, validator, run-state model, and safety rules.

## Reading Command Output

Since the W18 R12 revision, `make-docs run` commands answer a person and a program differently, without either audience losing anything:

- **On a terminal**, each command prints a short human summary instead of a JSON dump: what just happened (for `advance`, the step that ran, its mode, and its outcome), a one-line picture of where the run stands, the run's current guidance hints, and — as the last line — the exact next command to run. You can drive a whole run by running the last line of each output.
- **With `--json`, or whenever output is piped or redirected**, the command emits the full operation result as JSON, exactly as before. Scripts, agents, and transcripts need no flag and see no change.

The summaries stay short on purpose. The harness-capability details print once, when `start` reports them; later summaries reference the full record instead of repeating it, and the run's evidence log is never echoed into the terminal. Nothing is hidden by that: `make-docs run playbook status --run-id <run-id> --json` (or `--json` on any command) always returns the complete stored record.

A few everyday conveniences landed in the same revision:

- **Run-id prefixes and `--last`.** Anywhere a command takes `--run-id`, an unambiguous prefix of the id is enough — `--run-id 2026-07-03T09` resolves as long as only one run matches, and an ambiguous prefix fails listing the candidates. `--last` skips the id entirely and selects the project's most recent run, which is usually the one you are driving.
- **`--repo-root` is optional inside a project.** It defaults to the nearest ancestor directory carrying `.make-docs/manifest.json`, so commands run from anywhere inside a set-up project without the flag; pass it only to point at a different project. The examples below keep `--repo-root .` for explicitness, but you can drop it.
- **Quieter startup.** The Node SQLite experimental warning no longer prints on every invocation; other warnings still surface.

## Driving a Run from Start to Close

A run started from the CLI can now be carried all the way to a terminal status. Each step below also works through the matching MCP tool (`make_docs_playbook_next`, `make_docs_playbook_advance`, `make_docs_playbook_gate`, `make_docs_playbook_resume`, `make_docs_playbook_close`) in an MCP-capable harness; the recording tools require the caller to pass `allowWrite=true`, while `next` is read-only.

Start a run against a set-up project and note the run identifier it returns:

```sh
make-docs run playbook start agent/make-docs-lifecycle --repo-root . --harness codex
```

Ask where the run stands whenever you need direction:

```sh
make-docs run playbook next --repo-root . --run-id <run-id>
```

`next` never changes the run. It reports the current position — a step to execute, a gate waiting for a decision, `blocked` with the reasons, `closeable` when no workflow position remains, or `closed` after finalization — along with the step's title, mode, and invocation, whether its required dependencies are recorded as available, and what to do about anything in the way. A required dependency recorded as unavailable blocks the position; one with unknown availability comes back as probe-first guidance instead. `make-docs run playbook status --repo-root . --run-id <run-id> --json` still returns the raw stored record when you want the full state instead of a recommendation; without `--json` on a terminal, `status` prints the same short summary shape as the other commands.

Then advance the run. What `advance` does depends on the step's execution mode, which `next` reports:

```sh
make-docs run playbook advance --repo-root . --run-id <run-id>
```

- A `deterministic` step executes itself. Make Docs runs the step's declared operation or command, captures what happened — the exit code and output, or the operation's result — as run evidence, and moves the cursor automatically. If you would rather run the command yourself, pass `--present`: Make Docs prints the exact command to run by hand and holds the step; run it, then advance again with `--outcome` and your evidence to report what happened.
- A `delegated` step — and any step that declares no mode — is work for you or your agent. `advance` presents the step's instructions and holds the run at `waiting-for-user`. Do the work, then advance again with `--outcome completed` or `--outcome failed`, citing evidence:

  ```sh
  make-docs run playbook advance --repo-root . --run-id <run-id> --outcome completed \
    --evidence-ref docs/path/to/proof.md --note "What was done"
  ```

  The run only moves past a delegated step on a reported outcome.
- A `manual` step is documentation only. Acknowledge that you read it with `--acknowledge`; it takes no outcome and executes nothing.

Recording `--outcome failed` holds the run for review unless the Playbook declares an explicit failure route. `--evidence-ref` and `--output-ref` repeat for multiple references, and everything recorded — including what deterministic steps executed — lands in the stored run record for audit and resume.

When the run is positioned at a gate, record the decision instead of advancing:

```sh
make-docs run playbook gate --repo-root . --run-id <run-id> --decision approve
```

`approve` moves the run past the gate; `reject` stops it at the gate for re-planning. Gate decisions also accept `--evidence-ref` and `--note`.

If a run is blocked — a failed step, a rejected gate — or you are returning to it after an interruption, re-enter it:

```sh
make-docs run playbook resume --repo-root . --run-id <run-id>
```

Resume first checks that the Playbook file has not changed since the run started, by comparing the content digest stored at `start` with the current file. When they match, the run reopens at the same position it held; resume never skips work or moves the cursor. After resuming, retry the step with `advance`, revisit the gate with `gate`, or finalize instead.

If the Playbook file did change, resume refuses: the run is marked stale and blocked, and the error names the file, both digests, and which step identifiers were added or removed. A stale run also refuses `advance` and `gate` — Make Docs never silently continues a run against a changed workflow. From there you have three honest options: start a fresh run against the current Playbook with `start`, revert the Playbook change and resume again (the block clears when the digests match), or explicitly migrate the existing run onto the changed Playbook:

```sh
make-docs run playbook resume --repo-root . --run-id <run-id> --migrate
```

`--migrate` is an opt-in, never the default. It keeps the recorded status of every step that still exists in the changed Playbook, treats newly added steps as not yet done, drops steps that no longer exist (naming them in the run's evidence), and re-enters at your surviving position. Use it when the change edited the workflow around your progress; prefer a fresh run when the workflow was redesigned.

When `next` reports the run is `closeable` — or you decide to end it early — finalize it:

```sh
make-docs run playbook close --repo-root . --run-id <run-id> --terminal-status completed
```

`close` is the only operation that stamps the terminal status (`completed`, `failed`, or `cancelled`), and a closed run refuses any further changes. Reaching the end of the workflow does not auto-close a run; the run waits for you so the closeout decision stays explicit.

The guidance hints a run carries — the "what to do next" advice printed in the terminal summaries and returned by `status --json` as part of the stored record — always reflect only unresolved work. Advice about a step or gate that has since completed, failed, been skipped, or been rejected is retired automatically on the next transition, and closing a run clears its guidance hints entirely, so a closed run carries none. Nothing is lost by that: the full history of what happened stays in the run's evidence log, which hint retirement never touches.

## Moving a Run to Another Machine

Run state lives in the machine-level global store, so it does not travel with the repository. To hand a run off — say you started it on your desktop and want to finish it on a laptop — export it explicitly on machine A:

```sh
make-docs run playbook run export --run-id <run-id> --output ~/handoff/<run-id>.json
```

Export packages the run record and everything it has recorded — step statuses, gate decisions, and the full evidence log — into one portable JSON file. It is strictly opt-in and never touches your repository: without `--output` the artifact is only printed for you to save, and with it the file goes exactly where you named, so no run state ever lands in the project by default.

Move the file to machine B, open the same repository there (a clone works — the project identity travels in `.make-docs/manifest.json`), and import it:

```sh
make-docs run playbook run import --artifact-json ~/handoff/<run-id>.json
```

`--artifact-json` accepts a path to the exported file or the JSON itself. Import checks the artifact before writing anything and refuses the situations that would silently lose or misfile work: a malformed or unsupported artifact is rejected outright, a run with the same identifier already in the local store requires an explicit `--overwrite`, and an artifact exported from a different project requires an explicit `--adopt-project` before it is re-keyed to the local project (the run's evidence records where it came from either way). Once imported, the run behaves as if it had always lived there — re-enter it with `resume` and continue with `next`, `advance`, and `gate` as usual.

MCP-capable harnesses reach the same pair through `make_docs_playbook_run_export` and `make_docs_playbook_run_import`, both requiring `allowWrite=true`.

## The Simplest Run

In the simplest arrangement, an agent or runner performs the Playbook step by step.

Make Docs resolves the selected Playbook, validates the metadata and required sections, loads the referenced authority, creates run state, and then proceeds through the workflow. When the Playbook reaches a gate, decision, missing input, conflict, or unsafe write, the run pauses and asks for review instead of guessing.

This basic mode does not require special harness support. It is serial, review-oriented, and intentionally conservative.

## Runs With Harness Assists

Some agent harnesses can help with long-running work. A harness might support goal-managed execution, resumable sessions, subagents, parallel work, or native prompts for user gates.

Make Docs does not guess that a harness has those capabilities. Reviewed harness capability records belong in `.make-docs/config.yaml`. When a capability is unknown, Make Docs either asks the agent to inspect and request review before recording it, or falls back to serial gated execution.

This is enforced, not advisory: a run whose Playbook requires a capability that is unknown or unsupported is created blocked with guidance, and it refuses `advance`, `gate`, and `resume` until the capability record is reviewed and you start a fresh run (`close` stays available so you can always finalize it). When an optional capability is unavailable, the run proceeds serially and gated, and the fallback guidance is recorded on the run itself.

Harness features are assists. The Playbook contract, resolver, run state, gates, and output-surface rules still belong to Make Docs.

## Unattended Runs

A run is attended by default: every gate waits for a human decision. Unattended operation is a double opt-in — the Playbook's run metadata must declare `unattended: true`, and you must pass `--unattended` when starting the run. Asking for an unattended run of a Playbook that does not permit one fails at start rather than quietly running attended.

Even in an unattended run, only gates the Playbook individually marks as permitting unattended continuation proceed without you. Make Docs records each of those automatic approvals in the run's evidence, so the audit trail shows exactly which gates were passed unattended. Every other gate holds the run at `waiting-for-user` until someone records a real decision with `gate` — an unattended run never bypasses a gate that wants a human.

## Nested And Parallel Runs

Some Playbooks can call other Playbooks. A parent Playbook must explicitly permit child Playbooks in its metadata — a parent that does not, or one that has already been closed, refuses to start children. Each child run links to its parent and to the root run of the whole tree, so the family stays auditable at any nesting depth, and children run serially by default.

Running children in parallel takes three things at once: the parent's explicit parallel permission, evidence that parallel execution is actually safe on your harness (a reviewed capability record, or an explicit reviewed approval passed at start), and output-surface claims that do not overlap the parent or any sibling. When any of those is missing, the child does not start and the error tells you the safe alternative: start it serially, which is always the default.

Overlap protection applies beyond siblings. Starting any run whose claimed output surfaces overlap another open, unrelated run stops with an error naming the conflict, and the block clears once the conflicting run closes. The same check runs during execution: a step that declares output surfaces already claimed by another open run refuses to advance. Make Docs stops rather than letting two runs interleave writes to the same files — a serial child working inside its parent's surfaces is fine, because parent and child never write at the same time.

This allows larger workflows to be composed without making concurrency the default behavior.

## Plugins And Workflow Bundles

Plugins and workflow bundles are user-facing entry points. A plugin can expose a guided workflow in a harness-native way, but it does not become a separate Playbook runner.

When a plugin runs a Playbook, it should invoke the generic Run Playbook model. That keeps CLI, MCP, plugin, and agent-driven runs aligned around the same validation, state, gates, and permission behavior.

## Packaging Playbooks

Make Docs also plans to let reviewed Playbooks become shareable harness-specific outputs. A Playbook can remain a normal Markdown workflow while Make Docs generates a package plan for a plugin or skills bundle that exposes the workflow in a harness-native way.

Packaging is not blind conversion. Make Docs should validate deterministic parts such as Playbook identity, source digest, selected harness, output kind, surface, and lifecycle ownership. Semantic fields such as plugin descriptions, skill grouping, or harness-native wording may be drafted by an agent, but they require review before Make Docs writes generated outputs.

The generated package should point back to the source Playbook and use the same runner model when it is invoked. The packaged output is a distribution artifact; the Playbook remains the editable source.

## What Playbooks Do Not Do

Playbooks are not hidden automation scripts. They should remain readable and reviewable.

Playbooks do not bypass gates just because a user starts them from a CLI, MCP tool, plugin, or harness. Unattended behavior must be explicitly allowed by the Playbook and by the runner surface.

Playbooks also do not redefine Make Docs authority. If a Playbook changes PRDs, plans, work backlogs, or package behavior, it still has to follow the appropriate Make Docs contracts and lifecycle.

## Future Coverage

This guide should be refreshed after W18 implementation lands with plugin entry points, packaging commands, package-plan review examples, and a small set of end-user examples that can be run against an installed Make Docs project.

- The former bullet on a reader-facing projection of the Playbook contract is resolved with the W18 R7 wave complete: no separate projection guide is warranted. The contract remains the normative, linkable authority for what a Playbook file must contain; this guide owns what users do with Playbooks, including the now-implemented and verified start-to-close run lifecycle; and a prose projection would restate both without giving a reader a task to complete. Revisit only if user-authored Playbooks become a primary authoring surface with questions this guide and the contract do not answer.
- Blocked by: W18 R12 Phase 4 (the PRD 37/W18 R9 reconciliation) and the W18 R9 conformance wave. The hand-run UAT walkthrough documents were written against the pre-W18 R12 JSON-dump output and old packaging spellings and have not been regenerated; scenario transcripts that consume CLI output must pin `--json` per the reconciliation. Update when: the reconciled scenarios and regenerated walkthroughs exist. Guide change: fold in a validated set of end-user examples with their real terminal output, replacing the illustrative command shapes here.

## Related Resources

- [How Make Docs Stages Fit Together](./workflows-how-make-docs-stages-fit-together.md)
- [Run Playbook Runner Architecture](../developer/playbooks-development-runner-architecture.md)
- [29 Revise Playbook Contract Run Playbook](../../../prd/29-revise-playbook-contract-run-playbook.md)
- [30 Revise Harness Plugin Substrate Workflow Bundles](../../../prd/30-revise-harness-plugin-substrate-workflow-bundles.md)
- [33 Enhance Playbook Packaging and Harness Adapter Registry](../../../prd/33-enhance-playbook-packaging-and-harness-adapter-registry.md)
- [34 Revise Playbook Contract and Model](../../../prd/34-revise-playbook-contract-and-model.md)
- [35 Revise Run Playbook State Machine](../../../prd/35-revise-run-playbook-state-machine.md)
- [40 Revise Playbook Authoring Contract v2](../../../prd/40-revise-playbook-authoring-contract-v2.md)
- [41 Revise CLI Human Experience and Package Grammar](../../../prd/41-revise-cli-human-experience-and-package-grammar.md)
- [Playbook Contract](../../../../.make-docs/contracts/system/playbook-contract.md)
- [Run Playbook Orchestration and Harness Capabilities](../../../designs/2026-06-27-run-playbook-orchestration-and-harness-capabilities.md)
- [Playbook Packaging and Harness Adapter Registry](../../../designs/2026-06-29-playbook-packaging-and-harness-adapter-registry.md)
- [Packaging Shareable Agent Workflows](./playbooks-packaging-shareable-agent-workflows.md)
