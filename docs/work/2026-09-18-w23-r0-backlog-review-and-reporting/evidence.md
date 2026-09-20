---
title: "W23 R0 Backlog Review and Reporting Evidence"
kind: "work"
status: "active"
coordinate: "W23 R0"
source:
  type: "work"
  path: "00-index.md"
---

# W23 R0 Backlog Review and Reporting Evidence

## Current State

P1, P2, and P3 are complete. The private data contract and rule catalog satisfy A1-A9. The read-only deterministic operation and its CLI and MCP surfaces satisfy A10-A17. The first-party Skill, deterministic-first routing, honest fallback, shared report meaning, and concise chat report satisfy A18-A25. P4 and P5 have not started. The backlog review capability remains incomplete until P5.

The P3 tested base revision was `ceb5cc5` on branch `make-docs-v2`. The P3 test run included the uncommitted P3 product, test, and closeout changes in the local maintainer checkout.

## P1 Data Contract and Rule Catalog

### Claim and Surface

P1 checks that later deterministic and agentic paths can share one stable snapshot contract, report model, diagnostic catalog, and fixture set. It also checks that a future reader can see why a wave received a status or recommendation and can reach its source evidence.

The reviewed surface is private TypeScript contract code and synthetic expected compact chat and HTML models. It is not a public operation or a rendered report.

### Implementation Evidence

| Area | Files | Result |
| --- | --- | --- |
| Snapshot and report schemas | [`schemas.ts`](../../../packages/cli/src/operations/work/backlog/schemas.ts) and [`index.ts`](../../../packages/cli/src/operations/work/backlog/index.ts) | Define the version 1 snapshot and report boundaries, current-frontmatter source shapes, capabilities, counts, evidence, claim classes, statuses, reasons, filters, and sort choices. |
| Rule catalog | [`catalog.ts`](../../../packages/cli/src/operations/work/backlog/catalog.ts) | Defines stable rule, diagnostic, validation, and agent identities with parity mappings and one-sided reasons. |
| Synthetic fixtures | [`backlog-contract.ts`](../../../packages/cli/tests/fixtures/backlog-contract.ts) | Covers the six accepted groups, all fixed statuses, archive scope, source limits, conflicts, links, dates, capabilities, path safety, hostile text, and human error meaning. |
| Focused tests | [`backlog-contract.test.ts`](../../../packages/cli/tests/backlog-contract.test.ts) | Checks A1-A9, catalog integrity, schema behavior, expected report models, filters, sorting, and semantic error expectations. |

### Verification Evidence

| Check | Result | Observation |
| --- | --- | --- |
| Focused P1 suite | Passed: 53 of 53 tests | All six fixture groups and the accepted schema, rule, filter, sort, and error-meaning cases passed. |
| Full CLI suite | Passed: 87 files and 1,401 tests; 1 file and 5 tests skipped | The private contract did not cause a detected CLI regression. |
| Full TypeScript check | Passed | The new schemas, catalog, fixtures, and tests type-check with the CLI package. |
| CLI package build | Passed | The package build accepts the private contract module. |
| Diff check | Passed | `git diff --check` found no whitespace errors. |
| Independent review | Passed with no findings | The review found no acceptance, safety, scope, catalog, schema, or fixture gap. |

### Guided Progress Review

The reviewer inspected the synthetic compact chat and HTML expected models. The models keep recorded facts, inferences, and recommendations separate. Each displayed wave has one fixed status and one flexible reason. Source links remain part of the expected detail. The portfolio tallies retain one meaning across presentation changes.

The review supports changes to wording and display detail without changing snapshot facts. It does not approve a fixed rendered layout. P4 owns visual, responsive, accessibility, and offline HTML proof.

### Human Experience Review

| Promise | Evidence and observation | Conclusion | Reviewer and limit | Next action |
| --- | --- | --- | --- | --- |
| A reader can understand why a wave received a status or recommendation. | The expected compact chat and HTML models pair each fixed status with a flexible reason. The report model keeps facts, inferences, recommendations, and attention findings separate. | `satisfied` for the P1 contract surface. | Codex. Synthetic expected models do not prove a person's lived ease or a final rendered experience. | Preserve this separation in P2-P4. |
| A reader can reach source evidence. | Sourced values, evidence paths, source links, and diagnostics remain explicit in the snapshot and fixture expectations. | `satisfied` for the P1 contract surface. | Codex. No public operation or rendered link interaction exists yet. | Prove collection in P2 and rendered navigation in P4. |
| Partial, unsupported, conflict, and error states keep useful context. | Fixtures retain safe known facts, counts, capability limits, human meaning, and safe next actions without treating diagnostics as report status. | `satisfied` for the P1 contract surface. | Codex. Fixtures prove contract shape and meaning, not every future agent reply. | Keep the semantic error checks in later parity tests. |

