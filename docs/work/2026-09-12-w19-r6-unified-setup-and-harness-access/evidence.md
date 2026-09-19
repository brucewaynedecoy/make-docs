# W19 R6 Unified Setup and Harness Access Evidence

## Current Result

P2 is superseded. Its obsolete Playbooks conformance authority does not define the current acceptance target.

P3 implementation is authorized. The authority reset and production implementation are complete. Static Codex and Claude Code adapters replace the invalid tuple gate.

Installed package smoke and the automated setup matrix pass. Live Codex MCP, Codex command-rule, and Claude Code MCP read and write calls pass.

The user authorized the live Claude checks. Claude permission rules failed their live command check and stay blocked under the accepted A35 exception. The agent-owned Human Experience Review records `satisfied` for all six promises.

All ten P3 hard close rules pass. P3, W19 R6, and D-033 are closed.

## P3 Authority Correction

- The current product needs built-in adapters for known installed harnesses.
- It does not need dynamic capability discovery or result promotion.
- PRDs 20, 43, and 44 came from the removed Playbooks system.
- P2 made those PRDs production setup authority.
- The tuple, registry, scenario, provider, model, runtime, and harness-result assertions came from that authority.
- Those assertions were valid tests of P2. They were not valid requirements for the current product.
- P3 removed the invalid authority before it completed production code and acceptance-test changes.
- The [P3 design](../../designs/2026-09-14-static-harness-adapters-and-conformance-retirement.md), [plan](../../plans/2026-09-12-w19-r6-unified-setup-and-harness-access/03-static-harness-adapters-and-conformance-retirement.md), and [work phase](03-static-harness-adapters-and-conformance-retirement.md) define the correction.

## Production Implementation

P3 production implementation is complete.

| Area | Current evidence | Result |
| --- | --- | --- |
| Support authority | Product-owned static adapters declare the Codex and Claude Code methods. Production setup has no dynamic support registry or tuple gate. | Passed. |
| Method set | Codex declares MCP and narrow command rules. Claude Code declares MCP. Claude Code permission rules stay blocked. | Passed. |
| Unified setup | Interactive, machine-only, dry-run, non-interactive, JSON, and MCP-safe projections use one setup service. | Passed. |
| Project intent | The YAML document writer changes only reviewed `harnessIntegrations` values. It preserves comments, order, quoting, unknown keys, and unrelated values. | Passed. |
| Native safety | MCP keeps its environment caller identity. Codex rules use an exact executable and a hidden caller argument. Claude rule code uses an exact executable and a compact caller reference. Rule routes need a harness-proved launch fact. Store-free reads do not open a Store session. | Codex passed live. Claude permission rules failed live and stay blocked. |
| Repeat and recovery | Fresh, current, partial, no-method, unsupported, drifted, blocked, failed, recovered, and repeat cases pass. | Passed. |
| Retired paths | Production and package paths contain no dynamic result promotion or conformance bootstrap dependency. | Passed. |

The full suite passes with 80 test files and 1,259 tests. The Stage 2 tasks and acceptance items pass.

## Packed Candidate Identity

| Fact | Value |
| --- | --- |
| Make Docs version | `2.0.0-rc` |
| Distribution | packed npm tarball in a disposable directory |
| Installed package smoke | Passed. |
| Automated setup matrix | Fresh, current, partial, no-method, unsupported, drifted, blocked, failed, recovered, and repeat cases passed. |
| Selected-method repeats | Codex MCP, Codex command rules, and Claude Code MCP each returned `current` with no write. |

No package was installed into the real user home.

## Real-Harness Results

| Harness path | Current result | Evidence and limit |
| --- | --- | --- |
| Codex MCP | Passed | The disposable native MCP configuration is recognized by the Codex CLI. Live project-state read and archive-surface write calls pass. Setup repeat returned `current` with no write. |
| Codex command rules | Passed | The no-rule control cannot create the external Store lock. The rule-enabled Codex task reads project state as `ready` and creates only `.make-docs/archive/AGENTS.md`. It uses terminal commands only. The isolated Codex config has no Make Docs MCP entry. Setup repeat returned `current` with no write. |
| Claude Code MCP | Passed | Claude Code 2.1.258 exposed the Make Docs MCP tools. Live project-state read and archive-surface write calls passed. Setup repeat returned `current` with no write. |
| Claude Code permission rules | Failed and blocked | The no-rule control denied the Make Docs Store command. The rule task exposed only Bash, Edit, and Read. It exposed no MCP server. A natural request chose `make-docs` from `PATH`, so no generated rule matched. A supplied full command was cut inside the caller reference before the operation name. Claude denied both partial commands in `dontAsk` mode. No Store read or archive write ran. |

