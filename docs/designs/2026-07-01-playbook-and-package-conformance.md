# Playbook and Package Conformance

## Purpose

This design defines how generated Playbook distributables earn evidence-backed support claims. It covers the support tuple for a generated output, the tuple registry and its statuses, the install-discover-invoke-uninstall evidence bar, the required first-pass conformance scenarios, the separation of test layers, and support-claim governance.

It exists to turn the provisional support claims that the contract-and-model, run-playbook, and packaging designs deliberately leave open into evidence-bound claims. The current tests assert internal file writing and symlink exposure, which can pass while a real harness fails to recognize or use the output. That gap is exactly what let a generated Codex package look correct while not being recognized by Codex. This design closes the gap by testing the user-visible outcome.

The full architecture this design draws from is recorded in [Playbook Architecture and Design](../assets/artifacts/playbook-architecture.md), Section 9. It extends the maintainer conformance lab established by [Agent Harness and Model Conformance Lab](2026-06-19-agent-harness-and-model-conformance-lab.md) to the Playbook packaging domain, and it verifies the outputs of [Playbook Packaging Compiler and Harness Adapters](2026-07-01-playbook-packaging-compiler-and-harness-adapters.md).

## Context

The packaging design produces distributables whose support status is provisional until conformance evidence exists. The conformance lab design established a maintainer-only evidence track: model-agnostic scenarios, normalized run records, conformance verdicts, per-scenario safety modes, two evidence classes, and support claims gated per scenario, harness, and model. That design intentionally deferred plugin and playbook scenarios until shared-agentics, plugin-substrate, and Run Playbook decisions landed. Those decisions have now landed, so this design supplies the packaging conformance the lab was waiting for. PRD 20 already revised the lab to require support claims to cite evidence for the exact scenario, harness, model or provider, runtime, and generated-output tuple; this design carries that requirement into packaging.

This design extends the lab rather than replacing it. It expands the support tuple for generated outputs, adds a queryable tuple registry with explicit statuses, defines the evidence bar specific to installable distributables, names the first-pass scenarios, and separates test layers so that one layer's passing is never read as another's.

This repository is the Make Docs maintainer repo and a dogfood instance. The conformance lab is maintainer-only tooling. Its scenario specs, tuple registry, and compact result records are in-repo project content under `docs/assets/conformance/`, edited in place, and they MUST stay out of the shipped template, the packaged copy, npm tarballs, and any future package. This is a deliberate exception to the upstream-first authoring rule, because conformance is maintainer evidence infrastructure, not shipped product. The compiler and lab code are ordinary source code under the CLI package.

## Decision

### D0. Scope and Boundaries

This design owns exactly: the support tuple for generated outputs (D2), the tuple registry and its statuses (D3), the evidence bar (D4), the required first-pass scenarios (D5), the test-layer separation (D6), and support-claim governance for packaging (D7).

R-SCOPE-1 (MUST NOT). The following are owned elsewhere and MUST NOT be redefined or reinvented here:

- The conformance lab's core: verdicts, safety modes, evidence classes, storage boundaries, run-record fields, and model-agnostic scenario protocol. Owned by [Agent Harness and Model Conformance Lab](2026-06-19-agent-harness-and-model-conformance-lab.md); consumed and extended, not redefined.
- The packaging compiler, harness adapters, and capability model. Owned by [Playbook Packaging Compiler and Harness Adapters](2026-07-01-playbook-packaging-compiler-and-harness-adapters.md).
- The Playbook model and the run-state machine. Owned by [Playbook Contract and Model](2026-06-30-playbook-contract-and-model.md) and [Run Playbook State Machine](2026-07-01-run-playbook-state-machine.md).
- Non-packaging conformance scenario families, such as install, audit, backup, and skills, which remain owned by the lab design.

### D1. Preserved Prior Decisions

R-KEEP-1 (MUST). The following decisions from the conformance lab design MUST be preserved unchanged:

- The lab is maintainer-only and is not shipped in installs, templates, the packaged copy, npm tarballs, or future packages.
- Scenarios are model-agnostic; the model, provider, and runtime are captured as run metadata, not embedded in scenario logic.
- The conformance verdicts are `pass`, `pass-with-caveats`, `inconsistent`, `unsupported`, and `blocked`. A scenario that cannot run for a missing precondition reports `blocked` rather than inventing evidence.
- Each scenario declares a safety mode, and the lab never runs destructive scenarios against a maintainer's working tree.
- There are two evidence classes: compact normalized records suitable for source control, and raw transcripts or logs that are generated, stored locally, and promoted only when a redacted bundle materially supports a disputed or stronger claim.
- The lab consumes existing validation and does not replace it; a green validation run is not a public support claim.

