---
title: "W18 R9 P1: Support Tuple and Tuple Registry"
kind: "history"
status: "completed"
date: "2026-07-04"
client: "Claude Code"
model: "Fable 5"
coordinate: "W18 R9 P1"
repo: "make-docs"
branch: "make-docs-v2"
summary: "Landed the eight-field R-TUPLE-1 support tuple and the drift-proofed tuple registry under docs/assets/conformance/ seeded with the twenty W18 R8 first-party tuples at honest statuses (zero conformance-validated), and ran the phase-closeout guide, user-guide, and PRD coverage passes."
---

# W18 R9 P1: Support Tuple and Tuple Registry

## Changes

This session implemented Phase 1 of [the W18 R9 backlog](../../../work/2026-07-01-w18-r9-playbook-and-package-conformance/01-support-tuple-and-tuple-registry.md) (all six tasks, per [PRD 37](../../../prd/37-enhance-playbook-and-package-conformance.md)) and ran the closeout documentation passes.

### Implementation

| Surface | Summary |
| --- | --- |
| `packages/cli/src/conformance/tuple.ts` (new) | The eight-field R-TUPLE-1 support tuple — scenario, harness, surface, scope, outputKind, generatedOutputKind, modelOrProvider, runtime. It consumes the W18 R8 P4 `PackageSupportClaimTuple` via `bindConformanceSupportTuple` (a parity test pins the dimension relationship), adds only `generatedOutputKind` (produced versus requested), refuses an unresolved `auto` surface as broader than evidence, and binds the evidence-owned run-metadata dimensions (scenario, modelOrProvider, runtime — `null` until a recorded run) only through `bindRunMetadataOntoConformanceTuple`. |
| `packages/cli/src/conformance/registry.ts` (new) | The R-REG-2 statuses (`provisional`, `implementation-validated`, `conformance-validated`) with their canonical meanings, the lab's five verdicts consumed unchanged, the D4 four-stage evidence bar (install, discover, invoke, uninstall), `runQualifiesForConformanceValidation` and `deriveConformanceTupleStatus`, the fail-closed zod loader, and query helpers. Deliberately no new registered operations — the backlog mandates only the queryable data file, so the registry is a library seam. |
| [docs/assets/conformance/tuple-registry.json](../../../../conformance/tuple-registry.json) + [README](../../../../conformance/README.md) (new) | One versioned JSON registry embedding the status meanings and verdict rules as data, byte-compared by the loader against the code constants so file and code cannot drift; statuses are stored AND rederived from evidence, failing closed on mismatch — `conformance-validated` without a qualifying run is structurally impossible. Maintainer-only, deliberately NOT authored upstream in `packages/docs/template/` (the recorded exception per the wave index). |
| Seed | Twenty tuples — the exact first-party descriptor placement matrix (codex 7, claude-code 7, pi 6), parity-tested against `FIRST_PARTY_HARNESS_CAPABILITY_DESCRIPTORS`. Zero `conformance-validated`; five `implementation-validated` citing write-path internal tests with never-recognition-evidence boundary notes; fifteen `provisional` with gap-naming notes. The negative Codex v0.142.4 recognition probe (register item R-021) is recorded on `codex-plugin-native-project` as a `real-harness-probe` evidence ref — a new evidence kind for out-of-protocol observations that never moves a status — with a must-not-word-as-recognized governance note. Export-only tuples use the export-only-file generated-output kind. |

### Documentation passes

- Developer pass (`update-existing`): the conformance-lab guide gained a Packaging Conformance Tuple and Registry section (tuple, drift-proofing, derivation rules, probe evidence kind, seed posture, maintainer-only boundary), and the packaging guide's Support-Tuple Binding section now describes and links the landed registry end of the promotion path. The packaging guide's W18 R9 Future Coverage bullet deliberately stays: it is blocked by recorded real-harness evidence, which this phase does not produce.
- User pass (`update-existing`, minimal): the packaging user guide's support-status wording now points at the registry as where support claims are looked up, stating zero conformance-validated combinations and claiming no recognition.
- PRD pass (`risk-register-update`): R-021 advanced in place (the registry structurally prevents evidence-outrunning; the probe rides its tuple; close bar unchanged), R-022 advanced in place (the blocked/inconsistent/unsupported never-advance machinery is now loader-enforced structure; scenarios and the R-TEST-2 check remain Phase 2/3), and R-014 gained a cross-reference note (the D-020 stopgap closed the realized window; the registry work touches no skill/script/CLI-logic sourcing). No new PRD docs, no renumbering.

### Validation

| Check | Result |
| --- | --- |
| `npm test -w packages/cli` | Green — 933 tests across 56 files (+28 for the conformance tuple and registry). |
| `npm run build -w packages/cli` | Green. |
| `npm run validate:defaults` | Green. |
| `python3 .make-docs/scripts/check_path_hygiene.py` | Clean. |
| Changed-file relative-link check | All links resolve. |
| `git diff --check` | Clean. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/prd/03-open-questions-and-risk-register.md](../../../prd/03-open-questions-and-risk-register.md) | R-021 and R-022 advanced in place with the registry's structural guarantees; R-014 cross-referenced to the D-020 closure and the Q-022/W18 R9 gating. |
| [docs/work/2026-07-01-w18-r9-playbook-and-package-conformance/01-support-tuple-and-tuple-registry.md](../../../work/2026-07-01-w18-r9-playbook-and-package-conformance/01-support-tuple-and-tuple-registry.md) | All six phase tasks checked complete. |
| [docs/assets/conformance/README.md](../../../../conformance/README.md) | New: documents the registry format, drift checks, status derivation, and the maintainer-only boundary. |

### Developer

| Path | Description |
| --- | --- |
| [docs/assets/library/developer/conformance-lab-scenario-and-result-contracts.md](../../library/developer/conformance-lab-scenario-and-result-contracts.md) | New Packaging Conformance Tuple and Registry section: the eight-dimension tuple and its relationship to the packaging claim tuple, registry drift-proofing, status derivation, the real-harness-probe evidence kind, the seed's honesty posture, and the upstream exception. |
| [docs/assets/library/developer/playbooks-development-packaging-and-harness-adapters.md](../../library/developer/playbooks-development-packaging-and-harness-adapters.md) | Support-Tuple Binding section extended with the landed registry end of the W18 R9 promotion path, cross-linked to the conformance-lab guide. |

### User

| Path | Description |
| --- | --- |
| [docs/assets/library/user/playbooks-packaging-shareable-agent-workflows.md](../../library/user/playbooks-packaging-shareable-agent-workflows.md) | Support-status wording now points at the conformance registry as the lookup home for support claims, with zero conformance-validated combinations stated and no recognition claimed. |
