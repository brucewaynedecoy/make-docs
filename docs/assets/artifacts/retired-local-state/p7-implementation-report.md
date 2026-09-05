# P7 Implementation Candidate

> Historical evidence retained on 2026-09-05. This report describes the work at the time it was written. Its state revisions, approvals, budgets, and pending actions are historical statements, not current instructions. See the [accepted Phase 7 closeout](../../../work/2026-08-14-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/07-naive-uat-workflow-persona-and-evidence.md#accepted-implementation-closeout--2026-09-05) for the final result. See [retention notes](README.md) for the limited text changes.

State revision read: 194. Baseline: make-docs-v2 at 92195b8f0a20f5a1ea51023edc163cb20b045016.

## Outcome

The six stable UAT operations are active. CLI and MCP use one set of schemas and handlers. Helpers are read-only. Output states that validation covers records and current references. It does not certify qualification or independent human judgment.

Persona resolution loads project configuration. Canonical user is the no-input default. Explicit eligible maintainer slugs remain distinct. Unknown and agent Personas fail. SHA-256 evidence references must stay in the selected Persona testing tree. Symlink, traversal, other Persona, archive, artifact, missing-file and changed-digest references fail.

Scenario validation supports current Markdown field tables and tester bullets, plus optional typed JSON body records. It binds the submitted typed record to its current owning PRD file. Tester output has a fixed public field set. Recorded assessor evidence remains required. Findings and result helpers accept optional typed JSON body records in Persona artifacts. Manual workflow records remain usable without these helpers.

Results preserve the current five values. Gate authority must match the exact result, gate effect and decision informed. Store rows are not created. Existing lifecycle operations remain the route for bounded run/evidence receipts.

Checkpoint 10 is implemented in migration.ts through validateUatCheckpoint10. The immutable coordinator now advances through10. Checkpoints11-13 stay locked. The checkpoint checks provider and six-handler availability and default Persona resolution. It does not create an unassisted run or evidence. C1 proves helper availability and live refusal of a legacy writer while the migration lock is active. The P5 migration fixture and CLI migration receipt expectations now include10; those existing tests are reserved for the coordinator's full candidate check.

The Skill worker delivered the optional bundled local naive-uat Skill with current Unassisted Goal Testing display name. Its shared lifecycle report is [p7-skill-report.md](p7-skill-report.md). No remote fetch is needed.

## Exact Files

Implementation worker:
- packages/cli/src/operations/uat/schemas.ts
- packages/cli/src/operations/uat/ops.ts
- packages/cli/src/operations/registry.ts
- packages/cli/src/operations/pending/ops.ts
- packages/cli/src/run/cli.ts
- packages/cli/src/migration.ts
- packages/cli/tests/p7-ugt.test.ts
- packages/cli/tests/p3-operation-surfaces.test.ts
- packages/cli/tests/p5-migration-safety.test.ts
- packages/cli/tests/cli.test.ts
- packages/docs/template/.make-docs/system/references/naive-uat-validation.md
- packages/docs/template/.make-docs/system/references/naive-uat-workflow.md
- packages/docs/template/.make-docs/system/templates/naive-uat-scenario.md
- .make-docs/manifest.json
- .make-docs/system/references/naive-uat-workflow.md
- .make-docs/system/templates/naive-uat-scenario.md

Skill worker:
- packages/docs/template/.make-docs/agentics/skills/naive-uat/SKILL.md
- packages/cli/skill-registry.json
- packages/cli/src/skill-registry.ts
- packages/cli/src/utils.ts
- packages/cli/tests/p7-ugt-skill.test.ts
- packages/cli/tests/skill-registry.test.ts
- packages/cli/tests/skill-catalog.test.ts
- scripts/smoke-pack.mjs (Skill worker preserved local marker and updated all-Skill fixture expectations; no smoke run)

## Fixed Case Inventory

O1-O6: six operation CLI/MCP/direct parity cases.
O7: malformed input on both transports.
O8: provider workflow with no local snapshot or Skill.
P1: canonical default user.
P2: configured maintainer slug.
P3: unknown/agent/frontmatter drift rejection.
P4: self-attestation and missing isolation evidence rejection.
E1: canonical source drift, Markdown source compatibility, and operator leakage.
E2: evidence path rejection including symlink escape.
E3: finding disposition bound to current record.
E4: result meanings, not-needed-now and denied blocking without authority.
C1: checkpoint10 availability and legacy writer quiescence.
C2: preserved old project evidence after refused adoption.
D1: governing provider resources, typed schemas and dogfood body parity.
D2: fixed Linux and Windows path forms.
S1-S4: optional bundled install, lifecycle update/backup, native projection, owned uninstall and custom preservation (Skill worker report).

Eight named failure families remain: invalid-input, invalid-persona, unqualified-executor, invalid-scenario, prohibited-evidence-path, invalid-finding, unauthorized-blocking-gate, ownership-conflict. No new broad matrix was run.

## Runs And Budget

- Initial typecheck: only the three existing baseline errors.
- D1 alone before handler registration: first failed because the test used an extra parent directory; one test-only correction; second run passed1, skipped19.
- Remaining cases: npx vitest run packages/cli/tests/p7-ugt.test.ts -t '^(?!.*D1 validates)' --reporter=dot. Passed19, skipped1.
- Typecheck then found two new typing defects: CLI payload object type and test literal-union membership. Each fixed once.
- Affected confirmation: npx vitest run packages/cli/tests/p7-ugt.test.ts -t 'D1|O[1-8]|E1|E4|C1' --reporter=dot. Passed12, skipped8. This includes Markdown compatibility and checkpoint changes.
- Final typecheck: npx tsc --noEmit -p packages/cli/tsconfig.json. Only the exact three baseline errors remain: P5 claims at459; P6 receiptId at260 and271. Coordinator independently proved the baseline errors.
- Skill worker: four focused cases passed; see its report for runs.

Unique focused cases:24/24. Shared correction attempts:6/6. Counts: D1 test root; Skill S4 expectation; CLI payload typing; C1 test typing; restored unrelated P4 assertions during P3 pending-fixture maintenance. No defect has used more than one distinct correction. No correction attempts remain. Further correction needs owner authority. No full test suite, build, defaults validation or packed smoke was run by this worker. Coordinator retains the full candidate and post-material-change confirmation gates and independent review.

## Remaining Integration And Limits

The upstream and downstream workflow/template bodies match. The coordinator authorized exact proved-hash reconciliation after inspection showed resource.ensure refuses a provider refresh when the saved expected digest differs. No resource.ensure mutation was attempted. For exactly those two resources, files.hash, files.systemAsset.expectedHashes, resourceProjection.sourceDigest, resourceProjection.installedDigest, and resourceProjection.lastVerifiedAt now record the measured matching bytes. Source identity, ownership, selection and historical provenance fields remain unchanged. The new validation reference remains provider-backed; its temporary untracked local copy was removed instead of inventing a projection claim.

The full candidate check and independent review remain. No owner acceptance, phase closeout, staging, commit, push, publication or P8 work occurred.

The typed helpers verify evidence existence, digest and route. They cannot independently verify isolation, coaching, severity or human conclusions. Packet leak checks catch structural and direct text leakage; the recorded assessor must review semantic coaching. Markdown typed lists use semicolon separators. Result validation on a Markdown scenario includes run.scenario for source comparison. The candidate does not rewrite historical documents into typed records.

Platform proof is macOS execution plus fixed Linux/Windows path fixtures. It is not native Linux/Windows or full harness proof. P10 owns that proof. No paid service was used.

## Testing Decision For This Implementation

Testing type: Unassisted Goal Testing.
Decision informed: Whether an extra unassisted attempt changes this bounded implementation decision.
Reason now: not-needed-now. Focused assertions cover the typed operation and lifecycle changes; no separate current human uncertainty has been identified.
Product maturity: P7 implementation candidate.
Scope: The six validators, provider workflow, optional Skill and checkpoint10.
Executor: none.
Gate effect: advisory.
Effort budget: no unassisted run.
Stop condition: stop when focused proof and independent review complete.
Evidence retained: focused test report, Skill report and coordinator review.
Rerun trigger: a material human uncertainty identified by review or a changed public goal.
No NUAT scenario or O obligation was invented for this decision.

Candidate is frozen for coordinator full validation and independent review.

## Final Allowed Correction

Coordinator full candidate run reported 12 failures out of 1311 tests. Correction6 repaired only the two lastVerifiedAt values for the workflow reference and scenario template. Python had emitted microsecond precision. Each now uses JavaScript Date.toISOString format: 2026-09-04T23:46:38.269Z. All other manifest fields stayed unchanged.

Read-only validation used node --import tsx to import the actual packages/cli/src/manifest.ts loadManifest function. It loaded this repository manifest successfully. No tests, full suite, other fixture or code edits were run for this correction. All edits stop here. Full checks and independent review remain with the coordinator. Any further correction returns to the owner.