### D2. The Support Tuple

R-TUPLE-1 (MUST). A support claim for a generated output MUST be bound to the exact tuple: scenario, harness, surface, scope, output kind, generated-output kind, model or provider, and runtime. This extends the lab's scenario-harness-model tuple with the surface, scope, output kind, and generated-output kind introduced by packaging. No claim may be broader than the evidence for its tuple.

### D3. The Tuple Registry

R-REG-1 (MUST). The set of tuples and their statuses MUST live in a queryable data file, not in prose, under `docs/assets/conformance/`, so that support status is queryable and cannot drift from documentation.

R-REG-2 (MUST). Each tuple MUST carry one of three statuses, and a status transition MUST require the corresponding evidence:

- `provisional`: no conformance evidence yet; the output may be generated but its recognition and usability are unverified.
- `implementation-validated`: internal unit and integration tests prove the generated files and structure, but no real-harness evidence exists.
- `conformance-validated`: a real-harness scenario has met the evidence bar in D4.

R-REG-3 (MUST). Tuple status is derived from run verdicts. A tuple MAY move to `conformance-validated` only on a `pass`, or a `pass-with-caveats` whose caveats are surfaced, that meets the D4 bar. A verdict of `inconsistent`, `unsupported`, or `blocked` MUST NOT advance a tuple to `conformance-validated`.

### D4. The Evidence Bar

R-BAR-1 (MUST). To move a tuple to `conformance-validated`, a scenario MUST install the generated distributable into the real or a faithfully simulated harness, assert discovery by confirming the output appears in the harness's listing, assert invocation by confirming a bundled skill can be invoked or the workflow can be driven, and assert clean uninstall by confirming managed outputs are removed without orphaning managed directories or deleting user-authored files. The bar is install, discover, invoke, and uninstall.

R-BAR-2 (MUST). `implementation-validated` requires only internal file and structure tests and no harness. A tuple MUST NOT skip from `provisional` to `conformance-validated` without meeting the D4 bar.

### D5. Required First-Pass Scenarios

R-SCEN-1 (MUST). The first conformance pass MUST prove the outcomes the current tests do not, using the current product harnesses, Codex first:

- A generated skills bundle appears as a skill in the target and can be invoked.
- A generated plugin appears through a marketplace, installs, exposes its bundled skills, and is usable in a new thread.
- Generated dependency checks surface missing tools and pass when the dependencies are present.
- Uninstall and backup remove managed generated outputs without orphaning empty managed directories or deleting user-authored files.

R-SCEN-2 (MUST). Pi and additional harnesses are future scenarios, run when those adapters and harnesses become supported. They are not required for the first pass, and their absence MUST be reported rather than implied as covered.

### D6. Test Layers

R-LAYER-1 (MUST). Coverage MUST be organized in three named layers so that one layer's passing never masquerades as another's: unit tests cover the operation core, parser, and validator as pure functions without a CLI; integration tests cover the CLI and MCP surfaces over the core, including the manifest and exposure plumbing; conformance tests cover the real-harness user outcome per tuple through the maintainer lab.

R-LAYER-2 (MUST). Unit and integration tests are automated repository tests; conformance tests are the maintainer lab. Internal tests passing MUST NOT be read as evidence that a harness recognizes or can use the output. This rule is the direct corrective for the failure mode that let the descriptor output look correct while not being recognized.

### D7. Support-Claim Governance

R-GOV-1 (MUST). A public claim may state only what a `conformance-validated` tuple proves. Until a tuple is conformance-validated, wording MUST distinguish a Make Docs generated output from a harness-recognized plugin. A `pass-with-caveats` result MUST surface its caveats in any claim.

R-GOV-2 (MUST). One passing conformance run per tuple is the minimum threshold for nominal support, preserving the lab's threshold. Repeated runs with maintainer review are the stronger threshold for a more confident claim.

### D8. Non-Negotiable Decisions and Deliberately Open Choices

Fixed by this design and MUST NOT be substituted, relaxed, or reinvented:

