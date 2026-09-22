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

P1 through P5 are complete. Owner review of the first real 70-record report found deterministic-name, attention-icon, expanded-detail, evidence-display, and project-lead regressions. P4 corrected those defects. P5 added exact optional review reuse and lazy access to the normalized report data. The owner accepted the bounded three-entry cache-size limit and the Store-free fallback explanation on 2026-09-22. P6 has not started. The backlog review capability remains incomplete until P6.

The P4 tested base revision was `a976404` on branch `make-docs-v2`. This revision contains the committed P3 closeout. The P4 checks included the uncommitted P4 product, test, and closeout changes in the local maintainer checkout.

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

P1 closed on this evidence. P2 is now complete. After the accepted phase insertion, the full backlog review capability remains incomplete until P6.

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
| A reviewer can understand limits and reach exact evidence. | Human output states Git limits when present. It directs the reviewer to JSON for exact evidence and safe next actions. JSON and MCP retain diagnostics, evidence paths, raw values, and capability states. | `satisfied` for the P2 CLI, JSON, and MCP surfaces. | Codex. P2 does not prove the final chat or HTML report experience. | Prove normal-use report meaning in P3-P6. |
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

P2 can close on this evidence. P3 had not started at P2 closeout. P2 adds no Skill, agent inference, recommendation, chat report, HTML report, Store integration, setup behavior, package publication, or release. After the accepted phase insertion, the full backlog review capability remains incomplete until P6.

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
| Full remote-runner smoke | Not run in this test area | The public npm registry was not reachable. The check stopped before package testing and directed the run to local mode. P6 owns final installed candidate and runner parity. |
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
| A maintainer can tell fact from agent judgment. | The review method defines fact, inference, and recommendation claims. Inferences include confidence and limits. Status reason stays separate from fixed status. | `satisfied` for P3 guidance and shared contract. | Codex. Future agent output can still vary in wording. | Keep semantic tests and review generated reports in P6. |
| Errors and limits keep human context. | The Skill requires subject, context, effect, known and unknown facts, next action, and human action level. Structured examples keep raw codes secondary without changing severity. | `satisfied` for the instructed meaning. | Codex. Two semantic examples do not prove every future error explanation. | Add new semantic fixtures when new material errors appear. |
| Exact evidence remains reachable. | Every displayed wave uses a repository-relative source link. The full report keeps every snapshot record and source evidence. | `satisfied` for P3 chat guidance. | Codex. P4 and P6 still own rendered link and installed-candidate proof. | Verify HTML navigation in P4 and installed parity in P6. |

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

P3 closed on this evidence. At that boundary, P4 had not started and needed separate owner authority. P3 added no HTML report, Store integration, package publication, or release. After the accepted phase insertion, the full backlog review capability remains incomplete until P6.

## P4 Single-File Interactive Report

### Claim and Surface

P4 adds the optional saved HTML report to the first-party `backlog-review` Skill. One file contains the full report, CSS, JavaScript, icons, and safely embedded report data. It works without Store access, remote assets, or network requests.

The report keeps the accepted operations-ledger layout. It shows fixed portfolio tallies, the attention queue, all live and archived waves, phase tracks, fixed wave status colors, exact status filters, search, three two-way sort methods, hybrid whole-row disclosure, independent source links, light and dark themes, and print output.

### Implementation Evidence

