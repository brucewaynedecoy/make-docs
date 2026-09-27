---
title: "PRD Authority Source Scope"
kind: "design"
status: "draft"
coordinate: "W18 R16"
follow_on:
  route: "prd-change-plan"
  next_prompt: "make-docs://system/prompt/designs-to-plan-change.prompt.md"
  why: "The validator needs a source rule before its scan can change."
  coordinate_handoff: "Carry W18 R16 into the plan and work backlog."
---

# PRD Authority Source Scope

## Purpose

Set the file scope for `prd.authority.validate` before changing its code.

## Context

Make Docs 2.0.3 reads every JSON, JSONL, YAML, and YML file under the target project, except for a small set of skipped directories and the `.make-docs/archive/**` path exemption. It chooses files by extension before it checks whether their fields can state current PRD authority. The implementation calls `structuredFiles(targetRoot)` and then reads each selected file as one UTF-8 string. Its test uses a made-up `docs/conformance/map.jsonl` fixture. The current Make Docs contracts name field patterns, but they do not name a standalone structured file path or schema that owns current PRD authority.

In the reported North Atlantic BuildOS run, this scan included stored test evidence under `docs/plans/**/implementation-evidence/**`. A JSONL file in that evidence was larger than Node's string limit. The exact failing read was not traced. The file selection rule is the defect whether or not that file caused the reported error. The first 180-second timeout also has no proven single cause.

The validator has a different reason to read Markdown. Current PRD identity lives in `docs/prd/**/*.md`. Authority claims can also appear in named sections and frontmatter of live Markdown documents. Those checks still have a defined source and meaning.

The P2 full-project run passed after the structured-file fix. It also counted 73,372 Markdown files under `docs/`. A read-only path count found 73,242 Markdown files under one plan's `implementation-evidence/` directory. The validator reads those files before it checks for authority contexts. [D-043](../prd/03-open-questions-and-risk-register.md) records this separate source-scope issue.

## Human Experience Intent

Impact: `indirect`

Affected humans: People who validate a Make Docs PRD set before they use it as product authority.

Human goal or effect: A validation run gives a usable result for current PRD authority, even when a project stores large evidence files.

Experience promises:

- The command finishes its defined authority check without opening unrelated structured evidence.
- The command does not enter or read stored Markdown evidence under the named evidence directories.
- The report still identifies action-named PRDs used as current authority in supported Markdown links and frontmatter fields.

Complexity kept out of the human path:

- The user does not need to move, delete, or trim test evidence before validation.

Evidence required:

- Code and test evidence show that file selection happens before file reads. P3 tests also show that excluded Markdown directories are not traversed.
- A full North Atlantic BuildOS run completes and returns its authority report, records the selected Markdown count, and keeps supported live-document diagnostics. Any remaining limit receives a separate cause check.

## Performance Evidence Candidates

| Candidate | Base maintenance action | Performance applicability | Protected outcome | Decision informed | Canonical owner or next record |
| --- | --- | --- | --- | --- | --- |
| A fixed elapsed-time target for authority validation | `none` | `not-needed` | A complete and correct authority report | No speed target is needed to decide the file-scope fix. Record full-project completion, selected-file counts, elapsed time, and excluded-file access. | None. Reassess only if the narrowed run still has a time or resource failure. |

## Decision

The validator selects authority sources by their Make Docs role before it reads them. It keeps the active PRD Markdown scan and the live Markdown authority-link and frontmatter checks. It does not enumerate or read standalone JSON, JSONL, YAML, or YML files by extension across the target project.

Make Docs currently defines no standalone structured file as a current PRD authority source. The eligible standalone structured set is therefore empty. A later product need must first name the file path or bounded path family, its schema, the field that means *current authority*, and the archive or provenance rule. That change must then add an explicit selector and tests. A field name found in an arbitrary file does not grant that file authority.

Keep the public report shape and diagnostic codes. `structuredFilesScanned` stays present and reports zero while no standalone structured source is defined. `PRD-AUTH-005` still applies to the supported Markdown authority links and frontmatter fields. Do not add a size cutoff as a substitute for file selection.

For P3, live Markdown under `docs/` remains an eligible source family, including custom live paths such as `docs/history/current.md`. A path beneath a directory segment named exactly `evidence` or `implementation-evidence`, matched without case sensitivity, is stored proof and cannot state current PRD authority. This rule applies to both active PRD discovery and the live Markdown authority scan. It does not exclude a file merely because its name contains `evidence`. Prune an excluded directory before entering it or reading any file in it. Keep root and symlink safety, the existing diagnostic codes, and the report shape. `markdownFilesScanned` counts only selected Markdown files.

## Alternatives Considered

- Keep the whole-project structured scan and stream JSONL line by line. This would avoid one string limit, but it would still read unrelated evidence and leave the source rule too broad.
- Skip only `implementation-evidence` or files above a size limit. This would fix one observed path but would leave other unrelated structured files in scope.
- Add a project-wide authority-file registry now. No current standalone structured authority schema needs it. A registry would add setup work without a defined user need.
- Skip only the observed plan's `implementation-evidence/` path. That would leave other evidence directories in scope.
- Restrict Markdown to a fixed list of top-level documentation directories. That would stop checks in custom live paths such as `docs/history/current.md`, which the current validator tests cover.
- Stream or size-limit every Markdown file under `docs/`. That would still read stored evidence instead of selecting sources by role.

## Consequences

The validator will no longer flag an action-named PRD path inside an arbitrary standalone structured file. That is an intentional scope change. Make Docs has no documented current-authority file type for that case. A project that needs one can define it through a later product-authority change.

The validator will still read eligible Markdown under `docs/` to find the named authority contexts. P3 excludes the two named evidence directory families before traversal. An authority-looking heading or field inside either family does not grant it current authority. Other Markdown paths remain in scope to preserve custom live-document checks. A new excluded path family needs its own product-authority decision.

## Intended Follow-On

Route: `prd-change-plan`.

Next step: Use [W18 R16 P3](../plans/2026-09-26-w18-r16-prd-authority-scan-scope/03-markdown-evidence-source-selection.md) and the [CLI owner PRD](../prd/39-cli-command-model-and-operation-registry.md) to exclude stored Markdown evidence while preserving live-document checks.

Why: The source rule must be clear in product authority before code and templates use it.

Coordinate handoff: W18 R16.
