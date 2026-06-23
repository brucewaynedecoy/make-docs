# W17 R1 Skill Purpose Registry Alternate Skills Manifest Plan

## Purpose

Decide how make-docs v2 makes skill selection purpose-led without making first-party skills mandatory. This design defines stable purpose ids, the alternate skills manifest contract, source and trust display rules, and the boundary between skill selection metadata and the existing selected-skill install state.

## Source Design

- Design: [Skill Purpose Registry and Alternate Skills Manifest](../../designs/2026-06-20-skill-purpose-registry-and-alternate-skills-manifest.md)
- Route: `change-plan`
- Update Mode: `new-doc-related`
- Coordinate: `W17 R1`

## Coordinate Decision

Use `W17 R1`.

The design leaves the coordinate unresolved and cites W14 R1 skill-selection simplification plus the W17 R0 no-default-skills correction as prior related work. The live W17 line already owns static template, router ownership, and no-default-skill correction. This plan extends that skill-selection line with purpose metadata and alternate manifest trust policy, so it becomes the next W17 revision rather than a new Batch 3 wave.

## Current State

- The CLI registry is name-led: entries expose `name`, `source`, `entryPoint`, `installName`, `description`, and `assets`.
- `selectedSkills` stores resolved skill names and remains the executable install selection state.
- `skillFiles` remains the managed-output ownership list for installed skill files.
- `--selected-skills all` expands every skill in the packaged built-in registry.
- The skills UI shows concrete skills, not purposes, and does not display source policy, harness support, trust, or manifest provenance before selection.
- Current resolver policy allows remote sources such as GitHub tree URLs and does not require immutable refs or content integrity metadata.
- Bare default installs still write no skills, and this plan must preserve that PRD 12 contract.

## Target State

- Skill selection becomes purpose-led without making first-party skills mandatory or selected by default.
- The built-in registry evolves toward the same manifest shape used for alternate manifests.
- First-party purpose ids are stable canonical ids, while configuration may relabel only presentation text.
- One effective skills manifest is active per run: built-in by default, or an explicitly supplied alternate manifest.
- Alternate file manifests are the first implementation target; remote manifests and remote skill sources require immutable refs and integrity metadata before install.
- Install manifests continue to store resolved `selectedSkills` and `skillFiles`, with optional explanatory selection provenance for review, reconfigure, audit, backup, uninstall, and support.
- `--selected-skills all` expands against the effective manifest, and `none` remains an empty selected-skill set.

## PRD Strategy

- Add PRD 27 for the purpose registry and alternate skills manifest contract.
- Annotate PRDs 07, 08, 10, 12, 16, 18, 24, 25, and 26 where purpose-led selection, source policy, manifest provenance, config labels, and no-scripts boundaries alter existing requirements.
- Update the PRD index and risk register, especially D-005, Q-001, Q-007, Q-012, Q-013, R-001, R-002, R-006, R-008, and R-014.
- Keep Q-001, Q-012, and the broader remote-skill delivery decision open. Narrow Q-007 only for alternate manifests and remote skill source trust policy.

## Validation Plan

- Run `git diff --check`.
- Run `bash scripts/check-wave-numbering.sh`.
- Attempt to reindex project docs with jdocmunch after edits.
- Scan new and touched docs for unfinished tokens.
- Check touched Markdown local links before committing.

## Intended Follow-On

- Generate the paired implementation backlog under `docs/work/2026-06-23-w17-r1-skill-purpose-registry-alternate-skills-manifest/`.
- Implement registry schema, manifest loading, selection UI, source policy, selection provenance, audit/package validation, and tests without changing bare default install behavior.
