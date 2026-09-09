# Pre-Design Spec: Three Project-Local Skills

Status: Non-authoritative draft for owner review. This document proposes skill behavior and structure. It does not change product requirements or authorize skill implementation.

Date: 2026-09-05.

**Later status — 2026-09-05:** The owner retired the old Phase skill after trying the three new skills. References to that skill below describe the original study. They do not ask agents to use or restore it. The [retained evidence](retired-local-state/README.md) records the narrow cleanup.

Source: [Reviewed intent](2026-09-05-project-local-skills-intent.md), with the owner's later confirmation of three skills and the Make Docs planning boundary.

## Intended Result

Create three project-local skills. Each serves a distinct request:

| Proposed name | Human purpose | Main result |
| --- | --- | --- |
| `preflight` | Settle the choices needed before a phase starts. | Clear decisions and a useful readiness summary. |
| `software-factory` | Complete approved backlog work through coordinated work and review. | A checked result with direct evidence and clear remaining work. |
| `human-experience` | Make an assigned result clear, usable, and pleasant for people. | Better work, or a focused review with evidence. |

The count is settled at three. The names and operating details below are proposals for review. These skills are used only on explicit request. Ordinary direct implementation remains available without the factory.

Make Docs supplies the PRDs, plans, work backlogs, and applicable project instructions. The factory depends on those documents. It can divide approved work into assignments. It does not supply another product planning process or generate replacement PRDs and backlogs.

## How the Owner Requests Work

Use short requests with normal language. These examples describe future behavior; the skills do not exist yet.

| Request | Expected behavior |
| --- | --- |
| `$preflight Phase 4` | Find Phase 4 in the current backlog. Review it and work through needed choices. Finish with readiness. |
| `$preflight Phase 4; report only` | Inspect the phase and report open choices without starting a decision interview. |
| `$software-factory Phase 4; subagents only` | Coordinate Phase 4 implementation and review through subagents, within existing permissions. |
| `$software-factory Wave 2; use this profile` | Use the selected profile for the authorized wave. Follow its dependencies and stated stop boundary. |
| `$human-experience review this CLI` | Review the requested command interface and normal output. Report findings. |
| `Use $human-experience while writing this guide` | Apply the guidance while doing the requested writing. |
| `Use $preflight for Phase 4, then $software-factory to implement it with subagents. Apply $human-experience throughout.` | Use all three within the stated scope. Continue into implementation when the settled scope and applicable permissions allow it. |

Resolve the target from the request and current project context. Ask only when a missing fact would change the work. For example, two active backlogs with a Phase 4 need a short clarification. Do not ask the owner to fill in a run configuration when their request is already clear.

An explicit request activates the named skill for that assignment. It does not enable it for unrelated future work. One skill does not silently activate another. Each skill still follows normal project quality and communication rules.

## Preflight

### Inputs and Scope

Start from the selected phase and its governing Make Docs documents. Read relevant code or product evidence to compare the backlog with the current result. Use the current project rules to find authority. Do not infer current behavior from an old task description alone.

Preflight has two outputs: a clear understanding of the work and any owner choices needed to proceed. It does not implement the phase. Preserve substantive decisions through the applicable Make Docs document process. Any saved operational progress uses the built-in Store as described below. A read-only request limits the output to chat or an already permitted output surface and does not permit Store writes.

### Working Process

1. Compare the phase with accepted requirements and the present result. Identify work that is complete, partial, still needed, or superseded.
2. Resolve facts and settled choices from their sources. Separate current-phase needs from later work.
3. Prepare the decisions that remain. Check their related effects before presenting them.
4. Ask one coherent question at a time. Record the answer at the same scope the owner approved.
5. Finish the requested review with the decisions, remaining needs, and readiness result.

Do not require a decision for every task. Do not create alternatives that violate accepted requirements merely to fill an options list. When only a required correction remains, explain the correction instead of presenting a false product choice.

### Decision Package

The normal package contains:

- A title that names the human task or recognizable feature.
- One short explanation of the current rule and the need for a choice.
- The recommendation and its main reason.
- Real alternatives and their main effects.
- Any material change to behavior, data, files, commands, costs, or later work.
- A useful source link when needed to check the basis.

