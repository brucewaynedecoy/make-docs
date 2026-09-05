# Intent: Clear Choices, Trusted Work, and a Better Human Experience

Status: Draft for owner review. This is an input to later design work. It sets no new product authority and grants no implementation permission.

Date: 2026-09-05.

## Purpose

Create project-local skills that help the owner make clear choices and trust agents to complete the work they requested. Keep human effort low. Keep the agreed product direction intact. Let the owner choose how much work to run and how much help to use.

The owner should be able to return from another project, glance at a question or update, and understand it. They should know what it means, why it matters, and what action is needed. They should not need to reconstruct the product's internal model.

The skills should support Make Docs through short instructions, useful document links, and optional configuration. Add machinery only when a real need calls for it. Human clarity and agent reliability are both required.

## Why This Work Exists

The owner reports that the Bear note “Phase Execution Process” worked much better than the later `phase` skill. The note still seemed costly to load and use. The skill added state tracking, decision numbering, and detailed gates. Repeated changes have not resolved the owner's concerns.

The reported problems are:

- Decision packages use names, terms, and IDs that assume deep project knowledge.
- Small choices can hide large effects on product behavior, structure, or architecture.
- New choices during implementation can compound into a result that differs from the settled plan.
- The process can stop useful work too often and weaken sustained coordinator-led execution.
- Technically correct output can still be hard to understand or unpleasant to use.

The owner names Make Docs W19 R1 P4 as a serious example. This artifact records that report. It does not claim to prove the causes of that phase's regressions. A source review can show process risks without establishing which rule caused each result.

## Requested Capabilities

These are three distinct needs. The owner confirmed three new project-local skills after reviewing this draft. The final names and shared guidance remain open. The [pre-design spec](2026-09-05-project-local-skills-spec.md) develops the proposed behavior.

### 1. Optional Phase Preflight

Let the owner request preflight in a few words. Read the target phase, current product requirements, related plans, and relevant code or product evidence. Check what is already done, what remains valid, and what needs a real choice.

Resolve questions from accepted sources before asking the owner. Do not reopen a settled choice merely because another approach looks attractive. Do not turn routine engineering work into a product interview.

Each decision package should:

- Name the affected feature or human task in familiar words.
- State the current agreed behavior when it matters.
- Explain the choice and why it is needed now.
- Recommend an option and give its main reason.
- Show meaningful alternatives with their effects or tradeoffs.
- Expose material costs, lost behavior, changed structure, and effects on later work.
- Link to source documents by useful titles. Keep exact IDs available as supporting detail.

Present one coherent decision at a time. Keep the normal package short enough to scan. Use more detail when the decision needs it. Brevity must not hide a change in meaning.

A fictional example of the intended reading experience:

> **What should an update do with guides you edited?**
>
> The current plan keeps your edits. The update needs a rule for incoming changes.
>
> **Keep your guide and show a comparison — recommended.** You choose which new text to use. This adds a review step and protects your edits.
>
> **Replace your guide after saving a copy.** The update is faster, but you must restore any edits you still need.
>
> This choice affects guide updates only. It does not change where guides are stored.

This example illustrates clarity. It proposes no Make Docs behavior.

Preflight should produce a clear account of settled choices, unresolved needs, and the work they affect. The form and storage of that account are design questions. Preflight does not itself authorize implementation. A request to implement existing work should not force a separate preflight interview when no owner choice is needed.

### 2. Optional Software Factory

The factory depends on existing Make Docs PRDs and work backlogs. Make Docs provides the product planning layer. The factory uses those documents to carry out the selected work. It does not replace them or offer another method for generating them.

The coordinator can divide approved backlog work into worker assignments and choose an execution order within the agreed dependencies. This is execution planning. If required product decisions or backlog scope are missing, return that need to the Make Docs process before affected work proceeds.

Let the owner assign a task, stage, phase, or wave. A coordinator should take that unit through the agreed work and review steps. The owner can choose the work method:

| Method | Intended use |
| --- | --- |
| One agent | Ask the current agent to inspect and implement the selected work directly. |
| Coordinator with subagents | Keep one agent in charge of scope and judgment. Use its own subagents for work, review, or testing. |
| Coordinator with other tasks or tools | Use separate agent tasks or other agent applications when the owner selects that route. |

An agent application, such as Codex or Claude Code, is sometimes called a harness. The core process should work across supported harnesses. Tool-specific instructions should load only when that tool is selected.

The coordinator's job is to judge progress and results against accepted product requirements and the assigned work. It should inspect actual changes and useful evidence. When needed, it should also inspect or use the product. A worker's claim of completion is input to that judgment.

The factory should support this small loop: assign bounded work, receive the result, inspect it, return defects for correction, and continue when the result meets the agreed criteria. Preserve a real review role. Do not quietly turn the coordinator into the sole builder and reviewer.

