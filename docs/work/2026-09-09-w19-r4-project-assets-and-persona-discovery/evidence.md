---
title: "W19 R4 Implementation Evidence and Experience Review"
kind: "work"
status: "completed"
coordinate: "W19 R4"
source:
  type: "prd"
  path: "docs/prd/22-project-documentation-asset-model.md"
follow_on:
  route: "implementation-loop"
  next_prompt: "make-docs://system/reference/execution-workflow.md"
  why: "Record the accepted corrected implementation and its evidence; retain prior build limits."
  coordinate_handoff: "W19 R4 P1 was accepted and closed on 2026-09-09; its implementation commit is authorized. Keep W20 R0 and W21 R0 paused."
---

# W19 R4 Implementation Evidence and Experience Review

## Review Status

The real project migration completed and the prior build passed all 1,077 tests in 70 test files. Owner review then found missed current Persona names in guide templates, prompts, coverage contracts and closeout output. The correction and final current-guide audit are now complete. The corrected build passed all 1,087 tests in 71 files. Final defaults, authority, path and layout checks passed. Prior package and A4 byte proofs below remain tied to their recorded build. The owner explicitly accepted the corrected result on 2026-09-09 and asked for closeout and commit. That renewed acceptance follows the correction; the prior interrupted acceptance is not substituted for it. This report supports the [one-phase backlog](./01-assets-and-persona-cutover.md). This closeout records the separate owner approval to close the phase and create its implementation commit.

The owner accepted the package at `532b29cf`. R3 remains closed at `dabd0b36`. W20 R0 and W21 R0 remain paused.

This file is a project history breadcrumb. The complete reviewed migration plan, recovery payload identities, journal and completion state remain in the global Make Docs Store. No local plan or receipt is used as a fallback.

## A4: First Asset Work Without the CLI

A fresh automated agent received only an initialized test project's instructions and config. The setup selected Codex, no Skills and no optional system-resource bodies. The project had no assets directory. The config added a custom `operators` audience. The local router declared only `AGENTS.md` for asset instructions.

The [exact prompt](./evidence/a4/prompt.txt) asked for a shared project note, a maintainer guide and an operator guide. It did not give destination paths. It prohibited prior history, memory, outside files and network sources. The [child boundary](./evidence/a4/child-boundary.json) records an ephemeral task with isolated HOME/CODEX_HOME, disabled memory/plugins/apps and `/usr/bin:/bin` on PATH. The CLI absence check reported `make-docs unavailable`.

The [action transcript](./evidence/a4/transcript.jsonl) shows that the agent read the local routers and config. It found the optional contract, template and lifecycle bodies absent. It then made precisely four files:

| Actual fixture output | Retained output bytes |
| --- | --- |
| `docs/assets/AGENTS.md` | [Asset router](./evidence/a4/created/docs/assets/AGENTS.md.txt) |
| `docs/assets/project/project-note.md` | [Shared project note](./evidence/a4/created/docs/assets/project/project-note.md.txt) |
| `docs/assets/maintainer/maintainer-guide.md` | [Maintainer guide](./evidence/a4/created/docs/assets/maintainer/maintainer-guide.md.txt) |
| `docs/assets/operators/operator-guide.md` | [Operator guide](./evidence/a4/created/docs/assets/operators/operator-guide.md.txt) |

The [verification result](./evidence/a4/verification.json) reports exit code 0. No prior file changed. No Claude router, child router, empty user directory or local operation-state file was created. The agent did not invent runnable project commands. Its [final response](./evidence/a4/last-message.txt) states the limits caused by absent optional bodies.

The [package comparison](./evidence/a4/final-package-match.json) matched all 12 bootstrap routers to the installed `2.0.0-rc` package. The docs router used the exact Codex-only selection substitution. The remaining bytes matched without normalization. The installed entrypoint hash for that comparison was `167cefd78984d814c7a0ffe8589a76527ea8ed534d10f1e7b606904bac4186fa`. The [prior final build comparison](./evidence/a4/final-build-match.json) confirms that all 12 original fixture routers matched that prior installed package, its actual tar members and the same selection rendering. Its entrypoint hash is `3a05d3e5e2cf1ce3a7616070fe88521f48334b7def38413b6873919970187c3f`; its prior tar hash is recorded below. The later corrected-package comparison is recorded in the correction section. No second agent run was claimed.

