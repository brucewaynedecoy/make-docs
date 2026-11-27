---
title: "W35 R0 P7 Acceptance"
kind: "plan"
status: "draft"
coordinate: "W35 R0 P7"
source:
  type: "design"
  path: "docs/designs/2026-11-27-agent-checkpoints-and-triggers.md"
---

# W35 R0 P7 Acceptance

## Purpose

Prove the Wave on the installed package, update the guides, and bring the result to the owner.

## Outcome

Recorded evidence for each validation item of the overview, a Human Experience Review of each promise, updated guides, a register that shows what closed and what stays open, a final digest that matches, and the owner's answer at gate OG-9.

## Scope

- Package parity. Pack the CLI and run the installed package with a temporary Store: the six checkpoint cases, the reminder, the read command lines, the router lines in a fresh setup, the MCP instructions, the git hooks, and each built hook method. Run `npm run smoke:pack`. The backlog does this in three tasks: the six cases, the Phase 1 triggers, and the Phase 2 triggers.
- Test runs. Run the full test suite on the maintainer machine. Record the last workflow run of the pull request: it gives the full suite on Linux only, and the fixed test list, with the hook tests of P4 and P5, on Linux, macOS, and Windows. The full suite does not run on macOS or Windows in the workflow. Record known failures.
- The recorded agent sessions of the design: for each first-party agent tool, a session that starts cold, changes a work file, and reaches the checkpoint with no prompt from the person. The record names who started the session and which trigger did it. Standing rule 11 says who starts each session. A tool with no session is a recorded limit, not a pass.
- Guides. Update `docs/assets/user/workflows-trying-the-work-store-and-factory.md` with the checkpoint, the reminder, and the hooks. Update `docs/assets/user/cli-setting-up-projects-and-harness-access.md` with the git hook offer and removal. Update `docs/assets/maintainer/cli-maintaining-setup-and-harness-access.md` and `docs/assets/maintainer/cli-mcp-operation-parity-and-permissions.md` with the hook record, the reminder set, and the MCP instructions. Follow the guide contract and the coverage-pass contract.
- PRD reconciliation. Run `make-docs check prd`, and check each PRD named in the overview against the code.
- Human Experience Review of the checkpoint output, the reminder line, the setup hook review, and the router lines, for a person who has not read the design.
- Performance closeout. Record the state of `PERF-006` and `PERF-007`, and run `make-docs check performance-evidence`.
- Register. Close what the Wave settled. Keep the risk of one project store with many branches open, because the Wave does not remove it.
- The final digest check. The owner chose the version at OG-8 in P1, and each phase commit recorded the digest under standing rule 10. This phase only checks that the digest file of that version equals the digest of the final tarball, and that the pull request check passes.
- The release steps of `RELEASING.md` belong to the owner: the draft GitHub Release, its publication, and the npm stage approval.
- The owner acceptance gate OG-9.
- A history record for the phase and a check that each earlier phase has one.
- A short optional experience handoff of three steps. Each step is run as written before the owner gets it.

## Exclusions

- No release or publish action. A release needs separate owner authority.
- No new behavior. A finding returns to the phase that owns the code.

## Acceptance

- Every validation item in the overview has recorded evidence or a named limit.
- The Human Experience Review records a conclusion and its limits for each of the six promises.
- The guides name only current commands, and the shipped-text test passes.
- The register shows each closed and each open item of the Wave.
- The digest file of the chosen version matches the final tarball.
- Each phase has a history record.
- The owner answered OG-9.

## Testing Decisions

- Automated Implementation Testing: required.
- Performance Testing: `not-needed-now`. P2 and P4 own the two profiles. P7 reuses their results unless the fingerprint changed.
- Guided Progress Review: selected. The owner sees the Human Experience Review result.
- Unassisted Goal Testing: `not-needed-now`.

## Dependencies

- P1 to P6. P6 may have ended after its first stage.
- Owner gate OG-9 blocks the Wave closeout and any release. It blocks no stage of this phase, because the last task of the phase brings it.