- `packages/skills/backlog-review/assets/backlog-review-report.html` contains the offline report shell and all interaction code.
- `packages/skills/backlog-review/scripts/render-report.mjs` validates the shared report model, safely serializes project text, refuses accidental overwrite, and writes one selected `.html` file.
- `packages/skills/backlog-review/scripts/collect-project-lead-context.mjs` selects bounded project-purpose and current-objective excerpts through a fixed source order and returns paths, headings, lines, and content hashes.
- `packages/skills/backlog-review/references/html-report.md` tells the agent how to make and verify the optional report without hidden copies.
- `packages/skills/backlog-review/SKILL.md` routes the optional HTML request to that guide.
- `packages/cli/skill-registry.json` packages the template, renderer, and guide with the Skill.
- `packages/cli/tests/backlog-review-skill.test.ts` verifies packaging, offline policy, inert hostile text, single-file output, and overwrite refusal.
- The corrected template derives display names from sourced coordinates and titles, restores the fixed three-column detail, keeps evidence in embedded data instead of visible link dumps, fixes the attention-icon stroke, and removes the obsolete evidence-boundary copy.
- The shared template now contains the owner-approved fixed-report palette. Dark mode uses `#111111` paper, neutral panels, and `#484850` strong rules. The title and headings continue to use `--ink`. The two project links use the retained `--accent` token. The migration does not change spacing, layout, or the light-mode base palette.
- The Skill guidance now fixes the renderer-owned layout and title rules. It also limits status reasons to compact text and defines the deterministic attention-icon mapping.
- The shared report schema now carries a nullable role-ordered project lead. Each sentence cites supplied context for its own purpose, current-status, or current-objective role. The template displays the normalized sentences or hides the lead. It no longer writes record totals or filter instructions into that space.

### Verification Evidence

- Focused package checks passed: 7 files and 196 tests.
- TypeScript checking, the CLI build, Skill validation, local packed-package smoke, and `git diff --check` passed.
- The renderer accepted complete, reduced, empty, and conflict-heavy reports. It rejected an overwrite without `--force`.
- Browser checks found no external resource request and no console warning or error in a fresh session.
- The default view showed 5 of 7 records with `In Scope`, `Last updated`, and `Newest first` selected.
- Exact status filtering, search plus filter behavior, all three sort methods in both directions, and coordinate and path tie order passed.
- Empty non-aggregate status filters were hidden. `In Scope` and `All` remained available for an empty report.
- The wave-name link did not expand the row. Pointer and keyboard actions on the summary row did expand and close it.
- Print media kept the active filter, showed one filtered wave with its full detail, and hid interactive controls.
- Reduced-motion media removed transitions and smooth scrolling.
- Desktop and 480-pixel screenshots were inspected in light and dark modes. No critical text was clipped. The 480-pixel page had no horizontal overflow.
- Owner review of the first real 70-record report found regressions that the synthetic browser checks did not find. Those earlier checks no longer close P4.
- The project-lead correction passed 62 focused contract and Skill tests. TypeScript checking and the CLI package build passed. The full CLI suite passed 1,427 tests with five expected skips.
- After the owner's final status-badge border refinement, the full CLI suite again passed 1,427 tests with five expected skips. TypeScript checking and the CLI package build also passed.
- Final closeout checks passed 53 default-consistency, template-link, and package-safety tests. `git diff --check` also passed.
- The corrected renderer accepted the retained 70-record report data after adding context from the product overview and W23 work index. After the style migration, it wrote `/private/tmp/make-docs-backlog-report-p4-project-lead.html`, 4,547,835 bytes, with SHA-256 `c045310130ea24feb84c3abe908a65f114d167824ebc3640162b2710ce84261e`. Static inspection found the two source-backed project sentences and no prior `Review of 70 work records` fallback.
- The fixed report and the shared template have byte-for-byte equal style blocks. The style migration kept the embedded report-data hash unchanged. Eight focused backlog-review Skill tests passed, including the light and dark theme token checks.
- A fresh automated visual check could not run in this session. The terminal browser package was not cached and network access was unavailable. The built-in browser also blocks local `/private/tmp` file URLs. Owner review of the corrected output remains required.
- Performance isolation found that the deterministic 70-record snapshot took 1.191 seconds and returned 5,777,895 bytes. Rendering took 0.080 seconds. The 4,503,721-byte reviewed report model contained 5,278 report-layer evidence references. The owner accepted this evidence as the basis for P5 exact per-record review reuse, not a project-local cache or a required two-file report.

### Guided Progress Review

The owner reviewed the report prototype and real generated reports through several focused annotation rounds. Those rounds fixed the sidebar, tally meanings, filter names and colors, sort controls, dark theme, attention icons, whole-row disclosure, print control, responsive spacing, deterministic wave names, expanded detail, evidence display, and the source-backed project lead. The owner's gaps and padding stayed unchanged.