The [byte index](./evidence/a4/byte-index.md) binds the retained prompt, transcript, results, before/after hash inventories and outputs. Created Markdown outputs have a `.txt` suffix here. They are inert evidence, not another active set of project instructions.

**Limits:** this is one fresh automated agent observation, not qualified-human UAT or owner acceptance. Visible tool calls stayed within the fixture; this is not an OS audit of every runtime read. Authentication and model transport used external services. The first sandboxed transport attempt failed DNS and was stopped; the successful retry kept the child workspace sandbox. The fixture had no runnable product, so its guides correctly avoided invented commands. Existing setup backup payloads were present before the child ran; the child created no new operation state.

## Real Dogfood Migration

The refreshed installed public CLI ran the reviewed migration. The Store operation was `192c189a-ea37-4577-af3b-21bec8c8fcf3`. Its review digest was `686d5ec6715052a25102d90a902bd7863aedfba02bcf3fbeba3000da30ccc33d`. CLI apply returned `completed`.

The reviewed scope included 598 file moves and 1,418 path changes. It recorded 2,211 link edits, 1,074 unchanged-link checks and four Persona metadata updates. The independent read-back checked all 1,418 changed paths with no errors. It checked real bytes and paths, not destination names alone.

The seven explicit choices were:

| Source below `docs/assets/` | Reviewed destination |
| --- | --- |
| `library/developer` | `docs/assets/maintainer` |
| `artifacts/playbook-contract-and-plugin-remediation.md` | `.make-docs/archive/legacy-playbooks/artifacts/playbook-contract-and-plugin-remediation.md` |
| `library/developer/playbooks-development-runner-architecture.md` | `.make-docs/archive/legacy-playbooks/library/developer/playbooks-development-runner-architecture.md` |
| `library/developer/plugin-substrate-workflow-bundles-maintainer-contract.md` | `.make-docs/archive/legacy-playbooks/library/developer/plugin-substrate-workflow-bundles-maintainer-contract.md` |
| `library/user/playbooks-running-make-docs-workflows.md` | `.make-docs/archive/legacy-playbooks/library/user/playbooks-running-make-docs-workflows.md` |
| `library/developer/playbooks-development-packaging-and-harness-adapters.md` | `.make-docs/archive/legacy-playbooks/library/developer/playbooks-development-packaging-and-harness-adapters.md` |
| `library/user/playbooks-packaging-shareable-agent-workflows.md` | `.make-docs/archive/legacy-playbooks/library/user/playbooks-packaging-shareable-agent-workflows.md` |

The last two guides joined the archive map after content review. Both still described retired package commands as current. Resolving their links would not make those operational claims current. All six specifically archived documents retain their old relative tree under `legacy-playbooks`.

The general cohort rules moved shared artifacts to `docs/assets/project`, verified user material to `docs/assets/user`, the old archive to `.make-docs/archive`, and retired Playbook source material to `.make-docs/archive/legacy-playbooks`. They removed exact empty old system directories. The config had only the existing project ID; there was no custom developer Persona. The explicit audience map provided review authority without guessing from the developer name.

The completed plan contained 42 stated exclusions. These include the named history/backup boundary and exact pre-existing missing historical link targets. They do not excuse active legacy folders or new broken links. The full exclusion and link records remain bound to the reviewed Store plan.

The resulting assets root has `AGENTS.md`, `CLAUDE.md`, `maintainer/`, `project/` and `user/`. Full source, build and dogfood inventories found no obsolete empty asset families or old system-directory remnants. The current typed system routers remain present.

Repeat preview returned `unchanged` with zero changes. Reapplying the completed operation returned `already-complete`. Repeat setup reported zero updates and zero removals. It skipped one archived Playbook as historical content.

The independent results were read from the root run's bounded evidence: `w19-r4-dogfood-independent-check.json`, `w19-r4-repeat-preview.json`, `w19-r4-repeat-apply.json` and `w19-r4-final-trees.json`. Those temporary observation files are summarized here; no operational plan or Store receipt is copied into the project.

## Installed CLI Recipe

The actual maintainer path was `just install-cli`, then the public installed CLI. It used no one-off cleanup script or direct repository `node dist` command.

