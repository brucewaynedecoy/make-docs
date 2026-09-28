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

The validator has a different reason to read Markdown. Current PRD identity lives in the working `docs/prd/` set. Authority claims can also appear in named sections and frontmatter of other working documents. Those checks still have a defined meaning, but the present `docs/**/*.md` selector does not define which copies are working documents.

The P2 full-project run passed after the structured-file fix. It also counted 73,372 Markdown files under `docs/`. A read-only path count found 73,242 Markdown files under one plan's `implementation-evidence/` directory. The validator reads those files before it checks for authority contexts. [D-043](../prd/03-open-questions-and-risk-register.md) records this separate source-scope issue.

[The generated-document metadata contract](../prd/23-generated-document-metadata-and-lifecycle-handoffs.md) makes YAML frontmatter the machine-readable layer for generated Make Docs documents. It provides `kind` and `status`. The earlier decision also permits active documents that predate frontmatter. A stored copy can retain the same header as its working source. The header can help classify a candidate, but it cannot prove that the copy is a working document.

## Human Experience Intent

Impact: `indirect`

Affected humans: People who validate a Make Docs PRD set before they use it as product authority.

Human goal or effect: A validation run gives a usable result for current PRD authority, even when a project stores large evidence files.

Experience promises:

- The command finishes its defined authority check without opening unrelated structured evidence.
- The command selects working Markdown documents without reading stored Markdown copies, whatever name their storage directory uses.
- The report still identifies action-named PRDs used as current authority in supported Markdown links and frontmatter fields.

Complexity kept out of the human path:

- The user does not need to move, delete, or trim test evidence before validation.

Evidence required:

- Code and test evidence show that source location is selected before file reads. P3 tests also show that a bounded frontmatter read precedes any body read.
- A full North Atlantic BuildOS run completes and returns its authority report, records the selected Markdown count, and keeps supported live-document diagnostics. Any remaining limit receives a separate cause check.

## Performance Evidence Candidates

| Candidate | Base maintenance action | Performance applicability | Protected outcome | Decision informed | Canonical owner or next record |
| --- | --- | --- | --- | --- | --- |
| A fixed elapsed-time target for authority validation | `none` | `not-needed` | A complete and correct authority report | No speed target is needed to decide the file-scope fix. Record full-project completion, selected-file counts, elapsed time, and excluded-file access. | None. Reassess only if the narrowed run still has a time or resource failure. |

## Decision

The validator selects authority sources by their Make Docs role before it reads them. It keeps the active PRD Markdown scan and the live Markdown authority-link and frontmatter checks. It does not enumerate or read standalone JSON, JSONL, YAML, or YML files by extension across the target project.

Make Docs currently defines no standalone structured file as a current PRD authority source. The eligible standalone structured set is therefore empty. A later product need must first name the file path or bounded path family, its schema, the field that means *current authority*, and the archive or provenance rule. That change must then add an explicit selector and tests. A field name found in an arbitrary file does not grant that file authority.

Keep the existing public report fields and diagnostic meanings. `structuredFilesScanned` stays present and reports zero while no standalone structured source is defined. `PRD-AUTH-005` still applies to supported Markdown authority links and frontmatter fields. P3 adds distinct failures for an invalid custom source declaration and an unusable selected header. It also makes selected-source coverage visible. Do not add a file-size cutoff as a substitute for source selection.

For P3, a **working document** is the project document at a Make Docs working path or at an exact custom path that the project declares as a current validation source. A stored copy is not a working document, even when its filename, YAML frontmatter, and body match the original. `status: completed` does not by itself make a work record a stored copy. Location establishes the source role; metadata describes and checks the selected document. PRDs own product requirements. Other selected documents are checked only for claims they make about current PRD authority.

Select default sources by the existing [required output paths](../../.make-docs/system/contracts/output-contract.md#required-paths): direct numbered Markdown files in `docs/prd/`; dated design Markdown directly in `docs/designs/`; plan overview and phase Markdown directly in each dated W/R plan directory; and work index and phase Markdown directly in each dated W/R work directory. Do not recurse into other files beneath a plan or work directory. Do not use a directory's name, a file's size, or an authority-looking word in its body to grant or remove source status.

Allow custom working documents through an optional list of exact, project-relative Markdown paths in `.make-docs/config.yaml`. The list is for current validation sources, not for directories or glob patterns. It must stay inside `docs/`, resolve safely inside the target project, and never follow a symlink. An absent list means the default paths alone form the source set. A project can add a custom file such as `docs/history/current.md` without making every other file under `docs/history/` eligible. This is a project-owned declaration; the validator must not edit it during validation.

The Store may hold a checkout binding, operation history, or a reference to project evidence. It does not own the project's document set or grant a Markdown file current-authority source status. An initialized project need not have a local Make Docs CLI installation or Store record. The validator derives the source set from repository files and project config. Store availability cannot change its source set, pass or fail result, or coverage claim.

After path selection, read only a bounded YAML header. Use `kind` and `status` to check the expected role and current-claim meaning where the owning document contract defines them. A copied header outside the selected source set does not confer authority. A selected older document without frontmatter remains eligible. A present malformed, over-limit, or role-inconsistent header must not silently make a selected document disappear; report a clear failure when classification cannot be trusted. Read the body only when the selected document can carry the check being run. Keep existing authority-field, heading, provenance, root-safety, CLI, and MCP meanings. `markdownFilesScanned` counts documents whose bodies receive the Markdown authority check; report the selected-source scope clearly.

## Alternatives Considered

- Keep the whole-project structured scan and stream JSONL line by line. This would avoid one string limit, but it would still read unrelated evidence and leave the source rule too broad.
- Skip only `implementation-evidence` or files above a size limit. This would fix one observed path but would leave other unrelated files in scope.
- Add a project-wide registry for every generated document. The output path contract already identifies standard working documents. Only custom sources need an explicit path declaration.
- Skip directories named `evidence` or `implementation-evidence`. This depends on storage names and misses stored copies with other names. The uncommitted P3 candidate and its passing project run demonstrate only that narrow rule.
- Treat `kind` or `status` as sufficient proof of a working source. Stored copies can preserve both fields, and older working files can lack both.
- Probe every Markdown header under `docs/`. This avoids full-body reads of many files, but it still opens every stored copy and does not establish which copy is working.

## Consequences

The validator will no longer flag an action-named PRD path inside an arbitrary standalone structured file. That is an intentional scope change. Make Docs has no documented current-authority file type for that case. A project that needs one can define it through a later product-authority change.

The validator will read the bodies of selected working Markdown to find the named authority contexts. Standard source paths come from document shape. Custom paths require an exact project declaration. This makes the selected set explainable and avoids a new exception for each storage folder name. Existing custom documents need a declared path to stay in scope. P3 must make that change visible in guidance and report coverage, then test it against representative projects before closeout.

## Intended Follow-On

Route: `prd-change-plan`.

Next step: Use [W18 R16 P3](../plans/2026-09-26-w18-r16-prd-authority-scan-scope/03-markdown-evidence-source-selection.md) and the [CLI owner PRD](../prd/39-cli-command-model-and-operation-registry.md) to exclude stored Markdown evidence while preserving live-document checks.

Why: The source rule must be clear in product authority before code and templates use it.

Coordinate handoff: W18 R16.