The owner reviewed the corrected real-report output. The owner then said P4 was ready to close on 2026-09-21. This completed the explicit human acceptance gate for the P4 correction. The owner's direct review applies to this maintainer and this report. It does not prove universal usability.

### Human Experience Review

| Promise | Evidence and observation | Conclusion | Reviewer and limit | Next action |
| --- | --- | --- | --- | --- |
| A maintainer can understand the project before reading report detail. | Owner review found that the fixed lead repeated backlog counts and filter instructions. The correction collects bounded purpose and current-objective context, validates two or three role-ordered source-backed sentences, and removes renderer fallback prose. The owner reviewed the new introduction and accepted P4. | `satisfied` for the reviewed report. | The owner reviewed one real report for this project. This does not prove every future project summary. | Keep the source-backed lead contract and recheck the installed candidate in P6. |
| A maintainer can scan current focus without losing the full portfolio. | The correction restored deterministic wave names, visible attention icons, the accepted detail panel, bounded evidence display, and the final approved styles. The owner reviewed the corrected report and accepted P4. | `satisfied` for the reviewed report. | The owner reviewed this project and dataset. Other portfolio shapes can expose new issues. | Repeat the installed-candidate review in P6. |
| A maintainer can use the report on a narrow screen. | At 480 pixels, the same content stacked in a useful order. No horizontal overflow or clipped critical text appeared. | `satisfied` for the tested viewport. | Codex. Device and assistive-technology coverage is not exhaustive. | Repeat installed-candidate checks in P6. |
| A maintainer can tell status from status reason and can reach the source. | The correction keeps fixed status colors, short reasons, independent wave links, and visible deterministic severity icons. The owner removed the badge borders as a final small refinement and accepted P4. | `satisfied` for the reviewed report. | This review did not include full assistive-technology coverage. | Repeat installed accessibility and source-link checks in P6. |
| The report remains usable without sighted pointer-only interaction. | Controls have accessible names and state. Row disclosure works by pointer and keyboard. Visible focus, reduced motion, print detail, and non-color text cues are present. | `satisfied` within browser automation limits. | Codex. This is not a full screen-reader or high-zoom human session. | Keep optional owner feedback open and run final package review in P6. |
| The saved file stays private and offline. | The content policy blocks remote sources. The browser loaded no resource request. Project text was inserted as inert text. | `satisfied` for the generated single file. | Codex. Browser checks used local synthetic data. | Repeat from the installed Skill in P6. |

### Coverage Decisions

- Automated Testing: `required` and passed.
- Performance Testing: `not-needed-now` for P4. P5 owns the accepted bounded repeat-review characterization. P6 retains installed-candidate size and use checks.
- Guided Progress Review: `required` and passed after correction and owner review of the real report.
- Unassisted Goal Testing: `not-needed-now`. The Skill and report remain maintainer-led.
- Human Experience Review: `satisfied` within the owner-reviewed P4 report. P6 still owns installed-candidate review.
- Explicit human acceptance gate: satisfied by the owner's P4 closeout direction on 2026-09-21.

### Phase Boundary

P4 is complete. P5 started after separate owner authority. P6 has not started. P5 owns the accepted cache, data-access, and repeat-review characterization work. P6 owns installed-package parity, installed Skill rendering, final browser and offline checks, and capability acceptance. P4 does not publish or release the package.

## P5 Incremental Review Cache and Data Access

### Current Claim and Surface

P5 is complete. It adds an optional, rebuildable, exact-match backlog-review cache to Global Store schema 6. It also adds the accepted lookup and write operations through the shared registry. Every Skill review still starts with the Store-free current snapshot. Cache loss, refusal, rejection, or mismatch routes the review to fresh per-record work.

The saved report remains one offline HTML file. Wide screens retain the `Next` and `Attention` sidebar. Small screens stack those sections above the visible `Backlog` heading. The Backlog section has `Work` and `Data` tabs. Work keeps search, filters, sorting, open rows, and the phase legend. Data contains the complete normalized model and a user-started JSON download. Switching tabs does not rebuild or clear Work state. Search, filters, sorting, and open rows do not change the viewed or downloaded model. Print shows Work and omits Data and tab controls.