Aim for a package that fits in one short view. About 80–150 words is a useful drafting target for an ordinary choice. It is not a validity rule. Include more when a shorter package would hide a material effect.

Use the project's names. Explain unfamiliar terms beside their first use. Source IDs may accompany meaningful labels. They do not serve as the main explanation. Do not create a separate numbering system just to present questions.

Use a native choice control when it fits the question and is available. Otherwise use plain Markdown. Put the recommendation first. Accept a clear “Yes” as approval of the recommendation that was just presented. Keep a free-form answer possible. Do not make the owner repeat source IDs or formal approval text.

Example, for a fictional import feature:

> **How should import handle a file you imported before?**
>
> The plan requires each source file to appear once. It leaves repeat imports open.
>
> **Skip an unchanged file — recommended.** This avoids copies and keeps repeat imports quick. Changed files still need review.
>
> **Ask on every repeat.** You keep control of each case, but large imports need more attention.
>
> Both choices preserve the original file. This decision does not change how changed files are reviewed.

### Completion and Handoff

Report one of three plain outcomes: ready for the requested next step, decisions settled but document updates remain, or named needs remain unresolved. State what those needs mean for the work.

An answer recorded in a preflight note does not silently rewrite a PRD. When a choice changes authority, identify the affected documents. Reconcile them through the applicable Make Docs process when authorized. Do not let implementation proceed on conflicting authority.

A preflight-only request ends after its stated output. When the owner has also authorized implementation, carry the settled result into that work. Do not add a fresh start confirmation solely because preflight ended. Preserve any specific approval required by the current project or tool.

## Software Factory

### Three Separate Choices

Use the owner's request to establish:

| Choice | Meaning |
| --- | --- |
| Work scope | The task, stage, phase, or wave to complete. |
| Permission and stop point | Which actions are authorized and where the run ends. |
| Work method | Subagents, separate agent tasks, or a selected external tool. |

A selected method does not widen the work. A large work scope does not grant permission to commit, publish, deploy, create branches, or use an external service. A profile does not grant those permissions either.

The proposed default method for an explicit factory request is the current agent's subagents, when supported and permitted. Use an explicit owner choice or selected profile instead when present. If the required method is unavailable, explain the limit and offer the smallest viable alternative. Do not claim independent review if the same agent did all the work.

### Core Loop

1. Read the selected backlog and its authority. Identify the next work that can proceed.
2. Give a worker a bounded assignment with relevant source links and clear ownership.
3. Receive its result and evidence.
4. Inspect the actual result against the assigned outcome and product requirements.
5. Return material defects for correction. Review the corrected result.
6. Integrate accepted work and continue through the authorized scope.

The coordinator remains responsible for judgment, integration, and scope. Workers implement, investigate, test, or review their assigned parts. A reviewer should receive the requirements and actual candidate without being told to defend the builder's conclusions.

A separate reviewer is useful when the coordinator built material parts or needs specialist review. Do not add layers of agents for their own sake. The coordinator can provide independent review of a worker's output when it examines the raw evidence itself and did not build that output.

Use one writer for a shared file at a time. Divide parallel work by clear ownership. Use the current checkout unless the owner explicitly permits another branch or worktree. Worker completion does not permit automatic cleanup of other people's changes.

### Work Brief and Result

Keep each brief short. Include only what that worker needs:

| Brief | Return |
| --- | --- |
| Goal and assigned backlog work | Outcome reached and any incomplete work |
| Product requirements and useful source links | Changed files or produced artifact |
| Owned files or responsibility, with exclusions | Evidence from relevant checks |
| Allowed actions and required checks | Findings, limits, and questions |
| Return point | A result the coordinator can inspect |

Reuse project test commands and source documents. Do not copy the full PRD set into every prompt. Do not accept a summary of passing checks as proof that the intended behavior exists.

### Review and Product Use

Review at meaningful work boundaries. Check the changed behavior, relevant regressions, and compliance with the agreed scope. Use the project's required checks. Reuse suitable evidence. Repeat a check when independence, a changed candidate, or an unresolved concern justifies it.