1. Run `make-docs setup --target . --dry-run --yes` and review the result.
2. Run `make-docs setup --target . --yes`.
3. Read effective audiences with `make-docs project persona list --target-root . --json`.
4. Run `make-docs project layout preview --target-root . --json` with the seven repeated `--map source=destination` choices in the table above. The table sources start with `docs/assets/`.
5. After review, run `make-docs project layout prepare --target-root . --json --mode cli --review <reviewed-digest>` with the same seven maps. The digest and operation ID above are historical breadcrumbs, not reusable inputs for a new migration.
6. Apply the returned ID with `make-docs project layout apply <operation-id> --target-root . --json`.
7. Repeat preview without maps and repeat apply with the completed ID. Confirm unchanged/already-complete results.

Two upstream/installer correction rounds used the same install recipe and public setup path. The final refresh includes the canonical-path helper corrections. The final setup dry-run returned zero generated, updated or removed files, with one archived Playbook skipped as historical content.

## Safety Review and Test Coverage

The targeted checks cover config defaults and merge errors, Store-independent Persona lookup, on-demand assets, honest compatibility-alias results, reviewed maps, exact destination conflicts, source and incoming-link drift, manual completion and recovery.

Independent code review found and resolved three integration gaps. Persona metadata edits now appear in public preview and manual instructions. Unsupported source symlinks now stop at preview. R4 detached writes now stage bytes beside the target, record temp ownership in Store, verify the payload, and replace the final file atomically. Recovery accepts only exact Store-proven temporary files during progress. Final verification permits no temp-file exclusion. Changed or unrecorded temporary files are preserved and block recovery.

The Store suite exercised a real subprocess exit during a partial write, before rename and after rename. It also checked changed-temp preservation. This evidence covers R4 detached writes; it does not claim that the older generic R3 file-writing path changed.

A separate planner review found and resolved omitted README links, omitted links inside moved old system files, and compatibility aliases taking precedence over explicit maps. The planner also records unchanged link targets so later target drift cannot pass unnoticed.

The targeted drift-register check now permits new records while preserving the existing record names, sequential IDs and duplicate checks. It no longer fails solely because D-032 was added.

## EP1–EP5 Experience Review

This is an agent review of named observations. It does not substitute for the owner's judgment of the visible file tree and CLI results.

| Promise | Observed surface and evidence | Conclusion and limit |
| --- | --- | --- |
| EP1: Find shared and audience paths before assets or CLI exist. | A4 agent found shared, built-in maintainer and custom operators paths from local routers/config. All four outputs matched the declared locations. | **Satisfied in the observed case.** One fresh Codex task; no claim about never-initialized projects or every agent. |
| EP2: Create only needed directories and selected instructions. | A4 made only the selected root AGENTS router and three content-bearing children. It made no empty user child or child routers. Full source/build/dogfood inventories omitted retired empty families. | **Satisfied by current evidence.** The final package tree and A4 bootstrap byte comparison also passed. |
| EP3: Review exact destinations and edits before files move. | Public preview exposed source/destination paths, hashes, links and Persona edits. Seven explicit choices resolved audience provenance and retired guidance before Store preparation. | **Satisfied by the recorded CLI path.** The owner must still judge whether the presentation is clear enough for routine use. |
| EP4: Complete or recover without losing changed content. | CLI completion required source/destination/link verification. Independent read-back passed 1,418 paths. Failure tests covered interrupted writes and blocked changed input/temp files. | **Satisfied within tested CLI/manual paths.** Automated faults are finite; no claim of all possible storage failures. |
| EP5: Keep ordinary work available when Make Docs state is unavailable. | A4 completed ordinary authorship without CLI or optional bodies and made no fallback state. Store-independent Persona query and required-state refusal have focused tests. | **Satisfied within observed and tested paths.** Missing Store still blocks managed migration as designed; this does not block ordinary content work. |

Owner review found a material gap after these observations: a current guide resource still carried the former developer name. Related current defaults and coverage labels also remained. The prior automated checks did not detect that gap. The correction, scoped regressions, corrected-build run and final current-guide audit now address this gap. Renewed owner review was required and then supplied. The owner's renewed phase acceptance is recorded in the closeout section below. Formal qualified-human UAT and separate visual/accessibility testing were not required for this bounded file/CLI change. This report does not claim that those tests ran.

