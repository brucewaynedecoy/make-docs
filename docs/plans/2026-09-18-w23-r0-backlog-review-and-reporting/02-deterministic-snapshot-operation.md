---
title: "W23 R0 P2 Deterministic Snapshot Operation"
kind: "plan"
status: "draft"
coordinate: "W23 R0 P2"
source:
  type: "prd"
  path: "docs/prd/51-backlog-review-and-reporting.md"
---

# W23 R0 P2 Deterministic Snapshot Operation

## Purpose

Implement the accepted snapshot contract as one Store-free TypeScript operation with shared CLI and MCP meaning.

## Outcome

`work.backlog.snapshot` returns a complete or typed partial snapshot through its operation core, canonical CLI projection, and registry-derived MCP tool. The surfaces contain no backlog business logic.

## Implementation Gate

Do not start this phase until the owner separately authorizes W23 implementation and P1 is accepted.

Before P2 changes a shared operation surface, run this W22 preflight:

- Confirm that the checkout contains W22 R0 P6 closeout commit `edd9d7e4` or later accepted authority.
- Reread the current PRD 38 and PRD 39 authority.
- Confirm project-read, Store-none, and host-configuration-none access for `work.backlog.snapshot`.
- Pass the existing registry, access, CLI, and MCP contract tests.
- Confirm that the implementation uses the existing registry-derived CLI and MCP paths.

W22 publication or release is not required. If the preflight fails, stop P2 and report the drift. Do not create a temporary workaround. Independent P1 contract and fixture work may continue.

## Scope

- Implement safe root resolution and bounded discovery of every live and archived work record.
- Implement the accepted version 1 snapshot envelope, capability map, record identity, sourced-value types, timestamp fact types, diagnostic type, and required-key rules.
- Implement the private source-reader adapter with a current-frontmatter reader and an unsupported inventory reader.
- Fully parse only valid current-frontmatter records. Return safe partial facts for malformed or incomplete current frontmatter. Keep no-frontmatter records in counts as inventory-only unsupported records.
- Do not parse legacy headings, checkbox conventions, task syntax, status text, or closeout prose.
- Return directory-derived creation dates. Derive last-updated evidence from only each work record directory and its linked phase files.
- Use the newest modification time among changed or untracked scoped files when local changes exist. Otherwise, use the latest Git committer date that affected a scoped file.
- Fall back to the newest scoped file modification time when Git is unavailable, denied, not in a repository, or has no usable history. Fall back to the creation date when no usable file time exists. Return the evidence source and a stable diagnostic for each fallback.
- Exclude linked product source files and report generation time from last-updated evidence.
- Implement private collectors for supported frontmatter, phase-map links, task checkboxes, dependencies, blockers, closeout evidence, source links, discovered top-level Markdown files, and optional Git facts.
- Implement the stable rule and diagnostic catalog.
- Return explicit capability availability and partial-result states.
- Register one public operation.
- Derive canonical CLI and MCP surfaces from the registry.
- Keep human text, JSON, and MCP meanings aligned.
- Add fixture, path-safety, operation-core, CLI, MCP, and parity tests.

## Boundary Rules

- The operation declares project-read, Store-none, and host-configuration-none access. Optional Git evidence does not broaden this access.
- No write, repair, priority, historical classification, or recommendation is allowed.
- No helper receives a public operation identity without a later product decision.
- Git unavailability is data, not a reason to fail repository parsing.
- The implementation uses the existing registry-derived CLI and MCP paths.
- The implementation adds no Store schema or state, setup path, harness trust path, parallel dispatcher, or MCP-only business logic.

## Verification

- The operation core passes without CLI or MCP transport.
- CLI JSON and MCP results match for success, partial, conflict, and failure fixtures.
- Contract tests prove that every required key is present, unknown scalars use `null`, empty collections use `[]`, and `recordCounts.found` equals live plus archived records.
- Contract tests prove that duplicate coordinates do not replace the repository-relative `recordPath` identity.
- Store absence, denial, unsafe state, and unavailability do not block repository facts.
- Unsafe or escaping roots fail closed.
- Last-updated fixtures cover changed, untracked, clean, Git-unavailable, not-a-repository, no-history, and no-usable-file-time cases.
- Static source fixtures use fixed dates and expected JSON-compatible results. Git state, file-time, and unsafe-path cases use isolated temporary repositories or directories created by the tests.
- Sorting tests use wave coordinate, then record path, in ascending order when primary values match.
- Tests prove no project, Git, Store, or installation write occurs.