When a result depends on a real interaction, use the product through the relevant surface. For a CLI, inspect actual command output. For an interface, follow the intended user path. For documentation, check whether the intended reader can use the result. State what was observed.

Do not weaken requirements or remove useful checks to make a candidate pass. Do not keep expanding review into unrelated work. Report remaining evidence limits in the final result. Preserve a required human test for a qualified human; an agent review cannot stand in for it.

### New Choices and Long Runs

Routine implementation choices stay with the worker or coordinator when they preserve the agreed result. A change to product behavior, public commands, installation, data handling, or agreed structure needs an explicit check against authority.

For a material departure, explain the old outcome, proposed outcome, reason, and combined effect with related changes. Pause affected work before making that departure. Continue independent authorized work where useful. Send missing product planning back to Make Docs.

Track completion against the original scope as well as the current assignment. Several accepted local changes must not quietly replace the original outcome. If a later answer changes the goal, identify which prior work or evidence needs review.

Continue after worker completion without asking the owner to restart the run. Use completion events and bounded waits where tools support them. Send updates about completed outcomes, important findings, or needed input. Avoid routine polling reports.

Stop when the requested boundary is reached, a necessary permission or capability is missing, or further correction has no supported path. Honor any owner-set time, cost, or attempt limit. Report repeated failure with the last evidence and a concrete next step. Do not invent a budget or retry without end.

### Finish

State what was delivered, what was checked, what was observed, and what remains. Distinguish an implementation candidate from accepted or committed work. Call the assigned unit complete only when its required work and closeout duties are complete.

An earlier request can authorize several actions in one run. Carry that permission forward. Perform separately protected actions only within their stated scope. Internal stages do not create extra approval ceremonies.

## Human Experience

### Use During Work or for Review

This skill applies to the assigned surface. It can guide writing and building, or inspect an existing result. A review request produces findings. A request to improve or create the result permits relevant edits within that scope.

Identify the affected person, their goal, and the expected experience from the request and accepted documents. Ask only when that context is missing and changes the work. Use existing Make Docs human experience requirements where they apply. Do not create a competing standard or rewrite project templates.

### Working Questions

- Can the person understand what this is and why it matters?
- Can they see important names, relationships, changes, and state?
- Can they complete the task without learning the internal data model?
- Is the next action clear at the point it is needed?
- Are material limits, errors, and recovery paths visible?
- Does the structure feel coherent and require little needless effort?

Apply the questions that fit. Consider accessibility, calm presentation, and pleasant use. Avoid treating extra decoration or fewer words as proof of a better experience.

| Surface | Example of the intended effect |
| --- | --- |
| Chat and decisions | The owner understands the choice after returning from another project. |
| Documents and directories | A reader finds the right material through familiar names and clear grouping. |
| CLI and configuration | Commands match the task. Normal output explains the result and useful next action. |
| User interface | The main path preserves context and makes progress, failure, and recovery clear. |
| Agent handoff | The recipient can act from a short brief and exact sources. A person can inspect its scope. |

Keep exact machine detail available through an appropriate secondary path. Human wording and machine output must preserve the same facts. Human experience guidance does not permit changes to settled product behavior for convenience.

### Evidence and Report

Use the smallest useful check that answers the human goal. Inspect the actual document, output, or interaction. Reuse existing evidence when it answers the question.

Report the human goal, observed behavior, conclusion, and any material limit. For example: “After adding an alias, the output shows the person's name and the alias together. That makes the relationship visible. No human reading test has been run.”

An agent can identify likely sources of confusion and show improvements. Human judgment is needed to confirm lived ease or pleasure. Do not report a bare “human experience passed” without the basis. Do not create a separate test run when existing evidence is enough.

For work with little direct human effect, consider maintenance, recovery, reliability, and cost. Keep the effort proportionate. Do not invent a user interface or require an experience essay for every internal change.

## Built-In State and Optional Configuration

### State Ownership

Use Make Docs v2's built-in global Store for durable lifecycle progress that its existing operations support. Make Docs resolves the Store location, conventionally shown as `~/.make-docs/`. The skills must use supported CLI or MCP operations. They must not open the SQLite database for direct writes or choose another storage location.

The [Global Store and Project State PRD](../../prd/38-global-store-and-project-state.md) separates operational state from versioned project knowledge. Apply that distinction:

