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

Prove the Wave on the installed package, update the guides, and bring the result to the owner. Before the package proof, fix the fault of [register entry R-042](../../prd/03-open-questions-and-risk-register.md). The owner decided on 2026-11-27 to fix R-042 in this Wave. The owner did not choose the phase. The orchestrator placed it in P7.

## Outcome

Recorded evidence for each validation item of the overview, a Human Experience Review of each promise, updated guides, a register that shows what closed and what stays open, a final digest that matches, and the owner's answer at gate OG-9. A write command refuses an option that it does not know, and register entry R-042 is closed.

## Scope

- The fix for an unknown option on a write command (register entry R-042). The backlog holds it as six tasks, T14 to T19, in a new Stage 4 with the cases A79a to A79f. Find why the CLI accepts an option that a work write command does not know. Check every other write command of the registry for the same fault, and list the result. Make a write command refuse an option that it does not know, with a clear message and no write. Add tests. Add the rule and a Requirement History entry to the PRD that owns it: PRD 39 or PRD 07. Close R-042 in the register when the fix lands. This is the one part of P7 that builds product code. So P7 needs its own independent review and a digest record under standing rule 10. The stage runs before the package proof.
- Package parity. Pack the CLI and run the installed package with a temporary Store: the six checkpoint cases, the reminder, the read command lines, the router lines in a fresh setup, the MCP instructions, the git hooks, the machine preference, and each built hook method. Run `npm run smoke:pack`. The backlog does this in three tasks: the six cases, the Phase 1 triggers, and the Phase 2 triggers.
- Test runs. Run the full test suite on the maintainer machine. Record the last workflow run of the pull request: it gives the full suite on Linux only, and the fixed test list, with the hook tests of P4 and P5, on Linux, macOS, and Windows. The full suite does not run on macOS or Windows in the workflow. Record known failures.
- The recorded agent sessions of the design: for each first-party agent tool, a session that starts cold, changes a work file, and reaches the checkpoint with no prompt from the person. The record names who started the session and which trigger did it. Standing rule 11 says who starts each session. A tool with no session is a recorded limit, not a pass.
- Guides. Update `docs/assets/user/workflows-trying-the-work-store-and-factory.md` with the checkpoint, the reminder, and the hooks. Update `docs/assets/user/cli-setting-up-projects-and-harness-access.md` with the git hook offer and removal. Update `docs/assets/maintainer/cli-maintaining-setup-and-harness-access.md` and `docs/assets/maintainer/cli-mcp-operation-parity-and-permissions.md` with the hook record, the reminder set, and the MCP instructions. Follow the guide contract and the coverage-pass contract.
- PRD reconciliation. Run `make-docs check prd`, and check each PRD named in the overview against the code.
- Human Experience Review of the checkpoint output, the reminder line, the setup hook review, and the router lines, for a person who has not read the design.
- Performance closeout. Record the state of `PERF-006` and `PERF-007`, and run `make-docs check performance-evidence`.
- Register. Close what the Wave settled. Keep the risk of one project store with many branches open, because the Wave does not remove it.
- The final digest check. The owner chose version 2.1.1 on 2026-11-27 (owner gate OG-8, answered), and each phase commit recorded the digest under standing rule 10. This phase only checks that `.github/release-candidates/v2.1.1.sha256` equals the digest of the final tarball, and that the pull request check passes.
- The release steps of `RELEASING.md` belong to the owner: the draft GitHub Release, its publication, and the npm stage approval.
- The owner acceptance gate OG-9.
- A history record for the phase and a check that each earlier phase has one.
- A short optional experience handoff of three steps. Each step is run as written before the owner gets it.

## Exclusions

- No release or publish action. A release needs separate owner authority.
- No new behavior, with one exception: the fix for register entry R-042. Any other finding returns to the phase that owns the code.

## Acceptance

- Each write command of the registry refuses an option that it does not know and writes nothing, with a test that fails on the code before the fix for `make-docs work add "x" --dry-run`. The evidence lists every write command that was checked. The owning PRD has its Requirement History entry, and R-042 is closed.
- Every validation item in the overview has recorded evidence or a named limit.
- The Human Experience Review records a conclusion and its limits for each of the six promises.
- The guides name only current commands, and the shipped-text test passes.
- The register shows each closed and each open item of the Wave.
- `.github/release-candidates/v2.1.1.sha256` matches the final tarball.
- Each phase has a history record.
- The owner answered OG-9.

## Testing Decisions

- Automated Implementation Testing: required. It includes the tests of the fix for register entry R-042.
- Performance Testing: `not-needed-now`. P2 and P4 own the two profiles. P7 reuses their results unless the fingerprint changed.
- Guided Progress Review: selected. The owner sees the Human Experience Review result.
- Unassisted Goal Testing: `not-needed-now`.

## Dependencies

- P1 to P6.
- The package proof waits for the fix for register entry R-042, for its independent review, and for the new digest record.
- Owner gate OG-9 blocks the Wave closeout and any release. It blocks no stage of this phase, because the last task of the phase brings it.
