---
title: "W28 R0 Phase 3 Backlog and Validation"
kind: "plan"
status: "draft"
coordinate: "W28 R0 P3"
source:
  type: "plan"
  path: "docs/plans/2026-11-18-w28-r0-wave-revision-rules/00-overview.md"
---

# Phase 3: Backlog and Validation

## Purpose

Turn the updated PRDs and the Phase 2 change list into an implementation queue. Then verify the document handoff.

## Scope

Create `docs/work/2026-11-18-w28-r0-wave-revision-rules/`. It holds `00-index.md` and four Phase files in dependency order.

### Work P1: Template Resources and Dogfood

- Make the references, contracts, prompts, templates, and router changes from Phase 2 in `packages/docs/template/`.
- Reseed the affected template-owned files into `./.make-docs/` and `./docs/` after review.
- Rewrite the user concept guide.
- Cite PRD 14 Coordinate Selection and Amendment, and PRD 04.
- Acceptance:
  - each changed file states the decision procedure, the tests, the gates, and Change History;
  - no file keeps the old trigger list as a rule;
  - the template and dogfood copies are byte-identical.

### Work P2: CLI Snapshot Facts and Rule

- Run the schema-consumer preflight.
- Make the schema, snapshot, and catalog changes, and add the tests.
- Cite the PRD 51 snapshot and rule-catalog requirements.
- Acceptance:
  - `npm test -w packages/cli` passes;
  - the new facts report `null` without Git;
  - `BACKLOG-VAL-017` fires only on a malformed Change History;
  - the coordinate facts match a fixture portfolio;
  - existing fixtures emit no new diagnostics.

### Work P3: Skills

- Make the `decompose-codebase`, `backlog-review`, and `preflight` changes.
- Depends on the P2 rule IDs.
- Acceptance: the rule-map rows match the catalog entries, and the Skill text applies the procedure and its gates.

### Work P4: Validation, Review, and Closeout

- **Walkthrough.** Walk the five design cases through the shipped `wave-model.md`. Record the expected and actual outcomes in `evidence.md`.
- **Human Experience Review.** Review one sample gated owner question and one sample agent-alone reply against the [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).
- **Templates.** Review the Change History template.
- **Packaging.** Run `npm run validate:defaults -w packages/cli` and `npm run smoke:pack`, one after the other.
- **Closeout.** Run the coverage pass and write the history records.

Each task cites current PRD requirements. Tasks use `- [ ] tN:` items. Acceptance criteria are plain bullets with stable `A<n>` IDs, unique across the backlog. The index includes a Phase Map, the Human Experience trace from the overview, and an `## Intended Follow-On`.

The backlog stays a draft until its first commit, so it has no Change History entries yet. Its index carries the empty, optional `## Change History` heading only if the updated `work-index.md` template requires it.

## Validation

1. Run `make-docs run prd authority validate --target-root .` after the backlog exists.
2. Run `make-docs run work backlog snapshot --target-root . --json`. The W28 R0 record must be `supported`, with four linked Phases and no `BACKLOG-VAL-007`. Existing records must show no new diagnostics.
3. Check the plan-to-PRD-to-work links, the frontmatter coordinates (`W28 R0` and `W28 R0 Pn`), the task syntax, and the acceptance IDs.
4. Run `make-docs project path-hygiene validate`.

Record any gap in the work index or in `docs/prd/03-open-questions-and-risk-register.md`.

The implementation gate is a validated backlog plus Tyler's go-ahead. A validated backlog is not proof that the rules are shipped.