| Information | Existing owner |
| --- | --- |
| Lifecycle run status, current checkpoint, version, and bounded evidence links | Make Docs global Store, through its supported operations. |
| Product decisions, scope, requirements, substantive findings, and accepted outcomes | Applicable repository documents under Make Docs rules. |
| Live worker status and task/session handles | The selected agent tool's existing task records. Do not create a second durable worker registry. |
| Current reasoning and temporary working context | The active task. Persist only what has a supported destination and a real need. |

Do not create `.make-docs/state/`, a skill-owned state database, or Markdown/YAML files that serve as a parallel run tracker. The earlier working-note proposal is withdrawn. Repository decision documents remain valid project knowledge; they must not become disguised operational state files.

### Supported Use and Limits

The existing lifecycle model provides start, show, list, checkpoint, pause, resume, attach-evidence, complete, fail, and abandon operations. Its CLI form is `make-docs run lifecycle <operation>`. Use the existing run type, stages, statuses, version checks, metadata limits, and evidence rules. Do not create a run or new status for every question or worker result.

Use checkpoints at meaningful work boundaries when capture is useful and authorized. On resume, read the applicable run and compare its checkpoint and evidence links with current project documents and tool records. A stored version helps reject conflicting writes. It does not prove that the product or the approved scope is unchanged.

The Store records current lifecycle progress and bounded evidence references. It is not an arbitrary workflow database. Do not pack prompts, transcripts, task graphs, approval systems, or the old phase state schema into metadata fields. A successful Store receipt proves that state was saved. It does not prove product acceptance, a passing test, or phase completion.

Before skill implementation, map each required continuity need to an existing supported operation or record. Demonstrate the mapping with a small disposable test Store and project fixture. Verify start, checkpoint, pause/resume, evidence read-back, and conflicting-write behavior as needed. Do not test against the owner's live Store by default. Do not claim full recovery across tools until that path is proved.

A short review need not save operational state. If capture is unavailable, follow Make Docs' existing `run-capture-unavailable` behavior. Disclose that progress was not saved. Continue work that does not require capture when otherwise permitted. If the requested outcome requires durable recovery that cannot be provided, stop that affected part and explain the precise gap. Do not silently create fallback files or another database.

### Owner Approval Before Any Change

Using the feature does not authorize modifying or extending it. Before any change to Make Docs state behavior, schema, tables, fields, operation contracts, storage paths, or migration rules, present the exact need, proposed change, effect on existing data and users, and available alternatives. Obtain the owner's explicit approval before that change. A skill must not bypass a gap through direct SQL, hidden metadata conventions, or a new tracker.

This rule also applies when the existing feature is incomplete or faulty. Report the finding first. A spec approval or factory run request does not authorize a Make Docs feature repair or extension. Any approved product change follows a separate Make Docs work scope.

### Current Evidence