These checks used disposable projects, machine roots, settings files, and Stores. Claude Code kept the real `HOME`. It used `ANTHROPIC_API_KEY`. No credential file or Keychain access was used.

## Codex Command-Rule Correction

The first live command-rule test failed. The generated rule started with `/usr/bin/env` and an environment assignment. Codex ran the Make Docs command through `zsh -lc`. The assignment stopped safe shell splitting. Codex checked the wrapper instead of the Make Docs command.

The corrected Codex rule starts with the verified executable. It then uses `--make-docs-harness-caller`, one base64url identity value, and the exact operation prefix. The public help does not show this internal option. MCP keeps the environment form.

The corrected live test used a packed package, a disposable project, an isolated Codex home, and a Store outside the child Codex workspace. It installed only Codex command rules. The control used `--ignore-rules` and failed with `store-unavailable` and `EPERM`. The rule-enabled read returned project state `ready`. The rule-enabled write created the archive surface. The root `AGENTS.md` SHA-256 stayed `11da6f811a9af64341e93289f3391d5f085b66d2bcc092c5f932c003db8a6c45`.

The Store has one completed setup operation and one completed `project.surface.ensure` operation. It has only the three expected setup-system receipt rows. A repeat setup reported the Codex method as `current`. Its computer and project mutation states were `none`.

`codex execpolicy check` allows the exact direct token list. It has no match for a missing or changed identity, another executable, setup, update, uninstall, or a command joined to unrelated work. The checker also has no direct match for the raw `zsh -lc` wrapper. The live Codex runs prove that the real shell path splits and applies the inner rule.

## Claude Code Permission-Rule Correction

The prior Claude rule used `/usr/bin/env` and raw identity JSON. The correction adds `--make-docs-harness-caller-ref`. The reference contains the Claude method, adapter version, canonical machine root, and the full identity digest. The CLI accepts it only before the public command. It rejects missing, repeated, malformed, misplaced, or conflicting values. Runtime policy rebuilds the identity and checks the executable, Store receipt, native rule, and project access limit.

The generated Claude rules contain the exact executable, hidden reference, and one registry operation prefix. They contain no raw JSON, environment assignment, `/usr/bin/env`, MCP command, package runner, or shell wrapper. Receipt-aware repair can replace only exact old rules that the Store receipt owns. It preserves other settings and rule order.

The live check used `/tmp/make-docs-claude-ref-live.vSObpD`. Make Docs setup wrote 22 permission rules and no MCP entry. The settings hash stayed `15e4f5c4b93e22bc9bb829339e88addc761b54fc05f7732c03eb60a1aedc995e`. The no-rule control denied the Store command. The rule task had no MCP server. It used Bash only for command attempts.

The natural request tried `which make-docs`, `make-docs --help`, and `make-docs resource list`. Claude denied them because they did not match the exact rule. The supplied exact command also failed. Claude cut it inside the long reference before the operation name. The permission check saw only that partial command and denied it.

The Store has one completed setup operation. It has three setup tool records. It has no project-surface operation. The sentinel hash stayed `31a2e1adc45d86aac3853a51a9c33b03d3b0d6228599fde070de6e63f07f22b0`. No archive surface was created. This result meets the stop rule. The static method stays blocked.

## A35 Decision

A35 is the specific exception to the general missing-method close rule. Claude Code permission rules can remain unavailable when narrow Store access cannot pass. The current blocked state meets that exception.

The failed live rule check does not affect the passed Claude Code MCP result.

## Final Automated Checks

