---
name: preflight
description: Review a named Make Docs phase and settle needed owner choices. Use only when the user explicitly requests $preflight or this preflight skill.
---

# Preflight

Help the owner understand and settle the choices needed for a phase. Keep the work grounded in the existing Make Docs PRD and backlog. This skill does not implement work or create a replacement planning process.

## Start with the request

Resolve the phase from the request and project context. Ask only if the target remains ambiguous. Use a brief acknowledgment and begin. Do not ask the owner to select a mode or create a state file.

An ordinary request means review the phase, then work through its needed choices. “Report only” means report the findings without starting an interview. “Read-only” also rules out document and Store writes. Preserve any stated limit or later authorized work.

## Find the real choices

Read the applicable project instructions, target backlog, and the PRD sections that govern it. Inspect only the code or product evidence needed to compare the backlog with reality. Separate completed, partial, superseded, and remaining work.

Use answers already settled by authority. Keep routine engineering choices with the agent. Keep later work with its current owner unless the phase depends on it. A settled contract is not an alternative to put up for a vote.

Before asking, check related effects. Several small changes may together change installation, data, commands, file structure, or promised behavior. Present that combined effect before approval. Explain a conflict in the sources rather than choosing whichever source is convenient.

## Present one clear choice

Use a recognizable feature or human task as the title. State what is being settled and why it matters now. Recommend an option and give its main reason. Show real alternatives with their effects. Include material costs, losses, changed behavior, and effects on other work.

Write for someone returning from another project. Use familiar names; explain needed special terms beside them. Link to source titles when useful. Put internal IDs in supporting detail, not the main question. Keep the normal package to one short view. Clarity matters more than a word count.

Use a native choice control when it fits and is available. Otherwise use compact Markdown. Put the recommendation first. Do not invent options to fill a control. Accept a clear “Yes” as the recommendation just presented; allow a different or free-form answer. Ask one coherent decision at a time, then continue the requested interview after the answer.

Read [decision examples](references/decisions.md) only when a choice is hard to explain or has linked effects.

## Preserve the answer and finish

Keep each answer at its approved scope. Do not treat approval as permission for adjacent changes. Record substantive decisions through the existing Make Docs document process when authorized. An answer in chat is not proof that conflicting authority was reconciled.

For requested durable run progress, use the [shared Store reference](../software-factory/references/store.md). It is operation guidance, not an invocation of the factory skill. Do not create a parallel state file, tally, or gate system. Do not make capture a prerequisite for an ordinary review.

Finish with a plain outcome: ready; choices settled but named document updates remain; or named needs remain unresolved. Explain the practical effect. A preflight-only request ends there. If the request also authorizes implementation, continue through that work once the agreed scope and applicable permissions allow it. Do not add a start-now confirmation solely because preflight ended. Do not activate another skill unless the user requested it.
