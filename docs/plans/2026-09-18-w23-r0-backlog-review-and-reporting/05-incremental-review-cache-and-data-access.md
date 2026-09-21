---
title: "W23 R0 P5 Incremental Review Cache and Data Access"
kind: "plan"
status: "draft"
coordinate: "W23 R0 P5"
source:
  type: "prd"
  path: "docs/prd/51-backlog-review-and-reporting.md"
---

# W23 R0 P5 Incremental Review Cache and Data Access

## Purpose

Reduce repeat report time without weakening current-source review. Give the maintainer direct access to the normalized report data without making a second file part of the normal report.

## Outcome

The Skill always collects a current deterministic snapshot. It can reuse only exact per-record review matches from a rebuildable Global Store cache. It rebuilds portfolio-level conclusions from the current full snapshot. The saved report remains one self-contained HTML file and adds an accessible data view with a user-started JSON download.

## Scope

- Add one privacy-bounded, rebuildable review-cache class under the existing Global Store service boundary.
- Expose that service through separate registry-derived bulk lookup and write operations so reuse requires only Store-read access and later persistence requires Store-write access.
- Key each cached record by checkout identity, record path, deterministic record digest, snapshot schema version, rule catalog version, and Skill version.
- Reuse only an exact key match. Treat a missing, stale, invalid, or unreadable entry as a cache miss.
- Always run the current deterministic snapshot before cache lookup.
- Rebuild tallies, attention findings, recommended order, and other portfolio-level conclusions from the current full snapshot.
- Perform the complete stateless review when the Store is not configured, unavailable, unsafe, or denied.
- Report cache and Store limits to the human in natural language without blocking independent report work.
- Add a report data view and user-started JSON download from the same embedded report model.
- Keep the default artifact as one self-contained HTML file. Do not create a required companion file or project-local operational cache.
- Keep the deterministic snapshot operation Store-free.

## Performance Evidence

- Candidate: repeat backlog-report review time.
- Base maintenance action: `create`.
- Applicability: `characterize-now`.
- Target class: `characterization-baseline`.
- Canonical owner: the P5 work record and its `PERF-001` profile.
- Gate effect: informational for speed. Correctness, privacy, Store safety, fallback behavior, and exact invalidation remain blocking acceptance conditions.
- Reason: the first 70-record report took about 13 minutes end to end, while the deterministic snapshot took 1.191 seconds and HTML rendering took 0.080 seconds. The current decision needs a bounded comparison of full and repeat review paths. No approved latency target exists.

## Acceptance Boundary

The cache is optional operational data. It is not product authority, source evidence, or a substitute for a current snapshot. A cache write receipt proves only that data was stored. A characterization result does not create a speed promise.

## Verification

- Prove exact hit, miss, invalidation, pruning, and corrupt-entry behavior.
- Prove that one changed record does not force valid unchanged records through review again.
- Prove that every portfolio-level value is rebuilt from the current full snapshot.
- Prove identical report meaning with a disabled or unavailable Store.
- Prove that Store-read access can reuse exact hits without a write grant and that a denied or failed cache write does not invalidate the current report.
- Prove that no cache file appears inside the project.
- Prove that cached values exclude document bodies, prompts, secrets, and absolute local paths.
- Prove that the data view and JSON download match the embedded report model and keep project text inert.
- Run the bounded `PERF-001` characterization. Record time, cache hits and misses, uncertainty, and limits without promoting a target.
- Complete Guided Progress Review and Human Experience Review of the raw-data surface and fallback explanations.