Optional human feedback is welcome after a public report surface exists. No human acceptance gate applies to P1.

### Coverage Decisions

| Surface | Verdict | Reason |
| --- | --- | --- |
| Guide and system resources | `none` | P1 is a private contract. P3 owns shipped Skill instructions and agent use guidance. |
| PRD reconciliation | `none` | The implementation matches [PRD 51](../../prd/51-backlog-review-and-reporting.md). |
| History | `create` | The [P1 history record](../../../.make-docs/archive/history/2026-09-19-w23-r0-p1-data-contract-and-rule-catalog.md) supplies the phase breadcrumb. |
| Automated Implementation Testing | Required and passed | Focused, full-suite, type, build, and diff checks passed. |
| Performance Testing | `not-needed-now` | P1 defines private data shapes and fixtures. It makes no latency, throughput, or resource claim. |
| Guided Progress Review | Required and passed | The synthetic compact chat and HTML expected models were reviewed. |
| Unassisted Goal Testing | `not-needed-now` | P1 does not expose a discoverable user path. |
| Accessibility and visual review | `none` for P1 | P4 owns the rendered HTML surface and its accessibility and visual proof. |
| Human Experience Review | `satisfied` within limits | The contract preserves status reasons, source evidence, honest uncertainty, and safe next actions. It does not prove a lived human reaction. |

### Phase Boundary

P1 closed on this evidence. P2 is now complete. The full backlog review capability remains incomplete until P5.

## P2 Deterministic Snapshot Operation

### Claim and Surface

P2 checks that Make Docs can read every live and archived work record through one Store-free operation. It checks that supported current-frontmatter records receive full semantic parsing. It keeps no-frontmatter records in inventory without interpreting legacy body conventions.

The public surfaces are `work.backlog.snapshot`, `make-docs run work backlog snapshot --target-root <project> [--json]`, and the registry-derived `make_docs_work_backlog_snapshot` MCP tool. Private collectors have no public operation identity.

### Preflight Evidence

| Check | Result | Observation |
| --- | --- | --- |
| W22 shared boundary | Passed | W22 R0 P6 closeout commit `edd9d7e4` is an ancestor of the P2 base revision. |
| Current authority | Passed | PRD 38 and PRD 39 were reread with PRD 25 and PRD 51 before shared-surface changes. |
| Access boundary | Passed | The operation declares project-read, Store-none, and host-configuration-none access. |
| Existing shared-surface tests | Passed: 6 files and 74 tests | Registry, access, CLI, MCP, and organization tests passed before P2 implementation. |

### Implementation Evidence

| Area | Files | Result |
| --- | --- | --- |
| Snapshot collector | [`snapshot.ts`](../../../packages/cli/src/operations/work/backlog/snapshot.ts) | Adds safe root and record discovery, current-frontmatter and unsupported readers, linked-phase parsing, task and relationship facts, source links, Git evidence, date fallbacks, duplicate diagnostics, and final schema validation. |
| Public operation | [`operation.ts`](../../../packages/cli/src/operations/work/backlog/operation.ts), [`registry.ts`](../../../packages/cli/src/operations/registry.ts), and [`ops/index.ts`](../../../packages/cli/src/operations/work/ops/index.ts) | Registers one read-only Store-free operation through the shared registry. |
| CLI and MCP surfaces | [`cli.ts`](../../../packages/cli/src/run/cli.ts), [`render.ts`](../../../packages/cli/src/run/render.ts), and registry-derived MCP code | Adds the required target-root CLI input, count-first human text, JSON output, and the derived MCP tool without transport-owned backlog logic. |
| Tests | [`backlog-snapshot.test.ts`](../../../packages/cli/tests/backlog-snapshot.test.ts) and shared registry, CLI, and MCP contract tests | Covers supported, partial, unsupported, conflict, path-safety, no-write, date-source, failure, parity, and one-public-operation cases. |

### Verification Evidence

| Check | Result | Observation |
| --- | --- | --- |
| Focused P2 and shared-surface suite | Passed: 8 files and 87 tests | Operation, registry, CLI, MCP, domain, organization, and package-boundary checks passed. |
| Full CLI suite | Passed: 88 files and 1,417 tests; 1 file and 5 tests skipped | No detected CLI regression remains. The skipped installed-upgrade matrix retains its existing gate. |
| Full TypeScript check | Passed | The operation, collectors, CLI adapter, renderer, and tests type-check. |
| CLI package build | Passed | The built package includes the new operation and surface adapters. |
| Diff check | Passed | `git diff --check` found no whitespace errors. |
| Real maintainer repository | Passed | The built CLI found 70 records: 46 live and 24 archived. It read 22 supported records, retained 48 inventory-only records, interpreted 88 phases and 1,504 tasks, did not use the Store, and kept Git available. |

