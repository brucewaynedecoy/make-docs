# Summary

Use this reference for setup Step 6. The summary is the last thing that the person reads (`setup-summary`). Write it for someone who has not followed the setup. Use plain words first. Explain each internal term beside it. Name the project.

## What the Summary Holds

Take each fact from the Store, not from memory: `factory workflow show` gives the roles, each role's tool, the tool's version, each proof result and "does not cover" list, the wake method, the known losses, the plan revision, and the grants. `factory status` gives the readiness and the open manual steps.

1. The outcome, in one line: the workflow's name, the project, and whether it is `ready`.
2. Roles: for each role, the tool, its version, and its proof result. Say "all proved" when every needed capability is `proved`, and name each one that is not.
3. Wake: how the foreman starts again. When no tool can wake on its own, say that the factory runs only while the person keeps a session open (`no-wake-said`).
4. Human channel: how the factory reaches the person, and how the person answers.
5. Test task: what it did, its result, and the plan revision and the start of its digest that it ran under. Name each capability that stays unproved.
6. Accepted known losses: each one, in plain words (`known-losses-listed`).
7. Grants: each action, its scope, and its expiry, or "none: the factory asks you each time".
8. Open manual steps: each one, in the form below (`manual-steps-listed`).
9. Next: how to start a run, which is an explicit request for the `factory` Skill, and how to check the live state with `make-docs factory status --target-root <checkout>`.

On a rerun, add a "What changed" part after the outcome, with each change as old and new, and what setup proved again.

## Manual Steps

A manual step is a one-time step that only the person can do, such as a sign-in, an install, an app permission, or a payment. Setup never does one for the person. Write each one with:

- Do: what the person must do;
- Why: why it is needed;
- Required or optional;
- Unblocks: what it unblocks.

Save each open step with `--manual-step` on `factory proof save`, as one short line of at most 120 characters, with no never-log item.

## Sample: Smallest Setup

> **Factory setup for project `<project>` is done. Workflow `main` is ready: it can take new work.**
>
> **Roles.** Tool A (version 1.0) fills every role: it is the front desk and the foreman, and it starts a fresh helper agent for each builder and each reviewer. A reviewer is never the agent that built the work. All five capabilities that these roles need are proved.
>
> **Wake.** No tool can wake on its own. The factory runs only while you keep a session open. To run it, ask for the factory in a session.
>
> **Human channel.** Wait in session: when the factory needs a decision, it asks you in the chat and waits for you.
>
> **Test task.** Tool A took a small request, a fresh builder wrote one line, a separate fresh reviewer checked it, and the result came back to you. It passed under plan revision 1 (digest starting `aed0828d14c8`, a short fingerprint of the exact saved plan). No capability stays unproved.
>
> **Known losses you accepted.**
> - No tool can wake on its own, so the factory runs only while a session is open.
> - The file proof did not test files outside the project.
>
> **Grants.** None. The factory asks you before each merge, deploy, publish, or payment.
>
> **Open manual steps.** None.
>
> **Next.** Ask for the factory skill to run work. Check the factory at any time with `make-docs factory status --target-root <checkout>`.

## Sample: Multi-Tool Setup

> **Factory setup for project `<project>` is done. Workflow `main` is ready: it can take new work.**
>
> **Roles.**
> - Front desk: tool C (version 3.2). Proved: message you, read your answer.
> - Foreman: tool D (version 2.0). Proved: files, commands, start agents, wait for them, read their results.
> - Builder: tool E (version 5.1). Proved: files, commands, code changes.
> - Reviewer: tool F (version 1.4). Proved: files, commands.
>
> **Wake.** Tool G starts the foreman every 10 minutes. That is more often than a claim lasts (30 minutes), so claimed work does not expire.
>
> **Human channel.** Tool C. The factory messages you there, and you answer there.
>
> **Test task.** Tool C took the request, tool D briefed tool E, tool F reviewed the result, and tool C sent it back to you. It passed under plan revision 1 (digest starting `5f3e0b7a91c2`). One capability stays unproved: tool G's wake on an event. The workflow does not use it.
>
> **Known losses you accepted.**
> - Tool F's file proof did not test files larger than 1 MB.
> - Tool G can wake only on a schedule, not when an agent finishes.
>
> **Grants.**
> - Merge: once, ends 2026-12-01. The first merge spends it.
> - Deploy, publish, and spend: none. The factory asks you each time.
>
> **Open manual steps.**
> - Do: allow tool C to send you notifications. Why: without it, a message can wait unseen. Optional. Unblocks: faster answers while you are away.
>
> **Next.** Tool G starts the factory on its schedule. Check the factory at any time with `make-docs factory status --target-root <checkout>`.