## A1–A12 Actual Results

| Case | Actual result | Evidence and limit |
| --- | --- | --- |
| A1 Defaults and merge | Focused resolver checks passed for absent/empty/comment-only config, fixed defaults, display overrides and custom additions. | [Config tests](../../../packages/cli/tests/config.test.ts) and [Persona/assets tests](../../../packages/cli/tests/r4-persona-assets.test.ts); A4 also used an undeclared built-in maintainer plus declared operators. The corrected aggregate run passed all 1,087 tests. |
| A2 Invalid config | Focused checks rejected null/wrong types, duplicate/unsafe/reserved names and invalid primitive overrides. | Config/Persona error fixtures preserve source config; the focused config/router group passed 26/26 and the Persona/assets group passed 28/28. These are finite input cases, not an exhaustive parser proof. |
| A3 Store-independent query | Public Persona discovery works without a Store and before assets exist. | The Persona/assets fixture points `MAKE_DOCS_HOME` at a regular file and still succeeds without Store/config/assets writes. A4 separately proves authorship with no CLI. |
| A4 Fresh-context discovery | Observed pass: four exact outputs, no prior-file changes, no extra routers, no fallback state. | Retained prompt/transcript/results and the original plus corrected 12-router package comparisons. One automated agent observation. |
| A5 Full delivery tree | Final source/build/extracted template hashes and trees match: 92 files and 17 directories; tar has 127 entries. Legacy empty families are absent. | Final package proof and full source/build/dogfood inventories; fresh/upgrade/repeat package smoke passed. |
| A6 Surface and alias behavior | On-demand assets use selected root routers only. The artifacts alias names the shared destination without creating an empty child or the old path. | Persona/assets tests cover all three selected harness matrices, reconfiguration, existing user router preservation and alias results. [Router path tests](../../../packages/cli/tests/router-paths.test.ts), A4 single-router output and final installed setup repeat also passed. |
| A7 Preview and prepare | Read-only preview preceded review; Store preparation saved the exact seven-map intent before dogfood mutation and released its process lock. | Real operation ID/digest above; Store integration tests cover unchanged config, pending-write exclusion and stale-review refusal. |
| A8 CLI migration | Completed 598 file moves and 1,418 path changes with seven explicit choices. Independent read-back had zero errors. | Real installed CLI operation and independent path/hash check; planner tests cover conflicts, explicit-map precedence and link repair. |
| A9 Manual migration | Focused manual-mode tests passed. Verification requires recorded bytes/links/source removal and performs no manual file moves. | Store integration fixtures include wrong bytes, new source/destination entries, partial manual rollback and mode mismatch. The real dogfood used CLI mode. |
| A10 Interruption and drift | Tested failures preserve pending work and changed input. R4 atomic writes recover from partial write and before/after rename exits. | Real subprocess exit cases, changed-temp preservation, full-scope/unchanged-target guards and concurrent-writer tests. Older generic R3 writes are outside this atomic change. |
| A11 Retention and repeat | Historical content follows the reviewed map and 42 stated exclusions. Repeat preview has zero changes; repeat apply is already complete. | Read-back of the exact plan result; archived operational guides remain non-active. No new historical outcomes were authored by link repair. |
| A12 Dogfood and experience | Public installed workflow completed; Store now reports ready with no pending operation. EP1–EP5 have named observations and limits above. | Seven-map disposition, 1,418-path check, source/build/dogfood trees, A4 evidence and final status. Renewed owner acceptance is recorded below. |

## Final Build and Check Reconciliation

The prior verified package version is `2.0.0-rc`. Its tar SHA-256 is `90aa7b8afe9abeea1dd8427854d1a6070c9188fc573d54d0f6121fc83223c049`. The root's final package proof recorded 127 tar entries, 92 template files and 17 template directories, with exact source/build/extracted hash and directory parity. `just smoke-pack` returned exit code 0 against this build.

The final public Store status returned `ready`, `storeAvailable: true`, `pendingOperation: null`, and `No recovery is required.` The post-suite filesystem check found no local state/manifest, old contracts/templates roots or old artifact/archive/Library/Playbook roots. The assets root still contains exactly `AGENTS.md`, `CLAUDE.md`, `maintainer`, `project` and `user`. The final installed setup dry-run reported zero generated, updated or removed files. One archived Playbook was skipped. Router, wave-number and whitespace checks passed again.

