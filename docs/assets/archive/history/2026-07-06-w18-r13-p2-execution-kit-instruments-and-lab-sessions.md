---
title: "W18 R13 P2: Execution Kit, Instruments, and Lab Sessions"
kind: "history"
status: "completed"
date: "2026-07-06"
client: "Claude Code"
model: "Fable 5"
coordinate: "W18 R13 P2"
repo: "make-docs"
branch: "make-docs-v2"
summary: "Landed the executable projection of the conformance lab: the per-target kit generator with three-layer executable-by-construction validation as maintainer-only tooling, the four deterministic bar-stage instruments, the honesty-pinned prompt set and generated discovery kit, the descriptor lab interrogation block, and the lab-session vocabulary with evidence homes that retire the repo-local .make-docs/conformance/ transcript home — advancing D-023 and D-024 on their structural halves while the P4 verification bar owns the closures."
---

# W18 R13 P2: Execution Kit, Instruments, and Lab Sessions

## Changes

This session implemented Phase 2 of [the W18 R13 backlog](../../../work/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/02-execution-kit-instruments-and-lab-sessions.md) (all twelve tasks t1–t12 across the three stages, per [historical closeout](2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign.md) (retired action-PRD: `docs/prd/43-revise-conformance-scenario-model-and-execution-kit.md`) R-KIT-1..3, R-INST-1..2, R-PROMPT-1, R-DISC-1, R-HOME-1..2 and [historical closeout](2026-07-06-w18-r13-p4-verification-and-reconciliation.md) (retired action-PRD: `docs/prd/44-revise-conformance-lab-execution-protocol-and-evidence-homes.md`) R-NAME-1..2, R-EXEC-1..3) and ran the phase documentation passes.

### Implementation