Work assignments need enough context to act correctly: the goal, source authority, owned work, limits, required evidence, and return point. Prefer links and focused reads to copied transcripts. Avoid multiple agents repeating the same broad research.

Long runs need useful continuity. The owner should be able to pause, resume, or change direction without losing settled choices. The coordinator should continue through the work already authorized. It should stop at the requested boundary or a real need for input. Repeated failed attempts should lead to a clear report and a bounded next step.

The owner should be able to choose the amount of work, level of autonomy, and work method separately. A request to use subagents does not imply permission to run a whole wave. A request to complete a wave should not require a new start message after every ordinary task.

### 3. Human Experience Guidance

Make comprehension, ease of use, clear structure, and a pleasurable experience a priority wherever the work affects people. This applies during creation as well as review.

Relevant surfaces include chat, documents, interfaces, command names and flags, help and output, files and folders, configuration, and messages prepared for people or agents. Agent-facing work can still affect the people who inspect, maintain, or recover it.

Start with the person and their goal. Use names they can recognize. Show important relationships and changes. Make the next useful action clear. Provide exact detail when it helps. Keep machine-readable output precise.

Review should use evidence that fits the human goal. For a document, this can mean checking whether a reader can find and understand the needed answer. For a command, it can mean using the normal output to complete a real task. For an interface, it can mean following the intended path through the product.

The report should state the goal, what was examined, what was observed, and what remains uncertain. An agent can find likely usability defects. It cannot prove that a person finds the result clear or pleasurable merely by declaring a review passed.

The skill should remain useful in its own right. It should have no planned end-of-life language.

## Shared Boundaries

- **Explicit use:** Each new skill is project-local and runs only when the owner asks for it. Do not enable automatic use through broad triggers, hooks, or project routing. How the skills work together after an explicit request remains a design question.
- **Existing authority:** Use the accepted PRDs, plans, backlog, and applicable Make Docs instructions. A skill, worker brief, profile, or run record must not become a competing source of product truth.
- **Settled meaning:** A shorter explanation must preserve the full effect of a choice. An approval covers the choice the owner could reasonably understand from the package.
- **Changes during work:** Distinguish an ordinary implementation choice from a change to agreed behavior. Before a material change, show what it changes from the settled plan. Include its combined effect with related choices. Pause the affected work until the needed choice is settled.
- **Useful autonomy:** Honor clear prior permission. Preserve real repository and tool limits. Do not add ceremonial approvals just to advance an internal status.
- **Small structure:** Prefer documents and configuration. Keep the default reading set small. Read special procedures only when needed. A tracker, script, database, or service needs a demonstrated purpose.
- **Built-in state:** Use supported Make Docs v2 global Store operations when durable lifecycle progress is needed. Do not create `.make-docs/state/` or another skill-owned tracker. Keep substantive project knowledge in its existing documents. Present any proposed change or extension to Make Docs state support and obtain explicit owner approval before making it.
- **Honest limits:** Instructions guide agent behavior. They do not by themselves enforce isolation, exclusive file writes, spending limits, or reliable recovery. Use existing tool controls where those guarantees are needed. State any remaining limits.

This work uses Make Docs' existing state feature within its supported scope. Its fit for each required continuity need remains to be checked. It does not choose a new state schema, agent roster, transport, workflow engine, or model. It does not modify Make Docs, repair Party, replace the existing phase skill, or install either external factory.

## What the Sources Add

### Bear Note and Existing Phase Skill

The live Bear note keeps a clear owner, coordinator, and implementation-agent split. It asks the coordinator to translate choices, supervise work, inspect real changes, and return findings for correction. These are useful foundations.

The note also requires separate permission at every transition and limits implementation to one phase. Copying it verbatim would not satisfy the new request for optional preflight and flexible work size. Its strengths should inform the design without silently fixing the new skills to that process.

The current [phase skill](../../../.agents/skills/phase/SKILL.md) was inspected as source material only. Its [run modes](../../../.agents/skills/phase/references/run-modes.md) require saved control fields. Its [tally rules](../../../.agents/skills/phase/references/preflight-item-tally.md) require a separate register and presentation order. The skill also requires a start-now confirmation after the preflight documentation commit, even when implementation was requested earlier.

These are concrete sources of process overhead. Their presence does not prove that all state or approval controls are harmful. The new design should justify the controls it retains. No token-saving claim has been measured.

### Party

Party's current requirements still describe an agent-first knowledge system with a passive work inbox. Party stores work and results. External agents check for work and execute it. Profiles describe intended agent setup; they do not launch an agent or prove its live tools.

