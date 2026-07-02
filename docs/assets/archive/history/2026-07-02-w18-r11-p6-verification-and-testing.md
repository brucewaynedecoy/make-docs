---
title: "W18 R11 P6 Verification and Testing"
kind: "history"
status: "completed"
date: "2026-07-02"
client: "Claude Code"
model: "Fable 5"
coordinate: "W18 R11 P6"
repo: "make-docs"
branch: "make-docs-v2"
summary: "Landed the consolidated D10 verification suite and extended packaged smoke, executed the wave-completion UAT scenario, and closed R-024, completing the W18 R11 wave."
---

# W18 R11 P6 Verification and Testing

## Changes

Implemented [Phase 6 of the W18 R11 backlog](../../../work/2026-07-01-w18-r11-cli-command-reorganization-and-operation-registry/06-verification-and-testing.md), the closing phase of the wave, per [PRD 39](../../../prd/39-revise-cli-command-reorganization-and-operation-registry.md) R-TEST-1 through R-TEST-4 and R-SEQ-1. The consolidated D10 suite at `packages/cli/tests/reorganization-verification.test.ts` (32 tests) pins each family explicitly with cross-references to the deeper per-phase suites: R-TEST-1 compares the registry, the CLI `run` adapters, and the derived MCP tools pairwise in both directions and demonstrates the failing mode on injected mismatches in both the CLI diff helper and `verifyDerivedMcpToolParity`; R-TEST-2 invokes `playbook.catalog` and `work.item.resolve` through `invokeOperation` with a test-surface context against temp fixtures — no CLI parser or MCP transport loaded — and adds a transitive-import sweep from the registry and context modules proving nothing reachable enters `src/run/**`, `src/mcp/**`, or the composition root; R-TEST-3 proves `setup`, `mcp`, `update`, and `uninstall` are not operations on any surface, including under the `playbook-step` context, with the recorded rationale that a Playbook `operation:` step resolves through the same registry dispatch, making the dispatch rejection the enforcement point since the validator carries no registry-resolution seam; and R-TEST-4 covers the pre-v2 warning-and-choice flow on all three surfaces against a `clean-v1` fixture (update via its injected seams, setup and setup reconfigure through `runCli`, all cancelling with the install byte-untouched), the uninstall confirmation requirement with a sibling-repository byte-identity check, and all ten pruned names absent from the registry, the MCP tool list, and the run surface in both hyphenated and split-token spellings. The R-SEQ-1 closure tests record zero non-registry operations on any surface and that no removed top-level spelling parses. The packaged smoke (`scripts/smoke-pack.mjs`) grew end-to-end coverage of the new spellings through the packed tarball with a sandboxed store: bare invocation in both contexts, a real `run playbook start`-then-`status` round trip plus the structured missing-run error, `run package plan` against a codex plugin target, `update` reporting without acting, and `uninstall` refusal-then-`--yes` with the sandboxed store removed and repository content byte-compared unchanged. All six Phase 6 tasks are checked off, completing all six phases of the W18 R11 wave; the full suite is 722/722 across 44 files, the smoke exits 0, and `tsc --noEmit` holds the pre-existing 67-error baseline. One deliberate gap is recorded: no Playbook-validator fixture asserts `operation: setup` is invalid because the validator has no operation-registry resolution seam to hook; dispatch-level unreachability is the pinned enforcement, and adding a validator-side check is a candidate for the W18 R7 lineage that executes `operation:` steps.

### Wave-Completion UAT Coverage

With all six phases landed, the deferred manual-test decision for the W18 R11 wave is `create`: the wave ships a real end-user surface — the reorganized five-command CLI — where a human can judge the new interaction contract (bare-command behavior, guidance wording, self-management safety) in a way automated assertions do not. The scenario below was executed against the locally built CLI during this closeout with a sandboxed `MAKE_DOCS_HOME`, and every step behaved as written.

Preparation: `npm run build -w packages/cli`; export `MAKE_DOCS_HOME` to a temp directory so no step touches the real machine store; use `node packages/cli/dist/index.js` as the binary.

1. Bare invocation against a fresh temp directory (non-TTY). Expected and observed: the no-install detection message, guidance to run `make-docs setup` (interactive) or `setup --yes`, and zero files written.
2. `setup --yes --target <dir>`. Expected and observed: a completed default install reporting the package version, with `.make-docs/manifest.json` present.
3. Bare invocation against the installed directory. Expected and observed: the install-status summary (package, last-applied, capabilities, harnesses, skills, compatibility) with the never-syncs guidance and no writes.
4. `run playbook catalog --repo-root <dir>`. Expected and observed: exactly one entry, the shipped `agent/make-docs-lifecycle` default Playbook.
5. `run work item resolve 'W18 R11 P6' --repo-root <this repo>` (read-only). Expected and observed: the canonical identity naming this wave's slug and the Phase 6 document path.
6. `update --yes --target <dir>` with the sandboxed store. Expected and observed: the store database created (schema version 1), ambiguous binary ownership reported with the exact npm/pnpm/bun commands printed and nothing executed.
7. `uninstall` without `--yes` (non-TTY). Expected and observed: the footprint listing followed by the TTY-confirmation refusal, with the sandboxed store intact.
8. `uninstall --yes`. Expected and observed: the sandboxed store removed, the exact binary-removal commands printed rather than executed (ambiguous ownership), and the installed target repository untouched.
9. `setup remove --yes --target <dir>`. Expected and observed: the project's managed files removed including the manifest, with the store disposition reported.

Pass criteria: every step's observed output matches the expectations; any silent sync on bare invocation, any write during status or guidance steps, any executed package-manager command under ambiguity, or any repository deletion by `uninstall` is a failure to report against W18 R11. Verification run result: all nine steps passed.

Developer- and user-guide coverage was `none` for new changes: the phase is verification infrastructure, and the guides updated across P2 through P5 already describe every user-visible behavior the suite pins; the parity guide already names the conformance seams. PRD coverage was `risk-register-update` with no change doc: [R-024](../../../prd/03-open-questions-and-risk-register.md) moved from Open to Closed — its To-close bar is fully met by the D10 suite and extended smoke — with a Resolution block recording the phase-by-phase arc and the one deliberately-open remnant (the four lifecycle skill packages teaching removed spellings pending their Playbook rebuild, tracked by the migrated-operations inventory and D-002); [R-005](../../../prd/03-open-questions-and-risk-register.md) advanced in place recording that help, parser, docs, and tests now describe one command model with the simplification hazard pinned by failing tests, and stays Open as the durable guard.

Validation: full CLI suite 722/722 across 44 files, `node scripts/smoke-pack.mjs` exit 0, `npx tsc --noEmit` at the pre-existing 67-error baseline, the nine-step UAT scenario executed with all steps passing, `python3 .make-docs/scripts/check_path_hygiene.py` errors=0, `git diff --check` clean, and the jdocmunch index refreshed over the touched docs.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [../../../work/2026-07-01-w18-r11-cli-command-reorganization-and-operation-registry/06-verification-and-testing.md](../../../work/2026-07-01-w18-r11-cli-command-reorganization-and-operation-registry/06-verification-and-testing.md) | Marked Phase 6 tasks t1 through t6 complete, closing the W18 R11 backlog. |
| [../../../prd/03-open-questions-and-risk-register.md](../../../prd/03-open-questions-and-risk-register.md) | Closed R-024 with its Resolution block; advanced R-005 in place as the durable command-model guard. |

### Developer

None this session.

### User

None this session.