### Human Experience Review

| Promise | Evidence and observation | Conclusion | Reviewer and limit | Next action |
| --- | --- | --- | --- | --- |
| A reviewer receives useful status before machine detail. | Human CLI output starts with all-record, live, and archived counts. It then states supported, partial, and inventory-only detail. | `satisfied` for the P2 CLI surface. | Codex. This is an agent review of emitted text, not a person's lived response. | Preserve count-first meaning in P3 and P4. |
| A reviewer can understand limits and reach exact evidence. | Human output states Git limits when present. It directs the reviewer to JSON for exact evidence and safe next actions. JSON and MCP retain diagnostics, evidence paths, raw values, and capability states. | `satisfied` for the P2 CLI, JSON, and MCP surfaces. | Codex. P2 does not prove the final chat or HTML report experience. | Prove normal-use report meaning in P3-P5. |
| Repository facts remain useful without Store access. | The real repository run kept Store at `not-used`. Tests retain repository facts for unavailable, denied, and non-repository Git cases. | `satisfied` within P2 scope. | Codex. Optional future enrichment is outside P2. | Keep Store optional in later phases. |

Optional human feedback remains welcome. No human acceptance gate applies to P2.

### Coverage Decisions

| Surface | Verdict | Reason |
| --- | --- | --- |
| Guide and system resources | `none` | P3 owns the shipped Skill and agent guidance. |
| PRD reconciliation | `none` | The operation matches PRD 51 and the shared PRD 25, PRD 38, and PRD 39 boundaries. |
| History | `create` | The [P2 history record](../../../.make-docs/archive/history/2026-09-20-w23-r0-p2-deterministic-snapshot-operation.md) supplies the phase breadcrumb. |
| Automated Implementation Testing | Required and passed | Preflight, focused, full-suite, type, build, real-repository, and diff checks passed. |
| Performance Testing | `not-needed-now` | P2 has no accepted latency, throughput, or resource target. |
| Guided Progress Review | `not-needed-now` | P3 and P4 own chat and HTML presentation review. |
| Unassisted Goal Testing | `not-needed-now` | P2 exposes a machine contract and supporting CLI result, not the final normal-use review flow. |
| Human Experience Review | `satisfied` within limits | The CLI leads with status, states limits, and points to exact structured evidence. |

### Phase Boundary

P2 can close on this evidence. P3 has not started. P2 adds no Skill, agent inference, recommendation, chat report, HTML report, Store integration, setup behavior, package publication, or release. The full backlog review capability remains incomplete until P5.

## P3 Skill and Chat Report

### Claim and Surface

P3 adds the optional first-party `backlog-review` Skill. It uses the compatible MCP snapshot first, the JSON CLI snapshot second, and a portable agentic fallback only when neither deterministic surface is available. It reports the method that supplied the facts. It does not cross-certify another method.

The Skill preserves the version 1 report model. It keeps all records, the four fixed tallies, the six fixed live statuses, archived null status, flexible evidence-backed reasons, distinct facts, inferences, recommendations, confidence, limits, attention findings, and recommended order. Its default chat pattern leads with current focus, Next, and needs attention.

### Implementation Evidence

| Area | Files | Result |
| --- | --- | --- |
| Skill source | [`packages/skills/backlog-review/`](../../../packages/skills/backlog-review/) | Adds the portable entrypoint, OpenAI metadata, deterministic-first method, report model, fallback, stable rule map, four chat-size patterns, and human error meaning. |
| Catalog and package | [`skill-registry.json`](../../../packages/cli/skill-registry.json), [`skill-registry.ts`](../../../packages/cli/src/skill-registry.ts), and [`smoke-pack.mjs`](../../../scripts/smoke-pack.mjs) | Adds the eighth optional first-party Skill, declares every support file, keeps the fixed purpose list, and extends packed-package checks. |
| Product authority | [PRD 08](../../prd/08-skills-catalog-and-distribution.md) | Records the eight-Skill catalog and the packaged `backlog-review` contract. |
| Tests | [`backlog-review-skill.test.ts`](../../../packages/cli/tests/backlog-review-skill.test.ts) and existing catalog, setup, wizard, and Skill lifecycle suites | Checks support-file completeness, local links, metadata, rule parity, report fixtures, status and tally meaning, error meaning, chat scales, selection, installation, backup, and removal. |

### Verification Evidence