| Check | Result |
| --- | --- |
| Focused W19 R6 checks | 4 files and 66 tests passed. |
| Focused W20 R2 Human Experience checks | 2 files and 57 tests passed. |
| `npm test -w packages/cli -- --reporter=dot` | 80 files and 1,264 tests passed. |
| `./node_modules/.bin/tsc -p packages/cli/tsconfig.json --noEmit` | Passed. |
| Installed package smoke | Passed. |
| `npm run validate:defaults` | 53 checks passed. |
| `node packages/cli/dist/index.js run prd authority validate --target-root .` | Passed with 36 PRD files, 567 Markdown files, 196 structured files, 1,091 links, and no diagnostics. |
| Changed-file path-hygiene validator | Passed with exit 0 against 96 existing changed or untracked paths. It checked 65 content files and reported zero failing findings, zero I/O errors, and zero changed files. |
| Resource parity | Eight changed resources match byte-for-byte across upstream, package, and dogfood copies. |
| `bash scripts/check-instruction-routers.sh` and `bash scripts/check-wave-numbering.sh` | Passed. |
| `git diff --check` | Passed. |

The full suite includes the W19 R3 shared Store gate, contention, pending-operation, receipt, checkout-writer, and recovery checks. It also covers the setup method flags, exact screen order, explicit `none`, dry-run and JSON parity, config preservation, repeat states, and Store-free reads with absent or unsafe Store state.

## Closeout Result

- The agent-owned six-promise Human Experience Review is complete.
- All ten hard close rules pass.
- P3, W19 R6, and D-033 are closed.
- Staging, commit, publication, release, and real-home installation remain outside this work.

## Future Follow-Up

- A future design can test a shorter safe Claude Code permission-rule carrier. This is not a P3 close blocker. P3 permits this method to remain unavailable when narrow Store access cannot pass.

## Human Experience Review

Status: `satisfied`.

| Promise | Evidence | Observation | Conclusion | Reviewer | Reviewer limit | Disposition |
| --- | --- | --- | --- | --- | --- | --- |
| Setup finds known installed harnesses without tuple questions. | Static detection tests, installed setup transcript, and setup matrix. | The installed flow detects known harnesses and does not ask for scenario, provider, model, runtime, or tuple facts. | `satisfied` | Implementation agent | Review uses recorded terminal and test evidence. It does not claim a lived human reaction. | Accept the no-tuple setup claim. |
| Setup shows only product-owned safe methods and their effects. | Static adapter declarations, grouped review tests, real native files, and the blocked Claude permission-rule result. | Setup shows declared methods and their file effects. It does not show the failed Claude permission-rule method as available. | `satisfied` | Implementation agent | The review covers the current Codex and Claude Code versions in the evidence. | Accept only the declared current method set. |
| MCP works for Codex and Claude Code with caller identity. | Disposable Codex and Claude Code MCP reads and writes plus no-write repeats. | Both MCP paths expose the expected tools and complete the bounded Store read and write. | `satisfied` | Implementation agent | The runs use disposable homes and projects. They do not prove all future harness versions. | Accept the tested MCP paths. |
| Codex rules grant only the named narrow operations. | No-rule control, rule-enabled read and write, terminal-only trace, and execpolicy rejection matrix. | The control cannot reach the external Store. The allowed operations pass. Wider direct commands do not match. | `satisfied` | Implementation agent | The live shell path and direct token checks cover the tested Codex version. | Accept the tested narrow-rule claim. |
| Project and user-owned native config stay intact across apply, repeat, drift, and recovery. | YAML preservation tests, native file hashes, setup matrix, receipts, and three no-write repeats. | Reviewed Make Docs entries change without loss of unrelated content or a repeat-write loop. | `satisfied` | Implementation agent | The evidence covers the recorded fixtures and disposable native files. | Accept the preservation and idempotence claim. |
| Resource reads work without Store or special harness access. | Installed resource list and read, Store-absent, locked, unreadable, unsafe, and no-session tests. | Resource reads return installed provider data without opening a Store session or needing caller identity. | `satisfied` | Implementation agent | The review covers the shipped resource provider and tested failure states. | Accept the Store-free resource-read claim. |

No explicit human acceptance gate applies. Optional later feedback can create a finding. A material defect can reopen or narrow only the affected claim.

## Phase State

P1 is superseded and remains an incomplete acceptance record. P2 is superseded because it used invalid retained Playbooks authority. P3 is complete. The authority reset, production implementation, installed harness acceptance, and agent-owned Human Experience Review pass. P3, W19 R6, and D-033 are closed.

No files were staged or committed. No package was installed into the real user home. Nothing was published or released.