Read-only inspection on 2026-09-05 found active implementations for all ten lifecycle operations in [the lifecycle operation definitions](../../../packages/cli/src/operations/lifecycle/registry-ops.ts). [The Store implementation](../../../packages/cli/src/store/lifecycle-runs.ts) creates and updates lifecycle rows in transactions and checks the expected version. The current [Store requirements](../../prd/38-global-store-and-project-state.md#general-lifecycle-runs-and-evidence-r-ps) define the supported transitions and evidence boundary.

The installed CLI reports version `2.0.0-rc` and lists these operation names. That command inventory is not proof of installed behavior or complete readiness for these skills. No lifecycle mutation or live database inspection was performed for this spec update. The required fit and recovery checks remain open; no Store change is proposed.

### Profiles and Tools

An optional factory profile can describe preferred worker and reviewer roles, supported agent applications, capability needs, work limits, and any owner-set budget. Keep role guidance separate from the current assignment. Use inherited model settings unless the owner or selected profile specifies them.

A profile states intended setup. Check that the current tools can actually provide it. Keep secrets out of project files. A tool list alone does not enforce write boundaries or prove authority.

Start with native subagents. Add guidance for another tool only when a real supported path is selected. That guidance must explain how to send bounded work, receive a result, preserve the same scope, and recover from an uncertain handoff. If dispatch is uncertain, check its status before sending duplicate work.

Separate Codex tasks require an explicit request to create them. The factory skill does not bypass that tool rule. A prepared handoff that the owner must send is a valid limited method, but it must be reported as a manual handoff.

Party remains an optional future source of context or a supported work handoff. It must not replace or duplicate Make Docs lifecycle state. Any later use needs a clear division of record ownership. Its passive inbox must not become the factory's launcher. The “Play project” reference is still unresolved. Neither tool is a prerequisite for the three skills.

No custom scheduler, database, dashboard, or workflow engine is proposed for the initial skills. Existing tools supply execution controls. Documents supply instructions and review criteria. Add code later only for a concrete gap that instructions and current tools cannot cover.

## Proposed Packaging and Loading

Place the three skill folders under `.agents/skills/`, with the proposed names above. Each has a short `SKILL.md` and Codex invocation metadata in `agents/openai.yaml`. Set `policy.allow_implicit_invocation` to `false` for each skill. The description also states explicit use.

Keep ordinary behavior in the entry file. Add a reference only when its detail is needed for a distinct case:

| Skill | Detail to load only when needed |
| --- | --- |
| Preflight | Examples for difficult or linked decisions. |
| Software factory | A selected tool method, profile guidance, or resume procedure. |
| Human experience | Examples for the surface under review. |

Do not add empty folders, copied policy manuals, or scripts without a use. Do not make each skill load the other two. When several skills are explicitly requested, carry their applicable guidance into worker briefs within the same assignment.

The original implementation scope left the then-existing Phase skill untouched. The owner later retired it, as noted above. These are project-local assets. They do not change Make Docs template source, installed resources, routing, or lifecycle documents.

## Behavioral Evaluation Before Use

Validate the skill files, then test realistic behavior in a disposable fixture. A file validator cannot prove clear decisions or sound judgment. Use independent agent trials where useful for the later skill validation. Do not launch a real project factory merely to test a prompt.

| Scenario | Evidence of success |
| --- | --- |
| A brief preflight request | The agent finds the target without a setup interview or mandatory tracker. |
| The answer is already in the PRD | It applies that answer and avoids asking again. |
| A linked choice has a large downstream effect | The package exposes that effect in clear words before approval. |
| Preflight and implementation are both authorized | The agent continues when authority is consistent and no required permission remains. |
| Product planning is missing | The factory identifies the missing Make Docs input and does not invent a replacement backlog. |
| A worker returns green tests and wrong behavior | Review finds the mismatch in the actual candidate. |
| Subagents are the chosen method | Work and review use that method without creating other tasks. |
| An external method is selected but unavailable | The agent states the limit and does not claim dispatch or completion. |
| A long run resumes after files changed | It checks the affected assumptions and preserves settled choices. |
| Durable run progress is needed | It uses supported Make Docs Store operations and creates no parallel tracker. |
| The Store lacks a required capability | It explains the gap without changing Make Docs or inventing a fallback store. |
| A Store write succeeds | The agent reports saved progress without claiming that the product passed review. |
| Small changes combine into scope drift | The coordinator compares their combined effect with the original outcome. |
| A technically correct CLI hides meaning | The review shows the confusing output and its effect on the human task. |
| No skill is requested | No new skill is automatically activated. |

Also review the proposed decision packages with the owner. A model's judgment that its language is simple is insufficient evidence of owner comprehension. Compare setup effort, loaded context, repeated reads, handoff size, and correction effort. Do not claim savings from entry-file length alone.

## Review Boundary and Next Step

This spec makes the proposed behavior concrete enough to review. The main design choices still open are the final names, the verified mapping to existing Store operations, optional profile format, and the first external tool method, if any. A separate state location or tracker is not an open design choice. Tool-specific work can follow the basic subagent method without delaying all three skills.

After owner review, compile the settled content into one or more design documents. Follow the Make Docs lifecycle for the later implementation work. Do not treat acceptance of this spec as permission to create skills or run a factory.

This artifact uses `docs/assets/artifacts/` at the owner's explicit request. Current routers prefer `docs/artifacts/`. It remains an optional input before product authority.