- Support claims are tuple-bound (R-TUPLE-1).
- The tuple registry and its three statuses (R-REG-1, R-REG-2).
- The install-discover-invoke-uninstall evidence bar (R-BAR-1).
- The three test layers and the rule that internal tests are not user-outcome evidence (R-LAYER-1, R-LAYER-2).
- Conformance assets are maintainer-only and not shipped.

Deliberately left to the implementer and MUST NOT be treated as under-specified gaps:

- The concrete file format of the tuple registry, provided it is queryable and carries each tuple and status.
- The mechanics of faithfully simulating a harness where a real one cannot run in the lab.
- The run-record schema fields beyond those the lab already requires.
- The criteria and process for promoting a redacted raw evidence bundle.

### D9. Verification and Meta-Verification

R-TEST-1 (MUST). A check MUST assert that no tuple is marked `conformance-validated` without a recorded run that meets the D4 bar.

R-TEST-2 (MUST). A check MUST assert that the required first-pass scenarios exist and are runnable, and that unavailable ones report `blocked` rather than silently passing.

R-TEST-3 (MUST). A packaging or exclusion check MUST assert that conformance assets are absent from the shipped template, the packaged copy, and npm tarballs.

## Alternatives Considered

Treat internal file-writing tests as support evidence. Rejected. This is the failure mode this design corrects: files written is not the same as an output a harness recognizes and can use.

Use a single flat supported-or-unsupported status per harness. Rejected, preserving the lab decision. A pass for one model, surface, or scope does not imply blanket harness support, so status is tuple-bound.

Ship the conformance lab inside the product. Rejected, preserving the lab decision. Conformance is maintainer evidence infrastructure, not a consumer surface.

Commit all raw transcripts and logs by default. Rejected, preserving the lab decision. Compact normalized records are the default; raw evidence is promoted only when it materially supports a disputed or stronger claim.

Require repeated maintainer-reviewed runs before any claim. Rejected as the minimum, preserving the lab decision. One passing conformance run per tuple is enough for nominal support with recorded caveats; repeated runs earn stronger confidence.

Allow a tuple to move from provisional to conformance-validated on implementation tests alone. Rejected. Real-harness evidence meeting the install-discover-invoke-uninstall bar is required.

## Consequences

The provisional support claims in the contract-and-model, run-playbook, and packaging designs become promotable to evidence-backed claims through the tuple registry, and only when the real-harness bar is met. The registry gives an honest, queryable support surface and prevents the files-written-equals-works error at the level of documentation and claims, not just tests.

The first conformance pass is Codex-focused because Codex and Claude Code are the current product harnesses; Pi and other adapters gain conformance evidence when they become supported. This design depends on the packaging design for the distributables under test, the run-playbook design for execution, and the contract-and-model design for the model, so it is sequenced last among the core Playbook-architecture designs. Because the lab is maintainer-only, its assets stay out of shipped product, and support wording remains conservative until evidence exists.

## Design Lineage

Update Mode: new-doc-related.

Prior Design Docs: [Agent Harness and Model Conformance Lab](2026-06-19-agent-harness-and-model-conformance-lab.md), [Playbook Packaging Compiler and Harness Adapters](2026-07-01-playbook-packaging-compiler-and-harness-adapters.md), [Playbook Contract and Model](2026-06-30-playbook-contract-and-model.md), [Run Playbook State Machine](2026-07-01-run-playbook-state-machine.md).

Reason: This design extends the maintainer conformance lab to the Playbook packaging domain with an expanded support tuple, a queryable tuple registry with derived statuses, the install-discover-invoke-uninstall evidence bar, required first-pass scenarios, and a test-layer separation. It preserves the lab's maintainer-only nature, verdicts, safety modes, evidence classes, and storage boundaries.

## Intended Follow-On

Route: `change-plan`

Next Prompt: [designs-to-plan-change.prompt.md](../../.make-docs/references/system/prompts/designs-to-plan-change.prompt.md)

Why: This is a corrective evolution that carries the active W18 conformance and support-claim requirements into Playbook packaging outputs against the active PRD namespace rather than starting a fresh baseline.

Coordinate Handoff: Extends the W18 conformance and support-claim requirements associated with the conformance lab and PRD 20 to generated Playbook distributables, and gates the provisional support claims introduced by W18 R5 packaging. Recommended downstream coordinate unresolved; planner must resolve against the active W18 namespace before writing.