### Implementation Evidence

| Area | Files | Result |
| --- | --- | --- |
| Store schema and compatibility | [`database.ts`](../../../packages/cli/src/store/database.ts), [`compatibility-bridge.ts`](../../../packages/cli/src/store/compatibility-bridge.ts), and [`installation-state.ts`](../../../packages/cli/src/store/installation-state.ts) | Adds the bounded rebuildable cache table through Store schema 6. Read-only lookup does not create, bind, or migrate the Store. Legacy schema use fails closed and directs the reviewed setup or update path. |
| Cache service | [`cache-service.ts`](../../../packages/cli/src/operations/work/backlog/cache-service.ts) | Uses checkout identity, record path, deterministic record digest, snapshot schema version, rule catalog version, and Skill version as the exact key. It performs bulk lookup, validates current facts, rejects corrupt or private fragments, invalidates changed records, writes in one transaction, and prunes to a fixed bound. A fully rejected write makes no cache change. |
| Public routes | [`cache-operation.ts`](../../../packages/cli/src/operations/work/backlog/cache-operation.ts), [`registry.ts`](../../../packages/cli/src/operations/registry.ts), and [`cli.ts`](../../../packages/cli/src/run/cli.ts) | Adds `work.backlog-cache.lookup` and `work.backlog-cache.write`, their canonical CLI paths, and registry-derived MCP tools. The lookup uses Store read. The write uses Store write. Both use project read and no host-configuration access. |
| Skill flow and fallback | [`SKILL.md`](../../../packages/skills/backlog-review/SKILL.md), [`cache.md`](../../../packages/skills/backlog-review/references/cache.md), and [`fallback.md`](../../../packages/skills/backlog-review/references/fallback.md) | Requires the current snapshot first, exact-hit reuse only, fresh work for misses or rejected rows, full portfolio rebuilding, a write attempt for freshly reviewed fragments after validation, Store-free completion, privacy limits, and natural human error explanations. A denied or failed write does not affect the current report. |
| Report data access | [`backlog-review-report.html`](../../../packages/skills/backlog-review/assets/backlog-review-report.html) and [`html-report.md`](../../../packages/skills/backlog-review/references/html-report.md) | Keeps the visible Backlog heading and its Work and Data tabs separate from the Next and Attention sections. Work keeps the existing report state. Data contains the download control and complete embedded model. The browser formats and places the JSON only after the first Data-tab or download action. Print shows Work and omits Data and tab controls. |
| Automated checks | [`backlog-cache.test.ts`](../../../packages/cli/tests/backlog-cache.test.ts), [`backlog-review-skill.test.ts`](../../../packages/cli/tests/backlog-review-skill.test.ts), and shared Store, registry, CLI, MCP, and package tests | Covers schema 6, no lookup or write migration, cold misses, exact hits, one-record misses, invalidation, corrupt rows, privacy rejection, pruning, no project mutation, public route identity, package declarations, embedded data parity, and script validity. |

### Verification Evidence

