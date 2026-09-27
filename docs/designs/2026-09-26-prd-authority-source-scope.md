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

## Human Experience Intent

Impact: `indirect`

Affected humans: People who validate a Make Docs PRD set before they use it as product authority.

Human goal or effect: A validation run gives a usable result for current PRD authority, even when a project stores large evidence files.

Experience promises:

- The command finishes its defined authority check without opening unrelated structured evidence.
- The report still identifies action-named PRDs used as current authority in supported Markdown links and frontmatter fields.

Complexity kept out of the human path:

- The user does not need to move, delete, or trim test evidence before validation.

Evidence required:

- Code and test evidence show that file selection happens before file reads.
- A full North Atlantic BuildOS run completes and returns its authority report, or its remaining limit is recorded with a separate cause.

## Performance Evidence Candidates

| Candidate | Base maintenance action | Performance applicability | Protected outcome | Decision informed | Canonical owner or next record |
| --- | --- | --- | --- | --- | --- |
| A fixed elapsed-time target for authority validation | `none` | `not-needed` | A complete and correct authority report | No speed target is needed to decide the file-scope fix. A full-project completion check and excluded-file access check are required. | None. Reassess only if the narrowed run still has a time or resource failure. |

## Decision

The validator selects authority sources by their Make Docs role before it reads them. It keeps the active PRD Markdown scan and the live Markdown authority-link and frontmatter checks. It does not enumerate or read standalone JSON, JSONL, YAML, or YML files by extension across the target project.

Make Docs currently defines no standalone structured file as a current PRD authority source. The eligible standalone structured set is therefore empty. A later product need must first name the file path or bounded path family, its schema, the field that means *current authority*, and the archive or provenance rule. That change must then add an explicit selector and tests. A field name found in an arbitrary file does not grant that file authority.

Keep the public report shape and diagnostic codes. `structuredFilesScanned` stays present and reports zero while no standalone structured source is defined. `PRD-AUTH-005` still applies to the supported Markdown authority links and frontmatter fields. Do not add a size cutoff as a substitute for file selection.

## Alternatives Considered

- Keep the whole-project structured scan and stream JSONL line by line. This would avoid one string limit, but it would still read unrelated evidence and leave the source rule too broad.
- Skip only `implementation-evidence` or files above a size limit. This would fix one observed path but would leave other unrelated structured files in scope.
- Add a project-wide authority-file registry now. No current standalone structured authority schema needs it. A registry would add setup work without a defined user need.

## Consequences

The validator will no longer flag an action-named PRD path inside an arbitrary standalone structured file. That is an intentional scope change. Make Docs has no documented current-authority file type for that case. A project that needs one can define it through a later product-authority change.

The validator will still read Markdown under `docs/` to find the named authority contexts. This package changes the unrelated structured-file scan. A separate Markdown evidence-scope problem, if shown, needs its own evidence and decision.

## Intended Follow-On

Route: `prd-change-plan`.

Next step: Use the [W18 R16 plan](../plans/2026-09-26-w18-r16-prd-authority-scan-scope/00-overview.md) to update the [CLI owner PRD](../prd/39-cli-command-model-and-operation-registry.md), the validator, tests, and shipped guidance.

Why: The source rule must be clear in product authority before code and templates use it.

Coordinate handoff: W18 R16.