The earlier clean full-suite run reported 1,050 of 1,054 tests passing. Four stale path assertions were corrected. The next final-build run passed 1,056 of 1,057 tests. Its sole failure was the 20-second timeout of one test that grouped several real CLI launches; no assertion failure or runner error occurred. The independent CLI cases were split without raising the 20-second per-case timeout. The focused retirement suite passed 25/25, retaining assertions for all 20 retired CLI spellings and help. The final full rerun passed all **1,077 tests in 70 test files**, with exit code 0, no runner errors and a duration of 319.99 seconds. The test split changed no runtime, template or package bytes. The final package hash remains unchanged.

The final-build PRD authority check covered 39 PRDs, 528 Markdown documents, 166 structured files and 867 links with zero diagnostics. Final path hygiene checked 84 Store-owned files with zero findings, I/O errors or changes. Router and wave-number checks passed again. A final documentation-only check may update counts after this report and D-032 are reconciled.

The prior helper audit, A1–A12 checks and EP1–EP5 review missed the current Persona-name gap. Tasks t1, t3, t12, t13, t14 and t16 were reopened for that gap. The correction and current evidence below resolve them. The earlier green result alone did not resolve them. At that checkpoint, owner acceptance, phase closeout and the implementation commit remained separate pending steps. The accepted closeout below records the later owner decision. W20 R0 and W21 R0 remain paused.

## Owner-Found Persona Name Correction

The owner found `.make-docs/system/templates/guide-developer.md` after the prior green build. The follow-up audit found its matching coverage prompt, a former `agent` default, developer coverage labels, history labels and current PRD decision rows. These were current product instructions, not retained historical content. The earlier 1,077-test result and tar proof did not cover this gap. They remain recorded above as evidence for the earlier build.

The correction uses `guide-maintainer.md` and `coverage-pass-maintainer-guide.prompt.md` throughout current source selection, catalog data, contracts and prompts. The guide coverage contract now separates its four verdicts (`create`, `update-existing`, `link-only`, `none`) from the effective Persona target. New history drafts use Project, Maintainer and User headings. The closeout helper emits `maintainerGuides`; its current caller test uses that key. Existing historical Developer headings remain valid input and are not rewritten. Current Q-009/Q-019 schema rows and Q-014 future-routing instructions now follow the R4 authority, with their former decisions retained as dated history.

The bounded audit kept explicit custom `developer` Personas, retired-path test fixtures and ordinary human developer roles intact. Optional archive guidance now covers configured Persona guides instead of naming only former defaults. Regression tests cover the new resource names, safe upgrade removal of owned former resources, current coverage/default wording, and exact preservation of an existing historical Developer record. The closeout suite passed 11 of 11 tests in an isolated Store. The other source owners reported 215 distinct scoped checks plus TypeScript validation passing before the rebuild.

The root ran `just install-cli` and `just smoke-pack`; both passed. The corrected tar SHA-256 is `8b9d11d9b84d2961285f0e007c097191fcf2cae6411f5adfde6907b353cb6c6e`. Its proof records 127 entries, 92 template files and 17 template directories. Source, build and extracted trees and bytes match. Both former resource filenames are absent from the packed template.

The public installed CLI then previewed and applied two generated resources, eight updates and two removals. It skipped the same archived Playbook. The two removals were the former managed guide template and coverage prompt. The two generated resources carry the current maintainer names. The apply returned exit code 0. The existing 598-file project-content migration was not repeated or replaced by manual cleanup.

The [corrected-package byte comparison](./evidence/a4/persona-correction-package-match.json) proves that all 12 A4 bootstrap routers still match the corrected packed and installed build, with the exact Codex-only declaration rendering accounted for. This is a byte comparison against the original fresh-agent fixture. It is not a second fresh-agent run, a qualified-human test or owner acceptance. The original prompt, transcript and outputs remain unchanged.

The corrected-build suite passed all 1,087 tests in 71 test files, with exit code 0 and no runner errors (224.33 seconds). The final current-project guide audit and final document/path checks below also passed. The technical tasks and D-032 are complete on that combined evidence. Owner acceptance, phase closeout and the implementation commit remain paused. W20 R0 and W21 R0 remain paused.

