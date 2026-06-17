# Phase 03: Lifecycle Playbook

## Purpose

Author make-docs's own dogfooded lifecycle playbook: the human-facing narrative
map of the arc, written for the agent/maintainer persona, citing the anchor.
This is the first instance of the persona-scoped playbook output type.

## Overview

A playbook is persona-scoped procedural content; the make-docs lifecycle
playbook is the build-stack instance dogfooded in this repo. It narrates the arc
as a map, not automation.

## Source PRD Docs

- [14-add-lifecycle-workflow-foundation.md](../../prd/14-add-lifecycle-workflow-foundation.md)
- [01-product-overview.md](../../prd/01-product-overview.md)
- [02-architecture-overview.md](../../prd/02-architecture-overview.md)

## Stage 1 - Author the playbook

### Tasks

- [ ] t1: Create the playbook at `docs/library/playbooks/<persona>/make-docs-lifecycle.md` for the agent/maintainer persona, with a `persona:` frontmatter field. Resolve whether `docs/library/playbooks/` is created here or with the broader restructure (risk register Q-014) before writing.
- [ ] t2: Write per-stage sections in a uniform shape: Purpose, Inputs, Decision points, Suggested assists (skills, references, templates, prompts — never required), Exit criteria, Handoff.
- [ ] t3: Narrate inputs -> Segment 1 -> Segment 2 (loop plus coverage band) -> Segment 3 in the anchor's neutral vocabulary, citing the anchor for ordering.
- [ ] t4: Frame the playbook explicitly as a map, not automation — no enforced order, no gating.
- [ ] t5: Make the playbook discoverable from the README and the `docs/` router.

### Acceptance criteria

- The playbook exists with a `persona:` frontmatter field and the uniform per-stage shape.
- It cites the anchor, uses neutral vocabulary, and declares itself non-prescriptive.
- It is discoverable from the README and the `docs/` router.
- No placeholders remain.

### Dependencies

- Phase 01 (the contract) and Phase 02 (the anchor).