| Check | Result | Observation |
| --- | --- | --- |
| Focused P3 and shared Skill suite | Passed: 13 files and 290 tests | The Skill, report contract, registry, embedded payload, CLI selection, wizard, and Skills UI checks passed. |
| Full CLI suite | Passed: 89 files and 1,423 tests; 1 file and 5 tests skipped | No detected CLI or Skill lifecycle regression remains. The skipped installed-upgrade matrix retains its existing gate. |
| Full TypeScript check | Passed | The changed registry and all package tests type-check. |
| CLI package build | Passed | The package build embeds the eighth Skill and all declared files. |
| Skill validator | Passed | The Skill entrypoint and metadata satisfy the local Skill validator. |
| Local packed-package smoke | Passed | A packed package installed, backed up, and removed all eight Skills. The extracted `backlog-review` payload retained every declared file without checkout-only dependencies. |
| Full remote-runner smoke | Not run in this test area | The public npm registry was not reachable. The check stopped before package testing and directed the run to local mode. P5 still owns final installed candidate and runner parity. |
| Diff check | Passed | `git diff --check` found no whitespace errors. |

### Guided Progress Review

The reviewer inspected and revised the small, medium, large, and conflict-heavy chat patterns.

| Portfolio | Observation | Revision or conclusion |
| --- | --- | --- |
| Small | One current item and one next action fit without empty attention or state sections. | Keep the full four tallies, method, fact, inference, confidence, and limit. Omit empty sections. |
| Medium | Current, conflict, and deferred records need visible order without turning the report into a task dump. | Show Current focus, Next, Needs attention, and only nonempty state groups. Keep one reason and one source link per displayed wave. |
| Large | Full-portfolio meaning must remain clear while the first view stays short. | Keep all records in the report model. Show only decision-relevant records first. State the method, inventory-only count, and expansion path. |
| Conflict-heavy | A status disagreement must appear before a later-work recommendation. | Lead with the conflict in normal words. Keep recorded facts separate. State what the review cannot decide and whether human action is required. |

This review supports presentation changes without changing status, tally, evidence, or method meaning. It does not approve the P4 HTML layout.

### Human Experience Review

| Promise | Evidence and observation | Conclusion | Reviewer and limit | Next action |
| --- | --- | --- | --- | --- |
| A maintainer sees current focus and next work before machine detail. | The Skill and all complete chat patterns place the method and tallies first, then Current focus, Next, and Needs attention. Empty sections are omitted. | `satisfied` for the P3 chat guidance. | Codex. This is an agent review of instructions and examples, not a person's lived response. | Preserve this order in P4. |
| A maintainer can tell fact from agent judgment. | The review method defines fact, inference, and recommendation claims. Inferences include confidence and limits. Status reason stays separate from fixed status. | `satisfied` for P3 guidance and shared contract. | Codex. Future agent output can still vary in wording. | Keep semantic tests and review generated reports in P5. |
| Errors and limits keep human context. | The Skill requires subject, context, effect, known and unknown facts, next action, and human action level. Structured examples keep raw codes secondary without changing severity. | `satisfied` for the instructed meaning. | Codex. Two semantic examples do not prove every future error explanation. | Add new semantic fixtures when new material errors appear. |
| Exact evidence remains reachable. | Every displayed wave uses a repository-relative source link. The full report keeps every snapshot record and source evidence. | `satisfied` for P3 chat guidance. | Codex. P4 and P5 still own rendered link and installed-candidate proof. | Verify HTML navigation in P4 and installed parity in P5. |

Optional owner feedback remains welcome. No human acceptance gate applies to P3.

### Coverage Decisions

| Surface | Verdict | Reason |
| --- | --- | --- |
| Guide and system resources | `none` | The shipped optional Skill owns the P3 agent guidance. P3 adds no system resource or project guide. |
| PRD reconciliation | `update` | PRD 08 now records the eighth first-party Skill and its bundled portable boundary. PRD 51 already contains the accepted report and Skill contract. |
| History | `create` | The [P3 history record](../../../.make-docs/archive/history/2026-09-20-w23-r0-p3-skill-and-chat-report.md) supplies the phase breadcrumb. |
| Automated Implementation Testing | Required and passed | Focused, full-suite, type, build, Skill validation, local packed-package, and diff checks passed. |
| Performance Testing | `not-needed-now` | P3 has no accepted latency, throughput, or resource target. |
| Guided Progress Review | Required and passed | Small, medium, large, and conflict-heavy chat patterns were reviewed and revised. |
| Unassisted Goal Testing | `not-needed-now` | Guided iteration remains the accepted P3 evidence path. No separate discoverability gate exists. |
| Accessibility and visual review | `none` for P3 | P4 owns the HTML surface and its keyboard, responsive, contrast, and visual checks. |
| Human Experience Review | `satisfied` within limits | The Skill leads with human meaning, separates judgment, states limits, and keeps exact evidence available. |

### Phase Boundary

P3 closes on this evidence. P4 has not started and needs separate owner authority. P3 adds no HTML report, Store integration, package publication, or release. The full backlog review capability remains incomplete until P5.