The final public layout preview found three remaining Markdown target repairs in two files: `.make-docs/archive/history/2026-05-05-guide-generation-consistency.md` and `docs/assets/maintainer/template-contracts-guide-authoring.md`. The root reviewed the canonical former-guide to current-guide targets, then prepared and applied them through the installed CLI. Operation `44eee845-b533-41ec-abc0-79287569f573` completed with no conflicts against review digest `f8018df5cea6cbccd05d8a1beaa4909ae80ded4df12d9354796f0c13b48034dd`. Independent read-back verified both resulting file hashes. These are mechanical link repairs only; the historical record body and name were preserved. The global Store retains the operation plan and completion record.

The repeat public layout preview returned `unchanged`, with zero path changes, link edits, metadata edits or blockers. Its next action states that no migration or preparation is required.

Corrected-build validation source: `/tmp/w19-r4-persona-fix-full-tests.log`. This result applies to tar `8b9d11d9b84d2961285f0e007c097191fcf2cae6411f5adfde6907b353cb6c6e`. The earlier 1,077-test result and `90aa7b8a...` tar remain prior-build evidence only. The separate current-guide audit below concerns project prose and is not inferred from this green suite.

## Current Guide Audit and Correction

The final bounded review covered all 19 current audience guides under `docs/assets/maintainer/` and `docs/assets/user/`. One worker reviewed four named guides. A second read all 271 indexed sections in the other 15 guides, with no retrieval errors. The review checked current local-state authority, default Personas, retired asset destinations and direct upstream-to-dogfood copy instructions. It excluded archive/history content and did not expand into a general product or command audit.

Eight current guides needed corrections:

- `maintainer/template-contracts-guide-authoring.md`
- `maintainer/template-assets-and-generated-routers.md`
- `maintainer/maintainer-docs-assets-and-runtime-state-boundaries.md`
- `maintainer/skills-catalog-and-distribution-model.md`
- `maintainer/maintainer-dogfood-and-maintainer-operations.md`
- `maintainer/release-packaging-validation-and-release-reference.md`
- `user/getting-started-installing-make-docs.md`
- `user/cli-lifecycle-managing-installations.md`

These paths are relative to `docs/assets/`. The fixes replace current local-manifest authority and Store-warning/continue instructions with global Store ownership and refusal before required managed writes. They use current Persona names and asset paths, declarative config identity, public installed CLI propagation and recovery, and the explicit separate Store removal choice. They preserve valid backup guidance and ordinary work without the CLI. Existing section anchors, useful metadata and historical substance remain.

The three edit groups checked 21, 7 and 22 Markdown link targets; all exist. Whitespace checks passed. The remaining scoped matches were valid backup copies, explicit historical or fixture references, and ordinary developer roles. No source, template or package bytes changed after the corrected 1,087-test run. This current-project prose audit supports the named state, path and Persona rules; it does not claim that every command or every product behavior in all guides received a new audit.

The corrected Store status is ready with no pending operation. Final path hygiene checked 84 managed files with no findings. Final authority and layout-preview commands returned exit code 0. The last defaults check passed all 50 checks in two files with exit code 0. PRD authority checked 39 PRDs and 867 links with zero diagnostics. The final layout preview returned unchanged with zero changes and blockers. The owner-found issue interrupted the earlier acceptance path; renewed owner review was required after final reconciliation and is recorded below.

All 16 technical backlog tasks are complete. D-032 is closed on the corrected implementation and review evidence. The corrected phase was presented for renewed owner acceptance. The owner-found issue and the limits of the earlier proof remain recorded. The owner then requested closeout and commit. The closeout below records phase completion; commit creation remains an authorized next action. No publication or W20/W21 resume is implied.

## Accepted Closeout and Evidence Retention

The owner accepted corrected W19 R4 P1 on 2026-09-09 and explicitly requested closeout and commit. All technical tasks are complete. D-032 is resolved. The phase is closed by that owner decision. The package remains at its current paths; it was not archived. R3 remains closed at `dabd0b36`. W20 R0 and W21 R0 stay paused pending separate instructions. The matching [history record](../../../.make-docs/archive/history/2026-09-09-w19-r4-p1-project-assets-and-persona-discovery.md) supplies the commit body.