| Surface | Summary |
| --- | --- |
| `packages/cli/src/conformance/kit.ts` (new) | The per-target conformance kit generator (t2–t9): generation for one (definition, target) pair or one target's full first-pass suite into a disposable lab-session root outside the repository, with the fixed `kit/`–`workspace/`–`evidence/` layout, distributables shipped through the real packaging pipeline, and the session manifest recording definition id, target, tuple ids, generation inputs (descriptor digest, CLI version), and the expected-evidence table (t5). Executable-by-construction in three layers (t3, D-023's structural close direction): static argv projection through the registry-derived resolver, the authored CLI adapters, and each operation's input schema (`adaptRunCliArgv`), with non-`run` commands through the real CLI parser (`validateMakeDocsCliArgv`); workspace materialization that executes the definition's own establishment steps under a session-scoped store isolation (the machine-level store root binds to session-local scratch, so a disposable session never registers in the operator's real store); and every ship step driven end to end through the operation core under dry-run via the shipped compiler and descriptors. Fails generation closed naming the definition, target, and unprojectable element — including uncovered targets and descriptor interrogation gaps — with any created session artifacts removed. `listConformanceLabShippedSurfaceViolations` (t4) asserts nothing lab-shaped is registered or on the `run` CLI tree, so the W18 R11 parity rule is preserved vacuously (revisit seam on register item Q-022). |
| Instruments, prompts, and the discovery kit | One self-contained deterministic instrument per bar stage (t6/t7; `node:` builtins only, no network, no model routing, no clock, no randomness, `--json` pinned on consumed CLI output): install exit codes plus placement-root file inventories, discover captures of the harness's own listing surfaces per the descriptor interrogation block, the invoke probe marker from the `conformance-skill-probe` fixture, and byte-level before/after uninstall diffs — outputs land under `evidence/`, interpretation deferred to Phase 3 ingestion. The rendered prompts (t8) carry the target-agnostic honesty core verbatim (`CONFORMANCE_PROMPT_HONESTY_RULES`, the R-EXEC-1 "the agent drives, the instruments measure" rule) with harness specifics from the descriptors, and never ask the target agent to certify; prompt snapshots are pinned by tests. The discovery-kit variant (t9) generates the R-021 characterization session on the plugin definition's Codex binding with the `resolvesProbe` linkage carried verbatim into the session manifest. |
| `packages/cli/src/conformance/lab-session.ts` (new) | Lab-session vocabulary and evidence homes (t10/t11; PRD 44 R-NAME-1..2, D-024): deterministic date-target-outcome session ids, OS-temp default session roots, the retained-session home `<store-root>/conformance-lab/sessions/<session-id>/` as a narrowly named location adding no store schema, and `transcriptLogPointer` validation accepting exactly a store lab-area path or `discarded-with-session` — a pointer naming repo-local `.make-docs/conformance/` fails with D-024 named. |
| Transcript-home retirement (t12) | The `.gitignore` `.make-docs/conformance/` entry is removed (the adjacent `.make-docs/runs/` store-migration entry preserved), the `scenario.ts` transcript-pointer default and the `registry.ts` commentary no longer name the old home, and the compiled package's embedded `.make-docs/conformance.json` record is untouched — the reconciliation grep over `.gitignore`, `packages/cli/src/`, and `packages/cli/tests/` returns no hits. |
| `packages/cli/src/operations/playbook-packaging/capability-descriptor.ts` and `descriptors.ts` | The lab-facing `HarnessLabInterrogation` block (t1; PRD 43 R-HOME-2 enhancing PRD 36 R-CAP-2): `versionCommand`, `launchCommand`, `listingCaptures`, `invocationEvidence`, `workspaceNotes`, and `knownGaps`, every claim verification-marked and never more confirmed than the packaging contract it rides on, deliberately excluded from `computeHarnessContractDigest` (a recorded implementer decision). Codex is populated where honestly verified (version command verified via the 2026-07-03 R-021 probe; launch provisional; `invocationEvidence` null with `knownGaps` naming the unverified surfaces), Claude Code is fully provisional, and Pi carries no block — honest absence, failing kit generation closed. |
| Maintainer tooling entry | `packages/cli/scripts/conformance-kit.ts` behind `npm run conformance:kit` (root and `packages/cli` scripts) — maintainer tooling only, nothing registered in the operation registry, nothing on the CLI command tree or MCP surface (PRD 43 R-HOME-1). |
| Scenario definitions at 2.1.0 | The generation dry run caught two latent defects the structural checks had passed, validating the executable-by-construction bar: the `conformance-skill-probe` fixture's `scenario-spec` reference prose parsed as a repository path (failing redistribution resolution), and all four packaging definitions lacked the `make-docs setup --yes` workspace-establishment step their later steps assumed. Both are fixed in `conformance/scenarios/packaging/*.json` at `scenarioVersion` 2.1.0. |
| Tests | New `packages/cli/tests/conformance-kit.test.ts` and `packages/cli/tests/conformance-lab-session.test.ts`: generation over the committed definitions with byte-determinism pins, the R-KIT-3 fail-closed modes, the D-023 defect classes asserted impossible in generated output, prompt and honesty-rule verbatim pins, instrument runs over a synthetic session, full Codex first-pass suite generation, the shipped-surface boundary, and interrogation-block validation. Suite total: 1047 tests across 61 files. |

### Documentation passes

- Developer pass (`update-existing`): the conformance-lab guide gained The Execution Kit and Lab Sessions section (kit generation and its maintainer-only home, the three-layer executable-by-construction validation and why the D-023 defect classes are impossible in generated output, the per-stage instruments, the agent-drives-instruments-measure prompt set, the discovery kit, and the lab-session vocabulary with evidence homes), with the first-pass definitions section advanced to the 2.1.0 posture and the dry-run-caught defects recorded; the packaging guide gained the Lab-Facing Interrogation Block subsection (shape, verification marking, the digest exclusion decision, and the honest per-harness population states); the CLI/MCP parity guide gained one paragraph recording the kit generator as the deliberate off-registry surface with its enforcing assertion and the Q-022 revisit seam.
- User pass (`none`): Phase 2 is maintainer lab tooling with no user-facing surface — nothing new ships, no CLI or MCP surface changed, and the user packaging guide's conformance posture (zero conformance-validated combinations, no scenario has run, blocked-honesty) remains accurate as written, so no user guide changes.
- PRD pass (`risk-register-update`): D-023 advanced in place — the structural half landed with the kit generator and its tests, the dry-run-caught defects recorded as validation of the approach, closure with the P4 enforcing executability check; D-024 advanced in place — the live default retired everywhere with the near-collision preserved, the maintainer's local ~8KB probe residue recorded as an operator to-do rather than a code defect, closure adjudication with P4; R-028 advanced with the full P2 inventory coverage (entries 6, 8, 16, 17) and the remaining Phase 3-4 scope; R-021 advanced only as far as the truth supports — the discovery kit now generates the characterization session with `resolvesProbe` intact, and the item stays open until the maintainer operates the Codex sessions. No new PRD docs, no renumbering, no other register items touched.
- Support-claim surfaces: unchanged — the registry still reads conformance-validated=0/20 and every `support-claim-state` marker continues to assert exactly that.

### Validation

| Check | Result |
| --- | --- |
| `npm test -w packages/cli` | Green — 1047 tests across 61 files (+kit and lab-session suites). |
| `npm run build -w packages/cli` | Green. |
| `npm run validate:defaults` | Green. |
| `npm run smoke:pack` | Green. |
| `python3 .make-docs/scripts/check_path_hygiene.py` | Clean. |
| Changed-file relative-link check | All links resolve. |
| `git diff --check` | Clean. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/prd/03-open-questions-and-risk-register.md](../../../prd/03-open-questions-and-risk-register.md) | D-023, D-024, R-021, and R-028 advanced in place with the P2 machinery; D-023/D-024 closures rest with W18 R13 P4, and the D-024 operator residue to-do is recorded. |
| [docs/work/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/02-execution-kit-instruments-and-lab-sessions.md](../../../work/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/02-execution-kit-instruments-and-lab-sessions.md) | All twelve phase tasks checked complete. |

### Developer

| Path | Description |
| --- | --- |
| [docs/assets/library/developer/conformance-lab-scenario-and-result-contracts.md](../../library/developer/conformance-lab-scenario-and-result-contracts.md) | New The Execution Kit and Lab Sessions section; first-pass definitions advanced to the 2.1.0 executable-by-construction posture; future coverage retargeted to Phases 3-4. |
| [docs/assets/library/developer/playbooks-development-packaging-and-harness-adapters.md](../../library/developer/playbooks-development-packaging-and-harness-adapters.md) | New Lab-Facing Interrogation Block subsection under Harness Capability Descriptors, with the descriptor field list extended. |
| [docs/assets/library/developer/cli-mcp-operation-parity-and-permissions.md](../../library/developer/cli-mcp-operation-parity-and-permissions.md) | One paragraph recording the conformance kit generator as the deliberate off-registry maintainer surface (PRD 43 R-HOME-1, Q-022 revisit seam). |

### User

None this session — Phase 2 has no user-facing surface, and the user guides' conformance posture remains accurate as written.