| Check | Result | Observation |
| --- | --- | --- |
| Focused P5 and changed-contract checks | Passed: 2 files and 16 tests for the owner-approved refinement | Cache and Skill tests pass with required fresh-fragment write attempts, Backlog Work and Data tabs, lazy report-data formatting, keyboard navigation, Work-state preservation, and Work-only print output. Earlier P5 checks also covered Store migration, operation registry, CLI, MCP, and exact surface lists. |
| Full CLI suite | Passed: 90 files and 1,436 tests; 1 file and 5 tests skipped | No detected CLI, Store, setup, Skill, or package regression remains. The existing installed-upgrade matrix stays skipped. |
| TypeScript check | Passed | The Store schema, service, operation inputs, result contracts, registry routes, and tests type-check. |
| CLI package build | Passed | The package build includes the cache operations, schema, Skill guidance, and updated report asset. |
| Skill validator | Passed | The updated `backlog-review` Skill entrypoint and declared support files pass the local Skill validator. |
| Diff check | Passed | `git diff --check` found no whitespace errors. |
| Review artifact | Created | `/private/tmp/make-docs-backlog-report-p5-review-current.html` uses the current template and the retained 70-record report model. The temporary renderer input was removed after success. |
| Lazy-data review artifact | Created and statically checked | `/private/tmp/make-docs-backlog-report-p5-lazy-review.html` retains all 70 records. It has the lazy formatter and on-demand download path. It has no eager assignment to the hidden data view. |
| Tabbed-data review artifact | Created and statically checked | `/private/tmp/make-docs-backlog-report-p5-tabs-review-v2.html` retains all 70 records. It has the Backlog Work/Data tabs, lazy Data formatting, one download control, Work-only print handling, and a valid executable script. The temporary renderer input was removed after success. |
| Responsive-tab review artifact | Created, reviewed, and rejected by the owner | `/private/tmp/make-docs-backlog-report-p5-responsive-tabs-review.html` is the rejected responsive experiment. It is not current implementation evidence. |
| Restored-layout review artifact | Created and statically checked | `/private/tmp/make-docs-backlog-report-p5-restored-tabs-review.html` retains all 70 records. Static checks confirm the visible Backlog heading, separate Next and Attention sections, Work/Data-only tabs, stacked narrow layout, lazy Data view, Work-only print handling, one download control, and a valid executable script. The temporary renderer input was removed after success. |
| Browser interaction check | Pending | Browser automation refused local `file:` inspection under its URL policy. No alternate browser path was used. Static report and script checks passed, but this does not replace direct review. |

### PERF-001 Result

Result: `pass` with one moderate performance finding. The test found no correctness, privacy, safety, or portability failure. It makes no general speed claim.

#### Evidence Fingerprint

| Field | Recorded value |
| --- | --- |
| Profile | `PERF-001` version `1`; source digest `5303b73db447269f95fc73aa0c45fd9780608d14c6ad0f70c8b7bb9766b4ee8e` |
| Instrument | `W23-R0-P5-PERF-001-V1` on Node.js `v24.19.0` |
| Product state | Branch `make-docs-v2`; Git revision `61c3c46917d3825f08024b80b7c1d8ded9ff7630`; dirty-state digest `a5b734d2a39ae72f77d769d4dd82b74c403233980c6478e33afc7065ba386121` |
| Dependency state | `package-lock.json` digest `c6b5ab7c26f0d59291eeec226493d67179835d71d73fd76d408f2c483f89324d` |
| Contract versions | Store schema `6`; snapshot schema `1`; rule catalog `1`; Skill version `1` |
| Workload | Frozen comparable 70-record W23 R0 snapshot and accepted report fragments; workload digest `ef24bba68f50a0f60c4bcb77278d8cf79168ce045cee6d353de09b47eb445244` |
| Environment | macOS `27.0`, arm64, 90 GB free before the run |
| Raw result | `/private/tmp/make-docs-p5-perf-001-20260922.json`; SHA-256 `479c70bb177008547b61c7b6c6e0ae05a0d736dfc797aa6b09d952bd4f0c6899` |

#### Three Authorized Observations

| Observation | Validated render | Cache lookup | Post-validation write | Result |
| --- | ---: | --- | --- | --- |
| Cold | 1,462.529 ms; 1,549.097 ms with write | 0 hits, 70 misses, 0 rejected | 67 stored, 3 rejected | Complete report rendered and validated. |
| Exact repeat | 1,327.690 ms; 1,353.890 ms with write | 67 hits, 3 misses, 0 rejected | 0 stored, 3 rejected | Report and HTML hashes match the cold result. Reused fragments match the accepted fresh fragments. |
| One-record change | 1,346.697 ms; 1,394.758 ms with write | 66 hits, 4 misses, 0 rejected | 1 stored, 3 rejected, 1 old digest invalidated | The changed record was the one added miss. A lookup after the write returned 67 hits and 3 misses. The changed record was reusable. |

The controlled change affected only `docs/work/2026-09-18-w23-r0-backlog-review-and-reporting`. The test changed its deterministic digest in memory. It did not change a project file. The worktree dirty-state digest was the same before and after the test.

#### Finding PERF-001-F1

Three unchanged accepted report fragments exceed the 65,536-byte cache-entry limit. The cache rejects these fragments and uses fresh review on each run.

