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

P1 and P2 are complete. The private data contract and rule catalog satisfy A1-A9. The read-only deterministic operation and its CLI and MCP surfaces satisfy A10-A17. P3 and the report phases have not started. The backlog review capability remains incomplete until P5.

The P2 tested base revision was `9e080b9b` on branch `make-docs-v2`. The P2 test run included the uncommitted P2 product and test changes in the local maintainer checkout.

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