The current coverage contract was read after owner commits `41fb303` and `dc409fd`. This file is the backlog's central evidence report. Its A1–A12 table states each claim, observation and supporting check. The shared review frame is: Codex implementation and peer reviewers inspected the TypeScript CLI in this macOS checkout; automated checks used test fixtures and isolated Store roots; the root agent exercised the public installed CLI against this real project. The owner supplied final acceptance. Automated evidence is not presented as a lived human judgment or a qualified-human UAT run. The A4 section names its distinct isolated-agent environment and limits. The A12 sections describe real installed-project observations. No new evidence folder is required for cases whose test source and shared run already support their conclusions.

The [corrected full-suite capture](./evidence/a12/corrected-build-full-tests.log.txt), [defaults capture](./evidence/a12/corrected-build-defaults.log.txt), and [package byte/tree proof](./evidence/a12/corrected-build-package-proof.json) retain the actual supporting outputs for the accepted implementation. The 1,087-test run supports A1–A3 and A5–A11 through their named suites and the A12 overall regression check. A4 depends on its own retained prompt, transcript and outputs; the real A12 migration depends on the Store operation and independent read-back summarized above. The full-suite log does not substitute for either observation.

The full-suite result is bound to tested tar `8b9d11d9b84d2961285f0e007c097191fcf2cae6411f5adfde6907b353cb6c6e`, not to later untested source changes. The owner subsequently committed six source/installed documentation files in `41fb303` and `dc409fd`. The current rebuilt delivery tar is `66cc68ee68feeb5265c2b75f815dc58bdf4198b82fa333fbd502097231900886`, version `2.0.0-rc`. Its 92 source, build and extracted template files match. Those later commits change documentation only. Focused current-delivery validation passed 50/50 after the two test fixtures were aligned with the new evidence contract. The prior runtime run is not relabeled as a run against this later tar.

The [current-delivery proof](./evidence/a12/current-delivery-package-proof.json) matches all 92 template files and 17 directories across source, build, installed package and tar. Public setup preview reports zero generated, updated or removed files, with only the archived Playbook skipped. Store status is ready with no pending operation. The first closeout defaults run found two test-fixture expectations that did not yet reflect the later evidence-contract commits (48/50). The test owner updated only the consistency and template-link fixture expectations. The final focused defaults run passed all 50 checks in two files with exit code 0. No runtime, template or package bytes changed.

The [first closeout defaults capture](./evidence/a12/current-delivery-defaults-before-fixture-fix.log.txt) retains the 48/50 result. The [final passing tool-output excerpt](./evidence/a12/current-delivery-defaults-tool-output.txt) retains the test owner's reported session `48364`, final chunk `91ad30`, command, test counts and exit code. No redirected raw log was created for the passing run; the excerpt states that limit. The tests were not rerun merely to create a capture.

Retained A12 capture hashes:

| Capture | SHA-256 |
| --- | --- |
| [corrected-build-defaults.log.txt](./evidence/a12/corrected-build-defaults.log.txt) | `3e17956ff4a1f13f075d357b4a39f7aa049a583483a227eec2a0c8cb3f867364` |
| [corrected-build-full-tests.log.txt](./evidence/a12/corrected-build-full-tests.log.txt) | `8e3fddfba3ca323530c82231d082bd2215be2d06beb01f770366b6de94f04c6d` |
| [corrected-build-package-proof.json](./evidence/a12/corrected-build-package-proof.json) | `d8a33b1c321c4cfe8b32f8f3758cc509eea2d4887f65cb618a53cc399e5f506e` |
| [current-delivery-defaults-before-fixture-fix.log.txt](./evidence/a12/current-delivery-defaults-before-fixture-fix.log.txt) | `9c1d6360f25308dff19a742f20f025592db9518d39b13c3a7c24a5a0bf64cab5` |
| [current-delivery-defaults-tool-output.txt](./evidence/a12/current-delivery-defaults-tool-output.txt) | `689db8027b601e21fcfb9995f934911a0b2a56de1ebf548f223bbb1630f781a0` |
| [current-delivery-package-proof.json](./evidence/a12/current-delivery-package-proof.json) | `85d383435e72dc9733cab9478837efc952d85812a80f6201a323c956710d2676` |