| Record | Fragment size |
| --- | ---: |
| `docs/work/2026-08-14-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery` | 151,207 bytes |
| `docs/work/2026-08-28-w20-r0-human-experience-standard-and-intent` | 85,486 bytes |
| `docs/work/2026-08-28-w21-r0-proportionate-testing-and-human-centered-validation` | 137,715 bytes |

The exact repeat reused 67 of 70 fragments. The report stayed complete and equivalent because the other three fragments used the safe fresh-review path. This is a moderate repeat-work limit. It is not a report-correctness failure. Keep the safe fallback. Decide before P5 closes whether to accept this bounded limit or change the cache payload size or shape.

#### Budget, Uncertainty, And Limits

- The run used all three authorized observations.
- The harness used two of two allowed correction attempts before the comparable run. The first stopped at an unexpected warm miss. The second identified the three valid size rejections.
- The run used one of two review cycles and finished within the two-hour investigation limit.
- The timed window had no model call and no human review time. The elapsed values cover local snapshot, cache, assembly, validation, render, and write work only.
- The frozen fragments preserve report parity. They do not measure provider delay or the fresh-review time for the three rejected fragments.
- The result does not set or support a numeric product speed target.

### Guided Progress And Human Experience Review

Status: complete.

| Human promise | Observation | Conclusion | Limit | Next action |
| --- | --- | --- | --- | --- |
| A changed record receives fresh review and becomes reusable during the next report. | `PERF-001` used the 70-record fixture. The controlled record became one added miss. The post-validation write stored it, invalidated its old digest, and made it an exact hit on the next lookup. The owner accepted the three-entry size limit on 2026-09-22. | `satisfied` for the implemented flow and bounded evidence. | Three oversized fragments still use fresh review. This does not affect the changed-record result. | Preserve the safe fallback. Revisit payload size or shape only under later authority. |
| A maintainer can inspect or save the complete normalized report data without changing report meaning. | The owner reviewed the first data controls and made them permanent. The owner rejected the later unified responsive tabs and restored the separate Next, Attention, and Backlog sections. Work keeps its live state. Data lazily formats the full model and owns the download control. | `satisfied` for the restored structure and automated checks; direct review remains useful. | Browser automation cannot inspect local `file:` pages under the app policy. The owner can review the new artifact directly. | Offer the restored-layout artifact for optional confirmation. |
| A Store refusal or failed cache write does not block the report and receives a natural explanation. | The Skill guidance preserves Store-free completion and explains that only later reuse is affected. The owner reviewed and accepted the bounded fallback explanation on 2026-09-22. A live read-only check then returned `store-not-configured` for the current agent harness. | `satisfied` for the guidance, automated Store-state checks, and owner-reviewed wording. | The live result proves only that this agent harness lacks Store access configuration. It does not prove that the Global Store is down or unavailable to another configured client. | The owner will address this harness setup in another task. Continue Store-free work in the meantime. |

### Coverage And Closeout

- Automated Implementation Testing: required and passed.
- Performance Testing: `characterize-now` and passed within the `PERF-001` budget. The owner accepted the moderate `PERF-001-F1` limit.
- Guided Progress Review: required and passed for the restored report-data controls, cache disclosure, and fallback flow.
- Unassisted Goal Testing: `not-needed-now`. P5 remains a maintainer-led optimization and inspection feature.
- Human Experience Review: `satisfied` within the owner-reviewed P5 controls and fallback explanation.
- Explicit human acceptance gate: none. The owner still gave direct acceptance for the remaining P5 decisions on 2026-09-22.
- Optional Store capture: `project.state.status` returned `store-not-configured` for the current agent harness. Only that Store operation stopped. Local evidence and history remain valid project knowledge.

### Current Review Boundary

P5 is complete. Tasks t1 through t14 and A37-A44 are complete. `PERF-001` passed its three bounded observations. The owner accepted the moderate `PERF-001-F1` limit and the Store-free fallback explanation. The report keeps the accepted separate Next and Attention sections plus Backlog Work and Data tabs. P6 has not started and needs separate owner authority. P5 is not yet committed, published, or released.
