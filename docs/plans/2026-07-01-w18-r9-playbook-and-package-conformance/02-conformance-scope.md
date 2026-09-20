# Phase 2: Conformance Scope

## Scope

Settle the decision surface the delta backlog must encode so implementation never re-derives it: the expanded support tuple, the tuple registry and its statuses, the evidence bar, the required first-pass scenarios, the test-layer separation, support-claim governance, the meta-verification checks, and the fixed-versus-open boundary from D8. This phase writes no repository files; its output is the settled scope consumed by Phase 3.

## Boundaries (D0, D1)

- R-SCOPE-1: this change owns exactly the support tuple for generated outputs (D2), the tuple registry and statuses (D3), the evidence bar (D4), the required first-pass scenarios (D5), the test-layer separation (D6), and support-claim governance for packaging (D7). The lab's core (verdicts, safety modes, evidence classes, storage boundaries, run-record fields, model-agnostic scenario protocol), the packaging compiler and adapters, the Playbook model, the run-state machine, and non-packaging scenario families (install, audit, backup, skills) are owned elsewhere and must not be redefined.
- R-KEEP-1: the lab decisions are preserved unchanged — maintainer-only and never shipped; model-agnostic scenarios with model/provider/runtime as run metadata; the five verdicts with `blocked` for missing preconditions; per-scenario safety modes that never run destructive scenarios against a working tree; two evidence classes with compact records committed and raw transcripts local unless deliberately promoted; and validation remaining distinct from support claims.

## Settled Scope (D2–D7)

- Support tuple (R-TUPLE-1): a support claim for a generated output binds to the exact tuple of scenario, harness, surface, scope, output kind, generated-output kind, model or provider, and runtime; no claim may be broader than the evidence for its tuple.
- Tuple registry (R-REG-1 through R-REG-3): tuples and statuses live in a queryable data file under `docs/assets/conformance/`, never prose; each tuple carries exactly one of `provisional`, `implementation-validated`, or `conformance-validated`; status derives from run verdicts — only a `pass`, or a `pass-with-caveats` whose caveats are surfaced, that meets the D4 bar may advance a tuple to `conformance-validated`, and `inconsistent`, `unsupported`, or `blocked` never advances it.
- Evidence bar (R-BAR-1, R-BAR-2): `conformance-validated` requires a scenario that installs the generated distributable into the real or a faithfully simulated harness, asserts discovery in the harness's listing, asserts invocation of a bundled skill or driving of the workflow, and asserts clean uninstall without orphaned managed directories or deleted user-authored files; `implementation-validated` requires only internal file and structure tests; no tuple skips from `provisional` to `conformance-validated` without the bar.
- First-pass scenarios (R-SCEN-1, R-SCEN-2): Codex first against the current product harnesses — a generated skills bundle appears and is invocable; a generated plugin appears through a marketplace, installs, exposes its bundled skills, and works in a new thread; generated dependency checks surface missing tools and pass when present; uninstall and backup remove managed outputs cleanly. Pi and additional harnesses are future scenarios whose absence is reported, never implied as covered.
- Test layers (R-LAYER-1, R-LAYER-2): unit tests cover the operation core, parser, and validator as pure functions without a CLI; integration tests cover the CLI and MCP surfaces over the core including manifest and exposure plumbing; conformance tests cover the real-harness user outcome per tuple through the maintainer lab; internal tests passing is never read as harness-recognition evidence.
- Support-claim governance (R-GOV-1, R-GOV-2): public claims state only what a `conformance-validated` tuple proves; pre-validation wording distinguishes a Make Docs generated output from a harness-recognized plugin; `pass-with-caveats` surfaces its caveats in any claim; one passing run per tuple is the minimum nominal threshold, repeated maintainer-reviewed runs the stronger one.

## Meta-Verification (D9)

- R-TEST-1: a check asserts no tuple is marked `conformance-validated` without a recorded run that meets the D4 bar.
- R-TEST-2: a check asserts the required first-pass scenarios exist and are runnable, and that unavailable ones report `blocked` rather than silently passing.
- R-TEST-3: a packaging or exclusion check asserts conformance assets are absent from the shipped template, the packaged copy, and npm tarballs.

## Fixed Versus Open (D8)

- Non-substitutable: tuple-bound support claims, the tuple registry with its three statuses, the install-discover-invoke-uninstall bar, the three test layers with the internal-tests-are-not-evidence rule, and the maintainer-only not-shipped boundary.
- Implementer-open, not gaps: the concrete registry file format (provided it is queryable and carries each tuple and status), the mechanics of faithfully simulating a harness, run-record fields beyond the lab's required set, and the criteria and process for promoting a redacted raw evidence bundle.

## Placement and Sequencing

- Conformance assets live in-repo under `docs/assets/conformance/` as maintainer project content, a deliberate exception to the upstream-first authoring rule; they never enter `packages/docs/template/`, the packaged copy, or npm tarballs. Lab and check code is ordinary source code under the CLI package.
- This design is sequenced last among the core Playbook-architecture designs: it verifies W18 R8 distributables, executes workflow-driving scenarios via the W18 R7 runner, and consumes the W18 R6 model unchanged.

## Validation

- Every backlog phase produced in Phase 3 can cite this settled scope without re-deriving any D2–D9 decision, and every design MUST above appears as an acceptance criterion in exactly one backlog phase.