The backlog assigns the inbox to Phase 4 and profiles to Phase 5. The inspected task lists remain open. The task “Party W1 R0 P2” also records the owner's difficulty understanding successful CLI output. This supports the need for human experience checks. It is not proof that the full project is on or off track.

Party is therefore a possible future tool for shared work records and context. Its required runtime behavior remains unverified for this use. The core skills should be useful before a Party connection exists.

Source locators in the Party repository: `docs/prd/09-agent-work-inbox.md`, `docs/prd/10-agent-profiles.md`, and `docs/work/2026-08-21-w1-r0-party-first-release/00-index.md`. The owner supplied the Party repository location in this task. “Play project” remains an unresolved reference; do not silently substitute another project.

### Other Factory Examples

Both examples also include planning capabilities. Our factory assumes that Make Docs has already supplied the PRDs and work backlogs. Their planning capabilities are outside the intended scope of this skill. Use their execution and review ideas where they fit the existing Make Docs documents.

Cole Medin's factory checks work against a mission, separates building from validation, and uses real product journeys with observed evidence. These are useful ideas. Its automatic merge target, scheduler, and runtime controls belong to its own design. They are not adopted here. [AI Software Factory](https://github.com/coleam00/ai-software-factory).

Disler's factory separates agent identities from work prompts and loads guidance by the requested operation. It uses bounded work and structured results. Its Python engine owns sequencing and acceptance. The useful lesson for this work is the separation of roles and context. Its engine is not a chosen dependency. [Super Simple Software Factory](https://github.com/disler/super-simple-software-factory/tree/main) and [skill source](https://github.com/disler/super-simple-software-factory/blob/main/.claude/skills/sssf/SKILL.md).

Both examples rely on code for controls that documents alone cannot guarantee. We can keep our instructions smaller while being honest about that difference. This review examined their published guidance. It did not install or test either factory.

### Make Docs Human Experience Work

The existing [Human Experience Standard and Intent requirements](../../prd/49-human-experience-standard-and-intent.md) already cover human goals, clear language, visible relationships, control, and evidence. The related [testing requirements](../../prd/50-proportionate-testing-and-human-centered-validation.md) cover testing that fits the need. Their work is organized under waves 20 and 21.

Use this direction when shaping the skills. Do not duplicate its product authority or make the skills depend on completion of those waves. This artifact does not claim that the shipped behavior is complete.

## How We Will Know the Direction Works

Later evaluation should use realistic requests and inspect behavior, not just skill file structure. Useful cases include:

| Case | Expected result |
| --- | --- |
| The owner returns after work on another project. | A decision package makes sense without a glossary or prior chat. |
| The documents already settle the answer. | The agent uses that answer and does not ask the owner to choose again. |
| A phase needs no new product choice. | Direct implementation can proceed when authorized. |
| Several small changes would alter the product. | The agent shows the combined effect before affected work proceeds. |
| A worker returns passing tests but the wrong behavior. | The coordinator finds the mismatch and requests correction. |
| A command works but its output hides meaning. | Review identifies the human problem and provides direct evidence. |
| The owner selects subagents only. | The factory completes the work through that route. |
| The owner selects another supported agent application. | The same work and review expectations survive the handoff. |
| A long run pauses or reaches its limit. | The next agent can find what is settled, done, and still needed. |
| The skills are not requested. | They do not become an automatic workflow. |

Check setup effort and total context use as well as outcomes. A smaller entry file alone does not prove lower token cost. Repeated reads, handoffs, and repair loops also count.

## Review and Next Step

First review whether this artifact captures the owner's intent. It does not ask the owner to choose a state model or tool stack now.

After that review, create a separate pre-design specification under `docs/assets/artifacts/`. Use concrete examples to settle the skill boundaries, shortest useful invocation, decision-package shape, work and review loop, and any minimum record needed for continuity. Resolve the “Play project” reference before making it part of a design.

Once both artifacts reflect the agreed direction, compile that material into one or more design documents. Follow the normal Make Docs work lifecycle from there. Skill creation and factory setup come later.

The owner explicitly requested `docs/assets/artifacts/` for these inputs. Current routers prefer `docs/artifacts/`. This artifact follows the requested path. It remains optional source material before design authority.

## Source Notes

- Primary intent: the owner's request in this task on 2026-09-05.
- Bear source: “Phase Execution Process,” note ID `014CFA0E-3549-46E4-9D93-06DBFD633D4A`, read live through Bear CLI on 2026-09-05.
- Local sources: the phase skill and selected references; Party requirements and backlog; Make Docs human experience and testing requirements; the Party task named above. Read on 2026-09-05. Local work includes uncommitted changes and is a snapshot.
- External sources: the linked factory repositories and skill guidance, read on 2026-09-05. These are reference examples, not accepted project instructions.
